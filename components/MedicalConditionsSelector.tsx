import React, { useState } from 'react';
import { MedicalCondition } from '../types';

interface MedicalConditionsSelectorProps {
  selectedConditions: MedicalCondition[];
  customCondition?: string;
  onConditionsChange: (conditions: MedicalCondition[], customCondition?: string) => void;
}

const MedicalConditionsSelector: React.FC<MedicalConditionsSelectorProps> = ({
  selectedConditions,
  customCondition,
  onConditionsChange
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
    switch (condition) {
      case MedicalCondition.Diabetes: return '🩸';
      case MedicalCondition.Hypertension: return '💓';
      case MedicalCondition.Cholesterol: return '🫀';
      case MedicalCondition.HeartDisease: return '❤️';
      case MedicalCondition.Obesity: return '⚖️';
      case MedicalCondition.PCOS: return '👩';
      case MedicalCondition.ThyroidIssues: return '🦋';
      case MedicalCondition.KidneyDisease: return '🫘';
      case MedicalCondition.LiverDisease: return '🟫';
      case MedicalCondition.Other: return '🩺';
      default: return '✅';
    }
  };

  const conditions = Object.values(MedicalCondition);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Medical Conditions</h3>
        <span className="text-2xl">🏥</span>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Select any medical conditions you have. This helps provide personalized nutrition advice and safety warnings.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {conditions.map((condition) => (
          <label
            key={condition}
            className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedConditions.includes(condition)
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedConditions.includes(condition)}
              onChange={() => handleConditionToggle(condition)}
              className="sr-only"
            />
            <span className="text-2xl mr-3">{getConditionIcon(condition)}</span>
            <span className="font-medium text-gray-700">{condition}</span>
            {selectedConditions.includes(condition) && (
              <span className="ml-auto text-green-600">✓</span>
            )}
          </label>
        ))}
      </div>

      {showCustomInput && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Please describe your medical condition:
          </label>
          <textarea
            value={customText}
            onChange={(e) => handleCustomConditionChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={3}
            placeholder="e.g., Celiac disease, Food allergies, etc."
          />
        </div>
      )}

      {selectedConditions.length > 0 && selectedConditions[0] !== MedicalCondition.None && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>📋 Selected Conditions:</strong> {selectedConditions.join(', ')}
            {customText && ` (${customText})`}
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Our AI will provide personalized nutrition advice and safety warnings based on these conditions.
          </p>
        </div>
      )}
    </div>
  );
};

export default MedicalConditionsSelector;
