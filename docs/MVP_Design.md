# Fleet Strike - MVP Design Document

## Core Vision

A real-time strategy auto-battler where players build galactic empires, manage economies, and command fleets in a tug-of-war across a linear galaxy map. Players construct specialized factories on captured planets to spawn waves of ships that automatically engage enemies, while managing waypoints to control fleet positioning and timing.

**Target Match Duration:** 20 minutes  
**Player Count:** 1v1

---

## Game Flow

### Starting Conditions

**Map Layout:**
```
[Home A] - [Gold Planet] - [Crystal Planet] - [Neutral Center] - [Gas Planet] - [Tungsten Planet] - [Home B]
```

**Each Player Starts With:**
- 1 Home Planet (controlled)
- 165 Gold
- 5 Gold/second income
- Starting army: 5 Scouts + 3 Soldiers
- 1 Waypoint (initially set to first neutral planet for auto-expansion)

### Core Loop

1. **Build Economy:** Construct factories and economic buildings on controlled planets
2. **Produce Ships:** Factories automatically spawn units every 45 seconds
3. **Position Fleet:** Set waypoints to control where your fleet moves and engages
4. **Capture Planets:** Units near planets generate capture points; control shifts based on presence
5. **Unlock Resources:** Captured planets provide exotic resources to unlock advanced units
6. **Scale Up:** Build more factories, upgrade production, field hundreds of ships
7. **Win:** Control all 7 main planets

---

## Map & Planets

### Planet System

**7 Main Planets in Linear Chain:**
- 2 Home Planets (one per player)
- 5 Neutral Planets (each with unique resource)

**Each Planet Has:**
- Unlimited building slots (to support hundreds of ships by endgame)
- Orbiting moons (2-3 per planet)
- Resource generation based on buildings constructed

**Planet Buildings:**
- **Factories:** Produce specific unit types (Scout Factory, Soldier Factory, etc.)
- **Economic Buildings:** Gold mines, manpower centers, population growth
- **Defensive Structures:** Turrets (though moons are better for defense)

### Moon System

**Each Moon Has:**
- 3 building slots
- Orbital movement around parent planet

**Moon Buildings (Defensive Focus):**
- **Turrets:** Deal damage to passing enemy fleets
- **Shield Generators:** Protect nearby units/planets
- **Radar/Satellites:** Vision and detection

### Planet Capture Mechanics

**Tug-of-War System:**
- Any unit near a planet generates capture points through proximity
- Planet ownership shifts to the side with more capture points
- No special capture units required (all units contribute)
- When captured, existing enemy units keep fighting but lose reinforcements

**Win Condition:** Control all 7 main planets

---

## Resources & Economy

### Core Resources

**Gold (Primary Currency)**
- Starting amount: 165
- Base income: 5 gold/second from home planet
- Income increases: +X gold/second per controlled planet (based on buildings)
- Used for: Most unit production and buildings

**Manpower (Population)**
- Limits: How many pilots you have available
- Growth: Build population centers, schools, food production on planets
- Usage: Required alongside gold to produce units
- Endgame feature: Can be depleted, forcing economic investment

**Exotic Resources (Unlock Special Units):**
- **Crystals** (from Crystal Planet): Unlock shield-based units
- **Gas** (from Gas Planet): Unlock explosive/heavy damage units  
- **Tungsten** (from Tungsten Planet): Unlock armor-piercing units

### Resource Generation

- **Continuous trickle:** X gold/second based on planet buildings
- **No discrete wave intervals:** Resources flow constantly
- **Building-dependent:** What you construct determines generation rates

---

## Fleet Control & Combat

### Waypoint System (MVP)

**Single Waypoint per Player:**
- Click anywhere on the map to set your fleet's rally point
- All units move toward and loiter around the waypoint
- Units engage enemies automatically when in range
- Default waypoint: First neutral planet (auto-expansion)

**Unit Behavior at Waypoint:**
- Continue moving, spinning, flying around the point
- Engage enemies if they come near
- Maintain cohesion around the marker

**Strategic Use:**
- Pull back to gather forces before a big push
- Position fleet between planets for defensive play
- Push aggressively toward enemy territory

### Combat Mechanics

