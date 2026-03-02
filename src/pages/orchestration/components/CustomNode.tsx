import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/custom/button";

const CustomNode: React.FC<any> = ({ id, data, selected }) => {
  const onDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    data.onDelete(id);
  };

  return (
    <div
      className={`relative rounded-md border border-gray-300 bg-white px-4 py-2 shadow-md dark:border-gray-600 dark:bg-gray-700 ${selected ? "ring-2 ring-blue-500" : ""}`}
    >
      <Handle type="target" position={Position.Top} className="h-2 w-2" />
      <div className="font-bold text-gray-800 dark:text-gray-200">
        {data.label}
      </div>
      {selected && (
        <Button
          size={null}
          className="absolute bottom-7 left-28 bg-gray-100 text-gray-800 hover:text-red-500 dark:bg-gray-800 dark:text-gray-200 dark:hover:text-red-500"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
      <Handle type="source" position={Position.Bottom} className="h-2 w-2" />
    </div>
  );
};

export default CustomNode;
