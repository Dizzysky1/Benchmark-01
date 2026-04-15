// Craftbox menu system — self-contained DOM-based UI for a Three.js voxel game.
// Exports a single `Menu` class that manages title, world list, new world,
// settings, and pause screens. No external assets, no CSS file.

const STORAGE_WORLDS_KEY = "craftbox.worlds";
const STORAGE_SETTINGS_KEY = "craftbox.settings";
const STYLE_TAG_ID = "craftbox-menu-styles";
const ROOT_ID = "menu-root";

const DEFAULT_SETTINGS = {
  renderDistance: 6,
  fov: 75,
  mouseSensitivity: 1,
  mute: false,
};

const CSS = `
#${ROOT_ID} { position: fixed; inset: 0; z-index: 9999; display: none; font-family: Monaco, Menlo, "Courier New", monospace; color: #fff; user-select: none; -webkit-user-select: none; image-rendering: pixelated; overflow: hidden; }
#${ROOT_ID}.cb-open { display: block; }
#${ROOT_ID} .cb-bg { position: absolute; inset: 0; background-image: var(--cb-dirt); background-size: 64px 64px; background-repeat: repeat; image-rendering: pixelated; filter: brightness(0.55); }
#${ROOT_ID} .cb-vignette { position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%); pointer-events: none; }
#${ROOT_ID} .cb-screen { position: absolute; inset: 0; display: none; flex-direction: column; align-items: center; justify-content: flex-start; padding: 60px 20px 40px; box-sizing: border-box; overflow-y: auto; }
#${ROOT_ID} .cb-screen.cb-active { display: flex; }
#${ROOT_ID} .cb-title { font-size: 72px; font-weight: 900; letter-spacing: 8px; color: #fff; text-shadow: 2px 2px 0 #2b2b2b, 4px 4px 0 #1a1a1a, 6px 6px 12px rgba(0,0,0,0.6); margin: 40px 0 10px; text-align: center; transform: rotate(-1deg); }
#${ROOT_ID} .cb-tagline { font-size: 12px; color: #ffeb3b; text-shadow: 1px 1px 0 #5b5320; margin-bottom: 36px; transform: rotate(-4deg); }
#${ROOT_ID} .cb-heading { font-size: 22px; color: #fff; text-shadow: 2px 2px 0 #1a1a1a; margin: 20px 0 24px; text-align: center; letter-spacing: 2px; }
#${ROOT_ID} .cb-btn { display: inline-block; box-sizing: border-box; width: 220px; height: 40px; line-height: 36px; margin: 4px; padding: 0 10px; background: #6a6a6a; color: #fff; font: 14px Monaco, Menlo, monospace; text-align: center; text-shadow: 1px 1px 0 #222; border-top: 2px solid #8a8a8a; border-left: 2px solid #8a8a8a; border-right: 2px solid #3a3a3a; border-bottom: 2px solid #3a3a3a; cursor: pointer; outline: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: background-color 60ms linear; }
#${ROOT_ID} .cb-btn:hover:not(.cb-disabled) { background: #7a7a7a; }
#${ROOT_ID} .cb-btn:active:not(.cb-disabled) { background: #555; border-top-color: #3a3a3a; border-left-color: #3a3a3a; border-right-color: #8a8a8a; border-bottom-color: #8a8a8a; }
#${ROOT_ID} .cb-btn.cb-disabled { color: #aaa; background: #4a4a4a; cursor: not-allowed; text-shadow: none; }
#${ROOT_ID} .cb-btn-sm { width: 108px; height: 34px; line-height: 30px; font-size: 12px; }
#${ROOT_ID} .cb-btn-danger:hover:not(.cb-disabled) { background: #9b4a4a; }
#${ROOT_ID} .cb-btn-row { display: flex; gap: 6px; justify-content: center; margin-top: 6px; }
#${ROOT_ID} .cb-panel { width: min(560px, calc(100% - 40px)); background: rgba(16,16,16,0.82); border: 2px solid #1a1a1a; outline: 2px solid #8a8a8a; outline-offset: -6px; padding: 20px 22px; margin: 0 0 12px; box-sizing: border-box; }
#${ROOT_ID} .cb-world-list { width: min(560px, calc(100% - 40px)); max-height: 50vh; overflow-y: auto; background: rgba(16,16,16,0.82); border: 2px solid #1a1a1a; outline: 2px solid #8a8a8a; outline-offset: -6px; padding: 10px; box-sizing: border-box; margin-bottom: 14px; }
#${ROOT_ID} .cb-world-list::-webkit-scrollbar { width: 10px; }
#${ROOT_ID} .cb-world-list::-webkit-scrollbar-thumb { background: #6a6a6a; border: 1px solid #1a1a1a; }
#${ROOT_ID} .cb-world-list::-webkit-scrollbar-track { background: #222; }
#${ROOT_ID} .cb-world-item { display: flex; align-items: center; gap: 10px; padding: 10px; margin: 4px 0; background: rgba(40,40,40,0.6); border: 1px solid #0e0e0e; }
#${ROOT_ID} .cb-world-item.cb-selected { background: rgba(80,120,80,0.55); border-color: #d0ffb0; }
#${ROOT_ID} .cb-world-info { flex: 1; min-width: 0; }
#${ROOT_ID} .cb-world-name { font-size: 14px; color: #fff; text-shadow: 1px 1px 0 #111; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${ROOT_ID} .cb-world-meta { font-size: 10px; color: #a8a8a8; margin-top: 2px; }
#${ROOT_ID} .cb-empty { color: #aaa; text-align: center; padding: 30px 10px; font-size: 12px; font-style: italic; }
#${ROOT_ID} .cb-field { margin: 10px 0; }
#${ROOT_ID} .cb-field label { display: block; font-size: 12px; color: #ddd; text-shadow: 1px 1px 0 #111; margin-bottom: 4px; }
#${ROOT_ID} .cb-field input[type=text] { width: 100%; box-sizing: border-box; background: #1f1f1f; color: #fff; border: 2px solid #8a8a8a; padding: 6px 8px; font: 13px Monaco, Menlo, monospace; outline: none; }
#${ROOT_ID} .cb-field input[type=text]:focus { border-color: #d0ffb0; }
#${ROOT_ID} .cb-field input[type=range] { width: 100%; accent-color: #7a7a7a; }
#${ROOT_ID} .cb-row { display: flex; justify-content: space-between; align-items: center; }
#${ROOT_ID} .cb-row-val { font-size: 12px; color: #ffeb3b; text-shadow: 1px 1px 0 #111; }
#${ROOT_ID} .cb-radios { display: flex; gap: 14px; }
#${ROOT_ID} .cb-radios label { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; }
#${ROOT_ID} .cb-toggle { display: inline-block; width: 44px; height: 22px; background: #3a3a3a; border: 2px solid #1a1a1a; position: relative; cursor: pointer; vertical-align: middle; }
#${ROOT_ID} .cb-toggle::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; background: #8a8a8a; transition: left 80ms linear, background-color 80ms linear; }
#${ROOT_ID} .cb-toggle.cb-on { background: #4a6a3a; }
#${ROOT_ID} .cb-toggle.cb-on::after { left: 24px; background: #d0ffb0; }
#${ROOT_ID} .cb-version { position: absolute; left: 8px; bottom: 6px; font-size: 10px; color: #ddd; text-shadow: 1px 1px 0 #111; pointer-events: none; }
#${ROOT_ID} .cb-copyright { position: absolute; right: 8px; bottom: 6px; font-size: 10px; color: #ddd; text-shadow: 1px 1px 0 #111; pointer-events: none; }
#${ROOT_ID} .cb-pause-title { font-size: 16px; color: #ffeb3b; text-shadow: 1px 1px 0 #111; margin-top: 80px; margin-bottom: 4px; }
#${ROOT_ID} .cb-confirm { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: none; align-items: center; justify-content: center; z-index: 10; }
#${ROOT_ID} .cb-confirm.cb-show { display: flex; }
#${ROOT_ID} .cb-confirm-box { background: #1a1a1a; border: 2px solid #1a1a1a; outline: 2px solid #8a8a8a; outline-offset: -6px; padding: 24px 28px; max-width: 420px; text-align: center; }
#${ROOT_ID} .cb-confirm-msg { font-size: 13px; color: #fff; margin-bottom: 16px; }
`;

