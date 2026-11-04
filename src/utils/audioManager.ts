/**
 * Web Audio API procedural audio synthesizer & Haptic controller
 * Features 5 selectable original instrumental background music tracks,
 * Shop music previewing, independent Music & SFX volume/mute controls,
 * and visibility-aware lifecycle management to prevent audio/timer leaks.
 */

import { DEFAULT_MUSIC_TRACK_ID } from '../data/shopCatalog';

interface TrackSynthProfile {
  chords: number[][];
  padWave: OscillatorType;
  arpWave: OscillatorType;
  filterCutoff: number;
  chordIntervalMs: number;
  padAttackSec: number;
  padReleaseSec: number;
  padGain: number;
  arpOffsetsMs: number[];
  arpOctaveMult: number;
  arpDecaySec: number;
  arpGain: number;
}

const TRACK_PROFILES: Record<string, TrackSynthProfile> = {
  // 1. Relaxing Piano — Warm Lydian acoustic-voiced chords & gentle upper melody notes
  relaxing_piano: {
    chords: [
      [146.83, 220.00, 293.66, 369.99, 440.00], // Dmaj7
      [196.00, 246.94, 293.66, 369.99, 493.88], // Gmaj7
      [123.47, 220.00, 293.66, 329.63, 440.00], // Bm7
      [110.00, 220.00, 293.66, 329.63, 440.00], // Asus4
    ],
    padWave: 'triangle',
    arpWave: 'sine',
    filterCutoff: 820,
    chordIntervalMs: 3600,
    padAttackSec: 0.5,
    padReleaseSec: 4.4,
    padGain: 0.052,
    arpOffsetsMs: [450, 1150, 1950, 2750],
    arpOctaveMult: 2,
    arpDecaySec: 1.35,
    arpGain: 0.026,
  },
  // 2. Ocean Dreams — Flowing pentatonic tide arpeggios & warm lagoon harmonies
  ocean_dreams: {
    chords: [
      [130.81, 196.00, 246.94, 293.66, 392.00], // Cmaj9
      [110.00, 164.81, 220.00, 261.63, 329.63], // Am9
      [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj9
      [196.00, 246.94, 293.66, 329.63, 440.00], // G6/9
    ],
    padWave: 'sine',
    arpWave: 'triangle',
    filterCutoff: 680,
    chordIntervalMs: 4000,
    padAttackSec: 1.1,
    padReleaseSec: 4.9,
    padGain: 0.058,
    arpOffsetsMs: [350, 850, 1350, 1850, 2500, 3150],
    arpOctaveMult: 2,
    arpDecaySec: 1.5,
    arpGain: 0.022,
  },
  // 3. Magic Forest — Enchanted celesta bell plucks & Dorian woodland chords
  magic_forest: {
    chords: [
      [174.61, 261.63, 329.63, 392.00, 493.88], // Fmaj7#11
      [146.83, 220.00, 261.63, 329.63, 440.00], // Dm9
      [130.81, 196.00, 246.94, 329.63, 392.00], // Cmaj7
      [196.00, 293.66, 349.23, 440.00, 523.25], // Gm9/C
    ],
    padWave: 'sine',
    arpWave: 'sine',
    filterCutoff: 1100,
    chordIntervalMs: 3300,
    padAttackSec: 0.65,
    padReleaseSec: 3.9,
    padGain: 0.046,
    arpOffsetsMs: [300, 750, 1200, 1800, 2400],
    arpOctaveMult: 3,
    arpDecaySec: 0.95,
    arpGain: 0.018,
  },
  // 4. Soft Electronic — Silky analog-inspired chillwave synth pads & syncopated pulse
  soft_electronic: {
    chords: [
      [138.59, 207.65, 261.63, 311.13, 415.30], // Dbmaj9
      [116.54, 174.61, 207.65, 261.63, 349.23], // Bbm9
      [155.56, 207.65, 233.08, 311.13, 392.00], // Ebmaj7/F
      [103.83, 155.56, 207.65, 246.94, 311.13], // Abmaj7
    ],
    padWave: 'triangle',
    arpWave: 'triangle',
    filterCutoff: 950,
    chordIntervalMs: 3000,
    padAttackSec: 0.35,
    padReleaseSec: 3.4,
    padGain: 0.048,
    arpOffsetsMs: [0, 375, 750, 1125, 1500, 1875, 2250, 2625],
    arpOctaveMult: 2,
    arpDecaySec: 0.45,
    arpGain: 0.02,
  },
  // 5. Cosmic Meditation — Deep astral fifths, slow shimmer pads & starlight chimes
  cosmic_meditation: {
    chords: [
      [108.00, 162.00, 216.00, 324.00, 432.00], // A2-E3-A3-E4-A4 pure fifths
      [96.00, 144.00, 192.00, 288.00, 384.00],  // Deep C-G cosmic drone
      [128.00, 192.00, 256.00, 320.00, 480.00], // Celestial major shimmer
      [108.00, 162.00, 243.00, 324.00, 486.00], // Starlight suspended ninth
    ],
    padWave: 'sine',
    arpWave: 'sine',
    filterCutoff: 620,
    chordIntervalMs: 4800,
    padAttackSec: 1.6,
    padReleaseSec: 5.8,
    padGain: 0.06,
    arpOffsetsMs: [1100, 2600, 3900],
    arpOctaveMult: 2,
    arpDecaySec: 2.1,
    arpGain: 0.017,
  },
};

class AudioManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMusicPlaying = false;
  private scheduledTimers: number[] = [];
  private soundEnabled = true;
  private musicEnabled = true;
  private hapticsEnabled = true;
  private soundVolume = 0.8;
  private musicVolume = 0.5;
  private selectedTrackId: string = DEFAULT_MUSIC_TRACK_ID;
  private previewTrackId: string | null = null;
  private lifecycleBound = false;
  private wasPlayingBeforeHidden = false;

  private initContext() {
    if (typeof window === 'undefined') return;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.isEffectiveMusicAudible() ? this.musicVolume * 0.24 : 0;
      this.musicGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.soundEnabled ? this.soundVolume : 0;
      this.sfxGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (!this.lifecycleBound && typeof document !== 'undefined') {
      this.lifecycleBound = true;
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange = () => {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      this.wasPlayingBeforeHidden = this.isMusicPlaying;
      this.stopBackgroundMusic();
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    } else {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (this.wasPlayingBeforeHidden && (this.musicEnabled || this.previewTrackId)) {
        this.startBackgroundMusic();
      }
    }
  };

  private isEffectiveMusicAudible(): boolean {
    return this.previewTrackId !== null || this.musicEnabled;
  }

  private updateMusicGainValue() {
    if (this.musicGain && this.ctx) {
      const targetVol = this.isEffectiveMusicAudible()
        ? Math.max(0.08, this.musicVolume) * 0.24
        : 0;
      const actualVol = this.previewTrackId !== null
        ? Math.max(0.35, this.musicVolume) * 0.24
        : this.musicEnabled
        ? this.musicVolume * 0.24
        : 0;
      this.musicGain.gain.setTargetAtTime(
        this.previewTrackId !== null ? targetVol : actualVol,
        this.ctx.currentTime,
        0.04
      );
    }
  }

  public setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
  }

  public triggerHaptic(durationOrPattern: number | number[] = 12) {
    if (!this.hapticsEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(durationOrPattern);
      }
    } catch {
      // Ignore on unsupported devices
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(enabled ? this.soundVolume : 0, this.ctx.currentTime);
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    this.updateMusicGainValue();
    if (enabled && !this.isMusicPlaying) {
      this.startBackgroundMusic();
    } else if (!enabled && !this.previewTrackId && this.isMusicPlaying) {
      this.stopBackgroundMusic();
    }
  }

  public setSoundVolume(vol: number) {
    this.soundVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx && this.soundEnabled) {
      this.sfxGain.gain.setValueAtTime(this.soundVolume, this.ctx.currentTime);
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    this.updateMusicGainValue();
  }

  public setSelectedTrack(trackId: string) {
    if (this.selectedTrackId === trackId && !this.previewTrackId) return;
    this.selectedTrackId = trackId;
    if (!this.previewTrackId && this.musicEnabled) {
      this.restartMusicLoop();
    }
  }

  public getSelectedTrack(): string {
    return this.selectedTrackId;
  }

  public getPreviewTrack(): string | null {
    return this.previewTrackId;
  }

  public startPreviewTrack(trackId: string) {
    this.initContext();
    this.previewTrackId = trackId;
    this.updateMusicGainValue();
    this.restartMusicLoop();
  }

  public stopPreviewTrack() {
    if (this.previewTrackId === null) return;
    this.previewTrackId = null;
    this.updateMusicGainValue();
    if (this.musicEnabled) {
      this.restartMusicLoop();
    } else {
      this.stopBackgroundMusic();
    }
  }

  private restartMusicLoop() {
    this.stopBackgroundMusic();
    this.startBackgroundMusic();
  }

  // --- Sound Effects ---

  public playSelect() {
    this.triggerHaptic(8);
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(820, t + 0.07);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playMove() {
    this.triggerHaptic(12);
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.09);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playInvalidMove() {
    this.triggerHaptic([18, 30, 18]);
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.14);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playMerge(tier: number, combo = 1) {
    this.triggerHaptic(22);
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const baseFreqs = [329.63, 392.00, 493.88, 587.33, 659.25, 880.00];
    const baseFreq = baseFreqs[Math.min(tier - 1, baseFreqs.length - 1)] || 440;
    const pitchMultiplier = 1 + (combo - 1) * 0.12;

    const notes = [
      baseFreq * pitchMultiplier,
      baseFreq * 1.25 * pitchMultiplier,
      baseFreq * 1.5 * pitchMultiplier,
      baseFreq * 2.0 * pitchMultiplier,
    ];
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.24, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.42);
    });
  }

  public playPurchase() {
    this.triggerHaptic([15, 25, 30]);
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.055;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.22, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.34);
    });
  }

  public playVictory() {
    this.triggerHaptic([20, 40, 20, 40, 45]);
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const chords = [
      [523.25, 659.25, 783.99],
      [587.33, 739.99, 880.00],
      [659.25, 830.61, 987.77],
      [783.99, 987.77, 1174.66],
    ];

    const t = this.ctx.currentTime;
    chords.forEach((chord, chordIdx) => {
      const chordTime = t + chordIdx * 0.16;
      chord.forEach(freq => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, chordTime);

        gain.gain.setValueAtTime(0.2, chordTime);
        gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.5);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(chordTime);
        osc.stop(chordTime + 0.52);
      });
    });
  }

  public playGameOver() {
    this.triggerHaptic([35, 50, 35]);
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [440, 392, 349.23, 293.66];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.14;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.16, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.36);
    });
  }

  public playSuccess() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [587.33, 880.00];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.32);
    });
  }

  public playUndo() {
    this.triggerHaptic(10);
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(310, t + 0.13);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playHint() {
    this.triggerHaptic(15);
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [880, 1108.73, 1318.51, 1661.22];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.16, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.3);
    });
  }

  public playClick() {
    this.triggerHaptic(6);
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, t);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // --- Multi-Track Procedural Background Music ---

  public startBackgroundMusic() {
    if (this.isMusicPlaying || typeof window === 'undefined') return;
    if (!this.isEffectiveMusicAudible()) return;

    this.initContext();
    if (!this.ctx || !this.musicGain) return;

    this.isMusicPlaying = true;
    this.updateMusicGainValue();

    const activeId = this.previewTrackId || this.selectedTrackId || DEFAULT_MUSIC_TRACK_ID;
    const profile = TRACK_PROFILES[activeId] || TRACK_PROFILES[DEFAULT_MUSIC_TRACK_ID];

    let chordIndex = 0;
    let arpeggioStep = 0;

    const playChordPad = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain || !this.isEffectiveMusicAudible()) {
        return;
      }

      const chord = profile.chords[chordIndex % profile.chords.length];
      chordIndex++;

      const t = this.ctx.currentTime;

      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = idx === 0 ? profile.padWave : 'sine';
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(profile.filterCutoff, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(profile.padGain, t + profile.padAttackSec);
        gain.gain.exponentialRampToValueAtTime(0.0008, t + profile.padReleaseSec);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(t);
        osc.stop(t + profile.padReleaseSec + 0.1);
      });

      const playArpNote = () => {
        if (!this.isMusicPlaying || !this.ctx || !this.musicGain || !this.isEffectiveMusicAudible()) {
          return;
        }
        const arpFreq = chord[(arpeggioStep % (chord.length - 1)) + 1] * profile.arpOctaveMult;
        arpeggioStep++;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = profile.arpWave;
        osc.frequency.setValueAtTime(arpFreq, now);

        gain.gain.setValueAtTime(profile.arpGain, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + profile.arpDecaySec);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + profile.arpDecaySec + 0.05);
      };

      profile.arpOffsetsMs.forEach(delayMs => {
        const timerId = window.setTimeout(playArpNote, delayMs);
        this.scheduledTimers.push(timerId);
      });

      const loopTimer = window.setTimeout(playChordPad, profile.chordIntervalMs);
      this.scheduledTimers.push(loopTimer);
    };

    playChordPad();
  }

  public stopBackgroundMusic() {
    this.isMusicPlaying = false;
    while (this.scheduledTimers.length > 0) {
      const id = this.scheduledTimers.pop();
      if (id !== undefined) {
        clearTimeout(id);
      }
    }
  }
}

export const audioManager = new AudioManager();
