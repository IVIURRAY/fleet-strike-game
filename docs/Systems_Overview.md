## Inspiration games

- Startcraft, Space empires fighting for control over the stars. Base building nad unit generation
- Civ, Expand your empire by sending out engineers to cononlise new planets, havesting their resources for your own economy
- Openfront, simple, low fedility graphics which are satisfying, simple to understand ands straight to the point, whilst still being attractive and unique.
- Rimworld - simple 2d grapgics fighter, each ship has it's own AI pather and targeter. Indiviudal ships shuold take actions to avoid getting hit like using their abilities. Shuips are customisable in appearance and change as they get upgraded.
- Direct strike, warcraft 3 custom game. Wave attacks of ever increasingly complex armies to counter each other until it gets crazy
- Tower defence, build towers on moons and sattalight towners
- League of lengends - Use sateligghts probes to see what your oppoenent is planning
- TF2, classic classes copied over into ship format

Build your galatic empire and crush anyone who stands in your way.

Auto battler where you design and manuver your own starfleet, supported by your glatic empire and weild it to wage total war against those who oppose your rule.
Exciting starship dog fighting
Economy management
Deep tactics
Multiplayer in brower

## Core match loop and win conditions

- Player are in control of their own galatic empire. Think the schkizm of rome. The empire as split and now there is a civil war throughtout the stars.
- You must manage your economy, build your fleet, and destory the enemy's admiral ship that is coordinating enemy.
- You win when you destroy the enemy ship.
- The game is played in rounds that last 45 seconds each
- The general flow of the game should be that you start on either sides of a large galaxy board and you slowly move towards eachother by exapnding your empire.
- Ship Scale - Should play around with the idea of logarithmic scaliing for ships. We could do a gimic where the distnace are accurate, hence you have to use these graphs to fight the battle for you, could increase emmersion.
- Flight traffic conttroller, for the death star.
- Your own terriroy is pre defneded with towers and defences setup from before the war
- Fog of war - Satellite have to be sent out to increase viewing range or get engineers to build radar systems of mooons
- Rock paper scissors model -> Units have armour types, ammo types, weapon types and each type has advantanges and counters
- Economy management, invest in mining operations on moons or planets to increase gold income at the cost of a few ship's built

## Fleet building, deployment lanes, and wave spawning

- At the end of each round, your designed fleet is released from the starship's hanger and sent into the dogfight
- You keep piece in between rounds, so as the rounds climb the fleet gets larger and larger.
- pieces can be assembled in formation to better control when they make contact with the enemey formats
- You spend resources like gold, crystals, ions etc to build ships. Some ships are lcoked until you conquire a plannet with the right resources
- Fleets must travel over the galaxy to combat each other
- when they meet up, they enter into a dog fight
- You cna fight over a plannet, in which case the home planet supports the defending fleet.
- Maybe we need to deploy ground troops from the fleet in order the capture a planet and this is where manpower comes into it

## Ship classes, weapons, counters, formations, and upgrades

- There are different ships to place, with lots of variation on size and ability. Initially we will have ships that mirror the classic game classes from team fortress:
  - Scout, Fast, weak, swarmable
  - Soilder, Regular fighter, rockets + guns
  - Pyro - Flame specialist, kamzai
  - Demo - Bomber, seige machine, long range explosions, semi fighter
  - Heavy - Big gunner, slow and tanky
  - Engineer - can build fortifications and take over other planets
  - Miner - Can gather resources from the commets nad planets in the solar system
  - Medic - Healier ship, can fix other ships during/ after combat
  - Sniper - Long range, weak, powerful lazer.
  - Spy - Invisible ship, sealth attacks, can impersonate or maybe hijack other ships
  - Sheild - Block certain kinds of attacks like bombs

  - Tiny drone ships swammers
  - Huge raming ships - Tug boats
    - EMP jammer ships
    - Boarding ships - Melee ship specialist like a swordfish
    - Critical hits hit ammo storage, causing the ship to explode and do damage to others ships nearby

  - Game progresion, starting wiht small, basic ship and limited options to bigger, more complicated ships with more powerful abilities. Sheild breakers for example

Ship stats

- Rate of fire - How fast do they shoot
- min - max movement Speed, min speed for breaking to suppirse dogfight, max speed for chasing
- Max Turn raidus
- Maximum Pilot G force resistance
- Manuvure skills - Barrel roll, loopdidoop, whatever out manuvure the enemy
- Weapon type - Flak cannon (regular projectiles), Lazer (effective against sheilds), rockets (target tracking heat seaking, shoot downable), one way sheild wall, makes a sheild only your projectives can travel through
- armour type - Light, meidum, heavy, fortified.
- sheild type - Sheilds can block projectiles and bombs, making them explode on impact.
- Resource cost to make (gold or specialist parts)
  - Target prioritiisation, control your units to take out key ships

- Team colours, ships shuold be distincitve through shap alone, with some accents that can be coloured to match the player's team colours
- Power ups?
- Ship upgrades

## Economy, technology trees, factions, and commanders

- Each player has a home planet where tehy can invest in their sides economy
- Think starship troppers or civ where you can invest in public schools and get smarter piloets
- Or simulation traning to improve accuraure of shots
- Man power management - Do you have to invest in your population
- Maybe you ahve to invest in educating the pilots or growing people capable of piloting such machiens?
- Admeral ship turret management
- Admiral ship sheild management
- Factory upgrades to make ships faster?
- Moons and planets exist on the map, you can conquire them and gather their unique resources, use the reousces to improve your fleet's complexity and abilities.
- Man power is generated by controling hospitable planets and investing in food production on those planets
- You can send aid packages to differnet plannets if they run out of food.
- Sealth ships can infiltrate the planets and interupt polical system whch can cut off manpower, can even cause a famine which can take out the population without aid packates.

## Combat simulation and targeting behaviour

- Improved path finding, wiggly ship dogfight paths, ships should turn and tiwst and weave to avoid enemy shots and try to close the distnace to turn the tables. Theey should attempt manuvanures to try nad make ecapes if they're being tailed
- Robotics for ship repairs
- Capture moons and planets off the enermy to earn more money?

- Crowd control - Some specuial uints should be able to slow down, stun or jam other craft to make them make mistakes. A aircraft could hack another part of the fleet or jam satalights

## Galaxy-control theme and progression

- Two sides of huge map, zooming needs to be logarithmic?
- Moons, planets, admiral ship only one. Fleet units
- Left to right control, no map wrapping (cage match) (or )

## Multiplayer/network synchronisation

## ECS architecture and PixiJS rendering

## TypeScript domain models and data-driven ship definitions

## List of systems I can think of that would be cool
