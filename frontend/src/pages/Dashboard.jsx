import React from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardAdmin from './DashboardAdmin';
import DashboardUser from './DashboardUser';

const Dashboard = () => {
  const { user } = useAuth();
  if (user.role === 'admin') {
    return <DashboardAdmin />;
  }
  return <DashboardUser />;
};

export default Dashboard;
