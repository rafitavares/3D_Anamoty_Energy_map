import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { CHAKRAS, ORGANS, findDeep, AURA_LAYERS, PRESETS } from './data.js';
import { computeAll, onChange, loadState, emit, body as bodyState, organName, organPresent } from './state.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildBody, buildOrgans, loadRealAnatomy, skeletonMesh } from './anatomy.js';
import { buildEnergy } from './energy.js';
import { initUI } from './ui.js';

const viewport = document.getElementById('viewport');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);
const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = 'labels';
viewport.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
camera.position.set(0, 1.25, 3.4);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.12, 0);
controls.enableDamping = true;
controls.minDistance = 0.25; controls.maxDistance = 10;

scene.add(new THREE.AmbientLight('#b8c4ff', 0.5));
const key = new THREE.DirectionalLight('#fff4ea', 2.2); key.position.set(1.5, 3, 2.5); scene.add(key);
const fill = new THREE.DirectionalLight('#cfd8ff', 0.8); fill.position.set(-2, 1, 2); scene.add(fill);
const rim = new THREE.DirectionalLight('#9a7bff', 1.0); rim.position.set(-2, 1.5, -2.5); scene.add(rim);
// Reflexos de estúdio para o aspecto úmido dos tecidos
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.6;

const floor = new THREE.PolarGridHelper(1.4, 12, 6, 64, '#3b4a7a', '#26304f');
floor.material.transparent = true; floor.material.opacity = 0.5;
scene.add(floor);

// Modelos anatômicos reais; se falharem, o atlas usa as formas simples.
const loading = document.getElementById('loading');
let real = null;
try {
  real = await loadRealAnatomy(e => {
    if (e.total) loading.querySelector('b').textContent = `${Math.round((e.loaded / e.total) * 100)}%`;
  });
} catch (err) {
  console.warn('Real anatomy models unavailable, using simple shapes.', err);
}
loading.hidden = true;

const body = buildBody();
const organs = buildOrgans(real);
let skeleton = null, skeletonLoading = false;
function setSkeleton(v) {
  if (skeleton) { skeleton.visible = v; return; }
  if (!v || !real || skeletonLoading) return;
  skeletonLoading = true;
  real.skeleton().then(geo => { skeleton = skeletonMesh(geo); scene.add(skeleton); ui.syncToggles(); });
}
const energy = buildEnergy(organs.centers);
scene.add(organs.group, body.group);
for (const g of Object.values(energy.groups)) scene.add(g);
for (const L of energy.auraLayers) scene.add(L.group);

// Rótulos dos chakras
const chakraLabels = new THREE.Group();
for (const c of CHAKRAS) {
  const el = document.createElement('div');
  el.className = 'clabel'; el.style.setProperty('--c', c.color);
  el.textContent = `${c.n} · ${c.name}`;
  const o = new CSS2DObject(el);
  o.position.set(c.id === '7' ? 0.12 : c.id === '1' ? 0.14 : 0.24, c.id === '7' ? 1.86 : c.id === '1' ? 0.72 : c.y, 0.05);
  chakraLabels.add(o);
}
scene.add(chakraLabels);
const selLabelEl = document.createElement('div'); selLabelEl.className = 'slabel';
const selLabel = new CSS2DObject(selLabelEl); selLabel.visible = false; scene.add(selLabel);

// ---------- Estado / métricas ----------
let metrics = computeAll();
let focus = null;
let speed = 1;
let showGlandsOnly = false;
const hiddenSystems = new Set();

