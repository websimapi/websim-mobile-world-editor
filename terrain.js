import * as THREE from "three";
/* ...existing code... */

export function createTerrain({ size = 200, segments = 128 } = {}) {
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.MeshStandardMaterial({
    color: 0xdedede,
    roughness: 0.95,
    metalness: 0.0,
    flatShading: false,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = false;
  mesh.castShadow = false;

  // Height field
  const verts = geo.attributes.position;
  const vcount = verts.count;
  const widthVerts = segments + 1;
  const height = new Float32Array(vcount); // y only

  // API helpers
  const halfSize = size / 2;
  function worldToGrid(x, z) {
    const u = (x + halfSize) / size;
    const v = (z + halfSize) / size;
    return { i: Math.floor(u * segments), j: Math.floor(v * segments) };
  }

  function applyBrush(center, radius, delta) {
    // Falloff: smoothstep
    const r2 = radius * radius;
    for (let j = -radius; j <= radius; j++) {
      for (let i = -radius; i <= radius; i++) {
        const gx = center.i + i;
        const gz = center.j + j;
        if (gx < 0 || gz < 0 || gx > segments || gz > segments) continue;
        const dx = i;
        const dz = j;
        const dist2 = dx * dx + dz * dz;
        if (dist2 > r2) continue;
        const idx = gz * widthVerts + gx;
        const t = 1 - dist2 / r2;           // 0..1
        const falloff = t * t * (3 - 2 * t); // smoothstep
        height[idx] += delta * falloff;
      }
    }
  }

  function sync() {
    for (let idx = 0; idx < vcount; idx++) {
      verts.setY(idx, height[idx]);
    }
    verts.needsUpdate = true;
    geo.computeVertexNormals();
  }

  return {
    mesh,
    api: {
      segments,
      size,
      widthVerts,
      halfSize,
      height,
      worldToGrid,
      applyBrush,
      sync
    }
  };
}

export function applyBrushAt(api, worldPoint, brushSize, strength) {
  const { worldToGrid, applyBrush, sync, segments } = api;
  // Map world to grid
  const { i, j } = worldToGrid(worldPoint.x, worldPoint.z);
  // Brush size in grid units (clamp)
  const radius = Math.max(1, Math.min(brushSize | 0, segments));
  // Apply scaled delta
  applyBrush({ i, j }, radius, strength * 0.25); // mild multiplier for stability
  sync();
}
/* ...existing code... */

