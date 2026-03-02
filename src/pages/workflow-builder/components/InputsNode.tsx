import React, { useState, useCallback } from "react";
import { Handle, Position } from "@xyflow/react";
import { Database, Plus, X, Edit, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useReactFlow } from "@xyflow/react";

interface InputsNodeProps {
  data: {
    name: string;
    tag: string;
    function: string;
    params: {
      keys: Record<string, string>;
    };
    updateNode?: (id: string, data: any) => void;
  };
  id: string;
  selected: boolean;
}

const InputsNode: React.FC<InputsNodeProps> = ({ data, id, selected }) => {
  const { setNodes } = useReactFlow();

  // Local state for new key-value pairs
  const [newKey, setNewKey] = useState<string>("");
  const [newValue, setNewValue] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Extract input keys from the node data
  const inputKeys = Object.keys(data.params?.keys || {});

  // Function to update the node data in the parent component
  const updateNodeData = useCallback(
    (updatedParams: Record<string, any>) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === id) {
            // Create a new node with updated data
            return {
              ...node,
              data: {
                ...node.data,
                params: updatedParams,
              },
            };
          }
          return node;
        }),
      );
    },
    [id, setNodes],
  );

  // Handle adding a new key-value pair
  const handleAddKeyValue = () => {
    if (!newKey.trim()) {
      return;
    }

    // Create updated keys object
    const updatedKeys = {
      ...(data.params?.keys || {}),
      [newKey]: newValue,
    };

    // Update the node data
    updateNodeData({ keys: updatedKeys });

    // Reset form
    setNewKey("");
    setNewValue("");
    setIsAdding(false);
  };

  // Start editing a key-value pair
  const handleStartEdit = (key: string) => {
    setEditingKey(key);
    setEditValue(data.params?.keys[key] || "");
  };

  // Save edited value
  const handleSaveEdit = () => {
    if (editingKey && data.params?.keys) {
      const updatedKeys = {
        ...data.params.keys,
        [editingKey]: editValue,
      };

      // Update the node data
      updateNodeData({ keys: updatedKeys });

      setEditingKey(null);
      setEditValue("");
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
  };

  // Handle removing a key-value pair
  const handleRemoveKey = (key: string) => {
    if (data.params?.keys) {
      const updatedKeys = { ...data.params.keys };
      delete updatedKeys[key];

      // Update the node data
      updateNodeData({ keys: updatedKeys });
    }
  };

  return (
    <div
      className={`node-inputs w-[280px] max-w-[280px] transition-all duration-300 ${selected ? "ring-2 ring-green-400" : ""}`}
    >
      {/* Header section */}
      <div className="flex items-center justify-between rounded-t-xl border-b border-green-100 bg-green-50 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="rounded-md p-1.5">
            <Database className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium leading-tight">
              {data.tag || "Default Inputs"}
            </h3>
            {/* <p className="max-w-[140px] truncate text-xs text-gray-500">
              {data.name}
            </p> */}
          </div>
        </div>
        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
          {data.function || "inputs"}
        </span>
      </div>

      {/* Content section */}
      <div className="px-3 py-2">
        {/* Add key button */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">
            Input Parameters
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 border-green-200 px-2 text-xs hover:bg-green-50 hover:text-green-700"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-3 w-3" />
            Add Key
          </Button>
        </div>

        {/* Add new key-value form */}
        {isAdding && (
          <div className="mb-3 rounded-md border border-green-100 bg-green-50 p-2">
            <div className="mb-1 space-y-1.5">
              <Input
                className="h-7 text-xs"
                placeholder="Key name"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
              <Input
                className="h-7 text-xs"
                placeholder="Value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>
            <div className="mt-2 flex justify-end space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-6 bg-green-600 px-2 text-xs hover:bg-green-700"
                onClick={handleAddKeyValue}
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Key-value list with fixed height */}
        <div className="rounded-md border border-input bg-transparent">
          <ScrollArea className="h-[120px] w-full rounded-md">
            <div className="space-y-1 p-2">
              {inputKeys.length > 0 ? (
                inputKeys.map((key) => (
                  <div
                    key={key}
                    className="group flex items-center justify-between rounded-md border border-gray-100 bg-white px-2 py-1.5"
                  >
                    {editingKey === key ? (
                      <>
                        <Input
                          className="mr-1 h-6 flex-1 text-xs"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                        />
                        <div className="flex">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-3 w-3 text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-green-600"
                            onClick={handleSaveEdit}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-xs font-medium text-gray-900">
                            {key}
                          </span>
                          <span className="truncate text-xs text-gray-500">
                            {data.params.keys[key]}
                          </span>
                        </div>
                        <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-blue-500"
                            onClick={() => handleStartEdit(key)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => handleRemoveKey(key)}
                          >
                            <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-gray-400">
                  No input keys added
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Footer section */}
      {/* <div className="px-3 py-2 border-t border-green-100 bg-green-50 rounded-b-xl">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {inputKeys.length} parameter{inputKeys.length !== 1 ? 's' : ''}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div> */}

      {/* Output handles for each input key */}
      {inputKeys.map((key, index) => (
        <Handle
          key={key}
          id={key}
          type="source"
          position={Position.Right}
          style={{
            top: `${140 + index * 22}px`,
            background: "#16a34a",
            borderColor: "#ffffff",
            borderWidth: "2px",
          }}
          className="handle-source"
        />
      ))}
    </div>
  );
};

export default InputsNode;
