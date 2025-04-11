export interface Coordinates {
  x: number;
  y: number;
}

export interface Cell extends Coordinates {
  north: boolean;
  east: boolean;
  south: boolean;
  west: boolean;
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

export interface RobotState {
  position: Coordinates;
  knownMap: Maze;
}

export enum SimulationPhase {
  IDLE = "IDLE",
  EXPLORATION = "EXPLORATION",
  RETURNING_TO_START = "RETURNING_TO_START",
  SPEED_RUN = "SPEED_RUN",
}

export enum Direction {
  NORTH = "NORTH",
  EAST = "EAST",
  SOUTH = "SOUTH",
  WEST = "WEST",
}
