import React from 'react';

const TestApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Test App</h1>
        <p className="text-gray-600">If you can see this, React is working!</p>
        <div className="mt-4 space-y-2">
          <p>✅ React is loaded</p>
          <p>✅ Tailwind CSS is working</p>
          <p>✅ Basic rendering is functional</p>
        </div>
      </div>
    </div>
  );
};

export default TestApp;
