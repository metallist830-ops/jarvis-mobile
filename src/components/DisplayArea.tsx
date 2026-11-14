import React, { useState, useEffect, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MessageQueue } from '../messageQueue';

const API_URL = 'http://178.67.89.247:9000';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: number;
  status?: 'pending' | 'sent' | 'failed';
}

const DisplayArea: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Load past messages from storage on mount
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      // In a real app you'd load from a local DB or AsyncStorage
      const queue = await MessageQueue.getPending();
      // Just show current UI messages; queue items are shown as pending
    } catch (e) {
      console.warn('Failed to load messages:', e);
    }
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    const userMsg: Message = {
      id: Date.now().toString(36),
      text,
      sender: 'user',
      timestamp: Date.now(),
      status: 'pending',
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        timeout: 10000,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(36),
        text: data.reply || data.message || 'No response',
        sender: 'assistant',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      // Queue the message for offline
      await MessageQueue.addMessage(text);
      const systemMsg: Message = {
        id: (Date.now() + 1).toString(36),
        text: '⚠️ Offline — message queued for later sync',
        sender: 'system',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, systemMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    if (item.sender === 'system') {
      return (
        <View style={styles.systemBubble}>
          <Text style={styles.systemText}>{item.text}</Text>
        </View>
      );
    }

    const isUser = item.sender === 'user';
    return (
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {item.text}
        </Text>
        <Text style={[styles.timeText, isUser ? styles.userTime : styles.assistantTime]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {item.status === 'pending' ? ' ⏳' : item.status === 'failed' ? ' ❌' : ''}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        inverted={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              👋 Hi! I'm Jarvis. Ask me anything.
            </Text>
          </View>
        }
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask Jarvis anything..."
          placeholderTextColor="#8E8E93"
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          multiline={false}
        />
        <View style={styles.sendButton}>
          <Text style={styles.sendButtonText} onPress={sendMessage}>
            ↑
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: '#FFF9E6',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: '90%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#000000',
  },
  systemText: {
    color: '#FF9500',
    fontSize: 13,
    textAlign: 'center',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  assistantTime: {
    color: '#8E8E93',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    padding: 10,
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 8,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default DisplayArea;
