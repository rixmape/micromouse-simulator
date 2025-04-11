import type { Direction } from "./maze";

export interface NeighborDefinition {
  dx: number;
  dy: number;
  wall: Direction;
  neighborWall: Direction;
}
