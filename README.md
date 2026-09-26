# Map Grid Sizer

[English](README.md) | [Português (Brasil)](README.pt-BR.md)

[![Foundry VTT](https://img.shields.io/badge/Foundry%20VTT-v12%20|%20v14-orange.svg)](https://foundryvtt.com/)
[![Version](https://img.shields.io/badge/version-v1.0.1-blue.svg)](module.json)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-13%20passed-brightgreen.svg)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A lightweight automation module for **Foundry Virtual Tabletop (V12 to V14)** that automatically parses map filename dimensions (e.g. `Forest_Path_30x30.png`) to configure scene dimensions and grid sizes in seconds with zero pixel drift.

---

## Highlights

- **Instant Zero-Drift Calibration:** Automatically aligns scene pixel bounds and grid cell sizes to the exact column/row count embedded in image filenames.
- **Robust Regex Engine:** Advanced non-consuming lookaround regex matching (`(?<!\d)(\d+)\s*[xX]\s*(\d+)(?!\d)`) capable of distinguishing grid dimensions from preceding screen resolutions (e.g., `Map_1920x1080_30x30.png`).
- **Flexible Workflow Integration:** Runs automatically on scene creation, on background image changes, via an inline button in `SceneConfig`, or through the scene directory context menu.
- **Safe Geometry Constraints:** Enforces Foundry minimum grid sizing (50px) and clamps padding to zero for clean map borders.
- **Automated Test Suite:** 13 unit tests verifying dimension extraction, rectangular aspect calculations, edge-case handling, and flat/nested change payloads.

---

## Domain and Feature Tables

### Supported Filename Patterns

| Filename Pattern | Example Input | Extracted Columns | Extracted Rows | Behavior |
| :--- | :--- | :---: | :---: | :--- |
| `NxN` Standard | `Maglura_Entrance_30x30.png` | 30 | 30 | Standard square map grid |
| `NxM` Rectangular | `Underground_Dungeon_40x25.webp` | 40 | 25 | Rectangular room calculation |
| Spaced `[N x M]` | `Ancient_Temple_[20 x 30].jpg` | 20 | 30 | Bracketed and spaced pattern matching |
| Uppercase Delimiter | `Tavern_15X12.jpeg` | 15 | 12 | Case-insensitive `x` delimiter |
| Screen Resolution Preceding | `Battlemap_1920x1080_30x30.png` | 30 | 30 | Prioritizes true grid candidates over resolutions |

### Automation Triggers and Actions

| Trigger | Location | Behavior |
| :--- | :--- | :--- |
| **Scene Pre-Creation** | `preCreateScene` Hook | Automatically detects dimensions from initial image and applies grid settings before first render. |
| **Image Update** | `updateScene` Hook | Detects background changes (including nested and dot-notation `background.src`) and recalibrates scene. |
| **Scene Config Form** | `SceneConfig` Header Button | Adds an "Adjust Grid by Name" button below the background field to fill form values without instant saving. |
| **Context Menu** | Scene Directory | Right-click any scene in the navigation bar to trigger immediate grid recalibration. |

---

## Architecture and Components

- **`parser.mjs` (`parseGridDimensions`):** Pure utility parsing filename strings with lookaround regex to extract column and row pairs without consuming neighboring delimiters.
- **`resizer.mjs` (`calculateSceneGrid`, `getSceneImageSource`):** Pure calculation service calculating exact pixel dimensions (`Math.round`), enforcing minimum grid thresholds, and safely resolving nested image source paths.
- **`main.mjs`:** Foundry lifecycle manager registering settings, attaching lifecycle hooks, and injecting UI controls into `SceneConfig`.

---

## Installation

Install directly within the Foundry VTT Setup menu using the manifest link:

```text
https://raw.githubusercontent.com/NeroHeiser/Map-Grid-Size/main/module.json
```

Or extract the repository archive into your Foundry data folder:
```text
<FoundryData>/Data/modules/map-grid-sizer
```

---

## Automated Testing and Quality

The module includes native automated unit tests executed via the Node.js test runner:

```bash
# Run the complete test suite
npm test
```

Verification coverage:
- Regex parsing against brackets, whitespace, resolutions, and delimiters.
- Grid size computation and aspect ratio rounding.
- Safety boundaries (50px minimum grid clamp, fallback handling).
- Extraction of `background.src` across nested objects and dot-notation keys.

---

## Compatibility and License

- **Foundry VTT:** Verified for v12 and v14.
- **System Agnostic:** Operates identically across any game system (dnd5e, pf2e, tormenta20, etc.).
- **Module Author:** [André Luiz (Lopes / NeroHeiser)](https://github.com/NeroHeiser).
- **License:** [MIT](LICENSE).
