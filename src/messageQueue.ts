/**
 * Persistent message queue for offline-first chat.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'jarvis_message_queue';
const MAX_RETRIES = 5;

export interface QueuedMessage {
  id: string;
  text: string;
  timestamp: number;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  retryCount?: number;
  response?: string;
}

export class MessageQueue {
  static async getQueue(): Promise<QueuedMessage[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async saveQueue(queue: QueuedMessage[]): Promise<void> {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  static async addMessage(text: string): Promise<QueuedMessage> {
    const queue = await this.getQueue();
    const msg: QueuedMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      text,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };
    queue.push(msg);
    await this.saveQueue(queue);
    return msg;
  }

  static async add(text: string): Promise<QueuedMessage> {
    return this.addMessage(text);
  }

  static async getPending(): Promise<QueuedMessage[]> {
    const queue = await this.getQueue();
    return queue.filter(message => message.status === 'pending');
  }

  static async getNextPending(): Promise<QueuedMessage | null> {
    const queue = await this.getQueue();
    return queue.find(message => message.status === 'pending') || null;
  }

  static async markAsSending(id: string): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(message => message.id === id);
    if (index !== -1) {
      queue[index].status = 'sending';
      queue[index].retryCount = (queue[index].retryCount || 0) + 1;
      await this.saveQueue(queue);
    }
  }

  static async markAsSent(id: string, response?: string): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(message => message.id === id);
    if (index !== -1) {
      queue[index].status = 'sent';
      if (response !== undefined) queue[index].response = response;
      await this.saveQueue(queue);
    }
  }

  static async markAsFailed(id: string): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(message => message.id === id);
    if (index !== -1) {
      const retries = queue[index].retryCount || 0;
      queue[index].status = retries < MAX_RETRIES ? 'pending' : 'failed';
      await this.saveQueue(queue);
    }
  }

  static async setSending(id: string): Promise<void> {
    return this.markAsSending(id);
  }

  static async setSent(id: string, response?: string): Promise<void> {
    return this.markAsSent(id, response);
  }

  static async setFailed(id: string): Promise<void> {
    return this.markAsFailed(id);
  }

  static async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.filter(message => message.status === 'pending').length;
  }
}
