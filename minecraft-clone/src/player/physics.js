import * as THREE from "three";
import { isSolid, isLiquid } from "../world/blocks.js";

export const PLAYER_WIDTH = 0.6;
export const PLAYER_HEIGHT = 1.8;
export const EYE_HEIGHT = 1.62;

// AABB collision against world voxels.
// Player occupies a box of size (w,h,w) centered on x,z with y being feet.
export function resolveCollisions(world, pos, vel, dt, flying) {
  const w = PLAYER_WIDTH / 2;
  const h = PLAYER_HEIGHT;

  // Apply velocity on each axis separately, resolving collisions per axis.
  const onGroundBefore = vel.y <= 0;

  const moveAxis = (axis, amount) => {
    if (amount === 0) return 0;
    const newPos = { ...pos };
    newPos[axis] += amount;
    const aabb = {
      minX: newPos.x - w, maxX: newPos.x + w,
      minY: newPos.y,     maxY: newPos.y + h,
      minZ: newPos.z - w, maxZ: newPos.z + w,
    };
    if (checkCollision(world, aabb)) {
      // Push out of block
      if (amount > 0) {
        newPos[axis] = Math.floor(aabb[`max${axis.toUpperCase()}`]) - (axis === "y" ? h : w) - 1e-4;
      } else {
        newPos[axis] = Math.ceil(aabb[`min${axis.toUpperCase()}`]) + (axis === "y" ? 0 : w) + 1e-4;
      }
      pos[axis] = newPos[axis];
      return axis === "y" ? (amount < 0 ? 1 : -1) : (amount > 0 ? -1 : 1); // collided sign
    } else {
      pos[axis] = newPos[axis];
      return 0;
    }
  };

  let onGround = false;

  const yCol = moveAxis("y", vel.y * dt);
  if (yCol !== 0) {
    if (vel.y < 0) onGround = true;
    vel.y = 0;
  }
  moveAxis("x", vel.x * dt);
  moveAxis("z", vel.z * dt);

  return { onGround };
}

function checkCollision(world, a) {
  const x0 = Math.floor(a.minX), x1 = Math.floor(a.maxX);
  const y0 = Math.floor(a.minY), y1 = Math.floor(a.maxY);
  const z0 = Math.floor(a.minZ), z1 = Math.floor(a.maxZ);
  for (let y = y0; y <= y1; y++) {
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        const id = world.getBlock(x, y, z);
        if (isSolid(id) && !isLiquid(id)) return true;
      }
    }
  }
  return false;
}

export function isInWater(world, pos) {
  const x = Math.floor(pos.x);
  const y = Math.floor(pos.y + 0.5);
  const z = Math.floor(pos.z);
  return isLiquid(world.getBlock(x, y, z));
}
