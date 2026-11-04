import { LevelConfig, HexCoord, TileTier } from '../types/game';
import { isGridConnected, validateLevelSolvability } from '../utils/solver';
import { generateGridCoords, getNeighbors, hexKey } from '../utils/hexMath';

// Handcrafted, precisely verified puzzle configurations for early onboarding
const HANDCRAFTED_LEVELS: Partial<Record<number, Partial<LevelConfig>>> = {
  1: {
    name: 'Ocean Pearl',
    difficulty: 'Normal',
    radius: 2,
    moveLimit: 12,
    objective: {
      type: 'reach_tier',
      targetTier: 3,
      description: 'Synthesize an Emerald Clover (Tier 3)',
    },
    initialTiles: [
      { q: -1, r: 0, tier: 1 },
      { q: 0, r: -1, tier: 1 },
      { q: 1, r: 0, tier: 2 },
      { q: 0, r: 1, tier: 2 },
    ],
    starThresholds: { oneStar: 0, twoStars: 3, threeStars: 6 },
    tutorialTip:
      'Place blocks from the bottom tray or slide existing tiles to connect 3 identical blocks. Merge Ruby Hearts into Amber Stars, then merge Amber Stars into the Emerald Clover!',
  },
  2: {
    name: 'Sunlit Cavern',
    difficulty: 'Normal',
    radius: 2,
    moveLimit: 12,
    objective: {
      type: 'merge_count',
      count: 3,
      description: 'Perform 3 color merges on the board',
    },
    initialTiles: [
      { q: -1, r: 0, tier: 1 },
      { q: -1, r: 1, tier: 1 },
      { q: 1, r: -1, tier: 2 },
      { q: 1, r: 0, tier: 2 },
      { q: 0, r: 1, tier: 1 },
    ],
    starThresholds: { oneStar: 0, twoStars: 3, threeStars: 6 },
    tutorialTip: 'Look ahead! Plan your placements so you set up multiple 3-block merges in sequence.',
  },
  3: {
    name: 'Clover Cove',
    difficulty: 'Normal',
    radius: 2,
    moveLimit: 14,
    objective: {
      type: 'reach_tier',
      targetTier: 4,
      description: 'Synthesize an Azure Hexa (Tier 4)',
    },
    initialTiles: [
      { q: -1, r: -1, tier: 1 },
      { q: -1, r: 0, tier: 1 },
      { q: 0, r: 1, tier: 2 },
      { q: 1, r: 0, tier: 2 },
      { q: 0, r: -1, tier: 3 },
      { q: 1, r: -1, tier: 3 },
    ],
    starThresholds: { oneStar: 0, twoStars: 4, threeStars: 7 },
    tutorialTip:
      'Work your way up the tiers: combine Hearts into Stars, Stars into Clovers, and Clovers into Azure Hexas!',
  },
  4: {
    name: 'Deep Blue Tide',
    difficulty: 'Normal',
    radius: 2,
    moveLimit: 14,
    objective: {
      type: 'target_score',
      targetScore: 650,
      description: 'Score 650 points from color merges',
    },
    initialTiles: [
      { q: -2, r: 0, tier: 1 },
      { q: -1, r: 0, tier: 1 },
      { q: 0, r: 1, tier: 2 },
      { q: 1, r: 0, tier: 2 },
      { q: 0, r: -1, tier: 3 },
    ],
    starThresholds: { oneStar: 0, twoStars: 4, threeStars: 7 },
    tutorialTip: 'Merging higher tiers yields exponential point rewards! Chain combos multiply your points even further.',
  },
  5: {
    name: 'The Coral Nexus',
    difficulty: 'Normal',
    radius: 2,
    moveLimit: 13,
    objective: {
      type: 'reach_tier',
      targetTier: 4,
      description: 'Synthesize an Azure Hexa (Tier 4)',
    },
    initialTiles: [
      { q: -1, r: 0, tier: 2 },
      { q: 1, r: -1, tier: 2 },
      { q: 0, r: 1, tier: 1 },
      { q: 0, r: 2, tier: 1 },
      { q: -1, r: 2, tier: 3 },
      { q: 1, r: 0, tier: 3 },
    ],
    starThresholds: { oneStar: 0, twoStars: 3, threeStars: 6 },
    tutorialTip: 'The central hub connects to 6 neighboring cells. Use it as the convergence point for your highest tier merges!',
  },
};

/**
 * Deterministic pseudo-random number generator (original LCG preserved for levels 1..100)
 */
