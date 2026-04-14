import { Job, AITaskInput } from './types';

// In-memory mock of BullMQ
export class MockQueue {
  private jobs: Map<string, Job> = new Map();
  private dlq: Map<string, Job> = new Map();
  private handlers: ((job: Job) => Promise<any>)[] = [];

  async add(name: string, data: AITaskInput, opts?: { attempts?: number }): Promise<Job> {
    const job: Job = {
      id: data.id,
      data,
      status: 'pending',
      attempts: 0,
      maxAttempts: opts?.attempts || 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.jobs.set(job.id, job);
    this.processNext();
    return job;
  }

  process(handler: (job: Job) => Promise<any>) {
    this.handlers.push(handler);
    this.processNext();
  }

  private async processNext() {
    if (this.handlers.length === 0) return;

    for (const [id, job] of this.jobs.entries()) {
      if (job.status === 'pending') {
        job.status = 'processing';
        job.updatedAt = Date.now();
        this.jobs.set(id, job);

        const handler = this.handlers[0]; // Simple single handler for mock
        try {
          job.attempts++;
          const result = await handler(job);
          job.status = 'completed';
          job.result = result;
          job.updatedAt = Date.now();
          this.jobs.set(id, job);
        } catch (error: any) {
          job.error = error.message;
          if (job.attempts >= job.maxAttempts) {
            job.status = 'dlq';
            job.updatedAt = Date.now();
            this.dlq.set(id, job);
            this.jobs.delete(id); // Move to DLQ
          } else {
            job.status = 'failed'; // Will be retried
            job.updatedAt = Date.now();
            this.jobs.set(id, job);
            // Simulate exponential backoff retry
            setTimeout(() => {
              if (this.jobs.has(id) && this.jobs.get(id)?.status === 'failed') {
                const j = this.jobs.get(id)!;
                j.status = 'pending';
                this.jobs.set(id, j);
                this.processNext();
              }
            }, Math.pow(2, job.attempts) * 1000);
          }
        }
      }
    }
  }

  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async getDLQ(): Promise<Job[]> {
    return Array.from(this.dlq.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async retryJob(id: string): Promise<boolean> {
    const job = this.dlq.get(id);
    if (job) {
      this.dlq.delete(id);
      job.status = 'pending';
      job.attempts = 0;
      job.error = undefined;
      job.updatedAt = Date.now();
      this.jobs.set(id, job);
      this.processNext();
      return true;
    }
    return false;
  }
  
  async clearAll() {
    this.jobs.clear();
    this.dlq.clear();
  }
}

export const aiQueue = new MockQueue();
