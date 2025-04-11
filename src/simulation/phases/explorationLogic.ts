import type { Dispatch } from "react";
import { coordsToString, getAllCoordStrings } from "../../lib/mazeUtils/coordinateUtils";
import { calculateDistancesToGoal, calculateDistancesToStart, findBestMove } from "../../lib/mazeUtils/pathfindingUtils";
import type { CoordinateString, Maze, SimulationAction, SimulationState } from "../../types";
import { SimulationPhase } from "../../types";
import { addVisitedCell, setCanStartSpeedRun, setSimulationPhase, updateKnownMap, updateRobotPosition } from "../actions";
import { canStartSpeedRun, isExplorationComplete } from "../validation";
import { performWallDiscovery } from "../wallDiscovery";

function _discoverWallsAndUpdateMap(
  state: SimulationState,
  actualMaze: Maze,
  distanceCalcFn: (map: Maze, cells: Set<CoordinateString>) => Maze
): { mapToUse: Maze; needsDispatch: boolean } {
  const { knownMap, robotPosition, visitedCells } = state;
  if (!knownMap || !robotPosition || !actualMaze) {
    return { mapToUse: knownMap || actualMaze, needsDispatch: false };
  }
  const { updatedMap: mapAfterDiscovery, wallsChanged } = performWallDiscovery(
    robotPosition,
    knownMap,
    actualMaze
  );
  let currentMapToUse = mapAfterDiscovery;
  let needsDispatch = false;
  if (wallsChanged) {
    currentMapToUse = distanceCalcFn(currentMapToUse, visitedCells);
  } else {
    needsDispatch = true;
  }
  return { mapToUse: currentMapToUse, needsDispatch: !wallsChanged };
}

export function runExplorationStep(state: SimulationState, dispatch: Dispatch<SimulationAction>, actualMaze: Maze | null): void {
  const { knownMap, robotPosition, visitedCells } = state;
  if (!knownMap || !robotPosition || !actualMaze) {
    dispatch(setSimulationPhase(SimulationPhase.IDLE));
    console.error("Exploration step failed: Missing state (knownMap, robotPosition, or actualMaze).");
    return;
  }
  if (actualMaze.goalArea.some((gc) => gc.x === robotPosition.x && gc.y === robotPosition.y)) {
    console.log("Goal reached. Calculating distances to start for RETURN phase.");
    const mapWithDistancesToStart = calculateDistancesToStart(knownMap, visitedCells);
    dispatch(updateKnownMap(mapWithDistancesToStart));
    dispatch(setSimulationPhase(SimulationPhase.RETURN));
    return;
  }
  const { mapToUse, needsDispatch } = _discoverWallsAndUpdateMap(
    state,
    actualMaze,
    calculateDistancesToGoal
  );
  if (!needsDispatch) {
    dispatch(updateKnownMap(mapToUse));
  }
  const bestMove = findBestMove(mapToUse, robotPosition);
  if (bestMove) {
    dispatch(updateRobotPosition(bestMove));
    dispatch(addVisitedCell(coordsToString(bestMove)));
    if (needsDispatch) {
      dispatch(updateKnownMap(mapToUse));
    }
  } else {
    console.warn("Exploration stuck at:", robotPosition, ". Checking if exploration complete.");
    const allKnownCells = getAllCoordStrings(mapToUse);
    const mapToRecalculate = calculateDistancesToGoal(mapToUse, allKnownCells);
    dispatch(updateKnownMap(mapToRecalculate));
    if (isExplorationComplete(mapToRecalculate, visitedCells)) {
      console.log("Exploration complete.");
      const speedRunPossible = canStartSpeedRun(mapToRecalculate, visitedCells);
      dispatch(setCanStartSpeedRun(speedRunPossible));
      dispatch(setSimulationPhase(SimulationPhase.IDLE));
    } else {
      console.log("Exploration not yet complete, attempting next step after recalculation.");
    }
  }
}
