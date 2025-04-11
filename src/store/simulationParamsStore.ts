import { create } from "zustand";
import {
  DEFAULT_GOAL_CENTER_X_OFFSET,
  DEFAULT_GOAL_CENTER_Y_OFFSET,
  DEFAULT_MAZE_HEIGHT,
  DEFAULT_MAZE_WIDTH,
  DEFAULT_SIMULATION_DELAY,
  DEFAULT_START_X,
  DEFAULT_START_Y,
  DEFAULT_WALLS_FACTOR,
} from "../simulation/simulationConstants";

interface SimulationParamsState {
  mazeWidth: number;
  setMazeWidth: (width: number) => void;
  mazeHeight: number;
  setMazeHeight: (height: number) => void;
  wallsToRemoveFactor: number;
  setWallsToRemoveFactor: (factor: number) => void;
  simulationDelay: number;
  setSimulationDelay: (delay: number) => void;
  startX: number;
  setStartX: (x: number) => void;
  startY: number;
  setStartY: (y: number) => void;
  goalCenterX: number;
  setGoalCenterX: (x: number) => void;
  goalCenterY: number;
  setGoalCenterY: (y: number) => void;
}

export const useSimulationParamsStore = create<SimulationParamsState>((set) => ({
  mazeWidth: DEFAULT_MAZE_WIDTH,
  mazeHeight: DEFAULT_MAZE_HEIGHT,
  wallsToRemoveFactor: DEFAULT_WALLS_FACTOR,
  simulationDelay: DEFAULT_SIMULATION_DELAY,
  startX: DEFAULT_START_X,
  startY: DEFAULT_START_Y,
  goalCenterX: DEFAULT_GOAL_CENTER_X_OFFSET,
  goalCenterY: DEFAULT_GOAL_CENTER_Y_OFFSET,
  setMazeWidth: (mazeWidth) => set({ mazeWidth }),
  setMazeHeight: (mazeHeight) => set({ mazeHeight }),
  setWallsToRemoveFactor: (wallsToRemoveFactor) => set({ wallsToRemoveFactor }),
  setSimulationDelay: (simulationDelay) => set({ simulationDelay }),
  setStartX: (startX) => set({ startX }),
  setStartY: (startY) => set({ startY }),
  setGoalCenterX: (goalCenterX) => set({ goalCenterX }),
  setGoalCenterY: (goalCenterY) => set({ goalCenterY }),
}));
