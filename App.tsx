import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, Platform, View, StyleSheet, Text } from 'react-native';
import * as Network from 'expo-network';
import { MessageQueue } from './src/messageQueue';
import VoiceInput from './src/components/VoiceInput';
import DisplayArea from './src/components/DisplayArea';

const SYNC_INTERVAL_MS = 5000;
const REQUEST_TIMEOUT_MS = 10000;
const MAX_MESSAGES_PER_SYNC = 3;
const API_URL = 'http://178.67.89.247:9000';

export default function App() {
  const [connected, setConnected] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const syncInProgress = useRef(false);

  useEffect(() => {
    let active = true;
    const checkNetwork = async () => {
      try {
        const info = await Network.getNetworkStateAsync();
        if (active) setConnected(Boolean(info.isConnected && info.isInternetReachable !== false));
      } catch {
        if (active) setConnected(false);
      }
      try {
        const count = await MessageQueue.getPendingCount();
        if (active) setPendingCount(count);
      } catch { /* Keep the last displayed count. */ }
    };
    void checkNetwork();
    const interval = setInterval(() => void checkNetwork(), SYNC_INTERVAL_MS);
    return () => { active = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!connected) return;
    let active = true;
    const syncPendingMessages = async () => {
      if (syncInProgress.current) return;
      syncInProgress.current = true;
      try {
        const pending = await MessageQueue.getPending();
        for (const message of pending.slice(0, MAX_MESSAGES_PER_SYNC)) {
          if (!active) break;
          await MessageQueue.setSending(message.id);
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
          try {
            const response = await fetch(API_URL + '/hermes/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: message.text }),
              signal: controller.signal,
            });
            const data = await response.json();
            const reply = data?.response ?? data?.reply;
            if (!response.ok || typeof reply !== 'string' || !reply.trim()) {
              throw new Error('Message sync failed (HTTP ' + response.status + ')');
            }
            await MessageQueue.setSent(message.id, reply);
          } catch {
            await MessageQueue.setFailed(message.id);
          } finally {
            clearTimeout(timeout);
          }
        }
      } finally {
        syncInProgress.current = false;
        try {
          const count = await MessageQueue.getPendingCount();
          if (active) setPendingCount(count);
        } catch { /* A later network check will refresh the badge. */ }
      }
    };
    void syncPendingMessages();
    const interval = setInterval(() => void syncPendingMessages(), SYNC_INTERVAL_MS);
    return () => { active = false; clearInterval(interval); };
  }, [connected]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle='dark-content' />
      <View style={styles.header}>
        <Text style={styles.title}>Jarvis AI</Text>
        <View accessibilityLabel={connected ? 'Online' : 'Offline'} style={[styles.statusDot, { backgroundColor: connected ? '#34C759' : '#FF3B30' }]} />
        {pendingCount > 0 && <Text style={styles.pendingBadge}>⏳ {pendingCount}</Text>}
      </View>
      <DisplayArea />
      <VoiceInput />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 0.5, borderBottomColor: '#C6C6C8',
  },
  title: { fontSize: 18, fontWeight: '600', color: '#000000' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  pendingBadge: { marginLeft: 8, fontSize: 12, color: '#FF9500', fontWeight: '600' },
});