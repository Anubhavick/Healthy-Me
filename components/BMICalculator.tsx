import React, { useState } from 'react';
import { MedicalCondition, UserProfile } from '../types';
import { calculateBMI } from '../services/geminiService';

interface BMICalculatorProps {
  userProfile: UserProfile;
  onBMIUpdate: (bmiData: any) => void;
  isDarkMode?: boolean;
}

const BMICalculator: React.FC<BMICalculatorProps> = ({ userProfile, onBMIUpdate, isDarkMode = false }) => {
  const [height, setHeight] = useState(userProfile.bmi?.height || '');
  const [weight, setWeight] = useState(userProfile.bmi?.weight || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleCalculate = async () => {
    if (!height || !weight) return;
    
    setLoading(true);
    try {
      const bmiResults = await calculateBMI(
        Number(height), 
        Number(weight), 
        userProfile.medicalConditions,
        userProfile.customCondition
      );
      
      setResults(bmiResults);
      
      const bmiData = {
        height: Number(height),
        weight: Number(weight),
        value: bmiResults.bmi,
        category: bmiResults.category,
        lastUpdated: new Date().toISOString()
      };
      
      onBMIUpdate(bmiData);
    } catch (error) {
      console.error('BMI calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBMIColor = (category: string) => {
    if (isDarkMode) {
      switch (category) {
        case 'Normal weight': return 'text-green-400 bg-green-900/50';
        case 'Underweight': return 'text-blue-400 bg-blue-900/50';
        case 'Overweight': return 'text-yellow-400 bg-yellow-900/50';
        case 'Obese': return 'text-red-400 bg-red-900/50';
        default: return 'text-gray-400 bg-gray-800';
      }
    } else {
      switch (category) {
        case 'Normal weight': return 'text-green-600 bg-green-50';
        case 'Underweight': return 'text-blue-600 bg-blue-50';
        case 'Overweight': return 'text-yellow-600 bg-yellow-50';
        case 'Obese': return 'text-red-600 bg-red-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    }
  };

  return (
    <div className={`${isDarkMode ? 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'} p-8 rounded-3xl border shadow-lg`}>
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg shadow-blue-200/50">
          <span className="text-xl text-white">⚖️</span>
        </div>
        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>BMI Calculator</h3>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Calculate your Body Mass Index with AI health advice</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Height (cm)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className={`w-full p-3 border-2 ${isDarkMode ? 'border-blue-600 bg-gray-700 text-white focus:border-blue-400 focus:ring-blue-900/50' : 'border-blue-200 bg-white/80 text-gray-900 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl focus:ring-4 outline-none transition-all duration-200 text-lg font-medium backdrop-blur-sm`}
              placeholder="170"
            />
          </div>
          
          <div>
            <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Weight (kg)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={`w-full p-3 border-2 ${isDarkMode ? 'border-blue-600 bg-gray-700 text-white focus:border-blue-400 focus:ring-blue-900/50' : 'border-blue-200 bg-white/80 text-gray-900 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl focus:ring-4 outline-none transition-all duration-200 text-lg font-medium backdrop-blur-sm`}
              placeholder="70"
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={!height || !weight || loading}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-full hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-200/50 disabled:shadow-none flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Calculating with AI...
            </>
          ) : (
            <>
              <span>🧠</span>
              Calculate BMI
            </>
          )}
        </button>

        {results && (
          <div className="space-y-6">
            {/* BMI Result */}
            <div className={`p-6 rounded-2xl border-2 ${getBMIColor(results.category)} shadow-inner`}>
              <div className="text-center">
                <p className="text-4xl font-bold mb-2">{results.bmi}</p>
                <p className="text-xl font-semibold">{results.category}</p>
              </div>
            </div>

            {/* Health Advice */}
            <div className={`${isDarkMode ? 'bg-gray-700/70 border-blue-600' : 'bg-white/70 border-blue-200'} backdrop-blur-sm p-6 rounded-2xl border shadow-lg`}>
              <h4 className={`font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-800'} mb-4 flex items-center gap-2 text-lg`}>
                <span>🩺</span>
                AI Health Advice
              </h4>
              <div className="space-y-3">
                {results.healthAdvice.map((advice: string, index: number) => (
                  <div key={index} className={`flex items-start gap-3 p-3 ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-50'} rounded-xl`}>
                    <span className={`${isDarkMode ? 'text-blue-400' : 'text-blue-500'} mt-0.5 text-lg`}>•</span>
                    <span className={`${isDarkMode ? 'text-blue-300' : 'text-blue-700'} text-sm font-medium`}>{advice}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Factors */}
            {results.risks.length > 0 && (
              <div className={`${isDarkMode ? 'bg-gray-700/70 border-orange-600' : 'bg-white/70 border-orange-200'} backdrop-blur-sm p-6 rounded-2xl border shadow-lg`}>
                <h4 className={`font-bold ${isDarkMode ? 'text-orange-300' : 'text-orange-800'} mb-4 flex items-center gap-2 text-lg`}>
                  <span>⚠️</span>
                  Risk Factors
                </h4>
                <div className="space-y-3">
                  {results.risks.map((risk: string, index: number) => (
                    <div key={index} className={`flex items-start gap-3 p-3 ${isDarkMode ? 'bg-orange-900/50' : 'bg-orange-50'} rounded-xl`}>
                      <span className={`${isDarkMode ? 'text-orange-400' : 'text-orange-500'} mt-0.5 text-lg`}>•</span>
                      <span className={`${isDarkMode ? 'text-orange-300' : 'text-orange-700'} text-sm font-medium`}>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className={`${isDarkMode ? 'bg-gray-700/70 border-emerald-600' : 'bg-white/70 border-emerald-200'} backdrop-blur-sm p-6 rounded-2xl border shadow-lg`}>
              <h4 className={`font-bold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'} mb-4 flex items-center gap-2 text-lg`}>
                <span>💡</span>
                Recommendations
              </h4>
              <div className="space-y-3">
                {results.recommendations.map((rec: string, index: number) => (
                  <div key={index} className={`flex items-start gap-3 p-3 ${isDarkMode ? 'bg-emerald-900/50' : 'bg-emerald-50'} rounded-xl`}>
                    <span className={`${isDarkMode ? 'text-emerald-400' : 'text-emerald-500'} mt-0.5 text-lg`}>•</span>
                    <span className={`${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'} text-sm font-medium`}>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BMICalculator;
