import type { Dispatch } from "react";
import { coordsToString, getAllCoordStrings } from "../../lib/mazeUtils/coordinateUtils";
import { calculateDistancesToStart, findBestMove } from "../../lib/mazeUtils/pathfindingUtils";
import type { Maze, SimulationAction, SimulationState } from "../../types";
import { SimulationPhase } from "../../types";
import { addVisitedCell, setCanStartSpeedRun, setSimulationPhase, updateKnownMap, updateRobotPosition } from "../actions";
import { canStartSpeedRun } from "../validation";
import { performWallDiscovery } from "../wallDiscovery";

function _discoverWallsAndUpdateMapForReturn(state: SimulationState, actualMaze: Maze): { mapToUse: Maze; needsDispatch: boolean } {
  const { knownMap, robotPosition } = state;
  if (!knownMap || !robotPosition) {
    return { mapToUse: knownMap || actualMaze, needsDispatch: false };
  }
  const { updatedMap: mapAfterDiscovery, wallsChanged } = performWallDiscovery(robotPosition, knownMap, actualMaze);
  let currentMapToUse = mapAfterDiscovery;
  if (wallsChanged) {
    const allKnownCells = getAllCoordStrings(currentMapToUse);
    currentMapToUse = calculateDistancesToStart(currentMapToUse, allKnownCells);
  }
  return { mapToUse: currentMapToUse, needsDispatch: !wallsChanged };
}

export function runReturnStep(state: SimulationState, dispatch: Dispatch<SimulationAction>, actualMaze: Maze | null): void {
  const { knownMap, robotPosition, visitedCells } = state;
  if (!knownMap || !robotPosition || !actualMaze) {
    dispatch(setSimulationPhase(SimulationPhase.IDLE));
    console.error("Return step failed: Missing state (knownMap, robotPosition, or actualMaze).");
    return;
  }
  const { startCell } = knownMap;
  if (robotPosition.x === startCell.x && robotPosition.y === startCell.y) {
    console.log("Start cell reached. Return phase complete.");
    const speedRunPossible = canStartSpeedRun(knownMap, visitedCells);
    dispatch(setCanStartSpeedRun(speedRunPossible));
    dispatch(setSimulationPhase(SimulationPhase.IDLE));
    return;
  }
  const { mapToUse, needsDispatch } = _discoverWallsAndUpdateMapForReturn(state, actualMaze);
  if (!needsDispatch) {
    dispatch(updateKnownMap(mapToUse));
  }
  let bestMove = findBestMove(mapToUse, robotPosition);
  if (!bestMove) {
    console.warn("Return phase potentially stuck at:", robotPosition, ". Recalculating distances comprehensively before retry.");
    const allKnownCells = getAllCoordStrings(mapToUse);
    const mapToRecalculate = calculateDistancesToStart(mapToUse, allKnownCells);
    dispatch(updateKnownMap(mapToRecalculate));
    bestMove = findBestMove(mapToRecalculate, robotPosition);
    if (!bestMove) {
      console.error("Ending return phase: Robot is stuck at", robotPosition, "even after recalculation.");
      const speedRunPossible = canStartSpeedRun(mapToRecalculate, visitedCells);
      dispatch(setCanStartSpeedRun(speedRunPossible));
      dispatch(setSimulationPhase(SimulationPhase.IDLE));
      return;
    }
  }
  if (bestMove) {
    dispatch(updateRobotPosition(bestMove));
    dispatch(addVisitedCell(coordsToString(bestMove)));
    if (needsDispatch) {
      dispatch(updateKnownMap(mapToUse));
    }
  }
}
