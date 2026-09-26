# Project Review and Refactor Summary: Map Grid Sizer

## 1. Overview
This review consolidated the module's testability, compatibility with Foundry VTT v12–v14 data changes, and alignment with strict Clean Code standards.

---

## 2. Integrated Features and Improvements

### Automated Testing and Infrastructure
- **`package.json`**: Added module definition with ES module type and standard `npm test` script using Node.js native test runner (`node:test`).
- **`tests/resizer.test.mjs`**: Full unit test coverage for mathematical functions:
  - Exact grid size calculation on square maps.
  - Rounding logic on rectangular maps.
  - Minimum 50px grid limit enforcement.
  - Optional `fixedGridSize` setting behavior.
  - Image extraction logic from various scene payloads.

### Foundry VTT Hook Resiliency
- **`getSceneImageSource(target)`**: Utility function in `scripts/resizer.mjs` that robustly resolves image sources across:
  - Flattened dot-notation diffs (`changes["background.src"]`).
  - Nested objects (`changes.background.src` or `scene.background.src`).
  - Foundry utility resolution (`foundry.utils.getProperty`).
  - Legacy scene structures (`target.img`).
- Integrated into `createScene`, `updateScene`, `processScene`, `renderSceneConfig`, and sidebar context menu hooks.

### Clean Code and Codebase Standardization
- All JSDoc documentation, comments, and console log messages standardized into English across `parser.mjs`, `resizer.mjs`, and `main.mjs`.
- Removed redundant/obvious inline comments.

---

## 3. Test Execution
To run all automated unit tests:

```bash
npm test
```
