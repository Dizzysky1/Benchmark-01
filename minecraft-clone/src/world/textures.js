import * as THREE from "three";

export const MISSING_TEXTURE = "__missing__";
const TILE = 16, GRID = 16, ATLAS = TILE * GRID;

export const TEXTURE_NAMES = [
  "stone","grass_top","grass_side","dirt","cobblestone","bedrock","sand","gravel",
  "oak_log","oak_log_top","oak_leaves","oak_planks",
  "birch_log","birch_log_top","birch_leaves","birch_planks",
  "spruce_log","spruce_log_top","spruce_leaves","spruce_planks",
  "water","lava","glass","ice","snow_block",
  "coal_ore","iron_ore","gold_ore","diamond_ore","redstone_ore","lapis_ore","emerald_ore","copper_ore",
  "deepslate","cobbled_deepslate","stone_bricks","brick",
  "sandstone_top","sandstone_bottom","sandstone_side",
  "glowstone","torch",
  "crafting_table_top","crafting_table_side",
  "furnace_top","furnace_side","furnace_front",
  "chest_top","chest_side","chest_front",
  "obsidian","netherrack","bookshelf",
  "wool_white","wool_red","wool_blue","wool_yellow","wool_green","wool_black",
  "pumpkin_top","pumpkin_side","pumpkin_face",
  "melon_top","melon_side",
  "mossy_cobblestone","clay","mycelium_top","mycelium_side","podzol_top","podzol_side",
  "red_sand","red_sandstone_top","red_sandstone_bottom","red_sandstone_side",
  "tall_grass","flower_red","flower_yellow","cactus_top","cactus_bottom","cactus_side",
  MISSING_TEXTURE,
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const rgb = (r,g,b,a=255) => [r,g,b,a];
const clamp8 = v => v < 0 ? 0 : v > 255 ? 255 : v;
function jitter(rng, c, amt) {
  const j = (rng() - 0.5) * 2 * amt;
  return [clamp8(c[0]+j), clamp8(c[1]+j), clamp8(c[2]+j), c[3]];
}
const mix = (a, b, t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t, a[3]+(b[3]-a[3])*t];

class Tile {
  constructor(ctx, ox, oy) {
    this.ctx = ctx; this.ox = ox; this.oy = oy;
    this.img = ctx.createImageData(TILE, TILE);
  }
  set(x, y, c) {
    if (x < 0 || y < 0 || x >= TILE || y >= TILE) return;
    const i = (y * TILE + x) * 4;
    this.img.data[i] = c[0]; this.img.data[i+1] = c[1]; this.img.data[i+2] = c[2]; this.img.data[i+3] = c[3];
  }
  fill(c) { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) this.set(x, y, c); }
  noise(rng, base, amt) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) this.set(x, y, jitter(rng, base, amt));
  }
  speckle(rng, count, c, amt = 0) {
    for (let i = 0; i < count; i++) {
      const x = (rng() * TILE) | 0, y = (rng() * TILE) | 0;
      this.set(x, y, amt ? jitter(rng, c, amt) : c);
    }
  }
  commit() { this.ctx.putImageData(this.img, this.ox, this.oy); }
}

