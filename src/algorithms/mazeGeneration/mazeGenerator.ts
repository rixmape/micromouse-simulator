import { shuffleArray } from "../../lib/commonUtils/arrayUtils";
import { isValidCoord } from "../../lib/mazeUtils/coordinateUtils";
import { createGrid } from "../../lib/mazeUtils/gridUtils";
import { setBoundaryWalls } from "../../lib/mazeUtils/mazeStructureUtils";
import type { Cell, Coordinates, Direction, Maze } from "../../types";
import { carvePassages } from "./recursiveBacktracker";

export function createGeneratedMaze(
  width: number,
  height: number,
  wallsToRemoveFactor: number,
  startX: number,
  startY: number,
  goalCenterX: number,
  goalCenterY: number
): Maze {
  if (width < 2 || height < 2) {
    throw new Error("Maze dimensions must be at least 2x2.");
  }
  if (!isValidCoord({ x: startX, y: startY }, width, height)) {
    throw new Error(`Invalid start coordinates (${startX}, ${startY}) for maze size ${width}x${height}.`);
  }
  wallsToRemoveFactor = Math.max(0, Math.min(1, wallsToRemoveFactor));
  const effectiveGoalCenterX = goalCenterX < 0 ? Math.max(0, Math.min(width - 2, Math.floor(width / 2) - 1)) : Math.max(0, Math.min(width - 2, goalCenterX));
  const effectiveGoalCenterY = goalCenterY < 0 ? Math.max(0, Math.min(height - 2, Math.floor(height / 2) - 1)) : Math.max(0, Math.min(height - 2, goalCenterY));
  const cells = createGrid<Cell>(width, height, (x, y) => ({
    x,
    y,
    north: true,
    east: true,
    south: true,
    west: true,
    distance: Infinity,
    visited: false,
  }));
  const visited = createGrid<boolean>(width, height, () => false);
  carvePassages(startX, startY, cells, visited, width, height);
  const internalWalls: { x: number; y: number; wall: Direction }[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y < height - 1 && cells[y]?.[x]?.south === false && cells[y + 1]?.[x]?.north === false && cells[y]?.[x]?.north) {
        if (y > 0 && cells[y]?.[x]?.south) {
          internalWalls.push({ x, y, wall: "south" as Direction });
        }
        if (x > 0 && cells[y]?.[x]?.west) {
          internalWalls.push({ x, y, wall: "west" as Direction });
        }
      }
    }
  }
  internalWalls.length = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y < height - 1) {
        const cell = cells[y]?.[x];
        const northNeighbor = cells[y + 1]?.[x];
        if (cell && northNeighbor && cell.north /* || northNeighbor.south */) {
          internalWalls.push({ x, y, wall: "north" as Direction });
        }
      }
      if (x < width - 1) {
        const cell = cells[y]?.[x];
        const eastNeighbor = cells[y]?.[x + 1];
        if (cell && eastNeighbor && cell.east /* || eastNeighbor.west */) {
          internalWalls.push({ x, y, wall: "east" as Direction });
        }
      }
    }
  }
  shuffleArray(internalWalls);
  const numInternalWalls = internalWalls.length;
  const wallsToRemoveCount = Math.min(numInternalWalls, Math.floor(numInternalWalls * wallsToRemoveFactor));
  for (let i = 0; i < wallsToRemoveCount; i++) {
    const wallToRemove = internalWalls[i];
    if (!wallToRemove) continue;
    const { x, y, wall } = wallToRemove;
    const currentCell = cells[y]?.[x];
    if (wall === "north" && currentCell?.north) {
      const northNeighbor = cells[y + 1]?.[x];
      if (northNeighbor) {
        currentCell.north = false;
        northNeighbor.south = false;
      }
    } else if (wall === "east" && currentCell?.east) {
      const eastNeighbor = cells[y]?.[x + 1];
      if (eastNeighbor) {
        currentCell.east = false;
        eastNeighbor.west = false;
      }
    }
  }
  const startCell: Coordinates = { x: startX, y: startY };
  const goalArea: Coordinates[] = [
    { x: effectiveGoalCenterX, y: effectiveGoalCenterY },
    { x: effectiveGoalCenterX + 1, y: effectiveGoalCenterY },
    { x: effectiveGoalCenterX, y: effectiveGoalCenterY + 1 },
    { x: effectiveGoalCenterX + 1, y: effectiveGoalCenterY + 1 },
  ].filter((coord) => isValidCoord(coord, width, height));
  if (goalArea.length === 0) {
    const singleGoalX = Math.max(0, Math.min(width - 1, Math.floor(width / 2)));
    const singleGoalY = Math.max(0, Math.min(height - 1, Math.floor(height / 2)));
    if (isValidCoord({ x: singleGoalX, y: singleGoalY }, width, height)) {
      if (singleGoalX !== startX || singleGoalY !== startY) {
        goalArea.push({ x: singleGoalX, y: singleGoalY });
      }
    }
    if (goalArea.length === 0) {
      const fallbackX = width - 1;
      const fallbackY = height - 1;
      if (fallbackX !== startX || fallbackY !== startY) {
        goalArea.push({ x: fallbackX, y: fallbackY });
      } else {
        if (0 !== startX || 0 !== startY) {
          goalArea.push({ x: 0, y: 0 });
        } else {
          if (width > 1) goalArea.push({ x: 1, y: 0 });
          else if (height > 1) goalArea.push({ x: 0, y: 1 });
        }
      }
    }
    if (goalArea.length > 1 && goalArea.some((g) => g.x === startX && g.y === startY)) {
      const nonStartGoal = goalArea.find((g) => g.x !== startX || g.y !== startY);
      if (nonStartGoal) {
        goalArea.length = 0;
        goalArea.push(nonStartGoal);
      }
    }
  }
  const maze: Maze = {
    width,
    height,
    cells,
    startCell,
    goalArea,
  };
  setBoundaryWalls(maze);
  return maze;
}
