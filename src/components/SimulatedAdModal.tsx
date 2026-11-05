import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Tv, Sparkles, WifiOff, Loader2 } from 'lucide-react';
import { AdModalState, AdReward, adManager } from '../utils/adManager';
import { audioManager } from '../utils/audioManager';

export interface SimulatedAdModalProps {
  adState?: AdModalState;
  isOpen?: boolean;
  type?: 'rewarded' | 'interstitial';
  status?: 'loading' | 'ready' | 'no_fill' | 'network_error';
  reward?: AdReward;
  onComplete: () => void;
  onDismiss: () => void;
}

function formatRewardLabel(reward?: AdReward): string {
  if (!reward) return 'Bonus Reward';
  switch (reward.type) {
    case 'coins':
      return `+${reward.amount} Coins`;
    case 'victory_bonus':
      return `+${reward.amount} Bonus Coins`;
    case 'extra_moves':
      return `+${reward.amount} Extra Moves`;
    case 'hint':
      return `+${reward.amount} Hint`;
    default:
      return 'Bonus Reward';
  }
}

export const SimulatedAdModal: React.FC<SimulatedAdModalProps> = ({
  adState,
  isOpen: propIsOpen,
  type: propType,
  status: propStatus,
  reward: propReward,
  onComplete,
  onDismiss,
}) => {
  const isOpen = adState?.isOpen ?? propIsOpen ?? false;
  const type = adState?.type ?? propType ?? 'rewarded';
  const status = adState?.status ?? propStatus ?? 'ready';
  const reward = adState?.reward ?? propReward;
  const totalDuration = type === 'rewarded' ? 5 : 3;
  const [secondsRemaining, setSecondsRemaining] = useState(totalDuration);
  const [rewardGranted, setRewardGranted] = useState(false);

  useEffect(() => {
    if (!isOpen || status !== 'ready') {
      setSecondsRemaining(type === 'rewarded' ? 5 : 3);
      setRewardGranted(false);
      return;
    }

    setSecondsRemaining(totalDuration);
    setRewardGranted(false);

    const timer = window.setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (type === 'rewarded') {
            adManager.markRewardEarned();
            setRewardGranted(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, status, type, totalDuration]);

  if (!isOpen) return null;

  const handleEarlyClose = () => {
    audioManager.playClick();
    onDismiss();
  };

  const handleFinishAction = () => {
    audioManager.playClick();
    if (type === 'rewarded' && rewardGranted) {
      onComplete();
    } else {
      onDismiss();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Official Google Test Ad Header */}
        <div className="flex items-center justify-between w-full mb-4 gap-2">
          <span className="text-[11px] font-mono font-bold text-amber-300 truncate">
            Test Ad · Google Mobile Ads
          </span>

          <div className="flex items-center gap-2 shrink-0">
            {status === 'ready' && secondsRemaining > 0 && (
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {secondsRemaining}s
              </span>
            )}
            <button
              onClick={secondsRemaining === 0 && status === 'ready' ? handleFinishAction : handleEarlyClose}
              aria-label="Close Ad"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {status === 'loading' && (
          <div className="w-full py-10 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-9 h-9 text-cyan-400 animate-spin" />
            <p className="text-sm font-bold text-white">Loading Test Ad...</p>
            <p className="text-xs text-slate-400">Connecting to Google Mobile Ads test unit</p>
          </div>
        )}

        {/* Network Error / No-Fill Fallback */}
        {(status === 'network_error' || status === 'no_fill') && (
          <div className="w-full py-6 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <WifiOff className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Ad Currently Unavailable</h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-[240px]">
              No test ad fill is available right now. Please check your connection and try again shortly.
            </p>
            <button
              onClick={handleEarlyClose}
              className="mt-2 min-h-[44px] w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors"
            >
              Return to Game
            </button>
          </div>
        )}

        {/* Ready / Active Playback State */}
        {status === 'ready' && (
          <>
            <div className="w-full aspect-video bg-gradient-to-br from-slate-800 via-indigo-950/80 to-slate-900 rounded-2xl border border-indigo-400/25 flex flex-col items-center justify-center p-4 mb-4 relative overflow-hidden">
              <Tv className="w-10 h-10 text-cyan-400 mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">
                {type === 'rewarded' ? 'Hexa Color Quest Reward' : 'Chapter Intermission'}
              </h4>
              <p className="text-[11px] text-slate-300 max-w-[220px] leading-snug">
                {type === 'rewarded'
                  ? `Watch until completion to unlock ${formatRewardLabel(reward)}.`
                  : 'Enjoy a brief breather before your next puzzle board.'}
              </p>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
                <div
                  className="h-full bg-cyan-400 transition-all duration-1000 ease-linear"
                  style={{
                    width: `${((totalDuration - secondsRemaining) / totalDuration) * 100}%`,
                  }}
                />
              </div>
            </div>

            {type === 'rewarded' && (
              <div className="flex items-center justify-center gap-2 mb-4 min-h-[24px]">
                {rewardGranted ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Reward Unlocked: {formatRewardLabel(reward)}!</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Closing early cancels the reward</span>
                  </span>
                )}
              </div>
            )}

            <button
              onClick={handleFinishAction}
              disabled={secondsRemaining > 0}
              className={`min-h-[46px] w-full py-3 px-4 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                secondsRemaining === 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {secondsRemaining === 0
                ? type === 'rewarded'
                  ? `Claim ${formatRewardLabel(reward)}`
                  : 'Continue Playing'
                : `Please wait (${secondsRemaining}s)`}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
