// Anatomia energética: chakras, corrente vertical de força (VPC), nadis,
// partículas de energia, as 7 camadas da aura, linha do hara e estrela do núcleo.
import * as THREE from 'three';
import { CHAKRAS, ORGANS, VPC, AURA_LAYERS, HARA, CORE_STAR } from './data.js';
import { state, organPresent, patternOf, isLinear, formOf, setVortexMap, vortices } from './state.js';
import { layoutFor, FORMS } from './vortex.js';
import { bodyGeometries } from './anatomy.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FUNNEL_LEN = 0.24;
const VISUAL_PETALS = { 4: 4, 6: 6, 10: 10, 12: 12, 16: 16, 96: 24, 972: 36 };
const MUD = new THREE.Color('#5a4a3a');

export function glowTexture(inner = 'rgba(255,255,255,1)') {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, inner); grd.addColorStop(0.25, 'rgba(255,255,255,0.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function starTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.translate(128, 128);
  const grd = g.createRadialGradient(0, 0, 0, 0, 0, 128);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.08, 'rgba(255,250,230,0.9)');
  grd.addColorStop(0.3, 'rgba(200,220,255,0.25)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(-128, -128, 256, 256);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++) {
    g.rotate(Math.PI / 8);
    const len = i % 2 ? 70 : 125;
    const lg = g.createLinearGradient(0, 0, len, 0);
    lg.addColorStop(0, 'rgba(255,255,255,0.9)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lg; g.fillRect(0, -1.5, len, 3);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const NOISE_GLSL = /* glsl */`
  float hash(vec3 p){ p = fract(p*0.3183099+.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float noise(vec3 x){
    vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x), mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x), mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s+=a*noise(p); p*=2.03; a*=0.5; } return s; }
  vec3 hue(float h){ return clamp(abs(mod(h*6.0+vec3(0,4,2),6.0)-3.0)-1.0,0.0,1.0); }
`;

// ---------------- Chakras ----------------
function funnelMaterial(color) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(color) }, uPhase: { value: 0 }, uPetals: { value: 6 },
      uIntensity: { value: 1 }, uMud: { value: 0 }, uFocus: { value: 1 }, uEnvelope: { value: 0 }, uTorn: { value: 0 },
    },
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uPhase, uPetals, uIntensity, uMud, uFocus, uEnvelope, uTorn;
      varying vec2 vUv;
      ${NOISE_GLSL}
      void main(){
        float v = vUv.y;
        // torn chakra (fig. 15-5 D): the mouth is ragged, with holes
        if (uTorn > 0.5) {
          float n = noise(vec3(vUv.x*14.0, v*5.0, 1.7));
          if (v > 0.45 && n < (v - 0.45) * 1.3) discard;
        }
        float s = vUv.x*uPetals - v*1.4 + uPhase;
        float petal = pow(0.5+0.5*cos(6.2831853*s), 2.5);
        float rim = smoothstep(0.93,0.99,v)*(1.0-smoothstep(0.99,1.0,v));
        float edge = smoothstep(0.0,0.12,v);
        // fine longitudinal strands, like the hatching in Brennan's drawings
        float strands = pow(0.5+0.5*cos(6.2831853*(vUv.x*48.0 - v*0.6 + uPhase*0.25)), 6.0);
        vec3 col = mix(uColor, vec3(0.35,0.28,0.2), uMud);
        float classic = (0.12+0.88*petal)*(0.25+0.75*v)*edge + rim*1.2;
        float envelope = (0.04 + 0.22*strands)*(0.3+0.7*v)*edge + rim*0.9;
        float a = mix(classic, envelope, uEnvelope) * uIntensity * uFocus;
        gl_FragColor = vec4(col*a, a);
      }`,
  });
}

