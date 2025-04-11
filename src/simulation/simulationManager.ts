import type { Dispatch, RefObject } from "react";
import type { Maze, SimulationAction, SimulationState } from "../types";
import { SimulationPhase } from "../types";
import { setSimulationPhase } from "./actions";
import { runExplorationStep } from "./phases/explorationLogic";
import { runReturnStep } from "./phases/returnLogic";
import { runSpeedRunStep } from "./phases/speedRunLogic";

export function runSimulationStep(
  state: SimulationState,
  dispatch: Dispatch<SimulationAction>,
  actualMaze: Maze | null,
  speedRunIndexRef: RefObject<number>
): void {
  switch (state.simulationPhase) {
    case SimulationPhase.EXPLORATION:
      runExplorationStep(state, dispatch, actualMaze);
      break;
    case SimulationPhase.RETURN:
      runReturnStep(state, dispatch, actualMaze);
      break;
    case SimulationPhase.SPEED_RUN:
      const nextIndex = runSpeedRunStep(state, dispatch, speedRunIndexRef.current ?? 0);
      if (speedRunIndexRef.current !== null) {
          speedRunIndexRef.current = nextIndex;
      }
      break;
    case SimulationPhase.IDLE:
      break;
    default:
      console.warn("runSimulationStep called with unknown phase:", state.simulationPhase);
      dispatch(setSimulationPhase(SimulationPhase.IDLE));
      break;
  }
}
