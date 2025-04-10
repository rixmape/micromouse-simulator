/**
 * Represents coordinates in the maze grid.
 */
export interface Coordinates {
  x: number;
  y: number;
}

/**
 * Represents a single cell within the maze grid.
 */
export interface Cell extends Coordinates {
  north: boolean;
  east: boolean;
  south: boolean;
  west: boolean;
  distance: number;
  visited: boolean;
}

/**
 * Represents the entire maze structure.
 */
export interface Maze {
  width: number;
  height: number;
  cells: Cell[][];
  startCell: Coordinates;
  goalArea: Coordinates[];
}

/**
 * Represents the state of the robot.
 */
export interface RobotState {
  position: Coordinates;
  knownMap: Maze;
}

/**
 * Defines the possible phases of the simulation workflow. [cite: 19, 20, 27, 32]
 */
export enum SimulationPhase {
  IDLE = "IDLE",
  EXPLORATION = "EXPLORATION",
  SPEED_RUN = "SPEED_RUN",
}

/**
 * Defines the possible directions of movement or wall locations relative to a cell.
 */
export enum Direction {
  NORTH = "NORTH",
  EAST = "EAST",
  SOUTH = "SOUTH",
  WEST = "WEST",
}
