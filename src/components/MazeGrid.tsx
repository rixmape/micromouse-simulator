import React from "react";
import { coordsToString } from "../lib/mazeUtils/coordinateUtils";
import type { Cell, Coordinates, CoordinateString, Maze } from "../types";
import { Direction } from "../types";

interface MazeGridProps {
  maze: Maze | null;
  robotPosition: Coordinates | null;
  visitedCells: Set<CoordinateString>;
  speedRunPath: Coordinates[] | null;
  absoluteShortestPath: Coordinates[] | null;
}

function getCellBackgroundColor(
  cell: Cell,
  robotPosition: Coordinates | null,
  visitedCells: Set<CoordinateString>,
  speedRunPath: Coordinates[] | null,
  startCell: Coordinates,
  goalArea: Coordinates[]
): string {
  const { x, y } = cell;
  const coordStr = coordsToString({ x, y });
  if (robotPosition?.x === x && robotPosition?.y === y) return "bg-red-500";
  if (speedRunPath?.some((coord) => coord.x === x && coord.y === y)) return "bg-blue-300";
  if (goalArea.some((coord) => coord.x === x && coord.y === y)) return "bg-green-500";
  if (startCell.x === x && startCell.y === y) return "bg-yellow-300";
  if (visitedCells.has(coordStr)) return "bg-gray-400";
  return "bg-white";
}

const MazeGrid: React.FC<MazeGridProps> = ({ maze, robotPosition, visitedCells, speedRunPath, absoluteShortestPath }) => {
  if (!maze) {
    return <div className="w-96 h-96 bg-gray-200 flex items-center justify-center text-gray-500">Loading Maze...</div>;
  }
  const { width, height, cells, startCell, goalArea } = maze;
  const isOnAbsoluteShortestPath = (x: number, y: number): boolean => {
    return absoluteShortestPath?.some((coord) => coord.x === x && coord.y === y) ?? false;
  };
  return (
    <div
      className="inline-grid border-collapse border border-black"
      style={{
        gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
        userSelect: "none",
      }}
    >
      {Array.from({ length: height }).map((_, yIndex) => {
        const y = height - 1 - yIndex;
        return (
          <React.Fragment key={`row-${y}`}>
            {Array.from({ length: width }).map((_, x) => {
              const cell = cells[y]?.[x];
              if (!cell) {
                return (
                  <div
                    key={`cell-empty-${x}-${y}`}
                    className="w-6 h-6 bg-pink-100 border border-dashed border-pink-400 flex items-center justify-center text-xs font-bold text-pink-600"
                    title={`Invalid Cell (${x},${y})`}
                  >
                    !
                  </div>
                );
              }
              const wallClasses = [
                cell[Direction.North] ? "border-t-2 border-t-black" : "border-t border-t-gray-300",
                cell[Direction.East] ? "border-r-2 border-r-black" : "border-r border-r-gray-300",
                cell[Direction.South] ? "border-b-2 border-b-black" : "border-b border-b-gray-300",
                cell[Direction.West] ? "border-l-2 border-l-black" : "border-l border-l-gray-300",
              ].join(" ");
              const bgColor = getCellBackgroundColor(cell, robotPosition, visitedCells, speedRunPath, startCell, goalArea);
              const displayDistance = cell.distance === Infinity ? "Inf" : cell.distance;
              const onAbsPath = isOnAbsoluteShortestPath(x, y);
              return (
                <div
                  key={`cell-${x}-${y}`}
                  className={`w-6 h-6 relative flex items-center justify-center text-xs text-gray-600 ${wallClasses} ${bgColor}`}
                  title={`(${x},${y}) Dist: ${displayDistance}`}
                >
                  {onAbsPath && <div className="absolute w-2 h-2 bg-purple-600 rounded-full opacity-75 pointer-events-none"></div>}
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default React.memo(MazeGrid);
