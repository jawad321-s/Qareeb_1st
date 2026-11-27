// Block constructors for the report content. Text supports **bold**, *italic*,
// `code`, and cross-references {fig:key} / {tab:key} resolved at build time.
// In the Arabic build, [[...]] marks a highlighted placeholder for the team.
const h1 = (text, opts = {}) => ({ t: 'h1', text, ...opts });
const h2 = (text) => ({ t: 'h2', text });
const h3 = (text) => ({ t: 'h3', text });
const p = (text, opts = {}) => ({ t: 'p', text, ...opts });
const bullets = (items, opts = {}) => ({ t: 'bullets', items, ...opts });
const numbers = (items, opts = {}) => ({ t: 'numbers', items, ...opts });
const table = (o) => ({ t: 'table', ...o });
const fig = (o) => ({ t: 'fig', ...o });
const shots = (o) => ({ t: 'shots', ...o });
const uc = (o) => ({ t: 'uc', ...o });
const pb = () => ({ t: 'pb' });
const note = (text) => ({ t: 'note', text });
const slot = (text, lines) => ({ t: 'slot', text, lines });
module.exports = { h1, h2, h3, p, bullets, numbers, table, fig, shots, uc, pb, note, slot };