// The small spiral cones that make up a chakra (book view). One instanced mesh per aspect,
// in the unit space of the big cone (tip at the origin, mouth radius 1 at y = 1).
// Per instance: aCenter = mouth position on the disk, aRad = mouth radius,
// aForm = 0 normal, 1 sprung (A), 2 tip pulled out (B), 3 wedged open (F); aHi = highlight.
const subConeGeo = (() => {
  const RU = 18, RT = 10, pos = [], idx = [];
  for (let j = 0; j <= RT; j++) for (let i = 0; i <= RU; i++) pos.push(i / RU, j / RT, 0);
  for (let j = 0; j < RT; j++) for (let i = 0; i < RU; i++) {
    const a = j * (RU + 1) + i, b = a + RU + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
})();

function subVortexMaterial(color, n) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(color) }, uPhase: { value: 0 }, uTime: { value: 0 },
      uIntensity: { value: 1 }, uMud: { value: 0 }, uFocus: { value: 1 }, uChaos: { value: 0 },
      uDensity: { value: Math.min(1, 1.35 / Math.pow(n, 0.25)) }, uTurns: { value: n > 50 ? 1.0 : 2.0 },
    },
    vertexShader: /* glsl */`
      attribute vec2 aCenter; attribute float aRad, aSeed, aForm, aHi;
      varying vec2 vUv; varying float vSeed, vForm, vHi;
      void main(){
        float u = position.x, t = position.y;
        float th = u * 6.2831853;
        vec2 dir = normalize(aCenter + vec2(0.0013, 0.0007));
        vec3 mouth = vec3(aCenter.x, 1.0, aCenter.y);
        vec3 apex = vec3(aCenter.x * 0.04, 0.015, aCenter.y * 0.04);
        float rad = aRad;
        float r = pow(t, 1.35);
        if (aForm > 0.5 && aForm < 1.5) {          // A: sprung out like a spring
          mouth += vec3(dir.x * 0.55, 0.6, dir.y * 0.55);
          r *= 0.8 + 0.25 * sin(t * 46.0);
        } else if (aForm > 1.5 && aForm < 2.5) {   // B: tip pulled out, hanging loose
          apex = vec3(dir.x * 1.55, 0.18, dir.y * 1.55);
          r = pow(t, 2.2);
        } else if (aForm > 2.5) {                  // F: wedged open
          rad *= 1.7;
        }
        vec3 c = mix(apex, mouth, t);
        vec3 p = c + vec3(cos(th), 0.0, sin(th)) * rad * r;
        vUv = vec2(u, t); vSeed = aSeed; vForm = aForm; vHi = aHi;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uPhase, uTime, uIntensity, uMud, uFocus, uChaos, uDensity, uTurns;
      varying vec2 vUv; varying float vSeed, vForm, vHi;
      void main(){
        float t = vUv.y;
        // healthy: the small cones spin in synchrony; diseased: fast, slow or jerky (ch. 15)
        float spin = vForm > 2.5 ? 0.05 : 1.0 + uChaos * (vSeed - 0.5) * 1.8;
        float ph = uPhase * 2.2 * spin + vSeed * 6.2831853 + uChaos * 0.7 * sin(uTime * 3.0 + vSeed * 40.0);
        float s = vUv.x * uTurns - t * 2.4 + ph;
        float spiral = pow(0.5 + 0.5 * cos(6.2831853 * s), 3.0);
        float rim = smoothstep(0.88, 0.97, t) * (1.0 - smoothstep(0.985, 1.0, t));
        float a = ((0.1 + 0.9 * spiral) * (0.15 + 0.85 * t) * smoothstep(0.0, 0.12, t) + rim * 0.9);
        vec3 col = mix(uColor, vec3(0.35, 0.28, 0.2), uMud);
        if (vForm > 2.5) { col = mix(col, vec3(0.92), 0.65); a *= 0.7; }   // pale
        a *= uIntensity * uFocus * uDensity * (0.2 + 1.6 * vHi);
        gl_FragColor = vec4(col * a, a);
      }`,
  });
}

// Protective screen over the chakra opening (fig. 8-2: adults have one, children do not).
function screenMaterial(color) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uIntensity: { value: 1 },
      uMud: { value: 0 }, uFocus: { value: 1 }, uTorn: { value: 0 }, uHole: { value: new THREE.Vector3(0, 0, 0) } },
    vertexShader: /* glsl */`varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor, uHole; uniform float uTime, uIntensity, uMud, uFocus, uTorn; varying vec2 vP;
      ${NOISE_GLSL}
      void main(){
        float d = length(vP);
        if (uHole.z > 0.0 && length(vP - uHole.xy) < uHole.z) discard;   // F: no screen over that vortex
        if (uTorn > 0.5 && noise(vec3(vP * 5.0, 3.1)) < 0.62) discard;    // D: screen ripped away
        float k = 16.0;
        float g1 = abs(fract((vP.x + vP.y) * k + uTime * 0.05) - 0.5);
        float g2 = abs(fract((vP.x - vP.y) * k - uTime * 0.05) - 0.5);
        float g3 = abs(fract(d * k * 0.7) - 0.5);
        float web = max(max(smoothstep(0.12, 0.0, g1), smoothstep(0.12, 0.0, g2)) * 0.8, smoothstep(0.1, 0.0, g3) * 0.5);
        float a = (0.04 + web * 0.32) * smoothstep(1.0, 0.94, d) * uIntensity * uFocus;
        vec3 col = mix(mix(uColor, vec3(1.0), 0.45), vec3(0.3, 0.24, 0.18), uMud);
        gl_FragColor = vec4(col * a, a);
      }`,
  });
}
const screenGeo = new THREE.CircleGeometry(1, 72).rotateX(-Math.PI / 2).translate(0, 1, 0);