// ---------- Câmera ----------
let camTween = null;
function flyTo(target, distance, dirHint) {
  const dir = dirHint ? dirHint.clone().normalize() : camera.position.clone().sub(controls.target).normalize();
  camTween = { t: 0, fromP: camera.position.clone(), fromT: controls.target.clone(),
    toT: target.clone(), toP: target.clone().add(dir.multiplyScalar(distance)) };
}
const VIEWS = {
  front: () => flyTo(new THREE.Vector3(0, 1.12, 0), 3.4, new THREE.Vector3(0, 0.03, 1)),
  back: () => flyTo(new THREE.Vector3(0, 1.12, 0), 3.4, new THREE.Vector3(0, 0.03, -1)),
  side: () => flyTo(new THREE.Vector3(0, 1.12, 0), 3.4, new THREE.Vector3(1, 0.03, 0)),
  aura: () => flyTo(new THREE.Vector3(0, 1.1, 0), 7.5, new THREE.Vector3(0.35, 0.12, 1)),
  hara: () => flyTo(new THREE.Vector3(0, 1.35, 0), 8, new THREE.Vector3(0.5, 0.05, 1)),
};

function positionOf(sel) {
  if (sel.kind === 'organ') return organs.centers[sel.id].clone();
  if (sel.kind === 'chakra') {
    const c = CHAKRAS.find(x => x.id === sel.id);
    return new THREE.Vector3(0, c.y, sel.aspect === 'back' ? -0.08 : 0.04);
  }
  if (sel.kind === 'hara' || sel.kind === 'core') return new THREE.Vector3(0, findDeep(sel.id).y, 0);
  return new THREE.Vector3(0, 1.1, 0);
}
function nameOf(sel) {
  if (sel.kind === 'organ') return organName(ORGANS.find(o => o.id === sel.id));
  if (sel.kind === 'chakra') { const c = CHAKRAS.find(x => x.id === sel.id); return `${c.name} chakra`; }
  if (sel.kind === 'hara' || sel.kind === 'core') return findDeep(sel.id).name;
  if (sel.kind === 'aura') return AURA_LAYERS[sel.n - 1].name;
  return '';
}

// ---------- API usada pela interface ----------
const app = {
  select(sel, { fly = true } = {}) {
    focus = sel;
    if (!sel) { selLabel.visible = false; ui.showInfo(null, metrics); return; }
    if (sel.kind === 'aura') {
      app.setAuraLayer(sel.n, true);
      if (fly) VIEWS.aura();
    } else if (sel.kind === 'hara' || sel.kind === 'core') {
      energy.groups[sel.kind === 'core' ? 'core' : 'hara'].visible = true;
      ui.syncToggles();
      if (fly && sel.id === 'hara_line') VIEWS.hara();
      else if (fly) flyTo(positionOf(sel), sel.id === 'id_point' ? 2.2 : 1.4);
    } else if (fly) {
      const p = positionOf(sel);
      const dir = sel.aspect === 'back' ? new THREE.Vector3(0.3, 0.1, -1) : new THREE.Vector3(0.3, 0.1, 1);
      flyTo(p, sel.kind === 'chakra' ? 1.3 : 0.75, dir);
    }
    if (sel.kind !== 'aura') {
      selLabel.position.copy(positionOf(sel));
      selLabelEl.textContent = nameOf(sel);
      selLabel.visible = true;
    } else selLabel.visible = false;
    ui.showInfo(sel, metrics);
  },
  get focus() { return focus; },
  view: name => VIEWS[name]?.(),
  setVisible(key, v) {
    if (key === 'skin') body.group.visible = v;
    else if (key === 'organs') organs.group.visible = v;
    // CSS2DRenderer checks each label's own visibility, not its parent's.
    else if (key === 'labels') chakraLabels.children.forEach(l => { l.visible = v; });
    else if (key === 'floor') floor.visible = v;
    else if (key === 'skeleton') setSkeleton(v);
    else energy.groups[key].visible = v;
  },
  hasRealModels: !!real,
  isVisible(key) {
    if (key === 'skeleton') return !!skeleton?.visible;
    if (key === 'skin') return body.group.visible;
    if (key === 'organs') return organs.group.visible;
    if (key === 'labels') return chakraLabels.children.some(l => l.visible);
    if (key === 'floor') return floor.visible;
    return energy.groups[key].visible;
  },
  setAuraLayer(n, v) { energy.auraLayers[n - 1].group.visible = v; ui.syncToggles(); },
  isAuraLayer: n => energy.auraLayers[n - 1].group.visible,
  skinOpacity: body.material.uniforms.uOpacity.value,
  setSkinOpacity: v => { body.material.uniforms.uOpacity.value = v; },
  setAuraOpacity: v => { energy.auraUniforms.uOpacity.value = v; },
  setSpeed: v => { speed = v; },
  get bookChakras() { return energy.book; }, setBookChakras: v => energy.setBook(v),
  get chakraScreen() { return energy.screen; }, setChakraScreen: v => energy.setScreen(v),
  setGlandsOnly: v => { showGlandsOnly = v; applyOrganVisibility(); },
  get sex() { return bodyState.sex; },
  setSex,
  setSystem: (s, v) => { v ? hiddenSystems.delete(s) : hiddenSystems.add(s); applyOrganVisibility(); },
};

