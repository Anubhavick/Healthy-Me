import React from 'react';
import { Meal, UserProfile } from '../types';
import { ExportService } from '../services/exportService';
import MealHistory from './MealHistory';
import AnalyticsDashboard from './AnalyticsDashboard';

interface MealHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  meals: Meal[];
  userProfile: UserProfile | null;
  onDeleteMeal: (mealId: string) => void;
  onShareMeal?: (meal: Meal) => void;
}

const MealHistoryModal: React.FC<MealHistoryModalProps> = ({
  isOpen,
  onClose,
  meals,
  userProfile,
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
          goalProgress: 0 // TODO: Calculate based on goals
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
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Modal header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Meal History</h2>
                <p className="text-gray-600">
                  {meals.length} meals analyzed • Track your nutrition journey
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

          {/* Modal content with tabs */}
          <div className="flex flex-col h-full max-h-[calc(90vh-120px)]">
            {/* Tab navigation */}
            <div className="flex border-b border-gray-100 bg-gray-50">
              <div className="flex space-x-1 p-4">
                <button className="px-6 py-2 bg-blue-500 text-white rounded-full font-semibold text-sm shadow-sm">
                  📋 History
                </button>
                <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-semibold text-sm hover:bg-gray-300 transition-colors">
                  📊 Analytics
                </button>
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto p-6">
              {meals.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🍽️</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No meals analyzed yet</h3>
                  <p className="text-gray-500">Start analyzing your meals to see them here!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quick stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">{meals.length}</div>
                      <div className="text-sm text-blue-600 font-medium">Total Meals</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-2xl border border-green-200">
                      <div className="text-2xl font-bold text-green-700">
                        {Math.round(meals.reduce((acc, meal) => acc + meal.healthScore, 0) / meals.length || 0)}
                      </div>
                      <div className="text-sm text-green-600 font-medium">Avg Health Score</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-2xl border border-purple-200">
                      <div className="text-2xl font-bold text-purple-700">
                        {Math.round(meals.reduce((acc, meal) => acc + meal.analysis.estimatedCalories, 0) / meals.length || 0)}
                      </div>
                      <div className="text-sm text-purple-600 font-medium">Avg Calories</div>
                    </div>
                  </div>

                  {/* Export buttons */}
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition-colors text-sm font-semibold border border-red-200"
                    >
                      📄 Export PDF
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-full hover:bg-green-100 transition-colors text-sm font-semibold border border-green-200"
                    >
                      📊 Export CSV
                    </button>
                  </div>

                  {/* Meal history component */}
                  <MealHistory 
                    meals={meals} 
                    onDeleteMeal={onDeleteMeal}
                    onShareMeal={onShareMeal}
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
