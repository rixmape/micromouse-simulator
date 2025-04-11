import { Cell, Coordinates, Direction, Maze, NeighborDefinition } from "../types";

export const NEIGHBOR_DEFS: Readonly<NeighborDefinition[]> = [
  { dx: 0, dy: 1, wall: Direction.North, neighborWall: Direction.South },
  { dx: 1, dy: 0, wall: Direction.East, neighborWall: Direction.West },
  { dx: 0, dy: -1, wall: Direction.South, neighborWall: Direction.North },
  { dx: -1, dy: 0, wall: Direction.West, neighborWall: Direction.East },
] as const;

export function isValidCoord(coords: Coordinates, width: number, height: number): boolean {
  return coords.x >= 0 && coords.x < width && coords.y >= 0 && coords.y < height;
}

export function getValidNeighbors(maze: Maze, coords: Coordinates): { neighborCoords: Coordinates; moveDef: NeighborDefinition }[] {
  const validNeighbors: { neighborCoords: Coordinates; moveDef: NeighborDefinition }[] = [];
  const { width, height } = maze;
  for (const moveDef of NEIGHBOR_DEFS) {
    const neighborCoords: Coordinates = {
      x: coords.x + moveDef.dx,
      y: coords.y + moveDef.dy,
    };
    if (isValidCoord(neighborCoords, width, height)) {
      validNeighbors.push({ neighborCoords, moveDef });
    }
  }
  return validNeighbors;
}

export function hasWallTowardsNeighbor(maze: Maze, cellCoords: Coordinates, moveDef: NeighborDefinition): boolean {
  const cell = maze.cells[cellCoords.y]?.[cellCoords.x];
  if (!cell) {
    console.error("Attempted to check wall on invalid cell:", cellCoords);
    return true;
  }
  return cell[moveDef.wall];
}

export function setBoundaryWalls(maze: Maze): void {
  const { width, height, cells } = maze;
  for (let y = 0; y < height; y++) {
    if (cells[y]?.[0]) cells[y][0].west = true;
    if (cells[y]?.[width - 1]) cells[y][width - 1].east = true;
  }
  for (let x = 0; x < width; x++) {
    if (cells[0]?.[x]) cells[0][x].south = true;
    if (cells[height - 1]?.[x]) cells[height - 1][x].north = true;
  }
}

export function cloneMaze(maze: Maze): Maze {
  const newCells: Cell[][] = [];
  for (let y = 0; y < maze.height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < maze.width; x++) {
      row.push({ ...maze.cells[y][x] });
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

export function coordsToString(coords: Coordinates): string {
  return `${coords.x}-${coords.y}`;
}

export function stringToCoords(str: string): Coordinates | null {
  if (typeof str !== "string") return null;
  const parts = str.split("-");
  if (parts.length === 2) {
    const x = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);
    if (!isNaN(x) && !isNaN(y)) {
      return { x, y };
    }
  }
  console.warn(`Failed to parse coordinates from string: "${str}"`);
  return null;
}

export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function createGrid<T>(width: number, height: number, initializer: (x: number, y: number) => T): T[][] {
  const grid: T[][] = [];
  for (let y = 0; y < height; y++) {
    const row: T[] = [];
    for (let x = 0; x < width; x++) {
      row.push(initializer(x, y));
    }
    grid.push(row);
  }
  return grid;
}
