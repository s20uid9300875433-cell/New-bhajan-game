import React from 'react';
import { Coins, Check, X, Film, ShieldCheck } from 'lucide-react';
import { ShopCategory } from '../types/game';
import { audioManager } from '../utils/audioManager';

export interface PendingPurchaseItem {
  category: ShopCategory;
  id: string;
  name: string;
  price: number;
  priceType: 'coins' | 'gems' | 'free';
  description: string;
  previewNode?: React.ReactNode;
}

interface PurchaseConfirmModalProps {
  item: PendingPurchaseItem | null;
  currentCoins: number;
  onConfirm: () => void;
  onCancel: () => void;
  onWatchAdForCoins: () => void;
}

export const PurchaseConfirmModal: React.FC<PurchaseConfirmModalProps> = ({
  item,
  currentCoins,
  onConfirm,
  onCancel,
  onWatchAdForCoins,
}) => {
  if (!item) return null;

  const canAfford = currentCoins >= item.price;
  const remainingCoins = currentCoins - item.price;
  const deficit = Math.max(0, item.price - currentCoins);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-xs bg-slate-900 border border-slate-700/90 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center">
        <button
          onClick={() => {
            audioManager.playClick();
            onCancel();
          }}
          aria-label="Close confirmation"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <span className="text-xs font-semibold text-cyan-300 tracking-wide mb-1">
          Confirm Unlock
        </span>
        <h3 className="text-lg font-black text-white tracking-tight mb-3 pr-4">
          {item.name}
        </h3>

        {item.previewNode && (
          <div className="w-full mb-3 flex items-center justify-center">
            {item.previewNode}
          </div>
        )}

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {item.description}
        </p>

        {/* Balance Math Breakdown */}
        <div className="w-full rounded-2xl bg-slate-950/90 border border-slate-800 p-3 mb-4 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Current Balance</span>
            <span className="font-bold text-slate-200 tabular-nums flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              {currentCoins.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>Unlock Price</span>
            <span className="font-bold text-amber-300 tabular-nums flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              {item.price.toLocaleString()}
            </span>
          </div>

          <div className="border-t border-slate-800 my-0.5" />

          {canAfford ? (
            <div className="flex items-center justify-between text-emerald-300 font-bold">
              <span>Balance After</span>
              <span className="tabular-nums flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                {remainingCoins.toLocaleString()}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-rose-300 font-bold">
              <span>Coins Needed</span>
              <span className="tabular-nums">+{deficit.toLocaleString()} more</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>100% virtual currency · Permanently yours</span>
        </div>

        {canAfford ? (
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button
              onClick={() => {
                audioManager.playClick();
                onCancel();
              }}
              className="min-h-[44px] py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                audioManager.playPurchase();
                onConfirm();
              }}
              className="min-h-[44px] py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Buy Now</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => {
                audioManager.playClick();
                onCancel();
                onWatchAdForCoins();
              }}
              className="min-h-[44px] w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white text-xs font-black shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Film className="w-4 h-4" />
              <span>Watch Test Ad (+150 Coins)</span>
            </button>
            <button
              onClick={() => {
                audioManager.playClick();
                onCancel();
              }}
              className="min-h-[42px] w-full py-2 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors whitespace-nowrap"
            >
              Keep Playing Levels
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
