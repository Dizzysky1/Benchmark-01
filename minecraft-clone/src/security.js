import { createInventories } from "./items/inventory.js";

const _ObjectFreeze = Object.freeze;
const _ObjectIsFrozen = Object.isFrozen;
const _ObjectGetOwnPropertyNames = Object.getOwnPropertyNames;
const _ObjectDefineProperty = Object.defineProperty;
const _ReflectApply = Reflect.apply;
const _WeakSetAdd = WeakSet.prototype.add;
const _WeakSetHas = WeakSet.prototype.has;

const weakSetAdd = (set, value) => _ReflectApply(_WeakSetAdd, set, [value]);
const weakSetHas = (set, value) => _ReflectApply(_WeakSetHas, set, [value]);

// Runtime anti-tamper utilities. Nothing in here is perfect — the whole game
// runs in the user's browser — but layering these raises the cost of the
// trivial "open devtools and type __game.inventory.add('diamond', 64)" attack.

// --- Primitives ---------------------------------------------------------

function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function djb2(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

// --- Obfuscated string constants ----------------------------------------
// Item-name constants avoided as plaintext where possible.
const _encKey = "cbx";
function _dec(s) {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    out += String.fromCharCode(s.charCodeAt(i) ^ _encKey.charCodeAt(i % _encKey.length));
  }
  return out;
}
function _enc(s) { return _dec(s); } // symmetric XOR

// --- Freeze / seal helpers ---------------------------------------------

export function hardFreeze(obj) {
  if (!obj || typeof obj !== "object" && typeof obj !== "function") return obj;
  try { _ObjectFreeze(obj); } catch {}
  try {
    for (const k of _ObjectGetOwnPropertyNames(obj)) {
      const v = obj[k];
      if (v && (typeof v === "object" || typeof v === "function")) {
        if (!_ObjectIsFrozen(v)) hardFreeze(v);
      }
    }
  } catch {}
  return obj;
}

export function lockMethod(obj, name, fn) {
  try {
    _ObjectDefineProperty(obj, name, {
      value: fn,
      writable: false,
      configurable: false,
      enumerable: true,
    });
  } catch {}
}

// Replace fn.toString with a fake source string so static inspection of
// the method returns uninformative output.
export function poisonToString(fn, fakeSrc) {
  try {
    _ObjectDefineProperty(fn, "toString", {
      value: () => fakeSrc || "function () { [native code] }",
      writable: false,
      configurable: false,
    });
    _ObjectDefineProperty(fn, Symbol.toPrimitive, {
      value: () => fakeSrc || "function () { [native code] }",
      writable: false,
      configurable: false,
    });
  } catch {}
  return fn;
}

// --- Anti-debug ---------------------------------------------------------
// Periodic devtools detection via window dimension delta + timing check.
// Doesn't stop DevTools, just makes the session more annoying for a cheater.

let _antiDebugInstalled = false;
let _detected = false;

export function installAntiDebug(onDetected) {
  if (_antiDebugInstalled) return;
  _antiDebugInstalled = true;

  const check = () => {
    const t0 = performance.now();
    // Inline trap — real devtools pausing here will massively inflate dt
    // eslint-disable-next-line no-debugger
    try { debugger; } catch {}
    const dt = performance.now() - t0;
    const wd = Math.abs((window.outerWidth || 0) - (window.innerWidth || 0));
    const hd = Math.abs((window.outerHeight || 0) - (window.innerHeight || 0));
    const open = (wd > 220) || (hd > 220) || dt > 100;
    if (open && !_detected) {
      _detected = true;
      try { onDetected && onDetected(); } catch {}
    } else if (!open) {
      _detected = false;
    }
  };
  // Stagger checks so timing attacks are harder to calibrate
  setInterval(check, 2000 + Math.floor(Math.random() * 500));
}

export function isTampered() { return _detected; }

// --- Trust token ---------------------------------------------------------
// Never exported. Consumers mint capabilities via makeInventories, which
// is the only way to get a handle whose addItem can be wrapped by the
// grant helpers below.

const _TRUST = Symbol("cbx.trust");

// WeakSet of add functions that were created by makeInventories. Only
// these may be used to mint trusted add wrappers inside this module.
const _authorizedAdds = new WeakSet();
const _authorizedFullHandles = new WeakSet();

export function makeInventories(size = 36) {
  const raw = createInventories(size);
  // Stash the raw add and its owning full handle behind captured WeakSet
  // intrinsics so later monkey-patching of WeakSet.prototype can't spy on
  // authorization.
  weakSetAdd(_authorizedAdds, raw.full.addItem);
  weakSetAdd(_authorizedFullHandles, raw.full);
  return raw;
}

function _grantFromHandle(fullHandle) {
  if (!fullHandle || typeof fullHandle.addItem !== "function") {
    return () => false; // no-op cheater trap
  }
  if (!weakSetHas(_authorizedFullHandles, fullHandle)) {
    return () => false; // no-op cheater trap
  }
  if (!weakSetHas(_authorizedAdds, fullHandle.addItem)) {
    return () => false; // no-op cheater trap
  }
  return (id, count) => fullHandle.addItem(id, count, _TRUST);
}

export function makeBreakDropGrant(fullHandle) { return _grantFromHandle(fullHandle); }
export function makePickupGrant(fullHandle)    { return _grantFromHandle(fullHandle); }
export function makeCraftGrant(fullHandle)     { return _grantFromHandle(fullHandle); }

// Trust verifier — only used inside inventory.js
export function isTrust(t) { return t === _TRUST; }

// --- Per-item hash chain ------------------------------------------------
// Lightweight integrity log. Each state mutation updates a chained hash.
// Reading the hash lets the main loop detect if the inventory's slots array
// was swapped out from under it.

export class HashChain {
  constructor(seed = 0) {
    this._h = seed >>> 0;
  }
  mix(s) {
    const str = String(s);
    let h = this._h;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(h ^ str.charCodeAt(i), 2654435761)) | 0;
    }
    this._h = h >>> 0;
    return this._h;
  }
  get value() { return this._h; }
}

// --- Boot secret --------------------------------------------------------
// A small runtime-derived value used as an additional xor salt for the
// hash chain and token nonces. Computed from multiple sources so a cheater
// can't just re-execute security.js to rebuild it identically.

const _bootMarkers = [
  performance.timeOrigin || Date.now(),
  (typeof crypto !== "undefined" && crypto.getRandomValues)
    ? crypto.getRandomValues(new Uint32Array(2))[0] : Math.random() * 1e9,
  navigator.userAgent.length,
];
export const BOOT_SALT = (djb2(_bootMarkers.join("|")) ^ 0xc12fb0b) >>> 0;

// Keep _dec usable for potential callers while hiding what it does at a glance
export const _d = _dec;
