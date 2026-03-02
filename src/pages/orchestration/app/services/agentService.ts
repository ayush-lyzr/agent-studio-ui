
import { Agent } from '../types/agent';
import { getAuthHeaders } from './apiClient';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8001';

export const getAgent = async (agentId: string): Promise<Agent> => {
  const response = await fetch(`${API_BASE_URL}/v3/agents/${agentId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get agent: ${response.statusText}`);
  }

  return response.json();
};

export const updateAgent = async (agentId: string, agentData: Partial<Agent>) => {
  const response = await fetch(`${API_BASE_URL}/v3/agents/template/single-task/${agentId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(agentData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update agent: ${response.statusText}`);
  }

  return response.json();
};

// New function to update agent using the standard /v3/agents endpoint (like agent-builder)
export const updateAgentComplete = async (agentId: string, agentData: Partial<Agent>) => {
  const response = await fetch(`${API_BASE_URL}/v3/agents/${agentId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(agentData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update agent: ${response.statusText}`);
  }

  return response.json();
};

