# Fleet Strike

A server-authoritative **1v1 space auto-battler**. Build a galactic empire across
a seven-planet chain, construct factories that produce fleets automatically, and
capture every world to win.

Ships fight on their own — you command the economy and the front line, not
individual units.

---

## Quick start

Requires **Node 20+** and **pnpm 10+**.

```bash
pnpm install
pnpm dev
```

- Client: <http://localhost:5173>
- Server: <http://localhost:3000> (WebSocket on `/ws`)

Open the client in two browser tabs. Create a room in the first, copy the
six-character code, and join with it in the second. The match starts as soon as
both players are seated.

### With Docker

```bash
cd infrastructure/docker
docker compose up --build
```

Client on <http://localhost:8080>; nginx proxies `/ws` and `/api` to the server,
so the browser runs same-origin.

---

## How to play

| Action                      | Control                |
| --------------------------- | ---------------------- |
| Set the fleet waypoint      | Left click empty space |
| Inspect / build on a planet | Left click a planet    |
| Pan the camera              | Drag                   |
| Zoom                        | Mouse wheel            |
| Frame the whole galaxy      | `F`                    |
| Clear selection             | `Esc`                  |

**The loop.** Gold accrues every second. Spend it on economy buildings and
factories on planets you control. Factories then produce ships every 45 seconds
with no further input. All your ships fly to your single waypoint and engage
anything in range. Ships inside a planet's 500-unit capture radius shift its
ownership over time; Engineers do it twice as fast.

**Winning.** Hold all seven planets at once. If the 20-minute limit expires, the
player holding more worlds wins.

**Resources.** Gold is uncapped and buys everything. Manpower is consumed per
ship and refunded when a ship dies. Crystal, Gas and Tungsten come from
controlling their planets and gate the Medic Bay, Bomber Facility and Sniper
Dock respectively. Power is a hard per-planet cap on how much you can build —
raise it with Power Plants.

---

## Architecture

TurboRepo monorepo. The simulation is shared code; the server is the only
authority.

```
apps/
  backend/    Node server: 60 Hz simulation, 30 Hz delta broadcast, validation
  frontend/   PixiJS 8 client: rendering, input, HUD
packages/
  types/      Shared domain and network types
  config/     All balance data and constants
  utils/      Vector maths, collision, spatial hash, validation, seeded RNG
  ecs/        bitECS components and systems (the simulation itself)
  renderer/   PixiJS abstractions: camera, culling, sprites, particles
```

Dependency direction is strictly one-way: `apps → packages → types`.

**Networking.** Clients send commands, never state. The server simulates at a
fixed 60 Hz timestep, validates every command against its own world, and
broadcasts deltas at 30 Hz with a full snapshot every 5 seconds as a baseline.
The client interpolates between the last two server positions, so 30 Hz updates
render smoothly at 60 FPS.

**ECS.** bitECS `0.3.x`, Structure-of-Arrays. Systems run in a fixed order
documented in `packages/ecs/src/systems/pipeline.ts`. Targeting, collision and
capture all use a uniform spatial hash rather than pairwise scans.

**Determinism.** The simulation never calls `Math.random`; it uses a seeded
generator, so a given seed always replays identically.

---

## Commands

```bash
pnpm dev              # frontend + backend in watch mode
pnpm build            # build every workspace
pnpm test             # run all tests
pnpm test:coverage    # tests with coverage
pnpm typecheck        # strict TypeScript across the repo
pnpm lint             # ESLint
pnpm format           # Prettier

pnpm -C apps/backend playtest    # headless full-match balance + perf report
pnpm -C packages/ecs test         # a single package
```

`pnpm playtest` runs complete matches with scripted opponents and prints an
economy timeline, win conditions across several seeds, and simulation
throughput. Useful for checking a balance change without opening a browser.

---

## Status

503 tests pass; strict TypeScript with no `any`; ESLint and Prettier clean.

| Workspace  | Statement coverage |
| ---------- | ------------------ |
| `renderer` | 98.9%              |
| `utils`    | 96.5%              |
| `frontend` | 96.7%              |
| `ecs`      | 94.1%              |
| `types`    | 91.3%              |
| `config`   | 84.7%              |
| `backend`  | 81.8%              |

Measured on an M-series laptop, server simulation only:

| Fleet size | Time per tick | Share of the 16.67 ms budget |
| ---------- | ------------- | ---------------------------- |
| 66 ships   | 0.07 ms       | 0.4%                         |
| 116 ships  | 0.13 ms       | 0.8%                         |
| 216 ships  | 0.26 ms       | 1.6%                         |
| 316 ships  | 0.42 ms       | 2.5%                         |

Scripted matches finish by conquest in roughly 12 minutes.

### Known gaps

These are honest limitations, not oversights:

- **The map is resource-asymmetric.** Player 1 borders the Gold Planet while
  player 2 borders Tungsten. This follows `docs/Map_Design.md`, which
  acknowledges the imbalance and specifies no compensation. In scripted testing
  player 1 wins consistently. Real balance work needs human playtesting.
- **Gold outpaces its sinks.** By the mid game income exceeds what there is to
  spend it on, so gold stops being a meaningful constraint. The design docs
  flag the same problem in their own reference timeline.
- **No audio**, and no reconnection: disconnecting forfeits the match.
- **Phase 2 content is out of scope**, as the docs intend: Admiral ships, fog of
  war, ship abilities, multiple waypoints, stealth, and the Spy, Shield Frigate,
  Miner, Drone Carrier and Ram Ship classes.

---

## Design documents

`docs/` holds the full specification. Where documents contradicted each other,
the resolution is recorded as a comment next to the affected code — most of them
in `packages/config/`, which is the single source of truth for balance.

| Document                                   | Covers                                   |
| ------------------------------------------ | ---------------------------------------- |
| `MVP_Design.md`, `GameLoop.md`             | Match structure, win conditions, pacing  |
| `Complete_Units_and_Buildings.md`          | Every unit and building stat             |
| `ResourcesEconomy.md`                      | Income, costs, caps, build orders        |
| `Map_Design.md`                            | The seven-planet chain, moons, distances |
| `ECS_game_design_system.md`                | Components, systems, execution order     |
| `Technical_Architecture.md`                | Stack, networking, deployment            |
| `UI_Design_System.md`                      | Palette, typography, components          |
| `Code_Structure.md`, `Coding_Standards.md` | Repo layout and conventions              |
