import { Coordinates, Maze } from "../types";
import { coordsToString, getValidNeighbors, hasWallTowardsNeighbor, isValidCoord } from "./mazeUtils";

export function calculateFloodFillDistances(maze: Maze, allowedCells: Set<string>): void {
  const queue: Coordinates[] = [];
  const { width, height, cells, goalArea } = maze;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (cells[y]?.[x]) {
        cells[y][x].distance = Infinity;
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
      if (neighborCell && allowedCells.has(neighborCoordStr) && !hasWallTowardsNeighbor(maze, currentCoord, moveDef) && neighborCell.distance === Infinity) {
        neighborCell.distance = currentDistance + 1;
        queue.push(neighborCoords);
      }
    }
  }
}

export function findShortestPath(maze: Maze): Coordinates[] {
  const path: Coordinates[] = [];
  const { width, height, cells, startCell, goalArea } = maze;
  if (!isValidCoord(startCell, width, height) || !cells[startCell.y]?.[startCell.x] || cells[startCell.y][startCell.x].distance === Infinity) {
    console.error("Start cell is invalid or unreachable based on calculated distances.");
    return [];
  }
  let currentCoord = { ...startCell };
  path.push(currentCoord);
  const maxPathLength = width * height * 2;
  let pathLength = 0;
  while (!goalArea.some((gc) => gc.x === currentCoord.x && gc.y === currentCoord.y)) {
    const currentCell = cells[currentCoord.y]?.[currentCoord.x];
    if (!currentCell) {
      console.error("Pathfinding entered invalid cell:", currentCoord);
      return [];
    }
    let bestNeighbor: Coordinates | null = null;
    let minDistance = currentCell.distance;
    const validNeighbors = getValidNeighbors(maze, currentCoord);
    for (const { neighborCoords, moveDef } of validNeighbors) {
      const neighborCell = cells[neighborCoords.y]?.[neighborCoords.x];
      if (neighborCell && !hasWallTowardsNeighbor(maze, currentCoord, moveDef) && neighborCell.distance < minDistance) {
        minDistance = neighborCell.distance;
        bestNeighbor = neighborCoords;
      }
    }
    if (bestNeighbor) {
      currentCoord = bestNeighbor;
      path.push(currentCoord);
    } else {
      console.warn("Pathfinding stuck (no neighbor with lower distance):", currentCoord, "Min Distance:", minDistance);
      return [];
    }
    pathLength++;
    if (pathLength > maxPathLength) {
      console.error("Pathfinding exceeded maximum possible length. Aborting.");
      return [];
    }
  }
  return path;
}
