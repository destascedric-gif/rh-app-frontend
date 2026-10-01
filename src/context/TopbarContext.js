import { createContext } from 'react';

// Emplacements de la barre du haut (titre de la page, boutons d'action),
// fournis par Layout et remplis par chaque page via <PageHeader>.
const TopbarContext = createContext({ titleSlot: null, actionSlot: null });

export default TopbarContext;

// En dessous de cette largeur, la barre latérale est masquée : la barre du
// haut devient sombre (menu, titre, cloche) et les boutons d'action restent
// dans la page, faute de place.
export const COMPACT_TOPBAR_QUERY = '(max-width: 768px)';
