import React, { useRef } from 'react';
import { Meal, UserProfile } from '../types';
import html2canvas from 'html2canvas';

interface ShareCardGeneratorProps {
  meal: Meal;
  userProfile: UserProfile | null;
  onClose: () => void;
}

const ShareCardGenerator: React.FC<ShareCardGeneratorProps> = ({ meal, userProfile, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const getHealthScoreColor = (score: number) => {
    if (score >= 16) return { bg: 'bg-green-100', text: 'text-green-800', accent: 'bg-green-500' };
    if (score >= 12) return { bg: 'bg-yellow-100', text: 'text-yellow-800', accent: 'bg-yellow-500' };
    if (score >= 8) return { bg: 'bg-orange-100', text: 'text-orange-800', accent: 'bg-orange-500' };
    return { bg: 'bg-red-100', text: 'text-red-800', accent: 'bg-red-500' };
  };

  const getHealthLabel = (score: number) => {
    if (score >= 16) return 'Excellent Choice!';
    if (score >= 12) return 'Good Choice!';
    if (score >= 8) return 'Okay Choice';
    return 'Could Be Better';
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        allowTaint: true,
        width: cardRef.current.scrollWidth * 2,
        height: cardRef.current.scrollHeight * 2,
      });

      const link = document.createElement('a');
      link.download = `healthy-me-${meal.analysis.dishName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error generating share card:', error);
    }
  };

  const shareCard = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        allowTaint: true,
        width: cardRef.current.scrollWidth * 2,
        height: cardRef.current.scrollHeight * 2,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `healthy-me-${meal.analysis.dishName}.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Check out my healthy meal analysis!`,
            text: `I analyzed ${meal.analysis.dishName} and got a health score of ${meal.healthScore}/20! 🍽️✨`,
            files: [file]
          });
        } else {
          // Fallback - copy to clipboard or download
          downloadCard();
        }
      });
    } catch (error) {
      console.error('Error sharing card:', error);
      downloadCard();
    }
  };

  const colors = getHealthScoreColor(meal.healthScore);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Share Your Success</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Share Card Preview */}
        <div className="p-6">
          <div ref={cardRef} className="relative w-full bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 rounded-3xl overflow-hidden shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-300 rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-300 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-200 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16">
                    <img src="/logo.svg" alt="Healthy Me Logo" className="w-full h-full" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent mb-2">
                  Healthy Me
                </h1>
                <p className="text-gray-600 font-medium">Smart Nutrition Analysis</p>
              </div>

              {/* Main Content */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                {/* Meal Info */}
                <div className="text-center mb-6">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg">
                    <img 
                      src={meal.imageDataUrl} 
                      alt={meal.analysis.dishName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{meal.analysis.dishName}</h2>
                  <p className="text-gray-600">{new Date(meal.timestamp).toLocaleDateString()}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="text-2xl font-bold text-blue-700">{meal.analysis.estimatedCalories}</div>
                    <div className="text-sm text-blue-600 font-medium">Calories</div>
                  </div>
                  <div className={`text-center p-4 ${colors.bg} rounded-xl border ${colors.bg.replace('bg-', 'border-')}`}>
                    <div className={`text-2xl font-bold ${colors.text}`}>{meal.healthScore}/20</div>
                    <div className={`text-sm ${colors.text} font-medium`}>Health Score</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="text-2xl font-bold text-purple-700">{meal.analysis.ingredients.length}</div>
                    <div className="text-sm text-purple-600 font-medium">Ingredients</div>
                  </div>
                </div>

                {/* Health Assessment */}
                <div className={`${colors.bg} rounded-xl p-4 border ${colors.bg.replace('bg-', 'border-')} text-center mb-6`}>
                  <div className="flex items-center justify-center mb-2">
                    <div className={`w-3 h-3 ${colors.accent} rounded-full mr-2`}></div>
                    <span className={`font-bold ${colors.text}`}>{getHealthLabel(meal.healthScore)}</span>
                  </div>
                  <p className={`text-sm ${colors.text}`}>
                    {meal.analysis.dietCompatibility.isCompatible ? '✅ Diet Compatible' : '⚠️ Check Diet Compatibility'}
                  </p>
                </div>

                {/* User Attribution */}
                {userProfile && (
                  <div className="text-center text-gray-500 text-sm">
                    Analyzed by {userProfile.displayName || userProfile.email}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center mt-6 text-gray-500 text-sm">
                <p>Transform your nutrition journey with smart insights</p>
                <p className="font-medium">🔗 Get the app: Healthy Me</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={downloadCard}
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-full hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
            <button
              onClick={shareCard}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-6 rounded-full hover:from-emerald-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Share Now
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-4">
            Share your healthy choices and inspire others! 🌟
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareCardGenerator;
