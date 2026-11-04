/**
 * Hexa Color Quest - Core Type Definitions
 */

export interface HexCoord {
  q: number;
  r: number;
}

export type TileTier = 1 | 2 | 3 | 4 | 5 | 6;

export interface TileInfo {
  tier: TileTier;
  name: string;
  color: string;
  lightColor: string;
  shadowColor: string;
  ridgeColor: string;
  ridgeHighlight: string;
  textColor: string;
  glyph: string;
  symbolType: 'heart' | 'star5' | 'clover' | 'star6' | 'moon' | 'crown';
  scoreValue: number;
}

export interface BoardTile {
  id: string;
  q: number;
  r: number;
  tier: TileTier;
  isMerging?: boolean;
  isNew?: boolean;
  slideOrigin?: HexCoord;
}

export type ObjectiveType = 'reach_tier' | 'merge_count' | 'clear_color' | 'target_score';

export interface LevelObjective {
  type: ObjectiveType;
  targetTier?: TileTier;
  count?: number; // e.g. merge 5 times, or make 2 Tier 4 tiles
  targetScore?: number;
  description: string;
}

export interface LevelConfig {
  id: number;
  chapter: number; // 1-5 (20 levels each)
  name: string;
  difficulty: 'Tutorial' | 'Normal' | 'Hard' | 'Hard+' | 'Very Hard' | 'Expert' | 'Master';
  radius: number; // grid radius (2 = 19 hexes, 3 = 37 hexes)
  blockedCoords?: HexCoord[]; // holes / obstacles in the grid
  initialTiles: { q: number; r: number; tier: TileTier }[];
  moveLimit: number;
  objective: LevelObjective;
  starThresholds: {
    oneStar: number; // moves left >= 0 (completion)
    twoStars: number; // moves left >= X
    threeStars: number; // moves left >= Y
  };
  tutorialTip?: string;
}

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface DailyLoginData {
  lastClaimDate: string; // YYYY-MM-DD
  streak: number; // 1-7
  claimedToday: boolean;
}

export interface UserProgress {
  unlockedLevel: number;
  stars: Record<number, number>; // levelId -> stars (1-3)
  highScores: Record<number, number>; // levelId -> score
  coins: number;
  gems: number;
  hintsRemaining: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  graphicsQuality: GraphicsQuality;
  selectedBackground: string;
  ownedBackgrounds: string[];
  selectedTileSkin: string;
  ownedTileSkins: string[];
  selectedMusicTrack: string;
  ownedMusicTracks: string[];
  dailyLogin: DailyLoginData;
}

export interface BackgroundItem {
  id: string;
  name: string;
  price: number;
  priceType: 'coins' | 'gems' | 'free';
  description: string;
  imageUrl?: string;
  cssStyle?: React.CSSProperties;
  themeColor: string;
}

export interface TileSkinItem {
  id: string;
  name: string;
  price: number;
  priceType: 'coins' | 'gems' | 'free';
  description: string;
  badge: string;
  colorPreview: string[];
  accentBorder: string;
}

export interface MusicTrackItem {
  id: string;
  name: string;
  price: number;
  priceType: 'coins' | 'gems' | 'free';
  description: string;
  mood: string;
  tempo: string;
}

export interface TrayBlock {
  id: string;
  tier: TileTier;
  isUsed: boolean;
}

export interface MoveStep {
  type: 'slide' | 'placement';
  from?: HexCoord;
  to: HexCoord;
  tileTier: TileTier;
  boardSnapshot: { q: number; r: number; tier: TileTier; id: string }[];
  traySnapshot: TrayBlock[];
  scoreSnapshot: number;
  movesSnapshot: number;
}

export type GameScreenState = 'home' | 'levels' | 'playing' | 'shop' | 'settings' | 'tutorial';

