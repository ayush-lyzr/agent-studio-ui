import { create } from "zustand";
import { getConfigs, getRagConfigs, Tools } from "./utils";
import { IOrganization, MemberstackCurrentUser } from "./types";

interface IStore {
  api_key: string;
  apiKeys: any[];
  current_user: Partial<MemberstackCurrentUser>;
  current_organization: Partial<IOrganization>;
  setCurrentUser: (user: Partial<MemberstackCurrentUser>) => void;
  setCurrentOrganization: (user: Partial<IOrganization>) => void;
  setApiKey: (key: string) => void;
  setApiKeys : (key : string) => void;
  app_token: string;
  refresh_token: string;
  getApiKey: () => void;
  getAppToken: () => void;
  setAppToken: (app_token: string) => void;
  setRefreshToken: (refresh_token: string) => void;
  getRefreshToken: () => string;
  agents: any[];
  setAgents: (agents: any) => void;
  addAgent: (agent: any) => void;
  getAgents: () => void;
  updateAgent: (agent: any) => void;
  environments: any[];
  getEnvironments: () => void;
  setEnvironments: (envs: any) => void;
  rags: any[];
  setRag: (rags: any) => void;
  getRag: () => void;
  tools: Tools;
  setTools: (tools: Tools) => void;
  getTools: () => void;
  userTools: string[];
  setUserTools: (tools: string[]) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
}

const useStore = create<IStore>()((set) => ({
  api_key: "",
  current_user: {},
  current_organization: {},
  setCurrentOrganization: (current_organization: Partial<IOrganization>) =>
    set({ current_organization }),
  setCurrentUser: (current_user: Partial<MemberstackCurrentUser>) =>
    set({ current_user }),
  setApiKey: (key: string) => set({ api_key: key }),
  getApiKey: () =>
    set((state: { api_key: any }) => ({ api_key: state.api_key })),

  app_token: "",
  setAppToken: (app_token: string) => set({ app_token: app_token }),
  getAppToken: () =>
    set((state: { app_token: any }) => ({ app_token: state.app_token })),

  refresh_token: "",
  setRefreshToken: (refresh_token: string) => set({ refresh_token }),
  getRefreshToken: (): string => {
    let token = "";
    set((state) => {
      token = state.refresh_token;
      return state;
    });
    return token;
  },

  apiKeys: [],
  setApiKeys: (keys: any) => set({ apiKeys: keys }),

  environments: [],
  setEnvironments: (envs: any) => set({ environments: envs }),
  getEnvironments: () =>
    set((state: { environments: any }) => ({
      environments: state.environments,
    })),

  agents: [],
  setAgents: (agents: any) => set({ agents: agents }),
  addAgent: (agent: any) =>
    set((state) => ({
      agents: [...(state.agents || []), agent],
    })),
  getAgents: () =>
    set((state: { agents: any }) => ({ agents: state.agents })),
  updateAgent: (updatedAgent: any) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent._id === updatedAgent._id ? updatedAgent : agent,
      ),
    })),
  baseUrl: import.meta.env.VITE_BASE_URL,

  rags: [],
  setRag: (rags: any) => {
    set({ rags: rags });
  },
  getRag: () => set((state: { rags: any }) => ({ rags: state.rags })),

  tools: {
    userTools: [],
    tools: [],
    providers: [],
  },
  setTools: (tools: Tools) => set({ tools: tools }),
  getTools: () => set((state: { tools: any }) => ({ tools: state.tools })),

  userTools: [],
  setUserTools: (tools: string[]) => set({ userTools: tools }),
  userEmail: "",
  setUserEmail: (email: string) => set({ userEmail: email }),
}));

export const reloadData = async (store: any) => {
  const { apiKeys, baseUrl, setEnvironments, setAgents, setRag } = store;
  const apiKey = apiKeys[0].api_key;
  await getConfigs("/environments", baseUrl, apiKey, setEnvironments);
  await getConfigs("/agents", baseUrl, apiKey, setAgents);
  await getRagConfigs(
    `${import.meta.env.VITE_RAG_URL}/v3/rag/user`,
    null,
    apiKey,
    setRag,
  );
};

export default useStore;
