# Map Design Document

## Overview

Fleet Strike features a dynamic, multi-scale map system inspired by Google Maps' zoom functionality. Players can seamlessly transition from galaxy-wide strategic view down to individual ship dogfights, all rendered in real-time.

**MVP Scope:** Linear 7-planet trade route  
**Phase 2+:** Non-linear maps, multiple routes, branching paths  
**Ultimate Vision:** Full galaxy conquest with logarithmic zoom (Phase 4)

---

## Map Structure - MVP (Linear Trade Route)

### Galaxy Layout

The MVP map is a **linear chain of 7 main planets** connected by established trade lanes. This creates a natural tug-of-war battlefield with clear progression paths.

```
[HOME A] ←→ [GOLD] ←→ [CRYSTAL] ←→ [CENTER] ←→ [GAS] ←→ [TUNGSTEN] ←→ [HOME B]
   P1          P2         P3            P4         P5          P6            P7

Legend:
- HOME A/B: Player starting positions (Capital Planets)
- GOLD/CRYSTAL/GAS/TUNGSTEN: Neutral planets with unique resources
- CENTER: Contested neutral planet (no special resource)
- ←→: Trade lanes (movement paths for fleets)
```

### Trade Lanes (Movement Paths)

**In MVP:**
- Ships automatically follow trade lanes between planets
- Linear path: Ships move from planet to planet along the chain
- Speed varies by ship type (Scouts: 220 u/s, Heavies: 80 u/s)
- Trade lanes are 2-way: Fleets from both sides can meet anywhere along the route

**Visual Design:**
- Glowing pathways connecting planets (holographic highway aesthetic)
- Subtle particle effects (stars, dust, cargo ships as background detail)
- Team color tint where fleets are concentrated
- Width scales with fleet size for dramatic effect

**Phase 2+ Extensions:**
- Multiple routes between planets (flanking opportunities)
- Trade lane upgrades (faster movement for allied ships)
- Blockades and chokepoints
- Non-linear web of connections

---

## Planets

### Planet Types

#### 1. Capital Planet (Home Planet)
**Count:** 2 (one per player)  
**Starting State:** Fully controlled by owner  
**Special Features:**
- **Command Center** (pre-built unique structure):
  - Provides base resources: 5 gold/second
  - Cannot be destroyed (planet can be captured, but building remains)
  - Acts as respawn point for Admiral Ship (Phase 2)
  - Visual: Glowing mega-structure, visible from space
- Starting buildings: 1 Gold Mine, 1 Manpower Center
- Largest planet (visual emphasis on importance)

**Strategic Role:**
- Your economic foundation
- Loss means you're pushed back to last stand
- High priority to defend
- Ultimate enemy target

---

#### 2. Gold Planet
**Position:** 2nd planet from each home (first neutral)  
**Resource:** Gold bonus  
**Special Features:**
- Rich asteroid belt (visual: golden ore rocks orbiting)
- +50% gold production from Gold Mines built here
- Most valuable early-game planet
- Contested immediately at match start

**Strategic Role:**
- Early game economic spike
- First major battle location
- Controls mid-game tempo
- High priority for both players

---

#### 3. Crystal Planet
**Position:** 3rd from Home A, 5th from Home B  
**Resource:** Crystals (exotic)  
**Special Features:**
- Giant crystalline structures on surface
- Required for: Medic Ships, Shield Ships, Laser weapons
- Glowing blue aesthetic
- +25% shield effectiveness for units built here

**Strategic Role:**
- Unlocks advanced defense/support units
- Critical for Shield/Medic strategies
- Mid-game power spike
- Defensive composition enabler

---

#### 4. Center Planet (Neutral)
**Position:** Middle of map (4th planet)  
**Resource:** None (balanced planet)  
**Special Features:**
- Largest neutral planet
- Central strategic position
- No resource bonus, but...
- Double building slots (unlimited in MVP, but faster construction)
- Visual: Hub-like design, ancient mega-city ruins

**Strategic Role:**
- King of the hill control point
- Central staging ground
- Whoever controls center has map pressure
- Psychological advantage
- Critical for map control

---

#### 5. Gas Planet
**Position:** 5th from Home A, 3rd from Home B  
**Resource:** Gas (exotic)  
**Special Features:**
- Swirling gas giant with mining platforms
- Required for: Bombers, explosive ammo upgrades
- Orange/red visual aesthetic
- +25% explosive damage for units built here

**Strategic Role:**
- Unlocks siege and AoE units
- Critical for breaking fortified positions
- Offensive composition enabler
- Late-game power spike

