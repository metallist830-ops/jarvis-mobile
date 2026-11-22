import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * The web build keeps text chat available.
 * Native speech recognition is provided by VoiceInput.tsx in iOS/Android builds.
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
    width: '100%',
  },
  note: {
    color: '#8E8E93',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default VoiceInput;
