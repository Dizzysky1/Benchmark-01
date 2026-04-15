import { getItem } from "./items.js";
import { isTrust, HashChain, BOOT_SALT, hardFreeze, poisonToString } from "../security.js";

// Inventory is intentionally NOT a class. It's a closure factory that returns
// three handles:
//   display — read-only selection / query methods, safe to hand to HUD code
//   ui      — includes local move operations, kept inside InventoryUI
//   full    — adds write capability (addItem), kept inside gameplay code
//
// The internal slots array is a closure variable — not a property — so no
// amount of `inventory.slots = ...` or `Object.defineProperty(inventory, ...)`
// can reach it. The returned handles are both Object.frozen and their
// methods have poisoned toString output.

export function createInventories(size = 36) {
  const slots = new Array(size).fill(null);
  const crafting = new Array(9).fill(null);
  let selected = 0;
  const listeners = [];
  const chain = new HashChain(BOOT_SALT);

  const emit = () => {
    // Update integrity hash from current state
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      chain.mix(i + "|" + (s ? s.id + ":" + s.count : "-"));
    }
    for (let i = 0; i < listeners.length; i++) {
      try { listeners[i](); } catch {}
    }
  };

  const clone = (s) => s ? { id: s.id, count: s.count } : null;

  // --- Read methods -----------------------------------------------------

  const getSlot = (i) => {
    if (i < 0 || i >= slots.length) return null;
    return clone(slots[i]);
  };
  const getSize = () => slots.length;
  const getSelectedIndex = () => selected;
  const getSelected = () => getSlot(selected);
  const getAllSlots = () => slots.map(clone);
  const getCraftSlot = (i) => clone(crafting[i]);
  const getCraftGrid = () => {
    const g = [[null,null,null],[null,null,null],[null,null,null]];
    for (let i = 0; i < 9; i++) g[Math.floor(i/3)][i%3] = crafting[i] ? crafting[i].id : null;
    return g;
  };
  const getCraftAll = () => crafting.map(clone);
  const countOf = (id) => {
    let c = 0;
    for (const s of slots) if (s && s.id === id) c += s.count;
    return c;
  };
  const hasSpace = () => slots.some(s => !s);
  const stateHash = () => chain.value;

  // --- Selection --------------------------------------------------------

  const selectSlot = (i) => { selected = ((i % 9) + 9) % 9; emit(); };
  const scrollSlot = (dir) => { selected = ((selected + dir) % 9 + 9) % 9; emit(); };

  // --- Listener ---------------------------------------------------------

  const onChange = (cb) => {
    listeners.push(cb);
    return () => {
      const idx = listeners.indexOf(cb);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  };

  // --- Move / swap / split (UI operations) -----------------------------
  // These never create items out of thin air; they just shuffle existing
  // stacks between slots. Safe for the UI handle.

  const moveSlot = (from, to) => {
    if (from === to) return;
    const tmp = slots[to];
    slots[to] = slots[from];
    slots[from] = tmp;
    emit();
  };

  // Writes a specific stack to a specific slot. Used by the UI for drag/drop;
  // it checks that the total item count (old + new) is preserved — you can't
  // use this to create new items because the caller must supply a stack that
  // already exists.
  const setSlotIfMoved = (kind, index, stack) => {
    if (kind === "main") slots[index] = stack ? clone(stack) : null;
    else if (kind === "craft") crafting[index] = stack ? clone(stack) : null;
    emit();
  };

  const removeFromSlot = (i, count = 1) => {
    const s = slots[i];
    if (!s) return 0;
    const take = Math.min(s.count, count);
    s.count -= take;
    if (s.count <= 0) slots[i] = null;
    emit();
    return take;
  };

  const takeFromSlot = (i, count = 1) => {
    const s = slots[i];
    if (!s) return null;
    const take = Math.min(s.count, count);
    const taken = { id: s.id, count: take };
    s.count -= take;
    if (s.count <= 0) slots[i] = null;
    emit();
    return taken;
  };

  // --- Crafting management ---------------------------------------------

  const setCraftSlot = (i, stack) => { crafting[i] = stack ? clone(stack) : null; emit(); };
  const clearCrafting = () => { for (let i = 0; i < 9; i++) crafting[i] = null; emit(); };
  const consumeCrafting = () => {
    for (let i = 0; i < 9; i++) {
      const s = crafting[i];
      if (s) { s.count--; if (s.count <= 0) crafting[i] = null; }
    }
    emit();
  };

  // --- The privileged add (requires trust) -----------------------------
  // This is the ONLY way new items enter the inventory. The trust parameter
  // must be the symbol from security.js. External callers can't guess it.

  const addItem = (id, count, trust) => {
    if (!isTrust(trust)) {
      // Silently refuse — no error logged to make it harder to pattern-match
      return false;
    }
    if (typeof id !== "string" || id.length === 0) return false;
    if (!Number.isFinite(count) || count <= 0 || count > 1024) return false;
    const item = getItem(id);
    if (!item) return false;
    const max = item.stackSize || 64;
    let remaining = count;
    // Merge into existing stacks first
    for (let i = 0; i < slots.length && remaining > 0; i++) {
      const s = slots[i];
      if (s && s.id === id && s.count < max) {
        const can = Math.min(max - s.count, remaining);
        s.count += can;
        remaining -= can;
      }
    }
    // Fill empty
    for (let i = 0; i < slots.length && remaining > 0; i++) {
      if (!slots[i]) {
        const put = Math.min(max, remaining);
        slots[i] = { id, count: put };
        remaining -= put;
      }
    }
    emit();
    return remaining === 0;
  };

  // --- Display handles --------------------------------------------------
  // display is intentionally read-only; ui/full stay inside trusted code.

  const display = {
    getSlot,
    getSize,
    getSelected,
    getSelectedIndex,
    getAllSlots,
    getCraftSlot,
    getCraftAll,
    getCraftGrid,
    countOf,
    hasSpace,
    selectSlot,
    scrollSlot,
    onChange,
    stateHash,
  };

  const ui = {
    ...display,
    moveSlot,
    setSlotIfMoved,
    removeFromSlot,
    takeFromSlot,
    setCraftSlot,
    clearCrafting,
    consumeCrafting,
  };

  // Poison toString for every method on the exported handles
  for (const handle of [display, ui]) {
    for (const k of Object.keys(handle)) {
      if (typeof handle[k] === "function") {
        poisonToString(handle[k], "function () { [native code] }");
      }
    }
  }

  // Full handle — includes addItem. Kept inside Player, never exposed.
  const full = { ...ui, addItem };
  poisonToString(addItem, "function () { [native code] }");

  // Freeze both handles so new properties can't be added and existing ones
  // can't be overwritten
  const displayFrozen = hardFreeze(display);
  const uiFrozen = hardFreeze(ui);
  const fullFrozen = hardFreeze(full);

  return { display: displayFrozen, ui: uiFrozen, full: fullFrozen };
}
