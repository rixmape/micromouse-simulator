import { useCallback, useEffect, useRef, useState } from "react";
import { calculateFloodFillDistances, findShortestPath } from "../lib/floodfill";
import { createInitialKnownMap } from "../lib/maze";
import { cloneMaze, coordsToString, getValidNeighbors, hasWallTowardsNeighbor, stringToCoords } from "../lib/mazeUtils";
import { Coordinates, Maze, SimulationPhase } from "../types";

export function useMicromouseSimulation(initialActualMaze: Maze | null, simulationDelay: number) {
  const [actualMaze, setActualMaze] = useState<Maze | null>(null);
  const [knownMap, setKnownMap] = useState<Maze | null>(null);
  const [robotPosition, setRobotPosition] = useState<Coordinates | null>(null);
  const [simulationPhase, setSimulationPhase] = useState<SimulationPhase>(SimulationPhase.IDLE);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set());
  const [speedRunPath, setSpeedRunPath] = useState<Coordinates[] | null>(null);
  const [canStartSpeedRun, setCanStartSpeedRun] = useState<boolean>(false);
  const [absoluteShortestPath, setAbsoluteShortestPath] = useState<Coordinates[] | null>(null);
  const simulationTimerIdRef = useRef<NodeJS.Timeout | null>(null);
  const speedRunPathIndexRef = useRef<number>(0);
  const clearSimulationTimer = useCallback(() => {
    if (simulationTimerIdRef.current) {
      clearTimeout(simulationTimerIdRef.current);
      simulationTimerIdRef.current = null;
    }
  }, []);
  const getAllCoordStrings = useCallback((map: Maze | null): Set<string> => {
    if (!map) return new Set();
    const coords = new Set<string>();
    map.cells.forEach((row, y) => row.forEach((_, x) => coords.add(coordsToString({ x, y }))));
    return coords;
  }, []);
  const resetSimulationState = useCallback(
    (baseMaze: Maze) => {
      console.log("Resetting simulation state...");
      clearSimulationTimer();
      const initialKnown = createInitialKnownMap(baseMaze);
      const startPos = { ...baseMaze.startCell };
      const startPosStr = coordsToString(startPos);
      setKnownMap(initialKnown);
      setRobotPosition(startPos);
      setVisitedCells(new Set([startPosStr]));
      setSpeedRunPath(null);
      setSimulationPhase(SimulationPhase.IDLE);
      setCanStartSpeedRun(false);
      setAbsoluteShortestPath(null);
      speedRunPathIndexRef.current = 0;
    },
    [clearSimulationTimer]
  );
  const calculateDistancesToGoal = useCallback((map: Maze, allowedCells: Set<string>): Maze => {
    const mapCopy = cloneMaze(map);
    calculateFloodFillDistances(mapCopy, allowedCells);
    return mapCopy;
  }, []);
  const calculateDistancesToStart = useCallback((map: Maze, allowedCells: Set<string>): Maze => {
    const mapCopy = cloneMaze(map);
    if (!mapCopy.goalArea || mapCopy.goalArea.length === 0) {
      console.error("Cannot calculate distances to start: Goal area is missing or empty.");
      return mapCopy;
    }
    const originalStart = { ...mapCopy.startCell };
    const originalGoalArea: Coordinates[] = mapCopy.goalArea.map((g) => ({ ...g }));
    mapCopy.startCell = { ...originalGoalArea[0] };
    mapCopy.goalArea = [originalStart];
    calculateFloodFillDistances(mapCopy, allowedCells);
    mapCopy.startCell = originalStart;
    mapCopy.goalArea = originalGoalArea;
    return mapCopy;
  }, []);
  const checkAndEnableSpeedRun = useCallback(
    (currentKnownMap: Maze | null, currentVisitedCells: Set<string>) => {
      if (!currentKnownMap) return;
      const mapForCheck = calculateDistancesToGoal(cloneMaze(currentKnownMap), currentVisitedCells);
      const path = findShortestPath(mapForCheck);
      const pathFound =
        path.length > 0 &&
        path[0].x === mapForCheck.startCell.x &&
        path[0].y === mapForCheck.startCell.y &&
        mapForCheck.goalArea.some((g) => g.x === path[path.length - 1].x && g.y === path[path.length - 1].y);
      setCanStartSpeedRun(pathFound);
      if (pathFound) {
        console.log("Speed run possible: Path found within visited cells.");
      } else {
        console.log("Speed run not possible: No path found within visited cells.");
      }
    },
    [calculateDistancesToGoal]
  );
  const performWallDiscoveryAndUpdateMap = useCallback(
    (currentKnownMap: Maze, currentPos: Coordinates): { updatedMap: Maze; wallsChanged: boolean } => {
      if (!actualMaze) {
        console.error("Internal actual maze data not available for wall discovery.");
        return { updatedMap: currentKnownMap, wallsChanged: false };
      }
      let wallsChanged = false;
      const mapCopy = cloneMaze(currentKnownMap);
      const actualCell = actualMaze.cells[currentPos.y]?.[currentPos.x];
      const knownCell = mapCopy.cells[currentPos.y]?.[currentPos.x];
      if (!actualCell || !knownCell) {
        console.error("Invalid robot position for wall discovery:", currentPos);
        return { updatedMap: mapCopy, wallsChanged: false };
      }
      const neighbors = getValidNeighbors(actualMaze, currentPos);
      for (const { neighborCoords, moveDef } of neighbors) {
        const knownNeighborCell = mapCopy.cells[neighborCoords.y]?.[neighborCoords.x];
        const actualWallExists = actualCell[moveDef.wall];
        if (knownCell[moveDef.wall] !== actualWallExists) {
          knownCell[moveDef.wall] = actualWallExists;
          if (knownNeighborCell) {
            knownNeighborCell[moveDef.neighborWall] = actualWallExists;
          }
          wallsChanged = true;
        }
      }
      return { updatedMap: mapCopy, wallsChanged };
    },
    [actualMaze]
  );
  const findBestMove = useCallback((currentMap: Maze, currentPos: Coordinates): Coordinates | null => {
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
  }, []);
  const isExplorationComplete = useCallback((map: Maze | null, visited: Set<string>): boolean => {
    if (!map) return true;
    for (const visitedCoordStr of visited) {
      const currentCoords = stringToCoords(visitedCoordStr);
      if (!currentCoords) continue;
      const neighbors = getValidNeighbors(map, currentCoords);
      for (const { neighborCoords, moveDef } of neighbors) {
        if (!hasWallTowardsNeighbor(map, currentCoords, moveDef)) {
          const neighborCoordStr = coordsToString(neighborCoords);
          if (!visited.has(neighborCoordStr)) {
            return false;
          }
        }
      }
    }
    console.log("Exploration appears complete (no unvisited reachable neighbors).");
    return true;
  }, []);
  const handleStuckRobot = useCallback(
    (currentMap: Maze, currentVisited: Set<string>, currentPhase: SimulationPhase) => {
      console.log(`Robot stuck during ${currentPhase} at:`, robotPosition);
      let mapToRecalculate = cloneMaze(currentMap);
      console.log(`Forcing recalculation using all known cells...`);
      const allKnownCells = getAllCoordStrings(mapToRecalculate);
      if (currentPhase === SimulationPhase.EXPLORATION) {
        mapToRecalculate = calculateDistancesToGoal(mapToRecalculate, allKnownCells);
      } else if (currentPhase === SimulationPhase.RETURN) {
        mapToRecalculate = calculateDistancesToStart(mapToRecalculate, allKnownCells);
      }
      setKnownMap(mapToRecalculate);
      if (isExplorationComplete(mapToRecalculate, currentVisited)) {
        console.log(`Exploration complete check passed after getting stuck. Going IDLE.`);
        setSimulationPhase(SimulationPhase.IDLE);
        checkAndEnableSpeedRun(mapToRecalculate, currentVisited);
      } else {
        console.log("Recalculation done, but exploration not yet complete. Robot should attempt move again in the next step.");
      }
    },
    [robotPosition, getAllCoordStrings, calculateDistancesToGoal, calculateDistancesToStart, checkAndEnableSpeedRun, isExplorationComplete]
  );
  const explorationStep = useCallback(() => {
    if (!actualMaze || !knownMap || !robotPosition || !visitedCells) {
      console.warn("Exploration step called with invalid state. Setting phase to IDLE.");
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }
    if (actualMaze.goalArea.some((gc) => gc.x === robotPosition.x && gc.y === robotPosition.y)) {
      console.log("Goal reached during exploration! Switching to RETURN phase...");
      const allKnownCells = getAllCoordStrings(knownMap);
      const mapWithDistancesToStart = calculateDistancesToStart(knownMap, allKnownCells);
      setKnownMap(mapWithDistancesToStart);
      setSimulationPhase(SimulationPhase.RETURN);
      return;
    }
    const { updatedMap: mapAfterDiscovery, wallsChanged } = performWallDiscoveryAndUpdateMap(knownMap, robotPosition);
    let currentMapToUse = mapAfterDiscovery;
    if (wallsChanged) {
      console.log("Walls updated during exploration, recalculating distances to goal...");
      const allKnownCells = getAllCoordStrings(currentMapToUse);
      currentMapToUse = calculateDistancesToGoal(currentMapToUse, allKnownCells);
    }
    const bestMove = findBestMove(currentMapToUse, robotPosition);
    setKnownMap(currentMapToUse);
    if (bestMove) {
      setRobotPosition(bestMove);
      setVisitedCells((prev) => new Set(prev).add(coordsToString(bestMove)));
    } else {
      handleStuckRobot(currentMapToUse, visitedCells, SimulationPhase.EXPLORATION);
    }
  }, [
    actualMaze,
    knownMap,
    robotPosition,
    visitedCells,
    getAllCoordStrings,
    calculateDistancesToStart,
    performWallDiscoveryAndUpdateMap,
    calculateDistancesToGoal,
    findBestMove,
    handleStuckRobot,
  ]);
  const returningToStartStep = useCallback(() => {
    if (!actualMaze || !knownMap || !robotPosition || !visitedCells) {
      console.warn("Return step called with invalid state. Setting phase to IDLE.");
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }
    const { startCell } = knownMap;
    if (robotPosition.x === startCell.x && robotPosition.y === startCell.y) {
      console.log("Returned to start cell. Exploration cycle complete. Going IDLE.");
      checkAndEnableSpeedRun(knownMap, visitedCells);
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }
    const { updatedMap: mapAfterDiscovery, wallsChanged } = performWallDiscoveryAndUpdateMap(knownMap, robotPosition);
    let currentMapToUse = mapAfterDiscovery;
    if (wallsChanged) {
      console.log("Walls updated during return, recalculating distances to start...");
      const allKnownCells = getAllCoordStrings(currentMapToUse);
      currentMapToUse = calculateDistancesToStart(currentMapToUse, allKnownCells);
    }
    const bestMove = findBestMove(currentMapToUse, robotPosition);
    setKnownMap(currentMapToUse);
    if (bestMove) {
      setRobotPosition(bestMove);
      setVisitedCells((prev) => new Set(prev).add(coordsToString(bestMove)));
    } else {
      handleStuckRobot(currentMapToUse, visitedCells, SimulationPhase.RETURN);
    }
  }, [
    actualMaze,
    knownMap,
    robotPosition,
    visitedCells,
    checkAndEnableSpeedRun,
    performWallDiscoveryAndUpdateMap,
    getAllCoordStrings,
    calculateDistancesToStart,
    findBestMove,
    handleStuckRobot,
  ]);
  const speedRunStep = useCallback(() => {
    if (!speedRunPath || !robotPosition) {
      console.warn("Speed run step called with invalid state. Setting phase to IDLE.");
      setSimulationPhase(SimulationPhase.IDLE);
      setAbsoluteShortestPath(null);
      return;
    }
    const currentIndex = speedRunPathIndexRef.current;
    if (currentIndex >= speedRunPath.length) {
      console.log("Speed run path completed.");
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }
    const nextPos = speedRunPath[currentIndex];
    setRobotPosition(nextPos);
    speedRunPathIndexRef.current += 1;
    if (speedRunPathIndexRef.current >= speedRunPath.length) {
      console.log("Speed run reached end of calculated path.");
    }
  }, [speedRunPath, robotPosition]);
  const handleStartExploration = useCallback(() => {
    if (simulationPhase !== SimulationPhase.IDLE || !knownMap || !robotPosition) {
      console.warn("Cannot start exploration - simulation not idle or map/position missing.");
      return;
    }
    console.log("Starting exploration...");
    const startPos = knownMap.startCell;
    const startPosStr = coordsToString(startPos);
    setRobotPosition({ ...startPos });
    setVisitedCells(new Set([startPosStr]));
    setSpeedRunPath(null);
    setCanStartSpeedRun(false);
    setAbsoluteShortestPath(null);
    speedRunPathIndexRef.current = 0;
    const allKnownCells = getAllCoordStrings(knownMap);
    const mapForExploration = calculateDistancesToGoal(knownMap, allKnownCells);
    setKnownMap(mapForExploration);
    setSimulationPhase(SimulationPhase.EXPLORATION);
  }, [simulationPhase, knownMap, robotPosition, getAllCoordStrings, calculateDistancesToGoal]);
  const handleStartSpeedRun = useCallback(() => {
    if (simulationPhase !== SimulationPhase.IDLE || !canStartSpeedRun || !knownMap || !visitedCells || !actualMaze) {
      console.warn("Speed run start conditions not met.", {
        phase: simulationPhase,
        canStart: canStartSpeedRun,
        hasKnown: !!knownMap,
        hasVisited: !!visitedCells,
        hasActual: !!actualMaze,
      });
      return;
    }
    console.log("Starting speed run...");
    console.log("Calculating absolute shortest path (ground truth)...");
    const allActualCells = getAllCoordStrings(actualMaze);
    const tempActualMap = calculateDistancesToGoal(cloneMaze(actualMaze), allActualCells);
    const truePath = findShortestPath(tempActualMap);
    if (truePath.length > 0 && truePath[0].x === tempActualMap.startCell.x && truePath[0].y === tempActualMap.startCell.y) {
      setAbsoluteShortestPath(truePath);
      console.log(`Absolute shortest path calculated (${truePath.length} steps).`);
    } else {
      console.error("Failed to calculate a valid absolute shortest path.");
      setAbsoluteShortestPath(null);
    }
    console.log("Calculating robot's speed run path (using known/visited cells)...");
    const mapForPathfinding = calculateDistancesToGoal(cloneMaze(knownMap), visitedCells);
    const robotPath = findShortestPath(mapForPathfinding);
    if (
      robotPath.length === 0 ||
      robotPath[0].x !== mapForPathfinding.startCell.x ||
      robotPath[0].y !== mapForPathfinding.startCell.y ||
      !mapForPathfinding.goalArea.some((g) => g.x === robotPath[robotPath.length - 1].x && g.y === robotPath[robotPath.length - 1].y)
    ) {
      console.error("Speed run failed: Path check passed previously but pathfinding failed now or path invalid based on visited cells.");
      setSimulationPhase(SimulationPhase.IDLE);
      setCanStartSpeedRun(false);
      setAbsoluteShortestPath(null);
      return;
    }
    const startPos = { ...mapForPathfinding.startCell };
    setRobotPosition(startPos);
    setSpeedRunPath(robotPath);
    speedRunPathIndexRef.current = 1;
    setSimulationPhase(SimulationPhase.SPEED_RUN);
    console.log(`Robot's speed run path calculated (${robotPath.length} steps). Starting run.`);
  }, [
    simulationPhase,
    canStartSpeedRun,
    knownMap,
    visitedCells,
    actualMaze,
    getAllCoordStrings,
    calculateDistancesToGoal,
  ]);
  const handleReset = useCallback(() => {
    console.log("Reset button clicked.");
    if (initialActualMaze) {
      resetSimulationState(initialActualMaze);
    } else {
      console.error("Cannot reset: Initial actual maze data is not available.");
    }
  }, [initialActualMaze, resetSimulationState]);
  useEffect(() => {
    if (initialActualMaze) {
      console.log("InitialActualMaze prop changed or loaded, updating internal state and resetting.");
      setActualMaze(cloneMaze(initialActualMaze));
      resetSimulationState(initialActualMaze);
    } else {
      console.log("Waiting for initial actual maze data...");
      setActualMaze(null);
      setKnownMap(null);
      setRobotPosition(null);
      setSimulationPhase(SimulationPhase.IDLE);
    }
  }, [initialActualMaze, resetSimulationState]);
  useEffect(() => {
    clearSimulationTimer();
    let stepFunction: (() => void) | null = null;
    switch (simulationPhase) {
      case SimulationPhase.EXPLORATION:
        stepFunction = explorationStep;
        break;
      case SimulationPhase.RETURN:
        stepFunction = returningToStartStep;
        break;
      case SimulationPhase.SPEED_RUN:
        stepFunction = speedRunStep;
        break;
      case SimulationPhase.IDLE:
      default:
        break;
    }
    if (stepFunction) {
      simulationTimerIdRef.current = setTimeout(stepFunction, simulationDelay);
    }
    return clearSimulationTimer;
  }, [simulationPhase, simulationDelay, explorationStep, returningToStartStep, speedRunStep, clearSimulationTimer]);
  return {
    knownMap,
    robotPosition,
    simulationPhase,
    visitedCells,
    speedRunPath,
    canStartSpeedRun,
    absoluteShortestPath,
    actualMaze,
    handleStartExploration,
    handleStartSpeedRun,
    handleReset,
  };
}
