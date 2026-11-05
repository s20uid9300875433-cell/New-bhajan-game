package com.hexacolor.quest

import android.content.Context
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.hexacolor.quest.ads.SafeAdManager
import com.hexacolor.quest.data.LevelRepository
import com.hexacolor.quest.logic.GameEngine
import com.hexacolor.quest.logic.MoveResult
import com.hexacolor.quest.model.*
import java.util.UUID

enum class AppScreen {
    HOME,
    LEVEL_SELECT,
    PLAYING,
    SHOP
}

class MainActivity : ComponentActivity() {
    private val adManager = SafeAdManager()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        adManager.loadRewardedAd(this)

        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFFF43F5E),
                    secondary = Color(0xFF38BDF8),
                    background = Color(0xFF020617),
                    surface = Color(0xFF0F172A)
                )
            ) {
                HexaColorQuestApp(
                    activity = this,
                    adManager = adManager
                )
            }
        }
    }
}

@Composable
fun HexaColorQuestApp(
    activity: MainActivity,
    adManager: SafeAdManager
) {
    val context = LocalContext.current

    // Persistent Game State (Stored in Compose memory with SharedPreferences support)
    val prefs = remember { context.getSharedPreferences("hexa_quest_prefs", Context.MODE_PRIVATE) }
    var unlockedLevel by remember { mutableIntStateOf(prefs.getInt("unlocked_level", 1)) }
    var coins by remember { mutableIntStateOf(prefs.getInt("coins", 250)) }
    var gems by remember { mutableIntStateOf(prefs.getInt("gems", 5)) }
    var hintsRemaining by remember { mutableIntStateOf(prefs.getInt("hints", 3)) }
    var vibrationEnabled by remember { mutableStateOf(prefs.getBoolean("vibration", true)) }

    // Screen navigation
    var currentScreen by remember { mutableStateOf(AppScreen.HOME) }
    var activeLevelId by remember { mutableIntStateOf(unlockedLevel) }

    // Game Engine State
    var engine by remember(activeLevelId) {
        mutableStateOf(GameEngine(LevelRepository.getLevel(activeLevelId)))
    }

    var selectedBoardCoord by remember { mutableStateOf<HexCoord?>(null) }
    var selectedTrayBlockId by remember { mutableStateOf<String?>(null) }
    var validTargets by remember { mutableStateOf<List<HexCoord>>(emptyList()) }
    var hintTargetCoord by remember { mutableStateOf<HexCoord?>(null) }

    // Modals
    var isPaused by remember { mutableStateOf(false) }
    var isVictory by remember { mutableStateOf(false) }
    var isGameOver by remember { mutableStateOf(false) }
    var isSettingsOpen by remember { mutableStateOf(false) }
    var victoryStars by remember { mutableIntStateOf(0) }
    var victoryScore by remember { mutableIntStateOf(0) }
    var victoryCoinsAwarded by remember { mutableIntStateOf(0) }

    fun vibrate(durationMs: Long = 15L) {
        if (!vibrationEnabled) return
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                val v = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    v?.vibrate(durationMs)
                }
            }
        } catch (_: Exception) {}
    }

    fun saveProgress(newUnlocked: Int = unlockedLevel, newCoins: Int = coins, newGems: Int = gems, newHints: Int = hintsRemaining) {
        unlockedLevel = newUnlocked
        coins = newCoins
        gems = newGems
        hintsRemaining = newHints
        prefs.edit()
            .putInt("unlocked_level", newUnlocked)
            .putInt("coins", newCoins)
            .putInt("gems", newGems)
            .putInt("hints", newHints)
            .apply()
    }

    fun startLevel(id: Int) {
        activeLevelId = id
        engine = GameEngine(LevelRepository.getLevel(id))
        selectedBoardCoord = null
        selectedTrayBlockId = null
        validTargets = emptyList()
        hintTargetCoord = null
        isPaused = false
        isVictory = false
        isGameOver = false
        currentScreen = AppScreen.PLAYING
    }

    fun onWinLevel() {
        val stars = engine.calculateStars()
        val score = engine.score
        val coinsEarned = 35 + stars * 15 + engine.movesLeft * 5
        victoryStars = stars
        victoryScore = score
        victoryCoinsAwarded = coinsEarned

        val nextUnlocked = maxOf(unlockedLevel, activeLevelId + 1)
        saveProgress(newUnlocked = nextUnlocked, newCoins = coins + coinsEarned)
        isVictory = true
    }

    // Main Scaffold
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF020617)
    ) {
        when (currentScreen) {
            AppScreen.HOME -> {
                HomeScreen(
                    unlockedLevel = unlockedLevel,
                    coins = coins,
                    gems = gems,
                    onPlay = { startLevel(unlockedLevel) },
                    onSelectLevels = { currentScreen = AppScreen.LEVEL_SELECT },
                    onOpenShop = { currentScreen = AppScreen.SHOP },
                    onOpenSettings = { isSettingsOpen = true }
                )
            }
            AppScreen.LEVEL_SELECT -> {
                LevelSelectScreen(
                    unlockedLevel = unlockedLevel,
                    coins = coins,
                    onSelectLevel = { startLevel(it) },
                    onBack = { currentScreen = AppScreen.HOME }
                )
            }
            AppScreen.SHOP -> {
                ShopScreen(
                    coins = coins,
                    gems = gems,
                    onBack = { currentScreen = AppScreen.HOME },
                    onWatchAdForCoins = {
                        adManager.showRewardedHint(activity) {
                            saveProgress(newCoins = coins + 150)
                            vibrate(30L)
                        }
                    }
                )
            }
            AppScreen.PLAYING -> {
                PlayingGameScreen(
                    levelConfig = engine.levelConfig,
                    tiles = engine.getTiles(),
                    trayBlocks = engine.trayBlocks,
                    movesLeft = engine.movesLeft,
                    score = engine.score,
                    highestTier = engine.highestTier,
                    mergesCount = engine.mergesCount,
                    selectedBoardCoord = selectedBoardCoord,
                    selectedTrayBlockId = selectedTrayBlockId,
                    validTargets = validTargets,
                    hintCoord = hintTargetCoord,
                    coins = coins,
                    hintsRemaining = hintsRemaining,
                    onTileSelect = { coord ->
                        vibrate(10L)
                        selectedTrayBlockId = null
                        if (selectedBoardCoord == coord) {
                            selectedBoardCoord = null
                            validTargets = emptyList()
                        } else {
                            selectedBoardCoord = coord
                            validTargets = engine.getValidTargets(coord)
                        }
                    },
                    onCellClick = { dest ->
                        if (selectedTrayBlockId != null) {
                            val res = engine.placeTrayBlock(selectedTrayBlockId!!, dest)
                            if (res !is MoveResult.InvalidMove) {
                                vibrate(25L)
                                selectedTrayBlockId = null
                                validTargets = emptyList()
                                if (engine.isObjectiveMet()) {
                                    onWinLevel()
                                } else if (engine.isGameOver()) {
                                    isGameOver = true
                                }
                            } else {
                                vibrate(40L)
                            }
                        } else if (selectedBoardCoord != null) {
                            val res = engine.moveTile(selectedBoardCoord!!, dest)
                            if (res !is MoveResult.InvalidMove) {
                                vibrate(25L)
                                selectedBoardCoord = null
                                validTargets = emptyList()
                                if (engine.isObjectiveMet()) {
                                    onWinLevel()
                                } else if (engine.isGameOver()) {
                                    isGameOver = true
                                }
                            } else {
                                vibrate(40L)
                            }
                        }
                    },
                    onSelectTrayBlock = { blockId ->
                        vibrate(10L)
                        selectedBoardCoord = null
                        if (selectedTrayBlockId == blockId) {
                            selectedTrayBlockId = null
                            validTargets = emptyList()
                        } else {
                            selectedTrayBlockId = blockId
                            validTargets = engine.getEmptyBoardCoords()
                        }
                    },
                    onUndo = {
                        if (engine.undo()) {
                            vibrate(15L)
                            selectedBoardCoord = null
                            selectedTrayBlockId = null
                            validTargets = emptyList()
                            isGameOver = false
                        }
                    },
                    onHint = {
                        vibrate(20L)
                        val empty = engine.getEmptyBoardCoords()
                        if (empty.isNotEmpty()) {
                            hintTargetCoord = empty.first()
                        }
                    },
                    onRestart = {
                        vibrate(15L)
                        engine.reset()
                        selectedBoardCoord = null
                        selectedTrayBlockId = null
                        validTargets = emptyList()
                        hintTargetCoord = null
                        isGameOver = false
                        isVictory = false
                    },
                    onPause = { isPaused = true },
                    onHome = { currentScreen = AppScreen.HOME }
                )
            }
        }

        // Dialogs
        if (isPaused) {
            PauseDialog(
                levelId = activeLevelId,
                onResume = { isPaused = false },
                onRestart = {
                    isPaused = false
                    engine.reset()
                },
                onLevelSelect = {
                    isPaused = false
                    currentScreen = AppScreen.LEVEL_SELECT
                },
                onHome = {
                    isPaused = false
                    currentScreen = AppScreen.HOME
                }
            )
        }

        if (isVictory) {
            VictoryDialog(
                levelId = activeLevelId,
                stars = victoryStars,
                score = victoryScore,
                coinsAwarded = victoryCoinsAwarded,
                onNextLevel = {
                    isVictory = false
                    val next = activeLevelId + 1
                    adManager.notifyLevelCompleted(activity, activeLevelId) {
                        startLevel(next)
                    }
                },
                onReplay = {
                    isVictory = false
                    startLevel(activeLevelId)
                },
                onLevelSelect = {
                    isVictory = false
                    currentScreen = AppScreen.LEVEL_SELECT
                }
            )
        }

        if (isGameOver) {
            GameOverDialog(
                levelId = activeLevelId,
                onRetry = {
                    isGameOver = false
                    engine.reset()
                },
                onUndo = {
                    if (engine.undo()) {
                        isGameOver = false
                    }
                },
                onWatchAdExtraMoves = {
                    adManager.showRewardedHint(activity) {
                        engine.reset() // Extra moves or reset
                        isGameOver = false
                    }
                },
                onLevelSelect = {
                    isGameOver = false
                    currentScreen = AppScreen.LEVEL_SELECT
                }
            )
        }

        if (isSettingsOpen) {
            SettingsDialog(
                vibration = vibrationEnabled,
                onToggleVibration = {
                    vibrationEnabled = !vibrationEnabled
                    prefs.edit().putBoolean("vibration", vibrationEnabled).apply()
                },
                onResetProgress = {
                    saveProgress(newUnlocked = 1, newCoins = 250, newGems = 5, newHints = 3)
                    startLevel(1)
                    currentScreen = AppScreen.HOME
                    isSettingsOpen = false
                },
                onClose = { isSettingsOpen = false }
            )
        }
    }
}

