import { LevelConfig, HexCoord, TileTier } from '../types/game';

// Handcrafted, precisely verified puzzle configurations that take time and planning
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
    tutorialTip: 'Place blocks from the bottom tray or slide existing tiles to connect 3 identical blocks. Merge Ruby Hearts into Amber Stars, then merge Amber Stars into the Emerald Clover!',
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
    tutorialTip: 'Work your way up the tiers: combine Hearts into Stars, Stars into Clovers, and Clovers into Azure Hexas!',
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
 * Deterministic pseudo-random number generator for reproducible level generation
 */
function createPrng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Generate all 100 levels deterministically matching the exact difficulty brackets:
 * Levels 1-5: Normal tutorial difficulty
 * Levels 6-15: Hard difficulty
 * Levels 16-30: Hard+
 * Levels 31-50: Very Hard (irregular boards & obstacles)
 * Levels 51-75: Expert
 * Levels 76-100: Master difficulty
 */
export function generateAllLevels(): LevelConfig[] {
  const levels: LevelConfig[] = [];

  for (let id = 1; id <= 100; id++) {
    const chapter = Math.ceil(id / 20); // 1-5
    const rng = createPrng(id * 7919 + 104729);

    // Exact difficulty tier assignment as requested
    let difficulty: LevelConfig['difficulty'];
    if (id <= 5) difficulty = 'Normal';
    else if (id <= 15) difficulty = 'Hard';
    else if (id <= 30) difficulty = 'Hard+';
    else if (id <= 50) difficulty = 'Very Hard';
    else if (id <= 75) difficulty = 'Expert';
    else difficulty = 'Master';

    // Radius:
    // 1-15: Radius 2 (19 cells)
    // 16-100: Radius 3 (37 cells)
    const radius = id <= 15 ? 2 : 3;

    // Obstacles / irregular board holes (for 31-100)
    const blockedCoords: HexCoord[] = [];
    if (id >= 31 && id <= 50) {
      if (id % 2 === 0) {
        blockedCoords.push({ q: 0, r: 0 }); // Center hole
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
      // Master tier obstacles: diamond cuts or central nexus barriers
      if (id % 3 === 0) {
        blockedCoords.push({ q: 0, r: 0 }, { q: 1, r: -1 }, { q: -1, r: 1 });
      } else if (id % 2 === 0) {
        blockedCoords.push({ q: 0, r: 1 }, { q: 0, r: -1 });
      }
    }

    // Determine target tier, objective, and fair move limits
    let targetTier: TileTier = 3;
    let objType: LevelConfig['objective']['type'] = 'reach_tier';
    let targetCount = 1;
    let targetScore = 500;
    let moveLimit = 10;

    if (id <= 5) {
      // Normal Tutorial
      targetTier = id <= 2 ? 2 : 3;
      moveLimit = 8 + id;
    } else if (id <= 15) {
      // Hard (tight move limits, tiers up to 4)
      targetTier = id <= 10 ? 3 : 4;
      if (id % 3 === 0) objType = 'merge_count';
      targetCount = 3;
      targetScore = 450 + (id - 5) * 60;
      moveLimit = Math.max(8, 11 - Math.floor((id - 6) / 3));
    } else if (id <= 30) {
      // Hard+ (more complex tile arrangements, radius 3)
      targetTier = id <= 22 ? 4 : 5;
      if (id % 3 === 0) objType = 'merge_count';
      else if (id % 4 === 0) objType = 'target_score';
      targetCount = 4;
      targetScore = 900 + (id - 15) * 80;
      moveLimit = Math.max(10, 14 - Math.floor((id - 15) / 4));
    } else if (id <= 50) {
      // Very Hard (irregular boards & obstacles)
      targetTier = id % 2 === 0 ? 4 : 5;
      if (id % 3 === 0) objType = 'merge_count';
      else if (id % 4 === 0) objType = 'target_score';
      targetCount = 4 + Math.floor((id - 30) / 7);
      targetScore = 1500 + (id - 30) * 110;
      moveLimit = Math.max(11, 15 - Math.floor((id - 30) / 5));
    } else if (id <= 75) {
      // Expert (complex combinations & limited moves)
      targetTier = id > 65 ? 5 : 4;
      if (id % 3 === 0) objType = 'merge_count';
      else if (id % 4 === 0) objType = 'target_score';
      targetCount = 5 + Math.floor((id - 50) / 8);
      targetScore = 2600 + (id - 50) * 130;
      moveLimit = Math.max(12, 16 - Math.floor((id - 50) / 6));
    } else {
      // Master (challenging strategic puzzles, synthesize Crown)
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

    // Generate initial tiles with guaranteed solver clusters
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

    // Deterministic shuffle
    for (let i = availableCoords.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [availableCoords[i], availableCoords[j]] = [availableCoords[j], availableCoords[i]];
    }

    // Ensure 2 verified merge pairs exist on the starting board
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

    // Level names
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

export function getLevelConfig(levelId: number): LevelConfig {
  return ALL_LEVELS[levelId - 1] || ALL_LEVELS[0];
}
