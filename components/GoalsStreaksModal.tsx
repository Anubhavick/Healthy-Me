import React from 'react';
import { UserProfile } from '../types';
import StreakGoals from './StreakGoals';

interface GoalsStreaksModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onGoalsUpdate: (goals: UserProfile['goals']) => void;
  onStreakUpdate: (streak: UserProfile['streak']) => void;
}

const GoalsStreaksModal: React.FC<GoalsStreaksModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onGoalsUpdate,
  onStreakUpdate
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
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Modal header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Health Goals & Streaks</h2>
                <p className="text-gray-600">
                  Set targets and maintain your healthy eating streaks
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto p-6 max-h-[calc(90vh-120px)]">
            {!userProfile ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Profile Required</h3>
                <p className="text-gray-500">Please set up your profile first to access goals and streaks!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Current Goals Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
                    <div className="text-3xl font-bold text-blue-700">
                      {userProfile.goals?.dailyCalories || 'Not Set'}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">Daily Calorie Goal</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
                    <div className="text-3xl font-bold text-green-700">
                      {userProfile.goals?.targetHealthScore || 'Not Set'}
                    </div>
                    <div className="text-sm text-green-600 font-medium">Target Health Score</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
                    <div className="text-3xl font-bold text-purple-700">
                      {userProfile.goals?.targetWeight ? `${userProfile.goals.targetWeight} kg` : 'Not Set'}
                    </div>
                    <div className="text-sm text-purple-600 font-medium">Target Weight</div>
                  </div>
                </div>

                {/* Current Streak Stats */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-2xl border border-orange-200 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-orange-700 mb-2">
                        🔥 {userProfile.streak?.current || 0}
                      </div>
                      <div className="text-sm text-orange-600 font-medium">Current Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-700 mb-2">
                        🏆 {userProfile.streak?.best || 0}
                      </div>
                      <div className="text-sm text-yellow-600 font-medium">Best Streak</div>
                    </div>
                  </div>
                </div>

                {/* StreakGoals Component */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
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
