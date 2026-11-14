/**
 * Message queue with AsyncStorage persistence for offline mode
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'jarvis_message_queue';

interface QueuedMessage {
  id: string;
  text: string;
  timestamp: number;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  retryCount?: number;
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

  // Alias for convenience
  static async add(text: string): Promise<QueuedMessage> {
    return this.addMessage(text);
  }

  static async getPending(): Promise<QueuedMessage[]> {
    const queue = await this.getQueue();
    return queue.filter(m => m.status === 'pending');
  }

  static async getNextPending(): Promise<QueuedMessage | null> {
    const queue = await this.getQueue();
    const msg = queue.find(m => m.status === 'pending');
    return msg || null;
  }

  static async markAsSending(id: string): Promise<void> {
    const queue = await this.getQueue();
    const idx = queue.findIndex(m => m.id === id);
    if (idx !== -1) {
      queue[idx].status = 'sending';
      queue[idx].retryCount = (queue[idx].retryCount || 0) + 1;
      await this.saveQueue(queue);
    }
  }

  static async markAsSent(id: string): Promise<void> {
    const queue = await this.getQueue();
    const idx = queue.findIndex(m => m.id === id);
    if (idx !== -1) {
      queue[idx].status = 'sent';
      await this.saveQueue(queue);
    }
  }

  static async setSending(id: string): Promise<void> {
    return this.markAsSending(id);
  }

  static async setSent(id: string): Promise<void> {
    return this.markAsSent(id);
  }

  static async setFailed(id: string): Promise<void> {
    return this.markAsFailed(id);
  }

  static async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.filter(m => m.status === 'pending').length;
  }
}
