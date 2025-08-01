import React, { useState } from 'react';
import { Meal, UserProfile } from '../types';
import { ExportService } from '../services/exportService';

interface SocialSharingProps {
  mealHistory: Meal[];
  userProfile: UserProfile | null;
}

const SocialSharing: React.FC<SocialSharingProps> = ({ mealHistory, userProfile }) => {
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(mealHistory[0] || null);

  const generateShareCard = async () => {
    if (!selectedMeal) return;
    
    setGenerating(true);
    try {
      const imageDataUrl = ExportService.generateMealCard(selectedMeal);
      setShareImage(imageDataUrl);
    } catch (error) {
      console.error('Error generating share card:', error);
    } finally {
      setGenerating(false);
    }
  };

  const shareToSocial = (platform: 'twitter' | 'facebook' | 'instagram' | 'whatsapp') => {
    if (!selectedMeal || !userProfile) return;
    
    const streak = userProfile.streak?.current || 0;
    const healthEmoji = selectedMeal.healthScore >= 16 ? '🌟' : selectedMeal.healthScore >= 12 ? '👍' : selectedMeal.healthScore >= 8 ? '🙂' : '💪';
    const text = `Just analyzed my ${selectedMeal.analysis.dishName} with Healthy Me! ${healthEmoji}\n\n🔥 ${selectedMeal.analysis.estimatedCalories} calories\n⭐ Health Score: ${selectedMeal.healthScore}/20\n🎯 ${streak} day healthy eating streak!\n\n#HealthyMe #NutritionTracking #HealthyEating`;

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      instagram: '' // Instagram doesn't support direct sharing via URL
    };

    if (platform === 'instagram') {
      // For Instagram, we'll copy the text and show instructions
      navigator.clipboard.writeText(text);
      alert('Caption copied! Open Instagram and paste when sharing your meal photo.');
      return;
    }

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const downloadShareCard = () => {
    if (!shareImage || !selectedMeal) return;
    
    const link = document.createElement('a');
    link.download = `healthy-me-${selectedMeal.analysis.dishName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = shareImage;
    link.click();
  };

  const copyShareText = () => {
    if (!selectedMeal) return;
    
    const text = `🥗 Just analyzed my ${selectedMeal.analysis.dishName} with Healthy Me!\n\n🔥 ${selectedMeal.analysis.estimatedCalories} calories\n⭐ Health Score: ${selectedMeal.healthScore}/20\n\nFeeling great about my healthy choices! 💚\n\n#HealthyMe #NutritionTracking`;
    
    navigator.clipboard.writeText(text);
    alert('Share text copied to clipboard!');
  };

  if (mealHistory.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">📱</span>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Meals to Share</h3>
          <p className="text-gray-600">Analyze some meals first, then come back to share your healthy choices!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Share Your Success</h3>
        <span className="text-2xl">📱</span>
      </div>

      <div className="space-y-6">
        
        {/* Meal Selection */}
        {mealHistory.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Meal to Share
            </label>
            <select
              value={selectedMeal?.id || ''}
              onChange={(e) => {
                const meal = mealHistory.find(m => m.id === e.target.value);
                setSelectedMeal(meal || null);
              }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {mealHistory.map((meal) => (
                <option key={meal.id} value={meal.id}>
                  {meal.analysis.dishName} - {new Date(meal.timestamp).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Meal Summary */}
        {selectedMeal && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-gray-800 mb-2">{selectedMeal.analysis.dishName}</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-orange-600">{selectedMeal.analysis.estimatedCalories}</p>
                <p className="text-sm text-gray-600">calories</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{selectedMeal.healthScore}/20</p>
                <p className="text-sm text-gray-600">health score</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{userProfile?.streak?.current || 0}</p>
                <p className="text-sm text-gray-600">day streak</p>
              </div>
            </div>
          </div>
        )}

        {/* Generate Share Card */}
        <div className="text-center">
          <button
            onClick={generateShareCard}
            disabled={generating}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
          >
            {generating ? 'Creating Share Card...' : '✨ Generate Share Card'}
          </button>
        </div>

        {/* Share Card Preview */}
        {shareImage && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <img 
                src={shareImage} 
                alt="Share card" 
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
            </div>
            
            <div className="flex justify-center space-x-2">
              <button
                onClick={downloadShareCard}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                📥 Download
              </button>
              <button
                onClick={copyShareText}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                📋 Copy Text
              </button>
            </div>
          </div>
        )}

        {/* Social Media Buttons */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Share on Social Media</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            
            <button
              onClick={() => shareToSocial('twitter')}
              className="flex items-center justify-center p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <span className="mr-2">🐦</span>
              Twitter
            </button>

            <button
              onClick={() => shareToSocial('facebook')}
              className="flex items-center justify-center p-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              <span className="mr-2">📘</span>
              Facebook
            </button>

            <button
              onClick={() => shareToSocial('instagram')}
              className="flex items-center justify-center p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              <span className="mr-2">📷</span>
              Instagram
            </button>

            <button
              onClick={() => shareToSocial('whatsapp')}
              className="flex items-center justify-center p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <span className="mr-2">💬</span>
              WhatsApp
            </button>

          </div>
        </div>

        {/* Achievement Badges */}
        {selectedMeal && userProfile && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">🏆 Share Your Achievements</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              
              {(userProfile.streak?.current || 0) >= 7 && (
                <div className="flex items-center text-yellow-700">
                  <span className="mr-2">🔥</span>
                  Week Warrior
                </div>
              )}
              
              {selectedMeal.healthScore >= 16 && (
                <div className="flex items-center text-yellow-700">
                  <span className="mr-2">⭐</span>
                  Nutrition Star
                </div>
              )}
              
              {selectedMeal.analysis.dietCompatibility.isCompatible && (
                <div className="flex items-center text-yellow-700">
                  <span className="mr-2">🎯</span>
                  Diet Champion
                </div>
              )}
              
              {selectedMeal.analysis.estimatedCalories <= 400 && (
                <div className="flex items-center text-yellow-700">
                  <span className="mr-2">🪶</span>
                  Light Eater
                </div>
              )}

            </div>
          </div>
        )}

        {/* Motivation Message */}
        <div className="text-center p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
          <p className="text-gray-700 font-medium">
            "Inspire others with your healthy choices! 💚"
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Sharing your progress motivates both you and your friends to stay healthy!
          </p>
        </div>

      </div>
    </div>
  );
};

export default SocialSharing;
