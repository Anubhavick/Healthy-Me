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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`rounded-xl max-w-md w-full p-8 relative backdrop-blur-sm border shadow-2xl ${
        isDarkMode 
          ? 'bg-gray-900/90 border-white/20 text-white' 
          : 'bg-white/90 border-white/30 text-gray-900'
      }`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 transition-colors ${
            isDarkMode 
              ? 'text-gray-400 hover:text-white' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-8">
          <div className="mb-6">
            <img 
              src="/artpicture.png" 
              alt="Healthy Food" 
              className="w-32 h-32 mx-auto rounded-full object-cover shadow-lg" 
            />
          </div>
          <h2 className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className={`mt-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {isLogin ? 'Sign in to access your nutrition history' : 'Join us to start tracking your nutrition'}
          </p>
        </div>

        {error && (
          <div className={`border px-4 py-3 rounded-lg mb-6 ${
            isDarkMode 
              ? 'bg-red-900/50 border-red-500/50 text-red-300' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {error}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg transition-colors focus:ring-2 focus:border-transparent ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-800/50 text-white placeholder-gray-400 focus:ring-purple-500' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-500'
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
              className={`w-full px-4 py-3 border rounded-lg transition-colors focus:ring-2 focus:border-transparent ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-800/50 text-white placeholder-gray-400 focus:ring-purple-500' 
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-500'
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
              className={`w-full px-4 py-3 border rounded-lg transition-colors focus:ring-2 focus:border-transparent ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-800/50 text-white placeholder-gray-400 focus:ring-purple-500' 
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-500'
              }`}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none ${
              isDarkMode 
                ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-lg' 
                : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 shadow-lg'
            }`}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Toggle between login/signup */}
        <div className="mt-6 text-center">
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className={`font-medium transition-colors ${
                isDarkMode 
                  ? 'text-purple-300 hover:text-purple-200' 
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
