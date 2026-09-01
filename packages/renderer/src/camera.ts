/**
 * Camera controller.
 *
 * Pure coordinate maths with no PixiJS dependency, so it is unit testable and
 * usable by input handling as well as rendering.
 *
 * World space is the simulation's 21000 x 6000 unit map; screen space is CSS
 * pixels within the canvas.
 */

import { DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM, WORLD_HEIGHT, WORLD_WIDTH } from '@fleet-strike/config';
import { clamp, damp } from '@fleet-strike/utils';

/** A rectangle in world space. */
export interface Viewport {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export class Camera {
  /** Centre of the view in world coordinates. */
  private centerX: number;
  private centerY: number;
  /** Pixels per world unit. */
  private currentZoom: number;

  /** Targets that `update` eases toward, giving smooth pans and zooms. */
  private targetX: number;
  private targetY: number;
  private targetZoom: number;

  private viewWidth: number;
  private viewHeight: number;

  constructor(viewWidth: number, viewHeight: number) {
    this.viewWidth = Math.max(1, viewWidth);
    this.viewHeight = Math.max(1, viewHeight);
    this.centerX = WORLD_WIDTH / 2;
    this.centerY = WORLD_HEIGHT / 2;
    this.currentZoom = DEFAULT_ZOOM;
    this.targetX = this.centerX;
    this.targetY = this.centerY;
    this.targetZoom = this.currentZoom;
    this.clampCenter();
  }

  get x(): number {
    return this.centerX;
  }

  get y(): number {
    return this.centerY;
  }

  get zoom(): number {
    return this.currentZoom;
  }

  get width(): number {
    return this.viewWidth;
  }

  get height(): number {
    return this.viewHeight;
  }

  /** Updates the canvas size, e.g. on window resize. */
  resize(viewWidth: number, viewHeight: number): void {
    this.viewWidth = Math.max(1, viewWidth);
    this.viewHeight = Math.max(1, viewHeight);
    this.clampCenter();
  }

  /** Jumps immediately to a world position. */
  snapTo(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
    this.targetX = x;
    this.targetY = y;
    this.clampCenter();
  }

  /** Sets the position the camera eases toward. */
  moveTo(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  /** Pans by a screen-space delta, e.g. a mouse drag. */
  panByScreen(dxScreen: number, dyScreen: number): void {
    this.targetX -= dxScreen / this.currentZoom;
    this.targetY -= dyScreen / this.currentZoom;
    this.clampTarget();
  }

  /** Sets the zoom level the camera eases toward. */
  setZoom(zoom: number): void {
    this.targetZoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
  }

  /**
   * Zooms by a multiplicative factor while keeping the world point under
   * `(screenX, screenY)` fixed, which is what makes wheel zoom feel correct.
   */
  zoomAt(factor: number, screenX: number, screenY: number): void {
    const before = this.screenToWorld(screenX, screenY);
    this.targetZoom = clamp(this.targetZoom * factor, MIN_ZOOM, MAX_ZOOM);
    // Apply immediately so the anchor maths uses the new scale.
    this.currentZoom = this.targetZoom;
    const after = this.screenToWorld(screenX, screenY);
    this.targetX += before.x - after.x;
    this.targetY += before.y - after.y;
    this.centerX += before.x - after.x;
    this.centerY += before.y - after.y;
    this.clampTarget();
    this.clampCenter();
  }

  /** Eases position and zoom toward their targets. */
  update(deltaTime: number): void {
    const smoothing = 12;
    this.currentZoom = damp(this.currentZoom, this.targetZoom, smoothing, deltaTime);
    this.centerX = damp(this.centerX, this.targetX, smoothing, deltaTime);
    this.centerY = damp(this.centerY, this.targetY, smoothing, deltaTime);
    this.clampCenter();
  }

  /** Converts a world position to screen pixels. */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this.centerX) * this.currentZoom + this.viewWidth / 2,
      y: (worldY - this.centerY) * this.currentZoom + this.viewHeight / 2,
    };
  }

  /** Converts screen pixels to a world position. */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.viewWidth / 2) / this.currentZoom + this.centerX,
      y: (screenY - this.viewHeight / 2) / this.currentZoom + this.centerY,
    };
  }

  /** The visible region in world space. */
  getViewport(): Viewport {
    const width = this.viewWidth / this.currentZoom;
    const height = this.viewHeight / this.currentZoom;
    return { x: this.centerX - width / 2, y: this.centerY - height / 2, width, height };
  }

  /** Zoom level at which the whole map fits on screen. */
  fitZoom(): number {
    return Math.min(this.viewWidth / WORLD_WIDTH, this.viewHeight / WORLD_HEIGHT);
  }

  /** Frames the entire map. */
  fitToWorld(): void {
    this.setZoom(this.fitZoom());
    this.moveTo(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
  }

  /**
   * Keeps the camera centre inside the world.
   *
   * When the view is wider than the world on an axis, the camera locks to the
   * world centre on that axis so the map stays framed rather than drifting into
   * empty space.
   */
  private clampCenter(): void {
    const halfWidth = this.viewWidth / this.currentZoom / 2;
    const halfHeight = this.viewHeight / this.currentZoom / 2;

    this.centerX =
      halfWidth * 2 >= WORLD_WIDTH
        ? WORLD_WIDTH / 2
        : clamp(this.centerX, halfWidth, WORLD_WIDTH - halfWidth);
    this.centerY =
      halfHeight * 2 >= WORLD_HEIGHT
        ? WORLD_HEIGHT / 2
        : clamp(this.centerY, halfHeight, WORLD_HEIGHT - halfHeight);
  }

  private clampTarget(): void {
    const halfWidth = this.viewWidth / this.targetZoom / 2;
    const halfHeight = this.viewHeight / this.targetZoom / 2;

    this.targetX =
      halfWidth * 2 >= WORLD_WIDTH
        ? WORLD_WIDTH / 2
        : clamp(this.targetX, halfWidth, WORLD_WIDTH - halfWidth);
    this.targetY =
      halfHeight * 2 >= WORLD_HEIGHT
        ? WORLD_HEIGHT / 2
        : clamp(this.targetY, halfHeight, WORLD_HEIGHT - halfHeight);
  }
}
