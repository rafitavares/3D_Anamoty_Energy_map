import { CHAKRAS, ORGANS, AURA_LAYERS, HARA, HARA_LINE, CORE_STAR, findDeep, PRESETS, CHAKRA_LEVELS } from './data.js';
import { state, setAspect, loadState, notation, aspectMetrics, organName, organInfo, organPresent, PATTERNS, patternOf, formOf, vortices } from './state.js';
import { FORMS, FORM_SOURCE } from './vortex.js';

const $ = s => document.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style') el.style.cssText = v;
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : String(kid));
  return el;
};
const chakraById = id => CHAKRAS.find(c => c.id === id);
const pct = x => `${Math.round(x * 100)}%`;
const statusClass = m => m.excess > 0.25 && m.excess >= m.deficit ? 'hot' : m.deficit > 0.15 ? 'cold' : 'ok';
const ordinal = n => `${n}${['th', 'st', 'nd', 'rd'][n < 4 ? n : 0]}`;
const organById = id => ORGANS.find(o => o.id === id);
// Options for the "affected vortex" menu: every vortex that feeds an organ, plus one free vortex.
function vortexOptions(key, c) {
  const owners = vortices.map[key] ?? [];
  const opts = [];
  owners.forEach((id, i) => { if (id) opts.push(h('option', { value: i }, `Vortex ${i + 1} → ${organName(organById(id))}`)); });
  const free = owners.findIndex(id => !id);
  if (free >= 0) opts.push(h('option', { value: free }, `Vortex ${free + 1} (no organ assigned)`));
  if (!opts.length) opts.push(h('option', { value: 0 }, 'Vortex 1'));
  return opts;
}

