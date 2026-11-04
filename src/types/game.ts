import type React from 'react';

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
  count?: number;
  targetScore?: number;
  description: string;
}

export interface LevelConfig {
  id: number;
  chapter: number;
  name: string;
  difficulty: 'Tutorial' | 'Normal' | 'Hard' | 'Hard+' | 'Very Hard' | 'Expert' | 'Master' | 'Grandmaster';
  radius: number;
  blockedCoords?: HexCoord[];
  initialTiles: { q: number; r: number; tier: TileTier }[];
  moveLimit: number;
  objective: LevelObjective;
  starThresholds: {
    oneStar: number;
    twoStars: number;
    threeStars: number;
  };
  tutorialTip?: string;
  isInfinite?: boolean;
}

export type GraphicsQuality = 'low' | 'medium' | 'high';

export type ShopCategory = 'backgrounds' | 'tiles' | 'music';

export interface DailyLoginData {
  lastClaimDate: string; // YYYY-MM-DD in local time
  streak: number; // 1-7
}

export interface DailyRewardTier {
  day: number;
  coins: number;
  gems: number;
  label: string;
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
  mergesSnapshot?: number;
  highestTierSnapshot?: TileTier;
}

export interface SavedLevelSession {
  levelId: number;
  tiles: BoardTile[];
  trayBlocks: TrayBlock[];
  movesLeft: number;
  score: number;
  mergesCount: number;
  highestTier: TileTier;
  dealCount: number;
  undoStack: MoveStep[];
  savedAt: number;
}

export interface UserProgress {
  unlockedLevel: number;
  stars: Record<number, number>; // levelId -> best stars (1-3)
  highScores: Record<number, number>; // levelId -> best score
  rewardedStarMilestones: Record<number, number>; // levelId -> highest star tier already rewarded
  claimedRewardTokens: string[]; // prevents duplicate ad/bonus claims
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
  savedActiveLevel: SavedLevelSession | null;
}

export interface BackgroundItem {
  id: string;
  name: string;
  price: number;
  priceType: 'coins' | 'gems' | 'free';
  description: string;
  imageUrl: string;
  fallbackGradient: string;
  overlayGradient: string;
  socketFill: string;
  socketStroke: string;
  themeColor: string;
}

export interface TileSkinPaletteOverride {
  color: string;
  lightColor: string;
  shadowColor: string;
  ridgeColor: string;
  ridgeHighlight: string;
}

export interface TileSkinItem {
  id: string;
  name: string;
  price: number;
  priceType: 'coins' | 'gems' | 'free';
  description: string;
  rimStroke: string;
  specularStroke: string;
  accentColor: string;
  tiers: Record<TileTier, TileSkinPaletteOverride>;
}

export interface MusicTrackItem {
  id: string;
  name: string;
  price: number;
  priceType: 'coins' | 'gems' | 'free';
  description: string;
  mood: string;
  tempo: string;
  accentColor: string;
}

export interface LevelRewardBreakdown {
  baseCoins: number;
  starBonusCoins: number;
  movesBonusCoins: number;
  totalCoins: number;
  gemsEarned: number;
  isFirstClear: boolean;
  isStarUpgrade: boolean;
}

export type GameScreenState = 'home' | 'levels' | 'playing' | 'shop';
