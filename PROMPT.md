# Fleet Strike - Complete Implementation Prompt

## Mission

You are tasked with implementing **Fleet Strike** from scratch - a server-authoritative 1v1 space auto-battler. You will:

1. **Delete** the existing codebase (keep only `docs/`, `README.md`, `.git/`)
2. **Rebuild** the entire game according to the documentation
3. **Commit frequently** in small, logical increments
4. **Continue** until all MVP features are complete and tested
5. **Track progress** using the milestone checklist below

---

## Context & Documentation

Read ALL documentation files in `docs/` before starting:

**Architecture & Code:**
- `docs/Code_Structure.md` - TurboRepo monorepo structure, package organization
- `docs/Coding_Standards.md` - TypeScript standards, naming, formatting, testing
- `docs/Technical_Architecture.md` - Full tech stack (PixiJS 8, bitECS, Node.js, WebSockets)
- `docs/ECS_game_design_system.md` - Entity-Component-System patterns with bitECS

**Game Design:**
- `docs/Game_Description.md` - High-level game concept and mechanics
- `docs/GameLoop.md` - Core gameplay loop and turn structure
- `docs/MVP_Design.md` - Essential features for minimum viable product
- `docs/Map_Design.md` - 7-planet map with moons and strategic layout
- `docs/ResourcesEconomy.md` - Gold, manpower, exotic resources system
- `docs/Complete_Units_and_Buildings.md` - All units, weapons, buildings with exact stats

**UI/UX:**
- `docs/UI_Design_System.md` - Vanilla CSS, neon cyberpunk aesthetic, no framework

**Vision:**
- `docs/Design_Vision.md` - Feature phases (MVP, Phase 2, Phase 3+)

---

## Implementation Strategy

### Phase 0: Setup (Delete & Initialize)

**Delete old code, keep only:**
```bash
# Keep these
docs/
README.md
.git/
.gitignore

# Delete everything else
rm -rf src/ apps/ packages/ infrastructure/ node_modules/ *.json *.yaml *.ts *.js
```

**Initialize fresh TurboRepo monorepo:**
1. Create `pnpm-workspace.yaml`
2. Create root `package.json` with TurboRepo
3. Create `turbo.json` with build pipeline
4. Create `tsconfig.base.json` for shared TypeScript config
5. Create directory structure: `apps/`, `packages/`
6. Commit: `"chore: initialize TurboRepo monorepo structure"`

### Phase 1: Foundation Packages

Build shared packages first (bottom-up dependency graph):

**1.1 - @fleet-strike/types**
- Create package structure
- Define all TypeScript types (Ship, Player, Match, Building, Planet, etc.)
- Define network protocol (ClientMessage, ServerMessage)
- Commit: `"feat(types): add game and network type definitions"`

**1.2 - @fleet-strike/config**
- Create package structure
- Define ship stats from `Complete_Units_and_Buildings.md`
- Define weapon configs (damage, range, fire rate)
- Define building stats (costs, production times)
- Define balance constants (wave duration, income rates)
- Commit: `"feat(config): add game configuration and balance constants"`

**1.3 - @fleet-strike/utils**
- Create package structure
- Implement vector math (distance, normalize, lerp)
- Implement collision detection utilities
- Implement validation helpers
- Implement ID generation
- Write unit tests
- Commit: `"feat(utils): add math, validation, and ID utilities"`

**1.4 - @fleet-strike/ecs**
- Create package structure
- Define bitECS components (Position, Velocity, Health, Weapon, etc.)
- Implement core systems (movement, collision, combat, production)
- Create world management utilities
- Write unit tests for all systems
- Commit: `"feat(ecs): implement ECS components and systems with bitECS"`

**1.5 - @fleet-strike/renderer**
- Create package structure
- Implement PixiJS sprite creation functions
- Implement particle systems (engine trails, explosions)
- Implement Camera class (pan, zoom, follow)
- Implement frustum culling
- Write tests
- Commit: `"feat(renderer): add PixiJS rendering abstractions"`

