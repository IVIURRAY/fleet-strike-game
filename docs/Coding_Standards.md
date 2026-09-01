# Fleet Strike - Coding Standards

## Overview

Fleet Strike follows strict coding standards to ensure maintainability, testability, and scalability. The codebase uses TypeScript with strict type checking, organized in a TurboRepo monorepo.

**Core Standards:**
- **File Size:** Maximum 200 lines per file
- **Type Safety:** Strict TypeScript, no `any` types
- **Modularity:** One concept per file
- **Testing:** Unit tests for all modules
- **Formatting:** Prettier + ESLint

---

## TypeScript Standards

### Strict Mode Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### No `any` Types

`any` types are prohibited. Use specific types or `unknown` when the type is truly unknown.

```typescript
// ✅ Correct
function processData(data: GameData): number {
  return data.value;
}

// ❌ Prohibited
function processData(data: any): number {
  return data.value;
}
```

### Explicit Return Types

All functions declare explicit return types.

```typescript
// ✅ Correct
function calculateDamage(attacker: Ship, defender: Ship): number {
  return attacker.damage - defender.armor;
}

// ❌ Prohibited (inferred type)
function calculateDamage(attacker: Ship, defender: Ship) {
  return attacker.damage - defender.armor;
}
```

### Type Aliases vs Interfaces

**Use `type` for:**
- Unions: `type ShipType = 'scout' | 'soldier' | 'heavy';`
- Primitives: `type PlayerId = 0 | 1;`
- Function signatures: `type Handler = (event: GameEvent) => void;`

**Use `interface` for:**
- Objects: `interface Ship { id: string; type: ShipType; }`
- Extensible structures (interfaces can be merged)

### Union Types Over Enums

Enums are not used. Union types with `as const` are preferred.

```typescript
// ✅ Correct
export const SHIP_TYPES = ['scout', 'soldier', 'heavy'] as const;
export type ShipType = typeof SHIP_TYPES[number];

// ❌ Prohibited (generates runtime code)
enum ShipType {
  Scout = 'scout',
  Soldier = 'soldier',
  Heavy = 'heavy'
}
```

---

## File Organization

### Maximum File Size

Every source file is limited to **200 lines** (excluding blank lines and comments). Files exceeding this limit are split into smaller modules.

### One Concept Per File

Each file has a single, well-defined responsibility.

```
packages/ecs/src/systems/
├── movement.ts      # ONLY movement updates
├── collision.ts     # ONLY collision detection
├── combat.ts        # ONLY weapon firing
└── production.ts    # ONLY factory spawning
```

### Index Files for Re-exports

Each package/folder has an `index.ts` that re-exports its public API.

```typescript
// packages/types/src/game/index.ts
export * from './ships';
export * from './player';
export * from './match';
```

### Tests Alongside Source

Test files live next to the files they test with `.test.ts` suffix.

```
packages/ecs/src/systems/
├── movement.ts
├── movement.test.ts
├── collision.ts
└── collision.test.ts
```

---

## Code Formatting

### Prettier Configuration

```.prettierrc.json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5",
  "arrowParens": "always"
}
```

### ESLint Rules

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "max-lines": ["warn", { "max": 200, "skipBlankLines": true }]
  }
}
```

### Code Style

```typescript
// ✅ Correct style
export function createShip({ type, owner, position }: CreateShipParams): Ship {
  const { x, y } = position;
  return {
    id: generateId(),
    type,
    owner,
    position: { x, y },
    hp: SHIPS[type].maxHp,
  };
}

