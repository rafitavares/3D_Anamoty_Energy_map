// Atlas knowledge base.
// Chakra → gland → organ correspondences follow Barbara Brennan,
// "Hands of Light", fig. 7-5 and fig. 9-1.
// Links marked source: 'complementary' are not in Brennan's table; they come
// from anatomical proximity / general traditions and are drawn dashed.
//
// Coordinates in meters: y up (feet at y=0), z forward,
// +x = the body's LEFT side (the person faces the camera).
// Internal ids (e.g. 'coracao') are stable keys shared with models/orgaos.glb.

export const VPC = { x: 0, z: -0.045, yTop: 2.05, yBottom: 0.5 };

export const CHAKRAS = [
  {
    id: '1', n: 1, name: 'Root', sanskrit: 'Muladhara', color: '#ff2a2a', vortices: 4,
    gland: 'Adrenals', y: 0.86, axis: 'down',
    aspects: {
      main: { code: '1', name: 'Coccygeal center', group: 'Will',
        fn: 'Quantity of physical energy, will to live.' },
    },
    governs: 'Spinal column, kidneys',
    balanced: 'Well grounded, strong will to live, present in the body.',
    deficit: 'Ungrounded, chronic fatigue, low physical vitality, a sense of not wanting to be here.',
    excess: 'Raw physical force without direction, impulsiveness, tension at the base of the spine.',
  },
  {
    id: '2', n: 2, name: 'Sacral', sanskrit: 'Svadhisthana', color: '#ff8a1c', vortices: 6,
    gland: 'Gonads', y: 0.95,
    aspects: {
      front: { code: '2A', name: 'Pubic center', group: 'Feeling',
        fn: 'Quality of love for the partner; giving and receiving physical, mental and spiritual pleasure.' },
      back: { code: '2B', name: 'Sacral center', group: 'Will',
        fn: 'Quantity of sexual energy.' },
    },
    governs: 'Reproductive system',
    balanced: 'Pleasure, integrated sexuality, creative vitality.',
    deficit: 'Low libido, difficulty receiving pleasure, reduced pelvic vitality.',
    excess: 'Compulsive sexual discharge, uncontained pelvic energy.',
  },
  {
    id: '3', n: 3, name: 'Solar Plexus', sanskrit: 'Manipura', color: '#ffd21c', vortices: 10,
    gland: 'Pancreas', y: 1.11,
    aspects: {
      front: { code: '3A', name: 'Solar plexus', group: 'Feeling',
        fn: 'Great pleasure and expansiveness, spiritual wisdom, consciousness of the universality of life — who you are within the Universe.' },
      back: { code: '3B', name: 'Diaphragmatic center', group: 'Will',
        fn: 'Healing, intentionality toward one’s health.' },
    },
    governs: 'Stomach, liver, gallbladder, nervous system',
    balanced: 'A sense of belonging in the Universe, healthy emotional digestion.',
    deficit: 'Anxiety, inner emptiness, poor emotional and physical digestion.',
    excess: 'Over-control, irritability, diaphragmatic tension.',
  },
  {
    id: '4', n: 4, name: 'Heart', sanskrit: 'Anahata', color: '#2fe07a', vortices: 12,
    gland: 'Thymus', y: 1.30,
    aspects: {
      front: { code: '4A', name: 'Heart center', group: 'Feeling',
        fn: 'Heart feelings of love for other human beings, openness to life.' },
      back: { code: '4B', name: 'Between the shoulder blades', group: 'Will',
        fn: 'Ego will, or will toward the outer world.' },
    },
    governs: 'Heart, blood, vagus nerve, circulatory system',
    balanced: 'Love that flows, openness, will aligned with the heart.',
    deficit: 'Emotional closing, hurt, isolation.',
    excess: 'Giving without limits (front) or domineering will (back).',
  },
  {
    id: '5', n: 5, name: 'Throat', sanskrit: 'Vishuddha', color: '#2c8dff', vortices: 16,
    gland: 'Thyroid', y: 1.47,
    aspects: {
      front: { code: '5A', name: 'Throat center', group: 'Feeling',
        fn: 'Taking in and assimilating.' },
      back: { code: '5B', name: 'Base of the neck', group: 'Will',
        fn: 'Sense of self within society and one’s profession.' },
    },
    governs: 'Bronchial and vocal apparatus, lungs, alimentary canal',
    balanced: 'True expression, ability to receive, a place in the world.',
    deficit: 'Difficulty expressing or receiving; a held-back voice.',
    excess: 'Talking too much, defensiveness, stiffness in the neck.',
  },
  {
    id: '6', n: 6, name: 'Third Eye', sanskrit: 'Ajna', color: '#5b4dff', vortices: 96,
    gland: 'Pituitary', y: 1.63,
    aspects: {
      front: { code: '6A', name: 'Forehead center', group: 'Mental',
        fn: 'Capacity to visualize and understand mental concepts.' },
      back: { code: '6B', name: 'Mental executive', group: 'Mental',
        fn: 'Ability to carry out ideas in a practical way.' },
    },
    governs: 'Lower brain, left eye, ears, nose, nervous system',
    balanced: 'Clarity, inner vision, ideas that come to fruition.',
    deficit: 'Confusion, difficulty visualizing or realizing ideas.',
    excess: 'Mental overactivity, thoughts that never stop.',
  },
  {
    id: '7', n: 7, name: 'Crown', sanskrit: 'Sahasrara', color: '#e9c8ff', vortices: 972,
    gland: 'Pineal', y: 1.70, axis: 'up',
    aspects: {
      main: { code: '7', name: 'Crown center', group: 'Mental',
        fn: 'Integration of the total personality with life and with the spiritual aspects of humankind.' },
    },
    governs: 'Upper brain, right eye',
    balanced: 'Spiritual connection integrated into daily life.',
    deficit: 'A sense of spiritual disconnection, lack of meaning.',
    excess: 'Escape into the spiritual, ungroundedness.',
  },
];

