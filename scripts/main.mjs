import { parseGridDimensions } from "./parser.mjs";
import { getImageDimensions, calculateSceneGrid, applyGridToScene, getSceneImageSource } from "./resizer.mjs";

const MODULE_ID = "map-grid-sizer";

/**
 * Processes a scene: detects dimensions in the background image filename,
 * calculates the grid size, and applies the updated dimensions to the scene.
 * 
 * @param {Scene} scene - Foundry Scene document
 * @param {boolean} [forceNotification=false] - Force notification even if user muted notifications
 * @returns {Promise<boolean>} True if resized successfully
 */
async function processScene(scene, forceNotification = false) {
  if (!scene) return false;

  const src = getSceneImageSource(scene);
  if (!src) {
    if (forceNotification) {
      ui.notifications.warn(game.i18n.localize("MAP_GRID_SIZER.Notifications.NoImage"));
    }
    return false;
  }

  const parsed = parseGridDimensions(src);
  if (!parsed) {
    if (forceNotification) {
      ui.notifications.warn(game.i18n.format("MAP_GRID_SIZER.Notifications.NoDimensionsFound", { file: src }));
    }
    return false;
  }

  const texDims = await getImageDimensions(src);
  if (!texDims) {
    ui.notifications.error(game.i18n.format("MAP_GRID_SIZER.Notifications.LoadImageError", { file: src }));
    return false;
  }

  const fixedGridSize = game.settings.get(MODULE_ID, "fixedGridSize") || 0;
  const padding = game.settings.get(MODULE_ID, "scenePadding");
  const notifySetting = game.settings.get(MODULE_ID, "notifyOnResize");

  const dims = calculateSceneGrid(texDims.width, texDims.height, parsed.cols, parsed.rows, {
    fixedGridSize
  });

  await applyGridToScene(scene, dims, {
    padding: typeof padding === "number" ? padding : 0,
    notify: forceNotification || notifySetting
  });

  return true;
}

/* ========================================================================= */
/* INITIALIZATION HOOKS                                                      */
/* ========================================================================= */

