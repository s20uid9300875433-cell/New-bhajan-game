import { UserProgress } from '../types/game';

const STORAGE_KEY = 'hexa_color_quest_v1_progress';

const DEFAULT_PROGRESS: UserProgress = {
  unlockedLevel: 1,
  stars: {},
  highScores: {},
  coins: 100,
  hintsRemaining: 3,
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
  soundVolume: 0.8,
  musicVolume: 0.5,
};

export function loadUserProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      stars: parsed.stars || {},
      highScores: parsed.highScores || {},
    };
  } catch (err) {
    console.warn('Error reading from storage:', err);
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.warn('Error saving to storage:', err);
  }
}

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
    coins: current.coins + coinsBonus,
  };

  saveUserProgress(updated);
  return updated;
}