function buildChakras(glow) {
  const group = new THREE.Group();
  const items = []; // um por aspecto
  const funnelGeo = new THREE.CylinderGeometry(1, 0.03, 1, 72, 12, true);
  funnelGeo.translate(0, 0.5, 0);
  funnelGeo.rotateY(Math.PI); // uv.x contínuo
  const pickGeo = new THREE.SphereGeometry(1, 12, 8);
  const pickMat = new THREE.MeshBasicMaterial({ visible: false });

  for (const c of CHAKRAS) {
    const tip = V(VPC.x, c.y, VPC.z);
    if (c.id === '7') tip.z = -0.01;
    // "coração" do chakra na coluna
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: c.color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    core.position.copy(tip); core.scale.setScalar(0.07);
    group.add(core);

    for (const aspect of Object.keys(c.aspects)) {
      const dir = aspect === 'front' ? V(0, 0, 1) : aspect === 'back' ? V(0, 0, -1) : c.axis === 'up' ? V(0, 1, 0) : V(0, -1, 0);
      const holder = new THREE.Group();
      holder.position.copy(tip);
      holder.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
      const twist = new THREE.Group();
      holder.add(twist);
      const mat = funnelMaterial(c.color);
      mat.uniforms.uPetals.value = VISUAL_PETALS[c.vortices];
      const mesh = new THREE.Mesh(funnelGeo, mat);
      mesh.renderOrder = 10;
      twist.add(mesh);
      // book view: the bundle of small spiral cones, the protective screen and a haze for clogging
      const lay = layoutFor(c.vortices);
      const g = new THREE.InstancedBufferGeometry();
      g.index = subConeGeo.index; g.attributes.position = subConeGeo.attributes.position;
      g.instanceCount = lay.length;
      g.setAttribute('aCenter', new THREE.InstancedBufferAttribute(new Float32Array(lay.flatMap(v => [v.x, v.z])), 2));
      g.setAttribute('aRad', new THREE.InstancedBufferAttribute(new Float32Array(lay.map(v => v.r)), 1));
      g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(lay.map(() => Math.random())), 1));
      g.setAttribute('aForm', new THREE.InstancedBufferAttribute(new Float32Array(lay.length), 1));
      g.setAttribute('aHi', new THREE.InstancedBufferAttribute(new Float32Array(lay.length).fill(0.5), 1));
      const subMat = subVortexMaterial(c.color, lay.length);
      const sub = new THREE.Mesh(g, subMat);
      sub.frustumCulled = false; sub.renderOrder = 11;
      mesh.add(sub);
      const scrMat = screenMaterial(c.color);
      const screen = new THREE.Mesh(screenGeo, scrMat);
      screen.renderOrder = 12;
      mesh.add(screen);
      const haze = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#2a2018', transparent: true, depthWrite: false, opacity: 0 }));
      haze.renderOrder = 13;
      twist.add(haze);
      const pick = new THREE.Mesh(pickGeo, pickMat);
      pick.position.set(0, FUNNEL_LEN * 0.65, 0); pick.scale.setScalar(0.06);
      pick.userData = { pickKind: 'chakra', pickId: c.id, aspect };
      twist.add(pick);
      group.add(holder);
      // upSign: twist.rotation.x that tilts this funnel toward the head (0 for the vertical chakras 1 and 7).
      const upSign = aspect === 'front' ? -1 : aspect === 'back' ? 1 : 0;
      items.push({ c, aspect, key: `${c.id}.${aspect}`, holder, twist, mesh, mat, pick, core, phase: Math.random() * 10, dir, tip,
        upSign, tilt: 0, ang: 0, asAng: Math.random() * Math.PI, swing: Math.random() * 6,
        lay, sub, subMat, screen, scrMat, haze, bend: 0, hiKey: '' });
      twist.rotation.order = 'ZXY'; // spin orientation, then tilt, then the side pull of form E
    }
  }
  return { group, items };
}

// Partículas que entram em espiral pelos vórtices (energia do campo universal).
function buildChakraParticles(items, glow) {
  const PER = 26;
  const n = items.length * PER;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const mat = new THREE.PointsMaterial({ size: 0.022, map: glow, vertexColors: true, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  const parts = [];
  items.forEach((it, i) => {
    for (let k = 0; k < PER; k++) parts.push({ it, v: Math.random() * 1.6, a: Math.random() * Math.PI * 2, idx: i * PER + k,
      sub: k % it.lay.length });
  });
  return { pts, parts };
}

// ---------------- Nadis (chakra → órgão) ----------------
function nadiMaterial(color, dashed) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uPhase: { value: 0 }, uIntensity: { value: 1 },
      uMud: { value: 0 }, uDashed: { value: dashed ? 1 : 0 }, uFocus: { value: 1 } },
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uPhase, uIntensity, uMud, uDashed, uFocus; varying vec2 vUv;
      void main(){
        float p = fract(vUv.x*5.0 - uPhase);
        float pulse = smoothstep(0.75,1.0,p) + 0.18;
        float dash = mix(1.0, step(0.45, fract(vUv.x*28.0)), uDashed);
        vec3 col = mix(uColor, vec3(0.4,0.3,0.22), uMud);
        float a = pulse * dash * uIntensity * uFocus * (0.4 + 0.6*smoothstep(0.0,0.1,vUv.x));
        gl_FragColor = vec4(col*a, a);
      }`,
  });
}

// Rebuilt in place when organs move (e.g. switching to the female body).
function buildNadis(organCenters, group = new THREE.Group()) {
  for (const old of [...group.children]) { old.geometry.dispose(); old.material.dispose(); group.remove(old); }
  const links = [];
  for (const o of ORGANS) {
    for (const l of o.links) {
      const c = CHAKRAS.find(x => x.id === l.c);
      const start = V(VPC.x, c.y, VPC.z + 0.01);
      if (c.id === '7') start.set(0, 1.71, -0.01);
      const end = organCenters[o.id].clone();
      const mid = start.clone().lerp(end, 0.5);
      mid.z += 0.035; mid.x *= 1.25;
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const mat = nadiMaterial(c.color, l.source === 'complementary');
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.0022 * (0.6 + l.w * 0.5), 6, false), mat);
      mesh.renderOrder = 9;
      group.add(mesh);
      links.push({ organ: o, chakra: c, link: l, mesh, mat, phase: Math.random() });
    }
  }
  return { group, links };
}

// ---------------- Corrente vertical de força ----------------
function buildVPC() {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 } },
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uIntensity; varying vec2 vUv;
      void main(){
        float up = smoothstep(0.8,1.0,fract(vUv.x*9.0 - uTime*0.5));
        float down = smoothstep(0.8,1.0,fract(vUv.x*7.0 + uTime*0.4));
        float ends = smoothstep(0.0,0.08,vUv.x)*smoothstep(1.0,0.92,vUv.x);
        vec3 col = vec3(0.75,0.85,1.0)*0.35 + vec3(1.0,0.95,0.8)*up + vec3(0.7,0.8,1.0)*down*0.7;
        float a = (0.35 + up + down*0.7) * ends * uIntensity;
        gl_FragColor = vec4(col*a, a);
      }`,
  });
  const curve = new THREE.LineCurve3(V(VPC.x, VPC.yBottom, VPC.z), V(VPC.x, VPC.yTop, VPC.z));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.006, 8, false), mat);
  mesh.renderOrder = 8;
  return { mesh, mat };
}

