package com.hexacolor.quest.logic

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

    fun hexToPixel(coord: HexCoord, size: Float, center: Offset): Offset {
        val x = size * (sqrt(3f) * coord.q + (sqrt(3f) / 2f) * coord.r) + center.x
        val y = size * (1.5f * coord.r) + center.y
        return Offset(x, y)
    }

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
}
