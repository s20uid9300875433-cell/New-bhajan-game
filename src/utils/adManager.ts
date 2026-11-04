/**
 * AdManager - Architecture for Google Mobile Ads SDK Integration
 * Configured in Test Mode with standard Google test ad unit IDs.
 * Safe ad placement rules:
 * - Never show ads during active gameplay
 * - Rewarded ad only upon user request (for hint or extra moves)
 * - Interstitial shown sparingly on level completion
 */

export interface AdUnitConfig {
  testMode: boolean;
  bannerAdUnitId: string;
  interstitialAdUnitId: string;
  rewardedAdUnitId: string;
}

export interface AdReward {
  type: 'hint' | 'extra_moves' | 'coins';
  amount: number;
}

export type AdStateListener = (isOpen: boolean, type: 'rewarded' | 'interstitial', reward?: AdReward) => void;

class AdManager {
  // Official Google Mobile Ads Test Ad Unit IDs
  public readonly config: AdUnitConfig = {
    testMode: true,
    bannerAdUnitId: 'ca-app-pub-3940256099942544/6300978111',
    interstitialAdUnitId: 'ca-app-pub-3940256099942544/1033173712',
    rewardedAdUnitId: 'ca-app-pub-3940256099942544/5224354917',
  };

  private listeners: AdStateListener[] = [];
  private levelsCompletedSinceAd = 0;
  private pendingRewardCallback: (() => void) | null = null;
  private pendingDismissCallback: (() => void) | null = null;

  public subscribe(listener: AdStateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(isOpen: boolean, type: 'rewarded' | 'interstitial', reward?: AdReward) {
    this.listeners.forEach(l => l(isOpen, type, reward));
  }

  /**
   * Request an optional Rewarded Ad to earn a free Hint or +3 Extra Moves
   */
  public showRewardedAd(reward: AdReward, onRewardEarned: () => void) {
    this.pendingRewardCallback = onRewardEarned;
    this.notify(true, 'rewarded', reward);
  }

  /**
   * Show Interstitial Ad upon Level Completion (only every 3 levels to prevent ad fatigue)
   */
  public notifyLevelCompleted(levelId: number, onComplete: () => void) {
    this.levelsCompletedSinceAd++;
    // Show interstitial sparingly (every 3 levels, and not on level 1 or 2)
    if (this.levelsCompletedSinceAd >= 3 && levelId > 2) {
      this.levelsCompletedSinceAd = 0;
      this.pendingDismissCallback = onComplete;
      this.notify(true, 'interstitial');
    } else {
      onComplete();
    }
  }

  public completeReward() {
    if (this.pendingRewardCallback) {
      this.pendingRewardCallback();
      this.pendingRewardCallback = null;
    }
    this.notify(false, 'rewarded');
  }

  public dismissAd() {
    if (this.pendingDismissCallback) {
      this.pendingDismissCallback();
      this.pendingDismissCallback = null;
    }
    this.notify(false, 'interstitial');
  }
}

export const adManager = new AdManager();