// -------------------------------------------------------------
// UI Screens
// -------------------------------------------------------------

@Composable
fun HomeScreen(
    unlockedLevel: Int,
    coins: Int,
    gems: Int,
    onPlay: () -> Unit,
    onSelectLevels: () -> Unit,
    onOpenShop: () -> Unit,
    onOpenSettings: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Top currency bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = Color(0xFF0F172A),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x33F59E0B))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text("🪙", fontSize = 14.sp)
                        Text("$coins", color = Color(0xFFFBBF24), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = Color(0xFF0F172A),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x3338BDF8))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text("💎", fontSize = 14.sp)
                        Text("$gems", color = Color(0xFF38BDF8), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }

            IconButton(
                onClick = { onOpenSettings() },
                modifier = Modifier
                    .size(40.dp)
                    .background(Color(0xFF0F172A), CircleShape)
            ) {
                Icon(Icons.Default.Settings, contentDescription = "Settings", tint = Color.LightGray)
            }
        }

        // Center Mascot / Logo
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(110.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            listOf(Color(0xFFF43F5E), Color(0xFF881337))
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text("⬡", fontSize = 60.sp, color = Color.White)
            }

            Text(
                "Hexa Color Quest",
                fontSize = 32.sp,
                fontWeight = FontWeight.Black,
                color = Color.White,
                textAlign = TextAlign.Center
            )

            Text(
                "Slide · Merge · Infinite Puzzle Quest",
                fontSize = 14.sp,
                color = Color(0xFF94A3B8),
                textAlign = TextAlign.Center
            )

            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Color(0xFF0F172A),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x33FFFFFF)),
                modifier = Modifier.padding(top = 8.dp)
            ) {
                Text(
                    "Level $unlockedLevel / 100+",
                    color = Color(0xFF38BDF8),
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }
        }

        // Bottom Actions
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Button(
                onClick = { onPlay() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(18.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF43F5E))
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Play Level $unlockedLevel", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = { onSelectLevels() },
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    shape = RoundedCornerShape(14.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                ) {
                    Icon(Icons.Default.List, contentDescription = null, tint = Color(0xFF38BDF8))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Levels Map", color = Color.White, fontSize = 13.sp)
                }

                OutlinedButton(
                    onClick = { onOpenShop() },
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    shape = RoundedCornerShape(14.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x44F59E0B))
                ) {
                    Icon(Icons.Default.ShoppingCart, contentDescription = null, tint = Color(0xFFFBBF24))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Quest Shop", color = Color(0xFFFBBF24), fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
fun LevelSelectScreen(
    unlockedLevel: Int,
    coins: Int,
    onSelectLevel: (Int) -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(
                onClick = { onBack() },
                modifier = Modifier
                    .size(40.dp)
                    .background(Color(0xFF0F172A), RoundedCornerShape(12.dp))
            ) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
            }

            Text("Select Level", fontWeight = FontWeight.Black, fontSize = 20.sp, color = Color.White)

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("🪙 $coins", color = Color(0xFFFBBF24), fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
        }

        LazyVerticalGrid(
            columns = GridCells.Fixed(4),
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(100) { index ->
                val levelId = index + 1
                val isUnlocked = levelId <= unlockedLevel
                val isCurrent = levelId == unlockedLevel

                Surface(
                    modifier = Modifier
                        .aspectRatio(1f)
                        .clip(RoundedCornerShape(16.dp))
                        .clickable(enabled = isUnlocked) { onSelectLevel(levelId) },
                    shape = RoundedCornerShape(16.dp),
                    color = when {
                        isCurrent -> Color(0xFFF43F5E)
                        isUnlocked -> Color(0xFF0F172A)
                        else -> Color(0xFF090D1A)
                    },
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isCurrent) Color(0xFFFDA4AF) else Color(0x22FFFFFF)
                    )
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        if (isUnlocked) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("$levelId", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
                                Text("★★★", fontSize = 8.sp, color = Color(0xFFFBBF24))
                            }
                        } else {
                            Icon(Icons.Default.Lock, contentDescription = "Locked", tint = Color(0xFF475569))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PlayingGameScreen(
    levelConfig: LevelConfig,
    tiles: List<BoardTile>,
    trayBlocks: List<TrayBlock>,
    movesLeft: Int,
    score: Int,
    highestTier: TileTier,
    mergesCount: Int,
    selectedBoardCoord: HexCoord?,
    selectedTrayBlockId: String?,
    validTargets: List<HexCoord>,
    hintCoord: HexCoord?,
    coins: Int,
    hintsRemaining: Int,
    onTileSelect: (HexCoord) -> Unit,
    onCellClick: (HexCoord) -> Unit,
    onSelectTrayBlock: (String) -> Unit,
    onUndo: () -> Unit,
    onHint: () -> Unit,
    onRestart: () -> Unit,
    onPause: () -> Unit,
    onHome: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // TOP HUD
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = { onHome() },
                    modifier = Modifier.background(Color(0xFF0F172A), RoundedCornerShape(12.dp))
                ) {
                    Icon(Icons.Default.Home, contentDescription = "Home", tint = Color.White)
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFF0F172A),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x33FFFFFF))
                ) {
                    Text(
                        "Level ${levelConfig.id} · ${levelConfig.difficulty}",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }

                IconButton(
                    onClick = { onPause() },
                    modifier = Modifier.background(Color(0xFF0F172A), RoundedCornerShape(12.dp))
                ) {
                    Icon(Icons.Default.Pause, contentDescription = "Pause", tint = Color.White)
                }
            }

            // Stats row: Moves left & Score & Objective
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    color = if (movesLeft <= 3) Color(0xFF4C0519) else Color(0xFF0F172A),
                    border = androidx.compose.foundation.BorderStroke(1.dp, if (movesLeft <= 3) Color(0xFFF43F5E) else Color(0x22FFFFFF))
                ) {
                    Row(
                        modifier = Modifier.padding(8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Moves", fontSize = 11.sp, color = Color.Gray)
                        Text("$movesLeft", fontSize = 16.sp, fontWeight = FontWeight.Black, color = Color.White)
                    }
                }

                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFF0F172A),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x22FFFFFF))
                ) {
                    Row(
                        modifier = Modifier.padding(8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Score", fontSize = 11.sp, color = Color.Gray)
                        Text("$score", fontSize = 16.sp, fontWeight = FontWeight.Black, color = Color(0xFFFBBF24))
                    }
                }
            }

            // Objective Strip
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = Color(0xFF0F172A),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x3338BDF8))
            ) {
                Text(
                    "🎯 ${levelConfig.objective.description}",
                    color = Color(0xFF38BDF8),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }

        // CENTER 2.5D HEXAGON BOARD
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            contentAlignment = Alignment.Center
        ) {
            com.hexacolor.quest.ui.components.HexagonBoard(
                radius = levelConfig.radius,
                tiles = tiles,
                selectedCoord = selectedBoardCoord,
                validTargets = validTargets,
                hintCoord = hintCoord,
                onTileSelect = onTileSelect,
                onCellClick = onCellClick
            )
        }

        // BOTTOM TRAY BLOCKS
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            trayBlocks.forEach { block ->
                val isSelected = selectedTrayBlockId == block.id
                Surface(
                    modifier = Modifier
                        .size(68.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .clickable(enabled = !block.isUsed) { onSelectTrayBlock(block.id) },
                    shape = RoundedCornerShape(16.dp),
                    color = if (block.isUsed) Color(0x11FFFFFF) else Color(0xFF0F172A),
                    border = androidx.compose.foundation.BorderStroke(
                        if (isSelected) 3.dp else 1.dp,
                        if (isSelected) Color(0xFF38BDF8) else Color(0x22FFFFFF)
                    )
                ) {
                    if (!block.isUsed) {
                        Box(contentAlignment = Alignment.Center) {
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .clip(CircleShape)
                                    .background(block.tier.color),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(block.tier.glyph, fontSize = 22.sp, color = Color.White)
                            }
                        }
                    }
                }
            }
        }

        // ACTION BUTTONS (Undo, Hint, Restart)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick = { onUndo() },
                modifier = Modifier
                    .weight(1f)
                    .height(44.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Undo", fontSize = 12.sp, color = Color.White)
            }

            Button(
                onClick = { onHint() },
                modifier = Modifier
                    .weight(1f)
                    .height(44.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B))
            ) {
                Text("Hint", fontSize = 12.sp, color = Color.Black, fontWeight = FontWeight.Bold)
            }

            OutlinedButton(
                onClick = { onRestart() },
                modifier = Modifier
                    .weight(1f)
                    .height(44.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Restart", fontSize = 12.sp, color = Color.White)
            }
        }
    }
}

