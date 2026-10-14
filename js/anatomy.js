// Corpo físico procedural: pele holográfica + órgãos em posições anatômicas
// aproximadas. Cada órgão pode ser trocado por um modelo .glb real
// (ver README) mantendo o mesmo id.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function skinMaterial(color = '#7fe3ff') {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0.55 } },
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vV;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uOpacity;
      varying vec3 vN; varying vec3 vV;
      void main(){
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        gl_FragColor = vec4(uColor * (0.05 + f), (0.04 + f*0.9) * uOpacity);
      }`,
  });
}

// Cápsula entre dois pontos.
function limb(a, b, r, mat) {
  const len = a.distanceTo(b);
  const g = new THREE.CapsuleGeometry(r, len, 8, 20);
  const m = new THREE.Mesh(g, mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

// Geometrias do corpo, reutilizadas pelas camadas 1 e 2 da aura.
export function bodyGeometries() {
  const parts = [];
  const add = (geo, pos, quat, scale) => parts.push({ geo, pos, quat, scale });
  const capsule = (a, b, r) => {
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
    add(new THREE.CapsuleGeometry(r, a.distanceTo(b), 8, 20), a.clone().add(b).multiplyScalar(0.5), q, V(1, 1, 1));
  };
  // Cabeça e pescoço
  add(new THREE.SphereGeometry(0.1, 40, 32), V(0, 1.665, 0.005), new THREE.Quaternion(), V(0.86, 1.12, 1.0));
  capsule(V(0, 1.47, -0.01), V(0, 1.58, -0.01), 0.048);
  // Tronco (torno), achatado em profundidade
  const prof = [[0.0, 0.84], [0.11, 0.85], [0.165, 0.9], [0.17, 0.96], [0.15, 1.04], [0.135, 1.1], [0.145, 1.2],
    [0.165, 1.3], [0.18, 1.39], [0.175, 1.44], [0.12, 1.48], [0.055, 1.5], [0.0, 1.505]].map(([r, y]) => new THREE.Vector2(r, y));
  add(new THREE.LatheGeometry(prof, 48), V(0, 0, 0), new THREE.Quaternion(), V(1, 1, 0.62));
  // Braços
  for (const s of [1, -1]) {
    capsule(V(0.185 * s, 1.42, -0.01), V(0.235 * s, 1.15, -0.01), 0.042);
    capsule(V(0.235 * s, 1.15, -0.01), V(0.27 * s, 0.9, 0.02), 0.034);
    add(new THREE.SphereGeometry(0.04, 20, 16), V(0.28 * s, 0.84, 0.025), new THREE.Quaternion(), V(0.6, 1.4, 1));
  }
  // Pernas
  for (const s of [1, -1]) {
    capsule(V(0.09 * s, 0.86, 0), V(0.1 * s, 0.48, 0.005), 0.068);
    capsule(V(0.1 * s, 0.48, 0.005), V(0.105 * s, 0.08, -0.01), 0.048);
    add(new THREE.BoxGeometry(0.08, 0.05, 0.22, 2, 2, 4), V(0.105 * s, 0.03, 0.05), new THREE.Quaternion(), V(1, 1, 1));
  }
  return parts;
}

export function buildBody() {
  const group = new THREE.Group();
  const mat = skinMaterial();
  for (const p of bodyGeometries()) {
    const m = new THREE.Mesh(p.geo, mat);
    m.position.copy(p.pos); m.quaternion.copy(p.quat); m.scale.copy(p.scale);
    m.renderOrder = 5;
    group.add(m);
  }
  return { group, material: mat };
}

// ---------- Órgãos ----------
function organMat(color) {
  return new THREE.MeshStandardMaterial({
    color, roughness: 0.45, metalness: 0.05, emissive: new THREE.Color(color), emissiveIntensity: 0.25,
    transparent: true, opacity: 0.95,
  });
}

function ellipsoid(r, scale, pos, mat, rot) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), mat);
  m.scale.copy(scale); m.position.copy(pos);
  if (rot) m.rotation.set(...rot);
  return m;
}

function tube(points, r, mat, segs = 64) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, segs, r, 10, false), mat);
}

const BUILDERS = {
  cerebro_sup: m => ellipsoid(1, V(0.078, 0.058, 0.092), V(0, 1.7, 0.0), m),
  cerebro_inf: m => {
    const g = new THREE.Group();
    g.add(ellipsoid(1, V(0.05, 0.03, 0.035), V(0, 1.635, -0.055), m));
    g.add(tube([V(0, 1.665, -0.02), V(0, 1.62, -0.03), V(0, 1.585, -0.035)], 0.013, m, 12));
    return g;
  },
  pineal: m => ellipsoid(0.009, V(1, 1, 1), V(0, 1.665, -0.025), m),
  hipofise: m => ellipsoid(0.009, V(1, 1, 1), V(0, 1.642, 0.02), m),
  olho_d: m => ellipsoid(0.013, V(1, 1, 1), V(-0.032, 1.655, 0.082), m),
  olho_e: m => ellipsoid(0.013, V(1, 1, 1), V(0.032, 1.655, 0.082), m),
  ouvidos: m => {
    const g = new THREE.Group();
    for (const s of [1, -1]) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.005, 10, 24), m);
      t.position.set(0.088 * s, 1.645, -0.005); t.rotation.y = Math.PI / 2; t.scale.set(1, 1.5, 1);
      g.add(t);
    }
    return g;
  },
  nariz: m => {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.04, 16), m);
    c.position.set(0, 1.625, 0.1); c.rotation.x = 0.35;
    return c;
  },
  tireoide: m => {
    const g = new THREE.Group();
    for (const s of [1, -1]) g.add(ellipsoid(1, V(0.012, 0.02, 0.01), V(0.016 * s, 1.462, 0.035), m));
    g.add(ellipsoid(1, V(0.012, 0.006, 0.006), V(0, 1.456, 0.042), m));
    return g;
  },
  laringe: m => {
    const g = new THREE.Group();
    g.add(tube([V(0, 1.53, 0.03), V(0, 1.47, 0.025), V(0, 1.4, 0.015), V(0, 1.35, 0.01)], 0.011, m, 20));
    for (const s of [1, -1]) g.add(tube([V(0, 1.35, 0.01), V(0.03 * s, 1.32, 0.0), V(0.06 * s, 1.28, -0.005)], 0.007, m, 12));
    return g;
  },
  pulmao_e: m => ellipsoid(1, V(0.066, 0.12, 0.072), V(0.078, 1.29, -0.005), m),
  pulmao_d: m => ellipsoid(1, V(0.07, 0.12, 0.074), V(-0.078, 1.29, -0.005), m),
  timo: m => ellipsoid(1, V(0.022, 0.03, 0.01), V(0, 1.37, 0.06), m),
  coracao: m => ellipsoid(1, V(0.042, 0.056, 0.04), V(0.022, 1.285, 0.04), m, [0, 0, 0.5]),
  circulacao: m => {
    const g = new THREE.Group();
    g.add(tube([V(0.02, 1.31, 0.04), V(0.01, 1.37, 0.03), V(-0.005, 1.38, -0.01), V(0.01, 1.33, -0.035),
      V(0.01, 1.2, -0.035), V(0.005, 1.05, -0.03), V(0, 0.96, -0.02)], 0.009, m, 80));
    for (const s of [1, -1]) {
      g.add(tube([V(0, 0.96, -0.02), V(0.05 * s, 0.9, 0.0), V(0.09 * s, 0.82, 0.01), V(0.1 * s, 0.5, 0.01), V(0.105 * s, 0.12, -0.01)], 0.006, m, 40));
      g.add(tube([V(-0.005, 1.38, -0.01), V(0.06 * s, 1.43, -0.01), V(0.19 * s, 1.41, -0.01), V(0.235 * s, 1.15, -0.01), V(0.27 * s, 0.9, 0.02)], 0.004, m, 40));
      g.add(tube([V(0.005, 1.38, 0.0), V(0.025 * s, 1.48, 0.02), V(0.03 * s, 1.6, 0.02), V(0.04 * s, 1.68, 0.0)], 0.004, m, 30));
    }
    return g;
  },
  vago: m => {
    const g = new THREE.Group();
    for (const s of [1, -1]) g.add(tube([V(0.012 * s, 1.6, -0.03), V(0.03 * s, 1.5, 0.0), V(0.028 * s, 1.4, 0.01),
      V(0.03 * s, 1.3, 0.04), V(0.03 * s, 1.18, 0.03), V(0.05, 1.13, 0.04)], 0.0035, m, 60));
    return g;
  },
  estomago: m => {
    const g = new THREE.Group();
    g.add(ellipsoid(1, V(0.055, 0.042, 0.035), V(0.06, 1.135, 0.04), m, [0, 0, -0.6]));
    g.add(tube([V(0.0, 1.22, 0.0), V(0.02, 1.17, 0.02), V(0.04, 1.155, 0.035)], 0.01, m, 12));
    return g;
  },
  figado: m => ellipsoid(1, V(0.1, 0.05, 0.07), V(-0.055, 1.165, 0.025), m, [0, 0, 0.25]),
  vesicula: m => ellipsoid(1, V(0.012, 0.02, 0.012), V(-0.055, 1.118, 0.075), m),
  pancreas: m => {
    const c = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.1, 6, 12), m);
    c.position.set(0.02, 1.1, -0.005); c.rotation.z = Math.PI / 2 - 0.2;
    return c;
  },
  baco: m => ellipsoid(1, V(0.025, 0.045, 0.03), V(0.11, 1.15, -0.04), m, [0, 0, -0.3]),
  intestinos: m => {
    const pts = [];
    // Intestino delgado: serpenteando dentro do quadro do cólon.
    for (let i = 0; i <= 120; i++) {
      const t = i / 120, row = Math.floor(t * 6), u = (t * 6) % 1;
      const x = (row % 2 ? 1 - u : u) * 0.15 - 0.075;
      pts.push(V(x, 1.06 - row * 0.016 - u * 0.016, 0.05 + Math.sin(t * 40) * 0.012));
    }
    const g = new THREE.Group();
    g.add(tube(pts, 0.009, m, 400));
    // Cólon (moldura)
    g.add(tube([V(-0.09, 0.93, 0.04), V(-0.105, 1.0, 0.04), V(-0.1, 1.08, 0.04), V(0, 1.09, 0.06), V(0.1, 1.08, 0.04),
      V(0.105, 1.0, 0.04), V(0.08, 0.93, 0.04), V(0.03, 0.9, 0.0), V(0.0, 0.88, -0.03)], 0.016, m, 120));
    return g;
  },
  rim_e: m => ellipsoid(1, V(0.03, 0.05, 0.022), V(0.07, 1.06, -0.065), m, [0, 0, -0.15]),
  rim_d: m => ellipsoid(1, V(0.03, 0.05, 0.022), V(-0.07, 1.045, -0.065), m, [0, 0, 0.15]),
  suprarrenais: m => {
    const g = new THREE.Group();
    for (const [s, y] of [[1, 1.117], [-1, 1.102]]) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.025, 3), m);
      c.position.set(0.066 * s, y, -0.065);
      g.add(c);
    }
    return g;
  },
  bexiga: m => ellipsoid(1, V(0.035, 0.028, 0.03), V(0, 0.895, 0.05), m),
  gonadas: m => {
    const g = new THREE.Group();
    for (const s of [1, -1]) g.add(ellipsoid(1, V(0.014, 0.009, 0.01), V(0.055 * s, 0.94, 0.015), m));
    return g;
  },
  reprodutor: m => {
    const g = new THREE.Group();
    g.add(ellipsoid(1, V(0.025, 0.035, 0.02), V(0, 0.935, 0.02), m));
    for (const s of [1, -1]) g.add(tube([V(0.02 * s, 0.955, 0.02), V(0.04 * s, 0.96, 0.02), V(0.055 * s, 0.948, 0.015)], 0.003, m, 12));
    return g;
  },
  coluna: m => {
    const g = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([V(0, 0.84, -0.08), V(0, 0.95, -0.095), V(0, 1.05, -0.07), V(0, 1.2, -0.075),
      V(0, 1.35, -0.095), V(0, 1.47, -0.06), V(0, 1.58, -0.045)]);
    const n = 30;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), p = curve.getPoint(t);
      const w = 0.016 + 0.012 * (1 - t);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(w, w, 0.014, 14), m);
      b.position.copy(p);
      b.quaternion.setFromUnitVectors(V(0, 1, 0), curve.getTangent(t));
      g.add(b);
    }
    return g;
  },
  medula: m => tube([V(0, 0.86, -0.088), V(0, 0.95, -0.103), V(0, 1.05, -0.078), V(0, 1.2, -0.083), V(0, 1.35, -0.103),
    V(0, 1.47, -0.068), V(0, 1.58, -0.04), V(0, 1.62, -0.035)], 0.005, m, 80),
};

export const ORGAN_COLORS = {
  cerebro_sup: '#f4a7b9', cerebro_inf: '#e889a2', pineal: '#c7a6ff', hipofise: '#9d8cff',
  olho_d: '#ffffff', olho_e: '#ffffff', ouvidos: '#f0b59a', nariz: '#f0b59a',
  tireoide: '#6fb0ff', laringe: '#a8d4ff', pulmao_e: '#ff9fb0', pulmao_d: '#ff9fb0', timo: '#7ff0a8',
  coracao: '#e2263c', circulacao: '#d81b33', vago: '#ffe27a',
  estomago: '#f6b26b', figado: '#8c2d2d', vesicula: '#3fa34d', pancreas: '#ffd966', baco: '#8e3a6b',
  intestinos: '#f2a6a0', rim_e: '#a63d40', rim_d: '#a63d40', suprarrenais: '#ffcf33', bexiga: '#f5d76e',
  gonadas: '#ff9a3d', reprodutor: '#ff7f6e', coluna: '#efe9dc', medula: '#fff4a8',
};

export function buildOrgans() {
  const group = new THREE.Group();
  const meshes = {};
  for (const id of Object.keys(BUILDERS)) {
    const mat = organMat(ORGAN_COLORS[id]);
    const obj = BUILDERS[id](mat);
    obj.userData = { kind: 'organ', id, mat, base: new THREE.Color(ORGAN_COLORS[id]) };
    obj.traverse(o => { o.userData.pickId = id; o.userData.pickKind = 'organ'; });
    group.add(obj);
    meshes[id] = obj;
  }
  group.updateMatrixWorld(true);
  const centers = {};
  for (const [id, obj] of Object.entries(meshes)) {
    centers[id] = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
  }
  // Âncoras mais significativas para órgãos extensos
  centers.coluna = V(0, 0.9, -0.09);
  centers.medula = V(0, 1.15, -0.08);
  centers.circulacao = V(0.0, 1.36, 0.0);
  centers.vago = V(0.03, 1.38, 0.01);
  centers.intestinos = V(0, 1.0, 0.05);
  return { group, meshes, centers };
}
