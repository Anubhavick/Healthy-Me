import React from 'react';
import { Meal, UserProfile } from '../types';
import EnhancedAnalytics from './EnhancedAnalytics';

interface EnhancedAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealHistory: Meal[];
  userProfile: UserProfile | null;
}

const EnhancedAnalyticsModal: React.FC<EnhancedAnalyticsModalProps> = ({
  isOpen,
  onClose,
  mealHistory,
  userProfile
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
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
          {/* Modal header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Advanced Health Analytics</h2>
                <p className="text-gray-600">
                  Track your progress with detailed charts and insights
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
            {mealHistory.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No data to analyze yet</h3>
                <p className="text-gray-500">Start analyzing your meals to see detailed analytics!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quick stats header */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">{mealHistory.length}</div>
                    <div className="text-sm text-blue-600 font-medium">Total Meals</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-2xl border border-green-200">
                    <div className="text-2xl font-bold text-green-700">
                      {Math.round(mealHistory.reduce((acc, meal) => acc + meal.healthScore, 0) / mealHistory.length || 0)}
                    </div>
                    <div className="text-sm text-green-600 font-medium">Avg Health Score</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-2xl border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">
                      {Math.round(mealHistory.reduce((acc, meal) => acc + meal.analysis.estimatedCalories, 0) / mealHistory.length || 0)}
                    </div>
                    <div className="text-sm text-purple-600 font-medium">Avg Calories</div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-2xl border border-orange-200">
                    <div className="text-2xl font-bold text-orange-700">
                      {userProfile?.streak?.current || 0}
                    </div>
                    <div className="text-sm text-orange-600 font-medium">Current Streak</div>
                  </div>
                </div>

                {/* Enhanced Analytics Component */}
                <EnhancedAnalytics 
                  mealHistory={mealHistory}
                  userProfile={userProfile}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalyticsModal;
