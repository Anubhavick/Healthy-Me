import React, { useState } from 'react';
import { MedicalCondition, UserProfile } from '../types';
import { calculateBMI } from '../services/geminiService';

interface BMICalculatorProps {
  userProfile: UserProfile;
  onBMIUpdate: (bmiData: any) => void;
}

const BMICalculator: React.FC<BMICalculatorProps> = ({ userProfile, onBMIUpdate }) => {
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
    switch (category) {
      case 'Normal weight': return 'text-green-600 bg-green-50';
      case 'Underweight': return 'text-blue-600 bg-blue-50';
      case 'Overweight': return 'text-yellow-600 bg-yellow-50';
      case 'Obese': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-100 shadow-lg">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-200/50">
          <span className="text-2xl text-white">⚖️</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">BMI Calculator</h3>
        <p className="text-gray-600">Calculate your Body Mass Index with AI health advice</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Height (cm)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full p-4 border-2 border-blue-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 text-lg font-medium bg-white/80 backdrop-blur-sm"
              placeholder="170"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Weight (kg)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full p-4 border-2 border-blue-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 text-lg font-medium bg-white/80 backdrop-blur-sm"
              placeholder="70"
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={!height || !weight || loading}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 px-6 rounded-full hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-200/50 disabled:shadow-none flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Calculating with AI...
            </>
          ) : (
            <>
              <span>🧠</span>
              Calculate BMI & Get AI Health Advice
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
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-blue-200 shadow-lg">
              <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-lg">
                <span>🩺</span>
                AI Health Advice
              </h4>
              <div className="space-y-3">
                {results.healthAdvice.map((advice: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                    <span className="text-blue-500 mt-0.5 text-lg">•</span>
                    <span className="text-blue-700 text-sm font-medium">{advice}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Factors */}
            {results.risks.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-orange-200 shadow-lg">
                <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2 text-lg">
                  <span>⚠️</span>
                  Risk Factors
                </h4>
                <div className="space-y-3">
                  {results.risks.map((risk: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl">
                      <span className="text-orange-500 mt-0.5 text-lg">•</span>
                      <span className="text-orange-700 text-sm font-medium">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200 shadow-lg">
              <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 text-lg">
                <span>💡</span>
                Recommendations
              </h4>
              <div className="space-y-3">
                {results.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                    <span className="text-emerald-500 mt-0.5 text-lg">•</span>
                    <span className="text-emerald-700 text-sm font-medium">{rec}</span>
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
