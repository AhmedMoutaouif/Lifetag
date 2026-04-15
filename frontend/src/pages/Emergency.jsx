import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { HeartPulse, User, Zap, Activity } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

const Emergency = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (id === "demo") {
      setData({
        name: "Jean Dupont",
        effectivePlanType: "PREMIUM",
        scanProfile: "full",
        medicalData: {
          allergies: "Pénicilline, Arachides",
          maladies: JSON.stringify({ selected: ["Diabète", "Asthme"], other: "Problème thyroïdien" }),
          medicaments: "Insuline Rapide, Ventoline 100µg",
          bloodGroup: "O+",
          sex: "Homme",
          age: "35",
          restingBloodPressure: "120/80 mmHg",
          cholesterol: "185 mg/dL",
          maxHeartRate: "170 bpm",
          oxygenSaturation: "98%",
          glucoseLevel: "95 mg/dL",
          bodyTemperature: "36.8 C",
          contactName: "Marie Dupont",
          contactRelation: "Conjoint(e)",
          contactPhone: "06 12 34 56 78",
          birthDate: "1990-05-15",
          weight: "75",
          height: "180",
          organDonor: true,
          additionalNotes: "Porteur d'un Pacemaker"
        }
      });
      return;
    }

    axios.get(`${API_BASE_URL}/api/emergency/${id}`)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.message || 'Profil introuvable ou inactif'));
  }, [id]);

  if (error) return <div className="glass-panel fade-up" style={{ color: 'var(--danger)', textAlign: 'center', margin: '4rem auto' }}><h2>Alarme Système</h2><p>{error}</p></div>;
  if (!data) return <div style={{ textAlign: 'center', margin: '4rem auto', color: 'var(--accent)' }} className="animate-pulse">Loading Bio-Data...</div>;

  const { medicalData, name, effectivePlanType, scanProfile } = data;
  const isLimitedScan = scanProfile === "limited" || effectivePlanType === "FREE";
  const isPremiumScan = !isLimitedScan;
  const hasUsefulMedicalData = Boolean(
    medicalData && (
      medicalData.allergies ||
      medicalData.maladies ||
      medicalData.medicaments ||
      medicalData.bloodGroup ||
      medicalData.sex ||
      medicalData.age ||
      medicalData.restingBloodPressure ||
      medicalData.cholesterol ||
      medicalData.maxHeartRate ||
      medicalData.oxygenSaturation ||
      medicalData.glucoseLevel ||
      medicalData.bodyTemperature ||
      medicalData.contactName ||
      medicalData.contactPhone ||
      medicalData.additionalNotes
    )
  );

  const MALADIES_FREE_DISPLAY_MAX = 120;

  const formatMaladiesForDisplay = (mal, limited) => {
    if (!mal) return 'Aucune';
    let text;
    try {
      const parsed = JSON.parse(mal);
      let arr = parsed.selected || [];
      if (parsed.other) arr.push(`Autre: ${parsed.other}`);
      text = arr.length > 0 ? arr.join(', ') : 'Aucune';
    } catch (e) {
      text = mal;
    }
    if (limited && text !== 'Aucune' && text.length > MALADIES_FREE_DISPLAY_MAX) {
      return `${text.slice(0, MALADIES_FREE_DISPLAY_MAX)}…`;
    }
    return text;
  };

  return (
    <div className="glass-panel fade-up" style={{ borderTop: '6px solid var(--danger)', marginTop: isMobile ? '1rem' : '2rem', padding: isMobile ? '1rem' : '3rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <HeartPulse size={64} color="var(--danger)" style={{ margin: '0 auto 1.5rem', animation: 'float 2s infinite' }} />
        <h1 style={{ color: 'var(--danger)', fontSize: '2.5rem' }}>{t('emergency.title')}</h1>
        <p>IDENTIFIANT PATIENT : <strong style={{ letterSpacing: '2px' }}>{id.toUpperCase()}</strong></p>
      </div>

      {!isPremiumScan && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.45)', borderRadius: '10px', color: '#fbbf24', lineHeight: 1.5 }}>
          <strong>Profil d&apos;urgence limité (plan Free)</strong>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.95rem', opacity: 0.95 }}>
            Seules les informations essentielles et des extraits du dossier sont affichés après le scan. Date de naissance, poids, taille, antécédents détaillés et informations complémentaires ne sont pas exposés publiquement sur ce plan.
          </p>
        </div>
      )}

      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '15px', marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          <User size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> {t('emergency.identity')}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          <div><span style={{ color: 'var(--text-secondary)' }}>Nom Complet :</span> <strong style={{ fontSize: '1.2rem' }}>{name}</strong></div>
          {isPremiumScan ? (
            <>
              <div><span style={{ color: 'var(--text-secondary)' }}>{t('emergency.birthDate')} :</span> <strong>{medicalData?.birthDate || 'Non spécifiée'}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>{t('emergency.weight')} :</span> <strong>{medicalData?.weight ? medicalData.weight + ' kg' : 'Non spécifié'}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>{t('emergency.height')} :</span> <strong>{medicalData?.height ? medicalData.height + ' cm' : 'Non spécifiée'}</strong></div>
            </>
          ) : (
            <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Date de naissance, poids et taille : non affichés (plan Free).
            </div>
          )}
        </div>
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)', borderRadius: '8px' }}>
          <h4 style={{ color: 'var(--warning)', margin: 0, marginBottom: '0.5rem' }}>{t('emergency.contact')} : </h4>
          {medicalData?.contactName ? (
            <p style={{ fontSize: '1.1rem' }}><strong>{medicalData.contactName} ({medicalData.contactRelation})</strong> - {medicalData.contactPhone}</p>
          ) : (
            <p>Non renseigné</p>
          )}
        </div>
      </div>

      {!hasUsefulMedicalData && (
        <div style={{ marginBottom: '2rem', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.45)', padding: '1rem 1.2rem', borderRadius: '10px', color: '#fbbf24' }}>
          Ce QR est valide, mais le propriétaire n'a pas encore rempli ses informations médicales détaillées.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: isMobile ? '1rem' : '2rem' }}>
        <div className="feature-card" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--warning)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={18} /> {t('emergency.allergies')}</h3>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{medicalData?.allergies || 'Aucune connue'}</p>
        </div>
        <div className="feature-card" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><HeartPulse size={18} /> {t('emergency.diseases')}</h3>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>{formatMaladiesForDisplay(medicalData?.maladies)}</p>
        </div>
        <div className="feature-card" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={18} /> {t('emergency.medications')}</h3>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{medicalData?.medicaments || 'Aucun traitement'}</p>
        </div>
        <div className="feature-card" style={{ padding: '2rem', border: '2px solid var(--success)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.05)' }}>
          <h3 style={{ color: 'var(--success)', marginBottom: '1rem' }}>{t('emergency.blood')}</h3>
          <p style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--success)', lineHeight: 1, textShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}>{medicalData?.bloodGroup || '?'}</p>
        </div>
      </div>

      {isPremiumScan && (
        <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '15px' }}>
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            Signes vitaux complémentaires (Premium)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: isMobile ? '1rem' : '2rem' }}>
            <div><strong>Sexe :</strong> {medicalData?.sex || 'Non renseigné'}</div>
            <div><strong>Âge :</strong> {medicalData?.age || 'Non renseigné'}</div>
            <div><strong>Tension au repos :</strong> {medicalData?.restingBloodPressure || 'Non renseignée'}</div>
            <div><strong>Cholestérol :</strong> {medicalData?.cholesterol || 'Non renseigné'}</div>
            <div><strong>Fréquence cardiaque max :</strong> {medicalData?.maxHeartRate || 'Non renseignée'}</div>
            <div><strong>Saturation O2 :</strong> {medicalData?.oxygenSaturation || 'Non renseignée'}</div>
            <div><strong>Glycémie :</strong> {medicalData?.glucoseLevel || 'Non renseignée'}</div>
            <div><strong>Température :</strong> {medicalData?.bodyTemperature || 'Non renseignée'}</div>
          </div>
        </div>
      )}

      {(medicalData?.organDonor || (isPremiumScan && medicalData?.additionalNotes)) && (
        <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '15px' }}>
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            {isPremiumScan ? 'Préférences et informations complémentaires' : 'Préférences'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: isMobile ? '1rem' : '2rem' }}>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>{t('emergency.organ_donor')}</strong>
              {medicalData?.organDonor ? (
                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', padding: '0.3rem 1rem', borderRadius: '50px', fontWeight: 'bold' }}>{t('emergency.organ_donor_yes')}</span>
              ) : (
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.3rem 1rem', borderRadius: '50px' }}>{t('emergency.organ_donor_no')}</span>
              )}
            </div>
            {isPremiumScan && medicalData?.additionalNotes && (
              <div>
                <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--warning)' }}>{t('emergency.notes')}</strong>
                <p style={{ fontStyle: 'italic', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>"{medicalData.additionalNotes}"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Emergency;
