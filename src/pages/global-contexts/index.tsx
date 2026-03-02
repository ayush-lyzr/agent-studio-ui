import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/ui/page-title";
import { toast } from "sonner";
import useStore from "@/lib/store";
import { 
  getAllContexts, 
  createContext, 
  updateContext, 
  deleteContext,
  Context,
  CreateContextRequest,
  UpdateContextRequest 
} from "@/services/contextsApiService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function GlobalContexts() {
  const apiKey = useStore((state) => state.api_key);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contextToDelete, setContextToDelete] = useState<Context | null>(null);
  
  // Form state
  const [editedValue, setEditedValue] = useState("");
  const [editedName, setEditedName] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  
  // New context form state
  const [newContextName, setNewContextName] = useState("");
  const [newContextValue, setNewContextValue] = useState("");

  // Load contexts on component mount
  const loadContexts = useCallback(async () => {
    if (!apiKey) {
      return;
    }
    try {
      setLoading(true);
      const data = await getAllContexts();
      setContexts(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load contexts");
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  // Ensuring api key is available
  useEffect(() => {
    if (apiKey) {
      loadContexts();
    }
  }, [apiKey, loadContexts]);

  // Update form when selected context changes
  useEffect(() => {
    if (selectedContext) {
      setEditedName(selectedContext.name);
      setEditedValue(selectedContext.value);
      setHasChanges(false);
    }
  }, [selectedContext]);

  // Check for changes
  useEffect(() => {
    if (selectedContext) {
      const nameChanged = editedName !== selectedContext.name;
      const valueChanged = editedValue !== selectedContext.value;
      setHasChanges(nameChanged || valueChanged);
    }
  }, [editedName, editedValue, selectedContext]);

  const handleCreateContext = async () => {
    if (!newContextName.trim()) {
      toast.error("Context name is required");
      return;
    }

    try {
      setSaving(true);
      const createData: CreateContextRequest = {
        name: newContextName.trim(),
        value: newContextValue,
      };
      
      await createContext(createData);
      toast.success("Context created successfully");
      
      // Reset form
      setNewContextName("");
      setNewContextValue("");
      setIsCreating(false);
      
      // Reload contexts
      await loadContexts();
    } catch (error: any) {
      toast.error(error.message || "Failed to create context");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContext = async () => {
    if (!selectedContext) return;

    try {
      setSaving(true);
      const updates: UpdateContextRequest = {};
      
      if (editedName !== selectedContext.name) {
        updates.name = editedName.trim();
      }
      
      if (editedValue !== selectedContext.value) {
        updates.value = editedValue;
      }

      if (Object.keys(updates).length === 0) {
        toast.error("No changes to save");
        return;
      }

      await updateContext(selectedContext._id, updates);
      toast.success("Context updated successfully");
      
      // Reload contexts and update selected context
      await loadContexts();
      
      // Find and set the updated context
      const updatedContexts = await getAllContexts();
      const updatedContext = updatedContexts.find(c => c._id === selectedContext._id);
      if (updatedContext) {
        setSelectedContext(updatedContext);
      }
      
    } catch (error: any) {
      toast.error(error.message || "Failed to update context");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContext = async () => {
    if (!contextToDelete) return;

    const contextId = contextToDelete._id;

    if (!contextId) {
      toast.error("Cannot delete context: ID is missing");
      return;
    }

    try {
      setSaving(true);
      await deleteContext(contextId);
      toast.success("Context deleted successfully");
      
      // Clear selection if deleted context was selected
      if (selectedContext?._id === contextId) {
        setSelectedContext(null);
        setEditedName("");
        setEditedValue("");
      }
      
      // Reload contexts
      await loadContexts();
      
    } catch (error: any) {
      toast.error(error.message || "Failed to delete context");
    } finally {
      setSaving(false);
      setIsDeleteDialogOpen(false);
      setContextToDelete(null);
    }
  };

  const openDeleteDialog = (context: Context) => {
    setContextToDelete(context);
    setIsDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex h-full w-full flex-col space-y-8 p-8"
      >
        <PageTitle
          title="Global Contexts"
          description="Manage reusable context documents that can be injected into agent system prompts"
        />

        <div className="h-[calc(100%-5rem)] space-y-4 overflow-y-auto overflow-x-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left Panel - Context List */}
            <div className="lg:col-span-1">
              <div className="h-full border rounded-lg bg-card">
                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
                      <FileText className="h-5 w-5" />
                      Contexts
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {contexts.length} context{contexts.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsCreating(true)}
                    size="sm"
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                </div>
                <div className="p-0 pt-0">
                  <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Loading contexts...
                      </div>
                    ) : contexts.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No contexts created yet
                      </div>
                    ) : (
                      contexts.map((context) => (
                        <div
                          key={context._id}
                          className={`p-4 border-b cursor-pointer ${
                            selectedContext?._id === context._id ? 'bg-accent' : ''
                          }`}
                          onClick={() => setSelectedContext(context)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{context.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Updated: {formatDate(context.updated_at)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(context);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground truncate">
                              {context.value.substring(0, 100)}
                              {context.value.length > 100 ? '...' : ''}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Context Editor */}
            <div className="lg:col-span-2">
              <div className="h-full border rounded-lg bg-card">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {selectedContext ? (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="context-name">Name</Label>
                            {hasChanges && <Badge variant="secondary">Unsaved changes</Badge>}
                          </div>
                          <Input
                            id="context-name"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="font-medium"
                            placeholder="Context name"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Created: {formatDate(selectedContext.created_at)} • ID: {selectedContext._id}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-semibold leading-none tracking-tight">Select a Context</h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            Choose a context from the list to view and edit its content
                          </p>
                        </div>
                      )}
                    </div>
                    {selectedContext && hasChanges && (
                      <Button 
                        onClick={handleSaveContext}
                        disabled={saving}
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="px-6 pb-6 flex flex-col flex-1">
                  {selectedContext ? (
                    <div className="flex flex-col flex-1 space-y-4">
                      <div className="flex-1">
                        <Label htmlFor="context-value">Value</Label>
                        <Textarea
                          id="context-value"
                          value={editedValue}
                          onChange={(e) => setEditedValue(e.target.value)}
                          className="min-h-[400px] resize-none font-mono text-sm"
                          placeholder="Enter the context content that will be injected into agent prompts..."
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {editedValue.length} characters
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center">
                      <div className="space-y-3">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div>
                          <p className="font-medium">No context selected</p>
                          <p className="text-sm text-muted-foreground">
                            Select a context from the left panel or create a new one
                          </p>
                        </div>
                        <Button 
                          onClick={() => setIsCreating(true)}
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Context
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Create Context Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Context</DialogTitle>
            <DialogDescription>
              Create a new context document that can be used in agent prompts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-context-name">Name</Label>
              <Input
                id="new-context-name"
                value={newContextName}
                onChange={(e) => setNewContextName(e.target.value)}
                placeholder="e.g., company_info, product_catalog"
              />
            </div>
            <div>
              <Label htmlFor="new-context-value">Value</Label>
              <Textarea
                id="new-context-value"
                value={newContextValue}
                onChange={(e) => setNewContextValue(e.target.value)}
                placeholder="Enter the context content..."
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setNewContextName("");
                setNewContextValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateContext}
              disabled={saving || !newContextName.trim()}
            >
              {saving ? 'Creating...' : 'Create Context'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Context</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{contextToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setContextToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteContext}
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}