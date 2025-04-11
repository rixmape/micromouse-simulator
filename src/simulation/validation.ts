import { calculateFloodFillDistances } from "../algorithms/pathfinding/floodfill";
import { findShortestPath } from "../algorithms/pathfinding/shortestPath";
import { coordsToString, stringToCoords } from "../lib/mazeUtils/coordinateUtils";
import { getValidNeighbors, hasWallTowardsNeighbor } from "../lib/mazeUtils/mazeNavigationUtils";
import { cloneMaze } from "../lib/mazeUtils/mazeStructureUtils";
import type { Maze } from "../types";

export function canStartSpeedRun(knownMap: Maze | null, visitedCells: Set<string>): boolean {
  if (!knownMap) {
    return false;
  }
  const mapForCheck = cloneMaze(knownMap);
  calculateFloodFillDistances(mapForCheck, visitedCells);
  const path = findShortestPath(mapForCheck);
  const pathFound =
    path.length > 0 &&
    path[0].x === mapForCheck.startCell.x &&
    path[0].y === mapForCheck.startCell.y &&
    mapForCheck.goalArea.some((g) => g.x === path[path.length - 1].x && g.y === path[path.length - 1].y);
  return pathFound;
}

export function isExplorationComplete(knownMap: Maze | null, visitedCells: Set<string>): boolean {
  if (!knownMap) {
    return true;
  }
  for (const visitedCoordStr of visitedCells) {
    const currentCoords = stringToCoords(visitedCoordStr);
    if (!currentCoords) continue;
    const neighbors = getValidNeighbors(knownMap, currentCoords);
    for (const { neighborCoords, moveDef } of neighbors) {
      if (!hasWallTowardsNeighbor(knownMap, currentCoords, moveDef)) {
        const neighborCoordStr = coordsToString(neighborCoords);
        if (!visitedCells.has(neighborCoordStr)) {
          return false;
        }
      }
    }
  }
  return true;
}
