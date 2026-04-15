import { BlockByName } from "./blocks.js";

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128;
export const SEA_LEVEL = 64;

// ---------- block id lookup ----------
const B = (name) => {
  const id = BlockByName[name];
  if (id === undefined) throw new Error(`Unknown block: ${name}`);
  return id;
};
const ID = {
  air: 0,
  stone: B("stone"),
  grass_block: B("grass_block"),
  dirt: B("dirt"),
  cobblestone: B("cobblestone"),
  bedrock: B("bedrock"),
  sand: B("sand"),
  gravel: B("gravel"),
  oak_log: B("oak_log"),
  oak_leaves: B("oak_leaves"),
  birch_log: B("birch_log"),
  birch_leaves: B("birch_leaves"),
  spruce_log: B("spruce_log"),
  spruce_leaves: B("spruce_leaves"),
  water: B("water"),
  ice: B("ice"),
  snow_block: B("snow_block"),
  coal_ore: B("coal_ore"),
  iron_ore: B("iron_ore"),
  gold_ore: B("gold_ore"),
  diamond_ore: B("diamond_ore"),
  redstone_ore: B("redstone_ore"),
  lapis_ore: B("lapis_ore"),
  emerald_ore: B("emerald_ore"),
  copper_ore: B("copper_ore"),
  deepslate: B("deepslate"),
  sandstone: B("sandstone"),
  red_sand: B("red_sand"),
  red_sandstone: B("red_sandstone"),
  mycelium: B("mycelium"),
  podzol: B("podzol"),
  tall_grass: B("tall_grass"),
  flower_red: B("flower_red"),
  flower_yellow: B("flower_yellow"),
  cactus: B("cactus"),
  pumpkin: B("pumpkin"),
};

