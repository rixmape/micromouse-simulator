import { Coordinates, Maze } from "../types";

export function calculateFloodFillDistances(maze: Maze, allowedCells: Set<string>): void {
  const queue: Coordinates[] = [];
  const { width, height, cells, goalArea } = maze;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (cells[y]?.[x]) {
        cells[y][x].distance = Infinity;
      }
    }
  }

  goalArea.forEach((coord) => {
    const coordStr = `${coord.x}-${coord.y}`;

    if (coord.x >= 0 && coord.x < width && coord.y >= 0 && coord.y < height && cells[coord.y]?.[coord.x] && allowedCells.has(coordStr)) {
      const cell = cells[coord.y][coord.x];
      if (cell.distance === Infinity) {
        cell.distance = 0;
        queue.push(coord);
      }
    }
  });

  const neighbors = [
    { dx: 0, dy: 1, wall: "north", neighborWall: "south" },
    { dx: 1, dy: 0, wall: "east", neighborWall: "west" },
    { dx: 0, dy: -1, wall: "south", neighborWall: "north" },
    { dx: -1, dy: 0, wall: "west", neighborWall: "east" },
  ] as const;

  let head = 0;
  while (head < queue.length) {
    const currentCoord = queue[head++];

    if (!cells[currentCoord.y]?.[currentCoord.x]) continue;
    const currentCell = cells[currentCoord.y][currentCoord.x];
    const currentDistance = currentCell.distance;

    for (const move of neighbors) {
      const nx = currentCoord.x + move.dx;
      const ny = currentCoord.y + move.dy;
      const neighborCoordStr = `${nx}-${ny}`;

      if (nx < 0 || nx >= width || ny < 0 || ny >= height || !cells[ny]?.[nx] || !allowedCells.has(neighborCoordStr)) {
        continue;
      }

      const neighborCell = cells[ny][nx];
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
  const { width, height, cells, goalArea } = maze;

  if (
    currentCoord.x < 0 ||
    currentCoord.x >= width ||
    currentCoord.y < 0 ||
    currentCoord.y >= height ||
    !cells[currentCoord.y]?.[currentCoord.x] ||
    cells[currentCoord.y][currentCoord.x].distance === Infinity
  ) {
    console.error("Start cell is unreachable or invalid based on calculated distances.");
    return [];
  }

  path.push(currentCoord);

  const neighbors = [
    { dx: 0, dy: 1, wall: "north", neighborWall: "south" },
    { dx: 1, dy: 0, wall: "east", neighborWall: "west" },
    { dx: 0, dy: -1, wall: "south", neighborWall: "north" },
    { dx: -1, dy: 0, wall: "west", neighborWall: "east" },
  ] as const;

  while (!goalArea.some((gc) => gc.x === currentCoord.x && gc.y === currentCoord.y)) {
    if (!cells[currentCoord.y]?.[currentCoord.x]) {
      console.error("Pathfinding entered invalid cell:", currentCoord);
      return [];
    }

    const currentCell = cells[currentCoord.y][currentCoord.x];
    let bestNeighbor: Coordinates | null = null;
    let minDistance = currentCell.distance;

    for (const move of neighbors) {
      const nx = currentCoord.x + move.dx;
      const ny = currentCoord.y + move.dy;

      if (nx < 0 || nx >= width || ny < 0 || ny >= height || !cells[ny]?.[nx]) {
        continue;
      }

      const neighborCell = cells[ny][nx];
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
      console.warn("Pathfinding stuck (no neighbor with lower distance):", currentCoord, "Min Distance:", minDistance);
      return [];
    }

    if (path.length > width * height * 2) {
      console.error("Pathfinding exceeded maximum possible length. Aborting.");
      return [];
    }
  }

  return path;
}
