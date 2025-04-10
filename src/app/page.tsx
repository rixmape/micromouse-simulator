"use client";

import ControlPanel from "@/components/ControlPanel";
import MazeGrid from "@/components/MazeGrid";
import { calculateFloodFillDistances, findShortestPath } from "@/lib/floodfill";
import { createDefaultMaze, createInitialKnownMap } from "@/lib/maze";
import { Cell, Coordinates, Maze, SimulationPhase } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

const SIMULATION_STEP_DELAY_MS = 100;
const LOG_PREFIX = "[MicromouseSim]";

const coordToString = (coord: Coordinates | null): string => {
  if (!coord) return "(null)";
  return `(${coord.x},${coord.y})`;
};

export default function HomePage() {
  console.log(`${LOG_PREFIX} HomePage component rendering or re-rendering.`);

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
    console.log(`${LOG_PREFIX} Initializing simulation state...`);
    const mazeData = createDefaultMaze();
    console.log(`${LOG_PREFIX} Actual maze created. Start: ${coordToString(mazeData.startCell)}, Goal: ${mazeData.goalArea.map(coordToString).join(", ")}`);
    setActualMaze(mazeData);
    resetSimulationState(mazeData);
    console.log(`${LOG_PREFIX} Initialization complete.`);
  }, []);

  const clearSimulationTimer = useCallback(() => {
    if (simulationTimerIdRef.current) {
      clearTimeout(simulationTimerIdRef.current);
      simulationTimerIdRef.current = null;
    }
  }, []);

  const resetSimulationState = useCallback(
    (baseMaze: Maze) => {
      console.log(`${LOG_PREFIX} Resetting simulation state...`);
      clearSimulationTimer();
      const initialKnownMap = createInitialKnownMap(baseMaze);
      const startPos = { ...baseMaze.startCell };

      setKnownMap(initialKnownMap);
      setRobotPosition(startPos);
      setVisitedCells(new Set([`${startPos.x}-${startPos.y}`]));
      setSpeedRunPath(null);
      setSimulationPhase(SimulationPhase.IDLE);
      setCanStartSpeedRun(false);
      console.log(`${LOG_PREFIX} Simulation state reset complete. Robot at ${coordToString(startPos)}, Phase: IDLE.`);
    },
    [clearSimulationTimer]
  );

  const handleReset = useCallback(() => {
    console.log(`${LOG_PREFIX} "Reset" button clicked.`);
    if (actualMaze) {
      resetSimulationState(actualMaze);
    } else {
      console.warn(`${LOG_PREFIX} Reset clicked before actualMaze was initialized.`);
    }
  }, [actualMaze, resetSimulationState]);

  const handleStartExploration = useCallback(() => {
    console.log(`${LOG_PREFIX} "Start Exploration" button clicked.`);
    if (simulationPhase !== SimulationPhase.IDLE || !knownMap || !robotPosition) {
      console.warn(`${LOG_PREFIX} Start Exploration rejected. Phase: ${simulationPhase}, KnownMap: ${!!knownMap}, RobotPosition: ${!!robotPosition}`);
      return;
    }

    console.log(`${LOG_PREFIX} Preparing for Exploration Phase.`);

    const startCoordStr = `${robotPosition.x}-${robotPosition.y}`;
    console.log(`${LOG_PREFIX} Resetting visited cells (adding start ${startCoordStr}), clearing speed run path.`);
    setVisitedCells(new Set([startCoordStr]));
    setSpeedRunPath(null);
    setCanStartSpeedRun(false);

    console.log(`${LOG_PREFIX} Creating copy of knownMap for initial Flood Fill.`);
    const mapForExploration = JSON.parse(JSON.stringify(knownMap));
    console.log(`${LOG_PREFIX} Running initial Flood Fill calculation on knownMap copy.`);
    calculateFloodFillDistances(mapForExploration);
    setKnownMap(mapForExploration);
    console.log(`${LOG_PREFIX} Initial Flood Fill complete. Setting state with new knownMap.`);

    console.log(`${LOG_PREFIX} Setting simulation phase to EXPLORATION.`);
    setSimulationPhase(SimulationPhase.EXPLORATION);
  }, [simulationPhase, knownMap, robotPosition]);

  const handleStartSpeedRun = useCallback(() => {
    console.log(`${LOG_PREFIX} "Start Speed Run" button clicked.`);
    if (simulationPhase !== SimulationPhase.IDLE || !canStartSpeedRun || !knownMap) {
      console.warn(`${LOG_PREFIX} Start Speed Run rejected. Phase: ${simulationPhase}, CanStart: ${canStartSpeedRun}, KnownMap: ${!!knownMap}`);
      return;
    }
    console.log(`${LOG_PREFIX} Preparing for Speed Run Phase.`);

    console.log(`${LOG_PREFIX} Calculating shortest path using final knownMap.`);
    const path = findShortestPath(knownMap);
    if (path.length === 0) {
      console.error(`${LOG_PREFIX} Speed run path could not be calculated.`);
      return;
    }
    console.log(`${LOG_PREFIX} Shortest path calculated: ${path.map(coordToString).join(" -> ")}`);

    const startPos = { ...knownMap.startCell };
    console.log(`${LOG_PREFIX} Placing robot at start: ${coordToString(startPos)}.`);
    setRobotPosition(startPos);
    setSpeedRunPath(path);
    speedRunPathIndexRef.current = 0;

    console.log(`${LOG_PREFIX} Setting simulation phase to SPEED_RUN.`);
    setSimulationPhase(SimulationPhase.SPEED_RUN);
  }, [simulationPhase, canStartSpeedRun, knownMap]);

  const explorationStep = useCallback(() => {
    if (!actualMaze || !knownMap || !robotPosition) {
      console.warn(`${LOG_PREFIX} Exploration step called but essential state is missing.`);
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }

    const currentX = robotPosition.x;
    const currentY = robotPosition.y;
    const currentKnownCell = knownMap.cells[currentY][currentX];
    console.log(
      `${LOG_PREFIX} Exploration Step: Pos=${coordToString(robotPosition)}, KnownDist=${
        currentKnownCell.distance === Infinity ? "Inf" : currentKnownCell.distance
      }`
    );

    if (actualMaze.goalArea.some((gc) => gc.x === currentX && gc.y === currentY)) {
      console.log(`${LOG_PREFIX} >>> Goal Reached at ${coordToString(robotPosition)}! Exploration complete.`);
      setSimulationPhase(SimulationPhase.IDLE);
      setCanStartSpeedRun(true);
      return;
    }

    let bestNeighbor: { coord: Coordinates; wall: keyof Cell; neighborWall: keyof Cell } | null = null;
    let minDistance = currentKnownCell.distance;

    const moves = [
      { dx: 0, dy: 1, wall: "north", neighborWall: "south", name: "North" },
      { dx: 1, dy: 0, wall: "east", neighborWall: "west", name: "East" },
      { dx: 0, dy: -1, wall: "south", neighborWall: "north", name: "South" },
      { dx: -1, dy: 0, wall: "west", neighborWall: "east", name: "West" },
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
      console.warn(`${LOG_PREFIX} Stuck or no improving neighbor found. Recalculating Flood Fill.`);
      const newKnownMap = JSON.parse(JSON.stringify(knownMap));
      calculateFloodFillDistances(newKnownMap);
      setKnownMap(newKnownMap);

      return;
    }

    const actualCell = actualMaze.cells[currentY][currentX];

    const actualWallExists = actualCell[bestNeighbor.wall];
    console.log(`${LOG_PREFIX} Trying move towards ${coordToString(bestNeighbor.coord)}. Actual Wall Exists: ${actualWallExists}`);

    if (actualWallExists) {
      console.log(`${LOG_PREFIX} >>> Wall Found! Updating knownMap.`);
      const newKnownMap = JSON.parse(JSON.stringify(knownMap));

      newKnownMap.cells[currentY][currentX][bestNeighbor.wall] = true;
      newKnownMap.cells[bestNeighbor.coord.y][bestNeighbor.coord.x][bestNeighbor.neighborWall] = true;
      console.log(`${LOG_PREFIX} Recalculating Flood Fill after wall discovery.`);
      calculateFloodFillDistances(newKnownMap);
      setKnownMap(newKnownMap);
    } else {
      const nextPos = bestNeighbor.coord;
      console.log(`${LOG_PREFIX} >>> No wall found. Moving robot to ${coordToString(nextPos)}.`);
      setRobotPosition(nextPos);

      const nextPosStr = `${nextPos.x}-${nextPos.y}`;
      setVisitedCells((prev) => new Set(prev).add(nextPosStr));
    }
  }, [actualMaze, knownMap, robotPosition, visitedCells]);

  const speedRunStep = useCallback(() => {
    if (!speedRunPath || !robotPosition) {
      console.warn(`${LOG_PREFIX} Speed run step called but essential state is missing.`);
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }

    const currentIndex = speedRunPathIndexRef.current;
    console.log(`${LOG_PREFIX} Speed Run Step: Path Index=${currentIndex}/${speedRunPath.length}`);

    if (currentIndex >= speedRunPath.length) {
      console.log(`${LOG_PREFIX} >>> Speed Run complete (index reached end).`);
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }

    const nextPos = speedRunPath[currentIndex];
    console.log(`${LOG_PREFIX} Moving robot to next path coordinate: ${coordToString(nextPos)}`);
    setRobotPosition(nextPos);
    speedRunPathIndexRef.current += 1;

    if (speedRunPathIndexRef.current >= speedRunPath.length) {
      console.log(`${LOG_PREFIX} >>> Speed Run path finished after moving to ${coordToString(nextPos)}.`);
      setSimulationPhase(SimulationPhase.IDLE);
    }
  }, [speedRunPath]);

  useEffect(() => {
    clearSimulationTimer();

    if (simulationPhase === SimulationPhase.EXPLORATION) {
      console.log(`${LOG_PREFIX} Effect: Phase is EXPLORATION, scheduling next explorationStep.`);
      simulationTimerIdRef.current = setTimeout(explorationStep, SIMULATION_STEP_DELAY_MS);
    } else if (simulationPhase === SimulationPhase.SPEED_RUN) {
      console.log(`${LOG_PREFIX} Effect: Phase is SPEED_RUN, scheduling next speedRunStep.`);
      simulationTimerIdRef.current = setTimeout(speedRunStep, SIMULATION_STEP_DELAY_MS);
    } else {
      console.log(`${LOG_PREFIX} Effect: Phase is IDLE, simulation stopped.`);
    }

    return () => {
      clearSimulationTimer();
    };
  }, [simulationPhase, explorationStep, speedRunStep, clearSimulationTimer]);

  console.log(`${LOG_PREFIX} Rendering HomePage UI. Current Phase: ${simulationPhase}, Robot Position: ${coordToString(robotPosition)}`);
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
