import React, { useState } from 'react';
import { X, Volume2, VolumeX, Music, Smartphone, Trash2, ShieldCheck } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface SettingsModalProps {
  isOpen: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  onClose: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleHaptics: () => void;
  onChangeSoundVolume: (vol: number) => void;
  onChangeMusicVolume: (vol: number) => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  soundEnabled,
  musicEnabled,
  hapticsEnabled,
  soundVolume,
  musicVolume,
  onClose,
  onToggleSound,
  onToggleMusic,
  onToggleHaptics,
  onChangeSoundVolume,
  onChangeMusicVolume,
  onResetProgress,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#110e24] to-[#080b18] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-white tracking-tight">Audio & Settings</h2>
          <button
            onClick={() => {
              audioManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {/* Sound FX Section */}
          <div className="flex flex-col gap-2 p-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                Sound Effects
              </span>
              <button
                onClick={() => {
                  audioManager.playClick();
                  onToggleSound();
                }}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  soundEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {soundEnabled && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={e => onChangeSoundVolume(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] font-mono text-slate-400 w-7 text-right">
                  {Math.round(soundVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Music Section */}
          <div className="flex flex-col gap-2 p-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Music className={`w-4 h-4 ${musicEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
                Original Relaxing Music
              </span>
              <button
                onClick={() => {
                  audioManager.playClick();
                  onToggleMusic();
                }}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  musicEnabled ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    musicEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {musicEnabled && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={e => onChangeMusicVolume(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] font-mono text-slate-400 w-7 text-right">
                  {Math.round(musicVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Haptics */}
          <div className="flex items-center justify-between p-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              Tactile Haptics
            </span>
            <button
              onClick={() => {
                audioManager.playClick();
                onToggleHaptics();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                hapticsEnabled ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Offline & Privacy Guarantee */}
          <div className="p-3 bg-slate-900/60 border border-slate-800/60 rounded-2xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Hexa Color Quest saves progress locally on your device. 100% offline, zero accounts required, and independent volume settings.
            </p>
          </div>

          {/* Reset Progress */}
          <div className="pt-1 border-t border-slate-800">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset Game Progress
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    audioManager.playClick();
                    onResetProgress();
                    setShowResetConfirm(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-colors"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
