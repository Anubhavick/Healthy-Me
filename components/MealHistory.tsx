
import React, { useState } from 'react';
import { Meal } from '../types';
import { TrashIcon } from './icons';
import AnalysisResultComponent from './AnalysisResult';

interface MealHistoryProps {
  meals: Meal[];
  onDeleteMeal: (mealId: string) => void;
}

const MealHistory: React.FC<MealHistoryProps> = ({ meals, onDeleteMeal }) => {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  if (meals.length === 0) {
    return (
        <div className="text-center py-10 px-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800">No Meals Logged Yet</h3>
            <p className="text-gray-500 mt-1">Start by analyzing a meal to see your history here.</p>
        </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {meals.map((meal) => (
        <div 
          key={meal.id} 
          className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex items-center space-x-4 transition-all hover:shadow-lg cursor-pointer"
          onClick={() => setSelectedMeal(meal)}
        >
          <img src={meal.imageDataUrl} alt={meal.analysis.dishName} className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
          <div className="flex-grow">
            <h4 className="font-bold text-lg text-gray-800">{meal.analysis.dishName}</h4>
            <p className="text-sm text-gray-600">{meal.analysis.estimatedCalories} kcal</p>
            <p className="text-xs text-gray-400">{new Date(meal.timestamp).toLocaleString()}</p>
            <p className="text-xs text-blue-600 mt-1">Click to view details</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteMeal(meal.id);
            }}
            className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
            aria-label={`Delete ${meal.analysis.dishName}`}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ))}

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Meal Details</h3>
              <button
                onClick={() => setSelectedMeal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <img 
                  src={selectedMeal.imageDataUrl} 
                  alt={selectedMeal.analysis.dishName}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Analyzed on {new Date(selectedMeal.timestamp).toLocaleString()}
                </p>
              </div>
              
              <AnalysisResultComponent result={selectedMeal.analysis} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealHistory;
