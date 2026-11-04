import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Coins,
  Gem,
  Check,
  ShoppingBag,
  Image as ImageIcon,
  Hexagon,
  Music,
  Play,
  Square,
  Film,
  ArrowRightLeft,
} from 'lucide-react';
import {
  BackgroundItem,
  MusicTrackItem,
  ShopCategory,
  TileSkinItem,
  TileTier,
  UserProgress,
} from '../types/game';
import {
  BACKGROUND_SHOP_ITEMS,
  MUSIC_SHOP_ITEMS,
  TILE_SKIN_SHOP_ITEMS,
  getBackgroundById,
} from '../data/shopCatalog';
import { StackedHexPreview } from './HexagonGrid';
import { PendingPurchaseItem, PurchaseConfirmModal } from './PurchaseConfirmModal';
import { audioManager } from '../utils/audioManager';

interface ShopScreenProps {
  progress: UserProgress;
  initialCategory?: ShopCategory;
  onBack: () => void;
  onPurchaseItem: (
    category: ShopCategory,
    itemId: string,
    price: number,
    priceType: 'coins' | 'gems' | 'free'
  ) => void;
  onSelectItem: (category: ShopCategory, itemId: string) => void;
  onWatchAdForCoins: () => void;
  onExchangeGems: () => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({
  progress,
  initialCategory = 'backgrounds',
  onBack,
  onPurchaseItem,
  onSelectItem,
  onWatchAdForCoins,
  onExchangeGems,
}) => {
  const [category, setCategory] = useState<ShopCategory>(initialCategory);
  const [pendingPurchase, setPendingPurchase] = useState<PendingPurchaseItem | null>(null);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  // Stop music preview cleanly on unmount or when leaving Music tab
  useEffect(() => {
    return () => {
      audioManager.stopPreviewTrack();
    };
  }, []);

  const handleSwitchCategory = (nextCat: ShopCategory) => {
    audioManager.playClick();
    if (previewingTrackId && nextCat !== 'music') {
      audioManager.stopPreviewTrack();
      setPreviewingTrackId(null);
    }
    setCategory(nextCat);
  };

  const handleToggleTrackPreview = (track: MusicTrackItem) => {
    if (previewingTrackId === track.id) {
      audioManager.stopPreviewTrack();
      setPreviewingTrackId(null);
    } else {
      audioManager.startPreviewTrack(track.id);
      setPreviewingTrackId(track.id);
    }
  };

  const showToast = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner(prev => (prev === msg ? null : prev));
    }, 2400);
  };

  const activeBg = getBackgroundById(progress.selectedBackground);

  const openBackgroundPurchase = (bg: BackgroundItem) => {
    setPendingPurchase({
      category: 'backgrounds',
      id: bg.id,
      name: bg.name,
      price: bg.price,
      priceType: bg.priceType,
      description: bg.description,
      previewNode: (
        <div
          className="w-28 h-36 rounded-2xl overflow-hidden border border-white/25 relative shadow-lg flex items-center justify-center"
          style={{ backgroundImage: bg.fallbackGradient }}
        >
          {!brokenImages[bg.id] && (
            <img
              src={bg.imageUrl}
              alt={bg.name}
              referrerPolicy="no-referrer"
              onError={() => setBrokenImages(prev => ({ ...prev, [bg.id]: true }))}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/15">
            <StackedHexPreview
              tier={6}
              skinId={progress.selectedTileSkin}
              sizePx={42}
              uid={`modal-bg-${bg.id}`}
            />
          </div>
        </div>
      ),
    });
  };

  const openTileSkinPurchase = (skin: TileSkinItem) => {
    setPendingPurchase({
      category: 'tiles',
      id: skin.id,
      name: skin.name,
      price: skin.price,
      priceType: skin.priceType,
      description: skin.description,
      previewNode: (
        <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl bg-slate-950/90 border border-slate-800">
          {([1, 3, 4, 6] as TileTier[]).map(t => (
            <StackedHexPreview
              key={t}
              tier={t}
              skinId={skin.id}
              sizePx={36}
              uid={`modal-skin-${skin.id}`}
            />
          ))}
        </div>
      ),
    });
  };

  const openMusicPurchase = (track: MusicTrackItem) => {
    setPendingPurchase({
      category: 'music',
      id: track.id,
      name: track.name,
      price: track.price,
      priceType: track.priceType,
      description: `${track.description} (${track.mood} · ${track.tempo})`,
    });
  };

  return (
    <div
      className="relative w-full h-full flex flex-col p-3.5 select-none overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: `url('${activeBg.imageUrl}'), ${activeBg.fallbackGradient}`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Readable Contrast Overlay */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm pointer-events-none" />

      {/* Top Header with Visible Coin & Gem Balances */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              audioManager.playClick();
              audioManager.stopPreviewTrack();
              onBack();
            }}
            aria-label="Back"
            className="min-h-[42px] min-w-[42px] rounded-2xl bg-slate-900/90 border border-white/15 text-slate-200 hover:text-white active:scale-95 transition-all flex items-center justify-center shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-black text-white leading-tight flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              Quest Shop
            </h2>
            <p className="text-[11px] text-slate-400">Cosmetics · Music · Rewards</p>
          </div>
        </div>

        {/* Coin & Gem Balances */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-black shadow">
            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="tabular-nums">{progress.coins.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-black shadow">
            <Gem className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="tabular-nums">{progress.gems.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Free Bonus Coins & Gem Exchange Utility Bar */}
      <div className="relative z-10 grid grid-cols-2 gap-2 mb-2.5">
        <button
          onClick={() => {
            audioManager.playClick();
            onWatchAdForCoins();
          }}
          className="min-h-[40px] py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:brightness-110 border border-cyan-400/30 text-white text-[11px] font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow whitespace-nowrap"
        >
          <Film className="w-3.5 h-3.5 shrink-0" />
          <span>Free +150 Coins (Ad)</span>
        </button>

        <button
          onClick={() => {
            if (progress.gems >= 5) {
              audioManager.playPurchase();
              onExchangeGems();
              showToast('Exchanged 5 Gems for +350 Coins!');
            } else {
              audioManager.playInvalidMove();
              showToast('Need 5 Gems to exchange (earn 3★ on levels!)');
            }
          }}
          className={`min-h-[40px] py-1.5 px-2.5 rounded-xl border text-[11px] font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow whitespace-nowrap ${
            progress.gems >= 5
              ? 'bg-slate-900/90 hover:bg-slate-800 border-cyan-500/40 text-cyan-200'
              : 'bg-slate-900/50 border-slate-800 text-slate-500'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
          <span>5 Gems → 350 Coins</span>
        </button>
      </div>

      {statusBanner && (
        <div className="relative z-10 mb-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold text-center">
          {statusBanner}
        </div>
      )}

      {/* Segmented Category Tabs */}
      <div className="relative z-10 grid grid-cols-3 gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl mb-3">
        <button
          onClick={() => handleSwitchCategory('backgrounds')}
          className={`min-h-[40px] py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            category === 'backgrounds'
              ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 shrink-0" />
          <span>Scenes (10)</span>
        </button>

        <button
          onClick={() => handleSwitchCategory('tiles')}
          className={`min-h-[40px] py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            category === 'tiles'
              ? 'bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-black shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Hexagon className="w-3.5 h-3.5 shrink-0" />
          <span>Tiles (10)</span>
        </button>

        <button
          onClick={() => handleSwitchCategory('music')}
          className={`min-h-[40px] py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            category === 'music'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music className="w-3.5 h-3.5 shrink-0" />
          <span>Music (5)</span>
        </button>
      </div>

      {/* Scrolling Shop Content */}
      <div className="relative z-10 flex-1 overflow-y-auto pr-0.5 pb-4">
        {/* B. BACKGROUND SHOP — 10 BACKGROUNDS */}
        {category === 'backgrounds' && (
          <div className="grid grid-cols-2 gap-2.5">
            {BACKGROUND_SHOP_ITEMS.map(bg => {
              const isOwned = progress.ownedBackgrounds.includes(bg.id);
              const isSelected = progress.selectedBackground === bg.id;

              return (
                <div
                  key={bg.id}
                  className={`rounded-2xl overflow-hidden border transition-all flex flex-col bg-slate-900/90 ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* High-Quality 9:16 Preview Window */}
                  <div
                    className="relative w-full h-32 overflow-hidden flex items-center justify-center"
                    style={{ backgroundImage: bg.fallbackGradient }}
                  >
                    {!brokenImages[bg.id] && (
                      <img
                        src={bg.imageUrl}
                        alt={bg.name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenImages(prev => ({ ...prev, [bg.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/20" />

                    {/* Live Board Tile Contrast Preview */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <StackedHexPreview
                        tier={4}
                        skinId={progress.selectedTileSkin}
                        sizePx={36}
                        uid={`bgcard-${bg.id}`}
                      />
                    </div>

                    {/* Owned / Price Status Top Right */}
                    <div className="absolute top-2 right-2">
                      {isOwned ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/80 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> OWNED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/85 text-amber-300 text-[10px] font-black tabular-nums flex items-center gap-1">
                          <Coins className="w-3 h-3 text-amber-400" />
                          {bg.price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2 left-2.5 right-2.5">
                      <h3 className="text-xs font-black text-white leading-tight truncate">
                        {bg.name}
                      </h3>
                    </div>
                  </div>

                  {/* Card Footer Controls */}
                  <div className="p-2.5 flex flex-col justify-between flex-1 gap-2">
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-snug">
                      {bg.description}
                    </p>

                    {isOwned ? (
                      <button
                        onClick={() => {
                          audioManager.playSelect();
                          onSelectItem('backgrounds', bg.id);
                        }}
                        disabled={isSelected}
                        className={`min-h-[38px] w-full py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          isSelected
                            ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 text-white active:scale-95'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>SELECTED</span>
                          </>
                        ) : (
                          <span>SELECT</span>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          audioManager.playClick();
                          openBackgroundPurchase(bg);
                        }}
                        className="min-h-[38px] w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 text-xs font-black active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow whitespace-nowrap"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>BUY · {bg.price.toLocaleString()}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* C. HEXAGON TILE SHOP — 10 TILE DESIGNS */}
        {category === 'tiles' && (
          <div className="flex flex-col gap-2.5">
            {TILE_SKIN_SHOP_ITEMS.map(skin => {
              const isOwned = progress.ownedTileSkins.includes(skin.id);
              const isSelected = progress.selectedTileSkin === skin.id;

              return (
                <div
                  key={skin.id}
                  className={`rounded-2xl p-3 border bg-slate-900/90 transition-all flex flex-col gap-2.5 ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/15'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white">{skin.name}</h3>
                        {isOwned && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                            · OWNED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {skin.description}
                      </p>
                    </div>

                    {!isOwned && (
                      <span className="text-xs font-black text-amber-300 tabular-nums flex items-center gap-1 shrink-0">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        {skin.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* All 6 Stacked Hexagon Tiers Live Preview */}
                  <div className="w-full py-2 px-2 rounded-xl bg-slate-950/85 border border-slate-800/80 flex items-center justify-around">
                    {([1, 2, 3, 4, 5, 6] as TileTier[]).map(tier => (
                      <StackedHexPreview
                        key={tier}
                        tier={tier}
                        skinId={skin.id}
                        sizePx={40}
                        uid={`shop-tile-${skin.id}`}
                      />
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-end">
                    {isOwned ? (
                      <button
                        onClick={() => {
                          audioManager.playSelect();
                          onSelectItem('tiles', skin.id);
                        }}
                        disabled={isSelected}
                        className={`min-h-[40px] w-full py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          isSelected
                            ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 text-white active:scale-95'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>SELECTED</span>
                          </>
                        ) : (
                          <span>SELECT SKIN</span>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          audioManager.playClick();
                          openTileSkinPurchase(skin);
                        }}
                        className="min-h-[40px] w-full py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 text-xs font-black active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow whitespace-nowrap"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>BUY · {skin.price.toLocaleString()} COINS</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* D. MUSIC SHOP — 5 ORIGINAL TRACKS */}
        {category === 'music' && (
          <div className="flex flex-col gap-2.5">
            {MUSIC_SHOP_ITEMS.map(track => {
              const isOwned = progress.ownedMusicTracks.includes(track.id);
              const isSelected = progress.selectedMusicTrack === track.id;
              const isPreviewing = previewingTrackId === track.id;

              return (
                <div
                  key={track.id}
                  className={`rounded-2xl p-3.5 border bg-slate-900/90 transition-all flex flex-col gap-3 ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/15'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => handleToggleTrackPreview(track)}
                        aria-label={isPreviewing ? `Stop ${track.name} preview` : `Preview ${track.name}`}
                        className={`min-h-[44px] min-w-[44px] rounded-2xl border flex items-center justify-center transition-all shrink-0 ${
                          isPreviewing
                            ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300'
                        }`}
                      >
                        {isPreviewing ? (
                          <Square className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-black text-white">{track.name}</h3>
                          {isOwned && (
                            <span className="text-[10px] font-bold text-emerald-400">
                              · OWNED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {track.description}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 font-medium">
                          <span className="text-cyan-300">{track.mood}</span>
                          <span>·</span>
                          <span className="font-mono">{track.tempo}</span>
                          {isPreviewing && (
                            <>
                              <span>·</span>
                              <span className="text-amber-300 font-bold">Playing Preview</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isOwned && (
                      <span className="text-xs font-black text-amber-300 tabular-nums flex items-center gap-1 shrink-0">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        {track.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Preview + Buy/Select Controls */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleToggleTrackPreview(track)}
                      className="min-h-[40px] py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      {isPreviewing ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current text-amber-400" />
                          <span>Stop Preview</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
                          <span>Preview Track</span>
                        </>
                      )}
                    </button>

                    {isOwned ? (
                      <button
                        onClick={() => {
                          audioManager.stopPreviewTrack();
                          setPreviewingTrackId(null);
                          audioManager.playSelect();
                          onSelectItem('music', track.id);
                        }}
                        disabled={isSelected}
                        className={`min-h-[40px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          isSelected
                            ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 cursor-default'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>SELECTED</span>
                          </>
                        ) : (
                          <span>SELECT</span>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          audioManager.playClick();
                          openMusicPurchase(track);
                        }}
                        className="min-h-[40px] py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 text-xs font-black active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow whitespace-nowrap"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>BUY · {track.price.toLocaleString()}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Purchase Confirmation Dialog */}
      <PurchaseConfirmModal
        item={pendingPurchase}
        currentCoins={progress.coins}
        onCancel={() => setPendingPurchase(null)}
        onConfirm={() => {
          if (!pendingPurchase) return;
          if (previewingTrackId) {
            audioManager.stopPreviewTrack();
            setPreviewingTrackId(null);
          }
          onPurchaseItem(
            pendingPurchase.category,
            pendingPurchase.id,
            pendingPurchase.price,
            pendingPurchase.priceType
          );
          showToast(`Unlocked & equipped ${pendingPurchase.name}!`);
          setPendingPurchase(null);
        }}
        onWatchAdForCoins={onWatchAdForCoins}
      />
    </div>
  );
};
