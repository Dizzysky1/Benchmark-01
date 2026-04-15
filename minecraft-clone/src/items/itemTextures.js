// itemTextures.js
// Procedural pixel-art item icons for a Minecraft clone.
// Pure canvas, no external deps. All icons are 16x16 and deterministic.

const ICON_SIZE = 16;
const ICONS_PER_ROW = 16;

export const ITEM_ICON_NAMES = [
  'stick',
  'coal',
  'charcoal',
  'raw_iron',
  'iron_ingot',
  'raw_gold',
  'gold_ingot',
  'raw_copper',
  'copper_ingot',
  'diamond',
  'emerald',
  'lapis',
  'redstone',
  'clay_ball',
  'brick_item',
  'flint',
  'string',
  'feather',
  'leather',
  'bone',
  'gunpowder',
  'wooden_pickaxe', 'stone_pickaxe', 'iron_pickaxe', 'gold_pickaxe', 'diamond_pickaxe',
  'wooden_axe', 'stone_axe', 'iron_axe', 'gold_axe', 'diamond_axe',
  'wooden_shovel', 'stone_shovel', 'iron_shovel', 'gold_shovel', 'diamond_shovel',
  'wooden_sword', 'stone_sword', 'iron_sword', 'gold_sword', 'diamond_sword',
  'wooden_hoe', 'stone_hoe', 'iron_hoe', 'gold_hoe', 'diamond_hoe',
  'wheat_seeds',
  'wheat',
  'bread',
  'apple',
  'carrot',
  'potato',
  'baked_potato',
  'raw_beef',
  'cooked_beef',
  'raw_porkchop',
  'cooked_porkchop',
  'raw_chicken',
  'cooked_chicken',
  'raw_mutton',
  'cooked_mutton',
  'raw_fish',
  'cooked_fish',
  'mushroom_stew',
  'sugar',
  'egg',
  'oak_sapling',
  'birch_sapling',
  'spruce_sapling',
  'shears',
  'flint_and_steel',
  'bow',
  'arrow',
  'bucket',
  'water_bucket',
  'lava_bucket',
  'milk_bucket',
  'book',
  'paper',
  'ender_pearl',
  'blaze_rod',
  'slimeball',
];

const TIER_COLORS = {
  wooden:  ['#d8a04f', '#8c5e1f', '#4a2f08'],
  stone:   ['#c8c8c8', '#888888', '#424242'],
  iron:    ['#f0f0f5', '#b5b5bd', '#6b6b73'],
  gold:    ['#ffee4a', '#d6a416', '#7a5a08'],
  diamond: ['#b7f5ef', '#4ecbd6', '#1f6f85'],
};

const HANDLE_COLORS = ['#c68640', '#7a4d17', '#3a2206'];

function hashString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function px(ctx, ox, oy, x, y, color) {
  if (x < 0 || y < 0 || x >= ICON_SIZE || y >= ICON_SIZE) return;
  ctx.fillStyle = color;
  ctx.fillRect(ox + x, oy + y, 1, 1);
}

function rect(ctx, ox, oy, x, y, w, h, color) {
  ctx.fillStyle = color;
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= ICON_SIZE || yy >= ICON_SIZE) continue;
      ctx.fillRect(ox + xx, oy + yy, 1, 1);
    }
  }
}

function line(ctx, ox, oy, x0, y0, x1, y1, color) {
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, e2;
  let x = x0, y = y0;
  for (;;) {
    px(ctx, ox, oy, x, y, color);
    if (x === x1 && y === y1) break;
    e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

function outlineRect(ctx, ox, oy, x, y, w, h, color) {
  for (let i = 0; i < w; i++) {
    px(ctx, ox, oy, x + i, y, color);
    px(ctx, ox, oy, x + i, y + h - 1, color);
  }
  for (let i = 0; i < h; i++) {
    px(ctx, ox, oy, x, y + i, color);
    px(ctx, ox, oy, x + w - 1, y + i, color);
  }
}

function drawMap(ctx, ox, oy, map, palette) {
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === ' ' || ch === '.') continue;
      const color = palette[ch];
      if (color) px(ctx, ox, oy, x, y, color);
    }
  }
}

// -----------------------------------------------------------------------------
// Tool helpers: diagonal wooden handle + darker outlined head with shading
// -----------------------------------------------------------------------------

function drawHandle(ctx, ox, oy) {
  const [L, M, D] = HANDLE_COLORS;
  const pts = [
    [2, 14], [3, 13], [4, 12], [5, 11], [6, 10], [7, 9], [8, 8], [9, 7],
  ];
  for (const [x, y] of pts) {
    px(ctx, ox, oy, x, y, M);
  }
  px(ctx, ox, oy, 1, 15, D);
  px(ctx, ox, oy, 2, 15, M);
  px(ctx, ox, oy, 3, 14, L);
  px(ctx, ox, oy, 4, 13, L);
  px(ctx, ox, oy, 5, 12, L);
  px(ctx, ox, oy, 6, 11, L);
  px(ctx, ox, oy, 7, 10, L);
  px(ctx, ox, oy, 8, 9, L);
  px(ctx, ox, oy, 1, 14, D);
  px(ctx, ox, oy, 2, 13, D);
  px(ctx, ox, oy, 3, 12, D);
  px(ctx, ox, oy, 4, 11, D);
  px(ctx, ox, oy, 5, 10, D);
  px(ctx, ox, oy, 6, 9, D);
  px(ctx, ox, oy, 7, 8, D);
}