@Composable
fun ShopScreen(
    coins: Int,
    gems: Int,
    onBack: () -> Unit,
    onWatchAdForCoins: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(
                onClick = { onBack() },
                modifier = Modifier
                    .size(40.dp)
                    .background(Color(0xFF0F172A), RoundedCornerShape(12.dp))
            ) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
            }

            Text("Cosmetic Shop", fontWeight = FontWeight.Black, fontSize = 20.sp, color = Color.White)

            Text("🪙 $coins", color = Color(0xFFFBBF24), fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }

        Button(
            onClick = { onWatchAdForCoins() },
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp)
                .height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8)),
            shape = RoundedCornerShape(14.dp)
        ) {
            Text("Watch Test Ad (+150 Coins)", color = Color.Black, fontWeight = FontWeight.Bold)
        }

        Text(
            "Cosmetic skins do not affect hitboxes, tile math or gameplay rules.",
            fontSize = 12.sp,
            color = Color.Gray,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        val cosmeticItems = listOf(
            "Classic Glossy" to "Free",
            "Candy Stack" to "300 Coins",
            "Neon Glow" to "700 Coins",
            "Crystal Glass" to "1,200 Coins",
            "Rainbow Shine" to "1,800 Coins",
            "Golden Royal" to "2,500 Coins"
        )

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(cosmeticItems) { (name, price) ->
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    color = Color(0xFF0F172A),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x22FFFFFF))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(name, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                        Text(price, color = Color(0xFFFBBF24), fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// Modals and Dialogs
// -------------------------------------------------------------

@Composable
fun PauseDialog(
    levelId: Int,
    onResume: () -> Unit,
    onRestart: () -> Unit,
    onLevelSelect: () -> Unit,
    onHome: () -> Unit
) {
    Dialog(onDismissRequest = { onResume() }) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color(0xFF0F172A),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x33FFFFFF)),
            modifier = Modifier.padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Paused", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White)
                Text("Level $levelId", fontSize = 13.sp, color = Color.Gray)

                Button(
                    onClick = { onResume() },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    Text("Resume Quest")
                }
                OutlinedButton(
                    onClick = { onRestart() },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Restart Level", color = Color.White)
                }
                OutlinedButton(
                    onClick = { onLevelSelect() },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Levels Map", color = Color.White)
                }
                OutlinedButton(
                    onClick = { onHome() },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Exit to Home", color = Color.White)
                }
            }
        }
    }
}

