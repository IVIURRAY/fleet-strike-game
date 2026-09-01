# ECS Architecture Document

## Philosophy

Fleet Strike uses **Entity-Component-System (ECS)** architecture to ensure:
- **Performance:** Handle 200-300+ ships with continuous combat, movement, and state updates at 60 FPS
- **Scalability:** Easily add new unit types, buildings, and mechanics without refactoring
- **Separation of Concerns:** Simulation logic separate from rendering (PixiJS 8 with WebGPU/WebGL)
- **Data-Oriented Design:** CPU cache-friendly, batch processing, minimal object allocation
- **2D Graphics:** PixiJS 8 handles all rendering (WebGPU-accelerated sprite batching)

**Core Principles:**
- Entities are IDs (numbers, not objects)
- Components are pure data (no methods)
- Systems contain all logic (operate on component queries)
- Rendering is a separate system (not embedded in game logic)

---

## ECS Fundamentals

### Entities
- **What:** Unique identifiers (integer IDs) representing game objects
- **Registration:** Entities created via `world.createEntity()` → returns ID
- **Lifecycle:** Created → Components attached → Systems process → Destroyed
- **Examples:** Each ship, planet, building, projectile, moon, waypoint is an entity

### Components
- **What:** Data containers attached to entities via their ID
- **Structure:** Plain objects or typed data structures (TypeScript interfaces)
- **No Logic:** Components store state, never contain methods
- **Composition:** Mix-and-match components to create different entity types
- **Examples:** `Position`, `Velocity`, `Health`, `Weapon`, `Owner`

### Systems
- **What:** Functions that query entities with specific components and update them
- **Execution:** Run every frame (or at specified intervals)
- **Stateless:** Systems don't store data; they read/write components
- **Order Matters:** Systems execute in defined sequence (movement before collision, combat before death)
- **Examples:** `MovementSystem`, `CombatSystem`, `ProductionSystem`

---

## Entity Types

### Core Entities

#### 1. **Ship Entities** (~200-300 active late-game)
Represents all flyable combat units (Scouts, Soldiers, Heavies, Medics, etc.)

**Components:**
- Position, Velocity, Rotation
- Health, Armor
- Weapon, Targeting
- Owner (Player 1 or 2)
- ShipType (Scout, Heavy, etc.)
- TeamColor
- (Optional) Shield, Cloak, Abilities

**Systems that operate on ships:**
- MovementSystem, CombatSystem, TargetingSystem, HealthSystem, CollisionSystem

---

#### 2. **Projectile Entities** (~500-1000 active during major battles)
Bullets, lasers, rockets, bombs fired by ships and turrets

**Components:**
- Position, Velocity, Rotation
- ProjectileType (Bullet, Laser, Rocket, Bomb)
- Damage, ArmorPiercing
- Owner (which player/ship fired it)
- Lifetime (destroy after X seconds)
- (Optional) Homing (for rockets)

**Systems:**
- ProjectileMovementSystem, ProjectileCollisionSystem, ProjectileLifetimeSystem

---

#### 3. **Planet Entities** (7 main planets)
Major strategic locations, host buildings, can be captured

**Components:**
- Position (fixed)
- PlanetType (Capital, Gold, Crystal, Gas, Tungsten, Center, Neutral)
- Owner (Player 1, Player 2, or Neutral)
- CaptureProgress (tug-of-war value -100 to +100)
- BuildingSlots (unlimited array of building entity IDs)
- ResourceBonus (+50% gold on Gold Planet, etc.)

**Systems:**
- CapturePlanetSystem, PlanetRenderSystem

---

#### 4. **Moon Entities** (~16 total, 2-3 per planet)
Orbit planets, host defensive structures

**Components:**
- Position (dynamic, orbits parent)
- ParentPlanet (entity ID of parent)
- OrbitRadius, OrbitSpeed, OrbitAngle
- Owner (inherits from parent planet)
- BuildingSlots (array of 3 building entity IDs)

**Systems:**
- MoonOrbitSystem, MoonDefenseSystem

---

#### 5. **Building Entities** (~50-150 total late-game)
Structures on planets/moons (factories, mines, turrets)

**Components:**
- Position (relative to parent planet/moon)
- BuildingType (ScoutFactory, GoldMine, PlasmaTurret, etc.)
- Owner
- ParentPlanet/ParentMoon (entity ID)
- Health (for destructible buildings like turrets)
- ProductionTimer (for factories: counts down to next unit spawn)
- Level (upgrade level 1-3)
- (Optional) Weapon, Range (for turrets)

**Systems:**
- ProductionSystem (factories spawn ships)
- TurretCombatSystem (turrets shoot at passing ships)
- BuildingUpgradeSystem

---

