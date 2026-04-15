// Block registry. Each block has faces (top/side/bottom → texture key).
// Block IDs are indexes; 0 = air.
export const BlockFlags = {
  SOLID: 1,
  TRANSPARENT: 2,
  LIQUID: 4,
  FOLIAGE: 8,
  LIGHT: 16,
  CROSS: 32, // cross-mesh (flowers, grass) — not a cube
};

const B = (name, opts = {}) => ({
  name,
  faces: opts.faces || { all: name },
  flags: opts.flags ?? BlockFlags.SOLID,
  hardness: opts.hardness ?? 1,
  drops: opts.drops ?? null,       // id | null (null = drop self by name)
  tool: opts.tool ?? null,          // preferred tool: "pickaxe", "axe", "shovel", "shears"
  requiresTool: opts.requiresTool ?? false, // if true, no drop unless tool matches & tier sufficient
  lightEmit: opts.lightEmit ?? 0,
  mineLevel: opts.mineLevel ?? 0,   // required tool tier (0=wood, 1=stone, 2=iron, 3=diamond)
  stackSize: opts.stackSize ?? 64,
});

// Block list — indices determine IDs. Order matters for save compatibility.
export const BLOCKS = [
  B("air", { flags: BlockFlags.TRANSPARENT, hardness: 0 }),
  B("stone", { hardness: 1.5, tool: "pickaxe", requiresTool: true, drops: "cobblestone" }),
  B("grass_block", {
    faces: { top: "grass_top", bottom: "dirt", side: "grass_side" },
    hardness: 0.6, tool: "shovel", drops: "dirt",
  }),
  B("dirt", { hardness: 0.5, tool: "shovel" }),
  B("cobblestone", { hardness: 2, tool: "pickaxe", requiresTool: true }),
  B("bedrock", { hardness: Infinity, drops: null }),
  B("sand", { hardness: 0.5, tool: "shovel" }),
  B("gravel", { hardness: 0.6, tool: "shovel" }),
  B("oak_log", { faces: { top: "oak_log_top", bottom: "oak_log_top", side: "oak_log" }, hardness: 2, tool: "axe" }),
  B("oak_leaves", { flags: BlockFlags.SOLID | BlockFlags.TRANSPARENT | BlockFlags.FOLIAGE, hardness: 0.2, tool: "shears", drops: "oak_sapling" }),
  B("oak_planks", { hardness: 2, tool: "axe" }),
  B("birch_log", { faces: { top: "birch_log_top", bottom: "birch_log_top", side: "birch_log" }, hardness: 2, tool: "axe" }),
  B("birch_leaves", { flags: BlockFlags.SOLID | BlockFlags.TRANSPARENT | BlockFlags.FOLIAGE, hardness: 0.2, tool: "shears" }),
  B("birch_planks", { hardness: 2, tool: "axe" }),
  B("spruce_log", { faces: { top: "spruce_log_top", bottom: "spruce_log_top", side: "spruce_log" }, hardness: 2, tool: "axe" }),
  B("spruce_leaves", { flags: BlockFlags.SOLID | BlockFlags.TRANSPARENT | BlockFlags.FOLIAGE, hardness: 0.2, tool: "shears" }),
  B("spruce_planks", { hardness: 2, tool: "axe" }),
  B("water", {
    flags: BlockFlags.TRANSPARENT | BlockFlags.LIQUID,
    hardness: 100, drops: null,
  }),
  B("lava", {
    flags: BlockFlags.TRANSPARENT | BlockFlags.LIQUID | BlockFlags.LIGHT,
    hardness: 100, drops: null, lightEmit: 15,
  }),
  B("glass", { flags: BlockFlags.SOLID | BlockFlags.TRANSPARENT, hardness: 0.3, drops: null }),
  B("ice", { flags: BlockFlags.SOLID | BlockFlags.TRANSPARENT, hardness: 0.5, drops: null }),
  B("snow_block", { hardness: 0.2, tool: "shovel" }),
  B("coal_ore", { hardness: 3, tool: "pickaxe", requiresTool: true, drops: "coal" }),
  B("iron_ore", { hardness: 3, tool: "pickaxe", requiresTool: true, mineLevel: 1, drops: "raw_iron" }),
  B("gold_ore", { hardness: 3, tool: "pickaxe", requiresTool: true, mineLevel: 2, drops: "raw_gold" }),
  B("diamond_ore", { hardness: 3, tool: "pickaxe", requiresTool: true, mineLevel: 2, drops: "diamond" }),
  B("redstone_ore", { hardness: 3, tool: "pickaxe", requiresTool: true, mineLevel: 1, drops: "redstone" }),
  B("lapis_ore", { hardness: 3, tool: "pickaxe", requiresTool: true, mineLevel: 1, drops: "lapis" }),
  B("emerald_ore", { hardness: 3, tool: "pickaxe", requiresTool: true, mineLevel: 2, drops: "emerald" }),
  B("copper_ore", { hardness: 3, tool: "pickaxe", requiresTool: true, mineLevel: 1, drops: "raw_copper" }),
  B("deepslate", { hardness: 3, tool: "pickaxe", requiresTool: true, drops: "cobbled_deepslate" }),
  B("cobbled_deepslate", { hardness: 3.5, tool: "pickaxe", requiresTool: true }),
  B("stone_bricks", { hardness: 1.5, tool: "pickaxe", requiresTool: true }),
  B("brick", { hardness: 2, tool: "pickaxe", requiresTool: true }),
  B("sandstone", {
    faces: { top: "sandstone_top", bottom: "sandstone_bottom", side: "sandstone_side" },
    hardness: 0.8, tool: "pickaxe", requiresTool: true,
  }),
  B("glowstone", { flags: BlockFlags.SOLID | BlockFlags.LIGHT, hardness: 0.3, lightEmit: 15 }),
  B("torch", { flags: BlockFlags.TRANSPARENT | BlockFlags.LIGHT | BlockFlags.CROSS, hardness: 0, lightEmit: 14 }),
  B("crafting_table", {
    faces: { top: "crafting_table_top", bottom: "oak_planks", side: "crafting_table_side" },
    hardness: 2.5, tool: "axe",
  }),
  B("furnace", {
    faces: { top: "furnace_top", bottom: "furnace_top", side: "furnace_side", front: "furnace_front" },
    hardness: 3.5, tool: "pickaxe", requiresTool: true,
  }),
  B("chest", {
    faces: { top: "chest_top", bottom: "chest_top", side: "chest_side", front: "chest_front" },
    hardness: 2.5, tool: "axe",
  }),
  B("obsidian", { hardness: 50, tool: "pickaxe", requiresTool: true, mineLevel: 3 }),
  B("netherrack", { hardness: 0.4, tool: "pickaxe", requiresTool: true }),
  B("bookshelf", {
    faces: { top: "oak_planks", bottom: "oak_planks", side: "bookshelf" },
    hardness: 1.5, tool: "axe",
  }),
  B("wool_white", { hardness: 0.8, tool: "shears" }),
  B("wool_red", { hardness: 0.8, tool: "shears" }),
  B("wool_blue", { hardness: 0.8, tool: "shears" }),
  B("wool_yellow", { hardness: 0.8, tool: "shears" }),
  B("wool_green", { hardness: 0.8, tool: "shears" }),
  B("wool_black", { hardness: 0.8, tool: "shears" }),
  B("pumpkin", {
    faces: { top: "pumpkin_top", bottom: "pumpkin_top", side: "pumpkin_side", front: "pumpkin_face" },
    hardness: 1, tool: "axe",
  }),
  B("melon", {
    faces: { top: "melon_top", bottom: "melon_top", side: "melon_side" },
    hardness: 1, tool: "axe",
  }),
  B("mossy_cobblestone", { hardness: 2, tool: "pickaxe", requiresTool: true }),
  B("clay", { hardness: 0.6, tool: "shovel", drops: "clay_ball" }),
  B("mycelium", {
    faces: { top: "mycelium_top", bottom: "dirt", side: "mycelium_side" },
    hardness: 0.6, tool: "shovel", drops: "dirt",
  }),
  B("podzol", {
    faces: { top: "podzol_top", bottom: "dirt", side: "podzol_side" },
    hardness: 0.5, tool: "shovel", drops: "dirt",
  }),
  B("red_sand", { hardness: 0.5, tool: "shovel" }),
  B("red_sandstone", {
    faces: { top: "red_sandstone_top", bottom: "red_sandstone_bottom", side: "red_sandstone_side" },
    hardness: 0.8, tool: "pickaxe",
  }),
  B("tall_grass", { flags: BlockFlags.TRANSPARENT | BlockFlags.CROSS | BlockFlags.FOLIAGE, hardness: 0 }),
  B("flower_red", { flags: BlockFlags.TRANSPARENT | BlockFlags.CROSS, hardness: 0 }),
  B("flower_yellow", { flags: BlockFlags.TRANSPARENT | BlockFlags.CROSS, hardness: 0 }),
  B("cactus", {
    faces: { top: "cactus_top", bottom: "cactus_bottom", side: "cactus_side" },
    hardness: 0.4,
  }),
];

