import * as THREE from "three";
import { isSolid, isLiquid, BlockByName, BLOCKS } from "../world/blocks.js";
import { ITEMS } from "./items.js";
import { makePickupGrant } from "../security.js";

const GRAVITY = -18;
const PICKUP_RADIUS = 1.6;
const PICKUP_DELAY = 0.5; // seconds after spawn before pickup allowed
const LIFESPAN = 300;     // auto-despawn after 5 minutes
const MERGE_RADIUS = 0.8;

const uvOfAtlas = (name, atlas) => atlas.uvOf(name);

// Faces of a small 0.25-size cube, used for block drops
const MINI_FACES = [
  { dir: [ 1, 0, 0], corners: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]], normal: [1,0,0] },
  { dir: [-1, 0, 0], corners: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]], normal: [-1,0,0] },
  { dir: [ 0, 1, 0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], normal: [0,1,0] },
  { dir: [ 0,-1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], normal: [0,-1,0] },
  { dir: [ 0, 0, 1], corners: [[1,0,1],[0,0,1],[0,1,1],[1,1,1]], normal: [0,0,1] },
  { dir: [ 0, 0,-1], corners: [[0,0,0],[1,0,0],[1,1,0],[0,1,0]], normal: [0,0,-1] },
];

export class DroppedItem {
  constructor(world, pos, itemId, count = 1) {
    this.world = world;
    this.pos = pos.clone();
    this.vel = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      3 + Math.random() * 1.5,
      (Math.random() - 0.5) * 2
    );
    this.itemId = itemId;
    this.count = count;
    this.age = 0;
    this.rotY = Math.random() * Math.PI * 2;
    this.mesh = null;
    this.dead = false;
  }

  createMesh(atlas, itemIconRect, itemAtlasTexture) {
    const item = ITEMS[this.itemId];
    if (item && item.isBlock) {
      // Build a tiny textured cube from the block atlas
      const blockId = BlockByName[this.itemId];
      const block = BLOCKS[blockId];
      if (!block) return this.fallbackMesh();
      const positions = [], normals = [], uvs = [], indices = [];
      let i = 0;
      for (const face of MINI_FACES) {
        let texName;
        if (block.faces.all) texName = block.faces.all;
        else if (face.dir[1] === 1) texName = block.faces.top || block.faces.side || block.name;
        else if (face.dir[1] === -1) texName = block.faces.bottom || block.faces.side || block.name;
        else texName = block.faces.side || block.faces.all || block.name;
        const uv = uvOfAtlas(texName, atlas);
        for (let k = 0; k < 4; k++) {
          const c = face.corners[k];
          positions.push((c[0] - 0.5) * 0.3, (c[1] - 0.5) * 0.3, (c[2] - 0.5) * 0.3);
          normals.push(...face.normal);
        }
        uvs.push(uv.u0, uv.v0, uv.u1, uv.v0, uv.u1, uv.v1, uv.u0, uv.v1);
        indices.push(i, i + 1, i + 2, i, i + 2, i + 3);
        i += 4;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      const mat = new THREE.MeshBasicMaterial({
        map: atlas.texture,
        transparent: true,
        alphaTest: 0.5,
      });
      this.mesh = new THREE.Mesh(geo, mat);
      return this.mesh;
    }
    // Non-block item: render as a small flat sprite using itemAtlasTexture if provided
    if (itemIconRect && itemAtlasTexture) {
      const rect = itemIconRect(this.itemId);
      if (rect) {
        const geo = new THREE.PlaneGeometry(0.3, 0.3);
        const atlasW = itemAtlasTexture.image.width;
        const atlasH = itemAtlasTexture.image.height;
        const u0 = rect.x / atlasW;
        const u1 = (rect.x + rect.w) / atlasW;
        const v0 = 1 - (rect.y + rect.h) / atlasH;
        const v1 = 1 - rect.y / atlasH;
        const uvAttr = geo.getAttribute("uv");
        uvAttr.setXY(0, u0, v1);
        uvAttr.setXY(1, u1, v1);
        uvAttr.setXY(2, u0, v0);
        uvAttr.setXY(3, u1, v0);
        uvAttr.needsUpdate = true;
        const mat = new THREE.MeshBasicMaterial({
          map: itemAtlasTexture,
          transparent: true,
          alphaTest: 0.5,
          side: THREE.DoubleSide,
        });
        this.mesh = new THREE.Mesh(geo, mat);
        return this.mesh;
      }
    }
    return this.fallbackMesh();
  }

  fallbackMesh() {
    const geo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    this.mesh = new THREE.Mesh(geo, mat);
    return this.mesh;
  }

  update(dt) {
    this.age += dt;
    if (this.age > LIFESPAN) { this.dead = true; return; }
    this.rotY += dt * 1.2;
    // Simple gravity + ground collision
    this.vel.y += GRAVITY * dt;
    let nx = this.pos.x + this.vel.x * dt;
    let ny = this.pos.y + this.vel.y * dt;
    let nz = this.pos.z + this.vel.z * dt;
    // Check block below
    const belowY = Math.floor(ny - 0.15);
    const below = this.world.getBlock(Math.floor(nx), belowY, Math.floor(nz));
    if (isSolid(below) && !isLiquid(below)) {
      if (ny - 0.15 <= belowY + 1) {
        ny = belowY + 1 + 0.15;
        this.vel.y = 0;
        this.vel.x *= 0.75;
        this.vel.z *= 0.75;
        if (Math.abs(this.vel.x) < 0.05) this.vel.x = 0;
        if (Math.abs(this.vel.z) < 0.05) this.vel.z = 0;
      }
    }
    this.pos.set(nx, ny, nz);
    if (this.mesh) {
      this.mesh.position.copy(this.pos);
      this.mesh.position.y += 0.15 + Math.sin(this.age * 3) * 0.03;
      this.mesh.rotation.y = this.rotY;
    }
  }

  canPickup() { return this.age >= PICKUP_DELAY && !this.dead; }
  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (this.mesh.material.map) this.mesh.material.map = null;
      this.mesh.material.dispose();
    }
  }
}

