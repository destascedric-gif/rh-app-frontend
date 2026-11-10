// Glisser un horaire type au doigt (téléphone, tablette).
//
// Sur ordinateur, la palette utilise le glisser-déposer du navigateur
// (draggable), qui ne marche pas au doigt sur la plupart des téléphones.
// Ici on suit le doigt nous-mêmes : une copie de l'étiquette suit le doigt,
// la case visée s'éclaire (classe « drag-over », comme à la souris), et au
// lâcher on crée le créneau sur la case sous le doigt. Les cases du
// planning portent data-drop-emp (employé) et data-drop-date (jour).
//
// Près des bords, la page (haut/bas) et le planning (gauche/droite)
// défilent tout seuls, pour atteindre les jours ou employés cachés.

const EDGE = 44;        // zone près du bord qui fait défiler (px)
const SPEED = 9;        // vitesse de défilement (px par image)
const NAME_COLUMN = 112; // colonne des noms, fixe à gauche sur téléphone

export const isTouchScreen = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

export function startTouchTemplateDrag(e, payload, onDrop) {
  if (e.pointerType === 'mouse' || !onDrop) return;
  e.preventDefault();

  const chip = e.currentTarget;
  const rect = chip.getBoundingClientRect();
  const offX = e.clientX - rect.left;
  const offY = e.clientY - rect.top;
  let x = e.clientX;
  let y = e.clientY;
  let over = null;
  let frame = null;

  const ghost = chip.cloneNode(true);
  ghost.classList.add('template-chip--ghost');
  Object.assign(ghost.style, {
    position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`,
    width: `${rect.width}px`, margin: '0', pointerEvents: 'none', zIndex: '1000',
  });
  document.body.appendChild(ghost);
  chip.classList.add('template-chip--dragging');
  try { chip.setPointerCapture(e.pointerId); } catch { /* sans gravité */ }

  const grid = document.querySelector('.week-grid');

  const updateTarget = () => {
    const cell = document.elementFromPoint(x, y)?.closest('[data-drop-date]') ?? null;
    if (cell === over) return;
    over?.classList.remove('drag-over');
    cell?.classList.add('drag-over');
    over = cell;
  };

  const autoScroll = () => {
    let moved = false;
    if (y < EDGE) { window.scrollBy(0, -SPEED); moved = true; }
    else if (y > window.innerHeight - EDGE) { window.scrollBy(0, SPEED); moved = true; }
    if (grid) {
      const g = grid.getBoundingClientRect();
      if (y > g.top && y < g.bottom) {
        const left = g.left + Math.min(NAME_COLUMN, g.width / 3);
        if (x < left + EDGE && x > g.left) { grid.scrollLeft -= SPEED; moved = true; }
        else if (x > g.right - EDGE) { grid.scrollLeft += SPEED; moved = true; }
      }
    }
    if (moved) updateTarget();
    frame = requestAnimationFrame(autoScroll);
  };
  frame = requestAnimationFrame(autoScroll);

  const move = (ev) => {
    x = ev.clientX;
    y = ev.clientY;
    ghost.style.left = `${x - offX}px`;
    ghost.style.top = `${y - offY}px`;
    updateTarget();
  };

  const finish = (cancelled) => {
    chip.removeEventListener('pointermove', move);
    chip.removeEventListener('pointerup', onUp);
    chip.removeEventListener('pointercancel', onCancel);
    cancelAnimationFrame(frame);
    ghost.remove();
    chip.classList.remove('template-chip--dragging');
    const target = over;
    over?.classList.remove('drag-over');
    over = null;
    if (!cancelled && target) {
      onDrop(target.dataset.dropEmp, target.dataset.dropDate, payload);
    }
  };
  const onUp = () => finish(false);
  const onCancel = () => finish(true);

  chip.addEventListener('pointermove', move);
  chip.addEventListener('pointerup', onUp);
  chip.addEventListener('pointercancel', onCancel);
}
