import React, { useState } from 'react';
import { UserProfile } from '../types';

interface StreakGoalsProps {
  userProfile: UserProfile;
  onGoalsUpdate: (goals: UserProfile['goals']) => void;
  onStreakUpdate: (streak: UserProfile['streak']) => void;
}

const StreakGoals: React.FC<StreakGoalsProps> = ({ userProfile, onGoalsUpdate, onStreakUpdate }) => {
  const [editingGoals, setEditingGoals] = useState(false);
  const [goals, setGoals] = useState(userProfile.goals);

  const handleSaveGoals = () => {
    onGoalsUpdate(goals);
    setEditingGoals(false);
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Start your healthy eating journey today! 🌱";
    if (streak === 1) return "Great start! Keep the momentum going! 💪";
    if (streak < 7) return `${streak} days strong! You're building a habit! 🔥`;
    if (streak < 30) return `${streak} days streak! You're doing amazing! ⭐`;
    return `${streak} days streak! You're a nutrition champion! 🏆`;
  };

  const getStreakEmoji = (streak: number) => {
    if (streak === 0) return "🌱";
    if (streak < 7) return "🔥";
    if (streak < 30) return "⭐";
    return "🏆";
  };

  return (
    <div className="space-y-6">
      
      {/* Streak Counter */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl shadow-lg border border-orange-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Healthy Eating Streak</h3>
          <span className="text-3xl">{getStreakEmoji(userProfile.streak.current)}</span>
        </div>
        
        <div className="text-center">
          <div className="text-6xl font-bold text-orange-600 mb-2">
            {userProfile.streak.current}
          </div>
          <p className="text-lg text-orange-700 mb-2">
            {userProfile.streak.current === 1 ? 'Day' : 'Days'}
          </p>
          <p className="text-sm text-orange-600">
            {getStreakMessage(userProfile.streak.current)}
          </p>
        </div>

        {userProfile.streak.best > 0 && (
          <div className="mt-4 pt-4 border-t border-orange-200">
            <div className="flex justify-between items-center text-sm">
              <span className="text-orange-700">Best Streak:</span>
              <span className="font-bold text-orange-800">{userProfile.streak.best} days 🎯</span>
            </div>
          </div>
        )}

        {userProfile.streak.lastMealDate && (
          <div className="mt-2">
            <div className="flex justify-between items-center text-xs text-orange-600">
              <span>Last meal:</span>
              <span>{new Date(userProfile.streak.lastMealDate).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Goals Setting */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Daily Goals</h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎯</span>
            {!editingGoals ? (
              <button
                onClick={() => setEditingGoals(true)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Edit Goals
              </button>
            ) : (
              <div className="space-x-2">
                <button
                  onClick={handleSaveGoals}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingGoals(false)}
                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Daily Calories Goal */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">🔥</span>
              <h4 className="font-semibold text-blue-800">Daily Calories</h4>
            </div>
            {editingGoals ? (
              <input
                type="number"
                value={goals.dailyCalories || ''}
                onChange={(e) => setGoals({...goals, dailyCalories: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="2000"
              />
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {goals.dailyCalories || 'Not set'}
              </div>
            )}
          </div>

          {/* Health Score Goal */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">⭐</span>
              <h4 className="font-semibold text-green-800">Health Score</h4>
            </div>
            {editingGoals ? (
              <input
                type="number"
                min="1"
                max="20"
                value={goals.targetHealthScore || ''}
                onChange={(e) => setGoals({...goals, targetHealthScore: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="15"
              />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {goals.targetHealthScore ? `${goals.targetHealthScore}/20` : 'Not set'}
              </div>
            )}
          </div>

          {/* Target Weight Goal */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">⚖️</span>
              <h4 className="font-semibold text-purple-800">Target Weight</h4>
            </div>
            {editingGoals ? (
              <input
                type="number"
                value={goals.targetWeight || ''}
                onChange={(e) => setGoals({...goals, targetWeight: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="70"
              />
            ) : (
              <div className="text-2xl font-bold text-purple-600">
                {goals.targetWeight ? `${goals.targetWeight} kg` : 'Not set'}
              </div>
            )}
          </div>

        </div>

        {/* Goal Progress Indicators */}
        {!editingGoals && (goals.dailyCalories || goals.targetHealthScore) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Today's Progress</h4>
            <div className="space-y-3">
              
              {goals.dailyCalories && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Calories</span>
                    <span>0 / {goals.dailyCalories}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '0%'}}></div>
                  </div>
                </div>
              )}

              {goals.targetHealthScore && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Health Score</span>
                    <span>0 / {goals.targetHealthScore}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '0%'}}></div>
                  </div>
                </div>
              )}

            </div>
            <p className="text-xs text-gray-500 mt-2">
              Progress will update as you analyze meals today
            </p>
          </div>
        )}

      </div>

      {/* Motivation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">💡</span>
            <h4 className="font-semibold text-gray-800">Pro Tip</h4>
          </div>
          <p className="text-sm text-gray-700">
            Consistency beats perfection! Aim to analyze at least one meal daily to maintain your streak.
          </p>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">🏆</span>
            <h4 className="font-semibold text-gray-800">Achievement</h4>
          </div>
          <p className="text-sm text-gray-700">
            {userProfile.streak.current >= 7 
              ? "You're building a strong healthy habit! Keep going!" 
              : "Reach a 7-day streak to unlock the Habit Builder badge!"}
          </p>
        </div>

      </div>

    </div>
  );
};

export default StreakGoals;
