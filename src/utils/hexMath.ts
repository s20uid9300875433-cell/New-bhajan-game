import { HexCoord, BoardTile } from '../types/game';

// 6 Axial neighbor directions for pointy-top hexagons
export const HEX_DIRECTIONS: readonly HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function parseHexKey(key: string): HexCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

export function areCoordsEqual(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function isNeighbor(a: HexCoord, b: HexCoord): boolean {
  return hexDistance(a, b) === 1;
}

export function getNeighbors(coord: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map(dir => ({
    q: coord.q + dir.q,
    r: coord.r + dir.r,
  }));
}

/**
 * Generate all coordinates inside a regular hexagon of given radius
 * Radius 2: 19 cells
 * Radius 3: 37 cells
 */
export function generateGridCoords(radius: number, blocked: HexCoord[] = []): HexCoord[] {
  const coords: HexCoord[] = [];
  const blockedSet = new Set(blocked.map(b => hexKey(b.q, b.r)));

  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      const key = hexKey(q, r);
      if (!blockedSet.has(key)) {
        coords.push({ q, r });
      }
    }
  }
  return coords;
}

/**
 * Convert pointy-top axial hex coord (q, r) to 2D pixel coordinates (x, y)
 */
export function hexToPixel(coord: HexCoord, size: number, center = { x: 0, y: 0 }): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * coord.q + (Math.sqrt(3) / 2) * coord.r) + center.x;
  const y = size * ((3 / 2) * coord.r) + center.y;
  return { x, y };
}

/**
 * Compute the 6 vertex coordinates of a pointy-top hexagon centered at (x, y) with radius 'size'
 */
export function getHexCornerPoints(center: { x: number; y: number }, size: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 30; // Pointy-top angle offset
    const angleRad = (Math.PI / 180) * angleDeg;
    points.push({
      x: center.x + size * Math.cos(angleRad),
      y: center.y + size * Math.sin(angleRad),
    });
  }
  return points;
}

/**
 * Generate SVG polygon points string
 */
export function getHexPolygonPointsString(center: { x: number; y: number }, size: number): string {
  const corners = getHexCornerPoints(center, size);
  return corners.map(pt => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(' ');
}

/**
 * Find connected group of matching tier tiles starting from a specific coordinate
 * Uses Breadth-First Search (BFS) over neighbor relations
 */
export function findConnectedGroup(
  startCoord: HexCoord,
  tilesMap: Map<string, BoardTile>
): BoardTile[] {
  const startKey = hexKey(startCoord.q, startCoord.r);
  const startTile = tilesMap.get(startKey);
  if (!startTile) return [];

  const targetTier = startTile.tier;
  const visited = new Set<string>();
  const queue: HexCoord[] = [startCoord];
  visited.add(startKey);
  const group: BoardTile[] = [startTile];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = getNeighbors(curr);

    for (const nb of neighbors) {
      const nbKey = hexKey(nb.q, nb.r);
      if (visited.has(nbKey)) continue;

      const nbTile = tilesMap.get(nbKey);
      if (nbTile && nbTile.tier === targetTier) {
        visited.add(nbKey);
        queue.push(nb);
        group.push(nbTile);
      }
    }
  }

  return group;
}

/**
 * Round fractional cubic coordinates to nearest integer hex coordinates
 */
export function cubicRound(fracQ: number, fracR: number): HexCoord {
  const fracS = -fracQ - fracR;
  let q = Math.round(fracQ);
  let r = Math.round(fracR);
  let s = Math.round(fracS);

  const qDiff = Math.abs(q - fracQ);
  const rDiff = Math.abs(r - fracR);
  const sDiff = Math.abs(s - fracS);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }
  return { q, r };
}

/**
 * Convert 2D pixel offset back to pointy-top axial hex coord
 */
export function pixelToHex(
  point: { x: number; y: number },
  size: number,
  center = { x: 0, y: 0 }
): HexCoord {
  const ptX = point.x - center.x;
  const ptY = point.y - center.y;
  const q = ((Math.sqrt(3) / 3) * ptX - (1 / 3) * ptY) / size;
  const r = ((2 / 3) * ptY) / size;
  return cubicRound(q, r);
}
