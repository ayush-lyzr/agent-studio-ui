import { OGI, CreateOGIRequest, AddAgentToOGIRequest } from './types';

// Dummy data storage (in-memory)
// Note: These agent_ids reference the actual agents that exist in your system
let dummyOGIs: OGI[] = [
  {
    ogi_id: 'ogi-1',
    ogi_name: 'HR OGI',
    owner_id: 'user-123',
    organization_id: 'org-123',
    agent_ids: [  "68ec41ea07946076375278aa",
    "68ec420007946076375278ae",
    "68ec41cb07946076375278a6",
    "68ec419d079460763752789f",
    "68ec40bc178e51e97d7effa9",
    "68ec4089178e51e97d7effa5",
    "68ec3fe8178e51e97d7effa1"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {},
  },
  {
    ogi_id: 'ogi-2',
    ogi_name: 'Sales OGI',
    owner_id: 'user-123',
    organization_id: 'org-123',
    agent_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {},
  },
  {
    ogi_id: 'ogi-3',
    ogi_name: 'Marketing OGI',
    owner_id: 'user-123',
    organization_id: 'org-123',
    agent_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {},
  },
  {
    ogi_id: 'ogi-4',
    ogi_name: 'Product OGI',
    owner_id: 'user-123',
    organization_id: 'org-123',
    agent_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {},
  },
  {
    ogi_id: 'ogi-5',
    ogi_name: 'Customer Support OGI',
    owner_id: 'user-123',
    organization_id: 'org-123',
    agent_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {},
  },
];

export const ogiService = {
  // Get all OGIs for an organization
  async getOGIs(organizationId: string, _token: string): Promise<OGI[]> {
    // Return dummy data
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    return dummyOGIs.filter(ogi => ogi.organization_id === organizationId || true);
  },

  // Get a specific OGI by ID
  async getOGI(ogiId: string, _token: string): Promise<OGI> {
    // Return dummy data
    await new Promise(resolve => setTimeout(resolve, 200));
    const ogi = dummyOGIs.find(o => o.ogi_id === ogiId);
    if (!ogi) throw new Error('OGI not found');
    return ogi;
  },

  // Create a new OGI
  async createOGI(data: CreateOGIRequest, _token: string): Promise<string> {
    // Create dummy OGI
    await new Promise(resolve => setTimeout(resolve, 300));
    const newOGI: OGI = {
      ogi_id: `ogi-${Date.now()}`,
      ogi_name: data.ogi_name,
      owner_id: 'user-123',
      organization_id: data.organization_id,
      agent_ids: data.agent_ids || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: data.metadata || {},
    };
    dummyOGIs.push(newOGI);
    return newOGI.ogi_id;
  },

  // Add an agent to an OGI
  async addAgentToOGI(
    ogiId: string,
    data: AddAgentToOGIRequest,
    _token: string,
  ): Promise<{ message: string }> {
    // Add agent to dummy OGI
    await new Promise(resolve => setTimeout(resolve, 200));
    const ogi = dummyOGIs.find(o => o.ogi_id === ogiId);
    if (ogi && !ogi.agent_ids.includes(data.agent_id)) {
      ogi.agent_ids.push(data.agent_id);
      ogi.updated_at = new Date().toISOString();
    }
    return { message: 'Agent added successfully' };
  },

  // Update an OGI
  async updateOGI(
    ogiId: string,
    data: Partial<CreateOGIRequest>,
    _token: string,
  ): Promise<OGI> {
    // Update dummy OGI
    await new Promise(resolve => setTimeout(resolve, 200));
    const ogiIndex = dummyOGIs.findIndex(o => o.ogi_id === ogiId);
    if (ogiIndex === -1) throw new Error('OGI not found');

    dummyOGIs[ogiIndex] = {
      ...dummyOGIs[ogiIndex],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return dummyOGIs[ogiIndex];
  },

  // Delete an OGI
  async deleteOGI(ogiId: string, _token: string): Promise<void> {
    // Delete dummy OGI
    await new Promise(resolve => setTimeout(resolve, 200));
    dummyOGIs = dummyOGIs.filter(o => o.ogi_id !== ogiId);
  },
};
