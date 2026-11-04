import { BoardTile, HexCoord, TileTier, TrayBlock } from '../types/game';
import { findConnectedGroup, getNeighbors, hexKey } from './hexMath';

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
 * that triggers an immediate 3+ tile merge.
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

  // Get all currently empty board coordinates
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

      // Simulate placement
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

  // 3. Fallback: Tray placement adjacent to matching colors
  if (!bestSuggestion && availableTrayBlocks.length > 0) {
    for (const block of availableTrayBlocks) {
      for (const dest of emptyCoords) {
        const neighbors = getNeighbors(dest);
        let matchingNeighbors = 0;
        for (const nb of neighbors) {
          const nbTile = tilesMap.get(hexKey(nb.q, nb.r));
          if (nbTile && nbTile.tier === block.tier) {
            matchingNeighbors++;
          }
        }

        if (matchingNeighbors > 0) {
          const score = matchingNeighbors * 25 + block.tier;
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
