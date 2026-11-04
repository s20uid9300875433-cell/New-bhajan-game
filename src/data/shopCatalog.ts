import { BackgroundItem, DailyRewardTier, MusicTrackItem, TileSkinItem } from '../types/game';

import bgSunsetBeach from '../assets/images/bg_sunset_beach_1793808052172.jpg';
import bgDreamForest from '../assets/images/bg_dream_forest_1793808053027.jpg';
import bgPinkClouds from '../assets/images/bg_pink_clouds_1793808053833.jpg';
import bgGalaxySpace from '../assets/images/bg_galaxy_space_1793808056321.jpg';
import bgCrystalWater from '../assets/images/bg_crystal_water_1793808056542.jpg';
import bgMagicalGarden from '../assets/images/bg_magical_garden_1793808058178.jpg';
import bgAuroraNight from '../assets/images/bg_aurora_night_1793808059258.jpg';
import bgGoldenParadise from '../assets/images/bg_golden_paradise_1793808058936.jpg';
import bgDiamondUniverse from '../assets/images/bg_diamond_universe_1793808062312.jpg';

export const DEFAULT_BACKGROUND_ID = 'ocean_sky';
export const DEFAULT_TILE_SKIN_ID = 'classic_glossy';
export const DEFAULT_MUSIC_TRACK_ID = 'relaxing_piano';

/**
 * 7-Day Daily Login Streak Schedule
 */
export const DAILY_REWARD_SCHEDULE: DailyRewardTier[] = [
  { day: 1, coins: 100, gems: 0, label: 'Day 1' },
  { day: 2, coins: 150, gems: 1, label: 'Day 2' },
  { day: 3, coins: 225, gems: 2, label: 'Day 3' },
  { day: 4, coins: 300, gems: 2, label: 'Day 4' },
  { day: 5, coins: 400, gems: 4, label: 'Day 5' },
  { day: 6, coins: 550, gems: 5, label: 'Day 6' },
  { day: 7, coins: 800, gems: 10, label: 'Day 7' },
];

/**
 * B. BACKGROUND SHOP — 10 BACKGROUNDS
 */
