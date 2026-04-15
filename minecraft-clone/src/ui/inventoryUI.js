import { iconStyleForItem } from "./hud.js";
import { getItem, ITEMS } from "../items/items.js";
import { RECIPES, matchRecipe } from "../items/recipes.js";

// Inject inventory-specific styles
const STYLE = `
#inventory-screen { background: rgba(0,0,0,0.55); }
#inv-panel {
  background: #c6c6c6;
  border: 4px solid #555;
  box-shadow: 0 0 0 2px #000, inset 2px 2px 0 #fff, inset -2px -2px 0 #555;
  padding: 14px 16px;
  color: #3f3f3f;
  font-family: "Menlo", monospace;
  min-width: 380px;
}
#inv-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
#inv-title-row .title { font-size: 14px; font-weight: bold; color: #3f3f3f; text-shadow: 1px 1px 0 #a8a8a8; letter-spacing: 1px; }
#inv-title-row .mode-btn {
  background: #6a6a6a; color: #fff; border: 2px solid #000; padding: 3px 10px;
  cursor: pointer; font-family: inherit; font-size: 11px;
  box-shadow: inset 1px 1px 0 #aaa, inset -1px -1px 0 #333;
}
#inv-title-row .mode-btn:hover { background: #7a7a7a; }
.inv-row { display: flex; gap: 2px; margin-bottom: 4px; }
.inv-section { margin-bottom: 8px; }
.inv-slot {
  width: 36px; height: 36px;
  background: #8b8b8b;
  border: 2px inset #555;
  box-shadow: inset 1px 1px 0 #555, inset -1px -1px 0 #fff;
  position: relative; cursor: pointer;
  image-rendering: pixelated;
}
.inv-slot:hover { background: #a0a0a0; }
.inv-slot.hotbar { background: #787878; }
.inv-slot .icon {
  position: absolute; inset: 3px;
  background-size: cover; background-repeat: no-repeat;
  image-rendering: pixelated; pointer-events: none;
}
.inv-slot .count {
  position: absolute; right: 1px; bottom: -1px;
  font-size: 11px; font-weight: bold; color: #fff;
  text-shadow: 1px 1px 0 #3f3f3f; pointer-events: none;
  font-family: "Menlo", monospace;
}
.inv-slot.craft-out { background: #8b8b8b; border: 2px inset #555; }
.craft-area { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; justify-content: center; }
.craft-grid { display: grid; grid-template-columns: repeat(3, 36px); gap: 2px; padding: 4px; background: #8b8b8b; border: 2px inset #555; }
.craft-arrow { font-size: 24px; color: #3f3f3f; padding: 0 4px; }
.craft-out-wrap { padding: 4px; background: #8b8b8b; border: 2px inset #555; }
.inv-grid {
  display: grid; grid-template-columns: repeat(9, 36px);
  gap: 2px; padding: 4px;
  background: #8b8b8b; border: 2px inset #555;
}
.inv-hotbar-gap { height: 8px; }
#held-stack {
  position: fixed; pointer-events: none; z-index: 9999;
  width: 32px; height: 32px;
  image-rendering: pixelated;
  display: none;
}
#held-stack .icon { position: absolute; inset: 0; background-size: cover; image-rendering: pixelated; }
#held-stack .count {
  position: absolute; right: 0; bottom: -2px;
  font-size: 12px; font-weight: bold; color: #fff;
  text-shadow: 1px 1px 0 #3f3f3f; font-family: "Menlo", monospace;
}
.inv-tooltip {
  position: fixed; pointer-events: none; z-index: 10000;
  background: rgba(16,0,16,0.94); color: #fff;
  border: 1px solid #280028;
  padding: 4px 6px; font-size: 12px; font-family: "Menlo", monospace;
  display: none; max-width: 220px;
}
#creative-panel {
  display: none;
  max-height: 220px; overflow-y: auto;
  padding: 4px; background: #8b8b8b;
  border: 2px inset #555;
  grid-template-columns: repeat(12, 32px);
  gap: 1px;
}
#creative-panel.open { display: grid; }
#creative-panel .inv-slot { width: 32px; height: 32px; }
.inv-label { font-size: 11px; color: #3f3f3f; margin-bottom: 2px; letter-spacing: 1px; }
`;

