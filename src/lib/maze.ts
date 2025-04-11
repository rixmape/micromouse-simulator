import { Cell, Coordinates, Direction, Maze } from "../types";
import { createGrid, NEIGHBOR_DEFS, setBoundaryWalls, shuffleArray } from "./mazeUtils";

const MAZE_WIDTH = 32;
const MAZE_HEIGHT = 32;
const START_X = 0;
const START_Y = 0;
const GOAL_CENTER_X = Math.floor(MAZE_WIDTH / 2) - 1;
const GOAL_CENTER_Y = Math.floor(MAZE_HEIGHT / 2) - 1;
const WALLS_TO_REMOVE = Math.floor((MAZE_WIDTH * MAZE_HEIGHT) / 10);

function carvePassages(cx: number, cy: number, cells: Cell[][], visited: boolean[][], width: number, height: number): void {
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

export function createDefaultMaze(): Maze {
  const cells = createGrid<Cell>(MAZE_WIDTH, MAZE_HEIGHT, (x, y) => ({
    x,
    y,
    [Direction.North]: true,
    [Direction.East]: true,
    [Direction.South]: true,
    [Direction.West]: true,
    distance: Infinity,
    visited: false,
  }));
  const visited = createGrid<boolean>(MAZE_WIDTH, MAZE_HEIGHT, () => false);
  carvePassages(START_X, START_Y, cells, visited, MAZE_WIDTH, MAZE_HEIGHT);
  const internalWalls: { x: number; y: number; wall: Direction }[] = [];
  for (let y = 0; y < MAZE_HEIGHT; y++) {
    for (let x = 0; x < MAZE_WIDTH; x++) {
      if (y < MAZE_HEIGHT - 1 && cells[y][x][Direction.North]) {
        internalWalls.push({ x, y, wall: Direction.North });
      }
      if (x < MAZE_WIDTH - 1 && cells[y][x][Direction.East]) {
        internalWalls.push({ x, y, wall: Direction.East });
      }
    }
  }
  shuffleArray(internalWalls);
  const wallsToRemoveCount = Math.min(WALLS_TO_REMOVE, internalWalls.length);
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
  ].filter((coord) => coord.x >= 0 && coord.x < MAZE_WIDTH && coord.y >= 0 && coord.y < MAZE_HEIGHT);
  const maze: Maze = {
    width: MAZE_WIDTH,
    height: MAZE_HEIGHT,
    cells,
    startCell,
    goalArea,
  };
  setBoundaryWalls(maze);
  return maze;
}

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
    console.error("Start cell coordinates are invalid for the actual maze dimensions.");
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
