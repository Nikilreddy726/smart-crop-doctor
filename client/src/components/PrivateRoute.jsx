import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { Loader2 } from 'lucide-react';

const PrivateRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
                <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading...</p>
            </div>
        );
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
