# Fleet Strike - Code Structure

## Overview

Fleet Strike is organized as a **TurboRepo monorepo** with strict modularity principles. The codebase consists of small, testable packages that compose into frontend and backend applications.

**Architecture Principles:**
- **Modularity:** Files are limited to 200 lines maximum
- **Testability:** Every module can be tested in isolation
- **Type Safety:** Strict TypeScript with no `any` types
- **Code Sharing:** Packages eliminate duplication between apps
- **Clear Boundaries:** Each package has a single, well-defined responsibility

---

## Directory Structure

```
fleet-strike-game/
├── apps/
│   ├── frontend/              # PixiJS web client
│   └── backend/               # Node.js game server
├── packages/
│   ├── ecs/                   # Entity-Component-System (bitECS)
│   ├── types/                 # Shared TypeScript types
│   ├── config/                # Game configuration & balance
│   ├── utils/                 # Shared utilities
│   └── renderer/              # PixiJS rendering abstractions
├── infrastructure/            # Docker, Terraform, Kubernetes
├── docs/                      # Documentation
├── turbo.json                 # TurboRepo configuration
├── pnpm-workspace.yaml        # PNPM workspaces
└── tsconfig.base.json         # Shared TypeScript config
```

---

## Applications

### apps/frontend

**Purpose:** Web client that renders the 2D game using PixiJS and handles player input.

**Structure:**
```
apps/frontend/
├── src/
│   ├── game/              # Game logic and rendering
│   │   ├── canvas/        # PixiJS initialization
│   │   ├── graphics/      # Rendering functions
│   │   ├── input/         # Mouse/keyboard handling
│   │   └── state/         # Client game state
│   ├── ui/                # HTML/CSS interface
│   │   ├── components/    # Reusable UI elements
│   │   ├── screens/       # Full screens (menu, lobby)
│   │   └── hud/           # In-game HUD
│   ├── network/           # WebSocket client
│   ├── styles/            # CSS modules
│   └── main.ts            # Entry point
├── public/
│   ├── index.html
│   └── assets/            # Images, sounds
├── tests/
├── package.json
├── vite.config.ts
└── tsconfig.json
```

**Key Responsibilities:**
- Initialize PixiJS application with WebGPU/WebGL rendering
- Render ships, planets, projectiles, and effects
- Handle user input (clicking, card selection, waypoint placement)
- Connect to backend via WebSocket
- Maintain client-side game state (synchronized with server)
- Display UI overlays (HUD, menus, build panels)

**Dependencies:**
- `@fleet-strike/types` - Game types
- `@fleet-strike/config` - Configuration
- `@fleet-strike/ecs` - ECS systems
- `@fleet-strike/utils` - Utilities
- `@fleet-strike/renderer` - Rendering
- `pixi.js` - 2D rendering
- `bitecs` - ECS library

### apps/backend

**Purpose:** Server-authoritative game server that runs the simulation loop and validates player actions.

**Structure:**
```
apps/backend/
├── src/
│   ├── server/            # HTTP and WebSocket server
│   │   ├── http.ts        # Express setup
│   │   ├── websocket.ts   # WebSocket handling
│   │   └── routes.ts      # API endpoints
│   ├── matchmaking/       # Room management
│   │   ├── rooms.ts       # Room state
│   │   └── lobby.ts       # Matchmaking
│   ├── simulation/        # Game loop
│   │   ├── systems/       # Server ECS systems
│   │   ├── physics/       # Movement & collision
│   │   ├── combat/        # Damage calculation
│   │   └── game-loop.ts   # Main tick loop
│   ├── validation/        # Input validation
│   │   ├── commands.ts    # Client command validation
│   │   └── state.ts       # State validation
│   └── index.ts           # Entry point
├── tests/
├── package.json
└── tsconfig.json
```

**Key Responsibilities:**
- Run authoritative game simulation at 60 ticks/second
- Validate all client commands (prevent cheating)
- Broadcast state updates to connected clients
- Manage rooms and matchmaking
- Handle WebSocket connections and disconnections

