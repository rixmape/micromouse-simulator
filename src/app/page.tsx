"use client";
import { useEffect } from "react";
import ControlPanel from "../components/ControlPanel";
import Infobar from "../components/Infobar";
import MazeGrid from "../components/MazeGrid";
import Sidebar from "../components/Sidebar";
import { useSimulationCore } from "../hooks/useSimulationCore";
import { useSimulationParameters } from "../hooks/useSimulationParameters";
import { SimulationPhase } from "../types";

export default function HomePage() {
  const { mazeWidth, setMazeWidth, mazeHeight, setMazeHeight, wallsToRemoveFactor, setWallsToRemoveFactor, simulationDelay, setSimulationDelay } =
    useSimulationParameters();
  const { simulationState, isInitializing, handleStartExploration, handleStartSpeedRun, handleReset, setSimulationStepDelay } = useSimulationCore({
    initialWidth: mazeWidth,
    initialHeight: mazeHeight,
    initialFactor: wallsToRemoveFactor,
  });
  useEffect(() => {
    handleReset({
      width: mazeWidth,
      height: mazeHeight,
      factor: wallsToRemoveFactor,
    });
  }, [mazeWidth, mazeHeight, wallsToRemoveFactor]);
  useEffect(() => {
    setSimulationStepDelay(simulationDelay);
  }, [simulationDelay, setSimulationStepDelay]);
  const handleRandomize = () => {
    if (simulationState.simulationPhase === SimulationPhase.IDLE) {
      handleReset({
        width: mazeWidth,
        height: mazeHeight,
        factor: wallsToRemoveFactor,
      });
    }
  };
  if (isInitializing || !simulationState.actualMaze || !simulationState.knownMap || !simulationState.robotPosition) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <h1 className="text-3xl font-bold mb-6">Micromouse Simulator</h1>
        <div>Loading Simulation...</div>
      </main>
    );
  }
  return (
    <main className="flex flex-row min-h-screen bg-gray-100 p-4 gap-4">
      <Sidebar
        currentWidth={mazeWidth}
        currentHeight={mazeHeight}
        currentWallsFactor={wallsToRemoveFactor}
        currentDelay={simulationDelay}
        onWidthChange={setMazeWidth}
        onHeightChange={setMazeHeight}
        onWallsFactorChange={setWallsToRemoveFactor}
        onDelayChange={setSimulationDelay}
        onRandomize={handleRandomize}
        simulationPhase={simulationState.simulationPhase}
      />
      <div className="flex flex-col items-center flex-grow">
        <h1 className="text-3xl font-bold mb-6">Micromouse Simulator</h1>
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
            onReset={() =>
              handleReset({
                width: mazeWidth,
                height: mazeHeight,
                factor: wallsToRemoveFactor,
              })
            }
          />
        </div>
        <div className="mt-4 text-lg font-medium">
          Phase: <span className="font-bold">{simulationState.simulationPhase}</span>
        </div>
      </div>
      <Infobar projectDescription="A simulation of the Micromouse maze-solving robot." />
    </main>
  );
}
