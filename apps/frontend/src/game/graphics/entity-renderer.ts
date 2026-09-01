/**
 * Dynamic entity rendering: ships, projectiles and buildings.
 *
 * Sprites are pooled per entity id and reused across frames. Off-screen sprites
 * are hidden rather than destroyed, and ships are interpolated between the two
 * most recent server positions so 30 Hz updates render smoothly at 60 FPS.
 */

import { Container, Graphics } from 'pixi.js';
import type { BuildingType } from '@fleet-strike/types';
import { SHIP_TYPE_BY_ID, TEAM_COLORS, WEAPON_TYPE_BY_ID } from '@fleet-strike/config';
import {
  createBuildingSprite,
  createProjectileSprite,
  createShipSprite,
  isCircleVisible,
  lodForZoom,
  shipRenderRadius,
  shouldDrawHealthBars,
} from '@fleet-strike/renderer';
import type { Viewport } from '@fleet-strike/renderer';
import { lerpAngle } from '@fleet-strike/utils';

import type { SceneLayers } from '../canvas/create-canvas';
import type { GameStore } from '../state/store';

/** One rendered ship: hull plus an optional health bar. */
interface ShipVisual {
  readonly container: Container;
  readonly hull: Graphics;
  readonly healthBar: Graphics;
  /** Ship class this visual was built for, so reuse can detect a mismatch. */
  typeId: number;
  ownerId: number;
}

export class EntityRenderer {
  private readonly ships = new Map<number, ShipVisual>();
  private readonly projectiles = new Map<number, Graphics>();
  private readonly buildings = new Map<number, Graphics>();

  constructor(private readonly layers: SceneLayers) {}

  /** Redraws every dynamic entity for this frame. */
  render(store: GameStore, viewport: Viewport, zoom: number): void {
    this.renderShips(store, viewport, zoom);
    this.renderProjectiles(store, viewport);
    this.renderBuildings(store, viewport, zoom);
  }

  /** Number of live ship sprites, exposed for the performance overlay. */
  get shipSpriteCount(): number {
    return this.ships.size;
  }

  private renderShips(store: GameStore, viewport: Viewport, zoom: number): void {
    const lod = lodForZoom(zoom);
    const drawHealth = shouldDrawHealthBars(zoom);
    const seen = new Set<number>();

    for (const ship of store.ships.values()) {
      seen.add(ship.id);

      const t = store.interpolationFactor(ship);
      const x = ship.prevX + (ship.x - ship.prevX) * t;
      const y = ship.prevY + (ship.y - ship.prevY) * t;

      const shipType = SHIP_TYPE_BY_ID[ship.type];
      if (shipType === undefined) continue;

      const radius = shipRenderRadius(shipType);
      const visual = this.acquireShip(ship.id, ship.type, ship.owner);

      if (!isCircleVisible(x, y, radius, viewport)) {
        visual.container.visible = false;
        continue;
      }
      visual.container.visible = true;
      visual.container.x = x;
      visual.container.y = y;

      // Only the hull rotates; the container stays axis-aligned so the health
      // bar above it is never drawn upside down. At the lowest detail band
      // ships are sub-pixel, so rotation work is skipped entirely.
      visual.hull.rotation =
        lod === 'dot' ? 0 : lerpAngle(ship.prevRotation, ship.rotation, t);

      const healthFraction = ship.maxHp > 0 ? ship.hp / ship.maxHp : 1;

      // Damaged ships are tinted toward red so losing fights read at a glance.
      visual.hull.tint =
        healthFraction > 0.99 ? 0xffffff : mixToward(0xffffff, 0xff5544, 1 - healthFraction);

      if (drawHealth && healthFraction < 0.999) {
        drawHealthBar(visual.healthBar, radius, healthFraction, ship.owner);
        visual.healthBar.visible = true;
      } else {
        visual.healthBar.visible = false;
      }
    }

    this.releaseMissing(this.ships, seen, (visual) => visual.container.destroy({ children: true }));
  }

