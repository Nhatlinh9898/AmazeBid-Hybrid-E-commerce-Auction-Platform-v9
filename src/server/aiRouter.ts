import { Job } from '../types';

// Mock DB
export const db = {
  results: new Map<string, any>(),
  saveResult: async (id: string, result: any) => {
    db.results.set(id, { ...result, savedAt: Date.now() });
    return true;
  },
  getResult: async (id: string) => {
    return db.results.get(id);
  },
  clear: () => {
    db.results.clear();
  }
};

// AI Router Logic
export const aiRouter = async (job: Job) => {
  const { type, payload } = job.data;

  // Simulate routing logic
  if (type === 'data_analysis' || type === 'image_generation') {
    job.processedBy = 'Cloud AI';
    return await processWithCloudAI(payload);
  } else {
    job.processedBy = 'Local AI';
    return await processWithLocalAI(payload);
  }
};

const processWithCloudAI = async (payload: any) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate random failure for retry testing
  if (Math.random() < 0.3 && payload.forceFail !== true) {
    throw new Error('Cloud AI Network Timeout');
  }
  if (payload.forceFail === true) {
    throw new Error('Forced Failure for Testing');
  }

  return { source: 'Cloud AI', status: 'success', data: `Processed ${JSON.stringify(payload)}` };
};

const processWithLocalAI = async (payload: any) => {
  // Simulate local processing delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (payload.forceFail === true) {
    throw new Error('Local AI Out of Memory');
  }

  return { source: 'Local AI', status: 'success', data: `Processed ${JSON.stringify(payload)}` };
};
