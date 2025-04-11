import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createGeneratedMaze } from "../algorithms/mazeGeneration/mazeGenerator";
import { calculateFloodFillDistances } from "../algorithms/pathfinding/floodfill";
import { findShortestPath } from "../algorithms/pathfinding/shortestPath";
import { coordsToString } from "../lib/mazeUtils/coordinateUtils";
import { cloneMaze } from "../lib/mazeUtils/mazeStructureUtils";
import * as Actions from "../simulation/actions";
import { DEFAULT_SIMULATION_DELAY } from "../simulation/simulationConstants";
import { runSimulationStep } from "../simulation/simulationManager";
import { initialSimulationState, simulationReducer } from "../simulation/state/simulationReducer";
import type { Maze } from "../types";
import { SimulationPhase } from "../types";

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

interface UseSimulationCoreProps {
  initialWidth: number;
  initialHeight: number;
  initialFactor: number;
}

interface ResetOptions {
  width?: number;
  height?: number;
  factor?: number;
}

export function useSimulationCore({ initialWidth, initialHeight, initialFactor }: UseSimulationCoreProps) {
  const [state, dispatch] = useReducer(simulationReducer, initialSimulationState);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [currentSimDelay, setCurrentSimDelay] = useState<number>(DEFAULT_SIMULATION_DELAY);
  const simulationTimerIdRef = useRef<NodeJS.Timeout | null>(null);
  const speedRunPathIndexRef = useRef<number>(0);
  const setSimulationStepDelay = useCallback((delay: number) => {
    setCurrentSimDelay(Math.max(0, delay));
  }, []);
  const clearSimulationTimer = useCallback(() => {
    if (simulationTimerIdRef.current) {
      clearTimeout(simulationTimerIdRef.current);
      simulationTimerIdRef.current = null;
    }
  }, []);
  const handleReset = useCallback(
    (options?: ResetOptions) => {
      clearSimulationTimer();
      speedRunPathIndexRef.current = 0;
      setIsInitializing(true);
      const width = options?.width ?? state.actualMaze?.width ?? initialWidth;
      const height = options?.height ?? state.actualMaze?.height ?? initialHeight;
      const factor = options?.factor ?? initialFactor;
      try {
        const mazeToResetWith = options || !state.actualMaze ? createGeneratedMaze(width, height, factor) : state.actualMaze;
        dispatch(Actions.resetSimulation(mazeToResetWith));
      } catch {
        const fallbackMaze = createGeneratedMaze(initialWidth, initialHeight, initialFactor);
        dispatch(Actions.resetSimulation(fallbackMaze));
      } finally {
        setIsInitializing(false);
      }
    },
    [clearSimulationTimer, state.actualMaze, initialWidth, initialHeight, initialFactor]
  );
  useEffect(() => {
    handleReset();
  }, []);
  useEffect(() => {
    clearSimulationTimer();
    if (state.simulationPhase !== SimulationPhase.IDLE && state.actualMaze) {
      const stepFn = () => {
        runSimulationStep(state, dispatch, state.actualMaze, speedRunPathIndexRef);
      };
      simulationTimerIdRef.current = setTimeout(stepFn, currentSimDelay);
    }
    return clearSimulationTimer;
  }, [state, state.simulationPhase, currentSimDelay, clearSimulationTimer, dispatch]);
  const handleStartExploration = useCallback(() => {
    if (state.simulationPhase !== SimulationPhase.IDLE || !state.knownMap) return;
    speedRunPathIndexRef.current = 0;
    dispatch(Actions.setSpeedRunPath(null));
    dispatch(Actions.setAbsoluteShortestPath(null));
    const allKnownCells = getAllCoordStrings(state.knownMap);
    const mapForExploration = calculateDistancesToGoal(state.knownMap, allKnownCells);
    dispatch(Actions.updateKnownMap(mapForExploration));
    dispatch(Actions.setSimulationPhase(SimulationPhase.EXPLORATION));
  }, [state.simulationPhase, state.knownMap, dispatch]);
  const handleStartSpeedRun = useCallback(() => {
    if (state.simulationPhase !== SimulationPhase.IDLE || !state.canStartSpeedRun || !state.knownMap || !state.visitedCells || !state.actualMaze) return;
    const allActualCells = getAllCoordStrings(state.actualMaze);
    const tempActualMap = calculateDistancesToGoal(cloneMaze(state.actualMaze), allActualCells);
    const truePath = findShortestPath(tempActualMap);
    if (truePath.length > 0 && truePath[0].x === tempActualMap.startCell.x && truePath[0].y === tempActualMap.startCell.y) {
      dispatch(Actions.setAbsoluteShortestPath(truePath));
    } else {
      dispatch(Actions.setAbsoluteShortestPath(null));
    }
    const mapForPathfinding = calculateDistancesToGoal(cloneMaze(state.knownMap), state.visitedCells);
    const robotPath = findShortestPath(mapForPathfinding);
    const startPos = mapForPathfinding.startCell;
    const isPathValid =
      robotPath.length > 0 &&
      robotPath[0].x === startPos.x &&
      robotPath[0].y === startPos.y &&
      mapForPathfinding.goalArea.some((g) => g.x === robotPath[robotPath.length - 1].x && g.y === robotPath[robotPath.length - 1].y);
    if (!isPathValid) {
      dispatch(Actions.setCanStartSpeedRun(false));
      dispatch(Actions.setAbsoluteShortestPath(null));
      return;
    }
    dispatch(Actions.updateRobotPosition({ ...startPos }));
    dispatch(Actions.setSpeedRunPath(robotPath));
    speedRunPathIndexRef.current = 1;
    dispatch(Actions.setSimulationPhase(SimulationPhase.SPEED_RUN));
  }, [state.simulationPhase, state.canStartSpeedRun, state.knownMap, state.visitedCells, state.actualMaze, dispatch]);
  return {
    simulationState: state,
    isInitializing,
    handleStartExploration,
    handleStartSpeedRun,
    handleReset,
    setSimulationStepDelay,
  };
}
