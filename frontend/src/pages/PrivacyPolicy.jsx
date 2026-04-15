import React from 'react';

const PrivacyPolicy = () => {
  return (
    <section className="privacy-page">
      <div className="privacy-card">
        <h1>Politique de confidentialite</h1>
        <p className="privacy-updated">Derniere mise a jour: Avril 2026</p>

        <h2>1. Donnees collectees</h2>
        <p>
          LifeTag collecte uniquement les donnees necessaires au fonctionnement du service:
          informations de compte, donnees medicales saisies volontairement, et donnees
          techniques minimales pour la securite et la maintenance.
        </p>

        <h2>2. Finalite du traitement</h2>
        <p>
          Les donnees sont utilisees pour permettre l&apos;acces aux profils medicaux d&apos;urgence,
          la gestion des comptes utilisateurs, la securisation des connexions et l&apos;amelioration
          de la qualite du service.
        </p>

        <h2>3. Confidentialite et securite</h2>
        <p>
          Les acces sont proteges par authentification. Les operations sensibles (connexion,
          mise a jour de profil, donnees vitales) sont journalisees au niveau applicatif.
          Nous appliquons des controles de validation, de limitation de requetes et de
          cloisonnement des acces selon les roles.
        </p>

        <h2>4. Conservation des donnees</h2>
        <p>
          Les donnees sont conservees tant que le compte est actif ou selon les obligations
          legales applicables. L&apos;utilisateur peut demander la suppression de ses donnees
          via le support.
        </p>

        <h2>5. Partage des donnees</h2>
        <p>
          Aucune vente de donnees personnelles n&apos;est effectuee. Les donnees ne sont partagees
          qu&apos;avec les sous-traitants techniques indispensables au service (hebergement,
          base de donnees, paiement), avec des mesures de protection appropriees.
        </p>

        <h2>6. Droits des utilisateurs</h2>
        <p>
          Vous pouvez demander l&apos;acces, la correction ou la suppression de vos donnees.
          Pour toute demande: <a href="mailto:support@getlifetag.com">support@getlifetag.com</a>.
        </p>
      </div>
    </section>
  );
};

export default PrivacyPolicy;
