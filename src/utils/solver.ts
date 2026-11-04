import { BoardTile, HexCoord, LevelConfig, TileTier, TrayBlock } from '../types/game';
import { findConnectedGroup, generateGridCoords, getNeighbors, hexKey } from './hexMath';
import { getTierInfo } from '../data/tiers';

export interface HintSuggestion {
  sourceType: 'tray' | 'board';
  trayBlockId?: string;
  from?: HexCoord;
  to: HexCoord;
  tier: TileTier;
  groupSize: number;
  resultingTier: TileTier;
  explanation: string;
}

/**
 * Finds the optimal move (either placing a block from the bottom tray OR sliding an existing tile)
 * that triggers an immediate 3+ tile merge or sets up a strong adjacent pair.
 */
export function findBestMoveHint(
  validCoords: HexCoord[],
  currentTiles: BoardTile[],
  trayBlocks: TrayBlock[] = []
): HintSuggestion | null {
  const validSet = new Set(validCoords.map(c => hexKey(c.q, c.r)));
  const tilesMap = new Map<string, BoardTile>();
  for (const t of currentTiles) {
    tilesMap.set(hexKey(t.q, t.r), t);
  }

  const emptyCoords: HexCoord[] = [];
  for (const coord of validCoords) {
    if (!tilesMap.has(hexKey(coord.q, coord.r))) {
      emptyCoords.push(coord);
    }
  }

  let bestSuggestion: HintSuggestion | null = null;
  let bestScore = -1;

  // 1. Check Bottom Tray Blocks for immediate 3+ merges
  const availableTrayBlocks = trayBlocks.filter(b => !b.isUsed);
  for (const block of availableTrayBlocks) {
    for (const dest of emptyCoords) {
      const destKey = hexKey(dest.q, dest.r);

      const simMap = new Map<string, BoardTile>(tilesMap);
      simMap.set(destKey, {
        id: 'sim',
        q: dest.q,
        r: dest.r,
        tier: block.tier,
      });

      const group = findConnectedGroup(dest, simMap);
      if (group.length >= 3) {
        const moveScore = group.length * 120 + block.tier * 60;
        if (moveScore > bestScore) {
          bestScore = moveScore;
          const nextTier = Math.min(block.tier + 1, 6) as TileTier;
          bestSuggestion = {
            sourceType: 'tray',
            trayBlockId: block.id,
            to: dest,
            tier: block.tier,
            groupSize: group.length,
            resultingTier: nextTier,
            explanation: `Drag T${block.tier} block from tray to merge ${group.length} tiles into T${nextTier}!`,
          };
        }
      }
    }
  }

  // 2. Check Board Tile Slides for immediate 3+ merges
  for (const tile of currentTiles) {
    const originCoord: HexCoord = { q: tile.q, r: tile.r };
    const neighbors = getNeighbors(originCoord);

    for (const dest of neighbors) {
      const destKey = hexKey(dest.q, dest.r);
      if (!validSet.has(destKey) || tilesMap.has(destKey)) continue;

      const simMap = new Map<string, BoardTile>(tilesMap);
      simMap.delete(hexKey(tile.q, tile.r));
      simMap.set(destKey, {
        ...tile,
        q: dest.q,
        r: dest.r,
      });

      const group = findConnectedGroup(dest, simMap);
      if (group.length >= 3) {
        const moveScore = group.length * 100 + tile.tier * 50;
        if (moveScore > bestScore) {
          bestScore = moveScore;
          const nextTier = Math.min(tile.tier + 1, 6) as TileTier;
          bestSuggestion = {
            sourceType: 'board',
            from: originCoord,
            to: dest,
            tier: tile.tier,
            groupSize: group.length,
            resultingTier: nextTier,
            explanation: `Slide T${tile.tier} tile to merge ${group.length} tiles into T${nextTier}!`,
          };
        }
      }
    }
  }

  // 3. Fallback: Tray placement adjacent to matching colors (prefer central high-degree sockets)
  if (!bestSuggestion && availableTrayBlocks.length > 0) {
    for (const block of availableTrayBlocks) {
      for (const dest of emptyCoords) {
        const neighbors = getNeighbors(dest);
        let matchingNeighbors = 0;
        let openNeighbors = 0;
        for (const nb of neighbors) {
          const nbKey = hexKey(nb.q, nb.r);
          if (!validSet.has(nbKey)) continue;
          const nbTile = tilesMap.get(nbKey);
          if (nbTile && nbTile.tier === block.tier) {
            matchingNeighbors++;
          } else if (!nbTile) {
            openNeighbors++;
          }
        }

        if (matchingNeighbors > 0 || emptyCoords.length > 0) {
          const score = matchingNeighbors * 35 + openNeighbors * 4 + block.tier * 2;
          if (score > bestScore) {
            bestScore = score;
            bestSuggestion = {
              sourceType: 'tray',
              trayBlockId: block.id,
              to: dest,
              tier: block.tier,
              groupSize: matchingNeighbors + 1,
              resultingTier: block.tier,
              explanation: `Place T${block.tier} block adjacent to matching tiles to prepare a merge.`,
            };
          }
        }
      }
    }
  }

  return bestSuggestion;
}

/**
 * Verifies whether all non-blocked cells in a board layout form a single connected graph.
 */