---

#### 6. Tungsten Planet
**Position:** 6th from Home A, 2nd from Home B  
**Resource:** Tungsten (exotic)  
**Special Features:**
- Dense metallic world with heavy mining operations
- Required for: Snipers, Ram Ships, armor-piercing rounds
- Gray/silver aesthetic with industrial facilities
- +25% armor penetration for units built here

**Strategic Role:**
- Unlocks anti-heavy unit counters
- Critical for breaking tank compositions
- Sniper unlock planet
- Counter-play enabler

---

### Planet Mechanics

#### Building System
**MVP Implementation:**
- **Unlimited building slots** on planets
  - Rationale: Late-game can have 25+ factories producing 200+ ships
  - No arbitrary construction limits
  - Visual: Buildings spread across planet surface, visible from space
- **Power system:** Power Plants provide "power units" to enable more buildings
  - Example: 1 Power Plant = +10 power, 1 Heavy Factory = -5 power
  - Prevents immediate spam, creates build order decisions
  - Starts with enough power for ~5 basic buildings

**Building Categories:**
1. **Factories** (produce ships every 45 seconds)
   - Scout Factory, Soldier Factory, Heavy Factory, etc.
   - One factory type = one unit type
   - Can build multiple of same type for faster production
   
2. **Economic Buildings**
   - Gold Mines (+3 gold/sec, upgradeable)
   - Manpower Centers (+2 manpower/sec)
   - Power Plants (+10 power capacity)
   
3. **Tech Buildings**
   - Research Lab (enables upgrades, reduces costs)
   
4. **Special Structures** (late game)
   - Stargate (teleportation between planets)
   - Orbital Cannon (map-wide superweapon)

#### Capture Mechanics

**Tug-of-War Proximity System:**

**How Capture Works:**
1. Any ship within **capture radius** (500 units) of a planet generates capture points
2. **Capture rate:** 1 point per second per ship base
   - Engineers: 2 points/second (double rate)
   - Scouts: 1 point/second
   - Heavies: 1 point/second (same as light units, no bonus)
3. **Capture threshold:** Planet ownership changes when one side reaches 100 points net advantage
4. Visual indicator: Planetary flag/color shifts gradually as capture progresses

**Example:**
- 10 Scouts on Planet A (10 points/sec for Player 1)
- 5 Soldiers + 2 Engineers on Planet A (5 + 4 = 9 points/sec for Player 2)
- Net: Player 1 gaining 1 point/sec
- Time to capture: 100 seconds

**Strategic Implications:**
- All units can capture (no special unit required)
- Engineers are 2x efficient (specialist role)
- Numbers matter (swarm can capture even if losing battles)
- Leaving ships at a planet = passive capture
- Defenders have advantage (turrets + building production)

**Visual Feedback:**
- Planet color gradually shifts toward capturing team
- Capture progress bar
- Flag-raising animation when captured
- Buildings change team color accent
- Celebration effects on capture

---

## Moons

### Moon System Overview

**Each planet has 2-3 orbiting moons**  
**Total in MVP:** ~16 moons across 7 planets

### Moon Mechanics

**Orbital Movement:**
- Moons orbit their parent planet in real-time
- Orbital period: 2-4 minutes (varies by moon size)
- Creates dynamic defensive coverage
- Turrets have firing arcs, so position matters
- Can time attacks when moon turrets are on far side

**Building Slots:**
- **3 slots per moon** (limited compared to unlimited planet slots)
- Forces strategic choices (shields vs turrets vs radar)
- Moon buildings require parent planet control
- Captured planet = captured moons automatically

**Strategic Role:**
- **Defensive focus:** Turrets, shields, radar
- **Force multiplier:** 3 turrets on a moon can devastate passing fleets
- **Coverage gaps:** Orbital movement creates windows of opportunity
- **High-value targets:** Destroying moon buildings weakens planet defense

### Moon Building Types

1. **Combat Turrets**
   - Plasma Turret (80 DPS, 700 range)
   - Flak Battery (anti-swarm, 75 distributed DPS)
   - Laser Array (120 damage burst, 1000 range)
   
2. **Support Structures**
   - Shield Generator (2000 HP bubble, 600 radius)
   - Repair Station (heals 20 HP/sec per ship, 500 radius)
   
3. **Intelligence**
   - Radar Station (reveals 1200 radius, detects cloaked units)
   
4. **Strategic Weapons**
   - Missile Silo (200 damage, 200 AoE, 1500 range - can hit 2+ planets away)

