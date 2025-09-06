import { db, PromptEvent } from '../lib/db';

export async function logTurn(event: Omit<PromptEvent, 'id'>): Promise<void> {
  try {
    const eventWithId: PromptEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...event
    };
    
    await db.events.add(eventWithId);
  } catch (error) {
    console.error('Failed to log turn:', error);
  }
}

export async function getEvents(): Promise<PromptEvent[]> {
  try {
    return await db.events.orderBy('ts').reverse().toArray();
  } catch (error) {
    console.error('Failed to get events:', error);
    return [];
  }
}

export async function clearEvents(): Promise<void> {
  try {
    await db.events.clear();
  } catch (error) {
    console.error('Failed to clear events:', error);
  }
}
