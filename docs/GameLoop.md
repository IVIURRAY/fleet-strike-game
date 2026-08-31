# Game Loop Document

## Core Concept

Fleet Strike is a **real-time strategy auto-battler** where players expand across a linear galaxy through economic growth and automated fleet combat. The game loop centers on building factories that continuously produce ships, positioning fleets via waypoints, and capturing planets to unlock more powerful units.

**Theme:** A galactic civil war - the empire has split (like the Roman Schism) and two factions now battle for control of the known galaxy.

**Target Match Duration:** 20 minutes  
**Player Count:** 1v1  
**Pace:** Continuous real-time action with escalating intensity

---

## High-Level Game Loop

```
BUILD → PRODUCE → POSITION → CAPTURE → UNLOCK → SCALE → WIN
   ↑                                                        ↓
   └────────────────── REINVEST RESOURCES ─────────────────┘
```

1. **Build** factories and economic structures on controlled planets
2. **Produce** ships automatically from factories every 45 seconds
3. **Position** your fleet using waypoints to control engagement location
4. **Capture** planets through proximity-based tug-of-war
5. **Unlock** advanced units by capturing exotic resource planets
6. **Scale** by building more factories and upgrading production
7. **Win** by controlling all 7 planets

This loop accelerates throughout the match: early game has 2-3 factories producing 10-15 ships, late game has 25+ factories with 200+ ships in massive fleet battles.

---

## Match Structure (Timeline)

### Pre-Game: Setup (30 seconds)

**Starting Conditions:**
- **Map:** 7-planet linear chain
  ```
  [HOME A] - [GOLD] - [CRYSTAL] - [CENTER] - [GAS] - [TUNGSTEN] - [HOME B]
  ```
- **Resources:** 165 Gold, 5 Gold/second base income
- **Army:** 5 Scout Fighters, 3 Soldier Fighters (ready immediately)
- **Waypoint:** Pre-set to first neutral planet (Gold Planet)
- **Buildings:** Command Center (home planet), 1 Gold Mine, 1 Manpower Center

**First Decision:**
- Do you rush expansion with starting army?
- Or build first factory before pushing?
- Set waypoint to Gold Planet or skip to Crystal?

---

### Early Game (0-5 minutes): Expansion Race

**Objective:** Secure first neutral planets and establish economy

**Key Activities:**

1. **Immediate Expansion**
   - Starting army (5 Scouts + 3 Soldiers) auto-moves toward Gold Planet
   - First contact with enemy scouts at ~1:30 mark
   - Gold Planet capture race begins

2. **First Factories**
   - Build Scout Factory (50 gold, 30 sec) OR Soldier Factory (100 gold, 40 sec)
   - First produced ships arrive at ~1:15 - 1:40
   - Economy decision: more factories or more gold mines?

3. **Economic Foundation**
   - Build 1-2 additional Gold Mines (+3 gold/sec each)
   - Build Manpower Center (+2 manpower/sec)
   - Balance: Every 80 gold on economy = one Heavy Gunship not built

4. **Planet Priorities**
   - **Gold Planet:** First major battle, economic spike
   - **Crystal Planet:** Unlocks Medics/Shields (defensive play)
   - Skip to Center? Risky but high reward

**Fleet Size:** 10-20 ships total  
**Income:** 5-15 gold/second  
**Planets Controlled:** 1-3

**Strategic Patterns:**

**Aggressive Opening:**
- All-in with starting army to capture Gold Planet fast
- Delay factory construction
- High risk: If you lose early fight, economy suffers

**Economic Opening:**
- Build 2-3 factories + gold mines before pushing
- Let starting army hold position
- Slower expansion but stronger mid-game

**Engineer Rush:**
- Build Engineer Workshop first (150 gold)
- Use Engineers' 2x capture rate to rush planets
- Requires protection but very fast expansion

**Critical Moment:** First major battle at Gold Planet (~2:00 - 3:00)
- Winner gains economic advantage
- Loser must decide: defend or counter-expand to different planet?

---

### Mid Game (5-12 minutes): Resource Competition

**Objective:** Control center planet and secure exotic resources

**Key Activities:**

