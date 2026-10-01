import { useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import TopbarContext, { COMPACT_TOPBAR_QUERY } from '../context/TopbarContext';
import useMediaQuery from '../utils/useMediaQuery';

// Titre de la page et boutons d'action, affichés dans la barre du haut
// commune (Layout). Sur téléphone/tablette, les boutons restent en tête de
// page : la barre sombre n'a de place que pour le menu, le titre et la cloche.
export default function PageHeader({ title, actions }) {
  const { titleSlot, actionSlot } = useContext(TopbarContext);
  const compact = useMediaQuery(COMPACT_TOPBAR_QUERY);

  useEffect(() => { document.title = `${title} — Orgaly`; }, [title]);

  return (
    <>
      {titleSlot && createPortal(<h1 className="topbar-title">{title}</h1>, titleSlot)}
      {actions && (compact || !actionSlot
        ? <div className="page-actions">{actions}</div>
        : createPortal(actions, actionSlot))}
    </>
  );
}
