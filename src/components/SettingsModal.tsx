import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Music,
  Smartphone,
  Trash2,
  Gauge,
  Image as ImageIcon,
  Hexagon,
  ExternalLink,
} from 'lucide-react';
import { GraphicsQuality, ShopCategory, UserProgress } from '../types/game';
import {
  BACKGROUND_SHOP_ITEMS,
  TILE_SKIN_SHOP_ITEMS,
  getMusicTrackById,
} from '../data/shopCatalog';
import { audioManager } from '../utils/audioManager';

interface SettingsModalProps {
  isOpen: boolean;
  progress: UserProgress;
  onClose: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleHaptics: () => void;
  onChangeSoundVolume: (vol: number) => void;
  onChangeMusicVolume: (vol: number) => void;
  onChangeGraphicsQuality: (quality: GraphicsQuality) => void;
  onSelectBackground: (bgId: string) => void;
  onSelectTileSkin: (skinId: string) => void;
  onOpenShopCategory: (category: ShopCategory) => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  progress,
  onClose,
  onToggleSound,
  onToggleMusic,
  onToggleHaptics,
  onChangeSoundVolume,
  onChangeMusicVolume,
  onChangeGraphicsQuality,
  onSelectBackground,
  onSelectTileSkin,
  onOpenShopCategory,
  onResetProgress,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const activeTrack = getMusicTrackById(progress.selectedMusicTrack);
  const ownedBgs = BACKGROUND_SHOP_ITEMS.filter(b =>
    progress.ownedBackgrounds.includes(b.id)
  );
  const ownedSkins = TILE_SKIN_SHOP_ITEMS.filter(s =>
    progress.ownedTileSkins.includes(s.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm max-h-[90vh] bg-gradient-to-b from-[#110e24] to-[#080b18] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5 shrink-0">
          <h2 className="text-lg font-black text-white tracking-tight">Game Settings</h2>
          <button
            onClick={() => {
              audioManager.playClick();
              setShowResetConfirm(false);
              onClose();
            }}
            aria-label="Close Settings"
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Settings Body */}
        <div className="flex-1 overflow-y-auto pr-0.5 flex flex-col gap-3.5">
          {/* 1. Background Music Volume & Mute */}
          <div className="flex flex-col gap-2 p-3 bg-slate-900/85 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Music
                    className={`w-4 h-4 ${
                      progress.musicEnabled ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  />
                  Background Music
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Track: {activeTrack.name}
                </span>
              </div>
              <button
                onClick={() => {
                  audioManager.playClick();
                  onToggleMusic();
                }}
                aria-label="Toggle Background Music"
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  progress.musicEnabled ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    progress.musicEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={progress.musicVolume}
                onChange={e => onChangeMusicVolume(parseFloat(e.target.value))}
                disabled={!progress.musicEnabled}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg disabled:opacity-40"
              />
              <span className="text-[10px] font-mono text-slate-400 w-8 text-right tabular-nums">
                {progress.musicEnabled ? `${Math.round(progress.musicVolume * 100)}%` : 'Mute'}
              </span>
            </div>
          </div>

          {/* 2. Sound Effects Volume & Mute */}
          <div className="flex flex-col gap-2 p-3 bg-slate-900/85 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                {progress.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                Sound Effects
              </span>
              <button
                onClick={() => {
                  audioManager.playClick();
                  onToggleSound();
                }}
                aria-label="Toggle Sound Effects"
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  progress.soundEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    progress.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={progress.soundVolume}
                onChange={e => onChangeSoundVolume(parseFloat(e.target.value))}
                disabled={!progress.soundEnabled}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg disabled:opacity-40"
              />
              <span className="text-[10px] font-mono text-slate-400 w-8 text-right tabular-nums">
                {progress.soundEnabled ? `${Math.round(progress.soundVolume * 100)}%` : 'Mute'}
              </span>
            </div>
          </div>

          {/* 3. Vibration / Tactile Haptics */}
          <div className="flex items-center justify-between p-3 bg-slate-900/85 border border-slate-800 rounded-2xl">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              Vibration
            </span>
            <button
              onClick={() => {
                audioManager.playClick();
                onToggleHaptics();
              }}
              aria-label="Toggle Vibration"
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                progress.hapticsEnabled ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  progress.hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 4. Graphics Quality: Low, Medium, High */}
          <div className="flex flex-col gap-2 p-3 bg-slate-900/85 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-400" />
                Graphics Quality
              </span>
              <span className="text-[10px] text-slate-400 capitalize">
                {progress.graphicsQuality}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              {(['low', 'medium', 'high'] as GraphicsQuality[]).map(q => {
                const active = progress.graphicsQuality === q;
                return (
                  <button
                    key={q}
                    onClick={() => {
                      audioManager.playClick();
                      onChangeGraphicsQuality(q);
                    }}
                    className={`min-h-[34px] py-1.5 px-2 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                      active
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Background Selection Shortcut */}
          <div className="flex flex-col gap-2 p-3 bg-slate-900/85 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-rose-400" />
                Background ({ownedBgs.length}/10)
              </span>
              <button
                onClick={() => {
                  audioManager.playClick();
                  onClose();
                  onOpenShopCategory('backgrounds');
                }}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1"
              >
                <span>Open Shop</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {ownedBgs.map(bg => {
                const selected = progress.selectedBackground === bg.id;
                return (
                  <button
                    key={bg.id}
                    onClick={() => {
                      audioManager.playSelect();
                      onSelectBackground(bg.id);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all whitespace-nowrap shrink-0 ${
                      selected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {bg.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Tile Skin Selection Shortcut */}
          <div className="flex flex-col gap-2 p-3 bg-slate-900/85 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Hexagon className="w-4 h-4 text-emerald-400" />
                Tile Skin ({ownedSkins.length}/10)
              </span>
              <button
                onClick={() => {
                  audioManager.playClick();
                  onClose();
                  onOpenShopCategory('tiles');
                }}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1"
              >
                <span>Open Shop</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {ownedSkins.map(skin => {
                const selected = progress.selectedTileSkin === skin.id;
                return (
                  <button
                    key={skin.id}
                    onClick={() => {
                      audioManager.playSelect();
                      onSelectTileSkin(skin.id);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all whitespace-nowrap shrink-0 ${
                      selected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {skin.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Reset Progress with Confirmation */}
          <div className="pt-2 border-t border-slate-800">
            {!showResetConfirm ? (
              <button
                onClick={() => {
                  audioManager.playClick();
                  setShowResetConfirm(true);
                }}
                className="min-h-[40px] w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Game Progress</span>
              </button>
            ) : (
              <div className="flex flex-col gap-2 p-2.5 rounded-2xl bg-rose-950/30 border border-rose-500/30">
                <span className="text-[11px] text-rose-200 text-center font-medium">
                  Reset all levels, stars, coins, and unlocked shop items?
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      audioManager.playClick();
                      setShowResetConfirm(false);
                      onResetProgress();
                      onClose();
                    }}
                    className="min-h-[38px] py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-colors"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => {
                      audioManager.playClick();
                      setShowResetConfirm(false);
                    }}
                    className="min-h-[38px] py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
