import type { Coordinates, Maze, SimulationAction } from "../../types";

export function setActualMaze(maze: Maze): SimulationAction {
  return {
    type: "SET_ACTUAL_MAZE",
    payload: maze,
  };
}

export function updateKnownMap(newMap: Maze): SimulationAction {
  return {
    type: "UPDATE_KNOWN_MAP",
    payload: newMap,
  };
}

export function setAbsoluteShortestPath(path: Coordinates[] | null): SimulationAction {
  return {
    type: "SET_ABSOLUTE_PATH",
    payload: path,
  };
}
