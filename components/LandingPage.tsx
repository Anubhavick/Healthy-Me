import React from 'react';
import ShinyText from './ShinyText';
import Carousel from './Carousel';

interface LandingPageProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
  onHome?: () => void;
  onDocs?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  onGetStarted, 
  onTryDemo, 
  onHome,
  onDocs,
  isDarkMode, 
  onToggleDarkMode 
}) => {
  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100'
    }`}>
      {/* Floating Navigation Header */}
      <div className="w-full px-3 sm:px-6 pt-3 sm:pt-6">
        <nav className={`flex items-center justify-between p-3 sm:p-6 rounded-2xl backdrop-blur-md border shadow-lg ${
          isDarkMode 
            ? 'bg-white/10 border-white/20 shadow-black/20' 
            : 'bg-white/80 border-gray-200/30 shadow-gray-500/10'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl p-1.5 ${
              isDarkMode ? 'bg-white/20 backdrop-blur-sm' : 'bg-blue-600/10 backdrop-blur-sm'
            }`}>
              <img 
                src="/logo.svg" 
                alt="Healthy Me Logo" 
                className={`w-full h-full ${isDarkMode ? '' : 'filter hue-rotate-200 saturate-150'}`} 
              />
            </div>
            <div className="flex flex-col">
              <span className={`font-bold text-lg sm:text-xl leading-tight ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Healthy Me
              </span>
              <p className={`text-xs sm:text-sm font-medium leading-tight ${
                isDarkMode ? 'text-white/70' : 'text-gray-600'
              }`}>
                Smart Nutrition Analysis
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button 
              onClick={onHome}
              className={`px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDarkMode 
                  ? 'text-white/80 hover:text-white hover:bg-white/10 focus:ring-white/20' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 focus:ring-gray-300'
              }`}
              aria-label="Go to Home"
            >
              Home
            </button>
            <button 
              onClick={onDocs}
              className={`px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDarkMode 
                  ? 'text-white/80 hover:text-white hover:bg-white/10 focus:ring-white/20' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 focus:ring-gray-300'
              }`}
              aria-label="Go to Documentation"
            >
              Docs
            </button>
            <button
              onClick={onToggleDarkMode}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-inner flex items-center ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 focus:ring-blue-500 shadow-blue-500/20' 
                  : 'bg-gradient-to-r from-gray-200 to-gray-300 focus:ring-gray-400 shadow-gray-400/20'
              }`}
              aria-label="Toggle dark mode"
            >
              <div className={`absolute w-5 h-5 bg-white rounded-full shadow-lg transform transition-all duration-300 flex items-center justify-center ${
                isDarkMode ? 'translate-x-7' : 'translate-x-1'
              } hover:scale-110`}>
                <span className="text-xs leading-none">
                  {isDarkMode ? '🌙' : '☀️'}
                </span>
              </div>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 sm:px-6 pt-4 sm:pt-8">
        <div className="text-center max-w-5xl mx-auto">
          <h1 className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 md:mb-8 leading-tight ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Bring the{' '}
            <span className={`bg-clip-text text-transparent ${
              isDarkMode 
                ? 'bg-gradient-to-r from-slate-300 to-gray-300' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}>
              <ShinyText text="Healthy Life" speed={4} />
            </span>
            <br className="hidden sm:inline" />
            <span className="sm:hidden"> </span>
            to you, with
          </h1>
          <h2 className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 md:mb-12 leading-tight ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            one line of{' '}
            <span className={`bg-clip-text text-transparent ${
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-300 to-cyan-300' 
                : 'bg-gradient-to-r from-purple-600 to-pink-600'
            }`}>
              <ShinyText text="nutrition" speed={5} />
            </span>
          </h2>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-6 sm:mt-8 md:mt-12 max-w-md sm:max-w-none mx-auto">
            <button
              onClick={onGetStarted}
              className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg min-w-[200px] ${
                isDarkMode 
                  ? 'bg-white text-gray-900 hover:bg-gray-100' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Get Started
            </button>
            <button
              onClick={onTryDemo}
              className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 min-w-[200px] ${
                isDarkMode 
                  ? 'border-white text-white hover:bg-white/10' 
                  : 'border-blue-300 text-blue-700 hover:bg-blue-50'
              }`}
            >
              Try Demo
            </button>
          </div>
        </div>

        {/* Feature Carousel */}
        <div className="flex justify-center mt-8 sm:mt-12 md:mt-16 lg:mt-20 px-2 sm:px-4 w-full max-w-6xl">
          <Carousel
            baseWidth={280}
            autoplay={true}
            autoplayDelay={4000}
            pauseOnHover={true}
            loop={true}
            round={false}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