function drawPickaxeHead(ctx, ox, oy, tier) {
  const [L, M, D] = TIER_COLORS[tier];
  const body = [
    [4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],
    [4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[12,4],[13,4],[14,4],
    [8,5],[9,5],[10,5],
    [8,6],[9,6],
  ];
  for (const [x, y] of body) px(ctx, ox, oy, x, y, M);
  for (let x = 4; x <= 14; x++) px(ctx, ox, oy, x, 3, L);
  px(ctx, ox, oy, 3, 4, L);
  px(ctx, ox, oy, 3, 3, D);
  px(ctx, ox, oy, 15, 3, D);
  px(ctx, ox, oy, 4, 5, D);
  px(ctx, ox, oy, 14, 5, D);
  for (let x = 4; x <= 14; x++) px(ctx, ox, oy, x, 2, D);
  px(ctx, ox, oy, 4, 5, D);
  px(ctx, ox, oy, 5, 5, D);
  px(ctx, ox, oy, 11, 5, D);
  px(ctx, ox, oy, 12, 5, D);
  px(ctx, ox, oy, 13, 5, D);
  px(ctx, ox, oy, 14, 5, D);
  px(ctx, ox, oy, 8, 5, M);
  px(ctx, ox, oy, 9, 5, M);
  px(ctx, ox, oy, 10, 5, M);
  px(ctx, ox, oy, 8, 6, M);
  px(ctx, ox, oy, 9, 6, M);
  px(ctx, ox, oy, 7, 6, D);
  px(ctx, ox, oy, 10, 6, D);
  px(ctx, ox, oy, 8, 7, D);
  px(ctx, ox, oy, 9, 7, D);
}

function drawAxeHead(ctx, ox, oy, tier) {
  const [L, M, D] = TIER_COLORS[tier];
  const body = [
    [8,3],[9,3],[10,3],[11,3],[12,3],[13,3],
    [7,4],[8,4],[9,4],[10,4],[11,4],[12,4],[13,4],[14,4],
    [7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],
    [7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],
    [7,7],[8,7],[9,7],[10,7],[11,7],[12,7],
    [7,8],[8,8],[9,8],[10,8],[11,8],
    [8,9],[9,9],[10,9],
  ];
  for (const [x, y] of body) px(ctx, ox, oy, x, y, M);
  px(ctx, ox, oy, 8, 3, L);
  px(ctx, ox, oy, 9, 3, L);
  px(ctx, ox, oy, 7, 4, L);
  px(ctx, ox, oy, 8, 4, L);
  px(ctx, ox, oy, 7, 5, L);
  px(ctx, ox, oy, 7, 6, L);
  px(ctx, ox, oy, 14, 4, L);
  px(ctx, ox, oy, 14, 5, L);
  for (let x = 8; x <= 13; x++) px(ctx, ox, oy, x, 2, D);
  px(ctx, ox, oy, 14, 3, D);
  px(ctx, ox, oy, 15, 4, D);
  px(ctx, ox, oy, 15, 5, D);
  px(ctx, ox, oy, 14, 6, D);
  px(ctx, ox, oy, 13, 7, D);
  px(ctx, ox, oy, 12, 8, D);
  px(ctx, ox, oy, 11, 9, D);
  px(ctx, ox, oy, 10, 10, D);
  px(ctx, ox, oy, 8, 10, D);
  px(ctx, ox, oy, 9, 10, D);
  px(ctx, ox, oy, 7, 9, D);
  px(ctx, ox, oy, 6, 8, D);
  px(ctx, ox, oy, 6, 7, D);
  px(ctx, ox, oy, 6, 6, D);
  px(ctx, ox, oy, 6, 5, D);
  px(ctx, ox, oy, 6, 4, D);
  px(ctx, ox, oy, 7, 3, D);
}

function drawShovelHead(ctx, ox, oy, tier) {
  const [L, M, D] = TIER_COLORS[tier];
  const body = [
    [7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],
    [7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],
    [8,4],[9,4],[10,4],[11,4],[12,4],
    [8,5],[9,5],[10,5],[11,5],
    [9,6],[10,6],
    [9,7],
  ];
  for (const [x, y] of body) px(ctx, ox, oy, x, y, M);
  for (let x = 7; x <= 13; x++) px(ctx, ox, oy, x, 2, L);
  px(ctx, ox, oy, 7, 3, L);
  px(ctx, ox, oy, 8, 3, L);
  px(ctx, ox, oy, 8, 4, L);
  px(ctx, ox, oy, 9, 5, L);
  for (let x = 7; x <= 13; x++) px(ctx, ox, oy, x, 1, D);
  px(ctx, ox, oy, 6, 2, D);
  px(ctx, ox, oy, 14, 2, D);
  px(ctx, ox, oy, 6, 3, D);
  px(ctx, ox, oy, 14, 3, D);
  px(ctx, ox, oy, 7, 4, D);
  px(ctx, ox, oy, 13, 4, D);
  px(ctx, ox, oy, 7, 5, D);
  px(ctx, ox, oy, 12, 5, D);
  px(ctx, ox, oy, 8, 6, D);
  px(ctx, ox, oy, 11, 6, D);
  px(ctx, ox, oy, 8, 7, D);
  px(ctx, ox, oy, 10, 7, D);
  px(ctx, ox, oy, 9, 8, D);
}

function drawHoeHead(ctx, ox, oy, tier) {
  const [L, M, D] = TIER_COLORS[tier];
  const body = [
    [6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],
    [6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[12,4],[13,4],
    [6,5],[7,5],
    [6,6],[7,6],
  ];
  for (const [x, y] of body) px(ctx, ox, oy, x, y, M);
  for (let x = 6; x <= 13; x++) px(ctx, ox, oy, x, 3, L);
  px(ctx, ox, oy, 6, 4, L);
  px(ctx, ox, oy, 6, 5, L);
  for (let x = 6; x <= 13; x++) px(ctx, ox, oy, x, 2, D);
  px(ctx, ox, oy, 5, 3, D);
  px(ctx, ox, oy, 14, 3, D);
  px(ctx, ox, oy, 5, 4, D);
  px(ctx, ox, oy, 14, 4, D);
  px(ctx, ox, oy, 13, 5, D);
  px(ctx, ox, oy, 8, 5, D);
  px(ctx, ox, oy, 5, 5, D);
  px(ctx, ox, oy, 8, 6, D);
  px(ctx, ox, oy, 5, 6, D);
  px(ctx, ox, oy, 6, 7, D);
  px(ctx, ox, oy, 7, 7, D);
}

function drawSwordBlade(ctx, ox, oy, tier) {
  const [L, M, D] = TIER_COLORS[tier];
  const blade = [
    [11,3],[12,3],
    [10,4],[11,4],[12,4],
    [9,5],[10,5],[11,5],
    [8,6],[9,6],[10,6],
    [7,7],[8,7],[9,7],
    [6,8],[7,8],[8,8],
    [5,9],[6,9],[7,9],
    [4,10],[5,10],[6,10],
    [3,11],[4,11],[5,11],
    [3,12],[4,12],
  ];
  for (const [x, y] of blade) px(ctx, ox, oy, x, y, M);
  const highlights = [
    [12,3],[11,4],[10,5],[9,6],[8,7],[7,8],[6,9],[5,10],[4,11],
  ];
  for (const [x, y] of highlights) px(ctx, ox, oy, x, y, L);
  px(ctx, ox, oy, 13, 3, D);
  px(ctx, ox, oy, 13, 4, D);
  px(ctx, ox, oy, 12, 5, D);
  px(ctx, ox, oy, 11, 6, D);
  px(ctx, ox, oy, 10, 7, D);
  px(ctx, ox, oy, 9, 8, D);
  px(ctx, ox, oy, 8, 9, D);
  px(ctx, ox, oy, 7, 10, D);
  px(ctx, ox, oy, 6, 11, D);
  px(ctx, ox, oy, 5, 12, D);
  px(ctx, ox, oy, 11, 2, D);
  px(ctx, ox, oy, 12, 2, D);
  px(ctx, ox, oy, 10, 3, D);
  px(ctx, ox, oy, 9, 4, D);
  px(ctx, ox, oy, 8, 5, D);
  px(ctx, ox, oy, 7, 6, D);
  px(ctx, ox, oy, 6, 7, D);
  px(ctx, ox, oy, 5, 8, D);
  px(ctx, ox, oy, 4, 9, D);
  px(ctx, ox, oy, 3, 10, D);
  px(ctx, ox, oy, 2, 11, D);
  const [hL, hM, hD] = HANDLE_COLORS;
  px(ctx, ox, oy, 2, 12, hD);
  px(ctx, ox, oy, 3, 13, hM);
  px(ctx, ox, oy, 4, 13, hD);
  px(ctx, ox, oy, 2, 13, hD);
  px(ctx, ox, oy, 2, 14, hM);
  px(ctx, ox, oy, 1, 14, hD);
  px(ctx, ox, oy, 1, 15, hD);
  px(ctx, ox, oy, 2, 15, hD);
  px(ctx, ox, oy, 3, 14, hM);
}

// -----------------------------------------------------------------------------
// Raw materials
// -----------------------------------------------------------------------------

function drawStick(ctx, ox, oy) {
  const [L, M, D] = HANDLE_COLORS;
  const pts = [
    [3,13],[4,12],[5,11],[6,10],[7,9],[8,8],[9,7],[10,6],[11,5],[12,4],
  ];
  for (const [x, y] of pts) px(ctx, ox, oy, x, y, M);
  px(ctx, ox, oy, 2, 13, M);
  px(ctx, ox, oy, 3, 12, L);
  px(ctx, ox, oy, 4, 11, L);
  px(ctx, ox, oy, 5, 10, L);
  px(ctx, ox, oy, 6, 9, L);
  px(ctx, ox, oy, 7, 8, L);
  px(ctx, ox, oy, 8, 7, L);
  px(ctx, ox, oy, 9, 6, L);
  px(ctx, ox, oy, 10, 5, L);
  px(ctx, ox, oy, 11, 4, L);
  px(ctx, ox, oy, 12, 3, L);
  px(ctx, ox, oy, 4, 13, D);
  px(ctx, ox, oy, 5, 12, D);
  px(ctx, ox, oy, 6, 11, D);
  px(ctx, ox, oy, 7, 10, D);
  px(ctx, ox, oy, 8, 9, D);
  px(ctx, ox, oy, 9, 8, D);
  px(ctx, ox, oy, 10, 7, D);
  px(ctx, ox, oy, 11, 6, D);
  px(ctx, ox, oy, 12, 5, D);
  px(ctx, ox, oy, 13, 4, D);
  px(ctx, ox, oy, 2, 14, D);
  px(ctx, ox, oy, 13, 3, D);
}

function drawCoal(ctx, ox, oy) {
  const D = '#0d0d10', M = '#1e1e22', L = '#353540', H = '#5a5a68';
  const body = [
    '..DDDD..',
    '.DMMMMD.',
    'DMMMMMMD',
    'DMLMMLMD',
    'DMMLMMMD',
    'DMMMMMMD',
    '.DMMMMD.',
    '..DDDD..',
  ];
  const palette = { D, M, L, H };
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const ch = body[y][x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 4 + x, 3 + y, palette[ch]);
    }
  }
  const map = [
    '..DDDDDD...DDD..',
    '.DMMMMMMD.DMMMD.',
    'DMMLMMMMMDMLMMD.',
    'DMLMMMLMMMMMMMD.',
    'DMMMMMMMMLMMMMD.',
    'DMMHMMMMMMMMMMD.',
    'DMMMMMMLMMMMMMD.',
    '.DMMLMMMMMMMMD..',
    '.DMMMMMMMMMLD...',
    '..DDMMMMMMMD....',
    '....DDMMMMD.....',
    '......DDDD......',
  ];
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, x, 2 + y, palette[ch]);
    }
  }
}

function drawCharcoal(ctx, ox, oy) {
  const D = '#050508', M = '#121216', L = '#24242a';
  const palette = { D, M, L };
  const map = [
    '..DDDDDD...DDD..',
    '.DMMMMMMD.DMMMD.',
    'DMMLMMMMMDMMMMD.',
    'DMMMMMMMMMMLMMD.',
    'DMMMMMMMMMMMMMD.',
    'DMLMMMMMMMMMMMD.',
    'DMMMMMMLMMMMMMD.',
    '.DMMMMMMMMMMMD..',
    '.DMMMMMMMMMMLD..',
    '..DDMMMMMMMD....',
    '....DDMMMMD.....',
    '......DDDD......',
  ];
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, x, 2 + y, palette[ch]);
    }
  }
}

function drawRawIron(ctx, ox, oy) {
  const D = '#3a2c18', M = '#8a6a3a', L = '#b88a50', G = '#9898a0', GD = '#5e5e66';
  const palette = { D, M, L, G, K: GD };
  const map = [
    '..DDDDDD..',
    '.DMMLMMMD.',
    'DMLLMGGMD.',
    'DMMLMGKMD.',
    'DMLMMMLMD.',
    'DMMMGGMMD.',
    'DMLMGMMMD.',
    '.DMMMLMD..',
    '..DDMMDD..',
    '...DDDD...',
  ];
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 3 + x, 3 + y, palette[ch]);
    }
  }
}

