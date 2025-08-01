import React, { useState, useEffect, useCallback } from 'react';
import { Diet, AnalysisResult, Meal, UserProfile, MedicalCondition } from './types';
import { analyzeImage } from './services/geminiService';
import { ExportService } from './services/exportService';
import ImageUploader from './components/ImageUploader';
import DietSelector from './components/DietSelector';
import AnalysisResultComponent from './components/AnalysisResult';
import MealHistory from './components/MealHistory';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import FirebaseSync from './components/FirebaseSync';
import AIServicesStatus from './components/AIServicesStatus';
import AuthModal from './components/AuthModal';
import BMICalculator from './components/BMICalculator';
import MedicalConditionsSelector from './components/MedicalConditionsSelector';
import StreakGoals from './components/StreakGoals';
import SocialSharing from './components/SocialSharing';
import EnhancedAnalytics from './components/EnhancedAnalytics';
import { SparklesIcon, LoadingSpinner } from './components/icons';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'analyze' | 'profile' | 'analytics' | 'social' | 'goals'>('profile');
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
        console.error("Failed to parse stored data from localStorage", e);
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
      console.error('Error analyzing image:', err);
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

  const handleImageUpload = (imageDataUrl: string) => {
      setImage(imageDataUrl);
      setAnalysisResult(null);
      setError(null);
  }

  // Show authentication modal if not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Main content card */}
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-md w-full relative z-10 border border-white/20">
          {/* Header section */}
          <div className="text-center mb-8">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl">
                <SparklesIcon className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce"></div>
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
              Healthy Me
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Your intelligent nutrition companion powered by advanced AI
            </p>
          </div>

          {/* Features preview */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl">
              <div className="text-2xl mb-1">🤖</div>
              <div className="text-xs font-medium text-gray-700">AI Analysis</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-xs font-medium text-gray-700">Health Scoring</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <div className="text-2xl mb-1">📱</div>
              <div className="text-xs font-medium text-gray-700">Smart Tracking</div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="space-y-4 mb-6">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold py-4 px-6 rounded-2xl hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center justify-center group"
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
              className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white font-medium py-3 px-6 rounded-2xl hover:from-gray-800 hover:to-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center group"
            >
              <div className="mr-3 text-lg group-hover:animate-bounce">🚀</div>
              <span>Try Demo Mode</span>
            </button>
          </div>

          {/* Benefits section */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 mb-6">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-800 mb-2">✨ Why Choose Healthy Me?</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center">
                  <span className="text-green-500 mr-1">✓</span>
                  Instant AI Analysis
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-1">✓</span>
                  Health Scoring
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-1">✓</span>
                  Progress Tracking
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-1">✓</span>
                  Cloud Sync
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            Join thousands of users improving their nutrition with AI-powered insights
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
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center justify-center flex-1">
                    <SparklesIcon className="w-8 h-8 text-green-500 mr-3" />
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">Healthy Me</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Powered by <span className="font-semibold text-blue-600">Gemini AI</span> + 
                            <span className="font-semibold text-purple-600"> TensorFlow.js</span> + 
                            <span className="font-semibold text-orange-600"> Firebase</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className="text-sm text-gray-600 px-3 py-2">
                        Welcome, {user?.email || user?.displayName || 'User'}!
                    </span>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-300 text-sm font-medium"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <AIServicesStatus />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-6">
              <h2 className="text-xl font-semibold text-gray-700">1. Scan Your Meal</h2>
              <ImageUploader onImageUpload={handleImageUpload} imagePreviewUrl={image} />
              
              <h2 className="text-xl font-semibold text-gray-700 pt-4">2. Select Your Diet</h2>
              <DietSelector 
                selectedDiet={userProfile?.diet || Diet.None} 
                onDietChange={(newDiet) => {
                  setDiet(newDiet);
                  if (userProfile) {
                    setUserProfile({...userProfile, diet: newDiet});
                  }
                }} 
              />

              <button
                onClick={handleAnalyzeImage}
                disabled={isLoading || !image}
                className="w-full mt-4 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center text-lg"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="w-6 h-6 mr-3" />
                    {isModelLoading ? 'Loading AI Models...' : 'Analyzing with Multi-AI...'}
                  </>
                ) : (
                   <>
                    <SparklesIcon className="w-6 h-6 mr-2"/>
                    Analyze with AI
                   </>
                )}
              </button>
            </div>
          </div>
          
          <div className="lg:col-span-7">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 min-h-[400px] flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Analysis Results</h2>
              {isLoading && (
                <div className="text-center py-10">
                  <LoadingSpinner className="w-12 h-12 text-green-600 mx-auto" />
                  <p className="mt-4 text-lg font-medium text-gray-600">AI is analyzing your meal...</p>
                  <p className="text-gray-500">This may take a moment.</p>
                </div>
              )}
              {error && (
                <div className="text-center py-10 bg-red-50 p-4 rounded-lg">
                  <h3 className="text-red-700 font-semibold">Analysis Failed</h3>
                  <p className="text-red-600 mt-1">{error}</p>
                </div>
              )}
              {!isLoading && !error && analysisResult && (
                <AnalysisResultComponent result={analysisResult} />
              )}
              {!isLoading && !error && !analysisResult && (
                 <div className="text-center text-gray-500 py-10">
                    <p>Your meal analysis will appear here.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="mt-12 space-y-8">
            {/* Profile & Health Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Health Profile & Analytics</h2>
              
              {/* Navigation Tabs */}
              <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'profile' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Profile Setup
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'analytics' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Enhanced Analytics
                </button>
                <button
                  onClick={() => setActiveTab('social')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'social' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Social Sharing
                </button>
                <button
                  onClick={() => setActiveTab('goals')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'goals' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Goals & Streaks
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BMICalculator
                    userProfile={userProfile}
                    onBMIUpdate={handleBMIUpdate}
                  />
                  <MedicalConditionsSelector
                    selectedConditions={userProfile?.medicalConditions || []}
                    onConditionsChange={handleConditionsUpdate}
                  />
                </div>
              )}

              {activeTab === 'analytics' && (
                <EnhancedAnalytics 
                  mealHistory={mealHistory}
                  userProfile={userProfile}
                />
              )}

              {activeTab === 'social' && (
                <SocialSharing 
                  mealHistory={mealHistory}
                  userProfile={userProfile}
                />
              )}

              {activeTab === 'goals' && (
                <StreakGoals
                  userProfile={userProfile}
                  onGoalsUpdate={handleGoalsUpdate}
                  onStreakUpdate={handleStreakUpdate}
                />
              )}
            </div>
            
            <div>
                <FirebaseSync onSyncComplete={handleSyncComplete} />
            </div>
            
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Meal History</h2>
                <MealHistory 
                  meals={mealHistory} 
                  onDeleteMeal={handleDeleteMeal}
                  onExportPDF={() => {
                    if (userProfile) {
                      const exportData = {
                        user: userProfile,
                        meals: mealHistory,
                        analytics: {
                          totalMeals: mealHistory.length,
                          avgCalories: mealHistory.reduce((acc, meal) => acc + meal.analysis.estimatedCalories, 0) / mealHistory.length || 0,
                          avgHealthScore: mealHistory.reduce((acc, meal) => acc + meal.healthScore, 0) / mealHistory.length || 0,
                          streak: userProfile.streak?.current || 0,
                          goalProgress: 0 // TODO: Calculate based on goals
                        },
                        exportDate: new Date().toISOString()
                      };
                      ExportService.exportToPDF(exportData);
                    }
                  }}
                  onExportCSV={() => {
                    if (userProfile) {
                      ExportService.exportToCSV(mealHistory, userProfile);
                    }
                  }}
                />
            </div>
            
            <div>
                <AnalyticsDashboard mealHistory={mealHistory} />
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