function makeDirtTextureDataURL() {
  const size = 32;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(size, size);
  // Deterministic RNG so the texture is stable across reloads.
  let s = 0x1337;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s / 0x7fffffff);
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = rand();
      // Mix a couple of earthy browns.
      const base = n < 0.55 ? [107, 77, 46] : (n < 0.85 ? [134, 96, 58] : [82, 58, 34]);
      const j = (n * 30) | 0;
      img.data[i] = Math.max(0, base[0] - j + 6);
      img.data[i + 1] = Math.max(0, base[1] - j + 4);
      img.data[i + 2] = Math.max(0, base[2] - j);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

function loadWorlds() {
  try {
    const raw = localStorage.getItem(STORAGE_WORLDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveWorlds(worlds) {
  try {
    localStorage.setItem(STORAGE_WORLDS_KEY, JSON.stringify(worlds));
  } catch (e) {}
}

function loadSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettingsToStorage(s) {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(s));
  } catch (e) {}
}

function formatLastPlayed(ts) {
  if (!ts) return "Never played";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "Never played";
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

function parseSeed(input) {
  const trimmed = (input || "").trim();
  if (!trimmed) return (Math.random() * 0x7fffffff) | 0;
  const asInt = Number.parseInt(trimmed, 10);
  if (!Number.isNaN(asInt) && String(asInt) === trimmed) return asInt >>> 0;
  return hashSeed(trimmed);
}

function el(tag, props = {}, children = []) {
  const e = document.createElement(tag);
  for (const k in props) {
    if (k === "class") e.className = props[k];
    else if (k === "style") e.setAttribute("style", props[k]);
    else if (k === "html") e.innerHTML = props[k];
    else if (k.startsWith("on") && typeof props[k] === "function") {
      e.addEventListener(k.slice(2).toLowerCase(), props[k]);
    } else if (k === "text") e.textContent = props[k];
    else e.setAttribute(k, props[k]);
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c == null) continue;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return e;
}

export class Menu {
  constructor(opts = {}) {
    this.onPlay = opts.onPlay || (() => {});
    this.onQuit = opts.onQuit || (() => {});
    this.onSettingsChange = opts.onSettingsChange || (() => {});

    this.currentScreen = null;
    this.currentWorld = null; // set when pause is showing
    this.screens = {};
    this._open = false;
    this._keyHandler = this._onKey.bind(this);

    this._injectStyles();
    this._buildRoot();
    this._buildScreens();
    window.addEventListener("keydown", this._keyHandler);
  }

  // ------------- public API -------------

  show(screen = "title") {
    this._open = true;
    this.root.classList.add("cb-open");
    this._setScreen(screen);
  }

  hide() {
    this._open = false;
    this.root.classList.remove("cb-open");
    this._hideConfirm();
  }

  isOpen() {
    return this._open;
  }

  showPause(worldName) {
    this.currentWorld = worldName || "World";
    this._open = true;
    this.root.classList.add("cb-open");
    const label = this.screens.pause.querySelector(".cb-pause-title");
    if (label) label.textContent = this.currentWorld;
    this._setScreen("pause");
  }

  loadSettings() {
    return loadSettingsFromStorage();
  }

  destroy() {
    window.removeEventListener("keydown", this._keyHandler);
    if (this.root && this.root.parentNode) this.root.parentNode.removeChild(this.root);
  }

  // ------------- internal: DOM scaffolding -------------

  _injectStyles() {
    if (document.getElementById(STYLE_TAG_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_TAG_ID;
    const dirt = makeDirtTextureDataURL();
    style.textContent = `:root { --cb-dirt: url(${dirt}); }\n${CSS}`;
    document.head.appendChild(style);
  }

  _buildRoot() {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }
    this.root = root;
    this.root.innerHTML = "";
    this.root.appendChild(el("div", { class: "cb-bg" }));
    this.root.appendChild(el("div", { class: "cb-vignette" }));
    this.root.appendChild(el("div", { class: "cb-version", text: "Craftbox 1.0 \u00b7 Three.js" }));
    this.root.appendChild(el("div", { class: "cb-copyright", text: "\u00a9 You, not Mojang" }));

    this.confirm = el("div", { class: "cb-confirm" }, [
      el("div", { class: "cb-confirm-box" }, [
        el("div", { class: "cb-confirm-msg", text: "Are you sure?" }),
        el("div", { class: "cb-btn-row" }, [
          el("div", { class: "cb-btn cb-btn-sm", text: "Confirm", onclick: () => this._onConfirmYes() }),
          el("div", { class: "cb-btn cb-btn-sm", text: "Cancel", onclick: () => this._hideConfirm() }),
        ]),
      ]),
    ]);
    this.root.appendChild(this.confirm);
  }

  _buildScreens() {
    this.screens.title = this._buildTitleScreen();
    this.screens.worlds = this._buildWorldListScreen();
    this.screens.newWorld = this._buildNewWorldScreen();
    this.screens.settings = this._buildSettingsScreen();
    this.screens.pause = this._buildPauseScreen();
    for (const key in this.screens) {
      this.root.appendChild(this.screens[key]);
    }
  }

  _setScreen(name) {
    for (const key in this.screens) {
      this.screens[key].classList.toggle("cb-active", key === name);
    }
    this.currentScreen = name;
    if (name === "worlds") this._renderWorldList();
    if (name === "settings") this._renderSettings();
    if (name === "newWorld") this._resetNewWorldForm();
  }

  // ------------- internal: screens -------------

  _buildTitleScreen() {
    const btn = (text, onclick) => el("div", { class: "cb-btn", text, onclick });
    return el("div", { class: "cb-screen" }, [
      el("div", { class: "cb-title", text: "CRAFTBOX" }),
      el("div", { class: "cb-tagline", text: "A blocky adventure!" }),
      btn("Singleplayer", () => this._setScreen("worlds")),
      btn("Settings", () => this._setScreen("settings")),
      btn("Quit", () => this.onQuit()),
    ]);
  }

  _buildWorldListScreen() {
    this._worldListEl = el("div", { class: "cb-world-list" });
    return el("div", { class: "cb-screen" }, [
      el("div", { class: "cb-heading", text: "Select World" }),
      this._worldListEl,
      el("div", { class: "cb-btn-row" }, [
        el("div", { class: "cb-btn", text: "Create New World", onclick: () => this._setScreen("newWorld") }),
        el("div", { class: "cb-btn", text: "Cancel", onclick: () => this._setScreen("title") }),
      ]),
    ]);
  }

  _renderWorldList() {
    const worlds = loadWorlds();
    worlds.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
    this._worldListEl.innerHTML = "";
    if (!worlds.length) {
      this._worldListEl.appendChild(el("div", { class: "cb-empty", text: "No worlds yet" }));
      return;
    }
    for (const w of worlds) {
      const info = el("div", { class: "cb-world-info" }, [
        el("div", { class: "cb-world-name", text: w.name || "Unnamed" }),
        el("div", {
          class: "cb-world-meta",
          text: `${w.gameMode || "survival"} \u00b7 seed ${w.seed} \u00b7 ${formatLastPlayed(w.lastPlayed)}`,
        }),
      ]);
      const playBtn = el("div", {
        class: "cb-btn cb-btn-sm",
        text: "Play",
        onclick: () => this._playWorld(w),
      });
      const delBtn = el("div", {
        class: "cb-btn cb-btn-sm cb-btn-danger",
        text: "Delete",
        onclick: () => this._confirmDelete(w),
      });
      const item = el("div", { class: "cb-world-item" }, [info, playBtn, delBtn]);
      this._worldListEl.appendChild(item);
    }
  }

  _playWorld(w) {
    const worlds = loadWorlds();
    const idx = worlds.findIndex((x) => x.name === w.name && x.createdAt === w.createdAt);
    if (idx >= 0) {
      worlds[idx].lastPlayed = Date.now();
      saveWorlds(worlds);
    }
    this.hide();
    this.onPlay({ ...w, lastPlayed: Date.now() });
  }

  _confirmDelete(w) {
    this._showConfirm(`Delete world "${w.name}"? This cannot be undone.`, () => {
      const worlds = loadWorlds().filter((x) => !(x.name === w.name && x.createdAt === w.createdAt));
      saveWorlds(worlds);
      this._renderWorldList();
    });
  }

  _buildNewWorldScreen() {
    const nameInput = el("input", { type: "text", value: "New World" });
    const seedInput = el("input", { type: "text", placeholder: "Leave blank for random" });
    this._newWorldForm = { nameInput, seedInput };

    const onSubmit = () => {
      const name = (nameInput.value || "").trim() || "New World";
      const seed = parseSeed(seedInput.value);
      const now = Date.now();
      // Survival only — creative mode removed as a cheat surface.
      const world = { name, seed, createdAt: now, lastPlayed: now, gameMode: "survival" };
      const worlds = loadWorlds();
      worlds.push(world);
      saveWorlds(worlds);
      this.hide();
      this.onPlay(world);
    };
    this._newWorldSubmit = onSubmit;

    const panel = el("div", { class: "cb-panel" }, [
      el("div", { class: "cb-field" }, [
        el("label", { text: "World Name" }),
        nameInput,
      ]),
      el("div", { class: "cb-field" }, [
        el("label", { text: "Seed (optional)" }),
        seedInput,
      ]),
    ]);

    return el("div", { class: "cb-screen" }, [
      el("div", { class: "cb-heading", text: "Create New World" }),
      panel,
      el("div", { class: "cb-btn-row" }, [
        el("div", { class: "cb-btn", text: "Create", onclick: onSubmit }),
        el("div", { class: "cb-btn", text: "Cancel", onclick: () => this._setScreen("worlds") }),
      ]),
    ]);
  }

  _resetNewWorldForm() {
    if (!this._newWorldForm) return;
    this._newWorldForm.nameInput.value = "New World";
    this._newWorldForm.seedInput.value = "";
    setTimeout(() => {
      try {
        this._newWorldForm.nameInput.focus();
        this._newWorldForm.nameInput.select();
      } catch (e) {}
    }, 0);
  }

  _buildSettingsScreen() {
    this._settingsRefs = {};
    this._settingsState = loadSettingsFromStorage();
    const mkSlider = (labelText, min, max, step, key, valFormatter) => {
      const val = el("span", { class: "cb-row-val", text: "" });
      const input = el("input", { type: "range", min: String(min), max: String(max), step: String(step) });
      input.addEventListener("input", () => {
        const v = step >= 1 ? parseInt(input.value, 10) : parseFloat(input.value);
        this._settingsState[key] = v;
        val.textContent = valFormatter ? valFormatter(v) : String(v);
        this._persistSettings();
      });
      const field = el("div", { class: "cb-field" }, [
        el("div", { class: "cb-row" }, [
          el("label", { text: labelText }),
          val,
        ]),
        input,
      ]);
      this._settingsRefs[key] = { input, val, formatter: valFormatter };
      return field;
    };

    const toggle = el("div", { class: "cb-toggle" });
    toggle.addEventListener("click", () => {
      this._settingsState.mute = !this._settingsState.mute;
      toggle.classList.toggle("cb-on", this._settingsState.mute);
      this._persistSettings();
    });
    this._settingsRefs.mute = { input: toggle };

    const panel = el("div", { class: "cb-panel" }, [
      mkSlider("Render Distance", 3, 16, 1, "renderDistance", (v) => `${v} chunks`),
      mkSlider("Field of View", 60, 110, 1, "fov", (v) => `${v}\u00b0`),
      mkSlider("Mouse Sensitivity", 0.1, 3, 0.1, "mouseSensitivity", (v) => v.toFixed(1) + "x"),
      el("div", { class: "cb-field" }, [
        el("div", { class: "cb-row" }, [
          el("label", { text: "Mute Sounds" }),
          toggle,
        ]),
      ]),
    ]);

    return el("div", { class: "cb-screen" }, [
      el("div", { class: "cb-heading", text: "Options" }),
      panel,
      el("div", { class: "cb-btn-row" }, [
        el("div", { class: "cb-btn", text: "Done", onclick: () => this._settingsDone() }),
      ]),
    ]);
  }

  _renderSettings() {
    this._settingsState = loadSettingsFromStorage();
    const refs = this._settingsRefs;
    const keys = ["renderDistance", "fov", "mouseSensitivity"];
    for (const k of keys) {
      const r = refs[k];
      if (!r || !r.input) continue;
      r.input.value = String(this._settingsState[k]);
      const v = this._settingsState[k];
      r.val.textContent = r.formatter ? r.formatter(v) : String(v);
    }
    if (refs.mute && refs.mute.input) {
      refs.mute.input.classList.toggle("cb-on", !!this._settingsState.mute);
    }
  }

  _persistSettings() {
    saveSettingsToStorage(this._settingsState);
    try { this.onSettingsChange({ ...this._settingsState }); } catch (e) {}
  }

  _settingsDone() {
    // Return to whichever screen makes sense: pause if a world is active, else title.
    if (this._cameFromPause) {
      this._cameFromPause = false;
      this._setScreen("pause");
    } else {
      this._setScreen("title");
    }
  }

  _buildPauseScreen() {
    const btn = (text, onclick) => el("div", { class: "cb-btn", text, onclick });
    return el("div", { class: "cb-screen" }, [
      el("div", { class: "cb-heading", text: "Game Paused" }),
      el("div", { class: "cb-pause-title", text: "World" }),
      btn("Resume", () => this._resumeFromPause()),
      btn("Settings", () => {
        this._cameFromPause = true;
        this._setScreen("settings");
      }),
      btn("Save and Quit to Title", () => {
        this.currentWorld = null;
        this._setScreen("title");
      }),
    ]);
  }

  _resumeFromPause() {
    this.hide();
    // Mirror the esc-to-resume behavior; the host game should re-capture pointer.
  }

  // ------------- internal: confirm dialog -------------

  _showConfirm(msg, onYes) {
    const msgEl = this.confirm.querySelector(".cb-confirm-msg");
    if (msgEl) msgEl.textContent = msg;
    this._confirmYesHandler = onYes;
    this.confirm.classList.add("cb-show");
  }

  _hideConfirm() {
    this._confirmYesHandler = null;
    this.confirm.classList.remove("cb-show");
  }

  _onConfirmYes() {
    const fn = this._confirmYesHandler;
    this._hideConfirm();
    if (fn) fn();
  }

  // ------------- internal: key handling -------------

  _onKey(e) {
    if (!this._open) return;
    if (this.confirm.classList.contains("cb-show")) {
      if (e.key === "Escape") { e.preventDefault(); this._hideConfirm(); }
      return;
    }
    if (e.key === "Escape") {
      if (this.currentScreen === "pause") {
        e.preventDefault();
        this._resumeFromPause();
      } else if (this.currentScreen === "settings" || this.currentScreen === "worlds") {
        e.preventDefault();
        if (this._cameFromPause && this.currentScreen === "settings") {
          this._cameFromPause = false;
          this._setScreen("pause");
        } else {
          this._setScreen("title");
        }
      } else if (this.currentScreen === "newWorld") {
        e.preventDefault();
        this._setScreen("worlds");
      }
    } else if (e.key === "Enter") {
      if (this.currentScreen === "newWorld" && this._newWorldSubmit) {
        e.preventDefault();
        this._newWorldSubmit();
      }
    }
  }
}