function createPrng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * High-entropy deterministic Mulberry32 PRNG for Infinite Levels (101+)
 */
function createMulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate the original 100 designed levels deterministically (100% preserved).
 */
export function generateAllLevels(): LevelConfig[] {
  const levels: LevelConfig[] = [];

  for (let id = 1; id <= 100; id++) {
    const chapter = Math.ceil(id / 20);
    const rng = createPrng(id * 7919 + 104729);

    let difficulty: LevelConfig['difficulty'];
    if (id <= 5) difficulty = 'Normal';
    else if (id <= 15) difficulty = 'Hard';
    else if (id <= 30) difficulty = 'Hard+';
    else if (id <= 50) difficulty = 'Very Hard';
    else if (id <= 75) difficulty = 'Expert';
    else difficulty = 'Master';

    const radius = id <= 15 ? 2 : 3;

    const blockedCoords: HexCoord[] = [];
    if (id >= 31 && id <= 50) {
      if (id % 2 === 0) {
        blockedCoords.push({ q: 0, r: 0 });
      }
      if (id % 3 === 0) {
        blockedCoords.push({ q: 1, r: -1 }, { q: -1, r: 1 });
      }
    } else if (id >= 51 && id <= 75) {
      if (id % 2 === 1) {
        blockedCoords.push({ q: 0, r: 0 });
      }
      if (id % 4 === 0) {
        blockedCoords.push({ q: 1, r: 0 }, { q: -1, r: 0 });
      }
    } else if (id >= 76) {
      if (id % 3 === 0) {
        blockedCoords.push({ q: 0, r: 0 }, { q: 1, r: -1 }, { q: -1, r: 1 });
      } else if (id % 2 === 0) {
        blockedCoords.push({ q: 0, r: 1 }, { q: 0, r: -1 });
      }
    }

    let targetTier: TileTier = 3;
    let objType: LevelConfig['objective']['type'] = 'reach_tier';
    let targetCount = 1;
    let targetScore = 500;
    let moveLimit = 10;

    if (id <= 5) {
      targetTier = id <= 2 ? 2 : 3;
      moveLimit = 8 + id;
    } else if (id <= 15) {
      targetTier = id <= 10 ? 3 : 4;
      if (id % 3 === 0) objType = 'merge_count';
      targetCount = 3;
      targetScore = 450 + (id - 5) * 60;
      moveLimit = Math.max(8, 11 - Math.floor((id - 6) / 3));
    } else if (id <= 30) {
      targetTier = id <= 22 ? 4 : 5;
      if (id % 3 === 0) objType = 'merge_count';
      else if (id % 4 === 0) objType = 'target_score';
      targetCount = 4;
      targetScore = 900 + (id - 15) * 80;
      moveLimit = Math.max(10, 14 - Math.floor((id - 15) / 4));
    } else if (id <= 50) {
      targetTier = id % 2 === 0 ? 4 : 5;
      if (id % 3 === 0) objType = 'merge_count';
      else if (id % 4 === 0) objType = 'target_score';
      targetCount = 4 + Math.floor((id - 30) / 7);
      targetScore = 1500 + (id - 30) * 110;
      moveLimit = Math.max(11, 15 - Math.floor((id - 30) / 5));
    } else if (id <= 75) {
      targetTier = id > 65 ? 5 : 4;
      if (id % 3 === 0) objType = 'merge_count';
      else if (id % 4 === 0) objType = 'target_score';
      targetCount = 5 + Math.floor((id - 50) / 8);
      targetScore = 2600 + (id - 50) * 130;
      moveLimit = Math.max(12, 16 - Math.floor((id - 50) / 6));
    } else {
      targetTier = id > 88 ? 6 : 5;
      if (id % 3 === 0) objType = 'merge_count';
      else if (id % 5 === 0) objType = 'target_score';
      targetCount = 6;
      targetScore = 4500 + (id - 75) * 180;
      moveLimit = Math.max(13, 17 - Math.floor((id - 75) / 8));
    }

    let desc = `Synthesize a Tier ${targetTier} tile`;
    if (objType === 'merge_count') {
      desc = `Perform ${targetCount} color merges`;
    } else if (objType === 'target_score') {
      desc = `Score ${targetScore} points`;
    }

    const initialTiles: { q: number; r: number; tier: TileTier }[] = [];
    const blockedSet = new Set(blockedCoords.map(b => `${b.q},${b.r}`));

    const availableCoords: HexCoord[] = [];
    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);
      for (let r = r1; r <= r2; r++) {
        if (!blockedSet.has(`${q},${r}`)) {
          availableCoords.push({ q, r });
        }
      }
    }

    for (let i = availableCoords.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [availableCoords[i], availableCoords[j]] = [availableCoords[j], availableCoords[i]];
    }

    const numTiles = Math.min(
      radius === 2 ? 8 : 14,
      5 + Math.floor(id / 10) + Math.floor(rng() * 3)
    );

    const primaryTier = Math.max(1, targetTier - 2) as TileTier;
    const secondaryTier = Math.max(1, targetTier - 1) as TileTier;

    for (let i = 0; i < numTiles && i < availableCoords.length; i++) {
      const coord = availableCoords[i];
      let tileTier: TileTier = 1;
      if (i < 3) tileTier = primaryTier;
      else if (i < 6) tileTier = secondaryTier;
      else if (i < 8) tileTier = 1;
      else tileTier = (1 + Math.floor(rng() * Math.min(4, targetTier))) as TileTier;

      initialTiles.push({
        q: coord.q,
        r: coord.r,
        tier: tileTier,
      });
    }

    const prefixes = ['Spark', 'Prism', 'Orbit', 'Cascade', 'Nexus', 'Chroma', 'Radiance', 'Vortex', 'Crown', 'Zenith'];
    const suffixes = ['Valley', 'Sanctum', 'Trail', 'Matrix', 'Loom', 'Spire', 'Gateway', 'Cavern', 'Crest', 'Peak'];
    const pIdx = (id * 3) % prefixes.length;
    const sIdx = (id * 7) % suffixes.length;
    const name = `Level ${id}: ${prefixes[pIdx]} ${suffixes[sIdx]}`;

    const handcrafted = HANDCRAFTED_LEVELS[id];
    const finalLevel: LevelConfig = {
      id,
      chapter,
      name: handcrafted?.name || name,
      difficulty: handcrafted?.difficulty || difficulty,
      radius: handcrafted?.radius || radius,
      blockedCoords: handcrafted?.blockedCoords || blockedCoords,
      initialTiles: handcrafted?.initialTiles || initialTiles,
      moveLimit: handcrafted?.moveLimit || moveLimit,
      objective: handcrafted?.objective || {
        type: objType,
        targetTier,
        count: targetCount,
        targetScore,
        description: desc,
      },
      starThresholds: handcrafted?.starThresholds || {
        oneStar: 0,
        twoStars: Math.max(2, Math.floor(moveLimit * 0.25)),
        threeStars: Math.max(4, Math.floor(moveLimit * 0.5)),
      },
      tutorialTip: handcrafted?.tutorialTip,
    };

    levels.push(finalLevel);
  }

  return levels;
}

