import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, LogOut, Sun, Moon, HelpCircle, User as UserIcon, Activity, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useScrollToHomeSection } from '../hooks/useScrollToHomeSection';
import logoLight from '../assets/branding/logo-light.png';
import logoDark from '../assets/branding/logo-dark.png';
import { swalConfirmLogout } from '../utils/swalLifeTag';

const NavBar = ({ toggleLang, i18n, t }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const scrollToHomeSection = useScrollToHomeSection();
  const logoSrc = theme === 'dark' ? logoDark : logoLight;
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <nav className={`glass-nav ${mobileOpen ? 'glass-nav--mobile-open' : ''}`} aria-label="Navigation principale">
      <Link to="/" className="nav-brand" title="LifeTag Global" onClick={closeMobileMenu}>
        <div className="nav-brand-mark">
          <img src={logoSrc} alt="" className="nav-logo-img" decoding="async" />
          <span className="nav-brand-text">
            <span className="nav-brand-name">{t('footer.brand')}</span>
            <span className="nav-brand-sub">{t('footer.brand_sub')}</span>
          </span>
        </div>
      </Link>

      <button
        type="button"
        className="nav-mobile-toggle"
        aria-label={mobileOpen ? t('nav.close_menu') : t('nav.open_menu')}
        onClick={() => setMobileOpen((v) => !v)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={`nav-main ${mobileOpen ? 'nav-main--open' : ''}`}>
        <div className="nav-group">
          <Link to="/" className="nav-link" onClick={closeMobileMenu}>{t('nav.home')}</Link>
          <Link to="/privacy-policy" className="nav-link" onClick={closeMobileMenu}>{t('nav.privacy')}</Link>
          <a
            href="/#contact"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              scrollToHomeSection('contact');
              closeMobileMenu();
            }}
          >
            {t('nav.contact')}
          </a>
        </div>

        {user ? (
          <>
            <span className="nav-divider" aria-hidden="true" />
            <div className="nav-group nav-group--user">
              <Link to="/dashboard" className="nav-link nav-link--icon" onClick={closeMobileMenu}>
                {user.role === 'admin' ? <ShieldCheck size={18} color="#3b82f6" aria-hidden /> : <LayoutDashboard size={18} aria-hidden />}
                {user.role === 'admin' ? t('admin.menu_stats') : t('nav.dashboard')}
              </Link>

              {user.role !== 'admin' && (
                <>
                  <Link to="/dashboard/vitals" className="nav-link nav-link--icon" onClick={closeMobileMenu}>
                    <Activity size={18} aria-hidden /> {t('nav.vitals')}
                  </Link>
                  <Link to="/dashboard/profile" className="nav-link nav-link--icon" onClick={closeMobileMenu}>
                    <UserIcon size={18} aria-hidden /> {t('nav.profile')}
                  </Link>
                  <Link to="/dashboard/support" className="nav-link nav-link--icon" onClick={closeMobileMenu}>
                    <HelpCircle size={18} aria-hidden /> {t('nav.support')}
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={async () => {
                  const ok = await swalConfirmLogout(
                    t('logout'),
                    t('nav.logout_confirm'),
                    t('logout'),
                    t('nav.cancel')
                  );
                  if (ok) await logout();
                }}
                className="nav-link nav-link--icon nav-link--button"
              >
                <LogOut size={18} aria-hidden /> {t('logout')}
              </button>
            </div>
          </>
        ) : (
          <Link to="/login" className="nav-link" onClick={closeMobileMenu}>{t('nav.login')}</Link>
        )}
      </div>

      <div className="nav-actions">
        <button
          type="button"
          onClick={toggleTheme}
          className="nav-icon-btn"
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          type="button"
          onClick={toggleLang}
          className="nav-lang-btn"
          aria-label="Changer la langue"
        >
          {i18n.language.toUpperCase()}
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
