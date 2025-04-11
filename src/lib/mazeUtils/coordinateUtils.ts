import type { Coordinates, CoordinateString, Maze } from "../../types";

export function isValidCoord(coords: Coordinates, width: number, height: number): boolean {
  return coords.x >= 0 && coords.x < width && coords.y >= 0 && coords.y < height;
}

export function coordsToString(coords: Coordinates): CoordinateString {
  return `${coords.x}-${coords.y}`;
}

export function stringToCoords(str: CoordinateString): Coordinates | null {
  if (typeof str !== "string") {
    return null;
  }
  const parts = str.split("-");
  if (parts.length === 2) {
    const x = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);
    if (!isNaN(x) && !isNaN(y)) {
      return { x, y };
    }
  }
  return null;
}

export function getAllCoordStrings(map: Maze | null): Set<CoordinateString> {
  const coords = new Set<CoordinateString>();
  if (!map) {
    return coords;
  }
  map.cells.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        coords.add(coordsToString({ x, y }));
      }
    });
  });
  return coords;
}
