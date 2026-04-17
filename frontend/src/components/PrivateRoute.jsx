import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, requiredRole }) => {
  const { t } = useTranslation();
  const { user, sessionReady } = useAuth();

  if (!sessionReady) {
    return (
      <div className="glass-panel fade-up" style={{ maxWidth: 420, margin: '4rem auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{t('auth.verifying_session')}</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default PrivateRoute;
