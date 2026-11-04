/**
 * AdManager - Google Mobile Ads SDK Abstraction Layer
 * Configured with official Google Mobile Ads Test Ad Unit IDs.
 *
 * Policy & UX Guarantees:
 * - Official Google Test Ad Unit IDs during development
 * - Never interrupts active gameplay with forced ads
 * - Rewarded ads only play on explicit user opt-in
 * - Strict completion callback verification (no reward on early close, error, or no-fill)
 * - Unique claimToken per session to prevent duplicate reward grants
 * - Interstitials shown sparingly at natural level breaks (every 4 completed levels after Level 3)
 */

export interface AdUnitConfig {
  testMode: boolean;
  appId: string;
  bannerAdUnitId: string;
  interstitialAdUnitId: string;
  rewardedAdUnitId: string;
}

export interface AdReward {
  type: 'hint' | 'extra_moves' | 'coins' | 'victory_bonus';
  amount: number;
}

export interface AdModalState {
  isOpen: boolean;
  type: 'rewarded' | 'interstitial';
  status: 'loading' | 'ready' | 'no_fill' | 'network_error';
  reward?: AdReward;
  claimToken?: string;
}

export type AdStateListener = (state: AdModalState) => void;

class AdManager {
  // Official Google Mobile Ads Test Ad Unit IDs
  public readonly config: AdUnitConfig = {
    testMode: true,
    appId: 'ca-app-pub-3940256099942544~3347511713',
    bannerAdUnitId: 'ca-app-pub-3940256099942544/6300978111',
    interstitialAdUnitId: 'ca-app-pub-3940256099942544/1033173712',
    rewardedAdUnitId: 'ca-app-pub-3940256099942544/5224354917',
  };

  private listeners: AdStateListener[] = [];
  private levelsCompletedSinceAd = 0;
  private pendingRewardCallback: ((claimToken: string) => void) | null = null;
  private pendingDismissCallback: (() => void) | null = null;
  private activeClaimToken: string | null = null;
  private rewardCompletedForSession = false;
  private loadTimer: number | null = null;

  public subscribe(listener: AdStateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(state: AdModalState) {
    this.listeners.forEach(l => l(state));
  }

  private clearLoadTimer() {
    if (this.loadTimer !== null && typeof window !== 'undefined') {
      clearTimeout(this.loadTimer);
      this.loadTimer = null;
    }
  }

  /**
   * Request an optional Rewarded Ad (bonus coins, hint, or extra moves).
   * Reward callback is ONLY invoked if `confirmRewardCompleted()` is called before dismissal.
   */
  public showRewardedAd(reward: AdReward, onRewardEarned: (claimToken: string) => void) {
    this.clearLoadTimer();
    const token = `ad_reward_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.activeClaimToken = token;
    this.rewardCompletedForSession = false;
    this.pendingRewardCallback = onRewardEarned;

    // Check network connectivity gracefully
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.notify({
        isOpen: true,
        type: 'rewarded',
        status: 'network_error',
        reward,
        claimToken: token,
      });
      return;
    }

    this.notify({
      isOpen: true,
      type: 'rewarded',
      status: 'loading',
      reward,
      claimToken: token,
    });

    if (typeof window !== 'undefined') {
      this.loadTimer = window.setTimeout(() => {
        this.notify({
          isOpen: true,
          type: 'rewarded',
          status: 'ready',
          reward,
          claimToken: token,
        });
      }, 450);
    } else {
      this.notify({
        isOpen: true,
        type: 'rewarded',
        status: 'ready',
        reward,
        claimToken: token,
      });
    }
  }

  /**
   * Show Interstitial Ad sparingly at natural breaks between completed levels
   * (only every 4 completed levels, never on levels 1-3, never mid-level).
   */
  public notifyLevelCompleted(levelId: number, onComplete: () => void) {
    this.levelsCompletedSinceAd++;
    if (this.levelsCompletedSinceAd >= 4 && levelId > 3) {
      this.levelsCompletedSinceAd = 0;

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        onComplete();
        return;
      }

      this.pendingDismissCallback = onComplete;
      this.notify({
        isOpen: true,
        type: 'interstitial',
        status: 'ready',
      });
    } else {
      onComplete();
    }
  }

  /**
   * Called strictly when the rewarded ad timer finishes playing completely.
   */
  public markRewardEarned() {
    this.rewardCompletedForSession = true;
  }

  /**
   * Claim and close after verified completion. Prevents duplicate claims.
   */
  public completeReward() {
    this.clearLoadTimer();
    if (this.rewardCompletedForSession && this.pendingRewardCallback && this.activeClaimToken) {
      const token = this.activeClaimToken;
      const cb = this.pendingRewardCallback;
      this.activeClaimToken = null;
      this.pendingRewardCallback = null;
      this.rewardCompletedForSession = false;
      cb(token);
    }
    this.notify({
      isOpen: false,
      type: 'rewarded',
      status: 'ready',
    });
  }

  /**
   * Dismiss ad early or after interstitial/error — NEVER grants rewarded ad bonus.
   */
  public dismissAd() {
    this.clearLoadTimer();
    this.activeClaimToken = null;
    this.pendingRewardCallback = null;
    this.rewardCompletedForSession = false;

    if (this.pendingDismissCallback) {
      const dismissCb = this.pendingDismissCallback;
      this.pendingDismissCallback = null;
      dismissCb();
    }

    this.notify({
      isOpen: false,
      type: 'interstitial',
      status: 'ready',
    });
  }
}

export const adManager = new AdManager();
