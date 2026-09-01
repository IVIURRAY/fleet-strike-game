# Fleet Strike - Technical Architecture

## Overview

Fleet Strike is a **2D real-time strategy auto-battler** built with modern web technologies. This document outlines the complete technical stack, architecture decisions, infrastructure, and development workflow.

**Core Technologies:**
- **Frontend:** TypeScript, PixiJS 8 (2D WebGL/WebGPU), bitECS
- **Backend:** Node.js, TypeScript, WebSockets
- **Infrastructure:** Docker, Digital Ocean, Terraform
- **CI/CD:** GitHub Actions
- **Testing:** Vitest, Playwright

---

## Graphics & Rendering

### 2D Graphics Pipeline

**Renderer: PixiJS 8**
- **Why PixiJS:** Battle-tested 2D WebGL renderer with excellent performance
- **WebGPU Support:** PixiJS 8 includes WebGPU renderer for future-proofing
- **Sprite Rendering:** Handle 200-300+ ships with particle effects at 60 FPS
- **Canvas Fallback:** Automatic fallback to WebGL2 → WebGL → Canvas2D

**Rendering Architecture:**
```
┌─────────────────────────────────────────┐
│   ECS Simulation (Game Logic)          │
│   - Position, Velocity, Health         │
│   - No rendering code in ECS            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   Render System (PixiJS Integration)   │
│   - Reads Position/Sprite components   │
│   - Updates PixiJS display objects     │
│   - Handles camera, culling, effects   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   PixiJS WebGPU/WebGL Renderer         │
│   - GPU-accelerated sprite batching    │
│   - Particle systems, post-processing  │
│   - 60 FPS target                      │
└─────────────────────────────────────────┘
```

### WebGPU Strategy

**MVP (Phase 1):**
- Use PixiJS 8's automatic renderer selection
- Defaults to WebGPU on supported browsers (Chrome 113+, Edge 113+)
- Falls back to WebGL2 on Safari, Firefox, older browsers

**Phase 2+:**
- Custom WebGPU compute shaders for particle systems (1000+ projectiles)
- GPU-accelerated spatial partitioning for collision detection
- Instanced rendering for identical ships (draw 100 Scouts in 1 draw call)

**Browser Support Strategy:**
- Target: Chrome, Edge, Safari, Firefox (latest 2 versions)
- Minimum: WebGL2 (95%+ browser support)
- Optimal: WebGPU (progressive enhancement)

---

## ECS Architecture

### ECS Library: bitECS

