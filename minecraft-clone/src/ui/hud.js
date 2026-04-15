import { getItem, ITEMS } from "../items/items.js";
import { BlockByName } from "../world/blocks.js";
import { RECIPES, matchRecipe } from "../items/recipes.js";

// Build small icon canvases from block UVs or item color fallbacks
let atlasCanvas = null;
let atlasImageUrl = null;
let uvOf = null;
let atlasSize = 256;
let itemIcons = null; // generateItemIcons() result

export function setIconAtlas(atlas, canvas) {
  uvOf = atlas.uvOf;
  atlasCanvas = canvas;
  atlasSize = canvas.width;
  atlasImageUrl = canvas.toDataURL();
}

export function setItemIcons(icons) {
  itemIcons = icons;
}

export function iconStyleForItem(id) {
  if (!id) return "";
  const item = getItem(id);
  if (item?.isBlock && uvOf && atlasImageUrl) {
    const name = nameForItemTexture(id);
    const uv = uvOf(name);
    const ts = atlasSize;
    const sx = uv.u0 * ts;
    const sy = (1 - uv.v1) * ts;
    const sw = (uv.u1 - uv.u0) * ts;
    const sh = (uv.v1 - uv.v0) * ts;
    const bgSize = `${ts * (32 / sw)}px ${ts * (32 / sh)}px`;
    const bgPos = `-${sx * (32 / sw)}px -${sy * (32 / sh)}px`;
    return `background-image:url('${atlasImageUrl}');background-size:${bgSize};background-position:${bgPos};image-rendering:pixelated;`;
  }
  // Non-block item — try item icons atlas
  if (itemIcons && itemIcons.has(id)) {
    const url = itemIcons.iconDataUrlFor(id);
    return `background-image:url('${url}');background-size:cover;image-rendering:pixelated;`;
  }
  // Fallback — colored box
  const c = "#888";
  return `background:${c};`;
}

function nameForItemTexture(id) {
  // Map block item ids to their primary texture name (top/side)
  // Use BLOCKS to look up faces
  const map = {
    grass_block: "grass_side", oak_log: "oak_log", birch_log: "birch_log", spruce_log: "spruce_log",
    sandstone: "sandstone_side", red_sandstone: "red_sandstone_side",
    crafting_table: "crafting_table_side", furnace: "furnace_front", chest: "chest_front",
    mycelium: "mycelium_side", podzol: "podzol_side",
    pumpkin: "pumpkin_side", melon: "melon_side", cactus: "cactus_side",
  };
  return map[id] || id;
}

export class HUD {
  #inventory;

  // inventory here is the DISPLAY handle (no addItem)
  constructor(player, inventory) {
    this.#inventory = inventory;
    this.hotbarEl = document.getElementById("hotbar");
    this.infoEl = document.getElementById("info");
    this.buildHotbar();
    inventory.onChange(() => this.refreshHotbar());
  }

  buildHotbar() {
    this.hotbarEl.innerHTML = "";
    this.slotEls = [];
    for (let i = 0; i < 9; i++) {
      const s = document.createElement("div");
      s.className = "slot";
      const icon = document.createElement("div");
      icon.className = "icon";
      const count = document.createElement("div");
      count.className = "count";
      s.appendChild(icon);
      s.appendChild(count);
      this.hotbarEl.appendChild(s);
      this.slotEls.push({ slot: s, icon, count });
    }
    this.refreshHotbar();
  }

  refreshHotbar() {
    const sel = this.#inventory.getSelectedIndex();
    for (let i = 0; i < 9; i++) {
      const stack = this.#inventory.getSlot(i);
      const { slot, icon, count } = this.slotEls[i];
      slot.classList.toggle("selected", i === sel);
      if (stack) {
        icon.setAttribute("style", iconStyleForItem(stack.id));
        count.textContent = stack.count > 1 ? stack.count : "";
      } else {
        icon.removeAttribute("style");
        count.textContent = "";
      }
    }
  }

  updateInfo(fps, player, biome, hit) {
    const p = player.pos;
    const sel = this.#inventory.getSelected();
    this.infoEl.textContent =
`FPS: ${fps}
Pos: ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}
Biome: ${biome}
Ground: ${player.onGround ? "yes" : "no"}${player.flying ? " · flying" : ""}
Held: ${sel ? sel.id + " x" + sel.count : "—"}
${hit ? "Aim: " + hit.blockId : ""}`;
  }
}

Object.freeze(HUD.prototype);
Object.freeze(HUD);
