import { Cell, Coordinates, Direction, Maze } from "../types";
import { createGrid, isValidCoord, NEIGHBOR_DEFS, setBoundaryWalls, shuffleArray } from "./mazeUtils";

function carvePassages(
  cx: number,
  cy: number,
  cells: Cell[][],
  visited: boolean[][],
  width: number,
  height: number
): void {
  visited[cy][cx] = true;
  const neighbors = shuffleArray([...NEIGHBOR_DEFS]);
  for (const neighbor of neighbors) {
    const { nx, ny, wall, neighborWall } = {
      nx: cx + neighbor.dx,
      ny: cy + neighbor.dy,
      wall: neighbor.wall,
      neighborWall: neighbor.neighborWall,
    };
    if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx]) {
      cells[cy][cx][wall] = false;
      cells[ny][nx][neighborWall] = false;
      carvePassages(nx, ny, cells, visited, width, height);
    }
  }
}

export function createDefaultMaze(width: number, height: number, wallsToRemoveFactor: number): Maze {
  if (width < 2 || height < 2) {
    throw new Error("Maze dimensions must be at least 2x2.");
  }
  if (wallsToRemoveFactor < 0 || wallsToRemoveFactor > 1) {
    console.warn("wallsToRemoveFactor should be between 0 and 1. Clamping value.");
    wallsToRemoveFactor = Math.max(0, Math.min(1, wallsToRemoveFactor));
  }
  const START_X = 0;
  const START_Y = 0;
  const GOAL_CENTER_X = Math.max(0, Math.min(width - 2, Math.floor(width / 2) - 1));
  const GOAL_CENTER_Y = Math.max(0, Math.min(height - 2, Math.floor(height / 2) - 1));
  const cells = createGrid<Cell>(width, height, (x, y) => ({
    x,
    y,
    [Direction.North]: true,
    [Direction.East]: true,
    [Direction.South]: true,
    [Direction.West]: true,
    distance: Infinity,
    visited: false,
  }));
  const visited = createGrid<boolean>(width, height, () => false);
  carvePassages(START_X, START_Y, cells, visited, width, height);
  const internalWalls: { x: number; y: number; wall: Direction }[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y < height - 1 && cells[y][x][Direction.North]) {
        internalWalls.push({ x, y, wall: Direction.North });
      }
      if (x < width - 1 && cells[y][x][Direction.East]) {
        internalWalls.push({ x, y, wall: Direction.East });
      }
    }
  }
  shuffleArray(internalWalls);
  const numInternalWalls = internalWalls.length;
  const wallsToRemoveCount = Math.min(
    numInternalWalls,
    Math.floor(numInternalWalls * wallsToRemoveFactor)
  );
  for (let i = 0; i < wallsToRemoveCount; i++) {
    const wallToRemove = internalWalls[i];
    const { x, y, wall } = wallToRemove;
    if (wall === Direction.North && cells[y]?.[x]?.[Direction.North]) {
      if (cells[y + 1]?.[x]) {
        cells[y][x][Direction.North] = false;
        cells[y + 1][x][Direction.South] = false;
      }
    } else if (wall === Direction.East && cells[y]?.[x]?.[Direction.East]) {
      if (cells[y]?.[x + 1]) {
        cells[y][x][Direction.East] = false;
        cells[y][x + 1][Direction.West] = false;
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
    console.warn("Calculated goal area resulted in no valid cells. Placing goal near center.");
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
  console.log(
    `Generated ${width}x${height} maze. Goal area centers around (${GOAL_CENTER_X}, ${GOAL_CENTER_Y}). Removed ${wallsToRemoveCount} internal walls.`
  );
  return maze;
}
/**
 * Creates the initial "known map" for the robot based on an actual maze structure.
 * This map initially only reveals boundary walls and the walls directly adjacent
 * to the start cell. All other cells are assumed to have no internal walls.
 * @param actualMaze The complete, actual maze structure.
 * @returns A new Maze object representing the robot's initial knowledge.
 */
export function createInitialKnownMap(actualMaze: Maze): Maze {
  const { width, height, startCell, goalArea } = actualMaze;
  const knownCells = createGrid<Cell>(width, height, (x, y) => ({
    x,
    y,
    [Direction.North]: false,
    [Direction.East]: false,
    [Direction.South]: false,
    [Direction.West]: false,
    distance: Infinity,
    visited: false,
  }));
  const startActual = actualMaze.cells[startCell.y]?.[startCell.x];
  const startKnown = knownCells[startCell.y]?.[startCell.x];
  if (startActual && startKnown) {
    startKnown[Direction.North] = startActual[Direction.North];
    startKnown[Direction.East] = startActual[Direction.East];
    startKnown[Direction.South] = startActual[Direction.South];
    startKnown[Direction.West] = startActual[Direction.West];
  } else {
    console.error("Start cell coordinates are invalid for the actual maze dimensions during known map creation.");
  }
  const knownMap: Maze = {
    width,
    height,
    cells: knownCells,
    startCell: { ...startCell },
    goalArea: goalArea.map((coord) => ({ ...coord })),
  };
  setBoundaryWalls(knownMap);
  return knownMap;
}
