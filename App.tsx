import React, { useState, useEffect, useCallback } from 'react';
import { Diet, AnalysisResult, Meal, UserProfile, MedicalCondition } from './types';
import { analyzeImage } from './services/geminiService';
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
import FirebaseSync from './components/FirebaseSync';
import AIServicesStatus from './components/AIServicesStatus';
import AuthModal from './components/AuthModal';
import BMICalculator from './components/BMICalculator';
import MedicalConditionsSelector from './components/MedicalConditionsSelector';
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
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
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

  // Helper function to calculate health score
  const calculateHealthScore = (analysis: AnalysisResult): number => {
    // Start with the chemical safety score as the foundation (converted to 20-point scale)
    let score = analysis.chemicalAnalysis ? 
      Math.round((analysis.chemicalAnalysis.overallSafetyScore / 10) * 20) : 12;
    
    // If no chemical analysis, start from middle
    if (!analysis.chemicalAnalysis) {
      score = 12;
    }
    
    // Calorie adjustment (max ±3 points)
    const calories = analysis.estimatedCalories;
    if (calories <= 300) score += 2;
    else if (calories <= 500) score += 1;
    else if (calories > 800) score -= 2;
    else if (calories > 1200) score -= 3;
    
    // Diet compatibility 
    const isCompatible = analysis.dietCompatibility.isCompatible;
    if (isCompatible) score += 1;
    else score -= 2;
    
    // Chemical safety penalties (this is crucial for health)
    if (analysis.chemicalAnalysis) {
      const harmfulChemicals = analysis.chemicalAnalysis.harmfulChemicals;
      if (harmfulChemicals.length > 0) {
        // Heavy penalty for harmful chemicals
        const severeCount = harmfulChemicals.filter(c => c.riskLevel === 'SEVERE').length;
        const highCount = harmfulChemicals.filter(c => c.riskLevel === 'HIGH').length;
        const mediumCount = harmfulChemicals.filter(c => c.riskLevel === 'MEDIUM').length;
        
        score -= (severeCount * 4 + highCount * 3 + mediumCount * 1);
      }
      
      // Artificial ingredients penalty
      if (analysis.chemicalAnalysis.hasArtificialIngredients) score -= 2;
      
      // Organic bonus
      if (analysis.chemicalAnalysis.isOrganicCertified) score += 2;
      
      // Allergen penalties
      if (analysis.chemicalAnalysis.allergens.length > 0) {
        score -= analysis.chemicalAnalysis.allergens.length;
      }
    }
    
    // Processing level from TensorFlow
    if (analysis.tensorflowAnalysis) {
      switch (analysis.tensorflowAnalysis.qualityAssessment.processingLevel) {
        case 'MINIMAL':
          score += 2;
          break;
        case 'MODERATE':
          // No change
          break;
        case 'HIGHLY_PROCESSED':
          score -= 3;
          break;
      }
      
      // Quality bonus
      const quality = analysis.tensorflowAnalysis.qualityAssessment.overallQuality;
      if (quality >= 8) score += 1;
      else if (quality <= 4) score -= 1;
    }
    
    // Ensure score stays within bounds and reflects chemical safety
    const finalScore = Math.max(1, Math.min(20, Math.round(score)));
    
    // Additional check: if chemical safety is very low, cap the max score
    if (analysis.chemicalAnalysis && analysis.chemicalAnalysis.overallSafetyScore <= 5) {
      return Math.min(finalScore, 10); // Cap at 10 if safety is very poor
    }
    
    if (analysis.chemicalAnalysis && analysis.chemicalAnalysis.overallSafetyScore <= 7) {
      return Math.min(finalScore, 14); // Cap at 14 if safety is poor
    }
    
    return finalScore;
  };

  useEffect(() => {
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
        // Clear potentially corrupted data
        localStorage.removeItem('mealHistory');
        localStorage.removeItem('userProfile'); 
        setMealHistory([]);
    }
  }, []);

  const handleAnalyzeImage = useCallback(async () => {
    if (!image || !userProfile) return;

    setIsLoading(true);
    setError(null);
    setIsModelLoading(true);
    setProductDisplayData(null);

    try {
      const result = await analyzeImage(image, userProfile);
      setAnalysisResult(result);
      
      // Try to find OpenFoodFacts match for additional context
      try {
        const foodMatch = await findBestFoodMatch(result.dishName, result.ingredients);
        if (foodMatch && foodMatch.nutritionGrade && foodMatch.nutritionGrade !== 'unknown') {
          console.log('Found OpenFoodFacts match:', foodMatch.productName);
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
        console.log('No OpenFoodFacts match found, using AI analysis only');
      }
      
      // Calculate health score
      const healthScore = calculateHealthScore(result);
      
      const newMeal: Meal = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        imageDataUrl: image,
        analysis: result,
        healthScore
      };
      
      const updatedHistory = [newMeal, ...mealHistory];
      setMealHistory(updatedHistory);
      localStorage.setItem('mealHistory', JSON.stringify(updatedHistory));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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

  const handleConditionsUpdate = (conditions: MedicalCondition[], customCondition?: string) => {
    if (userProfile) {
      const updatedProfile = { 
        ...userProfile, 
        medicalConditions: conditions,
        customCondition 
      };
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
        healthScore: calculateHealthScore(analysisResult)
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

  // Show authentication modal if not logged in
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen transition-all duration-500 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100'
      } flex items-center justify-center p-3 sm:p-4 relative overflow-hidden`}>
        
        {/* Navigation Header - matching landing page */}
        <nav className={`absolute top-0 left-0 right-0 flex items-center justify-between p-4 sm:p-6 backdrop-blur-sm z-20 ${
          isDarkMode 
            ? 'bg-white/10 border-b border-white/20' 
            : 'bg-white/70 border-b border-gray-200/50'
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
              onClick={() => setShowLandingPage(true)}
              className={`transition-colors duration-200 font-medium text-sm sm:text-base ${
                isDarkMode 
                  ? 'text-white/80 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="hidden sm:inline">← Back to Home</span>
              <span className="sm:hidden">← Home</span>
            </button>
            <button
              onClick={handleDarkModeToggle}
              className={`p-2 rounded-lg transition-all duration-200 backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-white/10 hover:bg-white/20' 
                  : 'bg-blue-100/50 hover:bg-blue-200/50'
              }`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </nav>

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

          {/* Features preview - Material Design cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className={`text-center p-2 sm:p-4 backdrop-blur-sm rounded-xl sm:rounded-2xl border transition-all duration-300 ${
              isDarkMode 
                ? 'bg-white/10 border-white/20 hover:bg-white/20' 
                : 'bg-blue-50/50 border-blue-200/50 hover:bg-blue-100/50'
            }`}>
              <div className="flex justify-center mb-1 sm:mb-2">
                <svg className={`w-4 h-4 sm:w-6 sm:h-6 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm5-18v4h3V3h-3z"/>
                </svg>
              </div>
              <div className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Smart Analysis</div>
            </div>
            <div className={`text-center p-2 sm:p-4 backdrop-blur-sm rounded-xl sm:rounded-2xl border transition-all duration-300 ${
              isDarkMode 
                ? 'bg-white/10 border-white/20 hover:bg-white/20' 
                : 'bg-blue-50/50 border-blue-200/50 hover:bg-blue-100/50'
            }`}>
              <div className="flex justify-center mb-1 sm:mb-2">
                <svg className={`w-4 h-4 sm:w-6 sm:h-6 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Health Scoring</div>
            </div>
            <div className={`text-center p-2 sm:p-4 backdrop-blur-sm rounded-xl sm:rounded-2xl border transition-all duration-300 ${
              isDarkMode 
                ? 'bg-white/10 border-white/20 hover:bg-white/20' 
                : 'bg-blue-50/50 border-blue-200/50 hover:bg-blue-100/50'
            }`}>
              <div className="flex justify-center mb-1 sm:mb-2">
                <svg className={`w-4 h-4 sm:w-6 sm:h-6 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
              <div className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Smart Tracking</div>
            </div>
          </div>
          
          {/* Action buttons - Enhanced theme */}
          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            <button
              onClick={() => setShowAuthModal(true)}
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

      {/* Header - Glass morphism style matching landing page */}
      <nav className={`relative z-20 flex items-center justify-between p-4 sm:p-6 backdrop-blur-sm ${
        isDarkMode 
          ? 'bg-white/10 border-b border-white/20' 
          : 'bg-white/70 border-b border-gray-200/50'
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
          {/* Chat Bot Button */}
          <button
            onClick={() => setShowChatBot(true)}
            className={`p-2 rounded-lg transition-all duration-200 backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-white/10 hover:bg-white/20 text-white' 
                : 'bg-blue-100/50 hover:bg-blue-200/50 text-blue-600'
            }`}
            title="Chat with Nutrition Assistant"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
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
            onShowChat={() => setShowChatBot(true)}
            onToggleDarkMode={handleDarkModeToggle}
            onLogout={handleLogout}
          />
        </div>
      </nav>
      
      <main className="relative z-10 container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
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
              
              <div className="text-center">
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
                    <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3"/>
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

        {/* Health Profile Setup Section - Glass morphism style */}
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
              <h2 className={`text-lg sm:text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Health Profile Setup</h2>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>Personalize your experience with BMI calculation and health conditions</p>
            </div>
          </div>
          
          {/* Profile Content */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <BMICalculator
                userProfile={userProfile}
                onBMIUpdate={handleBMIUpdate}
                isDarkMode={isDarkMode}
              />
              <MedicalConditionsSelector
                selectedConditions={userProfile?.medicalConditions || []}
                onConditionsChange={handleConditionsUpdate}
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

      {/* Auth Modal - shown from landing page or auth flow */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
          isDarkMode={isDarkMode}
        />
      )}

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
