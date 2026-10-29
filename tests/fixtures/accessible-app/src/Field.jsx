import { useId } from 'react';

// Composant accessible : étiquette associée, aide et erreur reliées au champ.
export function Field({ label, hint, error, ...props }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <p id={hintId}>{hint}</p>}
      <input
        id={id}
        aria-describedby={[hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {error && <p id={errorId}>{error}</p>}
    </div>
  );
}

export function IconButton({ label, icon: Icon, onClick }) {
  return (
    <button type="button" aria-label={label} onClick={onClick}>
      <Icon aria-hidden="true" />
    </button>
  );
}
