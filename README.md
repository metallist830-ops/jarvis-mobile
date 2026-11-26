# Jarvis Mobile

**Jarvis Mobile** is an early-stage React Native / Expo client for a broader personal AI assistant ecosystem. The repository contains the mobile application prototype: a chat interface, native speech-input UI, and a local message queue intended to support intermittent connectivity.

> **Project status:** prototype / active development. This repository is not the complete Jarvis platform and does not include the private server, Hermes runtime, OmniRoute provider routing, production authentication, or marketplace integrations.

## Why this exists

The broader Jarvis project explores a practical AI assistant that can connect tools and services, automate repetitive workflows, and provide a consistent interface across devices. The mobile client is intended to become one access point to that system.

The project is being developed around several principles:

- **Useful automation:** focus on real tasks rather than a chat-only demo.
- **Modular integrations:** keep the mobile client separate from model providers and backend services.
- **Intermittent connectivity:** queue messages locally when the backend cannot be reached.
- **User-controlled infrastructure:** configure the backend endpoint per environment instead of embedding private server details in source code.
- **Incremental delivery:** document what works, what is experimental, and what remains to be built.

## Current repository contents

| Area | Current implementation |
| --- | --- |
| Mobile shell | Expo / React Native application |
| Chat UI | Text conversation interface |
| Speech input | Native speech-recognition component; web fallback |
| Local queue | AsyncStorage-backed message queue prototype |
| Connectivity | Network-state indicator and periodic queue processing |
| Android build | Manual GitHub Actions workflow for an EAS preview build |

These are prototype components. The current queue and synchronization flow still need end-to-end testing against a defined backend API before being considered reliable.

## Architecture (current prototype)

```text
Expo / React Native app
  ├── App.tsx
  │    ├── network status
  │    └── queue synchronization loop
  ├── DisplayArea
  │    └── chat interface
  ├── VoiceInput
  │    └── native speech recognition
  ├── MessageQueue
  │    └── AsyncStorage persistence
  └── API configuration
       └── environment-provided Jarvis backend URL
```

The backend is intentionally not included in this repository. The API contract must be configured to match the deployed Jarvis/Hermes service.

## Requirements

- Node.js 20 (recommended for the included CI workflow)
- npm
- Expo CLI through the project scripts / `npx`
- For device builds: an Expo account and EAS CLI
- A compatible Jarvis backend for live assistant responses

## Local development

1. Clone the repository:

   ```bash
   git clone https://github.com/metallist830-ops/jarvis-mobile.git
   cd jarvis-mobile
   ```

2. Install dependencies:

   ```bash
   npm ci
   ```

3. Configure the backend URL if a compatible backend is available:

   ```bash
   cp .env.example .env
   ```

   Set `EXPO_PUBLIC_JARVIS_API_URL` to the base URL of your own Jarvis API. Do not commit private endpoints, credentials, access tokens, or production secrets.

4. Start Expo:

   ```bash
   npx expo start
   ```

The chat client can retain messages locally when no backend URL is configured or the backend is unreachable. Live responses require a compatible server endpoint.

## Configuration

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_JARVIS_API_URL` | Base URL for the Jarvis backend; do not include a trailing slash |

The prototype currently expects the chat endpoint `POST /hermes/chat` with a JSON body containing `prompt`. The expected response contains a `response` string. Confirm this contract against the actual backend before deployment.

Expo public environment variables are bundled into the client application. **Never put secrets or private API keys in them.** Use authenticated backend endpoints and server-side secret storage for production.

## Roadmap

### Mobile client
- [x] Initial Expo / React Native application shell
- [x] Chat interface prototype
- [x] Native speech-input component and web fallback
- [x] Persistent local message-queue foundation
- [ ] Define and version the backend API contract
- [ ] Reliable retry, deduplication, and delivery acknowledgements
- [ ] Restore and display conversation history
- [ ] Secure authentication and session management
- [ ] Improve accessibility, localization, and error handling
- [ ] Automated tests and release pipeline

### Wider Jarvis ecosystem
These are project directions, not features delivered by this repository:
- [ ] Integrate the mobile client with the Jarvis backend and Hermes
- [ ] Provider orchestration through OmniRoute
- [ ] Tool-using AI agents and permission boundaries
- [ ] Optional offline workflows and later synchronization
- [ ] Warehouse and marketplace workflow integrations
- [ ] Operational analytics and monitoring

## Security and privacy

- Do not commit credentials, tokens, private keys, personal data, or private infrastructure addresses.
- Do not expose an unauthenticated assistant backend directly to the public internet.
- Use HTTPS in production.
- Validate and authenticate every backend request server-side.
- Treat local message storage as device-local application data, not encrypted secret storage.
- Review dependency and build configuration before shipping production binaries.

Please report suspected security issues privately to the repository maintainer rather than publishing exploit details.

## Contributing

This project is under active development. Issues and focused pull requests describing a reproducible problem, proposed change, and test evidence are welcome.

Before contributing, check the current implementation and roadmap. Please do not assume that planned integrations are already available.

## License

No open-source license has been selected yet. Until a license is added, the source is publicly viewable but is not granted an explicit license for reuse, modification, or redistribution.