function applyOrganVisibility() {
  for (const o of ORGANS) {
    organs.meshes[o.id].visible = organPresent(o) && !hiddenSystems.has(o.system) && (!showGlandsOnly || o.gland);
  }
}

// ---------- Male / female body ----------
// Internal organs are shared (Z-Anatomy); the body surface, gonads, reproductive
// organs and breasts are swapped. Male geometries are kept to switch back.
const SEX_ORGANS = ['gonadas', 'reprodutor', 'mamas'];
const maleGeo = {
  silhouette: real?.silhouette,
  organs: Object.fromEntries(SEX_ORGANS.map(id => [id, organs.meshes[id].geometry])),
};
let sexBusy = false;
async function setSex(sex) {
  if (!real || sexBusy || sex === bodyState.sex) return;
  sexBusy = true;
  try {
    const geo = sex === 'F' ? await real.female() : maleGeo;
    bodyState.sex = sex;
    if (geo.silhouette) {
      for (const m of body.group.children) m.geometry = geo.silhouette;
      energy.setBodyGeometry(geo.silhouette);
    }
    for (const id of SEX_ORGANS) {
      const g = geo.organs[id];
      if (!g) continue;
      organs.meshes[id].geometry = g;
      g.computeBoundingBox();
      organs.centers[id] = g.boundingBox.getCenter(new THREE.Vector3());
    }
    energy.setOrganCenters(organs.centers);
    applyOrganVisibility();
    if (focus?.kind === 'organ' && !organPresent(ORGANS.find(o => o.id === focus.id))) app.select(null);
    emit();   // refresh metrics, impact list and info card with the new names
    if (focus) selLabelEl.textContent = nameOf(focus);
  } catch (err) {
    console.warn('Female body models unavailable.', err);
  } finally {
    sexBusy = false;
    ui.syncSex();
  }
}

const ui = initUI(app);
applyOrganVisibility();
onChange(() => { metrics = computeAll(); ui.refresh(metrics); if (focus) ui.showInfo(focus, metrics); });
ui.refresh(metrics);

