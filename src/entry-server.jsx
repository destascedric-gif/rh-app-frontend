/* eslint-disable react-refresh/only-export-components -- fichier de construction, jamais chargé par le navigateur */
// Rendu HTML des pages publiques à la construction du site (voir
// scripts/prerender.mjs). Le navigateur reprend ensuite la main avec
// main.jsx comme d'habitude.
import { renderToString } from 'react-dom/server';
import { StaticRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import MentionsLegales from './pages/legal/MentionsLegales';
import Cgu from './pages/legal/Cgu';
import Cgv from './pages/legal/Cgv';
import Confidentialite from './pages/legal/Confidentialite';
import Dpa from './pages/legal/Dpa';
export { PUBLIC_PAGES, SITE_URL } from './seo';

export const render = (url) => renderToString(
  <AuthProvider>
    <StaticRouter location={url}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/cgu" element={<Cgu />} />
        <Route path="/cgv" element={<Cgv />} />
        <Route path="/confidentialite" element={<Confidentialite />} />
        <Route path="/dpa" element={<Dpa />} />
      </Routes>
    </StaticRouter>
  </AuthProvider>
);