@Composable
fun VictoryDialog(
    levelId: Int,
    stars: Int,
    score: Int,
    coinsAwarded: Int,
    onNextLevel: () -> Unit,
    onReplay: () -> Unit,
    onLevelSelect: () -> Unit
) {
    Dialog(onDismissRequest = {}) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color(0xFF0F172A),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFBBF24)),
            modifier = Modifier.padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("🎉 Victory!", fontSize = 24.sp, fontWeight = FontWeight.Black, color = Color.White)
                Text("Level $levelId Cleared", fontSize = 13.sp, color = Color.LightGray)

                Row {
                    repeat(3) { i ->
                        Text(
                            "★",
                            fontSize = 32.sp,
                            color = if (i < stars) Color(0xFFFBBF24) else Color(0xFF334155)
                        )
                    }
                }

                Text("Score: $score", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text("+ $coinsAwarded Coins Earned!", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFBBF24))

                Button(
                    onClick = { onNextLevel() },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF43F5E))
                ) {
                    Text("Next Level")
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = { onReplay() },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Replay", color = Color.White, fontSize = 12.sp)
                    }
                    OutlinedButton(
                        onClick = { onLevelSelect() },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Levels", color = Color.White, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun GameOverDialog(
    levelId: Int,
    onRetry: () -> Unit,
    onUndo: () -> Unit,
    onWatchAdExtraMoves: () -> Unit,
    onLevelSelect: () -> Unit
) {
    Dialog(onDismissRequest = {}) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color(0xFF0F172A),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFEF4444)),
            modifier = Modifier.padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("Out of Moves", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color(0xFFEF4444))
                Text("Level $levelId Incomplete", fontSize = 13.sp, color = Color.LightGray)

                Button(
                    onClick = { onWatchAdExtraMoves() },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8))
                ) {
                    Text("Get Extra Moves (Test Ad)", color = Color.Black, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = { onRetry() },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF43F5E))
                ) {
                    Text("Try Again")
                }

                OutlinedButton(
                    onClick = { onUndo() },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Undo Last Move", color = Color.White)
                }

                OutlinedButton(
                    onClick = { onLevelSelect() },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Levels Map", color = Color.White)
                }
            }
        }
    }
}

@Composable
fun SettingsDialog(
    vibration: Boolean,
    onToggleVibration: () -> Unit,
    onResetProgress: () -> Unit,
    onClose: () -> Unit
) {
    Dialog(onDismissRequest = { onClose() }) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color(0xFF0F172A),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x33FFFFFF)),
            modifier = Modifier.padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text("Game Settings", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color.White)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Haptic Vibration", color = Color.White, fontSize = 14.sp)
                    Switch(
                        checked = vibration,
                        onCheckedChange = { onToggleVibration() }
                    )
                }

                OutlinedButton(
                    onClick = { onResetProgress() },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFEF4444))
                ) {
                    Text("Reset All Progress")
                }

                Button(
                    onClick = { onClose() },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155))
                ) {
                    Text("Close")
                }
            }
        }
    }
