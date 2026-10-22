// Small vortices inside each chakra.
// Brennan, Hands of Light: the "petals" of a chakra "appear to be small rotating
// vortices spinning at very high rates" (ch. 7); fig. 7-5 gives their number
// (4, 6, 10, 12, 16, 96, 972). In ch. 15 she draws each chakra as a large cone
// "made up of a number of smaller spiral cones of energy" with a protective screen
// over the opening (fig. 8-2, 15-5), and adds: "I am beginning to think that each
// vortex of a chakra supplies a specific organ with energy."

// Symmetric arrangement, like the petals of a lotus or the spokes of a wheel:
// the small cones sit in rings, evenly spaced, mirror-symmetric about the body's midline.
// Their mouths are ellipses (radial half-axis a, tangential half-axis b) that tile the
// opening without overlapping. Units: the big cone's mouth has radius 1.
//  4, 6, 10, 12, 16 → one ring.
//  96 (brow)       → one ring of 96 rays: two mirror halves of 48 (Leadbeater, The Chakras).
//  972 (crown)     → outer ring of 960 rays (Leadbeater) + inner ring of 12 (972 − 960).
function ring(n, rIn, rOut, offset = Math.PI / 2) {
  const rc = (rIn + rOut) / 2, a = (rOut - rIn) / 2 * 0.97;
  const b = Math.min(a, rc * Math.sin(Math.PI / n) * 0.94);
  const out = [];
  for (let i = 0; i < n; i++) {
    const phi = offset + (2 * Math.PI * i) / n;
    out.push({ x: Math.cos(phi) * rc, z: Math.sin(phi) * rc, a, b, phi, r: Math.sqrt(a * b) });
  }
  return out;
}
export function vortexLayout(n) {
  if (n === 972) return [...ring(12, 0.06, 0.3), ...ring(960, 0.3, 1)];
  return ring(n, n > 50 ? 0.1 : 0.12, 1);
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