// Organ ↔ chakra links. w = weight (1 = primary).
export const ORGANS = [
  // Head
  { id: 'cerebro_sup', name: 'Upper brain (cerebrum)', system: 'Nervous', links: [{ c: '7', w: 1 }],
    info: 'Cerebral hemispheres. In Brennan’s table, governed by the crown chakra.' },
  { id: 'cerebro_inf', name: 'Lower brain (cerebellum & brainstem)', system: 'Nervous', links: [{ c: '6', w: 1 }],
    info: 'Cerebellum and brainstem, governed by the third eye chakra.' },
  { id: 'pineal', name: 'Pineal gland', system: 'Endocrine', gland: true, links: [{ c: '7', w: 1.2 }],
    info: 'Gland of the 7th chakra. Produces melatonin and regulates circadian rhythms.' },
  { id: 'hipofise', name: 'Pituitary gland', system: 'Endocrine', gland: true, links: [{ c: '6', w: 1.2 }],
    info: 'The “master gland”, associated with the 6th chakra.' },
  { id: 'olho_d', name: 'Right eye', system: 'Senses', side: 'R', links: [{ c: '7', w: 1 }],
    info: 'Brennan associates the right eye with the crown.' },
  { id: 'olho_e', name: 'Left eye', system: 'Senses', side: 'L', links: [{ c: '6', w: 1 }],
    info: 'Brennan associates the left eye with the third eye.' },
  { id: 'ouvidos', name: 'Ears', system: 'Senses', links: [{ c: '6', w: 1 }], info: 'Governed by the 6th chakra.' },
  { id: 'nariz', name: 'Nose', system: 'Senses', links: [{ c: '6', w: 1 }], info: 'Governed by the 6th chakra.' },

  // Neck / chest
  { id: 'tireoide', name: 'Thyroid', system: 'Endocrine', gland: true, links: [{ c: '5', w: 1.2 }],
    info: 'Gland of the 5th chakra; regulates metabolism.' },
  { id: 'laringe', name: 'Larynx, trachea & bronchi', system: 'Respiratory', links: [{ c: '5', w: 1 }],
    info: '“Bronchial and vocal apparatus” in Brennan’s table.' },
  { id: 'pulmao_e', name: 'Left lung', system: 'Respiratory', side: 'L',
    links: [{ c: '5', w: 1 }, { c: '4', w: 0.4, source: 'complementary' }], info: 'Lungs: 5th chakra (Brennan); close to the heart chakra.' },
  { id: 'pulmao_d', name: 'Right lung', system: 'Respiratory', side: 'R',
    links: [{ c: '5', w: 1 }, { c: '4', w: 0.4, source: 'complementary' }], info: 'Lungs: 5th chakra (Brennan); close to the heart chakra.' },
  { id: 'timo', name: 'Thymus', system: 'Endocrine', gland: true, links: [{ c: '4', w: 1.2 }],
    info: 'Gland of the heart chakra; central to immunity.' },
  { id: 'coracao', name: 'Heart', system: 'Circulatory', links: [{ c: '4', w: 1 }], info: 'Governed by the heart chakra.' },
  { id: 'circulacao', name: 'Blood & circulatory system (aorta)', system: 'Circulatory', links: [{ c: '4', w: 1 }],
    info: 'Brennan: the heart chakra governs the blood and circulatory system.' },
  { id: 'vago', name: 'Vagus nerve', system: 'Nervous', links: [{ c: '4', w: 1 }],
    info: 'From the brainstem down to the abdomen; governed by the heart chakra.' },

  // Abdomen
  { id: 'estomago', name: 'Stomach', system: 'Digestive', links: [{ c: '3', w: 1 }], info: 'Governed by the solar plexus.' },
  { id: 'figado', name: 'Liver', system: 'Digestive', links: [{ c: '3', w: 1 }], info: 'Governed by the solar plexus.' },
  { id: 'vesicula', name: 'Gallbladder', system: 'Digestive', links: [{ c: '3', w: 1 }], info: 'Governed by the solar plexus.' },
  { id: 'pancreas', name: 'Pancreas', system: 'Endocrine', gland: true, links: [{ c: '3', w: 1.2 }],
    info: 'Gland of the 3rd chakra (islets of Langerhans).' },
  { id: 'baco', name: 'Spleen', system: 'Lymphatic', links: [{ c: '3', w: 0.6, source: 'complementary' }],
    info: 'Brennan describes a minor spleen chakra; linked here to the solar plexus by proximity.' },
  { id: 'intestinos', name: 'Intestines (alimentary canal)', system: 'Digestive',
    links: [{ c: '5', w: 0.8 }, { c: '3', w: 0.6, source: 'complementary' }, { c: '2', w: 0.3, source: 'complementary' }],
    info: 'Brennan places the “alimentary canal” under the 5th chakra; anatomically it lies between the 3rd and the 2nd.' },
  { id: 'rim_e', name: 'Left kidney', system: 'Urinary', side: 'L', links: [{ c: '1', w: 1 }], info: 'Kidneys: root chakra (Brennan).' },
  { id: 'rim_d', name: 'Right kidney', system: 'Urinary', side: 'R', links: [{ c: '1', w: 1 }], info: 'Kidneys: root chakra (Brennan).' },
  { id: 'suprarrenais', name: 'Adrenal glands', system: 'Endocrine', gland: true, links: [{ c: '1', w: 1.2 }],
    info: 'Glands of the root chakra; adrenaline and cortisol — the fight-or-flight response.' },
  { id: 'bexiga', name: 'Bladder', system: 'Urinary', links: [{ c: '2', w: 0.6, source: 'complementary' }],
    info: 'Not in Brennan’s table; linked to the sacral chakra by proximity.' },

  // Pelvis
  { id: 'gonadas', name: 'Gonads (ovaries / testes)', system: 'Endocrine', gland: true, links: [{ c: '2', w: 1.2 }],
    info: 'Glands of the sacral chakra.' },
  { id: 'reprodutor', name: 'Reproductive system', system: 'Reproductive', links: [{ c: '2', w: 1 }],
    info: 'Governed by the sacral chakra.' },

  // Axis
  { id: 'coluna', name: 'Spinal column', system: 'Skeletal', links: [{ c: '1', w: 1 }], info: 'Governed by the root chakra.' },
  { id: 'medula', name: 'Spinal cord (nervous system)', system: 'Nervous',
    links: [{ c: '3', w: 0.7 }, { c: '6', w: 0.7 }], info: 'Brennan links the nervous system to the 3rd and 6th chakras.' },
];

