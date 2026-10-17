# AGENTS.md — Jedi Space Duels (DubHacks 2026)

Context for humans and AI agents (Cursor) working in this repo. Read this before writing code.

## The pitch
Two players walk around with iPhones. When the app detects another player nearby, either can challenge the other. If both accept, a **domain expansion** envelops them: the camera view dissolves into a real space environment built from real data (Mars, a JWST nebula, a JPL asteroid field, the Gaia star sky). Inside it they 1v1 in shared 3D AR space, holding the phone in one hand and switching weapons with **hand signs** made with the other hand. **Perceptron** scans the real room so real chairs, tables, and pillars become asteroids/debris that block shots, then cuts a post-match **highlight replay**.

Pitch line: *"Perceptron sees your real room, and the domain turns it into a battlefield."*

## Target tracks
- **SpaceXAI "Make it Legendary"**: real space data, Grok Voice + Grok Imagine APIs (required), built with Cursor (use it heavily, keep notes), Grok Bot used for planning.
- **Perceptron (perceptive track)**: Mk/Isaac models for object localization (room cover) and event finding in video (replay). No fine-tuning.
- **Chef's Choice**: creative, interactive, gesture-driven game.

## Tech stack
- **iOS app:** Swift, SwiftUI, ARKit, RealityKit, Vision, MultipeerConnectivity. Xcode, iOS 17+. All team phones are iPhones.
- **Backend:** small Node (Express) or Python (FastAPI) server, deployed to Render/Vercel/Fly. Holds all API keys.
- **External APIs:** Grok Voice, Grok Imagine, Perceptron Mk/Isaac, NASA/JPL/Gaia public data.

## Architecture
```
iPhone A  <-- MultipeerConnectivity (invites, ARKit collaboration data, game events) -->  iPhone B
   |                                                                                        |
   +-------------------------------> Backend API <------------------------------------------+
                                        |-- Grok Voice / Grok Imagine
                                        |-- Perceptron Mk/Isaac
                                        |-- Cached arena assets (NASA / JPL / Gaia)
```
- Battles run **peer-to-peer** (low latency, works on bad venue Wi-Fi).
- The backend is only for AI calls and arena assets. **Never put API keys in the app.**
- Arenas are **pre-generated and cached** so battles never wait on APIs.

## Battle flow
1. **Lobby**: Multipeer advertise/browse. Peer found -> "Challenge X?" -> invite -> accept.
2. **Shared AR**: both start `ARWorldTrackingConfiguration` with `isCollaborationEnabled = true`; collaboration data is relayed over Multipeer until the maps merge.
3. **Room scan (charging)**: host pans for 3–5 s; frames + camera poses go to backend -> Perceptron -> bounding boxes -> raycast into the ARKit scene -> cover positions -> sent to the peer.
4. **Domain expansion**: inverted sphere with the real space texture scales up around the players; a synced Grok Voice intro plays; real objects become asteroids with colliders.
5. **Combat**: Vision hand pose -> gesture -> weapon. Attacks are sent as events; hits are checked against the opponent's tracked pose and cover colliders.
6. **End**: winner screen, domain collapses, clip uploaded -> Perceptron finds events -> highlight reel + Grok Voice commentary.

## Shared contracts (agree on these first, don't change them without telling the team)

### Gestures -> weapons
| Gesture | Weapon |
|---|---|
| Fist | Lightsaber (melee) |
| Finger gun | Blaster (ranged) |
| Open palm | Force shield (block) |

```swift
enum Weapon: String, Codable { case saber, blaster, shield }
```

### Peer messages (JSON over Multipeer)
```swift
enum PeerMessage: Codable {
  case challenge(playerName: String)
  case accept, decline
  case arDataChunk(Data)                    // ARKit collaboration data
  case arenaSelected(arenaId: String)
  case coverLayout([CoverObject])           // host -> peer
  case domainStart(atHostTime: TimeInterval)
  case weaponChanged(Weapon)
  case attack(weapon: Weapon, origin: SIMD3<Float>, direction: SIMD3<Float>, t: TimeInterval)
  case hit(damage: Int)                     // the victim's phone is authoritative for its own health
  case gameOver(winner: String)
}
struct CoverObject: Codable { let label: String; let position: SIMD3<Float>; let radius: Float }
```

### Backend endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/arena/random` | `{ id, name, textureUrl, backdropUrl, voiceIntroUrl, source }` |
| POST | `/perceive/cover` | frames (base64 JPEG) -> `[{ label, bbox:[x,y,w,h], frameIndex }]` |
| POST | `/replay` | match clip -> `{ highlightUrl, events:[{t, type}] }` |