function drawIngotShape(ctx, ox, oy, palette) {
  const { L, M, D } = palette;
  const map = [
    '..LLLLLLLL..',
    '.DLLLLLLLLD.',
    'DLMMMMMMMMLD',
    'DLMMMMMMMMLD',
    'DDMMMMMMMMDD',
    '.DDMMMMMMDD.',
    '..DDDDDDDD..',
  ];
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 2 + x, 4 + y, { L, M, D }[ch]);
    }
  }
}

function drawIronIngot(ctx, ox, oy) {
  drawIngotShape(ctx, ox, oy, { L: '#f5f5fa', M: '#b8b8c0', D: '#5a5a62' });
}

function drawRawGold(ctx, ox, oy) {
  const D = '#4b2d08', M = '#c08018', L = '#f0b838', K = '#8a5c10';
  const palette = { D, M, L, K };
  const map = [
    '..DDDDDD..',
    '.DMMLMMMD.',
    'DMLLMKKMD.',
    'DMMLMKLMD.',
    'DMLMMMLMD.',
    'DMMMKKMMD.',
    'DMLMKMMMD.',
    '.DMMMLMD..',
    '..DDMMDD..',
    '...DDDD...',
  ];
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 3 + x, 3 + y, palette[ch]);
    }
  }
}

function drawGoldIngot(ctx, ox, oy) {
  drawIngotShape(ctx, ox, oy, { L: '#fff06a', M: '#d8a416', D: '#6a4808' });
}

function drawRawCopper(ctx, ox, oy) {
  const D = '#4a1a06', M = '#c06028', L = '#e88848', K = '#883a14';
  const palette = { D, M, L, K };
  const map = [
    '..DDDDDD..',
    '.DMMLMMMD.',
    'DMLLMKKMD.',
    'DMMLMKLMD.',
    'DMLMMMLMD.',
    'DMMMKKMMD.',
    'DMLMKMMMD.',
    '.DMMMLMD..',
    '..DDMMDD..',
    '...DDDD...',
  ];
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 3 + x, 3 + y, palette[ch]);
    }
  }
}

function drawCopperIngot(ctx, ox, oy) {
  drawIngotShape(ctx, ox, oy, { L: '#ffa860', M: '#cc6a28', D: '#5a280a' });
}

function drawGemRhombus(ctx, ox, oy, palette) {
  const { L, M, D, H } = palette;
  const map = [
    '......DD......',
    '.....DMMD.....',
    '....DMMMMD....',
    '...DMMHHMMD...',
    '..DMMHLLHMMD..',
    '.DMMMHLLHMMMD.',
    'DMMMMMLLMMMMMD',
    '.DMMMMLLMMMMD.',
    '..DMMMMMMMMD..',
    '...DMMMMMMD...',
    '....DMMMMD....',
    '.....DMMD.....',
    '......DD......',
  ];
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 1 + x, 1 + y, { L, M, D, H }[ch]);
    }
  }
}

function drawDiamond(ctx, ox, oy) {
  drawGemRhombus(ctx, ox, oy, {
    L: '#e6ffff',
    M: '#5ec8d8',
    D: '#154a60',
    H: '#9ff0f6',
  });
}

function drawEmerald(ctx, ox, oy) {
  drawGemRhombus(ctx, ox, oy, {
    L: '#c8ffb8',
    M: '#2fb44a',
    D: '#0a4a14',
    H: '#78e880',
  });
}

function drawLapis(ctx, ox, oy) {
  const D = '#0a1450', M = '#1e3ca0', L = '#4a6eda', H = '#8aa8ff';
  const chunk = (cx, cy) => {
    px(ctx, ox, oy, cx, cy - 1, D);
    px(ctx, ox, oy, cx + 1, cy - 1, D);
    px(ctx, ox, oy, cx - 1, cy, D);
    px(ctx, ox, oy, cx, cy, L);
    px(ctx, ox, oy, cx + 1, cy, M);
    px(ctx, ox, oy, cx + 2, cy, D);
    px(ctx, ox, oy, cx - 1, cy + 1, D);
    px(ctx, ox, oy, cx, cy + 1, M);
    px(ctx, ox, oy, cx + 1, cy + 1, M);
    px(ctx, ox, oy, cx + 2, cy + 1, D);
    px(ctx, ox, oy, cx, cy + 2, D);
    px(ctx, ox, oy, cx + 1, cy + 2, D);
  };
  chunk(3, 5);
  chunk(9, 4);
  chunk(6, 10);
  px(ctx, ox, oy, 3, 4, H);
  px(ctx, ox, oy, 9, 3, H);
  px(ctx, ox, oy, 6, 9, H);
}

function drawRedstone(ctx, ox, oy) {
  const D = '#3a0400', M = '#b01a10', L = '#ff3820', H = '#ff7860';
  const pts = [
    [3, 6, L], [4, 6, M], [4, 5, H],
    [7, 3, L], [8, 3, M], [8, 4, M],
    [11, 6, L], [12, 6, H], [12, 7, M],
    [5, 10, L], [5, 11, M], [6, 10, H],
    [10, 11, L], [11, 11, M], [11, 10, H],
    [8, 8, L], [9, 8, H], [8, 9, M],
    [6, 4, M], [10, 5, M], [4, 9, M],
    [10, 9, M], [7, 12, M], [3, 7, D],
    [5, 6, D], [6, 3, D], [9, 3, D],
    [9, 4, D], [12, 5, D], [13, 6, D],
    [13, 7, D], [4, 10, D], [4, 11, D],
    [6, 11, D], [6, 12, D], [9, 11, D],
    [11, 12, D], [12, 11, D], [10, 12, D],
    [7, 7, D], [10, 8, D], [9, 9, D],
    [7, 4, D], [8, 2, D], [3, 5, D],
    [2, 6, D], [13, 5, D], [14, 6, D],
  ];
  for (const [x, y, c] of pts) px(ctx, ox, oy, x, y, c);
}

// -----------------------------------------------------------------------------
// Misc raw
// -----------------------------------------------------------------------------

function drawClayBall(ctx, ox, oy) {
  const D = '#5a6a78', M = '#9cb0c0', L = '#c8d8e0', H = '#e6f0f5';
  const palette = { D, M, L, H };
  const map = [
    '..DDDDDD..',
    '.DMMMMMMD.',
    'DMMLHHMMMD',
    'DMLHHLMMMD',
    'DMMLLLMMMD',
    'DMMMMMMMMD',
    'DMMMMMMMMD',
    '.DMMMMMMD.',
    '..DDDDDD..',
  ];
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 3 + x, 3 + y, palette[ch]);
    }
  }
}

function drawBrickItem(ctx, ox, oy) {
  const D = '#3a1408', M = '#a04020', L = '#c86040', Mo = '#e0c8a0';
  rect(ctx, ox, oy, 2, 5, 12, 6, M);
  outlineRect(ctx, ox, oy, 2, 5, 12, 6, D);
  for (let x = 3; x <= 12; x++) px(ctx, ox, oy, x, 6, L);
  for (let x = 3; x <= 12; x++) px(ctx, ox, oy, x, 9, D);
  for (let x = 3; x <= 12; x++) px(ctx, ox, oy, x, 8, Mo);
  for (let x = 3; x <= 12; x++) px(ctx, ox, oy, x, 7, M);
}

function drawFlint(ctx, ox, oy) {
  const D = '#1a1a22', M = '#3a3a48', L = '#5e5e70', H = '#8888a0';
  const map = [
    '...DDDDD...',
    '..DMMMMMD..',
    '.DMMHLMMMD.',
    'DMMLHLMMMMD',
    'DMLLLMMMMMD',
    'DMMMMMMMMMD',
    '.DMMMMMMMD.',
    '..DMMMMMD..',
    '...DDDDD...',
  ];
  const palette = { D, M, L, H };
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 2 + x, 3 + y, palette[ch]);
    }
  }
}

function drawString(ctx, ox, oy) {
  const D = '#8a8a8a', L = '#f0f0f0', M = '#c8c8c8';
  const pts = [
    [2,2],[3,3],[4,4],[5,5],[4,6],[3,7],[4,8],[5,9],[6,10],[7,11],[8,12],[9,13],[10,12],[11,11],[12,10],[13,9],[12,8],[11,7],[10,6],[11,5],[12,4],[13,3],
  ];
  for (const [x, y] of pts) px(ctx, ox, oy, x, y, L);
  for (const [x, y] of pts) {
    px(ctx, ox, oy, x, y + 1, D);
  }
  for (const [x, y] of pts) px(ctx, ox, oy, x - 1, y, M);
}

function drawFeather(ctx, ox, oy) {
  const D = '#9a9a8a', M = '#e8e8d8', L = '#ffffff', S = '#6a6a5a';
  const spine = [
    [10,2],[10,3],[9,4],[9,5],[8,6],[8,7],[7,8],[7,9],[6,10],[6,11],[5,12],[5,13],
  ];
  for (const [x, y] of spine) px(ctx, ox, oy, x, y, S);
  const barbs = [
    [11,3,M],[11,4,M],[10,4,L],[10,5,L],
    [11,5,M],[10,6,L],[9,6,L],
    [11,6,D],[11,7,M],[10,7,L],[9,7,L],
    [10,8,L],[9,8,L],[8,8,L],
    [10,9,M],[9,9,L],[8,9,L],
    [9,10,L],[8,10,L],[7,10,L],
    [9,11,M],[8,11,L],[7,11,L],
    [8,12,L],[7,12,L],[6,12,L],
    [7,13,L],[6,13,L],
    [6,14,M],[5,14,M],
    [4,13,D],[4,14,D],
    [5,2,D],[6,3,D],
  ];
  for (const [x, y, c] of barbs) px(ctx, ox, oy, x, y, c);
  px(ctx, ox, oy, 11, 2, D);
  px(ctx, ox, oy, 9, 3, M);
  px(ctx, ox, oy, 8, 4, M);
  px(ctx, ox, oy, 7, 5, M);
  px(ctx, ox, oy, 6, 6, M);
  px(ctx, ox, oy, 5, 7, M);
  px(ctx, ox, oy, 4, 8, M);
  px(ctx, ox, oy, 3, 9, M);
  px(ctx, ox, oy, 3, 10, M);
  px(ctx, ox, oy, 4, 11, M);
  px(ctx, ox, oy, 4, 12, M);
}

