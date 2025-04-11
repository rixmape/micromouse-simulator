import { shuffleArray } from "../../lib/commonUtils/arrayUtils";
import { NEIGHBOR_DEFS } from "../../lib/mazeUtils/mazeNavigationUtils";
import type { Cell } from "../../types";

export function carvePassages(cx: number, cy: number, cells: Cell[][], visited: boolean[][], width: number, height: number): void {
  visited[cy][cx] = true;
  const neighbors = shuffleArray([...NEIGHBOR_DEFS]);
  for (const neighbor of neighbors) {
    const nx = cx + neighbor.dx;
    const ny = cy + neighbor.dy;
    const wall = neighbor.wall;
    const neighborWall = neighbor.neighborWall;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx]) {
      const currentCell = cells[cy]?.[cx];
      const neighborCell = cells[ny]?.[nx];
      if (currentCell) {
        currentCell[wall] = false;
      }
      if (neighborCell) {
        neighborCell[neighborWall] = false;
      }
      carvePassages(nx, ny, cells, visited, width, height);
    }
  }
}
