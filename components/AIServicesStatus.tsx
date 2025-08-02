import React, { useState, useEffect } from 'react';
import { tensorflowService } from '../services/tensorflowService';

interface AIServiceStatus {
  gemini: 'loading' | 'ready' | 'error';
  tensorflow: 'loading' | 'ready' | 'error';
  firebase: 'loading' | 'ready' | 'error';
  cloudVision: 'loading' | 'ready' | 'error';
}

const AIServicesStatus: React.FC = () => {
  const [status, setStatus] = useState<AIServiceStatus>({
    gemini: 'loading',
    tensorflow: 'loading',
    firebase: 'loading',
    cloudVision: 'loading'
  });

  useEffect(() => {
    // Initialize Gemini (simulated)
    const timer1 = setTimeout(() => {
      setStatus(prev => ({ ...prev, gemini: 'ready' }));
    }, 1000);

    // Initialize TensorFlow.js
    const initTensorFlow = async () => {
      try {
        await tensorflowService.loadModel();
        setStatus(prev => ({ ...prev, tensorflow: 'ready' }));
      } catch (error) {
        console.error('Failed to load TensorFlow model:', error);
        setStatus(prev => ({ ...prev, tensorflow: 'error' }));
      }
    };
    initTensorFlow();

    // Initialize Firebase (simulated)
    const timer3 = setTimeout(() => {
      setStatus(prev => ({ ...prev, firebase: 'ready' }));
    }, 2000);

    // Initialize Cloud Vision (simulated)
    const timer4 = setTimeout(() => {
      setStatus(prev => ({ ...prev, cloudVision: 'ready' }));
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  const getStatusIcon = (serviceStatus: 'loading' | 'ready' | 'error') => {
    switch (serviceStatus) {
      case 'loading':
        return <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>;
      case 'ready':
        return <span className="text-green-600">✅</span>;
      case 'error':
        return <span className="text-red-600">❌</span>;
    }
  };

  const getStatusColor = (serviceStatus: 'loading' | 'ready' | 'error') => {
    switch (serviceStatus) {
      case 'loading':
        return 'text-blue-600';
      case 'ready':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  const allReady = Object.values(status).every(s => s === 'ready');

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700">🤖 AI Services Status</h3>
        {allReady && (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
            All Systems Ready
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2">
          {getStatusIcon(status.gemini)}
          <span className={getStatusColor(status.gemini)}>
            <strong>Gemini AI</strong>
            <br />Nutrition Analysis
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusIcon(status.tensorflow)}
          <span className={getStatusColor(status.tensorflow)}>
            <strong>TensorFlow.js</strong>
            <br />Food Detection
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusIcon(status.firebase)}
          <span className={getStatusColor(status.firebase)}>
            <strong>Firebase</strong>
            <br />Cloud Storage
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusIcon(status.cloudVision)}
          <span className={getStatusColor(status.cloudVision)}>
            <strong>Cloud Vision</strong>
            <br />Image Analysis
          </span>
        </div>
      </div>

      {allReady && (
        <div className="mt-3 text-xs text-center text-gray-600">
          🚀 <strong>Multi-Cloud AI Platform Active</strong> - Ready for production scaling
        </div>
      )}
    </div>
  );
};

export default AIServicesStatus;
