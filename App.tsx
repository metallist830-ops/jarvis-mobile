import React, { useEffect, useState } from 'react';
import { StatusBar, Platform, View, StyleSheet, Text } from 'react-native';
import { MessageQueue } from './src/messageQueue';
import VoiceInput from './src/components/VoiceInput';
import DisplayArea from './src/components/DisplayArea';
import * as Network from 'expo-network';

const API_URL = 'http://178.67.89.247:9000';

export default function App() {
  const [connected, setConnected] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let active = true;

    const checkNetwork = async () => {
      try {
        const info = await Network.getNetworkStateAsync();
        const online = Boolean(info.isConnected) && info.isInternetReachable !== false;
        if (!active) return;
        setConnected(online);
        setPendingCount(await MessageQueue.getPendingCount());
      } catch (error) {
        console.warn('Network status check failed:', error);
      }
    };

    void checkNetwork();
    const interval = setInterval(() => void checkNetwork(), 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!connected) return;

    let active = true;
    let syncing = false;

    const syncPendingMessages = async () => {
      if (syncing) return;
      syncing = true;
      try {
        const pending = await MessageQueue.getPending();
        for (const message of pending.slice(0, 3)) {
          if (!active) break;
          await MessageQueue.setSending(message.id);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          try {
            const response = await fetch(`${API_URL}/hermes/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: message.text }),
              signal: controller.signal,
            });
            const data = await response.json();
            if (response.ok && data.response) {
              await MessageQueue.setSent(message.id, data.response);
            } else {
              await MessageQueue.setFailed(message.id);
            }
          } catch (error) {
            await MessageQueue.setFailed(message.id);
          } finally {
            clearTimeout(timeoutId);
          }
        }
        if (active) setPendingCount(await MessageQueue.getPendingCount());
      } finally {
        syncing = false;
      }
    };

    void syncPendingMessages();
    const interval = setInterval(() => void syncPendingMessages(), 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [connected]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Jarvis AI</Text>
        <View style={[styles.statusDot, { backgroundColor: connected ? '#34C759' : '#FF3B30' }]} />
        {pendingCount > 0 && (
          <Text style={styles.pendingBadge}>⏳ {pendingCount}</Text>
        )}
      </View>
      <DisplayArea />
      <VoiceInput />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  pendingBadge: {
    marginLeft: 8,
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },
});