**Selected:** [bitECS](https://github.com/NateTheGreatt/bitECS)

**Why bitECS:**
- ✅ **Performance:** Structure-of-Arrays (SoA) architecture, cache-friendly
- ✅ **Bundle Size:** 1KB minified (critical for web game)
- ✅ **TypeScript:** Full TypeScript support
- ✅ **Battle-Tested:** Used in production games (Hyperfy, Webaverse)
- ✅ **Simple API:** Low learning curve, clear documentation
- ✅ **No Magic:** Explicit, predictable, no hidden allocations

**Alternatives Considered:**
- **Miniplex:** Great DX, but slightly slower (~15% overhead vs bitECS)
- **Becsy:** Modern, Bevy-inspired, but larger bundle (3KB+) and less mature

### ECS Structure

**Core Concepts:**
```typescript
// Entities are IDs (numbers)
const ship = addEntity(world);

// Components are data (SoA)
const Position = defineComponent({ x: Types.f32, y: Types.f32 });
Position.x[ship] = 100;
Position.y[ship] = 200;

// Systems are functions (operate on component queries)
const movementQuery = defineQuery([Position, Velocity]);
const movementSystem = (world) => {
  const entities = movementQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    Position.x[eid] += Velocity.dx[eid] * deltaTime;
    Position.y[eid] += Velocity.dy[eid] * deltaTime;
  }
};
```

**Component Categories:**
1. **Transform:** Position, Velocity, Rotation
2. **Combat:** Health, Weapon, Targeting, Armor
3. **Identity:** Owner, ShipType, TeamColor
4. **Movement:** Waypoint, Orbital, Homing
5. **Economic:** Production, ResourceGenerator, Cost
6. **Capture:** Capturable, CaptureGenerator
7. **Rendering:** Sprite, ParticleEmitter, Animation

**System Execution Order (60 FPS):**
```
Every Frame (60 FPS):
1. MovementSystem           - Update positions
2. WaypointNavigationSystem - Steer toward destination
3. TargetingSystem          - Find enemies (every 0.5s)
4. CombatSystem             - Fire weapons
5. ProjectileMovementSystem - Update projectiles
6. ProjectileCollisionSystem - Detect hits (spatial partitioning)
7. HealthSystem             - Apply damage, check death
8. MoonOrbitSystem          - Update moon positions
9. EffectLifetimeSystem     - Destroy expired effects
10. RenderSystem            - Draw to screen (PixiJS)

Every 1 Second:
11. ProductionSystem        - Spawn ships from factories
12. ResourceGenerationSystem - Add gold/manpower
13. CapturePlanetSystem     - Tug-of-war logic
```

### Performance Optimizations

**Spatial Partitioning (Collision Detection):**
```typescript
// Grid-based broad-phase collision detection
const CELL_SIZE = 200; // units
const grid: Map<string, Set<EntityID>> = new Map();

function updateGrid(eid: EntityID) {
  const cellX = Math.floor(Position.x[eid] / CELL_SIZE);
  const cellY = Math.floor(Position.y[eid] / CELL_SIZE);
  const key = `${cellX},${cellY}`;
  if (!grid.has(key)) grid.set(key, new Set());
  grid.get(key)!.add(eid);
}

function queryNearby(x: number, y: number, radius: number): EntityID[] {
  const cells = getAdjacentCells(x, y);
  return cells.flatMap(key => Array.from(grid.get(key) || []));
}
```

**Entity Pooling (Avoid GC Pauses):**
```typescript
const projectilePool: EntityID[] = [];

function spawnProjectile() {
  return projectilePool.pop() || addEntity(world);
}

function destroyProjectile(eid: EntityID) {
  // Deactivate instead of destroying
  removeComponent(world, eid, Active);
  projectilePool.push(eid);
}
```

**Frustum Culling (Render Only Visible):**
```typescript
function renderSystem(camera: Camera) {
  const entities = renderQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    if (!camera.isVisible(Position.x[eid], Position.y[eid])) continue;
    updateSprite(eid); // Only render visible entities
  }
}
```

---

## Project Structure

### Monorepo Layout (Frontend + Backend)

```
fleet-strike-game/
├── frontend/                 # Client application
│   ├── src/
│   │   ├── ecs/              # ECS systems and components
│   │   │   ├── components/   # Component definitions
│   │   │   ├── systems/      # System logic
│   │   │   └── world.ts      # ECS world setup
│   │   ├── rendering/        # PixiJS rendering layer
│   │   │   ├── sprites/      # Sprite management
│   │   │   ├── particles/    # Particle effects
│   │   │   └── camera.ts     # Camera system
│   │   ├── network/          # WebSocket client
│   │   ├── ui/               # UI components (HUD, menus)
│   │   ├── assets/           # Textures, sounds
│   │   └── main.ts           # Entry point
│   ├── tests/                # Frontend tests
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                  # Server application
│   ├── src/
│   │   ├── ecs/              # Server-authoritative ECS (shared with frontend)
│   │   ├── network/          # WebSocket server
│   │   ├── matchmaking/      # Room creation, matchmaking
│   │   ├── simulation/       # Server-side game loop
│   │   └── index.ts          # Entry point
│   ├── tests/                # Backend tests
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                   # Shared code (frontend + backend)
│   ├── ecs/                  # Shared ECS definitions
│   │   ├── components.ts     # Component schemas
│   │   └── constants.ts      # Game constants
│   ├── network/              # Network protocol
│   │   └── messages.ts       # WebSocket message types
│   ├── utils/                # Shared utilities
│   └── package.json
│
├── infrastructure/           # Infrastructure as Code
│   ├── terraform/            # Terraform configs
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── docker/               # Docker configurations
│   │   ├── Dockerfile.frontend
│   │   ├── Dockerfile.backend
│   │   └── docker-compose.yml
│   └── k8s/                  # Kubernetes manifests (optional)
│
├── .github/                  # GitHub Actions CI/CD
│   └── workflows/
│       ├── test.yml          # Run tests on PR
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── docs/                     # Documentation
├── package.json              # Root package.json (workspaces)
├── pnpm-workspace.yaml       # PNPM workspace config
└── README.md
```

### Workspace Configuration

**Root `package.json`:**
```json
{
  "name": "fleet-strike-monorepo",
  "private": true,
  "workspaces": ["frontend", "backend", "shared"],
  "scripts": {
    "dev": "concurrently \"pnpm -C backend dev\" \"pnpm -C frontend dev\"",
    "build": "pnpm -C shared build && pnpm -C backend build && pnpm -C frontend build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  }
}
```

**`pnpm-workspace.yaml`:**
```yaml
packages:
  - 'frontend'
  - 'backend'
  - 'shared'
```

---

## UI System

### CSS-Only UI (No Framework)

**Approach:** Vanilla CSS with neon-cyberpunk aesthetic inspired by Geometry Wars

**Why No CSS Framework:**
- ✅ **Performance:** Minimal bundle size (~10-15KB minified)
- ✅ **Custom Design:** Unique neon aesthetic doesn't fit generic frameworks
- ✅ **Simplicity:** No build complexity, no learning curve
- ✅ **Full Control:** Every pixel is intentional

**Architecture:**
```
┌─────────────────────────────────────────┐
│   HTML/CSS UI Layer (Overlay)          │
│   - Menus, HUD, modals                 │
│   - position: absolute                 │
│   - pointer-events selectively enabled │
├─────────────────────────────────────────┤
│   PixiJS Canvas (WebGPU/WebGL)         │
│   - Ships, planets, effects            │
│   - Full viewport rendering            │
└─────────────────────────────────────────┘
```

### Color Palette

**Primary Colors:**
- **Cyan (Player):** `#4fcbe9` - Brand color, player units
- **Magenta (Enemy):** `#c65cff` - Enemy units, accents
- **Green (Success):** `#8eff63` - Income, positive feedback
- **Gold (Resources):** `#fff06a` - Gold, resources

**Backgrounds:**
- Deep space blacks (`#010108`)
- Dark purples (`#100629`)
- Translucent overlays for HUD

**Visual Effects:**
- Neon glow using `text-shadow` and `box-shadow`
- Geometric shapes with `clip-path` (hexagons, skewed elements)
- Smooth transitions and pulse animations

### Typography

```css
/* Headings, Stats */
font-family: 'Barlow Condensed', system-ui;
font-weight: 700-800;
letter-spacing: 2px;
text-transform: uppercase;

/* Body, Labels */
font-family: 'Inter', system-ui;
font-weight: 400-600;
```

### UI Components

1. **Top Bar (HUD):** Player HP, resources, timer
2. **Bottom Panel:** Build menu, unit cards, lane selection
3. **Cards:** Unit/building selection with hover glow
4. **Panels/Modals:** Menus, victory/defeat screens
5. **HP Bars:** Skewed geometric bars with gradient fills
6. **Buttons:** Neon glow on hover, clear active states

### Performance

- Hardware-accelerated CSS (`transform`, `opacity`)
- Minimal repaints (batch DOM updates)
- `will-change` for animations
- `contain` for isolated components

**See:** `docs/UI_Design_System.md` for complete design system documentation.

---

## Backend Architecture

### Server Technology Stack

**Runtime:** Node.js 20 LTS  
**Framework:** Express.js (HTTP server)  
**WebSocket:** `ws` library (lightweight, battle-tested)  
**Game Loop:** Custom authoritative server loop (60 ticks/sec)

### Server Responsibilities

**Authoritative Server Model:**
- Server runs full ECS simulation (deterministic game state)
- Clients send **commands** (move waypoint, build factory)
- Server validates, processes, broadcasts state updates
- Prevents cheating (client can't forge gold, HP, position)

**Server Loop:**
```typescript
const TICK_RATE = 60; // ticks per second
const TICK_INTERVAL = 1000 / TICK_RATE;

function serverLoop() {
  const startTime = performance.now();
  
  // 1. Process client commands
  processCommandQueue();
  
  // 2. Run ECS systems (game logic)
  runAllSystems(world, deltaTime);
  
  // 3. Broadcast state updates to clients
  broadcastStateUpdates();
  
  // 4. Schedule next tick
  const elapsed = performance.now() - startTime;
  const nextTick = Math.max(0, TICK_INTERVAL - elapsed);
  setTimeout(serverLoop, nextTick);
}
```

**State Synchronization Strategy:**
- **Full State Sync:** Send complete game state every 5 seconds (baseline)
- **Delta Updates:** Send only changed entities every tick (efficient)
- **Client Prediction:** Client predicts movement locally (smooth visuals)
- **Server Reconciliation:** Client corrects prediction errors when server update arrives

**Network Protocol (WebSocket Messages):**
```typescript
// Client → Server (Commands)
type ClientMessage =
  | { type: 'SET_WAYPOINT', x: number, y: number }
  | { type: 'BUILD_STRUCTURE', planetId: number, buildingType: string }
  | { type: 'UPGRADE_BUILDING', buildingId: number };

// Server → Client (State Updates)
type ServerMessage =
  | { type: 'STATE_UPDATE', entities: EntityUpdate[] }
  | { type: 'FULL_STATE', world: WorldSnapshot }
  | { type: 'GAME_EVENT', event: GameEvent };

interface EntityUpdate {
  id: EntityID;
  position?: { x: number, y: number };
  health?: { current: number, max: number };
  // ... other changed components
}
```

### Matchmaking & Room System

**Room-Based Architecture:**
```typescript
class GameRoom {
  id: string;
  players: Player[];
  world: World; // ECS world instance
  gameLoop: NodeJS.Timeout;
  
  constructor(roomId: string) {
    this.id = roomId;
    this.players = [];
    this.world = createWorld();
  }
  
  addPlayer(player: Player) {
    if (this.players.length >= 2) throw new Error('Room full');
    this.players.push(player);
    if (this.players.length === 2) this.startGame();
  }
  
  startGame() {
    initializeGameState(this.world);
    this.gameLoop = setInterval(() => this.tick(), TICK_INTERVAL);
  }
  
  tick() {
    runAllSystems(this.world, deltaTime);
    this.broadcastState();
  }
}

const rooms = new Map<string, GameRoom>();
```

---

## Infrastructure & Deployment

### Containerization (Docker)

**Backend Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
COPY shared/ ./shared/
COPY backend/ ./backend/
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm -C shared build
RUN pnpm -C backend build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Frontend Dockerfile (Nginx):**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
COPY shared/ ./shared/
COPY frontend/ ./frontend/
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm -C frontend build

FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY infrastructure/docker/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

**docker-compose.yml (Local Development):**
```yaml
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./backend/src:/app/backend/src
      - ./shared:/app/shared
    command: pnpm dev
  
  frontend:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=ws://localhost:3000
    volumes:
      - ./frontend/src:/app/frontend/src
      - ./shared:/app/shared
    command: pnpm dev
```

### Cloud Infrastructure (Digital Ocean + Terraform)

**Terraform Configuration (`infrastructure/terraform/main.tf`):**
```hcl
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# Kubernetes Cluster
resource "digitalocean_kubernetes_cluster" "fleet_strike" {
  name    = "fleet-strike-cluster"
  region  = "nyc3"
  version = "1.28.2-do.0"

  node_pool {
    name       = "worker-pool"
    size       = "s-2vcpu-4gb"
    node_count = 3
  }
}

# Container Registry
resource "digitalocean_container_registry" "fleet_strike" {
  name                   = "fleet-strike-registry"
  subscription_tier_slug = "starter"
}

# Load Balancer
resource "digitalocean_loadbalancer" "fleet_strike" {
  name   = "fleet-strike-lb"
  region = "nyc3"

  forwarding_rule {
    entry_port     = 443
    entry_protocol = "https"
    target_port    = 80
    target_protocol = "http"
    certificate_id = digitalocean_certificate.fleet_strike.id
  }

  healthcheck {
    port     = 80
    protocol = "http"
    path     = "/health"
  }

  droplet_tag = "fleet-strike-backend"
}

# Domain & DNS
resource "digitalocean_domain" "fleet_strike" {
  name = "fleetstrike.io"
}

resource "digitalocean_record" "www" {
  domain = digitalocean_domain.fleet_strike.name
  type   = "A"
  name   = "www"
  value  = digitalocean_loadbalancer.fleet_strike.ip
}
```

**Deployment Strategy:**
- **Environments:** Development, Staging, Production
- **Blue-Green Deployment:** Zero-downtime updates
- **Autoscaling:** Scale backend pods based on player count
- **CDN:** DigitalOcean Spaces + CDN for static assets (sprites, sounds)

---

## CI/CD Pipeline (GitHub Actions)

### Test Workflow (`.github/workflows/test.yml`)

```yaml
name: Test

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run type check
        run: pnpm typecheck
      
      - name: Run unit tests
        run: pnpm test
      
      - name: Run integration tests
        run: pnpm test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Deploy Workflow (`.github/workflows/deploy-production.yml`)

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t fleet-strike-backend:${{ github.sha }} -f infrastructure/docker/Dockerfile.backend .
          docker build -t fleet-strike-frontend:${{ github.sha }} -f infrastructure/docker/Dockerfile.frontend .
      
      - name: Push to DigitalOcean Container Registry
        run: |
          echo ${{ secrets.DO_REGISTRY_TOKEN }} | docker login registry.digitalocean.com -u ${{ secrets.DO_REGISTRY_USER }} --password-stdin
          docker tag fleet-strike-backend:${{ github.sha }} registry.digitalocean.com/fleet-strike/backend:${{ github.sha }}
          docker push registry.digitalocean.com/fleet-strike/backend:${{ github.sha }}
      
      - name: Deploy to Kubernetes
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DO_TOKEN }}
      - run: |
          doctl kubernetes cluster kubeconfig save fleet-strike-cluster
          kubectl set image deployment/backend backend=registry.digitalocean.com/fleet-strike/backend:${{ github.sha }}
          kubectl rollout status deployment/backend
```

---

## Testing Strategy

### Unit Tests (Vitest)

**ECS System Tests:**
```typescript
import { describe, it, expect } from 'vitest';
import { createWorld, addEntity } from 'bitecs';
import { MovementSystem } from '../systems/movement';

describe('MovementSystem', () => {
  it('updates position based on velocity', () => {
    const world = createWorld();
    const ship = addEntity(world);
    Position.x[ship] = 0;
    Position.y[ship] = 0;
    Velocity.dx[ship] = 10;
    Velocity.dy[ship] = 5;
    
    MovementSystem(world, 1); // 1 second delta
    
    expect(Position.x[ship]).toBe(10);
    expect(Position.y[ship]).toBe(5);
  });
});
```

### Integration Tests (Playwright)

**E2E Game Flow Test:**
```typescript
import { test, expect } from '@playwright/test';

test('complete 1v1 match flow', async ({ page, context }) => {
  // Player 1 creates room
  await page.goto('http://localhost:5173');
  await page.click('button:has-text("Create Room")');
  const roomCode = await page.textContent('.room-code');
  
  // Player 2 joins room
  const page2 = await context.newPage();
  await page2.goto('http://localhost:5173');
  await page2.fill('input[name="roomCode"]', roomCode);
  await page2.click('button:has-text("Join Room")');
  
  // Wait for game start
  await expect(page.locator('.game-started')).toBeVisible({ timeout: 5000 });
  
  // Player 1 builds factory
  await page.click('.planet:first-child');
  await page.click('button:has-text("Scout Factory")');
  
  // Wait for ship to spawn
  await expect(page.locator('.ship')).toBeVisible({ timeout: 50000 });
});
```

### Regression Tests (Visual Regression)

**Rendering Consistency:**
```typescript
import { test } from '@playwright/test';

test('ship rendering matches baseline', async ({ page }) => {
  await page.goto('http://localhost:5173/test-scene');
  await page.waitForSelector('.pixi-canvas');
  
  // Wait for scene to render
  await page.waitForTimeout(2000);
  
  // Compare screenshot
  await expect(page).toHaveScreenshot('ship-rendering.png', {
    maxDiffPixels: 100
  });
});
```

---

## Performance Targets

### Client Performance

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Frame Rate | 60 FPS | 30 FPS |
| Entity Count | 300 ships | 500 ships |
| Memory Usage | < 200 MB | < 500 MB |
| Bundle Size | < 2 MB | < 5 MB |
| Initial Load | < 3 sec | < 5 sec |

### Server Performance

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Tick Rate | 60 ticks/sec | 30 ticks/sec |
| Concurrent Rooms | 100 rooms | 200 rooms |
| CPU Usage | < 50% | < 80% |
| Memory per Room | < 50 MB | < 100 MB |
| Network Latency | < 50 ms | < 100 ms |

---

## Development Workflow

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/fleet-strike-game.git
cd fleet-strike-game

# Install dependencies
pnpm install

# Start development servers (frontend + backend)
pnpm dev

# Run tests
pnpm test

# Type check
pnpm typecheck

# Build production
pnpm build
```

### Git Workflow

**Branches:**
- `main` - Production (protected)
- `develop` - Integration branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fixes
- `hotfix/*` - Production hotfixes

**Pull Request Process:**
1. Create feature branch from `develop`
2. Implement feature + tests
3. Open PR to `develop`
4. CI runs tests, type checks, linting
5. Code review + approval
6. Merge to `develop`
7. Periodic releases: `develop` → `main`

---

## Security Considerations

### Client Security

- **No Sensitive Logic:** All validation server-side
- **Input Sanitization:** Sanitize all user inputs (room names, etc.)
- **Rate Limiting:** Prevent command spam (max 10 commands/sec)

### Server Security

- **WebSocket Authentication:** JWT tokens for authenticated connections
- **Command Validation:** Validate all client commands (prevent impossible actions)
- **Anti-Cheat:** Server-authoritative simulation (client can't forge state)
- **DDoS Protection:** Rate limiting, connection limits per IP

### Infrastructure Security

- **TLS/SSL:** HTTPS + WSS (encrypted WebSocket)
- **Secrets Management:** Environment variables, not committed to repo
- **Container Security:** Non-root users, minimal base images
- **Network Policies:** Firewall rules, VPC isolation

---

## Monitoring & Observability

### Metrics to Track

**Client Metrics:**
- Frame rate (FPS)
- Memory usage
- Network latency
- Error rate

**Server Metrics:**
- Active rooms
- Player count
- CPU/Memory usage per room
- WebSocket message rate
- Error rate

**Tools:**
- **APM:** DataDog / New Relic
- **Logging:** Structured JSON logs (Winston)
- **Error Tracking:** Sentry
- **Analytics:** Custom telemetry (track unit win rates, factory usage)

---

## Future Technical Enhancements

### Phase 2+

- **WebGPU Compute Shaders:** GPU-accelerated collision detection
- **Web Workers:** Offload ECS simulation to background thread
- **WebAssembly:** Compile performance-critical systems to WASM (Rust)
- **Peer-to-Peer Networking:** WebRTC for lower latency (experimental)
- **Replay System:** Record/playback matches (delta compression)
- **Spectator Mode:** WebSocket broadcast with 5-second delay

---

## Summary: Tech Stack Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Rendering** | TypeScript, PixiJS 8, bitECS | 2D rendering + client simulation |
| **Frontend UI** | Vanilla CSS (neon aesthetic) | Menus, HUD, overlays |
| **Backend** | Node.js, Express, WebSocket | Authoritative server |
| **Shared** | TypeScript modules | ECS definitions, constants |
| **Infrastructure** | Docker, Digital Ocean, Terraform | Containerization + cloud hosting |
| **CI/CD** | GitHub Actions | Automated testing + deployment |
| **Testing** | Vitest, Playwright | Unit, integration, E2E tests |
| **Monitoring** | DataDog, Sentry | Performance + error tracking |

---

**End of Document**

*This architecture prioritizes performance, scalability, and maintainability while leveraging modern 2D web technologies (WebGPU/WebGL via PixiJS) and ECS patterns for optimal game logic.*
