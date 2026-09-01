import { describe, expect, it } from 'vitest';

import { SpatialGrid } from './spatial-grid';

describe('SpatialGrid', () => {
  it('rejects a non-positive cell size', () => {
    expect(() => new SpatialGrid(0)).toThrow(RangeError);
    expect(() => new SpatialGrid(-5)).toThrow(RangeError);
  });

  it('returns entities inside the query radius', () => {
    const grid = new SpatialGrid(100);
    grid.insert(1, 50, 50);
    grid.insert(2, 5000, 5000);

    const result = grid.query(50, 50, 60);
    expect(result).toContain(1);
    expect(result).not.toContain(2);
  });

  it('finds entities in adjacent cells', () => {
    const grid = new SpatialGrid(100);
    // Entities either side of a cell boundary at x = 100.
    grid.insert(1, 95, 50);
    grid.insert(2, 105, 50);

    const result = [...grid.query(100, 50, 20)];
    expect(result.sort()).toEqual([1, 2]);
  });

  it('scans enough cells when the radius exceeds the cell size', () => {
    const grid = new SpatialGrid(250);
    // A missile silo reaches 1500 units, six cells away.
    grid.insert(1, 0, 0);
    grid.insert(2, 1400, 0);
    grid.insert(3, 0, 1400);
    grid.insert(4, 2000, 2000);

    const result = [...grid.query(0, 0, 1500)];
    expect(result).toContain(1);
    expect(result).toContain(2);
    expect(result).toContain(3);
    expect(result).not.toContain(4);
  });

  it('handles negative coordinates', () => {
    const grid = new SpatialGrid(100);
    grid.insert(1, -250, -250);
    expect([...grid.query(-250, -250, 50)]).toEqual([1]);
  });

  it('supports many entities in one cell', () => {
    const grid = new SpatialGrid(100);
    for (let i = 0; i < 500; i += 1) {
      grid.insert(i, 10, 10);
    }
    expect(grid.size).toBe(500);
    expect(grid.query(10, 10, 5)).toHaveLength(500);
  });

  it('empties on clear but keeps buckets allocated', () => {
    const grid = new SpatialGrid(100);
    grid.insert(1, 10, 10);
    grid.insert(2, 500, 500);
    expect(grid.size).toBe(2);

    grid.clear();
    expect(grid.size).toBe(0);
    expect(grid.occupiedCellCount).toBe(0);
    expect(grid.query(10, 10, 50)).toHaveLength(0);
  });

  it('reuses the result array between queries', () => {
    const grid = new SpatialGrid(100);
    grid.insert(1, 10, 10);
    const first = grid.query(10, 10, 5);
    const second = grid.query(10, 10, 5);
    expect(first).toBe(second);
  });

  it('reports occupied cell count', () => {
    const grid = new SpatialGrid(100);
    grid.insert(1, 10, 10);
    grid.insert(2, 20, 20);
    grid.insert(3, 500, 500);
    expect(grid.occupiedCellCount).toBe(2);
  });

  it('does not collide keys across the grid', () => {
    const grid = new SpatialGrid(100);
    // (cellX=1, cellY=0) and (cellX=0, cellY=1) must map to distinct keys.
    grid.insert(1, 150, 50);
    grid.insert(2, 50, 150);
    expect([...grid.query(150, 50, 10)]).toEqual([1]);
    expect([...grid.query(50, 150, 10)]).toEqual([2]);
  });
});
