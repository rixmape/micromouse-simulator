import { coordsToString } from "../../lib/mazeUtils/coordinateUtils";
import { createInitialKnownMap } from "../../lib/mazeUtils/mazeStructureUtils";
import type { SimulationAction, SimulationState } from "../../types";
import { SimulationPhase } from "../../types";

export const initialSimulationState: SimulationState = {
  simulationPhase: SimulationPhase.IDLE,
  actualMaze: null,
  knownMap: null,
  robotPosition: null,
  visitedCells: new Set<string>(),
  speedRunPath: null,
  canStartSpeedRun: false,
  absoluteShortestPath: null,
};

export function simulationReducer(state: SimulationState = initialSimulationState, action: SimulationAction): SimulationState {
  switch (action.type) {
    case "SET_PHASE":
      return {
        ...state,
        simulationPhase: action.payload,
      };
    case "SET_ACTUAL_MAZE":
      return {
        ...state,
        actualMaze: action.payload,
      };
    case "UPDATE_KNOWN_MAP":
      return {
        ...state,
        knownMap: action.payload,
      };
    case "UPDATE_ROBOT_POSITION":
      return {
        ...state,
        robotPosition: action.payload,
      };
    case "ADD_VISITED_CELL":
      const newVisitedCells = new Set(state.visitedCells);
      newVisitedCells.add(action.payload);
      return {
        ...state,
        visitedCells: newVisitedCells,
      };
    case "SET_SPEED_RUN_PATH":
      return {
        ...state,
        speedRunPath: action.payload,
      };
    case "SET_CAN_START_SPEED_RUN":
      return {
        ...state,
        canStartSpeedRun: action.payload,
      };
    case "SET_ABSOLUTE_PATH":
      return {
        ...state,
        absoluteShortestPath: action.payload,
      };
    case "RESET_SIMULATION":
      const { initialMaze } = action.payload;
      if (!initialMaze?.cells || !initialMaze.startCell) {
        console.error("Reset failed: Invalid initial maze provided.");
        return initialSimulationState;
      }
      const initialKnown = createInitialKnownMap(initialMaze);
      const startPos = initialMaze.startCell;
      const startPosStr = coordsToString(startPos);
      return {
        simulationPhase: SimulationPhase.IDLE,
        actualMaze: initialMaze,
        knownMap: initialKnown,
        robotPosition: { ...startPos },
        visitedCells: new Set([startPosStr]),
        speedRunPath: null,
        canStartSpeedRun: false,
        absoluteShortestPath: null,
      };
    default:
      return state;
  }
}