### Phase 2: Backend Application

**2.1 - Backend: Server Setup**
- Create `apps/backend/` structure
- Setup Express + WebSocket server
- Implement connection handling
- Implement room creation/joining
- Commit: `"feat(backend): setup Express and WebSocket server"`

**2.2 - Backend: Matchmaking**
- Implement room management
- Implement lobby system
- Implement player matching
- Add room state tracking
- Commit: `"feat(backend): implement matchmaking and room management"`

**2.3 - Backend: Game Simulation**
- Implement authoritative game loop (60 ticks/second)
- Integrate ECS systems (movement, collision, combat)
- Implement planet capture logic
- Implement building production
- Implement resource generation
- Commit: `"feat(backend): implement server-authoritative game simulation"`

**2.4 - Backend: Input Validation**
- Validate all client commands (build, waypoint, card selection)
- Prevent invalid actions (insufficient resources, invalid targets)
- Add anti-cheat validation
- Write integration tests
- Commit: `"feat(backend): add client command validation"`

**2.5 - Backend: State Broadcasting**
- Implement state serialization
- Broadcast game state to clients (30Hz)
- Implement delta compression (optional but recommended)
- Commit: `"feat(backend): implement state broadcasting to clients"`

### Phase 3: Frontend Application

**3.1 - Frontend: Project Setup**
- Create `apps/frontend/` with Vite
- Setup PixiJS 8 application
- Configure WebGPU/WebGL fallback
- Add basic HTML structure
- Commit: `"feat(frontend): setup Vite and PixiJS 8 application"`

**3.2 - Frontend: Network Client**
- Implement WebSocket client
- Handle connection/disconnection
- Handle room joining with codes
- Parse server messages
- Commit: `"feat(frontend): implement WebSocket client"`

**3.3 - Frontend: Game State Management**
- Implement client-side ECS world (synchronized with server)
- Handle server state updates
- Implement state interpolation/prediction (optional for MVP)
- Commit: `"feat(frontend): implement client game state management"`

**3.4 - Frontend: Rendering System**
- Initialize PixiJS application
- Render planets and moons
- Render ships with sprites
- Render projectiles
- Render effects (engine trails, explosions)
- Implement camera controls (pan, zoom)
- Commit: `"feat(frontend): implement PixiJS rendering for all entities"`

**3.5 - Frontend: Input Handling**
- Implement mouse click handling
- Implement waypoint placement
- Implement card selection
- Implement building placement
- Send commands to server
- Commit: `"feat(frontend): implement player input and command sending"`

**3.6 - Frontend: UI Screens**
- Build main menu (vanilla CSS)
- Build lobby screen (room creation/joining)
- Build loading screen
- Apply neon cyberpunk aesthetic
- Commit: `"feat(frontend): add menu and lobby UI screens"`

**3.7 - Frontend: In-Game HUD**
- Display resource counters (gold, manpower)
- Display card selection panel (3 positions)
- Display ship cards with costs
- Display build panel for planets/moons
- Display minimap
- Display game timer
- Commit: `"feat(frontend): implement in-game HUD"`

**3.8 - Frontend: Polish**
- Add sound effects (optional for MVP)
- Add visual feedback (hover states, selection highlights)
- Add error messages (insufficient resources, etc.)
- Optimize rendering performance
- Commit: `"feat(frontend): add polish and visual feedback"`

### Phase 4: Game Content

**4.1 - Map Generation**
- Implement 7-planet map layout
- Generate 2-3 moons per planet
- Assign unique resources to neutral planets
- Set planet capture zones
- Commit: `"feat(game): implement 7-planet map with moons"`

**4.2 - Unit Implementation**
- Implement all MVP units (Scout, Soldier, Heavy, Sniper, Bomber)
- Apply stats from config
- Test combat interactions
- Commit: `"feat(game): implement all MVP unit types"`

**4.3 - Building Implementation**
- Implement factories (auto-production every 45s)
- Implement economic buildings (gold mines, manpower centers)
- Implement defensive buildings (turrets, shields)
- Test building placement and production
- Commit: `"feat(game): implement all building types"`

