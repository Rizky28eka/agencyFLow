import { Worker } from 'bullmq';
import { evaluateRulesForEvent } from '@/services/automationService';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

export const automationWorker = new Worker('automation-events', async (job) => {
  const { name, data } = job;
  await evaluateRulesForEvent(name, data);
}, { connection });

console.log('Automation worker started');