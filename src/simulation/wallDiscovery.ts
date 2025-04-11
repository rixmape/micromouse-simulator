import { getValidNeighbors } from "../lib/mazeUtils/mazeNavigationUtils";
import { cloneMaze } from "../lib/mazeUtils/mazeStructureUtils";
import type { Coordinates, Maze } from "../types";

export function performWallDiscovery(
    currentPos: Coordinates,
    knownMap: Maze,
    actualMaze: Maze | null
): { updatedMap: Maze; wallsChanged: boolean } {
    if (!actualMaze) {
        return { updatedMap: knownMap, wallsChanged: false };
    }
    let wallsChanged = false;
    const mapCopy = cloneMaze(knownMap);
    const actualCell = actualMaze.cells[currentPos.y]?.[currentPos.x];
    const knownCell = mapCopy.cells[currentPos.y]?.[currentPos.x];
    if (!actualCell || !knownCell) {
        console.warn("Wall discovery called with invalid coordinates or map state:", currentPos);
        return { updatedMap: mapCopy, wallsChanged: false };
    }
    const neighbors = getValidNeighbors(actualMaze, currentPos);
    for (const { neighborCoords, moveDef } of neighbors) {
        const knownNeighborCell = mapCopy.cells[neighborCoords.y]?.[neighborCoords.x];
        const actualWallExists = actualCell[moveDef.wall];
        if (knownCell[moveDef.wall] !== actualWallExists) {
            knownCell[moveDef.wall] = actualWallExists;
            wallsChanged = true;
            if (knownNeighborCell) {
                knownNeighborCell[moveDef.neighborWall] = actualWallExists;
            }
        }
    }
    return { updatedMap: mapCopy, wallsChanged };
}