**4.4 - Combat System**
- Implement weapon firing logic
- Implement projectile simulation
- Implement damage calculation (weapon type vs armor type)
- Implement unit death and cleanup
- Test all weapon/armor interactions
- Commit: `"feat(game): implement complete combat system"`

**4.5 - Economy System**
- Implement gold generation (base + income scaling)
- Implement manpower system
- Implement exotic resource unlocks
- Implement building costs
- Test resource flows
- Commit: `"feat(game): implement economy and resource system"`

**4.6 - Win Conditions**
- Implement base destruction victory
- Implement timeout victory (planet control)
- Display victory screen
- Handle game end cleanup
- Commit: `"feat(game): implement win conditions and game end"`

### Phase 5: Testing & Validation

**5.1 - Unit Tests**
- Ensure all packages have ≥70% coverage
- Test critical systems at ≥90% coverage
- Fix any failing tests
- Commit: `"test: achieve target coverage for all packages"`

**5.2 - Integration Tests**
- Test full game flow (menu → lobby → game → victory)
- Test both players simultaneously
- Test edge cases (disconnects, invalid input)
- Commit: `"test: add integration tests for full game flow"`

**5.3 - Manual Playtesting**
- Play full 1v1 matches
- Test all units and buildings
- Test all map locations
- Fix critical bugs
- Commit: `"fix: resolve playtesting issues"`

**5.4 - Performance Testing**
- Test with 50+ ships on screen
- Ensure 60 FPS on mid-range hardware
- Profile and optimize bottlenecks
- Commit: `"perf: optimize rendering and simulation"`

### Phase 6: DevOps & Deployment

**6.1 - Docker Setup**
- Create Dockerfile for backend
- Create Dockerfile for frontend
- Create docker-compose.yml for local dev
- Test containerized deployment
- Commit: `"chore(docker): add Docker configuration"`

**6.2 - CI/CD Pipeline**
- Setup GitHub Actions for tests
- Setup build pipeline
- Setup deployment pipeline (optional for MVP)
- Commit: `"chore(ci): add GitHub Actions pipeline"`

---

## Milestone Checklist

Track your progress. Check off each milestone as completed:

### 🏗️ Phase 0: Setup
- [ ] Delete old codebase (keep docs, README, .git)
- [ ] Initialize TurboRepo monorepo
- [ ] Create workspace configuration
- [ ] Create root package.json and turbo.json
- [ ] Commit: Initial structure

### 📦 Phase 1: Foundation Packages
- [ ] @fleet-strike/types - Complete with tests
- [ ] @fleet-strike/config - All game balance data
- [ ] @fleet-strike/utils - Math, validation, IDs
- [ ] @fleet-strike/ecs - bitECS components and systems
- [ ] @fleet-strike/renderer - PixiJS abstractions

### 🖥️ Phase 2: Backend
- [ ] Server setup (Express + WebSocket)
- [ ] Matchmaking and room management
- [ ] Game simulation loop (60 ticks/sec)
- [ ] Input validation and anti-cheat
- [ ] State broadcasting (30Hz)

### 🎮 Phase 3: Frontend
- [ ] Vite + PixiJS 8 setup
- [ ] WebSocket client connection
- [ ] Client game state management
- [ ] Rendering system (ships, planets, projectiles)
- [ ] Input handling (clicks, waypoints, cards)
- [ ] UI screens (menu, lobby)
- [ ] In-game HUD (resources, cards, minimap)
- [ ] Visual polish and feedback

### 🎯 Phase 4: Game Content
- [ ] 7-planet map generation
- [ ] All MVP units (Scout, Soldier, Heavy, Sniper, Bomber)
- [ ] All buildings (factories, economy, defense)
- [ ] Complete combat system
- [ ] Economy and resource system
- [ ] Win conditions

