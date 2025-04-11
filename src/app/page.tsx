"use client";

import ControlPanel from "@/components/ControlPanel";
import MazeGrid from "@/components/MazeGrid";
import { calculateFloodFillDistances, findShortestPath } from "@/lib/floodfill";
import { createDefaultMaze, createInitialKnownMap } from "@/lib/maze";
import { Coordinates, Maze, SimulationPhase } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

const SIMULATION_STEP_DELAY_MS = 10;

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
      const startPosStr = `${startPos.x}-${startPos.y}`;

      setKnownMap(initialKnownMap);
      setRobotPosition(startPos);
      setVisitedCells(new Set([startPosStr]));
      setSpeedRunPath(null);
      setSimulationPhase(SimulationPhase.IDLE);
      setCanStartSpeedRun(false);
      speedRunPathIndexRef.current = 0;
    },
    [clearSimulationTimer]
  );

  const getAllCoordStrings = (map: Maze | null): Set<string> => {
    if (!map) return new Set();
    const coords = new Set<string>();
    map.cells.forEach((row, y) => row.forEach((_, x) => coords.add(`${x}-${y}`)));
    return coords;
  };

  const calculateDistancesToGoal = useCallback((map: Maze, allowedCells: Set<string>): Maze => {
    const mapCopy = JSON.parse(JSON.stringify(map));
    calculateFloodFillDistances(mapCopy, allowedCells);
    return mapCopy;
  }, []);

  const calculateDistancesToStart = useCallback((map: Maze, allowedCells: Set<string>): Maze => {
    const mapCopy = JSON.parse(JSON.stringify(map));
    if (!mapCopy.goalArea || mapCopy.goalArea.length === 0) {
      console.error("Cannot calculate distances to start: Maze goalArea is missing or empty.");
      return mapCopy;
    }
    const originalStart = { ...mapCopy.startCell };
    const originalGoalArea: Coordinates[] = mapCopy.goalArea.map((g: Coordinates) => ({ ...g }));

    mapCopy.startCell = { ...originalGoalArea[0] };
    mapCopy.goalArea = [originalStart];

    calculateFloodFillDistances(mapCopy, allowedCells);

    mapCopy.startCell = originalStart;
    mapCopy.goalArea = originalGoalArea;

    return mapCopy;
  }, []);

  const checkAndEnableSpeedRun = useCallback(
    (currentKnownMap: Maze | null, currentVisitedCells: Set<string>) => {
      if (!currentKnownMap) return;

      const mapForCheck = calculateDistancesToGoal(currentKnownMap, currentVisitedCells);
      const path = findShortestPath(mapForCheck);

      const pathFound = path.length > 0 && path[0].x === mapForCheck.startCell.x && path[0].y === mapForCheck.startCell.y;
      setCanStartSpeedRun(pathFound);
      if (pathFound) {
        console.log("Speed run enabled: Path found within visited cells.");
      } else {
        console.log("Speed run not possible: No path found within visited cells.");
      }
    },
    [calculateDistancesToGoal]
  );

  const handleStartSpeedRun = useCallback(() => {
    if (simulationPhase !== SimulationPhase.IDLE || !canStartSpeedRun || !knownMap || !visitedCells) {
      console.log("Speed run start conditions not met.");
      return;
    }

    const mapForPathfinding = calculateDistancesToGoal(knownMap, visitedCells);
    const path = findShortestPath(mapForPathfinding);

    if (path.length === 0 || path[0].x !== mapForPathfinding.startCell.x || path[0].y !== mapForPathfinding.startCell.y) {
      console.error("Speed run failed: Path check passed but pathfinding failed just now.");
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }

    const startPos = { ...mapForPathfinding.startCell };
    setRobotPosition(startPos);
    setSpeedRunPath(path);
    speedRunPathIndexRef.current = 0;
    setSimulationPhase(SimulationPhase.SPEED_RUN);
  }, [simulationPhase, canStartSpeedRun, knownMap, visitedCells, calculateDistancesToGoal]);

  const handleReset = useCallback(() => {
    if (actualMaze) {
      resetSimulationState(actualMaze);
    }
  }, [actualMaze, resetSimulationState]);

  const handleStartExploration = useCallback(() => {
    if (simulationPhase !== SimulationPhase.IDLE || !knownMap || !robotPosition) return;

    const startPos = knownMap.startCell;
    const startPosStr = `${startPos.x}-${startPos.y}`;
    setRobotPosition({ ...startPos });
    setVisitedCells(new Set([startPosStr]));
    setSpeedRunPath(null);
    setCanStartSpeedRun(false);

    const mapForExploration = calculateDistancesToGoal(knownMap, getAllCoordStrings(knownMap));
    setKnownMap(mapForExploration);
    setSimulationPhase(SimulationPhase.EXPLORATION);
  }, [simulationPhase, knownMap, robotPosition, calculateDistancesToGoal]);

  const performWallDiscoveryAndUpdateMap = useCallback(
    (currentMap: Maze, currentPos: Coordinates): { updatedMap: Maze; wallsChanged: boolean } => {
      if (!actualMaze) return { updatedMap: currentMap, wallsChanged: false };

      const { x, y } = currentPos;

      if (!currentMap.cells[y]?.[x] || !actualMaze.cells[y]?.[x]) return { updatedMap: currentMap, wallsChanged: false };

      const actualCell = actualMaze.cells[y][x];
      let wallsChanged = false;
      const mapCopy = JSON.parse(JSON.stringify(currentMap));

      const neighborDefs = [
        { dx: 0, dy: 1, wall: "north", neighborWall: "south" },
        { dx: 1, dy: 0, wall: "east", neighborWall: "west" },
        { dx: 0, dy: -1, wall: "south", neighborWall: "north" },
        { dx: -1, dy: 0, wall: "west", neighborWall: "east" },
      ] as const;

      for (const move of neighborDefs) {
        const nx = x + move.dx;
        const ny = y + move.dy;

        if (nx < 0 || nx >= actualMaze.width || ny < 0 || ny >= actualMaze.height || !mapCopy.cells[ny]?.[nx]) continue;

        const actualWallExists = actualCell[move.wall];

        if (mapCopy.cells[y][x][move.wall] !== actualWallExists) {
          mapCopy.cells[y][x][move.wall] = actualWallExists;

          mapCopy.cells[ny][nx][move.neighborWall] = actualWallExists;
          wallsChanged = true;
        }
      }
      return { updatedMap: mapCopy, wallsChanged };
    },
    [actualMaze]
  );

  const findBestMove = (currentMap: Maze, currentPos: Coordinates): Coordinates | null => {
    const { x, y } = currentPos;
    if (!currentMap.cells[y]?.[x]) return null;

    const currentCell = currentMap.cells[y][x];
    let bestNeighbor: Coordinates | null = null;
    let minDistance = currentCell.distance;

    const neighborDefs = [
      { dx: 0, dy: 1, wall: "north", neighborWall: "south" },
      { dx: 1, dy: 0, wall: "east", neighborWall: "west" },
      { dx: 0, dy: -1, wall: "south", neighborWall: "north" },
      { dx: -1, dy: 0, wall: "west", neighborWall: "east" },
    ] as const;

    for (const move of neighborDefs) {
      const nx = x + move.dx;
      const ny = y + move.dy;

      if (nx < 0 || nx >= currentMap.width || ny < 0 || ny >= currentMap.height || !currentMap.cells[ny]?.[nx]) continue;

      const neighborCell = currentMap.cells[ny][nx];
      const wallExists = currentCell[move.wall];

      if (!wallExists && neighborCell.distance < minDistance) {
        minDistance = neighborCell.distance;
        bestNeighbor = { x: nx, y: ny };
      }
    }
    return bestNeighbor;
  };

  const isExplorationComplete = useCallback((map: Maze | null, visited: Set<string>): boolean => {
    if (!map) return true;

    for (const visitedCoordStr of visited) {
      const [xStr, yStr] = visitedCoordStr.split("-");
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);

      if (isNaN(x) || isNaN(y) || !map.cells[y]?.[x]) continue;

      const currentCell = map.cells[y][x];
      const neighborDefs = [
        { dx: 0, dy: 1, wall: "north" },
        { dx: 1, dy: 0, wall: "east" },
        { dx: 0, dy: -1, wall: "south" },
        { dx: -1, dy: 0, wall: "west" },
      ] as const;

      for (const move of neighborDefs) {
        const nx = x + move.dx;
        const ny = y + move.dy;

        if (nx < 0 || nx >= map.width || ny < 0 || ny >= map.height || !map.cells[ny]?.[nx]) continue;

        const wallExists = currentCell[move.wall];
        const neighborCoordStr = `${nx}-${ny}`;

        if (!wallExists && !visited.has(neighborCoordStr)) {
          return false;
        }
      }
    }

    console.log("Exploration appears complete (no unvisited reachable neighbors).");
    return true;
  }, []);

  const explorationStep = useCallback(() => {
    if (!actualMaze || !knownMap || !robotPosition) {
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }

    const { x: currentX, y: currentY } = robotPosition;

    if (actualMaze.goalArea.some((gc) => gc.x === currentX && gc.y === currentY)) {
      console.log("Goal reached! Calculating path back to start...");
      const allKnownCells = getAllCoordStrings(knownMap);
      const mapWithDistancesToStart = calculateDistancesToStart(knownMap, allKnownCells);
      setKnownMap(mapWithDistancesToStart);
      setSimulationPhase(SimulationPhase.RETURNING_TO_START);
      return;
    }

    const { updatedMap: mapAfterDiscovery, wallsChanged } = performWallDiscoveryAndUpdateMap(knownMap, robotPosition);
    let currentMapToUse = mapAfterDiscovery;

    if (wallsChanged) {
      console.log("Walls updated, recalculating distances to goal...");
      currentMapToUse = calculateDistancesToGoal(mapAfterDiscovery, getAllCoordStrings(mapAfterDiscovery));
    }

    const bestMove = findBestMove(currentMapToUse, robotPosition);
    setKnownMap(currentMapToUse);

    if (bestMove) {
      setRobotPosition(bestMove);
      setVisitedCells((prev) => new Set(prev).add(`${bestMove.x}-${bestMove.y}`));
    } else {
      console.log("Exploration stuck at:", robotPosition);

      if (!wallsChanged) {
        console.log("Stuck and no walls changed, forcing recalculation to goal...");
        currentMapToUse = calculateDistancesToGoal(currentMapToUse, getAllCoordStrings(currentMapToUse));
        setKnownMap(currentMapToUse);
      }

      if (isExplorationComplete(currentMapToUse, visitedCells)) {
        console.log("Exploration complete (stuck and no unvisited reachable cells). Going IDLE.");
        setSimulationPhase(SimulationPhase.IDLE);
        checkAndEnableSpeedRun(currentMapToUse, visitedCells);
      }
    }
  }, [
    actualMaze,
    knownMap,
    robotPosition,
    visitedCells,
    calculateDistancesToGoal,
    performWallDiscoveryAndUpdateMap,
    calculateDistancesToStart,
    isExplorationComplete,
    checkAndEnableSpeedRun,
  ]);

  const returningToStartStep = useCallback(() => {
    if (!knownMap || !robotPosition) {
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }

    const { x: currentX, y: currentY } = robotPosition;
    const { startCell } = knownMap;

    if (currentX === startCell.x && currentY === startCell.y) {
      console.log("Returned to start cell. Stopping exploration.");
      checkAndEnableSpeedRun(knownMap, visitedCells);
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }

    const { updatedMap: mapAfterDiscovery, wallsChanged } = performWallDiscoveryAndUpdateMap(knownMap, robotPosition);
    let currentMapToUse = mapAfterDiscovery;

    if (wallsChanged) {
      console.log("Walls updated during return, recalculating distances to start...");

      currentMapToUse = calculateDistancesToStart(mapAfterDiscovery, getAllCoordStrings(mapAfterDiscovery));
    }

    const bestMove = findBestMove(currentMapToUse, robotPosition);
    setKnownMap(currentMapToUse);

    if (bestMove) {
      setRobotPosition(bestMove);
      setVisitedCells((prev) => new Set(prev).add(`${bestMove.x}-${bestMove.y}`));
    } else {
      console.log("Return to start stuck at:", robotPosition);

      if (!wallsChanged) {
        console.log("Stuck during return, forcing recalculation to start...");
        currentMapToUse = calculateDistancesToStart(currentMapToUse, getAllCoordStrings(currentMapToUse));
        setKnownMap(currentMapToUse);
      }

      if (isExplorationComplete(currentMapToUse, visitedCells)) {
        console.log("Exploration complete (stuck during return and no unvisited reachable cells). Going IDLE.");
        setSimulationPhase(SimulationPhase.IDLE);
        checkAndEnableSpeedRun(currentMapToUse, visitedCells);
      }
    }
  }, [knownMap, robotPosition, visitedCells, checkAndEnableSpeedRun, performWallDiscoveryAndUpdateMap, calculateDistancesToStart, isExplorationComplete]);

  const speedRunStep = useCallback(() => {
    if (!speedRunPath || !robotPosition) {
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }

    const currentIndex = speedRunPathIndexRef.current;

    if (currentIndex >= speedRunPath.length) {
      console.log("Speed run path completed.");
      setSimulationPhase(SimulationPhase.IDLE);
      return;
    }

    const nextPos = speedRunPath[currentIndex];
    setRobotPosition(nextPos);
    speedRunPathIndexRef.current += 1;

    if (speedRunPathIndexRef.current >= speedRunPath.length) {
      console.log("Speed run reached end of path.");
      setSimulationPhase(SimulationPhase.IDLE);
    }
  }, [speedRunPath, robotPosition]);

  useEffect(() => {
    clearSimulationTimer();
    let stepFunction: (() => void) | null = null;

    switch (simulationPhase) {
      case SimulationPhase.EXPLORATION:
        stepFunction = explorationStep;
        break;
      case SimulationPhase.RETURNING_TO_START:
        stepFunction = returningToStartStep;
        break;
      case SimulationPhase.SPEED_RUN:
        stepFunction = speedRunStep;
        break;
      case SimulationPhase.IDLE:
      default:
        break;
    }

    if (stepFunction) {
      simulationTimerIdRef.current = setTimeout(stepFunction, SIMULATION_STEP_DELAY_MS);
    }

    return clearSimulationTimer;
  }, [simulationPhase, explorationStep, returningToStartStep, speedRunStep, clearSimulationTimer]);

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
