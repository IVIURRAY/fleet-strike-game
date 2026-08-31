# Fleet Strike - Feature Roadmap

This document organizes all game features into implementation phases, from MVP through advanced expansions.

---

## MVP (Minimum Viable Product)

**Goal:** Playable 1v1 matches with core tug-of-war gameplay loop

### Map & Planets
- ✅ Linear 7-planet map (2 home + 5 neutral)
- ✅ 2-3 moons per planet
- ✅ Planet capture via proximity (tug-of-war)
- ✅ Unlimited building slots on planets
- ✅ 3 building slots on moons
- ✅ Each neutral planet has unique resource (Gold/Crystal/Gas/Tungsten)

### Economy
- ✅ Gold resource (165 starting, 5/sec base income)
- ✅ Manpower resource (basic implementation)
- ✅ Exotic resources unlock special units (Crystal/Gas/Tungsten)
- ✅ Continuous resource generation (no wave-based)
- ✅ Building-dependent income scaling

### Buildings
- ✅ Specialized factories (one unit type per factory)
- ✅ Factories auto-produce every 45 seconds
- ✅ Economic buildings on planets (gold mines, manpower centers)
- ✅ Defensive buildings on moons (turrets, shields, radar)
- ✅ Factory upgrades (faster spawn rate, better units)

### Fleet Control
- ✅ Single waypoint per player
- ✅ Click to set waypoint anywhere on map
- ✅ Units auto-move to waypoint and loiter
- ✅ Auto-engage nearest enemy
- ✅ Starting army: 5 Scouts + 3 Soldiers

### Combat
- ✅ Automatic targeting (nearest enemy)
- ✅ Basic weapon types: Laser/Flak/Bullets/Rockets
- ✅ Basic armor types: Light/Medium/Heavy/Fortified
- ✅ Projectile simulation (different speeds per weapon)
- ✅ Ship HP and damage system
- ✅ Unit death and respawn from factories

### Units (Core 5-7)
- ✅ Scout: Fast, weak, cheap
- ✅ Soldier: Balanced fighter
- ✅ Heavy: Slow tank
- ✅ Medic: Healer ship
- ✅ Engineer: Structure builder (or fast capturer)
- ✅ Demo/Pyro: AoE damage specialist
- ✅ Sniper: Long-range laser

### UI/UX
- ✅ 2D side-scrolling view (left to right)
- ✅ Basic zoom in/out
- ✅ Click planets to manage buildings
- ✅ Click moons to manage defenses
- ✅ Resource HUD (gold, manpower, exotic resources)
- ✅ Minimap showing planet ownership
- ✅ Building construction interface
- ✅ Waypoint marker visual

### Technical
- ✅ ECS architecture
- ✅ TypeScript + PixiJS rendering
- ✅ 1v1 WebSocket multiplayer
- ✅ Data-driven unit definitions (JSON/TypeScript)

### Win Condition
- ✅ Control all 7 main planets to win
- ✅ No turn limit (matches naturally resolve in ~20 minutes)

---

## Phase 2 - Enhanced Control & Depth

**Goal:** Add tactical complexity and quality-of-life features

### Fleet Control Improvements
- 🔲 Multiple waypoints per player (2-3)
- 🔲 Split forces across multiple fronts
- 🔲 Waypoint queueing (shift-click to add waypoints)
- 🔲 Formation chess board / hangar staging area
- 🔲 "Hold position" toggle at waypoint
- 🔲 Retreat command (emergency fallback waypoint)

### Combat Enhancements
- 🔲 Smart targeting priorities (scouts target miners, snipers target medics)
- 🔲 Manual target selection (right-click enemy units)
- 🔲 Focus-fire commands (all selected units attack one target)
- 🔲 Ship special abilities (cooldown-based)
  - Scout: Speed boost
  - Heavy: Shield wall
  - Medic: Emergency heal burst
  - Demo: Delayed explosives
- 🔲 Critical hits (ammo storage explosions)
- 🔲 Fire spreading to nearby ships

### Ship Behavior
- 🔲 Evasive maneuvers (barrel rolls, loops)
- 🔲 Formation maintenance during movement
- 🔲 Intelligent pathing (avoid obstacles/hazards)
- 🔲 G-force resistance stats (turn agility)