function drawLeather(ctx, ox, oy) {
  const D = '#3a1e08', M = '#8a4a18', L = '#b06820', S = '#e8c878';
  rect(ctx, ox, oy, 2, 3, 12, 11, M);
  outlineRect(ctx, ox, oy, 2, 3, 12, 11, D);
  for (let x = 3; x <= 12; x++) px(ctx, ox, oy, x, 4, L);
  for (let y = 5; y <= 12; y++) px(ctx, ox, oy, 3, y, L);
  px(ctx, ox, oy, 3, 6, S); px(ctx, ox, oy, 3, 10, S);
  px(ctx, ox, oy, 12, 6, S); px(ctx, ox, oy, 12, 10, S);
  px(ctx, ox, oy, 5, 3, S); px(ctx, ox, oy, 8, 3, S); px(ctx, ox, oy, 11, 3, S);
  px(ctx, ox, oy, 5, 13, S); px(ctx, ox, oy, 8, 13, S); px(ctx, ox, oy, 11, 13, S);
  for (let x = 5; x <= 11; x += 2) px(ctx, ox, oy, x, 8, D);
}

function drawBone(ctx, ox, oy) {
  const D = '#a0a090', M = '#e0e0d0', L = '#ffffff';
  const map = [
    '.DD.......DD.',
    'DMMD.....DMMD',
    'DMMMD...DMMMD',
    '.DMMMDDDMMMD.',
    '..DMMMMMMMD..',
    '...DMMMMMD...',
    '..DMMMMMMMD..',
    '.DMMMDDDMMMD.',
    'DMMMD...DMMMD',
    'DMMD.....DMMD',
    '.DD.......DD.',
  ];
  const palette = { D, M, L };
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 1 + x, 2 + y, palette[ch]);
    }
  }
  for (let x = 3; x <= 11; x++) px(ctx, ox, oy, x, 7, L);
}

function drawGunpowder(ctx, ox, oy) {
  const D = '#1a1a1e', M = '#555560', L = '#9090a0', H = '#c0c0d0';
  const pts = [
    [3,5,L],[4,5,M],[4,6,M],[3,6,D],
    [6,3,L],[7,3,H],[7,4,M],[6,4,D],
    [10,5,L],[11,5,M],[11,6,D],[12,6,D],
    [5,8,M],[6,8,L],[6,9,M],[5,9,D],
    [9,9,M],[10,9,H],[10,10,M],[9,10,D],
    [4,11,M],[5,11,L],[5,12,M],[4,12,D],
    [11,11,M],[12,11,L],[12,12,D],[11,12,M],
    [7,12,L],[8,12,M],[7,13,D],[8,13,D],
    [8,6,L],[9,6,M],[8,7,M],[9,7,L],
    [2,8,D],[13,8,D],[6,6,M],[13,9,M],[2,10,L],
  ];
  for (const [x, y, c] of pts) px(ctx, ox, oy, x, y, c);
}

// -----------------------------------------------------------------------------
// Food
// -----------------------------------------------------------------------------

function drawWheatSeeds(ctx, ox, oy) {
  const D = '#3a1a06', M = '#8a5a18', L = '#c08030';
  const seed = (cx, cy) => {
    px(ctx, ox, oy, cx, cy, M);
    px(ctx, ox, oy, cx + 1, cy, M);
    px(ctx, ox, oy, cx, cy + 1, L);
    px(ctx, ox, oy, cx + 1, cy + 1, M);
    px(ctx, ox, oy, cx, cy + 2, M);
    px(ctx, ox, oy, cx - 1, cy + 1, D);
    px(ctx, ox, oy, cx + 2, cy + 1, D);
    px(ctx, ox, oy, cx, cy - 1, D);
    px(ctx, ox, oy, cx + 1, cy - 1, D);
    px(ctx, ox, oy, cx, cy + 3, D);
    px(ctx, ox, oy, cx + 1, cy + 3, D);
  };
  seed(4, 4);
  seed(9, 4);
  seed(7, 10);
}

function drawWheat(ctx, ox, oy) {
  const D = '#4a2a06', M = '#c08020', L = '#f0d050', S = '#7a5010';
  for (let y = 3; y <= 13; y++) px(ctx, ox, oy, 8, y, S);
  for (let y = 3; y <= 13; y++) px(ctx, ox, oy, 5, y, S);
  for (let y = 3; y <= 13; y++) px(ctx, ox, oy, 11, y, S);
  const head = (cx) => {
    px(ctx, ox, oy, cx, 2, D);
    px(ctx, ox, oy, cx - 1, 3, M);
    px(ctx, ox, oy, cx, 3, L);
    px(ctx, ox, oy, cx + 1, 3, M);
    px(ctx, ox, oy, cx - 1, 4, L);
    px(ctx, ox, oy, cx, 4, L);
    px(ctx, ox, oy, cx + 1, 4, L);
    px(ctx, ox, oy, cx - 1, 5, M);
    px(ctx, ox, oy, cx, 5, L);
    px(ctx, ox, oy, cx + 1, 5, M);
    px(ctx, ox, oy, cx, 6, M);
  };
  head(5); head(8); head(11);
  for (let y = 7; y <= 12; y += 2) {
    px(ctx, ox, oy, 4, y, M);
    px(ctx, ox, oy, 6, y, M);
    px(ctx, ox, oy, 7, y, M);
    px(ctx, ox, oy, 9, y, M);
    px(ctx, ox, oy, 10, y, M);
    px(ctx, ox, oy, 12, y, M);
  }
  px(ctx, ox, oy, 4, 13, D);
  px(ctx, ox, oy, 12, 13, D);
}

function drawBread(ctx, ox, oy) {
  const D = '#3a1a06', M = '#a06028', L = '#d89048', H = '#f0c070';
  const map = [
    '..DDDDDDDDDD..',
    '.DMLLLLLLLLMD.',
    'DMLHLLHHLLHLMD',
    'DMLLHLLHLLLLMD',
    'DMLLLHLLHLLLMD',
    'DMLHLLLHLLHLMD',
    'DMLLLHLLLLLLMD',
    'DMMMMMMMMMMMMD',
    '.DMMMMMMMMMMD.',
    '..DDDDDDDDDD..',
  ];
  const palette = { D, M, L, H };
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 1 + x, 3 + y, palette[ch]);
    }
  }
}

function drawApple(ctx, ox, oy) {
  const D = '#4a0a06', M = '#c81818', L = '#f04830', H = '#ff8060';
  const GD = '#0a4a10', G = '#2a8a20', GL = '#60c038';
  const map = [
    '....DDDDDD....',
    '...DMMMMMMD...',
    '..DMLLHMMMMD..',
    '.DMLLHHMMMMMD.',
    'DMLHHMMMMMMMMD',
    'DMLMMMMMMMMMMD',
    'DMMMMMMMMMMMMD',
    'DMMMMMMMMMMMMD',
    '.DMMMMMMMMMMD.',
    '.DMMMMMMMMMMD.',
    '..DMMMMMMMMD..',
    '...DDDMDDDD...',
  ];
  const palette = { D, M, L, H };
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 1 + x, 3 + y, palette[ch]);
    }
  }
  px(ctx, ox, oy, 8, 1, GD);
  px(ctx, ox, oy, 9, 1, G);
  px(ctx, ox, oy, 10, 2, GL);
  px(ctx, ox, oy, 9, 2, G);
  px(ctx, ox, oy, 11, 2, GD);
  px(ctx, ox, oy, 8, 2, GD);
  px(ctx, ox, oy, 7, 2, '#3a1a06');
  px(ctx, ox, oy, 7, 1, '#3a1a06');
}

function drawCarrot(ctx, ox, oy) {
  const D = '#4a1a04', M = '#d06020', L = '#f08838', H = '#ffa860';
  const GD = '#0a3a08', G = '#208830', GL = '#40c040';
  const leaves = [
    [5,0,G],[6,0,GL],[7,0,G],[8,0,GL],[9,0,G],[10,0,G],
    [4,1,GD],[5,1,G],[6,1,GL],[7,1,GL],[8,1,G],[9,1,GL],[10,1,G],[11,1,GD],
    [5,2,GD],[6,2,G],[7,2,G],[8,2,GL],[9,2,G],[10,2,GD],
    [7,3,G],[8,3,G],
  ];
  for (const [x, y, c] of leaves) px(ctx, ox, oy, x, y, c);
  const carrot = [
    '..DDDDDD..',
    '.DMLLHLMD.',
    '.DMLHLMMD.',
    '.DMLLLMMD.',
    '..DMLLMD..',
    '..DMLLMD..',
    '...DMMD...',
    '...DMMD...',
    '....DMD...',
    '....DMD...',
    '.....DD...',
    '.....DD...',
  ];
  const palette = { D, M, L, H };
  for (let y = 0; y < carrot.length; y++) {
    const row = carrot[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 3 + x, 3 + y, palette[ch]);
    }
  }
}

