// Crafting recipes. Two kinds:
//   - shaped: 3x3 pattern with key mapping, spaces = empty
//   - shapeless: unordered list of ingredient ids
// Grids passed to matchRecipe are 3x3 arrays (row-major, 9 cells)
// where each cell is an item id string or null for empty.

// --- Recipe builders ---
const shaped = (pattern, key, result) => ({ type: "shaped", pattern, key, result });
const shapeless = (ingredients, result) => ({ type: "shapeless", ingredients, result });
const r = (id, count = 1) => ({ id, count });

// --- Tool pattern helpers (vertical handle of sticks) ---
const pickaxe = (mat) => shaped(
  ["XXX", " S ", " S "],
  { X: mat, S: "stick" },
);
const axe = (mat) => shaped(
  ["XX ", "XS ", " S "],
  { X: mat, S: "stick" },
);
const shovel = (mat) => shaped(
  [" X ", " S ", " S "],
  { X: mat, S: "stick" },
);
const sword = (mat) => shaped(
  [" X ", " X ", " S "],
  { X: mat, S: "stick" },
);
const hoe = (mat) => shaped(
  ["XX ", " S ", " S "],
  { X: mat, S: "stick" },
);

// --- Recipe list ---
export const RECIPES = [
  // Planks (one per log type)
  shapeless(["oak_log"],    r("oak_planks", 4)),
  shapeless(["birch_log"],  r("birch_planks", 4)),
  shapeless(["spruce_log"], r("spruce_planks", 4)),

  // Sticks (2 planks vertical)
  shaped([" X ", " X ", "   "], { X: "oak_planks" }, r("stick", 4)),

  // Crafting table (2x2 planks)
  shaped(["XX ", "XX ", "   "], { X: "oak_planks" }, r("crafting_table", 1)),

  // Furnace (ring of 8 cobblestone)
  shaped(["XXX", "X X", "XXX"], { X: "cobblestone" }, r("furnace", 1)),

  // Chest (ring of 8 planks)
  shaped(["XXX", "X X", "XXX"], { X: "oak_planks" }, r("chest", 1)),

  // Torches — coal + stick shaped (output 4)
  shaped(["X  ", "S  ", "   "], { X: "coal", S: "stick" }, r("torch", 4)),
  // Alt shapeless: coal + stick → 4 torches
  shapeless(["coal", "stick"], r("torch", 4)),
  // Charcoal variant
  shaped(["X  ", "S  ", "   "], { X: "charcoal", S: "stick" }, r("torch", 4)),

  // Stone bricks (2x2 stone)
  shaped(["XX ", "XX ", "   "], { X: "stone" }, r("stone_bricks", 4)),

  // Brick block (2x2 brick items)
  shaped(["XX ", "XX ", "   "], { X: "brick_item" }, r("brick", 4)),

  // Bookshelf: 3 planks top, 3 books mid, 3 planks bottom
  shaped(["PPP", "BBB", "PPP"], { P: "oak_planks", B: "book" }, r("bookshelf", 1)),

  // Book: 3 paper + 1 leather (shapeless)
  shapeless(["paper", "paper", "paper", "leather"], r("book", 1)),

  // Bread: 3 wheat horizontal
  shaped(["XXX", "   ", "   "], { X: "wheat" }, r("bread", 1)),

  // Bucket: 3 iron ingots in V shape
  shaped(["X X", " X ", "   "], { X: "iron_ingot" }, r("bucket", 1)),

  // Bow: sticks + string
  shaped([" XS", "X S", " XS"], { X: "stick", S: "string" }, r("bow", 1)),

  // Arrow: flint, stick, feather vertical
  shaped([" F ", " S ", " E "], { F: "flint", S: "stick", E: "feather" }, r("arrow", 4)),

  // Flint and steel: shapeless
  shapeless(["iron_ingot", "flint"], r("flint_and_steel", 1)),

  // Shears: 2 iron ingots diagonal
  shaped([" X ", "X  ", "   "], { X: "iron_ingot" }, r("shears", 1)),

  // --- Wooden tools ---
  { ...pickaxe("oak_planks"), result: r("wooden_pickaxe", 1) },
  { ...axe("oak_planks"),     result: r("wooden_axe", 1) },
  { ...shovel("oak_planks"),  result: r("wooden_shovel", 1) },
  { ...sword("oak_planks"),   result: r("wooden_sword", 1) },
  { ...hoe("oak_planks"),     result: r("wooden_hoe", 1) },

  // --- Stone tools (cobblestone) ---
  { ...pickaxe("cobblestone"), result: r("stone_pickaxe", 1) },
  { ...axe("cobblestone"),     result: r("stone_axe", 1) },
  { ...shovel("cobblestone"),  result: r("stone_shovel", 1) },
  { ...sword("cobblestone"),   result: r("stone_sword", 1) },
  { ...hoe("cobblestone"),     result: r("stone_hoe", 1) },

  // --- Iron tools ---
  { ...pickaxe("iron_ingot"), result: r("iron_pickaxe", 1) },
  { ...axe("iron_ingot"),     result: r("iron_axe", 1) },
  { ...shovel("iron_ingot"),  result: r("iron_shovel", 1) },
  { ...sword("iron_ingot"),   result: r("iron_sword", 1) },
  { ...hoe("iron_ingot"),     result: r("iron_hoe", 1) },

  // --- Gold tools ---
  { ...pickaxe("gold_ingot"), result: r("gold_pickaxe", 1) },
  { ...axe("gold_ingot"),     result: r("gold_axe", 1) },
  { ...shovel("gold_ingot"),  result: r("gold_shovel", 1) },
  { ...sword("gold_ingot"),   result: r("gold_sword", 1) },
  { ...hoe("gold_ingot"),     result: r("gold_hoe", 1) },

  // --- Diamond tools ---
  { ...pickaxe("diamond"), result: r("diamond_pickaxe", 1) },
  { ...axe("diamond"),     result: r("diamond_axe", 1) },
  { ...shovel("diamond"),  result: r("diamond_shovel", 1) },
  { ...sword("diamond"),   result: r("diamond_sword", 1) },
  { ...hoe("diamond"),     result: r("diamond_hoe", 1) },
];