const P = {
  stone: rgb(127,127,127), stoneDk: rgb(100,100,100),
  dirt: rgb(134,94,63), dirtDk: rgb(105,72,46),
  grass: rgb(92,160,64), grassDk: rgb(68,128,48),
  sand: rgb(224,212,158), sandDk: rgb(198,186,130),
  bark: rgb(100,70,40), barkDk: rgb(70,48,26), woodRing: rgb(160,124,76),
  birch: rgb(228,228,220), birchDk: rgb(170,170,160),
  spruce: rgb(72,50,28), spruceDk: rgb(48,32,16), spruceRing: rgb(130,90,54),
  leaves: rgb(48,108,40), leavesDk: rgb(30,82,28),
  birchLeaves: rgb(108,148,68), spruceLeaves: rgb(36,80,36),
  planks: rgb(180,140,82), planksDk: rgb(140,102,54),
  birchPlanks: rgb(220,212,168), sprucePlanks: rgb(108,78,48),
  water: rgb(50,90,200,190), waterLt: rgb(90,140,230,200),
  lava: rgb(220,90,20), lavaHot: rgb(255,180,40),
  glass: rgb(200,230,240,90), glassEdge: rgb(220,240,250,200),
  ice: rgb(160,200,240,220), iceLt: rgb(200,230,255,230),
  snow: rgb(244,250,255), snowDk: rgb(210,222,240),
  coal: rgb(25,25,25), iron: rgb(196,172,140), gold: rgb(240,200,60),
  diamond: rgb(100,220,220), redstone: rgb(220,30,30), lapis: rgb(40,70,200),
  emerald: rgb(40,200,80), copper: rgb(200,120,60),
  deepslate: rgb(64,64,70), deepslateDk: rgb(40,40,48),
  brick: rgb(170,72,50), mortar: rgb(100,100,100),
  sandstone: rgb(236,222,170), sandstoneDk: rgb(198,186,130),
  glowBg: rgb(140,100,40), glowHi: rgb(255,220,120),
  crafting: rgb(110,72,40), craftingTop: rgb(160,90,40),
  furnace: rgb(92,92,92), furnaceDk: rgb(50,50,50), fire: rgb(240,140,40),
  chest: rgb(140,92,40), chestDk: rgb(96,60,24), chestLock: rgb(220,200,80),
  obsidian: rgb(28,14,44), obsidianHi: rgb(60,36,92),
  netherrack: rgb(120,38,38), netherrackDk: rgb(80,22,22),
  bookRed: rgb(180,40,40), bookBlue: rgb(40,60,170), bookGreen: rgb(40,140,60), bookBrown: rgb(120,80,40),
  wool_white: rgb(230,230,230), wool_red: rgb(180,40,40), wool_blue: rgb(40,60,180),
  wool_yellow: rgb(220,200,40), wool_green: rgb(40,140,60), wool_black: rgb(30,30,30),
  pumpkin: rgb(220,128,28), pumpkinDk: rgb(170,88,16), pumpkinStem: rgb(90,110,40),
  melon: rgb(90,150,40), melonDk: rgb(60,110,28), melonRed: rgb(220,70,60),
  moss: rgb(72,120,56), clay: rgb(168,172,186),
  mycelium: rgb(112,88,128), mySpeck: rgb(220,180,220),
  podzol: rgb(108,72,36), podSpeck: rgb(60,40,18),
  redSand: rgb(196,104,44), redSandDk: rgb(160,80,32),
  redSS: rgb(200,96,40), redSSDk: rgb(150,70,26),
  plant: rgb(60,140,50), plantDk: rgb(40,100,36),
  flowerRed: rgb(220,40,40), flowerRedCtr: rgb(240,220,60),
  flowerYel: rgb(240,220,60), flowerYelCtr: rgb(240,140,40),
  cactus: rgb(56,108,32), cactusTop: rgb(72,128,40), spine: rgb(30,60,20),
  torchStick: rgb(170,130,70), torchHead: rgb(255,220,80), torchEdge: rgb(220,160,40),
  missing: rgb(255,0,255), black: rgb(0,0,0), clear: rgb(0,0,0,0),
};

function cobbleLike(t, rng, dark, light) {
  t.fill(dark);
  const cells = 4, s = TILE / cells;
  for (let cy = 0; cy < cells; cy++) for (let cx = 0; cx < cells; cx++) {
    const ox = cx * s + 1, oy = cy * s + 1;
    for (let y = 0; y < s - 2; y++) for (let x = 0; x < s - 2; x++) {
      if (rng() < 0.13) continue;
      t.set(ox + x, oy + y, jitter(rng, light, 14));
    }
  }
}
function logSide(t, rng, dk, lt) {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const band = Math.sin(x * 1.4) * 0.5 + 0.5;
    t.set(x, y, jitter(rng, mix(dk, lt, band), 12));
  }
}
function logTop(t, rng, base, ring, freq = 1.6) {
  const cx = 7.5, cy = 7.5;
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.hypot(x - cx, y - cy);
    const w = (Math.sin(d * freq) + 1) * 0.5;
    t.set(x, y, jitter(rng, mix(base, ring, w), 10));
  }
}
function leaves(t, rng, color, holeRate = 0.18) {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    if (rng() < holeRate) { t.set(x, y, P.clear); continue; }
    t.set(x, y, jitter(rng, color, 18));
  }
}
function planks(t, rng, lt, dk) {
  const rows = 4;
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const row = (y / (TILE / rows)) | 0;
    t.set(x, y, jitter(rng, row & 1 ? lt : dk, 12));
  }
  for (let r = 1; r < rows; r++) { const y = r * (TILE / rows); for (let x = 0; x < TILE; x++) t.set(x, y, dk); }
}
function topsoilSide(t, rng, top, depth = 4) {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    let base = y < depth ? top : P.dirt;
    if (y === depth && rng() < 0.5) base = top;
    if (y === depth - 1 && rng() < 0.4) base = top;
    t.set(x, y, jitter(rng, base, 14));
  }
}
function sandstoneSide(t, rng, base, dk) {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, jitter(rng, base, 10));
  for (let x = 0; x < TILE; x++) { t.set(x, 1, dk); t.set(x, TILE - 2, dk); }
}
function flower(t, rng, petal, center) {
  t.fill(P.clear);
  for (let y = 6; y < TILE; y++) { t.set(7, y, P.plantDk); t.set(8, y, P.plant); }
  for (const [x,y] of [[6,4],[7,4],[8,4],[9,4],[6,5],[9,5],[7,3],[8,3]]) t.set(x, y, petal);
  t.set(7, 5, center); t.set(8, 5, center);
}