function drawPotato(ctx, ox, oy) {
  const D = '#3a2a0a', M = '#a88850', L = '#d0b078', H = '#e8d0a0';
  const map = [
    '..DDDDDDDD..',
    '.DMMLLMMMMD.',
    'DMLHHLMMMMMD',
    'DMMLLMMMHMMD',
    'DMMMMMMMMMMD',
    'DMHMMMMMMLMD',
    'DMMMMMMHMMMD',
    'DMMLMMMMMMMD',
    '.DMMMMHMMMD.',
    '..DDMMMMDD..',
    '...DDDDDD...',
  ];
  const palette = { D, M, L, H };
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 2 + x, 3 + y, palette[ch]);
    }
  }
}

function drawBakedPotato(ctx, ox, oy) {
  const D = '#1a0a04', M = '#6a4018', L = '#8a5a28', H = '#b88040';
  const B = '#f0d020', BL = '#ffe868';
  const map = [
    '..DDDDDDDD..',
    '.DMMLMMMMMD.',
    'DMLHMMMMMMMD',
    'DMMMMBMMMMMD',
    'DMMBBBBBMMMD',
    'DMMBBLMBMMMD',
    'DMMBBBBBMMMD',
    'DMLMMBMMMMLD',
    '.DMMMMMMMMD.',
    '..DDMMMMDD..',
    '...DDDDDD...',
  ];
  const palette = { D, M, L, H, B };
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 2 + x, 3 + y, palette[ch]);
    }
  }
  px(ctx, ox, oy, 7, 8, BL);
  px(ctx, ox, oy, 8, 8, BL);
  for (let x = 6; x <= 9; x++) px(ctx, ox, oy, x, 9, D);
}

function drawMeatBlob(ctx, ox, oy, palette, speckleCh) {
  const { D, M, L, H, S } = palette;
  const map = [
    '..DDDDDDDD..',
    '.DMMLLMMMMD.',
    'DMLHHMMSMMMD',
    'DMMLHMMMSMMD',
    'DMMMMMSMMLMD',
    'DMMSMMMMMMMD',
    'DMLMMMSMMMMD',
    'DMMMSMMMMLMD',
    '.DMSMMMMMMD.',
    '..DDMMMMDD..',
    '...DDDDDD...',
  ];
  const pal = { D, M, L, H, S };
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 2 + x, 3 + y, pal[ch]);
    }
  }
}

function drawRawBeef(ctx, ox, oy) {
  drawMeatBlob(ctx, ox, oy, {
    D: '#3a0408', M: '#b0202a', L: '#d04050', H: '#e8607a', S: '#6a0a10',
  });
}

function drawCookedBeef(ctx, ox, oy) {
  drawMeatBlob(ctx, ox, oy, {
    D: '#1a0a04', M: '#6a3818', L: '#8a5028', H: '#a86838', S: '#2a0a04',
  });
}

function drawDrumstick(ctx, ox, oy, palette) {
  const { D, M, L, H, B } = palette;
  const map = [
    '........DDDD.',
    '.......DBBBBD',
    '......DBBHBBD',
    '......DBBBBD.',
    '.....DDBBBD..',
    '....DMDDDD...',
    '...DMMMDD....',
    '..DMLLMMMD...',
    '.DMLHLMMMMD..',
    '.DMLHHLMMMD..',
    'DMMLLHLMMMMD.',
    'DMMMLLMMMMMD.',
    '.DMMMMMMMMMD.',
    '.DDMMMMMMMDD.',
    '..DDDDDDDDD..',
  ];
  const pal = { D, M, L, H, B };
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 1 + x, 1 + y, pal[ch]);
    }
  }
}

function drawRawChicken(ctx, ox, oy) {
  drawDrumstick(ctx, ox, oy, {
    D: '#5a2018', M: '#d08878', L: '#e8b0a0', H: '#f8d0c0', B: '#f0e8d0',
  });
}

function drawCookedChicken(ctx, ox, oy) {
  drawDrumstick(ctx, ox, oy, {
    D: '#2a1004', M: '#9a5820', L: '#c07828', H: '#e0a040', B: '#f0e0b0',
  });
}

function drawPorkchopShape(ctx, ox, oy, palette) {
  const { D, M, L, H, B, BD } = palette;
  const map = [
    '..DDDDDDDD..',
    '.DMMLLMMMMD.',
    'DMLHHMBBMMD.',
    'DMMLMBBBBMD.',
    'DMMMMBHBMMD.',
    'DMMMMBBBMMD.',
    'DMLMMMBMMMD.',
    'DMMMMMMMMLD.',
    '.DMMMMMMMD..',
    '..DDMMMMDD..',
    '...DDDDDD...',
  ];
  const pal = { D, M, L, H, B, K: BD };
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 2 + x, 3 + y, pal[ch]);
    }
  }
}

function drawRawPorkchop(ctx, ox, oy) {
  drawPorkchopShape(ctx, ox, oy, {
    D: '#6a1020', M: '#e86878', L: '#f08898', H: '#f8a8b8', B: '#f0e0c8', BD: '#a08060',
  });
}

function drawCookedPorkchop(ctx, ox, oy) {
  drawPorkchopShape(ctx, ox, oy, {
    D: '#2a0a04', M: '#8a4820', L: '#a86028', H: '#c87838', B: '#e8d0a0', BD: '#605040',
  });
}

function drawRawMutton(ctx, ox, oy) {
  drawMeatBlob(ctx, ox, oy, {
    D: '#2a0004', M: '#8a1018', L: '#b02028', H: '#c84050', S: '#400408',
  });
}

function drawCookedMutton(ctx, ox, oy) {
  drawMeatBlob(ctx, ox, oy, {
    D: '#1a0804', M: '#5a2810', L: '#7a3818', H: '#985028', S: '#2a0a04',
  });
}

function drawFishShape(ctx, ox, oy, palette) {
  const { D, M, L, H, E } = palette;
  const map = [
    '...DDDDDD....DD.',
    '..DMMLLMD...DMMD',
    '.DMLHHLMMD.DMMLD',
    'DMLHHLMMMMDMMMD.',
    'DMLHLMMMEMDMLD..',
    'DMLLMMMMMMMMD...',
    'DMLMMMMMMMMD....',
    '.DMLMMMMMMD.....',
    '..DMMMMMMD......',
    '...DMMMMD.......',
    '....DDDD........',
  ];
  const pal = { D, M, L, H, E };
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, x, 3 + y, pal[ch]);
    }
  }
}

function drawRawFish(ctx, ox, oy) {
  drawFishShape(ctx, ox, oy, {
    D: '#0a1830', M: '#4a6890', L: '#78a0c0', H: '#a8c8e0', E: '#ffffff',
  });
}

function drawCookedFish(ctx, ox, oy) {
  drawFishShape(ctx, ox, oy, {
    D: '#2a0a04', M: '#a05820', L: '#c07838', H: '#e0a058', E: '#ffffff',
  });
}

function drawMushroomStew(ctx, ox, oy) {
  const D = '#2a1a04', M = '#6a4018', L = '#8a5828', S = '#4a2810';
  const BD = '#3a0404', BM = '#b02020', BL = '#e04040';
  rect(ctx, ox, oy, 2, 7, 12, 6, M);
  outlineRect(ctx, ox, oy, 2, 7, 12, 6, D);
  for (let x = 3; x <= 12; x++) px(ctx, ox, oy, x, 8, L);
  for (let x = 3; x <= 12; x++) px(ctx, ox, oy, x, 12, S);
  px(ctx, ox, oy, 1, 8, D);
  px(ctx, ox, oy, 14, 8, D);
  px(ctx, ox, oy, 1, 9, D);
  px(ctx, ox, oy, 14, 9, D);
  px(ctx, ox, oy, 2, 13, D);
  px(ctx, ox, oy, 13, 13, D);
  for (let x = 4; x <= 11; x++) px(ctx, ox, oy, x, 5, BM);
  for (let x = 4; x <= 11; x++) px(ctx, ox, oy, x, 6, BM);
  for (let x = 5; x <= 10; x++) px(ctx, ox, oy, x, 4, BM);
  px(ctx, ox, oy, 5, 5, BL);
  px(ctx, ox, oy, 6, 4, BL);
  px(ctx, ox, oy, 9, 5, BL);
  for (let x = 4; x <= 11; x++) px(ctx, ox, oy, x, 7, BD);
  px(ctx, ox, oy, 3, 6, BD);
  px(ctx, ox, oy, 12, 6, BD);
  px(ctx, ox, oy, 4, 5, BD);
  px(ctx, ox, oy, 11, 5, BD);
  px(ctx, ox, oy, 5, 4, BD);
  px(ctx, ox, oy, 10, 4, BD);
  px(ctx, ox, oy, 6, 3, BD);
  px(ctx, ox, oy, 9, 3, BD);
  for (let x = 7; x <= 8; x++) px(ctx, ox, oy, x, 3, BD);
  px(ctx, ox, oy, 7, 6, '#f8f0d0');
  px(ctx, ox, oy, 8, 6, '#f8f0d0');
}