**Dependencies:**
- `@fleet-strike/types` - Game types
- `@fleet-strike/config` - Configuration
- `@fleet-strike/ecs` - ECS systems
- `@fleet-strike/utils` - Utilities
- `express` - HTTP server
- `ws` - WebSocket
- `bitecs` - ECS library

---

## Packages

### packages/ecs

**Purpose:** Entity-Component-System architecture using bitECS. Defines components and systems shared between client and server.

**Structure:**
```
packages/ecs/
├── src/
│   ├── components/        # Component definitions
│   │   ├── transform.ts   # Position, rotation, velocity
│   │   ├── combat.ts      # Health, damage, weapons
│   │   ├── movement.ts    # Speed, waypoints
│   │   ├── ownership.ts   # Player ID, team
│   │   ├── rendering.ts   # Sprite data
│   │   └── index.ts
│   ├── systems/           # System logic
│   │   ├── movement.ts    # Update positions
│   │   ├── collision.ts   # Collision detection
│   │   ├── combat.ts      # Weapon firing
│   │   ├── production.ts  # Factory spawning
│   │   └── index.ts
│   ├── world.ts           # World utilities
│   ├── queries.ts         # Common queries
│   └── index.ts
└── tests/
```

**Key Responsibilities:**
- Define all ECS components (Position, Health, Weapon, etc.)
- Implement shared systems (movement, collision, combat)
- Provide world creation and management utilities
- Ensure data-oriented design for performance

**Exports:**
```typescript
// Components (Structure-of-Arrays)
import { Position, Velocity, Health } from '@fleet-strike/ecs/components';

// Systems
import { movementSystem, combatSystem } from '@fleet-strike/ecs/systems';

// World utilities
import { createWorld, addEntity } from '@fleet-strike/ecs';
```

### packages/types

**Purpose:** All TypeScript type definitions shared across the codebase.

**Structure:**
```
packages/types/
├── src/
│   ├── game/              # Game domain types
│   │   ├── ships.ts       # Ship types
│   │   ├── player.ts      # Player types
│   │   ├── match.ts       # Match state
│   │   ├── buildings.ts   # Factories, structures
│   │   ├── planets.ts     # Planets, moons
│   │   └── index.ts
│   ├── network/           # Network protocol
│   │   ├── messages.ts    # WebSocket messages
│   │   ├── events.ts      # Game events
│   │   └── index.ts
│   └── index.ts
└── tests/
```

**Key Responsibilities:**
- Define all game entities (Ship, Player, Planet, etc.)
- Define network protocol (ClientMessage, ServerMessage)
- Ensure type consistency between frontend and backend
- Provide compile-time type safety

**Exports:**
```typescript
// Game types
import type { Ship, Player, MatchState } from '@fleet-strike/types';

// Network types
import type { ClientMessage, ServerMessage } from '@fleet-strike/types/network';
```

### packages/config

**Purpose:** Game configuration and balance constants. All hardcoded game values live here.

**Structure:**
```
packages/config/
├── src/
│   ├── ships.ts           # Ship stats (HP, damage, speed, cost)
│   ├── weapons.ts         # Weapon configs
│   ├── buildings.ts       # Factory stats
│   ├── balance.ts         # Balance constants
│   ├── network.ts         # Network constants
│   └── index.ts
└── tests/
```

**Key Responsibilities:**
- Define ship statistics (HP, damage, speed, costs)
- Define weapon configurations (damage, range, fire rate)
- Define building stats (production time, costs)
- Provide game balance constants (wave duration, income rates)

**Exports:**
```typescript
import { SHIPS, WEAPONS, BASE_HP, WAVE_DURATION } from '@fleet-strike/config';

const scoutHp = SHIPS.scout.maxHp;       // 100
const laserDamage = WEAPONS.laser.damage; // 50
```

### packages/utils

**Purpose:** Shared utility functions for common operations.

**Structure:**
```
packages/utils/
├── src/
│   ├── math/              # Mathematical utilities
│   │   ├── vector.ts      # Vector operations
│   │   ├── collision.ts   # Collision math
│   │   ├── interpolation.ts # Lerp, easing
│   │   └── index.ts
│   ├── validation/        # Validation helpers
│   │   ├── bounds.ts      # Boundary checking
│   │   ├── resources.ts   # Resource validation
│   │   └── index.ts
│   ├── id-generation.ts   # Entity ID generation
│   ├── random.ts          # Random utilities
│   └── index.ts
└── tests/
```

