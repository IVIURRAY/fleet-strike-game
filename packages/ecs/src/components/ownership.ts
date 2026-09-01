/**
 * Identity and ownership components, plus entity-kind tags.
 *
 * bitECS queries are far cheaper against tag components than against a
 * numeric "type" field, so each entity kind gets its own zero-field tag in
 * addition to the numeric descriptors the network layer needs.
 */

import { Types, defineComponent } from 'bitecs';

/** Which player owns this entity. 0 = neutral. */
export const Owner = defineComponent({
  playerId: Types.ui8,
});

/** Marks an entity as an active participant. Removed entities lose this tag. */
export const Active = defineComponent();

// --- Entity kind tags ------------------------------------------------------

/** Tag: a mobile combat vessel. */
export const ShipTag = defineComponent();

/** Tag: an in-flight munition. */
export const ProjectileTag = defineComponent();

/** Tag: one of the seven main planets. */
export const PlanetTag = defineComponent();

/** Tag: a moon orbiting a planet. */
export const MoonTag = defineComponent();

/** Tag: a constructed structure on a planet or moon. */
export const BuildingTag = defineComponent();

// --- Numeric descriptors ---------------------------------------------------

/** Which ship class this entity is, as a `SHIP_TYPE_IDS` value. */
export const ShipClass = defineComponent({
  typeId: Types.ui8,
});

/** Which building type this entity is, plus its upgrade level. */
export const BuildingClass = defineComponent({
  typeId: Types.ui8,
  level: Types.ui8,
});

/** Chain index of a planet, and which planet a moon or building belongs to. */
export const PlanetRef = defineComponent({
  /** Chain index 0-6. */
  index: Types.ui8,
});

/** Links a building or moon to its parent entity. */
export const Parent = defineComponent({
  entity: Types.eid,
});
