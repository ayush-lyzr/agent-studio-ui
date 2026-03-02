import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Plus,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  children?: FileItem[];
  language?: string;
  metadata?: {
    agentId?: string;
    [key: string]: any;
  };
}

interface FileExplorerProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
  onFileCreate: (
    parentId: string | null,
    fileType: "file" | "folder",
    name: string,
  ) => void;
  onFileDelete: (fileId: string) => void;
  selectedFileId: string | null;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  selectedFileId,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [newItemParent, setNewItemParent] = useState<string | null>(null);
  const [newItemType, setNewItemType] = useState<"file" | "folder">("file");
  const [newItemName, setNewItemName] = useState<string>("");

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleNewItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
      onFileCreate(newItemParent, newItemType, newItemName.trim());
      setNewItemName("");
      setNewItemParent(null);
    }
  };

  const renderFileTree = (
    items: FileItem[],
    level = 0,
    parent: string | null = null,
  ) => {
    return (
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <div
              className={cn(
                "group flex items-center rounded-md px-2 py-1 hover:bg-accent",
                selectedFileId === item.id && "bg-accent",
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                className="mr-1 h-4 w-4 p-0"
                onClick={() => item.type === "folder" && toggleFolder(item.id)}
              >
                {item.type === "folder" &&
                  (expandedFolders.has(item.id) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  ))}
              </Button>

              <span
                className="flex flex-1 cursor-pointer items-center text-sm"
                onClick={() =>
                  item.type === "file"
                    ? onFileSelect(item)
                    : toggleFolder(item.id)
                }
              >
                {item.type === "folder" ? (
                  <Folder className="mr-1 h-4 w-4 text-blue-500" />
                ) : (
                  <File className="mr-1 h-4 w-4 text-gray-500" />
                )}
                <span className="truncate">{item.name}</span>
              </span>

              <div className="flex items-center opacity-0 group-hover:opacity-100">
                {item.type === "folder" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setNewItemParent(item.id);
                      setNewItemType("file");
                    }}
                    title="Add File"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0 text-red-500"
                  onClick={() => onFileDelete(item.id)}
                  title="Delete"
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {item.type === "folder" && expandedFolders.has(item.id) && (
              <div className="ml-4 mt-1 border-l border-border pl-2">
                {item.children &&
                  renderFileTree(item.children, level + 1, item.id)}
                {newItemParent === item.id && (
                  <form
                    onSubmit={handleNewItemSubmit}
                    className="flex items-center py-1"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mr-1 h-5 w-5 p-0"
                      onClick={() =>
                        setNewItemType(
                          newItemType === "file" ? "folder" : "file",
                        )
                      }
                      title={
                        newItemType === "file"
                          ? "Change to folder"
                          : "Change to file"
                      }
                    >
                      {newItemType === "file" ? (
                        <File className="h-3 w-3 text-gray-500" />
                      ) : (
                        <Folder className="h-3 w-3 text-blue-500" />
                      )}
                    </Button>
                    <Input
                      className="h-6 text-xs"
                      placeholder={`New ${newItemType} name...`}
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      autoFocus
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="ml-1 h-6 text-xs"
                    >
                      Add
                    </Button>
                  </form>
                )}
              </div>
            )}
          </li>
        ))}

        {level === 0 && newItemParent === null && (
          <li>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                setNewItemParent(parent);
                setNewItemType("folder");
              }}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Root Folder
            </Button>

            {newItemParent === parent && (
              <form
                onSubmit={handleNewItemSubmit}
                className="flex items-center py-1"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mr-1 h-5 w-5 p-0"
                  onClick={() =>
                    setNewItemType(newItemType === "file" ? "folder" : "file")
                  }
                  title={
                    newItemType === "file"
                      ? "Change to folder"
                      : "Change to file"
                  }
                >
                  {newItemType === "file" ? (
                    <File className="h-3 w-3 text-gray-500" />
                  ) : (
                    <Folder className="h-3 w-3 text-blue-500" />
                  )}
                </Button>
                <Input
                  className="h-6 text-xs"
                  placeholder={`New ${newItemType} name...`}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  autoFocus
                />
                <Button type="submit" size="sm" className="ml-1 h-6 text-xs">
                  Add
                </Button>
              </form>
            )}
          </li>
        )}
      </ul>
    );
  };

  return (
    <div className="h-full overflow-auto p-2">
      <div className="mb-2 pl-2 text-sm font-medium">Files</div>
      {renderFileTree(files)}
    </div>
  );
};

export default FileExplorer;