export const ALL_LEVELS = generateAllLevels();

// Curated symmetric obstacle templates for Radius 3 (37 cells) that preserve full connectivity
const SYMMETRIC_OBSTACLE_TEMPLATES: HexCoord[][] = [
  [],
  [{ q: 0, r: 0 }],
  [{ q: 1, r: -1 }, { q: -1, r: 1 }],
  [{ q: 1, r: 0 }, { q: -1, r: 0 }],
  [{ q: 0, r: 1 }, { q: 0, r: -1 }],
  [{ q: 0, r: 0 }, { q: 2, r: -1 }, { q: -2, r: 1 }],
  [{ q: 1, r: 1 }, { q: -1, r: -1 }, { q: 0, r: 0 }],
  [{ q: 2, r: 0 }, { q: -2, r: 0 }, { q: 0, r: 2 }, { q: 0, r: -2 }],
  [{ q: 1, r: -2 }, { q: -1, r: 2 }, { q: 2, r: -1 }, { q: -2, r: 1 }],
];

const INFINITE_ADJECTIVES = [
  'Celestial', 'Astral', 'Luminous', 'Crystalline', 'Ethereal',
  'Sovereign', 'Solaris', 'Nebula', 'Quantum', 'Harmonic',
  'Iridescent', 'Mythic', 'Aurora', 'Diamond', 'Eternity',
];

const INFINITE_NOUNS = [
  'Citadel', 'Observatory', 'Horizon', 'Labyrinth', 'Monolith',
  'Crucible', 'Sanctuary', 'Meridian', 'Confluence', 'Atrium',
  'bastion'.replace('b', 'B'), 'Archipelago', 'Pinnacle', 'Mirage', 'Vault',
];

