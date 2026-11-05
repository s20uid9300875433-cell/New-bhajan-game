import React, { useState, useEffect } from 'react';
import { GameScreenState, ShopCategory, UserProgress } from './types/game';
import {
  loadUserProgress,
  saveUserProgress,
  purchaseShopItem,
  selectShopItem,
  exchangeGemsForCoins,
  claimDailyReward,
  claimUniqueBonusReward,
} from './utils/storage';
import { audioManager } from './utils/audioManager';
import { adManager, AdModalState, AdReward } from './utils/adManager';
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
  const [screen, setScreen] = useState<GameScreenState>('home');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'game' | 'code'>('game');

  // Modals & Shop Navigation
  const [shopCategory, setShopCategory] = useState<ShopCategory>('backgrounds');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isDailyRewardsOpen, setIsDailyRewardsOpen] = useState(false);

  // Global Simulated Ad State (for Shop and Daily Rewards on non-playing screens)
  const [adState, setAdState] = useState<AdModalState>({
    isOpen: false,
    type: 'rewarded',
    status: 'ready',
  });

  // Sync Audio on initial mount
  useEffect(() => {
    audioManager.setSoundEnabled(progress.soundEnabled);
    audioManager.setMusicEnabled(progress.musicEnabled);
    audioManager.setSoundVolume(progress.soundVolume);
    audioManager.setMusicVolume(progress.musicVolume);

    // Sync unlocked level to current level id if not set
    setCurrentLevelId(progress.unlockedLevel);
  }, []);

  // Subscribe to adManager for ads outside of gameplay (Shop, Daily Rewards)
  useEffect(() => {
    return adManager.subscribe((state: AdModalState) => {
      if (screen !== 'playing') {
        setAdState(state);
      }
    });
  }, [screen]);

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
              onOpenShop={(category?: ShopCategory) => {
                if (category) setShopCategory(category);
                setScreen('shop');
              }}
              onOpenDailyRewards={() => setIsDailyRewardsOpen(true)}
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

          {screen === 'shop' && (
            <ShopScreen
              progress={progress}
              initialCategory={shopCategory}
              onBack={() => setScreen('home')}
              onPurchaseItem={(category, itemId, price, priceType) => {
                const res = purchaseShopItem(progress, category, itemId, price, priceType);
                if (res.success) handleUpdateProgress(res.updatedProgress);
              }}
              onSelectItem={(category, itemId) => {
                const res = selectShopItem(progress, category, itemId);
                if (res.success) handleUpdateProgress(res.updatedProgress);
              }}
              onWatchAdForCoins={() => {
                adManager.showRewardedAd({ type: 'coins', amount: 100 }, token => {
                  const res = claimUniqueBonusReward(progress, token, 100);
                  if (res.success) handleUpdateProgress(res.updatedProgress);
                });
              }}
              onExchangeGems={() => {
                const res = exchangeGemsForCoins(progress);
                if (res.success) handleUpdateProgress(res.updatedProgress);
              }}
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
            progress={progress}
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
            onChangeGraphicsQuality={quality => {
              const updated = { ...progress, graphicsQuality: quality };
              handleUpdateProgress(updated);
            }}
            onSelectBackground={bgId => {
              const res = selectShopItem(progress, 'backgrounds', bgId);
              if (res.success) handleUpdateProgress(res.updatedProgress);
            }}
            onSelectTileSkin={skinId => {
              const res = selectShopItem(progress, 'tiles', skinId);
              if (res.success) handleUpdateProgress(res.updatedProgress);
            }}
            onOpenShopCategory={category => {
              setShopCategory(category);
              setScreen('shop');
            }}
            onResetProgress={() => {
              localStorage.clear();
              window.location.reload();
            }}
          />

          <DailyRewardsModal
            isOpen={isDailyRewardsOpen}
            progress={progress}
            onClose={() => setIsDailyRewardsOpen(false)}
            onClaimDaily={() => {
              const res = claimDailyReward(progress);
              if (res.success) {
                handleUpdateProgress(res.updatedProgress);
              }
              return {
                success: res.success,
                coinsAdded: res.coinsAdded,
                gemsAdded: res.gemsAdded,
                dayClaimed: res.dayClaimed,
              };
            }}
            onWatchBonusAd={() => {
              adManager.showRewardedAd({ type: 'coins', amount: 150 }, token => {
                const res = claimUniqueBonusReward(progress, token, 150, 1);
                if (res.success) {
                  handleUpdateProgress(res.updatedProgress);
                }
              });
            }}
          />

          <TutorialModal
            isOpen={isTutorialOpen}
            onClose={() => setIsTutorialOpen(false)}
          />

          {screen !== 'playing' && (
            <SimulatedAdModal
              adState={adState}
              onComplete={() => adManager.completeReward()}
              onDismiss={() => adManager.dismissAd()}
            />
          )}
        </>
      )}
    </AndroidFrame>
  );
}
