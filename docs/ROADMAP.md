# Jarvis Mobile — Development Roadmap

This roadmap distinguishes repository work from broader ecosystem goals.

## Phase 1 — Stabilize the mobile prototype
- [ ] Agree and document a versioned API contract.
- [ ] Add request timeout and cancellation handling.
- [ ] Implement queue retry policy, idempotency, and duplicate protection.
- [ ] Persist and restore conversation history.
- [ ] Add tests for queue state transitions and network failures.
- [ ] Validate native speech input on supported iOS and Android versions.

## Phase 2 — Secure backend integration
- [ ] Add user authentication and session handling.
- [ ] Enforce HTTPS and server-side authorization.
- [ ] Move all secrets to server-side secret storage.
- [ ] Add structured error responses and observability.
- [ ] Define data retention and privacy controls.

## Phase 3 — Jarvis ecosystem integration
- [ ] Connect to the Jarvis backend and Hermes runtime.
- [ ] Integrate provider routing through OmniRoute.
- [ ] Add explicit user approval for sensitive tool actions.
- [ ] Add configurable agent capabilities and permissions.

## Phase 4 — Operational workflows
- [ ] Explore warehouse inventory and shipment workflows.
- [ ] Design integrations for marketplace data.
- [ ] Add offline-first operational records and conflict resolution.
- [ ] Add analytics and export workflows.

## Delivery principle

A roadmap item is not a shipped feature. Move items to completed only after implementation, testing, and documentation.
