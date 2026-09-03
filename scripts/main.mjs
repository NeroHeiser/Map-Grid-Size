import { parseGridDimensions } from "./parser.mjs";
import { getImageDimensions, calculateSceneGrid, applyGridToScene } from "./resizer.mjs";

const MODULE_ID = "map-grid-sizer";

/**
 * Processa uma cena: detecta as dimensões no nome do arquivo da imagem de fundo,
 * obtém as dimensões da textura, calcula o grid e aplica na cena.
 * 
 * @param {Scene} scene - Cena do Foundry
 * @param {boolean} [forceNotification=false] - Forçar notificação mesmo se configurado para silenciar
 * @returns {Promise<boolean>} Retorna true se a cena foi redimensionada com sucesso
 */
async function processScene(scene, forceNotification = false) {
  if (!scene) return false;

  const src = scene.background?.src || scene.img;
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
/* HOOKS DE INICIALIZAÇÃO                                                    */
/* ========================================================================= */

Hooks.once("init", () => {
  console.log("Map Grid Sizer | Inicializando módulo...");

  // Configuração: Redimensionar automaticamente ao criar cena
  game.settings.register(MODULE_ID, "autoResizeOnCreate", {
    name: "MAP_GRID_SIZER.Settings.AutoResizeOnCreate.Name",
    hint: "MAP_GRID_SIZER.Settings.AutoResizeOnCreate.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Configuração: Redimensionar automaticamente ao alterar a imagem de fundo
  game.settings.register(MODULE_ID, "autoResizeOnUpdate", {
    name: "MAP_GRID_SIZER.Settings.AutoResizeOnUpdate.Name",
    hint: "MAP_GRID_SIZER.Settings.AutoResizeOnUpdate.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Configuração: Padding padrão da cena ao ajustar
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

  // Configuração: Tamanho fixo de grade (opcional, 0 = automático)
  game.settings.register(MODULE_ID, "fixedGridSize", {
    name: "MAP_GRID_SIZER.Settings.FixedGridSize.Name",
    hint: "MAP_GRID_SIZER.Settings.FixedGridSize.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 0
  });

  // Configuração: Exibir notificação na UI
  game.settings.register(MODULE_ID, "notifyOnResize", {
    name: "MAP_GRID_SIZER.Settings.NotifyOnResize.Name",
    hint: "MAP_GRID_SIZER.Settings.NotifyOnResize.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Expõe a API do módulo para macros e outros módulos
  const mod = game.modules.get(MODULE_ID);
  if (mod) {
    mod.api = {
      parseGridDimensions,
      getImageDimensions,
      calculateSceneGrid,
      applyGridToScene,
      processScene
    };
  }
});

Hooks.once("ready", () => {
  console.log("Map Grid Sizer | Pronto para uso!");
});

/* ========================================================================= */
/* HOOKS DE CENAS (CRIAÇÃO E ATUALIZAÇÃO)                                    */
/* ========================================================================= */

// Quando uma cena é criada
Hooks.on("createScene", async (scene, options, userId) => {
  if (game.user.id !== userId || !game.user.isGM) return;
  if (!game.settings.get(MODULE_ID, "autoResizeOnCreate")) return;

  const src = scene.background?.src || scene.img;
  if (src && parseGridDimensions(src)) {
    await processScene(scene, false);
  }
});

// Quando o background de uma cena é alterado
Hooks.on("updateScene", async (scene, changes, options, userId) => {
  if (game.user.id !== userId || !game.user.isGM) return;
  if (options.mapGridSizerApplied) return; // Evita loop recursivo
  if (!game.settings.get(MODULE_ID, "autoResizeOnUpdate")) return;

  const newSrc = changes.background?.src ?? changes.img;
  if (newSrc && parseGridDimensions(newSrc)) {
    await processScene(scene, false);
  }
});

/* ========================================================================= */
/* HOOKS DE INTERFACE (SCENE CONFIG E CONTEXT MENU)                          */
/* ========================================================================= */

// Botão na janela de Configuração da Cena (SceneConfig)
Hooks.on("renderSceneConfig", (app, html, data) => {
  if (!game.user.isGM) return;

  const root = html instanceof HTMLElement ? html : html[0];
  if (!root) return;

  // Localiza o campo de imagem de fundo
  const bgInput = root.querySelector('input[name="background.src"]') || root.querySelector('input[name="img"]');
  if (!bgInput) return;

  // Evita duplicar o botão se já foi injetado
  if (root.querySelector(".map-grid-sizer-btn")) return;

  // Cria o botão de auto-ajuste
  const button = document.createElement("button");
  button.type = "button";
  button.className = "map-grid-sizer-btn";
  button.innerHTML = `<i class="fas fa-ruler-combined"></i> ${game.i18n.localize("MAP_GRID_SIZER.Buttons.AdjustGrid")}`;
  button.title = game.i18n.localize("MAP_GRID_SIZER.Buttons.AdjustGridTitle");

  button.addEventListener("click", async (event) => {
    event.preventDefault();

    const currentSrc = bgInput.value?.trim() || app.document?.background?.src || app.document?.img;
    if (!currentSrc) {
      ui.notifications.warn(game.i18n.localize("MAP_GRID_SIZER.Notifications.NoImage"));
      return;
    }

    const parsed = parseGridDimensions(currentSrc);
    if (!parsed) {
      ui.notifications.warn(game.i18n.format("MAP_GRID_SIZER.Notifications.NoDimensionsFound", { file: currentSrc }));
      return;
    }

    // Feedback visual de carregamento no botão
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

      // Preenche os campos do formulário da SceneConfig
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
        gridTypeSelect.value = "1"; // Quadrados (SQUARE)
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

  // Insere o botão logo após o input de background ou seu container
  const parentContainer = bgInput.closest(".form-group") || bgInput.parentElement;
  if (parentContainer) {
    parentContainer.appendChild(button);
  }
});

// Adiciona opção ao Menu de Contexto (botão direito) na lista de Cenas da barra lateral
Hooks.on("getSceneDirectoryEntryContext", (html, entryOptions) => {
  entryOptions.push({
    name: "MAP_GRID_SIZER.ContextMenu.ResizeScene",
    icon: '<i class="fas fa-ruler-combined"></i>',
    condition: (target) => {
      if (!game.user.isGM) return false;
      const li = target[0] ?? target;
      const sceneId = li.dataset?.documentId || li.dataset?.entryId || li.getAttribute?.("data-document-id") || li.getAttribute?.("data-entry-id");
      const scene = game.scenes?.get(sceneId);
      const src = scene?.background?.src || scene?.img;
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