export const BACKGROUND_SHOP_ITEMS: BackgroundItem[] = [
  {
    id: 'ocean_sky',
    name: 'Ocean Sky',
    price: 0,
    priceType: 'free',
    description: 'Sunlit tropical horizon with tranquil azure ocean reflections.',
    imageUrl: '/assets/aistudio/94dcd7311cb7c003dc8c2c8f30a006a9_24f28502.jpg',
    fallbackGradient: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 48%, #0c4a6e 100%)',
    overlayGradient: 'linear-gradient(180deg, rgba(56,189,248,0.10) 0%, rgba(15,23,42,0.12) 50%, rgba(8,47,73,0.34) 100%)',
    socketFill: 'rgba(12, 38, 64, 0.58)',
    socketStroke: 'rgba(255, 255, 255, 0.45)',
    themeColor: '#38BDF8',
  },
  {
    id: 'sunset_beach',
    name: 'Sunset Beach',
    price: 500,
    priceType: 'coins',
    description: 'Warm golden-hour coral skies melting into gentle turquoise waves.',
    imageUrl: bgSunsetBeach,
    fallbackGradient: 'linear-gradient(180deg, #fb7185 0%, #f59e0b 45%, #0d9488 78%, #fde68a 100%)',
    overlayGradient: 'linear-gradient(180deg, rgba(251,113,133,0.10) 0%, rgba(15,23,42,0.14) 55%, rgba(69,26,3,0.32) 100%)',
    socketFill: 'rgba(46, 22, 35, 0.58)',
    socketStroke: 'rgba(254, 215, 170, 0.48)',
    themeColor: '#FB923C',
  },
  {
    id: 'dream_forest',
    name: 'Dream Forest',
    price: 1000,
    priceType: 'coins',
    description: 'Misty emerald woodland glade illuminated by drifting firefly motes.',
    imageUrl: bgDreamForest,
    fallbackGradient: 'linear-gradient(180deg, #065f46 0%, #047857 45%, #134e4a 100%)',
    overlayGradient: 'linear-gradient(180deg, rgba(16,185,129,0.08) 0%, rgba(6,78,59,0.18) 55%, rgba(2,44,34,0.38) 100%)',
    socketFill: 'rgba(6, 42, 34, 0.62)',
    socketStroke: 'rgba(167, 243, 208, 0.45)',
    themeColor: '#34D399',
  },
  {
    id: 'pink_clouds',
    name: 'Pink Clouds',
    price: 1500,
    priceType: 'coins',
    description: 'Soft rose-quartz and lavender cumulus clouds drifting at dawn.',
    imageUrl: bgPinkClouds,
    fallbackGradient: 'linear-gradient(180deg, #f9a8d4 0%, #f472b6 48%, #c084fc 100%)',
    overlayGradient: 'linear-gradient(180deg, rgba(244,114,182,0.08) 0%, rgba(49,16,62,0.18) 55%, rgba(30,14,48,0.35) 100%)',
    socketFill: 'rgba(48, 19, 58, 0.56)',
    socketStroke: 'rgba(251, 207, 232, 0.52)',
    themeColor: '#F472B6',
  },
  {
    id: 'galaxy_space',
    name: 'Galaxy Space',
    price: 2500,
    priceType: 'coins',
    description: 'Deep velvet cosmos with swirling violet nebulae and distant starlight.',
    imageUrl: bgGalaxySpace,
    fallbackGradient: 'linear-gradient(180deg, #0f172a 0%, #311042 50%, #1e1b4b 100%)',
    overlayGradient: 'linear-gradient(180deg, rgba(99,102,241,0.10) 0%, rgba(15,23,42,0.15) 55%, rgba(2,6,23,0.40) 100%)',
    socketFill: 'rgba(15, 18, 48, 0.66)',
    socketStroke: 'rgba(196, 181, 253, 0.45)',
    themeColor: '#A78BFA',
  },
  {
    id: 'crystal_water',
    name: 'Crystal Water',
    price: 3500,
    priceType: 'coins',
    description: 'Luminous aquamarine lagoon with dancing sunlit water caustics.',
    imageUrl: bgCrystalWater,
    fallbackGradient: 'linear-gradient(180deg, #22d3ee 0%, #0891b2 50%, #155e75 100%)',
    overlayGradient: 'linear-gradient(180deg, rgba(34,211,238,0.08) 0%, rgba(8,51,68,0.18) 55%, rgba(8,47,73,0.36) 100%)',
    socketFill: 'rgba(8, 45, 62, 0.58)',
    socketStroke: 'rgba(165, 243, 252, 0.50)',
    themeColor: '#22D3EE',
  },
  {
    id: 'magical_garden',
    name: 'Magical Garden',
    price: 5000,
    priceType: 'coins',
    description: 'Twilight botanical sanctuary framed by wisteria blossoms and lotus ponds.',
    imageUrl: bgMagicalGarden,
    fallbackGradient: 'linear-gradient(180deg, #1e1b4b 0%, #115e59 52%, #3b0764 100%)',
    overlayGradient: 'linear-gradient(180deg, rgba(45,212,191,0.08) 0%, rgba(15,23,42,0.16) 55%, rgba(19,7,38,0.38) 100%)',
    socketFill: 'rgba(18, 36, 48, 0.62)',
    socketStroke: 'rgba(216, 180, 254, 0.45)',
    themeColor: '#2DD4BF',
  },
  {
    id: 'aurora_night',
    name: 'Aurora Night',
    price: 7000,
    priceType: 'coins',
    description: 'Emerald and glacial cyan northern lights shimmering above serene fjords.',
    imageUrl: bgAuroraNight,
    fallbackGradient: 'linear-gradient(180deg, #022c22 0%, #0f766e 42%, #0f172a 100%)',
    overlayGradient: 'linear-gradient(180deg, rgba(52,211,153,0.10) 0%, rgba(15,23,42,0.18) 55%, rgba(2,6,23,0.42) 100%)',
    socketFill: 'rgba(9, 28, 40, 0.64)',
    socketStroke: 'rgba(110, 231, 183, 0.46)',
    themeColor: '#10B981',
  },
  {
    id: 'golden_paradise',
    name: 'Golden Paradise',
    price: 10000,
    priceType: 'coins',
    description: 'Sunlit champagne-gold sanctuary reflecting over tranquil mirror pools.',
    imageUrl: bgGoldenParadise,
    fallbackGradient: 'linear-gradient(180deg, #f59e0b 0%, #d97706 48%, #78350f 100%)',
    overlayGradient: 'linear-gradient(180deg, rgba(251,191,36,0.08) 0%, rgba(69,26,3,0.22) 55%, rgba(41,17,5,0.40) 100%)',
    socketFill: 'rgba(52, 30, 12, 0.60)',
    socketStroke: 'rgba(253, 230, 138, 0.52)',
    themeColor: '#FBBF24',
  },
  {
    id: 'diamond_universe',
    name: 'Diamond Universe',
    price: 15000,
    priceType: 'coins',
    description: 'Prestigious midnight sapphire cosmos crowned with crystalline starlight.',
    imageUrl: bgDiamondUniverse,
    fallbackGradient: 'linear-gradient(180deg, #0b1120 0%, #1e3a8a 48%, #172554 100%)',
    overlayGradient: 'linear-gradient(180deg, rgba(125,211,252,0.10) 0%, rgba(15,23,42,0.16) 55%, rgba(2,6,23,0.42) 100%)',
    socketFill: 'rgba(12, 24, 56, 0.66)',
    socketStroke: 'rgba(186, 230, 253, 0.55)',
    themeColor: '#7DD3FC',
  },
];