**Automatic Engagement:**
- Units attack nearest enemy target
- No manual targeting or abilities (MVP scope)
- Ships maneuver and fight autonomously

**Targeting Priority:**
- Nearest enemy (simple, no complex priorities in MVP)
- Phase 2: Built-in unit priorities (scouts target miners, snipers target medics, etc.)

### Factory Production

**One Building Type = One Unit Type:**
- Scout Factory → produces Scouts every 45 seconds
- Soldier Factory → produces Soldiers every 45 seconds
- Heavy Factory → produces Heavies every 45 seconds
- Etc.

**Production Behavior:**
- Starts immediately after construction
- Produces continuously (every 45 seconds)
- Units spawn and immediately head to waypoint
- Optional pause button (but rarely useful)

**Scaling Production:**
- **Build more factories:** More unit diversity, more production slots
- **Upgrade factories:** Faster spawn rate, better unit stats
- **Both strategies viable:** Invest in economy your way

---

## Unit Design (MVP Roster)

### Core 5-7 Units (MVP Scope)

Based on TF2 archetypes, prioritize these for initial implementation:

1. **Scout:** Fast, weak, cheap swarmable fighter
2. **Soldier:** Basic fighter with balanced rockets + guns
3. **Heavy:** Slow tank with high HP and big guns
4. **Medic:** Healer ship that repairs nearby craft
5. **Engineer:** Can build structures on captured planets (or just captures faster?)
6. **Demo/Pyro:** AoE damage specialist (bomber or flamethrower)
7. **Sniper:** Long-range laser, weak but powerful

**Phase 2 Units:** Spy (stealth), Shield ships, Miner ships, drone swarms, ramming ships

### Unit Stats Framework

**Combat Stats:**
- Weapon Type (Laser/Flak/Bullets/Rockets)
- Rate of Fire
- Projectile Speed
- Damage per Shot
- Range

**Defensive Stats:**
- Armor Type (Light/Medium/Heavy/Fortified)
- Hit Points
- Speed (min/max movement)
- Turn Radius
- Maneuverability

**Economic Stats:**
- Gold Cost
- Manpower Cost
- Build Time (factory spawn rate: 45 seconds default)

**Balance Placeholder:** "Sensible defaults, needs extensive playtesting"

### Weapon & Armor System (Phase 2 Complexity)

**Weapon Types:**
- **Laser:** Speed of light, straight line, effective vs shields, long range
- **Flak:** Shotgun spread, anti-swarm, can explode
- **Bullets:** Slow projectiles, cheap, armor-piercing variants
- **Rockets:** Slow tracking missiles, can be dodged/shot down

**Armor Types:**
- **Light:** Fast units, minimal protection
- **Medium:** Balanced
- **Heavy:** Slow, high mitigation
- **Fortified:** Structures and capital ships

**Visual Language:**
- Different bullet colors and shapes
- Recognizable ship silhouettes
- Clear visual feedback on damage types

---

## User Interface & Controls

### Essential MVP UI

**Main View:**
- 2D side-scrolling galaxy view (left to right)
- Zoom: Basic zoom in/out (logarithmic scaling is Phase 2)
- Click planets to view/build
- Click map to set waypoint

**Planet Management Screen:**
- Click planet → see building slots
- Build factories, economic buildings, defenses
- Upgrade existing buildings

**Moon Management Screen:**
- Click moon → see 3 building slots
- Build turrets, shields, radar

**Resource Display (Top HUD):**
- Gold: XXX (+X/sec)
- Manpower: XXX/XXX
- Exotic Resources: Crystal/Gas/Tungsten icons (locked/unlocked)

**Minimap:**
- Show all 7 planets
- Ownership colors
- Fleet positions
- Waypoint marker

### Controls Summary

- **Left Click:** Select planets/moons, place waypoint
- **Right Click:** (Reserved for Phase 2 targeting)
- **Mouse Wheel:** Zoom in/out
- **Drag:** Pan camera
- **Keyboard:** (Reserved for hotkeys in Phase 2)

---

## Technical Architecture

### ECS (Entity Component System)

**Why ECS:**
- Performance: Handle hundreds of ships simultaneously
- Scalability: Easy to add new components/systems
- Maintainability: Clean separation of data and behavior

