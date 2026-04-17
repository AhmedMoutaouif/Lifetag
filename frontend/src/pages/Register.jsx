import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { isValidEmail, isNonEmptyTrimmed } from '../utils/formValidation';
import { showSwalLoading, closeSwal, swalError, swalWarning, swalSuccess } from '../utils/swalLifeTag';
import { API_BASE_URL } from '../config/apiBase';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, sessionReady } = useAuth();

  if (sessionReady && user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isNonEmptyTrimmed(name, 2)) {
      await swalWarning(t('validation.name_min'), '');
      return;
    }
    if (!isValidEmail(email)) {
      await swalWarning(t('validation.email_invalid'), '');
      return;
    }
    if (password.length < 8) {
      await swalWarning(t('auth.password_min_hint'), '');
      return;
    }
    showSwalLoading(t('register.creating'));
    try {
      await axios.post(`${API_BASE_URL}/api/register`, { name, email, password });
      closeSwal();
      await swalSuccess({ title: t('register.success_title'), text: t('register.success_text') });
      navigate('/login');
    } catch (err) {
      closeSwal();
      await swalError(t('register.error_title'), err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="glass-panel fade-up" style={{ maxWidth: '450px', margin: '4rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <UserPlus size={48} color="var(--accent)" style={{ margin: '0 auto 1.5rem' }} />
        <h2>{t('register.title')}</h2>
      </div>
      <form onSubmit={handleSubmit}>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('register.name')} className="input-field" minLength={2} maxLength={120} required />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('register.email')} className="input-field" required />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={t('register.password')}
          className="input-field"
          minLength={8}
          autoComplete="new-password"
          required
        />
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>{t('register.password_hint')}</p>
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
