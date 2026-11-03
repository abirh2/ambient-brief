/** Original, editable offline model recipe. MIT, Ambient Brief contributors. */
import * as T from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// GLTFExporter needs the browser FileReader API for binary output, no DOM/textures.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((buffer) => { this.result = buffer; this.onloadend?.(); }); }
};
const scene = new T.Scene();
scene.name = 'Atlantic_observatory_island_v1';
const buckets = new Map();
let seed = 2164;
const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
const color = (value) => new T.Color(value);
const materials = {
  meadow: new T.MeshStandardMaterial({ name: 'Sage_meadow', color: '#ffffff', vertexColors: true, roughness: 1 }),
  stone: new T.MeshStandardMaterial({ name: 'Stratified_limestone', color: '#ffffff', vertexColors: true, roughness: 0.92 }),
  pale: new T.MeshStandardMaterial({ name: 'Honed_limestone', color: '#c6c0a8', roughness: 0.86 }),
  edge: new T.MeshStandardMaterial({ name: 'Limestone_cut_edges', color: '#e0d6b9', roughness: 0.8 }),
  bronze: new T.MeshStandardMaterial({ name: 'Weathered_bronze', color: '#59554a', metalness: 0.48, roughness: 0.5 }),
  roof: new T.MeshStandardMaterial({ name: 'Patinated_canopy', color: '#687775', metalness: 0.32, roughness: 0.58 }),
  cedar: new T.MeshStandardMaterial({ name: 'Silvered_cedar', color: '#89765d', roughness: 0.88 }),
  glass: new T.MeshStandardMaterial({ name: 'Slate_glazing', color: '#ffffff', vertexColors: true, metalness: 0.18, roughness: 0.32, emissive: '#54716d', emissiveIntensity: 0.18 }),
  interior: new T.MeshStandardMaterial({ name: 'Warm_interior', color: '#bdab83', roughness: 0.84 }),
  trunk: new T.MeshStandardMaterial({ name: 'Pine_bark', color: '#655d46', roughness: 1 }),
  needles: new T.MeshStandardMaterial({ name: 'Pine_boughs', color: '#ffffff', vertexColors: true, roughness: 1 }),
  shrubs: new T.MeshStandardMaterial({ name: 'Coastal_scrub', color: '#ffffff', vertexColors: true, roughness: 1 }),
  sand: new T.MeshStandardMaterial({ name: 'Shell_sand', color: '#bcb99d', roughness: 1 }),
  foam: new T.MeshBasicMaterial({ name: 'Tide_lines', color: '#c4d7cb', transparent: true, opacity: 0.25, depthWrite: false }),
};
function add(name, geometry, material, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
  geometry.deleteAttribute('uv');
  const matrix = new T.Matrix4().compose(new T.Vector3(...position), new T.Quaternion().setFromEuler(new T.Euler(...rotation)), new T.Vector3(...scale));
  geometry.applyMatrix4(matrix);
  const key = `${name}|${material.name}`;
  if (!buckets.has(key)) buckets.set(key, { name, material, geometries: [] });
  buckets.get(key).geometries.push(geometry);
}
function box(name, size, position, material, rotation = [0, 0, 0]) {
  add(name, new T.BoxGeometry(...size), material, position, [1, 1, 1], rotation);
}
function beam(name, a, b, radius, material, endRadius = radius) {
  const start = new T.Vector3(...a), end = new T.Vector3(...b), delta = end.clone().sub(start);
  const geometry = new T.CylinderGeometry(endRadius, radius, delta.length(), 7);
  geometry.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()));
  add(name, geometry, material, start.add(end).multiplyScalar(0.5).toArray());
}
function mesh(positions, indices, colors) {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  if (colors) geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}
function paint(geometry, base, variation = 0.08) {
  const values = [], positions = geometry.getAttribute('position');
  const tint = color(base);
  for (let i = 0; i < positions.count; i++) {
    const brightness = 1 + Math.sin(positions.getX(i) * 2 + positions.getZ(i) * 3) * variation;
    values.push(tint.r * brightness, tint.g * brightness, tint.b * brightness);
  }
  geometry.setAttribute('color', new T.Float32BufferAttribute(values, 3));
  return geometry;
}
function smooth(geometry) {
  geometry.deleteAttribute('normal');
  geometry.deleteAttribute('uv');
  const indexed = mergeVertices(geometry);
  indexed.computeVertexNormals();
  return indexed;
}
function ovalSlab(name, rx, rz, height, y, material, cx = 0, cz = -8, bevel = 0.12) {
  const shape = new T.Shape();
  shape.absellipse(0, 0, rx, rz, 0, Math.PI * 2, false, 0);
  const geometry = new T.ExtrudeGeometry(shape, { depth: height, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 32 });
  geometry.rotateX(-Math.PI / 2);
  add(name, geometry, material, [cx, y, cz]);
}
function ellipseTube(name, rx, rz, y, radius, material, cx = 0, cz = -8) {
  const points = Array.from({ length: 81 }, (_, i) => new T.Vector3(cx + Math.cos(i / 80 * Math.PI * 2) * rx, y, cz + Math.sin(i / 80 * Math.PI * 2) * rz));
  add(name, new T.TubeGeometry(new T.CatmullRomCurve3(points, true), 80, radius, 5, true), material);
}
function outline(a, scale = 1) {
  const coveAngle = Math.atan2(Math.sin(a - 2.1), Math.cos(a - 2.1));
  const bulge = 1 + 0.075 * Math.sin(3 * a + 1) + 0.045 * Math.sin(7 * a - 1) + 0.018 * Math.sin(13 * a)
    - 0.16 * Math.exp(-((coveAngle / 0.4) ** 2));
  return [Math.cos(a) * 78 * bulge * scale + Math.sin(a) * 8 * scale, Math.sin(a) * 57 * bulge * scale + 4];
}
function ground(x, z) {
  const r = Math.sqrt((x / 80) ** 2 + ((z - 4) / 60) ** 2);
  const ridge = Math.exp(-(((x + 14) / 48) ** 2) - ((z + 33) / 18) ** 2) * 8;
  let y = 22.2 - 17.8 * r ** 2.3 + ridge + Math.sin(x * 0.09 + z * 0.04) * 0.65;
  y += 6 * Math.min(r, 1) ** 6 * (0.5 + 0.5 * Math.cos(Math.atan2(z - 4, x) - 0.7));
  const terrace = Math.sqrt((x / 27) ** 2 + ((z + 8) / 24) ** 2);
  if (terrace < 1.15) y = T.MathUtils.lerp(22.1, y, T.MathUtils.smoothstep(terrace, 0.7, 1.15));
  if (Math.abs(x) < 4.5 && z > 8 && z < 25) y = Math.min(y, 23.1 - (z - 8) * 0.32 - 0.35);
  const beach = Math.exp(-(((x + 43) / 25) ** 2) - ((z - 43) / 18) ** 2);
  return Math.max(1.0, y - beach * 9.5);
}

