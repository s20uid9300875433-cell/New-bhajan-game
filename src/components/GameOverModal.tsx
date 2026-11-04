import React, { useEffect } from 'react';
import { RotateCcw, Undo2, Film, Grid, AlertTriangle } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface GameOverModalProps {
  isOpen: boolean;
  levelNumber: number;
  canUndo: boolean;
  onRetry: () => void;
  onUndo: () => void;
  onWatchAdExtraMoves: () => void;
  onLevelSelect: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  levelNumber,
  canUndo,
  onRetry,
  onUndo,
  onWatchAdExtraMoves,
  onLevelSelect,
}) => {
  useEffect(() => {
    if (isOpen) {
      audioManager.playGameOver();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xs bg-gradient-to-b from-[#140f24] to-[#080b18] border border-rose-500/35 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Soft background aura */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Badge & Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold mb-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          Out of Moves
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">Quest Incomplete</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          You ran out of moves on Level {levelNumber}. Try a different strategy or gain extra moves!
        </p>

        {/* Rewarded Ad Opportunity */}
        <button
          onClick={() => {
            audioManager.playClick();
            onWatchAdExtraMoves();
          }}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white font-extrabold shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all text-xs mb-3 border border-white/20"
        >
          <Film className="w-4 h-4" />
          <span>Get +3 Moves (Test Ad)</span>
        </button>

        {/* Retry Button */}
        <button
          onClick={() => {
            audioManager.playClick();
            onRetry();
          }}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold active:scale-95 transition-all text-xs mb-3 shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>

        {/* Undo and Levels */}
        <div className="flex items-center gap-2 w-full">
          {canUndo && (
            <button
              onClick={() => {
                audioManager.playUndo();
                onUndo();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold active:scale-95 transition-all shadow-md"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
          )}

          <button
            onClick={() => {
              audioManager.playClick();
              onLevelSelect();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold active:scale-95 transition-all shadow-md"
          >
            <Grid className="w-3.5 h-3.5" />
            Map
          </button>
        </div>
      </div>
    </div>
  );
};
