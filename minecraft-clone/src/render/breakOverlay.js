import * as THREE from "three";

// Generates 10 progressive crack textures (stages 0-9) on a single atlas,
// provides a single textured cube overlay mesh that gets positioned at the
// currently-mining block and shows the appropriate crack stage via UV offset.

function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build the crack atlas — 10 16x16 tiles horizontally = 160x16 texture
function buildCrackAtlas() {
  const tileSize = 16;
  const stages = 10;
  const canvas = document.createElement("canvas");
  canvas.width = tileSize * stages;
  canvas.height = tileSize;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  // Transparent base
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pre-generate crack patterns — each stage includes the cracks from the previous one
  const crackPixels = []; // array of {x, y, dark}
  const rng = mulberry32(13371337);

  // Stage 1 — a few initial cracks (short lines radiating from center)
  const cracks = [
    // Center seed cracks
    { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 7, y: 8 }, { x: 8, y: 8 },
    { x: 6, y: 6 }, { x: 9, y: 9 }, { x: 6, y: 9 }, { x: 9, y: 6 },
    { x: 5, y: 7 }, { x: 10, y: 8 },
  ];
  for (const c of cracks) crackPixels.push({ ...c, stage: 1 });

  // Add progressively more crack pixels per stage, spreading outward
  for (let stage = 2; stage <= 9; stage++) {
    const count = 4 + stage * 2;
    for (let i = 0; i < count; i++) {
      // Sprinkle a new crack pixel with bias toward existing ones (to form crack paths)
      let x, y;
      if (crackPixels.length > 0 && rng() < 0.7) {
        const seed = crackPixels[Math.floor(rng() * crackPixels.length)];
        x = seed.x + (Math.floor(rng() * 3) - 1);
        y = seed.y + (Math.floor(rng() * 3) - 1);
      } else {
        x = Math.floor(rng() * 16);
        y = Math.floor(rng() * 16);
      }
      x = Math.max(0, Math.min(15, x));
      y = Math.max(0, Math.min(15, y));
      crackPixels.push({ x, y, stage });
    }
  }

  // Render each stage tile (stage 0 = no cracks)
  for (let stage = 0; stage < stages; stage++) {
    const offsetX = stage * tileSize;
    if (stage === 0) continue;
    // Draw all pixels for stages <= current — fully opaque black cracks
    for (const p of crackPixels) {
      if (p.stage <= stage) {
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fillRect(offsetX + p.x, p.y, 1, 1);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return { texture, tileSize, stages };
}

export class BreakOverlay {
  constructor(scene) {
    this.scene = scene;
    this.atlas = buildCrackAtlas();
    this.stage = 0;
    this.visible = false;

    // Build a cube slightly larger than 1 (to avoid z-fighting)
    const size = 1.02;
    const geo = new THREE.BoxGeometry(size, size, size);
    this.geometry = geo;
    // Cache original UVs — setStage computes from the originals each time
    const uvAttr = geo.getAttribute("uv");
    this.origU = new Float32Array(uvAttr.count);
    for (let i = 0; i < uvAttr.count; i++) this.origU[i] = uvAttr.getX(i);

    const material = new THREE.MeshBasicMaterial({
      map: this.atlas.texture,
      transparent: true,
      depthWrite: false,
      opacity: 1.0,
    });
    material.polygonOffset = true;
    material.polygonOffsetFactor = -1;
    material.polygonOffsetUnits = -1;
    this.material = material;

    this.mesh = new THREE.Mesh(geo, material);
    this.mesh.visible = false;
    this.mesh.renderOrder = 1;
    this.scene.add(this.mesh);

    this.setStage(0);
  }

  setStage(stage) {
    stage = Math.max(0, Math.min(this.atlas.stages - 1, Math.floor(stage)));
    this.stage = stage;
    const stages = this.atlas.stages;
    const u0 = stage / stages;
    const u1 = (stage + 1) / stages;
    const uvAttr = this.geometry.getAttribute("uv");
    const n = uvAttr.count;
    for (let i = 0; i < n; i++) {
      const oldU = this.origU[i];
      const newU = u0 + oldU * (u1 - u0);
      uvAttr.setX(i, newU);
    }
    uvAttr.needsUpdate = true;
  }

  update(targetPos, progressNormalized) {
    if (!targetPos || progressNormalized <= 0) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;
    this.mesh.position.set(targetPos.x + 0.5, targetPos.y + 0.5, targetPos.z + 0.5);
    // Map 0..1 → stage 0..9
    const stage = Math.min(9, Math.floor(progressNormalized * 10));
    if (stage !== this.stage) this.setStage(stage);
  }

  hide() {
    this.mesh.visible = false;
  }
}