// Authored asymmetrical contours, broad strata, and a gently undulating meadow.
const sides = 112, rings = 22;
const p = [], idx = [], shades = [];
for (let j = 0; j <= rings; j++) {
  const r = Math.max(0.0001, j / rings);
  for (let i = 0; i < sides; i++) {
    const a = i / sides * Math.PI * 2;
    const [x, z] = outline(a, r);
    const y = ground(x, z);
    p.push(x, y, z);
    const patch = (Math.sin(x * 0.065 + z * 0.07) + Math.cos(z * 0.14 - x * 0.025)) * 0.5;
    const c = color('#839073').lerp(color('#a5a181'), Math.max(0, patch) * 0.62);
    c.multiplyScalar(0.95 + 0.065 * Math.sin(x * 0.9 + z * 0.25));
    if (r > 0.92) c.lerp(color('#aaa894'), T.MathUtils.smoothstep(r, 0.92, 1) * 0.8);
    const beach = Math.exp(-(((x + 43) / 21) ** 2) - ((z - 43) / 15) ** 2);
    c.lerp(color('#c3bea1'), T.MathUtils.smoothstep(beach, 0.45, 0.9));
    shades.push(c.r, c.g, c.b);
    if (j < rings) {
      const a0 = j * sides + i, a1 = j * sides + (i + 1) % sides, b0 = a0 + sides, b1 = a1 + sides;
      idx.push(a0, a1, b1, a0, b1, b0);
    }
  }
}
add('terrain_meadow', mesh(p, idx, shades), materials.meadow);
// Cliff faces follow offset horizontal shelves instead of a floating soil cylinder.
const cliffP = [], cliffI = [], cliffC = [];
const ledges = [1, 1.025, 1.016, 1.048, 1.043, 1.065];
for (let j = 0; j < ledges.length; j++) {
  for (let i = 0; i < sides; i++) {
    const a = i / sides * Math.PI * 2, [x0, z0] = outline(a);
    const [x, z] = outline(a, ledges[j]);
    const height = ground(x0, z0);
    const y = j === 5 ? -2 : height * (1 - j / 5) + (j ? Math.sin(a * 17 + j) * 0.45 : 0);
    cliffP.push(x, y, z);
    const c = color(j % 2 ? '#a6a492' : '#b8b49d').multiplyScalar(0.85 + 0.13 * Math.sin(a * 9 + j * 0.6));
    if (j > 3) c.lerp(color('#556e69'), (j - 3) * 0.22);
    cliffC.push(c.r, c.g, c.b);
    if (j < 5) { const k = j * sides + i, next = j * sides + (i + 1) % sides; cliffI.push(k, next, next + sides, k, next + sides, k + sides); }
  }
}
const cliff = mesh(cliffP, cliffI, cliffC).toNonIndexed();
cliff.computeVertexNormals();
add('terrain_cliff_strata', cliff, materials.stone);
// The submerged limestone shelf and interrupted foam make physical water contact.
for (const [inner, outer, mat, y] of [[1.064, 1.077, materials.foam, 0.05], [1.13, 1.135, materials.foam, 0.04]]) {
  const v = [], tri = [];
  for (let i = 0; i <= sides; i++) {
    const a = i / sides * Math.PI * 2;
    for (const s of [inner, outer + Math.sin(a * 19) * 0.003]) { const [x, z] = outline(a, s); v.push(x, y, z); }
    if (i < sides && (mat !== materials.foam || Math.sin(a * 9) > -0.5)) { const k = i * 2; tri.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  add('coast_tide_shelf', mesh(v, tri), mat);
}

// A limestone plinth with three nested terraces, coping, and wide ceremonial steps.
ovalSlab('observatory_terrace', 23, 18, 1.2, 21.4, materials.pale);
ovalSlab('observatory_terrace', 21.8, 16.8, 0.3, 22.65, materials.edge);
ovalSlab('observatory_terrace', 18.6, 13.3, 0.5, 22.95, materials.pale);
ellipseTube('observatory_coping', 21.7, 16.7, 23.0, 0.13, materials.edge);
for (let i = 0; i < 18; i++) {
  const top = 23.35 - i * 0.28;
  box('observatory_approach_steps', [6.8 + i * 0.07, 0.48, 0.9], [0, top - 0.24, 7 + i * 0.82], i % 3 === 0 ? materials.edge : materials.pale);
}
// Curving path from the beach to the lower stair; secondary ridge walk stays empty.
function path(points, width = 2.2) {
  const curve = new T.CatmullRomCurve3(points.map(([x, z]) => new T.Vector3(x, 0, z)));
  const v = [], tri = [];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100, c = curve.getPoint(t), tangent = curve.getTangent(t);
    const perp = new T.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width / 2);
    for (const side of [-1, 1]) { const x = c.x + perp.x * side, z = c.z + perp.z * side; v.push(x, ground(x, z) + 0.12, z); }
    if (i < 100) { const k = i * 2; tri.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  add('island_limestone_walk', mesh(v, tri), materials.pale);
}
path([[0, 23], [-3, 30], [-16, 32], [-28, 36], [-34, 39], [-40, 40]], 3.3);
path([[-20, -10], [-31, -15], [-44, -12], [-56, -17], [-65, -13]], 2.1);
path([[20, -12], [31, -20], [44, -23], [57, -19], [65, -16]], 2.1);

// Oval hall: faceted glazing is deliberately opaque with baked interior/reflection colors.
ovalSlab('observatory_floor', 14.9, 9.8, 0.3, 23.5, materials.interior);
const paneCount = 44;
for (let i = 0; i < paneCount; i++) {
  const a = i / paneCount * Math.PI * 2, b = (i + 1) / paneCount * Math.PI * 2;
  const ax = Math.cos(a) * 14.6, az = -8 + Math.sin(a) * 9.6;
  const bx = Math.cos(b) * 14.6, bz = -8 + Math.sin(b) * 9.6;
  const low = color('#64847e').lerp(color('#b0a07c'), Math.max(0, Math.sin(a)) * 0.3);
  const high = color('#a0bcba').lerp(color('#c8d4c7'), Math.max(0, -Math.cos(a)) * 0.32);
  add('observatory_glazing', mesh([ax, 23.9, az, bx, 23.9, bz, bx, 29.9, bz, ax, 29.9, az], [0, 2, 1, 0, 3, 2], [...low.toArray(), ...low.toArray(), ...high.toArray(), ...high.toArray()]), materials.glass);
  beam('observatory_mullions', [ax, 23.8, az], [ax, 30, az], 0.085, materials.bronze);
}
ellipseTube('observatory_mullions', 14.7, 9.7, 24.0, 0.12, materials.bronze);
ellipseTube('observatory_mullions', 14.7, 9.7, 28.2, 0.08, materials.bronze);
// Thin extended canopy, raised oval clerestory, standing seams and bronze edge.
ovalSlab('observatory_canopy', 18.0, 12.2, 0.28, 30.0, materials.bronze, 0, -8, 0.17);
ovalSlab('observatory_canopy', 17.8, 12.0, 0.12, 30.35, materials.roof, 0, -8, 0.08);
ovalSlab('observatory_clerestory', 8.8, 5.4, 0.16, 30.6, materials.bronze);
const lensP = [], lensI = [], lensC = [];
for (let j = 0; j <= 7; j++) {
  const radius = Math.max(0.001, j / 7);
  for (let i = 0; i < 48; i++) {
    const angle = i / 48 * Math.PI * 2;
    lensP.push(Math.cos(angle) * 8.45 * radius, 30.8 + 1.0 * Math.sqrt(1 - radius * radius), -8 + Math.sin(angle) * 5.05 * radius);
    const c = color('#8daaaa').lerp(color('#577a76'), radius * 0.55);
    lensC.push(c.r, c.g, c.b);
    if (j < 7) { const a = j * 48 + i, b = j * 48 + (i + 1) % 48; lensI.push(a, b, b + 48, a, b + 48, a + 48); }
  }
}
add('observatory_skylight', mesh(lensP, lensI, lensC), materials.glass);
ellipseTube('observatory_clerestory', 8.5, 5.1, 30.82, 0.09, materials.bronze);
for (let i = -13; i <= 13; i += 2.2) {
  const depth = 12.0 * Math.sqrt(1 - (i / 17.8) ** 2);
  box('observatory_roof_seams', [0.055, 0.06, depth * 2], [i, 30.53, -8], materials.bronze);
}
// South portal, louvered cedar enclosure, terrace benches and discreet railings.
box('observatory_door', [3.2, 5, 0.18], [0, 26.2, 1.65], materials.bronze);
box('observatory_door', [2.65, 4.5, 0.2], [0, 26.15, 1.77], materials.interior);
box('observatory_door', [0.08, 4.5, 0.24], [0, 26.15, 1.9], materials.bronze);
for (let i = 0; i < 19; i++) box('observatory_cedar_louvres', [0.18, 5.6, 0.3], [-13.7 + i * 0.39, 26.6, -1], materials.cedar);
for (const x of [-14, 14]) {
  box('observatory_benches', [4.2, 0.24, 0.85], [x, 24.1, 3.8], materials.cedar);
  for (const dx of [-1.4, 1.4]) box('observatory_benches', [0.2, 0.9, 0.6], [x + dx, 23.55, 3.8], materials.bronze);
}
for (let i = 0; i < 20; i++) {
  const a = Math.PI * 1.05 + i / 19 * Math.PI * 0.9;
  const x = Math.cos(a) * 21.5, z = -8 + Math.sin(a) * 16.5;
  beam('observatory_rail', [x, 23.0, z], [x, 24.0, z], 0.055, materials.bronze);
}
// A compact, nonnumeric instrument rack earns the building's purpose.
beam('observatory_instruments', [10, 30.5, -11], [10, 34.3, -11], 0.09, materials.bronze);
beam('observatory_instruments', [8.2, 33.6, -11], [11.8, 33.6, -11], 0.065, materials.bronze);
for (const x of [8.2, 11.8]) add('observatory_instruments', new T.SphereGeometry(0.28, 8, 5), materials.edge, [x, 33.7, -11], [1, 0.55, 1]);
box('observatory_instruments', [0.85, 0.5, 0.85], [-6, 30.9, -12], materials.edge);
for (let i = 0; i < 5; i++) box('observatory_instruments', [1.0, 0.08, 1.0], [-6, 30.72 + i * 0.19, -12], materials.pale);

// Three wind-shaped pine families, grouped by authored groves rather than scattered.
function pine(x, z, height, family) {
  const y = ground(x, z), lean = 0.10 + family * 0.03;
  const nodes = [[x, y, z], [x + height * lean * 0.3, y + height * 0.5, z - height * 0.03], [x + height * lean, y + height * 0.92, z - height * 0.08]];
  beam('pine_trunks', nodes[0], nodes[1], height * 0.032, materials.trunk, height * 0.023);
  beam('pine_trunks', nodes[1], nodes[2], height * 0.023, materials.trunk, 0.04);
  const layers = family === 1 ? 4 : 3;
  for (let j = 0; j < layers; j++) {
    const t = (family === 1 ? 0.48 : 0.65) + j / layers * (family === 1 ? 0.44 : 0.29);
    const spread = height * (family === 1 ? 0.3 - j * 0.05 : 0.32 - j * 0.06);
    const count = j === layers - 1 ? 2 : 3;
    for (let k = 0; k < count; k++) {
      const angle = k / count * Math.PI * 2 + j * 1.6 + family;
      const px = x + height * lean * t + Math.cos(angle) * spread * 0.55;
      const pz = z - height * 0.08 * t + Math.sin(angle) * spread * 0.45;
      const py = y + height * t + Math.sin(angle) * 0.3;
      if (j < 3) beam('pine_branches', [x + height * lean * t, py - 0.5, z], [px, py, pz], 0.09, materials.trunk, 0.035);
      const geo = smooth(new T.IcosahedronGeometry(1, 1));
      const pos = geo.getAttribute('position');
      for (let v = 0; v < pos.count; v++) { const s = 1 + Math.sin(pos.getX(v) * 9 + pos.getZ(v) * 7) * 0.08; pos.setXYZ(v, pos.getX(v) * s, pos.getY(v) * s, pos.getZ(v) * s); }
      geo.computeVertexNormals();
      paint(geo, ['#456456', '#3b594c', '#57705c'][family], 0.06);
      add('pine_boughs', geo, materials.needles, [px, py, pz], [spread * 0.94, height * 0.055, spread * 0.7], [0.06, angle, -0.08]);
    }
  }
}
const groves = [
  [-39, -28, 12, 0], [-47, -24, 10, 1], [-34, -34, 11, 2], [-46, -34, 13, 0], [-54, -28, 8, 2],
  [20, -35, 12, 1], [28, -37, 10, 2], [34, -32, 11, 0], [25, -28, 9, 1], [42, -29, 8, 2],
  [-45, 9, 11, 0], [-53, 15, 9, 2], [-49, 2, 10, 1], [-59, 7, 7, 2],
  [39, 10, 9, 1], [48, 13, 8, 0], [44, 4, 10, 2], [52, 4, 7, 1],
  [-15, -43, 8, 2], [-23, -42, 10, 1], [2, -42, 9, 0],
];
for (const grove of groves) pine(...grove);

function rock(x, z, size, y = ground(x, z), wet = false) {
  const geo = new T.IcosahedronGeometry(1, 1), pos = geo.getAttribute('position');
  for (let v = 0; v < pos.count; v++) {
    const px = pos.getX(v), py = pos.getY(v), pz = pos.getZ(v);
    const s = 1 + 0.15 * Math.sin(px * 6 + pz * 4);
    pos.setXYZ(v, px * s, Math.max(-0.45, py * (0.8 + 0.18 * Math.cos(px * 4))), pz * s);
  }
  geo.computeVertexNormals();
  paint(geo, wet ? '#667d75' : '#b3af98', 0.13);
  add('coastal_rock_clusters', geo, materials.stone, [x, y, z], [size * 1.4, size, size * 0.9], [0.07, random() * 5, 0.1]);
}
for (const [x, z, size] of [[-62, 25, 4], [-64, 19, 2.7], [-58, 28, 2], [61, 17, 4], [65, 13, 3.4], [57, 23, 2.2], [12, -42, 3], [17, -43, 2], [-26, -37, 2.5], [-33, 15, 2], [-37, 17, 1.4], [30, 32, 2], [34, 29, 1.7]]) rock(x, z, size);
for (const [x, z, size] of [[-70, 37, 3.2], [-65, 43, 2.5], [-72, 42, 1.5], [70, 36, 3], [77, 28, 4], [81, 32, 2], [44, 52, 2.7], [46, 56, 1.5], [-31, 64, 2]]) rock(x, z, size, -0.1, true);
for (const angle of [0.12, 0.4, 0.8, 1.05, 1.45, 1.8, 2.2, 2.55, 2.9, 3.5, 4.1, 4.5, 5.5, 5.9]) {
  const [x, z] = outline(angle, 1.01);
  rock(x, z, 3.2 + Math.sin(angle * 8) * 0.8, ground(x, z) * 0.38);
  const [x2, z2] = outline(angle + 0.05, 1.03);
  rock(x2, z2, 1.8, 0.5, true);
}
// Low scrub and dune grass follow the same groves, with intentional open areas.
for (const [cx, cz] of [[-36, 1], [-55, 22], [32, 14], [52, -9], [-17, 38], [25, 37], [-65, -8], [12, -38]]) {
  for (let i = 0; i < 5; i++) {
    const x = cx + (random() - 0.5) * 6, z = cz + (random() - 0.5) * 4;
    const geo = paint(smooth(new T.IcosahedronGeometry(1, 1)), i % 2 ? '#6b7d61' : '#8d9471');
    add('coastal_scrub', geo, materials.shrubs, [x, ground(x, z) + 0.45, z], [1.3 + random(), 0.7 + random() * 0.3, 1.1]);
  }
  for (let i = 0; i < 8; i++) {
    const x = cx + (random() - 0.5) * 10, z = cz + (random() - 0.5) * 6, y = ground(x, z);
    for (let b = 0; b < 3; b++) {
      const geometry = mesh([0, 0, 0, 0.16, 0, 0.03, 0.28 + b * 0.11, 0.7 + random() * 0.5, 0.05], [0, 1, 2]);
      paint(geometry, '#a7a483');
      add('dune_grass', geometry, materials.shrubs, [x, y, z], [1, 1, 1], [0, b * 2.1, 0]);
    }
  }
}

// Merge within semantic roots/materials for bounded draw calls; no runtime mesh generation.
let triangles = 0, bytes = 0;
const inventory = [];
for (const { name, material, geometries } of buckets.values()) {
  // MergeGeometry requires matching index state; retain indices for compact runtime payload.
  const indexed = geometries.map((g) => {
    if (!g.index) g.setIndex(Array.from({ length: g.getAttribute('position').count }, (_, i) => i));
    return g;
  });
  const geometry = mergeGeometries(indexed);
  if (!geometry) throw new Error('Failed to merge ' + name);
  const count = geometry.index.count / 3;
  triangles += count;
  bytes += Object.values(geometry.attributes).reduce((sum, a) => sum + a.array.byteLength, 0) + geometry.index.array.byteLength;
  const item = new T.Mesh(geometry, material);
  item.name = name + '_' + material.name;
  item.castShadow = !['coast_tide_shelf', 'terrain_meadow', 'terrain_cliff_strata', 'dune_grass'].includes(name);
  item.receiveShadow = true;
  scene.add(item);
  inventory.push({ name: item.name, triangles: count });
}
const exporter = new GLTFExporter();
const binary = await exporter.parseAsync(scene, { binary: true, onlyVisible: true });
const hash = createHash('sha256').update(Buffer.from(binary)).digest('hex');
const asset = `world/v1/atlantic-observatory-${hash.slice(0, 12)}.glb`;
const pathOut = `public/${asset}`;
writeFileSync(pathOut, Buffer.from(binary));
writeFileSync('src/features/living-world/assets.ts', `// Generated by scripts/world/author-island.mjs.\nexport const ISLAND_MODEL = '${asset}';\n`);
const report = { version: 1, seed: 2164, source: 'scripts/world/author-island.mjs', sourceSha256: createHash('sha256').update(readFileSync('scripts/world/author-island.mjs')).digest('hex'), file: pathOut, sha256: hash, bytes: binary.byteLength, triangles, geometryBytes: bytes, meshes: inventory.length, textures: 0, inventory };
writeFileSync('docs/world-assets/island-inventory.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ file: pathOut, bytes: binary.byteLength, triangles, meshes: inventory.length, geometryBytes: bytes, sha256: hash }));
