import { SimulationPhase } from "@/types";
import React from "react";

interface ControlPanelProps {
  simulationPhase: SimulationPhase;
  canStartSpeedRun: boolean;
  onStartExploration: () => void;
  onStartSpeedRun: () => void;
  onReset: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  simulationPhase,
  canStartSpeedRun,
  onStartExploration,
  onStartSpeedRun,
  onReset
}) => {
  const isIdle = simulationPhase === SimulationPhase.IDLE;
  const isSpeedRunEnabled = isIdle && canStartSpeedRun;
  return (
    <div className="p-4 space-x-4 border border-gray-200 rounded-md shadow-md bg-white">
      <button
        onClick={onStartExploration}
        disabled={!isIdle}
        className={`btn-base ${isIdle ? 'btn-enabled' : 'btn-disabled'}`}
      >
        Start Exploration
      </button>
      <button
        onClick={onStartSpeedRun}
        disabled={!isSpeedRunEnabled}
        className={`btn-base ${isSpeedRunEnabled ? 'btn-enabled' : 'btn-disabled'}`}
      >
        Start Speed Run
      </button>
      <button
        onClick={onReset}
        className={`btn-base btn-enabled`}
      >
        Reset
      </button>
    </div>
  );
};

export default React.memo(ControlPanel);
