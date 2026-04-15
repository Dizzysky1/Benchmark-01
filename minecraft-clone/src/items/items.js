// Item registry. Items include all placeable blocks plus raw materials,
// tools, food, and misc. Item IDs are strings (block name or item name).
import { BlockByName } from "../world/blocks.js";

// Tool tiers: 0=wood, 1=stone, 2=iron, 3=gold, 4=diamond, 5=netherite
export const TOOL_TIERS = { wood: 0, stone: 1, iron: 2, gold: 3, diamond: 4, netherite: 5 };

const I = (id, opts = {}) => ({
  id,
  name: opts.name ?? id.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
  isBlock: opts.isBlock ?? false,
  blockId: opts.blockId ?? null,
  stackSize: opts.stackSize ?? 64,
  tool: opts.tool ?? null,
  toolTier: opts.toolTier ?? null,
  damage: opts.damage ?? null,
  food: opts.food ?? null,
  maxUses: opts.maxUses ?? null,
  fuel: opts.fuel ?? null,
});

export const ITEMS = {};

// --- Register all blocks as block-items ---
export const BLOCK_ITEM_IDS = [];
for (const [name, id] of Object.entries(BlockByName)) {
  if (name === "air") continue;
  ITEMS[name] = I(name, { isBlock: true, blockId: id });
  BLOCK_ITEM_IDS.push(name);
}

// --- Durability table per tier (uses = how many blocks/swings) ---
const TOOL_USES = [59, 131, 250, 32, 1561]; // wood, stone, iron, gold, diamond
const TOOL_DMG_PICK = [2, 3, 4, 2, 5];
const TOOL_DMG_AXE  = [7, 9, 9, 7, 9];
const TOOL_DMG_SHOV = [2.5, 3.5, 4.5, 2.5, 5.5];
const TOOL_DMG_SWRD = [4, 5, 6, 4, 7];
const TOOL_DMG_HOE  = [1, 1, 1, 1, 1];

const tool = (id, kind, tier, dmgTbl) => I(id, {
  tool: kind, toolTier: tier, stackSize: 1,
  maxUses: TOOL_USES[tier], damage: dmgTbl[tier],
});

// --- Raw materials ---
const rawMats = [
  I("stick",          { fuel: 100 }),
  I("coal",           { fuel: 1600 }),
  I("charcoal",       { fuel: 1600 }),
  I("raw_iron"),
  I("iron_ingot"),
  I("raw_gold"),
  I("gold_ingot"),
  I("raw_copper"),
  I("copper_ingot"),
  I("diamond"),
  I("emerald"),
  I("lapis"),
  I("redstone"),
  I("clay_ball"),
  I("brick_item",     { name: "Brick" }),
  I("flint"),
  I("string"),
  I("feather"),
  I("leather"),
  I("bone"),
  I("gunpowder"),
];

// --- Saplings (fuel) ---
const saplings = [
  I("oak_sapling",    { fuel: 100 }),
  I("birch_sapling",  { fuel: 100 }),
  I("spruce_sapling", { fuel: 100 }),
];

// --- Food & crops ---
const food = [
  I("wheat_seeds"),
  I("wheat"),
  I("bread",           { food: 5 }),
  I("apple",           { food: 4 }),
  I("carrot",          { food: 3 }),
  I("potato",          { food: 1 }),
  I("baked_potato",    { food: 5 }),
  I("raw_beef",        { food: 3 }),
  I("cooked_beef",     { food: 8 }),
  I("raw_porkchop",    { food: 3 }),
  I("cooked_porkchop", { food: 8 }),
  I("raw_chicken",     { food: 2 }),
  I("cooked_chicken",  { food: 6 }),
  I("raw_mutton",      { food: 2 }),
  I("cooked_mutton",   { food: 6 }),
  I("raw_fish",        { food: 2 }),
  I("cooked_fish",     { food: 5 }),
  I("mushroom_stew",   { food: 6, stackSize: 1 }),
];

