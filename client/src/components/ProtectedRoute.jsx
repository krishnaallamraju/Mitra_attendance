import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 class="w-10 h-10 text-sky-500 animate-spin mb-3" />
        <p class="text-sm font-medium tracking-wide">Authenticating session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role
    const redirectPath = user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
