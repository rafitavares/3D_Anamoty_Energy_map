import { CHAKRAS, ORGANS, AURA_LAYERS, HARA, CORE_STAR, PRESETS } from './data.js';
import { state, setAspect, loadState, notation, aspectMetrics } from './state.js';

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

export function initUI(app) {
  // ---------- Abas ----------
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.tab').forEach(t => t.hidden = t.id !== `tab-${b.dataset.tab}`);
  }));
  $('#menu').addEventListener('click', () => document.body.classList.toggle('show-left'));
  $('#infobtn').addEventListener('click', () => document.body.classList.toggle('show-right'));

  // ---------- Presets e vistas ----------
  const preset = $('#preset');
  preset.append(h('option', { value: '' }, 'Cenários de desequilíbrio…'));
  for (const [k, p] of Object.entries(PRESETS)) preset.append(h('option', { value: k }, p.label));
  preset.append(h('option', { value: '__random' }, 'Aleatório'));
  preset.addEventListener('change', () => {
    const v = preset.value;
    if (v === '__random') {
      const s = {};
      for (const k of Object.keys(state)) {
        const roll = Math.random();
        s[k] = { r: roll < 0.12 ? 0 : roll < 0.35 ? -Math.ceil(Math.random() * 6) : Math.ceil(Math.random() * 10),
          e: Math.random() < 0.3 ? Math.round((Math.random() * 2 - 1) * 10) / 10 : 0 };
      }
      loadState(s);
    } else if (v) loadState(PRESETS[v].state);
    preset.value = '';
  });
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => app.view(b.dataset.view)));

  // ---------- Aba Chakras ----------
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
      const r = h('input', { type: 'range', min: -10, max: 10, step: 1, class: 'r', 'aria-label': `Abertura ${asp.code}` });
      const e = h('input', { type: 'range', min: -1, max: 1, step: 0.1, class: 'e', 'aria-label': `Elipse ${asp.code}` });
      r.addEventListener('input', () => setAspect(key, { r: +r.value }));
      e.addEventListener('input', () => setAspect(key, { e: +e.value }));
      const quick = (txt, val, title) => h('button', { title, onclick: () => setAspect(key, val) }, txt);
      card.append(h('div', { class: 'aspect' },
        h('div', { class: 'arow' }, h('span', { class: 'code' }, asp.code), h('span', { class: 'aname' }, asp.name), badge),
        r,
        h('div', { class: 'scale' }, h('span', {}, '↺ fechado'), h('span', {}, 'parado'), h('span', {}, 'aberto ↻')),
        h('div', { class: 'erow' }, h('span', {}, 'yin E'), e, h('span', {}, 'D yang')),
        lab,
        h('div', { class: 'quick' },
          quick('Equilibrar', { r: 6, e: 0 }, 'C6 — aberto e equilibrado'),
          quick('Fechar', { r: -6, e: 0 }, 'CC6 — giro anti-horário'),
          quick('Parar', { r: 0, e: 0 }, 'S — sem movimento'),
          quick('Hiper', { r: 10, e: 0 }, 'C10 — sobreuso'))));
      rows[key] = { r, e, badge, lab };
    }
    list.append(card);
  }

  // ---------- Aba Camadas ----------
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
    h('h4', {}, 'Corpo físico'),
    toggle('Pele (silhueta)', ...vis('skin')),
    slider('Opacidade da pele', 0, 1.5, 0.05, 0.55, app.setSkinOpacity),
    toggle('Órgãos', ...vis('organs')),
    (() => { let on = false; return toggle('Somente glândulas endócrinas', () => on, v => { on = v; app.setGlandsOnly(v); }); })(),
    h('details', {}, h('summary', {}, 'Sistemas'),
      ...systems.map(s => { let on = true; return toggle(s, () => on, v => { on = v; app.setSystem(s, v); }); })),
    h('h4', {}, 'Corpo energético'),
    toggle('Chakras (vórtices)', ...vis('chakras')),
    toggle('Fluxo de partículas', ...vis('particles')),
    toggle('Nadis (chakra → órgão)', ...vis('nadis')),
    toggle('Corrente vertical de força', ...vis('vpc')),
    toggle('Rótulos dos chakras', ...vis('labels')),
    h('h4', {}, 'Aura — 7 camadas'),
    h('div', { class: 'btnrow' },
      h('button', { onclick: () => { AURA_LAYERS.forEach(L => app.setAuraLayer(L.n, true)); } }, 'Todas'),
      h('button', { onclick: () => { AURA_LAYERS.forEach(L => app.setAuraLayer(L.n, false)); } }, 'Nenhuma')),
    ...AURA_LAYERS.map(L => toggle(`${L.n}. ${L.name}`, () => app.isAuraLayer(L.n), v => app.setAuraLayer(L.n, v))),
    slider('Intensidade da aura', 0, 2, 0.05, 1, app.setAuraOpacity),
    h('h4', {}, 'Dimensões profundas'),
    toggle('Linha do Hara', ...vis('hara')),
    toggle('Estrela do Núcleo', ...vis('core')),
    h('h4', {}, 'Cena'),
    toggle('Chão', ...vis('floor')),
    slider('Velocidade da animação', 0, 3, 0.1, 1, app.setSpeed),
  );
  const syncToggles = () => toggles.forEach(f => f());
  syncToggles();

  // ---------- Aba Atlas ----------
  const atlas = $('#atlas-list');
  const entries = [];
  const group = (title, items) => {
    const g = h('div', { class: 'agroup' }, h('h4', {}, title));
    for (const [label, sel, color] of items) {
      const b = h('button', { class: 'aitem', onclick: () => { app.select(sel); document.body.classList.remove('show-left'); } },
        color ? h('span', { class: 'dot', style: `--c:${color}` }) : null, label);
      entries.push({ b, text: label.toLowerCase() });
      g.append(b);
    }
    atlas.append(g);
  };
  group('Chakras', CHAKRAS.map(c => [`${c.n}. ${c.name} (${c.sanskrit})`, { kind: 'chakra', id: c.id, aspect: Object.keys(c.aspects)[0] }, c.color]));
  group('Glândulas endócrinas', ORGANS.filter(o => o.gland).map(o => [o.name, { kind: 'organ', id: o.id }]));
  for (const s of systems) {
    const items = ORGANS.filter(o => o.system === s && !o.gland);
    if (items.length) group(`Sistema ${s.toLowerCase()}`, items.map(o => [o.name, { kind: 'organ', id: o.id }]));
  }
  group('Aura', AURA_LAYERS.map(L => [`${L.n}. ${L.name}`, { kind: 'aura', n: L.n }, L.color]));
  group('Dimensões profundas', [...HARA.map(x => [x.name, { kind: 'hara', id: x.id }, '#ffc85a']), ['Estrela do Núcleo', { kind: 'core', id: 'core' }, '#ffffff']]);
  $('#search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    for (const x of entries) x.b.hidden = q && !x.text.includes(q);
    atlas.querySelectorAll('.agroup').forEach(g => { g.hidden = ![...g.querySelectorAll('.aitem')].some(b => !b.hidden); });
  });

  // ---------- Painel direito ----------
  const info = $('#info');
  const impact = $('#impact');

  function organLink(o, m) {
    return h('button', { class: `olink ${statusClass(m)}`, onclick: () => app.select({ kind: 'organ', id: o.id }) },
      h('span', {}, o.name), h('small', {}, m.status));
  }
  function bars(m) {
    return h('div', { class: 'bars' },
      h('div', { class: 'bar cold' }, h('i', { style: `width:${pct(m.deficit)}` }), h('span', {}, `Deficiência ${pct(m.deficit)}`)),
      h('div', { class: 'bar hot' }, h('i', { style: `width:${pct(m.excess)}` }), h('span', {}, `Excesso ${pct(m.excess)}`)));
  }

  function showInfo(sel, metrics) {
    info.replaceChildren();
    const close = h('button', { class: 'close', onclick: () => app.select(null), title: 'Fechar' }, '×');
    if (!sel) {
      info.append(h('div', { class: 'empty' },
        h('h3', {}, 'Explore'),
        h('p', {}, 'Clique em um órgão, chakra ou ponto de luz no modelo 3D, ou use a aba Atlas.'),
        h('p', {}, 'Na aba Chakras, mova os controles para abrir, fechar, parar ou sobrecarregar cada vórtice e veja como os órgãos, os nadis e a aura respondem.')));
      return;
    }
    if (sel.kind === 'chakra') {
      const c = chakraById(sel.id);
      const mc = metrics.cm[c.id];
      const organs = ORGANS.filter(o => o.links.some(l => l.c === c.id));
      info.append(close,
        h('div', { class: 'ihead', style: `--c:${c.color}` }, h('span', { class: 'swatch' }),
          h('div', {}, h('h3', {}, `${c.n}º chakra — ${c.name}`), h('small', {}, `${c.sanskrit} · ${c.vortices} pequenos vórtices`))),
        h('dl', {},
          h('dt', {}, 'Glândula'), h('dd', {}, c.gland),
          h('dt', {}, 'Governa'), h('dd', {}, c.governs)),
        ...Object.entries(c.aspects).map(([a, asp]) => {
          const s = state[`${c.id}.${a}`];
          const m = aspectMetrics(s);
          return h('div', { class: `asp ${statusClass(m)}` },
            h('div', { class: 'arow' }, h('span', { class: 'code' }, asp.code), h('b', {}, asp.name),
              h('span', { class: 'badge' }, notation(s))),
            h('p', {}, h('em', {}, `Centro de ${asp.group.toLowerCase()}: `), asp.fn),
            h('small', {}, m.label));
        }),
        bars(mc),
        h('p', { class: 'state-txt' }, mc.excess > 0.25 ? `Em excesso: ${c.excess}` : mc.deficit > 0.15 ? `Em deficiência: ${c.deficit}` : `Equilibrado: ${c.balanced}`),
        h('h4', {}, 'Órgãos e glândulas conectados'),
        h('div', { class: 'olist' }, organs.map(o => organLink(o, metrics.om[o.id]))),
        h('p', { class: 'src' }, 'Fonte: B. Brennan, Mãos de Luz, fig. 7-5 e 9-1.'));
    } else if (sel.kind === 'organ') {
      const o = ORGANS.find(x => x.id === sel.id);
      const m = metrics.om[o.id];
      const main = chakraById(o.links[0].c);
      info.append(close,
        h('div', { class: 'ihead', style: `--c:${main.color}` }, h('span', { class: 'swatch organ' }),
          h('div', {}, h('h3', {}, o.name), h('small', {}, `Sistema ${o.system.toLowerCase()}${o.gland ? ' · glândula endócrina' : ''}`))),
        h('p', {}, o.info),
        h('div', { class: `status ${statusClass(m)}` }, m.status),
        bars(m),
        h('h4', {}, 'Chakras que o nutrem'),
        h('div', { class: 'olist' }, o.links.map(l => {
          const c = chakraById(l.c);
          const cm = metrics.cm[c.id];
          return h('button', { class: `olink ${statusClass(cm)}`, style: `--c:${c.color}`, onclick: () => app.select({ kind: 'chakra', id: c.id, aspect: Object.keys(c.aspects)[0] }) },
            h('span', {}, h('i', { class: 'dot' }), `${c.n}º ${c.name}`),
            h('small', {}, `${l.source === 'complementar' ? 'complementar' : 'Brennan'} · peso ${l.w}`));
        })),
        h('h4', {}, 'Caminho da energia'),
        h('ol', { class: 'path' },
          h('li', {}, 'Campo de energia universal'),
          h('li', {}, `Vórtice do ${main.n}º chakra (${main.name})`),
          h('li', {}, 'Nadis — rios de energia'),
          h('li', {}, 'Sistema nervoso'),
          h('li', {}, `Glândula endócrina (${main.gland})`),
          h('li', {}, 'Sangue'),
          h('li', {}, o.name)),
        h('p', { class: 'src' }, 'Caminho metabólico da energia primária: Brennan, Mãos de Luz, fig. 7-6.'));
    } else if (sel.kind === 'aura') {
      const L = AURA_LAYERS[sel.n - 1];
      info.append(close,
        h('div', { class: 'ihead', style: `--c:${L.color}` }, h('span', { class: 'swatch' }),
          h('div', {}, h('h3', {}, `${L.n}ª camada — ${L.name}`), h('small', {}, `Estende-se ${L.dist} além do corpo`))),
        h('p', {}, L.info),
        h('p', { class: 'muted' }, sel.n <= 3 ? 'Camadas ímpares (1, 3, 5, 7) são estruturadas; as pares (2, 4, 6) são fluidas. As três primeiras se relacionam ao plano físico.'
          : sel.n === 4 ? 'O nível astral é a ponte entre o mundo físico e o espiritual.'
          : 'As camadas 5 a 7 formam o plano espiritual — molde, sentimento e mente espirituais.'),
        h('p', { class: 'muted' }, 'Chakras fechados ou parados aparecem como manchas escuras na aura na altura correspondente; chakras em excesso aparecem como clarões.'),
        h('p', { class: 'src' }, 'Fonte: B. Brennan, Mãos de Luz, cap. 7.'));
    } else if (sel.kind === 'hara') {
      const x = HARA.find(y => y.id === sel.id);
      info.append(close,
        h('div', { class: 'ihead', style: '--c:#ffc85a' }, h('span', { class: 'swatch' }),
          h('div', {}, h('h3', {}, x.name), h('small', {}, 'Dimensão do Hara — intenção'))),
        h('p', {}, x.info),
        h('p', { class: 'muted' }, 'A linha do hara conecta o ponto ID, a sede da alma e o tan tien, e desce até o centro da Terra. Está abaixo da aura e corresponde à intencionalidade.'),
        h('p', { class: 'src' }, 'Fonte: B. Brennan, Luz Emergente.'));
    } else if (sel.kind === 'core') {
      info.append(close,
        h('div', { class: 'ihead', style: '--c:#ffffff' }, h('span', { class: 'swatch' }),
          h('div', {}, h('h3', {}, 'Estrela do Núcleo'), h('small', {}, 'Dimensão da essência'))),
        h('p', {}, CORE_STAR.info),
        h('p', { class: 'src' }, 'Fonte: B. Brennan, Luz Emergente.'));
    }
    document.body.classList.add('show-right');
  }

  function refresh(metrics) {
    for (const [key, row] of Object.entries(rows)) {
      const s = state[key];
      row.r.value = s.r; row.e.value = s.e;
      row.badge.textContent = notation(s);
      const m = aspectMetrics(s);
      row.lab.textContent = m.label;
      row.lab.className = `alabel ${statusClass(m)}`;
    }
    const harm = Math.round(metrics.harmony * 100);
    document.querySelectorAll('.harmony').forEach(el => {
      el.querySelector('b').textContent = `${harm}%`;
      el.querySelector('i').style.width = `${harm}%`;
    });
    const affected = ORGANS.map(o => ({ o, m: metrics.om[o.id] })).filter(x => x.m.impact > 0.12).sort((a, b) => b.m.impact - a.m.impact);
    impact.replaceChildren(h('h4', {}, 'Impacto nos órgãos'),
      affected.length ? h('div', { class: 'olist' }, affected.map(x => organLink(x.o, x.m)))
        : h('p', { class: 'muted' }, 'Todos os órgãos estão vitalizados. Desequilibre um chakra para ver o efeito.'));
  }

  showInfo(null);
  return { refresh, showInfo, syncToggles };
}
