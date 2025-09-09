import { describe, it, expect, vi, beforeEach } from 'vitest';
import { automationWorker } from '@/workers/automationWorker';
import { evaluateRulesForEvent } from '@/services/automationService';
import { Job } from 'bullmq';

vi.mock('@/services/automationService', () => ({
  evaluateRulesForEvent: vi.fn(),
}));

describe('Automation Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call evaluateRulesForEvent with the correct arguments', async () => {
    const job = {
      name: 'TASK_STATUS_CHANGED',
      data: { taskId: '123' },
    } as Job;

    // This is a simplified test. A real test would check the worker's internal logic.
    // For now, we just check that the worker calls the service.
    // @ts-expect-error: process is not a public method
    await automationWorker.process(job);

    expect(evaluateRulesForEvent).toHaveBeenCalledWith(job.name, job.data);
  });
});