export class DroppedItemManager {
  #addToInv;

  constructor(scene, world, blockAtlas, itemAtlas, invFull) {
    this.scene = scene;
    this.world = world;
    this.blockAtlas = blockAtlas;
    this.itemAtlas = itemAtlas;   // { texture, iconRect(id) } or null
    this.items = [];
    // Security grants only wrap full handles that were produced by
    // makeInventories, so a cheater can't mint their own authorized wrapper.
    this.#addToInv = makePickupGrant(invFull);
  }

  spawn(worldPos, itemId, count = 1) {
    // Try merge into existing nearby drop of same kind
    for (const d of this.items) {
      if (d.itemId === itemId && !d.dead && d.pos.distanceTo(worldPos) < MERGE_RADIUS) {
        d.count += count;
        return d;
      }
    }
    const drop = new DroppedItem(this.world, worldPos, itemId, count);
    const mesh = drop.createMesh(
      this.blockAtlas,
      this.itemAtlas ? (id) => this.itemAtlas.iconRect(id) : null,
      this.itemAtlas ? this.itemAtlas.texture : null
    );
    if (mesh) {
      mesh.position.copy(drop.pos);
      this.scene.add(mesh);
    }
    this.items.push(drop);
    return drop;
  }

  update(dt, playerPos) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const d = this.items[i];
      d.update(dt);
      if (d.dead) {
        if (d.mesh) this.scene.remove(d.mesh);
        d.dispose();
        this.items.splice(i, 1);
        continue;
      }
      // Pickup check
      if (d.canPickup() && d.pos.distanceTo(playerPos) < PICKUP_RADIUS) {
        if (this.#addToInv(d.itemId, d.count)) {
          if (d.mesh) this.scene.remove(d.mesh);
          d.dispose();
          this.items.splice(i, 1);
        }
      }
    }
  }

  clear() {
    for (const d of this.items) {
      if (d.mesh) this.scene.remove(d.mesh);
      d.dispose();
    }
    this.items = [];
  }
}

Object.freeze(DroppedItemManager.prototype);
Object.freeze(DroppedItemManager);
