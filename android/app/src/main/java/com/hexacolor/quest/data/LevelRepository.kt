package com.hexacolor.quest.data

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
            val chapter = ((id - 1) / 20) + 1
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
                        description = "Synthesize a ${targetTier.tierName} tile"
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
}
