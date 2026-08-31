# Resources & Economy Document

## Overview

Fleet Strike features a **multi-resource economy** designed to create strategic depth through:
- **Gold:** Primary currency for all construction and production
- **Manpower:** Population limit preventing infinite unit spam
- **Exotic Resources:** Unlock gates for advanced unit types
- **Time-based income:** Resources generate per second (not per wave)
- **Economic scaling:** Early game is resource-starved, late game is abundant

**Philosophy:** Economy should reward expansion and risk-taking while providing comeback mechanics through efficient spending.

---

## Resource Types

### 1. Gold (Primary Currency)

**Purpose:** Universal resource for all buildings and ships

**Income Sources:**
- **Command Center (Home Planet):** 5 gold/sec (base income, permanent)
- **Gold Mines:** +3/5/8/12 gold/sec (Level 1/2/3/4)
- **Planet Capture:** Each controlled planet can host multiple Gold Mines
- **Gold Planet Bonus:** +50% gold generation from mines built there

**Starting Amount:** 165 gold

**Spending:**
- Ships (10-120 gold each)
- Buildings (50-800 gold each)
- Upgrades (100-1000 gold)

**Strategic Considerations:**
- **Early game scarcity:** First 3 minutes, every 50 gold is a major decision
- **Mid-game scaling:** 6-10 gold mines provide 20-40 gold/sec
- **Late game abundance:** 50+ gold/sec allows multiple simultaneous projects
- **Investment decision:** Build factories now or Gold Mines for later?

**No Gold Cap:** Unused gold accumulates indefinitely (encourages saving for big investments)

---

### 2. Manpower (Population)

**Purpose:** Limit total military production rate, prevent infinite unit spam

**Income Sources:**
- **Manpower Centers:** +2/4/7 manpower/sec (Level 1/2/3)
- **Starting income:** 0 manpower/sec base (must build Manpower Centers)

**Starting Amount:** 50 manpower (enough for initial production)

**Manpower Cap:** 200 base, +50 per Manpower Center built (soft cap, not hard limit)

**Spending:**
- Scout: 1 manpower
- Soldier: 2 manpower
- Heavy: 5 manpower
- Medic: 3 manpower
- Engineer: 3 manpower
- Bomber: 4 manpower
- Sniper: 3 manpower

**Regeneration:** Continuous generation (+2/4/7 per sec from centers)

**Strategic Considerations:**
- **Production bottleneck:** Can have 10 Scout Factories, but if manpower is 0, none produce
- **Composition constraint:** 1 Heavy = 5 Scouts in manpower cost
- **Long-term depletion:** Late game with 20+ factories can deplete manpower pool
- **Comeback mechanic:** Losing ships returns manpower to pool (death = resource refund)
- **Economic choice:** More Manpower Centers = larger army potential

**Example Scenario:**
```
Player has 50 manpower remaining
3 Scout Factories queued to produce (3 manpower needed)
2 Soldier Factories queued (4 manpower needed)
Total needed: 7 manpower

Result: Only first 5 factories produce this cycle
- 3 Scouts spawn (3 manpower used)
- 2 Soldiers spawn (4 manpower used)
Remaining: 43 manpower

Next cycle (45 seconds later):
Manpower regenerated: 45 seconds * 7 manpower/sec = ~315 manpower
Player now at manpower cap, all factories produce
```

---

### 3. Exotic Resources (Unlock Gates)

**Purpose:** Gate advanced unit types behind map control objectives

#### Crystal (Blue Resource)

**Unlocked By:** Capturing Crystal Planet (3rd from P1 home, 5th from P2 home)

**Used For:**
- **Medic Support Ships:** 0 crystals per ship (just need planet controlled)
- **Shield Frigates:** 20 crystals per ship (Phase 2)
- **Laser upgrades:** Unlock laser weapons for all units
- **Shield Generators (moon building):** 30 crystals per building
- **Repair Stations:** 15 crystals per building

