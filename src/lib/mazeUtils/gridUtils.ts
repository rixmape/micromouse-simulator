export function createGrid<T>(width: number, height: number, initializer: (x: number, y: number) => T): T[][] {
  const grid: T[][] = [];
  for (let y = 0; y < height; y++) {
    const row: T[] = [];
    for (let x = 0; x < width; x++) {
      row.push(initializer(x, y));
    }
    grid.push(row);
  }
  return grid;
}
