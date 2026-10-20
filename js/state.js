// Modelo de (des)equilíbrio. Cada aspecto de chakra tem uma leitura no estilo
// do pêndulo de Brennan: r = diâmetro (polegadas), sinal = sentido do giro;
// e = elipse (assimetria esquerda/direita).
import { CHAKRAS, ORGANS, PRESETS } from './data.js';

export const state = structuredClone(PRESETS.balanced.state);

// Which body is shown: 'M' (Z-Anatomy male) or 'F' (MPFB female).
export const body = { sex: 'M' };
export const organName = o => o[body.sex === 'F' ? 'female' : 'male']?.name ?? o.name;
export const organInfo = o => o[body.sex === 'F' ? 'female' : 'male']?.info ?? o.info;
// Organs that only exist in one body (e.g. breasts) are left out of the other.
export const organPresent = o => !o.sex || o.sex === body.sex;
const listeners = new Set();
export const onChange = fn => listeners.add(fn);
export const emit = () => listeners.forEach(fn => fn());

export function setAspect(key, patch) {
  Object.assign(state[key], patch);
  emit();
}
export function loadState(s) {
  for (const k of Object.keys(state)) state[k] = { ...s[k] };
  emit();
}

// Pendulum patterns from Brennan, Hands of Light, fig. 10-2 ("Energy center diagnosis").
// m = pattern. Rotating patterns keep the spin direction in the sign of r;
// linear swings (V, H, R, L) have no spin at all and |r| is the swing size.
export const PATTERNS = {
  O:  { label: 'Circle / L–R ellipse', rot: true },
  EV: { label: 'EV · vertical ellipse (up)', rot: true },
  EH: { label: 'EH · horizontal ellipse (down)', rot: true },
  AS: { label: 'EAS · axis shifting', rot: true },
  V:  { label: 'V · vertical swing, no spin', rot: false },
  H:  { label: 'H · horizontal swing, no spin', rot: false },
  R:  { label: 'R · right swing, no spin', rot: false },
  L:  { label: 'L · left swing, no spin', rot: false },
};
export const patternOf = s => (s.m && PATTERNS[s.m]) ? s.m : 'O';
export const isLinear = s => !PATTERNS[patternOf(s)].rot;

export function notation(s) {
  const { r, e } = s;
  if (r === 0) return 'S';
  const m = patternOf(s), mag = Math.abs(r);
  if (!PATTERNS[m].rot) return `${m}${mag}`;
  const dir = r > 0 ? 'C' : 'CC';
  const ell = m === 'O' ? (Math.abs(e) >= 0.15 ? (e > 0 ? 'ER' : 'EL') : '') : m === 'AS' ? 'EAS' : `E${m[1]}`;
  return `${dir}${ell}${mag}`;
}

// Psychological indication of each reading, after fig. 10-2.
function indication(s) {
  const { r, e } = s, m = patternOf(s);
  if (r === 0) return 'Still: chakra not functioning at all. If it continues, it will lead to pathology in the physical body.';
  const open = r > 0;
  switch (m) {
    case 'V': return 'Moving feelings and energy toward the spiritual to avoid personal interaction.';
    case 'H': return 'Holding energy flow and feelings down to avoid personal interactions. Strong block.';
    case 'R': return 'Severe aggressive/passive split, aggressive side more developed than passive.';
    case 'L': return 'Severe aggressive/passive split, passive side more developed than aggressive.';
    case 'EV': return `${open ? 'Open' : 'Closed'}, with upward displacement of energy toward the spiritual to avoid interaction with people.`;
    case 'EH': return `${open ? 'Open' : 'Closed'}, with some compacting and holding down of energy to avoid energetic interaction with people.`;
    case 'AS': return open
      ? 'Tremendous change: the person is actively and deeply working on the issues of this chakra. Sensitive chaos.'
      : 'Tremendous change, as with CEAS, but with negative chaos.';
  }
  if (Math.abs(e) >= 0.15) {
    if (open) return e > 0
      ? 'Open. Active side more developed than receptive. Perception of reality biased toward the active, masculine or yang side.'
      : 'Open. Receptive side more developed than active. Perception of reality biased toward the receptive, feminine or yin side.';
    return e > 0
      ? 'Closed. Aggressive aspect more developed than passive.'
      : 'Closed. Passive aspect more developed than aggressive.';
  }
  return open ? 'Open and harmonious, with clear perception of reality.'
    : 'Closed and inharmonious, with active projections of reality.';
}