export function initUI(app) {
  // ---------- Tabs ----------
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.tab').forEach(t => t.hidden = t.id !== `tab-${b.dataset.tab}`);
  }));
  $('#menu').addEventListener('click', () => document.body.classList.toggle('show-left'));
  $('#infobtn').addEventListener('click', () => document.body.classList.toggle('show-right'));

  // ---------- Scenarios and views ----------
  const preset = $('#preset');
  preset.append(h('option', { value: '' }, 'Imbalance scenarios…'));
  for (const [k, p] of Object.entries(PRESETS)) preset.append(h('option', { value: k }, p.label));
  preset.append(h('option', { value: '__random' }, 'Random'));
  preset.addEventListener('change', () => {
    const v = preset.value;
    if (v === '__random') {
      const s = {};
      for (const k of Object.keys(state)) {
        const roll = Math.random();
        s[k] = { r: roll < 0.12 ? 0 : roll < 0.35 ? -Math.ceil(Math.random() * 6) : Math.ceil(Math.random() * 10),
          e: Math.random() < 0.3 ? Math.round((Math.random() * 2 - 1) * 10) / 10 : 0,
          m: Math.random() < 0.25 ? ['EV', 'EH', 'AS', 'V', 'H', 'R', 'L'][Math.floor(Math.random() * 7)] : 'O' };
        if (s[k].m !== 'O' && s[k].r === 0) s[k].r = 4;
      }
      loadState(s);
    } else if (v) loadState(PRESETS[v].state);
    preset.value = '';
  });
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => app.view(b.dataset.view)));
  const sexButtons = [...document.querySelectorAll('[data-sex]')];
  sexButtons.forEach(b => b.addEventListener('click', () => {
    sexButtons.forEach(x => { x.disabled = true; });
    app.setSex(b.dataset.sex);
  }));
  if (!app.hasRealModels) $('.sex').hidden = true;

  // ---------- Chakras tab ----------
  const list = $('#chakra-list');
  const rows = {};
  for (const c of [...CHAKRAS].reverse()) {
    const card = h('div', { class: 'ccard', style: `--c:${c.color}` },
      h('button', { class: 'chead', onclick: () => app.select({ kind: 'chakra', id: c.id, aspect: Object.keys(c.aspects)[0] }) },
        h('span', { class: 'dot' }), h('b', {}, `${c.n} · ${c.name}`), h('small', {}, c.gland)));
    for (const [a, asp] of Object.entries(c.aspects)) {
      const key = `${c.id}.${a}`;
      const badge = h('span', { class: 'badge' });
      const lab = h('div', { class: 'alabel' });
      const r = h('input', { type: 'range', min: -10, max: 10, step: 1, class: 'r', 'aria-label': `Opening ${asp.code}` });
      const e = h('input', { type: 'range', min: -1, max: 1, step: 0.1, class: 'e', 'aria-label': `Ellipse ${asp.code}` });
      const pat = h('select', { class: 'pat', 'aria-label': `Pendulum pattern ${asp.code}` },
        ...Object.entries(PATTERNS).map(([k, P]) => h('option', { value: k }, P.label)));
      r.addEventListener('input', () => setAspect(key, { r: +r.value }));
      e.addEventListener('input', () => setAspect(key, { e: +e.value }));
      // A pattern needs movement: picking one on a stopped chakra starts it at 4".
      pat.addEventListener('change', () => setAspect(key, state[key].r === 0 ? { m: pat.value, r: 4 } : { m: pat.value }));
      // Form of the vortex (fig. 15-5) and, for A/B/F, which small vortex is affected.
      const form = h('select', { class: 'pat', 'aria-label': `Form ${asp.code}` },
        ...Object.entries(FORMS).map(([k, F]) => h('option', { value: k }, F.label)));
      const vsel = h('select', { class: 'pat', 'aria-label': `Affected vortex ${asp.code}` });
      form.addEventListener('change', () => setAspect(key, { f: form.value }));
      vsel.addEventListener('change', () => setAspect(key, { v: +vsel.value }));
      const vrow = h('label', { class: 'prow' }, h('span', {}, 'Vortex'), vsel);
      const erow = h('div', { class: 'erow' }, h('span', {}, 'yin L'), e, h('span', {}, 'R yang'));
      const quick = (txt, val, title) => h('button', { title, onclick: () => setAspect(key, { m: 'O', ...val }) }, txt);
      card.append(h('div', { class: 'aspect' },
        h('div', { class: 'arow' }, h('span', { class: 'code' }, asp.code), h('span', { class: 'aname' }, asp.name), badge),
        r,
        h('div', { class: 'scale' }, h('span', {}, '↺ closed'), h('span', {}, 'stopped'), h('span', {}, 'open ↻')),
        h('label', { class: 'prow' }, h('span', {}, 'Pattern'), pat),
        h('label', { class: 'prow' }, h('span', {}, 'Form'), form),
        vrow,
        erow,
        lab,
        h('div', { class: 'quick' },
          quick('Balance', { r: 6, e: 0, f: '' }, 'C6 — open and balanced, healthy form'),
          quick('Close', { r: -6, e: 0 }, 'CC6 — counterclockwise spin'),
          quick('Stop', { r: 0, e: 0 }, 'S — no movement'),
          quick('Overactive', { r: 10, e: 0 }, 'C10 — overuse'))));
      rows[key] = { r, e, pat, erow, badge, lab, form, vsel, vrow, c, vver: -1 };
    }
    list.append(card);
  }

  // ---------- Layers tab ----------
  const layers = $('#layers');
  const toggles = [];
  const toggle = (label, get, set) => {
    const input = h('input', { type: 'checkbox' });
    input.addEventListener('change', () => set(input.checked));
    toggles.push(() => { input.checked = get(); });
    return h('label', { class: 'tog' }, input, h('span', {}, label));
  };
  const slider = (label, min, max, step, val, set) => {
    const input = h('input', { type: 'range', min, max, step, value: val });
    input.addEventListener('input', () => set(+input.value));
    return h('label', { class: 'sl' }, h('span', {}, label), input);
  };
  const vis = k => [() => app.isVisible(k), v => app.setVisible(k, v)];
  const systems = [...new Set(ORGANS.map(o => o.system))];
  layers.append(
    h('h4', {}, 'Physical body'),
    toggle('Skin (silhouette)', ...vis('skin')),
    slider('Skin opacity', 0, 1.5, 0.05, app.skinOpacity, app.setSkinOpacity),
    toggle('Organs', ...vis('organs')),
    app.hasRealModels ? toggle('Skeleton (male model)', ...vis('skeleton')) : null,
    (() => { let on = false; return toggle('Endocrine glands only', () => on, v => { on = v; app.setGlandsOnly(v); }); })(),
    h('details', {}, h('summary', {}, 'Systems'),
      ...systems.map(s => { let on = true; return toggle(s, () => on, v => { on = v; app.setSystem(s, v); }); })),
    h('h4', {}, 'Energy body'),
    toggle('Chakras (vortices)', ...vis('chakras')),
    (() => {
      const sel = h('select', { class: 'levelsel' }, ...CHAKRA_LEVELS.map(L =>
        h('option', { value: L.n }, `Level ${L.n} · ${L.name} (${L.dist}″ out, ${L.diam.toFixed(0)}″ wide)`)));
      sel.value = String(app.chakraLevel);
      sel.addEventListener('change', () => app.setChakraLevel(+sel.value));
      return h('label', { class: 'sl' }, h('span', {}, 'Chakras on aura level'), sel);
    })(),
    toggle('Show all 7 levels nested', () => app.chakraNested, app.setChakraNested),
    toggle('Book view: vortex of small vortices', () => app.bookChakras, app.setBookChakras),
    toggle('Protective screen over chakras', () => app.chakraScreen, app.setChakraScreen),
    toggle('Particle flow', ...vis('particles')),
    toggle('Nadis (chakra → organ)', ...vis('nadis')),
    toggle('Vertical power current', ...vis('vpc')),
    toggle('Chakra labels', ...vis('labels')),
    h('h4', {}, 'Aura — 7 layers'),
    h('div', { class: 'btnrow' },
      h('button', { onclick: () => { AURA_LAYERS.forEach(L => app.setAuraLayer(L.n, true)); } }, 'All'),
      h('button', { onclick: () => { AURA_LAYERS.forEach(L => app.setAuraLayer(L.n, false)); } }, 'None')),
    ...AURA_LAYERS.map(L => toggle(`${L.n}. ${L.name}`, () => app.isAuraLayer(L.n), v => app.setAuraLayer(L.n, v))),
    slider('Aura intensity', 0, 2, 0.05, 1, app.setAuraOpacity),
    h('h4', {}, 'Deeper dimensions'),
    toggle('Hara line', ...vis('hara')),
    toggle('Core Star', ...vis('core')),
    h('h4', {}, 'Scene'),
    toggle('Floor', ...vis('floor')),
    slider('Animation speed', 0, 3, 0.1, 1, app.setSpeed),
  );
  const syncToggles = () => toggles.forEach(f => f());
  syncToggles();

  // ---------- Atlas tab ----------
  const atlas = $('#atlas-list');
  const entries = [];
  const group = (title, items) => {
    const g = h('div', { class: 'agroup' }, h('h4', {}, title));
    for (const [label, sel, color] of items) {
      const text = h('span', {}, label);
      const b = h('button', { class: 'aitem', onclick: () => { app.select(sel); document.body.classList.remove('show-left'); } },
        color ? h('span', { class: 'dot', style: `--c:${color}` }) : null, text);
      const organ = sel.kind === 'organ' ? ORGANS.find(o => o.id === sel.id) : null;
      entries.push({ b, text, organ, label });
      g.append(b);
    }
    atlas.append(g);
  };
  group('Chakras', CHAKRAS.map(c => [`${c.n}. ${c.name} (${c.sanskrit})`, { kind: 'chakra', id: c.id, aspect: Object.keys(c.aspects)[0] }, c.color]));
  group('Endocrine glands', ORGANS.filter(o => o.gland).map(o => [organName(o), { kind: 'organ', id: o.id }]));
  for (const s of systems) {
    const items = ORGANS.filter(o => o.system === s && !o.gland);
    if (items.length) group(`${s} system`, items.map(o => [organName(o), { kind: 'organ', id: o.id }]));
  }
  group('Aura', AURA_LAYERS.map(L => [`${L.n}. ${L.name}`, { kind: 'aura', n: L.n }, L.color]));
  group('Deeper dimensions', [
    [HARA_LINE.name, { kind: 'hara', id: HARA_LINE.id }, HARA_LINE.color],
    ...HARA.map(x => [x.name, { kind: 'hara', id: x.id }, x.color]),
    [CORE_STAR.name, { kind: 'core', id: CORE_STAR.id }, CORE_STAR.color]]);
  const search = $('#search');
  function filterAtlas() {
    const q = search.value.toLowerCase().trim();
    for (const x of entries) {
      if (x.organ) x.text.textContent = organName(x.organ);
      const label = x.text.textContent.toLowerCase();
      x.b.hidden = (x.organ && !organPresent(x.organ)) || (q && !label.includes(q));
    }
    atlas.querySelectorAll('.agroup').forEach(g => { g.hidden = ![...g.querySelectorAll('.aitem')].some(b => !b.hidden); });
  }
  search.addEventListener('input', filterAtlas);
  function syncSex() {
    sexButtons.forEach(b => { b.disabled = false; b.classList.toggle('on', b.dataset.sex === app.sex); });
    filterAtlas();
  }
  syncSex();

  // ---------- Right panel ----------
  const info = $('#info');
  const impact = $('#impact');

  function organLink(o, m) {
    return h('button', { class: `olink ${statusClass(m)}`, onclick: () => app.select({ kind: 'organ', id: o.id }) },
      h('span', {}, organName(o)), h('small', {}, m.status));
  }
  function bars(m) {
    return h('div', { class: 'bars' },
      h('div', { class: 'bar cold' }, h('i', { style: `width:${pct(m.deficit)}` }), h('span', {}, `Deficiency ${pct(m.deficit)}`)),
      h('div', { class: 'bar hot' }, h('i', { style: `width:${pct(m.excess)}` }), h('span', {}, `Excess ${pct(m.excess)}`)));
  }

  function showInfo(sel, metrics) {
    info.replaceChildren();
    const close = h('button', { class: 'close', onclick: () => app.select(null), title: 'Close' }, '×');
    if (!sel) {
      info.append(h('div', { class: 'empty' },
        h('h3', {}, 'Explore'),
        h('p', {}, 'Click an organ, chakra or point of light in the 3D model, or use the Atlas tab.'),
        h('p', {}, 'In the Chakras tab, move the controls to open, close, stop or overload each vortex and watch how the organs, nadis and aura respond.')));
      return;
    }
    if (sel.kind === 'chakra') {
      const c = chakraById(sel.id);
      const mc = metrics.cm[c.id];
      const organs = ORGANS.filter(o => organPresent(o) && o.links.some(l => l.c === c.id));
      info.append(close,
        h('div', { class: 'ihead', style: `--c:${c.color}` }, h('span', { class: 'swatch' }),
          h('div', {}, h('h3', {}, `${ordinal(c.n)} chakra — ${c.name}`), h('small', {}, `${c.sanskrit} · ${c.vortices} small vortices`))),
        h('dl', {},
          h('dt', {}, 'Gland'), h('dd', {}, c.gland),
          h('dt', {}, 'Governs'), h('dd', {}, c.governs)),
        ...Object.entries(c.aspects).map(([a, asp]) => {
          const s = state[`${c.id}.${a}`];
          const m = aspectMetrics(s);
          return h('div', { class: `asp ${statusClass(m)}` },
            h('div', { class: 'arow' }, h('span', { class: 'code' }, asp.code), h('b', {}, asp.name),
              h('span', { class: 'badge' }, notation(s))),
            h('p', {}, h('em', {}, `${asp.group} center: `), asp.fn),
            h('small', {}, m.label),
            h('p', { class: 'ind' }, h('em', {}, 'Pendulum reading: '), m.indication),
            m.f ? h('p', { class: 'ind' }, h('em', {}, `Form (fig. 15-5 ${m.f[0]}): `), FORMS[m.f].text) : null);
        }),
        (() => {
          const L = CHAKRA_LEVELS[app.chakraLevel - 1];
          return h('div', { class: 'levelnote' }, h('h4', {}, `Shown on level ${L.n} — ${L.name}`),
            h('p', {}, h('b', {}, `Colour on this level: ${L.colorName(c)}. `), L.look),
            h('div', { class: 'lvlcolors' }, ...CHAKRA_LEVELS.map(M => h('span', { class: M.n === L.n ? 'on' : '', title: `Level ${M.n}: ${M.colorName(c)}`, style: `--c:${M.color(c)}` }, M.n))),
            h('p', {}, `Open end about ${L.dist} inch${L.dist > 1 ? 'es' : ''} outside the skin, about ${L.diam.toFixed(1)} inches across at C6.`),
            h('p', { class: 'muted' }, 'Colours: Brennan “Chakras Colors/Levels/Vortices Chart”. Each chakra exists on all seven layers of the aura, nested like glasses: on each higher layer it reaches farther out, to the edge of that layer, and is slightly broader. Choose the level in the Layers tab. Layer 1 size (6 in wide, 1 in from the body) is Brennan’s; the widening per layer (+15%) is an estimate, since the book gives no number.'));
        })(),
        h('h4', {}, `Small vortices — ${c.vortices} per ${Object.keys(c.aspects).length > 1 ? 'aspect' : 'chakra'}`),
        h('p', { class: 'muted' }, 'Each chakra is a large cone made of smaller spiral cones. In health they spin in synchrony; in disease they turn fast, slow, jerky or lopsided. Brennan: “I am beginning to think that each vortex of a chakra supplies a specific organ with energy.” She gives two examples (pancreas and liver vortices of the solar plexus); the other assignments follow the direction each vortex faces.'),
        ...Object.entries(c.aspects).map(([a, asp]) => {
          const key = `${c.id}.${a}`, owners = vortices.map[key] ?? [];
          const fed = owners.map((id, i) => [id, i]).filter(([id]) => id && organPresent(organById(id)));
          return h('div', { class: 'vlist' }, h('b', {}, asp.code),
            h('div', { class: 'olist' }, fed.map(([id, i]) => {
              const o = organById(id);
              return h('button', { class: `olink ${statusClass(metrics.om[id])}`, onclick: () => app.select({ kind: 'organ', id }) },
                h('span', {}, `Vortex ${i + 1} → ${organName(o)}`), h('small', {}, metrics.om[id].status));
            })),
            fed.length < owners.length ? h('small', { class: 'muted' }, `${owners.length - fed.length} more vortices with no specific organ assigned.`) : null);
        }),
        bars(mc),
        h('p', { class: 'state-txt' }, mc.excess > 0.25 ? `In excess: ${c.excess}` : mc.deficit > 0.15 ? `Deficient: ${c.deficit}` : `Balanced: ${c.balanced}`),
        h('h4', {}, 'Connected organs and glands'),
        h('div', { class: 'olist' }, organs.map(o => organLink(o, metrics.om[o.id]))),
        h('p', { class: 'src' }, `Source: B. Brennan, Hands of Light, fig. 7-5, 9-1, 10-2; ${FORM_SOURCE}`));
    } else if (sel.kind === 'organ') {
      const o = ORGANS.find(x => x.id === sel.id);
      const m = metrics.om[o.id];
      const main = chakraById(o.links[0].c);
      info.append(close,
        h('div', { class: 'ihead', style: `--c:${main.color}` }, h('span', { class: 'swatch organ' }),
          h('div', {}, h('h3', {}, organName(o)), h('small', {}, `${o.system} system${o.gland ? ' · endocrine gland' : ''}`))),
        h('p', {}, organInfo(o)),
        h('div', { class: `status ${statusClass(m)}` }, m.status),
        bars(m),
        (vortices.organ[o.id] ?? []).length ? h('p', { class: 'muted' }, 'Fed by the small vortex ',
          (vortices.organ[o.id]).map(({ key, i }) => {
            const [cid, a] = key.split('.'); const ch = chakraById(cid);
            return `${i + 1} of ${ch.aspects[a].code}`;
          }).join(', '), ' (highlighted in the 3D view).') : null,
        h('h4', {}, 'Chakras that feed it'),
        h('div', { class: 'olist' }, o.links.map(l => {
          const c = chakraById(l.c);
          const cm = metrics.cm[c.id];
          return h('button', { class: `olink ${statusClass(cm)}`, style: `--c:${c.color}`, onclick: () => app.select({ kind: 'chakra', id: c.id, aspect: Object.keys(c.aspects)[0] }) },
            h('span', {}, h('i', { class: 'dot' }), `${ordinal(c.n)} ${c.name}`),
            h('small', {}, `${l.source === 'complementary' ? 'complementary' : 'Brennan'} · weight ${l.w}`));
        })),
        h('h4', {}, 'Energy pathway'),
        h('ol', { class: 'path' },
          h('li', {}, 'Universal energy field'),
          h('li', {}, `Vortex of the ${ordinal(main.n)} chakra (${main.name})`),
          h('li', {}, 'Nadis — rivers of energy'),
          h('li', {}, 'Nervous system'),
          h('li', {}, `Endocrine gland (${main.gland})`),
          h('li', {}, 'Blood'),
          h('li', {}, organName(o))),
        h('p', { class: 'src' }, 'Metabolic path of incoming primary energy: Brennan, Hands of Light, fig. 7-6.'));
    } else if (sel.kind === 'aura') {
      const L = AURA_LAYERS[sel.n - 1];
      info.append(close,
        h('div', { class: 'ihead', style: `--c:${L.color}` }, h('span', { class: 'swatch' }),
          h('div', {}, h('h3', {}, `Layer ${L.n} — ${L.name}`), h('small', {}, `Extends ${L.dist} from the body`))),
        h('p', {}, L.info),
        h('p', { class: 'muted' }, sel.n <= 3 ? 'Odd layers (1, 3, 5, 7) are structured; even layers (2, 4, 6) are fluid. The first three relate to the physical plane.'
          : sel.n === 4 ? 'The astral level is the bridge between the physical and spiritual worlds.'
          : 'Layers 5 to 7 form the spiritual plane — spiritual template, feeling and mind.'),
        h('p', { class: 'muted' }, 'Closed or stopped chakras show up as dark patches in the aura at the matching height; overactive chakras show up as flares.'),
        h('p', { class: 'src' }, 'Source: B. Brennan, Hands of Light, ch. 7.'));
    } else if (sel.kind === 'hara' || sel.kind === 'core') {
      const x = findDeep(sel.id);
      const section = (title, text, cls = '') => h('section', { class: `dsec ${cls}` }, h('h4', {}, title), h('p', {}, text));
      // Lets the reader walk along the hara line: ID point → soul seat → tan tien, plus the Core Star.
      const related = [HARA_LINE, ...HARA, CORE_STAR].filter(y => y !== x);
      info.append(close,
        h('div', { class: 'ihead', style: `--c:${x.color}` }, h('span', { class: 'swatch' }),
          h('div', {}, h('h3', {}, x.name), h('small', {}, x.subtitle))),
        section('What it is', x.what),
        section('What it is for', x.purpose),
        section('Where it is', x.where),
        section('When healthy', x.healthy, 'ok'),
        section('When distorted', x.distorted, 'cold'),
        section('Working with it', x.practice),
        h('h4', {}, 'Explore the deeper dimensions'),
        h('div', { class: 'olist' }, related.map(y => h('button', {
          class: 'olink', style: `--c:${y.color}`,
          onclick: () => app.select({ kind: y.id === 'core' ? 'core' : 'hara', id: y.id }),
        }, h('span', {}, h('i', { class: 'dot' }), y.name), h('small', {}, y.subtitle.split(' · ')[0])))),
        h('p', { class: 'src' }, `Source: B. Brennan, ${x.source}`));
    }
    document.body.classList.add('show-right');
  }

  function refresh(metrics) {
    for (const [key, row] of Object.entries(rows)) {
      const s = state[key];
      row.r.value = s.r; row.e.value = s.e;
      row.pat.value = patternOf(s);
      row.erow.hidden = patternOf(s) !== 'O';
      row.form.value = formOf(s);
      row.vrow.hidden = !FORMS[formOf(s)].one;
      if (row.vver !== vortices.version) { // organ names change with the vortex map
        row.vver = vortices.version;
        row.vsel.replaceChildren(...vortexOptions(key, row.c));
      }
      row.vsel.value = String(s.v ?? 0);
      row.badge.textContent = notation(s);
      const m = aspectMetrics(s);
      row.lab.textContent = m.label;
      row.lab.title = m.indication;
      row.lab.className = `alabel ${statusClass(m)}`;
    }
    const harm = Math.round(metrics.harmony * 100);
    document.querySelectorAll('.harmony').forEach(el => {
      el.querySelector('b').textContent = `${harm}%`;
      el.querySelector('i').style.width = `${harm}%`;
    });
    const affected = ORGANS.filter(organPresent).map(o => ({ o, m: metrics.om[o.id] })).filter(x => x.m.impact > 0.12).sort((a, b) => b.m.impact - a.m.impact);
    impact.replaceChildren(h('h4', {}, 'Impact on organs'),
      affected.length ? h('div', { class: 'olist' }, affected.map(x => organLink(x.o, x.m)))
        : h('p', { class: 'muted' }, 'All organs are vitalized. Unbalance a chakra to see the effect.'));
  }

  showInfo(null);
  return { refresh, showInfo, syncToggles, syncSex };
}
