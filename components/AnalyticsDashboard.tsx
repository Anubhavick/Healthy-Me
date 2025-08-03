import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Meal, UserProfile } from '../types';
import { HealthScoreService } from '../services/healthScoreService';
import { SparklesIcon } from './icons';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface NutritionStats {
  totalMeals: number;
  avgCalories: number;
  topFoods: string[];
  avgHealthScore: number;
  dietCompliance: number;
  totalCalories: number;
}

interface AnalyticsDashboardProps {
  mealHistory: Meal[];
  userProfile?: UserProfile | null;
  mode?: 'simple' | 'enhanced';
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  mealHistory, 
  userProfile = null, 
  mode = 'simple' 
}) => {
  const [stats, setStats] = useState<NutritionStats>({
    totalMeals: 0,
    avgCalories: 0,
    topFoods: [],
    avgHealthScore: 0,
    dietCompliance: 0,
    totalCalories: 0
  });
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [chartData, setChartData] = useState<any>(null);

  const generateDailyData = (meals: Meal[], days: number, aggregator: (dayMeals: Meal[]) => number) => {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayMeals = meals.filter(meal => {
        const mealDate = new Date(meal.timestamp);
        return mealDate >= dayStart && mealDate < dayEnd;
      });
      
      data.push(aggregator(dayMeals));
    }
    
    return data;
  };

  const generateDateLabels = (days: number) => {
    const labels = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    
    return labels;
  };

  const generateChartData = () => {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const filteredMeals = mealHistory.filter(meal => 
      new Date(meal.timestamp) >= startDate
    );

    const healthScoreTrend = generateDailyData(filteredMeals, days, (dayMeals) => {
      const scores = dayMeals.map(m => HealthScoreService.calculateHealthScore(m.analysis));
      return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    });

    const calorieTrend = generateDailyData(filteredMeals, days, (dayMeals) => {
      return dayMeals.reduce((sum, meal) => sum + (meal.analysis?.estimatedCalories || 0), 0);
    });

    const compatibleMeals = filteredMeals.filter(m => m.analysis?.dietCompatibility?.isCompatible).length;
    const totalMeals = filteredMeals.length;

    const ingredientCounts: { [key: string]: number } = {};
    filteredMeals.forEach(meal => {
      meal.analysis?.ingredients?.forEach((ingredient: string) => {
        ingredientCounts[ingredient] = (ingredientCounts[ingredient] || 0) + 1;
      });
    });

    const topIngredients = Object.entries(ingredientCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8);

    setChartData({
      healthScoreTrend,
      calorieTrend,
      dietCompatibility: {
        compatible: compatibleMeals,
        incompatible: totalMeals - compatibleMeals
      },
      topIngredients,
      labels: generateDateLabels(days)
    });
  };

  useEffect(() => {
    if (mealHistory.length > 0) {
      const totalCalories = mealHistory.reduce((sum, meal) => sum + (meal.analysis?.estimatedCalories || 0), 0);
      const avgCalories = Math.round(totalCalories / mealHistory.length);
      
      const healthScores = mealHistory.map(meal => HealthScoreService.calculateHealthScore(meal.analysis));
      const avgHealthScore = Math.round(healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length);
      
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

      if (mode === 'enhanced') {
        generateChartData();
      }
    }
  }, [mealHistory, timeRange, mode]);

  const getHealthScoreColor = (score: number) => {
    return HealthScoreService.getHealthScoreColor(score);
  };

  const getHealthScoreLabel = (score: number) => {
    return HealthScoreService.getHealthScoreLabel(score);
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

  if (mode === 'enhanced') {
    if (!chartData) return <div>Loading enhanced analytics...</div>;

    const healthScoreChartData = {
      labels: chartData.labels,
      datasets: [
        {
          label: 'Health Score',
          data: chartData.healthScoreTrend,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true
        },
        ...(userProfile?.goals?.targetHealthScore ? [{
          label: 'Target',
          data: Array(chartData.labels.length).fill(userProfile.goals.targetHealthScore),
          borderColor: 'rgb(239, 68, 68)',
          borderDash: [5, 5],
          pointRadius: 0
        }] : [])
      ]
    };

    const calorieChartData = {
      labels: chartData.labels,
      datasets: [
        {
          label: 'Daily Calories',
          data: chartData.calorieTrend,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        ...(userProfile?.goals?.dailyCalories ? [{
          label: 'Target',
          data: Array(chartData.labels.length).fill(userProfile.goals.dailyCalories),
          borderColor: 'rgb(239, 68, 68)',
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }] : [])
      ]
    };

    const dietCompatibilityData = {
      labels: ['Compatible', 'Needs Attention'],
      datasets: [{
        data: [chartData.dietCompatibility.compatible, chartData.dietCompatibility.incompatible],
        backgroundColor: ['#10B981', '#F59E0B'],
        borderWidth: 0
      }]
    };

    const ingredientsData = {
      labels: chartData.topIngredients.map(([ingredient]: [string, number]) => ingredient),
      datasets: [{
        label: 'Frequency',
        data: chartData.topIngredients.map(([, count]: [string, number]) => count),
        backgroundColor: [
          '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
          '#EF4444', '#06B6D4', '#84CC16', '#F97316'
        ]
      }]
    };

    return (
      <div className="space-y-8">
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Health Score Trend</h3>
            <Line data={healthScoreChartData} options={{
              responsive: true,
              scales: { y: { beginAtZero: true, max: 20 } }
            }} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Calories</h3>
            <Line data={calorieChartData} options={{
              responsive: true,
              scales: { y: { beginAtZero: true } }
            }} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Diet Compatibility</h3>
            <Doughnut data={dietCompatibilityData} options={{
              responsive: true,
              plugins: { legend: { position: 'bottom' } }
            }} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Common Ingredients</h3>
            <Bar data={ingredientsData} options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } }
            }} />
          </div>
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