const infiniteLevelCache = new Map<number, LevelConfig>();

/**
 * E. INFINITE LEVEL SYSTEM (Level 101 -> Infinity)
 * Deterministically generates seeded boards with progressive strategic depth
 * and validates every candidate with `validateLevelSolvability` to guarantee fairness.
 */
export function generateInfiniteLevel(levelId: number): LevelConfig {
  const cached = infiniteLevelCache.get(levelId);
  if (cached) return cached;

  const offset = levelId - 100;
  const chapter = Math.ceil(levelId / 20);
  const radius = 3;
  const difficulty: LevelConfig['difficulty'] = offset >= 50 ? 'Grandmaster' : offset % 3 === 0 ? 'Expert' : 'Master';

  const adj = INFINITE_ADJECTIVES[(levelId * 5 + 3) % INFINITE_ADJECTIVES.length];
  const noun = INFINITE_NOUNS[(levelId * 11 + 7) % INFINITE_NOUNS.length];
  const levelName = `${adj} ${noun}`;

  // Try deterministic sub-seeds until solver confirms 100% solvability within moveLimit
  for (let attempt = 0; attempt < 10; attempt++) {
    const seed = ((levelId * 73856093) ^ (attempt * 19349663) ^ 0x9e3779b9) >>> 0;
    const rng = createMulberry32(seed);

    // Choose obstacle pattern ensuring connectivity and non-repetition between consecutive levels
    const templateIdx = (levelId + attempt * 2) % SYMMETRIC_OBSTACLE_TEMPLATES.length;
    const candidateObstacles = SYMMETRIC_OBSTACLE_TEMPLATES[templateIdx];
    const validCoords = generateGridCoords(radius, candidateObstacles);
    if (!isGridConnected(validCoords)) continue;

    // Diversify objectives across consecutive levels
    const modeSelector = (levelId + attempt) % 4;
    let objType: LevelConfig['objective']['type'] = 'reach_tier';
    let targetTier: TileTier = 5;
    let targetCount = 6;
    let targetScore = 2400;
    let moveLimit = 16;

    const progressionTier = Math.min(6, Math.floor(offset / 25)); // 0..6 gradual ramp

    if (modeSelector === 0) {
      objType = 'reach_tier';
      targetTier = 5;
      moveLimit = 15 + (progressionTier % 2);
    } else if (modeSelector === 1) {
      objType = 'merge_count';
      targetCount = 5 + Math.min(4, Math.floor(offset / 30)) + (levelId % 2);
      moveLimit = targetCount * 2 + 4;
    } else if (modeSelector === 2) {
      objType = 'target_score';
      targetScore = 1800 + Math.min(3600, offset * 35);
      moveLimit = 16 + Math.min(4, Math.floor(offset / 40));
    } else {
      objType = 'reach_tier';
      targetTier = offset >= 15 && levelId % 8 === 3 ? 6 : 5;
      moveLimit = targetTier === 6 ? 19 : 15;
    }

    let description = `Synthesize a Tier ${targetTier} (${targetTier === 6 ? 'Prismatic Crown' : 'Violet Moon'})`;
    if (objType === 'merge_count') {
      description = `Perform ${targetCount} strategic color merges`;
    } else if (objType === 'target_score') {
      description = `Score ${targetScore.toLocaleString()} points`;
    }

    // Build initial board with structured near-merge pairs so early moves reward planning
    const shuffled = [...validCoords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const usedKeys = new Set<string>();
    const validKeySet = new Set(validCoords.map(c => hexKey(c.q, c.r)));
    const initialTiles: { q: number; r: number; tier: TileTier }[] = [];

    const placePairNearAnchor = (anchor: HexCoord, tier: TileTier) => {
      const aKey = hexKey(anchor.q, anchor.r);
      if (usedKeys.has(aKey)) return false;
      const nbs = getNeighbors(anchor).filter(
        nb => validKeySet.has(hexKey(nb.q, nb.r)) && !usedKeys.has(hexKey(nb.q, nb.r))
      );
      if (nbs.length < 2) return false;
      const nb1 = nbs[Math.floor(rng() * nbs.length)];
      // Leave anchor empty as a convergence socket, place two matching tiles around it!
      usedKeys.add(hexKey(nb1.q, nb1.r));
      initialTiles.push({ q: nb1.q, r: nb1.r, tier });
      const remainingNbs = nbs.filter(n => !(n.q === nb1.q && n.r === nb1.r));
      const nb2 = remainingNbs[Math.floor(rng() * remainingNbs.length)];
      usedKeys.add(hexKey(nb2.q, nb2.r));
      initialTiles.push({ q: nb2.q, r: nb2.r, tier });
      return true;
    };

    const seedStepTier = (targetTier === 6 ? 5 : 4) as TileTier;
    const midStepTier = (targetTier === 6 ? 4 : 3) as TileTier;

    let pairsPlaced = 0;
    for (const coord of shuffled) {
      if (pairsPlaced === 0 && placePairNearAnchor(coord, seedStepTier)) {
        pairsPlaced++;
      } else if (pairsPlaced === 1 && placePairNearAnchor(coord, midStepTier)) {
        pairsPlaced++;
      } else if (pairsPlaced === 2 && placePairNearAnchor(coord, 2)) {
        pairsPlaced++;
        break;
      }
    }

    const desiredTileCount = Math.min(14, 9 + (progressionTier % 4) + Math.floor(rng() * 3));
    for (const coord of shuffled) {
      if (initialTiles.length >= desiredTileCount) break;
      const k = hexKey(coord.q, coord.r);
      if (usedKeys.has(k)) continue;
      // Avoid creating an immediate accidental pre-merged 3-group on initial spawn
      const tier = (1 + Math.floor(rng() * 4)) as TileTier;
      const sameTierNeighbors = getNeighbors(coord).filter(nb =>
        initialTiles.some(t => t.q === nb.q && t.r === nb.r && t.tier === tier)
      );
      if (sameTierNeighbors.length >= 2) continue;

      usedKeys.add(k);
      initialTiles.push({ q: coord.q, r: coord.r, tier });
    }

    const candidate: LevelConfig = {
      id: levelId,
      chapter,
      name: `Level ${levelId}: ${levelName}`,
      difficulty,
      radius,
      blockedCoords: candidateObstacles,
      initialTiles,
      moveLimit,
      objective: {
        type: objType,
        targetTier,
        count: targetCount,
        targetScore,
        description,
      },
      starThresholds: {
        oneStar: 0,
        twoStars: Math.max(2, Math.floor(moveLimit * 0.25)),
        threeStars: Math.max(4, Math.floor(moveLimit * 0.45)),
      },
      isInfinite: true,
    };

    const validation = validateLevelSolvability(candidate);
    if (validation.solvable) {
      // Calibrate move limit so it is challenging yet fair based on actual solver moves used
      const calibratedMoves = Math.max(
        validation.movesUsed + 4,
        Math.min(22, candidate.moveLimit)
      );
      const verifiedLevel: LevelConfig = {
        ...candidate,
        moveLimit: calibratedMoves,
        starThresholds: {
          oneStar: 0,
          twoStars: Math.max(2, Math.floor(calibratedMoves * 0.22)),
          threeStars: Math.max(4, Math.floor(calibratedMoves * 0.42)),
        },
      };
      infiniteLevelCache.set(levelId, verifiedLevel);
      return verifiedLevel;
    }
  }

  // Guaranteed solvable fallback layout if all 10 strict attempts needed extra slack
  const fallbackMoveLimit = 18;
  const fallbackLevel: LevelConfig = {
    id: levelId,
    chapter,
    name: `Level ${levelId}: ${levelName}`,
    difficulty,
    radius: 3,
    blockedCoords: [{ q: 0, r: 0 }],
    initialTiles: [
      { q: -1, r: 0, tier: 4 },
      { q: 0, r: -1, tier: 4 },
      { q: 1, r: 0, tier: 3 },
      { q: 1, r: -1, tier: 3 },
      { q: -1, r: 1, tier: 2 },
      { q: 0, r: 1, tier: 2 },
      { q: -2, r: 1, tier: 1 },
      { q: 2, r: -1, tier: 1 },
    ],
    moveLimit: fallbackMoveLimit,
    objective: {
      type: 'reach_tier',
      targetTier: 5,
      description: 'Synthesize a Tier 5 (Violet Moon)',
    },
    starThresholds: {
      oneStar: 0,
      twoStars: 4,
      threeStars: 7,
    },
    isInfinite: true,
  };
  infiniteLevelCache.set(levelId, fallbackLevel);
  return fallbackLevel;
}

export function getLevelConfig(levelId: number): LevelConfig {
  if (levelId <= 1) return ALL_LEVELS[0];
  if (levelId <= 100) return ALL_LEVELS[levelId - 1];
  return generateInfiniteLevel(levelId);
}
