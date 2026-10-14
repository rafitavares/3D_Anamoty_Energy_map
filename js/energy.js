// Anatomia energética: chakras, corrente vertical de força (VPC), nadis,
// partículas de energia, as 7 camadas da aura, linha do hara e estrela do núcleo.
import * as THREE from 'three';
import { CHAKRAS, ORGANS, VPC, AURA_LAYERS, HARA, CORE_STAR } from './data.js';
import { state, organPresent } from './state.js';
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
      uIntensity: { value: 1 }, uMud: { value: 0 }, uFocus: { value: 1 },
    },
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uPhase, uPetals, uIntensity, uMud, uFocus;
      varying vec2 vUv;
      void main(){
        float v = vUv.y;
        float s = vUv.x*uPetals - v*1.4 + uPhase;
        float petal = pow(0.5+0.5*cos(6.2831853*s), 2.5);
        float rim = smoothstep(0.93,0.99,v)*(1.0-smoothstep(0.99,1.0,v));
        float edge = smoothstep(0.0,0.12,v);
        vec3 col = mix(uColor, vec3(0.35,0.28,0.2), uMud);
        float a = ((0.12+0.88*petal)*(0.25+0.75*v)*edge + rim*1.2) * uIntensity * uFocus;
        gl_FragColor = vec4(col*a, a);
      }`,
  });
}

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
      const pick = new THREE.Mesh(pickGeo, pickMat);
      pick.position.set(0, FUNNEL_LEN * 0.65, 0); pick.scale.setScalar(0.06);
      pick.userData = { pickKind: 'chakra', pickId: c.id, aspect };
      twist.add(pick);
      group.add(holder);
      items.push({ c, aspect, key: `${c.id}.${aspect}`, holder, twist, mesh, mat, pick, core, phase: Math.random() * 10, dir, tip });
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
    for (let k = 0; k < PER; k++) parts.push({ it, v: Math.random() * 1.6, a: Math.random() * Math.PI * 2, idx: i * PER + k });
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
  const tmp = new THREE.Vector3();
  let time = 0;

  function update(dt, metrics, focus) {
    time += dt;
    const { cm } = metrics;
    const focusChakra = focus?.kind === 'chakra' ? focus.id : null;
    const focusOrgan = focus?.kind === 'organ' ? focus.id : null;
    const organChakras = focusOrgan ? new Set(ORGANS.find(o => o.id === focusOrgan).links.map(l => l.c)) : null;
    const chakraFocus = id => (!focus || (focusChakra == null && organChakras == null)) ? 1
      : (focusChakra === id || organChakras?.has(id)) ? 1.3 : 0.18;

    // Funis
    for (const it of chakras.items) {
      const s = state[it.key];
      const r = s.r, mag = Math.abs(r);
      const mouth = r === 0 ? 0.025 : 0.022 + mag * 0.011;
      const k = Math.min(0.55, Math.abs(s.e) * 0.6);
      it.twist.rotation.y = s.e === 0 ? 0 : Math.sign(s.e) * Math.PI / 4;
      it.mesh.scale.set(mouth * (1 + k), FUNNEL_LEN * (r === 0 ? 0.6 : 0.8 + mag * 0.03), mouth * (1 - k * 0.7));
      const speed = r === 0 ? 0 : (0.25 + mag * 0.12) * Math.sign(r);
      // Visto de fora, horário = aberto. O sentido do funil das costas é espelhado.
      it.phase += dt * speed * (it.aspect === 'back' || it.c.axis === 'down' ? -1 : 1);
      const m = it.mat.uniforms;
      m.uPhase.value = it.phase;
      m.uMud.value = r <= 0 ? 0.75 : 0;
      m.uIntensity.value = r === 0 ? 0.25 : r < 0 ? 0.5 : 0.6 + Math.min(mag, 10) * 0.07;
      m.uFocus.value = chakraFocus(it.c.id);
      it.mesh.updateMatrixWorld();
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
      const dir = r > 0 ? -1 : r < 0 ? 1 : 0; // aberto: entra; fechado: sai/estagna
      const speed = r > 0 ? 0.25 + r * 0.06 : 0.12;
      p.v += dt * speed * dir;
      p.a += dt * (r === 0 ? 0 : (1.2 + Math.abs(r) * 0.25) * Math.sign(r));
      if (p.v < 0) p.v += 1.6;
      if (p.v > 1.6) p.v -= 1.6;
      const rad = 0.03 + p.v; // continua alargando além da boca do funil
      tmp.set(Math.cos(p.a) * rad, Math.min(p.v, 1.6), Math.sin(p.a) * rad).applyMatrix4(p.it.mesh.matrixWorld);
      pos.setXYZ(p.idx, tmp.x, tmp.y, tmp.z);
      const fade = (p.v > 1.0 ? 1 - (p.v - 1.0) / 0.6 : 1) * Math.min(1, p.v * 4);
      const f = chakraFocus(p.it.c.id);
      cTmp.set(p.it.c.color);
      if (r <= 0) cTmp.lerp(MUD, 0.7);
      const b = (r === 0 ? 0.15 : r < 0 ? 0.45 : 0.6 + Math.min(r, 10) * 0.05) * fade * Math.min(f, 1);
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
    setOrganCenters(centers) { nadis = buildNadis(centers, nadis.group); },
    // Aura layers 1–3 follow the body surface.
    setBodyGeometry(geo) {
      for (const L of aura.layers) if (L.layer.n <= 3 && L.group.children.length === 1) L.group.children[0].geometry = geo;
    },
  };
}
