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
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">BMI Calculator</h3>
        <span className="text-2xl">⚖️</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Height (cm)
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="170"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg)
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="70"
          />
        </div>
      </div>

      <button
        onClick={handleCalculate}
        disabled={!height || !weight || loading}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Calculating with AI...' : 'Calculate BMI & Get AI Health Advice'}
      </button>

      {results && (
        <div className="mt-6 space-y-4">
          {/* BMI Result */}
          <div className={`p-4 rounded-lg border ${getBMIColor(results.category)}`}>
            <div className="text-center">
              <p className="text-3xl font-bold">{results.bmi}</p>
              <p className="text-lg font-semibold">{results.category}</p>
            </div>
          </div>

          {/* Health Advice */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">🩺 AI Health Advice</h4>
            <ul className="space-y-1">
              {results.healthAdvice.map((advice: string, index: number) => (
                <li key={index} className="text-sm text-blue-700">• {advice}</li>
              ))}
            </ul>
          </div>

          {/* Risk Factors */}
          {results.risks.length > 0 && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2">⚠️ Risk Factors</h4>
              <ul className="space-y-1">
                {results.risks.map((risk: string, index: number) => (
                  <li key={index} className="text-sm text-orange-700">• {risk}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">💡 Recommendations</h4>
            <ul className="space-y-1">
              {results.recommendations.map((rec: string, index: number) => (
                <li key={index} className="text-sm text-green-700">• {rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default BMICalculator;
