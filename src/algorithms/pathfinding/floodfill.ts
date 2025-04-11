import { coordsToString, isValidCoord } from "../../lib/mazeUtils/coordinateUtils";
import { getValidNeighbors, hasWallTowardsNeighbor } from "../../lib/mazeUtils/mazeNavigationUtils";
import type { Coordinates, CoordinateString, Maze } from "../../types";

export function calculateFloodFillDistances(maze: Maze, allowedCells: Set<CoordinateString>): void {
  const queue: Coordinates[] = [];
  const { width, height, cells, goalArea } = maze;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = cells[y]?.[x];
      if (cell) {
        cell.distance = Infinity;
      }
    }
  }
  goalArea.forEach((coord) => {
    const coordStr = coordsToString(coord);
    if (isValidCoord(coord, width, height) && cells[coord.y]?.[coord.x] && allowedCells.has(coordStr)) {
      const cell = cells[coord.y][coord.x];
      if (cell.distance === Infinity) {
        cell.distance = 0;
        queue.push(coord);
      }
    }
  });
  let head = 0;
  while (head < queue.length) {
    const currentCoord = queue[head++];
    const currentCell = cells[currentCoord.y]?.[currentCoord.x];
    if (!currentCell) continue;
    const currentDistance = currentCell.distance;
    const validNeighbors = getValidNeighbors(maze, currentCoord);
    for (const { neighborCoords, moveDef } of validNeighbors) {
      const neighborCoordStr = coordsToString(neighborCoords);
      const neighborCell = cells[neighborCoords.y]?.[neighborCoords.x];
      if (
        neighborCell &&
        allowedCells.has(neighborCoordStr) &&
        !hasWallTowardsNeighbor(maze, currentCoord, moveDef) &&
        neighborCell.distance === Infinity
      ) {
        neighborCell.distance = currentDistance + 1;
        queue.push(neighborCoords);
      }
    }
  }
}
