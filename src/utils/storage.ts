import {
  LevelRewardBreakdown,
  SavedLevelSession,
  ShopCategory,
  UserProgress,
} from '../types/game';
import {
  DAILY_REWARD_SCHEDULE,
  DEFAULT_BACKGROUND_ID,
  DEFAULT_MUSIC_TRACK_ID,
  DEFAULT_TILE_SKIN_ID,
} from '../data/shopCatalog';

const STORAGE_KEY = 'hexa_color_quest_v1_progress';

export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getPreviousDateString(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return '';
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  dt.setDate(dt.getDate() - 1);
  return getLocalDateString(dt);
}

export const DEFAULT_PROGRESS: UserProgress = {
  unlockedLevel: 1,
  stars: {},
  highScores: {},
  rewardedStarMilestones: {},
  claimedRewardTokens: [],
  coins: 250,
  gems: 5,
  hintsRemaining: 3,
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
  soundVolume: 0.8,
  musicVolume: 0.5,
  graphicsQuality: 'high',
  selectedBackground: DEFAULT_BACKGROUND_ID,
  ownedBackgrounds: [DEFAULT_BACKGROUND_ID],
  selectedTileSkin: DEFAULT_TILE_SKIN_ID,
  ownedTileSkins: [DEFAULT_TILE_SKIN_ID],
  selectedMusicTrack: DEFAULT_MUSIC_TRACK_ID,
  ownedMusicTracks: [DEFAULT_MUSIC_TRACK_ID],
  dailyLogin: {
    lastClaimDate: '',
    streak: 0,
  },
  savedActiveLevel: null,
};

export function loadUserProgress(): UserProgress {
  try {
    if (typeof localStorage === 'undefined') {
      return structuredCloneProgress(DEFAULT_PROGRESS);
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredCloneProgress(DEFAULT_PROGRESS);
    const parsed = JSON.parse(raw);

    const ownedBackgrounds = Array.from(
      new Set([DEFAULT_BACKGROUND_ID, ...(Array.isArray(parsed.ownedBackgrounds) ? parsed.ownedBackgrounds : [])])
    );
    const ownedTileSkins = Array.from(
      new Set([DEFAULT_TILE_SKIN_ID, ...(Array.isArray(parsed.ownedTileSkins) ? parsed.ownedTileSkins : [])])
    );
    const ownedMusicTracks = Array.from(
      new Set([DEFAULT_MUSIC_TRACK_ID, ...(Array.isArray(parsed.ownedMusicTracks) ? parsed.ownedMusicTracks : [])])
    );

    return {
      ...structuredCloneProgress(DEFAULT_PROGRESS),
      ...parsed,
      stars: parsed.stars || {},
      highScores: parsed.highScores || {},
      rewardedStarMilestones: parsed.rewardedStarMilestones || parsed.stars || {},
      claimedRewardTokens: Array.isArray(parsed.claimedRewardTokens)
        ? parsed.claimedRewardTokens.slice(-200)
        : [],
      coins: typeof parsed.coins === 'number' && parsed.coins >= 0 ? Math.floor(parsed.coins) : DEFAULT_PROGRESS.coins,
      gems: typeof parsed.gems === 'number' && parsed.gems >= 0 ? Math.floor(parsed.gems) : DEFAULT_PROGRESS.gems,
      ownedBackgrounds,
      selectedBackground: ownedBackgrounds.includes(parsed.selectedBackground)
        ? parsed.selectedBackground
        : DEFAULT_BACKGROUND_ID,
      ownedTileSkins,
      selectedTileSkin: ownedTileSkins.includes(parsed.selectedTileSkin)
        ? parsed.selectedTileSkin
        : DEFAULT_TILE_SKIN_ID,
      ownedMusicTracks,
      selectedMusicTrack: ownedMusicTracks.includes(parsed.selectedMusicTrack)
        ? parsed.selectedMusicTrack
        : DEFAULT_MUSIC_TRACK_ID,
      graphicsQuality:
        parsed.graphicsQuality === 'low' || parsed.graphicsQuality === 'medium' || parsed.graphicsQuality === 'high'
          ? parsed.graphicsQuality
          : 'high',
      dailyLogin: {
        lastClaimDate: parsed.dailyLogin?.lastClaimDate || '',
        streak: typeof parsed.dailyLogin?.streak === 'number' ? parsed.dailyLogin.streak : 0,
      },
      savedActiveLevel: parsed.savedActiveLevel || null,
    };
  } catch (err) {
    console.warn('Error reading from storage:', err);
    return structuredCloneProgress(DEFAULT_PROGRESS);
  }
}

function structuredCloneProgress(p: UserProgress): UserProgress {
  return {
    ...p,
    stars: { ...p.stars },
    highScores: { ...p.highScores },
    rewardedStarMilestones: { ...p.rewardedStarMilestones },
    claimedRewardTokens: [...p.claimedRewardTokens],
    ownedBackgrounds: [...p.ownedBackgrounds],
    ownedTileSkins: [...p.ownedTileSkins],
    ownedMusicTracks: [...p.ownedMusicTracks],
    dailyLogin: { ...p.dailyLogin },
    savedActiveLevel: p.savedActiveLevel ? { ...p.savedActiveLevel } : null,
  };
}

export function saveUserProgress(progress: UserProgress): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.warn('Error saving to storage:', err);
  }
}

