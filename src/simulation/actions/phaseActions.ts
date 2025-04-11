import type { Coordinates, Maze, SimulationAction, SimulationPhase } from "../../types";

export function setSimulationPhase(phase: SimulationPhase): SimulationAction {
  return {
    type: "SET_PHASE",
    payload: phase,
  };
}

export function setCanStartSpeedRun(canStart: boolean): SimulationAction {
  return {
    type: "SET_CAN_START_SPEED_RUN",
    payload: canStart,
  };
}

export function setSpeedRunPath(path: Coordinates[] | null): SimulationAction {
  return {
    type: "SET_SPEED_RUN_PATH",
    payload: path,
  };
}

export function resetSimulation(initialMaze: Maze): SimulationAction {
  return {
    type: "RESET_SIMULATION",
    payload: { initialMaze },
  };
}
