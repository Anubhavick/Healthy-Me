import React, { useState } from 'react';
import { MedicalCondition, UserProfile } from '../types';
import { calculateBMI } from '../services/geminiService';
import DarkModeIcon from './DarkModeIcon';

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
    <div className={`w-full max-w-2xl mx-auto relative overflow-hidden ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-800/80 via-blue-900/40 to-slate-800/80' 
        : 'bg-gradient-to-br from-white/90 via-blue-50/80 to-indigo-50/90'
    } backdrop-blur-xl p-6 sm:p-8 rounded-3xl border shadow-2xl ${
      isDarkMode ? 'border-white/20 shadow-black/20' : 'border-blue-200/50 shadow-blue-500/10'
    }`}>
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-full blur-2xl"></div>
      
      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ${
            isDarkMode 
              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/25' 
              : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30'
          }`}>
            <DarkModeIcon 
              src="/body-mass-index-svgrepo-com.svg" 
              alt="BMI" 
              className="w-8 h-8" 
              isDarkMode={false} 
              invertInDarkMode={true} 
            />
          </div>
          <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            BMI Calculator
          </h3>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
            Calculate your Body Mass Index with AI health advice
          </p>
        </div>

        <div className="space-y-6">
          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${isDarkMode ? 'text-white/90' : 'text-gray-700'}`}>
                Height (cm)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className={`w-full p-4 text-lg font-medium rounded-2xl border-2 transition-all duration-200 backdrop-blur-sm ${
                    isDarkMode 
                      ? 'bg-gray-800/60 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-900/50' 
                      : 'bg-white/70 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                  } outline-none`}
                  placeholder="170"
                />
                <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  cm
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${isDarkMode ? 'text-white/90' : 'text-gray-700'}`}>
                Weight (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className={`w-full p-4 text-lg font-medium rounded-2xl border-2 transition-all duration-200 backdrop-blur-sm ${
                    isDarkMode 
                      ? 'bg-gray-800/60 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-900/50' 
                      : 'bg-white/70 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                  } outline-none`}
                  placeholder="70"
                />
                <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  kg
                </div>
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            disabled={!height || !weight || loading}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform ${
              !height || !weight || loading
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : `bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 hover:scale-[1.02] active:scale-95 shadow-lg ${
                    isDarkMode ? 'shadow-blue-500/25' : 'shadow-blue-500/30'
                  }`
            } flex items-center justify-center gap-3`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Calculating with AI...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Calculate BMI</span>
              </>
            )}
          </button>

          {results && (
            <div className="space-y-6">
            {/* BMI Result Card */}
            <div className={`p-6 rounded-2xl border-2 backdrop-blur-sm transition-all duration-500 shadow-xl ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-600 shadow-gray-800/30' 
                : 'bg-white/60 border-gray-200 shadow-gray-500/10'
            }`}>
              <div className="text-center">
                <div className={`text-5xl font-black mb-3 ${getBMIColor(results.category)}`}>
                  {results.bmi}
                </div>
                <div className={`text-xl font-bold mb-6 ${getBMIColor(results.category)}`}>
                  {results.category}
                </div>
                
                {/* BMI Scale Indicator */}
                <div className="relative w-full h-4 bg-gradient-to-r from-blue-400 via-green-500 to-red-500 rounded-full mb-6 overflow-hidden shadow-inner">
                  <div 
                    className="absolute top-0 w-1 h-full bg-white shadow-lg transform -translate-x-1/2"
                    style={{ left: `${Math.min(Math.max((parseFloat(results.bmi) - 15) / 25 * 100, 0), 100)}%` }}
                  >
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"></div>
                  </div>
                </div>
                
                {/* BMI Categories Legend */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-medium">
                  <div className="text-blue-500 text-center">
                    <div className="w-4 h-2 bg-blue-400 rounded mx-auto mb-1"></div>
                    Under (≤18.5)
                  </div>
                  <div className="text-green-500 text-center">
                    <div className="w-4 h-2 bg-green-500 rounded mx-auto mb-1"></div>
                    Normal (18.5-25)
                  </div>
                  <div className="text-yellow-500 text-center">
                    <div className="w-4 h-2 bg-yellow-500 rounded mx-auto mb-1"></div>
                    Over (25-30)
                  </div>
                  <div className="text-red-500 text-center">
                    <div className="w-4 h-2 bg-red-500 rounded mx-auto mb-1"></div>
                    Obese (≥30)
                  </div>
                </div>
              </div>
            </div>

            {/* Health Advice Card */}
            <div className={`p-6 rounded-2xl border-2 backdrop-blur-sm transition-all duration-500 shadow-xl ${
              isDarkMode 
                ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-700/50 shadow-blue-900/20' 
                : 'bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-blue-200/50 shadow-blue-500/10'
            }`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/25' 
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30'
                }`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  🩺 Health Insights
                </h4>
              </div>
              <div className="space-y-3">
                {results.healthAdvice.map((advice: string, index: number) => (
                  <div key={index} className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-blue-800/30 hover:bg-blue-800/40 border border-blue-700/30' 
                      : 'bg-blue-100/50 hover:bg-blue-100/70 border border-blue-200/30'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                    }`}></div>
                    <span className={`text-sm font-medium leading-relaxed ${
                      isDarkMode ? 'text-blue-100' : 'text-blue-800'
                    }`}>
                      {advice}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Factors Card */}
            {results.risks.length > 0 && (
              <div className={`p-6 rounded-2xl border-2 backdrop-blur-sm transition-all duration-500 shadow-xl ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-orange-900/40 to-red-900/40 border-orange-700/50 shadow-orange-900/20' 
                  : 'bg-gradient-to-br from-orange-50/80 to-red-50/80 border-orange-200/50 shadow-orange-500/10'
              }`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-orange-600 to-red-700 shadow-orange-500/25' 
                      : 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/30'
                  }`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    ⚠️ Risk Factors
                  </h4>
                </div>
                <div className="space-y-3">
                  {results.risks.map((risk: string, index: number) => (
                    <div key={index} className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-orange-800/30 hover:bg-orange-800/40 border border-orange-700/30' 
                        : 'bg-orange-100/50 hover:bg-orange-100/70 border border-orange-200/30'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        isDarkMode ? 'bg-orange-400' : 'bg-orange-500'
                      }`}></div>
                      <span className={`text-sm font-medium leading-relaxed ${
                        isDarkMode ? 'text-orange-100' : 'text-orange-800'
                      }`}>
                        {risk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Card */}
            <div className={`p-6 rounded-2xl border-2 backdrop-blur-sm transition-all duration-500 shadow-xl ${
              isDarkMode 
                ? 'bg-gradient-to-br from-emerald-900/40 to-green-900/40 border-emerald-700/50 shadow-emerald-900/20' 
                : 'bg-gradient-to-br from-emerald-50/80 to-green-50/80 border-emerald-200/50 shadow-emerald-500/10'
            }`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-emerald-600 to-green-700 shadow-emerald-500/25' 
                    : 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30'
                }`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  💡 Recommendations
                </h4>
              </div>
              <div className="space-y-3">
                {results.recommendations.map((rec: string, index: number) => (
                  <div key={index} className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-emerald-800/30 hover:bg-emerald-800/40 border border-emerald-700/30' 
                      : 'bg-emerald-100/50 hover:bg-emerald-100/70 border border-emerald-200/30'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      isDarkMode ? 'bg-emerald-400' : 'bg-emerald-500'
                    }`}></div>
                    <span className={`text-sm font-medium leading-relaxed ${
                      isDarkMode ? 'text-emerald-100' : 'text-emerald-800'
                    }`}>
                      {rec}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default BMICalculator;
