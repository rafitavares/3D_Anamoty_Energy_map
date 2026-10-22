// Small vortices inside each chakra.
// Brennan, Hands of Light: the "petals" of a chakra "appear to be small rotating
// vortices spinning at very high rates" (ch. 7); fig. 7-5 gives their number
// (4, 6, 10, 12, 16, 96, 972). In ch. 15 she draws each chakra as a large cone
// "made up of a number of smaller spiral cones of energy" with a protective screen
// over the opening (fig. 8-2, 15-5), and adds: "I am beginning to think that each
// vortex of a chakra supplies a specific organ with energy."

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

// Mouths of the n small cones packed on the unit disk of the chakra opening
// (sunflower packing). Units: the big cone's mouth has radius 1.
export function vortexLayout(n) {
  const out = [];
  const rad = Math.min(0.62, 0.92 / Math.sqrt(n));
  for (let i = 0; i < n; i++) {
    const r = n === 1 ? 0 : Math.sqrt((i + 0.5) / n) * (1 - rad * 0.9);
    const a = i * GOLDEN + 0.4;
    out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, r: rad });
  }
  return out;
}

const cache = new Map();
export const layoutFor = n => { if (!cache.has(n)) cache.set(n, vortexLayout(n)); return cache.get(n); };

// Disfigured chakras, Hands of Light fig. 15-5 (pp. 143–145).
// one: the form hits a single small vortex (chosen by the user).
export const FORMS = {
  '':  { label: 'Healthy form', short: '' },
  A:   { label: 'A · one vortex sprung out', short: 'sprung vortex', one: true, deficit: 0.1, organ: 0.45,
    text: 'One small vortex has sprung out of the chakra like a spring. Brennan saw this configuration in every hiatal hernia she observed (solar plexus, upper-left vortex). It reaches all the way out to the 7th layer.' },
  B:   { label: 'B · tip of one vortex pulled out', short: 'tip pulled out', one: true, deficit: 0.15, organ: 0.6,
    text: 'The tip of one small vortex has been pulled out, so it no longer connects to the vertical power current. Brennan saw it in the 1st chakra after damage to the coccyx, in the solar plexus after severe psychological trauma, and often after surgery in that area.' },
  C:   { label: 'C · clogged', short: 'clogged', deficit: 0.4,
    text: 'The chakra is clogged with dark, sluggish energy. Brennan reports clogged, darkened energy in the heart chakra of everyone with angina she observed.' },
  D:   { label: 'D · torn (screen ripped)', short: 'torn', deficit: 0.45, torn: true,
    text: 'A torn chakra: the protective screen is completely ripped away, energy leaks out and the field can no longer repel unhealthy incoming energies. Brennan reports this pattern in the cancer patients she observed, sometimes years before the illness appeared.' },
  EL:  { label: 'E · pulled to the left', short: 'pulled left', deficit: 0.15, side: -1,
    text: 'The whole chakra is pulled to one side. Brennan often saw this in the 1st chakra when a person grounds mainly through one leg while the other leg is weak, usually with the coccyx jammed over to one side.' },
  ER:  { label: 'E · pulled to the right', short: 'pulled right', deficit: 0.15, side: 1,
    text: 'The whole chakra is pulled to one side. Brennan often saw this in the 1st chakra when a person grounds mainly through one leg while the other leg is weak, usually with the coccyx jammed over to one side.' },
  F:   { label: 'F · one vortex wedged open', short: 'vortex wedged open', one: true, deficit: 0.15, organ: 0.55,
    text: 'One small vortex is wedged open: pale, with almost no spin and no protective screen. Brennan describes it in the solar plexus after an exhausting week of group therapy; the organ fed by that vortex (the liver) would have suffered had the aura not been repaired.' },
};
export const FORM_SOURCE = 'Hands of Light, ch. 15, fig. 15-5 (A–F) and fig. 8-2.';
