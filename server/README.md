# Authoritative game service

B initializes persistent Node/TypeScript and WebSocket tooling. Select deployment and persistence explicitly; do not run the indefinite match loop inside a short-lived serverless handler.

Game/session code validates identities, challenge state, unique command IDs, legal actions, timing and results. D owns provider adapters; they call the same command service as client buttons and never directly invent match outcomes. Keep permanent keys here, outside the browser build.

Before runtime implementation, resolve docs/contracts.md with A/C/D and publish the shared types.
