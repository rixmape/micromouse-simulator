import React, { useCallback } from "react";
import { SimulationPhase } from "../types";
import { useSimulationParamsStore } from "../store/simulationParamsStore";

interface SidebarProps {
  simulationPhase: SimulationPhase;
  onRandomize: () => void;
}

interface RangeInputProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  displayValue: string | number;
  onChange: (value: number) => void;
  disabled: boolean;
  unit?: string;
}

const RangeInput: React.FC<RangeInputProps> = React.memo(({ id, label, min, max, step, value, displayValue, onChange, disabled, unit }) => {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = parseFloat(event.target.value);
      if (!isNaN(numValue)) {
        onChange(Math.max(min, Math.min(max, numValue)));
      }
    },
    [min, max, onChange]
  );
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}: <span className="font-medium">{displayValue}</span>
        {unit}
      </label>
      <input
        type="range"
        id={id}
        name={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${disabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-300"}`}
      />
    </div>
  );
});

RangeInput.displayName = "RangeInput";

interface NumberInputProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
  title?: string;
}

const NumberInput: React.FC<NumberInputProps> = React.memo(({ id, label, min, max, step, value, onChange, disabled, title }) => {
  const inputBaseClass = `w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500`;
  const inputDisabledClass = `cursor-not-allowed opacity-50 bg-gray-100`;
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = parseInt(event.target.value, 10);
      if (!isNaN(numValue)) {
        onChange(Math.max(min, Math.min(max, numValue)));
      } else if (event.target.value === "" && min <= 0) {
        onChange(min);
      }
    },
    [min, max, onChange]
  );
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}: <span className="font-medium">{value < 0 ? "Auto" : value}</span>
      </label>
      <input
        type="number"
        id={id}
        name={id}
        min={min}
        max={max}
        step={step}
        value={isNaN(value) ? "" : value}
        onChange={handleChange}
        disabled={disabled}
        className={`${inputBaseClass} ${disabled ? inputDisabledClass : ""}`}
        title={title}
      />
    </div>
  );
});

NumberInput.displayName = "NumberInput";

const Sidebar: React.FC<SidebarProps> = ({ simulationPhase, onRandomize }) => {
  const {
    mazeWidth,
    setMazeWidth,
    mazeHeight,
    setMazeHeight,
    wallsToRemoveFactor,
    setWallsToRemoveFactor,
    simulationDelay,
    setSimulationDelay,
    startX,
    setStartX,
    startY,
    setStartY,
    goalCenterX,
    setGoalCenterX,
    goalCenterY,
    setGoalCenterY,
  } = useSimulationParamsStore();
  const isControlDisabled = simulationPhase !== SimulationPhase.IDLE;
  return (
    <div className="w-full lg:w-64 p-4 space-y-4 border border-gray-200 rounded-md shadow-md bg-white">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Simulation Controls</h2>
      <RangeInput
        id="mazeWidth"
        label="Maze Width"
        min={8}
        max={64}
        step={1}
        value={mazeWidth}
        displayValue={mazeWidth}
        onChange={setMazeWidth}
        disabled={isControlDisabled}
      />
      <RangeInput
        id="mazeHeight"
        label="Maze Height"
        min={8}
        max={64}
        step={1}
        value={mazeHeight}
        displayValue={mazeHeight}
        onChange={setMazeHeight}
        disabled={isControlDisabled}
      />
      <NumberInput
        id="startX"
        label="Start X"
        min={0}
        max={Math.max(0, mazeWidth - 1)}
        step={1}
        value={startX}
        onChange={setStartX}
        disabled={isControlDisabled || mazeWidth <= 0}
      />
      <NumberInput
        id="startY"
        label="Start Y"
        min={0}
        max={Math.max(0, mazeHeight - 1)}
        step={1}
        value={startY}
        onChange={setStartY}
        disabled={isControlDisabled || mazeHeight <= 0}
      />
      <NumberInput
        id="goalCenterX"
        label="Goal Center X"
        min={-1}
        max={Math.max(-1, mazeWidth - 2)}
        step={1}
        value={goalCenterX}
        onChange={setGoalCenterX}
        disabled={isControlDisabled || mazeWidth <= 0}
        title="Goal area center X (-1 for auto near middle)"
      />
      <NumberInput
        id="goalCenterY"
        label="Goal Center Y"
        min={-1}
        max={Math.max(-1, mazeHeight - 2)}
        step={1}
        value={goalCenterY}
        onChange={setGoalCenterY}
        disabled={isControlDisabled || mazeHeight <= 0}
        title="Goal area center Y (-1 for auto near middle)"
      />
      <RangeInput
        id="wallsFactor"
        label="Extra Paths"
        min={0}
        max={0.5}
        step={0.01}
        value={wallsToRemoveFactor}
        displayValue={`${(wallsToRemoveFactor * 100).toFixed(0)}`}
        unit="%"
        onChange={setWallsToRemoveFactor}
        disabled={isControlDisabled}
      />
      <RangeInput
        id="stepDelay"
        label="Step Delay"
        min={0}
        max={200}
        step={1}
        value={simulationDelay}
        displayValue={simulationDelay}
        unit="ms"
        onChange={setSimulationDelay}
        disabled={false}
      />
      <button onClick={onRandomize} className={`w-full mt-2 btn-base ${isControlDisabled ? "btn-disabled" : "btn-enabled"}`} disabled={isControlDisabled}>
        Randomize Walls
      </button>
      <p className="text-xs text-gray-500 pt-2">Note: Changing Width, Height, Start/Goal, or Extra Paths will reset the simulation.</p>
    </div>
  );
};

export default React.memo(Sidebar);
