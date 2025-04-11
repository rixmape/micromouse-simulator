import { useState } from "react";
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

export function useSimulationParameters() {
  const [mazeWidth, setMazeWidth] = useState<number>(DEFAULT_MAZE_WIDTH);
  const [mazeHeight, setMazeHeight] = useState<number>(DEFAULT_MAZE_HEIGHT);
  const [wallsToRemoveFactor, setWallsToRemoveFactor] = useState<number>(DEFAULT_WALLS_FACTOR);
  const [simulationDelay, setSimulationDelay] = useState<number>(DEFAULT_SIMULATION_DELAY);
  const [startX, setStartX] = useState<number>(DEFAULT_START_X);
  const [startY, setStartY] = useState<number>(DEFAULT_START_Y);
  const [goalCenterX, setGoalCenterX] = useState<number>(DEFAULT_GOAL_CENTER_X_OFFSET);
  const [goalCenterY, setGoalCenterY] = useState<number>(DEFAULT_GOAL_CENTER_Y_OFFSET);
  return {
    mazeWidth,
    setMazeWidth,
    mazeHeight,
    setMazeHeight,
    wallsToRemoveFactor,
    setWallsToRemoveFactor,
    simulationDelay,
    setSimulationDelay,
    startX,
    setStartX,
    startY,
    setStartY,
    goalCenterX,
    setGoalCenterX,
    goalCenterY,
    setGoalCenterY,
  };
}