// ---------- Seleção com o mouse ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
function visibleInScene(o) { for (; o; o = o.parent) if (!o.visible) return false; return true; }
function pick(ev) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const targets = [];
  organs.group.traverse(o => { if (o.isMesh) targets.push(o); });
  targets.push(...energy.pickables);
  const hits = raycaster.intersectObjects(targets, false).filter(h => visibleInScene(h.object));
  if (!hits.length) return null;
  // Prioriza chakras/pontos (pequenos) sobre órgãos atrás deles
  const special = hits.find(h => h.object.userData.pickKind !== 'organ' && h.distance < hits[0].distance + 0.15);
  const u = (special ?? hits[0]).object.userData;
  return { kind: u.pickKind, id: u.pickId, aspect: u.aspect };
}
let downAt = null;
renderer.domElement.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; camTween = null; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  app.select(pick(e));
});
renderer.domElement.addEventListener('pointermove', e => {
  if (e.buttons) { tooltip.hidden = true; return; }
  const p = pick(e);
  if (!p) { tooltip.hidden = true; renderer.domElement.style.cursor = ''; return; }
  renderer.domElement.style.cursor = 'pointer';
  let txt = nameOf(p);
  if (p.kind === 'chakra') {
    const c = CHAKRAS.find(x => x.id === p.id);
    txt += ` — ${c.aspects[p.aspect].code} ${c.aspects[p.aspect].name}`;
  } else if (p.kind === 'organ') txt += ` — ${metrics.om[p.id].status}`;
  tooltip.textContent = txt;
  tooltip.style.left = e.clientX + 14 + 'px'; tooltip.style.top = e.clientY + 12 + 'px';
  tooltip.hidden = false;
});
renderer.domElement.addEventListener('pointerleave', () => { tooltip.hidden = true; });

// ---------- Órgãos: cor conforme vitalidade ----------
const GREY = new THREE.Color('#3a4150'), HOT = new THREE.Color('#ff3b1f'), cTmp = new THREE.Color();
function updateOrgans(t) {
  let linked = null;
  if (focus?.kind === 'chakra') linked = new Set(ORGANS.filter(o => o.links.some(l => l.c === focus.id)).map(o => o.id));
  for (const o of ORGANS) {
    const { mat, base } = organs.meshes[o.id].userData;
    const m = metrics.om[o.id];
    cTmp.copy(base).lerp(GREY, m.deficit * 0.85).lerp(HOT, m.excess * 0.55);
    mat.color.copy(cTmp); mat.emissive.copy(cTmp);
    mat.emissiveIntensity = 0.08 + 0.3 * (1 - m.deficit) + m.excess * (0.5 + 0.45 * Math.sin(t * 5));
    let op = 0.95 - m.deficit * 0.3;
    if (linked) op *= linked.has(o.id) ? 1 : 0.12;
    else if (focus?.kind === 'organ') op *= focus.id === o.id ? 1 : 0.3;
    mat.opacity = op;
    mat.depthWrite = op > 0.5;
  }
}

// ---------- Loop ----------
function resize() {
  const { clientWidth: w, clientHeight: h } = viewport;
  renderer.setSize(w, h); labelRenderer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);
resize();

const clock = new THREE.Clock();
let elapsed = 0;
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05) * speed;
  elapsed += dt;
  if (camTween) {
    camTween.t = Math.min(1, camTween.t + 0.025);
    const k = 1 - Math.pow(1 - camTween.t, 3);
    camera.position.lerpVectors(camTween.fromP, camTween.toP, k);
    controls.target.lerpVectors(camTween.fromT, camTween.toT, k);
    if (camTween.t >= 1) camTween = null;
  }
  controls.update();
  energy.update(dt, metrics, focus);
  updateOrgans(elapsed);
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
});

window.atlas = { app, scene, camera, metrics: () => metrics };

// URL parameters: ?scenario=closed_heart&view=side&aura=1,2,3&sel=organ:coracao&layers=hara,core
const params = new URLSearchParams(location.search);
if (PRESETS[params.get('scenario')]) loadState(PRESETS[params.get('scenario')].state);
const auraParam = params.get('aura') === 'all' ? '1,2,3,4,5,6,7' : params.get('aura') ?? '';
for (const n of auraParam.split(',').filter(Boolean)) app.setAuraLayer(+n, true);
for (const k of (params.get('layers') ?? '').split(',').filter(Boolean)) { app.setVisible(k, true); ui.syncToggles(); }
if (params.get('sex') === 'female') await setSex('F');
if (params.get('sel')) {
  const [kind, id, aspect] = params.get('sel').split(':');
  app.select(kind === 'aura' ? { kind, n: +id } : { kind, id, aspect }, { fly: !params.get('view') });
}
if (params.get('view')) app.view(params.get('view'));
