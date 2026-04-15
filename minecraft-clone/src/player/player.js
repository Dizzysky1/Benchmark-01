import * as THREE from "three";
import { resolveCollisions, isInWater, EYE_HEIGHT, PLAYER_HEIGHT } from "./physics.js";
import { BlockByName, AIR, isLiquid, BLOCKS, mineInfo, getDrop } from "../world/blocks.js";
import { ITEMS } from "../items/items.js";
import { makeBreakDropGrant } from "../security.js";

const GRAVITY = -28;
const JUMP_VELOCITY = 9;
const WALK_SPEED = 4.3;
const SPRINT_SPEED = 5.8;
const SNEAK_SPEED = 1.3;
const FLY_SPEED = 10;

export class Player {
  #inv;
  #addToInv;

  constructor(camera, world, invFull) {
    this.camera = camera;
    this.world = world;
    this.pos = new THREE.Vector3(0, 90, 0);
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.flying = false;
    this.sneaking = false;
    this.sprinting = false;
    this.health = 20;
    this.hunger = 20;
    this.breakProgress = 0;
    this.breakTargetKey = null;
    this.reach = 5.5;
    this.dropManager = null;
    // Full inventory handle — addItem is only reachable through _inv, which
    // is not exposed. _addToInv wraps the grant so even this module doesn't
    // carry the trust symbol around.
    this.#inv = invFull;
    // Pass the full inventory handle — security.js verifies it was minted by
    // makeInventories before returning a trusted wrapper.
    this.#addToInv = makeBreakDropGrant(invFull);
  }

  setDropManager(m) { this.dropManager = m; }

  currentTool() {
    const sel = this.#inv.getSelected();
    if (!sel) return { tool: null, toolTier: null };
    const item = ITEMS[sel.id];
    if (!item) return { tool: null, toolTier: null };
    return { tool: item.tool, toolTier: item.toolTier };
  }

  update(dt, input) {
    const inventory = this.#inv;
    // Mouse look
    if (input.pointerLocked) {
      const { dx, dy } = input.consumeMouse();
      this.yaw -= dx * 0.0022;
      this.pitch -= dy * 0.0022;
      this.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, this.pitch));
    }

    // Movement vector from yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const wish = new THREE.Vector3();
    if (input.isDown("KeyW")) wish.add(forward);
    if (input.isDown("KeyS")) wish.sub(forward);
    if (input.isDown("KeyD")) wish.add(right);
    if (input.isDown("KeyA")) wish.sub(right);
    this.sprinting = input.isDown("ShiftLeft") || input.isDown("ShiftRight");
    this.sneaking = input.isDown("ControlLeft") || input.isDown("ControlRight");
    if (wish.lengthSq() > 0) wish.normalize();

    // Toggle fly with F
    if (input.isDown("KeyF") && !this._flyPressed) { this.flying = !this.flying; this.vel.y = 0; }
    this._flyPressed = input.isDown("KeyF");

    const inWater = isInWater(this.world, this.pos);

    let speed = this.sneaking ? SNEAK_SPEED : (this.sprinting ? SPRINT_SPEED : WALK_SPEED);
    if (this.flying) speed = FLY_SPEED * (this.sprinting ? 2 : 1);
    if (inWater) speed *= 0.5;

    // Horizontal velocity
    if (this.flying) {
      this.vel.x = wish.x * speed;
      this.vel.z = wish.z * speed;
      if (input.isDown("Space")) this.vel.y = speed;
      else if (input.isDown("ShiftLeft")) this.vel.y = -speed;
      else this.vel.y = 0;
    } else {
      // Smooth-ish acceleration
      const targetVx = wish.x * speed;
      const targetVz = wish.z * speed;
      const accel = this.onGround ? 25 : 6;
      this.vel.x += (targetVx - this.vel.x) * Math.min(1, accel * dt);
      this.vel.z += (targetVz - this.vel.z) * Math.min(1, accel * dt);

      // Gravity
      if (inWater) {
        this.vel.y += GRAVITY * 0.3 * dt;
        if (input.isDown("Space")) this.vel.y = 3.5;
      } else {
        this.vel.y += GRAVITY * dt;
      }

      if (input.isDown("Space") && this.onGround && !inWater) {
        this.vel.y = JUMP_VELOCITY;
        this.onGround = false;
      }
    }

    // Terminal velocity
    if (this.vel.y < -50) this.vel.y = -50;

    const { onGround } = resolveCollisions(this.world, this.pos, this.vel, dt, this.flying);
    this.onGround = onGround;

    // Camera position
    this.camera.position.set(this.pos.x, this.pos.y + EYE_HEIGHT - (this.sneaking ? 0.15 : 0), this.pos.z);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Interactions
    const clicks = input.consumeClicks();
    const leftDown = input.mouse.leftDown;
    const rightClick = clicks.right;
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);

    const hit = this.world.raycast(this.camera.position, dir, this.reach);
    const tool = this.currentTool();

    // Progressive breaking
    this.breakPos = null;
    this.breakNormalized = 0;
    if (leftDown && hit) {
      const key = `${hit.pos.x},${hit.pos.y},${hit.pos.z}`;
      if (this.breakTargetKey !== key) {
        this.breakTargetKey = key;
        this.breakProgress = 0;
      }
      const id = this.world.getBlock(hit.pos.x, hit.pos.y, hit.pos.z);
      const info = mineInfo(id, tool);
      if (info.canMine) {
        const block = BLOCKS[id];
        const breakTime = Math.max(0.1, block.hardness * 1.5 / info.breakSpeedMultiplier);
        this.breakProgress += dt;
        this.breakPos = hit.pos;
        this.breakNormalized = Math.min(1, this.breakProgress / breakTime);
        if (this.breakProgress >= breakTime) {
          this.world.setBlock(hit.pos.x, hit.pos.y, hit.pos.z, AIR);
          if (info.dropsItem) {
            const dropId = getDrop(id);
            if (dropId && this.dropManager) {
              const dropPos = new THREE.Vector3(hit.pos.x + 0.5, hit.pos.y + 0.5, hit.pos.z + 0.5);
              this.dropManager.spawn(dropPos, dropId, 1);
            } else if (dropId) {
              this.#addToInv(dropId, 1);
            }
          }
          this.breakProgress = 0;
          this.breakTargetKey = null;
          this.breakPos = null;
          this.breakNormalized = 0;
        }
      } else {
        this.breakProgress = 0;
      }
    } else {
      this.breakProgress = 0;
      this.breakTargetKey = null;
    }

    if (rightClick && hit) {
      // Place block in "prev" position
      const placePos = hit.prev;
      const selected = inventory.getSelected();
      if (selected && selected.count > 0) {
        const blockId = BlockByName[selected.id];
        if (blockId !== undefined) {
          const px = Math.floor(this.pos.x);
          const pz = Math.floor(this.pos.z);
          const py = Math.floor(this.pos.y);
          const inside =
            placePos.x === px &&
            placePos.z === pz &&
            (placePos.y === py || placePos.y === py + 1);
          if (!inside) {
            this.world.setBlock(placePos.x, placePos.y, placePos.z, blockId);
            inventory.removeFromSlot(inventory.getSelectedIndex(), 1);
          }
        }
      }
      return hit;
    }
    return hit;
  }
}

Object.freeze(Player.prototype);
Object.freeze(Player);
