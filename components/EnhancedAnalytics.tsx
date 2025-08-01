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

interface EnhancedAnalyticsProps {
  mealHistory: Meal[];
  userProfile: UserProfile | null;
}

const EnhancedAnalytics: React.FC<EnhancedAnalyticsProps> = ({ mealHistory, userProfile }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    generateChartData();
  }, [mealHistory, timeRange]);

  const generateChartData = () => {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const filteredMeals = mealHistory.filter(meal => 
      new Date(meal.timestamp) >= startDate
    );

    // Health Score Trend
    const healthScoreTrend = generateDailyData(filteredMeals, days, (dayMeals) => {
      const scores = dayMeals.map(m => m.healthScore);
      return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    });

    // Calorie Trend
    const calorieTrend = generateDailyData(filteredMeals, days, (dayMeals) => {
      return dayMeals.reduce((sum, meal) => sum + meal.analysis.estimatedCalories, 0);
    });

    // Diet Compatibility
    const compatibleMeals = filteredMeals.filter(m => m.analysis.dietCompatibility.isCompatible).length;
    const totalMeals = filteredMeals.length;

    // Most Common Ingredients
    const ingredientCounts: { [key: string]: number } = {};
    filteredMeals.forEach(meal => {
      meal.analysis.ingredients.forEach(ingredient => {
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

  if (!chartData) return <div>Loading analytics...</div>;

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
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };

  const calorieTargetData = userProfile?.goals?.dailyCalories ? {
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
      {
        label: 'Target',
        data: Array(chartData.labels.length).fill(userProfile.goals.dailyCalories),
        borderColor: 'rgb(239, 68, 68)',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false
      }
    ]
  } : calorieChartData;

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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Enhanced Analytics</h3>
          <SparklesIcon className="w-6 h-6 text-blue-500" />
        </div>
        
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '3 Months'}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Health Score Trend */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">📈 Health Score Trend</h4>
          <div className="h-64">
            <Line data={healthScoreChartData} options={chartOptions} />
          </div>
        </div>

        {/* Calorie Intake */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">🔥 Daily Calories</h4>
          <div className="h-64">
            {userProfile?.goals?.dailyCalories ? (
              <Line data={calorieTargetData} options={chartOptions} />
            ) : (
              <Bar data={calorieChartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Diet Compatibility */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">🎯 Diet Compatibility</h4>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48">
              <Doughnut 
                data={dietCompatibilityData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Top Ingredients */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">🥗 Most Common Ingredients</h4>
          <div className="h-64">
            <Bar 
              data={ingredientsData} 
              options={{
                ...chartOptions,
                indexAxis: 'y' as const,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default EnhancedAnalytics;
