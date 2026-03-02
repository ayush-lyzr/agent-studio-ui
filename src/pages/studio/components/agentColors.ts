const AGENT_COLORS = [
  "bg-purple-700", // Primary Purple
  "bg-indigo-600", // Indigo
  "bg-blue-600", // Blue
  "bg-cyan-600", // Cyan
  "bg-teal-600", // Teal
  "bg-green-600", // Green
  "bg-yellow-600", // Yellow
  "bg-orange-600", // Orange
  "bg-red-600", // Red
  "bg-pink-600", // Pink
];

const agentColorMap: Record<string, string> = {
  "Manager Agent": "bg-green-700",
  AI: "bg-blue-700",
};

let colorIndex = 0;

export const getAgentColor = (agentName: string): string => {
  if (agentColorMap[agentName]) {
    return agentColorMap[agentName];
  }

  const newColor = AGENT_COLORS[colorIndex % AGENT_COLORS.length];
  colorIndex++;

  agentColorMap[agentName] = newColor;

  return newColor;
};
