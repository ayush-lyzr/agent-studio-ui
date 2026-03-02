import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TestCase, Scenario, Persona } from "../types/worldModel";

interface AddTestCaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  testCase: Omit<TestCase, "_id" | "world_model_id" | "created_at">;
  onTestCaseChange: (
    testCase: Omit<TestCase, "_id" | "world_model_id" | "created_at">,
  ) => void;
  onAdd: () => void;
  isCreating: boolean;
  scenarios: Scenario[];
  personas: Persona[];
}

export const AddTestCaseDialog: React.FC<AddTestCaseDialogProps> = ({
  isOpen,
  onClose,
  testCase,
  onTestCaseChange,
  onAdd,
  isCreating,
  scenarios,
  personas,
}) => {
  const handleChange = (field: keyof typeof testCase, value: string) => {
    onTestCaseChange({
      ...testCase,
      [field]: value,
    });
  };

  const canSubmit =
    testCase.name &&
    testCase.user_input &&
    testCase.expected_output &&
    testCase.scenario_id &&
    testCase.persona_id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Simulation</DialogTitle>
          <DialogDescription>
            Create a custom simulation by specifying the scenario, persona, user
            input, and expected output.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scenario">Scenario</Label>
              <Select
                value={testCase.scenario_id || ""}
                onValueChange={(value) => handleChange("scenario_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scenario" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((scenario) => (
                    <SelectItem
                      key={scenario._id || scenario.name}
                      value={scenario._id || scenario.name}
                    >
                      {scenario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="persona">Persona</Label>
              <Select
                value={testCase.persona_id || ""}
                onValueChange={(value) => handleChange("persona_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select persona" />
                </SelectTrigger>
                <SelectContent>
                  {personas.map((persona) => (
                    <SelectItem
                      key={persona._id || persona.name}
                      value={persona._id || persona.name}
                    >
                      {persona.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Simulation Name</Label>
            <Input
              id="name"
              placeholder="e.g., Basic greeting inquiry"
              value={testCase.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_input">User Input</Label>
            <Textarea
              id="user_input"
              placeholder="What the user will say or type..."
              value={testCase.user_input}
              onChange={(e) => handleChange("user_input", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_output">Expected Output</Label>
            <Textarea
              id="expected_output"
              placeholder="What the agent should respond with..."
              value={
                typeof testCase.expected_output === "string"
                  ? testCase.expected_output
                  : JSON.stringify(testCase.expected_output || {})
              }
              onChange={(e) => handleChange("expected_output", e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={onAdd} disabled={!canSubmit || isCreating}>
            {isCreating ? "Adding..." : "Add Simulation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
