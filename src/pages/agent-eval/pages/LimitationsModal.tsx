import { Info } from "lucide-react";

export const LimitationsModal = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-[90vw] max-w-md rounded-lg shadow-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 h-8 w-8 text-gray-500 hover:text-gray-900"
        >
          ✕
        </button>
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Info className="h-5 w-5 text-yellow-500" />
          Agent Eval – Beta: Supported Use Cases
        </h2>
        <div className="text-sm mb-2">
          Agent Eval helps generate and evaluate test cases to check if your agent performs as expected. It works well for single agents that use features like memory and knowledge base.
        </div>
        <div className="text-sm mb-1 font-semibold mt-2">
          However, it currently does <span className="text-red-500 font-bold">not</span> support the following cases:
        </div>
        <ul className="list-disc ml-7 text-sm text-gray-700 mb-2">
          <li>Manager Agents</li>
          <li>Workflows (DAG) and Multi-agent systems</li>
          <li>Agents with data querying (Text-to-SQL)</li>
          <li>Agents using external tools</li>
          <li>Agents with Responsible AI (RAI) module enabled</li>
          <li>Multi-turn conversations</li>
          {/* <li>Structured Output</li> */}
        </ul>
        <div className="text-xs text-gray-500">
          We’re actively working to extend support to these scenarios soon.
        </div>
      </div>
    </div>
  );
};
