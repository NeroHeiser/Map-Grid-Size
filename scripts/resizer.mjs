/**
 * Utility functions for grid calculation and scene configuration in Foundry VTT.
 */

/**
 * Extracts the image source path from a Scene document or an update changes object.
 * Supports nested background.src, dot-notation "background.src", and legacy img properties.
 * 
 * @param {object} target - Scene document or changes object
 * @returns {string | null}
 */
export function getSceneImageSource(target) {
  if (!target || typeof target !== "object") return null;

  if (typeof foundry !== "undefined" && foundry.utils?.getProperty) {
    const val = foundry.utils.getProperty(target, "background.src");
    if (val) return val;
  }

  return target["background.src"] ?? target.background?.src ?? target.img ?? null;
}

/**
 * Retrieves the natural dimensions (width and height in pixels) of an image.
 * Uses Foundry's loadTexture when available with fallback to native Image element.
 * 
 * @param {string} src - Image path or URL
 * @returns {Promise<{ width: number, height: number } | null>}
 */
export async function getImageDimensions(src) {
  if (!src || typeof src !== "string") return null;

  try {
    if (typeof loadTexture === "function") {
      const tex = await loadTexture(src);
      const width = tex?.baseTexture?.width ?? tex?.width;
      const height = tex?.baseTexture?.height ?? tex?.height;
      if (width && height) {
        return { width, height };
      }
    }
  } catch (err) {
    console.warn("Map Grid Sizer | loadTexture failed, falling back to Image:", err);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      });
    };
    img.onerror = (err) => {
      console.error("Map Grid Sizer | Failed to load image texture:", src, err);
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Calculates final scene dimensions and grid size in pixels to match exact column and row counts.
 * 
 * @param {number} texWidth - Image width in pixels
 * @param {number} texHeight - Image height in pixels
 * @param {number} cols - Number of grid columns (horizontal squares)
 * @param {number} rows - Number of grid rows (vertical squares)
 * @param {object} [options={}] - Additional options
 * @param {number} [options.fixedGridSize=0] - Fixed grid size if > 0
 * @returns {{ width: number, height: number, gridSize: number, cols: number, rows: number }}
 */
export function calculateSceneGrid(texWidth, texHeight, cols, rows, options = {}) {
  let gridSize;

  if (options.fixedGridSize && options.fixedGridSize >= 50) {
    gridSize = Math.round(options.fixedGridSize);
  } else {
    const rawGridX = texWidth / cols;
    const rawGridY = texHeight / rows;
    const avgGrid = (rawGridX + rawGridY) / 2;

    // Foundry VTT requires gridSize >= 50 pixels
    gridSize = Math.max(50, Math.round(avgGrid));
  }

  const sceneWidth = cols * gridSize;
  const sceneHeight = rows * gridSize;

  return {
    width: sceneWidth,
    height: sceneHeight,
    gridSize,
    cols,
    rows
  };
}

/**
 * Applies calculated dimensions to a Foundry VTT Scene document.
 * 
 * @param {Scene} scene - Foundry Scene document
 * @param {{ width: number, height: number, gridSize: number, cols: number, rows: number }} dimensions
 * @param {object} [options={}]
 * @param {number} [options.padding] - Extra scene padding ratio (0 to 0.5)
 * @param {boolean} [options.notify=true] - Whether to show a UI notification
 * @returns {Promise<Scene>}
 */
export async function applyGridToScene(scene, dimensions, options = {}) {
  if (!scene) return null;

  const updateData = {
    width: dimensions.width,
    height: dimensions.height,
    grid: {
      size: dimensions.gridSize,
      type: CONST.GRID_TYPES?.SQUARE ?? 1
    }
  };

  if (typeof options.padding === "number") {
    updateData.padding = options.padding;
  }

  // Pass custom flag to avoid recursive loops in updateScene hook
  const updated = await scene.update(updateData, { mapGridSizerApplied: true });

  if (options.notify !== false && ui?.notifications) {
    const msg = game.i18n.format("MAP_GRID_SIZER.Notifications.SceneResized", {
      name: scene.name,
      cols: dimensions.cols,
      rows: dimensions.rows,
      size: dimensions.gridSize
    });
    ui.notifications.info(msg);
  }

  return updated;
}