// ---------------- Aura ----------------
function auraUniforms() {
  return {
    uTime: { value: 0 }, uOpacity: { value: 1 }, uHarmony: { value: 1 },
    uChY: { value: CHAKRAS.map(c => c.y) },
    uChCol: { value: CHAKRAS.map(c => new THREE.Color(c.color)) },
    uDefF: { value: new Array(7).fill(0) }, uDefB: { value: new Array(7).fill(0) },
    uExcF: { value: new Array(7).fill(0) }, uExcB: { value: new Array(7).fill(0) },
  };
}

const AURA_COMMON = /* glsl */`
  uniform float uTime, uOpacity, uHarmony, uLayerOn;
  uniform float uChY[7]; uniform vec3 uChCol[7];
  uniform float uDefF[7]; uniform float uDefB[7]; uniform float uExcF[7]; uniform float uExcB[7];
  uniform vec3 uColor; uniform int uMode;
  varying vec3 vW; varying vec3 vN; varying vec3 vV;
  ${NOISE_GLSL}
  vec3 applyChakras(vec3 col, inout float a){
    float shadow = 0.0; vec3 flare = vec3(0.0);
    for(int i=0;i<7;i++){
      float band = exp(-pow((vW.y-uChY[i])/0.13, 2.0));
      float d = vW.z >= 0.0 ? uDefF[i] : uDefB[i];
      float e = vW.z >= 0.0 ? uExcF[i] : uExcB[i];
      shadow += band*d; flare += band*e*uChCol[i];
    }
    shadow = clamp(shadow,0.0,1.0);
    float n = fbm(vW*9.0 + uTime*0.15);
    col = mix(col, vec3(0.32,0.25,0.18)*(0.6+n), shadow*0.85);
    a *= 1.0 - shadow*0.35;
    col += flare*(0.3+0.25*sin(uTime*6.0+vW.y*30.0));
    return col;
  }
`;

