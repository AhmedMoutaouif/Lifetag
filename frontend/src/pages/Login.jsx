import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

const Login = () => {
  const { t } = useTranslation();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/login`, { email, password });
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError("Identifiants invalides");
    }
  };

  return (
    <div className="glass-panel fade-up" style={{ maxWidth: '450px', margin: '4rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <HeartPulse size={48} color="var(--accent)" style={{ margin: '0 auto 1.5rem' }} />
        <h2>{t('login.title')}</h2>
      </div>
      {error && <p style={{ color: 'var(--danger)', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('login.email')} className="input-field" required />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('login.password')} className="input-field" required />
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
          {t('login.submit')}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('login.no_account')} <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'bold' }}>{t('login.create_account')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
