import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`${API_BASE_URL}/api/register`, { name, email, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="glass-panel fade-up" style={{ maxWidth: '450px', margin: '4rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <UserPlus size={48} color="var(--accent)" style={{ margin: '0 auto 1.5rem' }} />
        <h2>{t('register.title')}</h2>
      </div>
      {error && <p style={{ color: 'var(--danger)', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('register.name')} className="input-field" required />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('register.email')} className="input-field" required />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('register.password')} className="input-field" required />
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
          {t('register.submit')}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('register.has_account')} <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'bold' }}>{t('register.login_now')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
