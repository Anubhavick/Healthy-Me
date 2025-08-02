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
        : 'bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600'
    }`}>
      {/* Navigation Header */}
      <nav className="flex items-center justify-between p-6 backdrop-blur-sm bg-white/10 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 flex items-center justify-center rounded-lg p-1 ${
            isDarkMode ? 'bg-white/20 backdrop-blur-sm' : 'bg-white/10'
          }`}>
            <img 
              src="/logo.svg" 
              alt="Healthy Me Logo" 
              className={`w-full h-full ${isDarkMode ? '' : 'filter brightness-0 invert'}`} 
            />
          </div>
          <span className="text-white font-semibold text-xl">
            Healthy Me
          </span>
        </div>
        
        <div className="flex items-center space-x-6">
          <button className="text-white/80 hover:text-white transition-colors duration-200 font-medium">
            Home
          </button>
          <button className="text-white/80 hover:text-white transition-colors duration-200 font-medium">
            Docs
          </button>
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Bring the{' '}
            <span className={`bg-clip-text text-transparent ${
              isDarkMode 
                ? 'bg-gradient-to-r from-slate-300 to-gray-300' 
                : 'bg-gradient-to-r from-emerald-300 to-cyan-300'
            }`}>
              <ShinyText text="Healthy Life" speed={4} />
            </span>{' '}
            to you, with
          </h1>
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-12 leading-tight">
            one line of{' '}
            <span className={`bg-clip-text text-transparent ${
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-300 to-cyan-300' 
                : 'bg-gradient-to-r from-purple-300 to-pink-300'
            }`}>
              <ShinyText text="nutrition" speed={5} />
            </span>
          </h2>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg min-w-[200px]"
            >
              Get Started
            </button>
            <button
              onClick={onTryDemo}
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-300 transform hover:scale-105 min-w-[200px]"
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
          />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
