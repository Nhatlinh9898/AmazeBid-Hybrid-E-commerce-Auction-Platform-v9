import { Corporation, Branch } from '../types';

class HierarchyService {
  async getCorporations(ownerId?: string): Promise<Corporation[]> {
    const url = ownerId ? `/api/corporations?ownerId=${ownerId}` : '/api/corporations';
    const resp = await fetch(url);
    const json = await resp.json();
    return json.data.corporations;
  }

  async createCorporation(corp: Omit<Corporation, 'id' | 'createdAt' | 'status'>): Promise<Corporation> {
    const resp = await fetch('/api/corporations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corp)
    });
    const json = await resp.json();
    return json.data.corporation;
  }

  async getBranches(corpId: string): Promise<Branch[]> {
    const resp = await fetch(`/api/branches?corpId=${corpId}`);
    const json = await resp.json();
    return json.data.branches;
  }

  async createBranch(branch: Omit<Branch, 'id' | 'createdAt' | 'status'>): Promise<Branch> {
    const resp = await fetch('/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branch)
    });
    const json = await resp.json();
    return json.data.branch;
  }
}

export const hierarchyService = new HierarchyService();
