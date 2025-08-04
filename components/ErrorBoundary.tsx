import React from 'react';

interface ErrorFallbackProps {
  error?: Error;
  isDarkMode?: boolean;
  onReset?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  isDarkMode = false, 
  onReset 
}) => {
  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full rounded-2xl p-8 text-center shadow-2xl border ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700 text-white' 
          : 'bg-white border-gray-200 text-gray-800'
      }`}>
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className={`text-2xl font-bold mb-4 ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          Oops! Something went wrong
        </h2>
        <p className={`mb-6 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          The app encountered an unexpected error. Don't worry - this won't affect your saved data.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleReset}
            className={`w-full py-3 px-6 rounded-xl font-medium transition-colors ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            🔄 Restart App
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className={`w-full py-3 px-6 rounded-xl font-medium transition-colors border ${
              isDarkMode 
                ? 'border-gray-600 hover:bg-gray-700 text-gray-300' 
                : 'border-gray-300 hover:bg-gray-100 text-gray-700'
            }`}
          >
            🏠 Go Home
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className={`mt-6 text-left text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <summary className="cursor-pointer font-medium">
              Technical Details (Dev Mode)
            </summary>
            <pre className="mt-2 p-3 rounded bg-gray-900 text-green-400 text-xs overflow-auto max-h-40">
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

// Simple error boundary wrapper
interface ErrorBoundaryProps {
  children: React.ReactNode;
  isDarkMode?: boolean;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, isDarkMode }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Error in app:', error);
    return <ErrorFallback error={error instanceof Error ? error : undefined} isDarkMode={isDarkMode} />;
  }
};

export default ErrorBoundary;
