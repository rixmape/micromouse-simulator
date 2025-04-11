"use client";

import ControlPanel from "../components/ControlPanel";
import Infobar from "../components/Infobar";
import MazeGrid from "../components/MazeGrid";
import Sidebar from "../components/Sidebar";
import { useSimulationCore } from "../hooks/useSimulationCore";
import { SimulationPhase } from "../types";

function formatPhase(phase: string): string {
  return phase
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function HomePage() {
  const { simulationState, isInitializing, handleStartExploration, handleStartSpeedRun, handleReset } = useSimulationCore();
  const handleRandomize = () => {
    if (simulationState.simulationPhase === SimulationPhase.IDLE) {
      handleReset();
    }
  };
  if (isInitializing || !simulationState.actualMaze || !simulationState.knownMap || !simulationState.robotPosition) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <h1 className="text-3xl font-semibold mb-6">Micromouse Simulator</h1>
        <div>Loading Simulation...</div>
      </main>
    );
  }
  return (
    <main className="flex flex-row min-h-screen bg-gray-100 p-4 gap-4">
      <Sidebar simulationPhase={simulationState.simulationPhase} onRandomize={handleRandomize} />
      <div className="flex flex-col items-center flex-grow">
        <h1 className="text-3xl font-semibold mb-6">Micromouse Simulator</h1>
        <div className="mb-6">
          <MazeGrid
            maze={simulationState.actualMaze}
            robotPosition={simulationState.robotPosition}
            visitedCells={simulationState.visitedCells}
            speedRunPath={simulationState.simulationPhase === SimulationPhase.SPEED_RUN ? simulationState.speedRunPath : null}
            absoluteShortestPath={simulationState.simulationPhase === SimulationPhase.SPEED_RUN ? simulationState.absoluteShortestPath : null}
          />
        </div>
        <div>
          <ControlPanel
            simulationPhase={simulationState.simulationPhase}
            canStartSpeedRun={simulationState.canStartSpeedRun}
            onStartExploration={handleStartExploration}
            onStartSpeedRun={handleStartSpeedRun}
            onReset={handleReset}
          />
        </div>
        <div className="mt-4 text-lg font-medium">
          Phase: <span className="font-medium">{formatPhase(simulationState.simulationPhase)}</span>
        </div>
      </div>
      <Infobar projectDescription="A simulation of the Micromouse maze-solving robot." />
    </main>
  );
}
