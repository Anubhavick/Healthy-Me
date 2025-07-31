
import React from 'react';
import { Diet } from '../types';
import { DIET_OPTIONS } from '../constants';

interface DietSelectorProps {
  selectedDiet: Diet;
  onDietChange: (diet: Diet) => void;
}

const DietSelector: React.FC<DietSelectorProps> = ({ selectedDiet, onDietChange }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Diet (Optional)</label>
      <div className="flex flex-wrap gap-2">
        {DIET_OPTIONS.map((diet) => (
          <button
            key={diet}
            type="button"
            onClick={() => onDietChange(diet)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
              selectedDiet === diet
                ? 'bg-green-600 text-white shadow'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {diet}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DietSelector;
