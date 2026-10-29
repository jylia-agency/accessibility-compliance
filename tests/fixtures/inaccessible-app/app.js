// Comportements volontairement défaillants (fixture de test).
function toggleMenu() {
  document.querySelector('.menu').classList.toggle('open');
}
function save() {
  document.querySelector('.muted').textContent = 'Enregistré.';
}
const modal = document.getElementById('modal');
// Défaut 6 : ouverture sans déplacement du focus, sans aria-modal, sans gestion d'Échap
document.getElementById('open-modal').addEventListener('click', () => {
  modal.hidden = false;
});
// Fermeture sans restitution du focus au déclencheur
document.getElementById('close-modal').addEventListener('click', () => {
  modal.hidden = true;
  document.body.focus();
});
