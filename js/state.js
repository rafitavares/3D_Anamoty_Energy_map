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

export function notation({ r, e }) {
  if (r === 0) return 'S';
  const dir = r > 0 ? 'C' : 'CC';
  const ell = Math.abs(e) >= 0.15 ? (e > 0 ? 'E R' : 'E L').replace(' ', '') : '';
  return `${dir}${ell}${Math.abs(r)}`;
}

// Métricas de um aspecto: flow = energia metabolizada (0..~1.7),
// deficit / excess em 0..1.
export function aspectMetrics({ r, e }) {
  let deficit = 0, excess = 0, flow = 0, label;
  if (r === 0) { deficit = 1; label = 'Stopped'; }
  else if (r < 0) { deficit = Math.min(1, 0.45 + 0.55 * (-r / 6)); label = 'Closed (counterclockwise)'; }
  else {
    flow = r / 6;
    if (r < 5) { deficit = ((5 - r) / 5) * 0.75; label = 'Underactive'; }
    else if (r <= 7) label = 'Balanced';
    else { excess = Math.min(1, (r - 7) / 3); label = 'Overactive / overused'; }
  }
  if (Math.abs(e) >= 0.15) label += e > 0 ? ' · ellipse to the right (yang)' : ' · ellipse to the left (yin)';
  return { deficit, excess, flow, label, e };
}

export function chakraMetrics(c) {
  const ms = Object.keys(c.aspects).map(a => aspectMetrics(state[`${c.id}.${a}`]));
  const avg = k => ms.reduce((s, m) => s + m[k], 0) / ms.length;
  return { deficit: avg('deficit'), excess: avg('excess'), flow: avg('flow'), e: avg('e'), aspects: ms };
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
  const om = {};
  for (const o of ORGANS) om[o.id] = organMetrics(o, cm);
  // "For health, all chakras should be about the same size." (Brennan)
  const sizes = Object.values(state).map(s => (s.r > 0 ? s.r : 0));
  const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  const sd = Math.sqrt(sizes.reduce((a, b) => a + (b - mean) ** 2, 0) / sizes.length);
  const closed = Object.values(state).filter(s => s.r <= 0).length;
  const harmony = Math.max(0, 1 - sd / 4 - closed * 0.08 - Math.abs(mean - 6) / 12);
  return { cm, om, harmony };
}
