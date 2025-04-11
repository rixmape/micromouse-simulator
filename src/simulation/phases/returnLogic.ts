import type { Dispatch } from "react";
import { coordsToString, getAllCoordStrings } from "../../lib/mazeUtils/coordinateUtils";
import { calculateDistancesToStart, findBestMove } from "../../lib/mazeUtils/pathfindingUtils";
import type { Coordinates, CoordinateString, Maze, SimulationAction, SimulationState } from "../../types";
import { SimulationPhase } from "../../types";
import { addVisitedCell, setCanStartSpeedRun, setSimulationPhase, updateKnownMap, updateRobotPosition } from "../actions";
import { canStartSpeedRun } from "../validation";
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
    const { mapToUse, needsDispatch } = _discoverWallsAndUpdateMap(
        state,
        actualMaze,
        calculateDistancesToStart
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
        console.warn("Return phase stuck at:", robotPosition, ". Recalculating distances comprehensively.");
        const allKnownCells = getAllCoordStrings(mapToUse);
        const mapToRecalculate = calculateDistancesToStart(mapToUse, allKnownCells);
        dispatch(updateKnownMap(mapToRecalculate));
        const speedRunPossible = canStartSpeedRun(mapToRecalculate, visitedCells);
        dispatch(setCanStartSpeedRun(speedRunPossible));
        console.error("Ending return phase as robot is stuck even after recalculation.");
        dispatch(setSimulationPhase(SimulationPhase.IDLE));
    }
}
