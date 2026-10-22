# Energy Anatomy Atlas 3D

An interactive 3D atlas of **physical and energetic anatomy**. It shows real anatomical organs, glands and the skeleton together with the 7 chakras (front and back aspects), the vertical power current, the nadis, the 7 layers of the aura, the hara line and the Core Star. The energetic correspondences follow Barbara Brennan’s model (*Hands of Light*, *Light Emerging*).

## What you can do

- **Unbalance any chakra.** Front and back aspects are controlled separately, using Brennan’s pendulum notation:
  - `C6`: open and balanced
  - `CC4`: closed (counterclockwise spin)
  - `S`: stopped
  - `C10`: overused
  - Left/right ellipse (yin/yang): `CER`, `CEL`, `CCER`, `CCEL`
  - Vertical ellipse `CEV` / `CCEV`: energy pushed up toward the spiritual. The chakras above receive it as excess.
  - Horizontal ellipse `CEH` / `CCEH`: energy compacted and held down
  - Ellipse with a shifting axis `CEAS` / `CCEAS`: the ellipse keeps changing direction (sensitive or negative chaos)
  - Straight swings with no spin: `V`, `H`, `R`, `L`
  - Each reading shows its psychological indication from *Hands of Light*, fig. 10-2.
- **See each chakra the way Brennan draws it** (*Hands of Light*, fig. 8-2 and 15-5). Each chakra is a large cone made of small spiral cones: 4 in the root, 6 in the sacral, 10, 12, 16, 96 and 972 above (fig. 7-5). They sit symmetrically, like lotus petals: one ring for chakras 1–5, 96 rays in two mirror halves of 48 for the brow, and 960 outer rays plus an inner ring of 12 for the crown (Leadbeater's counts, which Brennan's 96 and 972 follow). Three movements run together: each small cone spins on its own axis, the whole ring revolves around the chakra's axis, and the big cone turns with it. All of them turn clockwise as seen from outside the body when the chakra is open. A woven protective screen covers the opening. In health the small cones spin in synchrony; the more disturbed the chakra, the more erratic they become. Each small vortex feeds one organ. Brennan states the principle and gives the liver and pancreas vortices of the solar plexus as examples; the app assigns the rest by the direction each vortex faces. Selecting an organ highlights its vortex. You can switch back to the simple funnel or hide the screen in the Layers tab.
- **Disfigure a chakra** with the forms of fig. 15-5:
  - A: one vortex sprung out
  - B: tip of one vortex pulled out
  - C: clogged
  - D: torn, with the screen ripped
  - E: pulled to the left or right
  - F: one vortex wedged open
  - For A, B and F you pick which vortex, and the organ it feeds is hit hardest.
- **See the affected organs in real time.** Organs turn grey when devitalized and pulse red when overloaded. The "Impact on organs" list ranks them by severity.
- **Watch the energy flow.** Particles spiral into open vortices and out of closed ones. The nadis pulse from each chakra to its organs, and the vertical current dims as field harmony drops.
- **Explore the aura in 7 layers.** Closed chakras show up as dark patches at the matching height; overactive chakras show up as flares.
- **Use the Atlas.** Search and browse every structure. Each one has an info card covering its psychological function, gland, energy pathway and sources.
- **Switch between a male and a female body** with the Male / Female button. The internal organs, chakras and aura are shared; the body surface, gonads, reproductive organs and breasts change.
- **Load ready-made scenarios:** closed heart, overly mental, excessive will, stopped root, escaping upward (vertical), holding down (horizontal), deep transformation (axis shifting), severe split, and more.

## Run

No build step is needed. Serve the folder over HTTP:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. It also works as-is on GitHub Pages.

You can link straight to a given state with URL parameters, for example:
- `?scenario=closed_heart&sel=chakra:4:front`
- `?aura=all&layers=hara,core&view=hara`
- `?layers=skeleton&sel=organ:figado`
- `?sex=female&sel=organ:reprodutor`

## Structure

| File | Contents |
|---|---|
| `js/data.js` | Knowledge base: chakras, organs, links, aura, hara, scenarios |
| `js/state.js` | Imbalance model (per-organ deficiency/excess, harmony) |
| `js/anatomy.js` | Body and organs: real models plus procedural fallbacks |
| `js/energy.js` | Chakras, nadis, particles, aura, hara, Core Star |
| `js/vortex.js` | Small vortices inside each chakra and the disfigured forms of fig. 15-5 |
| `js/ui.js`, `js/main.js` | Interface and scene |
| `models/*.glb` | Anatomy models (Draco-compressed): Z-Anatomy male body, MPFB female body, female organs |
| `tools/` | Blender scripts that regenerate `models/` |

## Anatomy models

`models/orgaos.glb` (organs), `models/esqueleto.glb` (skeleton) and `models/silhueta.glb` (body silhouette) are generated from the [Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy) Blender file:

```bash
blender -b --factory-startup --disable-autoexec Startup.blend --python tools/zanatomy_export.py -- models
```

The female body is built by `tools/female_export.py`. It uses the [MPFB](https://extensions.blender.org/add-ons/mpfb/) extension (MakeHuman for Blender) to generate the body, lowers the arms to the anatomical position, and fits the body to the male model (same height, back aligned, torso depth matched so the shared organs stay inside). It also models the female organs procedurally: uterus, fallopian tubes with fimbriae, ovarian ligaments, vagina, ovaries and mammary glands (lobes and ducts). Run it with:

```bash
blender -b --python tools/female_export.py -- models
```

These structures have no free model yet, so the app still draws them as simple shapes: aorta/blood vessels, vagus nerve and small intestine. The skeleton and pelvis are male in both bodies.

## Credits and license

- **Anatomy models:** Z-Anatomy, *The libre 3D atlas of anatomy* (CC BY-SA 4.0), derived from **BodyParts3D**, © The Database Center for Life Science (CC BY-SA 2.1 Japan). The files in `models/` are distributed under **CC BY-SA 4.0**.
- **Female body:** generated with MPFB / MakeHuman; its core assets are CC0. The female organs in `models/orgaos_f.glb` were modeled for this project and are released under CC0.
- **Energetic model:** Barbara Brennan, *Hands of Light* and *Light Emerging*.

Educational tool. Not a medical diagnosis.
