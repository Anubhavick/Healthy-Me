import React, { useState } from 'react';
import { firebaseService } from '../services/firebaseService';

interface FirebaseSyncProps {
  onSyncComplete: (meals: any[]) => void;
  isDarkMode?: boolean;
}

const FirebaseSync: React.FC<FirebaseSyncProps> = ({ onSyncComplete, isDarkMode = false }) => {
  const [issyncing, setIssyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleSync = async () => {
    setIssyncing(true);
    setSyncStatus('Connecting to Firebase...');
    setSyncResult(null);

    try {
      setSyncStatus('Syncing data...');
      const result = await firebaseService.syncMeals();
      
      setSyncResult(result);
      if (result.errors.length === 0) {
        setSyncStatus('✅ Sync successful!');
        
        // Refresh meal history from Firebase
        const meals = await firebaseService.getMeals();
        onSyncComplete(meals);
      } else {
        setSyncStatus('⚠️ Sync completed with errors');
      }
    } catch (error) {
      console.error('Firebase sync error:', error);
      setSyncStatus('❌ Sync failed - Check Firebase permissions');
      setSyncResult({ 
        uploaded: 0, 
        downloaded: 0, 
        errors: [
          'Firebase permission denied. Please update Firestore rules:',
          'Go to Firebase Console → Firestore → Rules',
          'Set: allow read, write: if true;'
        ] 
      });
    } finally {
      setIssyncing(false);
    }
  };

  return (
    <div className={`${isDarkMode ? 'bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-600' : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'} rounded-xl border p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${isDarkMode ? 'bg-orange-800' : 'bg-orange-100'} rounded-full flex items-center justify-center`}>
            🔥
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-orange-300' : 'text-orange-800'}`}>Firebase Cloud Sync</h3>
            <p className={`text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>Real-time data synchronization</p>
          </div>
        </div>
        
        <button
          onClick={handleSync}
          disabled={issyncing}
          className={`px-6 py-3 ${isDarkMode ? 'bg-orange-700 hover:bg-orange-600' : 'bg-orange-600 hover:bg-orange-700'} text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold flex items-center gap-2 transition-all`}
        >
          {issyncing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Syncing...
            </>
          ) : (
            <>
              <span>🔄</span>
              Sync Now
            </>
          )}
        </button>
      </div>

      {syncStatus && (
        <div className="mb-3">
          <p className={`text-sm font-medium ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>{syncStatus}</p>
        </div>
      )}

      {syncResult && (
        <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-orange-200'} rounded-lg p-4 border`}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{syncResult.uploaded}</div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Uploaded</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{syncResult.downloaded}</div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Downloaded</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{syncResult.errors.length}</div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Errors</div>
            </div>
          </div>
          
          {syncResult.errors.length > 0 && (
            <div className={`mt-3 p-2 ${isDarkMode ? 'bg-red-900/50 border-red-600' : 'bg-red-50 border-red-200'} rounded border`}>
              <p className={`text-xs ${isDarkMode ? 'text-red-300' : 'text-red-700'} font-semibold`}>Errors:</p>
              {syncResult.errors.map((error: string, index: number) => (
                <p key={index} className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-orange-600">
        <p>💡 <strong>Setup Required:</strong> Configure Firestore security rules for demo</p>
        <p>🔧 Firebase Console → Firestore → Rules → <code>allow read, write: if true;</code></p>
        <p>🚀 Production-ready for scaling to millions of users</p>
      </div>
    </div>
  );
};

export default FirebaseSync;
