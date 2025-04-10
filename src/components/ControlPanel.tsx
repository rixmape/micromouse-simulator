import { SimulationPhase } from "@/types";
import React from "react";

interface ControlPanelProps {
  simulationPhase: SimulationPhase;

  canStartSpeedRun: boolean;
  onStartExploration: () => void;
  onStartSpeedRun: () => void;
  onReset: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ simulationPhase, canStartSpeedRun, onStartExploration, onStartSpeedRun, onReset }) => {
  const isIdle = simulationPhase === SimulationPhase.IDLE;

  const buttonBaseClass = "px-4 py-2 rounded text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2";
  const enabledClass = "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500";
  const disabledClass = "bg-gray-400 cursor-not-allowed";

  return (
    <div className="p-4 space-x-4 border rounded-md shadow-md bg-gray-50">
      <button onClick={onStartExploration} disabled={!isIdle} className={`${buttonBaseClass} ${isIdle ? enabledClass : disabledClass}`}>
        Start Exploration
      </button>
      <button
        onClick={onStartSpeedRun}
        disabled={!isIdle || !canStartSpeedRun}
        className={`${buttonBaseClass} ${isIdle && canStartSpeedRun ? enabledClass : disabledClass}`}
      >
        Start Speed Run
      </button>
      <button onClick={onReset} className={`${buttonBaseClass} ${enabledClass}`}>
        Reset
      </button>
    </div>
  );
};

export default React.memo(ControlPanel);
