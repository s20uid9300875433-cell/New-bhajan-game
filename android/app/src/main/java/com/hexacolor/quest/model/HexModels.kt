package com.hexacolor.quest.model

import androidx.compose.ui.graphics.Color

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
)