**Generation:** 5 crystals/sec while planet controlled

**Starting Amount:** 0 crystals

**Storage Cap:** 500 crystals (prevents infinite hoarding)

**Strategic Value:**
- **Defensive composition enabler:** Medics + Shields = sustain-heavy army
- **High priority target:** Denying enemy Crystal = no Medics = low sustainability
- **Rush strategy:** Rush Crystal Planet early for Medic advantage

---

#### Gas (Orange Resource)

**Unlocked By:** Capturing Gas Planet (5th from P1 home, 3rd from P2 home)

**Used For:**
- **Demolition Bombers:** 20 gas per ship
- **Explosive ammo upgrades:** AoE damage for all units
- **Missile Silos (moon building):** 40 gas per building
- **Plasma Turrets:** 10 gas per building

**Generation:** 5 gas/sec while planet controlled

**Starting Amount:** 0 gas

**Storage Cap:** 500 gas

**Strategic Value:**
- **Offensive composition enabler:** Bombers + explosives = siege warfare
- **Structure destruction:** Essential for breaking fortified defenses
- **Asymmetric timing:** Closer to P2 home, P1 must push further to unlock

---

#### Tungsten (Gray Resource)

**Unlocked By:** Capturing Tungsten Planet (6th from P1 home, 2nd from P2 home)

**Used For:**
- **Sniper Frigates:** 15 tungsten per ship
- **Ram Ships:** 15 tungsten per ship (Phase 2)
- **Armor-piercing ammo upgrades:** +40% damage vs Heavy/Fortified armor
- **Orbital Cannon (superweapon):** 100 tungsten

**Generation:** 5 tungsten/sec while planet controlled

**Starting Amount:** 0 tungsten

**Storage Cap:** 500 tungsten

**Strategic Value:**
- **Anti-heavy counter:** Snipers essential for countering Heavy spam
- **Composition counter-play:** If enemy builds Heavies, rush Tungsten for Snipers
- **Asymmetric timing:** Closer to P2 home, P1 must push further to unlock

---

### Resource Comparison Table

| Resource | Starting | Generation | Cap | Used For | Unlock Condition |
|----------|----------|------------|-----|----------|------------------|
| **Gold** | 165 | 5-60/sec | None | Everything | Always available |
| **Manpower** | 50 | 0-21/sec | 200 (+50/center) | Ships | Always available |
| **Crystal** | 0 | 5/sec | 500 | Medics, Shields, Lasers | Capture Crystal Planet |
| **Gas** | 0 | 5/sec | 500 | Bombers, Explosives, Siege | Capture Gas Planet |
| **Tungsten** | 0 | 5/sec | 500 | Snipers, Armor-Piercing | Capture Tungsten Planet |

---

## Economic Buildings

### Gold Mine

**Cost:** 80 gold  
**Build Time:** 30 seconds  
**Power Usage:** 1 unit  
**Size:** 3x3 building slots (planet only)

**Income:**
- **Level 1:** +3 gold/sec
- **Level 2:** +5 gold/sec (100 gold upgrade)
- **Level 3:** +8 gold/sec (200 gold upgrade)
- **Level 4:** +12 gold/sec (400 gold upgrade)

**Total Investment:**
- Level 4 Mine: 780 gold total
- Returns: +12 gold/sec = 65 second payback
- After 5 minutes: +3600 gold generated (4.6x ROI)

**Gold Planet Bonus:**
- Mines built on Gold Planet: +50% generation
- Level 4 Mine on Gold Planet: 12 * 1.5 = **18 gold/sec**

**Strategic Use:**
- **Early game:** Build 1-2 mines for baseline income
- **Mid game:** Upgrade to Level 2-3 for scaling
- **Late game:** Fill Gold Planet with Level 4 mines (5-6 mines = 90+ gold/sec)
- **Economic boom strategy:** Build 4+ mines before factories (delayed military, massive late-game economy)

---

### Manpower Center

