import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
} from 'react-native';
import {
  ExpoSpeechRecognitionModule,
} from 'expo-speech-recognition';
import { MessageQueue } from '../messageQueue';

const VoiceInput: React.FC = () => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const startListener = ExpoSpeechRecognitionModule.addListener('start', () => {
      setListening(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });

    const endListener = ExpoSpeechRecognitionModule.addListener('end', () => {
      setListening(false);
      pulse.stopAnimation();
      pulse.setValue(1);
    });

    const resultListener = ExpoSpeechRecognitionModule.addListener('result', (event) => {
      const recognizedText = event.results?.[0]?.transcript;
      if (recognizedText) setTranscript(recognizedText);
    });

    const errorListener = ExpoSpeechRecognitionModule.addListener('error', (event) => {
      setListening(false);
      pulse.stopAnimation();
      pulse.setValue(1);
      console.warn('Speech recognition error:', event.message);
    });

    return () => {
      startListener.remove();
      endListener.remove();
      resultListener.remove();
      errorListener.remove();
      pulse.stopAnimation();
    };
  }, [pulse]);

  const startListening = async () => {
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        console.warn('Microphone or speech-recognition permission was not granted.');
        return;
      }

      setTranscript('');
      ExpoSpeechRecognitionModule.start({
        lang: 'ru-RU',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
      });
    } catch (error) {
      console.warn('Unable to start speech recognition:', error);
      setListening(false);
    }
  };

  const stopListening = () => {
    try {
      if (listening) ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.warn('Unable to stop speech recognition:', error);
    }
  };

  const handleTranscript = async () => {
    const text = transcript.trim();
    if (!text) return;

    try {
      await MessageQueue.addMessage(text);
      setTranscript('');
    } catch (error) {
      console.warn('Unable to queue recognized speech:', error);
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
              {listening ? 'Слушаю…' : 'Удерживайте для речи'}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {transcript ? (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptText}>{transcript}</Text>
          <TouchableOpacity onPress={handleTranscript}>
            <Text style={styles.sendButton}>Отправить →</Text>
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
