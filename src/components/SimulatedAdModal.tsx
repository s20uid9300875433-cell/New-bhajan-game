import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Tv, Sparkles } from 'lucide-react';
import { AdReward } from '../utils/adManager';
import { audioManager } from '../utils/audioManager';

interface SimulatedAdModalProps {
  isOpen: boolean;
  type: 'rewarded' | 'interstitial';
  reward?: AdReward;
  onComplete: () => void;
  onDismiss: () => void;
}

export const SimulatedAdModal: React.FC<SimulatedAdModalProps> = ({
  isOpen,
  type,
  reward,
  onComplete,
  onDismiss,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(type === 'rewarded' ? 5 : 3);
  const [rewardGranted, setRewardGranted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(type === 'rewarded' ? 5 : 3);
      setRewardGranted(false);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setRewardGranted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleClose = () => {
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
        {/* Google Test Ad Header Badge */}
        <div className="flex items-center justify-between w-full mb-4">
          <div className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider">
            Test Ad · Google Mobile Ads SDK
          </div>
          {secondsRemaining === 0 ? (
            <button
              onClick={handleClose}
              className="p-1 rounded-full bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              Skip in {secondsRemaining}s
            </span>
          )}
        </div>

        {/* Ad Body Showcase */}
        <div className="w-full aspect-video bg-gradient-to-br from-indigo-900/60 to-purple-900/60 rounded-2xl border border-indigo-500/30 flex flex-col items-center justify-center p-4 mb-5 relative overflow-hidden">
          <Tv className="w-10 h-10 text-indigo-400 mb-2 animate-bounce" />
          <h4 className="text-sm font-bold text-white mb-1">
            {type === 'rewarded' ? 'Hexa Color Quest Supporter' : 'Level Break'}
          </h4>
          <p className="text-[11px] text-indigo-200/80 max-w-[200px]">
            {type === 'rewarded'
              ? 'Thank you for supporting Hexa Color Quest! Reward will be unlocked in seconds.'
              : 'Take a quick breather between puzzle challenges.'}
          </p>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
            <div
              className="h-full bg-cyan-400 transition-all duration-1000 ease-linear"
              style={{
                width: `${(( (type === 'rewarded' ? 5 : 3) - secondsRemaining) / (type === 'rewarded' ? 5 : 3)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Reward Status */}
        {type === 'rewarded' && (
          <div className="flex items-center gap-2 mb-4">
            {rewardGranted ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Reward Unlocked: {reward?.type === 'extra_moves' ? '+3 Moves' : '+1 Hint'}!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Watch to receive your free reward
              </span>
            )}
          </div>
        )}

        {/* Claim / Continue Button */}
        <button
          onClick={handleClose}
          disabled={secondsRemaining > 0}
          className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${
            secondsRemaining === 0
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {secondsRemaining === 0 ? 'Claim & Return' : `Please wait (${secondsRemaining}s)`}
        </button>
      </div>
    </div>
  );
};
