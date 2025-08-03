import React, { useState } from 'react';
import { MedicalCondition } from '../types';

interface MedicalConditionsModalProps {
  selectedConditions: MedicalCondition[];
  customCondition?: string;
  onConditionsChange: (conditions: MedicalCondition[], customCondition?: string) => void;
  isDarkMode?: boolean;
}

const MedicalConditionsModal: React.FC<MedicalConditionsModalProps> = ({
  selectedConditions,
  customCondition,
  onConditionsChange,
  isDarkMode = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState(customCondition || '');
  const [tempSelectedConditions, setTempSelectedConditions] = useState(selectedConditions);

  const handleConditionToggle = (condition: MedicalCondition) => {
    let newConditions = [...tempSelectedConditions];
    
    if (condition === MedicalCondition.None) {
      newConditions = [MedicalCondition.None];
      setShowCustomInput(false);
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
    } else {
      newConditions = newConditions.filter(c => c !== MedicalCondition.None);
      if (newConditions.includes(condition)) {
        newConditions = newConditions.filter(c => c !== condition);
      } else {
        newConditions.push(condition);
      }
    }
    
    setTempSelectedConditions(newConditions);
  };

  const handleCustomConditionChange = (value: string) => {
    setCustomText(value);
  };

  const handleSave = () => {
    onConditionsChange(tempSelectedConditions, customText);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSelectedConditions(selectedConditions);
    setCustomText(customCondition || '');
    setShowCustomInput(selectedConditions.includes(MedicalCondition.Other));
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (selectedConditions.length === 0 || (selectedConditions.length === 1 && selectedConditions[0] === MedicalCondition.None)) {
      return 'Select Medical Conditions (Optional)';
    }
    
    const activeConditions = selectedConditions.filter(c => c !== MedicalCondition.None);
    if (activeConditions.length === 1) {
      return activeConditions[0];
    }
    if (activeConditions.length === 2) {
      return `${activeConditions[0]} & ${activeConditions[1]}`;
    }
    return `${activeConditions[0]} & ${activeConditions.length - 1} more`;
  };

  const conditions = Object.values(MedicalCondition);

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full px-4 py-3 text-left rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 relative ${
          selectedConditions.length > 0 && selectedConditions[0] !== MedicalCondition.None
            ? isDarkMode 
              ? 'bg-blue-900/30 border-blue-600 text-blue-200 hover:border-blue-500 focus:ring-blue-500' 
              : 'bg-blue-50 border-blue-400 text-blue-800 hover:border-blue-500 focus:ring-blue-400'
            : isDarkMode 
              ? 'bg-gray-800/50 border-gray-600 text-gray-200 hover:border-blue-500 focus:ring-blue-500' 
              : 'bg-white/80 border-gray-300 text-gray-700 hover:border-blue-400 focus:ring-blue-400'
        } backdrop-blur-sm shadow-lg`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${
              selectedConditions.length > 0 && selectedConditions[0] !== MedicalCondition.None 
                ? isDarkMode ? 'text-blue-200' : 'text-blue-800'
                : isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {getDisplayText()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {selectedConditions.length > 0 && selectedConditions[0] !== MedicalCondition.None && (
              <div className={`w-2 h-2 rounded-full ${
                isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
              }`} />
            )}
            <svg 
              className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M8 9l4 4 4-4"/>
            </svg>
          </div>
        </div>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCancel}
          />
          
          {/* Modal Content */}
          <div className={`relative w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl border animate-in zoom-in-95 duration-200 ${
            isDarkMode 
              ? 'bg-gray-800/95 border-gray-600' 
              : 'bg-white/95 border-gray-300'
          } backdrop-blur-xl`}>
            
            {/* Header */}
            <div className={`px-6 py-4 border-b ${
              isDarkMode ? 'border-gray-600' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Medical Conditions
                  </h3>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  } mt-1`}>
                    Select any medical conditions for personalized advice
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className={`p-2 rounded-full transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {conditions.map((condition) => (
                  <label
                    key={condition}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                      tempSelectedConditions.includes(condition)
                        ? isDarkMode 
                          ? 'bg-blue-900/50 text-blue-200 border-blue-700' 
                          : 'bg-blue-50 text-blue-800 border-blue-300'
                        : isDarkMode
                          ? 'hover:bg-gray-700/50 text-gray-300 border-gray-600 hover:border-gray-500'
                          : 'hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={tempSelectedConditions.includes(condition)}
                      onChange={() => handleConditionToggle(condition)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors ${
                      tempSelectedConditions.includes(condition)
                        ? 'bg-blue-600 border-blue-600'
                        : isDarkMode
                          ? 'border-gray-500'
                          : 'border-gray-300'
                    }`}>
                      {tempSelectedConditions.includes(condition) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium">{condition}</span>
                  </label>
                ))}
              </div>

              {/* Custom Condition Input */}
              {showCustomInput && (
                <div className="mt-6">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Describe your condition:
                  </label>
                  <textarea
                    value={customText}
                    onChange={(e) => handleCustomConditionChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg resize-none text-sm ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white focus:ring-blue-500' 
                        : 'border-gray-300 bg-white focus:ring-blue-400'
                    } focus:ring-2 focus:border-transparent`}
                    rows={3}
                    placeholder="e.g., Celiac disease, Food allergies..."
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t ${
              isDarkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
            }`}>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Save
                </button>
              </div>
              
              {/* Selection Summary */}
              {tempSelectedConditions.length > 0 && tempSelectedConditions[0] !== MedicalCondition.None && (
                <div className={`mt-3 p-3 rounded-lg ${
                  isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
                }`}>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-800'
                  }`}>
                    <strong>Selected:</strong> {tempSelectedConditions.filter(c => c !== MedicalCondition.None).join(', ')}
                    {customText && ` (${customText})`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MedicalConditionsModal;
