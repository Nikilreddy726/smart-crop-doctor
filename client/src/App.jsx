import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
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
          <Routes>
            {/* Public Route */}
            <Route
              element={
                <>
                  <Navbar />
                  <Outlet />
                </>
              }
            >
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route
                element={
                  <div className="min-h-screen bg-slate-50">
                    <Navbar />
                    <main className="container mx-auto px-4 py-8 mt-24">
                      <Outlet />
                    </main>
                  </div>
                }
              >
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/detect" element={<Detection />} />
                <Route path="/weather" element={<Weather />} />
                <Route path="/history" element={<History />} />
                <Route path="/mandi" element={<MandiPrices />} />
                <Route path="/schemes" element={<GovernmentSchemes />} />
                <Route path="/community" element={<Community />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
