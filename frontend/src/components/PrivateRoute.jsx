import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, token } = useAuth();

  if (!user || !token) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }
  return children;
};

export default PrivateRoute;