function drawSugar(ctx, ox, oy) {
  const D = '#8080a0', M = '#e0e0f0', L = '#ffffff';
  const pts = [
    [4,10,M],[5,10,L],[5,11,M],[4,11,M],[3,11,D],
    [6,9,M],[7,9,L],[7,10,M],[6,10,D],
    [8,10,L],[9,10,M],[9,11,M],[8,11,D],
    [10,9,L],[11,9,M],[11,10,M],[10,10,D],
    [5,12,L],[6,12,M],[7,12,M],[6,13,D],[7,13,D],
    [8,12,M],[9,12,L],[9,13,D],[10,12,M],
    [3,12,D],[11,12,D],[10,13,D],[4,13,D],[5,13,D],
    [7,8,L],[8,8,M],[6,8,D],[9,8,D],
    [4,9,D],[11,11,D],[2,11,D],[12,10,D],[12,11,D],
    [8,9,M],[5,9,M],[9,9,M],[6,11,L],[8,11,L],
  ];
  for (const [x, y, c] of pts) px(ctx, ox, oy, x, y, c);
}

function drawEgg(ctx, ox, oy) {
  const D = '#8a7050', M = '#f0e0c0', L = '#ffffff', S = '#a08060';
  const map = [
    '....DDDD....',
    '...DMMMMD...',
    '..DMLLLMMD..',
    '.DMLLLMMMMD.',
    'DMLLLMMMMMMD',
    'DMLLMMMMMSMD',
    'DMLMMMMMMMMD',
    'DMMMMSMMMMMD',
    '.DMMMMMMMMD.',
    '.DMMMMSMMMD.',
    '..DDMMMMDD..',
    '...DDDDDD...',
  ];
  const palette = { D, M, L, S };
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 2 + x, 2 + y, palette[ch]);
    }
  }
}

// -----------------------------------------------------------------------------
// Misc
// -----------------------------------------------------------------------------

function drawSapling(ctx, ox, oy, trunkColors, leafColors, shape) {
  const [TL, TM, TD] = trunkColors;
  const [LL, LM, LD] = leafColors;
  if (shape === 'cone') {
    const map = [
      '......LD......',
      '.....LMLD.....',
      '....LMMMLD....',
      '....LMLMLD....',
      '...LMMMMMLD...',
      '..LMMMLMMMLD..',
      '..LMMMMMMMLD..',
      '.LMMLMMMMMMLD.',
      '.LMMMMMMMMMLD.',
    ];
    const palette = { L: LL, M: LM, D: LD };
    for (let y = 0; y < map.length; y++) {
      const row = map[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.') continue;
        px(ctx, ox, oy, 1 + x, 1 + y, palette[ch]);
      }
    }
  } else {
    const map = [
      '...DLLLLLD...',
      '..DLMMLMMLD..',
      '.DLMMMMMMMLD.',
      '.DMMLMMLMMLD.',
      'DLMMMMMMMMMLD',
      'DLMLMMLMMMMLD',
      '.DLMMMMMMMLD.',
      '..DLMMLMMLD..',
      '...DDLLLDD...',
    ];
    const palette = { L: LL, M: LM, D: LD };
    for (let y = 0; y < map.length; y++) {
      const row = map[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.') continue;
        px(ctx, ox, oy, 1 + x, 1 + y, palette[ch]);
      }
    }
  }
  px(ctx, ox, oy, 7, 11, TD);
  px(ctx, ox, oy, 7, 12, TD);
  px(ctx, ox, oy, 7, 13, TD);
  px(ctx, ox, oy, 7, 14, TD);
  px(ctx, ox, oy, 8, 11, TM);
  px(ctx, ox, oy, 8, 12, TM);
  px(ctx, ox, oy, 8, 13, TM);
  px(ctx, ox, oy, 8, 14, TM);
  px(ctx, ox, oy, 9, 11, TL);
  px(ctx, ox, oy, 9, 12, TL);
  px(ctx, ox, oy, 9, 13, TL);
  px(ctx, ox, oy, 9, 14, TL);
  px(ctx, ox, oy, 6, 14, TD);
  px(ctx, ox, oy, 10, 14, TD);
  px(ctx, ox, oy, 7, 15, TD);
  px(ctx, ox, oy, 8, 15, TD);
  px(ctx, ox, oy, 9, 15, TD);
}

function drawOakSapling(ctx, ox, oy) {
  drawSapling(ctx, ox, oy,
    ['#9a6a28', '#6a4818', '#3a2808'],
    ['#a0e060', '#4ca028', '#1a5a0a'],
    'blob');
}

function drawBirchSapling(ctx, ox, oy) {
  drawSapling(ctx, ox, oy,
    ['#ffffff', '#e8e8d8', '#8a8a70'],
    ['#c8f080', '#78c048', '#306a18'],
    'blob');
}

function drawSpruceSapling(ctx, ox, oy) {
  drawSapling(ctx, ox, oy,
    ['#6a4818', '#4a3010', '#2a1a08'],
    ['#407848', '#206028', '#0a3010'],
    'cone');
}

function drawShears(ctx, ox, oy) {
  const D = '#2a2a30', M = '#7a7a88', L = '#c0c0d0', HD = '#4a2a08', HM = '#8a5a20';
  const blade1 = [
    [3,3],[4,4],[5,5],[6,6],[7,7],[8,8],[9,9],
    [4,3],[5,4],[6,5],[7,6],[8,7],[9,8],[10,9],
  ];
  const blade2 = [
    [12,3],[11,4],[10,5],[9,6],[8,7],[7,8],[6,9],
    [11,3],[10,4],[9,5],[8,6],[7,7],[6,8],[5,9],
  ];
  for (const [x, y] of blade1) px(ctx, ox, oy, x, y, M);
  for (const [x, y] of blade2) px(ctx, ox, oy, x, y, M);
  for (let i = 0; i < 7; i++) px(ctx, ox, oy, 3 + i, 3 + i, L);
  for (let i = 0; i < 7; i++) px(ctx, ox, oy, 12 - i, 3 + i, L);
  for (let i = 0; i < 7; i++) px(ctx, ox, oy, 4 + i, 3 + i, D);
  for (let i = 0; i < 7; i++) px(ctx, ox, oy, 11 - i, 3 + i, D);
  px(ctx, ox, oy, 2, 3, D);
  px(ctx, ox, oy, 13, 3, D);
  px(ctx, ox, oy, 2, 4, D);
  px(ctx, ox, oy, 13, 4, D);
  const h1 = [
    [4,11],[5,12],[6,13],[5,11],[4,12],[3,12],[3,13],[4,13],[5,13],[6,12],
  ];
  const h2 = [
    [11,11],[10,12],[9,13],[10,11],[11,12],[12,12],[12,13],[11,13],[10,13],[9,12],
  ];
  for (const [x, y] of h1) px(ctx, ox, oy, x, y, HM);
  for (const [x, y] of h2) px(ctx, ox, oy, x, y, HM);
  px(ctx, ox, oy, 3, 14, HD);
  px(ctx, ox, oy, 4, 14, HD);
  px(ctx, ox, oy, 5, 14, HD);
  px(ctx, ox, oy, 6, 14, HD);
  px(ctx, ox, oy, 9, 14, HD);
  px(ctx, ox, oy, 10, 14, HD);
  px(ctx, ox, oy, 11, 14, HD);
  px(ctx, ox, oy, 12, 14, HD);
  px(ctx, ox, oy, 7, 10, D);
  px(ctx, ox, oy, 8, 10, D);
}

function drawFlintAndSteel(ctx, ox, oy) {
  const SD = '#3a3a42', SM = '#8a8a98', SL = '#c0c0d0';
  const FD = '#0a0a0e', FM = '#2a2a32', FL = '#4a4a58';
  const HD = '#2a1404', HM = '#6a3a10';
  rect(ctx, ox, oy, 3, 3, 10, 4, SM);
  outlineRect(ctx, ox, oy, 3, 3, 10, 4, SD);
  for (let x = 4; x <= 11; x++) px(ctx, ox, oy, x, 4, SL);
  px(ctx, ox, oy, 2, 4, SD);
  px(ctx, ox, oy, 2, 5, SD);
  px(ctx, ox, oy, 13, 4, HM);
  px(ctx, ox, oy, 13, 5, HM);
  px(ctx, ox, oy, 14, 4, HD);
  px(ctx, ox, oy, 14, 5, HD);
  const flint = [
    [3,9],[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],
    [2,10],[3,10],[4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],
    [3,11],[4,11],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11],
    [4,12],[5,12],[6,12],[7,12],[8,12],[9,12],[10,12],[11,12],
  ];
  for (const [x, y] of flint) px(ctx, ox, oy, x, y, FM);
  for (let x = 3; x <= 10; x++) px(ctx, ox, oy, x, 9, FL);
  for (let x = 4; x <= 11; x++) px(ctx, ox, oy, x, 12, FD);
  for (let y = 9; y <= 11; y++) px(ctx, ox, oy, 2, y, FD);
  for (let y = 10; y <= 12; y++) px(ctx, ox, oy, 12, y, FD);
}

