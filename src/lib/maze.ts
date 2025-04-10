import { Cell, Coordinates, Maze } from "../types";

const MAZE_WIDTH = 16;
const MAZE_HEIGHT = 16;

const START_X = 0;
const START_Y = 0;

const GOAL_CENTER_X = Math.floor(MAZE_WIDTH / 2) - 1;
const GOAL_CENTER_Y = Math.floor(MAZE_HEIGHT / 2) - 1;

export function createDefaultMaze(): Maze {
  const cells: Cell[][] = [];

  for (let y = 0; y < MAZE_HEIGHT; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < MAZE_WIDTH; x++) {
      row.push({
        x,
        y,
        north: false,
        east: false,
        south: false,
        west: false,
        distance: Infinity,
        visited: false,
      });
    }
    cells.push(row);
  }

  for (let y = 0; y < MAZE_HEIGHT; y++) {
    cells[y][0].west = true;
    cells[y][MAZE_WIDTH - 1].east = true;
  }

  for (let x = 0; x < MAZE_WIDTH; x++) {
    cells[0][x].south = true;
    cells[MAZE_HEIGHT - 1][x].north = true;
  }

  const addWall = (x1: number, y1: number, x2: number, y2: number) => {
    if (x1 < 0 || x1 >= MAZE_WIDTH || y1 < 0 || y1 >= MAZE_HEIGHT || x2 < 0 || x2 >= MAZE_WIDTH || y2 < 0 || y2 >= MAZE_HEIGHT) {
      console.warn(`Attempted to add wall outside bounds: (${x1},${y1}) to (${x2},${y2})`);
      return;
    }

    if (x1 === x2) {
      if (y1 < y2) {
        cells[y1][x1].north = true;
        cells[y2][x2].south = true;
      } else {
        cells[y1][x1].south = true;
        cells[y2][x2].north = true;
      }
    } else if (y1 === y2) {
      if (x1 < x2) {
        cells[y1][x1].east = true;
        cells[y2][x2].west = true;
      } else {
        cells[y1][x1].west = true;
        cells[y2][x2].east = true;
      }
    }
  };

  for (let y = 5; y < 11; y++) {
    addWall(5, y, 6, y);
    addWall(9, y, 10, y);
  }

  for (let x = 6; x < 10; x++) {
    addWall(x, 8, x, 7);
  }

  addWall(0, 1, 1, 1);
  addWall(1, 0, 1, 1);

  const gx = GOAL_CENTER_X;
  const gy = GOAL_CENTER_Y;
  addWall(gx - 1, gy, gx, gy);
  addWall(gx - 1, gy + 1, gx, gy + 1);
  addWall(gx + 2, gy, gx + 1, gy);
  addWall(gx + 2, gy + 1, gx + 1, gy + 1);
  addWall(gx, gy - 1, gx, gy);
  addWall(gx + 1, gy - 1, gx + 1, gy);

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
