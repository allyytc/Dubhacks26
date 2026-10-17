# Deployment decisions

Not configured yet. A owns frontend release; B owns persistent service/runtime/persistence; D owns provider endpoints and keys.

- Record package manager/runtime and actual run/build/check commands in root README after initialization.
- Frontend and phone camera testing need HTTPS. Use secure WebSockets from an HTTPS page.
- Game loop needs a persistent service; short-lived API handlers are not the match engine.
- Restrict allowed frontend origins and validate player sessions/commands.
- Keep provider keys server-only; list required environment variable names without values when adapters exist.
- Photon inbound URL must be reachable, verified according to provider docs and deduplicated.
- Define a seeded demo/reset procedure and reconnect/server-recovery limitations.
- Save known-good deployment/version before feature freeze and verify judge-access links.

No hosting account, API resource or deployment has been created by this scaffold.
