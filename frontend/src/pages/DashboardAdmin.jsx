import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Users, CreditCard, Star, AlertTriangle, Search, Activity, CheckCircle, Download, X, User, Mail, Phone, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import cardPrintLogo from '../assets/branding/logo-light.png';
import { API_BASE_URL } from '../config/apiBase';

const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

const PAGE_SIZE_USERS = 10;
const PAGE_SIZE_CARDS = 10;
const PAGE_SIZE_CONTACTS = 8;
const PAGE_SIZE_RECLAMATIONS = 6;

const norm = (s) => (s == null ? '' : String(s)).toLowerCase().trim();

const getEffectivePlanForCard = (card) => {
  if (!card) return 'FREE';
  if (card.effectivePlanType === 'PREMIUM' || card.effectivePlanType === 'FREE') return card.effectivePlanType;
  const subs = card.user?.subscriptions;
  if (!subs?.length) return 'FREE';
  const sub = subs.find((s) => s.status === 'active' && (!s.endDate || new Date(s.endDate) > new Date()));
  if (sub?.type === 'PREMIUM') return 'PREMIUM';
  return 'FREE';
};

const AdminPagination = ({ page, totalPages, totalItems, pageSize, onPrev, onNext }) => {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return (
    <div className="admin-pagination">
      <span className="admin-pagination__meta">
        {totalItems === 0 ? 'Aucun élément' : `${start}–${end} sur ${totalItems}`}
      </span>
      <div className="admin-pagination__controls">
        <button type="button" className="admin-pagination__btn" onClick={onPrev} disabled={page <= 1} aria-label="Page précédente">
          <ChevronLeft size={18} />
        </button>
        <span className="admin-pagination__page">
          {page} / {totalPages}
        </span>
        <button type="button" className="admin-pagination__btn" onClick={onNext} disabled={page >= totalPages} aria-label="Page suivante">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

const DashboardAdmin = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reclamations, setReclamations] = useState([]);
  const [cards, setCards] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userEditModalId, setUserEditModalId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', status: '', phone: '', password: '' });
  const [toasts, setToasts] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [cardSearch, setCardSearch] = useState('');
  const [cardPage, setCardPage] = useState(1);
  const [contactSearch, setContactSearch] = useState('');
  const [contactPage, setContactPage] = useState(1);
  const [reclamationSearch, setReclamationSearch] = useState('');
  const [reclamationPage, setReclamationPage] = useState(1);
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
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      axios.get(`${API_BASE_URL}/api/admin/stats`),
      axios.get(`${API_BASE_URL}/api/admin/users`),
      axios.get(`${API_BASE_URL}/api/admin/reclamations`),
      axios.get(`${API_BASE_URL}/api/admin/cards`),
      axios.get(`${API_BASE_URL}/api/admin/contact-messages`)
    ]).then(([sRes, uRes, rRes, cRes, mRes]) => {
      setStats(sRes.data);
      setUsers(uRes.data);
      setReclamations(rRes.data);
      setCards(cRes.data);
      setContactMessages(mRes.data);
    }).catch(err => {
      console.error("Erreur admin data", err);
    }).finally(() => setLoading(false));
  }, [user]);

  const filteredUsers = useMemo(() => {
    const q = norm(userSearch);
    if (!q) return users;
    return users.filter(
      (u) =>
        norm(u.name).includes(q) ||
        norm(u.email).includes(q) ||
        norm(u.phone).includes(q) ||
        norm(u.role).includes(q) ||
        norm(u.status).includes(q)
    );
  }, [users, userSearch]);

  const filteredCards = useMemo(() => {
    const q = norm(cardSearch);
    if (!q) return cards;
    return cards.filter(
      (c) =>
        norm(c.qrCode).includes(q) ||
        norm(c.status).includes(q) ||
        norm(c.user?.name).includes(q) ||
        norm(c.user?.email).includes(q) ||
        norm(getEffectivePlanForCard(c)).includes(q)
    );
  }, [cards, cardSearch]);

  const filteredContacts = useMemo(() => {
    const q = norm(contactSearch);
    if (!q) return contactMessages;
    return contactMessages.filter(
      (m) =>
        norm(m.name).includes(q) ||
        norm(m.email).includes(q) ||
        norm(m.subject).includes(q) ||
        norm(m.message).includes(q) ||
        norm(m.status).includes(q)
    );
  }, [contactMessages, contactSearch]);

  const filteredReclamations = useMemo(() => {
    const q = norm(reclamationSearch);
    if (!q) return reclamations;
    return reclamations.filter(
      (r) =>
        norm(r.reason).includes(q) ||
        norm(r.description).includes(q) ||
        norm(r.user?.name).includes(q) ||
        norm(r.user?.email).includes(q) ||
        norm(r.status).includes(q)
    );
  }, [reclamations, reclamationSearch]);

  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE_USERS));
  const userSafePage = Math.min(userPage, userTotalPages);
  const pagedUsers = filteredUsers.slice((userSafePage - 1) * PAGE_SIZE_USERS, userSafePage * PAGE_SIZE_USERS);

  const cardTotalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE_CARDS));
  const cardSafePage = Math.min(cardPage, cardTotalPages);
  const pagedCards = filteredCards.slice((cardSafePage - 1) * PAGE_SIZE_CARDS, cardSafePage * PAGE_SIZE_CARDS);

  const contactTotalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE_CONTACTS));
  const contactSafePage = Math.min(contactPage, contactTotalPages);
  const pagedContacts = filteredContacts.slice((contactSafePage - 1) * PAGE_SIZE_CONTACTS, contactSafePage * PAGE_SIZE_CONTACTS);

  const reclamationTotalPages = Math.max(1, Math.ceil(filteredReclamations.length / PAGE_SIZE_RECLAMATIONS));
  const reclamationSafePage = Math.min(reclamationPage, reclamationTotalPages);
  const pagedReclamations = filteredReclamations.slice(
    (reclamationSafePage - 1) * PAGE_SIZE_RECLAMATIONS,
    reclamationSafePage * PAGE_SIZE_RECLAMATIONS
  );

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

  useEffect(() => {
    if (userEditModalId === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setUserEditModalId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [userEditModalId]);

  const resolveReclamation = async (id) => {
    setActionLoading(true);
    try {
      await axios.patch(`${API_BASE_URL}/api/admin/reclamations/${id}`, { status: 'resolved' });
      setReclamations(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
      showToast("Demande résolue");
    } catch (err) { showToast("Échec de l'action", "error"); }
    finally { setActionLoading(false); }
  };

  const updateCardStatus = async (id, status) => {
    setActionLoading(true);
    try {
      await axios.patch(`${API_BASE_URL}/api/admin/cards/${id}`, { status });
      setCards(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      showToast("Statut carte mis à jour");
    } catch (err) { showToast("Erreur API", "error"); }
    finally { setActionLoading(false); }
  };

  const openUserEditModal = (u) => {
    setUserEditModalId(u.id);
    setEditForm({ name: u.name, email: u.email, role: u.role, status: u.status, phone: u.phone || '', password: '' });
  };

  const closeUserEditModal = () => {
    setUserEditModalId(null);
  };

  const handleUpdateUser = async (id) => {
    setActionLoading(true);
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/admin/users/${id}`, editForm);
      setUsers(prev => prev.map(u => u.id === id ? res.data : u));
      setUserEditModalId(null);
      showToast("Utilisateur synchronisé");
    } catch (err) { showToast("Échec de mise à jour", "error"); }
    finally { setActionLoading(false); }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Supprimer définitivement cet utilisateur ?")) {
      setActionLoading(true);
      try {
        await axios.delete(`${API_BASE_URL}/api/admin/users/${id}`);
        setUsers(prev => prev.filter(u => u.id !== id));
        if (userEditModalId === id) setUserEditModalId(null);
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
      await axios.patch(`${API_BASE_URL}/api/admin/contact-messages/${id}`, { status: 'read' });
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
    <div className="admin-dashboard glass-panel fade-up">
      <div className="admin-dashboard__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '15px' }}><ShieldCheck size={40} color="#3b82f6" /></div>
          <div>
            <h2 style={{ marginBottom: '0.2rem' }}>{t('admin.title')}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Admin Tools: <strong>{user.name}</strong></p>
          </div>
        </div>
      </div>

      <div className="admin-dashboard__tabs">
        {['stats', 'users', 'cards', 'reclamations', 'contacts'].map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`admin-dashboard__tab ${activeTab === tab ? 'admin-dashboard__tab--active' : ''}`}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="admin-dashboard__scroll">
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
        <div className="fade-in admin-tab-panel">
          <div className="admin-search">
            <Search size={18} className="admin-search__icon" aria-hidden />
            <input
              type="search"
              className="input-field admin-search__input"
              placeholder="Recherche : nom, email, téléphone, rôle, statut…"
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserPage(1);
              }}
            />
          </div>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Identité</th>
                  <th>Rôle</th>
                  <th>État</th>
                  <th className="admin-table__actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-cell__avatar">{u.name.charAt(0)}</div>
                        <div>
                          <div className="admin-user-cell__name">{u.name}</div>
                          <div className="admin-user-cell__meta">{u.email}</div>
                          {u.phone ? <div className="admin-user-cell__phone">{u.phone}</div> : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge--${u.role === 'admin' ? 'admin' : 'user'}`}>{u.role}</span>
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge--${u.status === 'active' ? 'ok' : 'off'}`}>{u.status}</span>
                    </td>
                    <td className="admin-table__actions">
                      <div className="admin-row-actions">
                        <button type="button" className="btn btn-secondary btn--sm" onClick={() => openUserEditModal(u)}>Modifier</button>
                        <button type="button" className="btn btn-secondary btn--sm btn--danger" onClick={() => handleDeleteUser(u.id)}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={userSafePage}
            totalPages={userTotalPages}
            totalItems={filteredUsers.length}
            pageSize={PAGE_SIZE_USERS}
            onPrev={() => setUserPage((p) => Math.max(1, p - 1))}
            onNext={() => setUserPage((p) => Math.min(userTotalPages, p + 1))}
          />
          {filteredUsers.length === 0 && (
            <div className="admin-empty">Aucun résultat{userSearch ? ` pour « ${userSearch} »` : ''}.</div>
          )}
        </div>
      )}

      {activeTab === 'cards' && (
        <div className="fade-in admin-tab-panel">
          <div className="admin-search">
            <Search size={18} className="admin-search__icon" aria-hidden />
            <input
              type="search"
              className="input-field admin-search__input"
              placeholder="Recherche : utilisateur, QR, statut, plan…"
              value={cardSearch}
              onChange={(e) => {
                setCardSearch(e.target.value);
                setCardPage(1);
              }}
            />
          </div>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Plan</th>
                  <th>QR</th>
                  <th>Statut</th>
                  <th>Action</th>
                  <th>Carte</th>
                </tr>
              </thead>
              <tbody>
                {pagedCards.map((c) => (
                  <tr key={c.id}>
                    <td>{c.user?.name}</td>
                    <td>
                      <span className={`admin-plan-tag admin-plan-tag--${getEffectivePlan(c) === 'PREMIUM' ? 'premium' : 'free'}`}>{getEffectivePlan(c)}</span>
                    </td>
                    <td><code className="admin-code">{c.qrCode}</code></td>
                    <td>{c.status}</td>
                    <td>
                      <select value={c.status} onChange={(e) => updateCardStatus(c.id, e.target.value)} className="input-field admin-select-inline">
                        <option value="pending">En attente</option>
                        <option value="validated">Activée</option>
                        <option value="shipped">Expédiée</option>
                        <option value="deactivated">Désactivée</option>
                      </select>
                    </td>
                    <td>
                      <button type="button" className="btn btn-secondary btn--sm" onClick={() => openCardDesigner(c)}>
                        <Download size={14} /> Générer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={cardSafePage}
            totalPages={cardTotalPages}
            totalItems={filteredCards.length}
            pageSize={PAGE_SIZE_CARDS}
            onPrev={() => setCardPage((p) => Math.max(1, p - 1))}
            onNext={() => setCardPage((p) => Math.min(cardTotalPages, p + 1))}
          />
          {filteredCards.length === 0 && (
            <div className="admin-empty">Aucune carte{cardSearch ? ` pour « ${cardSearch} »` : ''}.</div>
          )}
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="fade-in admin-tab-panel">
          <h3 className="admin-subtitle">{t('admin.contact_list_title')}</h3>
          <div className="admin-search">
            <Search size={18} className="admin-search__icon" aria-hidden />
            <input
              type="search"
              className="input-field admin-search__input"
              placeholder="Recherche : nom, email, sujet, message…"
              value={contactSearch}
              onChange={(e) => {
                setContactSearch(e.target.value);
                setContactPage(1);
              }}
            />
          </div>
          <div className="admin-table-scroll">
            <table className="admin-table admin-table--contacts">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Sujet</th>
                  <th>Statut</th>
                  <th>Message</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedContacts.map((msg) => (
                  <tr key={msg.id}>
                    <td className="admin-muted">{new Date(msg.createdAt).toLocaleString()}</td>
                    <td>{msg.name}</td>
                    <td><a href={`mailto:${msg.email}`} className="admin-link">{msg.email}</a></td>
                    <td className="admin-clip">{msg.subject || '—'}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${msg.status === 'new' ? 'pending' : 'ok'}`}>
                        {msg.status === 'new' ? t('admin.contact_status_new') : t('admin.contact_status_read')}
                      </span>
                    </td>
                    <td className="admin-msg-cell">{msg.message}</td>
                    <td>
                      {msg.status === 'new' ? (
                        <button type="button" className="btn btn-secondary btn--sm" disabled={actionLoading} onClick={() => markContactRead(msg.id)}>
                          {t('admin.contact_mark_read')}
                        </button>
                      ) : (
                        <span className="admin-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={contactSafePage}
            totalPages={contactTotalPages}
            totalItems={filteredContacts.length}
            pageSize={PAGE_SIZE_CONTACTS}
            onPrev={() => setContactPage((p) => Math.max(1, p - 1))}
            onNext={() => setContactPage((p) => Math.min(contactTotalPages, p + 1))}
          />
          {contactMessages.length === 0 && (
            <div className="admin-empty">{t('admin.contact_empty')}</div>
          )}
          {contactMessages.length > 0 && filteredContacts.length === 0 && (
            <div className="admin-empty">Aucun résultat pour « {contactSearch} ».</div>
          )}
        </div>
      )}

      {activeTab === 'reclamations' && (
        <div className="fade-in admin-tab-panel">
          <div className="admin-search">
            <Search size={18} className="admin-search__icon" aria-hidden />
            <input
              type="search"
              className="input-field admin-search__input"
              placeholder="Recherche : motif, détail, utilisateur…"
              value={reclamationSearch}
              onChange={(e) => {
                setReclamationSearch(e.target.value);
                setReclamationPage(1);
              }}
            />
          </div>
          <div className="admin-reclamation-list">
            {pagedReclamations.map((r) => (
              <div key={r.id} className={`admin-reclamation-card admin-reclamation-card--${r.status === 'resolved' ? 'done' : 'open'}`}>
                <div className="admin-reclamation-card__main">
                  <div className="admin-reclamation-card__head">
                    <span className="admin-reclamation-card__user">{r.user?.name}</span>
                    <span className="admin-reclamation-card__id">#{r.id}</span>
                  </div>
                  <div className="admin-reclamation-card__reason">{r.reason}</div>
                  <div className="admin-reclamation-card__desc">{r.description || 'Aucun détail complémentaire.'}</div>
                </div>
                <div className="admin-reclamation-card__side">
                  <div className="admin-muted">{new Date(r.createdAt).toLocaleString()}</div>
                  {r.status === 'pending' ? (
                    <button type="button" onClick={() => resolveReclamation(r.id)} className="btn btn-primary admin-reclamation-card__btn">
                      Résoudre
                    </button>
                  ) : (
                    <div className="admin-reclamation-card__resolved">
                      <CheckCircle size={16} /> Résolu
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <AdminPagination
            page={reclamationSafePage}
            totalPages={reclamationTotalPages}
            totalItems={filteredReclamations.length}
            pageSize={PAGE_SIZE_RECLAMATIONS}
            onPrev={() => setReclamationPage((p) => Math.max(1, p - 1))}
            onNext={() => setReclamationPage((p) => Math.min(reclamationTotalPages, p + 1))}
          />
          {reclamations.length === 0 && (
            <div className="admin-empty admin-empty--lg">
              <Activity size={48} className="admin-empty__icon" />
              <p>Aucune demande de support.</p>
            </div>
          )}
          {reclamations.length > 0 && filteredReclamations.length === 0 && (
            <div className="admin-empty">Aucun résultat pour « {reclamationSearch} ».</div>
          )}
        </div>
      )}
      </div>

      {userEditModalId !== null && (
        <div className="admin-user-modal__backdrop" role="presentation" onClick={closeUserEditModal}>
          <div className="admin-user-modal" role="dialog" aria-modal="true" aria-labelledby="admin-user-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="admin-user-modal__header">
              <h3 id="admin-user-modal-title">Modifier le profil utilisateur</h3>
              <button type="button" className="admin-user-modal__close" onClick={closeUserEditModal} aria-label="Fermer">
                <X size={22} />
              </button>
            </div>
            <div className="admin-user-modal__body">
              <p className="admin-user-modal__hint">Tous les champs sensibles sont modifiables ici ; l’adresse e-mail reste verrouillée pour l’intégrité du compte.</p>
              <label className="admin-field-label">E-mail (lecture seule)</label>
              <input className="input-field" type="email" value={editForm.email} readOnly title="Non modifiable" />
              <label className="admin-field-label">Nom complet</label>
              <input className="input-field" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} autoComplete="name" />
              <label className="admin-field-label">Téléphone</label>
              <input className="input-field" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+212 …" autoComplete="tel" />
              <label className="admin-field-label">Rôle</label>
              <select className="input-field" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
              <label className="admin-field-label">Statut du compte</label>
              <select className="input-field" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="active">Actif</option>
                <option value="deactivated">Suspendu / désactivé</option>
              </select>
              <label className="admin-field-label">Nouveau mot de passe (optionnel)</label>
              <input
                className="input-field"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Laisser vide pour ne pas changer"
                autoComplete="new-password"
              />
            </div>
            <div className="admin-user-modal__footer">
              <button type="button" className="btn btn-secondary" onClick={closeUserEditModal} disabled={actionLoading}>
                Annuler
              </button>
              <button type="button" className="btn btn-primary" onClick={() => handleUpdateUser(userEditModalId)} disabled={actionLoading}>
                {actionLoading ? '…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCard && (() => {
        const plan = getEffectivePlan(selectedCard);
        const theme = cardThemeForPlan(plan);
        const shellStyle = makeCardShellStyle(theme);
        const row = makeCardRow(theme);
        const iconColor = plan === 'PREMIUM' ? theme.accent : theme.red;
        const med = selectedCard.user?.medicalRecords;
        const icePhone = (med?.contactPhone && String(med.contactPhone).trim()) || (selectedCard.user?.phone && String(selectedCard.user.phone).trim()) || '';
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
                      className="admin-card-print-flex"
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
                      {icePhone ? (
                        <a
                          href={`tel:${icePhone.replace(/\s/g, '')}`}
                          style={{
                            fontSize: '18px',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            color: '#fff',
                            textDecoration: 'none',
                            marginTop: '4px',
                            wordBreak: 'break-all'
                          }}
                        >
                          ICE / Urgence : {icePhone}
                        </a>
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.85 }}>ICE / Urgence : non renseigné</span>
                      )}
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
        {toasts.map((toastItem) => (
          <Toast key={toastItem.id} {...toastItem} onClose={() => removeToast(toastItem.id)} />
        ))}
      </div>
    </div>
  );
};

export default DashboardAdmin;
