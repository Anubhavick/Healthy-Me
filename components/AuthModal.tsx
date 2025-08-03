import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (userData: any) => void;
  isDarkMode?: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthSuccess, isDarkMode = false }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      let result;
      if (isLogin) {
        result = await signInWithEmailAndPassword(auth, email, password);
      } else {
        result = await createUserWithEmailAndPassword(auth, email, password);
      }
      
      const userData = {
        id: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || name || email.split('@')[0],
        provider: 'email'
      };
      
      onAuthSuccess(userData);
    } catch (err: any) {
      console.error('Email auth error:', err);
      setError(err.message || `Failed to ${isLogin ? 'sign in' : 'sign up'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4 transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100'
    }`}>
      
      {/* Floating Navigation Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-6 pt-4 sm:pt-6">
        <nav className={`flex items-center justify-between p-4 sm:p-6 rounded-2xl backdrop-blur-md border shadow-lg ${
          isDarkMode 
            ? 'bg-white/10 border-white/20 shadow-black/20' 
            : 'bg-white/80 border-gray-200/30 shadow-gray-500/10'
        }`}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg p-1 ${
              isDarkMode ? 'bg-white/20 backdrop-blur-sm' : 'bg-blue-600/10 backdrop-blur-sm'
            }`}>
              <img 
                src="/logo.svg" 
                alt="Healthy Me Logo" 
                className={`w-full h-full ${isDarkMode ? '' : 'filter hue-rotate-200 saturate-150'}`} 
              />
            </div>
            <span className={`font-semibold text-lg sm:text-xl ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Healthy Me
            </span>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-6">
            <button 
              onClick={onClose}
              className={`transition-colors duration-200 font-medium text-sm sm:text-base ${
                isDarkMode 
                  ? 'text-white/80 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="hidden sm:inline">← Back</span>
              <span className="sm:hidden">← Back</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main content card */}
      <div className={`backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl max-w-sm sm:max-w-md w-full relative z-10 mt-16 sm:mt-20 border ${
        isDarkMode 
          ? 'bg-white/10 border-white/20' 
          : 'bg-white/80 border-blue-200/50'
      }`}>
        
        {/* Header section with image */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mb-6">
            <img 
              src="/artpicture.png" 
              alt="Healthy Food" 
              className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full object-cover shadow-lg" 
            />
          </div>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 tracking-tight ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed font-medium ${
            isDarkMode ? 'text-white/80' : 'text-gray-600'
          }`}>
            {isLogin ? 'Sign in to access your nutrition history' : 'Join us to start tracking your nutrition'}
          </p>
        </div>

        {error && (
          <div className={`backdrop-blur-sm rounded-xl p-4 mb-6 border ${
            isDarkMode 
              ? 'bg-red-900/30 border-red-500/30 text-red-300' 
              : 'bg-red-50/80 border-red-200/50 text-red-700'
          }`}>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4 sm:space-y-5">
          {!isLogin && (
            <div>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-3 sm:py-4 border rounded-2xl backdrop-blur-sm transition-all duration-300 focus:ring-2 focus:border-transparent ${
                  isDarkMode 
                    ? 'border-white/20 bg-white/10 text-white placeholder-white/50 focus:ring-white/30 focus:bg-white/20' 
                    : 'border-blue-200/50 bg-white/60 text-gray-900 placeholder-gray-500 focus:ring-blue-500/50 focus:bg-white/80'
                }`}
                disabled={loading}
              />
            </div>
          )}
          
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 sm:py-4 border rounded-2xl backdrop-blur-sm transition-all duration-300 focus:ring-2 focus:border-transparent ${
                isDarkMode 
                  ? 'border-white/20 bg-white/10 text-white placeholder-white/50 focus:ring-white/30 focus:bg-white/20' 
                  : 'border-blue-200/50 bg-white/60 text-gray-900 placeholder-gray-500 focus:ring-blue-500/50 focus:bg-white/80'
              }`}
              disabled={loading}
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 sm:py-4 border rounded-2xl backdrop-blur-sm transition-all duration-300 focus:ring-2 focus:border-transparent ${
                isDarkMode 
                  ? 'border-white/20 bg-white/10 text-white placeholder-white/50 focus:ring-white/30 focus:bg-white/20' 
                  : 'border-blue-200/50 bg-white/60 text-gray-900 placeholder-gray-500 focus:ring-blue-500/50 focus:bg-white/80'
              }`}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center ${
              isDarkMode 
                ? 'bg-white/20 border border-white/30 text-white hover:bg-white/30 backdrop-blur-sm' 
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600'
            } ${loading ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span className="text-sm sm:text-base">
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </span>
          </button>
        </form>

        {/* Toggle between login/signup */}
        <div className="mt-6 text-center">
          <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className={`font-semibold transition-colors ${
                isDarkMode 
                  ? 'text-white hover:text-white/80' 
                  : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