// ❌ Incorrect style
export function createShip(params) {
  var id = generateId();
  return {
    id: id,
    type: params.type,
    owner: params.owner,
    position: { x: params.position.x, y: params.position.y },
    hp: SHIPS[params.type].maxHp
  };
}
```

**Rules:**
- Use `const` by default, `let` only when reassignment needed
- No `var` (prohibited)
- Arrow functions for callbacks
- Template literals for string concatenation
- Destructuring when accessing multiple properties
- Semicolons required

---

## Naming Conventions

### Files
- **Lowercase hyphen-separated:** `ship-factory.ts`, `collision-detection.ts`
- **Test files:** `ship-factory.test.ts`

### Variables & Functions
- **camelCase:** `shipCount`, `createShip()`, `isAlive()`
- **Boolean prefixes:** `is`, `has`, `should`, `can`
  - Examples: `isAlive`, `hasShield`, `shouldFire`, `canMove`

### Types & Interfaces
- **PascalCase:** `Ship`, `Player`, `MatchState`
- **No prefix:** `Ship` not `IShip`
- **Descriptive:** `CreateShipParams` not `Params`

### Constants
- **UPPER_SNAKE_CASE:** `MAX_SHIPS`, `WAVE_DURATION`, `BASE_HP`
- **Config objects:** `SHIPS`, `WEAPONS`, `BALANCE`

### Packages
- **@fleet-strike/[name]:** `@fleet-strike/types`, `@fleet-strike/ecs`
- **Lowercase hyphen-separated:** `@fleet-strike/ship-factory`

---

## Import/Export Conventions

### Named Exports Only

All modules use named exports. Default exports are not used.

```typescript
// ✅ Correct
export function createShip() { /* ... */ }
export interface Ship { /* ... */ }

// ❌ Prohibited
export default function createShip() { /* ... */ }
```

### Import Order

Imports are organized in three groups separated by blank lines:

```typescript
// 1. External dependencies
import { Application } from 'pixi.js';
import { createWorld } from 'bitecs';

// 2. Internal packages (monorepo)
import { Ship, Player } from '@fleet-strike/types';
import { SHIPS } from '@fleet-strike/config';

// 3. Relative imports (same package)
import { renderShip } from './renderer';
import { movementSystem } from '../systems/movement';
```

### Barrel Exports

Index files export only the public API, not everything.

```typescript
// ✅ Correct - Explicit exports
export { createShip, destroyShip } from './ship';
export { movementSystem } from './systems/movement';
export type { Ship, ShipType } from './types';

// ❌ Avoided - Too many re-exports (slow builds)
export * from './a';
export * from './b';
// ... 50 more files
```

---

## Testing Standards

### Test File Naming

- **Naming:** `[module].test.ts` (e.g., `ship.test.ts`)
- **Location:** Same folder as source file OR dedicated `tests/` folder

### Test Structure (Vitest)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, addEntity } from 'bitecs';
import { movementSystem } from './movement';
import { Position, Velocity } from '../components';

describe('movementSystem', () => {
  let world: World;

  beforeEach(() => {
    world = createWorld();
  });

  it('updates position based on velocity', () => {
    const ship = addEntity(world);
    Position.x[ship] = 0;
    Position.y[ship] = 0;
    Velocity.dx[ship] = 10;
    Velocity.dy[ship] = 5;

    movementSystem(world, 1); // 1 second delta

    expect(Position.x[ship]).toBe(10);
    expect(Position.y[ship]).toBe(5);
  });

  it('respects max speed', () => {
    const ship = addEntity(world);
    Position.x[ship] = 0;
    Velocity.dx[ship] = 1000; // Exceeds max speed
    Velocity.maxSpeed[ship] = 100;

    movementSystem(world, 1);

    expect(Velocity.dx[ship]).toBeLessThanOrEqual(100);
  });
});
```

### Coverage Goals

- **Minimum:** 70% coverage for new code
- **Critical paths:** 90%+ coverage (combat, networking, ECS systems)
- **UI components:** Snapshot tests + interaction tests

---

## Documentation Standards

### JSDoc Comments

Public APIs include JSDoc comments with examples.

