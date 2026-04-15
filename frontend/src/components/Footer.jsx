import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useScrollToHomeSection } from '../hooks/useScrollToHomeSection';
import logoLight from '../assets/branding/logo-light.png';
import logoDark from '../assets/branding/logo-dark.png';

const Footer = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const scrollToHomeSection = useScrollToHomeSection();
  const logoSrc = theme === 'dark' ? logoDark : logoLight;
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <div className="site-footer__logo-wrap">
            <img
              src={logoSrc}
              alt={`${t('footer.brand')} ${t('footer.brand_sub')}`}
              className="site-footer__logo"
            />
          </div>
          <p className="site-footer__tagline">{t('footer.tagline')}</p>
        </div>

        <nav className="site-footer__col" aria-label={t('footer.links_title')}>
          <h2 className="site-footer__heading">{t('footer.links_title')}</h2>
          <ul className="site-footer__list">
            <li>
              <Link to="/">{t('footer.link_home')}</Link>
            </li>
            <li>
              <a
                href="/#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToHomeSection('how-it-works');
                }}
              >
                {t('footer.link_how')}
              </a>
            </li>
            <li>
              <Link to="/login">{t('footer.link_login')}</Link>
            </li>
            <li>
              <Link to="/register">{t('footer.link_register')}</Link>
            </li>
            <li>
              <Link to="/privacy-policy">Politique de confidentialite</Link>
            </li>
          </ul>
        </nav>

        <div className="site-footer__col site-footer__contact">
          <h2 className="site-footer__heading">{t('footer.contact_title')}</h2>
          <ul className="site-footer__contact-list">
            <li>
              <Mail size={18} aria-hidden className="site-footer__icon" />
              <div>
                <span className="site-footer__label">{t('footer.email_label')}</span>
                <a href={`mailto:${t('footer.email')}`} className="site-footer__value">
                  {t('footer.email')}
                </a>
              </div>
            </li>
            <li>
              <Phone size={18} aria-hidden className="site-footer__icon" />
              <div>
                <span className="site-footer__label">{t('footer.phone_label')}</span>
                <a href={`tel:${t('footer.phone_href')}`} className="site-footer__value">
                  {t('footer.phone')}
                </a>
              </div>
            </li>
            <li>
              <MapPin size={18} aria-hidden className="site-footer__icon" />
              <div>
                <span className="site-footer__label">{t('footer.address_label')}</span>
                <span className="site-footer__value site-footer__value--static">{t('footer.address')}</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="site-footer__bar">
        <p className="site-footer__rights">{t('footer.rights', { year })}</p>
      </div>
    </footer>
  );
};

export default Footer;
