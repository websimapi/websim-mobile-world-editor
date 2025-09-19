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
  /* inject shader to mix texture by mask and tint by vertex color */
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTex = { value: null };
    shader.uniforms.uUseTex = { value: 0 };
    shader.uniforms.uTiling = { value: 4.0 };
    shader.vertexShader = shader.vertexShader
      .replace('varying vec3 vViewPosition;', 'varying vec3 vViewPosition;\nvarying float vMask;\nattribute float mask;')
      .replace('#include <color_vertex>', '#include <color_vertex>\n vMask = mask;');
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      '#include <color_fragment>\nuniform sampler2D uTex; uniform float uUseTex; uniform float uTiling;\nvec3 texRGB = texture2D(uTex, vUv * uTiling).rgb;\ndiffuseColor.rgb = mix(diffuseColor.rgb, texRGB * diffuseColor.rgb, vMask * uUseTex);'
    );
    mat.userData.shader = shader;
  };

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = false;
  mesh.castShadow = false;

  // Height field
  const verts = geo.attributes.position;
  const vcount = verts.count;
  // add color attribute (default grey)
  const colors = new Float32Array(vcount * 3);
  for (let i = 0; i < vcount; i++) { colors[i * 3 + 0] = 0.87; colors[i * 3 + 1] = 0.87; colors[i * 3 + 2] = 0.87; }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  /* add per-vertex mask for texture blending */
  const mask = new Float32Array(vcount);
  geo.setAttribute('mask', new THREE.BufferAttribute(mask, 1));
  mat.vertexColors = true;
  // mat.onBeforeCompile = () => {}; // removed to preserve shader uniforms

  const widthVerts = segments + 1;
  const height = new Float32Array(vcount); // y only
  const listeners = [];

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

  function applyPaint(center, radius, color, strength) {
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
        const t = 1 - dist2 / r2;
        const falloff = t * t * (3 - 2 * t);
        // lerp existing color toward target color by strength*falloff
        const ci = idx * 3;
        colors[ci + 0] = colors[ci + 0] + (color.r - colors[ci + 0]) * (strength * falloff);
        colors[ci + 1] = colors[ci + 1] + (color.g - colors[ci + 1]) * (strength * falloff);
        colors[ci + 2] = colors[ci + 2] + (color.b - colors[ci + 2]) * (strength * falloff);
        mask[idx] = Math.min(1, mask[idx] + strength * falloff); // grow texture mask
      }
    }
  }

  function sync() {
    for (let idx = 0; idx < vcount; idx++) {
      verts.setY(idx, height[idx]);
    }
    verts.needsUpdate = true;
    geo.computeVertexNormals();
    listeners.forEach(fn => fn());
  }

  return {
    mesh,
    api: {
      mesh,           // expose mesh so external helpers (applyPaintAt) can update attributes
      segments,
      size,
      widthVerts,
      halfSize,
      height,
      worldToGrid,
      applyBrush,
      applyPaint,
      sync,
      onUpdate: (fn) => { if (typeof fn === "function") listeners.push(fn); },
      setTexture(tex, tiling = 4) {
        const sh = mat.userData.shader;
        if (!sh) return;
        sh.uniforms.uTex.value = tex || null;
        sh.uniforms.uUseTex.value = tex ? 1 : 0;
        sh.uniforms.uTiling.value = tiling;
        mat.needsUpdate = true;
        geo.attributes.mask.needsUpdate = true;
      }
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

export function applyPaintAt(api, worldPoint, brushSize, strength, color) {
  const { worldToGrid, applyPaint, sync, segments } = api;
  const { i, j } = worldToGrid(worldPoint.x, worldPoint.z);
  const radius = Math.max(1, Math.min(brushSize | 0, segments));
  applyPaint({ i, j }, radius, color, strength * 0.6);
  api.mesh.geometry.attributes.color.needsUpdate = true;
  api.mesh.geometry.attributes.mask.needsUpdate = true; // ensure texture mask updates
  sync();
}
/* ...existing code... */