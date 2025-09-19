import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createTerrain, applyBrushAt } from "./terrain.js";
/* ...existing code... */

const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(40, 35, 40);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.screenSpacePanning = true;
controls.maxDistance = 250;
controls.minDistance = 10;
controls.minPolarAngle = 0.15;
controls.maxPolarAngle = Math.PI / 2.05;

const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(1, 2, 1);
scene.add(light, new THREE.AmbientLight(0xffffff, 0.45));

const { mesh: terrain, api: terrainAPI } = createTerrain({ size: 200, segments: 128 });
scene.add(terrain);

// dynamic wireframe that matches terrain
let wire, wireMat;
function buildWire() {
  const geo = new THREE.WireframeGeometry(terrain.geometry);
  if (!wireMat) wireMat = new THREE.LineBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.6 });
  if (!wire) { wire = new THREE.LineSegments(geo, wireMat); wire.renderOrder = 1; scene.add(wire); }
  else { wire.geometry.dispose(); wire.geometry = geo; }
}
buildWire();
terrainAPI.onUpdate(buildWire);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let isPointerDown = false;

const state = {
  mode: "navigate", // navigate | raise | lower
  size: 12,
  strength: 0.35
};

// UI wiring
import { initUI } from "./ui.js";
initUI({
  onModeChange: (m) => { state.mode = m; },
  onSizeChange: (v) => { state.size = v; },
  onStrengthChange: (v) => { state.strength = v; },
  onToggleGrid: (show) => {
    if (wire) wire.visible = show;
  }
});

// Interaction
function setPointerFromEvent(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = (("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left) / rect.width;
  const y = (("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top) / rect.height;
  pointer.set(x * 2 - 1, -(y * 2 - 1));
}

function sculptAtPointer() {
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(terrain, false)[0];
  if (!hit) return;
  const dir = state.mode === "lower" ? -1 : 1;
  applyBrushAt(terrainAPI, hit.point, state.size, state.strength * dir);
}

function onPointerDown(e) {
  if (state.mode === "navigate") return;
  isPointerDown = true;
  controls.enabled = false;
  setPointerFromEvent(e);
  sculptAtPointer();
}

function onPointerMove(e) {
  if (state.mode !== "navigate" && isPointerDown) {
    setPointerFromEvent(e);
    sculptAtPointer();
  }
}

function onPointerUp() {
  isPointerDown = false;
  controls.enabled = true;
}

renderer.domElement.addEventListener("pointerdown", onPointerDown, { passive: true });
renderer.domElement.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("pointerup", onPointerUp);

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// animate
renderer.setAnimationLoop(() => {
  controls.enabled = state.mode === "navigate" ? true : controls.enabled;
  controls.update();
  renderer.render(scene, camera);
});
/* ...existing code... */