import React, { useState } from 'react';
import { MedicalCondition } from '../types';

interface MedicalConditionsSelectorProps {
  selectedConditions: MedicalCondition[];
  customCondition?: string;
  onConditionsChange: (conditions: MedicalCondition[], customCondition?: string) => void;
  isDarkMode?: boolean;
}

const MedicalConditionsSelector: React.FC<MedicalConditionsSelectorProps> = ({
  selectedConditions,
  customCondition,
  onConditionsChange,
  isDarkMode = false
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState(customCondition || '');

  const handleConditionToggle = (condition: MedicalCondition) => {
    let newConditions = [...selectedConditions];
    
    if (condition === MedicalCondition.None) {
      newConditions = [MedicalCondition.None];
      setShowCustomInput(false);
      onConditionsChange(newConditions, '');
    } else if (condition === MedicalCondition.Other) {
      newConditions = newConditions.filter(c => c !== MedicalCondition.None);
      if (!newConditions.includes(condition)) {
        newConditions.push(condition);
        setShowCustomInput(true);
      } else {
        newConditions = newConditions.filter(c => c !== condition);
        setShowCustomInput(false);
        setCustomText('');
      }
      onConditionsChange(newConditions, customText);
    } else {
      newConditions = newConditions.filter(c => c !== MedicalCondition.None);
      if (newConditions.includes(condition)) {
        newConditions = newConditions.filter(c => c !== condition);
      } else {
        newConditions.push(condition);
      }
      onConditionsChange(newConditions, customText);
    }
  };

  const handleCustomConditionChange = (value: string) => {
    setCustomText(value);
    onConditionsChange(selectedConditions, value);
  };

  const getConditionIcon = (condition: MedicalCondition) => {
    // Removed emojis for cleaner UI
    return '';
  };

  const conditions = Object.values(MedicalCondition);

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 rounded-xl shadow-lg border`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Medical Conditions</h3>
      </div>

      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
        Select any medical conditions you have. This helps provide personalized nutrition advice and safety warnings.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {conditions.map((condition) => (
          <label
            key={condition}
            className={`flex items-center p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedConditions.includes(condition)
                ? isDarkMode 
                  ? 'border-green-600 bg-green-900/50' 
                  : 'border-green-500 bg-green-50'
                : isDarkMode
                  ? 'border-gray-600 hover:border-green-600 bg-gray-700/50'
                  : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedConditions.includes(condition)}
              onChange={() => handleConditionToggle(condition)}
              className="sr-only"
            />
            <span className={`font-medium text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{condition}</span>
            {selectedConditions.includes(condition) && (
              <span className={`ml-auto ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>✓</span>
            )}
          </label>
        ))}
      </div>

      {showCustomInput && (
        <div className="mt-4">
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Please describe your medical condition:
          </label>
          <textarea
            value={customText}
            onChange={(e) => handleCustomConditionChange(e.target.value)}
            className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white focus:ring-green-600' : 'border-gray-300 bg-white focus:ring-green-500'} rounded-lg focus:ring-2 focus:border-transparent`}
            rows={2}
            placeholder="e.g., Celiac disease, Food allergies, etc."
          />
        </div>
      )}

      {selectedConditions.length > 0 && selectedConditions[0] !== MedicalCondition.None && (
        <div className={`mt-6 p-4 ${isDarkMode ? 'bg-blue-900/50 border-blue-700' : 'bg-blue-50 border-blue-200'} rounded-lg border`}>
          <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
            <strong>📋 Selected Conditions:</strong> {selectedConditions.join(', ')}
            {customText && ` (${customText})`}
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} mt-2`}>
            Our AI will provide personalized nutrition advice and safety warnings based on these conditions.
          </p>
        </div>
      )}
    </div>
  );
};

export default MedicalConditionsSelector;