### Moon Defense Strategies

**Early Game (Limited Resources):**
- 1 Flak Battery per moon (anti-scout defense)
- Protect key expansion planets only

**Mid Game:**
- 2 turrets + 1 radar (balanced defense + vision)
- Shield Generator on Capital Planet moons

**Late Game:**
- 3x Missile Silos (strategic bombardment)
- 3x Laser Arrays (snipe high-value targets)
- Shield + Repair + Radar (support station setup)

---

## Zoom Levels & Rendering

### MVP Implementation (Phase 1)

**Single Strategic View:**
- Top-down 2D view of entire 7-planet chain
- All planets visible simultaneously
- Ships rendered as sprites (PixiJS 8 with WebGPU/WebGL acceleration)
- Zoom in/out to focus on specific battles
- Camera pan follows selected fleet

**Technical Approach:**
- 2D rendering with PixiJS 8 (WebGPU/WebGL renderer)
- Sprite-based units with particle effects
- Particle effects for weapons fire and explosions
- Simple 2D physics for ship movement

---

### Phase 4 Vision (Logarithmic Zoom - Future)

**Multi-Scale Rendering (inspired by Google Maps):**

Note: This is an **aspirational future feature**, not part of the MVP. The core game remains a 2D sprite-based game.

#### Level 1: Galaxy View
- Entire map visible (2D strategic view)
- Planets shown as large sprites
- Fleet concentrations as colored clouds
- Strategic overview
- Trade lanes highlighted

#### Level 2: Sector View  
- 2-3 planets visible
- Ships visible as sprite groups
- Individual icons for capital ships
- Battle lines forming
- Tactical positioning visible

#### Level 3: Planet View
- Single planet + moons in focus
- Individual ships rendered as detailed sprites
- Building details visible
- Moon orbital positions clear
- Close tactical view

#### Level 4: Engagement View
- Zoomed into specific fleet battle
- Individual ship sprites with enhanced detail
- Weapon fire visible (particle effects, tracers, lasers, explosions)
- Dogfighting maneuvers animated
- Cinematic battle view

**Seamless Transition:**
- Scroll wheel to zoom in/out
- Level of detail scales automatically (sprite switching)
- No loading screens
- Smooth interpolation between zoom levels

---

## Visual Design & Aesthetics

### Space Environment

**Background Elements:**
- Star field (parallax layers for depth)
- Nebula clouds (subtle color grading)
- Distant galaxies and cosmic phenomena
- Asteroid belts around resource planets
- Space debris and wreckage (battle aftermath)

**Lighting:**
- Central star provides directional light
- Planet glow (team color accents when controlled)
- Engine trails and weapon fire illuminate nearby ships
- Shadow play as moons eclipse planets

### Planet Visual Identity

Each planet must be instantly recognizable:

**Capital Planets:**
- Blue-green (habitable)
- City lights visible on dark side
- Massive Command Center structure
- Orbital rings and stations

**Gold Planet:**
- Golden-yellow hue
- Asteroid belt with mining operations
- Industrial aesthetic

**Crystal Planet:**
- Blue-purple crystalline surface
- Glowing energy patterns
- Sci-fi mystical vibe

**Center Planet:**
- Gray-white (neutral)
- Ancient mega-structures
- Ruins of old civilization
- Balanced, hub-like

**Gas Planet:**
- Orange-red swirling storms
- Floating mining platforms
- Jupiter-like appearance
- Dynamic atmosphere

**Tungsten Planet:**
- Dark gray metallic
- Heavy industrial scarring
- Strip mining visible
- Harsh, utilitarian

### Trade Lane Aesthetics

- **Visual:** Glowing holographic highway
- **Color:** Neutral white/blue in unclaimed space
- **Team Influence:** Tints toward team color where fleets dominate
- **Particles:** Subtle star dust, cargo ship silhouettes (background flavor)
- **Width:** Scales with fleet concentration (dramatic visual feedback)

---

## Strategic Map Features (Phase 2+)

### Non-Linear Maps

**Multiple Routes:**
```
       [Planet C]
      /          \
[Home A] - [Planet B] - [Planet D] - [Home B]
      \          /
       [Planet E]
```

**New Mechanics:**
- Flanking routes
- Simultaneous attacks on multiple fronts
- Trade-offs: shorter route = more contested
- Longer route = safer but slower expansion

### Map Variants

**1. Symmetrical Line (MVP)**
- Linear 7-planet chain
- Perfectly balanced
- Simple, easy to learn

