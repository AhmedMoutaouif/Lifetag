import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Navigation vers une section de la landing (id sur la page /) avec défilement fluide.
 * React Router ne gère pas bien `Link to="/#id"` pour le scroll.
 */
export function useScrollToHomeSection() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (sectionId) => {
      const id = String(sectionId).replace(/^#/, '');
      if (location.pathname === '/') {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        navigate({ pathname: '/', hash: id });
      }
    },
    [location.pathname, navigate]
  );
}