const GENERATORS = {
  stone(t, r) { t.noise(r, P.stone, 18); t.speckle(r, 14, P.stoneDk); },
  dirt(t, r) { t.noise(r, P.dirt, 16); t.speckle(r, 18, P.dirtDk); },
  grass_top(t, r) { t.noise(r, P.grass, 22); t.speckle(r, 24, P.grassDk); },
  grass_side(t, r) { topsoilSide(t, r, P.grass); },
  cobblestone(t, r) { cobbleLike(t, r, P.stoneDk, P.stone); },
  bedrock(t, r) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      t.set(x, y, jitter(r, r() < 0.5 ? P.stoneDk : rgb(60,60,60), 16));
    }
    t.speckle(r, 10, rgb(30,30,30));
  },
  sand(t, r) { t.noise(r, P.sand, 12); t.speckle(r, 14, P.sandDk); },
  gravel(t, r) { t.noise(r, rgb(150,146,140), 18); t.speckle(r, 24, rgb(90,88,84)); t.speckle(r, 12, rgb(200,196,190)); },
  oak_log(t, r) { logSide(t, r, P.barkDk, P.bark); },
  oak_log_top(t, r) { logTop(t, r, P.bark, P.woodRing); },
  oak_leaves(t, r) { leaves(t, r, P.leaves); for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) if (r() < 0.5 && t.img.data[(y*TILE+x)*4+3]) t.set(x,y,jitter(r,P.leavesDk,14)); },
  oak_planks(t, r) { planks(t, r, P.planks, P.planksDk); },
  birch_log(t, r) {
    t.noise(r, P.birch, 16);
    for (let i = 0; i < 8; i++) {
      const y = (r() * TILE) | 0, w = 1 + ((r() * 3) | 0);
      for (let dx = 0; dx < w; dx++) t.set(((r() * TILE) | 0), y, P.birchDk);
    }
  },
  birch_log_top(t, r) { logTop(t, r, P.birch, P.birchDk, 1.8); },
  birch_leaves(t, r) { leaves(t, r, P.birchLeaves, 0.2); },
  birch_planks(t, r) { planks(t, r, P.birchPlanks, P.birchDk); },
  spruce_log(t, r) { logSide(t, r, P.spruceDk, P.spruce); },
  spruce_log_top(t, r) { logTop(t, r, P.spruce, P.spruceRing, 1.4); },
  spruce_leaves(t, r) { leaves(t, r, P.spruceLeaves, 0.22); },
  spruce_planks(t, r) { planks(t, r, P.sprucePlanks, P.spruceDk); },
  water(t, r) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const w = (Math.sin((x + y) * 0.7) + 1) * 0.5;
      t.set(x, y, jitter(r, mix(P.water, P.waterLt, w * 0.6), 10));
    }
  },
  lava(t, r) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const w = (Math.sin(x * 0.9 + y * 0.6) + 1) * 0.5;
      t.set(x, y, jitter(r, mix(P.lava, P.lavaHot, w), 18));
    }
  },
  glass(t, r) {
    t.fill(P.glass);
    for (let i = 0; i < TILE; i++) {
      t.set(i, 0, P.glassEdge); t.set(i, TILE - 1, P.glassEdge);
      t.set(0, i, P.glassEdge); t.set(TILE - 1, i, P.glassEdge);
    }
  },
  ice(t, r) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const w = (Math.sin(x * 0.4 + y * 0.5) + 1) * 0.5;
      t.set(x, y, jitter(r, mix(P.ice, P.iceLt, w), 8));
    }
  },
  snow_block(t, r) { t.noise(r, P.snow, 8); t.speckle(r, 10, P.snowDk); },
  deepslate(t, r) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const b = Math.sin(y * 1.1) * 0.5 + 0.5;
      t.set(x, y, jitter(r, mix(P.deepslateDk, P.deepslate, b), 10));
    }
  },
  cobbled_deepslate(t, r) { cobbleLike(t, r, P.deepslateDk, P.deepslate); },
  stone_bricks(t, r) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, jitter(r, P.stone, 12));
    for (let x = 0; x < TILE; x++) { t.set(x, 0, P.stoneDk); t.set(x, 8, P.stoneDk); }
    for (let y = 0; y < 8; y++) t.set(8, y, P.stoneDk);
    for (let y = 8; y < TILE; y++) t.set(0, y, P.stoneDk);
  },
  brick(t, r) {
    t.fill(P.mortar);
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const row = (y / 4) | 0, offset = row & 1 ? 4 : 0;
      if (y % 4 === 0) continue;
      if ((x + offset) % 8 === 0) continue;
      t.set(x, y, jitter(r, P.brick, 14));
    }
  },
  sandstone_top(t, r) { t.noise(r, P.sandstone, 8); t.speckle(r, 8, P.sandstoneDk); },
  sandstone_bottom(t, r) { t.noise(r, P.sandstoneDk, 10); t.speckle(r, 8, P.sandstone); },
  sandstone_side(t, r) { sandstoneSide(t, r, P.sandstone, P.sandstoneDk); },
  glowstone(t, r) {
    t.noise(r, P.glowBg, 16);
    for (let i = 0; i < 10; i++) {
      const x = (r() * TILE) | 0, y = (r() * TILE) | 0;
      t.set(x, y, P.glowHi);
      if (x + 1 < TILE) t.set(x + 1, y, jitter(r, P.glowHi, 20));
      if (y + 1 < TILE) t.set(x, y + 1, jitter(r, P.glowHi, 20));
    }
  },
  torch(t, r) {
    t.fill(P.clear);
    for (let y = 8; y < 14; y++) { t.set(7, y, P.torchStick); t.set(8, y, jitter(r, P.torchStick, 10)); }
    t.set(7, 6, P.torchEdge); t.set(8, 6, P.torchEdge);
    t.set(7, 7, P.torchHead); t.set(8, 7, P.torchHead);
    t.set(6, 7, P.torchEdge); t.set(9, 7, P.torchEdge);
  },
  crafting_table_top(t, r) {
    t.noise(r, P.craftingTop, 14);
    for (let i = 0; i < TILE; i++) { t.set(i, 0, P.planksDk); t.set(i, TILE - 1, P.planksDk); }
    t.set(8, 8, P.stoneDk); t.set(9, 8, P.stoneDk); t.set(8, 9, P.stoneDk); t.set(9, 9, P.stoneDk);
  },
  crafting_table_side(t, r) {
    t.noise(r, P.crafting, 14);
    for (let y = 2; y < 10; y += 3) for (let x = 2; x < TILE - 2; x++) if ((x + y) % 3) t.set(x, y, P.planksDk);
  },
  furnace_top(t, r) {
    t.noise(r, P.furnace, 12);
    for (let x = 2; x < TILE - 2; x++) { t.set(x, 3, P.furnaceDk); t.set(x, TILE - 4, P.furnaceDk); }
  },
  furnace_side(t, r) { t.noise(r, P.furnace, 14); t.speckle(r, 10, P.furnaceDk); },
  furnace_front(t, r) {
    t.noise(r, P.furnace, 12);
    for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) {
      t.set(x, y, y > 8 ? jitter(r, P.fire, 20) : P.furnaceDk);
    }
    for (let i = 3; i < 13; i++) { t.set(i, 3, P.stoneDk); t.set(i, 12, P.stoneDk); }
    for (let i = 4; i < 12; i++) { t.set(3, i, P.stoneDk); t.set(12, i, P.stoneDk); }
  },
  chest_top(t, r) {
    t.noise(r, P.chest, 10);
    for (let x = 0; x < TILE; x++) { t.set(x, 0, P.chestDk); t.set(x, TILE - 1, P.chestDk); }
    for (let y = 0; y < TILE; y++) { t.set(0, y, P.chestDk); t.set(TILE - 1, y, P.chestDk); }
    for (let x = 2; x < TILE - 2; x++) t.set(x, 7, P.chestDk);
  },
  chest_side(t, r) {
    t.noise(r, P.chest, 10);
    for (let y = 0; y < TILE; y++) { t.set(0, y, P.chestDk); t.set(TILE - 1, y, P.chestDk); }
    for (let x = 0; x < TILE; x++) { t.set(x, 0, P.chestDk); t.set(x, TILE - 1, P.chestDk); }
  },
  chest_front(t, r) {
    GENERATORS.chest_side(t, r);
    for (let x = 2; x < TILE - 2; x++) t.set(x, 5, P.chestDk);
    t.set(7, 6, P.chestLock); t.set(8, 6, P.chestLock);
    t.set(7, 7, P.chestLock); t.set(8, 7, P.chestLock);
    t.set(7, 8, rgb(30,20,10)); t.set(8, 8, rgb(30,20,10));
  },
  obsidian(t, r) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      t.set(x, y, jitter(r, r() < 0.15 ? P.obsidianHi : P.obsidian, 10));
    }
  },
  netherrack(t, r) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      t.set(x, y, jitter(r, r() < 0.4 ? P.netherrackDk : P.netherrack, 18));
    }
  },
  bookshelf(t, r) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, jitter(r, P.planksDk, 10));
    for (let x = 0; x < TILE; x++) { t.set(x, 0, P.planksDk); t.set(x, 1, P.planks); t.set(x, TILE - 2, P.planks); t.set(x, TILE - 1, P.planksDk); }
    const books = [P.bookRed, P.bookBlue, P.bookGreen, P.bookBrown];
    for (let y = 3; y < TILE - 3; y += 4) for (let bx = 1; bx < TILE - 1; bx += 2) {
      const c = books[(r() * books.length) | 0];
      t.set(bx, y, c); t.set(bx, y + 1, jitter(r, c, 16)); t.set(bx, y + 2, c);
    }
  },
  pumpkin_top(t, r) {
    t.noise(r, P.pumpkinStem, 10);
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      if (Math.hypot(x - 7.5, y - 7.5) > 4) t.set(x, y, jitter(r, P.pumpkinDk, 14));
    }
  },
  pumpkin_side(t, r) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const w = Math.sin(x * 0.9) * 0.5 + 0.5;
      t.set(x, y, jitter(r, mix(P.pumpkinDk, P.pumpkin, w), 10));
    }
  },
  pumpkin_face(t, r) {
    GENERATORS.pumpkin_side(t, r);
    const eye = rgb(255,220,80);
    for (const [x,y] of [[4,6],[5,6],[5,7],[10,6],[11,6],[10,7]]) t.set(x, y, eye);
    for (let x = 4; x < 12; x++) t.set(x, 11, eye);
    t.set(5, 10, eye); t.set(8, 10, eye); t.set(11, 10, eye);
  },
  melon_top(t, r) { t.noise(r, P.melonDk, 12); t.speckle(r, 14, P.melon); },
  melon_side(t, r) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const w = Math.sin(y * 0.8) * 0.5 + 0.5;
      t.set(x, y, jitter(r, mix(P.melonDk, P.melon, w), 10));
    }
    t.speckle(r, 6, P.melonRed);
  },
  mossy_cobblestone(t, r) {
    cobbleLike(t, r, P.stoneDk, P.stone);
    for (let i = 0; i < 30; i++) t.set((r() * TILE) | 0, (r() * TILE) | 0, jitter(r, P.moss, 12));
  },
  clay(t, r) { t.noise(r, P.clay, 8); },
  mycelium_top(t, r) { t.noise(r, P.mycelium, 14); t.speckle(r, 18, P.mySpeck); },
  mycelium_side(t, r) { topsoilSide(t, r, P.mycelium, 3); },
  podzol_top(t, r) { t.noise(r, P.podzol, 14); t.speckle(r, 16, P.podSpeck); },
  podzol_side(t, r) { topsoilSide(t, r, P.podzol); },
  red_sand(t, r) { t.noise(r, P.redSand, 12); t.speckle(r, 14, P.redSandDk); },
  red_sandstone_top(t, r) { t.noise(r, P.redSS, 8); t.speckle(r, 8, P.redSSDk); },
  red_sandstone_bottom(t, r) { t.noise(r, P.redSSDk, 10); t.speckle(r, 8, P.redSS); },
  red_sandstone_side(t, r) { sandstoneSide(t, r, P.redSS, P.redSSDk); },
  tall_grass(t, r) {
    t.fill(P.clear);
    for (let x = 2; x < TILE - 2; x += 2) {
      const h = 6 + ((r() * 6) | 0);
      for (let y = 0; y < h; y++) t.set(x, TILE - 1 - y, jitter(r, y < 2 ? P.plant : P.plantDk, 14));
    }
  },
  flower_red(t, r) { flower(t, r, P.flowerRed, P.flowerRedCtr); },
  flower_yellow(t, r) { flower(t, r, P.flowerYel, P.flowerYelCtr); },
  cactus_top(t, r) {
    t.noise(r, P.cactusTop, 10);
    for (let x = 2; x < TILE - 2; x++) { t.set(x, 2, P.spine); t.set(x, TILE - 3, P.spine); }
    for (let y = 2; y < TILE - 2; y++) { t.set(2, y, P.spine); t.set(TILE - 3, y, P.spine); }
  },
  cactus_bottom(t, r) {
    t.noise(r, P.cactus, 10);
    for (let x = 3; x < TILE - 3; x++) { t.set(x, 3, P.spine); t.set(x, TILE - 4, P.spine); }
  },
  cactus_side(t, r) {
    t.noise(r, P.cactus, 12);
    for (let y = 1; y < TILE - 1; y += 2) { t.set(2, y, P.spine); t.set(TILE - 3, y, P.spine); }
    for (let x = 0; x < TILE; x++) { t.set(x, 0, P.spine); t.set(x, TILE - 1, P.spine); }
  },
  [MISSING_TEXTURE](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      t.set(x, y, ((x < TILE / 2) ^ (y < TILE / 2)) ? P.missing : P.black);
    }
  },
};