**Cost:** 100 gold  
**Build Time:** 40 seconds  
**Power Usage:** 2 units  
**Size:** 4x4 building slots (planet only)

**Income:**
- **Level 1:** +2 manpower/sec, +50 manpower cap
- **Level 2:** +4 manpower/sec, +100 manpower cap (150 gold upgrade)
- **Level 3:** +7 manpower/sec, +150 manpower cap (300 gold upgrade)

**Total Investment:**
- Level 3 Center: 550 gold total
- Returns: +7 manpower/sec, +150 cap

**Strategic Use:**
- **Early game:** Build 1 center to enable continuous production
- **Mid game:** 2-3 centers ensure manpower never bottlenecks
- **Late game:** 4+ centers support 20+ factories producing simultaneously
- **Heavy composition:** More centers needed (Heavies cost 5 manpower each)
- **Scout swarm:** Fewer centers needed (Scouts cost 1 manpower each)

**Manpower Math Example:**
```
Scenario: 10 Scout Factories producing every 45 seconds
- Manpower cost per cycle: 10 scouts * 1 manpower = 10 manpower
- Cycles per minute: 60 / 45 = 1.33 cycles
- Manpower needed per minute: 10 * 1.33 = 13.3 manpower/min

Required Manpower Centers:
- 13.3 manpower/min = 0.22 manpower/sec
- 1 Level 1 Center (+2 manpower/sec) is sufficient
- Excess manpower stockpiles for burst production
```

---

### Power Plant

**Cost:** 120 gold  
**Build Time:** 35 seconds  
**Size:** 5x5 building slots (planet only)

**Effect:**
- **Level 1:** +10 power units
- **Level 2:** +15 power units (180 gold upgrade)
- **Level 3:** +25 power units (350 gold upgrade)

**Power System:**
- Each building consumes power:
  - Scout Factory: 1 power
  - Soldier Factory: 2 power
  - Heavy Factory: 5 power
  - Gold Mine: 1 power
  - Manpower Center: 2 power
- Planets start with 10 base power (can build ~5 basic buildings)
- Power Plants unlock more construction

**Strategic Use:**
- **Early game:** Not needed (base power sufficient)
- **Mid game:** Build 1 Power Plant when hitting power cap (~8-10 buildings)
- **Late game:** 2-3 Power Plants per planet to support 20+ buildings
- **No power penalty:** Can't build if insufficient power (hard gate, not efficiency loss)

---

### Research Lab

**Cost:** 200 gold  
**Build Time:** 50 seconds  
**Power Usage:** 3 units  
**Size:** 5x5 building slots (planet only)

**Effect:**
- **Level 1:** Unlock building upgrades, -15% upgrade costs
- **Level 2:** -25% upgrade costs, +5% factory production speed (300 gold)
- **Level 3:** -40% upgrade costs, unlock advanced unit variants, +10% production speed (600 gold)

**Strategic Use:**
- **Mid game unlock:** Build around minute 5-8 to enable factory upgrades
- **Cost savings:** -40% upgrade costs = 400 gold saved on Heavy Factory Level 3 upgrade
- **Production bonus:** +10% speed = 45 sec production → 40.5 sec (effective +10% unit output)
- **Phase 2 unlock:** Advanced variants (Scouts with rockets, Soldiers with shields)

**ROI Calculation:**
```
Research Lab Level 3: 1100 gold total investment
Savings on 10 factory upgrades (avg 300 gold each):
- Without Lab: 10 * 300 = 3000 gold
- With Lab (-40%): 10 * 180 = 1800 gold
- Savings: 1200 gold
- Net profit: 1200 - 1100 = +100 gold (plus production bonuses)
- Payback: After ~8-10 upgrades
```

---

## Economic Strategies

### Strategy 1: Fast Expand (Military-First)

**Build Order (First 2 minutes):**
1. Scout Factory (50 gold) - 0:30
2. Soldier Factory (100 gold) - 1:10
3. Gold Mine (80 gold) - 1:40
4. Push to capture Gold Planet with starting army + reinforcements

