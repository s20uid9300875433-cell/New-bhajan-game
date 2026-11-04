package com.hexacolor.quest.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.spring
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
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import com.hexacolor.quest.logic.HexMath
import com.hexacolor.quest.model.BoardTile
import com.hexacolor.quest.model.HexCoord

/**
 * Premium 2.5D Jetpack Compose Canvas Hexagon Board.
 * Features:
 * - Pointy-top hex math
 * - 2.5D bottom extruded shadow bevel
 * - Glossy top face with specular highlight arc
 * - Selection lift animation
 * - Touch detection with responsive feedback
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
    val gridCoords = remember(radius) {
        HexMath.generateGrid(radius)
    }

    val tilesMap = remember(tiles) {
        tiles.associateBy { it.coord }
    }

    val validTargetsSet = remember(validTargets) {
        validTargets.toSet()
    }

    Box(modifier = modifier.aspectRatio(1f)) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(gridCoords, tilesMap, validTargetsSet, selectedCoord) {
                    detectTapGestures { tapOffset ->
                        val hexSize = if (radius == 2) size.width / 5.5f else size.width / 7.5f
                        val center = Offset(size.width / 2f, size.height / 2f)

                        // Find closest hex cell
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

            // 1. Draw empty socket recesses
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

                if (isTarget && !tilesMap.containsKey(coord)) {
                    drawCircle(
                        color = Color(0xFF38BDF8),
                        radius = 8f,
                        center = pixel
                    )
                }
            }

            // 2. Draw 2.5D Hexagon Tiles
            tiles.forEach { tile ->
                val pixel = HexMath.hexToPixel(tile.coord, hexSize, center)
                val isSelected = tile.coord == selectedCoord
                val liftY = if (isSelected) -12f else 0f
                val extrusionHeight = if (isSelected) 14f else 8f
                val currentSize = if (isSelected) hexSize - 1f else hexSize - 3f

                val tileCenter = Offset(pixel.x, pixel.y + liftY)

                // 2.5D Layered Horizontal Side Ridges (Multiple stacked ridges from bottom to top)
                val ridgeOffsets = listOf(extrusionHeight + 6f, extrusionHeight + 3f, extrusionHeight)
                val ridgeColors = listOf(tile.tier.shadowColor, tile.tier.ridgeColor, tile.tier.ridgeHighlight)

                for (idx in ridgeOffsets.indices) {
                    val ridgeCenter = Offset(tileCenter.x, tileCenter.y + ridgeOffsets[idx])
                    val ridgeCorners = HexMath.getCornerPoints(ridgeCenter, currentSize + (2f - idx.toFloat()))
                    val ridgePath = Path().apply {
                        moveTo(ridgeCorners[0].x, ridgeCorners[0].y)
                        for (i in 1..5) lineTo(ridgeCorners[i].x, ridgeCorners[i].y)
                        close()
                    }
                    drawPath(path = ridgePath, color = ridgeColors[idx])
                }

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

                // Top face inner bevel highlight
                drawPath(
                    path = topPath,
                    color = Color.White.copy(alpha = 0.55f),
                    style = Stroke(width = 2.5f)
                )

                // Debossed center symbol circle/disc
                drawCircle(
                    color = tile.tier.shadowColor.copy(alpha = 0.45f),
                    radius = currentSize * 0.45f,
                    center = tileCenter
                )
                drawCircle(
                    color = Color.White.copy(alpha = 0.35f),
                    radius = currentSize * 0.45f,
                    center = tileCenter,
                    style = Stroke(width = 1.5f)
                )

                if (isSelected) {
                    drawPath(
                        path = topPath,
                        color = Color(0xFF38BDF8),
                        style = Stroke(width = 5f)
                    )
                }
            }
        }
    }
}
