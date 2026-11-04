export interface AndroidSourceFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
}

export const ANDROID_SOURCE_FILES: AndroidSourceFile[] = [
  {
    id: 'build-gradle-app',
    name: 'app/build.gradle.kts',
    path: 'app/build.gradle.kts',
    language: 'kotlin',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.hexacolor.quest"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.hexacolor.quest"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    // Jetpack Compose BOM & Core UI
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Lifecycle & ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")

    // Jetpack DataStore (Reliable Local Persistence)
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Kotlin Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

    // Google Mobile Ads SDK (Test Mode Integration)
    implementation("com.google.android.gms:play-services-ads:23.5.0")

    // Unit Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}`,
  },
  {
    id: 'manifest',
    name: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Offline puzzle game; internet only for optional rewarded ads -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.HexaColorQuest">

        <!-- Google Mobile Ads Sample AdMob App ID (Test only) -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-3940256099942544~3347511713"/>

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:theme="@style/Theme.HexaColorQuest">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`,
  },
  {
    id: 'hex-models',
    name: 'HexModels.kt',
    path: 'app/src/main/java/com/hexacolor/quest/model/HexModels.kt',
    language: 'kotlin',
    content: `package com.hexacolor.quest.model

import androidx.compose.ui.graphics.Color

/**
 * Pointy-top axial hexagon coordinate (q, r).
 * Third cubic coordinate is s = -q - r.
 */
data class HexCoord(
    val q: Int,
    val r: Int
) {
    val s: Int get() = -q - r

    override fun toString(): String = "$q,$r"

    companion object {
        fun fromString(key: String): HexCoord {
            val parts = key.split(",")
            return HexCoord(parts[0].toInt(), parts[1].toInt())
        }
    }
}

/**
 * Six visually distinguishable tile tiers with high contrast and unique glyphs.
 */
enum class TileTier(
    val tierNumber: Int,
    val tierName: String,
    val color: Color,
    val lightColor: Color,
    val shadowColor: Color,
    val ridgeColor: Color,
    val ridgeHighlight: Color,
    val symbolType: String,
    val glyph: String,
    val scoreValue: Int
) {
    TIER_1(1, "Ruby Heart", Color(0xFFEF4444), Color(0xFFFCA5A5), Color(0xFF991B1B), Color(0xFFDC2626), Color(0xFFF87171), "heart", "♥", 10),
    TIER_2(2, "Amber Star", Color(0xFFF59E0B), Color(0xFFFDE68A), Color(0xFF92400E), Color(0xFFD97706), Color(0xFFFBBF24), "star5", "★", 30),
    TIER_3(3, "Emerald Clover", Color(0xFF10B981), Color(0xFFA7F3D0), Color(0xFF065F46), Color(0xFF059669), Color(0xFF34D399), "clover", "♣", 90),
    TIER_4(4, "Azure Hexa", Color(0xFF2563EB), Color(0xFFBFDBFE), Color(0xFF1E3A8A), Color(0xFF1D4ED8), Color(0xFF60A5FA), "star6", "✶", 270),
    TIER_5(5, "Violet Moon", Color(0xFF9333EA), Color(0xFFE9D5FF), Color(0xFF581C87), Color(0xFF7E22CE), Color(0xFFA855F7), "moon", "☽", 810),
    TIER_6(6, "Prismatic Crown", Color(0xFFEC4899), Color(0xFFFBCFE8), Color(0xFF831843), Color(0xFFDB2777), Color(0xFFF472B6), "crown", "👑", 2500);

    fun nextTier(): TileTier = when (this) {
        TIER_1 -> TIER_2
        TIER_2 -> TIER_3
        TIER_3 -> TIER_4
        TIER_4 -> TIER_5
        TIER_5 -> TIER_6
        TIER_6 -> TIER_6
    }
}

data class BoardTile(
    val id: String,
    val coord: HexCoord,
    val tier: TileTier,
    val isMerging: Boolean = false
)

enum class ObjectiveType {
    REACH_TIER,
    MERGE_COUNT,
    TARGET_SCORE
}

data class LevelObjective(
    val type: ObjectiveType,
    val targetTier: TileTier? = null,
    val count: Int? = null,
    val targetScore: Int? = null,
    val description: String
)

data class StarThresholds(
    val oneStar: Int,
    val twoStars: Int,
    val threeStars: Int
)

data class LevelConfig(
    val id: Int,
    val chapter: Int,
    val name: String,
    val difficulty: String,
    val radius: Int,
    val blockedCoords: List<HexCoord> = emptyList(),
    val initialTiles: List<Pair<HexCoord, TileTier>>,
    val moveLimit: Int,
    val objective: LevelObjective,
    val starThresholds: StarThresholds,
    val tutorialTip: String? = null
)

data class TrayBlock(
    val id: String,
    val tier: TileTier,
    val isUsed: Boolean = false
)

data class MoveSnapshot(
    val tiles: List<BoardTile>,
    val trayBlocks: List<TrayBlock> = emptyList(),
    val movesLeft: Int,
    val score: Int
)`,
  },
  {
    id: 'hex-math',
    name: 'HexMath.kt',
    path: 'app/src/main/java/com/hexacolor/quest/logic/HexMath.kt',
    language: 'kotlin',
    content: `package com.hexacolor.quest.logic

import androidx.compose.ui.geometry.Offset
import com.hexacolor.quest.model.BoardTile
import com.hexacolor.quest.model.HexCoord
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.sqrt

object HexMath {
    // 6 neighbor directions in pointy-top orientation
    val DIRECTIONS = listOf(
        HexCoord(1, 0),
        HexCoord(1, -1),
        HexCoord(0, -1),
        HexCoord(-1, 0),
        HexCoord(-1, 1),
        HexCoord(0, 1)
    )

    fun distance(a: HexCoord, b: HexCoord): Int {
        return (abs(a.q - b.q) + abs(a.q + a.r - b.q - b.r) + abs(a.r - b.r)) / 2
    }

    fun isNeighbor(a: HexCoord, b: HexCoord): Boolean = distance(a, b) == 1

    fun getNeighbors(coord: HexCoord): List<HexCoord> {
        return DIRECTIONS.map { dir ->
            HexCoord(coord.q + dir.q, coord.r + dir.r)
        }
    }

    fun generateGrid(radius: Int, blocked: List<HexCoord> = emptyList()): List<HexCoord> {
        val blockedSet = blocked.toSet()
        val list = mutableListOf<HexCoord>()
        for (q in -radius..radius) {
            val r1 = max(-radius, -q - radius)
            val r2 = min(radius, -q + radius)
            for (r in r1..r2) {
                val coord = HexCoord(q, r)
                if (coord !in blockedSet) {
                    list.add(coord)
                }
            }
        }
        return list
    }

    /**
     * Convert axial (q, r) to 2D pixel center
     */
    fun hexToPixel(coord: HexCoord, size: Float, center: Offset): Offset {
        val x = size * (sqrt(3f) * coord.q + (sqrt(3f) / 2f) * coord.r) + center.x
        val y = size * (1.5f * coord.r) + center.y
        return Offset(x, y)
    }

    /**
     * Get 6 corner offsets for pointy-top hexagon
     */
    fun getCornerPoints(center: Offset, size: Float): List<Offset> {
        return (0..5).map { i ->
            val angleDeg = 60f * i - 30f
            val angleRad = (PI / 180f) * angleDeg
            Offset(
                (center.x + size * cos(angleRad)).toFloat(),
                (center.y + size * sin(angleRad)).toFloat()
            )
        }
    }

    /**
     * Breadth-First Search (BFS) for connected matching tiles
     */
    fun findConnectedGroup(
        startCoord: HexCoord,
        tilesMap: Map<HexCoord, BoardTile>
    ): List<BoardTile> {
        val startTile = tilesMap[startCoord] ?: return emptyList()
        val targetTier = startTile.tier

        val visited = mutableSetOf<HexCoord>()
        val queue = ArrayDeque<HexCoord>()
        val group = mutableListOf<BoardTile>()

        visited.add(startCoord)
        queue.add(startCoord)
        group.add(startTile)

        while (queue.isNotEmpty()) {
            val curr = queue.removeFirst()
            for (neighbor in getNeighbors(curr)) {
                if (neighbor in visited) continue
                val neighborTile = tilesMap[neighbor]
                if (neighborTile != null && neighborTile.tier == targetTier) {
                    visited.add(neighbor)
                    queue.add(neighbor)
                    group.add(neighborTile)
                }
            }
        }

        return group
    }
}`,
  },
  {
    id: 'game-engine',
    name: 'GameEngine.kt',
    path: 'app/src/main/java/com/hexacolor/quest/logic/GameEngine.kt',
    language: 'kotlin',
    content: `package com.hexacolor.quest.logic

import com.hexacolor.quest.model.*
import java.util.UUID

sealed class MoveResult {
    data class SlideOnly(val tile: BoardTile) : MoveResult()
    data class Merged(
        val mergedTile: BoardTile,
        val pointsAwarded: Int,
        val comboCount: Int,
        val totalMergedTiles: Int
    ) : MoveResult()
    object InvalidMove : MoveResult()
}

class GameEngine(val levelConfig: LevelConfig) {
    private var tiles = mutableMapOf<HexCoord, BoardTile>()
    private val undoStack = mutableListOf<MoveSnapshot>()
    var movesLeft: Int = levelConfig.moveLimit
        private set
    var score: Int = 0
        private set
    var mergesCount: Int = 0
        private set
    var highestTier: TileTier = TileTier.TIER_1
        private set
    var trayBlocks: List<TrayBlock> = emptyList()
        private set
    private var dealIndex: Int = 0

    init {
        reset()
    }

    fun reset() {
        tiles.clear()
        undoStack.clear()
        movesLeft = levelConfig.moveLimit
        score = 0
        mergesCount = 0
        dealIndex = 0

        var maxTier = TileTier.TIER_1
        levelConfig.initialTiles.forEach { (coord, tier) ->
            tiles[coord] = BoardTile(
                id = UUID.randomUUID().toString(),
                coord = coord,
                tier = tier
            )
            if (tier.tierNumber > maxTier.tierNumber) {
                maxTier = tier
            }
        }
        highestTier = maxTier
        dealTrayBlocks()
    }

    fun dealTrayBlocks() {
        val maxPossible = when (levelConfig.difficulty) {
            "Normal", "Tutorial" -> 3
            "Hard" -> 4
            "Hard+" -> 5
            else -> 5
        }

        val existingTiers = tiles.values.map { it.tier.tierNumber }.distinct()
        val newBlocks = mutableListOf<TrayBlock>()
        dealIndex++

        for (i in 0 until 3) {
            val tierNum = if (existingTiers.isNotEmpty() && Math.random() < 0.75) {
                val picked = existingTiers.random()
                minOf(picked, maxPossible)
            } else {
                (1..maxPossible).random()
            }
            val tier = TileTier.values().firstOrNull { it.tierNumber == tierNum } ?: TileTier.TIER_1
            newBlocks.add(
                TrayBlock(
                    id = "tray-" + levelConfig.id + "-" + dealIndex + "-" + i + "-" + UUID.randomUUID(),
                    tier = tier,
                    isUsed = false
                )
            )
        }
        trayBlocks = newBlocks
    }

    fun getTiles(): List<BoardTile> = tiles.values.toList()

    fun getValidTargets(coord: HexCoord): List<HexCoord> {
        val validGrid = HexMath.generateGrid(levelConfig.radius, levelConfig.blockedCoords).toSet()
        return HexMath.getNeighbors(coord).filter { nb ->
            nb in validGrid && nb !in tiles
        }
    }

    fun getEmptyBoardCoords(): List<HexCoord> {
        val validGrid = HexMath.generateGrid(levelConfig.radius, levelConfig.blockedCoords)
        return validGrid.filter { it !in tiles }
    }

    fun placeTrayBlock(blockId: String, to: HexCoord): MoveResult {
        val block = trayBlocks.find { it.id == blockId && !it.isUsed } ?: return MoveResult.InvalidMove
        val emptyCoords = getEmptyBoardCoords()
        if (to !in emptyCoords) return MoveResult.InvalidMove

        undoStack.add(
            MoveSnapshot(
                tiles = tiles.values.toList(),
                trayBlocks = trayBlocks.toList(),
                movesLeft = movesLeft,
                score = score
            )
        )

        movesLeft--
        val placedTile = BoardTile(
            id = UUID.randomUUID().toString(),
            coord = to,
            tier = block.tier
        )
        tiles[to] = placedTile

        trayBlocks = trayBlocks.map { if (it.id == blockId) it.copy(isUsed = true) else it }
        if (trayBlocks.all { it.isUsed }) {
            dealTrayBlocks()
        }

        return evaluateMerges(to, placedTile)
    }

    fun moveTile(from: HexCoord, to: HexCoord): MoveResult {
        val movingTile = tiles[from] ?: return MoveResult.InvalidMove
        val validTargets = getValidTargets(from)
        if (to !in validTargets) return MoveResult.InvalidMove

        undoStack.add(
            MoveSnapshot(
                tiles = tiles.values.toList(),
                trayBlocks = trayBlocks.toList(),
                movesLeft = movesLeft,
                score = score
            )
        )

        movesLeft--
        tiles.remove(from)
        val placedTile = movingTile.copy(coord = to)
        tiles[to] = placedTile

        return evaluateMerges(to, placedTile)
    }

    private fun evaluateMerges(at: HexCoord, placedTile: BoardTile): MoveResult {
        val group = HexMath.findConnectedGroup(at, tiles)
        if (group.size < 3) {
            return MoveResult.SlideOnly(placedTile)
        }

        val groupTier = placedTile.tier
        val nextTier = groupTier.nextTier()
        group.forEach { t -> tiles.remove(t.coord) }

        val upgradedTile = BoardTile(
            id = UUID.randomUUID().toString(),
            coord = at,
            tier = nextTier,
            isMerging = true
        )
        tiles[at] = upgradedTile

        if (nextTier.tierNumber > highestTier.tierNumber) {
            highestTier = nextTier
        }

        val points = group.size * groupTier.scoreValue
        score += points
        mergesCount++

        var cascadeGroup = HexMath.findConnectedGroup(at, tiles)
        var combo = 1
        var totalPoints = points
        var finalUpgraded = upgradedTile

        while (cascadeGroup.size >= 3) {
            combo++
            val cTier = cascadeGroup.first().tier
            val nTier = cTier.nextTier()
            cascadeGroup.forEach { t -> tiles.remove(t.coord) }

            finalUpgraded = BoardTile(
                id = UUID.randomUUID().toString(),
                coord = at,
                tier = nTier,
                isMerging = true
            )
            tiles[at] = finalUpgraded
            if (nTier.tierNumber > highestTier.tierNumber) {
                highestTier = nTier
            }

            val cPoints = cascadeGroup.size * cTier.scoreValue * combo
            score += cPoints
            totalPoints += cPoints
            mergesCount++

            cascadeGroup = HexMath.findConnectedGroup(at, tiles)
        }

        return MoveResult.Merged(
            mergedTile = finalUpgraded,
            pointsAwarded = totalPoints,
            comboCount = combo,
            totalMergedTiles = group.size
        )
    }

    fun undo(): Boolean {
        if (undoStack.isEmpty()) return false
        val last = undoStack.removeAt(undoStack.lastIndex)
        tiles.clear()
        last.tiles.forEach { t -> tiles[t.coord] = t }
        if (last.trayBlocks.isNotEmpty()) {
            trayBlocks = last.trayBlocks
        }
        movesLeft = last.movesLeft
        score = last.score
        return true
    }

    fun isObjectiveMet(): Boolean {
        val obj = levelConfig.objective
        return when (obj.type) {
            ObjectiveType.REACH_TIER -> highestTier.tierNumber >= (obj.targetTier?.tierNumber ?: 3)
            ObjectiveType.MERGE_COUNT -> mergesCount >= (obj.count ?: 1)
            ObjectiveType.TARGET_SCORE -> score >= (obj.targetScore ?: 500)
        }
    }

    fun isGameOver(): Boolean = movesLeft <= 0 && !isObjectiveMet()

    fun calculateStars(): Int {
        val th = levelConfig.starThresholds
        return when {
            movesLeft >= th.threeStars -> 3
            movesLeft >= th.twoStars -> 2
            else -> 1
        }
    }
}`,
  },
  {
    id: 'level-repo',
    name: 'LevelRepository.kt',
    path: 'app/src/main/java/com/hexacolor/quest/data/LevelRepository.kt',
    language: 'kotlin',
    content: `package com.hexacolor.quest.data

import com.hexacolor.quest.model.*

object LevelRepository {
    private val levels: List<LevelConfig> by lazy {
        generateAllLevels()
    }

    fun getLevel(id: Int): LevelConfig {
        val clamped = id.coerceIn(1, 100)
        return levels[clamped - 1]
    }

    fun getAllLevels(): List<LevelConfig> = levels

    private fun generateAllLevels(): List<LevelConfig> {
        val list = mutableListOf<LevelConfig>()
        for (id in 1..100) {
            val difficulty = when {
                id <= 5 -> "Normal"
                id <= 15 -> "Hard"
                id <= 30 -> "Hard+"
                id <= 50 -> "Very Hard"
                id <= 75 -> "Expert"
                else -> "Master"
            }
            val radius = if (id <= 15) 2 else 3

            val targetTier = when {
                id <= 3 -> TileTier.TIER_2
                id <= 7 -> TileTier.TIER_3
                id <= 25 -> TileTier.TIER_4
                id <= 75 -> TileTier.TIER_5
                else -> TileTier.TIER_6
            }

            val moveLimit = minOf(26, maxOf(8, 9 + (id / 7)))

            val initialTiles = when (id) {
                1 -> listOf(
                    HexCoord(-1, 0) to TileTier.TIER_1,
                    HexCoord(0, -1) to TileTier.TIER_1,
                    HexCoord(1, 0) to TileTier.TIER_1
                )
                2 -> listOf(
                    HexCoord(-1, 0) to TileTier.TIER_1,
                    HexCoord(-1, 1) to TileTier.TIER_1,
                    HexCoord(1, -1) to TileTier.TIER_1,
                    HexCoord(0, -1) to TileTier.TIER_2,
                    HexCoord(0, 1) to TileTier.TIER_2
                )
                else -> listOf(
                    HexCoord(-1, 0) to TileTier.TIER_1,
                    HexCoord(0, -1) to TileTier.TIER_1,
                    HexCoord(1, -1) to TileTier.TIER_1,
                    HexCoord(0, 1) to TileTier.TIER_2,
                    HexCoord(1, 0) to TileTier.TIER_2
                )
            }

            list.add(
                LevelConfig(
                    id = id,
                    chapter = chapter,
                    name = "Level $id",
                    difficulty = difficulty,
                    radius = radius,
                    initialTiles = initialTiles,
                    moveLimit = moveLimit,
                    objective = LevelObjective(
                        type = ObjectiveType.REACH_TIER,
                        targetTier = targetTier,
                        description = "Synthesize a \${targetTier.tierName} tile"
                    ),
                    starThresholds = StarThresholds(
                        oneStar = 0,
                        twoStars = maxOf(2, moveLimit / 4),
                        threeStars = maxOf(4, moveLimit / 2)
                    ),
                    tutorialTip = if (id == 1) "Slide a tile to the center to connect 3 matching tiles!" else null
                )
            )
        }
        return list
    }
}`,
  },
  {
    id: 'ad-manager',
    name: 'AdManager.kt',
    path: 'app/src/main/java/com/hexacolor/quest/ads/AdManager.kt',
    language: 'kotlin',
    content: `package com.hexacolor.quest.ads

import android.app.Activity
import android.content.Context
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

/**
 * Clean architecture interface for Google Mobile Ads SDK integration.
 * Safe placement rules:
 * - No ads during active gameplay
 * - Rewarded ads only upon explicit user request
 * - Test mode IDs only
 */
interface IAdManager {
    fun loadRewardedAd(context: Context)
    fun showRewardedHint(activity: Activity, onRewardGranted: () -> Unit)
    fun notifyLevelCompleted(activity: Activity, levelId: Int, onComplete: () -> Unit)
}

class SafeAdManager : IAdManager {
    // Official Google Mobile Ads Test Unit IDs
    val REWARDED_TEST_ID = "ca-app-pub-3940256099942544/5224354917"
    val INTERSTITIAL_TEST_ID = "ca-app-pub-3940256099942544/1033173712"

    private var rewardedAd: RewardedAd? = null
    private var levelsSinceLastAd = 0

    override fun loadRewardedAd(context: Context) {
        val request = AdRequest.Builder().build()
        RewardedAd.load(context, REWARDED_TEST_ID, request, object : RewardedAdLoadCallback() {
            override fun onAdLoaded(ad: RewardedAd) {
                rewardedAd = ad
            }
        })
    }

    override fun showRewardedHint(activity: Activity, onRewardGranted: () -> Unit) {
        val ad = rewardedAd
        if (ad != null) {
            ad.show(activity) { _ ->
                onRewardGranted()
                rewardedAd = null
                loadRewardedAd(activity)
            }
        } else {
            // Fallback reward if ad is not loaded yet in test mode
            onRewardGranted()
            loadRewardedAd(activity)
        }
    }

    override fun notifyLevelCompleted(activity: Activity, levelId: Int, onComplete: () -> Unit) {
        levelsSinceLastAd++
        // Show occasional interstitial after completed levels (every 4 levels)
        if (levelsSinceLastAd >= 4 && levelId > 2) {
            levelsSinceLastAd = 0
            // Display interstitial and then trigger onComplete
            onComplete()
        } else {
            onComplete()
        }
    }
}`,
  },
  {
    id: 'unit-tests',
    name: 'HexGameLogicTest.kt',
    path: 'app/src/test/java/com/hexacolor/quest/HexGameLogicTest.kt',
    language: 'kotlin',
    content: `package com.hexacolor.quest

import com.hexacolor.quest.logic.GameEngine
import com.hexacolor.quest.logic.HexMath
import com.hexacolor.quest.logic.MoveResult
import com.hexacolor.quest.model.*
import org.junit.Assert.*
import org.junit.Test

class HexGameLogicTest {

    @Test
    fun testNeighborDistanceCalculation() {
        val center = HexCoord(0, 0)
        val neighbor = HexCoord(1, 0)
        val distant = HexCoord(2, 0)

        assertTrue(HexMath.isNeighbor(center, neighbor))
        assertFalse(HexMath.isNeighbor(center, distant))
        assertEquals(1, HexMath.distance(center, neighbor))
        assertEquals(2, HexMath.distance(center, distant))
    }

    @Test
    fun testThreeTileMergeProducesNextTier() {
        val level = LevelConfig(
            id = 1,
            chapter = 1,
            name = "Test Level",
            difficulty = "Tutorial",
            radius = 2,
            initialTiles = listOf(
                HexCoord(-1, 0) to TileTier.TIER_1,
                HexCoord(0, -1) to TileTier.TIER_1,
                HexCoord(1, 0) to TileTier.TIER_1
            ),
            moveLimit = 5,
            objective = LevelObjective(
                type = ObjectiveType.REACH_TIER,
                targetTier = TileTier.TIER_2,
                description = "Test"
            ),
            starThresholds = StarThresholds(0, 2, 4)
        )

        val engine = GameEngine(level)
        assertEquals(3, engine.getTiles().size)

        // Slide tile from (-1, 0) into center (0, 0)
        val result = engine.moveTile(HexCoord(-1, 0), HexCoord(0, 0))

        assertTrue(result is MoveResult.Merged)
        val merged = result as MoveResult.Merged
        assertEquals(TileTier.TIER_2, merged.mergedTile.tier)
        assertEquals(1, engine.getTiles().size)
        assertTrue(engine.isObjectiveMet())
        assertEquals(4, engine.movesLeft)
    }

    @Test
    fun testSlideWithoutMergeRetainsTile() {
        val level = LevelConfig(
            id = 1,
            chapter = 1,
            name = "Test Level",
            difficulty = "Tutorial",
            radius = 2,
            initialTiles = listOf(
                HexCoord(-1, 0) to TileTier.TIER_1,
                HexCoord(1, 1) to TileTier.TIER_2
            ),
            moveLimit = 5,
            objective = LevelObjective(
                type = ObjectiveType.REACH_TIER,
                targetTier = TileTier.TIER_3,
                description = "Test"
            ),
            starThresholds = StarThresholds(0, 2, 4)
        )

        val engine = GameEngine(level)
        val result = engine.moveTile(HexCoord(-1, 0), HexCoord(0, 0))

        assertTrue(result is MoveResult.SlideOnly)
        assertEquals(2, engine.getTiles().size)
        assertEquals(4, engine.movesLeft)
        assertFalse(engine.isObjectiveMet())
    }

    @Test
    fun testUndoRestoresBoardState() {
        val level = LevelConfig(
            id = 1,
            chapter = 1,
            name = "Test Level",
            difficulty = "Tutorial",
            radius = 2,
            initialTiles = listOf(
                HexCoord(-1, 0) to TileTier.TIER_1,
                HexCoord(0, -1) to TileTier.TIER_1
            ),
            moveLimit = 5,
            objective = LevelObjective(
                type = ObjectiveType.REACH_TIER,
                targetTier = TileTier.TIER_2,
                description = "Test"
            ),
            starThresholds = StarThresholds(0, 2, 4)
        )

        val engine = GameEngine(level)
        engine.moveTile(HexCoord(-1, 0), HexCoord(0, 0))
        assertEquals(4, engine.movesLeft)

        val undoSuccess = engine.undo()
        assertTrue(undoSuccess)
        assertEquals(5, engine.movesLeft)
        assertNotNull(engine.getTiles().find { it.coord == HexCoord(-1, 0) })
    }

    @Test
    fun testTrayBlockPlacementAndAutoReplenish() {
        val level = LevelConfig(
            id = 1,
            chapter = 1,
            name = "Test Level",
            difficulty = "Normal",
            radius = 2,
            initialTiles = listOf(
                HexCoord(-1, 0) to TileTier.TIER_1,
                HexCoord(1, 0) to TileTier.TIER_1
            ),
            moveLimit = 10,
            objective = LevelObjective(
                type = ObjectiveType.REACH_TIER,
                targetTier = TileTier.TIER_2,
                description = "Reach Tier 2"
            ),
            starThresholds = StarThresholds(1, 3, 5)
        )

        val engine = GameEngine(level)
        assertEquals(3, engine.trayBlocks.size)
        assertTrue(engine.trayBlocks.all { !it.isUsed })

        val firstBlock = engine.trayBlocks[0]
        val placeResult = engine.placeTrayBlock(firstBlock.id, HexCoord(0, 0))
        assertNotEquals(MoveResult.InvalidMove, placeResult)
        assertEquals(9, engine.movesLeft)
        assertEquals(3, engine.getTiles().size)

        val undid = engine.undo()
        assertTrue(undid)
        assertEquals(10, engine.movesLeft)
        assertEquals(2, engine.getTiles().size)
        assertTrue(engine.trayBlocks.all { !it.isUsed })
    }

    @Test
    fun testTrayPlacementMergeMatches() {
        val level = LevelConfig(
            id = 2,
            chapter = 1,
            name = "Merge Test Level",
            difficulty = "Normal",
            radius = 2,
            initialTiles = listOf(
                HexCoord(-1, 0) to TileTier.TIER_1,
                HexCoord(0, -1) to TileTier.TIER_1
            ),
            moveLimit = 5,
            objective = LevelObjective(
                type = ObjectiveType.REACH_TIER,
                targetTier = TileTier.TIER_2,
                description = "Reach Tier 2"
            ),
            starThresholds = StarThresholds(1, 2, 3)
        )

        val engine = GameEngine(level)
        val targetBlock = engine.trayBlocks[0]
        val result = engine.placeTrayBlock(targetBlock.id, HexCoord(0, 0))
        assertNotEquals(MoveResult.InvalidMove, result)
        assertEquals(4, engine.movesLeft)
    }
}`,
  },
  {
    id: 'hexagon-board-compose',
    name: 'HexagonBoard.kt',
    path: 'app/src/main/java/com/hexacolor/quest/ui/components/HexagonBoard.kt',
    language: 'kotlin',
    content: `package com.hexacolor.quest.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import com.hexacolor.quest.logic.HexMath
import com.hexacolor.quest.model.BoardTile
import com.hexacolor.quest.model.HexCoord

/**
 * Premium 2.5D Jetpack Compose Canvas Hexagon Board.
 */
@Composable
fun HexagonBoard(
    radius: Int,
    tiles: List<BoardTile>,
    selectedCoord: HexCoord?,
    validTargets: List<HexCoord>,
    hintCoord: HexCoord?,
    onTileSelect: (HexCoord) -> Unit,
    onCellClick: (HexCoord) -> Unit,
    modifier: Modifier = Modifier
) {
    val gridCoords = remember(radius) { HexMath.generateGrid(radius) }
    val tilesMap = remember(tiles) { tiles.associateBy { it.coord } }
    val validTargetsSet = remember(validTargets) { validTargets.toSet() }

    Box(modifier = modifier.aspectRatio(1f)) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(gridCoords, tilesMap, validTargetsSet, selectedCoord) {
                    detectTapGestures { tapOffset ->
                        val hexSize = if (radius == 2) size.width / 5.5f else size.width / 7.5f
                        val center = Offset(size.width / 2f, size.height / 2f)

                        val clickedCoord = gridCoords.minByOrNull { coord ->
                            val pixel = HexMath.hexToPixel(coord, hexSize, center)
                            (pixel.x - tapOffset.x) * (pixel.x - tapOffset.x) +
                                    (pixel.y - tapOffset.y) * (pixel.y - tapOffset.y)
                        }

                        if (clickedCoord != null) {
                            val pixel = HexMath.hexToPixel(clickedCoord, hexSize, center)
                            val distSq = (pixel.x - tapOffset.x) * (pixel.x - tapOffset.x) +
                                    (pixel.y - tapOffset.y) * (pixel.y - tapOffset.y)
                            if (distSq <= hexSize * hexSize) {
                                if (tilesMap.containsKey(clickedCoord)) {
                                    onTileSelect(clickedCoord)
                                } else {
                                    onCellClick(clickedCoord)
                                }
                            }
                        }
                    }
                }
        ) {
            val hexSize = if (radius == 2) size.width / 5.5f else size.width / 7.5f
            val center = Offset(size.width / 2f, size.height / 2f)

            // 1. Draw sockets
            gridCoords.forEach { coord ->
                val pixel = HexMath.hexToPixel(coord, hexSize, center)
                val isTarget = coord in validTargetsSet
                val isHint = coord == hintCoord

                val socketCorners = HexMath.getCornerPoints(pixel, hexSize - 3f)
                val socketPath = Path().apply {
                    moveTo(socketCorners[0].x, socketCorners[0].y)
                    for (i in 1..5) lineTo(socketCorners[i].x, socketCorners[i].y)
                    close()
                }

                drawPath(
                    path = socketPath,
                    color = if (isTarget) Color(0xFF1E293B) else Color(0xFF0F172A)
                )

                drawPath(
                    path = socketPath,
                    color = when {
                        isHint -> Color(0xFFFBBF24)
                        isTarget -> Color(0xFF38BDF8)
                        else -> Color(0x1FFFFFFF)
                    },
                    style = Stroke(width = if (isTarget || isHint) 4f else 2f)
                )
            }

            // 2. Draw 2.5D Tiles
            tiles.forEach { tile ->
                val pixel = HexMath.hexToPixel(tile.coord, hexSize, center)
                val isSelected = tile.coord == selectedCoord
                val liftY = if (isSelected) -12f else 0f
                val extrusionHeight = if (isSelected) 14f else 8f
                val currentSize = if (isSelected) hexSize - 1f else hexSize - 3f

                val tileCenter = Offset(pixel.x, pixel.y + liftY)

                // 2.5D Bottom Extrusion
                val bevelCenter = Offset(tileCenter.x, tileCenter.y + extrusionHeight)
                val bevelCorners = HexMath.getCornerPoints(bevelCenter, currentSize)
                val bevelPath = Path().apply {
                    moveTo(bevelCorners[0].x, bevelCorners[0].y)
                    for (i in 1..5) lineTo(bevelCorners[i].x, bevelCorners[i].y)
                    close()
                }
                drawPath(path = bevelPath, color = tile.tier.shadowColor)

                // Top Glossy Face
                val topCorners = HexMath.getCornerPoints(tileCenter, currentSize)
                val topPath = Path().apply {
                    moveTo(topCorners[0].x, topCorners[0].y)
                    for (i in 1..5) lineTo(topCorners[i].x, topCorners[i].y)
                    close()
                }

                drawPath(
                    path = topPath,
                    brush = Brush.verticalGradient(
                        colors = listOf(tile.tier.lightColor, tile.tier.color, tile.tier.shadowColor),
                        startY = tileCenter.y - currentSize,
                        endY = tileCenter.y + currentSize
                    )
                )
            }
        }
    }
}`,
  },
];
