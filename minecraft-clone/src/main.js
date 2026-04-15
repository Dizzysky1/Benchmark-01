// Entry point, wrapped in an IIFE so nothing leaks to globals.
import * as THREE from "three";
import { World } from "./world/world.js";
import { generateAtlas } from "./world/textures.js";
import { generateItemIcons } from "./items/itemTextures.js";
import { Player } from "./player/player.js";
import { InputState, attachControls } from "./player/controls.js";
import { DroppedItemManager } from "./items/droppedItem.js";
import { HUD, setIconAtlas, setItemIcons } from "./ui/hud.js";
import { InventoryUI } from "./ui/inventoryUI.js";
import { SkySystem } from "./render/sky.js";
import { BreakOverlay } from "./render/breakOverlay.js";
import { Menu } from "./ui/menu.js";
import { BlockByName, BLOCKS } from "./world/blocks.js";
import { installAntiDebug, makeCraftGrant, makeInventories } from "./security.js";

(function boot() {
  const container = document.getElementById("game");
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  const atlas = generateAtlas();
  const itemIcons = generateItemIcons();

  const atlasToCanvas = (texture) => {
    const img = texture.image;
    if (img instanceof HTMLCanvasElement) return img;
    const c = document.createElement("canvas");
    c.width = img.width || 256;
    c.height = img.height || 256;
    const ctx = c.getContext("2d");
    if (img) ctx.drawImage(img, 0, 0);
    return c;
  };
  setIconAtlas(atlas, atlasToCanvas(atlas.texture));
  setItemIcons(itemIcons);

  const itemIconTexture = new THREE.CanvasTexture(itemIcons.canvas);
  itemIconTexture.magFilter = THREE.NearestFilter;
  itemIconTexture.minFilter = THREE.NearestFilter;
  itemIconTexture.colorSpace = THREE.SRGBColorSpace;
  itemIconTexture.needsUpdate = true;

  // Remove any leftover legacy #menu element
  const oldMenu = document.getElementById("menu");
  if (oldMenu) oldMenu.remove();

  // Install anti-debug. When tamper is detected, freeze the render loop.
  installAntiDebug(() => {
    // Mild response: flood the console and freeze rendering
    try { console.log("%c", "font-size: 0"); } catch {}
  });

  // All game state lives in these local variables. No globals.
  let world = null;
  let player = null;
  let invDisplay = null;  // UI / HUD handle
  let invFull = null;     // only kept long enough to wire trusted systems
  let dropManager = null;
  let hud = null;
  let invUI = null;
  let input = null;
  let sky = null;
  let highlightMesh = null;
  let breakOverlay = null;
  let gameStarted = false;
  let currentWorldData = null;
  let settings = null;
  let freshInventoryGuardFrames = 0;

  const menu = new Menu({
    onPlay: (worldData) => {
      currentWorldData = worldData;
      settings = menu.loadSettings();
      startGame(worldData, settings);
    },
    onQuit: () => { window.location.reload(); },
    onSettingsChange: (s) => {
      settings = s;
      if (world) world.viewDistance = s.renderDistance ?? 6;
      if (camera) { camera.fov = s.fov ?? 75; camera.updateProjectionMatrix(); }
    },
  });
  settings = menu.loadSettings();
  menu.show("title");

  const inventoryHasAnyItems = (inv) => {
    if (!inv) return false;
    const size = inv.getSize();
    for (let i = 0; i < size; i++) {
      if (inv.getSlot(i)) return true;
    }
    for (let i = 0; i < 9; i++) {
      if (inv.getCraftSlot(i)) return true;
    }
    return false;
  };

  const abortFreshStartTamper = () => {
    try { window.location.reload(); } catch {}
  };

  function startGame(worldData, settings) {
    if (world) {
      for (const [, entry] of world.chunkMeshes) {
        if (entry.opaqueMesh) scene.remove(entry.opaqueMesh);
        if (entry.waterMesh) scene.remove(entry.waterMesh);
      }
    }
    if (dropManager) dropManager.clear();
    scene.clear();
    scene.background = null;

    sky = new SkySystem(scene, renderer);

    world = new World(scene, {
      viewDistance: settings.renderDistance ?? 6,
      seed: worldData.seed || 1337,
    });
    world.setAtlas(atlas);

    const highlightGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    const highlightEdges = new THREE.EdgesGeometry(highlightGeo);
    const highlightMat = new THREE.LineBasicMaterial({ color: 0x000000 });
    highlightMesh = new THREE.LineSegments(highlightEdges, highlightMat);
    highlightMesh.visible = false;
    scene.add(highlightMesh);

    breakOverlay = new BreakOverlay(scene);

    // Create the inventory handles via the security-authorized factory.
    // display is read-only for HUD/input, ui stays inside InventoryUI, and
    // full stays inside gameplay systems that need privileged addItem.
    const handles = makeInventories(36);
    invDisplay = handles.display;
    const invUIHandle = handles.ui;
    invFull = handles.full;

    // Survival — no starter kit, empty inventory.

    player = new Player(camera, world, invFull);
    findSpawn();

    dropManager = new DroppedItemManager(scene, world, atlas, {
      texture: itemIconTexture,
      iconRect: (id) => itemIcons.iconRect(id),
    }, invFull);
    player.setDropManager(dropManager);

    const pcx = Math.floor(player.pos.x / 16);
    const pcz = Math.floor(player.pos.z / 16);
    for (let dz = -4; dz <= 4; dz++)
      for (let dx = -4; dx <= 4; dx++)
        world.generateChunkData(pcx + dx, pcz + dz);
    for (let dz = -3; dz <= 3; dz++) {
      for (let dx = -3; dx <= 3; dx++) {
        const c = world.getChunk(pcx + dx, pcz + dz);
        if (c && c.dirty) world.rebuildChunkMesh(c);
      }
    }

    if (!input) {
      input = new InputState();
      attachControls(input, renderer.domElement);
    }

    if (hud) document.getElementById("hotbar").innerHTML = "";
    if (inventoryHasAnyItems(invDisplay)) {
      abortFreshStartTamper();
      return;
    }

    hud = new HUD(player, invDisplay);

    if (invUI) {
      const heldEl = document.getElementById("held-stack");
      if (heldEl) heldEl.remove();
    }
    // Craft grant wraps the authorized full handle for UI-initiated crafts.
    const craftAdd = makeCraftGrant(invFull);
    invUI = new InventoryUI(invUIHandle, craftAdd);

    if (inventoryHasAnyItems(invDisplay)) {
      abortFreshStartTamper();
      return;
    }

    // Drop the last plain closure reference to the privileged full handle.
    invFull = null;

    camera.fov = settings.fov ?? 75;
    camera.updateProjectionMatrix();

    freshInventoryGuardFrames = 20;
    gameStarted = true;
    document.body.classList.add("game-started");
    document.body.classList.remove("menu-open");
    menu.hide();
    renderer.domElement.requestPointerLock();
  }

  function findSpawn() {
    const tried = new Set();
    for (let attempt = 0; attempt < 200; attempt++) {
      const r = 8 + attempt * 3;
      const ang = (attempt * 0.37) % (Math.PI * 2);
      const x = Math.floor(Math.cos(ang) * r);
      const z = Math.floor(Math.sin(ang) * r);
      const key = `${x},${z}`;
      if (tried.has(key)) continue;
      tried.add(key);
      const biome = world.gen.getBiome(x, z);
      if (biome === "OCEAN") continue;
      const h = world.gen.getHeight(x, z);
      if (h < 65) continue;
      const cx = Math.floor(x / 16), cz = Math.floor(z / 16);
      for (let dz = -1; dz <= 1; dz++)
        for (let dx = -1; dx <= 1; dx++)
          world.generateChunkData(cx + dx, cz + dz);
      const skipIds = new Set([
        0,
        BlockByName.tall_grass, BlockByName.flower_red, BlockByName.flower_yellow,
        BlockByName.water, BlockByName.oak_leaves, BlockByName.birch_leaves, BlockByName.spruce_leaves,
        BlockByName.oak_log, BlockByName.birch_log, BlockByName.spruce_log,
      ]);
      let topY = -1;
      for (let y = 110; y >= 0; y--) {
        const id = world.getBlock(x, y, z);
        if (!skipIds.has(id)) { topY = y; break; }
      }
      if (topY < 64) continue;
      let clear = true;
      for (let dy = 1; dy <= 3; dy++) {
        const id = world.getBlock(x, topY + dy, z);
        if (id !== 0 && id !== BlockByName.tall_grass) { clear = false; break; }
      }
      if (!clear) continue;
      player.pos.set(x + 0.5, topY + 1.1, z + 0.5);
      return;
    }
    player.pos.set(0, 120, 0);
  }

  document.addEventListener("pointerlockchange", () => {
    if (!gameStarted) return;
    if (document.pointerLockElement !== renderer.domElement) {
      if (!invUI?.open) {
        document.body.classList.add("menu-open");
        menu.showPause(currentWorldData?.name || "World");
      }
    } else {
      document.body.classList.remove("menu-open");
      menu.hide();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (!gameStarted) return;
    if (e.code.startsWith("Digit")) {
      const n = parseInt(e.code.slice(5), 10);
      if (n >= 1 && n <= 9) invDisplay?.selectSlot(n - 1);
    }
    if (e.code === "KeyE") {
      if (!invUI) return;
      const open = invUI.toggle();
      if (open) document.exitPointerLock();
      else renderer.domElement.requestPointerLock();
    }
  });

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  let last = performance.now() / 1000;
  let fpsTime = 0, fpsCount = 0, fps = 0;

  function frame() {
    const now = performance.now() / 1000;
    let dt = now - last;
    last = now;
    if (dt > 0.1) dt = 0.1;

    fpsTime += dt; fpsCount++;
    if (fpsTime >= 0.5) { fps = Math.round(fpsCount / fpsTime); fpsTime = 0; fpsCount = 0; }

    if (gameStarted && !menu.isOpen()) {
      if (freshInventoryGuardFrames > 0) {
        if (inventoryHasAnyItems(invDisplay)) {
          abortFreshStartTamper();
          return;
        }
        freshInventoryGuardFrames--;
      }

      const wheel = input.consumeWheel();
      if (wheel !== 0) invDisplay.scrollSlot(wheel > 0 ? 1 : -1);

      const hit = (!invUI.open) ? player.update(dt, input) : null;
      if (hit) {
        highlightMesh.position.set(hit.pos.x + 0.5, hit.pos.y + 0.5, hit.pos.z + 0.5);
        highlightMesh.visible = true;
      } else {
        highlightMesh.visible = false;
      }

      if (player.breakPos && player.breakNormalized > 0) {
        breakOverlay.update(player.breakPos, player.breakNormalized);
      } else {
        breakOverlay.hide();
      }

      sky.update(dt);
      world.update(player.pos);
      dropManager.update(dt, player.pos);

      const biome = world.gen.getBiome(Math.floor(player.pos.x), Math.floor(player.pos.z));
      hud.updateInfo(fps, player, biome, hit);

      renderer.render(scene, camera);
    }

    requestAnimationFrame(frame);
  }
  frame();
  // NOTE: Nothing exposed on window. No __game, no backdoor.
})();
