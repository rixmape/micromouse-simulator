import { useState } from "react";
import { DEFAULT_MAZE_HEIGHT, DEFAULT_MAZE_WIDTH, DEFAULT_SIMULATION_DELAY, DEFAULT_WALLS_FACTOR } from "../simulation/simulationConstants";

export function useSimulationParameters() {
  const [mazeWidth, setMazeWidth] = useState<number>(DEFAULT_MAZE_WIDTH);
  const [mazeHeight, setMazeHeight] = useState<number>(DEFAULT_MAZE_HEIGHT);
  const [wallsToRemoveFactor, setWallsToRemoveFactor] = useState<number>(DEFAULT_WALLS_FACTOR);
  const [simulationDelay, setSimulationDelay] = useState<number>(DEFAULT_SIMULATION_DELAY);
  return {
    mazeWidth,
    setMazeWidth,
    mazeHeight,
    setMazeHeight,
    wallsToRemoveFactor,
    setWallsToRemoveFactor,
    simulationDelay,
    setSimulationDelay,
  };
}
