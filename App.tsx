import React, { useEffect, useState } from 'react';
import { StatusBar, Platform, View, StyleSheet, Text } from 'react-native';
import { MessageQueue } from './src/messageQueue';
import VoiceInput from './src/components/VoiceInput';
import DisplayArea from './src/components/DisplayArea';
import * as Network from 'expo-network';
import { JARVIS_API_BASE_URL } from './src/config';

export default function App() {
  const [connected, setConnected] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkNetwork = async () => {
      const info = await Network.getNetworkStateAsync();
      const online = info.isConnected === true && info.isInternetReachable !== false;
      setConnected(online);
      if (online) {
        const count = await MessageQueue.getPendingCount();
        setPendingCount(count);
      }
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 5000);
    return () => clearInterval(interval);
  }, []);

  // Background sync loop
  useEffect(() => {
    const syncLoop = setInterval(async () => {
      if (!connected || !JARVIS_API_BASE_URL) return;
      const pending = await MessageQueue.getPending();
      if (pending.length === 0) return;

      for (const msg of pending.slice(0, 3)) {
        await MessageQueue.setSending(msg.id);
        try {
          const response = await fetch(`${JARVIS_API_BASE_URL}/hermes/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: msg.text }),
            timeout: 10000,
          });
          const data = await response.json();
          if (response.ok && data.response) {
            await MessageQueue.setSent(msg.id);
          } else {
            await MessageQueue.setFailed(msg.id);
          }
        } catch {
          await MessageQueue.setFailed(msg.id);
        }
      }
      setPendingCount(await MessageQueue.getPendingCount());
    }, 5000);

    return () => clearInterval(syncLoop);
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

