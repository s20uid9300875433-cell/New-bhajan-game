import { TileInfo, TileTier } from '../types/game';

export const TILE_TIERS: Record<TileTier, TileInfo> = {
  1: {
    tier: 1,
    name: 'Ruby Heart',
    color: '#EF4444', // Red (reference image)
    lightColor: '#FCA5A5',
    shadowColor: '#B91C1C',
    ridgeColor: '#7F1D1D',
    ridgeHighlight: '#FECDD3',
    textColor: '#FFFFFF',
    glyph: '♥',
    symbolType: 'heart',
    scoreValue: 10,
  },
  2: {
    tier: 2,
    name: 'Amber Star',
    color: '#F59E0B', // Yellow / Amber (reference image)
    lightColor: '#FDE68A',
    shadowColor: '#B45309',
    ridgeColor: '#78350F',
    ridgeHighlight: '#FEF3C7',
    textColor: '#FFFFFF',
    glyph: '★',
    symbolType: 'star5',
    scoreValue: 30,
  },
  3: {
    tier: 3,
    name: 'Emerald Clover',
    color: '#10B981', // Green (reference image)
    lightColor: '#A7F3D0',
    shadowColor: '#047857',
    ridgeColor: '#064E3B',
    ridgeHighlight: '#D1FAE5',
    textColor: '#FFFFFF',
    glyph: '♣',
    symbolType: 'clover',
    scoreValue: 90,
  },
  4: {
    tier: 4,
    name: 'Azure Hexa',
    color: '#2563EB', // Blue (reference image)
    lightColor: '#93C5FD',
    shadowColor: '#1D4ED8',
    ridgeColor: '#172554',
    ridgeHighlight: '#DBEAFE',
    textColor: '#FFFFFF',
    glyph: '✶',
    symbolType: 'star6',
    scoreValue: 270,
  },
  5: {
    tier: 5,
    name: 'Violet Moon',
    color: '#9333EA', // Purple (reference image)
    lightColor: '#E9D5FF',
    shadowColor: '#6B21A8',
    ridgeColor: '#3B0764',
    ridgeHighlight: '#F3E8FF',
    textColor: '#FFFFFF',
    glyph: '☽',
    symbolType: 'moon',
    scoreValue: 810,
  },
  6: {
    tier: 6,
    name: 'Prismatic Crown',
    color: '#EC4899', // Pink / Iridescent Crown (reference image)
    lightColor: '#FDE047',
    shadowColor: '#BE185D',
    ridgeColor: '#700B32',
    ridgeHighlight: '#FCE7F3',
    textColor: '#FFFFFF',
    glyph: '👑',
    symbolType: 'crown',
    scoreValue: 2500,
  },
};

export function getTierInfo(tier: TileTier): TileInfo {
  return TILE_TIERS[tier] || TILE_TIERS[1];
}
