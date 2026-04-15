import * as THREE from "three";

export class InputState {
  constructor() {
    this.keys = new Set();
    this.mouse = { dx: 0, dy: 0, leftDown: false, rightDown: false, leftJustPressed: false, rightJustPressed: false };
    this.pointerLocked = false;
    this.wheelDelta = 0;
  }
  isDown(code) { return this.keys.has(code); }
  consumeMouse() {
    const dx = this.mouse.dx, dy = this.mouse.dy;
    this.mouse.dx = 0; this.mouse.dy = 0;
    return { dx, dy };
  }
  consumeWheel() {
    const w = this.wheelDelta;
    this.wheelDelta = 0;
    return w;
  }
  consumeClicks() {
    const l = this.mouse.leftJustPressed;
    const r = this.mouse.rightJustPressed;
    this.mouse.leftJustPressed = false;
    this.mouse.rightJustPressed = false;
    return { left: l, right: r };
  }
}

export function attachControls(input, canvas) {
  window.addEventListener("keydown", (e) => {
    input.keys.add(e.code);
    if (e.code === "Tab") e.preventDefault();
  });
  window.addEventListener("keyup", (e) => input.keys.delete(e.code));
  window.addEventListener("blur", () => input.keys.clear());

  document.addEventListener("pointerlockchange", () => {
    input.pointerLocked = document.pointerLockElement === canvas;
  });

  canvas.addEventListener("mousedown", (e) => {
    if (!input.pointerLocked) {
      canvas.requestPointerLock();
      return;
    }
    if (e.button === 0) { input.mouse.leftDown = true; input.mouse.leftJustPressed = true; }
    if (e.button === 2) { input.mouse.rightDown = true; input.mouse.rightJustPressed = true; }
  });
  canvas.addEventListener("mouseup", (e) => {
    if (e.button === 0) input.mouse.leftDown = false;
    if (e.button === 2) input.mouse.rightDown = false;
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  canvas.addEventListener("mousemove", (e) => {
    if (!input.pointerLocked) return;
    input.mouse.dx += e.movementX || 0;
    input.mouse.dy += e.movementY || 0;
  });

  canvas.addEventListener("wheel", (e) => {
    input.wheelDelta += e.deltaY;
    e.preventDefault();
  }, { passive: false });
}
