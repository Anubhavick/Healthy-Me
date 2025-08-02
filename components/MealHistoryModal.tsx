import React from 'react';
import { Meal, UserProfile } from '../types';
import { ExportService } from '../services/exportService';
import MealHistory from './MealHistory';

interface MealHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  meals: Meal[];
  userProfile: UserProfile | null;
  isDarkMode: boolean;
  onDeleteMeal: (mealId: string) => void;
  onShareMeal?: (meal: Meal) => void;
}

const MealHistoryModal: React.FC<MealHistoryModalProps> = ({
  isOpen,
  onClose,
  meals,
  userProfile,
  isDarkMode,
  onDeleteMeal,
  onShareMeal
}) => {
  if (!isOpen) return null;

  const handleExportPDF = () => {
    if (userProfile) {
      const exportData = {
        user: userProfile,
        meals: meals,
        analytics: {
          totalMeals: meals.length,
          avgCalories: meals.reduce((acc, meal) => acc + meal.analysis.estimatedCalories, 0) / meals.length || 0,
          avgHealthScore: meals.reduce((acc, meal) => acc + meal.healthScore, 0) / meals.length || 0,
          streak: userProfile.streak?.current || 0,
          goalProgress: userProfile.goals?.dailyCalories ? 
            Math.min((meals.reduce((acc, meal) => acc + meal.analysis.estimatedCalories, 0) / (userProfile.goals.dailyCalories || 2000)) * 100, 100) : 0
        },
        exportDate: new Date().toISOString()
      };
      ExportService.exportToPDF(exportData);
    }
  };

  const handleExportCSV = () => {
    if (userProfile) {
      ExportService.exportToCSV(meals, userProfile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal container */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className={`relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden`}>
          {/* Modal header */}
          <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-100 bg-gradient-to-r from-gray-50 to-white'}`}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Meal History</h2>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {meals.length} meals analyzed • Track your nutrition journey
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

          {/* Modal content with tabs */}
          <div className="flex flex-col h-full max-h-[calc(90vh-120px)]">
            {/* Tab navigation */}
            <div className={`flex border-b ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex space-x-1 p-4">
                <button className="px-6 py-2 bg-blue-500 text-white rounded-full font-semibold text-sm shadow-sm">
                  📋 History
                </button>
                <button className={`px-6 py-2 ${isDarkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-full font-semibold text-sm transition-colors`}>
                  📊 Analytics
                </button>
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto p-6">
              {meals.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🍽️</div>
                  <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>No meals analyzed yet</h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start analyzing your meals to see them here!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quick stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className={`${isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-blue-800/50 border-blue-700' : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'} p-4 rounded-2xl border`}>
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>{meals.length}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} font-medium`}>Total Meals</div>
                    </div>
                    <div className={`${isDarkMode ? 'bg-gradient-to-r from-green-900/50 to-green-800/50 border-green-700' : 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'} p-4 rounded-2xl border`}>
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                        {Math.round(meals.reduce((acc, meal) => acc + meal.healthScore, 0) / meals.length || 0)}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'} font-medium`}>Avg Health Score</div>
                    </div>
                    <div className={`${isDarkMode ? 'bg-gradient-to-r from-purple-900/50 to-purple-800/50 border-purple-700' : 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'} p-4 rounded-2xl border`}>
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                        {Math.round(meals.reduce((acc, meal) => acc + meal.analysis.estimatedCalories, 0) / meals.length || 0)}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} font-medium`}>Avg Calories</div>
                    </div>
                  </div>

                  {/* Export buttons */}
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={handleExportPDF}
                      className={`flex items-center gap-2 ${isDarkMode ? 'bg-red-900/50 text-red-400 hover:bg-red-800/50 border-red-700' : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'} px-4 py-2 rounded-full transition-colors text-sm font-semibold border`}
                    >
                      📄 Export PDF
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className={`flex items-center gap-2 ${isDarkMode ? 'bg-green-900/50 text-green-400 hover:bg-green-800/50 border-green-700' : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200'} px-4 py-2 rounded-full transition-colors text-sm font-semibold border`}
                    >
                      📊 Export CSV
                    </button>
                  </div>

                  {/* Meal history component */}
                  <MealHistory 
                    meals={meals} 
                    onDeleteMeal={onDeleteMeal}
                    onShareMeal={onShareMeal}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealHistoryModal;