// ---------- PRNG & hashes ----------
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// deterministic integer hash from (x,y,z,seed) → uint32
function hash3(x, y, z, seed) {
  let h = seed | 0;
  h = Math.imul(h ^ (x | 0), 0x85ebca6b);
  h = Math.imul(h ^ (y | 0), 0xc2b2ae35);
  h = Math.imul(h ^ (z | 0), 0x27d4eb2f);
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
function hash2(x, y, seed) {
  return hash3(x, y, 0, seed);
}
function rand2(x, y, seed) {
  return hash2(x, y, seed) / 4294967296;
}
function rand3(x, y, z, seed) {
  return hash3(x, y, z, seed) / 4294967296;
}

// smooth interpolation
function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// 2D value noise
function valueNoise2(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const v00 = rand2(xi, yi, seed);
  const v10 = rand2(xi + 1, yi, seed);
  const v01 = rand2(xi, yi + 1, seed);
  const v11 = rand2(xi + 1, yi + 1, seed);
  const u = fade(xf), v = fade(yf);
  return lerp(lerp(v00, v10, u), lerp(v01, v11, u), v) * 2 - 1;
}

// 3D value noise
function valueNoise3(x, y, z, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = fade(xf), v = fade(yf), w = fade(zf);
  const c000 = rand3(xi, yi, zi, seed);
  const c100 = rand3(xi + 1, yi, zi, seed);
  const c010 = rand3(xi, yi + 1, zi, seed);
  const c110 = rand3(xi + 1, yi + 1, zi, seed);
  const c001 = rand3(xi, yi, zi + 1, seed);
  const c101 = rand3(xi + 1, yi, zi + 1, seed);
  const c011 = rand3(xi, yi + 1, zi + 1, seed);
  const c111 = rand3(xi + 1, yi + 1, zi + 1, seed);
  const x00 = lerp(c000, c100, u);
  const x10 = lerp(c010, c110, u);
  const x01 = lerp(c001, c101, u);
  const x11 = lerp(c011, c111, u);
  const y0 = lerp(x00, x10, v);
  const y1 = lerp(x01, x11, v);
  return lerp(y0, y1, w) * 2 - 1;
}

// fBm
function fbm2(x, y, seed, octaves, lacunarity = 2, gain = 0.5) {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2(x * freq, y * freq, seed + i * 1013);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}
function fbm3(x, y, z, seed, octaves, lacunarity = 2, gain = 0.5) {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise3(x * freq, y * freq, z * freq, seed + i * 2017);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

// ---------- biomes ----------
const BIOME = {
  PLAINS: "PLAINS",
  FOREST: "FOREST",
  DESERT: "DESERT",
  TAIGA: "TAIGA",
  SNOWY_PLAINS: "SNOWY_PLAINS",
  JUNGLE: "JUNGLE",
  BEACH: "BEACH",
  OCEAN: "OCEAN",
  SWAMP: "SWAMP",
  SAVANNA: "SAVANNA",
  BADLANDS: "BADLANDS",
  MUSHROOM_FIELDS: "MUSHROOM_FIELDS",
};

function pickBiome(temp, humid, continent) {
  // continent < 0 → ocean
  if (continent < -0.15) return BIOME.OCEAN;
  // mushroom islands — very rare, low continent, specific temp/humid
  if (continent < -0.05 && temp > 0.2 && temp < 0.5 && humid > 0.3) return BIOME.MUSHROOM_FIELDS;
  // cold
  if (temp < -0.35) {
    if (humid < 0) return BIOME.SNOWY_PLAINS;
    return BIOME.TAIGA;
  }
  // hot
  if (temp > 0.45) {
    if (humid < -0.2) return BIOME.DESERT;
    if (humid < 0.1) return BIOME.SAVANNA;
    if (humid < 0.35) return BIOME.BADLANDS;
    return BIOME.JUNGLE;
  }
  // temperate
  if (humid > 0.35) return BIOME.SWAMP;
  if (humid > 0.05) return BIOME.FOREST;
  return BIOME.PLAINS;
}

// ---------- Generator ----------
export class Generator {
  constructor(seed = 1337) {
    this.seed = seed | 0;
    this.sTemp = (seed ^ 0xa1b2c3) | 0;
    this.sHumid = (seed ^ 0x5e6f70) | 0;
    this.sCont = (seed ^ 0x13572468) | 0;
    this.sErode = (seed ^ 0x2468ace0) | 0;
    this.sPv = (seed ^ 0x77bb1199) | 0;
    this.sCave = (seed ^ 0xcafe00) | 0;
    this.sCave2 = (seed ^ 0xbeef55) | 0;
    this.sOre = (seed ^ 0x0deade) | 0;
    this.sFeat = (seed ^ 0xfeed42) | 0;
    this.sDetail = (seed ^ 0x55a5a5) | 0;
  }

  // --- climate & terrain sampling ---
  _temperature(wx, wz) {
    return fbm2(wx * 0.0035, wz * 0.0035, this.sTemp, 3);
  }
  _humidity(wx, wz) {
    return fbm2(wx * 0.004, wz * 0.004, this.sHumid, 3);
  }
  _continent(wx, wz) {
    return fbm2(wx * 0.0018, wz * 0.0018, this.sCont, 4);
  }
  _erosion(wx, wz) {
    return fbm2(wx * 0.006, wz * 0.006, this.sErode, 3);
  }
  _peaksValleys(wx, wz) {
    return fbm2(wx * 0.012, wz * 0.012, this.sPv, 4);
  }
  _detail(wx, wz) {
    return fbm2(wx * 0.05, wz * 0.05, this.sDetail, 2);
  }

  getBiome(wx, wz) {
    const t = this._temperature(wx, wz);
    const h = this._humidity(wx, wz);
    const c = this._continent(wx, wz);
    const base = pickBiome(t, h, c);
    // beach override: if near sea level and warm/neutral and not ocean
    if (base !== BIOME.OCEAN && base !== BIOME.SNOWY_PLAINS && base !== BIOME.TAIGA) {
      const height = this.getHeight(wx, wz);
      if (height <= SEA_LEVEL + 2 && height >= SEA_LEVEL - 1 && base !== BIOME.DESERT && base !== BIOME.BADLANDS) {
        return BIOME.BEACH;
      }
    }
    return base;
  }

  getHeight(wx, wz) {
    const c = this._continent(wx, wz);        // -1..1
    const e = this._erosion(wx, wz);          // -1..1
    const pv = this._peaksValleys(wx, wz);    // -1..1
    const d = this._detail(wx, wz) * 0.5;

    // base continent → ocean floor .. land
    let h;
    if (c < -0.15) {
      // ocean: 42..58
      h = 50 + c * 20;
    } else if (c < 0.05) {
      // coastal shelf
      h = SEA_LEVEL + (c + 0.15) * 40;
    } else {
      // land
      const landBase = SEA_LEVEL + 2 + c * 8;
      const eroded = 1 - Math.max(0, Math.min(1, e * 0.5 + 0.5));
      const mountainy = Math.max(0, pv) * eroded;
      h = landBase + mountainy * 30 + pv * 6;
    }
    h += d * 3;
    return Math.max(1, Math.min(CHUNK_HEIGHT - 2, Math.floor(h)));
  }

  // --- surface palette per biome ---
  _surfaceFor(biome, y, topY, wx, wz) {
    // returns { top, filler, fillerDepth }
    switch (biome) {
      case BIOME.DESERT:
        return { top: ID.sand, filler: ID.sandstone, fillerDepth: 4 };
      case BIOME.BEACH:
        return { top: ID.sand, filler: ID.sand, fillerDepth: 3 };
      case BIOME.SNOWY_PLAINS:
        return { top: ID.snow_block, filler: ID.dirt, fillerDepth: 3 };
      case BIOME.TAIGA: {
        // podzol patches
        const p = rand2(wx, wz, this.sFeat ^ 0xaa55);
        if (p > 0.78) return { top: ID.podzol, filler: ID.dirt, fillerDepth: 3 };
        if (topY > 78 && rand2(wx, wz, this.sFeat ^ 0x7777) > 0.55)
          return { top: ID.snow_block, filler: ID.dirt, fillerDepth: 3 };
        return { top: ID.grass_block, filler: ID.dirt, fillerDepth: 3 };
      }
      case BIOME.BADLANDS: {
        // red sand on top, red sandstone strata
        const band = Math.floor(y / 3) & 1;
        return { top: ID.red_sand, filler: band ? ID.red_sandstone : ID.sandstone, fillerDepth: 6 };
      }
      case BIOME.MUSHROOM_FIELDS:
        return { top: ID.mycelium, filler: ID.dirt, fillerDepth: 3 };
      case BIOME.SWAMP:
        return { top: ID.grass_block, filler: ID.dirt, fillerDepth: 3 };
      case BIOME.SAVANNA:
        return { top: ID.grass_block, filler: ID.dirt, fillerDepth: 3 };
      case BIOME.JUNGLE:
      case BIOME.FOREST:
      case BIOME.PLAINS:
      default:
        return { top: ID.grass_block, filler: ID.dirt, fillerDepth: 3 };
      case BIOME.OCEAN:
        return { top: ID.gravel, filler: ID.dirt, fillerDepth: 2 };
    }
  }

  // --- caves ---
  _isCave(wx, y, wz) {
    if (y < 5 || y > 110) return false;
    const n1 = fbm3(wx * 0.05, y * 0.07, wz * 0.05, this.sCave, 3);
    const n2 = fbm3(wx * 0.05, y * 0.07, wz * 0.05, this.sCave2, 3);
    // thin: carve only where both are near zero (ridged intersection)
    const a = Math.abs(n1);
    const b = Math.abs(n2);
    return a < 0.08 && b < 0.08;
  }

  // --- ores ---
  _oreAt(wx, y, wz, stoneId) {
    // evaluate from rarest to commonest; deterministic per-block
    if (y <= 16) {
      const r = hash3(wx, y, wz, this.sOre ^ 0x11) / 4294967296;
      if (r < 0.008) return ID.diamond_ore;
    }
    if (y <= 16) {
      const r = hash3(wx, y, wz, this.sOre ^ 0x22) / 4294967296;
      if (r < 0.012) return ID.redstone_ore;
    }
    if (y <= 32) {
      const r = hash3(wx, y, wz, this.sOre ^ 0x33) / 4294967296;
      if (r < 0.010) return ID.gold_ore;
    }
    if (y <= 32) {
      const r = hash3(wx, y, wz, this.sOre ^ 0x44) / 4294967296;
      if (r < 0.010) return ID.lapis_ore;
    }
    // emerald: only if we are in a "mountain" column → caller handles via filter
    if (y <= 64) {
      const r = hash3(wx, y, wz, this.sOre ^ 0x55) / 4294967296;
      if (r < 0.025) return ID.iron_ore;
    }
    if (y <= 96) {
      const r = hash3(wx, y, wz, this.sOre ^ 0x66) / 4294967296;
      if (r < 0.022) return ID.copper_ore;
    }
    if (y <= 120) {
      const r = hash3(wx, y, wz, this.sOre ^ 0x77) / 4294967296;
      if (r < 0.030) return ID.coal_ore;
    }
    return stoneId;
  }

  _emeraldAt(wx, y, wz) {
    if (y > 32) return false;
    return hash3(wx, y, wz, this.sOre ^ 0x88) / 4294967296 < 0.006;
  }

  // --- chunk generation ---
  generateChunk(chunkX, chunkZ) {
    const data = new Uint16Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    const idx = (x, y, z) => x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
    const set = (x, y, z, v) => {
      if (x < 0 || z < 0 || x >= CHUNK_SIZE || z >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT) return;
      data[idx(x, y, z)] = v;
    };
    const get = (x, y, z) => {
      if (x < 0 || z < 0 || x >= CHUNK_SIZE || z >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT) return ID.air;
      return data[idx(x, y, z)];
    };

    const heights = new Int32Array(CHUNK_SIZE * CHUNK_SIZE);
    const biomes = new Array(CHUNK_SIZE * CHUNK_SIZE);

    // --- pass 1: columns (terrain, surface, water, caves, ores) ---
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = chunkX * CHUNK_SIZE + lx;
        const wz = chunkZ * CHUNK_SIZE + lz;
        const h = this.getHeight(wx, wz);
        const biome = this.getBiome(wx, wz);
        heights[lx + lz * CHUNK_SIZE] = h;
        biomes[lx + lz * CHUNK_SIZE] = biome;
        const mountainy = h > 85;

        const surf = this._surfaceFor(biome, h, h, wx, wz);

        // bedrock + stone fill
        for (let y = 0; y <= h; y++) {
          let block;
          if (y === 0) {
            block = ID.bedrock;
          } else if (y <= 3 && rand3(wx, y, wz, this.seed ^ 0xbedbed) > y / 4) {
            block = ID.bedrock;
          } else if (y >= h - surf.fillerDepth && y < h) {
            block = surf.filler;
          } else if (y === h) {
            block = surf.top;
          } else {
            const stoneId = y < 8 ? ID.deepslate : ID.stone;
            // cave carve
            if (this._isCave(wx, y, wz) && y < h - 2) {
              block = ID.air;
            } else {
              block = this._oreAt(wx, y, wz, stoneId);
              // mountain-only emerald override
              if (mountainy && block === stoneId && this._emeraldAt(wx, y, wz)) {
                block = ID.emerald_ore;
              }
            }
          }
          set(lx, y, lz, block);
        }

        // water fill up to sea level
        if (h < SEA_LEVEL) {
          for (let y = h + 1; y <= SEA_LEVEL; y++) {
            set(lx, y, lz, ID.water);
          }
          // surface adjustment: if biome's "top" got placed but we're underwater, convert top to dirt/sand
          if (biome !== BIOME.BEACH && biome !== BIOME.DESERT && biome !== BIOME.OCEAN && biome !== BIOME.BADLANDS) {
            // leave as-is unless snowy: ice surface
          }
          // snowy → ice cap
          if (biome === BIOME.SNOWY_PLAINS || biome === BIOME.TAIGA) {
            if (get(lx, SEA_LEVEL, lz) === ID.water) set(lx, SEA_LEVEL, lz, ID.ice);
          }
        }

        // swamp water pools above land: small chance near low elevation
        if (biome === BIOME.SWAMP && h <= SEA_LEVEL + 1) {
          if (rand2(wx, wz, this.sFeat ^ 0xbada55) > 0.85) {
            set(lx, h, lz, ID.water);
          }
        }
      }
    }

    // --- pass 2: features (trees, plants) with 2-chunk buffer ---
    // Iterate candidate feature origins in neighboring chunks so features crossing
    // boundaries are placed consistently.
    for (let dcx = -1; dcx <= 1; dcx++) {
      for (let dcz = -1; dcz <= 1; dcz++) {
        const ccx = chunkX + dcx;
        const ccz = chunkZ + dcz;
        this._placeFeaturesIntoChunk(ccx, ccz, chunkX, chunkZ, data, heights, biomes);
      }
    }

    return data;
  }

  // Place features whose origin lives in chunk (ccx, ccz), writing any blocks
  // that land inside the target chunk (tcx, tcz).
  _placeFeaturesIntoChunk(ccx, ccz, tcx, tcz, data, heights, biomes) {
    const CSIZE = CHUNK_SIZE;
    const writeBlock = (wx, wy, wz, v, overwrite) => {
      const lx = wx - tcx * CSIZE;
      const lz = wz - tcz * CSIZE;
      if (lx < 0 || lz < 0 || lx >= CSIZE || lz >= CSIZE) return;
      if (wy < 0 || wy >= CHUNK_HEIGHT) return;
      const i = lx + lz * CSIZE + wy * CSIZE * CSIZE;
      if (!overwrite && data[i] !== ID.air && data[i] !== ID.oak_leaves && data[i] !== ID.birch_leaves && data[i] !== ID.spruce_leaves) return;
      data[i] = v;
    };
    const readBlock = (wx, wy, wz) => {
      const lx = wx - tcx * CSIZE;
      const lz = wz - tcz * CSIZE;
      if (lx < 0 || lz < 0 || lx >= CSIZE || lz >= CSIZE) return -1; // unknown/out
      if (wy < 0 || wy >= CHUNK_HEIGHT) return ID.air;
      return data[lx + lz * CSIZE + wy * CSIZE * CSIZE];
    };
    const getHeightCached = (wx, wz) => {
      if (wx >= tcx * CSIZE && wx < (tcx + 1) * CSIZE && wz >= tcz * CSIZE && wz < (tcz + 1) * CSIZE) {
        return heights[(wx - tcx * CSIZE) + (wz - tcz * CSIZE) * CSIZE];
      }
      return this.getHeight(wx, wz);
    };
    const getBiomeCached = (wx, wz) => {
      if (wx >= tcx * CSIZE && wx < (tcx + 1) * CSIZE && wz >= tcz * CSIZE && wz < (tcz + 1) * CSIZE) {
        return biomes[(wx - tcx * CSIZE) + (wz - tcz * CSIZE) * CSIZE];
      }
      return this.getBiome(wx, wz);
    };

    // iterate every column in source chunk — decide if it spawns a feature
    for (let lx = 0; lx < CSIZE; lx++) {
      for (let lz = 0; lz < CSIZE; lz++) {
        const wx = ccx * CSIZE + lx;
        const wz = ccz * CSIZE + lz;
        const h = getHeightCached(wx, wz);
        const biome = getBiomeCached(wx, wz);
        if (h < SEA_LEVEL) continue;
        const featSeed = this.sFeat;
        const r = rand2(wx, wz, featSeed);

        // density per biome
        let treeChance = 0;
        let treeType = null;
        switch (biome) {
          case BIOME.FOREST:     treeChance = 0.08; break;
          case BIOME.JUNGLE:     treeChance = 0.10; break;
          case BIOME.TAIGA:      treeChance = 0.07; break;
          case BIOME.PLAINS:     treeChance = 0.012; break;
          case BIOME.SAVANNA:    treeChance = 0.010; break;
          case BIOME.SWAMP:      treeChance = 0.04; break;
          case BIOME.BADLANDS:   treeChance = 0.004; break;
          case BIOME.SNOWY_PLAINS: treeChance = 0.006; break;
        }
        if (r < treeChance) {
          // pick tree type
          const pick = rand2(wx + 31, wz - 17, featSeed ^ 0x12abcd);
          if (biome === BIOME.TAIGA || biome === BIOME.SNOWY_PLAINS) treeType = "spruce";
          else if (biome === BIOME.FOREST) treeType = pick < 0.5 ? "oak" : "birch";
          else if (biome === BIOME.JUNGLE) treeType = "oak";
          else treeType = "oak";
          this._placeTree(treeType, wx, h + 1, wz, writeBlock, readBlock);
          continue;
        }

        // cactus in desert
        if (biome === BIOME.DESERT && rand2(wx, wz, featSeed ^ 0xcac1) < 0.015) {
          const height = 1 + Math.floor(rand2(wx, wz, featSeed ^ 0xcac2) * 3);
          for (let i = 0; i < height; i++) writeBlock(wx, h + 1 + i, wz, ID.cactus, false);
          continue;
        }

        // flowers / tall grass on grass-topped biomes
        if (biome === BIOME.PLAINS || biome === BIOME.FOREST || biome === BIOME.SAVANNA || biome === BIOME.SWAMP) {
          const rp = rand2(wx, wz, featSeed ^ 0x70a51);
          if (rp < 0.03) writeBlock(wx, h + 1, wz, ID.flower_red, false);
          else if (rp < 0.06) writeBlock(wx, h + 1, wz, ID.flower_yellow, false);
          else if (rp < 0.18) writeBlock(wx, h + 1, wz, ID.tall_grass, false);
          // pumpkins
          if ((biome === BIOME.FOREST || biome === BIOME.PLAINS) &&
              rand2(wx, wz, featSeed ^ 0x9009) < 0.004) {
            writeBlock(wx, h + 1, wz, ID.pumpkin, false);
          }
        }
      }
    }
  }

  // --- tree placers ---
  _placeTree(type, wx, baseY, wz, writeBlock, readBlock) {
    const rH = rand2(wx * 3 + 1, wz * 5 + 2, this.sFeat ^ 0xaaaa);
    if (type === "oak") {
      const trunkH = 4 + Math.floor(rH * 3);
      for (let i = 0; i < trunkH; i++) writeBlock(wx, baseY + i, wz, ID.oak_log, true);
      // leaves: rough 5x5x3 + top 3x3
      const ly = baseY + trunkH;
      for (let dy = -1; dy <= 1; dy++) {
        const r = dy === 0 ? 2 : 2;
        for (let dx = -r; dx <= r; dx++) {
          for (let dz = -r; dz <= r; dz++) {
            if (Math.abs(dx) === r && Math.abs(dz) === r && rand3(wx + dx, ly + dy, wz + dz, this.sFeat ^ 0xf00d) < 0.5) continue;
            if (dx === 0 && dz === 0 && dy < 1) continue;
            writeBlock(wx + dx, ly + dy, wz + dz, ID.oak_leaves, false);
          }
        }
      }
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        writeBlock(wx + dx, ly + 2, wz + dz, ID.oak_leaves, false);
      }
      writeBlock(wx, ly + 2, wz, ID.oak_leaves, false);
    } else if (type === "birch") {
      const trunkH = 5 + Math.floor(rH * 3);
      for (let i = 0; i < trunkH; i++) writeBlock(wx, baseY + i, wz, ID.birch_log, true);
      const ly = baseY + trunkH;
      for (let dy = -1; dy <= 1; dy++) {
        const r = dy === 0 ? 2 : 1;
        for (let dx = -r; dx <= r; dx++) {
          for (let dz = -r; dz <= r; dz++) {
            if (Math.abs(dx) === r && Math.abs(dz) === r && rand3(wx + dx, ly + dy, wz + dz, this.sFeat ^ 0xbeef) < 0.4) continue;
            if (dx === 0 && dz === 0 && dy < 1) continue;
            writeBlock(wx + dx, ly + dy, wz + dz, ID.birch_leaves, false);
          }
        }
      }
      writeBlock(wx, ly + 1, wz, ID.birch_leaves, false);
    } else if (type === "spruce") {
      const trunkH = 6 + Math.floor(rH * 4);
      for (let i = 0; i < trunkH; i++) writeBlock(wx, baseY + i, wz, ID.spruce_log, true);
      // conical leaves: wider at bottom, narrower at top
      let radius = 3;
      const leafBase = baseY + Math.floor(trunkH / 2);
      const leafTop = baseY + trunkH + 1;
      for (let y = leafBase; y <= leafTop; y++) {
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dz = -radius; dz <= radius; dz++) {
            const d = Math.abs(dx) + Math.abs(dz);
            if (d > radius) continue;
            if (dx === 0 && dz === 0 && y < leafTop) continue;
            writeBlock(wx + dx, y, wz + dz, ID.spruce_leaves, false);
          }
        }
        // alternate shrink
        if ((y - leafBase) % 2 === 0 && radius > 0) radius--;
      }
      writeBlock(wx, leafTop, wz, ID.spruce_leaves, false);
    }
  }
}
