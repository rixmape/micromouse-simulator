import { Coordinates, Maze } from "../types";

export function calculateFloodFillDistances(maze: Maze): void {
  const queue: Coordinates[] = [];

  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      maze.cells[y][x].distance = Infinity;
    }
  }

  maze.goalArea.forEach((goalCoord) => {
    if (goalCoord.x >= 0 && goalCoord.x < maze.width && goalCoord.y >= 0 && goalCoord.y < maze.height) {
      const goalCell = maze.cells[goalCoord.y][goalCoord.x];
      if (goalCell.distance === Infinity) {
        goalCell.distance = 0;
        queue.push(goalCoord);
      }
    }
  });

  let head = 0;
  while (head < queue.length) {
    const currentCoord = queue[head++];
    const currentCell = maze.cells[currentCoord.y][currentCoord.x];
    const currentDistance = currentCell.distance;

    const neighbors = [
      { dx: 0, dy: 1, wall: "north", neighborWall: "south" },
      { dx: 1, dy: 0, wall: "east", neighborWall: "west" },
      { dx: 0, dy: -1, wall: "south", neighborWall: "north" },
      { dx: -1, dy: 0, wall: "west", neighborWall: "east" },
    ];

    for (const move of neighbors) {
      const nx = currentCoord.x + move.dx;
      const ny = currentCoord.y + move.dy;

      if (nx < 0 || nx >= maze.width || ny < 0 || ny >= maze.height) {
        continue;
      }

      const neighborCell = maze.cells[ny][nx];
      // @ts-ignore - Indexing Cell with string keys
      const wallExists = currentCell[move.wall] || neighborCell[move.neighborWall];

      if (!wallExists && neighborCell.distance === Infinity) {
        neighborCell.distance = currentDistance + 1;
        queue.push({ x: nx, y: ny });
      }
    }
  }
}

export function findShortestPath(maze: Maze): Coordinates[] {
  const path: Coordinates[] = [];
  let currentCoord = { ...maze.startCell };

  if (
    currentCoord.x < 0 ||
    currentCoord.x >= maze.width ||
    currentCoord.y < 0 ||
    currentCoord.y >= maze.height ||
    maze.cells[currentCoord.y][currentCoord.x].distance === Infinity
  ) {
    console.error("Start cell is unreachable.");
    return [];
  }

  path.push(currentCoord);

  while (!maze.goalArea.some((gc) => gc.x === currentCoord.x && gc.y === currentCoord.y)) {
    const currentCell = maze.cells[currentCoord.y][currentCoord.x];
    let bestNeighbor: Coordinates | null = null;
    let minDistance = currentCell.distance;

    const neighbors = [
      { dx: 0, dy: 1, wall: "north", neighborWall: "south" },
      { dx: 1, dy: 0, wall: "east", neighborWall: "west" },
      { dx: 0, dy: -1, wall: "south", neighborWall: "north" },
      { dx: -1, dy: 0, wall: "west", neighborWall: "east" },
    ];

    for (const move of neighbors) {
      const nx = currentCoord.x + move.dx;
      const ny = currentCoord.y + move.dy;

      if (nx < 0 || nx >= maze.width || ny < 0 || ny >= maze.height) {
        continue;
      }

      const neighborCell = maze.cells[ny][nx];
      // @ts-ignore - Indexing Cell with string keys
      const wallExists = currentCell[move.wall] || neighborCell[move.neighborWall];

      if (!wallExists && neighborCell.distance < minDistance) {
        minDistance = neighborCell.distance;
        bestNeighbor = { x: nx, y: ny };
      }
    }

    if (bestNeighbor) {
      currentCoord = bestNeighbor;
      path.push(currentCoord);
    } else {
      console.error("Failed to find next step in pathfinding. Stuck at:", currentCoord);
      return [];
    }

    if (path.length > maze.width * maze.height) {
      console.error("Pathfinding exceeded maximum possible length. Aborting.");
      return [];
    }
  }

  return path;
}