1. **Exotic Resource Unlock**
   - Capture Crystal Planet → Unlock Medics, Shield Ships
   - Capture Gas Planet → Unlock Bombers (siege warfare)
   - Capture Tungsten Planet → Unlock Snipers (anti-heavy)
   - Each exotic planet dramatically shifts composition options

2. **Center Planet Battle**
   - Psychological control point (middle of map)
   - Largest neutral planet
   - Whoever controls center has map pressure
   - Expect 3-5 minute sustained battle here (~6:00 - 11:00)

3. **Composition Refinement**
   - Identify enemy composition
   - Build counters: Heavies → Build Snipers, Swarms → Build Flak
   - Upgrade key factories (Level 2: +HP, +damage)

4. **Moon Defenses**
   - Build turrets on key planet moons (150-200 gold each)
   - 1-2 turrets per moon = significant defensive advantage
   - Flak Batteries for anti-swarm, Plasma Turrets for anti-heavy

5. **Fleet Positioning Strategy**
   - Set waypoint defensively (hold at your planet) or aggressively (push forward)
   - Timing: Pull back to heal at Repair Stations, then re-engage
   - Waypoint mind-games: Fake retreat, then counter-attack

6. **Economic Scaling**
   - 5-8 factories producing continuously
   - 8-15 gold/second income
   - Begin factory upgrades (reduce production time to 40 sec → 35 sec)

**Fleet Size:** 40-80 ships  
**Income:** 12-25 gold/second  
**Planets Controlled:** 3-5

**Strategic Patterns:**

**Turtle Strategy:**
- Heavy moon defenses
- Medic-Heavy compositions (sustain)
- Wait for enemy to overextend, then counter

**Aggressive Push:**
- Constant pressure with Scout/Soldier spam
- Bomber strikes on enemy moons (destroy turrets)
- Force enemy into reactive play

**Tech Rush:**
- Prioritize exotic resource planets
- Rush to advanced units (Snipers, Bombers, Shields)
- Composition advantage beats numerical advantage

**Critical Moment:** Center Planet capture (~8:00 - 10:00)
- Determines momentum for late game
- Loser is pushed back toward home territory
- Winner can now threaten enemy home planet

---

### Late Game (12-20 minutes): Total War

**Objective:** Push into enemy territory and capture their Capital Planet

**Key Activities:**

1. **Mass Production**
   - 15-25+ factories running simultaneously
   - Production every 35-45 seconds = ~30-40 ships/minute
   - Fleet size: 150-250+ ships
   - Economy: 30-50+ gold/second

2. **Fleet Battles**
   - Hundreds of ships engaged simultaneously
   - Bombers targeting enemy moon turrets
   - Snipers picking off enemy Medics
   - Heavies tanking frontline
   - Screen filled with weapon fire and explosions

3. **Siege Warfare**
   - Attack enemy Tungsten/Gas/Crystal planets (cut off their advanced units)
   - Destroy moon defenses with Bomber runs
   - Missile Silos bombarding enemy factories from 2+ planets away
   - Orbital Cannon superweapon (if built) can destroy planetary structures

