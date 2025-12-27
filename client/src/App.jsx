import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Detection from './pages/Detection';
import Weather from './pages/Weather';
import History from './pages/History';
import MandiPrices from './pages/MandiPrices';
import GovernmentSchemes from './pages/GovernmentSchemes';
import Community from './pages/Community';
import { LanguageProvider } from './services/LanguageContext';
import { AuthProvider } from './services/AuthContext';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8 mt-24">
              <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/detect" element={<Detection />} />
                  <Route path="/weather" element={<Weather />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/mandi" element={<MandiPrices />} />
                  <Route path="/schemes" element={<GovernmentSchemes />} />
                  <Route path="/community" element={<Community />} />
                </Route>
              </Routes>
            </main>
          </div>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
