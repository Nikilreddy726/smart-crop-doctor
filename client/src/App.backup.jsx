import React from 'react';

// Minimal App to check if imports are the cause
function App() {
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="p-10 bg-white shadow-xl rounded-2xl">
        <h1 className="text-3xl font-bold text-green-600">App Component Loaded</h1>
        <p>If you see this, App.jsx is working, and the issue is in the imports (Context/Pages).</p>
      </div>
    </div>
  );
}

export default App;