function auraMaterial(layer, uniforms, offset) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { ...uniforms, uColor: { value: new THREE.Color(layer.color) }, uMode: { value: layer.n }, uOffset: { value: offset } },
    vertexShader: /* glsl */`
      uniform float uOffset; varying vec3 vW; varying vec3 vN; varying vec3 vV;
      void main(){
        vec4 w = modelMatrix*vec4(position,1.0);
        vec3 n = normalize(mat3(modelMatrix)*normal);
        w.xyz += n*uOffset;
        vW = w.xyz; vN = n; vV = normalize(cameraPosition - w.xyz);
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: AURA_COMMON + /* glsl */`
      void main(){
        float fres = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        vec3 col = uColor; float a = 0.0;
        if(uMode==1){ // etérico: teia de linhas de luz, pulsando
          vec3 g = abs(fract(vW*55.0)-0.5);
          float line = 1.0 - smoothstep(0.0,0.06,min(min(g.x,g.y),g.z));
          float pulse = 0.75+0.25*sin(uTime*1.6);
          a = (line*0.55 + pow(fres,2.0)*0.6) * pulse;
        } else if(uMode==2){ // emocional: nuvens coloridas fluidas
          float n = fbm(vW*6.0 + vec3(0.0,uTime*0.25,0.0));
          col = hue(n*1.6 + vW.y*0.4);
          a = pow(fres,1.4)*0.35*(0.4+n);
        } else if(uMode==3){ // mental: amarelo, concentrado em cabeça e ombros
          float n = fbm(vW*4.0 + uTime*0.1);
          a = pow(fres,1.8)*(0.1 + 0.5*smoothstep(1.05,1.6,vW.y))*(0.6+0.6*n);
        } else if(uMode==4){ // astral: arco-íris dos chakras infundido de rosa
          float n = fbm(vW*3.0 + vec3(uTime*0.12));
          float h = clamp((vW.y-0.75)/1.1,0.0,1.0);
          col = mix(hue(0.0 + h*0.78), vec3(1.0,0.55,0.7), 0.45);
          a = pow(fres,1.6)*0.45*(0.5+n);
        } else if(uMode==5){ // molde etérico: azul cobalto, negativo
          vec3 g = abs(fract(vW*14.0)-0.5);
          float line = 1.0 - smoothstep(0.0,0.05,min(g.x,g.y));
          a = pow(fres,2.0)*0.4 + line*0.08*fres;
        } else if(uMode==6){ // celestial: opalescente cintilante
          float n = fbm(vW*5.0 + uTime*0.2);
          col = mix(vec3(1.0), hue(n*2.0+uTime*0.05), 0.45);
          a = pow(fres,2.2)*0.4*(0.5+n) + pow(noise(vW*80.0+uTime),18.0)*0.6;
        } else { // ketérico: fios de ouro, forma de ovo
          float ang = atan(vW.z, vW.x);
          float threads = pow(abs(sin(ang*48.0 + fbm(vW*3.0)*3.0)), 40.0);
          a = pow(fres,2.5)*0.55 + threads*0.18*fres;
        }
        col = applyChakras(col, a);
        a *= uOpacity * (0.55 + 0.45*uHarmony);
        gl_FragColor = vec4(col*a, a);
      }`,
  });
}

function egg(rx, ry, rz, cy) {
  const g = new THREE.SphereGeometry(1, 64, 48);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const k = 1 + 0.12 * y; // mais largo em cima
    p.setXYZ(i, p.getX(i) * rx * k, y * ry + cy, p.getZ(i) * rz * k);
  }
  g.computeVertexNormals();
  return g;
}

function buildAura() {
  const uniforms = auraUniforms();
  const layers = [];
  const bodyParts = bodyGeometries();
  const offsets = { 1: 0.02, 2: 0.055, 3: 0.14 };
  const eggs = { 4: [0.52, 1.18, 0.42], 5: [0.75, 1.42, 0.64], 6: [0.95, 1.62, 0.84], 7: [1.16, 1.84, 1.05] };
  for (const L of AURA_LAYERS) {
    const group = new THREE.Group();
    const mat = auraMaterial(L, uniforms, offsets[L.n] ?? 0);
    if (L.n <= 3) {
      for (const p of bodyParts) {
        const m = new THREE.Mesh(p.geo, mat);
        m.position.copy(p.pos); m.quaternion.copy(p.quat); m.scale.copy(p.scale);
        group.add(m);
      }
    } else {
      group.add(new THREE.Mesh(egg(...eggs[L.n], 0.95), mat));
    }
    group.renderOrder = 1;
    group.traverse(o => { o.renderOrder = 1 + L.n * 0.01; });
    group.visible = false;
    layers.push({ layer: L, group, mat });
  }
  return { layers, uniforms };
}

// ---------------- Hara e Estrela do Núcleo ----------------
function buildHara(glow) {
  const group = new THREE.Group();
  const lineMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv=uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */`uniform float uTime; varying vec2 vUv;
      void main(){ float p = 0.6+0.4*sin(vUv.x*120.0 - uTime*3.0); float a = 0.8*p; gl_FragColor = vec4(vec3(1.0,0.82,0.35)*a, a); }`,
  });
  const top = HARA[0].y;
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(V(0, -0.9, 0), V(0, top, 0)), 64, 0.0035, 6), lineMat));
  const markers = {};
  const sizes = { id_point: 0.07, soul_seat: 0.12, tan_tien: 0.09 };
  const colors = { id_point: '#ffffff', soul_seat: '#bfe0ff', tan_tien: '#ffb43a' };
  for (const h of HARA) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: colors[h.id], blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.position.set(0, h.y, 0); s.scale.setScalar(sizes[h.id]);
    group.add(s);
    const pick = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    pick.position.copy(s.position); pick.userData = { pickKind: 'hara', pickId: h.id };
    group.add(pick);
    markers[h.id] = { sprite: s, pick, base: sizes[h.id] };
  }
  // Ponto ID: pequeno funil invertido
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  cone.position.set(0, top - 0.03, 0); cone.rotation.x = Math.PI;
  group.add(cone);
  group.visible = false;
  return { group, lineMat, markers };
}

function buildCoreStar() {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  s.position.set(0, CORE_STAR.y, 0.0); s.scale.setScalar(0.22);
  const pick = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  pick.position.copy(s.position); pick.userData = { pickKind: 'core', pickId: 'core' };
  const group = new THREE.Group(); group.add(s, pick); group.visible = false;
  return { group, sprite: s, pick };
}

// ---------------- Montagem + atualização ----------------
// Which small vortex feeds which organ. Brennan gives the principle ("each vortex of a chakra
// supplies a specific organ") and two examples (in the solar plexus, the pancreas vortex on the
// left and the liver vortex near the liver). The rest is a spatial reading: each organ goes to
// the free vortex that faces it, the strongest links choosing first.
function computeVortexMap(items, organCenters) {
  const map = {};
  const q = new THREE.Quaternion(), d = new THREE.Vector3();
  for (const it of items) {
    q.copy(it.holder.quaternion).invert();
    const free = it.lay.map((v, i) => i);
    const list = new Array(it.lay.length).fill(null);
    const organs = ORGANS.map(o => ({ o, l: o.links.find(l => l.c === it.c.id) }))
      .filter(x => x.l && organCenters[x.o.id]).sort((a, b) => b.l.w - a.l.w);
    for (const { o } of organs) {
      d.copy(organCenters[o.id]).sub(it.tip).applyQuaternion(q);
      const len = Math.hypot(d.x, d.z) || 1;
      const tx = d.x / len * 0.6, tz = d.z / len * 0.6;
      let best = -1, bd = Infinity;
      for (const i of free) {
        const v = it.lay[i], dd = (v.x - tx) ** 2 + (v.z - tz) ** 2;
        if (dd < bd) { bd = dd; best = i; }
      }
      if (best < 0) break;
      list[best] = o.id; free.splice(free.indexOf(best), 1);
    }
    map[it.key] = list;
  }
  return map;
}

export function buildEnergy(organCenters) {
  const glow = glowTexture();
  const chakras = buildChakras(glow);
  const cparts = buildChakraParticles(chakras.items, glow);
  let nadis = buildNadis(organCenters);
  const vpc = buildVPC();
  const aura = buildAura();
  const hara = buildHara(glow);
  const core = buildCoreStar();

  const pickables = [...chakras.items.map(i => i.pick), ...Object.values(hara.markers).map(m => m.pick), core.pick];
  const opts = { book: true, screen: true };
  for (const it of chakras.items) it.holder.updateMatrixWorld(true);
  setVortexMap(computeVortexMap(chakras.items, organCenters));
  const tmp = new THREE.Vector3();
  let time = 0;

  function update(dt, metrics, focus) {
    time += dt;
    const { cm } = metrics;
    const aspectMetricsCache = {};
    for (const c of CHAKRAS) Object.keys(c.aspects).forEach((a, i) => { aspectMetricsCache[`${c.id}.${a}`] = cm[c.id].aspects[i]; });
    const focusChakra = focus?.kind === 'chakra' ? focus.id : null;
    const focusOrgan = focus?.kind === 'organ' ? focus.id : null;
    const organChakras = focusOrgan ? new Set(ORGANS.find(o => o.id === focusOrgan).links.map(l => l.c)) : null;
    const chakraFocus = id => (!focus || (focusChakra == null && organChakras == null)) ? 1
      : (focusChakra === id || organChakras?.has(id)) ? 1.3 : 0.18;

    // Funis — shape follows Brennan's pendulum patterns (fig. 10-2).
    for (const it of chakras.items) {
      const s = state[it.key];
      const r = s.r, mag = Math.abs(r);
      const pat = patternOf(s), lin = isLinear(s) && r !== 0;
      const mouth = r === 0 ? 0.025 : 0.022 + mag * 0.011;
      let k = 0, ang = 0, tilt = 0, len = 1;
      if (pat === 'O') { k = Math.min(0.55, Math.abs(s.e) * 0.6); ang = s.e === 0 ? 0 : Math.sign(s.e) * Math.PI / 4; }
      else if (pat === 'EV') { k = 0.45; ang = Math.PI / 2; tilt = 0.35; }
      else if (pat === 'EH') { k = 0.45; ang = 0; tilt = -0.18; len = 0.7; }
      else if (pat === 'AS') {
        // the ellipse keeps turning its axis, never settling left or right
        it.asAng += dt * (0.6 + 0.4 * Math.sin(time * 0.7 + it.phase));
        k = 0.45; ang = it.asAng;
      } else { // linear swings
        k = 0.85; ang = { V: Math.PI / 2, H: 0, R: Math.PI / 4, L: -Math.PI / 4 }[pat];
        if (pat === 'V') tilt = 0.6;
        if (pat === 'H') { tilt = -0.3; len = 0.6; }
      }
      if (r === 0) { k = 0; tilt = 0; }
      // smooth transitions between patterns (the AS axis is already continuous)
      const lerpK = Math.min(1, dt * 6);
      if (pat === 'AS') it.ang = ang;
      else { let d = ang - it.ang; d = Math.atan2(Math.sin(d), Math.cos(d)); it.ang += d * lerpK; }
      it.tilt += (tilt * it.upSign - it.tilt) * lerpK;
      const form = formOf(s), F = FORMS[form];
      // E: the whole chakra pulled to one side (+x is the body's left)
      it.bend += ((F.side ? -F.side * 0.65 : 0) - it.bend) * lerpK;
      it.twist.rotation.set(it.tilt, it.ang, it.bend);
      it.swing += dt * (1.6 + mag * 0.12);
      const sw = lin ? 0.55 + 0.45 * Math.abs(Math.sin(it.swing)) : 1;
      const sx = mouth * (1 + k) * sw, sz = mouth * (lin ? 0.15 : 1 - k * 0.7);
      it.mesh.scale.set(sx, FUNNEL_LEN * (r === 0 ? 0.6 : 0.8 + mag * 0.03) * len, sz);
      const speed = (r === 0 || lin) ? 0 : (0.25 + mag * 0.12) * Math.sign(r);
      // Visto de fora, horário = aberto. O sentido do funil das costas é espelhado.
      it.phase += dt * speed * (it.aspect === 'back' || it.c.axis === 'down' ? -1 : 1);
      const m = it.mat.uniforms;
      m.uPhase.value = it.phase;
      m.uMud.value = r <= 0 ? 0.75 : lin ? 0.5 : pat === 'EH' ? 0.3 : 0;
      m.uIntensity.value = r === 0 ? 0.25 : r < 0 ? 0.5 : lin ? 0.45 : 0.6 + Math.min(mag, 10) * 0.07;
      m.uFocus.value = chakraFocus(it.c.id);
      m.uEnvelope.value = opts.book ? 1 : 0;
      m.uTorn.value = F.torn ? 1 : 0;
      const clog = form === 'C' ? 1 : 0;
      if (clog) m.uMud.value = 0.85;

      // book view: small spiral cones, screen and haze
      it.sub.visible = opts.book;
      it.screen.visible = opts.book && opts.screen && r !== 0;
      it.haze.visible = opts.book && clog === 1;
      if (opts.book) {
        const sm = it.subMat.uniforms;
        const am = aspectMetricsCache[it.key];
        sm.uPhase.value = it.phase; sm.uTime.value = time;
        sm.uMud.value = Math.max(m.uMud.value, 0);
        sm.uIntensity.value = r === 0 ? 0.3 : r < 0 ? 0.55 : lin ? 0.5 : 0.7 + Math.min(mag, 10) * 0.05;
        sm.uFocus.value = m.uFocus.value;
        // healthy cones spin in synchrony; the more disturbed the chakra, the more erratic they are
        sm.uChaos.value = Math.min(1, (am?.deficit ?? 0) * 1.2 + (pat === 'AS' ? 0.5 : 0) + (clog ? 0.4 : 0));
        // per-vortex form and highlight (only rewritten when something changes)
        const hiKey = `${form}|${s.v ?? 0}|${focusOrgan ?? ''}|${vortices.version}`;
        if (hiKey !== it.hiKey) {
          it.hiKey = hiKey;
          const fa = it.sub.geometry.attributes.aForm, ha = it.sub.geometry.attributes.aHi;
          const owners = vortices.map[it.key] ?? [];
          const code = { A: 1, B: 2, F: 3 }[form] ?? 0;
          for (let i = 0; i < it.lay.length; i++) {
            fa.array[i] = code && (s.v ?? 0) === i ? code : 0;
            ha.array[i] = focusOrgan ? (owners[i] === focusOrgan ? 1.4 : 0.12) : 0.5;
          }
          fa.needsUpdate = true; ha.needsUpdate = true;
          const hv = form === 'F' ? it.lay[s.v ?? 0] : null;
          it.scrMat.uniforms.uHole.value.set(hv ? hv.x : 0, hv ? hv.z : 0, hv ? hv.r * 1.6 : 0);
        }
        const sc = it.scrMat.uniforms;
        sc.uTime.value = time; sc.uFocus.value = m.uFocus.value; sc.uTorn.value = F.torn ? 1 : 0;
        sc.uMud.value = clog ? 0.9 : r < 0 ? 0.5 : 0;
        sc.uIntensity.value = r < 0 ? 0.6 : 1;
        if (clog) {
          it.haze.position.set(0, FUNNEL_LEN * 0.6, 0);
          it.haze.scale.setScalar(mouth * 4.2 * (1 + 0.05 * Math.sin(time * 1.3 + it.phase)));
          it.haze.material.opacity = 0.75 * Math.min(1, m.uFocus.value);
        }
      }
      it.twist.updateMatrixWorld(true);
    }
    for (const c of CHAKRAS) {
      const it = chakras.items.find(i => i.c === c);
      const mc = cm[c.id];
      const pulse = 1 + 0.15 * Math.sin(time * (2 + mc.flow * 2));
      it.core.scale.setScalar((0.04 + 0.04 * Math.min(mc.flow, 1.5)) * pulse * (mc.excess > 0 ? 1 + mc.excess * 0.6 : 1));
      it.core.material.opacity = (0.35 + 0.65 * (1 - mc.deficit)) * Math.min(1, chakraFocus(c.id));
    }

    // Partículas nos vórtices
    const pos = cparts.pts.geometry.attributes.position, col = cparts.pts.geometry.attributes.color;
    const cTmp = new THREE.Color();
    for (const p of cparts.parts) {
      const s = state[p.it.key];
      const r = s.r;
      const lin = isLinear(s) && r !== 0;
      if (lin) {
        // no vortex: the energy just swings back and forth along one line, like the pendulum
        p.v += dt * 0.05; if (p.v > 1.6) p.v -= 1.6;
        const rad = (0.03 + p.v) * Math.sin(p.it.swing + p.a);
        tmp.set(rad, Math.min(p.v, 1.6), 0).applyMatrix4(p.it.mesh.matrixWorld);
      } else {
      const dir = r > 0 ? -1 : r < 0 ? 1 : 0; // aberto: entra; fechado: sai/estagna
      const speed = r > 0 ? 0.25 + r * 0.06 : 0.12;
      p.v += dt * speed * dir;
      p.a += dt * (r === 0 ? 0 : (1.2 + Math.abs(r) * 0.25) * Math.sign(r));
      if (p.v < 0) p.v += 1.6;
      if (p.v > 1.6) p.v -= 1.6;
      if (opts.book) {
        // each particle spirals down into one small cone toward the vertical power current
        const sv = p.it.lay[p.sub];
        const t = Math.min(p.v, 1.6);
        const cr = sv.r * Math.pow(Math.min(t, 1), 1.35) * 0.7 * (t > 1 ? 1 + (t - 1) * 1.5 : 1);
        tmp.set(sv.x * Math.max(t, 0.04) + Math.cos(p.a) * cr, t, sv.z * Math.max(t, 0.04) + Math.sin(p.a) * cr)
          .applyMatrix4(p.it.mesh.matrixWorld);
      } else {
      const rad = 0.03 + p.v; // continua alargando além da boca do funil
      tmp.set(Math.cos(p.a) * rad, Math.min(p.v, 1.6), Math.sin(p.a) * rad).applyMatrix4(p.it.mesh.matrixWorld);
      }
      }
      pos.setXYZ(p.idx, tmp.x, tmp.y, tmp.z);
      const fade = (p.v > 1.0 ? 1 - (p.v - 1.0) / 0.6 : 1) * Math.min(1, p.v * 4);
      const f = chakraFocus(p.it.c.id);
      cTmp.set(p.it.c.color);
      if (r <= 0) cTmp.lerp(MUD, 0.7); else if (lin) cTmp.lerp(MUD, 0.4);
      const b = (r === 0 ? 0.15 : r < 0 ? 0.45 : lin ? 0.4 : 0.6 + Math.min(r, 10) * 0.05) * fade * Math.min(f, 1);
      col.setXYZ(p.idx, cTmp.r * b, cTmp.g * b, cTmp.b * b);
    }
    pos.needsUpdate = true; col.needsUpdate = true;

    // Nadis
    for (const n of nadis.links) {
      n.mesh.visible = organPresent(n.organ);
      const mc = cm[n.chakra.id];
      const blocked = mc.deficit > 0.5 && mc.flow < 0.2;
      n.phase += dt * (blocked ? -0.08 : 0.25 + mc.flow * 0.5);
      const u = n.mat.uniforms;
      u.uPhase.value = n.phase;
      u.uMud.value = Math.min(1, mc.deficit * 1.1);
      u.uIntensity.value = (0.25 + 0.9 * (1 - mc.deficit) + mc.excess * 0.8) * (0.5 + n.link.w * 0.5);
      let f = 1;
      if (focusChakra) f = focusChakra === n.chakra.id ? 1.8 : 0.08;
      else if (focusOrgan) f = focusOrgan === n.organ.id ? 2.2 : 0.08;
      u.uFocus.value = f;
    }

    // VPC
    vpc.mat.uniforms.uTime.value = time;
    vpc.mat.uniforms.uIntensity.value = 0.45 + 0.55 * metrics.harmony;

    // Aura
    const au = aura.uniforms;
    au.uTime.value = time; au.uHarmony.value = metrics.harmony;
    CHAKRAS.forEach((c, i) => {
      // aspects = [front, back] ou [main]
      const [mf, mb = mf] = cm[c.id].aspects;
      au.uDefF.value[i] = mf.deficit; au.uDefB.value[i] = mb.deficit;
      au.uExcF.value[i] = mf.excess * 0.5; au.uExcB.value[i] = mb.excess * 0.5;
    });

    // Hara e estrela
    hara.lineMat.uniforms.uTime.value = time;
    hara.markers.tan_tien.sprite.scale.setScalar(hara.markers.tan_tien.base * (1 + 0.1 * Math.sin(time * 2)));
    core.sprite.material.rotation = time * 0.05;
    core.sprite.scale.setScalar(0.22 * (1 + 0.06 * Math.sin(time * 1.3)));
  }

  return {
    groups: {
      chakras: chakras.group, particles: cparts.pts, nadis: nadis.group, vpc: vpc.mesh,
      hara: hara.group, core: core.group,
    },
    auraLayers: aura.layers, auraUniforms: aura.uniforms,
    chakraItems: chakras.items, pickables, update,
    setOrganCenters(centers) { nadis = buildNadis(centers, nadis.group); setVortexMap(computeVortexMap(chakras.items, centers)); },
    // Chakra drawing: book view (vortex of small vortices, after Brennan's figures) or simple funnel.
    get book() { return opts.book; }, setBook(v) { opts.book = v; },
    get screen() { return opts.screen; }, setScreen(v) { opts.screen = v; },
    // Aura layers 1–3 follow the body surface.
    setBodyGeometry(geo) {
      for (const L of aura.layers) if (L.layer.n <= 3 && L.group.children.length === 1) L.group.children[0].geometry = geo;
    },
  };
}