### ✅ Phase 5: Testing
- [ ] Unit tests (≥70% coverage)
- [ ] Integration tests (full game flow)
- [ ] Manual playtesting (fix critical bugs)
- [ ] Performance testing (60 FPS with 50+ ships)

### 🚀 Phase 6: DevOps
- [ ] Docker configuration
- [ ] CI/CD pipeline (GitHub Actions)

### 🎊 FINAL
- [ ] Game is fully playable 1v1
- [ ] All MVP features implemented
- [ ] Tests passing
- [ ] Ready for deployment

---

## Commit Strategy

**Commit frequently in small, logical increments:**

✅ **Good commits:**
- `"feat(types): add Ship and Player type definitions"`
- `"feat(ecs): implement movement system"`
- `"test(utils): add vector math unit tests"`
- `"fix(backend): prevent negative gold values"`
- `"refactor(renderer): split ship rendering into modules"`

❌ **Bad commits:**
- `"wip"` (too vague)
- `"feat: add everything"` (too large)
- `"fix stuff"` (not descriptive)

**Commit after each logical unit of work:**
- After implementing a single system/component
- After adding tests for a module
- After fixing a specific bug
- After completing a file that's ready to use

**Push regularly** (every 5-10 commits) to avoid losing work.

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development (frontend + backend)
pnpm dev

# Build everything
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint and format
pnpm lint
pnpm format

# Build single package
pnpm -C packages/ecs build

# Test single package with watch
pnpm -C packages/ecs test --watch
```

---

## Success Criteria

The implementation is **complete** when:

1. ✅ Two players can join a room via code
2. ✅ Both players start with correct initial state (gold, manpower, starting ships)
3. ✅ Players can select position cards (Vanguard/Mid/Rear)
4. ✅ Players can click ship cards to queue units (if resources available)
5. ✅ Players can click planets/moons to build structures
6. ✅ Players can click map to set waypoint
7. ✅ Ships auto-move to waypoint and auto-engage enemies
8. ✅ Combat works (projectiles, damage, armor types, death)
9. ✅ Factories auto-produce units every 45 seconds
10. ✅ Resources generate continuously (gold, manpower)
11. ✅ Planets can be captured via proximity
12. ✅ Game ends when base destroyed OR timeout
13. ✅ Victory screen shows winner
14. ✅ All systems run at 60 FPS with 50+ ships
15. ✅ Tests pass with ≥70% coverage

---

## Notes & Guidelines

### Code Quality
- **Follow all standards** in `docs/Coding_Standards.md`
- **Max 200 lines per file** - split if exceeding
- **Named exports only** - no default exports
- **Strict TypeScript** - no `any` types
- **Test everything** - write tests alongside implementation

### Architecture
- **Follow structure** in `docs/Code_Structure.md`
- **Respect dependency graph** - packages don't depend on apps
- **Data-oriented design** - use bitECS Structure-of-Arrays
- **Server-authoritative** - validate all client commands

### Performance
- **60 FPS minimum** - profile and optimize
- **Spatial partitioning** - don't do O(n²) collision checks
- **Entity pooling** - minimize garbage collection
- **Frustum culling** - only render visible entities

### Git Workflow
- **Feature branches** - create branches for major features
- **Small commits** - commit after each logical unit
- **Descriptive messages** - use Conventional Commits format
- **Push regularly** - don't lose work

### When Stuck
- **Re-read docs** - answer is likely in documentation
- **Check examples** - docs include code examples
- **Test incrementally** - don't build everything before testing
- **Ask for help** - describe specific issue with context

---

## Resuming Work

If you need to pause and resume:

1. **Check milestone checklist** - see what's completed
2. **Run `git log --oneline -20`** - see recent commits
3. **Run `pnpm dev`** - verify current state works
4. **Run `pnpm test`** - check test status
5. **Review next unchecked milestone** - continue from there

---

## Final Note

You have complete documentation for every aspect of the game. Read ALL docs thoroughly before starting. Follow the phase structure, commit frequently, and track progress in the checklist.

**Build methodically. Test continuously. Commit often.**

Good luck! 🚀