### Additional Units (Expand to 12-15)
- 🔲 Spy: Stealth, infiltration, sabotage
- 🔲 Shield Ship: Mobile shield walls
- 🔲 Miner: Resource gathering from asteroids/comets
- 🔲 Drone Swarms: Tiny ships controlled by mothership
- 🔲 Ramming Ships: Huge melee specialists
- 🔲 Tug Boats: Pull/push ships (crowd control)
- 🔲 EMP Jammers: Disable electronics
- 🔲 Boarding Ships: Capture enemy vessels

### Map & Planets
- 🔲 Asteroids/comets as resource nodes
- 🔲 Neutral space stations (can ally like Civ city-states)
- 🔲 Hazards (radiation zones, black holes)
- 🔲 Moon orbital mechanics (actually rotate)
- 🔲 Planetary visual variety (desert/ice/lava/gas giants)

### Economy & Progression
- 🔲 Advanced exotic resources (more than 4 types)
- 🔲 Trade routes between planets
- 🔲 Resource scarcity mechanics (limited deposits)
- 🔲 Building prerequisites (unlock trees)
- 🔲 Population mechanics (food, education, growth)

### Win Conditions
- 🔲 Admiral Ship win condition (destroy enemy's flagship)
- 🔲 Admiral can move/hide around galaxy
- 🔲 Economic victory (control X resources for Y minutes)
- 🔲 Score-based time limit mode

### UI/UX Polish
- 🔲 Hotkeys for buildings (Q/W/E/R for factories)
- 🔲 Control groups (1-9 for unit selections)
- 🔲 Production queue visualization
- 🔲 Battle replays
- 🔲 More detailed unit tooltips (DPS, counters, etc.)
- 🔲 Alert system (planet under attack, production complete)

### Visual & Audio
- 🔲 Team colors for player customization
- 🔲 Ship visual upgrades (show armor/weapon tiers)
- 🔲 Explosion effects for ship deaths
- 🔲 Projectile trails and laser beams
- 🔲 Background music and combat sounds
- 🔲 Voice lines (unit acknowledgments)

---

## Phase 3 - Strategic Complexity

**Goal:** Non-linear gameplay, advanced tactics, asymmetry

### Advanced Map Design
- 🔲 Non-linear galaxy routes (multiple paths)
- 🔲 Branching trade lanes (choose your route)
- 🔲 Fog of war system
- 🔲 Satellite/probe units for vision
- 🔲 Radar towers on moons reveal area
- 🔲 Larger maps (10-15 planets)
- 🔲 Procedurally generated galaxies

### Advanced Warfare
- 🔲 Ground troops / planetary invasion
- 🔲 Sabotage mechanics (spies infiltrate planets)
- 🔲 Famine/blockade systems (cut off manpower)
- 🔲 Piracy (steal resources from trade routes)
- 🔲 Planet destruction (nukes, superweapons)
- 🔲 Boarding and hijacking enemy ships
- 🔲 Electronic warfare (hacking, jamming)

### Economy & Diplomacy
- 🔲 Manpower depletion (run out of pilots)
- 🔲 Food production and famine mechanics
- 🔲 Education systems (better pilots)
- 🔲 Aid packages to starving planets
- 🔲 Neutral factions (can ally/trade/fight)
- 🔲 Black market / smuggling

### Tech Trees & Progression
- 🔲 Research system (Civ-style tech tree)
- 🔲 Branching specializations (offense/defense/economy)
- 🔲 Prototype units (experimental weapons)
- 🔲 Factory technology upgrades
- 🔲 Ship customization (loadouts, paint)

### Factions & Commanders
- 🔲 Multiple playable factions (unique units/abilities)
- 🔲 Commander selection (leader bonuses)
- 🔲 Faction-specific technologies
- 🔲 Asymmetric balance (different playstyles)

### Game Modes
- 🔲 2v2 team battles
- 🔲 Free-for-all (3-4 players)
- 🔲 Co-op vs AI
- 🔲 Campaign mode (story missions)
- 🔲 Endless survival mode
- 🔲 Custom game rules (low gravity, infinite resources, etc.)

---

## Phase 4 - Immersion & Scale

**Goal:** Fulfill the "logarithmic scale" vision - feel huge and tiny simultaneously

### Logarithmic Zoom System
- 🔲 Zoom Level 1: Individual ship dogfights (see pilots, damage effects)
- 🔲 Zoom Level 2: Squadron view (10-20 ships)
- 🔲 Zoom Level 3: Fleet battles (100+ ships)
- 🔲 Zoom Level 4: Planet-scale view (see orbital paths)
- 🔲 Zoom Level 5: Full galaxy view (strategic overview)
- 🔲 Smooth transitions between zoom levels
- 🔲 Google Maps-style rendering (level of detail)

### Visual Fidelity
- 🔲 Ship internals visible at close zoom (crew, engines, weapons)
- 🔲 Damage modeling (hull breaches, fires)
- 🔲 Accurate astronomical distances
- 🔲 Real-time lighting (stars, planets, explosions)
- 🔲 Particle effects at scale (thousands of projectiles)
- 🔲 Cinematic camera modes

### Performance Optimization
- 🔲 Handle 1000+ ships simultaneously
- 🔲 Spatial partitioning for collision detection
- 🔲 LOD (level of detail) system
- 🔲 Occlusion culling
- 🔲 WebGL optimization for large battles

### Narrative & World-Building
- 🔲 Lore codex (explain the galactic civil war)
- 🔲 Planet descriptions and backstories
- 🔲 Commander personalities and dialogue
- 🔲 Victory/defeat cinematics
- 🔲 Tutorial campaign with story

---

## Phase 5 - Live Service & Community

**Goal:** Long-term engagement and competitive scene

### Competitive Features
- 🔲 Ranked matchmaking (ELO/MMR system)
- 🔲 Leaderboards
- 🔲 Seasonal tournaments
- 🔲 Spectator mode
- 🔲 Replay sharing and analysis tools
- 🔲 Pro player profiles

### Content Updates
- 🔲 New units (quarterly releases)
- 🔲 New maps (community-made?)
- 🔲 Balance patches (data-driven)
- 🔲 Seasonal events (special rules/rewards)
- 🔲 Cosmetic DLC (ship skins, colors, emotes)

### Community Tools
- 🔲 Map editor
- 🔲 Unit balance modding
- 🔲 Custom game lobbies
- 🔲 In-game chat and voice
- 🔲 Clan/guild system
- 🔲 Workshop integration (Steam/itch.io)

### Analytics & Balance
- 🔲 Telemetry system (track unit win rates)
- 🔲 Heatmaps (where battles happen most)
- 🔲 A/B testing for balance changes
- 🔲 Automated balance suggestions (ML?)

---

## Implementation Priority Guidelines

### Must Have (MVP)
- Core gameplay loop works
- Fun to play for 20 minutes
- Clear winner/loser
- Readable graphics
- Stable multiplayer

### Should Have (Phase 2)
- Quality of life improvements
- Tactical depth
- Replayability through variety
- Polish and juice

### Could Have (Phase 3+)
- Advanced strategy
- Narrative depth
- Multiple game modes
- Competitive features

### Won't Have (Unless Proven Necessary)
- 3D graphics (stick to 2D for performance)
- Single-player campaign (multiplayer first)
- Mobile support (PC/web first)
- VR (way out of scope)

---

## Feature Dependencies

Some features require others to be implemented first:

```
MVP Fleet Control → Phase 2 Multiple Waypoints → Phase 3 Split Forces
MVP Basic Targeting → Phase 2 Smart Priorities → Phase 2 Manual Targeting
MVP 7 Units → Phase 2 12-15 Units → Phase 3 Faction-Specific Units
MVP Linear Map → Phase 3 Branching Routes → Phase 4 Procedural Generation
MVP Basic Zoom → Phase 4 Logarithmic Zoom → Phase 4 Full Immersion
```

---

## Current Status

**In Progress:** MVP Design Documentation  
**Next Steps:**
1. Create unit stats spreadsheet
2. Prototype ECS + PixiJS rendering
3. Build core systems (movement, combat, production)
4. Implement waypoint control
5. First playable build

**Estimated MVP Timeline:** TBD (depends on team size and velocity)

---

## Notes & Philosophy

**Scope Discipline:**
- When adding features, ask: "Is this necessary for MVP fun?"
- Cut ruthlessly to ship a playable game
- Iterate based on player feedback, not feature lists

**Balance Over Complexity:**
- 5 balanced units > 15 broken units
- Simple mechanics executed well > complex systems half-done
- Players should understand their options immediately

**Performance First:**
- ECS architecture chosen specifically for scale
- Target 60 FPS with 200+ ships on screen
- Optimize early, not just late

**Inspiration, Not Imitation:**
- Learn from StarCraft, Civ, TF2, but don't copy
- Find the unique "Fleet Strike" identity
- Auto-battler + RTS economy = our niche
