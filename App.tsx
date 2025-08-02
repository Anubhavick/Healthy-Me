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
              Your intelligent nutrition companion powered by advanced AI
            </p>
          </div>

          {/* Features preview - Material Design cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50 hover:shadow-lg transition-all duration-300">
              <div className="text-3xl mb-2">🤖</div>
              <div className="text-xs font-semibold text-emerald-800">AI Analysis</div>
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
                  Instant AI Analysis
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Material Design 3 Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mr-4 shadow-lg shadow-emerald-200/50">
                      <SparklesIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Healthy Me</h1>
                        <p className="text-sm text-gray-600 font-medium">
                            Powered by <span className="text-blue-600 font-semibold">Gemini AI</span> • 
                            <span className="text-purple-600 font-semibold"> TensorFlow.js</span> • 
                            <span className="text-orange-600 font-semibold"> Firebase</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                        👋 Welcome, {user?.email || user?.displayName || 'User'}!
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition-all duration-200 text-sm font-semibold border border-red-200 hover:border-red-300"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
      </header>
      
      <main className="container mx-auto p-6 space-y-8">
        <AIServicesStatus />
        
        {/* Main Analysis Section - Material Design Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          <div className="xl:col-span-5">
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">📸 Scan Your Meal</h2>
                <p className="text-gray-600">Upload a photo to get instant AI-powered nutrition analysis and chemical safety assessment</p>
              </div>
              <ImageUploader onImageUpload={handleImageUpload} imagePreviewUrl={image} />
              
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🥗 Select Your Diet</h3>
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
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-4 px-6 rounded-full hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center text-lg shadow-lg shadow-emerald-200/50 disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="w-6 h-6 mr-3" />
                    {isModelLoading ? 'Loading AI Models...' : 'Analyzing with Multi-AI...'}
                  </>
                ) : (
                   <>
                    <SparklesIcon className="w-6 h-6 mr-3"/>
                    Analyze with AI
                   </>
                )}
              </button>
            </div>
          </div>
          
          <div className="xl:col-span-7">
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 min-h-[500px] flex flex-col">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🧠 AI Analysis Results</h2>
                <p className="text-gray-600">AI-powered nutrition insights, chemical safety analysis, and health recommendations</p>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                {isLoading && (
                  <div className="text-center py-12">
                    <LoadingSpinner className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-gray-700 mb-2">AI is analyzing your meal...</p>
                    <p className="text-gray-500">This may take a moment.</p>
                  </div>
                )}
                {error && (
                  <div className="text-center py-12 bg-red-50 p-8 rounded-2xl border border-red-200 w-full">
                    <div className="text-4xl mb-4">❌</div>
                    <h3 className="text-red-700 font-bold text-lg mb-2">Analysis Failed</h3>
                    <p className="text-red-600">{error}</p>
                  </div>
                )}
                {!isLoading && !error && analysisResult && (
                  <div className="w-full">
                    <AnalysisResultComponent result={analysisResult} />
                  </div>
                )}
                {!isLoading && !error && !analysisResult && (
                   <div className="text-center text-gray-500 py-12">
                      <div className="text-6xl mb-4">🍽️</div>
                      <p className="text-lg font-medium">Your meal analysis will appear here</p>
                      <p className="text-gray-400 mt-2">Upload an image and click analyze to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Health Profile & Analytics Section - Material Design 3 */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🏥 Health Profile & Analytics</h2>
              <p className="text-gray-600 text-lg">Comprehensive health tracking and personalized insights</p>
            </div>
          </div>
          
          {/* Material Design 3 Navigation Tabs */}
          <div className="px-8 pt-6">
            <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'profile' 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-200/50' 
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <span>👤</span>
                Profile Setup
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'analytics' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200/50' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span>📊</span>
                Enhanced Analytics
              </button>
              <button
                onClick={() => setActiveTab('social')}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'social' 
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-200/50' 
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <span>📱</span>
                Social Sharing
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'goals' 
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-200/50' 
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                }`}
              >
                <span>🎯</span>
                Goals & Streaks
              </button>
            </div>
          </div>

          {/* Tab Content with improved spacing */}
          <div className="p-8">
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Set Up Your Health Profile</h3>
                  <p className="text-gray-600">Personalize your experience with BMI calculation and health conditions</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <BMICalculator
                    userProfile={userProfile}
                    onBMIUpdate={handleBMIUpdate}
                  />
                  <MedicalConditionsSelector
                    selectedConditions={userProfile?.medicalConditions || []}
                    onConditionsChange={handleConditionsUpdate}
                  />
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">📈 Advanced Health Analytics</h3>
                  <p className="text-gray-600">Track your progress with detailed charts and insights</p>
                </div>
                <EnhancedAnalytics 
                  mealHistory={mealHistory}
                  userProfile={userProfile}
                />
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">🌟 Share Your Success</h3>
                  <p className="text-gray-600">Create beautiful meal cards and share your healthy journey</p>
                </div>
                <SocialSharing 
                  mealHistory={mealHistory}
                  userProfile={userProfile}
                />
              </div>
            )}

            {activeTab === 'goals' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">🚀 Health Goals & Streaks</h3>
                  <p className="text-gray-600">Set targets and maintain your healthy eating streaks</p>
                </div>
                <StreakGoals
                  userProfile={userProfile}
                  onGoalsUpdate={handleGoalsUpdate}
                  onStreakUpdate={handleStreakUpdate}
                />
              </div>
            )}
          </div>
        </div>
        {/* Firebase Sync Section */}
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">☁️ Firebase Sync</h2>
            <p className="text-gray-600">Sync your data across devices</p>
          </div>
          <FirebaseSync onSyncComplete={handleSyncComplete} />
        </div>
        
        {/* Meal History Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">📚 Meal History</h2>
              <p className="text-gray-600 text-lg">Track and export your nutrition journey</p>
            </div>
          </div>
          <div className="p-8">
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
        </div>
        
        {/* Analytics Dashboard */}
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 Analytics Dashboard</h2>
            <p className="text-gray-600">Overview of your nutrition patterns</p>
          </div>
          <AnalyticsDashboard mealHistory={mealHistory} />
        </div>
      </main>
    </div>
  );
};

export default App;