for (const name of ["wool_white","wool_red","wool_blue","wool_yellow","wool_green","wool_black"]) {
  const base = P[name];
  GENERATORS[name] = (t, r) => { t.noise(r, base, 14); t.speckle(r, 10, jitter(r, base, -22)); };
}

function makeOre(spot) {
  return (t, r) => {
    GENERATORS.stone(t, r);
    for (let i = 0; i < 6; i++) {
      const cx = (r() * TILE) | 0, cy = (r() * TILE) | 0, rad = 1 + ((r() * 2) | 0);
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (dx*dx + dy*dy > rad*rad || r() < 0.25) continue;
        t.set(cx + dx, cy + dy, jitter(r, spot, 20));
      }
    }
  };
}
GENERATORS.coal_ore = makeOre(P.coal);
GENERATORS.iron_ore = makeOre(P.iron);
GENERATORS.gold_ore = makeOre(P.gold);
GENERATORS.diamond_ore = makeOre(P.diamond);
GENERATORS.redstone_ore = makeOre(P.redstone);
GENERATORS.lapis_ore = makeOre(P.lapis);
GENERATORS.emerald_ore = makeOre(P.emerald);
GENERATORS.copper_ore = makeOre(P.copper);

export function generateAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS; canvas.height = ATLAS;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, ATLAS, ATLAS);

  const slots = new Map();
  for (let i = 0; i < TEXTURE_NAMES.length; i++) {
    const name = TEXTURE_NAMES[i];
    const gx = i % GRID, gy = (i / GRID) | 0;
    slots.set(name, { gx, gy });
    const rng = mulberry32(hashString(name) ^ 0x9e3779b9);
    const tile = new Tile(ctx, gx * TILE, gy * TILE);
    (GENERATORS[name] || GENERATORS[MISSING_TEXTURE])(tile, rng);
    tile.commit();
  }

  const texture = new THREE.Texture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const inv = 1 / GRID;
  function uvOf(name) {
    const s = slots.get(name) || slots.get(MISSING_TEXTURE);
    return {
      u0: s.gx * inv,
      v0: 1 - (s.gy + 1) * inv,
      u1: (s.gx + 1) * inv,
      v1: 1 - s.gy * inv,
    };
  }

  return { texture, uvOf };
}
