import React, { useState, useEffect, useCallback } from 'react';
import { Diet, AnalysisResult, Meal, UserProfile, MedicalCondition } from './types';
import { analyzeImage } from './services/geminiService';
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

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);
  const [showGoalsModal, setShowGoalsModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showShareCard, setShowShareCard] = useState<boolean>(false);
  const [mealToShare, setMealToShare] = useState<Meal | null>(null);
  const [activeTab, setActiveTab] = useState<'analyze' | 'profile' | 'analytics' | 'social' | 'goals'>('profile');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [diet, setDiet] = useState<Diet>(Diet.None);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mealHistory, setMealHistory] = useState<Meal[]>([]);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);

  // Helper function to calculate health score
  const calculateHealthScore = (analysis: AnalysisResult): number => {
    let score = 10; // Base score
    
    // Calorie assessment
    const calories = analysis.estimatedCalories;
    if (calories <= 400) score += 3;
    else if (calories <= 600) score += 4;
    else if (calories <= 800) score += 2;
    else score -= 2;
    
    // Ingredient quality
    const ingredientCount = analysis.ingredients.length;
    if (ingredientCount >= 5) score += 3;
    else if (ingredientCount >= 3) score += 2;
    else score += 1;
    
    // Diet compatibility
    if (analysis.dietCompatibility.isCompatible) score += 3;
    else score -= 1;
    
    // Medical safety
    if (analysis.medicalAdvice?.isSafeForConditions) score += 2;
    else score -= 2;
    
    // Chemical safety analysis
    if (analysis.chemicalAnalysis) {
      // Safety score contribution (0-2 points)
      score += Math.floor(analysis.chemicalAnalysis.overallSafetyScore / 5);
      
      // Penalty for harmful chemicals
      if (analysis.chemicalAnalysis.harmfulChemicals.length > 0) {
        const severeChemicals = analysis.chemicalAnalysis.harmfulChemicals.filter(c => c.riskLevel === 'SEVERE');
        const highRiskChemicals = analysis.chemicalAnalysis.harmfulChemicals.filter(c => c.riskLevel === 'HIGH');
        score -= (severeChemicals.length * 3 + highRiskChemicals.length * 2);
      }
      
      // Bonus for organic certification
      if (analysis.chemicalAnalysis.isOrganicCertified) score += 2;
      
      // Penalty for artificial ingredients
      if (analysis.chemicalAnalysis.hasArtificialIngredients) score -= 1;
      
      // Penalty for harmful additives
      const harmfulAdditives = analysis.chemicalAnalysis.additives.filter(a => a.safetyRating === 'AVOID');
      score -= harmfulAdditives.length;
    }
    
    // TensorFlow analysis contribution
    if (analysis.tensorflowAnalysis) {
      // Quality bonus (0-3 points)
      score += Math.floor(analysis.tensorflowAnalysis.qualityAssessment.overallQuality / 3);
      
      // Processing level adjustment
      switch (analysis.tensorflowAnalysis.qualityAssessment.processingLevel) {
        case 'MINIMAL':
          score += 2;
          break;
        case 'HIGHLY_PROCESSED':
          score -= 2;
          break;
      }
      
      // Freshness and naturalness bonus
      if (analysis.tensorflowAnalysis.visualAnalysis.freshnessScore >= 8) score += 1;
      if (analysis.tensorflowAnalysis.qualityAssessment.naturalness >= 8) score += 1;
      
      // Portion size consideration
      if (analysis.tensorflowAnalysis.visualAnalysis.portionSize === 'EXTRA_LARGE') score -= 1;
    }
    
    return Math.max(1, Math.min(20, score));
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

    try {
      const result = await analyzeImage(image, userProfile);
      setAnalysisResult(result);
      
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

  // Show authentication modal if not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4 relative">
        {/* Animated background elements - Material You style */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-green-100/50 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-100/30 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Main content card - Material Design 3 */}
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-md w-full relative z-10 border border-emerald-100/50">
          {/* Header section */}
          <div className="text-center mb-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                <SparklesIcon className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-12 w-6 h-6 bg-amber-400 rounded-full animate-bounce shadow-lg"></div>
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent mb-4 tracking-tight">
              Healthy Me
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed font-medium">
              Your intelligent nutrition companion powered by advanced analytics
            </p>
          </div>

          {/* Features preview - Material Design cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50 hover:shadow-lg transition-all duration-300">
              <div className="text-3xl mb-2">🤖</div>
              <div className="text-xs font-semibold text-emerald-800">Smart Analysis</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-100/50 hover:shadow-lg transition-all duration-300">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-xs font-semibold text-blue-800">Health Scoring</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-100/50 hover:shadow-lg transition-all duration-300">
              <div className="text-3xl mb-2">📱</div>
              <div className="text-xs font-semibold text-purple-800">Smart Tracking</div>
            </div>
          </div>
          
          {/* Action buttons - Material You style */}
          <div className="space-y-4 mb-8">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-4 px-6 rounded-full hover:from-emerald-600 hover:to-green-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-emerald-200/50 flex items-center justify-center group"
            >
              <div className="mr-3 text-xl group-hover:animate-pulse">🔐</div>
              <span className="text-lg">Sign In / Create Account</span>
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
              className="w-full bg-gray-100 text-gray-800 font-semibold py-4 px-6 rounded-full hover:bg-gray-200 transition-all duration-300 transform hover:scale-[1.02] shadow-md flex items-center justify-center group border border-gray-200"
            >
              <div className="mr-3 text-lg group-hover:animate-bounce">🚀</div>
              <span>Try Demo Mode</span>
            </button>
          </div>

          {/* Benefits section - Material Design surface */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-100">
            <div className="text-center">
              <div className="text-sm font-bold text-gray-800 mb-4">✨ Why Choose Healthy Me?</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center text-gray-700">
                  <span className="text-emerald-500 mr-2 text-base">✓</span>
                  Instant Analysis
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-emerald-500 mr-2 text-base">✓</span>
                  Health Scoring
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-emerald-500 mr-2 text-base">✓</span>
                  Progress Tracking
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-emerald-500 mr-2 text-base">✓</span>
                  Cloud Sync
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            Join thousands of users improving their nutrition with smart insights
          </p>
        </div>
        
        {showAuthModal && (
          <AuthModal 
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Material Design 3 Header */}
      <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mr-4 shadow-lg shadow-emerald-200/50">
                      <SparklesIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-tight`}>Healthy Me</h1>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
                            Powered by <span className="text-blue-500 font-semibold">Advanced Analytics</span> • 
                            <span className="text-purple-500 font-semibold"> Machine Learning</span> • 
                            <span className="text-orange-500 font-semibold"> Smart Analysis</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center">
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
            </div>
        </div>
      </header>
      
      <main className="container mx-auto p-6 space-y-8">
        <AIServicesStatus isDarkMode={isDarkMode} />
        
        {/* Main Analysis Section - Material Design Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          <div className="xl:col-span-5">
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-3xl shadow-lg border space-y-6`}>
              <div className="text-center">
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Scan Your Meal</h2>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Upload a photo to get instant nutrition analysis and chemical safety assessment</p>
              </div>
              <ImageUploader onImageUpload={handleImageUpload} imagePreviewUrl={image} />
              
              <div className="text-center">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Select Your Diet</h3>
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
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3 px-6 rounded-full hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center text-lg shadow-lg shadow-emerald-200/50 disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="w-6 h-6 mr-3" />
                    {isModelLoading ? 'Loading Models...' : 'Analyzing with Smart Engine...'}
                  </>
                ) : (
                   <>
                    <SparklesIcon className="w-6 h-6 mr-3"/>
                    Analyze Food
                   </>
                )}
              </button>
            </div>
          </div>
          
          <div className="xl:col-span-7">
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-3xl shadow-lg border min-h-[400px] flex flex-col`}>
              <div className="text-center mb-4">
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Analysis Results</h2>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Smart nutrition insights, chemical safety analysis, and health recommendations</p>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                {isLoading && (
                  <div className="text-center py-8">
                    <LoadingSpinner className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>Analyzing your meal...</p>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>This may take a moment.</p>
                  </div>
                )}
                {error && (
                  <div className={`text-center py-8 ${isDarkMode ? 'bg-red-900/50 border-red-700' : 'bg-red-50 border-red-200'} p-6 rounded-2xl border w-full`}>
                    <h3 className={`${isDarkMode ? 'text-red-300' : 'text-red-700'} font-bold text-lg mb-2`}>Analysis Failed</h3>
                    <p className={`${isDarkMode ? 'text-red-400' : 'text-red-600'} text-sm`}>{error}</p>
                  </div>
                )}
                {!isLoading && !error && analysisResult && (
                  <div className="w-full">
                    <AnalysisResultComponent 
                      result={analysisResult} 
                      onShare={handleShareCurrentAnalysis}
                    />
                  </div>
                )}
                {!isLoading && !error && !analysisResult && (
                   <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} py-8`}>
                      <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium">Your meal analysis will appear here</p>
                      <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1 text-sm`}>Upload an image and click analyze to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Health Profile Setup Section - Material Design 3 */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl shadow-lg border overflow-hidden`}>
          <div className={`p-4 ${isDarkMode ? 'border-gray-700 bg-gradient-to-r from-gray-700 to-gray-800' : 'border-gray-100 bg-gradient-to-r from-gray-50 to-white'} border-b`}>
            <div className="text-center">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>Health Profile Setup</h2>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Personalize your experience with BMI calculation and health conditions</p>
            </div>
          </div>
          
          {/* Profile Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        
        {/* Firebase Sync Section - Always available */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-8 rounded-3xl shadow-lg border`}>
          <div className="text-center mb-6">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>☁️ Firebase Sync</h2>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Sync your data across devices</p>
          </div>
          <FirebaseSync onSyncComplete={handleSyncComplete} />
        </div>
      </main>

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
    </div>
  );
};

export default App;
