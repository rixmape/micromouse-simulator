import { isValidCoord } from "../../lib/mazeUtils/coordinateUtils";
import { getValidNeighbors, hasWallTowardsNeighbor } from "../../lib/mazeUtils/mazeNavigationUtils";
import type { Coordinates, Maze } from "../../types";

export function findShortestPath(maze: Maze): Coordinates[] {
  const path: Coordinates[] = [];
  const { width, height, cells, startCell, goalArea } = maze;

  const startCellData = cells[startCell.y]?.[startCell.x];
  if (!isValidCoord(startCell, width, height) || !startCellData || startCellData.distance === Infinity) {
    return [];
  }

  let currentCoord = { ...startCell };
  path.push(currentCoord);

  const maxPathLength = width * height * 2;
  let pathLength = 0;

  while (!goalArea.some((gc) => gc.x === currentCoord.x && gc.y === currentCoord.y)) {
    const currentCell = cells[currentCoord.y]?.[currentCoord.x];
    if (!currentCell) {
      return [];
    }

    let bestNeighbor: Coordinates | null = null;
    let minDistance = currentCell.distance;

    const validNeighbors = getValidNeighbors(maze, currentCoord);

    for (const { neighborCoords, moveDef } of validNeighbors) {
      const neighborCell = cells[neighborCoords.y]?.[neighborCoords.x];
      if (
        neighborCell &&
        !hasWallTowardsNeighbor(maze, currentCoord, moveDef) &&
        neighborCell.distance < minDistance
      ) {
        minDistance = neighborCell.distance;
        bestNeighbor = neighborCoords;
      }
    }

    if (bestNeighbor) {
      currentCoord = bestNeighbor;
      path.push(currentCoord);
    } else {
      return [];
    }

    pathLength++;
    if (pathLength > maxPathLength) {
      return [];
    }
  }

  return path;
}
