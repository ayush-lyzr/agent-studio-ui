import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import useStore from "@/lib/store";

interface Agent {
  id: string;
  name: string;
}

const Sidebar: React.FC = () => {
  const agents = useStore((state: any) => state.agents);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAgents = agents.filter((agent: Agent) =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const onDragStart = (event: React.DragEvent, agent: Agent) => {
    event.dataTransfer.setData("application/reactflow", "default");
    event.dataTransfer.setData("agent", JSON.stringify(agent));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="mx-4 w-64 p-4">
      <div className="relative mb-4">
        <Search
          className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-500 dark:text-gray-400"
          size={18}
        />
        <Input
          type="text"
          placeholder="Search your agents..."
          className="w-full pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="h-[calc(100vh-180px)]">
        {filteredAgents.map((agent: Agent) => (
          <Card
            key={agent.id}
            className="mb-3 cursor-move transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
            onDragStart={(event) => onDragStart(event, agent)}
            draggable
          >
            <CardContent className="p-3 text-center">{agent.name}</CardContent>
          </Card>
        ))}
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;
