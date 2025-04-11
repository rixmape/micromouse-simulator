import type { Coordinates } from "./coordinates";

export enum Direction {
  North = "north",
  East = "east",
  South = "south",
  West = "west",
}

export interface Cell extends Coordinates {
  [Direction.North]: boolean;
  [Direction.East]: boolean;
  [Direction.South]: boolean;
  [Direction.West]: boolean;
  distance: number;
  visited: boolean;
}

export interface Maze {
  width: number;
  height: number;
  cells: Cell[][];
  startCell: Coordinates;
  goalArea: Coordinates[];
}
