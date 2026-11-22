import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

/**
 * Web fallback for the native speech-recognition control.
 * The native implementation remains in VoiceInput.tsx.
 * Chat input remains available through DisplayArea on web.
 */
const VoiceInput: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.note}>
      Голосовой ввод доступен в установленном приложении Jarvis. В веб-версии используйте поле сообщения.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 12,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { width: '100%' } : {}),
  },
  note: {
    color: '#8E8E93',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default VoiceInput;
