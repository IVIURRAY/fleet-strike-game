/**
 * Uniform spatial hash for broad-phase queries.
 *
 * Replaces the O(n^2) scans that targeting, collision and capture detection
 * would otherwise perform. The docs sketch a `Map<string, Set>` keyed by
 * `"x,y"` strings; integer keys and plain arrays are used instead to avoid
 * per-query string and iterator allocation in the hot path.
 *
 * Query radii can exceed the cell size — the Missile Silo reaches 1500 units
 * against a 250 unit cell — so the neighbourhood scanned is derived from the
 * radius rather than fixed at 3x3.
 */

/** Cells are addressed on a signed grid; this offset keeps keys non-negative. */
const COORD_OFFSET = 1 << 15;

/** Multiplier used to pack a 2D cell address into one integer key. */
const KEY_STRIDE = 1 << 16;

export class SpatialGrid {
  private readonly cellSize: number;
  private readonly cells = new Map<number, number[]>();
  /** Reused between queries so `query` allocates nothing after warm-up. */
  private readonly results: number[] = [];

  constructor(cellSize: number) {
    if (cellSize <= 0) throw new RangeError('cellSize must be positive');
    this.cellSize = cellSize;
  }

  /** Removes every entry, retaining the allocated bucket arrays. */
  clear(): void {
    for (const bucket of this.cells.values()) {
      bucket.length = 0;
    }
  }

  /** Adds an entity at a world position. */
  insert(entity: number, x: number, y: number): void {
    const key = this.keyFor(x, y);
    const bucket = this.cells.get(key);
    if (bucket === undefined) {
      this.cells.set(key, [entity]);
      return;
    }
    bucket.push(entity);
  }

  /**
   * Returns every entity in the cells overlapping the circle
   * `(x, y, radius)`. The result is a shared array that is invalidated by the
   * next call to `query`; copy it if it must outlive the call.
   *
   * Results are a superset of the true matches — callers must still perform a
   * precise distance check.
   */
  query(x: number, y: number, radius: number): readonly number[] {
    const { results } = this;
    results.length = 0;

    const minCellX = Math.floor((x - radius) / this.cellSize);
    const maxCellX = Math.floor((x + radius) / this.cellSize);
    const minCellY = Math.floor((y - radius) / this.cellSize);
    const maxCellY = Math.floor((y + radius) / this.cellSize);

    for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
      for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
        const bucket = this.cells.get(packKey(cellX, cellY));
        if (bucket === undefined) continue;
        for (let i = 0; i < bucket.length; i += 1) {
          results.push(bucket[i] as number);
        }
      }
    }

    return results;
  }

  /** Number of non-empty cells, exposed for diagnostics and tests. */
  get occupiedCellCount(): number {
    let count = 0;
    for (const bucket of this.cells.values()) {
      if (bucket.length > 0) count += 1;
    }
    return count;
  }

  /** Total number of inserted entities. */
  get size(): number {
    let total = 0;
    for (const bucket of this.cells.values()) {
      total += bucket.length;
    }
    return total;
  }

  private keyFor(x: number, y: number): number {
    return packKey(Math.floor(x / this.cellSize), Math.floor(y / this.cellSize));
  }
}

/** Packs a signed cell address into a single integer key. */
function packKey(cellX: number, cellY: number): number {
  return (cellY + COORD_OFFSET) * KEY_STRIDE + (cellX + COORD_OFFSET);
}
