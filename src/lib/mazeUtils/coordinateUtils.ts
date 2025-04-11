import type { Coordinates } from "../../types";

export function isValidCoord(coords: Coordinates, width: number, height: number): boolean {
  return coords.x >= 0 && coords.x < width && coords.y >= 0 && coords.y < height;
}

export function coordsToString(coords: Coordinates): string {
  return `${coords.x}-${coords.y}`;
}

export function stringToCoords(str: string): Coordinates | null {
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