Hooks.once("init", () => {
  console.log("Map Grid Sizer | Initializing module...");

  game.settings.register(MODULE_ID, "autoResizeOnCreate", {
    name: "MAP_GRID_SIZER.Settings.AutoResizeOnCreate.Name",
    hint: "MAP_GRID_SIZER.Settings.AutoResizeOnCreate.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "autoResizeOnUpdate", {
    name: "MAP_GRID_SIZER.Settings.AutoResizeOnUpdate.Name",
    hint: "MAP_GRID_SIZER.Settings.AutoResizeOnUpdate.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "scenePadding", {
    name: "MAP_GRID_SIZER.Settings.ScenePadding.Name",
    hint: "MAP_GRID_SIZER.Settings.ScenePadding.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 0,
    choices: {
      0: "MAP_GRID_SIZER.Settings.ScenePadding.Choices.Zero",
      0.05: "MAP_GRID_SIZER.Settings.ScenePadding.Choices.Five",
      0.1: "MAP_GRID_SIZER.Settings.ScenePadding.Choices.Ten",
      0.25: "MAP_GRID_SIZER.Settings.ScenePadding.Choices.Default"
    }
  });

  game.settings.register(MODULE_ID, "fixedGridSize", {
    name: "MAP_GRID_SIZER.Settings.FixedGridSize.Name",
    hint: "MAP_GRID_SIZER.Settings.FixedGridSize.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 0
  });

  game.settings.register(MODULE_ID, "notifyOnResize", {
    name: "MAP_GRID_SIZER.Settings.NotifyOnResize.Name",
    hint: "MAP_GRID_SIZER.Settings.NotifyOnResize.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  const mod = game.modules.get(MODULE_ID);
  if (mod) {
    mod.api = {
      parseGridDimensions,
      getImageDimensions,
      calculateSceneGrid,
      applyGridToScene,
      getSceneImageSource,
      processScene
    };
  }
});

Hooks.once("ready", () => {
  console.log("Map Grid Sizer | Ready!");
});

/* ========================================================================= */
/* SCENE HOOKS                                                               */
/* ========================================================================= */

Hooks.on("createScene", async (scene, options, userId) => {
  if (game.user.id !== userId || !game.user.isGM) return;
  if (!game.settings.get(MODULE_ID, "autoResizeOnCreate")) return;

  const src = getSceneImageSource(scene);
  if (src && parseGridDimensions(src)) {
    await processScene(scene, false);
  }
});

Hooks.on("updateScene", async (scene, changes, options, userId) => {
  if (game.user.id !== userId || !game.user.isGM) return;
  if (options.mapGridSizerApplied) return;
  if (!game.settings.get(MODULE_ID, "autoResizeOnUpdate")) return;

  const newSrc = getSceneImageSource(changes);
  if (newSrc && parseGridDimensions(newSrc)) {
    await processScene(scene, false);
  }
});

/* ========================================================================= */
/* UI HOOKS                                                                  */
/* ========================================================================= */

Hooks.on("renderSceneConfig", (app, html, data) => {
  if (!game.user.isGM) return;

  const root = html instanceof HTMLElement ? html : html[0];
  if (!root) return;

  const bgInput = root.querySelector('input[name="background.src"]') || root.querySelector('input[name="img"]');
  if (!bgInput) return;

  if (root.querySelector(".map-grid-sizer-btn")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "map-grid-sizer-btn";
  button.innerHTML = `<i class="fas fa-ruler-combined"></i> ${game.i18n.localize("MAP_GRID_SIZER.Buttons.AdjustGrid")}`;
  button.title = game.i18n.localize("MAP_GRID_SIZER.Buttons.AdjustGridTitle");

  button.addEventListener("click", async (event) => {
    event.preventDefault();

    const currentSrc = bgInput.value?.trim() || getSceneImageSource(app.document);
    if (!currentSrc) {
      ui.notifications.warn(game.i18n.localize("MAP_GRID_SIZER.Notifications.NoImage"));
      return;
    }

    const parsed = parseGridDimensions(currentSrc);
    if (!parsed) {
      ui.notifications.warn(game.i18n.format("MAP_GRID_SIZER.Notifications.NoDimensionsFound", { file: currentSrc }));
      return;
    }

    const originalText = button.innerHTML;
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${game.i18n.localize("MAP_GRID_SIZER.Buttons.Calculating")}`;
    button.disabled = true;

    try {
      const texDims = await getImageDimensions(currentSrc);
      if (!texDims) {
        ui.notifications.error(game.i18n.format("MAP_GRID_SIZER.Notifications.LoadImageError", { file: currentSrc }));
        return;
      }

      const fixedGridSize = game.settings.get(MODULE_ID, "fixedGridSize") || 0;
      const padding = game.settings.get(MODULE_ID, "scenePadding");
      const dims = calculateSceneGrid(texDims.width, texDims.height, parsed.cols, parsed.rows, {
        fixedGridSize
      });

      const widthInput = root.querySelector('input[name="width"]');
      const heightInput = root.querySelector('input[name="height"]');
      const gridSizeInput = root.querySelector('input[name="grid.size"]') || root.querySelector('input[name="gridSize"]');
      const gridTypeSelect = root.querySelector('select[name="grid.type"]') || root.querySelector('select[name="gridType"]');
      const paddingInput = root.querySelector('input[name="padding"]');

      if (widthInput) {
        widthInput.value = dims.width;
        widthInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (heightInput) {
        heightInput.value = dims.height;
        heightInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (gridSizeInput) {
        gridSizeInput.value = dims.gridSize;
        gridSizeInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (gridTypeSelect) {
        gridTypeSelect.value = "1";
        gridTypeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (paddingInput && typeof padding === "number") {
        paddingInput.value = padding;
        paddingInput.dispatchEvent(new Event("change", { bubbles: true }));
      }

      ui.notifications.info(game.i18n.format("MAP_GRID_SIZER.Notifications.FormUpdated", {
        cols: dims.cols,
        rows: dims.rows,
        size: dims.gridSize,
        width: dims.width,
        height: dims.height
      }));
    } finally {
      button.innerHTML = originalText;
      button.disabled = false;
    }
  });

  const parentContainer = bgInput.closest(".form-group") || bgInput.parentElement;
  if (parentContainer) {
    parentContainer.appendChild(button);
  }
});

Hooks.on("getSceneDirectoryEntryContext", (html, entryOptions) => {
  entryOptions.push({
    name: "MAP_GRID_SIZER.ContextMenu.ResizeScene",
    icon: '<i class="fas fa-ruler-combined"></i>',
    condition: (target) => {
      if (!game.user.isGM) return false;
      const li = target[0] ?? target;
      const sceneId = li.dataset?.documentId || li.dataset?.entryId || li.getAttribute?.("data-document-id") || li.getAttribute?.("data-entry-id");
      const scene = game.scenes?.get(sceneId);
      const src = getSceneImageSource(scene);
      return !!src;
    },
    callback: async (target) => {
      const li = target[0] ?? target;
      const sceneId = li.dataset?.documentId || li.dataset?.entryId || li.getAttribute?.("data-document-id") || li.getAttribute?.("data-entry-id");
      const scene = game.scenes?.get(sceneId);
      if (scene) {
        await processScene(scene, true);
      }
    }
  });
});
