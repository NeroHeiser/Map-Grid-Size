import test from "node:test";
import assert from "node:assert/strict";
import { calculateSceneGrid } from "../scripts/resizer.mjs";

test("calculateSceneGrid computes exact grid size for standard dimensions", () => {
  const result = calculateSceneGrid(3000, 3000, 30, 30);
  assert.deepEqual(result, {
    width: 3000,
    height: 3000,
    gridSize: 100,
    cols: 30,
    rows: 30
  });
});

test("calculateSceneGrid computes and rounds grid size for rectangular maps", () => {
  const result = calculateSceneGrid(4020, 2510, 40, 25);
  assert.deepEqual(result, {
    width: 4000,
    height: 2500,
    gridSize: 100,
    cols: 40,
    rows: 25
  });
});

test("calculateSceneGrid enforces minimum grid size of 50px", () => {
  const result = calculateSceneGrid(300, 300, 30, 30);
  assert.deepEqual(result, {
    width: 1500,
    height: 1500,
    gridSize: 50,
    cols: 30,
    rows: 30
  });
});

test("calculateSceneGrid respects fixedGridSize when provided and >= 50", () => {
  const result = calculateSceneGrid(3000, 2000, 30, 20, { fixedGridSize: 140 });
  assert.deepEqual(result, {
    width: 4200,
    height: 2800,
    gridSize: 140,
    cols: 30,
    rows: 20
  });
});

test("calculateSceneGrid falls back to auto calculation when fixedGridSize is below 50", () => {
  const result = calculateSceneGrid(3000, 3000, 30, 30, { fixedGridSize: 40 });
  assert.deepEqual(result, {
    width: 3000,
    height: 3000,
    gridSize: 100,
    cols: 30,
    rows: 30
  });
});