export const AURA_LAYERS = [
  { n: 1, name: 'Etheric body', color: '#7fb8ff', dist: '¼ to 2 inches',
    info: 'A web of light lines with the same structure as the physical body — the matrix on which the tissues are anchored.' },
  { n: 2, name: 'Emotional body', color: '#ff7ad9', dist: '1 to 3 inches',
    info: 'Colored clouds in fluid motion, associated with feelings about oneself.' },
  { n: 3, name: 'Mental body', color: '#ffe066', dist: '3 to 8 inches',
    info: 'Yellow light around the head and shoulders; holds thought forms.' },
  { n: 4, name: 'Astral level', color: '#ff8fb0', dist: '½ to 1 foot',
    info: 'Clouds of color infused with the rose light of love; the level of relationships (I–thou).' },
  { n: 5, name: 'Etheric template', color: '#3a5bff', dist: '1½ to 2 feet',
    info: 'The “photographic negative” — the perfect blueprint of the etheric body, in cobalt blue.' },
  { n: 6, name: 'Celestial body', color: '#f2e6ff', dist: '2 to 2¾ feet',
    info: 'Shimmering opalescent light; the level of spiritual ecstasy and unconditional love.' },
  { n: 7, name: 'Ketheric template (causal)', color: '#ffd77a', dist: '2½ to 3½ feet',
    info: 'An egg of golden threads of light that holds the whole form of the aura; the level of “I know”.' },
];

