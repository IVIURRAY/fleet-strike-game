/**
 * Core balance constants.
 *
 * Every value is traced to a design document. Where the documents contradict
 * one another, the chosen value and the reasoning are recorded inline so that
 * the resolution is auditable rather than arbitrary.
 */

// ---------------------------------------------------------------------------
// Simulation timing (docs/Technical_Architecture.md)
// ---------------------------------------------------------------------------

/** Authoritative simulation ticks per second. */
export const TICK_RATE = 60;

/** Milliseconds per simulation tick. */
export const TICK_INTERVAL_MS = 1000 / TICK_RATE;

/** Fixed timestep in seconds handed to every system. */
export const FIXED_DELTA = 1 / TICK_RATE;

/** State delta broadcasts per second. */
export const BROADCAST_RATE = 30;

/** Ticks between delta broadcasts. */
export const BROADCAST_INTERVAL_TICKS = Math.round(TICK_RATE / BROADCAST_RATE);

/** Seconds between full authoritative snapshots, used as a delta baseline. */
export const FULL_SNAPSHOT_INTERVAL = 5;

/** Systems that run on a one-second cadence rather than every tick. */
export const SLOW_SYSTEM_INTERVAL = 1;

// ---------------------------------------------------------------------------
// Match structure (docs/GameLoop.md)
// ---------------------------------------------------------------------------

/** Non-interactive pre-game phase in seconds. */
export const SETUP_DURATION = 30;

/**
 * Hard match time limit in seconds.
 *
 * docs/GameLoop.md targets a 20-minute match but defines no timeout rule, which
 * leaves matches formally unbounded — the docs themselves flag this as a gap.
 * A limit plus a most-planets-held tiebreak is applied so a match always
 * terminates. Conquest remains the primary win condition.
 */
export const MATCH_TIME_LIMIT = 20 * 60;

/** Planets that must be held simultaneously to win by conquest. */
export const PLANETS_TO_WIN = 7;

// ---------------------------------------------------------------------------
// Starting conditions (docs/GameLoop.md, docs/ResourcesEconomy.md)
// ---------------------------------------------------------------------------

export const STARTING_GOLD = 165;
export const STARTING_MANPOWER = 50;

/**
 * Starting buildings are the Command Center only.
 *
 * docs/Map_Design.md and docs/GameLoop.md line 47 also list a starting Gold
 * Mine and Manpower Center, but four other statements contradict that: the
 * stated starting income is 5 gold/sec and 0 manpower/sec, ResourcesEconomy
 * says manpower centres "must be built", the 0:00 snapshot shows 0 manpower
 * income, and every documented opening build order purchases the first mine
 * and centre. The majority reading wins.
 */
export const STARTS_WITH_GOLD_MINE = false;
export const STARTS_WITH_MANPOWER_CENTER = false;

/** Fleet each player begins with. */
export const STARTING_FLEET = [
  { type: 'scout', count: 5 },
  { type: 'soldier', count: 3 },
] as const;

// ---------------------------------------------------------------------------
// Economy (docs/ResourcesEconomy.md)
// ---------------------------------------------------------------------------

/** Permanent, indestructible income from a capital's Command Center. */
export const COMMAND_CENTER_GOLD_PER_SECOND = 5;

/** Manpower ceiling before Manpower Centers raise it. */
export const MANPOWER_BASE_CAP = 200;

/** Exotic resource income per second per controlled exotic planet. */
export const EXOTIC_PER_SECOND = 5;

/** Storage limit for each exotic resource. */
export const EXOTIC_CAP = 500;

/** Manpower is fully refunded when a ship dies (documented comeback mechanic). */
export const REFUND_MANPOWER_ON_DEATH = true;

/** Power available on a planet before any Power Plant is built. */
export const PLANET_BASE_POWER = 10;

// ---------------------------------------------------------------------------
// Planet capture (docs/Map_Design.md, docs/GameLoop.md)
// ---------------------------------------------------------------------------

/** Ships within this distance of a planet centre contribute capture points. */
export const CAPTURE_RADIUS = 500;

/** Capture points per second contributed by a standard ship. */
export const CAPTURE_RATE_PER_SHIP = 1;

/** Engineers capture at double rate. */
export const ENGINEER_CAPTURE_RATE = 2;

/**
 * Capture bar runs from -CAPTURE_THRESHOLD (player 1) to +CAPTURE_THRESHOLD
 * (player 2). Reaching either end transfers ownership.
 *
 * The signed range reconciles the docs' two worked examples: a +1/sec net
 * advantage capturing in 100 seconds, and a -4/sec swing reversing an
 * owned planet in ~50 seconds.
 */
export const CAPTURE_THRESHOLD = 100;

/**
 * Ceiling on net capture points per second at a single planet.
 *
 * Without a ceiling, the documented 1 point/ship/second against a 100-point
 * threshold lets a late-game 200-ship fleet flip any planet in under a second,
 * which contradicts the docs' own "3-5 minute sustained battle" and
 * "16:00-20:00 capital siege" pacing targets. Capping the rate preserves
 * linear scaling at small fleet sizes while guaranteeing a minimum contest
 * duration of CAPTURE_THRESHOLD / MAX_CAPTURE_RATE seconds.
 */
export const MAX_CAPTURE_RATE = 10;

/** Capture progress decays toward neutral at this rate when uncontested. */
export const CAPTURE_DECAY_RATE = 0;

// ---------------------------------------------------------------------------
// Combat (docs/Complete_Units_and_Buildings.md)
// ---------------------------------------------------------------------------

/** Maximum simultaneous projectiles before the oldest are recycled. */
export const MAX_PROJECTILES = 4000;

/** Seconds a projectile lives before self-destructing. */
export const PROJECTILE_LIFETIME = 6;

/** Targets are re-evaluated on this cadence rather than every tick. */
export const TARGETING_INTERVAL = 0.5;

/** Cell size for the spatial hash used by targeting and collision. */
export const SPATIAL_CELL_SIZE = 250;

/** Radius used for projectile collision when a target has no explicit hitbox. */
export const DEFAULT_HITBOX_RADIUS = 8;

/** Ships loiter within this distance of the waypoint instead of stacking on it. */
export const WAYPOINT_LOITER_RADIUS = 220;

/** Separation force radius keeping ships from occupying identical positions. */
export const SHIP_SEPARATION_RADIUS = 26;

/** Strength of the separation steering force. */
export const SHIP_SEPARATION_STRENGTH = 90;
