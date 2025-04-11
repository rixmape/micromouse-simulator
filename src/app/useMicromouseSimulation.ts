import { useCallback, useEffect, useRef, useState } from "react";
import { calculateFloodFillDistances, findShortestPath } from "../lib/floodfill";
import { createInitialKnownMap } from "../lib/maze";
import { cloneMaze, coordsToString, getValidNeighbors, hasWallTowardsNeighbor, stringToCoords } from "../lib/mazeUtils";
import { Coordinates, Maze, SimulationPhase } from "../types";

const SIMULATION_STEP_DELAY_MS = 10;

export function useMicromouseSimulation(initialActualMaze: Maze | null) {
  const [actualMaze, setActualMaze] = useState<Maze | null>(initialActualMaze);
  const [knownMap, setKnownMap] = useState<Maze | null>(null);
  const [robotPosition, setRobotPosition] = useState<Coordinates | null>(null);
  const [simulationPhase, setSimulationPhase] = useState<SimulationPhase>(SimulationPhase.IDLE);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set());
  const [speedRunPath, setSpeedRunPath] = useState<Coordinates[] | null>(null);
  const [canStartSpeedRun, setCanStartSpeedRun] = useState<boolean>(false);
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
      const mapForCheck = calculateDistancesToGoal(currentKnownMap, currentVisitedCells);
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
        console.error("Actual maze data not available for wall discovery.");
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
    if (!currentCell) return null;
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
      console.log("Robot stuck at:", robotPosition);
      let mapToRecalculate = cloneMaze(currentMap);
      console.log(`Stuck during ${currentPhase}, forcing recalculation...`);
      const allCells = getAllCoordStrings(mapToRecalculate);
      if (currentPhase === SimulationPhase.EXPLORATION) {
        mapToRecalculate = calculateDistancesToGoal(mapToRecalculate, allCells);
      } else if (currentPhase === SimulationPhase.RETURN) {
        mapToRecalculate = calculateDistancesToStart(mapToRecalculate, allCells);
      }
      setKnownMap(mapToRecalculate);
      if (isExplorationComplete(mapToRecalculate, currentVisited)) {
        console.log(`Exploration complete (stuck during ${currentPhase} and no unvisited reachable cells). Going IDLE.`);
        setSimulationPhase(SimulationPhase.IDLE);
        checkAndEnableSpeedRun(mapToRecalculate, currentVisited);
      } else {
        console.log("Recalculation done, but exploration not yet complete.");
      }
    },
    [robotPosition, getAllCoordStrings, calculateDistancesToGoal, calculateDistancesToStart, isExplorationComplete, checkAndEnableSpeedRun]
  );
  const explorationStep = useCallback(() => {
    if (!actualMaze || !knownMap || !robotPosition || !visitedCells) {
      console.warn("Exploration step called with invalid state. Setting phase to IDLE.");
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }
    if (actualMaze.goalArea.some((gc) => gc.x === robotPosition.x && gc.y === robotPosition.y)) {
      console.log("Goal reached during exploration! Calculating path back to start...");
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
      const allCells = getAllCoordStrings(currentMapToUse);
      currentMapToUse = calculateDistancesToGoal(currentMapToUse, allCells);
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
      console.log("Returned to start cell. Exploration cycle complete.");
      checkAndEnableSpeedRun(knownMap, visitedCells);
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }
    const { updatedMap: mapAfterDiscovery, wallsChanged } = performWallDiscoveryAndUpdateMap(knownMap, robotPosition);
    let currentMapToUse = mapAfterDiscovery;
    if (wallsChanged) {
      console.log("Walls updated during return, recalculating distances to start...");
      const allCells = getAllCoordStrings(currentMapToUse);
      currentMapToUse = calculateDistancesToStart(currentMapToUse, allCells);
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
      console.log("Speed run reached end of path.");
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
    speedRunPathIndexRef.current = 0;
    const allCells = getAllCoordStrings(knownMap);
    const mapForExploration = calculateDistancesToGoal(knownMap, allCells);
    setKnownMap(mapForExploration);
    setSimulationPhase(SimulationPhase.EXPLORATION);
  }, [simulationPhase, knownMap, robotPosition, getAllCoordStrings, calculateDistancesToGoal]);
  const handleStartSpeedRun = useCallback(() => {
    if (simulationPhase !== SimulationPhase.IDLE || !canStartSpeedRun || !knownMap || !visitedCells) {
      console.warn("Speed run start conditions not met.");
      return;
    }
    console.log("Starting speed run...");
    const mapForPathfinding = calculateDistancesToGoal(knownMap, visitedCells);
    const path = findShortestPath(mapForPathfinding);
    if (
      path.length === 0 ||
      path[0].x !== mapForPathfinding.startCell.x ||
      path[0].y !== mapForPathfinding.startCell.y ||
      !mapForPathfinding.goalArea.some((g) => g.x === path[path.length - 1].x && g.y === path[path.length - 1].y)
    ) {
      console.error("Speed run failed: Path check passed previously but pathfinding failed now or path invalid.");
      setSimulationPhase(SimulationPhase.IDLE);
      setCanStartSpeedRun(false);
      return;
    }
    const startPos = { ...mapForPathfinding.startCell };
    setRobotPosition(startPos);
    setSpeedRunPath(path);
    speedRunPathIndexRef.current = 0;
    setSimulationPhase(SimulationPhase.SPEED_RUN);
  }, [simulationPhase, canStartSpeedRun, knownMap, visitedCells, calculateDistancesToGoal]);
  const handleReset = useCallback(() => {
    console.log("Reset button clicked.");
    if (actualMaze) {
      resetSimulationState(actualMaze);
    } else {
      console.error("Cannot reset: Actual maze data is not loaded.");
    }
  }, [actualMaze, resetSimulationState]);
  useEffect(() => {
    if (initialActualMaze) {
      setActualMaze(initialActualMaze);
      resetSimulationState(initialActualMaze);
    } else {
      console.log("Waiting for initial actual maze data...");
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
      simulationTimerIdRef.current = setTimeout(stepFunction, SIMULATION_STEP_DELAY_MS);
    }
    return clearSimulationTimer;
  }, [simulationPhase, explorationStep, returningToStartStep, speedRunStep, clearSimulationTimer]);
  return {
    knownMap,
    robotPosition,
    simulationPhase,
    visitedCells,
    speedRunPath,
    canStartSpeedRun,
    actualMaze,
    handleStartExploration,
    handleStartSpeedRun,
    handleReset,
  };
}
