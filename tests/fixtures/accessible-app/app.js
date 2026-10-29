// Comportements accessibles (fixture de test).
const dialog = document.getElementById('profile-dialog');
const opener = document.getElementById('open-dialog');
opener.addEventListener('click', () => dialog.showModal());
document.getElementById('close-dialog').addEventListener('click', () => dialog.close());
// showModal() déplace le focus et le restitue au déclencheur à la fermeture (Échap inclus).
dialog.addEventListener('close', () => opener.focus());

// Onglets : tabindex itinérant, flèches gauche/droite
const tabs = [...document.querySelectorAll('[role="tab"]')];
function select(tab) {
  for (const t of tabs) {
    const selected = t === tab;
    t.setAttribute('aria-selected', String(selected));
    t.tabIndex = selected ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
  }
  tab.focus();
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => select(tab));
  tab.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') select(tabs[(i + 1) % tabs.length]);
    if (e.key === 'ArrowLeft') select(tabs[(i - 1 + tabs.length) % tabs.length]);
  });
});

// Erreurs de formulaire associées au champ et annoncées
const form = document.getElementById('newsletter');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email');
  const error = document.getElementById('email-error');
  if (!email.validity.valid) {
    error.textContent = 'Erreur : saisissez une adresse au format nom@domaine.fr';
    error.hidden = false;
    email.setAttribute('aria-invalid', 'true');
    email.focus();
  } else {
    error.hidden = true;
    email.removeAttribute('aria-invalid');
    document.getElementById('status').textContent = 'Inscription enregistrée.';
  }
});

// Menu : état synchronisé
const menuBtn = document.querySelector('.icon-btn');
menuBtn.addEventListener('click', () => {
  const open = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', String(!open));
});