/**
 * C. HEXAGON TILE SHOP — 10 TILE DESIGNS
 * Preserves the exact thick 3D stacked hexagon geometry, hitboxes, layered horizontal ridges,
 * glossy face gradients, floor shadows, and embossed symbols across all 10 collections.
 */
export const TILE_SKIN_SHOP_ITEMS: TileSkinItem[] = [
  {
    id: 'classic_glossy',
    name: 'Classic Glossy',
    price: 0,
    priceType: 'free',
    description: 'Signature thick lacquer hexagon stacks with rich jewel saturation.',
    rimStroke: 'rgba(255, 255, 255, 0.72)',
    specularStroke: 'rgba(255, 255, 255, 0.55)',
    accentColor: '#EF4444',
    tiers: {
      1: { color: '#EF4444', lightColor: '#FCA5A5', shadowColor: '#B91C1C', ridgeColor: '#7F1D1D', ridgeHighlight: '#FECDD3' },
      2: { color: '#F59E0B', lightColor: '#FDE68A', shadowColor: '#B45309', ridgeColor: '#78350F', ridgeHighlight: '#FEF3C7' },
      3: { color: '#10B981', lightColor: '#A7F3D0', shadowColor: '#047857', ridgeColor: '#064E3B', ridgeHighlight: '#D1FAE5' },
      4: { color: '#2563EB', lightColor: '#93C5FD', shadowColor: '#1D4ED8', ridgeColor: '#172554', ridgeHighlight: '#DBEAFE' },
      5: { color: '#9333EA', lightColor: '#E9D5FF', shadowColor: '#6B21A8', ridgeColor: '#3B0764', ridgeHighlight: '#F3E8FF' },
      6: { color: '#EC4899', lightColor: '#FDE047', shadowColor: '#BE185D', ridgeColor: '#700B32', ridgeHighlight: '#FCE7F3' },
    },
  },
  {
    id: 'candy_stack',
    name: 'Candy Stack',
    price: 300,
    priceType: 'coins',
    description: 'Sweet confection glaze in strawberry, butterscotch, mint, and berry.',
    rimStroke: 'rgba(255, 250, 252, 0.85)',
    specularStroke: 'rgba(255, 255, 255, 0.70)',
    accentColor: '#FB7185',
    tiers: {
      1: { color: '#FB7185', lightColor: '#FFE4E6', shadowColor: '#E11D48', ridgeColor: '#9F1239', ridgeHighlight: '#FECDD3' },
      2: { color: '#FBBF24', lightColor: '#FEF9C3', shadowColor: '#D97706', ridgeColor: '#92400E', ridgeHighlight: '#FDE68A' },
      3: { color: '#34D399', lightColor: '#D1FAE5', shadowColor: '#059669', ridgeColor: '#065F46', ridgeHighlight: '#A7F3D0' },
      4: { color: '#38BDF8', lightColor: '#E0F2FE', shadowColor: '#0284C7', ridgeColor: '#075985', ridgeHighlight: '#BAE6FD' },
      5: { color: '#C084FC', lightColor: '#F3E8FF', shadowColor: '#9333EA', ridgeColor: '#581C87', ridgeHighlight: '#E9D5FF' },
      6: { color: '#F472B6', lightColor: '#FEF08A', shadowColor: '#DB2777', ridgeColor: '#831843', ridgeHighlight: '#FBCFE8' },
    },
  },
  {
    id: 'neon_glow',
    name: 'Neon Glow',
    price: 700,
    priceType: 'coins',
    description: 'High-contrast luminous arcade rims with deep midnight stacked bases.',
    rimStroke: 'rgba(165, 243, 252, 0.90)',
    specularStroke: 'rgba(255, 255, 255, 0.80)',
    accentColor: '#22D3EE',
    tiers: {
      1: { color: '#FF2E63', lightColor: '#FF9EBB', shadowColor: '#900C3F', ridgeColor: '#3D001A', ridgeHighlight: '#FF7597' },
      2: { color: '#FFB800', lightColor: '#FFF099', shadowColor: '#995C00', ridgeColor: '#3D2200', ridgeHighlight: '#FFD54F' },
      3: { color: '#00E676', lightColor: '#B9F6CA', shadowColor: '#007E33', ridgeColor: '#003314', ridgeHighlight: '#69F0AE' },
      4: { color: '#00B0FF', lightColor: '#B3E5FC', shadowColor: '#005B9F', ridgeColor: '#00264D', ridgeHighlight: '#80D8FF' },
      5: { color: '#B388FF', lightColor: '#EDE7F6', shadowColor: '#6200EA', ridgeColor: '#26005E', ridgeHighlight: '#D1C4E9' },
      6: { color: '#FF4081', lightColor: '#FFFF8D', shadowColor: '#AD1457', ridgeColor: '#4A0025', ridgeHighlight: '#FF80AB' },
    },
  },
  {
    id: 'crystal_glass',
    name: 'Crystal Glass',
    price: 1200,
    priceType: 'coins',
    description: 'Refractive frosted quartz facets with crisp icy specular edges.',
    rimStroke: 'rgba(224, 242, 254, 0.92)',
    specularStroke: 'rgba(255, 255, 255, 0.82)',
    accentColor: '#7DD3FC',
    tiers: {
      1: { color: '#F43F5E', lightColor: '#FFF1F2', shadowColor: '#9F1239', ridgeColor: '#4C0519', ridgeHighlight: '#FDA4AF' },
      2: { color: '#EAB308', lightColor: '#FEFCE8', shadowColor: '#854D0E', ridgeColor: '#422006', ridgeHighlight: '#FDE047' },
      3: { color: '#14B8A6', lightColor: '#F0FDFA', shadowColor: '#0F766E', ridgeColor: '#134E4A', ridgeHighlight: '#99F6E4' },
      4: { color: '#0EA5E9', lightColor: '#F0F9FF', shadowColor: '#0369A1', ridgeColor: '#082F49', ridgeHighlight: '#7DD3FC' },
      5: { color: '#8B5CF6', lightColor: '#F5F3FF', shadowColor: '#5B21B6', ridgeColor: '#2E1065', ridgeHighlight: '#C4B5FD' },
      6: { color: '#EC4899', lightColor: '#ECFEFF', shadowColor: '#9D174D', ridgeColor: '#500724', ridgeHighlight: '#F9A8D4' },
    },
  },
  {
    id: 'rainbow_shine',
    name: 'Rainbow Shine',
    price: 1800,
    priceType: 'coins',
    description: 'Sun-drenched chromatic spectrum tiles with vivid satin luster.',
    rimStroke: 'rgba(254, 249, 195, 0.85)',
    specularStroke: 'rgba(255, 255, 255, 0.68)',
    accentColor: '#F59E0B',
    tiers: {
      1: { color: '#FF5252', lightColor: '#FFCDD2', shadowColor: '#C62828', ridgeColor: '#7F0000', ridgeHighlight: '#FF8A80' },
      2: { color: '#FF9800', lightColor: '#FFE0B2', shadowColor: '#EF6C00', ridgeColor: '#8D3B00', ridgeHighlight: '#FFCC80' },
      3: { color: '#2ECC71', lightColor: '#D4EFDF', shadowColor: '#1E8449', ridgeColor: '#0E4B26', ridgeHighlight: '#82E0AA' },
      4: { color: '#3498DB', lightColor: '#D6EAF8', shadowColor: '#1F618D', ridgeColor: '#0E3249', ridgeHighlight: '#85C1E9' },
      5: { color: '#9B59B6', lightColor: '#EBDEF0', shadowColor: '#6C3483', ridgeColor: '#3B1948', ridgeHighlight: '#C39BD3' },
      6: { color: '#E91E63', lightColor: '#FFF59D', shadowColor: '#AD1457', ridgeColor: '#560027', ridgeHighlight: '#F48FB1' },
    },
  },
  {
    id: 'golden_royal',
    name: 'Golden Royal',
    price: 2500,
    priceType: 'coins',
    description: 'Imperial gemstone cores rimmed in burnished 24-karat gold leaf.',
    rimStroke: 'rgba(253, 224, 71, 0.92)',
    specularStroke: 'rgba(254, 240, 138, 0.75)',
    accentColor: '#FACC15',
    tiers: {
      1: { color: '#DC2626', lightColor: '#FDE68A', shadowColor: '#7F1D1D', ridgeColor: '#450A0A', ridgeHighlight: '#FBBF24' },
      2: { color: '#D97706', lightColor: '#FEF08A', shadowColor: '#78350F', ridgeColor: '#451A03', ridgeHighlight: '#FDE047' },
      3: { color: '#059669', lightColor: '#FDE68A', shadowColor: '#064E3B', ridgeColor: '#022C22', ridgeHighlight: '#FBBF24' },
      4: { color: '#1D4ED8', lightColor: '#FDE68A', shadowColor: '#1E3A8A', ridgeColor: '#0F172A', ridgeHighlight: '#FBBF24' },
      5: { color: '#7E22CE', lightColor: '#FDE68A', shadowColor: '#4C1D95', ridgeColor: '#2E1065', ridgeHighlight: '#FBBF24' },
      6: { color: '#EAB308', lightColor: '#FFFFFF', shadowColor: '#A16207', ridgeColor: '#422006', ridgeHighlight: '#FEF08A' },
    },
  },
  {
    id: 'diamond_edge',
    name: 'Diamond Edge',
    price: 3500,
    priceType: 'coins',
    description: 'Precision-cut platinum bevels framing deep velvet sapphire & ruby cores.',
    rimStroke: 'rgba(248, 250, 252, 0.96)',
    specularStroke: 'rgba(226, 232, 240, 0.88)',
    accentColor: '#E2E8F0',
    tiers: {
      1: { color: '#E11D48', lightColor: '#F8FAFC', shadowColor: '#881337', ridgeColor: '#334155', ridgeHighlight: '#E2E8F0' },
      2: { color: '#EA580C', lightColor: '#F8FAFC', shadowColor: '#7C2D12', ridgeColor: '#334155', ridgeHighlight: '#E2E8F0' },
      3: { color: '#0D9488', lightColor: '#F8FAFC', shadowColor: '#115E59', ridgeColor: '#334155', ridgeHighlight: '#E2E8F0' },
      4: { color: '#2563EB', lightColor: '#F8FAFC', shadowColor: '#1E3A8A', ridgeColor: '#334155', ridgeHighlight: '#E2E8F0' },
      5: { color: '#7C3AED', lightColor: '#F8FAFC', shadowColor: '#4C1D95', ridgeColor: '#334155', ridgeHighlight: '#E2E8F0' },
      6: { color: '#06B6D4', lightColor: '#FFFFFF', shadowColor: '#155E75', ridgeColor: '#1E293B', ridgeHighlight: '#F8FAFC' },
    },
  },
  {
    id: 'galaxy_marble',
    name: 'Galaxy Marble',
    price: 5000,
    priceType: 'coins',
    description: 'Astral stone stacks infused with cosmic crimson, solar, and nebula hues.',
    rimStroke: 'rgba(216, 180, 254, 0.85)',
    specularStroke: 'rgba(243, 232, 255, 0.65)',
    accentColor: '#C084FC',
    tiers: {
      1: { color: '#BE123C', lightColor: '#FDA4AF', shadowColor: '#4C0519', ridgeColor: '#1E1B4B', ridgeHighlight: '#F472B6' },
      2: { color: '#CA8A04', lightColor: '#FDE047', shadowColor: '#713F12', ridgeColor: '#1E1B4B', ridgeHighlight: '#FACC15' },
      3: { color: '#0F766E', lightColor: '#5EEAD4', shadowColor: '#134E4A', ridgeColor: '#1E1B4B', ridgeHighlight: '#2DD4BF' },
      4: { color: '#3730A3', lightColor: '#A5B4FC', shadowColor: '#1E1B4B', ridgeColor: '#0F172A', ridgeHighlight: '#818CF8' },
      5: { color: '#6B21A8', lightColor: '#D8B4FE', shadowColor: '#3B0764', ridgeColor: '#0F172A', ridgeHighlight: '#C084FC' },
      6: { color: '#DB2777', lightColor: '#A5F3FC', shadowColor: '#500724', ridgeColor: '#1E1B4B', ridgeHighlight: '#F9A8D4' },
    },
  },
  {
    id: 'magic_pearl',
    name: 'Magic Pearl',
    price: 7000,
    priceType: 'coins',
    description: 'Iridescent mother-of-pearl nacre with soft opalescent ridge highlights.',
    rimStroke: 'rgba(255, 255, 255, 0.92)',
    specularStroke: 'rgba(254, 242, 242, 0.80)',
    accentColor: '#F9A8D4',
    tiers: {
      1: { color: '#F43F5E', lightColor: '#FFF1F2', shadowColor: '#BE123C', ridgeColor: '#881337', ridgeHighlight: '#FFE4E6' },
      2: { color: '#F59E0B', lightColor: '#FFFBEB', shadowColor: '#B45309', ridgeColor: '#78350F', ridgeHighlight: '#FEF3C7' },
      3: { color: '#10B981', lightColor: '#ECFDF5', shadowColor: '#047857', ridgeColor: '#064E3B', ridgeHighlight: '#D1FAE5' },
      4: { color: '#3B82F6', lightColor: '#EFF6FF', shadowColor: '#1D4ED8', ridgeColor: '#1E3A8A', ridgeHighlight: '#DBEAFE' },
      5: { color: '#A855F7', lightColor: '#FAF5FF', shadowColor: '#7E22CE', ridgeColor: '#581C87', ridgeHighlight: '#F3E8FF' },
      6: { color: '#EC4899', lightColor: '#FFFFFF', shadowColor: '#9D174D', ridgeColor: '#500724', ridgeHighlight: '#FCE7F3' },
    },
  },
  {
    id: 'legendary_prism',
    name: 'Legendary Prism',
    price: 10000,
    priceType: 'coins',
    description: 'Masterwork prismatic crystal stacks with radiant auric-diamond ridges.',
    rimStroke: 'rgba(254, 240, 138, 0.96)',
    specularStroke: 'rgba(255, 255, 255, 0.90)',
    accentColor: '#FDE047',
    tiers: {
      1: { color: '#FF1744', lightColor: '#FFF9C4', shadowColor: '#880E4F', ridgeColor: '#311B92', ridgeHighlight: '#FFE082' },
      2: { color: '#FF9100', lightColor: '#FFFDE7', shadowColor: '#E65100', ridgeColor: '#3E2723', ridgeHighlight: '#FFF59D' },
      3: { color: '#00E676', lightColor: '#E0F7FA', shadowColor: '#00695C', ridgeColor: '#004D40', ridgeHighlight: '#A7FFEB' },
      4: { color: '#2979FF', lightColor: '#E1F5FE', shadowColor: '#0D47A1', ridgeColor: '#1A237E', ridgeHighlight: '#82B1FF' },
      5: { color: '#D500F9', lightColor: '#FCE4EC', shadowColor: '#4A148C', ridgeColor: '#12005E', ridgeHighlight: '#EA80FC' },
      6: { color: '#F50057', lightColor: '#FFFF00', shadowColor: '#880E4F', ridgeColor: '#1A237E', ridgeHighlight: '#84FFFF' },
    },
  },
];

