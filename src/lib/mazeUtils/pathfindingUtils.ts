import { calculateFloodFillDistances } from "../../algorithms/pathfinding/floodfill";
import { findShortestPath } from "../../algorithms/pathfinding/shortestPath";
import type { Coordinates, CoordinateString, Maze } from "../../types";
import { coordsToString } from "./coordinateUtils";
import { getValidNeighbors, hasWallTowardsNeighbor } from "./mazeNavigationUtils";
import { cloneMaze } from "./mazeStructureUtils";

export function calculateDistancesToGoal(map: Maze, allowedCells: Set<CoordinateString>): Maze {
  const mapCopy = cloneMaze(map);
  calculateFloodFillDistances(mapCopy, allowedCells);
  return mapCopy;
}

export function calculateDistancesToStart(map: Maze, allowedCells: Set<CoordinateString>): Maze {
  const mapCopy = cloneMaze(map);
  if (!mapCopy.goalArea?.length) {
    console.warn("Cannot calculate distances to start: Maze has no goal area defined.");
    for (let y = 0; y < mapCopy.height; y++) {
      for (let x = 0; x < mapCopy.width; x++) {
        if (mapCopy.cells[y]?.[x]) {
          mapCopy.cells[y][x].distance = Infinity;
        }
      }
    }
    return mapCopy;
  }
  const originalStart = { ...mapCopy.startCell };
  const originalGoalArea = mapCopy.goalArea.map((g) => ({ ...g }));
  mapCopy.startCell = { ...originalGoalArea[0] };
  mapCopy.goalArea = [originalStart];
  calculateFloodFillDistances(mapCopy, allowedCells);
  mapCopy.startCell = originalStart;
  mapCopy.goalArea = originalGoalArea;
  return mapCopy;
}

export function findBestMove(currentMap: Maze, currentPos: Coordinates): Coordinates | null {
  const currentCell = currentMap.cells[currentPos.y]?.[currentPos.x];
  if (!currentCell || currentCell.distance === Infinity) {
    return null;
  }
  let bestNeighbor: Coordinates | null = null;
  let minDistance = currentCell.distance;
  const neighbors = getValidNeighbors(currentMap, currentPos);
  for (const { neighborCoords, moveDef } of neighbors) {
    if (!hasWallTowardsNeighbor(currentMap, currentPos, moveDef)) {
      const neighborCell = currentMap.cells[neighborCoords.y]?.[neighborCoords.x];
      if (neighborCell && neighborCell.distance < minDistance) {
        minDistance = neighborCell.distance;
        bestNeighbor = neighborCoords;
      }
    }
  }
  return bestNeighbor;
}

export function calculateAndValidateSpeedRunPath(
  knownMap: Maze,
  actualMaze: Maze,
  visitedCells: Set<CoordinateString>
): { robotPath: Coordinates[] | null; absoluteShortestPath: Coordinates[] | null; isPathValid: boolean } {
  let absoluteShortestPath: Coordinates[] | null = null;
  try {
    const allActualCells = new Set<CoordinateString>();
    actualMaze.cells.forEach((row, y) => row.forEach((_, x) => allActualCells.add(coordsToString({ x, y }))));
    const tempActualMap = calculateDistancesToGoal(cloneMaze(actualMaze), allActualCells);
    const truePath = findShortestPath(tempActualMap);
    if (truePath.length > 0 && truePath[0].x === tempActualMap.startCell.x && truePath[0].y === tempActualMap.startCell.y) {
      absoluteShortestPath = truePath;
    }
  } catch (error) {
    console.error("Error calculating absolute shortest path:", error);
    absoluteShortestPath = null;
  }
  let robotPath: Coordinates[] | null = null;
  let isPathValid = false;
  try {
    const mapForPathfinding = calculateDistancesToGoal(cloneMaze(knownMap), visitedCells);
    robotPath = findShortestPath(mapForPathfinding);
    if (robotPath && robotPath.length > 0) {
      const startPos = mapForPathfinding.startCell;
      const endPos = robotPath[robotPath.length - 1];
      isPathValid =
        robotPath[0].x === startPos.x && robotPath[0].y === startPos.y && mapForPathfinding.goalArea.some((g) => g.x === endPos.x && g.y === endPos.y);
    } else {
      isPathValid = false;
    }
    if (!isPathValid) {
      robotPath = null;
    }
  } catch (error) {
    console.error("Error calculating robot speed run path:", error);
    robotPath = null;
    isPathValid = false;
  }
  return { robotPath, absoluteShortestPath, isPathValid };
}