let styleInjected = false;
function ensureStyle() {
  if (styleInjected) return;
  const s = document.createElement("style");
  s.textContent = STYLE;
  document.head.appendChild(s);
  styleInjected = true;
}

export class InventoryUI {
  #inv;
  #craftAdd;
  #heldStack;
  #dragActive;
  #dragPath;
  #dragStartStack;
  #lastCraftResult;
  #mouseX;
  #mouseY;

  // inventory here is the UI handle from createInventories, not the full handle.
  // craftGrant is a function created in main.js that wraps the full addItem for craft output.
  constructor(inventory, craftGrant) {
    this.#inv = inventory;
    this.root = document.getElementById("inventory-screen");
    this.open = false;
    this.#heldStack = null;
    this.#dragActive = false;
    this.dragType = null;
    this.#dragPath = [];
    this.#dragStartStack = null;
    this.creativeOpen = false;
    this.onClose = null;
    this.#craftAdd = craftGrant;
    this.#lastCraftResult = null;
    this.#mouseX = null;
    this.#mouseY = null;
    ensureStyle();
    this.build();
    inventory.onChange(() => this.refresh());
  }

  build() {
    this.root.innerHTML = "";
    this.root.className = "hidden";
    const panel = document.createElement("div");
    panel.id = "inv-panel";
    panel.addEventListener("click", (e) => e.stopPropagation());

    // Title + creative toggle
    const titleRow = document.createElement("div");
    titleRow.id = "inv-title-row";
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = "INVENTORY";
    titleRow.appendChild(title);
    panel.appendChild(titleRow);

    // Crafting area: 3x3 grid + arrow + output
    const craftArea = document.createElement("div");
    craftArea.className = "craft-area";
    const craftGrid = document.createElement("div");
    craftGrid.className = "craft-grid";
    this.craftSlotEls = [];
    for (let i = 0; i < 9; i++) {
      const s = this.makeSlot("craft", i);
      this.craftSlotEls.push(s);
      craftGrid.appendChild(s);
    }
    const arrow = document.createElement("div");
    arrow.className = "craft-arrow";
    arrow.textContent = "▶";
    const craftOutWrap = document.createElement("div");
    craftOutWrap.className = "craft-out-wrap";
    const craftOut = this.makeSlot("craft-output", 0);
    craftOut.classList.add("craft-out");
    this.craftOutputEl = craftOut;
    craftOutWrap.appendChild(craftOut);
    craftArea.appendChild(craftGrid);
    craftArea.appendChild(arrow);
    craftArea.appendChild(craftOutWrap);
    panel.appendChild(craftArea);

    // Main inventory grid (27 slots = 3 rows of 9)
    const mainGrid = document.createElement("div");
    mainGrid.className = "inv-grid";
    this.mainSlotEls = [];
    for (let i = 9; i < 36; i++) {
      const s = this.makeSlot("main", i);
      this.mainSlotEls.push(s);
      mainGrid.appendChild(s);
    }
    panel.appendChild(mainGrid);

    // Gap
    const gap = document.createElement("div");
    gap.className = "inv-hotbar-gap";
    panel.appendChild(gap);

    // Hotbar (9 slots)
    const hotGrid = document.createElement("div");
    hotGrid.className = "inv-grid";
    this.hotSlotEls = [];
    for (let i = 0; i < 9; i++) {
      const s = this.makeSlot("main", i);
      s.classList.add("hotbar");
      this.hotSlotEls.push(s);
      hotGrid.appendChild(s);
    }
    panel.appendChild(hotGrid);

    // Creative palette is removed in this build — it was a direct cheat
    // surface. If re-enabled in a future mode, it should go through a
    // separate authorization grant.
    this.creativePanel = document.createElement("div");
    this.creativePanel.id = "creative-panel";
    panel.appendChild(this.creativePanel);

    this.root.appendChild(panel);

    // Held-stack floating element
    this.heldEl = document.createElement("div");
    this.heldEl.id = "held-stack";
    this.heldEl.innerHTML = '<div class="icon"></div><div class="count"></div>';
    document.body.appendChild(this.heldEl);

    // Tooltip
    this.tooltipEl = document.createElement("div");
    this.tooltipEl.className = "inv-tooltip";
    document.body.appendChild(this.tooltipEl);

    // Click-outside: drop held into world (for now, put back in inventory)
    this.root.addEventListener("click", () => this.#dropHeldOutside());

    // Track mouse for held-stack rendering
    document.addEventListener("mousemove", (e) => {
      this.#mouseX = e.clientX;
      this.#mouseY = e.clientY;
      if (this.#heldStack) {
        this.heldEl.style.left = (e.clientX - 16) + "px";
        this.heldEl.style.top = (e.clientY - 16) + "px";
      }
      if (this.#dragActive) {
        // Find element under cursor
        const target = document.elementFromPoint(e.clientX, e.clientY)?.closest?.(".inv-slot");
        if (target) this.#addToDragPath(target);
      }
    });

    document.addEventListener("mouseup", (e) => {
      if (this.#dragActive) this.#finishDrag();
    });

    this.refresh();
  }

  makeSlot(kind, index) {
    const el = document.createElement("div");
    el.className = "inv-slot";
    const icon = document.createElement("div");
    icon.className = "icon";
    const count = document.createElement("div");
    count.className = "count";
    el.appendChild(icon);
    el.appendChild(count);
    el._kind = kind;
    el._index = index;
    el.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.#handleSlotMouseDown(kind, index, e, el);
    });
    el.addEventListener("mouseenter", (e) => {
      this.#showTooltip(kind, index, e);
    });
    el.addEventListener("mouseleave", () => {
      this.tooltipEl.style.display = "none";
    });
    return el;
  }