function drawBow(ctx, ox, oy) {
  const D = '#2a1404', M = '#7a4a18', L = '#a86828', S = '#e8e8d8';
  const arc = [
    [11,2],[12,3],[13,4],[13,5],[13,6],[13,7],[13,8],[13,9],[13,10],[12,11],[11,12],
  ];
  for (const [x, y] of arc) px(ctx, ox, oy, x, y, M);
  const arc2 = [
    [10,2],[11,3],[12,4],[12,5],[12,6],[12,7],[12,8],[12,9],[12,10],[11,11],[10,12],
  ];
  for (const [x, y] of arc2) px(ctx, ox, oy, x, y, L);
  const arc3 = [
    [12,2],[13,3],[14,4],[14,5],[14,6],[14,7],[14,8],[14,9],[14,10],[13,11],[12,12],
  ];
  for (const [x, y] of arc3) px(ctx, ox, oy, x, y, D);
  px(ctx, ox, oy, 11, 1, D);
  px(ctx, ox, oy, 11, 13, D);
  for (let y = 2; y <= 12; y++) px(ctx, ox, oy, 10, y, S);
  px(ctx, ox, oy, 9, 7, S);
  px(ctx, ox, oy, 9, 8, S);
}

function drawArrow(ctx, ox, oy) {
  const HD = '#2a1404', HM = '#8a5a18', HL = '#b07828';
  const TD = '#4a4a52', TM = '#8a8a98', TL = '#c0c0d0';
  const FM = '#ffffff', FS = '#c0c0c0';
  const shaft = [
    [4,11],[5,10],[6,9],[7,8],[8,7],[9,6],[10,5],[11,4],
  ];
  for (const [x, y] of shaft) px(ctx, ox, oy, x, y, HM);
  for (const [x, y] of shaft) px(ctx, ox, oy, x + 1, y, HL);
  for (const [x, y] of shaft) px(ctx, ox, oy, x, y + 1, HD);
  px(ctx, ox, oy, 12, 3, TM);
  px(ctx, ox, oy, 13, 2, TL);
  px(ctx, ox, oy, 13, 3, TM);
  px(ctx, ox, oy, 12, 4, TM);
  px(ctx, ox, oy, 11, 3, TD);
  px(ctx, ox, oy, 12, 2, TD);
  px(ctx, ox, oy, 14, 2, TD);
  px(ctx, ox, oy, 14, 3, TD);
  px(ctx, ox, oy, 13, 4, TD);
  px(ctx, ox, oy, 2, 13, FM);
  px(ctx, ox, oy, 3, 12, FM);
  px(ctx, ox, oy, 3, 13, FS);
  px(ctx, ox, oy, 2, 12, FS);
  px(ctx, ox, oy, 4, 12, FS);
  px(ctx, ox, oy, 3, 11, FS);
  px(ctx, ox, oy, 2, 14, FS);
  px(ctx, ox, oy, 4, 13, FS);
  px(ctx, ox, oy, 1, 13, FS);
  px(ctx, ox, oy, 1, 14, HD);
  px(ctx, ox, oy, 4, 14, HD);
}

function drawBucketShape(ctx, ox, oy, fillColor, fillLight, fillDark) {
  const D = '#2a2a32', M = '#8a8a98', L = '#c0c0d0', SD = '#4a4a52';
  const map = [
    '.DDDDDDDDDDD.',
    'DMMMMMMMMMMMD',
    'DLMMMMMMMMMSD',
    '.DMMMMMMMMSD.',
    '.DMMMMMMMMSD.',
    '..DMMMMMMSD..',
    '..DMMMMMMSD..',
    '...DMMMMSD...',
    '....DDDDDD...',
  ];
  const palette = { D, M, L, S: SD };
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 1 + x, 4 + y, palette[ch]);
    }
  }
  px(ctx, ox, oy, 3, 2, D);
  px(ctx, ox, oy, 4, 2, D);
  px(ctx, ox, oy, 11, 2, D);
  px(ctx, ox, oy, 12, 2, D);
  px(ctx, ox, oy, 2, 3, D);
  px(ctx, ox, oy, 13, 3, D);
  for (let x = 4; x <= 11; x++) px(ctx, ox, oy, x, 3, D);
  if (fillColor) {
    for (let y = 5; y <= 7; y++) {
      for (let x = 3; x <= 12; x++) px(ctx, ox, oy, x, y, fillColor);
    }
    for (let x = 3; x <= 12; x++) px(ctx, ox, oy, x, 5, fillLight);
    for (let x = 3; x <= 12; x++) px(ctx, ox, oy, x, 7, fillDark);
  }
}

function drawBucket(ctx, ox, oy) {
  drawBucketShape(ctx, ox, oy, null, null, null);
}

function drawWaterBucket(ctx, ox, oy) {
  drawBucketShape(ctx, ox, oy, '#2a6ae0', '#5a9af0', '#0a3a90');
}

function drawLavaBucket(ctx, ox, oy) {
  drawBucketShape(ctx, ox, oy, '#e85010', '#ff8030', '#8a2004');
}

function drawMilkBucket(ctx, ox, oy) {
  drawBucketShape(ctx, ox, oy, '#f0f0f0', '#ffffff', '#c0c0c0');
}

function drawBook(ctx, ox, oy) {
  const CD = '#3a0408', CM = '#a01018', CL = '#d02028';
  const PD = '#a08050', PM = '#e8d8a0', PL = '#fff0b0';
  const SD = '#1a0204', SM = '#6a0810';
  rect(ctx, ox, oy, 3, 2, 11, 12, CM);
  outlineRect(ctx, ox, oy, 3, 2, 11, 12, CD);
  for (let y = 3; y <= 12; y++) px(ctx, ox, oy, 4, y, CL);
  for (let x = 4; x <= 13; x++) px(ctx, ox, oy, x, 3, CL);
  rect(ctx, ox, oy, 2, 3, 2, 10, SM);
  px(ctx, ox, oy, 2, 2, SD);
  px(ctx, ox, oy, 2, 13, SD);
  for (let y = 4; y <= 11; y++) px(ctx, ox, oy, 2, y, SD);
  px(ctx, ox, oy, 3, 3, SM);
  rect(ctx, ox, oy, 13, 4, 2, 9, PM);
  for (let y = 5; y <= 11; y++) px(ctx, ox, oy, 14, y, PL);
  for (let y = 4; y <= 12; y++) px(ctx, ox, oy, 13, y, PD);
  for (let y = 4; y <= 12; y += 2) px(ctx, ox, oy, 14, y, PD);
  px(ctx, ox, oy, 13, 3, CD);
  px(ctx, ox, oy, 14, 3, CD);
  px(ctx, ox, oy, 13, 13, CD);
  px(ctx, ox, oy, 14, 13, CD);
  for (let y = 5; y <= 11; y += 2) {
    px(ctx, ox, oy, 7, y, CD);
    px(ctx, ox, oy, 8, y, CD);
    px(ctx, ox, oy, 9, y, CD);
  }
}

function drawPaper(ctx, ox, oy) {
  const D = '#8a7850', M = '#f0e8c8', L = '#fff8e0';
  rect(ctx, ox, oy, 3, 2, 10, 12, M);
  outlineRect(ctx, ox, oy, 3, 2, 10, 12, D);
  for (let y = 3; y <= 12; y++) px(ctx, ox, oy, 4, y, L);
  for (let x = 4; x <= 12; x++) px(ctx, ox, oy, x, 3, L);
  for (let y = 5; y <= 12; y += 2) {
    for (let x = 5; x <= 11; x++) px(ctx, ox, oy, x, y, D);
  }
  px(ctx, ox, oy, 3, 1, D);
  px(ctx, ox, oy, 4, 1, D);
  px(ctx, ox, oy, 12, 1, D);
  px(ctx, ox, oy, 3, 14, D);
  px(ctx, ox, oy, 12, 14, D);
}

function drawEnderPearl(ctx, ox, oy) {
  const D = '#041810', M = '#0a5a38', L = '#1aa068', H = '#60e0a0';
  const E = '#001008';
  const map = [
    '..DDDDDDDD..',
    '.DMMMMMMMMD.',
    'DMLHLMMMMLMD',
    'DMLLHLMMMLMD',
    'DMMLLMMMMMMD',
    'DMMMMMMEMMMD',
    'DMMMEMMMMMMD',
    'DMMMMMMMMLMD',
    '.DMMMMMMMMD.',
    '..DDMMMMDD..',
    '....DDDD....',
  ];
  const palette = { D, M, L, H, E };
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 2 + x, 3 + y, palette[ch]);
    }
  }
}

function drawBlazeRod(ctx, ox, oy) {
  const D = '#4a2a04', M = '#e06010', L = '#ffa020', Y = '#ffe040', YL = '#ffffa0';
  rect(ctx, ox, oy, 6, 4, 4, 10, Y);
  for (let y = 4; y <= 13; y++) px(ctx, ox, oy, 7, y, YL);
  for (let y = 4; y <= 13; y++) px(ctx, ox, oy, 9, y, M);
  px(ctx, ox, oy, 5, 4, D);
  px(ctx, ox, oy, 10, 4, D);
  px(ctx, ox, oy, 5, 13, D);
  px(ctx, ox, oy, 10, 13, D);
  for (let y = 4; y <= 13; y++) {
    px(ctx, ox, oy, 5, y, D);
    px(ctx, ox, oy, 10, y, D);
  }
  for (let x = 6; x <= 9; x++) px(ctx, ox, oy, x, 3, M);
  px(ctx, ox, oy, 6, 2, L);
  px(ctx, ox, oy, 7, 2, Y);
  px(ctx, ox, oy, 8, 2, Y);
  px(ctx, ox, oy, 9, 2, L);
  px(ctx, ox, oy, 7, 1, M);
  px(ctx, ox, oy, 8, 1, M);
  for (let x = 6; x <= 9; x++) px(ctx, ox, oy, x, 14, M);
  px(ctx, ox, oy, 6, 15, L);
  px(ctx, ox, oy, 7, 15, M);
  px(ctx, ox, oy, 8, 15, M);
  px(ctx, ox, oy, 9, 15, L);
  px(ctx, ox, oy, 5, 2, D);
  px(ctx, ox, oy, 10, 2, D);
  px(ctx, ox, oy, 5, 14, D);
  px(ctx, ox, oy, 10, 14, D);
  px(ctx, ox, oy, 7, 7, YL);
  px(ctx, ox, oy, 8, 10, YL);
}

