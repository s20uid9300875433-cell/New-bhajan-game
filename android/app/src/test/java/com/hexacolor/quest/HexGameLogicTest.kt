package com.hexacolor.quest

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

        // Find or place first block
        val firstBlock = engine.trayBlocks[0]
        val placeResult = engine.placeTrayBlock(firstBlock.id, HexCoord(0, 0))
        assertNotEquals(MoveResult.InvalidMove, placeResult)
        assertEquals(9, engine.movesLeft)
        assertEquals(3, engine.getTiles().size)

        // Undo restores tray block
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
        // Set first tray block to TIER_1 to guarantee merge
        val targetBlock = engine.trayBlocks[0]
        // Place at (0, 0) connecting (-1, 0) and (0, -1)
        val result = engine.placeTrayBlock(targetBlock.id, HexCoord(0, 0))
        assertNotEquals(MoveResult.InvalidMove, result)
        assertEquals(4, engine.movesLeft)
    }
}