#### 6. **Waypoint Entities** (1 per player in MVP, multiple in Phase 2)
Invisible markers that control fleet movement

**Components:**
- Position (target location)
- Owner (which player's waypoint)
- TargetPlanet (entity ID of planet this waypoint is set to)

**Systems:**
- WaypointSystem (ships query their owner's waypoint for destination)

---

#### 7. **Visual Effect Entities** (~100-500 during battles)
Explosions, muzzle flashes, engine trails, shield impacts (short-lived)

**Components:**
- Position
- EffectType (Explosion, MuzzleFlash, EngineTrail, ShieldHit)
- Lifetime (auto-destroy after animation completes)
- AnimationFrame (current frame in sprite sheet)
- Scale, Rotation, Color

**Systems:**
- EffectAnimationSystem, EffectLifetimeSystem

---

#### 8. **UI Entities** (persistent)
Capture progress bars, health bars, selection indicators

**Components:**
- Position (screen space or world space)
- UIType (HealthBar, CaptureBar, SelectionCircle)
- ParentEntity (which entity this UI element tracks)
- Value (current percentage for bars)

**Systems:**
- UIUpdateSystem, UIRenderSystem

---

#### 9. **Trade Lane Entities** (6 in MVP, one between each planet pair)
Visual pathways, also used for pathfinding

**Components:**
- StartPlanet, EndPlanet (entity IDs)
- PathPoints (array of positions for smooth curves)
- FleetDensity (how many ships currently on this lane, affects visual width)

**Systems:**
- TradeLaneRenderSystem

---

#### 10. **Admiral Ship Entities** (2 total, Phase 2)
Unique flagship per player

**Components:**
- Position, Velocity, Rotation
- Health (5000 HP, massive)
- Armor (Fortified)
- Weapons (multiple weapon components)
- Owner
- CommandAura (buffs nearby ships)
- Flagship (marker component indicating special status)

**Systems:**
- Same as ships, plus CommandAuraSystem

---

### Potential Future Entities (Phase 2+)

- **Drone Entities:** Tiny ships spawned by Drone Carrier
- **Debris Entities:** Wreckage from destroyed ships (visual/physics)
- **Asteroid Entities:** Harvestable resources for Miners
- **Spy Satellite Entities:** Vision providers (fog of war)
- **Comet Entities:** Periodic events (bonus resources)
- **Wormhole Entities:** Teleportation shortcuts

---

## Component Catalog

### Core Components (All Entities)

#### **Transform Components**

**Position**
```typescript
{
  x: number,
  y: number,
  z: number (optional, for depth sorting)
}
```
Used by: All entities with spatial location

**Velocity**
```typescript
{
  dx: number, // units per second
  dy: number,
  speed: number, // magnitude
  maxSpeed: number // ship-specific cap (Scout: 220, Heavy: 80)
}
```
Used by: Ships, Projectiles, Moons (orbital velocity)

**Rotation**
```typescript
{
  angle: number, // radians
  turnRate: number // radians per second (agility)
}
```
Used by: Ships, Projectiles, Turrets (aim direction)

---

#### **Identity Components**

**Owner**
```typescript
{
  playerID: number (1 or 2),
  teamColor: Color (red, blue, etc.)
}
```
Used by: Ships, Buildings, Planets, Waypoints

**EntityType**
```typescript
{
  type: string ("ship", "building", "planet", "projectile")
}
```
Used by: All entities (for efficient querying)

---

### Combat Components

**Health**
```typescript
{
  current: number,
  max: number,
  armor: ArmorType (Light, Medium, Heavy, Fortified),
  armorValue: number (damage reduction percentage)
}
```
Used by: Ships, Buildings, Admiral Ships

**Weapon**
```typescript
{
  weaponType: WeaponType (Laser, Flak, Bullet, Rocket),
  damage: number,
  rateOfFire: number, // shots per second
  range: number,
  projectileSpeed: number,
  lastFireTime: number (for rate limiting)
}
```
Used by: Ships, Turrets

**Targeting**
```typescript
{
  targetEntity: number | null, // entity ID of current target
  targetingMode: string ("nearest", "lowest-hp", "prioritize-medic"), // Phase 2
  detectionRange: number, // how far can detect enemies
  currentRange: number // distance to current target
}
```
Used by: Ships, Turrets

**Shield** (Phase 2)
```typescript
{
  current: number,
  max: number,
  regenRate: number, // HP per second
  regenDelay: number // seconds after taking damage before regen starts
}
```
Used by: Shield Ships, Admiral Ships, Shielded Buildings

---

### Movement Components

**Waypoint** (on ships, not the waypoint entity)
```typescript
{
  targetWaypointEntity: number, // entity ID of waypoint to move toward
  pathIndex: number, // which point along trade lane path
  arrived: boolean
}
```
Used by: Ships

**Orbital**
```typescript
{
  parentEntity: number, // planet entity ID
  orbitRadius: number,
  orbitSpeed: number, // radians per second
  currentAngle: number
}
```
Used by: Moons

**Homing** (for projectiles)
```typescript
{
  targetEntity: number, // entity ID to chase
  turnRate: number, // how sharply rocket can turn
  lockStrength: number // can lose lock if target too fast
}
```
Used by: Rocket Projectiles

---

### Economic Components

**Production**
```typescript
{
  unitType: ShipType (Scout, Soldier, Heavy, etc.),
  productionTime: number, // seconds (base 45, upgradeable to 35)
  currentTimer: number, // counts down from productionTime to 0
  active: boolean, // false if planet is captured by enemy
  level: number // 1-3, affects stats of produced units
}
```
Used by: Factory Buildings

**ResourceGenerator**
```typescript
{
  resourceType: "gold" | "manpower",
  amountPerSecond: number,
  level: number, // 1-4 for Gold Mines
  bonus: number // +50% on Gold Planet, etc.
}
```
Used by: Gold Mines, Manpower Centers

**ExoticResource**
```typescript
{
  resourceType: "crystal" | "gas" | "tungsten",
  unlocked: boolean // true when planet captured
}
```
Used by: Exotic Resource Planets

**Cost**
```typescript
{
  gold: number,
  manpower: number,
  crystal?: number,
  gas?: number,
  tungsten?: number
}
```
Used by: All buildable entities (ships, buildings)

---

### Capture Components

**Capturable**
```typescript
{
  captureProgress: number, // -100 to +100 (negative = P1, positive = P2)
  captureThreshold: number, // 100 for planets
  captureRadius: number, // 500 units
  currentOwner: number, // 0 = neutral, 1 = P1, 2 = P2
  previousOwner: number // for capture event tracking
}
```
Used by: Planets

**CaptureGenerator** (on ships near planets)
```typescript
{
  captureRate: number, // 1 for most ships, 2 for Engineers
  targetPlanetEntity: number | null // which planet currently near
}
```
Used by: Ships (when within capture radius of planet)

---

### Rendering Components (Data Only, Logic in Render System)

**Sprite**
```typescript
{
  textureName: string, // "scout_ship", "heavy_gunship"
  scale: number,
  tint: Color, // team color applied
  opacity: number, // 0-1 (for cloaking effects)
  depth: number // Z-sorting layer
}
```
Used by: Ships, Buildings, Planets, Moons

**ParticleEmitter**
```typescript
{
  emitterType: "engine_trail" | "weapon_fire" | "repair_beam",
  active: boolean,
  emitRate: number, // particles per second
  particleLifetime: number,
  color: Color
}
```
Used by: Ships (engines), Weapons (muzzle flash), Medics (repair beam)

**Animation**
```typescript
{
  animationName: string,
  currentFrame: number,
  frameRate: number, // frames per second
  loop: boolean
}
```
Used by: Explosions, Buildings (construction animation), Shields (impact flash)

---

### Special Mechanics Components

**Lifetime**
```typescript
{
  remainingTime: number, // seconds until auto-destroy
  destroyOnExpire: boolean
}
```
Used by: Projectiles, Visual Effects, Temporary Buffs

**Buff/Debuff** (Phase 2)
```typescript
{
  buffType: "damage_increase" | "speed_boost" | "slow" | "stun",
  magnitude: number, // +20% damage, -50% speed, etc.
  duration: number, // seconds remaining
  source: number // entity ID that applied this buff
}
```
Used by: Ships (affected by Admiral auras, Research Lab bonuses)

**CommandAura** (Phase 2)
```typescript
{
  auraType: "damage_boost" | "hp_boost" | "speed_boost",
  radius: number,
  magnitude: number, // +15% damage, +10% HP
  affectedEntities: number[] // cache of entities currently in range
}
```
Used by: Admiral Ships, Research Labs

**Cloak** (Phase 2)
```typescript
{
  cloaked: boolean,
  cloakEnergy: number, // 0-100, drains over time
  rechargeRate: number,
  detectionImmune: boolean // false = radar can still see you
}
```
Used by: Spy Ships, Stealth Carrier Admiral

**BuildQueue** (on planets)
```typescript
{
  queue: Array<{ buildingType, progress, totalTime }>,
  currentlyBuilding: { buildingType, progress, totalTime } | null
}
```
Used by: Planets (construction queue)

---

## System Catalog

### Core Systems (Execute Every Frame)

#### **MovementSystem**
**Priority:** 1 (runs first)  
**Queries:** Entities with `Position`, `Velocity`  
**Logic:**
- Update position based on velocity: `position.x += velocity.dx * deltaTime`
- Apply max speed caps
- Handle deceleration/acceleration curves (optional smoothing)
- Ships auto-orient toward movement direction

**Performance Notes:**
- Most expensive system (200+ ships moving)
- Optimize with SIMD batch processing
- Use spatial hashing for broad-phase queries

---

#### **WaypointNavigationSystem**
**Priority:** 2 (after movement, before pathfinding)  
**Queries:** Entities with `Position`, `Velocity`, `Waypoint`  
**Logic:**
- Query owner's waypoint entity for target position
- Calculate direction vector toward waypoint
- Set velocity toward waypoint (magnitude = ship's maxSpeed)
- Follow trade lane path points (not direct line)
- Slow down when approaching destination (arrival smoothing)

**Performance Notes:**
- Only updates ships not in combat (idle ships)
- Can run at reduced frequency (30 FPS instead of 60)

---

#### **TargetingSystem**
**Priority:** 3  
**Queries:** Entities with `Position`, `Targeting`, `Weapon`, `Owner`  
**Logic:**
- Scan for enemies within detection range (spatial query)
- Filter by team (don't target friendlies)
- Select target based on targeting mode:
  - MVP: Nearest enemy
  - Phase 2: Prioritize Medics, lowest HP, etc.
- Store target entity ID in `Targeting.targetEntity`
- Clear target if out of range or destroyed

**Performance Notes:**
- Use spatial partitioning (grid or quadtree) to avoid O(n²) checks
- Only retarget every 0.5 seconds (not every frame)

---

#### **CombatSystem**
**Priority:** 4 (after targeting)  
**Queries:** Entities with `Weapon`, `Targeting`, `Owner`, `Position`  
**Logic:**
- Check if target is valid and in range
- Check if rate-of-fire cooldown expired
- Fire projectile: Create projectile entity with appropriate components
- Update `lastFireTime`
- Apply weapon-specific logic (lasers instant hit, bullets spawn projectile)

**Performance Notes:**
- Spawns many projectile entities (500-1000)
- Use entity pooling (reuse destroyed projectiles instead of allocating new)

---

#### **ProjectileMovementSystem**
**Priority:** 5  
**Queries:** Entities with `Position`, `Velocity`, `EntityType: "projectile"`  
**Logic:**
- Update projectile position (similar to MovementSystem)
- For homing projectiles: Adjust velocity toward target
- Update rotation to match velocity direction

---

#### **ProjectileCollisionSystem**
**Priority:** 6 (after projectile movement)  
**Queries:** Projectiles and potential targets (Ships, Buildings)  
**Logic:**
- Spatial query: Which ships/buildings are near this projectile?
- Check distance < hitbox radius
- On collision:
  - Apply damage to target's Health component
  - Apply weapon vs armor effectiveness modifier
  - Destroy projectile entity
  - Spawn hit effect entity (explosion, shield impact, etc.)

**Performance Notes:**
- Most complex system (many collision checks)
- Use spatial partitioning (critical for performance)
- Broad phase (grid) → Narrow phase (circle collision)
- Can optimize with ray-casting for fast projectiles

---

#### **HealthSystem**
**Priority:** 7 (after damage applied)  
**Queries:** Entities with `Health`  
**Logic:**
- Check if `health.current <= 0`
- If dead:
  - Destroy entity
  - Spawn explosion effect
  - Award kill credit (resource refund, stats tracking)
  - Remove from all system caches
- Apply armor damage reduction to incoming damage
- (Phase 2) Handle catastrophic ammo explosion chance at low HP

**Performance Notes:**
- Death events can cascade (explosion damages nearby ships)
- Use event queue to defer destruction until end of frame

---

#### **MoonOrbitSystem**
**Priority:** 8  
**Queries:** Entities with `Orbital`, `Position`  
**Logic:**
- Update `currentAngle += orbitSpeed * deltaTime`
- Calculate new position: 
  ```
  x = parentPlanet.x + cos(currentAngle) * orbitRadius
  y = parentPlanet.y + sin(currentAngle) * orbitRadius
  ```
- Update moon's rotation to face planet (optional visual detail)

**Performance Notes:**
- Only 16 moons, very cheap
- Can run at reduced frequency (30 FPS)

---

#### **TurretCombatSystem**
**Priority:** 9  
**Queries:** Buildings with `Weapon`, `Targeting`, `Position`, `Owner`  
**Logic:**
- Similar to CombatSystem, but stationary
- Calculate firing arc (turrets don't shoot 360°, only front hemisphere)
- Moon's orbital position affects what turret can hit
- Apply turret weapon types (Plasma, Flak, Laser)

**Performance Notes:**
- ~10-30 turrets active mid-late game
- Less expensive than ship combat

---

### Economic Systems (Execute at Intervals, Not Every Frame)

#### **ProductionSystem**
**Priority:** 10  
**Frequency:** Every 1 second (not per-frame)  
**Queries:** Buildings with `Production`, `Owner`, `Position`  
**Logic:**
- Decrement `currentTimer -= deltaTime`
- If `currentTimer <= 0`:
  - Check if owner has enough resources (gold, manpower, exotics)
  - Deduct resource cost
  - Spawn ship entity at planet position
  - Add all appropriate components (Position, Velocity, Health, Weapon, etc.)
  - Apply factory level bonuses (+HP, +damage)
  - Reset `currentTimer = productionTime`

**Performance Notes:**
- Only runs once per second
- Spawns 30-40 ships per minute late-game
- Use entity templates/blueprints to avoid repeating component setup

---

#### **ResourceGenerationSystem**
**Priority:** 11  
**Frequency:** Every 1 second  
**Queries:** Buildings with `ResourceGenerator`, `Owner`  
**Logic:**
- Add `amountPerSecond` to player's resource pool
- Apply bonuses (Gold Planet +50%, Research Lab discounts)
- Handle manpower cap (can't exceed max)

**Performance Notes:**
- Very cheap (10-20 buildings)
- Could run every 0.1 seconds for smoother UI updates

---

#### **CapturePlanetSystem**
**Priority:** 12  
**Frequency:** Every 1 second  
**Queries:** Planets with `Capturable`, Ships with `CaptureGenerator`  
**Logic:**
- For each planet:
  - Spatial query: Which ships are within captureRadius (500 units)?
  - Count P1 ships vs P2 ships
  - Apply capture rates (Engineers = 2x)
  - Net capture points = (P1 total) - (P2 total)
  - Update `captureProgress += netPoints * deltaTime`
- If `captureProgress >= captureThreshold` or `<= -captureThreshold`:
  - Change planet owner
  - Transfer all buildings to new owner
  - Trigger capture event (UI notification, visual effects)

**Performance Notes:**
- Only 7 planets, cheap
- Spatial query can be cached (ships don't teleport)

---

### UI & Feedback Systems (Lower Priority)

#### **UIUpdateSystem**
**Priority:** 13  
**Frequency:** Every frame (for smooth UI)  
**Queries:** UI entities with `ParentEntity`, `Value`  
**Logic:**
- Query parent entity's component (e.g., ship's Health)
- Update UI element value (health bar percentage)
- Update position to follow parent entity (screen space conversion)

---

#### **EffectAnimationSystem**
**Priority:** 14  
**Queries:** Visual effects with `Animation`, `Lifetime`  
**Logic:**
- Advance animation frame based on frameRate
- Decrement lifetime
- Destroy when animation complete

---

#### **EffectLifetimeSystem**
**Priority:** 15  
**Queries:** Entities with `Lifetime`  
**Logic:**
- Decrement `remainingTime -= deltaTime`
- If `remainingTime <= 0`, destroy entity

---

### Rendering System (Separate from Simulation)

#### **RenderSystem**
**Priority:** Last (after all simulation logic)  
**Frequency:** Every frame (60 FPS)  
**Queries:** All entities with `Position`, `Sprite` (or `ParticleEmitter`, `Animation`)  
**Logic:**
- **Spatial culling:** Only render entities visible on screen
- **Z-sorting:** Sort entities by depth (background → foreground)
- **PixiJS Integration:** Update PixiJS sprites based on ECS component data
- **Transform:** Convert world space to screen space based on camera
- **Apply visual effects:** Team color tints, opacity for cloaking, damage flashes
- **Render particles:** Engine trails, weapon fire, explosions

**Performance Notes:**
- **Critical for frame rate**
- Use PixiJS 8 sprite batching with WebGPU/WebGL renderer
- Automatic renderer selection: WebGPU → WebGL2 → WebGL → Canvas2D
- Frustum culling (don't render off-screen entities)
- LOD (Level of Detail): Distant ships = simpler sprites

**PixiJS 8 Integration:**
```typescript
// RenderSystem reads ECS data and updates PixiJS display objects
const renderSystem = (world: World) => {
  const entities = renderQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    
    // Get or create PixiJS sprite for this entity
    const sprite = getSpriteForEntity(eid);
    
    // Update sprite from ECS components
    sprite.x = Position.x[eid];
    sprite.y = Position.y[eid];
    sprite.rotation = Rotation.angle[eid];
    sprite.tint = TeamColor.color[eid];
    sprite.alpha = Sprite.opacity[eid];
    
    // Add to PixiJS stage if not already added
    if (!sprite.parent) {
      pixiApp.stage.addChild(sprite);
    }
  }
};
```

---

### Phase 2+ Systems (Not in MVP)

#### **CommandAuraSystem**
**Queries:** Entities with `CommandAura`, Ships in radius  
**Logic:** Apply buffs to nearby friendly ships

#### **CloakingSystem**
**Queries:** Entities with `Cloak`  
**Logic:** Drain cloak energy, apply detection resistance

#### **AbilitySystem**
**Queries:** Entities with `Ability`, cooldown tracking  
**Logic:** Trigger special abilities (shield burst, EMP, repair pulse)

#### **FormationSystem**
**Queries:** Ships with `FormationSlot`  
**Logic:** Maintain formation positions (hangar chess board)

#### **FogOfWarSystem**
**Queries:** All entities, vision providers (ships, radar)  
**Logic:** Determine which entities are visible to which player

#### **DamageAreaSystem**
**Queries:** Explosions, area effects  
**Logic:** Apply damage to all entities in radius (bombs, flak)

#### **RepairSystem** (might be in MVP for Medics)
**Queries:** Medics with `RepairBeam`, nearby damaged ships  
**Logic:** Heal ships over time

---

## System Execution Order (Per Frame)

```
1.  MovementSystem               (update positions)
2.  WaypointNavigationSystem     (steer toward destination)
3.  MoonOrbitSystem              (update moon positions)
4.  TargetingSystem              (find enemies)
5.  CombatSystem                 (fire weapons)
6.  TurretCombatSystem           (turrets fire)
7.  ProjectileMovementSystem     (update projectiles)
8.  ProjectileCollisionSystem    (detect hits)
9.  HealthSystem                 (apply damage, check death)
10. EffectLifetimeSystem         (destroy expired effects)
11. EffectAnimationSystem        (advance animations)
12. UIUpdateSystem               (update health bars, etc.)
13. RenderSystem                 (draw everything)

--- Every 1 second ---
14. ProductionSystem             (spawn ships from factories)
15. ResourceGenerationSystem     (add gold/manpower)
16. CapturePlanetSystem          (tug-of-war logic)
```

---

## Performance Optimization Strategies

### 1. Spatial Partitioning
**Problem:** Collision detection, targeting, and capture queries are O(n²)  
**Solution:** Divide space into grid cells or quadtree

```typescript
// Example: Grid-based spatial partitioning
const CELL_SIZE = 200; // units
const grid = new Map<string, Set<EntityID>>();

// Insert entities into grid
function updateGrid(entity) {
  const cellX = Math.floor(entity.position.x / CELL_SIZE);
  const cellY = Math.floor(entity.position.y / CELL_SIZE);
  const cellKey = `${cellX},${cellY}`;
  grid.get(cellKey).add(entity.id);
}

// Query nearby entities (only check same cell + adjacent cells)
function queryNearby(position, radius) {
  const cells = getAdjacentCells(position);
  return cells.flatMap(cell => Array.from(grid.get(cell)));
}
```

**Impact:** Reduces targeting system from O(n²) to O(n)

---

### 2. Component Arrays (Structure of Arrays)
**Problem:** JavaScript objects are cache-unfriendly  
**Solution:** Store components as parallel arrays

```typescript
// Bad: Array of Objects (AoS)
const entities = [
  { id: 1, x: 100, y: 200, hp: 50 },
  { id: 2, x: 150, y: 250, hp: 30 },
];

// Good: Structure of Arrays (SoA)
const positions = { x: [100, 150], y: [200, 250] };
const health = { current: [50, 30] };
```

**Impact:** CPU cache can load many positions at once, 2-3x faster iteration

---

### 3. Entity Pooling
**Problem:** Creating/destroying 1000s of projectiles per second causes GC pauses  
**Solution:** Reuse dead entities instead of allocating new

```typescript
const projectilePool = [];

function createProjectile() {
  return projectilePool.pop() || world.createEntity();
}

function destroyProjectile(entity) {
  // Don't actually destroy, just deactivate
  entity.active = false;
  projectilePool.push(entity);
}
```

**Impact:** Eliminates garbage collection spikes, smooth 60 FPS

---

### 4. System Scheduling (Variable Update Rates)
**Problem:** Not all systems need 60 FPS updates  
**Solution:** Run expensive systems at lower frequencies

```typescript
// Every frame (60 FPS)
- MovementSystem
- CombatSystem
- RenderSystem

// Every 0.5 seconds (2 FPS)
- TargetingSystem (retargeting doesn't need to be instant)

// Every 1 second (1 FPS)
- ProductionSystem
- ResourceGenerationSystem
- CapturePlanetSystem
```

**Impact:** 20-30% CPU reduction with no gameplay impact

---

### 5. Query Caching
**Problem:** Repeatedly querying same component combinations  
**Solution:** Cache query results, only update when entities added/removed

```typescript
// Bad: Query every frame
function combatSystem() {
  const combatants = world.query(["Position", "Weapon", "Targeting"]);
  combatants.forEach(processCombat);
}

// Good: Cache query
const combatants = world.query(["Position", "Weapon", "Targeting"]);
world.on("entityChanged", () => combatants.refresh());

function combatSystem() {
  combatants.forEach(processCombat); // No query overhead
}
```

**Impact:** 5-10% reduction in query overhead

---

### 6. Broad Phase Culling
**Problem:** Render system processes 300 ships, but only 50 on screen  
**Solution:** Cull off-screen entities before rendering

```typescript
function renderSystem(camera) {
  const visible = entities.filter(e => 
    isInViewport(e.position, camera) || 
    isCloseToViewport(e.position, camera, MARGIN)
  );
  visible.forEach(render);
}
```

**Impact:** 50-80% reduction in draw calls

---

### 7. Separate Simulation and Render Threads (Future: Web Workers)
**Problem:** Rendering blocks simulation, causes frame drops  
**Solution:** Run simulation in Web Worker, send state to main thread for rendering

```typescript
// worker.js (simulation thread)
function tick() {
  runAllSystems();
  postMessage(serializeGameState());
}

// main.js (render thread)
worker.onmessage = (state) => {
  renderSystem.render(state);
};
```

**Impact:** Can maintain 60 FPS simulation even if rendering drops to 30 FPS

---

## Selected ECS Library: bitECS

**Chosen Library:** [bitECS](https://github.com/NateTheGreatt/bitECS)

**Why bitECS:**
- ✅ **Performance:** Structure-of-Arrays (SoA) architecture, cache-friendly
- ✅ **Bundle Size:** 1KB minified (critical for web game)
- ✅ **TypeScript:** Full TypeScript support
- ✅ **Battle-Tested:** Used in production games (Hyperfy, Webaverse)
- ✅ **Simple API:** Low learning curve, clear documentation
- ✅ **No Magic:** Explicit, predictable, no hidden allocations

**Example Usage:**
```typescript
import { createWorld, defineComponent, addEntity, Types } from "bitecs";

// Define components
const Position = defineComponent({ x: Types.f32, y: Types.f32 });
const Velocity = defineComponent({ dx: Types.f32, dy: Types.f32 });

// Create world
const world = createWorld();

// Create entity
const entity = addEntity(world);
Position.x[entity] = 100;
Position.y[entity] = 200;
Velocity.dx[entity] = 10;
Velocity.dy[entity] = 0;

// Create system
const movementSystem = (world, deltaTime) => {
  const query = defineQuery([Position, Velocity]);
  const entities = query(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    Position.x[eid] += Velocity.dx[eid] * deltaTime;
    Position.y[eid] += Velocity.dy[eid] * deltaTime;
  }
};
```

---

## Example: Creating a Scout Ship Entity

```typescript
function createScoutShip(world, owner, position) {
  const entity = world.createEntity();
  
  // Core components
  world.addComponent(entity, Position, { 
    x: position.x, 
    y: position.y, 
    z: 0 
  });
  
  world.addComponent(entity, Velocity, { 
    dx: 0, 
    dy: 0, 
    speed: 0, 
    maxSpeed: 220 
  });
  
  world.addComponent(entity, Rotation, { 
    angle: 0, 
    turnRate: 45 * DEG_TO_RAD 
  });
  
  // Identity
  world.addComponent(entity, Owner, { 
    playerID: owner, 
    teamColor: owner === 1 ? BLUE : RED 
  });
  
  world.addComponent(entity, ShipType, { 
    type: "scout" 
  });
  
  // Combat
  world.addComponent(entity, Health, { 
    current: 80, 
    max: 80, 
    armor: ArmorType.Light, 
    armorValue: 5 
  });
  
  world.addComponent(entity, Weapon, { 
    weaponType: WeaponType.SmallBullet, 
    damage: 8, 
    rateOfFire: 2, 
    range: 400, 
    projectileSpeed: 200, 
    lastFireTime: 0 
  });
  
  world.addComponent(entity, Targeting, { 
    targetEntity: null, 
    targetingMode: "nearest", 
    detectionRange: 450, 
    currentRange: Infinity 
  });
  
  // Movement
  world.addComponent(entity, Waypoint, { 
    targetWaypointEntity: getPlayerWaypoint(owner), 
    pathIndex: 0, 
    arrived: false 
  });
  
  // Rendering
  world.addComponent(entity, Sprite, { 
    textureName: "scout_ship", 
    scale: 1.0, 
    tint: owner === 1 ? BLUE : RED, 
    opacity: 1.0, 
    depth: 10 
  });
  
  world.addComponent(entity, ParticleEmitter, { 
    emitterType: "engine_trail", 
    active: true, 
    emitRate: 5, 
    particleLifetime: 1.0, 
    color: owner === 1 ? BLUE : RED 
  });
  
  // Capture
  world.addComponent(entity, CaptureGenerator, { 
    captureRate: 1, 
    targetPlanetEntity: null 
  });
  
  return entity;
}
```

---

## Data Flow Example (One Frame)

**Scenario:** Scout ship fires at enemy Heavy, bullet hits

```
1. Frame Start (t = 0.0166s)

2. MovementSystem
   - Scout moves toward waypoint
   - Heavy moves toward waypoint
   - They approach each other on trade lane

3. TargetingSystem
   - Scout detects Heavy (within 450 unit range)
   - Sets Scout.targeting.targetEntity = Heavy.id
   - Heavy detects Scout
   - Sets Heavy.targeting.targetEntity = Scout.id

4. CombatSystem
   - Scout checks: target in range (400 units)? Yes
   - Scout checks: rate of fire cooldown expired? Yes
   - Scout fires: Create projectile entity
     - Position: Scout.position
     - Velocity: toward Heavy at 200 u/s
     - Damage: 8
     - Owner: Player 1
   - Scout.weapon.lastFireTime = currentTime

5. ProjectileMovementSystem
   - Bullet moves toward Heavy (200 units/sec * 0.0166 = 3.3 units)

6. ProjectileCollisionSystem
   - Check distance: bullet to Heavy
   - Distance < hitbox radius (5 units)? Yes → HIT
   - Apply damage: 8 damage to Heavy
   - Check armor: Heavy has Heavy Armor (30% reduction)
   - Actual damage: 8 * 0.7 = 5.6 damage
   - Heavy.health.current -= 5.6
   - Destroy bullet entity
   - Spawn "bullet_impact" effect at Heavy position

7. HealthSystem
   - Check Heavy.health.current > 0? Yes (594.4 HP remaining)
   - Heavy survives

8. EffectAnimationSystem
   - Advance "bullet_impact" animation frame

9. RenderSystem
   - Draw Scout at new position
   - Draw Heavy at new position
   - Draw bullet impact effect
   - Draw engine trails
   - Draw health bars

10. Frame End
```

**Next Frame:** Repeat, Heavy fires back at Scout

---

## Debugging & Tools

### Component Inspector
Visualize entity components in real-time

```typescript
function inspectEntity(entityID) {
  console.log(`Entity ${entityID}:`);
  world.getComponents(entityID).forEach(component => {
    console.log(`  ${component.name}:`, component.data);
  });
}
```

### System Performance Profiler
Track which systems are slowest

```typescript
function profileSystem(system) {
  const start = performance.now();
  system.execute();
  const duration = performance.now() - start;
  console.log(`${system.name}: ${duration.toFixed(2)}ms`);
}
```

### Entity Count Monitor
Track entity lifecycle

```typescript
setInterval(() => {
  console.log(`Entities: ${world.entityCount}`);
  console.log(`Ships: ${world.query(["ShipType"]).length}`);
  console.log(`Projectiles: ${world.query(["ProjectileType"]).length}`);
}, 1000);
```

---

## Future Optimizations (Phase 3+)

### 1. WebGPU Compute Shaders
Run systems on GPU (massively parallel)
- Movement, collision, targeting all run on GPU
- 10-100x faster for large entity counts

### 2. Rust Backend (WASM)
Compile simulation to WebAssembly
- 2-5x faster than JavaScript
- Predictable performance

### 3. Network Replication
For multiplayer, send only component deltas
- Reduce bandwidth by 90%
- Deterministic simulation ensures both clients stay in sync

---

## Summary

**ECS Architecture Benefits for Fleet Strike:**
- ✅ Handle 300+ ships + 1000 projectiles at 60 FPS
- ✅ Easy to add new units (just new component combinations)
- ✅ Clean separation: Simulation (ECS) vs Rendering (PixiJS/WebGPU)
- ✅ Optimizable (SoA, spatial partitioning, entity pooling)
- ✅ Scalable (add systems without refactoring existing code)

**Recommended Starting Point:**
1. Use **bitECS** or **Miniplex** library
2. Implement core systems first: Movement, Combat, Health
3. Add rendering system (PixiJS) that reads component data
4. Profile early and often (identify bottlenecks)
5. Optimize hot paths (targeting, collision) with spatial partitioning

**Philosophy:**
- Components = Data (no logic)
- Systems = Logic (no state)
- Entities = IDs (not objects)
- Rendering = Separate concern

This architecture will scale from MVP (50 ships) to Phase 5 (500+ ships, advanced features, multiplayer) without major rewrites.

---

**End of Document**

*This ECS design prioritizes performance and scalability from day one, ensuring Fleet Strike can handle epic late-game battles with hundreds of ships without frame drops.*
