import { Cell, Coordinates, Maze } from "../types";

const MAZE_WIDTH = 16;
const MAZE_HEIGHT = 16;

const START_X = 0;
const START_Y = 0;

const GOAL_CENTER_X = Math.floor(MAZE_WIDTH / 2) - 1;
const GOAL_CENTER_Y = Math.floor(MAZE_HEIGHT / 2) - 1;

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function carvePassages(cx: number, cy: number, cells: Cell[][], visited: boolean[][], width: number, height: number): void {
  visited[cy][cx] = true;

  const neighbors = shuffleArray([
    { nx: cx, ny: cy + 1, wall: "north", neighborWall: "south" },
    { nx: cx + 1, ny: cy, wall: "east", neighborWall: "west" },
    { nx: cx, ny: cy - 1, wall: "south", neighborWall: "north" },
    { nx: cx - 1, ny: cy, wall: "west", neighborWall: "east" },
  ]);

  for (const neighbor of neighbors) {
    const { nx, ny, wall, neighborWall } = neighbor;

    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      if (!visited[ny][nx]) {
        // @ts-ignore - Allow indexing wall keys
        cells[cy][cx][wall] = false;
        // @ts-ignore - Allow indexing wall keys
        cells[ny][nx][neighborWall] = false;
        carvePassages(nx, ny, cells, visited, width, height);
      }
    }
  }
}

export function createDefaultMaze(): Maze {
  const cells: Cell[][] = [];
  const visited: boolean[][] = [];

  for (let y = 0; y < MAZE_HEIGHT; y++) {
    const cellRow: Cell[] = [];
    const visitedRow: boolean[] = [];
    for (let x = 0; x < MAZE_WIDTH; x++) {
      cellRow.push({
        x,
        y,
        north: true,
        east: true,
        south: true,
        west: true,
        distance: Infinity,
        visited: false,
      });
      visitedRow.push(false);
    }
    cells.push(cellRow);
    visited.push(visitedRow);
  }

  for (let y = 0; y < MAZE_HEIGHT; y++) {
    cells[y][0].west = true;
    cells[y][MAZE_WIDTH - 1].east = true;

    if (MAZE_WIDTH > 1) {
      cells[y][0].east = false;
      cells[y][MAZE_WIDTH - 2].east = false;
    }
  }

  for (let x = 0; x < MAZE_WIDTH; x++) {
    cells[0][x].south = true;
    cells[MAZE_HEIGHT - 1][x].north = true;

    if (MAZE_HEIGHT > 1) {
      cells[0][x].north = false;
      cells[MAZE_HEIGHT - 2][x].north = false;
    }
  }

  for (let y = 0; y < MAZE_HEIGHT; y++) {
    for (let x = 0; x < MAZE_WIDTH; x++) {
      cells[y][x].north = true;
      cells[y][x].east = true;
      cells[y][x].south = true;
      cells[y][x].west = true;
      cells[y][x].distance = Infinity;
      cells[y][x].visited = false;
      visited[y][x] = false;
    }
  }

  carvePassages(START_X, START_Y, cells, visited, MAZE_WIDTH, MAZE_HEIGHT);

  const startCell: Coordinates = { x: START_X, y: START_Y };

  const goalArea: Coordinates[] = [
    { x: GOAL_CENTER_X, y: GOAL_CENTER_Y },
    { x: GOAL_CENTER_X + 1, y: GOAL_CENTER_Y },
    { x: GOAL_CENTER_X, y: GOAL_CENTER_Y + 1 },
    { x: GOAL_CENTER_X + 1, y: GOAL_CENTER_Y + 1 },
  ];

  goalArea.forEach((coord) => {
    if (coord.x < 0 || coord.x >= MAZE_WIDTH || coord.y < 0 || coord.y >= MAZE_HEIGHT) {
      throw new Error(`Goal coordinate (${coord.x}, ${coord.y}) is outside maze bounds.`);
    }
  });

  if (startCell.x < 0 || startCell.x >= MAZE_WIDTH || startCell.y < 0 || startCell.y >= MAZE_HEIGHT) {
    throw new Error(`Start coordinate (${startCell.x}, ${startCell.y}) is outside maze bounds.`);
  }

  for (let y = 0; y < MAZE_HEIGHT; y++) {
    cells[y][0].west = true;
    cells[y][MAZE_WIDTH - 1].east = true;
  }

  for (let x = 0; x < MAZE_WIDTH; x++) {
    cells[0][x].south = true;
    cells[MAZE_HEIGHT - 1][x].north = true;
  }

  return {
    width: MAZE_WIDTH,
    height: MAZE_HEIGHT,
    cells,
    startCell,
    goalArea,
  };
}

export function createInitialKnownMap(actualMaze: Maze): Maze {
  const knownCells: Cell[][] = [];
  const { width, height, startCell, goalArea } = actualMaze;

  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      const actualCell = actualMaze.cells[y][x];
      row.push({
        x,
        y,
        north: y === height - 1 ? actualCell.north : false,
        east: x === width - 1 ? actualCell.east : false,
        south: y === 0 ? actualCell.south : false,
        west: x === 0 ? actualCell.west : false,
        distance: Infinity,
        visited: false,
      });
    }
    knownCells.push(row);
  }

  const startActual = actualMaze.cells[startCell.y][startCell.x];
  const startKnown = knownCells[startCell.y][startCell.x];
  startKnown.north = startActual.north;
  startKnown.east = startActual.east;
  startKnown.south = startActual.south;
  startKnown.west = startActual.west;

  return {
    width,
    height,
    cells: knownCells,
    startCell,
    goalArea,
  };
}
