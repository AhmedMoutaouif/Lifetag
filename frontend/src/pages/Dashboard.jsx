import React from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardAdmin from './DashboardAdmin';
import DashboardUser from './DashboardUser';

const Dashboard = () => {
  const { user } = useAuth();
  return (
    <div className="dashboard-route">
      {user.role === 'admin' ? <DashboardAdmin /> : <DashboardUser />}
    </div>
  );
};

export default Dashboard;
