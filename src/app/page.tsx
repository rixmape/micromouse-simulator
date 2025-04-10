"use client";

import ControlPanel from "@/components/ControlPanel";
import MazeGrid from "@/components/MazeGrid";
import { calculateFloodFillDistances, findShortestPath } from "@/lib/floodfill";
import { createDefaultMaze, createInitialKnownMap } from "@/lib/maze";
import { Cell, Coordinates, Maze, SimulationPhase } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

const SIMULATION_STEP_DELAY_MS = 100;

export default function HomePage() {
  const [actualMaze, setActualMaze] = useState<Maze | null>(null);
  const [knownMap, setKnownMap] = useState<Maze | null>(null);
  const [robotPosition, setRobotPosition] = useState<Coordinates | null>(null);
  const [simulationPhase, setSimulationPhase] = useState<SimulationPhase>(SimulationPhase.IDLE);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set());
  const [speedRunPath, setSpeedRunPath] = useState<Coordinates[] | null>(null);
  const [canStartSpeedRun, setCanStartSpeedRun] = useState<boolean>(false);

  const simulationTimerIdRef = useRef<NodeJS.Timeout | null>(null);
  const speedRunPathIndexRef = useRef<number>(0);

  useEffect(() => {
    const mazeData = createDefaultMaze();
    setActualMaze(mazeData);
    resetSimulationState(mazeData);
  }, []);

  const clearSimulationTimer = useCallback(() => {
    if (simulationTimerIdRef.current) {
      clearTimeout(simulationTimerIdRef.current);
      simulationTimerIdRef.current = null;
    }
  }, []);

  const resetSimulationState = useCallback(
    (baseMaze: Maze) => {
      clearSimulationTimer();
      const initialKnownMap = createInitialKnownMap(baseMaze);
      const startPos = { ...baseMaze.startCell };

      setKnownMap(initialKnownMap);
      setRobotPosition(startPos);
      setVisitedCells(new Set([`${startPos.x}-${startPos.y}`]));
      setSpeedRunPath(null);
      setSimulationPhase(SimulationPhase.IDLE);
      setCanStartSpeedRun(false);
    },
    [clearSimulationTimer]
  );

  const handleReset = useCallback(() => {
    if (actualMaze) {
      resetSimulationState(actualMaze);
    }
  }, [actualMaze, resetSimulationState]);

  const handleStartExploration = useCallback(() => {
    if (simulationPhase !== SimulationPhase.IDLE || !knownMap || !robotPosition) {
      return;
    }
    const startCoordStr = `${robotPosition.x}-${robotPosition.y}`;
    setVisitedCells(new Set([startCoordStr]));
    setSpeedRunPath(null);
    setCanStartSpeedRun(false);

    const mapForExploration = JSON.parse(JSON.stringify(knownMap));
    calculateFloodFillDistances(mapForExploration);
    setKnownMap(mapForExploration);

    setSimulationPhase(SimulationPhase.EXPLORATION);
  }, [simulationPhase, knownMap, robotPosition]);

  const handleStartSpeedRun = useCallback(() => {
    if (simulationPhase !== SimulationPhase.IDLE || !canStartSpeedRun || !actualMaze) {
      return;
    }

    const mazeForPathfinding = JSON.parse(JSON.stringify(actualMaze));
    calculateFloodFillDistances(mazeForPathfinding);
    const path = findShortestPath(mazeForPathfinding);

    if (path.length === 0) {
      return;
    }

    const startPos = { ...actualMaze.startCell };
    setRobotPosition(startPos);
    setSpeedRunPath(path);
    speedRunPathIndexRef.current = 0;
    setSimulationPhase(SimulationPhase.SPEED_RUN);
  }, [simulationPhase, canStartSpeedRun, actualMaze]);

  const explorationStep = useCallback(() => {
    if (!actualMaze || !knownMap || !robotPosition) {
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }

    const currentX = robotPosition.x;
    const currentY = robotPosition.y;
    const currentKnownCell = knownMap.cells[currentY][currentX];

    if (actualMaze.goalArea.some((gc) => gc.x === currentX && gc.y === currentY)) {
      setSimulationPhase(SimulationPhase.IDLE);
      setCanStartSpeedRun(true);
      return;
    }

    let bestNeighbor: { coord: Coordinates; wall: keyof Cell; neighborWall: keyof Cell } | null = null;
    let minDistance = currentKnownCell.distance;
    const moves = [
      { dx: 0, dy: 1, wall: "north", neighborWall: "south" },
      { dx: 1, dy: 0, wall: "east", neighborWall: "west" },
      { dx: 0, dy: -1, wall: "south", neighborWall: "north" },
      { dx: -1, dy: 0, wall: "west", neighborWall: "east" },
    ] as const;

    for (const move of moves) {
      const nx = currentX + move.dx;
      const ny = currentY + move.dy;
      if (nx < 0 || nx >= knownMap.width || ny < 0 || ny >= knownMap.height) continue;
      const neighborKnownCell = knownMap.cells[ny][nx];

      const knownWallExists = currentKnownCell[move.wall];
      if (!knownWallExists && neighborKnownCell.distance < minDistance) {
        minDistance = neighborKnownCell.distance;
        bestNeighbor = { coord: { x: nx, y: ny }, wall: move.wall, neighborWall: move.neighborWall };
      }
    }

    if (!bestNeighbor) {
      const newKnownMap = JSON.parse(JSON.stringify(knownMap));
      calculateFloodFillDistances(newKnownMap);
      setKnownMap(newKnownMap);
      return;
    }

    const actualCell = actualMaze.cells[currentY][currentX];

    const actualWallExists = actualCell[bestNeighbor.wall];

    if (actualWallExists) {
      const newKnownMap = JSON.parse(JSON.stringify(knownMap));
      newKnownMap.cells[currentY][currentX][bestNeighbor.wall] = true;
      newKnownMap.cells[bestNeighbor.coord.y][bestNeighbor.coord.x][bestNeighbor.neighborWall] = true;

      calculateFloodFillDistances(newKnownMap);
      setKnownMap(newKnownMap);
    } else {
      const nextPos = bestNeighbor.coord;
      setRobotPosition(nextPos);
      const nextPosStr = `${nextPos.x}-${nextPos.y}`;
      setVisitedCells((prev) => new Set(prev).add(nextPosStr));
    }
  }, [actualMaze, knownMap, robotPosition, visitedCells]);

  const speedRunStep = useCallback(() => {
    if (!speedRunPath || !robotPosition) {
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }
    const currentIndex = speedRunPathIndexRef.current;

    if (currentIndex >= speedRunPath.length) {
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }

    const nextPos = speedRunPath[currentIndex];
    setRobotPosition(nextPos);
    speedRunPathIndexRef.current += 1;

    if (speedRunPathIndexRef.current >= speedRunPath.length) {
      setSimulationPhase(SimulationPhase.IDLE);
    }
  }, [speedRunPath]);

  useEffect(() => {
    clearSimulationTimer();
    if (simulationPhase === SimulationPhase.EXPLORATION) {
      simulationTimerIdRef.current = setTimeout(explorationStep, SIMULATION_STEP_DELAY_MS);
    } else if (simulationPhase === SimulationPhase.SPEED_RUN) {
      simulationTimerIdRef.current = setTimeout(speedRunStep, SIMULATION_STEP_DELAY_MS);
    }
    return clearSimulationTimer;
  }, [simulationPhase, explorationStep, speedRunStep, clearSimulationTimer]);

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
