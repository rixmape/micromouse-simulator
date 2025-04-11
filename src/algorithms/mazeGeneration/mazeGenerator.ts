import { shuffleArray } from "../../lib/commonUtils/arrayUtils";
import { isValidCoord } from "../../lib/mazeUtils/coordinateUtils";
import { createGrid } from "../../lib/mazeUtils/gridUtils";
import { setBoundaryWalls } from "../../lib/mazeUtils/mazeStructureUtils";
import type { Cell, Coordinates, Direction, Maze } from "../../types";
import { carvePassages } from "./recursiveBacktracker";

export function createGeneratedMaze(width: number, height: number, wallsToRemoveFactor: number): Maze {
  if (width < 2 || height < 2) {
    throw new Error("Maze dimensions must be at least 2x2.");
  }
  wallsToRemoveFactor = Math.max(0, Math.min(1, wallsToRemoveFactor));

  const START_X = 0;
  const START_Y = 0;
  const GOAL_CENTER_X = Math.max(0, Math.min(width - 2, Math.floor(width / 2) - 1));
  const GOAL_CENTER_Y = Math.max(0, Math.min(height - 2, Math.floor(height / 2) - 1));

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
  carvePassages(START_X, START_Y, cells, visited, width, height);

  const internalWalls: { x: number; y: number; wall: Direction }[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y < height - 1 && cells[y]?.[x]?.north) {
        internalWalls.push({ x, y, wall: "north" as Direction });
      }
      if (x < width - 1 && cells[y]?.[x]?.east) {
        internalWalls.push({ x, y, wall: "east" as Direction });
      }
    }
  }

  shuffleArray(internalWalls);
  const numInternalWalls = internalWalls.length;
  const wallsToRemoveCount = Math.min(numInternalWalls, Math.floor(numInternalWalls * wallsToRemoveFactor));

  for (let i = 0; i < wallsToRemoveCount; i++) {
    const wallToRemove = internalWalls[i];
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

  const startCell: Coordinates = { x: START_X, y: START_Y };

  const goalArea: Coordinates[] = [
    { x: GOAL_CENTER_X, y: GOAL_CENTER_Y },
    { x: GOAL_CENTER_X + 1, y: GOAL_CENTER_Y },
    { x: GOAL_CENTER_X, y: GOAL_CENTER_Y + 1 },
    { x: GOAL_CENTER_X + 1, y: GOAL_CENTER_Y + 1 },
  ].filter((coord) => isValidCoord(coord, width, height));

  if (goalArea.length === 0) {
    const singleGoalX = Math.floor(width / 2);
    const singleGoalY = Math.floor(height / 2);
    if (isValidCoord({ x: singleGoalX, y: singleGoalY }, width, height)) {
      goalArea.push({ x: singleGoalX, y: singleGoalY });
    } else {
      goalArea.push({ x: width - 1, y: height - 1 });
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