**Strengths:**
- Early military advantage
- Capture Gold Planet fast (economic spike at ~3:00)
- Pressure enemy immediately

**Weaknesses:**
- Low income (only 8 gold/sec until Gold Mine completes)
- Vulnerable if first battle lost
- Slower scaling into mid-game

**Best When:**
- Confident in micro/positioning
- Enemy playing greedy (heavy economy)
- Need map control quickly

---

### Strategy 2: Economic Boom (Greedy)

**Build Order (First 2 minutes):**
1. Gold Mine (80 gold) - 0:30
2. Gold Mine (80 gold) - 1:00
3. Manpower Center (100 gold) - 1:40
4. Scout Factory (50 gold) - 2:10
5. Soldier Factory (100 gold) - 2:50

**Strengths:**
- 11 gold/sec by minute 2 (vs 5 base)
- Strong mid-game economy
- Can afford more factories at minute 5-8

**Weaknesses:**
- Weak early military (relies on starting army only)
- Loses Gold Planet if enemy rushes
- High risk if enemy pushes immediately

**Best When:**
- Enemy also playing economic
- Confident in defense with turrets/starting army
- Planning for late-game dominance

---

### Strategy 3: Balanced (Standard)

**Build Order (First 2 minutes):**
1. Scout Factory (50 gold) - 0:30
2. Gold Mine (80 gold) - 1:00
3. Soldier Factory (100 gold) - 1:40
4. Manpower Center (100 gold) - 2:20

**Strengths:**
- Balanced military and economy
- Adaptable to enemy strategy
- Safe, consistent progression

**Weaknesses:**
- Not exceptional at anything
- Can be out-scaled by greedy builds
- Can be out-pressured by military rushes

**Best When:**
- Uncertain of enemy strategy
- Learning the game
- Want safe, reliable play

---

### Strategy 4: Engineer Rush (Specialist)

**Build Order (First 2 minutes):**
1. Engineer Workshop (150 gold) - 0:40
2. Engineer Workshop (150 gold) - 1:20
3. Send starting army + 2 Engineers to capture planets

**Strengths:**
- Engineers have 2x capture rate
- Can capture 2-3 planets very quickly (by minute 4-5)
- Massive economic advantage if successful

**Weaknesses:**
- Engineers weak in combat (140 HP, 22.5 DPS)
- Must escort with starting army
- If Engineers killed, lost 300 gold and have no military production

**Best When:**
- Map control strategy
- Opponent slow to expand
- High-risk, high-reward playstyle

---

### Strategy 5: Heavy Rush (All-In)

**Build Order (First 5 minutes):**
1. Save gold (no spending until 400 gold)
2. Heavy Factory (400 gold) - 2:30
3. Heavy Factory (400 gold) - 4:45
4. Manpower Center (100 gold) - 5:15
5. All-in push with Heavies + starting army at ~6:00

**Strengths:**
- Heavies dominate Scouts and Soldiers (600 HP, 180 DPS)
- Psychological impact (intimidating)
- Can steamroll unprepared enemy

**Weaknesses:**
- Extremely weak before Heavies arrive (~3:00 mark)
- Countered by Snipers (if enemy rushes Tungsten Planet)
- Countered by Scout swarms (10 Scouts = 1 Heavy in cost)
- Low income (no Gold Mines)

**Best When:**
- Enemy overextends early (you turtle, then counter)
- Enemy has no Tungsten Planet (no Snipers)
- Timing attack to hit before enemy scales

---

## Resource Generation Timeline (Example Match)

**Minute 0:00**
- Gold: 165 (starting)
- Income: 5 gold/sec (Command Center)
- Manpower: 50 (starting)
- Income: 0 manpower/sec

**Minute 1:00**
- Gold: 165 + (5 * 60) = 225 gold
- Built: Scout Factory (50g), Gold Mine (80g)
- Remaining: 95 gold
- Income: 8 gold/sec (Command Center + Mine Level 1)

