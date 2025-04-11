export interface Coordinates {
  x: number;
  y: number;
}

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

export interface NeighborDefinition {
  dx: number;
  dy: number;
  wall: Direction;
  neighborWall: Direction;
}

export enum SimulationPhase {
  IDLE = "IDLE",
  EXPLORATION = "EXPLORATION",
  RETURN = "RETURN",
  SPEED_RUN = "SPEED_RUN",
}

export interface RobotState {
  position: Coordinates;
  knownMap: Maze;
}
