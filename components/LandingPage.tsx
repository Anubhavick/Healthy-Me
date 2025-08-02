import React from 'react';
import ShinyText from './ShinyText';
import Carousel from './Carousel';

interface LandingPageProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  onGetStarted, 
  onTryDemo, 
  isDarkMode, 
  onToggleDarkMode 
}) => {
  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100'
    }`}>
      {/* Navigation Header */}
      <nav className={`flex items-center justify-between p-6 backdrop-blur-sm border-b ${
        isDarkMode 
          ? 'bg-white/10 border-white/20' 
          : 'bg-white/70 border-gray-200/50'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 flex items-center justify-center rounded-lg p-1 ${
            isDarkMode ? 'bg-white/20 backdrop-blur-sm' : 'bg-blue-600/10 backdrop-blur-sm'
          }`}>
            <img 
              src="/logo.svg" 
              alt="Healthy Me Logo" 
              className={`w-full h-full ${isDarkMode ? '' : 'filter hue-rotate-200 saturate-150'}`} 
            />
          </div>
          <span className={`font-semibold text-xl ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Healthy Me
          </span>
        </div>
        
        <div className="flex items-center space-x-6">
          <button className={`transition-colors duration-200 font-medium ${
            isDarkMode 
              ? 'text-white/80 hover:text-white' 
              : 'text-gray-600 hover:text-gray-800'
          }`}>
            Home
          </button>
          <button className={`transition-colors duration-200 font-medium ${
            isDarkMode 
              ? 'text-white/80 hover:text-white' 
              : 'text-gray-600 hover:text-gray-800'
          }`}>
            Docs
          </button>
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-lg transition-all duration-200 backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-white/10 hover:bg-white/20' 
                : 'bg-blue-100/50 hover:bg-blue-200/50'
            }`}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className={`text-5xl md:text-7xl font-bold mb-8 leading-tight ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Bring the{' '}
            <span className={`bg-clip-text text-transparent ${
              isDarkMode 
                ? 'bg-gradient-to-r from-slate-300 to-gray-300' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}>
              <ShinyText text="Healthy Life" speed={4} />
            </span>{' '}
            to you, with
          </h1>
          <h2 className={`text-5xl md:text-7xl font-bold mb-12 leading-tight ${
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <button
              onClick={onGetStarted}
              className={`px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg min-w-[200px] ${
                isDarkMode 
                  ? 'bg-white text-gray-900 hover:bg-gray-100' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Get Started
            </button>
            <button
              onClick={onTryDemo}
              className={`px-8 py-4 bg-transparent border-2 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 min-w-[200px] ${
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
        <div className="flex justify-center mt-20">
          <Carousel
            baseWidth={400}
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
