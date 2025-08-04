import React, { useState, useEffect, useCallback } from 'react';
import { Diet, AnalysisResult, Meal, UserProfile, MedicalCondition } from './types';
import { analyzeImage, calculateBMI } from './services/geminiService';
import { HealthScoreService } from './services/healthScoreService';
import { tensorflowService } from './services/tensorflowService';
import { findBestFoodMatch } from './services/foodSearchService';
import { ExportService } from './services/exportService';
import ImageUploader from './components/ImageUploader';
import DietSelector from './components/DietSelector';
import AnalysisResultComponent from './components/AnalysisResult';
import MealHistory from './components/MealHistory';
import MealHistoryModal from './components/MealHistoryModal';
import GoalsStreaksModal from './components/GoalsStreaksModal';
import ShareCardGenerator from './components/ShareCardGenerator';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AuthModal from './components/AuthModal';
import BMICalculator from './components/BMICalculator';
import MedicalConditionsModal from './components/MedicalConditionsDropdown';
import StreakGoals from './components/StreakGoals';
import ProfileDropdown from './components/ProfileDropdown';
import SettingsModal from './components/SettingsModal';
import { SparklesIcon, LoadingSpinner } from './components/icons';
import ShinyText from './components/ShinyText';
import LightRays from './components/LightRays';
import LandingPage from './components/LandingPage';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean | 'modal'>(false);
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);
  const [showGoalsModal, setShowGoalsModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showShareCard, setShowShareCard] = useState<boolean>(false);
  const [showChatBot, setShowChatBot] = useState<boolean>(false);
  const [mealToShare, setMealToShare] = useState<Meal | null>(null);
  const [activeTab, setActiveTab] = useState<'analyze' | 'profile' | 'analytics' | 'social' | 'goals' | 'api-demo'>('profile');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [diet, setDiet] = useState<Diet>(Diet.None);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [productDisplayData, setProductDisplayData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mealHistory, setMealHistory] = useState<Meal[]>([]);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [appInitialized, setAppInitialized] = useState<boolean>(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
          const storedMeals = localStorage.getItem('mealHistory');
          if (storedMeals) {
              setMealHistory(JSON.parse(storedMeals));
          }
          
          // Load stored user and profile
          const storedUser = localStorage.getItem('user');
          const storedProfile = localStorage.getItem('userProfile');
          
          if (storedUser) {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              setIsAuthenticated(true);
              
              if (storedProfile) {
                  setUserProfile(JSON.parse(storedProfile));
              } else {
                  // Create default profile if user exists but no profile
                  const defaultProfile: UserProfile = {
                    id: userData.id,
                    email: userData.email,
                    displayName: userData.displayName,
                    diet: Diet.None,
                    medicalConditions: [MedicalCondition.None],
                    goals: {},
                    streak: { current: 0, best: 0 }
                  };
                  setUserProfile(defaultProfile);
              }
          }
      } catch (e) {
          console.error('Error initializing app:', e);
          // Clear potentially corrupted data
          localStorage.removeItem('mealHistory');
          localStorage.removeItem('userProfile'); 
          setMealHistory([]);
      } finally {
          setAppInitialized(true); // Mark app as initialized regardless of success/failure
      }
    };
    
    initializeApp();
  }, []);

  const handleAnalyzeImage = useCallback(async () => {
    if (!image || !userProfile) return;

    setIsLoading(true);
    setError(null);
    setIsModelLoading(true);
    setProductDisplayData(null);
    setAnalysisResult(null); // Clear previous results

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setError('Analysis is taking too long. Please try again with a different image.');
      setIsLoading(false);
      setIsModelLoading(false);
    }, 45000); // 45 second timeout

    try {
      const result = await analyzeImage(image, userProfile);
      
      clearTimeout(timeoutId); // Clear timeout on success
      
      if (!result) {
        throw new Error('Analysis failed - no result returned');
      }
      
      setAnalysisResult(result);
      
      // Try to find OpenFoodFacts match for additional context
      try {
        const foodMatch = await findBestFoodMatch(result.dishName, result.ingredients);
        if (foodMatch && foodMatch.nutritionGrade && foodMatch.nutritionGrade !== 'unknown') {
          setProductDisplayData({
            productName: foodMatch.productName,
            brands: foodMatch.brands,
            imageUrl: foodMatch.imageUrl,
            nutritionGrade: foodMatch.nutritionGrade,
            categories: foodMatch.categories,
            isBarcode: false, // This is from text search, not barcode
            foodSearchData: foodMatch
          });
        }
      } catch (searchError) {
        console.warn('OpenFoodFacts search failed:', searchError);
        // No OpenFoodFacts match found, using AI analysis only
      }
      
      // Calculate health score using centralized service
      const healthScore = HealthScoreService.calculateHealthScore(result);
      
      const newMeal: Meal = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        imageDataUrl: image,
        analysis: result,
        healthScore
      };
      
      try {
        const updatedHistory = [newMeal, ...mealHistory];
        setMealHistory(updatedHistory);
        localStorage.setItem('mealHistory', JSON.stringify(updatedHistory));
      } catch (storageError) {
        console.warn('Failed to save meal history:', storageError);
        // Continue without saving to localStorage
      }
      
    } catch (err) {
      clearTimeout(timeoutId); // Clear timeout on error
      console.error('Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during analysis';
      setError(errorMessage);
      setAnalysisResult(null); // Clear any partial results
    } finally {
      setIsLoading(false);
      setIsModelLoading(false);
    }
  }, [image, userProfile, mealHistory]);

  // Helper function to check diet compatibility
  const checkDietCompatibility = (ingredients: string, diet: Diet): 'compatible' | 'incompatible' | 'unknown' => {
    const ingredientText = ingredients.toLowerCase();
    
    switch (diet) {
      case Diet.Vegan:
        if (ingredientText.includes('milk') || ingredientText.includes('egg') || 
            ingredientText.includes('meat') || ingredientText.includes('fish') ||
            ingredientText.includes('honey') || ingredientText.includes('gelatin')) {
          return 'incompatible';
        }
        return 'compatible';
      case Diet.Keto:
        // Simple check for high-carb ingredients
        if (ingredientText.includes('sugar') || ingredientText.includes('wheat') ||
            ingredientText.includes('rice') || ingredientText.includes('potato')) {
          return 'incompatible';
        }
        return 'compatible';
      case Diet.GlutenFree:
        if (ingredientText.includes('wheat') || ingredientText.includes('gluten') ||
            ingredientText.includes('barley') || ingredientText.includes('rye')) {
          return 'incompatible';
        }
        return 'compatible';
      default:
        return 'compatible';
    }
  };

  const handleDeleteMeal = (mealId: string) => {
    const updatedHistory = mealHistory.filter(meal => meal.id !== mealId);
    setMealHistory(updatedHistory);
    localStorage.setItem('mealHistory', JSON.stringify(updatedHistory));
  };
  
  const handleSyncComplete = (syncedMeals: Meal[]) => {
    setMealHistory(syncedMeals);
    localStorage.setItem('mealHistory', JSON.stringify(syncedMeals));
  };

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Create default user profile
    const defaultProfile: UserProfile = {
      id: userData.id,
      email: userData.email,
      displayName: userData.displayName,
      diet: Diet.None,
      medicalConditions: [MedicalCondition.None],
      goals: {
        dailyCalories: undefined,
        targetHealthScore: undefined,
        targetWeight: undefined
      },
      streak: {
        current: 0,
        best: 0,
        lastMealDate: undefined
      }
    };
    
    setUserProfile(defaultProfile);
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
  };

  const handleBMIUpdate = (bmiData: any) => {
    if (userProfile) {
      const updatedProfile = { ...userProfile, bmi: bmiData };
      handleProfileUpdate(updatedProfile);
    }
  };

  const handleGoalsUpdate = (goals: UserProfile['goals']) => {
    if (userProfile) {
      const updatedProfile = { ...userProfile, goals };
      handleProfileUpdate(updatedProfile);
    }
  };

  const handleStreakUpdate = (streak: UserProfile['streak']) => {
    if (userProfile) {
      const updatedProfile = { ...userProfile, streak };
      handleProfileUpdate(updatedProfile);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    setMealHistory([]);
    localStorage.removeItem('mealHistory');
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    // Apply dark mode to document root
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleProfileUpdateExtended = (updatedFields: Partial<UserProfile>) => {
    if (userProfile) {
      const updatedProfile = { ...userProfile, ...updatedFields };
      handleProfileUpdate(updatedProfile);
    }
  };

  // Load dark mode preference on component mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      const darkMode = JSON.parse(savedDarkMode);
      setIsDarkMode(darkMode);
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Sync dark mode changes with document class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark:bg-gray-900');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark:bg-gray-900');
    }
  }, [isDarkMode]);

  const handleImageUpload = (imageDataUrl: string) => {
      setImage(imageDataUrl);
      setAnalysisResult(null);
      setProductDisplayData(null); // Clear product display data when uploading new image
      setError(null);
  }

  const handleShareMeal = (meal: Meal) => {
    setMealToShare(meal);
    setShowShareCard(true);
  };

  const handleShareCurrentAnalysis = () => {
    if (analysisResult && image) {
      const currentMeal: Meal = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        imageDataUrl: image,
        analysis: analysisResult,
        healthScore: HealthScoreService.calculateHealthScore(analysisResult)
      };
      setMealToShare(currentMeal);
      setShowShareCard(true);
    }
  };

  // Show landing page first
  if (showLandingPage) {
    return (
      <LandingPage
        onGetStarted={() => {
          setShowLandingPage(false);
          setShowAuthModal(true);
        }}
        onTryDemo={() => {
          setShowLandingPage(false);
          const demoUser = {
            id: 'demo-user',
            email: 'demo@example.com',
            displayName: 'Demo User',
            provider: 'demo'
          };
          handleAuthSuccess(demoUser);
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleDarkModeToggle}
      />
    );
  }

  // Show authentication page if user clicked "Get Started"
  if (showAuthModal === true && !isAuthenticated) {
    return (
      <div className={`min-h-screen transition-all duration-500 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100'
      } flex items-center justify-center p-3 sm:p-4 relative overflow-hidden`}>
        
        {/* Floating Navigation Header */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-6 pt-4 sm:pt-6">
          <nav className={`flex items-center justify-between p-4 sm:p-6 rounded-2xl backdrop-blur-md border shadow-lg ${
            isDarkMode 
              ? 'bg-white/10 border-white/20 shadow-black/20' 
              : 'bg-white/80 border-gray-200/30 shadow-gray-500/10'
          }`}>
            <div className="flex items-center space-x-2 sm:space-x-3">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg p-1 ${
              isDarkMode ? 'bg-white/20 backdrop-blur-sm' : 'bg-blue-600/10 backdrop-blur-sm'
            }`}>
              <img 
                src="/logo.svg" 
                alt="Healthy Me Logo" 
                className={`w-full h-full ${isDarkMode ? '' : 'filter hue-rotate-200 saturate-150'}`} 
              />
            </div>
            <span className={`font-semibold text-lg sm:text-xl ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Healthy Me
            </span>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-6">
            <button 
              onClick={() => {
                setShowAuthModal(false);
                setShowLandingPage(true);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 font-medium text-sm sm:text-base backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-white/10 text-white/90 hover:bg-white/20 hover:text-white border border-white/20' 
                  : 'bg-blue-50/80 text-blue-700 hover:bg-blue-100/80 hover:text-blue-800 border border-blue-200/50'
              } shadow-lg hover:shadow-xl hover:scale-105 active:scale-95`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </button>
            <button
              onClick={handleDarkModeToggle}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDarkMode 
                  ? 'bg-blue-600 focus:ring-blue-500' 
                  : 'bg-gray-300 focus:ring-gray-400'
              }`}
              aria-label="Toggle dark mode"
            >
              <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transform transition-all duration-300 flex items-center justify-center ${
                isDarkMode ? 'translate-x-7' : 'translate-x-0'
              }`}>
                <span className="text-xs">
                  {isDarkMode ? '🌙' : '☀️'}
                </span>
              </div>
            </button>
          </div>
          </nav>
        </div>

        {/* Animated Light Rays Background */}
        <div className="absolute inset-0 z-0">
          <LightRays
            raysOrigin="top-center"
            raysColor={isDarkMode ? "#64748b" : "#3b82f6"}
            raysSpeed={0.8}
            lightSpread={1.2}
            rayLength={1.5}
            followMouse={true}
            mouseInfluence={0.15}
            noiseAmount={0.05}
            distortion={0.03}
            fadeDistance={1.2}
            saturation={0.7}
            className="opacity-30"
          />
        </div>

        {/* Main content card - Enhanced with theme matching */}
        <div className={`backdrop-blur-xl p-4 sm:p-8 rounded-3xl shadow-2xl max-w-sm sm:max-w-md w-full relative z-10 mt-16 sm:mt-20 border ${
          isDarkMode 
            ? 'bg-white/10 border-white/20' 
            : 'bg-white/80 border-blue-200/50'
        }`}>
          {/* Header section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="relative mb-4 sm:mb-6">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 flex items-center justify-center rounded-2xl p-3 border ${
                isDarkMode 
                  ? 'bg-white/20 backdrop-blur-sm border-white/30' 
                  : 'bg-blue-50/80 backdrop-blur-sm border-blue-200/50'
              }`}>
                <img 
                  src="/logo.svg" 
                  alt="Healthy Me Logo" 
                  className={`w-full h-full ${isDarkMode ? '' : 'filter hue-rotate-200 saturate-150'}`} 
                />
              </div>
            </div>
            
            <h1 className={`text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 tracking-tight ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Welcome Back
            </h1>
            <p className={`text-sm sm:text-lg leading-relaxed font-medium ${
              isDarkMode ? 'text-white/80' : 'text-gray-600'
            }`}>
              Sign in to continue your healthy journey
            </p>
          </div>
          
          {/* Action buttons - Enhanced theme */}
          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            <button
              onClick={() => {
                // This will show the actual login modal (image 2)
                setShowAuthModal('modal');
              }}
              className={`w-full backdrop-blur-sm border font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-full transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center group ${
                isDarkMode 
                  ? 'bg-white/20 border-white/30 text-white hover:bg-white/30' 
                  : 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span className="text-sm sm:text-lg">Sign In / Create Account</span>
            </button>
            
            <button
              onClick={() => {
                const demoUser = {
                  id: 'demo-user',
                  email: 'demo@example.com',
                  displayName: 'Demo User',
                  provider: 'demo'
                };
                handleAuthSuccess(demoUser);
              }}
              className={`w-full border-2 font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-full transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center group ${
                isDarkMode 
                  ? 'bg-transparent border-white/50 text-white hover:bg-white/10' 
                  : 'bg-transparent border-blue-300 text-blue-700 hover:bg-blue-50'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
              <span className="text-sm sm:text-lg">Try Demo Mode</span>
            </button>
          </div>

          {/* Benefits section - Enhanced theme */}
          <div className={`backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border ${
            isDarkMode 
              ? 'bg-white/10 border-white/20' 
              : 'bg-blue-50/60 border-blue-200/50'
          }`}>
            <div className="text-center">
              <div className={`text-xs sm:text-sm font-bold mb-3 sm:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>✨ Why Choose Healthy Me?</div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className={`flex items-center ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm5-18v4h3V3h-3z"/>
                  </svg>
                  <span>Instant Analysis</span>
                </div>
                <div className={`flex items-center ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span>Health Scoring</span>
                </div>
                <div className={`flex items-center ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                  </svg>
                  <span>Smart Tracking</span>
                </div>
                <div className={`flex items-center ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-5L12 2 4.5 6v2h15V6z"/>
                  </svg>
                  <span>AI Powered</span>
                </div>
              </div>
            </div>
          </div>
          
          <p className={`text-xs sm:text-sm text-center leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
            Join thousands of users improving their nutrition with smart insights
          </p>
        </div>
      </div>
    );
  }

  // Show actual login modal when user clicks "Sign In"
  if (showAuthModal === 'modal' && !isAuthenticated) {
    return (
      <div className={`min-h-screen transition-all duration-500 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100'
      }`}>
        <AuthModal 
          onClose={() => {
            setShowAuthModal(true); // Go back to auth page, not landing
          }}
          onAuthSuccess={handleAuthSuccess}
          isDarkMode={isDarkMode}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 relative overflow-hidden ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100'
    }`}>
      {/* Animated Light Rays Background */}
      <div className="absolute inset-0 z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor={isDarkMode ? "#64748b" : "#3b82f6"}
          raysSpeed={0.8}
          lightSpread={1.2}
          rayLength={1.5}
          followMouse={true}
          mouseInfluence={0.15}
          noiseAmount={0.05}
          distortion={0.03}
          fadeDistance={1.2}
          saturation={0.7}
          className="opacity-30"
        />
      </div>

      {/* Floating Header - Glass morphism navbar */}
      <div className="relative z-20 w-full px-4 sm:px-6 pt-4 sm:pt-6">
        <nav className={`flex items-center justify-between p-4 sm:p-6 rounded-2xl backdrop-blur-md border shadow-lg ${
          isDarkMode 
            ? 'bg-white/10 border-white/20 shadow-black/20' 
            : 'bg-white/80 border-gray-200/30 shadow-gray-500/10'
        }`}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg p-1 ${
              isDarkMode ? 'bg-white/20 backdrop-blur-sm' : 'bg-blue-600/10 backdrop-blur-sm'
            }`}>
              <img 
                src="/logo.svg" 
                alt="Healthy Me Logo" 
                className={`w-full h-full ${isDarkMode ? '' : 'filter hue-rotate-200 saturate-150'}`} 
              />
            </div>
            <div className="hidden sm:block">
              <span className={`font-semibold text-lg sm:text-xl ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Healthy Me</span>
              <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>Smart Nutrition Analysis</p>
            </div>
            <div className="sm:hidden">
              <span className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Healthy Me</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Home Button */}
            <button 
              onClick={() => {
                setShowAuthModal(false);
                setShowLandingPage(true);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 font-medium text-sm backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-white/10 text-white/90 hover:bg-white/20 hover:text-white border border-white/20 hover:border-white/30' 
                  : 'bg-blue-50/80 text-blue-700 hover:bg-blue-100/80 hover:text-blue-800 border border-blue-200/50 hover:border-blue-300/60'
              } shadow-lg hover:shadow-xl hover:scale-105 active:scale-95`}
              title="Back to Home"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden sm:inline">Home</span>
            </button>
            
            <ProfileDropdown
              user={user}
              userProfile={userProfile}
            mealHistoryCount={mealHistory.length}
            isDarkMode={isDarkMode}
            onShowHistory={() => setShowHistoryModal(true)}
            onShowAnalytics={() => setShowAnalyticsModal(true)}
            onShowGoals={() => setShowGoalsModal(true)}
            onShowSettings={() => setShowSettingsModal(true)}
            onShowProfileEdit={() => setShowSettingsModal(true)}
            onToggleDarkMode={handleDarkModeToggle}
            onLogout={handleLogout}
          />
          </div>
        </nav>
      </div>
      
      <main className="relative z-10 container mx-auto p-3 sm:p-6 pt-2 sm:pt-4 space-y-4 sm:space-y-8">
        {/* Main Analysis Section - Glass morphism Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          
          <div className="lg:col-span-5">
            <div className={`backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl border space-y-4 sm:space-y-6 ${
              isDarkMode 
                ? 'bg-white/10 border-white/20' 
                : 'bg-white/80 border-blue-200/50'
            }`}>
              <div className="text-center">
                <h2 className={`text-lg sm:text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Scan Your Food</h2>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>
                  📷 Take a photo for AI-powered nutrition analysis with health insights
                </p>
              </div>
              <ImageUploader 
                onImageUpload={handleImageUpload} 
                imagePreviewUrl={image}
              />
              
              <div className="space-y-4">
                <div>
                  <h3 className={`text-base sm:text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Select Your Diet</h3>
                  <DietSelector 
                    selectedDiet={userProfile?.diet || Diet.None} 
                    onDietChange={(newDiet) => {
                      setDiet(newDiet);
                      if (userProfile) {
                        setUserProfile({...userProfile, diet: newDiet});
                      }
                    }} 
                  />
                </div>
                
                <div>
                  <MedicalConditionsModal
                    selectedConditions={userProfile?.medicalConditions || [MedicalCondition.None]}
                    customCondition={userProfile?.customCondition}
                    onConditionsChange={(conditions, customCondition) => {
                      if (userProfile) {
                        const updatedProfile = { 
                          ...userProfile, 
                          medicalConditions: conditions,
                          customCondition 
                        };
                        setUserProfile(updatedProfile);
                        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
                      }
                    }}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>

              <button
                onClick={handleAnalyzeImage}
                disabled={isLoading || !image}
                className={`w-full font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-full focus:outline-none focus:ring-4 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-95 sm:hover:scale-105 disabled:transform-none disabled:shadow-none flex items-center justify-center text-base sm:text-lg shadow-lg ${
                  isDarkMode 
                    ? 'bg-white text-gray-900 hover:bg-gray-100 focus:ring-white/20 disabled:bg-gray-300' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300 disabled:bg-gray-300'
                }`}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                    <span className="text-sm sm:text-base">{isModelLoading ? 'Loading Models...' : 'Analyzing...'}</span>
                  </>
                ) : (
                   <>
                    Analyze Food
                   </>
                )}
              </button>
            </div>
          </div>
          
          <div className="lg:col-span-7">
            <div className={`backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl border min-h-[300px] sm:min-h-[400px] flex flex-col ${
              isDarkMode 
                ? 'bg-white/10 border-white/20' 
                : 'bg-white/80 border-blue-200/50'
            }`}>
              <div className="text-center mb-4">
                <h2 className={`text-lg sm:text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Analysis Results</h2>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>
                  AI-powered nutrition insights with health recommendations
                </p>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                {isLoading && (
                  <div className="text-center py-6 sm:py-8">
                    <LoadingSpinner className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                    <p className={`text-base sm:text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Analyzing your meal...</p>
                    <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>This may take a moment.</p>
                  </div>
                )}
                {error && (
                  <div className="text-center py-6 sm:py-8 bg-red-900/50 border border-red-500/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl w-full">
                    <h3 className="text-red-300 font-bold text-base sm:text-lg mb-2">Analysis Failed</h3>
                    <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                  </div>
                )}
                {!isLoading && !error && analysisResult && (
                  <div className="w-full">
                    <AnalysisResultComponent 
                      result={analysisResult} 
                      onShare={handleShareCurrentAnalysis}
                      productDisplay={productDisplayData}
                    />
                  </div>
                )}
                {!isLoading && !error && !analysisResult && (
                   <div className={`text-center py-6 sm:py-8 ${isDarkMode ? 'text-white/60' : 'text-gray-400'}`}>
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                        isDarkMode ? 'bg-white/10' : 'bg-blue-100/50'
                      }`}>
                        <svg className={`w-6 h-6 sm:w-8 sm:h-8 ${isDarkMode ? 'text-white/40' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className={`text-base sm:text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Your meal analysis will appear here</p>
                      <p className={`mt-1 text-xs sm:text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>Upload an image and click analyze to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* BMI Calculator Section - Glass morphism style */}
        <div className={`backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border overflow-hidden ${
          isDarkMode 
            ? 'bg-white/10 border-white/20' 
            : 'bg-white/80 border-blue-200/50'
        }`}>
          <div className={`p-4 sm:p-6 backdrop-blur-sm border-b ${
            isDarkMode 
              ? 'bg-white/5 border-white/20' 
              : 'bg-blue-50/50 border-blue-200/50'
          }`}>
            <div className="text-center">
              <h2 className={`text-lg sm:text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>BMI Health Calculator</h2>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>Calculate your Body Mass Index with AI health advice</p>
            </div>
          </div>
          
          {/* Profile Content */}
          <div className="p-4 sm:p-6">
            <div className="flex justify-center">
              <BMICalculator
                userProfile={userProfile}
                onBMIUpdate={handleBMIUpdate}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Chat Button for Mobile */}
      <button
        onClick={() => setShowChatBot(true)}
        className={`fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 backdrop-blur-sm border flex items-center justify-center lg:hidden ${
          isDarkMode 
            ? 'bg-blue-600/90 hover:bg-blue-700/90 border-blue-400/30 text-white' 
            : 'bg-blue-500/90 hover:bg-blue-600/90 border-blue-300/50 text-white'
        }`}
        title="Chat with Nutrition Assistant"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      </button>

      {/* Meal History Modal */}
      <MealHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        meals={mealHistory}
        userProfile={userProfile}
        isDarkMode={isDarkMode}
        onDeleteMeal={handleDeleteMeal}
        onShareMeal={handleShareMeal}
      />

      {/* Enhanced Analytics Modal */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowAnalyticsModal(false)}
          />
          
          <div className="relative z-10 min-h-screen flex items-start justify-center p-4 pt-8">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Enhanced Analytics</h2>
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <AnalyticsDashboard 
                  mealHistory={mealHistory}
                  userProfile={userProfile}
                  mode="enhanced"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goals & Streaks Modal */}
      <GoalsStreaksModal
        isOpen={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
        userProfile={userProfile}
        isDarkMode={isDarkMode}
        onGoalsUpdate={handleGoalsUpdate}
        onStreakUpdate={handleStreakUpdate}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        userProfile={userProfile}
        isDarkMode={isDarkMode}
        onProfileUpdate={handleProfileUpdateExtended}
        onDarkModeToggle={handleDarkModeToggle}
      />

      {/* Share Card Generator */}
      {showShareCard && mealToShare && (
        <ShareCardGenerator
          meal={mealToShare}
          userProfile={userProfile}
          onClose={() => {
            setShowShareCard(false);
            setMealToShare(null);
          }}
        />
      )}

      {/* Floating Chat Bot Button */}
      <button
        onClick={() => setShowChatBot(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 backdrop-blur-sm border hover:scale-110 active:scale-95 ${
          isDarkMode 
            ? 'bg-blue-600/90 hover:bg-blue-700/90 text-white border-blue-500/30 shadow-blue-500/25' 
            : 'bg-blue-500/90 hover:bg-blue-600/90 text-white border-blue-400/30 shadow-blue-500/20'
        }`}
        title="Chat with Nutrition Assistant"
        style={{
          backgroundImage: isDarkMode 
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(29, 78, 216, 0.9))' 
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9))'
        }}
      >
        <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
        {/* Pulse animation for attention */}
        <div className={`absolute inset-0 rounded-full animate-ping ${
          isDarkMode ? 'bg-blue-400/40' : 'bg-blue-300/40'
        }`}></div>
      </button>

      {/* Chat Bot */}
      {showChatBot && (
        <ChatBot
          userProfile={userProfile}
          recentAnalysis={analysisResult}
          isDarkMode={isDarkMode}
          onClose={() => setShowChatBot(false)}
        />
      )}
    </div>
  );
};

export default App;
