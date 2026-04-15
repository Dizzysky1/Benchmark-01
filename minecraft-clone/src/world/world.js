import * as THREE from "three";
import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT } from "./chunk.js";
import { Generator } from "./generator.js";
import { AIR, BLOCKS, isSolid, isLiquid } from "./blocks.js";

export class World {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.chunks = new Map(); // key "cx,cz" → Chunk
    this.chunkMeshes = new Map(); // key → { opaque, water }
    this.gen = new Generator(opts.seed ?? 1337);
    this.viewDistance = opts.viewDistance ?? 5;
    this.opaqueMaterial = null;
    this.waterMaterial = null;
    this.uvOf = null;
    this.meshQueue = [];
    this.genQueue = [];
    this.center = { cx: 0, cz: 0 };
  }

  setAtlas(atlas) {
    this.uvOf = atlas.uvOf;
    this.opaqueMaterial = new THREE.MeshLambertMaterial({
      map: atlas.texture,
      vertexColors: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    });
    this.waterMaterial = new THREE.MeshLambertMaterial({
      map: atlas.texture,
      transparent: true,
      opacity: 0.7,
      color: new THREE.Color(0.4, 0.6, 1.0),
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  key(cx, cz) { return `${cx},${cz}`; }

  getChunk(cx, cz) {
    return this.chunks.get(this.key(cx, cz));
  }

  getOrCreateChunk(cx, cz) {
    const k = this.key(cx, cz);
    let c = this.chunks.get(k);
    if (!c) {
      c = new Chunk(cx, cz);
      this.chunks.set(k, c);
    }
    return c;
  }

  generateChunkData(cx, cz) {
    const c = this.getOrCreateChunk(cx, cz);
    if (c.generated) return;
    c.blocks = this.gen.generateChunk(cx, cz);
    c.generated = true;
    c.dirty = true;
  }

  getBlock(wx, wy, wz) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return AIR;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const c = this.getChunk(cx, cz);
    if (!c || !c.generated) return AIR;
    const lx = wx - cx * CHUNK_SIZE;
    const lz = wz - cz * CHUNK_SIZE;
    return c.blocks[Chunk.idx(lx, wy, lz)];
  }

  setBlock(wx, wy, wz, id) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const c = this.getChunk(cx, cz);
    if (!c || !c.generated) return;
    const lx = wx - cx * CHUNK_SIZE;
    const lz = wz - cz * CHUNK_SIZE;
    c.blocks[Chunk.idx(lx, wy, lz)] = id;
    c.dirty = true;
    // Mark neighbors dirty if on edge
    if (lx === 0) this.getChunk(cx - 1, cz)?.markDirty();
    if (lx === CHUNK_SIZE - 1) this.getChunk(cx + 1, cz)?.markDirty();
    if (lz === 0) this.getChunk(cx, cz - 1)?.markDirty();
    if (lz === CHUNK_SIZE - 1) this.getChunk(cx, cz + 1)?.markDirty();
  }

  isSolidAt(wx, wy, wz) {
    const id = this.getBlock(wx, wy, wz);
    return isSolid(id) && !isLiquid(id);
  }

  update(playerPos) {
    const pcx = Math.floor(playerPos.x / CHUNK_SIZE);
    const pcz = Math.floor(playerPos.z / CHUNK_SIZE);
    this.center.cx = pcx;
    this.center.cz = pcz;

    // Collect needed chunks (sorted by distance)
    const needed = [];
    const vd = this.viewDistance;
    for (let dz = -vd; dz <= vd; dz++) {
      for (let dx = -vd; dx <= vd; dx++) {
        const cx = pcx + dx, cz = pcz + dz;
        const d2 = dx*dx + dz*dz;
        if (d2 > vd*vd) continue;
        needed.push({ cx, cz, d2 });
      }
    }
    needed.sort((a, b) => a.d2 - b.d2);

    // Generate & mesh closest few per frame
    let genBudget = 2;
    let meshBudget = 2;
    for (const n of needed) {
      const c = this.getOrCreateChunk(n.cx, n.cz);
      if (!c.generated) {
        if (genBudget <= 0) continue;
        this.generateChunkData(n.cx, n.cz);
        genBudget--;
        continue;
      }
      if (c.dirty && meshBudget > 0) {
        // Only mesh if all 4 neighbors are at least generated (prevents edge popping)
        const okN =
          this.getChunk(n.cx - 1, n.cz)?.generated &&
          this.getChunk(n.cx + 1, n.cz)?.generated &&
          this.getChunk(n.cx, n.cz - 1)?.generated &&
          this.getChunk(n.cx, n.cz + 1)?.generated;
        if (!okN) continue;
        this.rebuildChunkMesh(c);
        meshBudget--;
      }
    }

    // Unload distant chunks
    for (const [k, c] of this.chunks) {
      const dx = c.cx - pcx;
      const dz = c.cz - pcz;
      if (dx*dx + dz*dz > (vd + 2) * (vd + 2)) {
        this.disposeChunkMesh(k);
        this.chunks.delete(k);
      }
    }
  }

  markDirty(cx, cz) { this.getChunk(cx, cz)?.markDirty?.(); }

  rebuildChunkMesh(chunk) {
    const k = this.key(chunk.cx, chunk.cz);
    this.disposeChunkMesh(k);
    const { opaqueGeom, waterGeom } = chunk.buildMesh(this, this.uvOf);
    const opaqueMesh = new THREE.Mesh(opaqueGeom, this.opaqueMaterial);
    opaqueMesh.position.set(chunk.cx * CHUNK_SIZE, 0, chunk.cz * CHUNK_SIZE);
    opaqueMesh.castShadow = false;
    opaqueMesh.receiveShadow = false;
    this.scene.add(opaqueMesh);

    let waterMesh = null;
    if (waterGeom.index && waterGeom.index.count > 0) {
      waterMesh = new THREE.Mesh(waterGeom, this.waterMaterial);
      waterMesh.position.set(chunk.cx * CHUNK_SIZE, 0, chunk.cz * CHUNK_SIZE);
      this.scene.add(waterMesh);
    }
    this.chunkMeshes.set(k, { opaqueMesh, waterMesh });
    chunk.dirty = false;
  }

  disposeChunkMesh(k) {
    const entry = this.chunkMeshes.get(k);
    if (!entry) return;
    if (entry.opaqueMesh) {
      this.scene.remove(entry.opaqueMesh);
      entry.opaqueMesh.geometry.dispose();
    }
    if (entry.waterMesh) {
      this.scene.remove(entry.waterMesh);
      entry.waterMesh.geometry.dispose();
    }
    this.chunkMeshes.delete(k);
  }

  // Raycast for block interaction. Returns { hit, pos, normal, prev } or null.
  raycast(origin, dir, maxDist = 6) {
    // Amanatides & Woo DDA
    let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z);
    const stepX = Math.sign(dir.x) || 1;
    const stepY = Math.sign(dir.y) || 1;
    const stepZ = Math.sign(dir.z) || 1;
    const tDeltaX = Math.abs(1 / (dir.x || 1e-8));
    const tDeltaY = Math.abs(1 / (dir.y || 1e-8));
    const tDeltaZ = Math.abs(1 / (dir.z || 1e-8));
    let tMaxX = ((stepX > 0 ? (x + 1 - origin.x) : (origin.x - x)) / Math.abs(dir.x || 1e-8));
    let tMaxY = ((stepY > 0 ? (y + 1 - origin.y) : (origin.y - y)) / Math.abs(dir.y || 1e-8));
    let tMaxZ = ((stepZ > 0 ? (z + 1 - origin.z) : (origin.z - z)) / Math.abs(dir.z || 1e-8));

    let px = x, py = y, pz = z;
    let normal = [0,0,0];
    let t = 0;
    for (let i = 0; i < 64; i++) {
      const id = this.getBlock(x, y, z);
      if (id !== AIR && !isLiquid(id)) {
        return {
          hit: true,
          pos: { x, y, z },
          prev: { x: px, y: py, z: pz },
          normal,
          blockId: id,
        };
      }
      px = x; py = y; pz = z;
      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          if (tMaxX > maxDist) return null;
          x += stepX; t = tMaxX; tMaxX += tDeltaX; normal = [-stepX, 0, 0];
        } else {
          if (tMaxZ > maxDist) return null;
          z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; normal = [0, 0, -stepZ];
        }
      } else {
        if (tMaxY < tMaxZ) {
          if (tMaxY > maxDist) return null;
          y += stepY; t = tMaxY; tMaxY += tDeltaY; normal = [0, -stepY, 0];
        } else {
          if (tMaxZ > maxDist) return null;
          z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; normal = [0, 0, -stepZ];
        }
      }
    }
    return null;
  }
}

// Patch Chunk prototype for markDirty helper
Chunk.prototype.markDirty = function() { this.dirty = true; };
