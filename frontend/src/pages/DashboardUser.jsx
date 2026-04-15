import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, Lock, Save, ShieldAlert, CheckCircle, Activity, Star, Watch, Zap, AlertTriangle, HeartPulse, Key } from 'lucide-react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const COMMON_DISEASES = ["Diabète", "Asthme", "Hypertension", "Épilepsie", "Allergies alimentaires", "Cardiopathie", "Cancer"];
const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

/** Aligné sur backend/server.js PLAN_LIMITS — utilisé si l’API n’a pas encore renvoyé `limits`. */
const getPlanLimitsDisplay = (limitsState, effectivePlanType) => {
  if (limitsState) return limitsState;
  return effectivePlanType === 'PREMIUM'
    ? { allergies: 2000, maladies: 5000, medicaments: 5000, additionalNotes: 5000 }
    : { allergies: 120, maladies: 200, medicaments: 180, additionalNotes: 160 };
};

const DashboardUser = () => {
  const { t } = useTranslation();
  const { user, token, setUser } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const isVitalsPage = currentPath === '/dashboard/vitals';
  const isProfilePage = currentPath === '/dashboard/profile';
  const isSupportPage = currentPath === '/dashboard/support';
  const isOverviewPage = !isVitalsPage && !isProfilePage && !isSupportPage;
  const isSettings = false;

  // DASHBOARD STATES
  const [medicalData, setMedicalData] = useState(null);
  const [card, setCard] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [effectivePlanType, setEffectivePlanType] = useState('FREE');
  const [planLimits, setPlanLimits] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);

  // FORM STATES
  const [allergies, setAllergies] = useState('');
  const [medicaments, setMedicaments] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [sex, setSex] = useState('');
  const [age, setAge] = useState('');
  const [restingBloodPressure, setRestingBloodPressure] = useState('');
  const [cholesterol, setCholesterol] = useState('');
  const [maxHeartRate, setMaxHeartRate] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [glucoseLevel, setGlucoseLevel] = useState('');
  const [bodyTemperature, setBodyTemperature] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('Parent');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [organDonor, setOrganDonor] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // CUSTOM DISEASE HANDLING
  const [selectedDiseases, setSelectedDiseases] = useState([]);
  const [otherDiseases, setOtherDiseases] = useState('');

  // PROFILE / SETTINGS STATES
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [isProfile, setIsProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user.name, phone: user.phone || '' });

  // RECLAIM / SUPPORT STATES
  const [isReclaiming, setIsReclaiming] = useState(false);
  const [reclamationReason, setReclamationReason] = useState('Carte Perdue');
  const [reclamationDesc, setReclamationDesc] = useState('');
  const [myReclamations, setMyReclamations] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setIsEditing(isVitalsPage);
    setIsProfile(isProfilePage);
    setIsReclaiming(isSupportPage);
  }, [isVitalsPage, isProfilePage, isSupportPage]);

  useEffect(() => {
    // 1. Fetch user data (especially email)
    axios.get(`${API_BASE_URL}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data.user) {
          const u = res.data.user;
          setUser(u);
          setProfileForm({ name: u.name, phone: u.phone || '' });
        }
      })
      .catch(err => console.error("Erreur chargement profil utilisateur", err));

    // 2. Fetch medical data
    axios.get(`${API_BASE_URL}/api/medical`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setEffectivePlanType(res.data.effectivePlanType || 'FREE');
        setPlanLimits(res.data.limits || null);
        if (res.data.record) {
          const rec = res.data.record;
          setMedicalData(rec);
          setCard(res.data.card);
          setSubscription(res.data.subscription);
          setAllergies(rec.allergies || '');
          setMedicaments(rec.medicaments || '');
          setBloodGroup(rec.bloodGroup || 'O+');
          setSex(rec.sex || '');
          setAge(rec.age || '');
          setRestingBloodPressure(rec.restingBloodPressure || '');
          setCholesterol(rec.cholesterol || '');
          setMaxHeartRate(rec.maxHeartRate || '');
          setOxygenSaturation(rec.oxygenSaturation || '');
          setGlucoseLevel(rec.glucoseLevel || '');
          setBodyTemperature(rec.bodyTemperature || '');
          setContactName(rec.contactName || '');
          setContactPhone(rec.contactPhone || '');
          setContactRelation(rec.contactRelation || 'Parent');
          setBirthDate(rec.birthDate || '');
          setWeight(rec.weight || '');
          setHeight(rec.height || '');
          setOrganDonor(rec.organDonor || false);
          setAdditionalNotes(rec.additionalNotes || '');

          try {
            if (rec.maladies) {
              const parsed = JSON.parse(rec.maladies);
              if (parsed.selected) setSelectedDiseases(parsed.selected);
              if (parsed.other) setOtherDiseases(parsed.other);
            }
          } catch (_err) {
            setOtherDiseases(rec.maladies || '');
          }
        } else {
          setIsEditing(true);
        }
      })
      .catch(err => console.error("Erreur chargement profil médical", err));
  }, [token, setUser]);

  useEffect(() => {
    const confirmStripePayment = async () => {
      const params = new URLSearchParams(location.search);
      const paymentStatus = params.get('payment');
      const sessionId = params.get('session_id');
      if (paymentStatus !== 'success' || !sessionId || !token) return;

      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/payment/confirm`,
          { sessionId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubscription(res.data.subscription);
        setEffectivePlanType('PREMIUM');
        try {
          const med = await axios.get(`${API_BASE_URL}/api/medical`, { headers: { Authorization: `Bearer ${token}` } });
          if (med.data?.limits) setPlanLimits(med.data.limits);
          if (med.data?.effectivePlanType) setEffectivePlanType(med.data.effectivePlanType);
        } catch (_e) { /* ignore */ }
        showToast("Paiement validé, Premium activé !");
        window.history.replaceState({}, document.title, '/dashboard');
      } catch (err) {
        showToast(err.response?.data?.message || "Paiement non confirmé.", "error");
      }
    };

    confirmStripePayment();
  }, [location.search, token]);

  const handleDiseaseToggle = (d) => {
    setSelectedDiseases(prev =>
      prev.includes(d) ? prev.filter(i => i !== d) : [...prev, d]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const limits = getPlanLimitsDisplay(planLimits, effectivePlanType);
      const maladiesJSON = JSON.stringify({ selected: selectedDiseases, other: otherDiseases });
      if (maladiesJSON.length > limits.maladies) {
        alert(t('dashboard.vitals_maladies_too_long', { max: limits.maladies }));
        return;
      }
      const res = await axios.post(`${API_BASE_URL}/api/medical`, {
        allergies, maladies: maladiesJSON, medicaments, bloodGroup,
        sex, age, restingBloodPressure, cholesterol, maxHeartRate,
        oxygenSaturation, glucoseLevel, bodyTemperature,
        contactName, contactPhone, contactRelation,
        birthDate, weight, height, organDonor,
        additionalNotes: effectivePlanType === 'PREMIUM' ? additionalNotes : (medicalData?.additionalNotes ?? '')
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data && res.data.record) {
        setMedicalData(res.data.record);
        setCard(res.data.card);
        if (res.data.limits) setPlanLimits(res.data.limits);
        if (res.data.effectivePlanType) setEffectivePlanType(res.data.effectivePlanType);
        setIsEditing(isVitalsPage);
        alert("Profil médical enregistré avec succès !");
      } else {
        throw new Error("Réponse serveur incomplète");
      }
    } catch (err) {
      alert("Erreur lors de la sauvegarde : " + (err.response?.data?.error || err.message));
    }
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    if (token) {
      axios.get(`${API_BASE_URL}/api/reclamations`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setMyReclamations(res.data))
        .catch(err => console.error(err));
    }
  }, [token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/user/profile`, profileForm, { headers: { Authorization: `Bearer ${token}` } });
      const updatedUser = { ...user, ...res.data.user };
      setUser(updatedUser);
      localStorage.setItem('lifetag_user', JSON.stringify(updatedUser));
      setProfileForm({ name: updatedUser.name, phone: updatedUser.phone || '' });
      showToast("Profil mis à jour avec succès !");
      setIsProfile(false);
    } catch (_err) {
      showToast("Erreur lors de la mise à jour.", "error");
    } finally { setUpdating(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await axios.post(`${API_BASE_URL}/api/user/password`, { oldPassword: oldPass, newPassword: newPass }, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Mot de passe sécurisé !");
      setOldPass(''); setNewPass('');
    } catch (err) {
      showToast(err.response?.data?.message || "Échec du changement.", "error");
    } finally { setUpdating(false); }
  };

  const submitReclamation = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await axios.post(`${API_BASE_URL}/api/reclamation`, { reason: reclamationReason, description: reclamationDesc }, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Réclamation envoyée avec succès !");
      setReclamationDesc('');
      setIsReclaiming(false);
      const res = await axios.get(`${API_BASE_URL}/api/reclamations`, { headers: { Authorization: `Bearer ${token}` } });
      setMyReclamations(res.data);
    } catch (_err) { showToast("Échec de l'envoi", "error"); }
    finally { setUpdating(false); }
  };

  const handleGenerateQr = async () => {
    setLoadingQr(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/card/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCard(res.data.card);
      showToast("QR généré avec succès !");
    } catch (err) {
      showToast(err.response?.data?.message || "Impossible de générer le QR.", "error");
    } finally {
      setLoadingQr(false);
    }
  };

  const limits = getPlanLimitsDisplay(planLimits, effectivePlanType);
  const maladiesJsonLen = JSON.stringify({ selected: selectedDiseases, other: otherDiseases }).length;
  const maladiesOverLimit = maladiesJsonLen > limits.maladies;

  return (
    <div className="glass-panel fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <LayoutDashboard size={36} color="var(--accent)" />
          <div>
            <h2 style={{ marginBottom: 0 }}>{t('dashboard.title')}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Espace Personnel Patient</p>
          </div>
        </div>
        {isOverviewPage && (
          <Link to="/dashboard/profile" className="btn btn-secondary">Mon Profil</Link>
        )}
      </div>

      {isSettings ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          <form onSubmit={handleUpdateProfile} className="form-card fade-in">
            <h3 className="section-title"><User size={20} color="var(--accent)" /> Mes Coordonnées</h3>
            <div style={{ display: 'grid', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Nom complet</label>
                <input type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className="input-field" style={{ marginBottom: 0 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" value={user.email} disabled className="input-field" style={{ marginBottom: 0, color: 'var(--text-secondary)', cursor: 'not-allowed', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }} title="L'email ne peut être changé." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Téléphone Mobile</label>
                <input type="tel" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="input-field" placeholder="+212 ..." style={{ marginBottom: 0 }} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={updating}>
                {updating ? <div className="spinner" /> : <Save size={18} />} Update Profile
              </button>
            </div>
          </form>

          <form onSubmit={handleChangePassword} className="form-card fade-in delay-1">
            <h3 className="section-title"><Lock size={20} color="var(--accent)" /> Sécurité & Accès</h3>
            <div style={{ display: 'grid', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Ancien Mot de passe</label>
                <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} className="input-field" style={{ marginBottom: 0 }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Nouveau Mot de passe</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="input-field" style={{ marginBottom: 0 }} required />
              </div>
              <button type="submit" className="btn btn-secondary" disabled={updating} style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
                {updating ? <div className="spinner" /> : <ShieldAlert size={18} />} Change Security Key
              </button>
            </div>
          </form>
        </div>
      ) : isEditing ? (
        <form onSubmit={handleSave} className="glass-panel" style={{ padding: '2rem', marginTop: '1rem' }}>
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            {t('dashboard.my_data')}
          </h3>

          {effectivePlanType !== 'PREMIUM' && (
            <div style={{ marginBottom: '1.25rem', padding: '1rem 1.1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '10px', color: '#fbbf24', fontSize: '0.88rem', lineHeight: 1.55 }}>
              {t('dashboard.vitals_free_banner')}
            </div>
          )}

          <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {effectivePlanType === 'PREMIUM' ? t('dashboard.vitals_premium_identity') : t('dashboard.vitals_free_identity')}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('emergency.birthDate')}</label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('emergency.blood')}</label>
              <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="input-field">
                <option value="O+">O+</option><option value="O-">O-</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Sexe</label>
              <select value={sex} onChange={e => setSex(e.target.value)} className="input-field">
                <option value="">Non renseigné</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Âge</label>
              <input type="number" min="0" max="130" value={age} onChange={e => setAge(e.target.value)} className="input-field" placeholder="35" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Poids (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="input-field" placeholder="70" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Taille (cm)</label>
              <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="input-field" placeholder="175" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Tension au repos</label>
              <input type="text" value={restingBloodPressure} onChange={e => setRestingBloodPressure(e.target.value)} className="input-field" placeholder="120/80 mmHg" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Cholestérol</label>
              <input type="text" value={cholesterol} onChange={e => setCholesterol(e.target.value)} className="input-field" placeholder="190 mg/dL" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Fréquence cardiaque max</label>
              <input type="text" value={maxHeartRate} onChange={e => setMaxHeartRate(e.target.value)} className="input-field" placeholder="170 bpm" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Saturation O2</label>
              <input type="text" value={oxygenSaturation} onChange={e => setOxygenSaturation(e.target.value)} className="input-field" placeholder="98%" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Glycémie</label>
              <input type="text" value={glucoseLevel} onChange={e => setGlucoseLevel(e.target.value)} className="input-field" placeholder="95 mg/dL" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Température corporelle</label>
              <input type="text" value={bodyTemperature} onChange={e => setBodyTemperature(e.target.value)} className="input-field" placeholder="36.8 C" />
            </div>
          </div>

          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            {t('emergency.contact')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nom complet</label>
              <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className="input-field" placeholder="Ex: Marie Dupont" required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Téléphone</label>
              <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="input-field" placeholder="Ex: 06 12 34 56 78" required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Relation</label>
              <select value={contactRelation} onChange={e => setContactRelation(e.target.value)} className="input-field">
                <option value="Parent">Parent</option>
                <option value="Conjoint(e)">Conjoint(e)</option>
                <option value="Enfant">Enfant</option>
                <option value="Aide-soignant">Aide-soignant</option>
                <option value="Ami(e)">Ami(e)</option>
                <option value="Médecin">Médecin</option>
              </select>
            </div>
          </div>

          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            {t('emergency.diseases')}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1rem' }}>
            {COMMON_DISEASES.map(d => (
              <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '50px', cursor: 'pointer', border: selectedDiseases.includes(d) ? '1px solid var(--accent)' : '1px solid transparent' }}>
                <input type="checkbox" checked={selectedDiseases.includes(d)} onChange={() => handleDiseaseToggle(d)} style={{ accentColor: 'var(--accent)' }} />
                {d}
              </label>
            ))}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={otherDiseases}
              onChange={e => setOtherDiseases(e.target.value)}
              className="input-field"
              placeholder={t('emergency.other_diseases')}
            />
          </div>
          <p style={{ marginBottom: '2rem', fontSize: '0.8rem', color: maladiesOverLimit ? '#f87171' : 'var(--text-secondary)' }}>
            {t('dashboard.vitals_maladies_counter', { used: maladiesJsonLen, max: limits.maladies })}
          </p>

          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            Allergies & Traitements
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Allergies</label>
              <input
                type="text"
                value={allergies}
                onChange={e => setAllergies(e.target.value.slice(0, limits.allergies))}
                className="input-field"
                placeholder="Ex: Pénicilline, Arachides..."
                maxLength={limits.allergies}
              />
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('dashboard.vitals_chars', { used: allergies.length, max: limits.allergies })}</p>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Traitements</label>
              <textarea
                value={medicaments}
                onChange={e => setMedicaments(e.target.value.slice(0, limits.medicaments))}
                className="input-field"
                placeholder="Ex: Insuline Rapide..."
                rows="3"
                maxLength={limits.medicaments}
              />
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('dashboard.vitals_chars', { used: medicaments.length, max: limits.medicaments })}</p>
            </div>
          </div>

          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            Plus d'infos
          </h3>
          <div className="feature-card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', fontSize: '1.1rem', width: '100%' }}>
              <input type="checkbox" checked={organDonor} onChange={e => setOrganDonor(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }} />
              {t('emergency.organ_donor')}
            </label>
          </div>
          {effectivePlanType === 'PREMIUM' && (
            <div style={{ marginBottom: '2.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('emergency.notes')}</label>
              <textarea
                value={additionalNotes}
                onChange={e => setAdditionalNotes(e.target.value.slice(0, limits.additionalNotes))}
                className="input-field"
                placeholder="Ex: Porteur de pacemaker..."
                rows="3"
                maxLength={limits.additionalNotes}
              />
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('dashboard.vitals_chars', { used: additionalNotes.length, max: limits.additionalNotes })}</p>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }} disabled={maladiesOverLimit}>
            <CheckCircle size={24} style={{ marginRight: '0.5rem' }} /> ENREGISTRER MON PROFIL
          </button>

          <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
              Carte QR d'urgence (publique, sans connexion) :
            </div>
            {card ? (
              <div style={{ display: 'grid', gap: '0.8rem' }}>
                <div style={{ background: 'white', width: 'fit-content', padding: '0.6rem', borderRadius: '10px' }}>
                  <QRCodeCanvas value={`${PUBLIC_APP_URL}/emergency/${card.qrCode}`} size={140} />
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  Lien: <a href={`${PUBLIC_APP_URL}/emergency/${card.qrCode}`} target="_blank" rel="noreferrer">{`${PUBLIC_APP_URL}/emergency/${card.qrCode}`}</a>
                </div>
                <button type="button" className="btn btn-secondary" onClick={handleGenerateQr} disabled={loadingQr}>
                  {loadingQr ? "..." : "Régénérer / Activer le QR"}
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={handleGenerateQr} disabled={loadingQr}>
                {loadingQr ? "..." : "Générer mon QR"}
              </button>
            )}
          </div>
        </form>
      ) : (
        <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ marginBottom: '0.5rem' }}>{t('dashboard.welcome')}, {user.name}</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span style={{ color: 'var(--success)', display: 'inline-block', padding: '0.2rem 1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50px', fontSize: '0.8rem' }}>Profil Actif</span>
                <span style={{ color: subscription?.type === 'PREMIUM' ? '#f59e0b' : 'var(--text-secondary)', display: 'inline-block', padding: '0.2rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50px', fontSize: '0.8rem' }}>Plan {subscription?.type || 'FREE'}</span>
              </div>
            </div>
          </div>

          {isOverviewPage && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '4px solid var(--accent)', transition: 'all 0.3s' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '1px' }}>SANG / BLOOD</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--accent)' }}>{medicalData?.bloodGroup || 'N/A'}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>Signe Vital Crucial</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '1px' }}>URGENCE / ICE</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{medicalData?.contactName || 'Non Configuré'}</div>
              <div style={{ fontSize: '0.9rem', color: '#3b82f6', marginTop: '0.2rem' }}>{medicalData?.contactPhone || 'Saisir numéro'}</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '4px solid #f59e0b', background: 'rgba(245, 158, 11, 0.05)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '1px' }}>ACCÈS / CARD</div>
              <div style={{ fontWeight: 'bold', color: '#f59e0b', textTransform: 'uppercase' }}>{card?.status || 'Aucune'}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>{card ? `ID: ${card.qrCode}` : 'Aucun support physique'}</div>
            </div>
          </div>
          )}

          {isOverviewPage && effectivePlanType !== 'PREMIUM' && planLimits && (
            <div style={{ marginTop: '1rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '10px', padding: '0.9rem 1rem', color: '#fbbf24', fontSize: '0.85rem' }}>
              {t('dashboard.vitals_free_limits_short', {
                a: planLimits.allergies,
                m: planLimits.maladies,
                med: planLimits.medicaments
              })}
            </div>
          )}

          {isReclaiming && (
            <div className="glass-panel fade-in" style={{ marginTop: '2.5rem', padding: '2rem', borderTop: '4px solid var(--accent)' }}>
              <h3 className="section-title"><AlertTriangle size={20} color="var(--accent)" /> Assistance & Réclamations</h3>
              <form onSubmit={submitReclamation} style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Objet de votre message</label>
                    <select value={reclamationReason} onChange={e => setReclamationReason(e.target.value)} className="input-field" style={{ marginBottom: 0 }}>
                      <option value="Carte Perdue">Carte Perdue / Volée</option>
                      <option value="Problème QR Code">Problème Technique QR Code</option>
                      <option value="Abonnement">Abonnement / Premium</option>
                      <option value="Support">Correction de données</option>
                      <option value="Autre">Autre demande</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Détails</label>
                  <textarea value={reclamationDesc} onChange={e => setReclamationDesc(e.target.value)} className="input-field" rows="4" placeholder="Décrivez votre besoin précisément..." required style={{ marginBottom: 0 }} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={updating} style={{ width: 'fit-content' }}>
                  {updating ? <div className="spinner" /> : "Transmettre ma demande"}
                </button>
              </form>
            </div>
          )}

          {isProfile && (
            <div className="glass-panel fade-in" style={{ marginTop: '2.5rem', padding: '2.5rem', borderTop: '4px solid var(--accent)' }}>
              <h3 className="section-title"><User size={24} color="var(--accent)" /> Paramètres de mon Compte</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>Modifiez vos informations personnelles et coordonnées.</p>

              <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 'bold' }}>IDENTIFIANT COMPTE (Email)</label>
                    <input className="input-field" type="email" value={user.email} disabled style={{ color: 'var(--text-secondary)', cursor: 'not-allowed', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }} title="L'email ne peut être changé." />
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 'bold' }}>NOM COMPLET</label>
                    <input className="input-field" type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 'bold' }}>TÉLÉPHONE DE CONTACT</label>
                    <input className="input-field" type="text" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+33 6 ..." />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={updating} style={{ minWidth: '220px' }}>
                    {updating ? <div className="spinner" /> : <Save size={18} />} VALIDER LES MODIFICATIONS
                  </button>
                  <button type="button" onClick={() => setIsProfile(false)} className="btn btn-secondary">ANNULER</button>
                </div>
              </form>

              <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '1px' }}>
                  <Key size={16} color="var(--accent)" /> SÉCURITÉ DU COMPTE — Changer le mot de passe
                </h4>
                <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold' }}>ANCIEN MOT DE PASSE</label>
                    <input className="input-field" type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} required placeholder="••••••••" style={{ marginBottom: 0 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold' }}>NOUVEAU MOT DE PASSE</label>
                    <input className="input-field" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required placeholder="••••••••" style={{ marginBottom: 0 }} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={updating} style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', minWidth: '180px' }}>
                    {updating ? <div className="spinner" /> : <Key size={16} />} CHANGER
                  </button>
                </form>
              </div>
            </div>
          )}

          {isOverviewPage && (
          <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'minmax(300px, 0.6fr) 1fr', gap: '2rem', alignItems: 'center' }}>
            <div className="card-mockup" style={{ height: '200px', padding: '1.5rem' }}>
              <div className="card-decoration"></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                <HeartPulse color="var(--accent)" size={24} />
                <span style={{ fontSize: '1.2rem', letterSpacing: '1px' }}>LifeTag</span>
              </div>
              <div style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: '1rem', letterSpacing: '1.5px', fontWeight: '600', color: 'var(--text-primary)' }}>{user.name.toUpperCase()}</div>
                <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', background: 'white', padding: '6px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                  <QRCodeCanvas value={card ? `${PUBLIC_APP_URL}/emergency/${card.qrCode}` : "LT-WAITING"} size={60} />
                </div>
              </div>
            </div>

            <div>
              {effectivePlanType !== 'PREMIUM' ? (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Passez au Premium pour les fonctions avancées.</p>
                  <button onClick={() => setShowPayment(!showPayment)} className="btn btn-primary" style={{ background: 'linear-gradient(to right, #f59e0b, #d97706)', border: 'none' }}>
                    <Zap size={18} /> ACTIVER LE PREMIUM
                  </button>
                  {showPayment && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                      <button className="btn btn-primary" onClick={async () => {
                        setLoadingPayment(true);
                        try {
                          const res = await axios.post(`${API_BASE_URL}/api/payment/checkout-session`, {}, { headers: { Authorization: `Bearer ${token}` } });
                          if (res.data?.url) {
                            window.location.href = res.data.url;
                            return;
                          }
                          throw new Error("Session Stripe invalide");
                        } catch (e) {
                          showToast(e.response?.data?.message || "Erreur de paiement.", "error");
                        }
                        finally { setLoadingPayment(false); }
                      }}>
                        {loadingPayment ? "..." : "Payer avec Stripe"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #f59e0b' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>⭐ MEMBRE PREMIUM ACTIF</div>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Accès illimité aux fonctions d'urgence et supports physiques prioritaires.</p>
                </div>
              )}

              {myReclamations.length > 0 && (
                <div style={{ marginTop: '3.5rem' }}>
                  <h4 style={{ marginBottom: '1.5rem', fontSize: '0.96rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.6rem', letterSpacing: '1px' }}>
                    <Activity size={18} color="var(--accent)" /> HISTORIQUE DES DEMANDES
                  </h4>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {myReclamations.map(r => (
                      <div key={r.id} className="glass-panel" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{r.reason}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem', lineHeight: '1.4' }}>{r.description}</div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Watch size={12} /> {new Date(r.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <span style={{
                          padding: '0.4rem 1rem',
                          borderRadius: '50px',
                          fontSize: '0.7rem',
                          fontWeight: '900',
                          background: r.status === 'resolved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: r.status === 'resolved' ? '#10b981' : '#f59e0b',
                          border: `1px solid ${r.status === 'resolved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                          marginLeft: '1.5rem'
                        }}>
                          {r.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      )}
      {/* TOAST SYSTEM */}
      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  );
};

export default DashboardUser;