// --- Grid helpers ---
// Normalize a 3x3 grid to a 2D rows-of-chars matrix with empty borders trimmed.
// Returns {rows, cols, cells} where cells[r][c] is an id or null.
function normalizeGrid(grid) {
  // Expect a flat array of 9, or array of 3 rows of 3.
  let cells;
  if (Array.isArray(grid) && grid.length === 3 && Array.isArray(grid[0])) {
    cells = grid.map(row => row.slice(0, 3));
  } else if (Array.isArray(grid) && grid.length === 9) {
    cells = [
      [grid[0], grid[1], grid[2]],
      [grid[3], grid[4], grid[5]],
      [grid[6], grid[7], grid[8]],
    ];
  } else {
    return null;
  }
  return cells;
}

// Trim empty rows/columns so we can compare shapes regardless of position.
function trim(cells) {
  let top = 0, bot = cells.length - 1, left = 0, right = cells[0].length - 1;
  const rowEmpty = (r) => cells[r].every(c => c == null);
  const colEmpty = (c) => cells.every(row => row[c] == null);
  while (top <= bot && rowEmpty(top)) top++;
  while (bot >= top && rowEmpty(bot)) bot--;
  if (top > bot) return { rows: 0, cols: 0, cells: [] };
  while (left <= right && colEmpty(left)) left++;
  while (right >= left && colEmpty(right)) right--;
  const out = [];
  for (let r = top; r <= bot; r++) {
    out.push(cells[r].slice(left, right + 1));
  }
  return { rows: out.length, cols: out[0].length, cells: out };
}

// Convert a shaped-recipe pattern to trimmed cells of ids (null for space).
function patternToCells(pattern, key) {
  const cells = pattern.map(row => {
    const arr = [];
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      arr.push(ch === " " ? null : (key[ch] ?? null));
    }
    // Pad to 3 cols
    while (arr.length < 3) arr.push(null);
    return arr;
  });
  while (cells.length < 3) cells.push([null, null, null]);
  return trim(cells);
}

function gridsEqual(a, b) {
  if (a.rows !== b.rows || a.cols !== b.cols) return false;
  for (let r = 0; r < a.rows; r++) {
    for (let c = 0; c < a.cols; c++) {
      if (a.cells[r][c] !== b.cells[r][c]) return false;
    }
  }
  return true;
}

function matchShaped(recipe, gridCells) {
  const pat = patternToCells(recipe.pattern, recipe.key);
  const grid = trim(gridCells);
  return gridsEqual(pat, grid);
}

function matchShapeless(recipe, gridCells) {
  // Collect grid ids (non-null) and compare as a multiset
  const have = [];
  for (const row of gridCells) for (const id of row) if (id != null) have.push(id);
  const need = recipe.ingredients.slice();
  if (have.length !== need.length) return false;
  const used = new Array(have.length).fill(false);
  for (const id of need) {
    const idx = have.findIndex((x, i) => !used[i] && x === id);
    if (idx === -1) return false;
    used[idx] = true;
  }
  return true;
}

/**
 * matchRecipe(grid) - Given a 3x3 grid of item ids (or nulls), return
 * {result, recipe} for the first matching recipe, or null.
 */
export function matchRecipe(grid) {
  const cells = normalizeGrid(grid);
  if (!cells) return null;
  for (const recipe of RECIPES) {
    const ok = recipe.type === "shaped"
      ? matchShaped(recipe, cells)
      : matchShapeless(recipe, cells);
    if (ok) return { result: recipe.result, recipe };
  }
  return null;
}

/**
 * findRecipes(available) - available is a Map<itemId, count>.
 * Returns recipes the player could theoretically craft given the items
 * in inventory (does not account for pattern positioning).
 */
export function findRecipes(available) {
  const has = (id, n) => (available.get(id) ?? 0) >= n;
  const tally = (ids) => {
    const m = new Map();
    for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
    return m;
  };
  const out = [];
  for (const recipe of RECIPES) {
    let need;
    if (recipe.type === "shaped") {
      const flat = [];
      for (const row of recipe.pattern)
        for (const ch of row)
          if (ch !== " ") flat.push(recipe.key[ch]);
      need = tally(flat);
    } else {
      need = tally(recipe.ingredients);
    }
    let ok = true;
    for (const [id, n] of need) {
      if (!has(id, n)) { ok = false; break; }
    }
    if (ok) out.push(recipe);
  }
  return out;
}