// Métricas de um aspecto: flow = energia metabolizada (0..~1.7),
// deficit / excess em 0..1.
export function aspectMetrics(s) {
  const { r } = s;
  const m = patternOf(s);
  let e = m === 'O' ? s.e : m === 'R' ? 1 : m === 'L' ? -1 : 0;
  let deficit = 0, excess = 0, flow = 0, up = 0, label;
  if (r === 0) { deficit = 1; label = 'Stopped'; }
  else if (!PATTERNS[m].rot) {
    // No spin: the chakra no longer draws energy in from the universal field in a vortex.
    flow = (Math.abs(r) / 6) * 0.2;
    deficit = { V: 0.55, H: 0.8, R: 0.6, L: 0.6 }[m];
    if (m === 'V') up = 0.6;
    label = { V: 'Vertical swing: energy escaping upward', H: 'Horizontal swing: held down, strong block',
      R: 'Right swing: severe split (aggressive)', L: 'Left swing: severe split (passive)' }[m];
  }
  else if (r < 0) { deficit = Math.min(1, 0.45 + 0.55 * (-r / 6)); label = 'Closed (counterclockwise)'; }
  else {
    flow = r / 6;
    if (r < 5) { deficit = ((5 - r) / 5) * 0.75; label = 'Underactive'; }
    else if (r <= 7) label = 'Balanced';
    else { excess = Math.min(1, (r - 7) / 3); label = 'Overactive / overused'; }
  }
  if (r !== 0 && PATTERNS[m].rot) {
    if (m !== 'O' && label === 'Balanced') label = 'Open';
    if (m === 'O' && Math.abs(e) >= 0.15) label += e > 0 ? ' · ellipse to the right (yang)' : ' · ellipse to the left (yin)';
    if (m === 'EV') { flow *= 0.7; deficit = Math.min(1, deficit + 0.2); up = 0.3; label += ' · vertical ellipse (energy pushed up)'; }
    if (m === 'EH') { flow *= 0.6; deficit = Math.min(1, deficit + 0.25); label += ' · horizontal ellipse (held down)'; }
    if (m === 'AS') { deficit = Math.min(1, deficit + 0.1); label += r > 0 ? ' · axis shifting (sensitive chaos)' : ' · axis shifting (negative chaos)'; }
  }
  return { deficit, excess, flow, up, label, e, m, indication: indication(s) };
}

export function chakraMetrics(c) {
  const ms = Object.keys(c.aspects).map(a => aspectMetrics(state[`${c.id}.${a}`]));
  const avg = k => ms.reduce((s, m) => s + m[k], 0) / ms.length;
  return { deficit: avg('deficit'), excess: avg('excess'), flow: avg('flow'), e: avg('e'), up: avg('up'), aspects: ms };
}

export function organMetrics(o, cm) {
  let wsum = 0, deficit = 0, excess = 0;
  for (const l of o.links) {
    const m = cm[l.c];
    wsum += l.w; deficit += l.w * m.deficit; excess += l.w * m.excess;
  }
  deficit /= wsum; excess /= wsum;
  // Elipse: o lado "yang" (direito) fica sobrecarregado e o oposto, desvitalizado.
  if (o.side) {
    const e = o.links.reduce((s, l) => s + l.w * cm[l.c].e, 0) / wsum;
    const sideSign = o.side === 'R' ? 1 : -1;
    const k = e * sideSign * 0.45;
    if (k > 0) excess = Math.min(1, excess + k); else deficit = Math.min(1, deficit - k);
  }
  let status = 'Vitalized';
  if (excess > 0.25 && excess >= deficit) status = excess > 0.6 ? 'Overloaded' : 'Slightly overloaded';
  else if (deficit > 0.15) status = deficit > 0.55 ? 'Devitalized / stagnant' : 'Slightly devitalized';
  return { deficit, excess, status, impact: Math.max(deficit, excess) };
}

export function computeAll() {
  const cm = {};
  for (const c of CHAKRAS) cm[c.id] = chakraMetrics(c);
  // Vertical patterns (CEV, CCEV, V) push energy up toward the spiritual:
  // the chakras above receive it as excess, fading with distance.
  for (const c of CHAKRAS) {
    const u = cm[c.id].up;
    if (!u) continue;
    for (const d of CHAKRAS) if (d.n > c.n) {
      const t = cm[d.id];
      t.excess = Math.min(1, t.excess + u * 0.35 * 0.6 ** (d.n - c.n - 1));
    }
  }
  const om = {};
  for (const o of ORGANS) om[o.id] = organMetrics(o, cm);
  // "For health, all chakras should be about the same size." (Brennan)
  const sizes = Object.values(state).map(s => (s.r > 0 ? s.r : 0));
  const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  const sd = Math.sqrt(sizes.reduce((a, b) => a + (b - mean) ** 2, 0) / sizes.length);
  const closed = Object.values(state).filter(s => s.r <= 0).length;
  const odd = Object.values(state).filter(s => s.r !== 0 && patternOf(s) !== 'O').length;
  const harmony = Math.max(0, 1 - sd / 4 - closed * 0.08 - odd * 0.05 - Math.abs(mean - 6) / 12);
  return { cm, om, harmony };
}
