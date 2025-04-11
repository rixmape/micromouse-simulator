import { Coordinates, Direction, Maze, NeighborDefinition } from "../../types";
import { isValidCoord } from "./coordinateUtils";

export const NEIGHBOR_DEFS: Readonly<NeighborDefinition[]> = [
  { dx: 0, dy: 1, wall: Direction.North, neighborWall: Direction.South },
  { dx: 1, dy: 0, wall: Direction.East, neighborWall: Direction.West },
  { dx: 0, dy: -1, wall: Direction.South, neighborWall: Direction.North },
  { dx: -1, dy: 0, wall: Direction.West, neighborWall: Direction.East },
] as const;

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
    return true;
  }
  return cell[moveDef.wall];
}