// Build id + name lookups
export const BlockId = {};
export const BlockByName = {};
BLOCKS.forEach((b, i) => {
  BlockId[b.name.toUpperCase()] = i;
  BlockByName[b.name] = i;
  b.id = i;
});

export const AIR = BlockId.AIR;

export function getBlock(id) { return BLOCKS[id] || BLOCKS[0]; }
export function isSolid(id) { return (BLOCKS[id]?.flags & BlockFlags.SOLID) !== 0; }
export function isTransparent(id) { return (BLOCKS[id]?.flags & BlockFlags.TRANSPARENT) !== 0; }
export function isLiquid(id) { return (BLOCKS[id]?.flags & BlockFlags.LIQUID) !== 0; }
export function isCross(id) { return (BLOCKS[id]?.flags & BlockFlags.CROSS) !== 0; }
export function isFoliage(id) { return (BLOCKS[id]?.flags & BlockFlags.FOLIAGE) !== 0; }

// Tool tiers (matches items.js TOOL_TIERS)
// 0=wood, 1=stone, 2=iron, 3=gold, 4=diamond, 5=netherite
// Gold is treated as tier 0 for mining requirements (per Minecraft)
export function effectiveTier(toolTier) {
  if (toolTier == null) return -1; // hand
  if (toolTier === 3) return 0; // gold = wood-level for mining
  return toolTier;
}

