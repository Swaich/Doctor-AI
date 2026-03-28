import React from 'react';

const DebugInfo = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  
  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50">
      <h3 className="font-bold mb-2">Debug Info:</h3>
      <div>API URL: {apiUrl || 'NOT SET'}</div>
      <div>Google Client ID: {googleClientId ? 'SET' : 'NOT SET'}</div>
      <div>Node ENV: {process.env.NODE_ENV}</div>
      <div>Current URL: {window.location.href}</div>
    </div>
  );
};

export default DebugInfo;