import type { Cell, Maze } from "../../types";
import { createGrid } from "./gridUtils";

export function cloneMaze(maze: Maze): Maze {
  const newCells: Cell[][] = [];
  for (let y = 0; y < maze.height; y++) {
    const row: Cell[] = [];
    const sourceRow = maze.cells[y];
    if (sourceRow) {
      for (let x = 0; x < maze.width; x++) {
        const sourceCell = sourceRow[x];
        if (sourceCell) {
          row.push({ ...sourceCell });
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
    const topRow = cells[height - 1];
    if (topRow) {
      for (let x = 0; x < width; x++) {
        if (topRow[x]) {
          topRow[x].north = true;
        }
      }
    }
  }
  if (height > 0) {
    const bottomRow = cells[0];
    if (bottomRow) {
      for (let x = 0; x < width; x++) {
        if (bottomRow[x]) {
          bottomRow[x].south = true;
        }
      }
    }
  }
  if (width > 0) {
    for (let y = 0; y < height; y++) {
      const cell = cells[y]?.[0];
      if (cell) {
        cell.west = true;
      }
    }
  }
  if (width > 0) {
    for (let y = 0; y < height; y++) {
      const cell = cells[y]?.[width - 1];
      if (cell) {
        cell.east = true;
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
  const actualStartCell = actualMaze.cells[startCell.y]?.[startCell.x];
  const knownStartCell = knownCells[startCell.y]?.[startCell.x];
  if (actualStartCell && knownStartCell) {
    knownStartCell.north = actualStartCell.north;
    knownStartCell.east = actualStartCell.east;
    knownStartCell.south = actualStartCell.south;
    knownStartCell.west = actualStartCell.west;
    knownStartCell.visited = true;
  } else {
    console.error("Start cell coordinates are invalid for the given maze dimensions.");
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