export function resetAllUserProgress(): UserProgress {
  const fresh = structuredCloneProgress(DEFAULT_PROGRESS);
  saveUserProgress(fresh);
  return fresh;
}

/**
 * Calculates coin and gem rewards for completing a level, awarding extra coins for 1, 2, or 3 stars
 * while preventing duplicate farming of first-clear milestone bonuses.
 */
export function calculateLevelReward(
  levelId: number,
  starsEarned: number,
  movesLeft: number,
  prevRewardedStars: number
): LevelRewardBreakdown {
  const clampedStars = Math.max(1, Math.min(3, starsEarned));
  const isFirstClear = prevRewardedStars === 0;
  const isStarUpgrade = clampedStars > prevRewardedStars;

  const starTierValues: Record<number, number> = {
    0: 0,
    1: 20,
    2: 50,
    3: 100,
  };

  const baseCoins = isFirstClear ? 40 + Math.min(40, Math.floor(levelId / 5) * 2) : 15;
  const starBonusCoins = isStarUpgrade
    ? starTierValues[clampedStars] - starTierValues[prevRewardedStars]
    : clampedStars * 5;
  const movesBonusCoins = Math.max(0, movesLeft) * (isFirstClear ? 6 : 2);
  const totalCoins = baseCoins + starBonusCoins + movesBonusCoins;

  let gemsEarned = 0;
  if (clampedStars === 3 && prevRewardedStars < 3) {
    gemsEarned += 2;
  }
  if (isFirstClear && levelId % 5 === 0) {
    gemsEarned += 3;
  }

  return {
    baseCoins,
    starBonusCoins,
    movesBonusCoins,
    totalCoins,
    gemsEarned,
    isFirstClear,
    isStarUpgrade,
  };
}

export function completeLevelAndSave(
  currentProgress: UserProgress,
  levelId: number,
  starsEarned: number,
  scoreEarned: number,
  movesLeft: number
): { updatedProgress: UserProgress; reward: LevelRewardBreakdown } {
  const prevStars = currentProgress.stars[levelId] || 0;
  const prevRewardedStars = currentProgress.rewardedStarMilestones[levelId] || prevStars;
  const reward = calculateLevelReward(levelId, starsEarned, movesLeft, prevRewardedStars);

  const newStars = Math.max(prevStars, starsEarned);
  const prevScore = currentProgress.highScores[levelId] || 0;
  const newScore = Math.max(prevScore, scoreEarned);

  // Clear saved session if it belonged to this completed level
  const nextSavedSession =
    currentProgress.savedActiveLevel?.levelId === levelId ? null : currentProgress.savedActiveLevel;

  const updatedProgress: UserProgress = {
    ...currentProgress,
    unlockedLevel: Math.max(currentProgress.unlockedLevel, levelId + 1),
    stars: {
      ...currentProgress.stars,
      [levelId]: newStars,
    },
    highScores: {
      ...currentProgress.highScores,
      [levelId]: newScore,
    },
    rewardedStarMilestones: {
      ...currentProgress.rewardedStarMilestones,
      [levelId]: Math.max(prevRewardedStars, newStars),
    },
    coins: currentProgress.coins + reward.totalCoins,
    gems: currentProgress.gems + reward.gemsEarned,
    savedActiveLevel: nextSavedSession,
  };

  saveUserProgress(updatedProgress);
  return { updatedProgress, reward };
}

