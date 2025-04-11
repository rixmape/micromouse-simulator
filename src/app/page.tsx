"use client";

import { useCallback, useEffect, useState } from "react";
import ControlPanel from "../components/ControlPanel";
import MazeGrid from "../components/MazeGrid";
import Sidebar from "../components/Sidebar";
import { createDefaultMaze } from "../lib/maze";
import { Maze, SimulationPhase } from "../types";
import { useMicromouseSimulation } from "./useMicromouseSimulation";

const DEFAULT_MAZE_WIDTH = 24;
const DEFAULT_MAZE_HEIGHT = 24;
const DEFAULT_WALLS_FACTOR = 0.1;
const DEFAULT_SIMULATION_DELAY = 10;

export default function HomePage() {
  const [mazeWidth, setMazeWidth] = useState<number>(DEFAULT_MAZE_WIDTH);
  const [mazeHeight, setMazeHeight] = useState<number>(DEFAULT_MAZE_HEIGHT);
  const [wallsToRemoveFactor, setWallsToRemoveFactor] = useState<number>(DEFAULT_WALLS_FACTOR);
  const [simulationDelay, setSimulationDelay] = useState<number>(DEFAULT_SIMULATION_DELAY);
  const [initialMaze, setInitialMaze] = useState<Maze | null>(null);
  const [isLoadingMaze, setIsLoadingMaze] = useState<boolean>(true);
  useEffect(() => {
    console.log("Generating new maze structure with parameters:", {
      width: mazeWidth,
      height: mazeHeight,
      factor: wallsToRemoveFactor,
    });
    setIsLoadingMaze(true);
    try {
      const mazeData = createDefaultMaze(mazeWidth, mazeHeight, wallsToRemoveFactor);
      setInitialMaze(mazeData);
    } catch (error) {
      console.error("Error generating maze:", error);
      setInitialMaze(null);
    } finally {
      setIsLoadingMaze(false);
    }
  }, [mazeWidth, mazeHeight, wallsToRemoveFactor]);
  const {
    knownMap,
    actualMaze,
    robotPosition,
    simulationPhase,
    visitedCells,
    speedRunPath,
    canStartSpeedRun,
    absoluteShortestPath,
    handleStartExploration,
    handleStartSpeedRun,
    handleReset,
  } = useMicromouseSimulation(initialMaze, simulationDelay);
  const handleWidthChange = useCallback((newWidth: number) => {
    setMazeWidth(newWidth);
  }, []);
  const handleHeightChange = useCallback((newHeight: number) => {
    setMazeHeight(newHeight);
  }, []);
  const handleWallsFactorChange = useCallback((newFactor: number) => {
    setWallsToRemoveFactor(newFactor);
  }, []);
  const handleDelayChange = useCallback((newDelay: number) => {
    setSimulationDelay(newDelay);
  }, []);
  if (isLoadingMaze || !actualMaze || !knownMap || !robotPosition) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <h1 className="text-3xl font-bold mb-6">Micromouse Simulator</h1>
        <div>Loading Simulation Parameters and Maze...</div>
      </main>
    );
  }
  return (
    <main className="flex flex-col lg:flex-row min-h-screen bg-gray-100 p-4 gap-4">
      <Sidebar
        currentWidth={mazeWidth}
        currentHeight={mazeHeight}
        currentWallsFactor={wallsToRemoveFactor}
        currentDelay={simulationDelay}
        onWidthChange={handleWidthChange}
        onHeightChange={handleHeightChange}
        onWallsFactorChange={handleWallsFactorChange}
        onDelayChange={handleDelayChange}
        simulationPhase={simulationPhase}
      />
      <div className="flex flex-col items-center flex-grow">
        <h1 className="text-3xl font-bold mb-6">Micromouse Simulator</h1>
        <div className="mb-6">
          <MazeGrid
            maze={actualMaze}
            robotPosition={robotPosition}
            visitedCells={visitedCells}
            speedRunPath={simulationPhase === SimulationPhase.SPEED_RUN ? speedRunPath : null}
            absoluteShortestPath={simulationPhase === SimulationPhase.SPEED_RUN ? absoluteShortestPath : null}
          />
        </div>
        <div>
          <ControlPanel
            simulationPhase={simulationPhase}
            canStartSpeedRun={canStartSpeedRun}
            onStartExploration={handleStartExploration}
            onStartSpeedRun={handleStartSpeedRun}
            onReset={handleReset}
          />
        </div>
        <div className="mt-4 text-lg font-medium">
          Phase: <span className="font-bold">{simulationPhase}</span>
        </div>
      </div>
    </main>
  );
}
