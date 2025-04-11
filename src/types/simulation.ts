import type { Coordinates, CoordinateString } from "./coordinates";
import type { Maze } from "./maze";

export enum SimulationPhase {
  IDLE = "IDLE",
  EXPLORATION = "EXPLORATION",
  RETURN = "RETURN",
  SPEED_RUN = "SPEED_RUN",
}

export interface SimulationCoreProps {
  initialWidth: number;
  initialHeight: number;
  initialFactor: number;
  initialStartX: number;
  initialStartY: number;
  initialGoalCenterX: number;
  initialGoalCenterY: number;
}

export interface SimulationState {
  simulationPhase: SimulationPhase;
  actualMaze: Maze | null;
  knownMap: Maze | null;
  robotPosition: Coordinates | null;
  visitedCells: Set<CoordinateString>;
  speedRunPath: Coordinates[] | null;
  canStartSpeedRun: boolean;
  absoluteShortestPath: Coordinates[] | null;
}

export type SimulationAction =
  | { type: "SET_PHASE"; payload: SimulationPhase }
  | { type: "SET_ACTUAL_MAZE"; payload: Maze }
  | { type: "UPDATE_KNOWN_MAP"; payload: Maze }
  | { type: "UPDATE_ROBOT_POSITION"; payload: Coordinates }
  | { type: "ADD_VISITED_CELL"; payload: CoordinateString }
  | { type: "SET_SPEED_RUN_PATH"; payload: Coordinates[] | null }
  | { type: "SET_CAN_START_SPEED_RUN"; payload: boolean }
  | { type: "SET_ABSOLUTE_PATH"; payload: Coordinates[] | null }
  | { type: "RESET_SIMULATION"; payload: { initialMaze: Maze } };
