import React from 'react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const sections = t('privacy.sections', { returnObjects: true });

  return (
    <section className="privacy-page">
      <div className="privacy-card">
        <h1>{t('privacy.title')}</h1>
        <p className="privacy-updated">{t('privacy.updated')}</p>

        {Array.isArray(sections) &&
          sections.map((block, i) => (
            <React.Fragment key={block.heading || i}>
              <h2>{block.heading}</h2>
              <p>{block.body}</p>
            </React.Fragment>
          ))}
      </div>
    </section>
  );
};

export default PrivacyPolicy;