**Core Entities:**
- Ships (Scouts, Soldiers, Heavies, etc.)
- Planets
- Moons
- Projectiles
- Buildings

**Core Components:**
- Transform (position, rotation, scale)
- Movement (velocity, target waypoint)
- Combat (weapon stats, health, armor)
- Production (factory type, spawn timer)
- Ownership (player ID, team color)

**Core Systems:**
- MovementSystem (pathfinding, waypoint following)
- CombatSystem (targeting, firing, damage calculation)
- ProductionSystem (factory spawning)
- CaptureSystem (planet control point tracking)
- RenderSystem (PixiJS integration)

### Technology Stack

- **Engine:** TypeScript + PixiJS (2D rendering)
- **Architecture:** ECS pattern
- **Networking:** WebSocket (1v1 multiplayer)
- **State Management:** Data-driven ship definitions (JSON/TypeScript configs)

---

## Balance & Tuning Placeholders

These require extensive playtesting and will be defined in a separate balance spreadsheet:

- Unit costs (gold + manpower)
- Unit stats (HP, damage, speed, range)
- Factory build costs
- Factory spawn rates (45 seconds baseline, but varies by upgrade)
- Resource generation rates
- Planet capture point accumulation rates
- Building upgrade costs and effects
- Exotic resource unlock thresholds

**Guiding Principle:** "10 scouts for every 1 heavy" - cost scaling rewards tactical diversity

---

## Out of Scope for MVP

These features are explicitly Phase 2 or later:

### Phase 2 Features
- Formation chess board / hangar staging area
- Multiple waypoints / split forces
- Advanced targeting priorities
- Ship special abilities (barrel rolls, dodges)
- Admiral ship win condition
- Non-linear map routes / trade lanes
- Advanced zoom (logarithmic scaling to see dogfights)
- Fog of war
- Spy mechanics (infiltration, sabotage)
- Ground troops / planet invasion
- Manpower depletion / famine mechanics
- Ship customization / visual upgrades
- Kamikaze / ramming ships
- Boarding / hijacking
- Critical hits / ammo explosions

### Phase 3+ (Advanced)
- Multiple galaxy routes (not just linear)
- Fully zoomable galaxy (from individual dogfights to full map)
- Complex pilot AI (evasive maneuvers, formations)
- Trade routes / city-state allies
- Tech trees
- Factions with unique units
- Commander abilities
- Campaign mode

---

## Open Questions for Playtesting

These will be answered through iteration:

1. **Is 45 seconds the right spawn rate?** Too slow = boring, too fast = overwhelming
2. **How many factories can you reasonably manage?** UI/UX challenge
3. **Should waypoints be per-planet or global?** One waypoint might be too limiting
4. **Do moons need to orbit, or is it visual flair?** Performance vs immersion
5. **Comeback mechanics:** Does snowballing ruin games, or is it exciting?
6. **Unit variety:** Are 5-7 units enough, or do we need more for depth?
7. **Building limits:** Should there be a cap on factories per planet?
8. **Resource pacing:** How quickly should exotic resources unlock?

---

## Success Criteria

**MVP is successful if players can:**
1. Build factories on planets and produce diverse fleets
2. Control fleet positioning with waypoints
3. Capture planets through tug-of-war mechanics
4. Experience escalating battles (100+ ships by endgame)
5. Complete a 20-minute match with clear winner
6. Feel strategic depth (economic choices, unit composition)
7. Understand the game without a tutorial (intuitive UI)

**MVP is NOT trying to:**
- Have perfect balance (playtesting required)
- Support all 15+ unit types (focus on core 5-7)
- Compete with StarCraft's micro complexity
- Implement every cool idea (strict scope discipline)

---

## Next Steps

1. **Define Unit Stats Spreadsheet:** Create balance doc with costs, HP, damage, etc.
2. **Prototype Core Systems:** Get ships moving, fighting, spawning from factories
3. **Build Planet/Building UI:** Click planets, build factories, see production
4. **Implement Waypoint Control:** Click to move fleet, test grouping mechanics
5. **Playtest Relentlessly:** Tune pacing, balance, fun factor
