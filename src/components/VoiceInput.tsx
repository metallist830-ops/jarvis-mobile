import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import Voice from '@react-native-voice/voice';
import { MessageQueue } from '../messageQueue';

const VoiceInput: React.FC = () => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [pulse] = useState(new Animated.Value(1));

  useEffect(() => {
    Voice.onSpeechStart = () => {
      setListening(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    };

    Voice.onSpeechEnd = () => {
      setListening(false);
      pulse.stopAnimation();
    };

    Voice.onSpeechResults = (e: { value?: string[] }) => {
      if (e.value && e.value.length > 0) {
        setTranscript(e.value[0]);
      }
    };

    Voice.onSpeechError = (e: { error?: { message?: string } }) => {
      setListening(false);
      console.warn('Voice error:', e.error?.message);
    };

    return () => {
      Voice.removeAllListeners('onSpeechStart');
      Voice.removeAllListeners('onSpeechEnd');
      Voice.removeAllListeners('onSpeechResults');
      Voice.removeAllListeners('onSpeechError');
    };
  }, [pulse]);

  const startListening = async () => {
    try {
      await Voice.start('en-US');
    } catch (e) {
      console.warn(e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleTranscript = async () => {
    if (transcript.trim()) {
      await MessageQueue.addMessage(transcript.trim());
      setTranscript('');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, listening && styles.listening]}
        onPressIn={startListening}
        onPressOut={stopListening}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <View style={styles.innerButton}>
            <Text style={styles.micIcon}>🎤</Text>
            <Text style={styles.buttonText}>
              {listening ? 'Listening...' : 'Hold to Speak'}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {transcript ? (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptText}>{transcript}</Text>
          <TouchableOpacity onPress={handleTranscript}>
            <Text style={styles.sendButton}>Send →</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  button: {
    borderRadius: 40,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    minWidth: 200,
    minHeight: 60,
  },
  listening: {
    backgroundColor: '#FF3B30',
  },
  innerButton: {
    alignItems: 'center',
  },
  micIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  transcriptBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transcriptText: {
    color: '#000000',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  sendButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VoiceInput;