## Code layout
```
ios/JediDuels/
  App/            JediDuelsApp.swift, RootView.swift
  Lobby/          PeerManager.swift, LobbyView.swift
  AR/             ARSessionManager.swift, ARViewContainer.swift
  Gestures/       GestureRecognizer.swift
  Game/           GameState.swift, CombatSystem.swift, Weapons/
  Domain/         DomainExpansion.swift, ArenaLoader.swift, CoverBuilder.swift
  Networking/     BackendClient.swift, PeerMessage.swift
  Replay/         MatchRecorder.swift
backend/
  src/  arena.*, perceive.*, replay.*, grok.*, perceptron.*
  assets/arenas/  pre-generated textures + voice clips + metadata.json
docs/  cursor-usage.md   # log of how we used Cursor (for judging)
```

## Roles

### 1. iOS Lead: AR, game client, and integration
**Owns:** `App/`, `AR/`, `Game/`, `Domain/DomainExpansion.swift`
- Xcode project, signing, `Info.plist` permissions (camera, local network, Bluetooth, `NSBonjourServices`).
- ARView with a weapon entity attached to the camera; weapon models and effects.
- Combat: projectiles, saber swing hit detection, health, HUD, win/lose.
- Domain expansion animation (inverted sphere, shockwave, fade).
- Merges everyone's modules into the app.
- **Milestone 1:** one phone with AR and a saber on the camera that swaps to a blaster on a hardcoded button.

### 2. Gestures and perception (on-device)
**Owns:** `Gestures/`, `Domain/CoverBuilder.swift`
- `GestureRecognizer` with `VNDetectHumanHandPoseRequest`, classifying fist, finger gun, and open palm from joint geometry.
- Smoothing/debounce (e.g. the same gesture for 5 frames) and a confidence threshold. Publishes `Weapon` changes.
- Test under bad lighting, with both hands, and at different distances.
- `CoverBuilder`: takes Perceptron boxes + frame camera poses, raycasts into the ARKit scene, outputs `[CoverObject]`.
- **Milestone 1:** a standalone debug view that prints the detected gesture live.

### 3. Multiplayer and networking
**Owns:** `Lobby/`, `Networking/PeerMessage.swift`, AR collaboration relay
- `PeerManager`: advertise/browse, invites, accept/decline, reconnects.
- Relay ARKit collaboration data; show "syncing" until maps merge and the opponent's anchor appears.
- Message encoding, a host role, and time sync for `domainStart`.
- Lobby UI ("Player nearby: Challenge?").
- Stretch: Nearby Interaction (UWB) distance/direction.
- **Milestone 1:** two phones discover each other and exchange a ping message.

### 4. Backend, sponsor APIs, and pitch
**Owns:** `backend/`, `Networking/BackendClient.swift`, `Replay/`, `docs/`
- Backend with the three endpoints; deploy it early and share the URL.
- Arenas: pull real imagery/data (NASA planetary maps, JWST/Hubble, JPL small bodies, Gaia), generate backdrops with Grok Imagine and intros with Grok Voice; pre-generate at least 3 arenas.
- Perceptron integration for cover detection and replay event finding (attend the Perceptron workshop).
- Replay: recording, upload, highlight reel with Grok Voice commentary.
- Owns the Devpost write-up, the demo video, `docs/cursor-usage.md`, and the track checklist.
- **Milestone 1:** `/arena/random` returns a real arena with a voice clip.

## Integration checkpoints
| When | Goal |
|---|---|
| Hour 2 | Contracts above agreed; everyone builds against mocks |
| Hour 8 | One phone: AR + gesture weapon switching |
| Hour 16 | Two phones: lobby -> shared AR -> duel |
| Hour 22 | Domain expansion + real arenas + Perceptron cover |
| Hour 28 | Replay + Grok Voice + polish |
| Final 4h | Feature freeze, demo video, Devpost |

## Scope
- **Must:** discover -> accept -> shared AR -> 3 gesture weapons -> damage -> winner; domain expansion with at least 3 real arenas; Perceptron cover.
- **Should:** Grok Voice announcer, Grok Imagine backdrops, Perceptron replay.
- **Nice:** UWB direction, more weapons, sound design, leaderboard.
- **Fallbacks:** tap buttons if gestures are flaky; random asteroids if the scan fails; a room-code join if Multipeer discovery fails; a prerecorded demo room.

## Rules for AI agents in this repo
- Stay inside your role's folders unless asked; touch the shared contracts only when told to.
- Swift: SwiftUI + RealityKit, `@Observable`/`ObservableObject` managers, no third-party packages without team agreement.
- Keep secrets in `backend/.env` (gitignored). Never hardcode keys in Swift.
- Every network/API call needs a timeout and a fallback so the demo never stalls.
- AR, Multipeer, and camera need a **real device**; the simulator won't work.
- After meaningful work, add a line to `docs/cursor-usage.md` (what Cursor did).
