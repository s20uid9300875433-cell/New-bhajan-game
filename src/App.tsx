import React, { useState, useEffect, useRef } from 'react';
import { GameScreenState, GraphicsQuality, ShopCategory, UserProgress } from './types/game';
import {
  claimDailyReward,
  claimUniqueBonusReward,
  exchangeGemsForCoins,
  loadUserProgress,
  purchaseShopItem,
  resetAllUserProgress,
  saveUserProgress,
  selectShopItem,
} from './utils/storage';
import { audioManager } from './utils/audioManager';
import { AdModalState, adManager } from './utils/adManager';
import { AndroidFrame } from './components/AndroidFrame';
import { HomeScreen } from './components/HomeScreen';
import { LevelSelectScreen } from './components/LevelSelectScreen';
import { GameScreen } from './components/GameScreen';
import { ShopScreen } from './components/ShopScreen';
import { SettingsModal } from './components/SettingsModal';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { TutorialModal } from './components/TutorialModal';
import { SimulatedAdModal } from './components/SimulatedAdModal';
import { KotlinCodeViewer } from './components/KotlinCodeViewer';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() => loadUserProgress());
  const progressRef = useRef<UserProgress>(progress);
  progressRef.current = progress;

  const [screen, setScreen] = useState<GameScreenState>('home');
  const [returnScreenFromShop, setReturnScreenFromShop] = useState<'home' | 'levels' | 'playing'>('home');
  const [shopCategory, setShopCategory] = useState<ShopCategory>('backgrounds');
  const [currentLevelId, setCurrentLevelId] = useState<number>(
    () => progress.savedActiveLevel?.levelId ?? progress.unlockedLevel
  );
  const [activeTab, setActiveTab] = useState<'game' | 'code'>('game');

  // Global Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isDailyRewardsOpen, setIsDailyRewardsOpen] = useState(false);
  const [adState, setAdState] = useState<AdModalState>({
    isOpen: false,
    type: 'rewarded',
    status: 'ready',
  });

  // Subscribe once to AdManager for all screens (Home, Shop, Daily Rewards, Gameplay)
  useEffect(() => {
    return adManager.subscribe(nextState => {
      setAdState(nextState);
    });
  }, []);

  // Sync Audio & Haptics on initial mount
  useEffect(() => {
    audioManager.setSoundEnabled(progress.soundEnabled);
    audioManager.setMusicEnabled(progress.musicEnabled);
    audioManager.setHapticsEnabled(progress.hapticsEnabled);
    audioManager.setSoundVolume(progress.soundVolume);
    audioManager.setMusicVolume(progress.musicVolume);
    audioManager.setSelectedTrack(progress.selectedMusicTrack);
  }, []);

  const handleUpdateProgress = (newProgress: UserProgress) => {
    progressRef.current = newProgress;
    setProgress(newProgress);
    saveUserProgress(newProgress);
  };

  const handleToggleSound = () => {
    const updated = { ...progressRef.current, soundEnabled: !progressRef.current.soundEnabled };
    handleUpdateProgress(updated);
    audioManager.setSoundEnabled(updated.soundEnabled);
  };

  const handleToggleMusic = () => {
    const updated = { ...progressRef.current, musicEnabled: !progressRef.current.musicEnabled };
    handleUpdateProgress(updated);
    audioManager.setMusicEnabled(updated.musicEnabled);
  };

  const handleToggleHaptics = () => {
    const updated = { ...progressRef.current, hapticsEnabled: !progressRef.current.hapticsEnabled };
    handleUpdateProgress(updated);
    audioManager.setHapticsEnabled(updated.hapticsEnabled);
  };

  const handleOpenShop = (initialCategory: ShopCategory = 'backgrounds') => {
    setShopCategory(initialCategory);
    if (screen !== 'shop') {
      setReturnScreenFromShop(screen);
    }
    setIsSettingsOpen(false);
    setScreen('shop');
  };

  const handleOpenDailyRewards = () => {
    setIsDailyRewardsOpen(true);
  };

  const handlePlayCurrentLevel = () => {
    const targetLevel = progressRef.current.savedActiveLevel?.levelId ?? progressRef.current.unlockedLevel;
    setCurrentLevelId(targetLevel);
    if (progressRef.current.musicEnabled) {
      audioManager.startBackgroundMusic();
    }
    setScreen('playing');
  };

  const handleSelectLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    if (progressRef.current.musicEnabled) {
      audioManager.startBackgroundMusic();
    }
    setScreen('playing');
  };

  const handlePurchaseShopItem = (
    category: ShopCategory,
    itemId: string,
    price: number,
    priceType: 'coins' | 'gems' | 'free'
  ) => {
    const res = purchaseShopItem(progressRef.current, category, itemId, price, priceType);
    if (res.success) {
      audioManager.playPurchase();
      handleUpdateProgress(res.updatedProgress);
      if (category === 'music') {
        audioManager.setSelectedTrack(itemId);
      }
    }
  };

  const handleSelectShopItem = (category: ShopCategory, itemId: string) => {
    const res = selectShopItem(progressRef.current, category, itemId);
    if (res.success) {
      handleUpdateProgress(res.updatedProgress);
      if (category === 'music') {
        audioManager.setSelectedTrack(itemId);
      }
    }
  };

  const handleWatchAdForCoins = () => {
    adManager.showRewardedAd({ type: 'coins', amount: 150 }, claimToken => {
      const res = claimUniqueBonusReward(progressRef.current, claimToken, 150, 0, 0);
      if (res.success) {
        audioManager.playPurchase();
        handleUpdateProgress(res.updatedProgress);
      }
    });
  };

  const handleExchangeGems = () => {
    const res = exchangeGemsForCoins(progressRef.current, 5, 350);
    if (res.success) {
      audioManager.playPurchase();
      handleUpdateProgress(res.updatedProgress);
    }
  };

  const handleClaimDaily = () => {
    const res = claimDailyReward(progressRef.current);
    if (res.success) {
      handleUpdateProgress(res.updatedProgress);
    }
    return {
      success: res.success,
      coinsAdded: res.coinsAdded,
      gemsAdded: res.gemsAdded,
      dayClaimed: res.dayClaimed,
    };
  };

  const handleChangeGraphicsQuality = (quality: GraphicsQuality) => {
    const updated = { ...progressRef.current, graphicsQuality: quality };
    handleUpdateProgress(updated);
  };

  const handleResetProgress = () => {
    const fresh = resetAllUserProgress();
    handleUpdateProgress(fresh);
    audioManager.setSoundEnabled(fresh.soundEnabled);
    audioManager.setMusicEnabled(fresh.musicEnabled);
    audioManager.setHapticsEnabled(fresh.hapticsEnabled);
    audioManager.setSoundVolume(fresh.soundVolume);
    audioManager.setMusicVolume(fresh.musicVolume);
    audioManager.setSelectedTrack(fresh.selectedMusicTrack);
    setCurrentLevelId(1);
    setIsSettingsOpen(false);
    setScreen('home');
  };

  return (
    <AndroidFrame
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      onResetGame={() => setScreen('home')}
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
              onOpenShop={handleOpenShop}
              onOpenDailyRewards={handleOpenDailyRewards}
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
              onOpenShop={() => handleOpenShop('backgrounds')}
            />
          )}

          {screen === 'shop' && (
            <ShopScreen
              progress={progress}
              initialCategory={shopCategory}
              onBack={() => setScreen(returnScreenFromShop)}
              onPurchaseItem={handlePurchaseShopItem}
              onSelectItem={handleSelectShopItem}
              onWatchAdForCoins={handleWatchAdForCoins}
              onExchangeGems={handleExchangeGems}
            />
          )}

          {screen === 'playing' && (
            <GameScreen
              levelId={currentLevelId}
              progress={progress}
              onUpdateProgress={handleUpdateProgress}
              onExitToLevelSelect={() => setScreen('levels')}
              onExitToHome={() => setScreen('home')}
              onOpenShop={handleOpenShop}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onSelectLevel={handleSelectLevel}
            />
          )}

          {/* Global Modals */}
          <SettingsModal
            isOpen={isSettingsOpen}
            progress={progress}
            onClose={() => setIsSettingsOpen(false)}
            onToggleSound={handleToggleSound}
            onToggleMusic={handleToggleMusic}
            onToggleHaptics={handleToggleHaptics}
            onChangeSoundVolume={vol => {
              const updated = { ...progressRef.current, soundVolume: vol };
              handleUpdateProgress(updated);
              audioManager.setSoundVolume(vol);
            }}
            onChangeMusicVolume={vol => {
              const updated = { ...progressRef.current, musicVolume: vol };
              handleUpdateProgress(updated);
              audioManager.setMusicVolume(vol);
            }}
            onChangeGraphicsQuality={handleChangeGraphicsQuality}
            onSelectBackground={bgId => handleSelectShopItem('backgrounds', bgId)}
            onSelectTileSkin={skinId => handleSelectShopItem('tiles', skinId)}
            onOpenShopCategory={cat => handleOpenShop(cat)}
            onResetProgress={handleResetProgress}
          />

          <DailyRewardsModal
            isOpen={isDailyRewardsOpen}
            progress={progress}
            onClose={() => setIsDailyRewardsOpen(false)}
            onClaimDaily={handleClaimDaily}
            onWatchBonusAd={handleWatchAdForCoins}
          />

          <TutorialModal
            isOpen={isTutorialOpen}
            onClose={() => setIsTutorialOpen(false)}
          />

          <SimulatedAdModal
            adState={adState}
            onComplete={() => adManager.completeReward()}
            onDismiss={() => adManager.dismissAd()}
          />
        </>
      )}
    </AndroidFrame>
  );
}
