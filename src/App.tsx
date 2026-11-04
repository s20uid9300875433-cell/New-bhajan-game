import React, { useState, useEffect } from 'react';
import { GameScreenState, UserProgress } from './types/game';
import { loadUserProgress, saveUserProgress } from './utils/storage';
import { audioManager } from './utils/audioManager';
import { AndroidFrame } from './components/AndroidFrame';
import { HomeScreen } from './components/HomeScreen';
import { LevelSelectScreen } from './components/LevelSelectScreen';
import { GameScreen } from './components/GameScreen';
import { SettingsModal } from './components/SettingsModal';
import { TutorialModal } from './components/TutorialModal';
import { KotlinCodeViewer } from './components/KotlinCodeViewer';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() => loadUserProgress());
  const [screen, setScreen] = useState<GameScreenState>('home');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'game' | 'code'>('game');

  // Modals accessible from Home Screen
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Sync Audio on initial mount
  useEffect(() => {
    audioManager.setSoundEnabled(progress.soundEnabled);
    audioManager.setMusicEnabled(progress.musicEnabled);
    audioManager.setSoundVolume(progress.soundVolume);
    audioManager.setMusicVolume(progress.musicVolume);

    // Sync unlocked level to current level id if not set
    setCurrentLevelId(progress.unlockedLevel);
  }, []);

  const handleUpdateProgress = (newProgress: UserProgress) => {
    setProgress(newProgress);
    saveUserProgress(newProgress);
  };

  const handleToggleSound = () => {
    const updated = { ...progress, soundEnabled: !progress.soundEnabled };
    handleUpdateProgress(updated);
    audioManager.setSoundEnabled(updated.soundEnabled);
  };

  const handleToggleMusic = () => {
    const updated = { ...progress, musicEnabled: !progress.musicEnabled };
    handleUpdateProgress(updated);
    audioManager.setMusicEnabled(updated.musicEnabled);
  };

  const handlePlayCurrentLevel = () => {
    setCurrentLevelId(progress.unlockedLevel);
    setScreen('playing');
  };

  const handleSelectLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    setScreen('playing');
  };

  const handleResetSession = () => {
    setScreen('home');
  };

  return (
    <AndroidFrame
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      onResetGame={handleResetSession}
    >
      {activeTab === 'code' ? (
        <KotlinCodeViewer />
      ) : (
        <>
          {screen === 'home' && (
            <HomeScreen
              progress={progress}
              onPlay={handlePlayCurrentLevel}
              onLevelSelect={() => setScreen('levels')}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenTutorial={() => setIsTutorialOpen(true)}
              onToggleSound={handleToggleSound}
              onToggleMusic={handleToggleMusic}
            />
          )}

          {screen === 'levels' && (
            <LevelSelectScreen
              progress={progress}
              onSelectLevel={handleSelectLevel}
              onBackToHome={() => setScreen('home')}
            />
          )}

          {screen === 'playing' && (
            <GameScreen
              levelId={currentLevelId}
              progress={progress}
              onUpdateProgress={handleUpdateProgress}
              onExitToLevelSelect={() => setScreen('levels')}
              onExitToHome={() => setScreen('home')}
              onSelectLevel={handleSelectLevel}
            />
          )}

          {/* Global Modals */}
          <SettingsModal
            isOpen={isSettingsOpen}
            soundEnabled={progress.soundEnabled}
            musicEnabled={progress.musicEnabled}
            hapticsEnabled={progress.hapticsEnabled}
            soundVolume={progress.soundVolume}
            musicVolume={progress.musicVolume}
            onClose={() => setIsSettingsOpen(false)}
            onToggleSound={handleToggleSound}
            onToggleMusic={handleToggleMusic}
            onToggleHaptics={() => {
              const updated = { ...progress, hapticsEnabled: !progress.hapticsEnabled };
              handleUpdateProgress(updated);
            }}
            onChangeSoundVolume={vol => {
              const updated = { ...progress, soundVolume: vol };
              handleUpdateProgress(updated);
              audioManager.setSoundVolume(vol);
            }}
            onChangeMusicVolume={vol => {
              const updated = { ...progress, musicVolume: vol };
              handleUpdateProgress(updated);
              audioManager.setMusicVolume(vol);
            }}
            onResetProgress={() => {
              localStorage.clear();
              window.location.reload();
            }}
          />

          <TutorialModal
            isOpen={isTutorialOpen}
            onClose={() => setIsTutorialOpen(false)}
          />
        </>
      )}
    </AndroidFrame>
  );
}