```typescript
/**
 * Creates a new ship entity with the specified configuration.
 *
 * @param type - The type of ship to create (scout, soldier, heavy)
 * @param owner - The player ID (0 or 1) who owns this ship
 * @param position - The initial spawn position
 * @returns The newly created ship entity ID
 *
 * @example
 * const ship = createShip('scout', 0, { x: 100, y: 200 });
 */
export function createShip(
  type: ShipType,
  owner: PlayerId,
  position: Position
): EntityID {
  // Implementation
}
```

### README Per Package

Each package includes a README.md with:
- Installation instructions
- Usage examples
- API reference

### Inline Comments

Inline comments are used sparingly. Code is self-documenting through clear naming.

```typescript
// ✅ Good - Explains WHY
// Use spatial partitioning to avoid O(n²) collision checks
const nearbyShips = grid.query(position, radius);

// ❌ Bad - Explains WHAT (obvious from code)
// Loop through ships
for (const ship of ships) { /* ... */ }
```

---

## Performance Guidelines

### Data-Oriented Design

ECS uses Structure-of-Arrays (SoA) for cache efficiency.

```typescript
// ✅ Correct - SoA (cache-friendly)
Position.x[entity] = 100;
Position.y[entity] = 200;

// ❌ Incorrect - AoS (cache-unfriendly)
entities[i].position = { x: 100, y: 200 };
```

### Avoid Allocations in Hot Paths

```typescript
// ✅ Correct - Reuse array
const visibleShips: Ship[] = [];
function getVisibleShips(ships: Ship[]): void {
  visibleShips.length = 0;
  for (const ship of ships) {
    if (isVisible(ship)) visibleShips.push(ship);
  }
}

// ❌ Incorrect - Creates new array every frame
function getVisibleShips(ships: Ship[]): Ship[] {
  return ships.filter(s => isVisible(s)); // Allocation!
}
```

### Hardware-Accelerated CSS

UI uses hardware-accelerated properties.

```css
/* ✅ Correct - GPU-accelerated */
.element {
  transform: translateX(10px);
  opacity: 0.5;
}

/* ❌ Incorrect - CPU layout */
.element {
  left: 10px;
  display: none;
}
```

---

## Git Workflow

### Branch Naming

- **Feature:** `feature/add-sniper-unit`
- **Bugfix:** `bugfix/fix-collision-detection`
- **Hotfix:** `hotfix/patch-gold-exploit`
- **Refactor:** `refactor/split-main-ts`

### Commit Messages

Conventional Commits format is used:

```
feat(ecs): add collision detection system
fix(backend): prevent negative gold values
docs(readme): update installation instructions
refactor(renderer): split ship rendering into modules
test(ecs): add movement system tests
```

**Format:** `<type>(<scope>): <description>`

**Types:** feat, fix, docs, refactor, test, chore, style

---

## Package Dependencies

### Workspace References

Internal packages use `workspace:*` in `package.json`.

```json
{
  "dependencies": {
    "@fleet-strike/types": "workspace:*",
    "@fleet-strike/ecs": "workspace:*",
    "@fleet-strike/config": "workspace:*"
  }
}
```

### Dependency Rules

1. **Apps** depend on **packages** ✅
2. **Packages** depend on other **packages** ✅
3. **Packages** do NOT depend on **apps** ❌
4. Circular dependencies are minimized

---

## Summary

Fleet Strike's coding standards ensure:

- ✅ **Consistency** - All code follows the same patterns
- ✅ **Readability** - Clear naming and structure
- ✅ **Type Safety** - Strict TypeScript throughout
- ✅ **Testability** - Every module can be tested
- ✅ **Performance** - Data-oriented design, minimal allocations
- ✅ **Maintainability** - Small files, clear boundaries

These standards apply to all code: frontend, backend, and shared packages.

---

**See Also:**
- [Code_Structure.md](./Code_Structure.md) - Monorepo organization
- [Technical_Architecture.md](./Technical_Architecture.md) - Overall architecture
- [ECS_game_design_system.md](./ECS_game_design_system.md) - ECS details