**2. Hub and Spoke**
- Central planet connected to 6 outer planets
- King of the hill gameplay
- High-intensity center battles

**3. Ring**
- Planets in circular formation
- Two paths to reach enemy
- Clockwise vs counter-clockwise strategies

**4. Web**
- Complex interconnected network
- Many possible routes
- High strategic depth
- Multiple simultaneous fronts

**5. Asymmetrical Campaign**
- Story-driven missions
- Different starting positions
- Unique objectives beyond conquest
- Boss battles (defend against waves, etc.)

---

## Map Size & Scale

### Distance Between Planets

**MVP Specifications:**
- Planet to planet: 3000 units
- Scout travel time (220 u/s): ~13.6 seconds per planet
- Heavy travel time (80 u/s): ~37.5 seconds per planet
- Total map length: 18,000 units (Home A to Home B)
- Scout full traversal: ~82 seconds
- Heavy full traversal: ~225 seconds (3.75 minutes)

**Engagement Zone:**
- Fleets meet in the middle of trade lanes
- Average engagement distance from planet: 1500 units
- Combat happens in space, not at planets
- Planets are destinations, not battlefields

### Planet Sizes (Visual)

- **Capital Planets:** 800 unit diameter
- **Resource Planets:** 600 unit diameter  
- **Center Planet:** 700 unit diameter
- **Moons:** 200-300 unit diameter

**Capture Radius:** 500 units from planet center

---

## Win Conditions

### MVP Win Condition

**Total Planetary Conquest:**
- Control all 7 main planets simultaneously
- No alternate win conditions (keeps scope simple)
- Clear objective: push forward, capture everything
- Victory screen when 7th planet captured

**Match Pacing:**
- Early game (0-5 min): Capture first neutral planets
- Mid game (5-12 min): Control center, unlock exotic resources
- Late game (12-20 min): Push into enemy territory
- Climax (18-20 min): Siege enemy Capital Planet

---

### Phase 2 Win Condition

**Destroy Enemy Admiral Ship:**
- Alternative/additional win condition
- Admiral ship = your mobile command center
- Adds risk to aggressive plays
- Losing Admiral = instant defeat
- Defending Admiral becomes strategic priority
- Can hide Admiral at home or bring to front lines (risk/reward)

---

## Map Events & Hazards (Phase 3+)

**Dynamic Elements:**
- Asteroid storms (periodic damage to passing ships)
- Solar flares (disable shields temporarily)
- Comet mining opportunities (bonus resources)
- Pirate NPC fleets (neutral threat)
- Black holes (gravity wells that slow ships)
- Wormholes (shortcut routes that open/close)

**Strategic Impact:**
- Forces adaptation
- Creates opportunities for comebacks
- Adds variety to repeated play
- Not in MVP (scope control)

---

## Technical Considerations

### Performance Optimization

**Rendering:**
- Sprite batching for hundreds of ships (PixiJS 8 optimization)
- LOD (Level of Detail) scaling based on zoom (swap sprite assets)
- Particle pooling for weapon effects (performance optimization)
- Occlusion culling (don't render off-screen entities)

**Pathfinding:**
- Simple linear paths in MVP (low CPU cost)
- Pre-calculated routes along trade lanes
- Only recalculate on waypoint change

**Physics:**
- Lightweight 2D physics (velocity + position updates)
- Collision detection for ships near planets only (spatial partitioning)
- Simplified hitboxes (circle or rectangle colliders)

---

## Map Editor (Phase 5+)

**Custom Map Creation:**
- Drag-and-drop planet placement
- Define trade lane connections
- Set resource types per planet
- Adjust distances and scaling
- Save/load custom maps
- Community sharing

**Use Cases:**
- Tournament maps
- Campaign missions
- Player-created challenges
- Testing balance changes

---

## Summary: MVP Map Features

✅ **Implemented in MVP:**
- Linear 7-planet trade route
- 2 Capital Planets + 5 neutral planets (each with unique resource)
- 2-3 moons per planet (3 building slots each)
- Unlimited building slots on planets
- Proximity-based capture system
- Single strategic zoom level
- Trade lane movement paths

❌ **Deferred to Phase 2+:**
- Non-linear maps
- Multiple routes
- Admiral Ship mechanics
- Advanced zoom levels (logarithmic)
- Map events and hazards
- Custom map editor

---

**End of Document**

*This design should evolve as playtesting reveals balance issues and UX improvements. The MVP focuses on core mechanics; later phases add strategic depth.*