**Key Responsibilities:**
- Provide vector math functions (distance, normalize, lerp)
- Provide collision detection utilities
- Provide validation helpers (bounds checking, resource validation)
- Generate unique entity IDs

**Exports:**
```typescript
import { distance, normalize } from '@fleet-strike/utils/math';
import { isWithinBounds } from '@fleet-strike/utils/validation';
import { generateId } from '@fleet-strike/utils';
```

### packages/renderer

**Purpose:** PixiJS rendering abstractions. Converts ECS data into PixiJS graphics.

**Structure:**
```
packages/renderer/
├── src/
│   ├── sprites/           # Sprite creation
│   │   ├── ship-sprite.ts
│   │   ├── planet-sprite.ts
│   │   ├── projectile-sprite.ts
│   │   └── index.ts
│   ├── particles/         # Particle systems
│   │   ├── engine-trail.ts
│   │   ├── explosion.ts
│   │   └── index.ts
│   ├── camera.ts          # Camera controller
│   ├── culling.ts         # Frustum culling
│   └── index.ts
└── tests/
```

**Key Responsibilities:**
- Create PixiJS sprites from ECS data
- Manage particle systems (engine trails, explosions)
- Provide camera controls (pan, zoom, follow)
- Implement frustum culling for performance

**Exports:**
```typescript
import { createShipSprite, createPlanetSprite } from '@fleet-strike/renderer/sprites';
import { Camera } from '@fleet-strike/renderer';

const sprite = createShipSprite(ship, config);
const camera = new Camera(width, height);
```

---

## File Organization

### File Size Limit

Every source file is limited to **200 lines**. Files exceeding this limit are split into smaller modules.

**Rationale:** Small files are easier to understand, test, and refactor. They force clear separation of concerns.

### One Concept Per File

Each file has a single, well-defined responsibility.

**Example:**
```
packages/ecs/src/systems/
├── movement.ts      # ONLY movement updates
├── collision.ts     # ONLY collision detection
├── combat.ts        # ONLY weapon firing
└── production.ts    # ONLY factory spawning
```

### Index Files

Each package and folder has an `index.ts` that re-exports its public API.

**Example:**
```typescript
// packages/types/src/index.ts
export * from './game';
export * from './network';
```

**Benefit:** Clean imports without deep paths.
```typescript
// ✅ Clean
import { Ship, Player } from '@fleet-strike/types';

// ❌ Verbose (but still works)
import { Ship } from '@fleet-strike/types/src/game/ships';
```

### Tests Alongside Source

Test files live next to the files they test with `.test.ts` suffix.

**Example:**
```
packages/ecs/src/systems/
├── movement.ts
├── movement.test.ts
├── collision.ts
└── collision.test.ts
```

---

## Naming Conventions

### Files
- **Lowercase hyphen-separated:** `ship-factory.ts`, `collision-detection.ts`
- **Test files:** `ship-factory.test.ts`

### Variables & Functions
- **camelCase:** `shipCount`, `createShip()`, `calculateDamage()`
- **Boolean prefixes:** `isAlive`, `hasShield`, `canMove`, `shouldFire`

### Types & Interfaces
- **PascalCase:** `Ship`, `Player`, `MatchState`, `GameEvent`
- **No prefix:** `Ship` not `IShip`

### Constants
- **UPPER_SNAKE_CASE:** `MAX_SHIPS`, `WAVE_DURATION`, `BASE_HP`

### Packages
- **@fleet-strike/[name]:** `@fleet-strike/types`, `@fleet-strike/ecs`

---

## Import Conventions

### Import Order

Imports are organized in three groups:

```typescript
// 1. External dependencies (npm packages)
import { Application } from 'pixi.js';
import { createWorld } from 'bitecs';

// 2. Internal packages (monorepo)
import { Ship, Player } from '@fleet-strike/types';
import { SHIPS } from '@fleet-strike/config';
import { movementSystem } from '@fleet-strike/ecs/systems';

// 3. Relative imports (same package)
import { createShipSprite } from './sprites/ship-sprite';
import { Camera } from '../camera';
```

