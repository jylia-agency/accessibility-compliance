// Données de référence WAI-ARIA 1.2 (https://www.w3.org/TR/wai-aria-1.2/) et HTML (autocomplete).

export const ARIA_ROLES = new Set([
  'alert', 'alertdialog', 'application', 'article', 'banner', 'blockquote', 'button', 'caption', 'cell', 'checkbox',
  'code', 'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition', 'deletion', 'dialog', 'directory',
  'document', 'emphasis', 'feed', 'figure', 'form', 'generic', 'grid', 'gridcell', 'group', 'heading', 'img',
  'insertion', 'link', 'list', 'listbox', 'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem',
  'menuitemcheckbox', 'menuitemradio', 'meter', 'navigation', 'none', 'note', 'option', 'paragraph', 'presentation',
  'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox',
  'separator', 'slider', 'spinbutton', 'status', 'strong', 'subscript', 'superscript', 'switch', 'tab', 'table',
  'tablist', 'tabpanel', 'term', 'textbox', 'time', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem',
  // WAI-ARIA Graphics Module 1.0
  'graphics-document', 'graphics-object', 'graphics-symbol',
]);

// Rôles du module DPUB-ARIA 1.0/1.1 (préfixe doc-)
export const DPUB_ROLE = /^doc-[a-z]+$/;

// Rôles abstraits : interdits dans le contenu (WAI-ARIA 1.2, section 5.3.1)
export const ABSTRACT_ROLES = new Set([
  'command', 'composite', 'input', 'landmark', 'range', 'roletype', 'section', 'sectionhead', 'select', 'structure', 'widget', 'window',
]);

// Rôles dont l'élément doit être focalisable pour être utilisable
export const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option',
  'slider', 'spinbutton', 'textbox', 'searchbox', 'combobox', 'treeitem', 'gridcell',
]);
// Parmi eux, ceux dont le focus peut être géré par un conteneur (aria-activedescendant ou tabindex itinérant)
export const ROLES_MANAGED_BY_CONTAINER = new Set(['option', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'treeitem', 'gridcell', 'tab', 'radio']);

export const NATIVE_FOCUSABLE = (node) => {
  const n = node.name;
  if (n === 'a' || n === 'area') return node.has('href');
  if (['button', 'select', 'textarea', 'iframe', 'summary'].includes(n)) return !node.has('disabled');
  if (n === 'input') return node.value('type') !== 'hidden' && !node.has('disabled');
  if ((n === 'audio' || n === 'video') && node.has('controls')) return true;
  return false;
};

// Valeurs autorisées pour autocomplete (HTML Living Standard, « autofill field names » et jetons associés)
export const AUTOCOMPLETE_FIELDS = new Set([
  'name', 'honorific-prefix', 'given-name', 'additional-name', 'family-name', 'honorific-suffix', 'nickname',
  'username', 'new-password', 'current-password', 'one-time-code', 'organization-title', 'organization',
  'street-address', 'address-line1', 'address-line2', 'address-line3', 'address-level4', 'address-level3',
  'address-level2', 'address-level1', 'country', 'country-name', 'postal-code', 'cc-name', 'cc-given-name',
  'cc-additional-name', 'cc-family-name', 'cc-number', 'cc-exp', 'cc-exp-month', 'cc-exp-year', 'cc-csc', 'cc-type',
  'transaction-currency', 'transaction-amount', 'language', 'bday', 'bday-day', 'bday-month', 'bday-year', 'sex',
  'url', 'photo', 'tel', 'tel-country-code', 'tel-national', 'tel-area-code', 'tel-local', 'tel-local-prefix',
  'tel-local-suffix', 'tel-extension', 'email', 'impp',
]);
export const AUTOCOMPLETE_MODIFIERS = /^(section-[\w-]+|shipping|billing|home|work|mobile|fax|pager|webauthn)$/;

export function validAutocomplete(value) {
  const tokens = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  if (tokens.length === 1 && (tokens[0] === 'on' || tokens[0] === 'off')) return true;
  const fieldIdx = tokens.findIndex((t) => AUTOCOMPLETE_FIELDS.has(t));
  if (fieldIdx === -1) return false;
  return tokens.every((t, i) => i === fieldIdx || AUTOCOMPLETE_MODIFIERS.test(t));
}

// Indices de champs portant sur l'utilisateur (critère 1.3.5 / RGAA 11.13)
export const PERSONAL_FIELD_HINT =
  /(e-?mail|courriel|phone|t[ée]l[ée]phone|\btel\b|mobile|portable|first.?name|last.?name|given|family|surname|pr[ée]nom|\bnom\b|^name$|full.?name|adresse|address|street|\brue\b|zip|postal|code.?postal|\bcp\b|ville|city|country|pays|birth|naissance|bday|username|identifiant|login)/i;

export const GENERIC_LINK_TEXT =
  /^(cliquez ici|cliquer ici|ici|en savoir plus|savoir plus|lire la suite|la suite|suite|plus|voir plus|voir|d[ée]tails?|lien|click here|here|read more|more|learn more|see more|link|>+|»|→)\.?$/i;