  private renderProjectiles(store: GameStore, viewport: Viewport): void {
    const seen = new Set<number>();

    for (const projectile of store.projectiles) {
      seen.add(projectile.id);
      const weaponType = WEAPON_TYPE_BY_ID[projectile.weapon];
      if (weaponType === undefined) continue;

      let sprite = this.projectiles.get(projectile.id);
      if (sprite === undefined) {
        sprite = createProjectileSprite(weaponType);
        this.layers.projectiles.addChild(sprite);
        this.projectiles.set(projectile.id, sprite);
      }

      if (!isCircleVisible(projectile.x, projectile.y, 8, viewport)) {
        sprite.visible = false;
        continue;
      }

      sprite.visible = true;
      sprite.x = projectile.x;
      sprite.y = projectile.y;
      sprite.rotation = projectile.rotation;
    }

    this.releaseMissing(this.projectiles, seen, (sprite) => sprite.destroy());
  }

  private renderBuildings(store: GameStore, viewport: Viewport, zoom: number): void {
    const seen = new Set<number>();

    for (const building of store.buildings) {
      seen.add(building.id);

      let sprite = this.buildings.get(building.id);
      if (sprite === undefined) {
        sprite = createBuildingSprite(building.type as BuildingType, building.owner);
        this.layers.buildings.addChild(sprite);
        this.buildings.set(building.id, sprite);
      }

      // Buildings are small; below this zoom they are not worth drawing at all.
      if (zoom < 0.1 || !isCircleVisible(building.x, building.y, 30, viewport)) {
        sprite.visible = false;
        continue;
      }

      sprite.visible = true;
      sprite.x = building.x;
      sprite.y = building.y;
      // Under-construction structures are drawn translucent.
      sprite.alpha = building.buildProgress >= 1 ? 1 : 0.35 + building.buildProgress * 0.5;
    }

    this.releaseMissing(this.buildings, seen, (sprite) => sprite.destroy());
  }

  private acquireShip(id: number, typeId: number, ownerId: number): ShipVisual {
    const existing = this.ships.get(id);
    // A recycled entity id could be a different class, so rebuild on mismatch.
    if (existing !== undefined && existing.typeId === typeId && existing.ownerId === ownerId) {
      return existing;
    }
    if (existing !== undefined) {
      existing.container.destroy({ children: true });
      this.ships.delete(id);
    }

    const shipType = SHIP_TYPE_BY_ID[typeId] ?? 'scout';
    const container = new Container();
    const hull = createShipSprite(shipType, TEAM_COLORS[ownerId === 2 ? 2 : 1]);
    const healthBar = new Graphics();
    healthBar.visible = false;

    container.addChild(hull, healthBar);
    this.layers.ships.addChild(container);

    const visual: ShipVisual = { container, hull, healthBar, typeId, ownerId };
    this.ships.set(id, visual);
    return visual;
  }

  /** Destroys sprites for entities absent from this frame. */
  private releaseMissing<T>(
    map: Map<number, T>,
    seen: Set<number>,
    destroy: (value: T) => void
  ): void {
    for (const [id, value] of map) {
      if (seen.has(id)) continue;
      destroy(value);
      map.delete(id);
    }
  }

  /** Destroys every pooled sprite. */
  clear(): void {
    for (const visual of this.ships.values()) visual.container.destroy({ children: true });
    for (const sprite of this.projectiles.values()) sprite.destroy();
    for (const sprite of this.buildings.values()) sprite.destroy();
    this.ships.clear();
    this.projectiles.clear();
    this.buildings.clear();
  }
}

/** Draws a health bar above a ship, in the ship's unrotated local space. */
function drawHealthBar(
  graphics: Graphics,
  radius: number,
  fraction: number,
  owner: number
): void {
  const width = radius * 2.2;
  const height = Math.max(2, radius * 0.22);
  const y = -radius - height * 2.2;

  graphics.clear();
  graphics.rect(-width / 2, y, width, height);
  graphics.fill({ color: 0x000000, alpha: 0.55 });
  graphics.rect(-width / 2, y, width * fraction, height);
  graphics.fill({ color: TEAM_COLORS[owner === 2 ? 2 : 1], alpha: 0.95 });
}

/** Blends two packed RGB colours. */
function mixToward(from: number, to: number, amount: number): number {
  const t = amount < 0 ? 0 : amount > 1 ? 1 : amount;
  const fr = (from >> 16) & 0xff;
  const fg = (from >> 8) & 0xff;
  const fb = from & 0xff;
  const tr = (to >> 16) & 0xff;
  const tg = (to >> 8) & 0xff;
  const tb = to & 0xff;
  const r = Math.round(fr + (tr - fr) * t);
  const g = Math.round(fg + (tg - fg) * t);
  const b = Math.round(fb + (tb - fb) * t);
  return (r << 16) | (g << 8) | b;
}
