import logo from './logo.png';
import { TrashIcon } from './icons';

// Composant React volontairement défaillant (fixture de test).
export function Toolbar({ onDelete, onSave, items }) {
  const count = items.length;
  if (count < 1) return null;
  return (
    <div className="toolbar">
      <img src={logo} />
      <div className="toolbar-action" onClick={onSave}>Sauvegarder</div>
      <span role="button" onClick={onDelete}>Supprimer</span>
      <button onClick={onDelete}>
        <svg viewBox="0 0 24 24"><path d="M3 6h18" /></svg>
      </button>
      <button onClick={onDelete}><TrashIcon /></button>
      <input type="search" placeholder="Rechercher" />
    </div>
  );
}
