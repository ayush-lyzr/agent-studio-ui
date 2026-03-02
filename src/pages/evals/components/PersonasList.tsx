import React from "react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Persona } from "../types/worldModel";

interface PersonasListProps {
  personas: Persona[];
  selectedPersonas: string[];
  onPersonaToggle: (personaId: string, checked: boolean) => void;
  onPersonaDelete?: (personaId: string) => void;
  onSelectAllPersonas?: (personaIds: string[]) => void;
}

export const PersonasList: React.FC<PersonasListProps> = ({
  personas,
  selectedPersonas,
  onPersonaToggle,
  onPersonaDelete,
  onSelectAllPersonas
}) => {
  const allSelected = personas.length > 0 && personas.every(p => {
    const personaId = p._id || p.id || p.name;
    return selectedPersonas.includes(personaId);
  });

  const handleSelectAll = (checked: boolean) => {
    if (onSelectAllPersonas) {
      // Batch select/deselect - pass all IDs or empty array
      const allPersonaIds = checked
        ? personas.map(p => p._id || p.id || p.name)
        : [];
      onSelectAllPersonas(allPersonaIds);
    } else {
      // Fallback to individual toggles if batch handler not provided
      personas.forEach(persona => {
        const personaId = persona._id || persona.id || persona.name;
        if (checked !== selectedPersonas.includes(personaId)) {
          onPersonaToggle(personaId, checked);
        }
      });
    }
  };

  return (
    <div className="col-span-5 flex flex-col">
      <div className="text-center mb-4">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          PERSONAS
        </p>
      </div>

      {/* Select All */}
      {personas.length > 0 && (
        <div className="flex items-center space-x-3 p-3 mb-2 rounded-lg border-2 border-gray-300 bg-gray-100">
          <Checkbox
            id="select-all-personas"
            checked={allSelected}
            onCheckedChange={handleSelectAll}
          />
          <label
            htmlFor="select-all-personas"
            className="text-sm font-semibold cursor-pointer flex-1"
          >
            Select All
          </label>
        </div>
      )}

      <div className="space-y-3 flex-1">
        {personas.map((persona) => {
          const personaId = persona._id || persona.id || persona.name;
          return (
            <motion.div
              key={personaId}
              className={`flex items-center space-x-3 p-3 rounded-lg border-2 ${
                selectedPersonas.includes(personaId)
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <Checkbox
                id={personaId}
                checked={selectedPersonas.includes(personaId)}
                onCheckedChange={(checked) => onPersonaToggle(personaId, !!checked)}
              />
              <label
                htmlFor={personaId}
                className="text-sm font-medium cursor-pointer flex-1"
              >
                {persona.name}
              </label>
              {onPersonaDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPersonaDelete(personaId)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};