// Returns { canMine: bool, dropsItem: bool, breakSpeedMultiplier: number }
// blockId: numeric block id
// tool: { tool: "pickaxe"|"axe"|"shovel"|"shears"|"sword"|"hoe"|null, toolTier: number|null }
export function mineInfo(blockId, tool = { tool: null, toolTier: null }) {
  const block = BLOCKS[blockId];
  if (!block) return { canMine: false, dropsItem: false, breakSpeedMultiplier: 0 };
  if (block.hardness === Infinity) return { canMine: false, dropsItem: false, breakSpeedMultiplier: 0 };
  const tier = effectiveTier(tool.toolTier);
  const correctTool = block.tool == null || block.tool === tool.tool;
  const tierOk = tier >= block.mineLevel;
  // Cannot mine at all if needs tool and player doesn't have correct tool or sufficient tier
  if (block.requiresTool && (!correctTool || !tierOk)) {
    return { canMine: false, dropsItem: false, breakSpeedMultiplier: 0 };
  }
  // Can mine; drops only if tool is correct (and tier sufficient when needed)
  let dropsItem = true;
  if (block.requiresTool) dropsItem = correctTool && tierOk;
  // Break speed: faster with correct tool and higher tier
  let mult = 1;
  if (correctTool) {
    const tiers = [2, 4, 6, 8, 12, 16]; // wood, stone, iron, gold, diamond, netherite
    mult = tiers[tool.toolTier ?? 0] || 2;
  }
  return { canMine: true, dropsItem, breakSpeedMultiplier: mult };
}

export function getDrop(blockId) {
  const block = BLOCKS[blockId];
  if (!block) return null;
  if (block.drops === null && block.name === "air") return null;
  return block.drops || block.name;
}

// Face culling: should face between a (current block) and b (neighbor) be drawn?
export function shouldRenderFace(a, b) {
  if (a === AIR) return false;
  if (a === b) return false; // merge same
  if (isCross(a)) return false;
  const bBlock = BLOCKS[b];
  if (!bBlock) return true;
  // If neighbor is transparent (and not same block), render
  if (bBlock.flags & BlockFlags.TRANSPARENT) {
    // Leaves → render against air, but not against other leaves (already caught above)
    return true;
  }
  return false;
}
