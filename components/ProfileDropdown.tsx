import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import DarkModeIcon from './DarkModeIcon';

interface ProfileDropdownProps {
  user: any;
  userProfile: UserProfile | null;
  mealHistoryCount: number;
  isDarkMode: boolean;
  onShowHistory: () => void;
  onShowAnalytics: () => void;
  onShowGoals: () => void;
  onShowSettings: () => void;
  onShowProfileEdit: () => void;
  onShowChat: () => void;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  userProfile,
  mealHistoryCount,
  isDarkMode,
  onShowHistory,
  onShowAnalytics,
  onShowGoals,
  onShowSettings,
  onShowProfileEdit,
  onShowChat,
  onToggleDarkMode,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = () => {
    if (userProfile?.name) {
      return userProfile.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getProfileImage = () => {
    return user?.photoURL || null;
  };

  const getUserName = () => {
    return userProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'User';
  };

  const getUserEmail = () => {
    return user?.email || 'demo@example.com';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        {getProfileImage() ? (
          <img
            src={getProfileImage()}
            alt="Profile"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-white font-bold text-sm">
            {getInitials()}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-2xl border py-2 z-50 animate-in slide-in-from-top-2 duration-200`}>
          {/* User Info Section */}
          <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-100 bg-gradient-to-r from-gray-50 to-white'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                {getProfileImage() ? (
                  <img
                    src={getProfileImage()}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold">
                    {getInitials()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} text-sm truncate`}>
                  👋 {getUserName()}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                  {getUserEmail()}
                </p>
                {userProfile && (
                  <p className="text-xs text-emerald-400 font-medium">
                    {userProfile.age ? `${userProfile.age} years` : ''} 
                    {userProfile.age && userProfile.gender ? ' • ' : ''}
                    {userProfile.gender ? userProfile.gender : ''}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className={`px-4 py-2 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'}`}>
            <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <span>Meals Analyzed: {mealHistoryCount}</span>
              {userProfile?.currentStreak && (
                <span>🔥 {userProfile.currentStreak} day streak</span>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Navigation Items */}
            <button
              onClick={() => {
                onShowHistory();
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-blue-900/50' : 'hover:bg-blue-50'} transition-colors duration-150 flex items-center space-x-3 text-sm`}
            >
              <DarkModeIcon src="/history-svgrepo-com.svg" alt="History" className="w-5 h-5" isDarkMode={isDarkMode} />
              <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Meal History</span>
              <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                {mealHistoryCount}
              </span>
            </button>

            <button
              onClick={() => {
                onShowAnalytics();
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-emerald-900/50' : 'hover:bg-emerald-50'} transition-colors duration-150 flex items-center space-x-3 text-sm`}
            >
              <DarkModeIcon src="/analytics-svgrepo-com.svg" alt="Analytics" className="w-5 h-5" isDarkMode={isDarkMode} />
              <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Analytics</span>
            </button>

            <button
              onClick={() => {
                onShowGoals();
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-orange-900/50' : 'hover:bg-orange-50'} transition-colors duration-150 flex items-center space-x-3 text-sm`}
            >
              <DarkModeIcon src="/goals and streak.svg" alt="Goals" className="w-5 h-5" isDarkMode={isDarkMode} />
              <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Goals & Streaks</span>
            </button>

            <button
              onClick={() => {
                onShowChat();
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-green-900/50' : 'hover:bg-green-50'} transition-colors duration-150 flex items-center space-x-3 text-sm`}
            >
              <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Chat Assistant</span>
              <span className="ml-auto text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                AI
              </span>
            </button>

            <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} my-1`}></div>

            {/* Profile & Settings */}
            <button
              onClick={() => {
                onShowProfileEdit();
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-purple-900/50' : 'hover:bg-purple-50'} transition-colors duration-150 flex items-center space-x-3 text-sm`}
            >
              <DarkModeIcon src="/profile-round-1342-svgrepo-com.svg" alt="Profile" className="w-5 h-5" isDarkMode={isDarkMode} />
              <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Edit Profile</span>
            </button>

            <button
              onClick={() => {
                onShowSettings();
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-150 flex items-center space-x-3 text-sm`}
            >
              <DarkModeIcon src="/setting-1-svgrepo-com.svg" alt="Settings" className="w-5 h-5" isDarkMode={isDarkMode} />
              <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Settings</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => {
                onToggleDarkMode();
                // Don't close dropdown for dark mode toggle
              }}
              className={`w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-150 flex items-center space-x-3 text-sm`}
            >
              <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{isDarkMode ? '☀️' : '🌙'}</span>
              <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
              <div className="ml-auto">
                <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                  isDarkMode ? 'bg-emerald-500' : 'bg-gray-300'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 mt-1 ${
                    isDarkMode ? 'translate-x-5' : 'translate-x-1'
                  }`}></div>
                </div>
              </div>
            </button>

            <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} my-1`}></div>

            {/* Logout */}
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-red-900/50' : 'hover:bg-red-50'} transition-colors duration-150 flex items-center space-x-3 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
            >
              <DarkModeIcon src="/sign-out-svgrepo-com.svg" alt="Sign Out" className="w-5 h-5" isDarkMode={isDarkMode} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