### Named Exports Only

All modules use named exports. Default exports are not used.

**Rationale:** Named exports are easier to refactor, search, and provide better IDE support.

```typescript
// ✅ Named export
export function createShip() { /* ... */ }

// ❌ Default export (not used)
export default function createShip() { /* ... */ }
```

---

## Package Dependencies

Packages follow these dependency rules:

1. **Apps** depend on **packages** ✅
2. **Packages** depend on other **packages** ✅
3. **Packages** do NOT depend on **apps** ❌
4. Circular dependencies are minimized

**Dependency Graph:**
```
apps/frontend  ─┐
                ├─> ecs ──────> types
apps/backend   ─┤   renderer ──┘
                ├─> config ────> types
                └─> utils ─────> types
```

**package.json Example:**
```json
{
  "dependencies": {
    "@fleet-strike/types": "workspace:*",
    "@fleet-strike/ecs": "workspace:*"
  }
}
```

The `workspace:*` syntax links local packages during development.

---

## TurboRepo Configuration

### Build Pipeline

The `turbo.json` defines task dependencies:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Key Concepts:**
- `^build` - Build dependencies first
- `outputs` - Cache these directories
- `cache: false` - Always run (for dev mode)

### Common Commands

```bash
# Start all dev servers
pnpm dev

# Build everything
pnpm build

# Run all tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Build single package
pnpm -C packages/ecs build

# Test single package
pnpm -C packages/ecs test
```

---

## Development Workflow

### Starting Development

```bash
# Install dependencies
pnpm install

# Start frontend + backend
pnpm dev
```

The frontend runs on `http://localhost:5173` (Vite).
The backend runs on `http://localhost:3000` (Express + WebSocket).

### Adding Features

1. Define types in `packages/types/`
2. Add configuration in `packages/config/`
3. Implement ECS logic in `packages/ecs/`
4. Add rendering in `packages/renderer/` or `apps/frontend/`
5. Write tests alongside implementation
6. Update server logic in `apps/backend/` if needed

### Running Tests

```bash
# All tests
pnpm test

# Watch mode (single package)
pnpm -C packages/ecs test --watch

# Specific test file
pnpm -C packages/ecs test movement.test.ts
```

---

## Design Principles

### Data-Oriented Design

The ECS architecture uses Structure-of-Arrays (SoA) for cache efficiency:

```typescript
// ✅ SoA - Cache-friendly
Position.x[entity] = 100;
Position.y[entity] = 200;

// ❌ AoS - Cache-unfriendly
entities[i].position = { x: 100, y: 200 };
```

### Strict Type Safety

All code uses strict TypeScript with no `any` types:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Functional Programming

Systems are pure functions that operate on ECS data:

```typescript
// Systems take world + deltaTime, return void
export function movementSystem(world: World, deltaTime: number): void {
  const entities = movementQuery(world);
  for (const eid of entities) {
    Position.x[eid] += Velocity.dx[eid] * deltaTime;
    Position.y[eid] += Velocity.dy[eid] * deltaTime;
  }
}
```

### Performance First

- Spatial partitioning for collision detection (O(n) not O(n²))
- Entity pooling to avoid garbage collection
- Frustum culling for rendering
- Batch operations in systems
- Minimize allocations in hot paths

---

## Summary

Fleet Strike's code structure ensures:

- ✅ **Modularity** - Small files (max 200 lines)
- ✅ **Testability** - Isolated packages
- ✅ **Type Safety** - Strict TypeScript
- ✅ **Code Sharing** - No duplication
- ✅ **Performance** - TurboRepo caching
- ✅ **Clarity** - Clear boundaries and responsibilities

Every file serves a single purpose. Every package has a clear responsibility. Every dependency is explicit and minimal.

---

**See Also:**
- [Coding_Standards.md](./Coding_Standards.md) - Detailed style and TypeScript standards
- [Technical_Architecture.md](./Technical_Architecture.md) - Overall technical stack
- [ECS_game_design_system.md](./ECS_game_design_system.md) - ECS architecture details
