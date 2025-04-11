import React from "react";

interface InfobarProps {
  projectDescription: string;
}

interface LegendItemProps {
  colorClass: string;
  label: string;
  isDot?: boolean;
}

const LegendItem: React.FC<LegendItemProps> = ({ colorClass, label, isDot = false }) => (
  <div className="flex items-center mb-2">
    {isDot ? (
      <div className="w-4 h-4 mr-2 flex items-center justify-center">
        <div className={`w-2 h-2 ${colorClass} rounded-full`}></div>
      </div>
    ) : (
      <div className={`w-4 h-4 mr-2 ${colorClass} rounded-sm border border-gray-300`}></div>
    )}
    <span className="text-sm text-gray-700">{label}</span>
  </div>
);

const Infobar: React.FC<InfobarProps> = ({ projectDescription }) => {
  const legendItems: LegendItemProps[] = [
    { colorClass: "bg-red-500", label: "Robot Position" },
    { colorClass: "bg-green-500", label: "Goal Cell(s)" },
    { colorClass: "bg-yellow-300", label: "Start Cell" },
    { colorClass: "bg-blue-300", label: "Speed Run Path" },
    { colorClass: "bg-gray-400", label: "Visited Cell" },
    { colorClass: "bg-white", label: "Unvisited Cell" },
    { colorClass: "bg-purple-600", label: "Absolute Shortest Path", isDot: true },
  ];
  return (
    <aside className="w-64 h-full bg-white p-4 border-l border-gray-300 shadow-sm flex-shrink-0 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-1">About</h2>
        <p className="text-sm text-gray-600">{projectDescription}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">Maze Legend</h2>
        {legendItems.map((item) => (
          <LegendItem key={item.label} colorClass={item.colorClass} label={item.label} isDot={item.isDot} />
        ))}
      </div>
    </aside>
  );
};

export default React.memo(Infobar);
