import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { HeartPulse, ArrowRight, QrCode, Lock, Zap, Globe, CreditCard, Watch, Key, Activity, Star, CheckCircle, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isValidEmail, isNonEmptyTrimmed } from '../utils/formValidation';
import { API_BASE_URL } from '../config/apiBase';

/** Segment vectoriel répétable (ligne type monitoring / vitaux), ~400 unités de large. */
const ECG_SEGMENT_D =
  'M0,50 L28,50 L36,50 L42,20 L48,80 L54,32 L60,50 L400,50';

const LandingPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactStatus, setContactStatus] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    const id = location.hash?.replace(/^#/, '');
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.hash]);

  const submitContact = async (e) => {
    e.preventDefault();
    setContactStatus(null);
    if (!isNonEmptyTrimmed(contactForm.name, 2)) {
      setContactStatus(t('validation.name_min'));
      return;
    }
    if (!isValidEmail(contactForm.email)) {
      setContactStatus(t('validation.email_invalid'));
      return;
    }
    if (!isNonEmptyTrimmed(contactForm.message, 10)) {
      setContactStatus(t('validation.message_min'));
      return;
    }
    setContactLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/contact`, {
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        subject: contactForm.subject.trim() || undefined,
        message: contactForm.message.trim()
      });
      setContactStatus('ok');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setContactStatus(err.response?.data?.message || 'error');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="landing-page animate-fade-in">
      <div className="landing-page__ambient" aria-hidden="true">
        <div className="landing-page__mesh" />
        <div className="landing-page__orb landing-page__orb--a" />
        <div className="landing-page__orb landing-page__orb--b" />
        <div className="landing-page__orb landing-page__orb--c" />
        <div className="landing-page__grid-noise" />
        <div className="landing-page__scan" />
        <div className="landing-page__ecg-layer landing-page__ecg-layer--top">
          <svg className="landing-page__ecg-svg" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lifetagEcgStroke" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#f43f5e" stopOpacity="0.55" />
                <stop offset="0.42" stopColor="#60a5fa" stopOpacity="0.4" />
                <stop offset="1" stopColor="#a78bfa" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <g transform="translate(0,28)">
              <g className="landing-page__ecg-scroll">
                <path fill="none" stroke="url(#lifetagEcgStroke)" strokeWidth="1.2" vectorEffect="nonScalingStroke" d={ECG_SEGMENT_D} />
                <path fill="none" stroke="url(#lifetagEcgStroke)" strokeWidth="1.2" vectorEffect="nonScalingStroke" d={ECG_SEGMENT_D} transform="translate(400,0)" />
                <path fill="none" stroke="url(#lifetagEcgStroke)" strokeWidth="1.2" vectorEffect="nonScalingStroke" d={ECG_SEGMENT_D} transform="translate(800,0)" />
              </g>
            </g>
            <g transform="translate(0,92)" opacity="0.55">
              <g className="landing-page__ecg-scroll landing-page__ecg-scroll--reverse">
                <path fill="none" stroke="url(#lifetagEcgStroke)" strokeWidth="0.95" vectorEffect="nonScalingStroke" d={ECG_SEGMENT_D} />
                <path fill="none" stroke="url(#lifetagEcgStroke)" strokeWidth="0.95" vectorEffect="nonScalingStroke" d={ECG_SEGMENT_D} transform="translate(400,0)" />
                <path fill="none" stroke="url(#lifetagEcgStroke)" strokeWidth="0.95" vectorEffect="nonScalingStroke" d={ECG_SEGMENT_D} transform="translate(800,0)" />
              </g>
            </g>
          </svg>
        </div>
        <div className="landing-page__ecg-layer landing-page__ecg-layer--bottom" aria-hidden="true">
          <svg className="landing-page__ecg-svg landing-page__ecg-svg--flip" viewBox="0 0 1200 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lifetagEcgStrokeB" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#60a5fa" stopOpacity="0.35" />
                <stop offset="0.5" stopColor="#f43f5e" stopOpacity="0.4" />
                <stop offset="1" stopColor="#a78bfa" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            <g transform="translate(0,36)">
              <g className="landing-page__ecg-scroll landing-page__ecg-scroll--slow">
                <path fill="none" stroke="url(#lifetagEcgStrokeB)" strokeWidth="1" vectorEffect="nonScalingStroke" d={ECG_SEGMENT_D} />
                <path fill="none" stroke="url(#lifetagEcgStrokeB)" strokeWidth="1" vectorEffect="nonScalingStroke" d={ECG_SEGMENT_D} transform="translate(400,0)" />
                <path fill="none" stroke="url(#lifetagEcgStrokeB)" strokeWidth="1" vectorEffect="nonScalingStroke" d={ECG_SEGMENT_D} transform="translate(800,0)" />
              </g>
            </g>
          </svg>
        </div>
      </div>
      <div className="landing-page__main">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title fade-up delay-1">
            {t('home.title1')}<br />
            <span className="text-gradient">{t('home.title_highlight')}</span>
          </h1>
          <p className="hero-subtitle fade-up delay-2">{t('home.subtitle')}</p>
          <div className="hero-buttons fade-up delay-3">
            {user ? (
              <Link to="/dashboard" className="hero-btn hero-btn--primary">
                <span>{t('nav.dashboard')}</span>
                <ArrowRight size={20} aria-hidden />
              </Link>
            ) : (
              <Link to="/login" className="hero-btn hero-btn--primary">
                <span>{t('home.start_button')}</span>
                <ArrowRight size={20} aria-hidden />
              </Link>
            )}
            <a href="#how-it-works" className="hero-btn hero-btn--dark">
              {t('home.learn_more')}
            </a>
            <a href="#contact" className="hero-btn hero-btn--dark">
              {t('home.contact.cta_hero')}
            </a>
          </div>
        </div>

        <div className="hero-visual fade-up delay-3">
          <div className="hero-visual__card-wrap">
          <div className="card-mockup">
            <div className="card-decoration"></div>
            <HeartPulse color="var(--accent)" size={40} style={{ marginBottom: '2rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>LIFE TAG EMERGENCY</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>ID: LFTG-8932-XX</p>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '15px', alignSelf: 'center', marginTop: 'auto' }}>
              <QrCode size={150} color="black" />
            </div>
            <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{t('home.scan_to_access')}</p>
          </div>
          </div>
        </div>
      </section>

      {/* SECTION: Qu'est-ce que LifeTag ? */}
      <section style={{ padding: '6rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }} className="text-gradient">{t('home.about.title')}</h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
            {t('home.about.content')}
          </p>
        </div>
      </section>

      <section id="features" style={{ padding: '4rem 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem' }} className="text-gradient">{t('home.why_title')}</h2>
        <div className="features-grid">
          <div className="feature-card fade-up">
            <div className="feature-icon"><Lock size={32} /></div>
            <h3>{t('home.features.t1')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('home.features.d1')}</p>
          </div>
          <div className="feature-card fade-up delay-1">
            <div className="feature-icon"><Zap size={32} /></div>
            <h3>{t('home.features.t2')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('home.features.d2')}</p>
          </div>
          <div className="feature-card fade-up delay-2">
            <div className="feature-icon"><Globe size={32} /></div>
            <h3>{t('home.features.t3')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('home.features.d3')}</p>
          </div>
        </div>
      </section>

      <section className="landing-products-band landing-page__lift-band" style={{ padding: '8rem 10%', background: 'radial-gradient(circle at center, var(--bg-secondary), var(--bg-primary))', borderRadius: 'var(--radius)', margin: '4rem 0', border: '1px solid var(--glass-border)', boxShadow: '0 20px 80px rgba(0,0,0,0.15)' }}>
        <h2 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '1.5rem', textTransform: 'none' }} className="text-gradient">{t('home.products.title')}</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '5rem', fontSize: '1.2rem' }}>{t('home.products.subtitle')}</p>
        <div className="features-grid" style={{ gap: '3rem' }}>
          <div className="feature-card fade-up">
            <div className="product-card">
              <div>
                <div className="feature-icon"><CreditCard size={32} /></div>
                <h3>{t('home.products.card')}</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.8rem', lineHeight: '1.6' }}>{t('home.products.card_d')}</p>
              </div>
              <Link to="/login" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.9rem', marginTop: '2rem' }}>{t('home.products.card_btn')}</Link>
            </div>
          </div>
          <div className="feature-card fade-up delay-1">
            <div className="product-card">
              <div>
                <div className="feature-icon"><Watch size={32} /></div>
                <h3>{t('home.products.bracelet')}</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.8rem', lineHeight: '1.6' }}>{t('home.products.bracelet_d')}</p>
              </div>
              <Link to="/login" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.9rem', marginTop: '2rem' }}>{t('home.products.bracelet_btn')}</Link>
            </div>
          </div>
          <div className="feature-card fade-up delay-2">
            <div className="product-card">
              <div>
                <div className="feature-icon"><Key size={32} /></div>
                <h3>{t('home.products.keychain')}</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.8rem', lineHeight: '1.6' }}>{t('home.products.keychain_d')}</p>
              </div>
              <Link to="/login" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.9rem', marginTop: '2rem' }}>{t('home.products.keychain_btn')}</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" style={{ padding: '6rem 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '4rem' }} className="text-gradient">{t('home.how_it_works.title')}</h2>
        <div className="features-grid landing-steps-grid" style={{ gap: '3rem' }}>
          <div style={{ textAlign: 'center' }} className="fade-up landing-step-card">
            <div className="landing-step-card__badge" style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', borderRadius: '50%', fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)', border: '2px solid var(--accent)' }}>1</div>
            <h3>{t('home.how_it_works.step1')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('home.how_it_works.step1_d')}</p>
          </div>
          <div style={{ textAlign: 'center' }} className="fade-up delay-1 landing-step-card">
            <div className="landing-step-card__badge" style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', borderRadius: '50%', fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)', border: '2px solid var(--accent)' }}>2</div>
            <h3>{t('home.how_it_works.step2')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('home.how_it_works.step2_d')}</p>
          </div>
          <div style={{ textAlign: 'center' }} className="fade-up delay-2 landing-step-card">
            <div className="landing-step-card__badge" style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', borderRadius: '50%', fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)', border: '2px solid var(--accent)' }}>3</div>
            <h3>{t('home.how_it_works.step3')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('home.how_it_works.step3_d')}</p>
          </div>
        </div>
      </section>

      <section id="pricing" style={{ padding: '6rem 0', paddingBottom: '8rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '4rem' }} className="text-gradient">{t('home.pricing.title')}</h2>
        <div className="pricing-grid">
          {/* Card FREE */}
          <div className="glass-panel landing-glass-hover fade-up" style={{ padding: '3rem 2rem', textAlign: 'center', borderTop: '4px solid var(--text-secondary)' }}>
            <Activity size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{t('home.pricing.free')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{t('home.pricing.free_d')}</p>
            <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }}>{t('home.pricing.choose')}</Link>
          </div>
          {/* Card PREMIUM */}
          <div className="glass-panel landing-glass-hover fade-up delay-1 pricing-card--premium" style={{ padding: '3rem 2rem', textAlign: 'center', borderTop: '6px solid var(--accent)', boxShadow: '0 30px 60px rgba(0,0,0,0.2)', background: 'var(--bg-secondary)' }}>
            <Star size={48} color="var(--accent)" fill="var(--accent)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>{t('home.pricing.premium')}</h3>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '0.6rem' }}>{t('home.pricing.premium_price')}</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{t('home.pricing.premium_d')}</p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>{t('home.pricing.upgrade')}</Link>
          </div>
        </div>
      </section>

      {/* SECTION: À qui s'adresse LifeTag ? */}
      <section style={{ padding: '6rem 0' }}>
        <div className="glass-panel landing-glass-hover" style={{ border: '1px solid var(--accent-glow)' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem', textAlign: 'center' }} className="text-gradient">{t('home.audience.title')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {t('home.audience.items', { returnObjects: true }).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.4rem', background: 'rgba(244, 63, 94, 0.2)', color: 'var(--accent)', borderRadius: '50%', display: 'flex' }}>
                  <CheckCircle size={18} />
                </div>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="landing-contact-section" style={{ padding: '6rem 5%', maxWidth: '720px', margin: '0 auto' }}>
        <div className="glass-panel landing-glass-hover" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.8rem' }}>{t('home.privacy.title')}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.9rem' }}>
            {t('home.privacy.text')}
          </p>
          <Link to="/privacy-policy" className="btn btn-secondary" style={{ width: 'fit-content' }}>
            {t('home.privacy.cta')}
          </Link>
        </div>

        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '0.75rem' }} className="text-gradient">{t('home.contact.title')}</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.6 }}>{t('home.contact.subtitle')}</p>
        <form className="glass-panel landing-glass-hover" onSubmit={submitContact} style={{ padding: '2rem', display: 'grid', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>{t('home.contact.name')}</label>
            <input
              className="input-field"
              required
              minLength={2}
              maxLength={120}
              value={contactForm.name}
              onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
              autoComplete="name"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>{t('home.contact.email')}</label>
            <input
              className="input-field"
              type="email"
              required
              value={contactForm.email}
              onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
              autoComplete="email"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>{t('home.contact.subject')}</label>
            <input
              className="input-field"
              maxLength={200}
              value={contactForm.subject}
              onChange={(e) => setContactForm((f) => ({ ...f, subject: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>{t('home.contact.message')}</label>
            <textarea
              className="input-field"
              required
              minLength={10}
              maxLength={5000}
              rows={5}
              style={{ resize: 'vertical', minHeight: '120px' }}
              value={contactForm.message}
              onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
            />
          </div>
          {contactStatus === 'ok' && (
            <p style={{ color: '#34d399', fontWeight: 600, margin: 0 }}>{t('home.contact.success')}</p>
          )}
          {contactStatus && contactStatus !== 'ok' && (
            <p style={{ color: 'var(--danger)', margin: 0 }}>{contactStatus}</p>
          )}
          <button type="submit" className="btn btn-primary" disabled={contactLoading} style={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            {contactLoading ? <Loader2 size={20} className="lifetag-spin" /> : <Send size={20} />}
            {t('home.contact.send')}
          </button>
        </form>
      </section>

      {/* Basic Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '3rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>{t('home.footer')}</p>
      </footer>
      </div>
    </div>
  );
};

export default LandingPage;