// --- Tools (pickaxe / axe / shovel / sword / hoe in 5 tiers) ---
const tools = [
  tool("wooden_pickaxe",  "pickaxe", 0, TOOL_DMG_PICK),
  tool("stone_pickaxe",   "pickaxe", 1, TOOL_DMG_PICK),
  tool("iron_pickaxe",    "pickaxe", 2, TOOL_DMG_PICK),
  tool("gold_pickaxe",    "pickaxe", 3, TOOL_DMG_PICK),
  tool("diamond_pickaxe", "pickaxe", 4, TOOL_DMG_PICK),

  tool("wooden_axe",      "axe",     0, TOOL_DMG_AXE),
  tool("stone_axe",       "axe",     1, TOOL_DMG_AXE),
  tool("iron_axe",        "axe",     2, TOOL_DMG_AXE),
  tool("gold_axe",        "axe",     3, TOOL_DMG_AXE),
  tool("diamond_axe",     "axe",     4, TOOL_DMG_AXE),

  tool("wooden_shovel",   "shovel",  0, TOOL_DMG_SHOV),
  tool("stone_shovel",    "shovel",  1, TOOL_DMG_SHOV),
  tool("iron_shovel",     "shovel",  2, TOOL_DMG_SHOV),
  tool("gold_shovel",     "shovel",  3, TOOL_DMG_SHOV),
  tool("diamond_shovel",  "shovel",  4, TOOL_DMG_SHOV),

  tool("wooden_sword",    "sword",   0, TOOL_DMG_SWRD),
  tool("stone_sword",     "sword",   1, TOOL_DMG_SWRD),
  tool("iron_sword",      "sword",   2, TOOL_DMG_SWRD),
  tool("gold_sword",      "sword",   3, TOOL_DMG_SWRD),
  tool("diamond_sword",   "sword",   4, TOOL_DMG_SWRD),

  tool("wooden_hoe",      "hoe",     0, TOOL_DMG_HOE),
  tool("stone_hoe",       "hoe",     1, TOOL_DMG_HOE),
  tool("iron_hoe",        "hoe",     2, TOOL_DMG_HOE),
  tool("gold_hoe",        "hoe",     3, TOOL_DMG_HOE),
  tool("diamond_hoe",     "hoe",     4, TOOL_DMG_HOE),

  I("shears",          { tool: "shears", toolTier: 2, stackSize: 1, maxUses: 238 }),
  I("flint_and_steel", { stackSize: 1, maxUses: 64 }),
  I("bow",             { stackSize: 1, maxUses: 384, damage: 2 }),
  I("arrow",           { damage: 2 }),
];

// --- Misc ---
const misc = [
  I("bucket",       { stackSize: 16 }),
  I("water_bucket", { stackSize: 1 }),
  I("lava_bucket",  { stackSize: 1, fuel: 20000 }),
  I("milk_bucket",  { stackSize: 1 }),
  I("book"),
  I("paper"),
  I("sugar"),
  I("egg",          { stackSize: 16 }),
  I("ender_pearl",  { stackSize: 16 }),
  I("blaze_rod",    { fuel: 2400 }),
  I("slimeball"),
];

// Register everything non-block into ITEMS
for (const item of [...rawMats, ...saplings, ...food, ...tools, ...misc]) {
  ITEMS[item.id] = item;
}

// --- Default missing item stub ---
const MISSING = Object.freeze(I("missing", { name: "Missing Item", stackSize: 0 }));

export function getItem(id) {
  return ITEMS[id] ?? MISSING;
}

export function isBlockItem(id) {
  return ITEMS[id]?.isBlock === true;
}

export function itemStackSize(id) {
  return ITEMS[id]?.stackSize ?? 64;
}

export function itemDisplayName(id) {
  return ITEMS[id]?.name ?? id;
}
