import type { Dispatch } from "react";
import { calculateFloodFillDistances } from "../../algorithms/pathfinding/floodfill";
import { coordsToString } from "../../lib/mazeUtils/coordinateUtils";
import { getValidNeighbors, hasWallTowardsNeighbor } from "../../lib/mazeUtils/mazeNavigationUtils";
import { cloneMaze } from "../../lib/mazeUtils/mazeStructureUtils";
import type { Coordinates, Maze, SimulationAction, SimulationState } from "../../types";
import { SimulationPhase } from "../../types";
import { addVisitedCell, setCanStartSpeedRun, setSimulationPhase, updateKnownMap, updateRobotPosition } from "../actions";
import { canStartSpeedRun, isExplorationComplete } from "../validation";
import { performWallDiscovery } from "../wallDiscovery";

function getAllCoordStrings(map: Maze | null): Set<string> {
  if (!map) return new Set();
  const coords = new Set<string>();
  map.cells.forEach((row, y) => row.forEach((_, x) => coords.add(coordsToString({ x, y }))));
  return coords;
}

function calculateDistancesToGoal(map: Maze, allowedCells: Set<string>): Maze {
  const mapCopy = cloneMaze(map);
  calculateFloodFillDistances(mapCopy, allowedCells);
  return mapCopy;
}

function calculateDistancesToStart(map: Maze, allowedCells: Set<string>): Maze {
  const mapCopy = cloneMaze(map);
  if (!mapCopy.goalArea?.length) return mapCopy;
  const originalStart = { ...mapCopy.startCell };
  const originalGoalArea = mapCopy.goalArea.map((g) => ({ ...g }));
  mapCopy.startCell = { ...originalGoalArea[0] };
  mapCopy.goalArea = [originalStart];
  calculateFloodFillDistances(mapCopy, allowedCells);
  mapCopy.startCell = originalStart;
  mapCopy.goalArea = originalGoalArea;
  return mapCopy;
}
function findBestMove(currentMap: Maze, currentPos: Coordinates): Coordinates | null {
  const currentCell = currentMap.cells[currentPos.y]?.[currentPos.x];
  if (!currentCell || currentCell.distance === Infinity) return null;
  let bestNeighbor: Coordinates | null = null;
  let minDistance = currentCell.distance;
  const neighbors = getValidNeighbors(currentMap, currentPos);
  for (const { neighborCoords, moveDef } of neighbors) {
    if (!hasWallTowardsNeighbor(currentMap, currentPos, moveDef)) {
      const neighborCell = currentMap.cells[neighborCoords.y]?.[neighborCoords.x];
      if (neighborCell && neighborCell.distance < minDistance) {
        minDistance = neighborCell.distance;
        bestNeighbor = neighborCoords;
      }
    }
  }
  return bestNeighbor;
}

export function runExplorationStep(state: SimulationState, dispatch: Dispatch<SimulationAction>, actualMaze: Maze | null): void {
  const { knownMap, robotPosition, visitedCells } = state;
  if (!knownMap || !robotPosition || !actualMaze) {
    dispatch(setSimulationPhase(SimulationPhase.IDLE));
    return;
  }
  if (actualMaze.goalArea.some((gc) => gc.x === robotPosition.x && gc.y === robotPosition.y)) {
    const allKnownCells = getAllCoordStrings(knownMap);
    const mapWithDistancesToStart = calculateDistancesToStart(knownMap, allKnownCells);
    dispatch(updateKnownMap(mapWithDistancesToStart));
    dispatch(setSimulationPhase(SimulationPhase.RETURN));
    return;
  }
  const { updatedMap: mapAfterDiscovery, wallsChanged } = performWallDiscovery(robotPosition, knownMap, actualMaze);
  let currentMapToUse = mapAfterDiscovery;
  let mapUpdatedDispatchNeeded = false;
  if (wallsChanged) {
    const allKnownCells = getAllCoordStrings(currentMapToUse);
    currentMapToUse = calculateDistancesToGoal(currentMapToUse, allKnownCells);
    dispatch(updateKnownMap(currentMapToUse));
  } else {
    mapUpdatedDispatchNeeded = true;
  }
  const bestMove = findBestMove(currentMapToUse, robotPosition);
  if (bestMove) {
    dispatch(updateRobotPosition(bestMove));
    dispatch(addVisitedCell(coordsToString(bestMove)));
    if (mapUpdatedDispatchNeeded) {
      dispatch(updateKnownMap(currentMapToUse));
    }
  } else {
    const allKnownCells = getAllCoordStrings(currentMapToUse);
    const mapToRecalculate = calculateDistancesToGoal(currentMapToUse, allKnownCells);
    dispatch(updateKnownMap(mapToRecalculate));
    if (isExplorationComplete(mapToRecalculate, visitedCells)) {
      const speedRunPossible = canStartSpeedRun(mapToRecalculate, visitedCells);
      dispatch(setCanStartSpeedRun(speedRunPossible));
      dispatch(setSimulationPhase(SimulationPhase.IDLE));
    }
  }
}