**Minute 2:00**
- Gold: 95 + (8 * 60) = 575 gold
- Built: Soldier Factory (100g), Manpower Center (100g)
- Remaining: 375 gold
- Income: 8 gold/sec, 2 manpower/sec

**Minute 3:00**
- Gold: 375 + (8 * 60) = 855 gold
- Captured: Gold Planet
- Built: Gold Mine on Gold Planet (80g), Scout Factory (50g)
- Remaining: 725 gold
- Income: 12.5 gold/sec (3 mines, one with +50% bonus), 2 manpower/sec

**Minute 5:00**
- Gold: 725 + (12.5 * 120) = 2225 gold
- Built: Heavy Factory (400g), 2x Gold Mines (160g), Upgrade Scout Factory to Level 2 (100g)
- Remaining: 1565 gold
- Income: 18.5 gold/sec, 2 manpower/sec

**Minute 8:00**
- Gold: 1565 + (18.5 * 180) = 4895 gold
- Captured: Crystal Planet, Center Planet
- Built: Medic Bay (200g + 10 crystals), 3x Soldier Factories (300g), 2x Moon Turrets (300g)
- Remaining: 4095 gold
- Income: 25 gold/sec, 2 manpower/sec, 5 crystal/sec

**Minute 12:00**
- Gold: 4095 + (25 * 240) = 10095 gold
- Built: 5x Heavy Factories (2000g), Research Lab (200g), Manpower Center Level 2 upgrade (150g)
- Built: Multiple factory upgrades (~1000g total)
- Remaining: 6745 gold
- Income: 30 gold/sec, 4 manpower/sec, 5 crystal/sec

**Minute 15:00**
- Gold: 6745 + (30 * 180) = 12145 gold
- Captured: Gas Planet, Tungsten Planet
- Built: Bomber Facility (300g + 20 gas), Sniper Dock (250g + 15 tungsten)
- Built: 3x Missile Silos (1050g + 120 gas)
- Remaining: 10545 gold
- Income: 35 gold/sec, 4 manpower/sec, 5 of each exotic/sec

**Minute 20:00**
- Gold: 10545 + (35 * 300) = 21045 gold
- Economy fully scaled
- 25+ factories producing continuously
- 200-300 ships active
- Income: 50+ gold/sec, 7+ manpower/sec, all exotics unlocked

---

## Economic Metrics & Benchmarks

### Income Benchmarks (Gold/sec)

| Time | Weak Economy | Average Economy | Strong Economy |
|------|--------------|-----------------|----------------|
| 1:00 | 5 | 8 | 11 |
| 3:00 | 8 | 12 | 18 |
| 5:00 | 12 | 18 | 28 |
| 8:00 | 18 | 25 | 38 |
| 12:00 | 25 | 35 | 50+ |

### Planet Control Benchmarks

| Time | Behind | Even | Ahead |
|------|--------|------|-------|
| 2:00 | 1 planet | 2 planets | 3 planets |
| 5:00 | 2 planets | 3 planets | 4-5 planets |
| 10:00 | 3 planets | 4-5 planets | 6 planets |
| 15:00 | 4 planets | 5-6 planets | 7 planets (victory) |

### Factory Count Benchmarks

| Time | Low Production | Medium Production | High Production |
|------|----------------|-------------------|-----------------|
| 2:00 | 1 factory | 2 factories | 3 factories |
| 5:00 | 3 factories | 5 factories | 7 factories |
| 10:00 | 6 factories | 10 factories | 15 factories |
| 15:00 | 10 factories | 15 factories | 25+ factories |

---

## Resource Denial Strategies

### Exotic Resource Denial

**Objective:** Prevent enemy from unlocking advanced units

**Tactics:**
1. **Rush enemy's nearest exotic planet:**
   - P1 rushes Tungsten (closer to P2) before P2 can secure it
   - Denies enemy Snipers (anti-Heavy counter)
   
