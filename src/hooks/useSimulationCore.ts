import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createGeneratedMaze } from "../algorithms/mazeGeneration/mazeGenerator";
import { calculateAndValidateSpeedRunPath, calculateDistancesToGoal } from "../lib/mazeUtils/pathfindingUtils";
import * as Actions from "../simulation/actions";
import { DEFAULT_SIMULATION_DELAY } from "../simulation/simulationConstants";
import { runSimulationStep } from "../simulation/simulationManager";
import { initialSimulationState, simulationReducer } from "../simulation/state/simulationReducer";
import { useSimulationParamsStore } from "../store/simulationParamsStore";
import type { MazeCreationOptions } from "../types";
import { SimulationPhase } from "../types";

function useSimulationLoop(phase: SimulationPhase, stepFn: () => void, initialDelay: number = DEFAULT_SIMULATION_DELAY) {
  const [currentSimDelay, setCurrentSimDelay] = useState<number>(initialDelay);
  const simulationTimerIdRef = useRef<NodeJS.Timeout | null>(null);
  const clearSimulationTimer = useCallback(() => {
    if (simulationTimerIdRef.current) {
      clearTimeout(simulationTimerIdRef.current);
      simulationTimerIdRef.current = null;
    }
  }, []);
  useEffect(() => {
    clearSimulationTimer();
    if (phase !== SimulationPhase.IDLE) {
      simulationTimerIdRef.current = setTimeout(() => {
        stepFn();
      }, currentSimDelay);
    }
    return clearSimulationTimer;
  }, [phase, currentSimDelay, stepFn, clearSimulationTimer]);
  const setSimulationStepDelay = useCallback((delay: number) => {
    setCurrentSimDelay(Math.max(0, delay));
  }, []);
  return { setSimulationStepDelay, clearSimulationTimer };
}

interface ResetOptions {
  width?: number;
  height?: number;
  factor?: number;
  startX?: number;
  startY?: number;
  goalCenterX?: number;
  goalCenterY?: number;
}

export function useSimulationCore() {
  const { mazeWidth, mazeHeight, wallsToRemoveFactor, startX, startY, goalCenterX, goalCenterY, simulationDelay } = useSimulationParamsStore();
  const [state, dispatch] = useReducer(simulationReducer, initialSimulationState);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const speedRunPathIndexRef = useRef<number>(0);
  const stepFn = useCallback(() => {
    runSimulationStep(state, dispatch, state.actualMaze, speedRunPathIndexRef);
  }, [state, dispatch]);
  const { setSimulationStepDelay, clearSimulationTimer } = useSimulationLoop(state.simulationPhase, stepFn, simulationDelay);
  useEffect(() => {
    setSimulationStepDelay(simulationDelay);
  }, [simulationDelay, setSimulationStepDelay]);
  const handleReset = useCallback(
    (options?: ResetOptions) => {
      console.log("Resetting simulation with options:", options);
      clearSimulationTimer();
      speedRunPathIndexRef.current = 0;
      setIsInitializing(true);
      const width = options?.width ?? mazeWidth;
      const height = options?.height ?? mazeHeight;
      const factor = options?.factor ?? wallsToRemoveFactor;
      const startXParam = options?.startX ?? startX;
      const startYParam = options?.startY ?? startY;
      const goalCenterXParam = options?.goalCenterX ?? goalCenterX;
      const goalCenterYParam = options?.goalCenterY ?? goalCenterY;
      const mazeOptions: MazeCreationOptions = {
        width,
        height,
        wallsToRemoveFactor: factor,
        startX: startXParam,
        startY: startYParam,
        goalCenterX: goalCenterXParam,
        goalCenterY: goalCenterYParam,
      };
      try {
        const mazeToResetWith = createGeneratedMaze(mazeOptions);
        dispatch(Actions.resetSimulation(mazeToResetWith));
      } catch (error) {
        console.error("Error creating maze during reset:", error);
      } finally {
        setIsInitializing(false);
      }
    },
    [clearSimulationTimer, mazeWidth, mazeHeight, wallsToRemoveFactor, startX, startY, goalCenterX, goalCenterY, dispatch]
  );
  useEffect(() => {
    handleReset();
  }, [mazeWidth, mazeHeight, wallsToRemoveFactor, startX, startY, goalCenterX, goalCenterY, handleReset]);
  const handleStartExploration = useCallback(() => {
    if (state.simulationPhase !== SimulationPhase.IDLE || !state.knownMap || !state.visitedCells) {
      console.warn("Cannot start exploration: Invalid state or missing map.");
      return;
    }
    console.log("Starting exploration phase.");
    speedRunPathIndexRef.current = 0;
    dispatch(Actions.setSpeedRunPath(null));
    dispatch(Actions.setAbsoluteShortestPath(null));
    const mapForExploration = calculateDistancesToGoal(state.knownMap, state.visitedCells);
    dispatch(Actions.updateKnownMap(mapForExploration));
    dispatch(Actions.setSimulationPhase(SimulationPhase.EXPLORATION));
  }, [state.simulationPhase, state.knownMap, state.visitedCells, dispatch]);
  const handleStartSpeedRun = useCallback(() => {
    if (state.simulationPhase !== SimulationPhase.IDLE || !state.canStartSpeedRun || !state.knownMap || !state.visitedCells || !state.actualMaze) {
      console.warn("Cannot start speed run: Conditions not met.");
      return;
    }
    console.log("Starting speed run phase.");
    const { robotPath, absoluteShortestPath, isPathValid } = calculateAndValidateSpeedRunPath(state.knownMap, state.actualMaze, state.visitedCells);
    dispatch(Actions.setAbsoluteShortestPath(absoluteShortestPath));
    if (!isPathValid || !robotPath) {
      console.warn("Speed run path calculation failed or path is invalid.");
      dispatch(Actions.setCanStartSpeedRun(false));
      dispatch(Actions.setSpeedRunPath(null));
      return;
    }
    dispatch(Actions.updateRobotPosition({ ...state.knownMap.startCell }));
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
  };
}
