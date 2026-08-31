# Fleet Strike - Complete Units & Buildings Reference

This document contains comprehensive stats, descriptions, and specifications for all game entities including ships, buildings, turrets, and structures.

---

## Table of Contents

1. [Weapon Types](#weapon-types)
2. [Armor Types](#armor-types)
3. [Ships - MVP Core Units](#ships---mvp-core-units)
4. [Ships - Phase 2 Expansion](#ships---phase-2-expansion)
5. [Planet Buildings](#planet-buildings)
6. [Moon Buildings](#moon-buildings)
7. [Admiral Ships](#admiral-ships-phase-2)
8. [Special Structures](#special-structures)

---

## Weapon Types

### Laser
- **Damage Type:** Energy
- **Projectile Speed:** Instant (speed of light)
- **Range:** Long (800 units)
- **Special Properties:** Straight line, super effective against shields and electronics
- **Visual:** Bright beam, red/blue depending on team color
- **Sound:** High-pitched sustained hum

### Flak Cannon
- **Damage Type:** Explosive Shrapnel
- **Projectile Speed:** Medium (400 units/sec)
- **Range:** Medium (500 units)
- **Special Properties:** Shotgun spread, anti-swarm, can be upgraded to explode on proximity
- **Effective Against:** Scout swarms, light armor
- **Visual:** Orange muzzle flash, scattered projectiles
- **Sound:** Rapid staccato bursts

### Bullets (Small/Medium/Large Caliber)
- **Damage Type:** Kinetic
- **Projectile Speed:** Slow-Medium (200-350 units/sec, larger = slower)
- **Range:** Medium (450 units)
- **Special Properties:** Cheap, reliable, can upgrade to armor-piercing/explosive/incendiary
- **Visual:** Yellow/white tracers
- **Sound:** Distinctive caliber sounds (plink/bang/boom)

### Rockets
- **Damage Type:** Explosive
- **Projectile Speed:** Slow (150 units/sec)
- **Range:** Long (700 units)
- **Special Properties:** Heat-seeking tracking, can be outmaneuvered by fast ships, shootable
- **Visual:** Smoke trail, glowing engine
- **Sound:** Whoosh and delayed explosion

### Repair Beam (Medic)
- **Damage Type:** N/A (Healing)
- **Projectile Speed:** Instant (beam)
- **Range:** Short (300 units)
- **Special Properties:** Area of effect, can heal multiple nearby ships
- **Visual:** Green/cyan pulsing beam
- **Sound:** Gentle electronic hum

---

## Armor Types

### Light Armor
- **Damage Reduction:** 0-10%
- **Effective Against:** Small caliber bullets
- **Weak To:** All heavy weapons
- **Typical Units:** Scout, Spy, Miner

### Medium Armor
- **Damage Reduction:** 15-25%
- **Effective Against:** Small/medium bullets, flak
- **Weak To:** Large caliber, rockets, lasers
- **Typical Units:** Soldier, Engineer, Medic

### Heavy Armor
- **Damage Reduction:** 30-50%
- **Effective Against:** Most projectiles except armor-piercing
- **Weak To:** Armor-piercing rounds, concentrated fire
- **Typical Units:** Heavy, Demo, Shield Ship

### Fortified Armor
- **Damage Reduction:** 60-75%
- **Effective Against:** All standard weapons
- **Weak To:** Siege weapons, sustained bombardment
- **Typical Units:** Turrets, Admiral Ship, Planetary Structures

---

## Ships - MVP Core Units

### Scout Fighter
**"Swift Interceptor"**

**Role:** Fast reconnaissance and swarm fighter

**Stats:**
- **Cost:** 10 Gold, 1 Manpower
- **Build Time:** 45 seconds
- **Hit Points:** 80 HP
- **Armor Type:** Light
- **Movement Speed:** 220 units/sec (min 80, max 220)
- **Turn Radius:** 45° (highly agile)
- **Weapon:** Small Caliber Bullets
- **Damage:** 8 per shot
- **Rate of Fire:** 2 shots/second
- **DPS:** 16
- **Range:** 400 units
- **Size:** Small (5x3 units)

**Description:**
A nimble, dart-shaped fighter with sleek lines and minimal armor plating. Features swept-back wings with small thrusters. Cockpit canopy glows with team color accent. Fast enough to outrun most threats but fragile under fire.

**Color Scheme:** 
- Primary: Light gray metallic
- Accents: Team color (cockpit glow, engine trails)
- Weapons: White bullet tracers

**Tactical Use:**
- Cheap spam unit for early game
- Scout enemy positions
- Overwhelm slow targets with numbers
- 10 Scouts ≈ 1 Heavy in cost

**Counters:**
- Strong vs: Miners, Snipers (can close distance)
- Weak vs: Flak, AoE weapons, Heavies

---

### Soldier Fighter
**"Versatile Striker"**

**Role:** Balanced all-purpose fighter

**Stats:**
- **Cost:** 25 Gold, 2 Manpower
- **Build Time:** 45 seconds
- **Hit Points:** 180 HP
- **Armor Type:** Medium
- **Movement Speed:** 160 units/sec (min 60, max 160)
- **Turn Radius:** 60° (moderate agility)
- **Weapons:** Dual - Small Rockets + Medium Bullets
  - Rockets: 40 damage, 0.5 shots/sec, 600 range
  - Bullets: 12 damage, 3 shots/sec, 450 range
- **Combined DPS:** 56 (20 rockets + 36 bullets)
- **Size:** Medium (8x5 units)

**Description:**
Robust, angular fighter with visible rocket pods on wing hardpoints. Chunky fuselage with reinforced plating. Dual engines produce blue thrust trails. The workhorse of any fleet.

**Color Scheme:**
- Primary: Dark gray military finish
- Accents: Team color (nose stripe, engine glow)
- Weapons: Yellow tracers, white rocket smoke

**Tactical Use:**
- Frontline fighter for all stages of game
- Can engage at multiple ranges
- Good against most targets
- Solid mid-game investment

**Counters:**
- Strong vs: Scouts, Light units
- Neutral vs: Other Soldiers, Medics
- Weak vs: Heavies, concentrated firepower

---

### Heavy Gunship
**"Assault Juggernaut"**

**Role:** Slow tank with massive firepower

**Stats:**
- **Cost:** 100 Gold, 5 Manpower
- **Build Time:** 45 seconds
- **Hit Points:** 600 HP
- **Armor Type:** Heavy
- **Movement Speed:** 80 units/sec (min 40, max 80)
- **Turn Radius:** 90° (poor agility)
- **Weapon:** Dual Large Caliber Cannons + Flak Turret
  - Cannons: 60 damage, 1 shot/sec each, 500 range
  - Flak: 20 damage spread, 3 bursts/sec, 450 range
- **Combined DPS:** 180 (120 cannons + 60 flak)
- **Size:** Large (15x10 units)

**Description:**
Massive, imposing ship with thick armor plating and rotating gun turrets. Bulky rectangular frame with heavy thruster arrays. Slow and methodical. Red warning lights pulse along hull. Dominates through raw power.

**Color Scheme:**
- Primary: Gunmetal gray with rust accents
- Accents: Team color (warning lights, turret housings)
- Weapons: Orange muzzle flashes, yellow flak spread

**Tactical Use:**
- Absorbs damage for the fleet
- Devastating against groups
- Game-changer in late game
- Requires support units
- 1 Heavy ≈ 10 Scouts in cost

**Counters:**
- Strong vs: Swarms, Soldiers, Light units
- Neutral vs: Other Heavies
- Weak vs: Snipers, coordinated focus fire, mobility

---

### Medic Support Ship
**"Field Hospital"**

**Role:** Fleet healer and force multiplier

**Stats:**
- **Cost:** 60 Gold, 3 Manpower
- **Build Time:** 45 seconds
- **Hit Points:** 150 HP
- **Armor Type:** Medium
- **Movement Speed:** 120 units/sec (min 50, max 120)
- **Turn Radius:** 55° (moderate agility)
- **Weapon:** Repair Beam Array (3 simultaneous beams)
  - Healing: 30 HP/sec per beam
  - Range: 300 units
  - Can target 3 different ships
- **Self-Defense:** Small Caliber Point Defense (8 DPS, 350 range)
- **Size:** Medium (10x7 units)

**Description:**
Bulbous hull with glowing repair bay modules. Extended antenna arrays for targeting wounded ships. White with red cross-style markings. Gentle pulsing light from repair systems. Non-threatening appearance but high value target.

**Color Scheme:**
- Primary: White with gray panels
- Accents: Team color + universal medical red cross
- Weapons: Green/cyan healing beams, white defense tracers

**Tactical Use:**
- Keep behind front lines
- Extend fleet survivability dramatically
- High priority target for enemies
- Group with Heavies for durability
- Essential for prolonged engagements

**Counters:**
- Strong vs: Wars of attrition
- Weak vs: Burst damage, Snipers, focused fire
- Vulnerable when isolated

---

### Engineer Constructor
**"Planetary Specialist"**

**Role:** Planet capture and structure building

**Stats:**
- **Cost:** 50 Gold, 3 Manpower
- **Build Time:** 45 seconds
- **Hit Points:** 140 HP
- **Armor Type:** Medium
- **Movement Speed:** 100 units/sec (min 45, max 100)
- **Turn Radius:** 65° (moderate agility)
- **Weapon:** Welding Laser (defensive only)
  - Damage: 15 per shot
  - Rate of Fire: 1.5 shots/sec
  - DPS: 22.5
  - Range: 350 units
- **Special Ability:** Generates 2x capture points when near planets
- **Size:** Medium (9x6 units with extended tool arms)

**Description:**
Industrial-looking ship with mechanical arms and tool arrays. Cargo bay visible with construction materials. Utilitarian design with exposed framework. Yellow hazard stripes on hull. Built for work, not war.

**Color Scheme:**
- Primary: Industrial yellow with gray
- Accents: Team color (cargo bay highlights, hazard stripes)
- Weapons: Blue-white welding arc

**Tactical Use:**
- Essential for fast planet captures
- Can build defensive structures (Phase 2)
- Poor combat ability
- Send with military escort
- Key to early game expansion

**Counters:**
- Strong vs: Nothing (support role)
- Weak vs: Everything (avoid combat)
- Requires protection

---

### Demolition Bomber
**"Siege Breaker"**

**Role:** AoE damage and structure destruction

**Stats:**
- **Cost:** 80 Gold, 4 Manpower
- **Build Time:** 45 seconds
- **Hit Points:** 220 HP
- **Armor Type:** Medium-Heavy
- **Movement Speed:** 110 units/sec (min 50, max 110)
- **Turn Radius:** 75° (low agility)
- **Weapon:** Heavy Bomb Bay + Rocket Pods
  - Bombs: 120 damage, 150 AoE radius, 0.4 drops/sec, 500 range
  - Rockets: 35 damage, 0.8 shots/sec, 650 range
- **Combined DPS:** 76 (48 bombs + 28 rockets), much higher vs groups
- **Size:** Large (12x8 units)

**Description:**
Heavily armored bomber with prominent bomb bay doors. Reinforced underbelly plating. Bulky frame with powerful engines. Intimidating presence with visible payload. Orange warning markings near ordnance.

**Color Scheme:**
- Primary: Olive drab with black panels
- Accents: Team color (tail fin, engine glow) + orange hazard stripes
- Weapons: Bright orange explosions, white rocket trails

**Tactical Use:**
- Devastating vs grouped enemies
- Excellent vs structures and turrets
- Break defensive lines
- Slow and vulnerable to interceptors
- High impact in fleet battles

**Counters:**
- Strong vs: Grouped units, structures, Heavies
- Weak vs: Scouts (can be swarmed), Snipers, anti-air

---

### Sniper Frigate
**"Precision Eliminator"**

**Role:** Long-range assassin

**Stats:**
- **Cost:** 70 Gold, 3 Manpower
- **Build Time:** 45 seconds
- **Hit Points:** 110 HP
- **Armor Type:** Light
- **Movement Speed:** 90 units/sec (min 40, max 90)
- **Turn Radius:** 80° (poor agility, positioning ship)
- **Weapon:** Heavy Laser Cannon
  - Damage: 150 per shot
  - Rate of Fire: 0.5 shots/sec
  - DPS: 75 (burst damage)
  - Range: 900 units (longest in game)
  - Charge Time: 2 seconds
- **Size:** Medium-Large (11x6 units, elongated)

**Description:**
Sleek, elongated frame with massive focusing lens at bow. Long barrel-like structure with cooling fins. Minimal armor for maximum range-finding sensors. Glows intensely when charging shot. Built for precision, not brawling.

**Color Scheme:**
- Primary: Matte black with silver sensor arrays
- Accents: Team color (scope highlights, charge glow)
- Weapons: Intense red/blue laser beam with lens flare

**Tactical Use:**
- Pick off high-value targets (Medics, Engineers)
- Stay at max range
- Vulnerable if rushed
- Devastating alpha strike
- Support unit, not frontline

**Counters:**
- Strong vs: Heavies, Medics, slow targets
- Weak vs: Scouts (mobility), close combat
- Needs protection and positioning

---

## Ships - Phase 2 Expansion

### Spy Infiltrator
**"Shadow Operative"**

**Role:** Stealth reconnaissance and sabotage

**Stats:**
- **Cost:** 90 Gold, 4 Manpower
- **Build Time:** 60 seconds
- **Hit Points:** 100 HP
- **Armor Type:** Light
- **Movement Speed:** 180 units/sec (min 70, max 180)
- **Turn Radius:** 40° (highly agile)
- **Weapon:** Silenced Laser Pistols
  - Damage: 25 per shot
  - Rate of Fire: 1 shot/sec
  - DPS: 25 (low, not primary role)
  - Range: 400 units
- **Special Ability:** Cloaking (invisible until attacking or near enemies)
- **Special Ability 2:** Can sabotage enemy buildings
- **Size:** Small (6x4 units)

**Description:**
Extremely sleek, almost organic curves. Minimal profile with active camouflage panels. No visible weapons. Dark coloration with shimmer effect when cloaked. Mysterious and threatening.

**Color Scheme:**
- Primary: Matte black with blue shimmer
- Accents: Team color (barely visible, subtle engine glow)
- Weapons: Dim purple laser flashes
- Cloaked: Translucent outline with refraction distortion

**Tactical Use:**
- Scout enemy territory undetected
- Sabotage enemy economy
- Assassinate isolated targets
- Psychological warfare
- Advanced tactics required

**Counters:**
- Strong vs: Undefended targets, isolated units
- Weak vs: Radar, Scouts (detection), groups
- High skill ceiling

---

### Shield Frigate
**"Aegis Protector"**

**Role:** Mobile defensive platform

**Stats:**
- **Cost:** 85 Gold, 4 Manpower, 20 Crystals
- **Build Time:** 45 seconds
- **Hit Points:** 200 HP + 300 Shield HP
- **Armor Type:** Medium
- **Movement Speed:** 100 units/sec (min 45, max 100)
- **Turn Radius:** 70°
- **Weapon:** Point Defense Laser Array
  - Damage: 10 per shot
  - Rate of Fire: 4 shots/sec
  - DPS: 40
  - Range: 400 units
  - Can intercept projectiles
- **Special Ability:** Projects shield bubble (400 radius) protecting nearby allies
- **Size:** Large (13x9 units)

**Description:**
Bulky frame with massive shield generator dome. Glowing energy field visible around hull. Angular armor with crystal arrays. Blue pulsing lights from shield emitters. Guardian appearance.

**Color Scheme:**
- Primary: Metallic blue-gray with white panels
- Accents: Team color (shield bubble tint, accent lights)
- Weapons: Bright blue point defense lasers
- Shield: Translucent hexagonal energy field

**Tactical Use:**
- Protect high-value ships (Medics, Snipers)
- Counter rocket/projectile heavy enemies
- Push through defensive fire
- Requires Crystal resource
- Force multiplier in fleet battles

**Counters:**
- Strong vs: Projectile weapons, rockets
- Weak vs: Lasers (pass through shields), sustained fire
- Shield can be overwhelmed

---

### Miner Hauler
**"Resource Collector"**

**Role:** Economic unit, harvests asteroids/comets

**Stats:**
- **Cost:** 40 Gold, 2 Manpower
- **Build Time:** 45 seconds
- **Hit Points:** 120 HP
- **Armor Type:** Light
- **Movement Speed:** 70 units/sec (min 30, max 70)
- **Turn Radius:** 85° (poor agility, cargo vessel)
- **Weapon:** Mining Laser (defensive only)
  - Damage: 8 per shot
  - Rate of Fire: 1 shot/sec
  - DPS: 8
  - Range: 300 units
- **Special Ability:** Generates +3 gold/sec when near asteroid field
- **Size:** Large (14x8 units with cargo pods)

**Description:**
Industrial hauler with massive cargo pods and mining equipment. Exposed framework with ore containers. Yellow hazard stripes. Slow and ungainly but valuable. Working-class aesthetic.

**Color Scheme:**
- Primary: Rust brown with yellow panels
- Accents: Team color (cargo bay markings, running lights)
- Weapons: Yellow-green mining laser
- Effect: Rocks and debris around cargo pods

**Tactical Use:**
- Boost economy in mid-late game
- High priority enemy target
- Defenseless, needs escort
- Position near asteroid fields
- Investment unit (pays for itself over time)

**Counters:**
- Strong vs: Nothing (economic role)
- Weak vs: Any combat unit
- Extremely vulnerable

---

### Drone Carrier
**"Swarm Mother"**

**Role:** Summons swarms of tiny fighters

**Stats:**
- **Cost:** 120 Gold, 6 Manpower
- **Build Time:** 60 seconds
- **Hit Points:** 400 HP
- **Armor Type:** Heavy
- **Movement Speed:** 60 units/sec (min 30, max 60)
- **Turn Radius:** 95° (very poor agility)
- **Weapon:** Launches Drones (up to 20 active)
  - Each Drone: 30 HP, 5 DPS, 200 speed
  - Drones respawn every 10 seconds
  - Collective DPS: 100 (when all drones active)
  - Drone Range: 500 units from carrier
- **Size:** Massive (20x12 units)

**Description:**
Huge mothership with visible hangar bays. Drones constantly launching and returning. Imposing bulk with heavy armor. Blue energy fields guide drone paths. Capital ship presence.

**Color Scheme:**
- Primary: Dark blue-gray with bronze accents
- Accents: Team color (hangar bay lights, drone markings)
- Weapons: Swarm of tiny fighters with team color trails
- Effect: Constant activity, movement around carrier

**Tactical Use:**
- Area denial with drone swarm
- Excellent vs light units
- Weak if carrier destroyed
- Expensive but powerful
- Late game unit

**Counters:**
- Strong vs: Light units, Soldiers
- Weak vs: AoE (kills drones), Snipers (hit carrier)
- High value target

---

### Ram Ship
**"Battering Juggernaut"**

**Role:** Melee specialist, collision damage

**Stats:**
- **Cost:** 75 Gold, 4 Manpower, 15 Tungsten
- **Build Time:** 45 seconds
- **Hit Points:** 350 HP
- **Armor Type:** Heavy (reinforced prow)
- **Movement Speed:** 140 units/sec (min 60, max 140 for charge)
- **Turn Radius:** 80°
- **Weapon:** Reinforced Ram Prow
  - Damage: 200 on collision
  - Self-damage: 50 HP
  - Stun: Knocks back target
- **Secondary:** Small Caliber Turrets
  - Damage: 10 per shot, 2 shots/sec
  - DPS: 20
  - Range: 350 units
- **Size:** Large (16x7 units, elongated)

**Description:**
Aggressive design with massive reinforced prow. Swordfish-like profile. Heavy plating on front, lighter on rear. Bright team color war paint on ram. Built for impact.

**Color Scheme:**
- Primary: Gunmetal with black ram prow
- Accents: Team color (war paint, engine overdrive)
- Weapons: White bullet tracers
- Effect: Motion blur and shockwave on impact

**Tactical Use:**
- Charge high-value targets
- Disrupt formations
- Kamikaze runs if low HP
- Psychological impact
- Requires Tungsten resource

**Counters:**
- Strong vs: Snipers, Artillery, static targets
- Weak vs: Kiting, Scouts (can't catch), sustained DPS
- High risk, high reward

---

## Planet Buildings

### Scout Factory
**"Light Fighter Hangar"**

**Stats:**
- **Cost:** 50 Gold
- **Build Time:** 30 seconds
- **Produces:** Scout Fighter (every 45 seconds)
- **Power Usage:** 1 unit
- **Size:** 3x3 building slots

**Description:**
Compact hangar facility with rapid-deployment launch tubes. Minimal infrastructure for cheap production. Small landing pads visible.

**Upgrade Path:**
- **Level 2 (100 Gold):** Production rate 35 seconds, +10 Scout HP
- **Level 3 (200 Gold):** Production rate 30 seconds, +20 Scout HP, +2 damage

---

### Soldier Factory
**"Standard Fighter Hangar"**

**Stats:**
- **Cost:** 100 Gold
- **Build Time:** 40 seconds
- **Produces:** Soldier Fighter (every 45 seconds)
- **Power Usage:** 2 units
- **Size:** 4x4 building slots

**Description:**
Mid-sized military hangar with armament facilities. Visible rocket assembly lines and repair bays. Standard military architecture.

**Upgrade Path:**
- **Level 2 (150 Gold):** Production rate 40 seconds, +20 Soldier HP
- **Level 3 (300 Gold):** Production rate 35 seconds, +40 HP, +5 damage all weapons

---

### Heavy Factory
**"Capital Ship Foundry"**

**Stats:**
- **Cost:** 400 Gold
- **Build Time:** 60 seconds
- **Produces:** Heavy Gunship (every 45 seconds)
- **Power Usage:** 5 units
- **Size:** 6x6 building slots

**Description:**
Massive industrial complex with heavy machinery. Cranes and assembly lines for large ships. Smoke stacks and foundry glow. Imposing presence.

**Upgrade Path:**
- **Level 2 (400 Gold):** Production rate 40 seconds, +100 Heavy HP
- **Level 3 (800 Gold):** Production rate 35 seconds, +200 HP, +15 DPS

---

### Medic Bay
**"Support Ship Hangar"**

**Stats:**
- **Cost:** 200 Gold, 10 Crystals
- **Build Time:** 45 seconds
- **Produces:** Medic Support Ship (every 45 seconds)
- **Power Usage:** 3 units
- **Size:** 4x5 building slots

**Description:**
Medical facility with repair bays and bio-support systems. White architecture with red cross markings. Clean, organized appearance.

**Upgrade Path:**
- **Level 2 (250 Gold, 15 Crystals):** Production rate 40 seconds, +20 Medic HP, +10 heal/sec
- **Level 3 (500 Gold, 30 Crystals):** Production rate 35 seconds, healing radius +50 units

---

### Engineer Workshop
**"Constructor Hangar"**

**Stats:**
- **Cost:** 150 Gold
- **Build Time:** 40 seconds
- **Produces:** Engineer Constructor (every 45 seconds)
- **Power Usage:** 2 units
- **Size:** 4x4 building slots

**Description:**
Industrial workshop with tool fabrication facilities. Yellow hazard stripes and construction equipment visible. Practical, utilitarian design.

**Upgrade Path:**
- **Level 2 (200 Gold):** Production rate 40 seconds, capture rate 3x
- **Level 3 (400 Gold):** Production rate 35 seconds, can build structures faster

---

### Bomber Facility
**"Siege Ship Hangar"**

**Stats:**
- **Cost:** 300 Gold, 20 Gas
- **Build Time:** 50 seconds
- **Produces:** Demolition Bomber (every 45 seconds)
- **Power Usage:** 4 units
- **Size:** 5x5 building slots

**Description:**
Reinforced hangar with explosive ordnance storage. Thick blast walls and safety protocols. Orange hazard markings throughout.

**Upgrade Path:**
- **Level 2 (350 Gold, 30 Gas):** Production rate 40 seconds, +30 Bomber HP, +20 bomb damage
- **Level 3 (700 Gold, 60 Gas):** Production rate 35 seconds, AoE radius +30 units

---

### Sniper Dock
**"Precision Fighter Hangar"**

**Stats:**
- **Cost:** 250 Gold, 15 Tungsten
- **Build Time:** 45 seconds
- **Produces:** Sniper Frigate (every 45 seconds)
- **Power Usage:** 3 units
- **Size:** 4x5 building slots

**Description:**
High-tech facility with advanced optics and targeting systems. Sleek, modern architecture. Sensor arrays and calibration equipment visible.

**Upgrade Path:**
- **Level 2 (300 Gold, 25 Tungsten):** Production rate 40 seconds, +100 damage per shot
- **Level 3 (600 Gold, 50 Tungsten):** Production rate 35 seconds, charge time reduced to 1.5 sec

---

### Gold Mine
**"Resource Extractor"**

**Stats:**
- **Cost:** 80 Gold
- **Build Time:** 30 seconds
- **Effect:** +3 Gold/second
- **Power Usage:** 1 unit
- **Size:** 3x3 building slots

**Description:**
Deep-core mining facility with extraction equipment. Visible ore conveyors and processing. Industrial yellow color with dust effects.

**Upgrade Path:**
- **Level 2 (100 Gold):** +5 Gold/second
- **Level 3 (200 Gold):** +8 Gold/second
- **Level 4 (400 Gold):** +12 Gold/second

---

### Manpower Center
**"Population Hub"**

**Stats:**
- **Cost:** 100 Gold
- **Build Time:** 40 seconds
- **Effect:** +2 Manpower capacity/second
- **Power Usage:** 2 units
- **Size:** 4x4 building slots

**Description:**
Residential complex with training facilities. Visible barracks and recruitment centers. Organized urban planning with parade grounds.

**Upgrade Path:**
- **Level 2 (150 Gold):** +4 Manpower/second
- **Level 3 (300 Gold):** +7 Manpower/second

---

### Power Plant
**"Energy Generator"**

**Stats:**
- **Cost:** 120 Gold
- **Build Time:** 35 seconds
- **Effect:** +10 power units (allows more buildings)
- **Size:** 5x5 building slots

**Description:**
Glowing reactor core with cooling towers. Blue energy arcs and steam vents. Pulsing light effects. Critical infrastructure.

**Upgrade Path:**
- **Level 2 (180 Gold):** +15 power units
- **Level 3 (350 Gold):** +25 power units

---

### Research Lab
**"Technology Center"**

**Stats:**
- **Cost:** 200 Gold
- **Build Time:** 50 seconds
- **Effect:** Unlocks building upgrades, reduces upgrade costs by 15%
- **Power Usage:** 3 units
- **Size:** 5x5 building slots

**Description:**
High-tech facility with observation domes and sensor arrays. Clean white architecture with blue glowing windows. Scientists and research equipment visible.

**Upgrade Path:**
- **Level 2 (300 Gold):** Upgrade cost reduction 25%, factory production rate bonus +5%
- **Level 3 (600 Gold):** Upgrade cost reduction 40%, unlock advanced unit variants

---

## Moon Buildings

### Plasma Turret
**"Anti-Ship Battery"**

**Stats:**
- **Cost:** 150 Gold, 10 Gas
- **Build Time:** 40 seconds
- **Hit Points:** 800 HP
- **Armor Type:** Fortified
- **Weapon:** Heavy Plasma Cannons
  - Damage: 80 per shot
  - Rate of Fire: 1 shot/sec
  - DPS: 80
  - Range: 700 units
- **Size:** 2x2 moon slots

**Description:**
Heavily armored turret emplacement with rotating plasma cannons. Thick armor plating and targeting sensors. Orange glow from plasma coils. Menacing defensive presence.

**Upgrade Path:**
- **Level 2 (200 Gold, 15 Gas):** +200 HP, +20 damage, +100 range
- **Level 3 (400 Gold, 30 Gas):** +400 HP, rate of fire 1.5/sec, tracking speed increased

---

### Flak Battery
**"Anti-Swarm Defense"**

**Stats:**
- **Cost:** 120 Gold
- **Build Time:** 35 seconds
- **Hit Points:** 600 HP
- **Armor Type:** Fortified
- **Weapon:** Rapid-Fire Flak Cannons
  - Damage: 25 per burst (spread across 5 units)
  - Rate of Fire: 3 bursts/sec
  - DPS: 75 (distributed)
- **Effective Range:** 600 units
- **Size:** 2x2 moon slots

**Description:**
Multi-barrel anti-aircraft platform with rapid rotation. Orange muzzle flashes and shell casings ejecting. Radar dish for tracking. Distinct staccato firing sound.

**Upgrade Path:**
- **Level 2 (150 Gold):** +150 HP, proximity detonation (better vs swarms)
- **Level 3 (300 Gold):** +300 HP, explosive rounds, 4 bursts/sec

---

### Laser Array
**"Long-Range Defense"**

**Stats:**
- **Cost:** 200 Gold, 15 Crystals
- **Build Time:** 45 seconds
- **Hit Points:** 500 HP
- **Armor Type:** Fortified
- **Weapon:** Focused Laser Array
  - Damage: 120 per shot
  - Rate of Fire: 0.75 shots/sec
  - DPS: 90
  - Range: 1000 units (longest defensive range)
- **Size:** 2x2 moon slots

**Description:**
Sophisticated laser platform with focusing lenses and cooling systems. Bright beam emission with lens flare. Blue crystalline components. High-tech appearance.

**Upgrade Path:**
- **Level 2 (250 Gold, 25 Crystals):** +100 HP, +50 damage, instant retarget
- **Level 3 (500 Gold, 50 Crystals):** +200 HP, can shoot through shields, 1 shot/sec

---

### Shield Generator
**"Defensive Barrier"**

**Stats:**
- **Cost:** 250 Gold, 30 Crystals
- **Build Time:** 50 seconds
- **Hit Points:** 400 HP (structure) + 2000 Shield HP (regenerating)
- **Armor Type:** Fortified
- **Effect:** Projects 600-radius shield bubble, blocks all projectiles
- **Shield Regen:** 50 HP/second after 5 seconds without taking damage
- **Size:** 3x3 moon slots

**Description:**
Large crystalline dome with energy emitters. Glowing blue shield bubble visible. Pulsing energy patterns. Beautiful and functional. Protects entire moon section.

**Upgrade Path:**
- **Level 2 (350 Gold, 50 Crystals):** +1000 Shield HP, +800 radius, 75 HP/sec regen
- **Level 3 (700 Gold, 100 Crystals):** +2000 Shield HP, reflects 10% damage back to attacker

---

### Radar Station
**"Surveillance Network"**

**Stats:**
- **Cost:** 100 Gold
- **Build Time:** 30 seconds
- **Hit Points:** 300 HP
- **Armor Type:** Light
- **Effect:** Reveals 1200 unit radius (removes fog of war)
- **Special:** Detects cloaked units within range
- **Size:** 2x2 moon slots

**Description:**
Large rotating radar dish with communication arrays. Scanning sweeps visible. Blinking lights and antenna arrays. Intelligence hub aesthetic.

**Upgrade Path:**
- **Level 2 (150 Gold):** +500 HP, +600 range, reveals enemy unit types
- **Level 3 (300 Gold):** +700 HP, +1000 range, provides targeting bonus (+5% damage) to friendly ships in range

---

### Missile Silo
**"Strategic Bombardment"**

**Stats:**
- **Cost:** 350 Gold, 40 Gas
- **Build Time:** 60 seconds
- **Hit Points:** 1000 HP
- **Armor Type:** Fortified
- **Weapon:** Long-Range Missiles
  - Damage: 200 per missile
  - AoE Radius: 200 units
  - Rate of Fire: 0.25 shots/sec (15 second reload)
  - Range: 1500 units (can hit 2+ planets away)
- **Size:** 3x3 moon slots

**Description:**
Massive silo with visible missile tubes. Heavy reinforced concrete bunker design. Warning lights and launch smoke. Strategic weapon appearance. Intimidating.

**Upgrade Path:**
- **Level 2 (500 Gold, 60 Gas):** +300 HP, +100 damage, 12 second reload
- **Level 3 (1000 Gold, 120 Gas):** +500 HP, cluster missiles (3x smaller missiles), can target moving fleets

---

### Repair Station
**"Maintenance Facility"**

**Stats:**
- **Cost:** 180 Gold, 15 Crystals
- **Build Time:** 40 seconds
- **Hit Points:** 450 HP
- **Armor Type:** Medium
- **Effect:** Heals all friendly ships within 500 units at 20 HP/sec per ship
- **Size:** 3x3 moon slots

**Description:**
Orbital repair dock with repair beams and drone bays. Green pulsing lights. Medical facility aesthetic. White panels with team color accents.

**Upgrade Path:**
- **Level 2 (250 Gold, 25 Crystals):** +150 HP, 35 HP/sec healing, +700 range
- **Level 3 (500 Gold, 50 Crystals):** +300 HP, 50 HP/sec, can repair structures

---

## Admiral Ships (Phase 2)

### Titan-Class Battleship
**"Command Flagship"**

**Role:** Mobile command center and super-heavy combatant

**Stats:**
- **Cost:** N/A (unique, pre-placed)
- **Hit Points:** 5000 HP
- **Armor Type:** Fortified
- **Movement Speed:** 40 units/sec (min 20, max 40)
- **Turn Radius:** 120° (extremely poor agility)
- **Weapons:**
  - 4x Heavy Plasma Cannons: 100 damage, 1.5 shots/sec each = 600 DPS
  - 8x Point Defense Lasers: 15 damage, 3 shots/sec each = 360 DPS
  - 2x Missile Bays: 180 damage, 0.5 shots/sec = 180 DPS
  - **Combined DPS:** 1140
- **Command Aura:** All friendly ships within 800 units gain +15% damage, +10% HP
- **Size:** Massive (30x20 units)

**Description:**
Enormous capital ship bristling with weapons. Multiple decks and turret emplacements. Command bridge with glowing windows. Team color banners. Intimidating flagship presence. Represents player's empire.

**Color Scheme:**
- Primary: Dark navy blue with gold trim
- Accents: Team color (banners, command bridge, engine glow)
- Weapons: Multi-colored weapons fire (orange plasma, blue lasers, white missiles)
- Effect: Energy shields, visible armor plating, repair drones

**Tactical Use (Phase 2 Win Condition):**
- Provides command bonuses to fleet
- Can be moved but very slow
- Losing it = instant defeat
- Heavily defended position
- Psychological center of empire

**Counters:**
- Strong vs: Everything (requires coordinated assault)
- Weak vs: Sustained siege, bomber runs, concentrated fleet
- Ultimate target

---

### Stealth Carrier (Alternative Admiral)
**"Shadow Command"**

**Role:** Mobile, stealthy command ship

**Stats:**
- **Cost:** N/A (unique, alternative to Titan)
- **Hit Points:** 2500 HP
- **Armor Type:** Heavy
- **Movement Speed:** 100 units/sec (min 50, max 100)
- **Turn Radius:** 70°
- **Weapons:**
  - Stealth Torpedo Bays: 250 damage, 0.6 shots/sec = 150 DPS
  - Point Defense: 100 DPS
- **Special:** Can cloak (recharge 60 sec, lasts 30 sec)
- **Command Aura:** Friendly ships within 600 units gain +20% speed, +10% evasion
- **Size:** Large (22x14 units)

**Description:**
Sleek, modern design with active camouflage. Less imposing than Titan but faster. Stealth black color with minimal profile. Intelligence-focused command style.

**Color Scheme:**
- Primary: Matte black with dark gray
- Accents: Team color (subtle, engine glow when uncloaked)
- Weapons: Silent torpedo launches, minimal flash
- Cloaked: Shimmer effect, barely visible

**Tactical Use:**
- Mobile command, can relocate
- Harder to find and kill
- Less raw combat power
- Supports hit-and-run tactics
- Different playstyle than Titan

---

## Special Structures

### Stargate
**"Rapid Transit Hub"**

**Stats:**
- **Cost:** 500 Gold, 50 Crystals
- **Build Time:** 120 seconds
- **Hit Points:** 2000 HP
- **Armor Type:** Fortified
- **Effect:** Teleports ships instantly to linked Stargate
- **Size:** 5x5 building slots (planet only)
- **Requires:** Another Stargate on different planet

**Description:**
Massive ring structure with swirling energy portal. Ancient technology aesthetic. Blue-white energy vortex. Ships disappear and reappear at destination. Expensive but strategic.

**Upgrade Path:**
- No upgrades (one-time construction)

---

### Orbital Cannon
**"Planet Cracker"**

**Stats:**
- **Cost:** 800 Gold, 100 Tungsten, 50 Gas
- **Build Time:** 180 seconds
- **Hit Points:** 3000 HP
- **Armor Type:** Fortified
- **Weapon:** Super-Heavy Plasma Lance
  - Damage: 1000 per shot
  - Rate of Fire: 0.1 shots/sec (10 second charge)
  - Range: Entire map
  - Can damage planetary structures
- **Size:** 6x6 building slots (planet only)

**Description:**
Colossal weapon platform with massive barrel pointed skyward. Glowing energy core. Warning sirens and charge-up effects. Ultimate deterrent weapon. Late-game superweapon.

**Upgrade Path:**
- No upgrades (already maxed)

---

## Balance Notes

**Unit Cost Ratio Examples:**
- 10 Scouts (100 gold) ≈ 1 Heavy (100 gold)
- 4 Soldiers (100 gold) vs 10 Scouts (100 gold) - Soldiers win
- 1 Heavy (100 gold) vs 4 Soldiers (100 gold) - Even match
- Support units (Medic) swing battles dramatically

**Exotic Resource Gating:**
- **Crystals:** Unlock shields, healing, energy weapons
- **Gas:** Unlock explosives, high DPS units
- **Tungsten:** Unlock armor-piercing, rams, heavy weapons

**Weapon vs Armor Effectiveness:**
- Lasers: +20% vs Shields, +0% vs all armor
- Flak: +30% vs Light, +0% vs Medium/Heavy
- Bullets: +0% baseline (upgrades change this)
- Rockets: +20% vs Heavy, -10% vs Light (mobility)
- Armor-Piercing: +40% vs Heavy/Fortified

**Production Scaling:**
- Early game: 2-3 factories, ~10 ships total
- Mid game: 8-12 factories, ~50 ships
- Late game: 25+ factories, 200+ ships
- Match climax: Hundreds of ships, massive battles

---

## Visual Language Summary

**Team Colors:**
- Applied to: Engine trails, cockpit glows, accent lights, banners
- Always visible on ship silhouette
- Helps identify friendly vs enemy at a glance

**Ship Size Categories:**
- Small (5-7 units): Scouts, Spies
- Medium (8-11 units): Soldiers, Medics, Engineers, Snipers
- Large (12-16 units): Heavies, Bombers, Rams, Carriers
- Massive (20+ units): Admiral Ships

**Damage Type Visual Cues:**
- Lasers: Bright beams with lens flare
- Bullets: Tracer rounds, muzzle flash
- Rockets: Smoke trails, delayed explosions
- Flak: Scattered bursts, orange clouds
- Explosions: Size matches damage (bigger = more dangerous)

**Status Effects:**
- Low HP: Smoke trails, fire effects, sparking
- Shields: Blue hexagonal energy field
- Cloaked: Translucent shimmer, refraction
- Buffed: Glow outline matching buff type
- Disabled: Drifting, no engine glow

---

**End of Document**

*This reference should be updated as balance changes and new units are added. All values are subject to playtesting and iteration.*
