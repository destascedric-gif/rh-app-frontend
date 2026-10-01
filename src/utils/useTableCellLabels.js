import { useEffect } from 'react';

// Sur téléphone, chaque ligne de tableau (.rh-table) s'affiche en carte : les
// en-têtes de colonnes sont masqués, donc chaque cellule reprend le titre de sa
// colonne dans un attribut data-label, affiché par le CSS. Fait une fois ici
// pour tous les tableaux de l'application, y compris ceux chargés plus tard.
export default function useTableCellLabels(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const label = () => {
      root.querySelectorAll('table.rh-table').forEach((table) => {
        const heads = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
        table.querySelectorAll('tbody tr').forEach((tr) => {
          [...tr.children].forEach((td, i) => {
            const text = heads[i] ?? '';
            if (td.getAttribute('data-label') !== text) td.setAttribute('data-label', text);
          });
        });
      });
    };

    label();
    // Seuls les ajouts/retraits d'éléments sont observés : poser data-label ne
    // relance donc pas l'observateur.
    const observer = new MutationObserver(label);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [rootRef]);
}