/**
 * Legacy helper preserved for backwards compatibility
 */
export function updateLevelCompletion(
  levelId: number,
  starsEarned: number,
  scoreEarned: number,
  coinsBonus: number
): UserProgress {
  const current = loadUserProgress();
  const prevStars = current.stars[levelId] || 0;
  const newStars = Math.max(prevStars, starsEarned);
  const prevScore = current.highScores[levelId] || 0;
  const newScore = Math.max(prevScore, scoreEarned);

  const updated: UserProgress = {
    ...current,
    unlockedLevel: Math.max(current.unlockedLevel, levelId + 1),
    stars: {
      ...current.stars,
      [levelId]: newStars,
    },
    highScores: {
      ...current.highScores,
      [levelId]: newScore,
    },
    rewardedStarMilestones: {
      ...current.rewardedStarMilestones,
      [levelId]: Math.max(current.rewardedStarMilestones[levelId] || 0, newStars),
    },
    coins: current.coins + coinsBonus,
  };

  saveUserProgress(updated);
  return updated;
}

/**
 * Daily Login Streak Inspection & Claim (with strict duplicate-claim guard)
 */
export function getDailyLoginStatus(progress: UserProgress, todayStr: string = getLocalDateString()) {
  const { lastClaimDate, streak } = progress.dailyLogin;
  const claimedToday = lastClaimDate === todayStr;

  if (claimedToday) {
    const activeDay = Math.max(1, Math.min(7, streak));
    return {
      canClaim: false,
      claimedToday: true,
      nextStreakDay: activeDay,
      rewardTier: DAILY_REWARD_SCHEDULE[activeDay - 1],
    };
  }

  const yesterdayStr = getPreviousDateString(todayStr);
  const nextStreakDay = lastClaimDate === yesterdayStr ? (streak % 7) + 1 : 1;

  return {
    canClaim: true,
    claimedToday: false,
    nextStreakDay,
    rewardTier: DAILY_REWARD_SCHEDULE[nextStreakDay - 1],
  };
}

export function claimDailyReward(
  progress: UserProgress,
  todayStr: string = getLocalDateString()
): { success: boolean; updatedProgress: UserProgress; coinsAdded: number; gemsAdded: number; dayClaimed: number } {
  const status = getDailyLoginStatus(progress, todayStr);
  const claimToken = `daily_${todayStr}`;

  if (!status.canClaim || progress.claimedRewardTokens.includes(claimToken)) {
    return {
      success: false,
      updatedProgress: progress,
      coinsAdded: 0,
      gemsAdded: 0,
      dayClaimed: status.nextStreakDay,
    };
  }

  const { coins, gems, day } = status.rewardTier;
  const updatedProgress: UserProgress = {
    ...progress,
    coins: progress.coins + coins,
    gems: progress.gems + gems,
    dailyLogin: {
      lastClaimDate: todayStr,
      streak: day,
    },
    claimedRewardTokens: [...progress.claimedRewardTokens.slice(-199), claimToken],
  };

  saveUserProgress(updatedProgress);
  return {
    success: true,
    updatedProgress,
    coinsAdded: coins,
    gemsAdded: gems,
    dayClaimed: day,
  };
}

/**
 * Safe single-claim reward grant for optional rewarded ads
 */
export function claimUniqueBonusReward(
  progress: UserProgress,
  claimToken: string,
  coinsDelta: number,
  gemsDelta: number = 0,
  hintsDelta: number = 0
): { success: boolean; updatedProgress: UserProgress } {
  if (!claimToken || progress.claimedRewardTokens.includes(claimToken)) {
    return { success: false, updatedProgress: progress };
  }

  const updatedProgress: UserProgress = {
    ...progress,
    coins: progress.coins + Math.max(0, coinsDelta),
    gems: progress.gems + Math.max(0, gemsDelta),
    hintsRemaining: progress.hintsRemaining + Math.max(0, hintsDelta),
    claimedRewardTokens: [...progress.claimedRewardTokens.slice(-199), claimToken],
  };

  saveUserProgress(updatedProgress);
  return { success: true, updatedProgress };
}

