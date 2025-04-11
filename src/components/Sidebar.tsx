import React from "react";
import { SimulationPhase } from "../types";

interface SidebarProps {
  currentWidth: number;
  currentHeight: number;
  currentWallsFactor: number;
  currentDelay: number;
  onWidthChange: (newWidth: number) => void;
  onHeightChange: (newHeight: number) => void;
  onWallsFactorChange: (newFactor: number) => void;
  onDelayChange: (newDelay: number) => void;
  onRandomize: () => void;
  simulationPhase: SimulationPhase;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentWidth,
  currentHeight,
  currentWallsFactor,
  currentDelay,
  onWidthChange,
  onHeightChange,
  onWallsFactorChange,
  onDelayChange,
  onRandomize,
  simulationPhase,
}) => {
  const isDisabled = simulationPhase !== SimulationPhase.IDLE;
  const buttonBaseClass = "px-4 py-2 rounded text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2";
  const enabledClass = "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500";
  const disabledClass = "bg-gray-300 cursor-not-allowed";
  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>, callback: (value: number) => void) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      callback(value);
    }
  };
  const handleFloatChange = (event: React.ChangeEvent<HTMLInputElement>, callback: (value: number) => void) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value)) {
      callback(value);
    }
  };
  return (
    <div className="w-full lg:w-64 p-4 space-y-4 border border-gray-300 rounded-md shadow-md bg-white">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Simulation Controls</h2>
      <div className="space-y-1">
        <label htmlFor="mazeWidth" className="block text-sm font-medium text-gray-700">
          Maze Width: <span className="font-bold">{currentWidth}</span>
        </label>
        <input
          type="range"
          id="mazeWidth"
          name="mazeWidth"
          min="8"
          max="64"
          step="1"
          value={currentWidth}
          onChange={(e) => handleNumberChange(e, onWidthChange)}
          disabled={isDisabled}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${isDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-300"}`}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="mazeHeight" className="block text-sm font-medium text-gray-700">
          Maze Height: <span className="font-bold">{currentHeight}</span>
        </label>
        <input
          type="range"
          id="mazeHeight"
          name="mazeHeight"
          min="8"
          max="64"
          step="1"
          value={currentHeight}
          onChange={(e) => handleNumberChange(e, onHeightChange)}
          disabled={isDisabled}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${isDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-300"}`}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="wallsFactor" className="block text-sm font-medium text-gray-700">
          Extra Paths (%): <span className="font-bold">{(currentWallsFactor * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          id="wallsFactor"
          name="wallsFactor"
          min="0"
          max="0.5"
          step="0.01"
          value={currentWallsFactor}
          onChange={(e) => handleFloatChange(e, onWallsFactorChange)}
          disabled={isDisabled}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${isDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-300"}`}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="stepDelay" className="block text-sm font-medium text-gray-700">
          Step Delay (ms): <span className="font-bold">{currentDelay}</span>
        </label>
        <input
          type="range"
          id="stepDelay"
          name="stepDelay"
          min="0"
          max="200"
          step="1"
          value={currentDelay}
          onChange={(e) => handleNumberChange(e, onDelayChange)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer hover:bg-gray-300"
        />
      </div>
      <button onClick={onRandomize} disabled={isDisabled} className={`${buttonBaseClass} ${isDisabled ? disabledClass : enabledClass} w-full mt-2`}>
        Randomize Walls
      </button>
      <p className="text-xs text-gray-500 pt-2">Note: Changing Width, Height, or Extra Paths will reset the simulation.</p>
    </div>
  );
};

export default React.memo(Sidebar);
