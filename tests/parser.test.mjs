import test from "node:test";
import assert from "node:assert/strict";
import { parseGridDimensions } from "../scripts/parser.mjs";

test("parseGridDimensions correctly parses standard dimension patterns", () => {
  assert.deepEqual(parseGridDimensions("Entrada de Maglura - 30x30.png"), { cols: 30, rows: 30 });
  assert.deepEqual(parseGridDimensions("Masmorra_40x25.webp"), { cols: 40, rows: 25 });
  assert.deepEqual(parseGridDimensions("Caverna [20 x 30].jpg"), { cols: 20, rows: 30 });
  assert.deepEqual(parseGridDimensions("Salao 15X10.jpeg"), { cols: 15, rows: 10 });
});

test("parseGridDimensions handles resolution preceding grid dimensions without delimiter consumption", () => {
  assert.deepEqual(parseGridDimensions("Mapa_1920x1080_30x30.png"), { cols: 30, rows: 30 });
  assert.deepEqual(parseGridDimensions("Dungeon-3840x2160-50x40.webp"), { cols: 50, rows: 40 });
});

test("parseGridDimensions prioritizes grid candidate over pixel dimensions", () => {
  assert.deepEqual(parseGridDimensions("Mapa_30x30_1920x1080.png"), { cols: 30, rows: 30 });
});

test("parseGridDimensions handles edge cases and invalid inputs", () => {
  assert.equal(parseGridDimensions(""), null);
  assert.equal(parseGridDimensions(null), null);
  assert.equal(parseGridDimensions(undefined), null);
  assert.equal(parseGridDimensions("mapa_sem_dimensoes.png"), null);
});