// Deeper dimensions (Brennan, "Light Emerging", ch. 2, 17 and 18).
// Each entry feeds the info card: what it is, what it is for, where it is,
// how it looks when healthy and when distorted, and how to work with it.
export const HARA = [
  {
    id: 'id_point', name: 'ID point', y: 2.75, color: '#ffffff',
    subtitle: 'Individuation point · Haric dimension',
    what: 'The first point of the hara line, floating above the head. It marks the moment we first individuated out of the undivided divine in order to incarnate.',
    purpose: 'It holds our reason for incarnating and is our direct line of connection to the godhead and to our higher spiritual reality.',
    where: 'About 3½ feet (≈1 m) above the head, on the body’s center line. It looks like a tiny inverted funnel, about ¼ inch wide at its open end, pointing down toward the head.',
    healthy: 'Open, well formed and connected down the hara line: a felt, personal connection to the divine.',
    distorted: 'It can be bent out of shape or clogged. Disconnection from the ID point tends to show up as cynicism about life and no personal experience of the sacred.',
    practice: 'In healing, the healer clears the funnel and reconnects it to the rest of the hara line. Brennan reports that clients may then recall early memories of feeling connected to God, and begin building their own direct connection.',
    source: 'Light Emerging, ch. 2 and 17 (fig. 17-4).',
  },
  {
    id: 'soul_seat', name: 'Soul seat', y: 1.37, color: '#bfe0ff',
    subtitle: 'Seat of the soul’s longing · Haric dimension',
    what: 'The second point of the hara line: a soft, diffuse light in the upper chest. It is sometimes called the “high heart”, but it is not a chakra.',
    purpose: 'It carries our spiritual longing, the sacred desire that guides us through life toward our life task. It is the felt sense of what we came here to do, from the smallest moment to the largest purpose.',
    where: 'Upper chest, on the center line, above the heart chakra. Usually 1–2 inches across, but it can expand enormously in meditation.',
    healthy: 'Bright and radiating in all directions: we feel clearly what we want and are moved by it.',
    distorted: 'Usually it becomes shrouded by a dark cloud of energy. The person loses the feeling of what they want in life and may look sunken-chested and resigned, with a deep sadness and a sense that life is meaningless. This often follows a loss that was never mourned.',
    practice: 'Clearing the shroud lets the light expand again. People may feel a new lease on life, or first go through grief for lost time before new enthusiasm arrives. Completing the natural mourning of a loved one is part of the healing.',
    source: 'Light Emerging, ch. 2 and 17 (fig. 17-3).',
  },
  {
    id: 'tan_tien', name: 'Tan tien', y: 0.98, color: '#ffb43a',
    subtitle: 'Will to live in the body · Haric dimension',
    what: 'The third point of the hara line: a ball of power in the lower abdomen with a firm membrane around it, like a rubber ball. It can look golden. It is the center martial artists move and draw power from.',
    purpose: 'It is the will center for living in a physical body. It holds the “one note” that keeps the body in physical manifestation, a tone in harmony with the Earth’s molten core. Healers ground through it to draw regenerating power from the Earth.',
    where: 'Lower abdomen on the center line, roughly 1½–2½ inches below the navel (Brennan gives both figures), and about the size of a golf ball. Its size does not change.',
    healthy: 'Centered, round, charged and connected down the hara line deep into the Earth’s core. When fully grounded in healing it can glow red and feel hot.',
    distorted: 'It can be pushed forward (jumping ahead of oneself), pulled back (holding back from one’s life task) or off to one side. Its membrane can tear or blow open. Typical results are chronic lower-back problems, and when torn, profound weakness and shakiness.',
    practice: 'Repair it, re-center it on the hara line, ground it into the Earth and charge it. Brennan recommends martial arts such as tai chi with a good teacher, and grounding exercises with the fingertips placed on the tan tien.',
    source: 'Light Emerging, ch. 2 and 17 (fig. 17-2); Healing Science, “Tan Tien Ground”.',
  },
];