  #showTooltip(kind, index, e) {
    const stack = this.#getStackForKind(kind, index);
    if (!stack) { this.tooltipEl.style.display = "none"; return; }
    const item = ITEMS[stack.id];
    const name = item?.name || stack.id;
    let lines = [name];
    if (item?.tool) lines.push(`${item.tool}${item.toolTier != null ? " · tier " + item.toolTier : ""}`);
    if (item?.food != null) lines.push(`Food: ${item.food}`);
    if (item?.damage != null) lines.push(`Damage: ${item.damage}`);
    this.tooltipEl.innerHTML = lines.join("<br>");
    this.tooltipEl.style.display = "block";
    const rect = e.target.getBoundingClientRect();
    this.tooltipEl.style.left = (rect.right + 6) + "px";
    this.tooltipEl.style.top = rect.top + "px";
  }

  #getStackForKind(kind, i) {
    if (kind === "main") return this.#inv.getSlot(i);
    if (kind === "craft") return this.#inv.getCraftSlot(i);
    if (kind === "craft-output") return this.#lastCraftResult;
    return null;
  }

  #setStackForKind(kind, i, stack) {
    if (kind === "main") this.#inv.setSlotIfMoved("main", i, stack);
    else if (kind === "craft") this.#inv.setCraftSlot(i, stack);
  }

  #addToDragPath(el) {
    if (!el || !el._kind || el._kind === "craft-output") return;
    if (this.#dragPath.some(p => p.el === el)) return;
    if (el._kind === "craft") return;
    const cur = this.#getStackForKind(el._kind, el._index);
    this.#dragPath.push({
      el,
      kind: el._kind,
      index: el._index,
      baseId: cur ? cur.id : null,
      baseCount: cur ? cur.count : 0,
    });
    this.#distributeDrag();
  }

  #distributeDrag() {
    if (!this.#dragStartStack) return;
    const startCount = this.#dragStartStack.count;
    const id = this.#dragStartStack.id;
    const eligible = this.#dragPath.filter(p => p.baseId === null || p.baseId === id);
    if (eligible.length === 0) return;
    const per = Math.max(1, Math.floor(startCount / eligible.length));
    let given = 0;
    for (const p of eligible) {
      const newCount = Math.min(64, p.baseCount + per);
      const added = newCount - p.baseCount;
      given += added;
      this.#setStackForKind(p.kind, p.index, { id, count: newCount });
    }
    this.#heldStack = { id, count: startCount - given };
    if (this.#heldStack.count <= 0) this.#heldStack = null;
    this.refresh();
  }

  #finishDrag() {
    this.#dragActive = false;
    this.#dragPath = [];
    this.#dragStartStack = null;
    this.refresh();
  }

  #handleSlotMouseDown(kind, index, e, el) {
    // Shift + click: quick transfer
    if (e.shiftKey && e.button === 0) {
      this.#quickTransfer(kind, index);
      return;
    }
    if (kind === "craft-output") {
      const result = this.#lastCraftResult;
      if (!result) return;
      if (!this.#heldStack) this.#heldStack = { id: result.id, count: result.count };
      else if (this.#heldStack.id === result.id) this.#heldStack.count = Math.min(64, this.#heldStack.count + result.count);
      else return;
      this.#inv.consumeCrafting();
      this.refresh();
      return;
    }
    const cur = this.#getStackForKind(kind, index); // clone
    if (e.button === 0) {
      if (!this.#heldStack && cur) {
        this.#heldStack = { id: cur.id, count: cur.count };
        this.#setStackForKind(kind, index, null);
      } else if (this.#heldStack && !cur) {
        this.#dragActive = true;
        this.#dragStartStack = { id: this.#heldStack.id, count: this.#heldStack.count };
        this.#dragPath = [];
        this.#addToDragPath(el);
      } else if (this.#heldStack && cur) {
        if (this.#heldStack.id === cur.id) {
          this.#setStackForKind(kind, index, { id: cur.id, count: Math.min(64, cur.count + this.#heldStack.count) });
          this.#heldStack = null;
        } else {
          const tmp = { id: cur.id, count: cur.count };
          this.#setStackForKind(kind, index, this.#heldStack);
          this.#heldStack = tmp;
        }
      }
    } else if (e.button === 2) {
      if (!this.#heldStack && cur) {
        const half = Math.ceil(cur.count / 2);
        this.#heldStack = { id: cur.id, count: half };
        const remain = cur.count - half;
        this.#setStackForKind(kind, index, remain > 0 ? { id: cur.id, count: remain } : null);
      } else if (this.#heldStack && !cur) {
        this.#setStackForKind(kind, index, { id: this.#heldStack.id, count: 1 });
        this.#heldStack.count--;
        if (this.#heldStack.count <= 0) this.#heldStack = null;
      } else if (this.#heldStack && cur && this.#heldStack.id === cur.id) {
        if (cur.count < 64) {
          this.#setStackForKind(kind, index, { id: cur.id, count: cur.count + 1 });
          this.#heldStack.count--;
        }
        if (this.#heldStack.count <= 0) this.#heldStack = null;
      }
    }
    this.refresh();
  }

  #quickTransfer(kind, index) {
    const stack = this.#getStackForKind(kind, index); // clone
    if (!stack) return;
    if (kind === "craft-output") {
      const result = this.#lastCraftResult;
      if (!result) return;
      // Crafting result — use the authorized craft grant so items can be
      // created into the inventory.
      this.#craftAdd(result.id, result.count);
      this.#inv.consumeCrafting();
      this.refresh();
      return;
    }
    // Move-only transfer (no creation) between hotbar/main regions
    this.#setStackForKind(kind, index, null);
    const toHotbar = kind === "main" && index >= 9;
    const toMain = kind === "main" && index < 9;
    const work = { id: stack.id, count: stack.count };
    if (toHotbar) this.#addToRangeMove(work, 0, 9);
    if (toMain) this.#addToRangeMove(work, 9, 36);
    if (kind === "craft") this.#addToRangeMove(work, 0, 36);
    if (work.count > 0) {
      // Return remainder to its original location
      this.#setStackForKind(kind, index, { id: work.id, count: work.count });
    }
    this.refresh();
  }

  // Moves an existing stack into a range of slots via setSlotIfMoved only
  // (no addItem call — this is a pure permutation of existing items)
  #addToRangeMove(work, from, to) {
    const max = ITEMS[work.id]?.stackSize || 64;
    // merge into existing
    for (let i = from; i < to && work.count > 0; i++) {
      const s = this.#inv.getSlot(i);
      if (s && s.id === work.id && s.count < max) {
        const can = Math.min(max - s.count, work.count);
        this.#inv.setSlotIfMoved("main", i, { id: s.id, count: s.count + can });
        work.count -= can;
      }
    }
    // fill empty
    for (let i = from; i < to && work.count > 0; i++) {
      if (!this.#inv.getSlot(i)) {
        const put = Math.min(max, work.count);
        this.#inv.setSlotIfMoved("main", i, { id: work.id, count: put });
        work.count -= put;
      }
    }
  }

  #dropHeldOutside() {
    if (this.#heldStack) {
      // Put held stack back as a pure move: find an empty/matching slot
      const work = { id: this.#heldStack.id, count: this.#heldStack.count };
      this.#addToRangeMove(work, 0, 36);
      this.#heldStack = work.count > 0 ? work : null;
      this.refresh();
    }
  }

  refresh() {
    for (let i = 0; i < 9; i++) this.renderSlot(this.hotSlotEls[i], this.#inv.getSlot(i));
    for (let i = 0; i < 27; i++) this.renderSlot(this.mainSlotEls[i], this.#inv.getSlot(i + 9));
    for (let i = 0; i < 9; i++) this.renderSlot(this.craftSlotEls[i], this.#inv.getCraftSlot(i));

    const grid = this.#inv.getCraftGrid();
    const match = matchRecipe(grid);
    this.#lastCraftResult = match ? match.result : null;
    this.renderSlot(this.craftOutputEl, this.#lastCraftResult);

    // Update held-stack floating element
    if (this.#heldStack) {
      this.heldEl.style.display = "block";
      const icon = this.heldEl.querySelector(".icon");
      const count = this.heldEl.querySelector(".count");
      icon.setAttribute("style", iconStyleForItem(this.#heldStack.id));
      count.textContent = this.#heldStack.count > 1 ? this.#heldStack.count : "";
      if (this.#mouseX != null) {
        this.heldEl.style.left = (this.#mouseX - 16) + "px";
        this.heldEl.style.top = (this.#mouseY - 16) + "px";
      }
    } else {
      this.heldEl.style.display = "none";
    }
  }

  renderSlot(el, stack) {
    const icon = el.querySelector(".icon");
    const count = el.querySelector(".count");
    if (stack) {
      icon.setAttribute("style", iconStyleForItem(stack.id));
      count.textContent = stack.count > 1 ? stack.count : "";
    } else {
      icon.removeAttribute("style");
      count.textContent = "";
    }
  }

  toggle() {
    this.open = !this.open;
    this.root.classList.toggle("hidden", !this.open);
    if (!this.open) {
      // Return crafting items as pure moves
      for (let i = 0; i < 9; i++) {
        const s = this.#inv.getCraftSlot(i);
        if (s) {
          const work = { id: s.id, count: s.count };
          this.#addToRangeMove(work, 0, 36);
          this.#inv.setCraftSlot(i, work.count > 0 ? work : null);
        }
      }
      this.#dropHeldOutside();
      this.creativeOpen = false;
      if (this.creativePanel) this.creativePanel.classList.remove("open");
      if (this.onClose) this.onClose();
    }
    this.refresh();
    return this.open;
  }
}

Object.freeze(InventoryUI.prototype);
Object.freeze(InventoryUI);