4. **Home Planet Assault**
   - Enemy Capital Planet has heaviest defenses
   - Command Center provides economic base (can't be destroyed, but planet can be captured)
   - Expect 3-4 turrets per moon + Shield Generators
   - Requires overwhelming force or sustained siege

5. **Advanced Tactics**
   - Multiple waypoints (Phase 2): Split your fleet for simultaneous attacks
   - Spy Ships (Phase 2): Sabotage enemy economy
   - Stargate (late-game building): Teleport ships behind enemy lines
   - Resource denial: Capture all exotic planets to limit enemy unit types

6. **Upgrade Maxing**
   - Level 3 factory upgrades (+200 HP on Heavies, +20 damage, 35-sec production)
   - Research Lab bonuses (reduce upgrade costs 40%, +5% factory production speed)
   - Gold Mines at Level 4 (+12 gold/sec each)

**Fleet Size:** 150-300+ ships  
**Income:** 30-60+ gold/second  
**Planets Controlled:** 5-7

**Strategic Patterns:**

**Overwhelming Numbers:**
- 10+ Scout Factories = 100+ cheap units
- Swarm enemy with quantity over quality
- Bypass turrets, rush straight for planet capture

**Quality Over Quantity:**
- Heavy/Sniper/Bomber composition
- Each unit worth 5-10 enemy units
- Slow but unstoppable push

**Surgical Strikes:**
- Bombers target specific enemy buildings
- Snipers assassinate key support ships (Medics)
- Missile Silos destroy enemy factories from range
- Cripple economy, then push

**All-In Rush:**
- Sell everything, build 5+ Heavy Factories
- One massive push with 30+ Heavies
- Win immediately or lose everything

**Critical Moment:** Capital Planet siege (~16:00 - 20:00)
- Winner captures 7th planet → Victory
- Most intense combat of the match
- Comebacks still possible (defender has turret advantage)

---

## Win Conditions

### MVP Win Condition

**Total Planetary Conquest**
- Control all 7 main planets simultaneously
- Planet control = capture bar reaches 100% in your favor
- Victory achieved when 7th planet fully captured
- Victory screen, statistics, post-game summary

**Match Pacing:**
- 25% of matches end before 15 minutes (dominant victory)
- 50% of matches end 15-18 minutes (standard)
- 25% of matches end 18-20+ minutes (epic back-and-forth)

---

### Phase 2 Win Condition (Alternative)

**Destroy Enemy Admiral Ship**
- Each player has unique Admiral Ship (Titan Battleship or Stealth Carrier)
- Losing Admiral = instant defeat (regardless of planets controlled)
- Adds strategic tension: Do you risk moving Admiral forward for its buffs?
- Assassination strategies: Sniper focus fire, Bomber alpha strike
- High-stakes gameplay: One mistake can lose the game

**Comparison:**
- Planetary Conquest = Slow, strategic, territorial control
- Admiral Destruction = High-risk, assassination-focused, dramatic finish

---

## Continuous Real-Time Mechanics

### Factory Production Cycle

**Auto-Production Loop:**
- Every factory produces 1 unit of its type every 45 seconds (base)
- Production is **automatic and continuous** (no manual queuing)
- Ships spawn at planet location and immediately move toward waypoint
- Multiple factories = multiple simultaneous production streams

**Example:**
- 3 Scout Factories = 1 Scout every 15 seconds on average
- Over 5 minutes: 60 Scouts produced (20 per factory)

**Upgrade Impact:**
- Level 2: 40-second production time (-5 sec)
- Level 3: 35-second production time (-10 sec)
- Late game with 10 Scout Factories at Level 3 = 1 Scout every 3.5 seconds

**Strategic Implication:**
- Can't micro production (no StarCraft-style queue management)
- Composition set by factory types built
- Changing composition = building new factory types (expensive pivot)
- Encourages long-term planning over reactive micro

---

### Resource Generation (Per Second)

**Gold Income Sources:**
- Base income: 5 gold/sec (from Capital Command Center)
- Gold Mine Level 1: +3 gold/sec (80 gold cost)
- Gold Mine Level 2: +5 gold/sec (180 gold total)
- Gold Mine Level 3: +8 gold/sec (380 gold total)
- Gold Mine Level 4: +12 gold/sec (780 gold total)
- Gold Planet bonus: +50% to all Gold Mines built there

**Example Income Progression:**
- 0:00 - 5 gold/sec (base)
- 2:00 - 11 gold/sec (2 mines built)
- 5:00 - 18 gold/sec (4 mines, some on Gold Planet)
- 10:00 - 32 gold/sec (6 mines upgraded, Gold Planet captured)
- 15:00 - 50+ gold/sec (8+ mines at Level 3-4)

**Manpower Income:**
- Manpower Center Level 1: +2 manpower/sec (100 gold)
- Level 2: +4 manpower/sec
- Level 3: +7 manpower/sec
- Typically need 2-3 Manpower Centers by mid-game

**Exotic Resources:**
- Generated passively when planet is controlled
- No buildings required (just capture the planet)
- Used as gates (can't build Medics without Crystal Planet)
- Some units also have upfront exotic costs (Shield Ship: 20 Crystals)

---

### Ship Movement & Combat (Automatic)

**Movement:**
- Ships move along trade lanes toward waypoint
- Speed varies by unit (Scout: 220 u/s, Heavy: 80 u/s)
- No pathfinding decisions needed (linear route)
- Engagement happens wherever fleets meet on the trade lane

**Auto-Combat:**
- Ships automatically attack nearest enemy when in range
- No micro required (no manual targeting, no kiting)
- Composition and positioning determine outcome
- Player's role: Strategic (build, upgrade, position), not tactical (no micro)

**Waypoint System (MVP):**
- **Single waypoint** per player
- Click planet → All ships move there
- Ships fight anything in their path
- Defensive waypoint (at your planet) vs Aggressive waypoint (at enemy planet)

**Combat Resolution:**
- Damage dealt per second (DPS) vs Hit Points (HP)
- Armor reduces damage by percentage
- Weapon vs Armor effectiveness modifiers
- Focus fire (multiple ships target same enemy) is automatic
- Winner: Side with more effective DPS and HP remaining

**No Micro Management:**
- Can't tell specific ships to target specific enemies
- Can't manually dodge projectiles
- Can't retreat individual units
- Philosophical design: **Strategy game, not twitch reflex game**

---

### Planet Capture (Continuous Tug-of-War)

**Capture System:**
- Any ship within 500 units of planet generates capture points
- Base rate: 1 point/second per ship
- Engineers: 2 points/second (specialist)
- Capture threshold: 100-point net advantage to change ownership

**Example Scenario:**

**Minute 3:00 - Gold Planet Battle:**
- Player A: 8 Scouts + 3 Soldiers = 11 points/sec
- Player B: 6 Soldiers + 2 Engineers = 10 points/sec
- Net: Player A +1 point/sec
- Result: Gold Planet slowly captures toward Player A over 100 seconds
- BUT: Player B's reinforcements arrive at 4:00 (5 more Soldiers)
- New totals: Player A 11 points/sec, Player B 15 points/sec
- Net: Player B +4 points/sec
- Capture momentum reverses, Player B takes planet in ~50 seconds

**Strategic Implications:**
- Leaving ships at planet = passive capture
- Sending Engineers = fast capture
- Need to balance: Ships at planet vs ships at frontline
- Comeback mechanic: Even losing battles, can capture undefended planets

**Visual Feedback:**
- Planet color shifts gradually (blue → purple → red as capture progresses)
- Capture progress bar UI element
- Flag-raising animation on complete capture
- Celebration effects (fireworks, fanfare)

---

### Moon Orbital Mechanics

**Real-Time Orbits:**
- Moons orbit parent planet continuously
- Orbital period: 2-4 minutes per revolution
- Turrets have firing arcs (don't shoot 360°)

**Tactical Timing:**
- Attack when moon turrets are on far side of orbit
- Example: Flak Battery on moon, orbital period 3 minutes
  - Window 1 (0:00-1:30): Turret facing trade lane (full defense)
  - Window 2 (1:30-3:00): Turret facing away (attack now!)
- Skilled players time attacks during defensive gaps

**Dynamic Defense:**
- Multiple moons per planet = overlapping coverage
- But: All moons orbit independently
- Rare alignment windows when all moons are on far side (golden opportunity)

---

## Strategic Decision Points

### Build Order Decisions

**Opening Build (First 2 minutes):**

**Option A: Fast Expand**
- Use starting army to rush Gold Planet
- Don't build factories yet
- Risk: If you lose fight, no reinforcements

**Option B: Economic Boom**
- Build 2 Gold Mines immediately
- Build 1-2 factories
- Let starting army hold position
- Safe but slower expansion

**Option C: Military Rush**
- Build 2-3 Scout Factories immediately
- Overwhelm enemy with numbers
- Risk: Low income for mid-game

**Option D: Engineer Gambit**
- Build Engineer Workshop first (150 gold)
- Use 2x capture rate to rush 2-3 planets fast
- High risk: Engineers are weak in combat

---

### Mid-Game Pivots

**Situation: Enemy building mass Scouts (swarm composition)**

**Response Options:**
1. Build Flak Batteries on moons (hard counter)
2. Build Heavy Factories (Heavies crush Scouts)
3. Rush Gas Planet → Build Bombers (AoE destroys swarms)

**Situation: Enemy building Heavies**

**Response Options:**
1. Rush Tungsten Planet → Unlock Snipers (long-range counters)
2. Build mass Scouts (10 Scouts = 1 Heavy in cost, surround and swarm)
3. Build Bombers (high damage vs single target)

**Situation: Losing map control**

**Response Options:**
1. Defensive waypoint (pull back to your planet)
2. Build moon turrets (force multiplier)
3. Build Medics (sustain in long engagements)
4. Economic turtle (out-produce over time)
5. Counter-expand to different planet (map pressure trade)

---

### Late-Game Strategic Choices

**When Ahead:**
- Aggressive waypoint (push advantage)
- Build Bombers (siege enemy defenses)
- Upgrade factories (maximize production efficiency)
- Deny exotic resources (capture enemy's Crystal/Gas/Tungsten planets)

**When Behind:**
- Turtle with moon defenses
- Build cost-efficient units (Scouts, Soldiers)
- Sneak-capture undefended planet (tug-of-war comeback)
- All-in gambit (build 5 Heavy Factories, one massive push)
- Superweapon play (Orbital Cannon to destroy key enemy building)

**When Even:**
- Composition counter-play (identify enemy weakness)
- Economic investment (out-scale long-term)
- Tactical waypoint fakes (bait enemy into bad position)

---

## Player Actions & Input

### What Players Actually Do

**Strategic Layer (Most Time Spent):**
1. **Build structures** on planets (click planet → build menu → select building)
2. **Set waypoint** (click planet → fleet moves there)
3. **Upgrade buildings** (click building → upgrade menu)
4. **Manage economy** (decide: more factories or more gold mines?)
5. **Scout enemy composition** (watch their fleet, identify unit types)
6. **React to enemy strategy** (build counters, adjust composition)

**No Tactical Layer:**
- No unit selection
- No manual targeting
- No micro management
- No kiting or dodging
- No ability activation (MVP)

**Information Gathering:**
- Watch battles (see which units are winning/losing)
- Check enemy planet count (UI indicator)
- Estimate enemy income (based on planets controlled)
- Identify enemy unit types (visual recognition)

**Planning & Prediction:**
- Predict enemy next move
- Plan counter-composition
- Time factory construction (need Snipers ready when enemy Heavies arrive)
- Economic math (can I afford this? What's the ROI?)

---

## Pacing & Tempo

### Action Density Over Time

**Early Game (0-5 min):**
- Slow, deliberate
- 1-2 major decisions per minute
- Mostly building placement
- One major battle (Gold Planet)

**Mid Game (5-12 min):**
- Moderate pace
- 3-5 decisions per minute
- Composition adjustments
- Sustained Center Planet battle
- Economic scaling

**Late Game (12-20 min):**
- Frenetic
- 5-10 decisions per minute
- Constant building upgrades
- Multiple battles simultaneously (Phase 2 with multiple waypoints)
- Capital Planet siege

**Climax (18-20 min):**
- Maximum intensity
- Screen filled with ships
- Hundreds of units engaged
- Bomber runs, Sniper focus fire, massive fleet battles
- Victory imminent for one side

---

## Economy vs Military Balance

### Investment Payoff

**Gold Mine (80 gold):**
- Returns: +3 gold/sec
- Payback time: 26.7 seconds
- After 2 minutes: +360 gold value
- Long-term investment

**Scout Factory (50 gold):**
- Returns: 1 Scout every 45 sec (10 gold value each)
- Payback time: 225 seconds (3.75 minutes)
- Short-term military pressure

**Economic Advantage:**
- Investing in economy = compound growth
- 2 minutes of Gold Mines → afford 2 more factories
- Risk: Vulnerable during investment period

**Military Pressure:**
- Building factories = immediate units
- Can capture planets faster (which generate income)
- Risk: Lower income scaling long-term

**Optimal Balance:**
- Early: 60% military, 40% economy
- Mid: 50/50
- Late: 30% military, 70% economy (because each factory is producing continuously)

---

## Victory Patterns

### Dominant Victory (10-15 minutes)

**Pattern:**
- Win Gold Planet battle decisively
- Economic snowball (more income → more factories → more ships)
- Capture 5 planets by 10:00
- Enemy can't recover
- Victory by 15:00

**How to Achieve:**
- Strong opening build order
- Win first engagement
- Don't overextend (secure advantage, then scale economy)

---

### Comeback Victory (15-20 minutes)

**Pattern:**
- Lose early game (down 2-4 planets)
- Turtle with moon defenses
- Build economic base on remaining planets
- Tech rush (unlock Snipers/Bombers before enemy)
- Composition advantage overcomes numerical disadvantage
- Counter-attack captures 4-5 planets in rapid succession
- Victory by 18:00

**How to Achieve:**
- Don't panic
- Efficient defense (turrets > additional factories when behind)
- Scout enemy composition
- Build perfect counter
- One decisive battle swings momentum

---

### Epic Battle Victory (20+ minutes)

**Pattern:**
- Back-and-forth control of center planet
- Both players have strong economies
- 200+ ships on each side
- Multiple failed pushes
- One player makes small mistake (misses factory upgrade, bad waypoint)
- Other player capitalizes with surgical strike
- Victory by 22:00

**How to Achieve:**
- Consistent economic growth
- Don't make big mistakes
- Patience (wait for enemy mistake)
- Punish overextensions
- Final push must be overwhelming

---

## Psychological & Emotional Arc

### Player Experience Journey

**Minute 0-2: Curiosity & Anticipation**
- "What's my opening build order?"
- "Where will we first clash?"
- Calm, strategic planning

**Minute 2-5: First Contact**
- First battle at Gold Planet
- "Am I winning or losing?"
- Adrenaline spike
- Joy (if winning) or concern (if losing)

**Minute 5-8: Tension Building**
- Economy ramping up
- Fleets growing
- "When will the next big battle happen?"
- Strategic maneuvering

**Minute 8-12: Center Planet War**
- Sustained engagement
- Back-and-forth momentum
- High tension
- "I need to win this fight"

**Minute 12-16: Escalation**
- Hundreds of ships
- Massive battles
- Screen filled with action
- Excitement peaks

**Minute 16-20: Climax & Resolution**
- Capital Planet siege
- All-in pushes
- Desperation (if losing) or confidence (if winning)
- Victory or defeat
- Emotional release

**Post-Match: Reflection**
- "What went wrong/right?"
- "What's my build order next time?"
- "I want to play again"

---

## Comparison to Other Games

### What Fleet Strike Feels Like

**StarCraft (Macro Mode):**
- Similar: Base building, resource management, composition counters
- Different: No micro, auto-battles, continuous production

**Warcraft 3 Direct Strike (Auto-Battler):**
- Similar: Auto-combat, wave-based unit spawning, tug-of-war
- Different: Real-time (not turn-based), planetary expansion, larger scale

**Civilization (Expansion):**
- Similar: Territory control, resource unlocks, long-term planning
- Different: Real-time, combat-focused, 20-minute matches (not 6-hour campaigns)

**Starcraft 2 Co-op Commanders:**
- Similar: Pre-set starting conditions, escalating power, asymmetric abilities (Phase 2 factions)
- Different: Competitive 1v1, not PvE

**Unique Identity:**
- **"Macro without micro"** - Strategic depth without twitch mechanics
- **"Auto-battler meets RTS"** - Best of both genres
- **"Traffic controller for a galactic war"** - Manage the war, don't fight it yourself

---

## MVP vs Phase 2+ Differences

### MVP Limitations

✅ **Included:**
- Single waypoint per player
- Automatic nearest-enemy targeting
- Continuous factory production
- Tug-of-war planet capture
- 7-planet linear map
- 7 core units (Scout, Soldier, Heavy, Medic, Engineer, Bomber, Sniper)
- Moon turrets and defenses
- Win condition: Control all 7 planets

❌ **Deferred to Phase 2+:**
- Multiple waypoints (can't split fleet)
- Formation system (no hangar chess board)
- Admiral Ship (no assassination win condition)
- Ship abilities (no active skills)
- Advanced targeting (can't prioritize Medics)
- Fog of war (full vision initially)
- Non-linear maps
- Factions (asymmetric starting bonuses)

---

## Summary: Core Loop in One Sentence

**"Build factories on captured planets to automatically spawn ships that move toward your waypoint and engage enemies, capture more planets to unlock better units, and scale your economy until you control the entire galaxy."**

---

**End of Document**

*This game loop is designed for 20-minute competitive matches with strategic depth, clear win conditions, and room for skill expression through build orders, composition counters, and economic management - all without requiring twitch reflexes or micro management.*
