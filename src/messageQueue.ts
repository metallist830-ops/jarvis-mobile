import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'jarvis_message_queue';

export interface QueuedMessage {
  id: string;
  text: string;
  timestamp: number;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  retryCount: number;
  responseText?: string;
}

export class MessageQueue {
  static async getQueue(): Promise<QueuedMessage[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      if (!data) return [];
      const parsed: unknown = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item): item is QueuedMessage => Boolean(
        item && typeof item.id === 'string' && typeof item.text === 'string' &&
        typeof item.timestamp === 'number' &&
        ['pending', 'sending', 'sent', 'failed'].includes(item.status)
      )).map(item => ({
        ...item,
        retryCount: typeof item.retryCount === 'number' ? item.retryCount : 0,
      }));
    } catch {
      return [];
    }
  }

  static async saveQueue(queue: QueuedMessage[]): Promise<void> {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  static async addMessage(text: string): Promise<QueuedMessage> {
    const normalizedText = text.trim();
    if (!normalizedText) throw new Error('Cannot queue an empty message');
    const queue = await this.getQueue();
    const message: QueuedMessage = {
      id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2),
      text: normalizedText, timestamp: Date.now(), status: 'pending', retryCount: 0,
    };
    queue.push(message);
    await this.saveQueue(queue);
    return message;
  }

  static async add(text: string): Promise<QueuedMessage> { return this.addMessage(text); }

  static async getPending(): Promise<QueuedMessage[]> {
    return (await this.getQueue()).filter(message => message.status === 'pending');
  }

  static async getNextPending(): Promise<QueuedMessage | null> {
    return (await this.getPending())[0] || null;
  }

  static async updateMessage(
    id: string,
    updates: Partial<Pick<QueuedMessage, 'status' | 'retryCount' | 'responseText'>>
  ): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(message => message.id === id);
    if (index === -1) return;
    queue[index] = { ...queue[index], ...updates };
    await this.saveQueue(queue);
  }

  static async markAsSending(id: string): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(message => message.id === id);
    if (index === -1) return;
    queue[index] = { ...queue[index], status: 'sending', retryCount: queue[index].retryCount + 1 };
    await this.saveQueue(queue);
  }

  static async markAsSent(id: string, responseText?: string): Promise<void> {
    await this.updateMessage(id, { status: 'sent', ...(responseText ? { responseText } : {}) });
  }

  static async markAsFailed(id: string): Promise<void> {
    await this.updateMessage(id, { status: 'failed' });
  }

  static async setSending(id: string): Promise<void> { return this.markAsSending(id); }
  static async setSent(id: string, responseText?: string): Promise<void> {
    return this.markAsSent(id, responseText);
  }
  static async setFailed(id: string): Promise<void> { return this.markAsFailed(id); }

  static async getPendingCount(): Promise<number> {
    return (await this.getQueue()).filter(message => message.status === 'pending').length;
  }
}