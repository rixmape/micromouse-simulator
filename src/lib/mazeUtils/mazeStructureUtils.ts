import type { Cell, Maze } from "../../types";
import { createGrid } from "./gridUtils";

export function cloneMaze(maze: Maze): Maze {
  const newCells: Cell[][] = [];
  for (let y = 0; y < maze.height; y++) {
    const row: Cell[] = [];
    const sourceRow = maze.cells[y];
    if (sourceRow) {
      for (let x = 0; x < maze.width; x++) {
        if (sourceRow[x]) {
          row.push({ ...sourceRow[x] });
        } else {
          row.push({
            x,
            y,
            north: true,
            east: true,
            south: true,
            west: true,
            distance: Infinity,
            visited: false,
          } as Cell);
        }
      }
    } else {
      for (let x = 0; x < maze.width; x++) {
        row.push({
          x,
          y,
          north: true,
          east: true,
          south: true,
          west: true,
          distance: Infinity,
          visited: false,
        } as Cell);
      }
    }
    newCells.push(row);
  }
  return {
    ...maze,
    cells: newCells,
    startCell: { ...maze.startCell },
    goalArea: maze.goalArea.map((coord) => ({ ...coord })),
  };
}

export function setBoundaryWalls(maze: Maze): void {
  const { width, height, cells } = maze;
  if (height > 0) {
    for (let x = 0; x < width; x++) {
      if (cells[height - 1]?.[x]) {
        cells[height - 1][x].north = true;
      }
    }
  }
  if (height > 0) {
    for (let x = 0; x < width; x++) {
      if (cells[0]?.[x]) {
        cells[0][x].south = true;
      }
    }
  }
  if (width > 0) {
    for (let y = 0; y < height; y++) {
      if (cells[y]?.[0]) {
        cells[y][0].west = true;
      }
    }
  }
  if (width > 0) {
    for (let y = 0; y < height; y++) {
      if (cells[y]?.[width - 1]) {
        cells[y][width - 1].east = true;
      }
    }
  }
}

export function createInitialKnownMap(actualMaze: Maze): Maze {
  const { width, height, startCell, goalArea } = actualMaze;
  const knownCells = createGrid<Cell>(width, height, (x, y) => ({
    x,
    y,
    north: false,
    east: false,
    south: false,
    west: false,
    distance: Infinity,
    visited: false,
  }));
  const startActual = actualMaze.cells[startCell.y]?.[startCell.x];
  const startKnown = knownCells[startCell.y]?.[startCell.x];
  if (startActual && startKnown) {
    startKnown.north = startActual.north;
    startKnown.east = startActual.east;
    startKnown.south = startActual.south;
    startKnown.west = startActual.west;
    startKnown.visited = true;
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