function drawSlimeball(ctx, ox, oy) {
  const D = '#0a4010', M = '#40a020', L = '#78d040', H = '#b0f060';
  const map = [
    '..DDDDDDDD..',
    '.DMMMMMMMMD.',
    'DMLHLMMMMMMD',
    'DMLHMMMMMMMD',
    'DMMLMMMMMMMD',
    'DMMMMMMMMMMD',
    'DMMMMMMMMMMD',
    'DMMMMMMMMMMD',
    '.DMMMMMMMMD.',
    '..DDMMMMDD..',
    '....DDDD....',
  ];
  const palette = { D, M, L, H };
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      px(ctx, ox, oy, 2 + x, 3 + y, palette[ch]);
    }
  }
}

// -----------------------------------------------------------------------------
// Placeholder for unknown items
// -----------------------------------------------------------------------------

function drawPlaceholder(ctx, ox, oy) {
  const M = '#ff00ff', D = '#000000';
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if ((x + y) % 2 === 0) px(ctx, ox, oy, x, y, M);
      else px(ctx, ox, oy, x, y, D);
    }
  }
}

// -----------------------------------------------------------------------------
// Drawer table
// -----------------------------------------------------------------------------

const DRAWERS = {
  stick: drawStick,
  coal: drawCoal,
  charcoal: drawCharcoal,
  raw_iron: drawRawIron,
  iron_ingot: drawIronIngot,
  raw_gold: drawRawGold,
  gold_ingot: drawGoldIngot,
  raw_copper: drawRawCopper,
  copper_ingot: drawCopperIngot,
  diamond: drawDiamond,
  emerald: drawEmerald,
  lapis: drawLapis,
  redstone: drawRedstone,
  clay_ball: drawClayBall,
  brick_item: drawBrickItem,
  flint: drawFlint,
  string: drawString,
  feather: drawFeather,
  leather: drawLeather,
  bone: drawBone,
  gunpowder: drawGunpowder,
  wooden_pickaxe: (c, x, y) => { drawHandle(c, x, y); drawPickaxeHead(c, x, y, 'wooden'); },
  stone_pickaxe:  (c, x, y) => { drawHandle(c, x, y); drawPickaxeHead(c, x, y, 'stone'); },
  iron_pickaxe:   (c, x, y) => { drawHandle(c, x, y); drawPickaxeHead(c, x, y, 'iron'); },
  gold_pickaxe:   (c, x, y) => { drawHandle(c, x, y); drawPickaxeHead(c, x, y, 'gold'); },
  diamond_pickaxe:(c, x, y) => { drawHandle(c, x, y); drawPickaxeHead(c, x, y, 'diamond'); },
  wooden_axe: (c, x, y) => { drawHandle(c, x, y); drawAxeHead(c, x, y, 'wooden'); },
  stone_axe:  (c, x, y) => { drawHandle(c, x, y); drawAxeHead(c, x, y, 'stone'); },
  iron_axe:   (c, x, y) => { drawHandle(c, x, y); drawAxeHead(c, x, y, 'iron'); },
  gold_axe:   (c, x, y) => { drawHandle(c, x, y); drawAxeHead(c, x, y, 'gold'); },
  diamond_axe:(c, x, y) => { drawHandle(c, x, y); drawAxeHead(c, x, y, 'diamond'); },
  wooden_shovel: (c, x, y) => { drawHandle(c, x, y); drawShovelHead(c, x, y, 'wooden'); },
  stone_shovel:  (c, x, y) => { drawHandle(c, x, y); drawShovelHead(c, x, y, 'stone'); },
  iron_shovel:   (c, x, y) => { drawHandle(c, x, y); drawShovelHead(c, x, y, 'iron'); },
  gold_shovel:   (c, x, y) => { drawHandle(c, x, y); drawShovelHead(c, x, y, 'gold'); },
  diamond_shovel:(c, x, y) => { drawHandle(c, x, y); drawShovelHead(c, x, y, 'diamond'); },
  wooden_sword: (c, x, y) => drawSwordBlade(c, x, y, 'wooden'),
  stone_sword:  (c, x, y) => drawSwordBlade(c, x, y, 'stone'),
  iron_sword:   (c, x, y) => drawSwordBlade(c, x, y, 'iron'),
  gold_sword:   (c, x, y) => drawSwordBlade(c, x, y, 'gold'),
  diamond_sword:(c, x, y) => drawSwordBlade(c, x, y, 'diamond'),
  wooden_hoe: (c, x, y) => { drawHandle(c, x, y); drawHoeHead(c, x, y, 'wooden'); },
  stone_hoe:  (c, x, y) => { drawHandle(c, x, y); drawHoeHead(c, x, y, 'stone'); },
  iron_hoe:   (c, x, y) => { drawHandle(c, x, y); drawHoeHead(c, x, y, 'iron'); },
  gold_hoe:   (c, x, y) => { drawHandle(c, x, y); drawHoeHead(c, x, y, 'gold'); },
  diamond_hoe:(c, x, y) => { drawHandle(c, x, y); drawHoeHead(c, x, y, 'diamond'); },
  wheat_seeds: drawWheatSeeds,
  wheat: drawWheat,
  bread: drawBread,
  apple: drawApple,
  carrot: drawCarrot,
  potato: drawPotato,
  baked_potato: drawBakedPotato,
  raw_beef: drawRawBeef,
  cooked_beef: drawCookedBeef,
  raw_porkchop: drawRawPorkchop,
  cooked_porkchop: drawCookedPorkchop,
  raw_chicken: drawRawChicken,
  cooked_chicken: drawCookedChicken,
  raw_mutton: drawRawMutton,
  cooked_mutton: drawCookedMutton,
  raw_fish: drawRawFish,
  cooked_fish: drawCookedFish,
  mushroom_stew: drawMushroomStew,
  sugar: drawSugar,
  egg: drawEgg,
  oak_sapling: drawOakSapling,
  birch_sapling: drawBirchSapling,
  spruce_sapling: drawSpruceSapling,
  shears: drawShears,
  flint_and_steel: drawFlintAndSteel,
  bow: drawBow,
  arrow: drawArrow,
  bucket: drawBucket,
  water_bucket: drawWaterBucket,
  lava_bucket: drawLavaBucket,
  milk_bucket: drawMilkBucket,
  book: drawBook,
  paper: drawPaper,
  ender_pearl: drawEnderPearl,
  blaze_rod: drawBlazeRod,
  slimeball: drawSlimeball,
};

// -----------------------------------------------------------------------------
// Atlas generation + public API
// -----------------------------------------------------------------------------

let _cache = null;

export function generateItemIcons() {
  if (_cache) return _cache;

  const count = ITEM_ICON_NAMES.length;
  const cols = ICONS_PER_ROW;
  const rows = Math.ceil(count / cols);
  const canvas = (typeof document !== 'undefined' && typeof document.createElement === 'function')
    ? document.createElement('canvas')
    : { width: 0, height: 0, getContext: () => null };
  canvas.width = cols * ICON_SIZE;
  canvas.height = rows * ICON_SIZE;

  const ctx = canvas.getContext && canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    if ('webkitImageSmoothingEnabled' in ctx) ctx.webkitImageSmoothingEnabled = false;
    if ('mozImageSmoothingEnabled' in ctx) ctx.mozImageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < count; i++) {
      const name = ITEM_ICON_NAMES[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ox = col * ICON_SIZE;
      const oy = row * ICON_SIZE;
      const draw = DRAWERS[name] || drawPlaceholder;
      const seed = hashString(name);
      const rng = mulberry32(seed);
      void rng;
      draw(ctx, ox, oy, rng);
    }
  }

  const indexMap = new Map();
  for (let i = 0; i < count; i++) indexMap.set(ITEM_ICON_NAMES[i], i);

  function has(id) {
    return indexMap.has(id);
  }

  function iconRect(id) {
    const i = indexMap.get(id);
    if (i === undefined) return null;
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      x: col * ICON_SIZE,
      y: row * ICON_SIZE,
      w: ICON_SIZE,
      h: ICON_SIZE,
      u0: (col * ICON_SIZE) / canvas.width,
      v0: (row * ICON_SIZE) / canvas.height,
      u1: ((col + 1) * ICON_SIZE) / canvas.width,
      v1: ((row + 1) * ICON_SIZE) / canvas.height,
    };
  }

  function iconDataUrlFor(id) {
    const r = iconRect(id);
    if (!r || !canvas.getContext) return null;
    const tmp = document.createElement('canvas');
    tmp.width = ICON_SIZE;
    tmp.height = ICON_SIZE;
    const tctx = tmp.getContext('2d');
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(canvas, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
    try { return tmp.toDataURL('image/png'); } catch (e) { return null; }
  }

  _cache = { canvas, has, iconRect, iconDataUrlFor };
  return _cache;
}
