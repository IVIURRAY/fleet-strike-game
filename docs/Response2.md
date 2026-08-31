Formation & Combat Flow
Q1: Formation Chess Board Size & Persistence
You mention arranging units on a "chess board" like Direct Strike. Is this:

- A physical staging area on the map (like a hangar near your home planet)
- An abstract UI overlay where you arrange unit types in slots?
- Does the formation persist (every wave uses the same formation until you change it)?
- Or do you rearrange each wave before it spawns?

I dont think we need the hanger if units are being produced are sent out right away. Cna we add the hanger to phase 2? Maybe we should come up with a feature roadmap kind of thing.

Q2: Formation to Combat Transition
When units spawn in formation and "walk towards the enemy maintaining formation" - what happens when they meet the enemy?

- Do they maintain formation and fire while advancing?
- Do they break formation to engage closest targets?
- Do different unit types have different engagement behaviors (scouts rush ahead, heavies hold back)?

The waypoint is a marker that they all aim for and loiter around until its moved, tehy should continue to move and spin and fly around. the point and engage enemies if they should come near.

Q3: "Hold Position" Mechanic
You mentioned the only control might be "hold position to gather units, then charge as one fleet." Where do you issue this command:

- At the spawn point (don't release the wave yet)?
- To units already in transit (rally them at a waypoint)?
- To units in combat (regroup and push)?

This is explained above, a waypoint, in the galaxy for them to aim for.,

Q4: Target Prioritization
In Direct Strike, smart targeting was crucial. Do your units:

- Always attack nearest enemy?
- Have built-in priorities (scouts target miners, snipers target medics)?
- Can players set target priorities (like "focus healers first")?
  lets do nearest, cane make more complex later

Unit Types - The Core Roster
You said "see more in unit types" - let me grill you on establishing the MVP roster of 5-7 units:

For the units, impretty happy with sensible defaults, inspired by other video games. I dont want to awnser all these question jnsut now.

Q5: Rock-Paper-Scissors Foundation
What's the basic counter triangle? For example:

- Fast/Light units > Slow/Heavy units (mobility)
- Heavy/Armored > Medium units (durability)
- Swarms > Single-target specialists (spread damage)
- AoE > Swarms (area damage)
  Which of your TF2-inspired units form this core triangle?
  Q6: Essential Roles
  For a functional game, you probably need:
- Basic fighter (Scout or Soldier) - cheap, spammable
- Tank (Heavy) - slow, high HP, draws fire
- DPS specialist (Pyro or Demo) - counters specific targets
- Support (Medic or Engineer) - force multiplier
- Counter unit (Sniper or Spy) - deals with specific threats
  Which 5 do you build first? What can wait for v2?

Q7: Unit Cost Scaling

sensible defaults will need much tweaking

You mentioned "10 scouts for every 1 gunship" - what's your resource ratio thinking:

- Scout: 1 gold, 1 manpower (baseline)
- Soldier: ? gold, ? manpower
- Heavy: ? gold, ? manpower
  Should cost scale linearly or exponentially?

Map & Planet Mechanics

Q8: 7-Planet Layout
You said "5 worlds + home worlds" (so 7 total). Is the layout:
[Home A] - [Planet 1] - [Planet 2] - [Neutral] - [Planet 3] - [Planet 4] - [Home B]
Each player starts with just their home planet, and planets 1-5 are neutral/to be captured?

yeah, planets are in a chain, moons orbit the planets. one long chain from either end. We will expand with more reoutes later.

Q9: Planet Capture - Tug of War Details
"Whoever has the most capture points wins it" - how do units generate capture points:

- Just by being near the planet (proximity)? yes this one
- By surviving for X seconds in the planet's zone?
- By dealing damage to enemy units at that planet?
- Do you need special units (Engineers) to capture, or can any unit contribute?

Q10: Multiple Fronts
With 7 planets, can you split your forces and attack multiple planets simultaneously, or does your entire fleet move as one blob along the linear path?
Q11: Moon Buildings
"You can click on the moon to see its buildings" - what buildings can you construct on moons:

- Turrets (deal damage to passing fleets)
- Shields (protect nearby units/planets)
- Radar/Satellites (fog of war vision)
- Resource extractors?

Sensible defauts for this please. ONly one front for mvp as its just a linear tug of war

How many building slots per moon? 3

Economy & Resource Flow
Q12: Starting Resources
What does each player start with:

- X gold immediately? 165
- Gold income per second from home planet? 5
- A starting military (you mentioned "small army they can use right away")?
  Yeah 5 scouts and 3 soilders to capture first planet

Q13: Resource Generation Rates
If planets generate resources, what's the cadence:

- Continuous trickle (X gold/second)? yes
- Discrete intervals (every 45 seconds with spawn waves)? no
- Based on what you build on the planet? yes

  Q14: Exotic Resource Gating
  You said capturing planets unlocks special resources (Crystals for shields, Gas for explosives, etc.).

- Is each planet type-locked (Planet 2 always has Crystals, Planet 3 always has Gas)?
- Or is it random each match?
- Can you see what resources a planet has before capturing it?
- Once you have Crystals, do shield-based units unlock immediately, or do you still need gold to build them?
  Building & Production

  Q15: Building Ships - Interface
  "You build factories on planets" - is this:

- Click planet → build factory → factory auto-produces specific unit type every 45 seconds?
- Or more flexible: click factory → queue up 5 Scouts + 2 Heavies → they produce in order?

Q16: Factory Specialization

- Can one factory produce any unit type (like StarCraft Barracks)?
- Or must you build specialized factories (Scout Factory, Heavy Factory, etc.)?
- Does this mean you need to capture more planets to have production capacity for diverse armies?
  I think one unit per buidling type.

Q17: Upgrading vs New Factories
You mentioned "upgrade building to reduce spawn cooldown" - is investing in economy about:

- Upgrading existing factories (faster production, better units)?
- Building MORE factories (more production slots)?
- Both?
  both I guess
