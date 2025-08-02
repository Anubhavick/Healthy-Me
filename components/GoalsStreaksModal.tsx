import React from 'react';
import { UserProfile } from '../types';
import StreakGoals from './StreakGoals';

interface GoalsStreaksModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onGoalsUpdate: (goals: UserProfile['goals']) => void;
  onStreakUpdate: (streak: UserProfile['streak']) => void;
  isDarkMode?: boolean;
}

const GoalsStreaksModal: React.FC<GoalsStreaksModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onGoalsUpdate,
  onStreakUpdate,
  isDarkMode = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal container */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className={`relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden`}>
          {/* Modal header */}
          <div className={`flex items-center justify-between p-6 ${isDarkMode ? 'border-gray-700 bg-gradient-to-r from-orange-900/30 to-yellow-900/30' : 'border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50'} border-b`}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Health Goals & Streaks</h2>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Set targets and maintain your healthy eating streaks
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'} flex items-center justify-center transition-colors duration-200`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable content area */}
          <div className={`flex-1 overflow-y-auto p-6 max-h-[calc(90vh-120px)] ${isDarkMode ? 'bg-gray-800' : ''}`}>
            {!userProfile ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">👤</div>
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Profile Required</h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Please set up your profile first to access goals and streaks!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Current Goals Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className={`${isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-blue-800/50 border-blue-700' : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'} p-6 rounded-2xl border`}>
                    <div className={`text-3xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      {userProfile.goals?.dailyCalories || 'Not Set'}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} font-medium`}>Daily Calorie Goal</div>
                  </div>
                  <div className={`${isDarkMode ? 'bg-gradient-to-r from-green-900/50 to-green-800/50 border-green-700' : 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'} p-6 rounded-2xl border`}>
                    <div className={`text-3xl font-bold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                      {userProfile.goals?.targetHealthScore || 'Not Set'}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'} font-medium`}>Target Health Score</div>
                  </div>
                  <div className={`${isDarkMode ? 'bg-gradient-to-r from-purple-900/50 to-purple-800/50 border-purple-700' : 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'} p-6 rounded-2xl border`}>
                    <div className={`text-3xl font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                      {userProfile.goals?.targetWeight ? `${userProfile.goals.targetWeight} kg` : 'Not Set'}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} font-medium`}>Target Weight</div>
                  </div>
                </div>

                {/* Current Streak Stats */}
                <div className={`${isDarkMode ? 'bg-gradient-to-r from-orange-900/50 to-yellow-900/50 border-orange-700' : 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200'} p-6 rounded-2xl border mb-8`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${isDarkMode ? 'text-orange-300' : 'text-orange-700'} mb-2`}>
                        🔥 {userProfile.streak?.current || 0}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-600'} font-medium`}>Current Streak</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'} mb-2`}>
                        🏆 {userProfile.streak?.best || 0}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} font-medium`}>Best Streak</div>
                    </div>
                  </div>
                </div>

                {/* StreakGoals Component */}
                <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
                  <StreakGoals
                    userProfile={userProfile}
                    onGoalsUpdate={onGoalsUpdate}
                    onStreakUpdate={onStreakUpdate}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsStreaksModal;