export function isGridConnected(validCoords: HexCoord[]): boolean {
  if (validCoords.length === 0) return false;
  const validSet = new Set(validCoords.map(c => hexKey(c.q, c.r)));
  const visited = new Set<string>();
  const queue: HexCoord[] = [validCoords[0]];
  visited.add(hexKey(validCoords[0].q, validCoords[0].r));

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const nb of getNeighbors(curr)) {
      const key = hexKey(nb.q, nb.r);
      if (validSet.has(key) && !visited.has(key)) {
        visited.add(key);
        queue.push(nb);
      }
    }
  }

  return visited.size === validCoords.length;
}

export interface SolverValidationResult {
  solvable: boolean;
  movesUsed: number;
  simulatedScore: number;
  simulatedMerges: number;
  simulatedHighestTier: TileTier;
}

/**
 * Deterministic forward puzzle solver simulation used to verify solvability
 * and fairness of procedurally generated Infinite Levels (101+).
 */
export function validateLevelSolvability(level: LevelConfig): SolverValidationResult {
  const validCoords = generateGridCoords(level.radius, level.blockedCoords);
  if (!isGridConnected(validCoords)) {
    return {
      solvable: false,
      movesUsed: level.moveLimit,
      simulatedScore: 0,
      simulatedMerges: 0,
      simulatedHighestTier: 1,
    };
  }

  const openCount = validCoords.length - level.initialTiles.length;
  if (openCount < 10) {
    return {
      solvable: false,
      movesUsed: level.moveLimit,
      simulatedScore: 0,
      simulatedMerges: 0,
      simulatedHighestTier: 1,
    };
  }

  // Deterministic PRNG for tray deals during solver validation
  let seed = (level.id * 2654435761) >>> 0;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  let simTiles: BoardTile[] = level.initialTiles.map((t, i) => ({
    id: `sim-init-${i}`,
    q: t.q,
    r: t.r,
    tier: t.tier,
  }));

  let highestTier: TileTier = 1;
  simTiles.forEach(t => {
    if (t.tier > highestTier) highestTier = t.tier;
  });

  let score = 0;
  let mergesCount = 0;

  const dealSeededTray = (dealIdx: number): TrayBlock[] => {
    const maxTier = level.difficulty === 'Normal' ? 3 : level.difficulty === 'Hard' ? 4 : 5;
    const distinct = Array.from(new Set(simTiles.map(t => t.tier)));
    return [0, 1, 2].map(slot => {
      let tier: TileTier = 1;
      if (distinct.length > 0 && nextRand() < 0.78) {
        const picked = distinct[Math.floor(nextRand() * distinct.length)];
        tier = Math.min(picked, maxTier) as TileTier;
      } else {
        tier = (1 + Math.floor(nextRand() * maxTier)) as TileTier;
      }
      return {
        id: `sim-tray-${dealIdx}-${slot}`,
        tier,
        isUsed: false,
      };
    });
  };

  let dealIdx = 0;
  let tray = dealSeededTray(dealIdx);

  const checkMet = (): boolean => {
    const obj = level.objective;
    if (obj.type === 'reach_tier') return highestTier >= (obj.targetTier || 3);
    if (obj.type === 'merge_count') return mergesCount >= (obj.count || 1);
    if (obj.type === 'target_score') return score >= (obj.targetScore || 500);
    return false;
  };

  const applyCascades = (at: HexCoord) => {
    let combo = 1;
    while (true) {
      const map = new Map<string, BoardTile>();
      simTiles.forEach(t => map.set(hexKey(t.q, t.r), t));
      const group = findConnectedGroup(at, map);
      if (group.length < 3) break;

      const groupTier = group[0].tier;
      const nextTier = Math.min(groupTier + 1, 6) as TileTier;
      const ids = new Set(group.map(g => g.id));
      simTiles = simTiles.filter(t => !ids.has(t.id));
      simTiles.push({
        id: `sim-m-${at.q}-${at.r}-${mergesCount}-${combo}`,
        q: at.q,
        r: at.r,
        tier: nextTier,
      });

      score += group.length * getTierInfo(groupTier).scoreValue * combo;
      mergesCount++;
      if (nextTier > highestTier) highestTier = nextTier;
      combo++;
    }
  };

  for (let move = 1; move <= level.moveLimit; move++) {
    const hint = findBestMoveHint(validCoords, simTiles, tray);
    if (!hint) break;

    if (hint.sourceType === 'tray' && hint.trayBlockId) {
      simTiles.push({
        id: `sim-p-${move}`,
        q: hint.to.q,
        r: hint.to.r,
        tier: hint.tier,
      });
      tray = tray.map(b => (b.id === hint.trayBlockId ? { ...b, isUsed: true } : b));
      if (tray.every(b => b.isUsed)) {
        dealIdx++;
        tray = dealSeededTray(dealIdx);
      }
      applyCascades(hint.to);
    } else if (hint.sourceType === 'board' && hint.from) {
      simTiles = simTiles.map(t =>
        t.q === hint.from!.q && t.r === hint.from!.r
          ? { ...t, q: hint.to.q, r: hint.to.r }
          : t
      );
      applyCascades(hint.to);
    } else {
      break;
    }

    if (checkMet()) {
      return {
        solvable: true,
        movesUsed: move,
        simulatedScore: score,
        simulatedMerges: mergesCount,
        simulatedHighestTier: highestTier,
      };
    }
  }

  return {
    solvable: checkMet(),
    movesUsed: level.moveLimit,
    simulatedScore: score,
    simulatedMerges: mergesCount,
    simulatedHighestTier: highestTier,
  };
}