/**
 * D. MUSIC SHOP — 5 ORIGINAL INSTRUMENTAL TRACKS
 */
export const MUSIC_SHOP_ITEMS: MusicTrackItem[] = [
  {
    id: 'relaxing_piano',
    name: 'Relaxing Piano',
    price: 0,
    priceType: 'free',
    description: 'Warm acoustic-voiced Lydian piano chords with delicate crystalline overtones.',
    mood: 'Serene · Warm',
    tempo: '66 BPM',
    accentColor: '#38BDF8',
  },
  {
    id: 'ocean_dreams',
    name: 'Ocean Dreams',
    price: 500,
    priceType: 'coins',
    description: 'Flowing pentatonic tide arpeggios and gentle sunlit lagoon harmonies.',
    mood: 'Tranquil · Coastal',
    tempo: '62 BPM',
    accentColor: '#22D3EE',
  },
  {
    id: 'magic_forest',
    name: 'Magic Forest',
    price: 1000,
    priceType: 'coins',
    description: 'Enchanted celesta bell plucks drifting above mossy woodland chord pads.',
    mood: 'Woodland · Airy',
    tempo: '72 BPM',
    accentColor: '#34D399',
  },
  {
    id: 'soft_electronic',
    name: 'Soft Electronic',
    price: 1500,
    priceType: 'coins',
    description: 'Silky analog-inspired chillwave synth chords with a mellow syncopated pulse.',
    mood: 'Chillwave · Focus',
    tempo: '80 BPM',
    accentColor: '#A78BFA',
  },
  {
    id: 'cosmic_meditation',
    name: 'Cosmic Meditation',
    price: 2500,
    priceType: 'coins',
    description: 'Deep astral fifths, slow shimmer pads, and peaceful starlight chimes.',
    mood: 'Celestial · Deep',
    tempo: '54 BPM',
    accentColor: '#F472B6',
  },
];

export function getBackgroundById(id: string): BackgroundItem {
  return BACKGROUND_SHOP_ITEMS.find(bg => bg.id === id) || BACKGROUND_SHOP_ITEMS[0];
}

export function getTileSkinById(id: string): TileSkinItem {
  return TILE_SKIN_SHOP_ITEMS.find(skin => skin.id === id) || TILE_SKIN_SHOP_ITEMS[0];
}

export function getMusicTrackById(id: string): MusicTrackItem {
  return MUSIC_SHOP_ITEMS.find(track => track.id === id) || MUSIC_SHOP_ITEMS[0];
}
