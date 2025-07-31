
import React from 'react';
import { AnalysisResult as AnalysisResultType } from '../types';
import { CheckCircleIcon, XCircleIcon, SparklesIcon } from './icons';

interface AnalysisResultProps {
  result: AnalysisResultType;
}

const StatCard: React.FC<{ title: string; value: string | number; children?: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
        {children}
    </div>
);

const HealthScoreCard: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = (score: number) => {
    if (score >= 16) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 12) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 8) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 16) return 'Excellent';
    if (score >= 12) return 'Good';
    if (score >= 8) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={`p-4 rounded-lg shadow-sm border ${getScoreColor(score)}`}>
      <h3 className="text-sm font-medium text-gray-500">Health Score</h3>
      <div className="flex items-center mt-1">
        <p className="text-3xl font-semibold">{score}</p>
        <span className="text-lg font-medium ml-2">/20</span>
      </div>
      <p className="text-sm font-medium mt-1">{getScoreLabel(score)}</p>
      
      {/* Score bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${
            score >= 16 ? 'bg-green-600' : 
            score >= 12 ? 'bg-yellow-600' : 
            score >= 8 ? 'bg-orange-600' : 'bg-red-600'
          }`}
          style={{ width: `${(score / 20) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};


const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
  const { isCompatible, reason } = result.dietCompatibility;
  
  // Calculate health score based on calories, ingredients, and diet compatibility
  const calculateHealthScore = () => {
    let score = 10; // Base score
    
    // Calorie assessment (adjust based on reasonable ranges)
    const calories = result.estimatedCalories;
    if (calories <= 400) score += 3; // Light meal
    else if (calories <= 600) score += 4; // Moderate meal
    else if (calories <= 800) score += 2; // Heavy meal
    else score -= 2; // Very heavy meal
    
    // Ingredient quality (more ingredients often means more complex/nutritious)
    const ingredientCount = result.ingredients.length;
    if (ingredientCount >= 5) score += 3;
    else if (ingredientCount >= 3) score += 2;
    else score += 1;
    
    // Diet compatibility
    if (isCompatible) score += 3;
    else score -= 1;
    
    // Health tips bonus (more tips = more areas for improvement = lower base health)
    if (result.healthTips.length <= 2) score += 2;
    else if (result.healthTips.length <= 4) score += 1;
    
    return Math.max(1, Math.min(20, score)); // Ensure score is between 1-20
  };

  const healthScore = calculateHealthScore();
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800">{result.dishName}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Estimated Calories" value={result.estimatedCalories}>
            <p className="text-xs text-gray-500 mt-1">kcal</p>
        </StatCard>
        
        <HealthScoreCard score={healthScore} />
        
        <div className={`p-4 rounded-lg shadow-sm border flex items-center ${isCompatible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {isCompatible ? <CheckCircleIcon className="w-10 h-10 text-green-500 mr-4 flex-shrink-0"/> : <XCircleIcon className="w-10 h-10 text-red-500 mr-4 flex-shrink-0"/>}
            <div>
                <h3 className={`text-lg font-semibold ${isCompatible ? 'text-green-800' : 'text-red-800'}`}>
                    {isCompatible ? 'Diet Compatible' : 'Not Compatible'}
                </h3>
                <p className={`text-sm ${isCompatible ? 'text-green-700' : 'text-red-700'}`}>{reason}</p>
            </div>
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-semibold text-lg text-gray-800 mb-3">Identified Ingredients</h3>
        <ul className="flex flex-wrap gap-2">
          {result.ingredients.map((ingredient, index) => (
            <li key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-1 rounded-full">
              {ingredient}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-semibold text-lg text-gray-800 mb-3 flex items-center">
          <SparklesIcon className="w-5 h-5 mr-2 text-yellow-500" />
          Health Tips
        </h3>
        <ul className="space-y-2">
          {result.healthTips.map((tip, index) => (
            <li key={index} className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">&#10003;</span>
              <p className="text-gray-600">{tip}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnalysisResult;
