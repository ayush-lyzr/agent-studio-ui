import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit } from "lucide-react";
import { Route } from "@/types/workflow";

interface RouterNodeConfigProps {
  routes: Route[];
  onSave: (routes: Route[]) => void;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (nodeId: string) => void;
  nodeId?: string;
}

const RouterNodeConfig: React.FC<RouterNodeConfigProps> = ({
  routes = [],
  onSave,
  isOpen,
  onClose,
  onDelete,
  nodeId,
}) => {
  const [localRoutes, setLocalRoutes] = useState<Route[]>(routes);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [editingRouteIndex, setEditingRouteIndex] = useState<number | null>(
    null,
  );
  const [newExample, setNewExample] = useState<string>("");
  const [fallbackRoute, setFallbackRoute] = useState<string>("");

  // Handle adding a new route
  const handleAddRoute = () => {
    setCurrentRoute({
      name: "",
      description: "",
      examples: [],
    });
    setNewExample("");
    setEditingRouteIndex(null);
  };

  // Handle editing an existing route
  const handleEditRoute = (index: number) => {
    setCurrentRoute({ ...localRoutes[index] });
    setEditingRouteIndex(index);
  };

  // Handle deleting a route
  const handleDeleteRoute = (index: number) => {
    const updatedRoutes = [...localRoutes];
    updatedRoutes.splice(index, 1);
    setLocalRoutes(updatedRoutes);
  };

  // Handle adding an example to current route
  const handleAddExample = () => {
    if (!newExample.trim() || !currentRoute) return;

    setCurrentRoute({
      ...currentRoute,
      examples: [...(currentRoute.examples || []), { text: newExample }],
    });
    setNewExample("");
  };

  // Handle deleting an example
  const handleDeleteExample = (index: number) => {
    if (!currentRoute) return;

    const updatedExamples = [...currentRoute.examples];
    updatedExamples.splice(index, 1);

    setCurrentRoute({
      ...currentRoute,
      examples: updatedExamples,
    });
  };

  // Save current route being edited
  const saveCurrentRoute = () => {
    if (!currentRoute || !currentRoute.name.trim()) return;

    let updatedRoutes = [...localRoutes];

    if (editingRouteIndex !== null) {
      // Update existing route
      updatedRoutes[editingRouteIndex] = currentRoute;
    } else {
      // Add new route
      updatedRoutes.push(currentRoute);
    }

    setLocalRoutes(updatedRoutes);
    setCurrentRoute(null);
    setEditingRouteIndex(null);
  };

  // Handle save all routes and close
  const handleSaveRoutes = () => {
    onSave(localRoutes);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Router Routes</DialogTitle>
          <DialogDescription>
            Define routes for your GPT Router. Each route should have a name,
            description, and example queries.
          </DialogDescription>
        </DialogHeader>

        {currentRoute ? (
          // Route editing form
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="route-name">Route Name</Label>
              <Input
                id="route-name"
                value={currentRoute.name}
                onChange={(e) =>
                  setCurrentRoute({ ...currentRoute, name: e.target.value })
                }
                placeholder="e.g., sports, food, science"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="route-description">Description</Label>
              <Textarea
                id="route-description"
                value={currentRoute.description || ""}
                onChange={(e) =>
                  setCurrentRoute({
                    ...currentRoute,
                    description: e.target.value,
                  })
                }
                placeholder="Describe what types of queries this route handles"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Examples</Label>
              <div className="rounded-md border p-3">
                {currentRoute.examples && currentRoute.examples.length > 0 ? (
                  <div className="mb-3 space-y-2">
                    {currentRoute.examples.map((example, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded border bg-white p-2"
                      >
                        <span className="text-sm">{example.text}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExample(index)}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-3 py-2 text-center text-sm text-gray-500">
                    No examples added
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Input
                    value={newExample}
                    onChange={(e) => setNewExample(e.target.value)}
                    placeholder="Add an example query"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddExample}
                    variant="outline"
                    size="sm"
                    disabled={!newExample.trim()}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentRoute(null);
                  setEditingRouteIndex(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={saveCurrentRoute}>
                {editingRouteIndex !== null ? "Update Route" : "Add Route"}
              </Button>
            </div>
          </div>
        ) : (
          // Routes list view
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Routes List</h3>
              <Button size="sm" onClick={handleAddRoute}>
                <Plus className="mr-1 h-4 w-4" />
                Add Route
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fallback-route">Fallback Route</Label>
              <Input
                id="fallback-route"
                value={fallbackRoute}
                onChange={(e) => setFallbackRoute(e.target.value)}
                placeholder="Default route if no match is found"
              />
            </div>

            {localRoutes.length > 0 ? (
              <div className="space-y-2">
                {localRoutes.map((route, index) => (
                  <div
                    key={index}
                    className="rounded-md border p-3 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium">{route.name}</h4>
                        {route.description && (
                          <p className="mt-1 text-xs text-gray-500">
                            {route.description}
                          </p>
                        )}
                        <div className="mt-1.5">
                          <span className="text-xs text-gray-500">
                            {route.examples?.length || 0} example
                            {route.examples?.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="flex">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRoute(index)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRoute(index)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center text-gray-500">
                <p>No routes defined yet. Add a route to get started.</p>
              </div>
            )}

            <div className="pt-4">
              <div className="flex justify-between space-x-2 pt-4">
                {onDelete && nodeId && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onDelete(nodeId);
                      onClose();
                    }}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete Node
                  </Button>
                )}
                <div className="space-x-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveRoutes}>Save Routes</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RouterNodeConfig;
