import { shuffleArray } from "../../lib/commonUtils/arrayUtils";
import { isValidCoord } from "../../lib/mazeUtils/coordinateUtils";
import { createGrid } from "../../lib/mazeUtils/gridUtils";
import { setBoundaryWalls } from "../../lib/mazeUtils/mazeStructureUtils";
import { Cell, Coordinates, Direction, Maze, MazeCreationOptions } from "../../types";
import { carvePassages } from "./recursiveBacktracker";

function _calculateGoalArea(
    width: number,
    height: number,
    startX: number,
    startY: number,
    goalCenterX: number,
    goalCenterY: number
): Coordinates[] {
    const effectiveGoalCenterX = goalCenterX < 0
        ? Math.max(0, Math.min(width - 2, Math.floor(width / 2) - 1))
        : Math.max(0, Math.min(width - 2, goalCenterX));
    const effectiveGoalCenterY = goalCenterY < 0
        ? Math.max(0, Math.min(height - 2, Math.floor(height / 2) - 1))
        : Math.max(0, Math.min(height - 2, goalCenterY));
    const potentialGoalArea: Coordinates[] = [
        { x: effectiveGoalCenterX, y: effectiveGoalCenterY },
        { x: effectiveGoalCenterX + 1, y: effectiveGoalCenterY },
        { x: effectiveGoalCenterX, y: effectiveGoalCenterY + 1 },
        { x: effectiveGoalCenterX + 1, y: effectiveGoalCenterY + 1 },
    ];
    let goalArea = potentialGoalArea.filter((coord) => isValidCoord(coord, width, height));
    if (goalArea.length === 0) {
        const singleGoalX = Math.max(0, Math.min(width - 1, Math.floor(width / 2)));
        const singleGoalY = Math.max(0, Math.min(height - 1, Math.floor(height / 2)));
        if (isValidCoord({ x: singleGoalX, y: singleGoalY }, width, height) && (singleGoalX !== startX || singleGoalY !== startY)) {
            goalArea.push({ x: singleGoalX, y: singleGoalY });
        }
    }
    if (goalArea.length === 0) {
        const fallbackX = width - 1;
        const fallbackY = height - 1;
        if (fallbackX !== startX || fallbackY !== startY) {
            goalArea.push({ x: fallbackX, y: fallbackY });
        } else {
            if (0 !== startX || 0 !== startY) {
                goalArea.push({ x: 0, y: 0 });
            }
            else {
                if (width > 1) {
                  goalArea.push({ x: 1, y: 0 });
                } else if (height > 1) {
                  goalArea.push({ x: 0, y: 1 });
                }
            }
        }
    }
    if (goalArea.length > 1 && goalArea.some((g) => g.x === startX && g.y === startY)) {
        const nonStartGoal = goalArea.find((g) => g.x !== startX || g.y !== startY);
        if (nonStartGoal) {
            goalArea = [nonStartGoal];
        }
         else if (goalArea.length === 1 && goalArea[0].x === startX && goalArea[0].y === startY) {
         }
    }
     if (goalArea.length === 0) {
        throw new Error(`Could not determine a valid goal area for maze size ${width}x${height} starting at (${startX}, ${startY}).`);
     }
    return goalArea;
}

function _removeInternalWalls(
    cells: Cell[][],
    width: number,
    height: number,
    wallsToRemoveFactor: number
): void {
    const factor = Math.max(0, Math.min(1, wallsToRemoveFactor));
    if (factor === 0) {
        return;
    }
    const internalWalls: { x: number; y: number; wall: Direction }[] = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cell = cells[y]?.[x];
            if (!cell) continue;
            if (y < height - 1 && cell.north) {
                if(cells[y + 1]?.[x]){
                    internalWalls.push({ x, y, wall: Direction.North });
                }
            }
            if (x < width - 1 && cell.east) {
                 if(cells[y]?.[x + 1]){
                    internalWalls.push({ x, y, wall: Direction.East });
                }
            }
        }
    }
    shuffleArray(internalWalls);
    const numInternalWalls = internalWalls.length;
    const wallsToRemoveCount = Math.floor(numInternalWalls * factor);
    for (let i = 0; i < wallsToRemoveCount; i++) {
        const wallToRemove = internalWalls[i];
        if (!wallToRemove) continue;
        const { x, y, wall } = wallToRemove;
        const currentCell = cells[y]?.[x];
        if (wall === Direction.North && currentCell?.north) {
            const northNeighbor = cells[y + 1]?.[x];
            if (northNeighbor) {
                currentCell.north = false;
                northNeighbor.south = false;
            }
        } else if (wall === Direction.East && currentCell?.east) {
            const eastNeighbor = cells[y]?.[x + 1];
            if (eastNeighbor) {
                currentCell.east = false;
                eastNeighbor.west = false;
            }
        }
    }
}

export function createGeneratedMaze(options: MazeCreationOptions): Maze {
    const { width, height, wallsToRemoveFactor, startX, startY, goalCenterX, goalCenterY } = options;
    if (width < 1 || height < 1) {
       throw new Error("Maze dimensions must be at least 1x1.");
    }
     if (width === 1 && height === 1 && startX === 0 && startY === 0) {
         const cells = createGrid<Cell>(1, 1, (x, y) => ({
             x, y, north: true, east: true, south: true, west: true, distance: Infinity, visited: false,
         }));
         return { width: 1, height: 1, cells, startCell: { x: 0, y: 0 }, goalArea: [{ x: 0, y: 0 }] };
     }
    if (!isValidCoord({ x: startX, y: startY }, width, height)) {
        throw new Error(`Invalid start coordinates (${startX}, ${startY}) for maze size ${width}x${height}.`);
    }
    const cells = createGrid<Cell>(width, height, (x, y) => ({
        x,
        y,
        north: true,
        east: true,
        south: true,
        west: true,
        distance: Infinity,
        visited: false,
    }));
    const visited = createGrid<boolean>(width, height, () => false);
    carvePassages(startX, startY, cells, visited, width, height);
    _removeInternalWalls(cells, width, height, wallsToRemoveFactor);
    const goalArea = _calculateGoalArea(width, height, startX, startY, goalCenterX, goalCenterY);
    const startCell: Coordinates = { x: startX, y: startY };
    const maze: Maze = {
        width,
        height,
        cells,
        startCell,
        goalArea,
    };
    setBoundaryWalls(maze);
    return maze;
}
