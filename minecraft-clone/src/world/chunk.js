import * as THREE from "three";
import { BLOCKS, AIR, BlockFlags, isSolid, isTransparent, isCross, isLiquid, getBlock } from "./blocks.js";

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128;

// Face definitions: [dx, dy, dz, normalAxis, normalSign, faceKey]
// Order: +x, -x, +y, -y, +z, -z
const FACES = [
  { dir: [ 1, 0, 0], key: "side",   corners: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]], normal: [1,0,0] },
  { dir: [-1, 0, 0], key: "side",   corners: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]], normal: [-1,0,0] },
  { dir: [ 0, 1, 0], key: "top",    corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], normal: [0,1,0] },
  { dir: [ 0,-1, 0], key: "bottom", corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], normal: [0,-1,0] },
  { dir: [ 0, 0, 1], key: "side",   corners: [[1,0,1],[0,0,1],[0,1,1],[1,1,1]], normal: [0,0,1] },
  { dir: [ 0, 0,-1], key: "side",   corners: [[0,0,0],[1,0,0],[1,1,0],[0,1,0]], normal: [0,0,-1] },
];

const CROSS_QUADS = [
  // Two diagonal quads for X-shaped plants
  { corners: [[0,0,0],[1,0,1],[1,1,1],[0,1,0]] },
  { corners: [[1,0,0],[0,0,1],[0,1,1],[1,1,0]] },
];

export class Chunk {
  constructor(cx, cz) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint16Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    this.dirty = true;
    this.mesh = null;
    this.waterMesh = null;
    this.generated = false;
  }

  static idx(x, y, z) {
    return x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
  }

  getLocal(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT) return AIR;
    return this.blocks[Chunk.idx(x, y, z)];
  }

  setLocal(x, y, z, id) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT) return;
    this.blocks[Chunk.idx(x, y, z)] = id;
    this.dirty = true;
  }

  buildMesh(world, uvOf) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const colors = [];
    const indices = [];

    const wPositions = [];
    const wNormals = [];
    const wUvs = [];
    const wIndices = [];

    let idxCount = 0;
    let wIdxCount = 0;

    const worldX0 = this.cx * CHUNK_SIZE;
    const worldZ0 = this.cz * CHUNK_SIZE;

    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const id = this.blocks[Chunk.idx(x, y, z)];
          if (id === AIR) continue;
          const block = BLOCKS[id];
          if (!block) continue;

          // Cross meshes (flowers, grass)
          if (isCross(id)) {
            const texName = block.faces.all || block.faces.side || block.name;
            const uv = uvOf(texName);
            for (const q of CROSS_QUADS) {
              const base = idxCount;
              for (let i = 0; i < 4; i++) {
                const c = q.corners[i];
                positions.push(x + c[0], y + c[1], z + c[2]);
                normals.push(0, 1, 0);
                colors.push(1, 1, 1);
              }
              uvs.push(uv.u0, uv.v0, uv.u1, uv.v0, uv.u1, uv.v1, uv.u0, uv.v1);
              indices.push(base, base+1, base+2, base, base+2, base+3);
              indices.push(base, base+2, base+1, base, base+3, base+2); // double sided
              idxCount += 4;
            }
            continue;
          }

          const isWater = isLiquid(id);

          for (let f = 0; f < 6; f++) {
            const face = FACES[f];
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];

            let neighborId;
            if (nx >= 0 && nx < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE && ny >= 0 && ny < CHUNK_HEIGHT) {
              neighborId = this.blocks[Chunk.idx(nx, ny, nz)];
            } else {
              neighborId = world.getBlock(worldX0 + nx, ny, worldZ0 + nz);
            }

            if (!shouldRender(id, neighborId)) continue;

            // Determine texture for face
            let texName;
            const fk = face.key;
            if (block.faces.all) {
              texName = block.faces.all;
            } else if (fk === "top") {
              texName = block.faces.top || block.faces.side || block.faces.all || block.name;
            } else if (fk === "bottom") {
              texName = block.faces.bottom || block.faces.side || block.faces.all || block.name;
            } else {
              texName = block.faces.side || block.faces.all || block.name;
            }
            const uv = uvOf(texName);

            // Tint for foliage
            let r=1, g=1, b=1;
            if (block.flags & BlockFlags.FOLIAGE) { r=0.45; g=0.85; b=0.35; }
            if (block.name === "grass_block" && fk === "top") { r=0.5; g=0.9; b=0.4; }

            const targetPos = isWater ? wPositions : positions;
            const targetNorm = isWater ? wNormals : normals;
            const targetUv = isWater ? wUvs : uvs;
            const targetIdx = isWater ? wIndices : indices;

            const base = isWater ? wIdxCount : idxCount;
            for (let i = 0; i < 4; i++) {
              const c = face.corners[i];
              let yy = y + c[1];
              // Lower water top slightly
              if (isWater && fk === "top" && c[1] === 1) yy -= 0.12;
              targetPos.push(x + c[0], yy, z + c[2]);
              targetNorm.push(face.normal[0], face.normal[1], face.normal[2]);
              if (!isWater) colors.push(r, g, b);
            }
            targetUv.push(uv.u0, uv.v0, uv.u1, uv.v0, uv.u1, uv.v1, uv.u0, uv.v1);
            targetIdx.push(base, base+1, base+2, base, base+2, base+3);
            if (isWater) wIdxCount += 4;
            else idxCount += 4;
          }
        }
      }
    }

    const opaqueGeom = new THREE.BufferGeometry();
    opaqueGeom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    opaqueGeom.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    opaqueGeom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    opaqueGeom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    opaqueGeom.setIndex(indices);
    opaqueGeom.computeBoundingSphere();

    const waterGeom = new THREE.BufferGeometry();
    waterGeom.setAttribute("position", new THREE.Float32BufferAttribute(wPositions, 3));
    waterGeom.setAttribute("normal", new THREE.Float32BufferAttribute(wNormals, 3));
    waterGeom.setAttribute("uv", new THREE.Float32BufferAttribute(wUvs, 2));
    waterGeom.setIndex(wIndices);
    waterGeom.computeBoundingSphere();

    return { opaqueGeom, waterGeom };
  }
}

function shouldRender(a, b) {
  if (a === AIR) return false;
  const aBlock = BLOCKS[a];
  const bBlock = BLOCKS[b];
  if (!bBlock) return true;
  if (isCross(a)) return false;
  // Water only renders top against air / non-water above
  if (isLiquid(a)) {
    if (b === a) return false;
    if (isSolid(b) && !isTransparent(b)) return false;
    return true;
  }
  // Same block merging
  if (a === b) return false;
  // Transparent neighbor → render
  if (bBlock.flags & BlockFlags.TRANSPARENT) return true;
  return false;
}
