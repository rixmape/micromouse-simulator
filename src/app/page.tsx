"use client";

import { useEffect, useState } from "react";
import ControlPanel from "../components/ControlPanel";
import MazeGrid from "../components/MazeGrid";
import { createDefaultMaze } from "../lib/maze";
import { Maze, SimulationPhase } from "../types";
import { useMicromouseSimulation } from "./useMicromouseSimulation";

export default function HomePage() {
  const [initialMaze, setInitialMaze] = useState<Maze | null>(null);
  useEffect(() => {
    console.log("Generating initial maze structure...");
    const mazeData = createDefaultMaze();
    setInitialMaze(mazeData);
  }, []);
  const {
    knownMap,
    actualMaze,
    robotPosition,
    simulationPhase,
    visitedCells,
    speedRunPath,
    canStartSpeedRun,
    handleStartExploration,
    handleStartSpeedRun,
    handleReset,
  } = useMicromouseSimulation(initialMaze);
  if (!actualMaze || !knownMap || !robotPosition) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <h1 className="text-3xl font-bold mb-6">Micromouse Simulator</h1>
        <div>Loading Simulation...</div>
      </main>
    );
  }
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Micromouse Simulator</h1>
      <div className="mb-6">
        <MazeGrid
          maze={actualMaze}
          robotPosition={robotPosition}
          visitedCells={visitedCells}
          speedRunPath={simulationPhase === SimulationPhase.SPEED_RUN ? speedRunPath : null}
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
    </main>
  );
}
