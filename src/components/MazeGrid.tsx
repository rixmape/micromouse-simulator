import { Cell, Coordinates, Maze } from "@/types";
import React from "react";

interface MazeGridProps {
  maze: Maze | null;
  robotPosition: Coordinates | null;
  visitedCells: Set<string>;
  speedRunPath: Coordinates[] | null;
}

const MazeGrid: React.FC<MazeGridProps> = ({ maze, robotPosition, visitedCells, speedRunPath }) => {
  if (!maze) {
    return <div>Loading Maze...</div>;
  }

  const { width, height, cells, startCell, goalArea } = maze;

  const isGoalCell = (x: number, y: number): boolean => {
    return goalArea.some((coord) => coord.x === x && coord.y === y);
  };

  const isOnSpeedRunPath = (x: number, y: number): boolean => {
    return speedRunPath?.some((coord) => coord.x === x && coord.y === y) ?? false;
  };

  const getCellBackgroundColor = (cell: Cell): string => {
    const { x, y } = cell;
    const isRobotHere = robotPosition?.x === x && robotPosition?.y === y;
    const isVisited = visitedCells.has(`${x}-${y}`);

    if (isRobotHere) return "bg-red-500";
    if (isOnSpeedRunPath(x, y)) return "bg-blue-300";
    if (isGoalCell(x, y)) return "bg-green-500";
    if (startCell.x === x && startCell.y === y) return "bg-yellow-300";
    if (isVisited) return "bg-gray-400";
    return "bg-white";
  };

  return (
    <div
      className="inline-grid border-collapse border border-black"
      style={{
        gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: height }).map((_, yIndex) => {
        const y = height - 1 - yIndex;
        return (
          <React.Fragment key={`row-${y}`}>
            {Array.from({ length: width }).map((_, x) => {
              const cell = cells[y][x];
              const wallClasses = [
                cell.north ? "border-t-2 border-t-black" : "border-t border-t-gray-300",
                cell.east ? "border-r-2 border-r-black" : "border-r border-r-gray-300",
                cell.south ? "border-b-2 border-b-black" : "border-b border-b-gray-300",
                cell.west ? "border-l-2 border-l-black" : "border-l border-l-gray-300",
              ].join(" ");

              const bgColor = getCellBackgroundColor(cell);

              return (
                <div
                  key={`cell-${x}-${y}`}
                  className={`w-6 h-6 relative flex items-center justify-center text-xs text-gray-600 ${wallClasses} ${bgColor}`}
                  title={`(${x},${y}) Dist: ${cell.distance === Infinity ? "Inf" : cell.distance}`}
                ></div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default React.memo(MazeGrid);