/**
 * Purchase & Selection for Backgrounds, Tile Skins, and Music Tracks
 */
export function purchaseShopItem(
  progress: UserProgress,
  category: ShopCategory,
  itemId: string,
  price: number,
  priceType: 'coins' | 'gems' | 'free'
): { success: boolean; reason?: 'already_owned' | 'insufficient_funds'; updatedProgress: UserProgress } {
  const ownedList =
    category === 'backgrounds'
      ? progress.ownedBackgrounds
      : category === 'tiles'
      ? progress.ownedTileSkins
      : progress.ownedMusicTracks;

  if (ownedList.includes(itemId)) {
    return { success: false, reason: 'already_owned', updatedProgress: progress };
  }

  if (priceType === 'coins' && progress.coins < price) {
    return { success: false, reason: 'insufficient_funds', updatedProgress: progress };
  }
  if (priceType === 'gems' && progress.gems < price) {
    return { success: false, reason: 'insufficient_funds', updatedProgress: progress };
  }

  const nextCoins = priceType === 'coins' ? progress.coins - price : progress.coins;
  const nextGems = priceType === 'gems' ? progress.gems - price : progress.gems;

  const updatedProgress: UserProgress = {
    ...progress,
    coins: nextCoins,
    gems: nextGems,
    ownedBackgrounds:
      category === 'backgrounds' ? [...progress.ownedBackgrounds, itemId] : progress.ownedBackgrounds,
    selectedBackground: category === 'backgrounds' ? itemId : progress.selectedBackground,
    ownedTileSkins:
      category === 'tiles' ? [...progress.ownedTileSkins, itemId] : progress.ownedTileSkins,
    selectedTileSkin: category === 'tiles' ? itemId : progress.selectedTileSkin,
    ownedMusicTracks:
      category === 'music' ? [...progress.ownedMusicTracks, itemId] : progress.ownedMusicTracks,
    selectedMusicTrack: category === 'music' ? itemId : progress.selectedMusicTrack,
  };

  saveUserProgress(updatedProgress);
  return { success: true, updatedProgress };
}

export function selectShopItem(
  progress: UserProgress,
  category: ShopCategory,
  itemId: string
): { success: boolean; updatedProgress: UserProgress } {
  const ownedList =
    category === 'backgrounds'
      ? progress.ownedBackgrounds
      : category === 'tiles'
      ? progress.ownedTileSkins
      : progress.ownedMusicTracks;

  if (!ownedList.includes(itemId)) {
    return { success: false, updatedProgress: progress };
  }

  const updatedProgress: UserProgress = {
    ...progress,
    selectedBackground: category === 'backgrounds' ? itemId : progress.selectedBackground,
    selectedTileSkin: category === 'tiles' ? itemId : progress.selectedTileSkin,
    selectedMusicTrack: category === 'music' ? itemId : progress.selectedMusicTrack,
  };

  saveUserProgress(updatedProgress);
  return { success: true, updatedProgress };
}

export function exchangeGemsForCoins(
  progress: UserProgress,
  gemsCost: number = 5,
  coinsAwarded: number = 350
): { success: boolean; updatedProgress: UserProgress } {
  if (progress.gems < gemsCost) {
    return { success: false, updatedProgress: progress };
  }
  const updatedProgress: UserProgress = {
    ...progress,
    gems: progress.gems - gemsCost,
    coins: progress.coins + coinsAwarded,
  };
  saveUserProgress(updatedProgress);
  return { success: true, updatedProgress };
}

export function saveActiveLevelSession(
  progress: UserProgress,
  session: SavedLevelSession | null
): UserProgress {
  const updatedProgress: UserProgress = {
    ...progress,
    savedActiveLevel: session,
  };
  saveUserProgress(updatedProgress);
  return updatedProgress;
}