export const HARA_LINE = {
  id: 'hara_line', name: 'Hara line', y: 1.6, color: '#ffc85a',
  subtitle: 'Haric dimension · intention and life purpose',
  what: 'A laser-like line of light, about ⅓ inch wide, running along the body’s center line from the ID point above the head, through the soul seat and the tan tien, deep into the Earth’s core. It lies beneath the aura.',
  purpose: 'It is the dimension of intention: our life task, our purpose for this incarnation and our purpose in each moment. Every creation passes through it on its way from the Core Star to the aura and the body.',
  where: 'From about 3½ feet above the head down through the center of the body and into the center of the Earth.',
  healthy: 'Straight, centered, charged and rooted in the Earth, with all three points balanced and connected. Life flows; there is integrity, purpose and no adversary, and aligned people naturally fall into step with each other.',
  distorted: 'Misalignment shows as bent or broken lines, displaced points, or points disconnected from each other or from the Earth. Brennan sees it in every serious or long-term illness, and in arguments, procrastination and working at cross-purposes.',
  practice: 'Align the hara line before acting, especially when you find yourself arguing. Clear intention on the haric level is what makes actions on the auric and physical levels bring pleasure.',
  source: 'Light Emerging, ch. 2 and 17 (fig. 17-1, 17-5).',
};

export const CORE_STAR = {
  id: 'core', name: 'Core Star', y: 1.06, color: '#ffffff',
  subtitle: 'Core essence dimension · the divine within',
  what: 'The deepest dimension of our being, beneath both the aura and the hara. It looks like a brilliant star of many colors, unique for every person: the individual aspect of the divine.',
  purpose: 'It is the source of all our creative energy. Every creation starts as essence in the core, becomes intention in the hara line, life energy in the aura, and finally form in the physical world.',
  where: 'About 1½ inches above the navel, on the body’s center line. Its light can expand without limit.',
  healthy: 'Where the core light emerges through the hara, the aura and the body, there is health, joy, creativity and wisdom, love and courage.',
  distorted: 'Nothing is ever wrong in the core itself. Illness here means disconnection: the star is shrouded by dark clouds or encased so its light cannot emerge, leading to loss of creativity and of any sense of inner divinity.',
  practice: 'Brennan closes every healing by uncovering the Core Star and “upwelling” its essence into the hara, then the aura, then every cell of the body, and expanding it outward. You can practice by centering your attention on the star above the navel.',
  source: 'Light Emerging, ch. 2 and 18.',
};

export const DEEP_ITEMS = [...HARA, HARA_LINE, CORE_STAR];
export const findDeep = id => DEEP_ITEMS.find(x => x.id === id);

// Readings: r = diameter in inches, as with Brennan’s pendulum (fig. 10-2).
// r > 0 clockwise (open), r < 0 counterclockwise (closed), 0 = stopped.
// e = ellipse: -1 slanted left (yin), +1 slanted right (yang).
const all = (r, e = 0) => Object.fromEntries(
  CHAKRAS.flatMap(c => Object.keys(c.aspects).map(a => [`${c.id}.${a}`, { r, e }])));

export const PRESETS = {
  balanced: { label: 'Balanced (all C6)', state: all(6) },
  meditation: { label: 'After meditation (all C8)', state: all(8) },
  closed_heart: { label: 'Closed heart', state: { ...all(6), '4.front': { r: -5, e: 0 }, '4.back': { r: 7, e: 0.3 }, '3.front': { r: 4, e: 0 } } },
  mental: { label: 'Overly mental, ungrounded', state: { ...all(6), '6.front': { r: 9, e: 0 }, '6.back': { r: 8, e: 0 }, '7.main': { r: 9, e: 0 }, '1.main': { r: -3, e: 0 }, '2.front': { r: 3, e: 0 }, '2.back': { r: 3, e: 0 } } },
  will: { label: 'Excessive will (yang)', state: { ...all(6), '3.back': { r: 9, e: 0.7 }, '4.back': { r: 9, e: 0.6 }, '5.back': { r: 8, e: 0.4 }, '4.front': { r: 3, e: 0 } } },
  stopped_root: { label: 'Stopped root', state: { ...all(6), '1.main': { r: 0, e: 0 }, '2.back': { r: -3, e: 0 }, '7.main': { r: 8, e: 0 } } },
  blocked_expression: { label: 'Blocked expression', state: { ...all(6), '5.front': { r: -4, e: 0 }, '5.back': { r: -2, e: -0.4 } } },
  receptive: { label: 'Overly receptive (yin)', state: { ...all(6, -0.6), '3.front': { r: 8, e: -0.7 }, '2.front': { r: 7, e: -0.6 } } },
};
