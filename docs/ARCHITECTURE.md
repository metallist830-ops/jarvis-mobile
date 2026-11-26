# Jarvis Mobile — Architecture Notes

## Scope

This document describes only the code currently present in this repository. It does not describe private backend services or claim that planned integrations are implemented.

## Components

### App.tsx
- Displays the application shell and network status.
- Reads pending messages from the local queue.
- Contains a periodic synchronization loop.
- Requires a reachable backend and a matching API contract for successful delivery.

### DisplayArea
- Renders user, assistant, and system messages.
- Sends chat prompts to the configured backend.
- Adds messages to the local queue when live delivery is unavailable.

### VoiceInput
- Uses the native speech-recognition package on supported native platforms.
- Provides a web-specific fallback component.
- Current speech locale and device permissions require validation for target markets and devices.

### MessageQueue
- Persists queued messages using AsyncStorage.
- Tracks pending, sending, sent, and failed states.
- AsyncStorage persistence is not equivalent to encrypted storage.

## Backend contract (prototype)

The mobile client is designed to call:

- Method: POST
- Path: /hermes/chat
- Request: JSON object with a `prompt` string
- Response: JSON object with a `response` string

This contract must be verified against the deployed service. Production use additionally requires authentication, HTTPS, request validation, timeouts, idempotency, and clear retry semantics.

## Known limitations

- No production authentication or account/session model is implemented here.
- No complete server implementation is included.
- Offline queue delivery has not been demonstrated as production-reliable.
- Conversation history restoration is incomplete.
- Automated test coverage is not yet established.
- No production deployment or store release is claimed.
