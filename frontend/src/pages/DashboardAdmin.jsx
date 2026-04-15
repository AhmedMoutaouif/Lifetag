import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Users, CreditCard, Star, AlertTriangle, Search, Activity, CheckCircle, Download, X, User, Mail, Phone, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import cardPrintLogo from '../assets/branding/logo-light.png';

const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

const DashboardAdmin = () => {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reclamations, setReclamations] = useState([]);
  const [cards, setCards] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', status: '', phone: '', password: '' });
  const [toasts, setToasts] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardFaceTab, setCardFaceTab] = useState('recto');
  const [downloadingCard, setDownloadingCard] = useState(false);
  const cardFrontRef = useRef(null);
  const cardBackRef = useRef(null);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const config = { headers: { Authorization: `Bearer ${token}` } };
    Promise.all([
      axios.get(`${API_BASE_URL}/api/admin/stats`, config),
      axios.get(`${API_BASE_URL}/api/admin/users`, config),
      axios.get(`${API_BASE_URL}/api/admin/reclamations`, config),
      axios.get(`${API_BASE_URL}/api/admin/cards`, config),
      axios.get(`${API_BASE_URL}/api/admin/contact-messages`, config)
    ]).then(([sRes, uRes, rRes, cRes, mRes]) => {
      setStats(sRes.data);
      setUsers(uRes.data);
      setReclamations(rRes.data);
      setCards(cRes.data);
      setContactMessages(mRes.data);
    }).catch(err => {
      console.error("Erreur admin data", err);
    }).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!selectedCard) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedCard(null);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedCard]);

  const resolveReclamation = async (id) => {
    setActionLoading(true);
    try {
      await axios.patch(`${API_BASE_URL}/api/admin/reclamations/${id}`, { status: 'resolved' }, { headers: { Authorization: `Bearer ${token}` } });
      setReclamations(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
      showToast("Demande résolue");
    } catch (err) { showToast("Échec de l'action", "error"); }
    finally { setActionLoading(false); }
  };

  const updateCardStatus = async (id, status) => {
    setActionLoading(true);
    try {
      await axios.patch(`${API_BASE_URL}/api/admin/cards/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      setCards(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      showToast("Statut carte mis à jour");
    } catch (err) { showToast("Erreur API", "error"); }
    finally { setActionLoading(false); }
  };

  const startEditUser = (u) => {
    setEditingUser(u.id);
    setEditForm({ name: u.name, email: u.email, role: u.role, status: u.status, phone: u.phone || '', password: '' });
  };

  const handleUpdateUser = async (id) => {
    setActionLoading(true);
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/admin/users/${id}`, editForm, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => prev.map(u => u.id === id ? res.data : u));
      setEditingUser(null);
      showToast("Utilisateur synchronisé");
    } catch (err) { showToast("Échec de mise à jour", "error"); }
    finally { setActionLoading(false); }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Supprimer définitivement cet utilisateur ?")) {
      setActionLoading(true);
      try {
        await axios.delete(`${API_BASE_URL}/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(prev => prev.filter(u => u.id !== id));
        showToast("Utilisateur supprimé");
      } catch (err) { showToast("Accès refusé", "error"); }
      finally { setActionLoading(false); }
    }
  };

  const openCardDesigner = (card) => {
    setCardFaceTab('recto');
    setSelectedCard(card);
  };

  const markContactRead = async (id) => {
    setActionLoading(true);
    try {
      await axios.patch(`${API_BASE_URL}/api/admin/contact-messages/${id}`, { status: 'read' }, { headers: { Authorization: `Bearer ${token}` } });
      setContactMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'read' } : m)));
      setStats((s) =>
        s
          ? {
              ...s,
              contactMessagesNewCount: Math.max(0, (s.contactMessagesNewCount || 0) - 1)
            }
          : s
      );
      showToast('Message marqué comme lu');
    } catch (err) {
      showToast('Échec de la mise à jour', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const SUPPORT_EMAIL = 'lifetagglobal@gmail.com';

  /** Dimensions fixes export PNG */
  const CARD_EXPORT = { w: 760, h: 432 };

  const cardType = {
    fontFamily: '"Segoe UI", "Inter", system-ui, -apple-system, sans-serif',
    smoothing: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', textRendering: 'geometricPrecision' }
  };

  const getEffectivePlan = (card) => {
    if (!card) return 'FREE';
    if (card.effectivePlanType === 'PREMIUM' || card.effectivePlanType === 'FREE') return card.effectivePlanType;
    const subs = card.user?.subscriptions;
    if (!subs?.length) return 'FREE';
    const sub = subs.find((s) => s.status === 'active' && (!s.endDate || new Date(s.endDate) > new Date()));
    if (sub?.type === 'PREMIUM') return 'PREMIUM';
    return 'FREE';
  };

  /** Thème visuel + libellés selon FREE / PREMIUM (Premium = or) */
  const cardThemeForPlan = (plan) => {
    if (plan === 'PREMIUM') {
      return {
        navy: '#1e1810',
        muted: '#5c4d3a',
        accent: '#c9a227',
        accentSoft: 'rgba(201, 162, 39, 0.12)',
        red: '#6b4c20',
        paper: '#fffef6',
        paper2: '#faf3e0',
        leftCol: '#14110c',
        line: 'rgba(201, 162, 39, 0.4)',
        footerBg: 'linear-gradient(90deg, #5c4a18 0%, #b8941f 35%, #e8d48b 50%, #b8941f 65%, #5c4a18 100%)',
        qrBorder: '#b8941f',
        instantBoxBorder: '#c9a227',
        globalBoxBorder: '#8a7020',
        leftPanelBg: 'linear-gradient(165deg, #faf3e0 0%, #fffef8 55%)',
        label: 'PREMIUM',
        labelLong: 'Carte Premium',
        versoHint: 'Profil médical étendu au scan — coordonnées visibles sur cette carte.'
      };
    }
    return {
      navy: '#001f3f',
      muted: '#4a5f73',
      accent: '#8B0000',
      red: '#8B0000',
      accentSoft: 'rgba(0, 31, 63, 0.06)',
      paper: '#ffffff',
      paper2: '#f5f8fc',
      leftCol: '#001f3f',
      line: 'rgba(0, 31, 63, 0.12)',
      footerBg: '#8B0000',
      qrBorder: '#001f3f',
      instantBoxBorder: '#8B0000',
      globalBoxBorder: '#001f3f',
      leftPanelBg: 'linear-gradient(165deg, #f5f8fc 0%, #ffffff 55%)',
      label: 'FREE',
      labelLong: 'Carte Free',
      versoHint: 'Plan Free : coordonnées détaillées (email, ICE, etc.) uniquement via le scan du QR.'
    };
  };

  const makeCardShellStyle = (theme) => ({
    width: `${CARD_EXPORT.w}px`,
    maxWidth: '100%',
    margin: '0 auto',
    minHeight: `${CARD_EXPORT.h}px`,
    height: `${CARD_EXPORT.h}px`,
    position: 'relative',
    background: theme.paper,
    borderRadius: 0,
    overflow: 'hidden',
    border: theme.label === 'PREMIUM' ? `2px solid ${theme.accent}` : `1px solid rgba(0, 31, 63, 0.12)`,
    boxShadow: 'none',
    fontFamily: cardType.fontFamily,
    color: theme.navy,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    ...cardType.smoothing
  });

  const makeCardRow = (theme) => (label, value, icon) => (
    <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: theme.navy, marginBottom: '18px', ...cardType.smoothing }}>
      {icon}
      <div style={{ minWidth: 0 }}>
        <span style={{ fontWeight: 800, color: theme.muted, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block' }}>{label}</span>
        <div style={{ fontWeight: 800, marginTop: '6px', lineHeight: 1.35, fontSize: '18px', color: theme.navy, wordBreak: 'break-word' }}>{value || '—'}</div>
      </div>
    </div>
  );

  const copyCanvasesToClone = (sourceRoot, cloneRoot) => {
    const srcList = sourceRoot.querySelectorAll('canvas');
    const dstList = cloneRoot.querySelectorAll('canvas');
    srcList.forEach((src, i) => {
      const dst = dstList[i];
      if (!dst || !src.getContext) return;
      try {
        dst.width = src.width;
        dst.height = src.height;
        const ctx = dst.getContext('2d');
        if (ctx) ctx.drawImage(src, 0, 0);
      } catch (_) {
        /* ignore */
      }
    });
  };

  const stripRadiusForExportClone = (root) => {
    root.style.setProperty('border-radius', '0', 'important');
    root.querySelectorAll('*').forEach((node) => {
      node.style?.setProperty('border-radius', '0', 'important');
    });
  };

  const downloadCardImage = async (face) => {
    if (!selectedCard) return;
    setCardFaceTab(face);
    setDownloadingCard(true);
    await new Promise((r) => setTimeout(r, 400));
    const el = face === 'recto' ? cardFrontRef.current : cardBackRef.current;
    if (!el) {
      setDownloadingCard(false);
      showToast("Aperçu non prêt", "error");
      return;
    }
    let clone = null;
    try {
      clone = el.cloneNode(true);
      copyCanvasesToClone(el, clone);
      stripRadiusForExportClone(clone);
      Object.assign(clone.style, {
        position: 'fixed',
        left: '-12000px',
        top: '0',
        width: `${CARD_EXPORT.w}px`,
        height: `${CARD_EXPORT.h}px`,
        minHeight: `${CARD_EXPORT.h}px`,
        maxWidth: `${CARD_EXPORT.w}px`,
        margin: '0',
        zIndex: '2147483646',
        transform: 'none',
        boxShadow: 'none',
        borderRadius: '0',
        overflow: 'hidden',
        visibility: 'visible',
        opacity: '1'
      });
      document.body.appendChild(clone);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const canvas = await html2canvas(clone, {
        width: CARD_EXPORT.w,
        height: CARD_EXPORT.h,
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      const link = document.createElement('a');
      const slug = selectedCard.user?.name?.replace(/\s+/g, '-').toLowerCase() || selectedCard.id;
      link.download = `lifetag-card-${face}-${slug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast(face === 'recto' ? 'Recto téléchargé' : 'Verso téléchargé');
    } catch (_err) {
      showToast("Impossible de télécharger la carte", "error");
    } finally {
      if (clone?.parentNode) clone.parentNode.removeChild(clone);
      setDownloadingCard(false);
    }
  };


  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--accent)' }}>Bio-Metric Security Access...</div>;

  return (
    <div className="glass-panel fade-up" style={{ borderTop: '6px solid #3b82f6' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '15px' }}><ShieldCheck size={40} color="#3b82f6" /></div>
        <div>
          <h2 style={{ marginBottom: '0.2rem' }}>{t('admin.title')}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Admin Tools: <strong>{user.name}</strong></p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', overflowX: 'auto' }}>
        {['stats', 'users', 'cards', 'reclamations', 'contacts'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`nav-link ${activeTab === tab ? 'active' : ''}`} style={{ background: activeTab === tab ? 'rgba(59, 130, 246, 0.1)' : 'transparent', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '10px', color: activeTab === tab ? '#3b82f6' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '4px solid #3b82f6' }}>
            <Users size={32} color="#3b82f6" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem' }}>{stats.usersCount}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Utilisateurs Inscrits</p>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '4px solid #10b981' }}>
            <CreditCard size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem' }}>{stats.cardsCount}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cartes en Circulation</p>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '4px solid #f59e0b' }}>
            <Star size={32} color="#f59e0b" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem' }}>{stats.subscriptionsCount}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Membres Premium</p>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '4px solid #ef4444' }}>
            <AlertTriangle size={32} color="#ef4444" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem' }}>{stats.reclamationsCount}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Réclamations à traiter</p>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '4px solid #a855f7' }}>
            <MessageSquare size={32} color="#a855f7" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem' }}>{stats.contactMessagesNewCount ?? 0}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('admin.contact_new_count')}</p>
          </div>
        </div>
      )}


      {activeTab === 'users' && (
        <div className="fade-in">
          <div style={{ position: 'relative', marginBottom: '2rem' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="text" placeholder="Rechercher par nom ou email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field" style={{ paddingLeft: '3rem', marginBottom: 0 }} />
          </div>

          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '1rem' }}>IDENTITÉ</th>
                <th style={{ padding: '1rem' }}>RÔLE / ACCÈS</th>
                <th style={{ padding: '1rem' }}>ÉTAT DU COMPTE</th>
                <th style={{ padding: '1rem' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '1rem' }}>
                    {editingUser === u.id ? (
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <input className="input-field" type="email" value={editForm.email} readOnly style={{ opacity: 0.6, background: 'rgba(255,255,255,0.02)', fontWeight: 'bold', cursor: 'not-allowed' }} title="L'email ne peut pas être modifié" />
                        <input className="input-field" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Nom Complet" />
                        <input className="input-field" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Téléphone" />
                        <input className="input-field" type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} placeholder="Nouveau mot de passe (optionnel)" />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--accent)' }}>{u.name.charAt(0)}</div>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                          {u.phone && <div style={{ fontSize: '0.8rem', color: '#10b981' }}>{u.phone}</div>}
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {editingUser === u.id ? (
                      <select className="input-field" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                        <option value="user">Utilisateur Standard</option><option value="admin">Administrateur</option>
                      </select>
                    ) : (
                      <span style={{ background: u.role === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: u.role === 'admin' ? '#3b82f6' : 'inherit', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem' }}>{u.role.toUpperCase()}</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {editingUser === u.id ? (
                      <select className="input-field" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                        <option value="active">Activé</option><option value="deactivated">Suspendu / Désactivé</option>
                      </select>
                    ) : (
                      <span className={`status-badge ${u.status === 'active' ? 'status-active' : 'status-danger'}`} style={{
                        padding: '0.3rem 0.8rem',
                        borderRadius: '50px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        background: u.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: u.status === 'active' ? '#10b981' : '#ef4444',
                        border: `1px solid ${u.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                      }}>
                        {u.status.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {editingUser === u.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary" onClick={() => handleUpdateUser(u.id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} disabled={actionLoading}>{actionLoading ? "..." : "OK"}</button>
                        <button className="btn btn-secondary" onClick={() => setEditingUser(null)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>CANCEL</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={() => startEditUser(u)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>EDIT</button>
                        <button className="btn btn-secondary" onClick={() => handleDeleteUser(u.id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }}>DELETE</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Aucun résultat pour "{searchTerm}"</div>
          )}
        </div>
      )}

      {
        activeTab === 'cards' && (
          <div className="fade-in">
            <table style={{ width: '100%', textAlign: 'left' }}>
              <thead><tr style={{ color: 'var(--text-secondary)' }}><th style={{ padding: '1rem' }}>USER</th><th style={{ padding: '1rem' }}>PLAN</th><th style={{ padding: '1rem' }}>QR</th><th style={{ padding: '1rem' }}>STATUS</th><th style={{ padding: '1rem' }}>ACTION</th><th style={{ padding: '1rem' }}>CARTE CLIENT</th></tr></thead>
              <tbody>
                {cards.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '1rem' }}>{c.user?.name}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        padding: '0.25rem 0.5rem',
                        border: `1px solid ${getEffectivePlan(c) === 'PREMIUM' ? '#c9a227' : '#8B0000'}`,
                        color: getEffectivePlan(c) === 'PREMIUM' ? '#c9a227' : '#f87171'
                      }}>{getEffectivePlan(c)}</span>
                    </td>
                    <td style={{ padding: '1rem' }}><code>{c.qrCode}</code></td>
                    <td style={{ padding: '1rem' }}>{c.status}</td>
                    <td style={{ padding: '1rem' }}>
                      <select value={c.status} onChange={(e) => updateCardStatus(c.id, e.target.value)} className="input-field" style={{ padding: '0.2rem' }}>
                        <option value="pending">En attente</option><option value="validated">Activée</option><option value="shipped">Expédiée</option><option value="deactivated">Désactivée</option>
                      </select>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button className="btn btn-secondary" onClick={() => openCardDesigner(c)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        <Download size={14} /> Générer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      {activeTab === 'contacts' && (
        <div className="fade-in">
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>{t('admin.contact_list_title')}</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>DATE</th>
                <th style={{ padding: '1rem' }}>NOM</th>
                <th style={{ padding: '1rem' }}>EMAIL</th>
                <th style={{ padding: '1rem' }}>SUJET</th>
                <th style={{ padding: '1rem' }}>STATUT</th>
                <th style={{ padding: '1rem' }}>MESSAGE</th>
                <th style={{ padding: '1rem' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {contactMessages.map((msg) => (
                <tr key={msg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', verticalAlign: 'top' }}>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(msg.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>{msg.name}</td>
                  <td style={{ padding: '1rem' }}><a href={`mailto:${msg.email}`} style={{ color: '#60a5fa' }}>{msg.email}</a></td>
                  <td style={{ padding: '1rem', maxWidth: '140px' }}>{msg.subject || '—'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      background: msg.status === 'new' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                      color: msg.status === 'new' ? '#c084fc' : '#34d399'
                    }}>{msg.status === 'new' ? t('admin.contact_status_new') : t('admin.contact_status_read')}</span>
                  </td>
                  <td style={{ padding: '1rem', maxWidth: '320px', fontSize: '0.9rem', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{msg.message}</td>
                  <td style={{ padding: '1rem' }}>
                    {msg.status === 'new' ? (
                      <button type="button" className="btn btn-secondary" disabled={actionLoading} onClick={() => markContactRead(msg.id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        {t('admin.contact_mark_read')}
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {contactMessages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>{t('admin.contact_empty')}</div>
          )}
        </div>
      )}

      {activeTab === 'reclamations' && (
        <div className="fade-in" style={{ display: 'grid', gap: '1.2rem' }}>
          {reclamations.map(r => (
            <div key={r.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderLeft: r.status === 'resolved' ? '6px solid #10b981' : '6px solid #f59e0b' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{r.user?.name}</span>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>ID #{r.id}</span>
                </div>
                <div style={{ fontWeight: '600', color: r.status === 'resolved' ? '#10b981' : '#f59e0b', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>{r.reason}</div>
                <div style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', marginTop: '0.5rem', lineHeight: '1.5' }}>
                  {r.description || "Aucun détail complémentaire."}
                </div>
              </div>
              <div style={{ marginLeft: '2rem', textAlign: 'right', minWidth: '150px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{new Date(r.createdAt).toLocaleString()}</div>
                {r.status === 'pending' ? (
                  <button onClick={() => resolveReclamation(r.id)} className="btn btn-primary" style={{ background: '#10b981', border: 'none', padding: '0.6rem 1.2rem', fontWeight: 'bold' }}>RÉSOUDRE</button>
                ) : (
                  <div style={{ color: '#10b981', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    <CheckCircle size={16} /> RÉSOLU
                  </div>
                )}
              </div>
            </div>
          ))}
          {reclamations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-secondary)' }}>
              <Activity size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
              <p>Aucune demande de support en cours.</p>
            </div>
          )}
        </div>
      )}

      {selectedCard && (() => {
        const plan = getEffectivePlan(selectedCard);
        const theme = cardThemeForPlan(plan);
        const shellStyle = makeCardShellStyle(theme);
        const row = makeCardRow(theme);
        const iconColor = plan === 'PREMIUM' ? theme.accent : theme.red;
        const med = selectedCard.user?.medicalRecords;
        const isPremium = plan === 'PREMIUM';

        return (
          <div
            role="presentation"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              zIndex: 2000,
              padding: 'clamp(0.75rem, 2vh, 1.5rem)',
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
            onClick={() => setSelectedCard(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="card-preview-title"
              className="glass-panel"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 'min(980px, 100vw - 1.5rem)',
                maxHeight: 'min(92vh, 900px)',
                margin: 'auto',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
                boxSizing: 'border-box'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête fixe : titre + badge + fermer */}
              <div
                style={{
                  flexShrink: 0,
                  padding: '1rem 1rem 0.75rem 1.25rem',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '0.75rem 1rem'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minWidth: 0, flex: '1 1 200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <h3 id="card-preview-title" style={{ margin: 0, fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', lineHeight: 1.3 }}>
                      Carte LifeTag — Recto &amp; Verso
                    </h3>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      padding: '0.35rem 0.65rem',
                      border: `2px solid ${iconColor}`,
                      color: iconColor,
                      background: isPremium ? 'rgba(201, 162, 39, 0.12)' : 'rgba(139, 0, 0, 0.08)'
                    }}>
                      {isPremium ? 'PREMIUM' : 'FREE'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setCardFaceTab('recto')}
                      className="btn btn-secondary"
                      style={{
                        fontWeight: 700,
                        background: cardFaceTab === 'recto' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                        borderColor: cardFaceTab === 'recto' ? '#3b82f6' : 'rgba(255,255,255,0.15)'
                      }}
                    >
                      Recto (face QR)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardFaceTab('verso')}
                      className="btn btn-secondary"
                      style={{
                        fontWeight: 700,
                        background: cardFaceTab === 'verso' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                        borderColor: cardFaceTab === 'verso' ? '#3b82f6' : 'rgba(255,255,255,0.15)'
                      }}
                    >
                      Verso (identité)
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedCard(null)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    flexShrink: 0,
                    fontWeight: 700
                  }}
                >
                  <X size={18} strokeWidth={2.5} aria-hidden />
                  Fermer
                </button>
              </div>

              {/* Zone scrollable : uniquement l’aperçu carte */}
              <div
                style={{
                  flex: '1 1 auto',
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  padding: '1rem 1.25rem',
                  overscrollBehavior: 'contain'
                }}
              >
              <div style={{ position: 'relative', minHeight: '280px' }}>
                <div style={{ display: cardFaceTab === 'recto' ? 'block' : 'none' }}>
                  <div ref={cardFrontRef} style={{ ...shellStyle, background: theme.paper }}>
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'stretch',
                        minHeight: '360px'
                      }}
                    >
                      <div
                        style={{
                          width: '42%',
                          flexShrink: 0,
                          padding: '28px 22px 24px 28px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          gap: '18px',
                          background: theme.leftPanelBg,
                          borderRight: `1px solid ${theme.line}`,
                          textAlign: 'left',
                          ...cardType.smoothing
                        }}
                      >
                        <img
                          src={cardPrintLogo}
                          alt="LifeTag Global"
                          style={{ height: '118px', width: 'auto', maxWidth: '100%', objectFit: 'contain', objectPosition: 'left center', alignSelf: 'flex-start' }}
                          crossOrigin="anonymous"
                        />
                        <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.18em', color: iconColor }}>
                          {isPremium ? '● PREMIUM GOLD' : '● FREE'}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: '21px',
                              fontWeight: 800,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              lineHeight: 1.2,
                              color: theme.navy
                            }}
                          >
                            Emergency Info Card
                          </div>
                          <div
                            style={{
                              fontSize: '17px',
                              fontWeight: 700,
                              color: theme.navy,
                              marginTop: '14px',
                              lineHeight: 1.45
                            }}
                          >
                            Scan in case of emergency
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                          <div
                            style={{
                              fontSize: '18px',
                              fontWeight: 800,
                              color: theme.navy,
                              letterSpacing: '0.03em',
                              padding: '10px 14px',
                              background: theme.accentSoft,
                              borderRadius: 0,
                              borderLeft: `4px solid ${theme.instantBoxBorder}`
                            }}
                          >
                            Instant Access
                          </div>
                          <div
                            style={{
                              fontSize: '18px',
                              fontWeight: 800,
                              color: theme.navy,
                              letterSpacing: '0.03em',
                              padding: '10px 14px',
                              background: theme.accentSoft,
                              borderRadius: 0,
                              borderLeft: `4px solid ${theme.globalBoxBorder}`
                            }}
                          >
                            Global Care
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '24px 20px',
                          gap: '12px',
                          ...cardType.smoothing
                        }}
                      >
                        <div
                          style={{
                            background: '#fff',
                            padding: '14px',
                            borderRadius: 0,
                            border: `3px solid ${theme.qrBorder}`,
                            boxShadow: isPremium ? '0 8px 28px rgba(201, 162, 39, 0.2)' : '0 8px 32px rgba(0, 31, 63, 0.1)'
                          }}
                        >
                          <QRCodeCanvas value={`${PUBLIC_APP_URL}/emergency/${selectedCard.qrCode}`} size={168} />
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        flexShrink: 0,
                        minHeight: '56px',
                        background: theme.footerBg,
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 16px',
                        textAlign: 'center',
                        gap: '6px',
                        ...cardType.smoothing
                      }}
                    >
                      <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.03em' }}>Scan in case of emergency</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, opacity: 0.95 }}>Instant Access · Global Care</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: cardFaceTab === 'verso' ? 'block' : 'none' }}>
                  <div ref={cardBackRef} style={{ ...shellStyle, background: theme.paper }}>
                    <div style={{ display: 'flex', flex: 1, minHeight: '380px', height: '100%', ...cardType.smoothing }}>
                      <div
                        style={{
                          width: '36%',
                          flexShrink: 0,
                          background: theme.leftCol,
                          color: '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '22px 14px',
                          gap: '16px',
                          borderRight: isPremium ? `2px solid ${theme.accent}` : 'none'
                        }}
                      >
                        <div
                          style={{
                            background: '#fff',
                            borderRadius: 0,
                            padding: '14px 16px',
                            boxShadow: 'none',
                            border: `1px solid ${theme.line}`,
                            width: '100%',
                            maxWidth: '160px'
                          }}
                        >
                          <img
                            src={cardPrintLogo}
                            alt="LifeTag Global"
                            style={{ width: '100%', height: 'auto', maxHeight: '120px', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
                            crossOrigin="anonymous"
                          />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: isPremium ? theme.accent : '#fff' }}>LifeTag</div>
                          <div style={{ fontSize: '13px', opacity: 0.92, marginTop: '8px', lineHeight: 1.45, fontWeight: 600 }}>
                            {isPremium ? 'Premium — dossier complet' : 'Identification médicale & urgence'}
                          </div>
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0, padding: '24px 22px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: theme.paper }}>
                        <div>
                          <div style={{ fontSize: '19px', fontWeight: 800, color: theme.navy, letterSpacing: '0.04em', marginBottom: '16px', paddingBottom: '12px', borderBottom: `4px solid ${isPremium ? theme.accent : theme.red}` }}>
                            Card Holder {isPremium ? '(Premium)' : '(Free)'}
                          </div>
                          {row('FULL NAME', selectedCard.user?.name, <User size={22} color={iconColor} style={{ flexShrink: 0, marginTop: '4px' }} />)}
                          {isPremium ? (
                            <>
                              {row('SUPPORT', SUPPORT_EMAIL, <Mail size={22} color={iconColor} style={{ flexShrink: 0, marginTop: '4px' }} />)}
                              {row('BLOOD GROUP', med?.bloodGroup, <AlertTriangle size={22} color={iconColor} style={{ flexShrink: 0, marginTop: '4px' }} />)}
                              {row('ICE CONTACT', med?.contactPhone, <Phone size={22} color={iconColor} style={{ flexShrink: 0, marginTop: '4px' }} />)}
                            </>
                          ) : null}
                        </div>
                        <div style={{ fontSize: '13px', color: theme.navy, lineHeight: 1.5, marginTop: '12px', fontWeight: 700, opacity: 0.88 }}>
                          {theme.versoHint}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              <div
                style={{
                  flexShrink: 0,
                  padding: '0.85rem 1.25rem 1.1rem',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.6rem',
                  justifyContent: 'flex-end',
                  background: 'var(--glass-bg)'
                }}
              >
                <button className="btn btn-secondary" onClick={() => downloadCardImage('recto')} disabled={downloadingCard} type="button">
                  <Download size={16} /> Recto (PNG)
                </button>
                <button className="btn btn-secondary" onClick={() => downloadCardImage('verso')} disabled={downloadingCard} type="button">
                  <Download size={16} /> Verso (PNG)
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* TOAST SYSTEM */}
      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  );
};

export default DashboardAdmin;
