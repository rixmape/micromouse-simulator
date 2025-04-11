import React from "react";
import { SimulationPhase } from "../types";

interface SidebarProps {
  currentWidth: number;
  currentHeight: number;
  currentWallsFactor: number;
  currentDelay: number;
  startX: number;
  startY: number;
  goalCenterX: number;
  goalCenterY: number;
  onWidthChange: (newWidth: number) => void;
  onHeightChange: (newHeight: number) => void;
  onWallsFactorChange: (newFactor: number) => void;
  onDelayChange: (newDelay: number) => void;
  onStartXChange: (newX: number) => void;
  onStartYChange: (newY: number) => void;
  onGoalCenterXChange: (newX: number) => void;
  onGoalCenterYChange: (newY: number) => void;
  onRandomize: () => void;
  simulationPhase: SimulationPhase;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentWidth,
  currentHeight,
  currentWallsFactor,
  currentDelay,
  startX,
  startY,
  goalCenterX,
  goalCenterY,
  onWidthChange,
  onHeightChange,
  onWallsFactorChange,
  onDelayChange,
  onStartXChange,
  onStartYChange,
  onGoalCenterXChange,
  onGoalCenterYChange,
  onRandomize,
  simulationPhase,
}) => {
  const isDisabled = simulationPhase !== SimulationPhase.IDLE;
  const buttonBaseClass = "px-4 py-2 rounded text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2";
  const enabledClass = "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500";
  const disabledClass = "bg-gray-300 cursor-not-allowed";
  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>, callback: (value: number) => void, min: number, max: number) => {
    let value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      value = Math.max(min, Math.min(max, value));
      callback(value);
    }
  };
  const handleFloatChange = (event: React.ChangeEvent<HTMLInputElement>, callback: (value: number) => void, min: number, max: number) => {
    let value = parseFloat(event.target.value);
    if (!isNaN(value)) {
      value = Math.max(min, Math.min(max, value));
      callback(value);
    }
  };
  const inputBaseClass = `w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500`;
  const inputDisabledClass = `cursor-not-allowed opacity-50 bg-gray-100`;
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
          onChange={(e) => handleNumberChange(e, onWidthChange, 8, 64)}
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
          onChange={(e) => handleNumberChange(e, onHeightChange, 8, 64)}
          disabled={isDisabled}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${isDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-300"}`}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="startX" className="block text-sm font-medium text-gray-700">
          Start X: <span className="font-bold">{startX}</span>
        </label>
        <input
          type="number"
          id="startX"
          name="startX"
          min="0"
          max={Math.max(0, currentWidth - 1)}
          step="1"
          value={startX}
          onChange={(e) => handleNumberChange(e, onStartXChange, 0, Math.max(0, currentWidth - 1))}
          disabled={isDisabled || currentWidth <= 0}
          className={`${inputBaseClass} ${isDisabled || currentWidth <= 0 ? inputDisabledClass : ""}`}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="startY" className="block text-sm font-medium text-gray-700">
          Start Y: <span className="font-bold">{startY}</span>
        </label>
        <input
          type="number"
          id="startY"
          name="startY"
          min="0"
          max={Math.max(0, currentHeight - 1)}
          step="1"
          value={startY}
          onChange={(e) => handleNumberChange(e, onStartYChange, 0, Math.max(0, currentHeight - 1))}
          disabled={isDisabled || currentHeight <= 0}
          className={`${inputBaseClass} ${isDisabled || currentHeight <= 0 ? inputDisabledClass : ""}`}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="goalCenterX" className="block text-sm font-medium text-gray-700">
          Goal Center X: <span className="font-bold">{goalCenterX < 0 ? "Auto" : goalCenterX}</span>
        </label>
        <input
          type="number"
          id="goalCenterX"
          name="goalCenterX"
          min="-1"
          max={Math.max(0, currentWidth - 1)}
          step="1"
          value={goalCenterX}
          onChange={(e) => handleNumberChange(e, onGoalCenterXChange, -1, Math.max(0, currentWidth - 1))}
          disabled={isDisabled || currentWidth <= 0}
          className={`${inputBaseClass} ${isDisabled || currentWidth <= 0 ? inputDisabledClass : ""}`}
          title="Goal area center X (-1 for auto near middle)"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="goalCenterY" className="block text-sm font-medium text-gray-700">
          Goal Center Y: <span className="font-bold">{goalCenterY < 0 ? "Auto" : goalCenterY}</span>
        </label>
        <input
          type="number"
          id="goalCenterY"
          name="goalCenterY"
          min="-1"
          max={Math.max(0, currentHeight - 1)}
          step="1"
          value={goalCenterY}
          onChange={(e) => handleNumberChange(e, onGoalCenterYChange, -1, Math.max(0, currentHeight - 1))}
          disabled={isDisabled || currentHeight <= 0}
          className={`${inputBaseClass} ${isDisabled || currentHeight <= 0 ? inputDisabledClass : ""}`}
          title="Goal area center Y (-1 for auto near middle)"
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
          onChange={(e) => handleFloatChange(e, onWallsFactorChange, 0, 0.5)}
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
          onChange={(e) => handleNumberChange(e, onDelayChange, 0, 200)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer hover:bg-gray-300"
        />
      </div>
      <button onClick={onRandomize} disabled={isDisabled} className={`${buttonBaseClass} ${isDisabled ? disabledClass : enabledClass} w-full mt-2`}>
        Randomize Walls
      </button>
      <p className="text-xs text-gray-500 pt-2">Note: Changing Width, Height, Start/Goal, or Extra Paths will reset the simulation.</p>
    </div>
  );
};

export default React.memo(Sidebar);
