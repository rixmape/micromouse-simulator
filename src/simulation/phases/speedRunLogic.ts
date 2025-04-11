import type { Dispatch } from "react";
import type { SimulationAction, SimulationState } from "../../types";
import { SimulationPhase } from "../../types";
import { setSimulationPhase, updateRobotPosition } from "../actions";

export function runSpeedRunStep(state: SimulationState, dispatch: Dispatch<SimulationAction>, currentIndex: number): number {
  const { speedRunPath } = state;
  if (!speedRunPath) {
    dispatch(setSimulationPhase(SimulationPhase.IDLE));
    return currentIndex;
  }
  if (currentIndex >= speedRunPath.length) {
    dispatch(setSimulationPhase(SimulationPhase.IDLE));
    return currentIndex;
  }
  const nextPos = speedRunPath[currentIndex];
  dispatch(updateRobotPosition(nextPos));
  return currentIndex + 1;
}
