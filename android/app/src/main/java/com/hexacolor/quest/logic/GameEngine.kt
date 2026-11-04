package com.hexacolor.quest.logic

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
                    id = "tray-${levelConfig.id}-$dealIndex-$i-${UUID.randomUUID()}",
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

        // Mark block used
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
}