2. **Hold center, trade flanks:**
   - Control Center Planet (psychological advantage)
   - Let enemy take one exotic, you take another
   - Force composition diversity

3. **Recapture after loss:**
   - If enemy builds Medics (captured Crystal), prioritize recapturing Crystal
   - Cuts off future Medic production (existing Medics still alive)

**Impact:**
- Enemy without Crystal: No sustainability (no Medics/Shields)
- Enemy without Gas: No siege weapons (can't destroy turrets efficiently)
- Enemy without Tungsten: No anti-Heavy counters (Heavy spam viable)

---

### Economic Harassment

**Objective:** Delay enemy economy without full commitment

**Tactics:**
1. **Bomber strikes on Gold Mines:**
   - 1-2 Bombers destroy Level 3 Gold Mine (120 damage bomb vs building)
   - Enemy loses 380 gold investment + future income
   - Costs you 160 gold (2 Bombers) for 380 gold denial

2. **Engineer assassination:**
   - Snipe enemy Engineers (140 HP, easy kill)
   - Prevents fast captures (Engineers have 2x capture rate)

3. **Moon turret destruction:**
   - Bombers destroy moon turrets before planet push
   - Reduces defensive effectiveness by 50-80%

4. **Blockade planets:**
   - Park fleet near enemy planet (prevents capture attempts)
   - Forces enemy to commit military to clear blockade

---

## Economic Comebacks

**Scenario: Down 2-3 planets, losing map control**

### Comeback Strategy 1: Efficient Defense

1. **Build moon turrets** (150-200 gold each)
   - 1 turret = equivalent defensive power of 3-4 Soldiers
   - 3 turrets per moon = strong defensive line
   
2. **Turtle on 2-3 planets:**
   - Max out Gold Mines on controlled planets
   - Focus economy over military expansion
   
3. **Composition counter:**
   - Scout enemy fleet (identify Heavy spam, Scout swarm, etc.)
   - Build perfect counter (Snipers for Heavies, Flak for Scouts)
   
4. **Quality over quantity:**
   - Upgrade factories to Level 3 (+200 HP, +15 DPS on Heavies)
   - Research Lab for production bonuses
   - Fewer but stronger units

5. **Wait for enemy mistake:**
   - Enemy overextends (leaves home planet undefended)
   - Counter-attack with concentrated force
   - Capture 2 planets quickly, swing momentum

---

### Comeback Strategy 2: Tech Rush

1. **Identify enemy weakness:**
   - Enemy has no Crystal Planet → Build Heavy spam (no Medics to counter)
   - Enemy has no Tungsten → Safe to build Heavy composition
   
2. **Rush the exotic they don't have:**
   - Sneak capture Gas Planet → Unlock Bombers
   - Use Bombers to siege enemy defenses
   
3. **Timing attack:**
   - Enemy doesn't expect tech switch
   - Bombers destroy turrets → Open path to capture
   
4. **Compound advantage:**
   - Use captured planets for more economy
   - Scale production quickly

---

### Comeback Strategy 3: All-In Gambit

1. **Sell everything** (conceptually - no literal selling, but stop economy):
   - Stop building Gold Mines, Manpower Centers
   - Invest 100% into military factories
   
2. **Build 5+ Heavy Factories:**
   - Commit to single massive push
   - Time attack for when Heavies complete (~2-3 minutes prep)
   
3. **One decisive battle:**
   - Attack with overwhelming force (30+ Heavies)
   - If you win → Capture 3-4 planets → Comeback complete
   - If you lose → Game over (all-in failed)

**Risk:** High  
**Reward:** High  
**When to use:** Desperate situation, losing slowly, need to force a climactic battle

---

## Resource UI & Feedback

### Resource Display (HUD)

**Top-left corner:**
```
Gold: 1250 (+18/sec)
Manpower: 85/200 (+4/sec)
Crystal: 120/500 (+5/sec) [if Crystal Planet controlled]
Gas: 0/500 (locked) [if Gas Planet not controlled]
Tungsten: 240/500 (+5/sec) [if Tungsten Planet controlled]
```

**Color Coding:**
- Green: Resource generating normally
- Yellow: Resource near cap (90%+)
- Red: Resource depleted (0)
- Gray: Resource locked (exotic planet not controlled)

**Visual Feedback:**
- Gold icon pulses when Gold Mine completes construction
- Manpower bar flashes red when all factories stalled (insufficient manpower)
- Exotic resource icons glow when planet captured (unlock notification)

---

### Resource Shortage Warnings

**Insufficient Gold:**
- Building/ship grayed out in UI (can't afford)
- Tooltip shows deficit: "Need 50 more gold"

**Insufficient Manpower:**
- Factory icon shows "stalled" state (paused production)
- Tooltip: "Waiting for 3 manpower"
- Audio cue: "Manpower reserves depleted"

**Insufficient Exotic Resource:**
- Unit type locked (grayed out)
- Tooltip: "Capture Crystal Planet to unlock Medic Support Ships"
- Visual: Planet icon highlighted on map (shows objective)

---

## Economic Balance Philosophy

### Design Goals

1. **Scarcity creates decisions:**
   - Early game: "Can I afford this factory or should I save?"
   - Mid game: "Do I upgrade or build new factories?"
   - Late game: "Which superweapon do I build first?"

2. **Expansion rewards risk:**
   - Capturing planets = more Gold Mines = more income = stronger economy
   - Risk: Overextending leaves home planet vulnerable

3. **Comeback mechanics:**
   - Efficient spending beats wasteful spending
   - Small economies can beat large economies with good composition
   - Turrets (force multipliers) make defense easier than offense

4. **No hard counters, only advantages:**
   - Heavies counter Scouts (~70% win rate), but 10 Scouts beat 1 Heavy
   - Snipers counter Heavies (~80% win rate), but Scouts beat Snipers
   - Rock-paper-scissors with economic costs balancing strength

5. **Time-based income prevents turtling:**
   - Resources generate per second (not per wave)
   - Turtling = low income (fewer planets)
   - Aggressive expansion = high income = long-term advantage

6. **Exotics gate power spikes:**
   - All basic units available from start (Scouts, Soldiers, Heavies)
   - Advanced units require map control (Medics, Bombers, Snipers)
   - Encourages fighting over specific planets

---

## Economic Events (Phase 2+)

**Not in MVP, but planned:**

### Comet Mining
- Comet appears every 3-4 minutes
- Mineable for 500 bonus gold
- Risk: Comet is contested (both players can mine)

### Resource Shortages
- Random event: Gold generation -50% for 60 seconds
- Forces adaptation, tests stockpiled resources

### Smuggler Offers
- NPC offers trade: 200 gold for 50 crystals
- Economic conversion opportunity

### Pirate Raids
- NPC pirates attack gold convoys
- Lose 10% gold income for 30 seconds unless defended

---

## Summary: Economic Principles

✅ **Gold is universal** - Everything costs gold  
✅ **Manpower prevents spam** - Limits production rate  
✅ **Exotics gate advanced units** - Map control unlocks power  
✅ **Per-second generation** - Continuous income, no waves  
✅ **Expansion = more income** - Capturing planets scales economy  
✅ **Upgrades multiply efficiency** - Level 4 Gold Mine = 4x Level 1  
✅ **Comeback mechanics exist** - Efficient spending beats wasteful spending  
✅ **No resource trading** (MVP) - Can't convert gold to manpower, forces diverse building  
✅ **Transparent costs** - All costs visible before building (no hidden fees)

**Core Economic Loop:**
```
Capture Planets → Build Gold Mines → Generate Income → 
Build Factories → Produce Ships → Capture More Planets → 
Unlock Exotics → Build Advanced Units → Win Game
```

---

**End of Document**

*Economy designed to create strategic depth through scarcity, reward expansion, enable comebacks, and maintain clear cost/benefit tradeoffs for all decisions.*
