import React, { useState, useEffect } from 'react';
import { SparklesIcon } from './icons';

interface NutritionStats {
  totalMeals: number;
  avgCalories: number;
  topFoods: string[];
  avgHealthScore: number;
  dietCompliance: number;
  totalCalories: number;
}

interface AnalyticsDashboardProps {
  mealHistory: any[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ mealHistory }) => {
  const [stats, setStats] = useState<NutritionStats>({
    totalMeals: 0,
    avgCalories: 0,
    topFoods: [],
    avgHealthScore: 0,
    dietCompliance: 0,
    totalCalories: 0
  });

  const calculateHealthScore = (meal: any) => {
    let score = 10;
    const calories = meal.analysis?.estimatedCalories || 0;
    const ingredientCount = meal.analysis?.ingredients?.length || 0;
    const isCompatible = meal.analysis?.dietCompatibility?.isCompatible || false;
    
    if (calories <= 400) score += 3;
    else if (calories <= 600) score += 4;
    else if (calories <= 800) score += 2;
    else score -= 2;
    
    if (ingredientCount >= 5) score += 3;
    else if (ingredientCount >= 3) score += 2;
    else score += 1;
    
    if (isCompatible) score += 3;
    else score -= 1;
    
    return Math.max(1, Math.min(20, score));
  };

  useEffect(() => {
    if (mealHistory.length > 0) {
      const totalCalories = mealHistory.reduce((sum, meal) => sum + (meal.analysis?.estimatedCalories || 0), 0);
      const avgCalories = Math.round(totalCalories / mealHistory.length);
      
      // Calculate average health score
      const healthScores = mealHistory.map(calculateHealthScore);
      const avgHealthScore = Math.round(healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length);
      
      // Count food types
      const foodCounts: { [key: string]: number } = {};
      mealHistory.forEach(meal => {
        if (meal.analysis?.dishName) {
          foodCounts[meal.analysis.dishName] = (foodCounts[meal.analysis.dishName] || 0) + 1;
        }
      });
      
      const topFoods = Object.entries(foodCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([food]) => food);

      // Calculate diet compliance
      const compatibleMeals = mealHistory.filter(meal => meal.analysis?.dietCompatibility?.isCompatible).length;
      const dietCompliance = mealHistory.length > 0 
        ? Math.round((compatibleMeals / mealHistory.length) * 100) 
        : 0;

      setStats({
        totalMeals: mealHistory.length,
        avgCalories,
        topFoods,
        avgHealthScore,
        dietCompliance,
        totalCalories
      });
    }
  }, [mealHistory]);

  const getHealthScoreColor = (score: number) => {
    if (score >= 16) return 'text-green-600';
    if (score >= 12) return 'text-yellow-600';
    if (score >= 8) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 16) return 'Excellent';
    if (score >= 12) return 'Good';
    if (score >= 8) return 'Fair';
    return 'Needs Improvement';
  };

  if (mealHistory.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="text-center">
          <SparklesIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Analytics Yet</h3>
          <p className="text-gray-600">Analyze some meals to see your nutrition insights here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-gray-800">Nutrition Analytics</h3>
        <SparklesIcon className="w-8 h-8 text-blue-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-600 uppercase tracking-wide">Total Meals</h4>
          <p className="text-3xl font-bold text-blue-800 mt-2">{stats.totalMeals}</p>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <h4 className="text-sm font-medium text-green-600 uppercase tracking-wide">Avg Calories</h4>
          <p className="text-3xl font-bold text-green-800 mt-2">{stats.avgCalories}</p>
          <p className="text-sm text-green-600">per meal</p>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <h4 className="text-sm font-medium text-purple-600 uppercase tracking-wide">Health Score</h4>
          <p className={`text-3xl font-bold mt-2 ${getHealthScoreColor(stats.avgHealthScore)}`}>
            {stats.avgHealthScore}/20
          </p>
          <p className={`text-sm ${getHealthScoreColor(stats.avgHealthScore)}`}>
            {getHealthScoreLabel(stats.avgHealthScore)}
          </p>
        </div>
        
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <h4 className="text-sm font-medium text-orange-600 uppercase tracking-wide">Diet Compliance</h4>
          <p className="text-3xl font-bold text-orange-800 mt-2">{stats.dietCompliance}%</p>
          <p className="text-sm text-orange-600">compatible meals</p>
        </div>
      </div>

      {stats.topFoods.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Most Analyzed Foods</h4>
          <div className="flex flex-wrap gap-3">
            {stats.topFoods.map((food, index) => (
              <span 
                key={index}
                className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium"
              >
                {food}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Smart Insights</h4>
        <div className="space-y-2 text-sm text-gray-700">
          {stats.avgHealthScore >= 15 && (
            <p className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              You're maintaining excellent food choices! Keep it up.
            </p>
          )}
          {stats.avgHealthScore < 10 && (
            <p className="flex items-center">
              <span className="text-orange-500 mr-2">⚠</span>
              Consider incorporating more nutritious ingredients in your meals.
            </p>
          )}
          {stats.dietCompliance >= 80 && (
            <p className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Great job staying consistent with your dietary preferences!
            </p>
          )}
          {stats.avgCalories > 700 && (
            <p className="flex items-center">
              <span className="text-blue-500 mr-2">ℹ</span>
              Your average meal is quite substantial. Consider portion control if weight management is a goal.
            </p>
          )}
          {stats.totalMeals >= 10 && (
            <p className="flex items-center">
              <span className="text-purple-500 mr-2">🏆</span>
              You're building great tracking habits! {stats.totalMeals} meals analyzed so far.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;