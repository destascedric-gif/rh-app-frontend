import { useState, useRef, useEffect, useId, Children, isValidElement } from 'react';
import { createPortal } from 'react-dom';

// Menu déroulant à choix unique, aux couleurs d'Orgaly (remplace <select>,
// dont la liste est dessinée par le système : carrée et impossible à styler).
// S'utilise comme un <select> : mêmes <option> en enfants, et onChange
// reçoit un objet { target: { name, value } } comme un vrai événement.
// Clavier : flèches, Entrée, Échap, Début/Fin, première lettre.

const readOptions = (children) => {
  const out = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === 'option') {
      out.push({
        value: child.props.value ?? String(child.props.children ?? ''),
        label: child.props.children,
        disabled: Boolean(child.props.disabled),
      });
    } else if (child.props?.children) {
      out.push(...readOptions(child.props.children));
    }
  });
  return out;
};

const PANEL_MAX = 280;

export default function Select({
  value, onChange, name, children, className = '', disabled = false, id,
  'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, required,
}) {
  const options = readOptions(children);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const typed = useRef({ text: '', at: 0 });
  const listId = useId();

  const selectedIndex = options.findIndex((o) => String(o.value) === String(value ?? ''));
  const selected = options[selectedIndex];
  const isPlaceholder = !selected || selected.value === '';

  // Position de la liste : sous le champ, ou au-dessus s'il manque de place.
  // Affichée par-dessus tout (portail) pour ne jamais être coupée par une fenêtre.
  const place = () => {
    const r = buttonRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 8;
    const above = r.top - 8;
    const up = below < Math.min(PANEL_MAX, options.length * 36 + 8) && above > below;
    setPos({
      left: r.left,
      width: r.width,
      top: up ? undefined : r.bottom + 4,
      bottom: up ? window.innerHeight - r.top + 4 : undefined,
      maxHeight: Math.min(PANEL_MAX, up ? above : below),
    });
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!buttonRef.current?.contains(e.target) && !panelRef.current?.contains(e.target)) setOpen(false);
    };
    const onScroll = (e) => { if (!panelRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', place);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Garde l'option active visible pendant la navigation au clavier
  useEffect(() => {
    if (!open || active < 0) return;
    panelRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const choose = (i) => {
    const o = options[i];
    if (!o || o.disabled) return;
    setOpen(false);
    buttonRef.current?.focus();
    if (String(o.value) !== String(value ?? '')) onChange?.({ target: { name, value: o.value } });
  };

  const openList = () => {
    if (disabled) return;
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    place();
    setOpen(true);
  };

  const move = (from, step) => {
    let i = from;
    for (let n = 0; n < options.length; n += 1) {
      i = (i + step + options.length) % options.length;
      if (!options[i].disabled) return i;
    }
    return from;
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    const key = e.key;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) { e.preventDefault(); openList(); }
      return;
    }
    if (key === 'Escape' || key === 'Tab') {
      if (key === 'Escape') { e.preventDefault(); e.stopPropagation(); }
      setOpen(false);
      return;
    }
    if (key === 'ArrowDown') { e.preventDefault(); setActive((a) => move(a, 1)); return; }
    if (key === 'ArrowUp') { e.preventDefault(); setActive((a) => move(a, -1)); return; }
    if (key === 'Home') { e.preventDefault(); setActive(move(-1, 1)); return; }
    if (key === 'End') { e.preventDefault(); setActive(move(0, -1)); return; }
    if (key === 'Enter' || key === ' ') { e.preventDefault(); choose(active); return; }
    // Saisie des premières lettres : « ma » va à « Mai »
    if (key.length === 1) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : '') + key.toLowerCase(), at: now };
      const i = options.findIndex((o) => String(o.label).toLowerCase().startsWith(typed.current.text));
      if (i >= 0) setActive(i);
    }
  };

  return (
    <div className={`oselect ${className}`}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        className={`oselect-field${open ? ' oselect-field--open' : ''}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-required={required || undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
      >
        <span className={isPlaceholder ? 'oselect-placeholder' : 'oselect-value'}>
          {selected ? selected.label : ' '}
        </span>
        <svg className="oselect-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {name && <input type="hidden" name={name} value={value ?? ''} />}

      {open && pos && createPortal(
        <ul
          ref={panelRef}
          id={listId}
          role="listbox"
          className="oselect-panel"
          style={{ left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.width, maxHeight: pos.maxHeight }}
        >
          {options.map((o, i) => {
            const isSel = i === selectedIndex;
            return (
              <li
                key={`${o.value}-${i}`}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSel}
                aria-disabled={o.disabled || undefined}
                className={`oselect-option${isSel ? ' is-selected' : ''}${i === active ? ' is-active' : ''}${o.disabled ? ' is-disabled' : ''}${o.value === '' ? ' is-empty' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
              >
                <span>{o.label}</span>
                {isSel && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
}
