import { X, Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { METRICS_WS_URL } from "@/lib/constants";

interface AgentConfig {
  name: string;
  agentId: string;
  baseUrl: string;
  apiKey: string;
  userId: string;
  wsBaseUrl: string;
}

interface SettingsPanelProps {
  agentConfig: AgentConfig;
  onAgentConfigChange: (config: Partial<AgentConfig>) => void;
  onClose: () => void;
}

const SettingsPanel = ({
  agentConfig,
  onAgentConfigChange,
  onClose,
}: SettingsPanelProps) => {
  const [tempConfig, setTempConfig] = useState(agentConfig);

  const handleSave = () => {
    onAgentConfigChange(tempConfig);
    onClose();
  };

  const handleReset = () => {
    const defaultConfig = {
      name: "Manager",
      agentId: "683998ef19ca442583a6e222",
      baseUrl:
        import.meta.env.VITE_BASE_URL ||
        "https://agent-prod.test.maia.prophet.com",
      apiKey: "sk-default-RR9XKMJpwNn1BsgMRh4pnXJGvqfurpny",
      userId: "test",
      wsBaseUrl: METRICS_WS_URL,
    };
    setTempConfig(defaultConfig);
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-slate-200 bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-2xl bg-slate-200 p-3">
              <Settings className="h-6 w-6 text-slate-700" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-slate-900">Settings</h2>
              <p className="text-sm text-slate-600">Configure your AI agent</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full text-slate-600 hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-6">
        <ScrollArea className="h-full">
          <div className="space-y-6">
            {/* Agent Configuration Section */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-lg font-medium text-slate-900">
                  Agent Configuration
                </h3>
                <p className="text-sm text-slate-600">
                  Configure your custom AI agent settings
                </p>
              </div>

              <div className="space-y-4">
                {/* Agent Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="agent-name"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Agent Name
                  </label>
                  <Input
                    id="agent-name"
                    value={tempConfig.name}
                    onChange={(e) =>
                      setTempConfig((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Enter agent name..."
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition-all duration-300 focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50"
                  />
                </div>

                {/* Agent ID */}
                <div className="space-y-2">
                  <label
                    htmlFor="agent-id"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Agent ID
                  </label>
                  <Input
                    id="agent-id"
                    value={tempConfig.agentId}
                    onChange={(e) =>
                      setTempConfig((prev) => ({
                        ...prev,
                        agentId: e.target.value,
                      }))
                    }
                    placeholder="Enter agent ID..."
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition-all duration-300 focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50"
                  />
                </div>

                {/* Base URL */}
                <div className="space-y-2">
                  <label
                    htmlFor="base-url"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Base URL
                  </label>
                  <Input
                    id="base-url"
                    value={tempConfig.baseUrl}
                    onChange={(e) =>
                      setTempConfig((prev) => ({
                        ...prev,
                        baseUrl: e.target.value,
                      }))
                    }
                    placeholder="Enter base URL..."
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition-all duration-300 focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50"
                  />
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <label
                    htmlFor="api-key"
                    className="block text-sm font-medium text-slate-700"
                  >
                    API Key
                  </label>
                  <Input
                    id="api-key"
                    value={tempConfig.apiKey}
                    onChange={(e) =>
                      setTempConfig((prev) => ({
                        ...prev,
                        apiKey: e.target.value,
                      }))
                    }
                    placeholder="Enter API key..."
                    type="password"
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition-all duration-300 focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50"
                  />
                </div>

                {/* User ID */}
                <div className="space-y-2">
                  <label
                    htmlFor="user-id"
                    className="block text-sm font-medium text-slate-700"
                  >
                    User ID
                  </label>
                  <Input
                    id="user-id"
                    value={tempConfig.userId}
                    onChange={(e) =>
                      setTempConfig((prev) => ({
                        ...prev,
                        userId: e.target.value,
                      }))
                    }
                    placeholder="Enter user ID..."
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition-all duration-300 focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50"
                  />
                </div>

                {/* WebSocket Base URL */}
                <div className="space-y-2">
                  <label
                    htmlFor="ws-base-url"
                    className="block text-sm font-medium text-slate-700"
                  >
                    WebSocket Base URL
                  </label>
                  <Input
                    id="ws-base-url"
                    value={tempConfig.wsBaseUrl}
                    onChange={(e) =>
                      setTempConfig((prev) => ({
                        ...prev,
                        wsBaseUrl: e.target.value,
                      }))
                    }
                    placeholder="Enter WebSocket base URL..."
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition-all duration-300 focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Current Configuration */}
            <div className="rounded-2xl bg-slate-100 p-4">
              <h4 className="mb-2 text-sm font-medium text-slate-900">
                Current Configuration
              </h4>
              <div className="space-y-1 text-xs text-slate-600">
                <div>Agent: {agentConfig.name}</div>
                <div>Agent ID: {agentConfig.agentId}</div>
                <div>Base URL: {agentConfig.baseUrl}</div>
                <div>Status: Connected</div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-6">
        <div className="mb-3 flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 rounded-xl border-0 bg-slate-700 text-white hover:bg-slate-800"
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={handleReset}
          className="w-full rounded-xl border border-slate-300 bg-slate-100 text-xs text-slate-700 hover:bg-slate-200"
        >
          Reset to Default (Eddie)
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;
