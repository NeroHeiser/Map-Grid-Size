/**
 * Utilitário de cálculo e aplicação de dimensões de grade e cena no Foundry VTT.
 */

/**
 * Obtém as dimensões naturais (largura e altura em pixels) de uma imagem.
 * Utiliza o loadTexture do Foundry com fallback para Image nativo do navegador.
 * 
 * @param {string} src - Caminho da imagem
 * @returns {Promise<{ width: number, height: number } | null>}
 */
export async function getImageDimensions(src) {
  if (!src || typeof src !== "string") return null;

  // Tentativa com API nativa do Foundry VTT (loadTexture / Pixi)
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
    console.warn("Map Grid Sizer | loadTexture falhou, tentando fallback Image:", err);
  }

  // Fallback via objeto Image HTML padrão
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      });
    };
    img.onerror = (err) => {
      console.error("Map Grid Sizer | Falha ao carregar textura da imagem:", src, err);
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Calcula as dimensões finais da cena e o tamanho da grade em pixels
 * de forma que o mapa tenha exatamente o número de colunas e linhas especificado.
 * 
 * @param {number} texWidth - Largura original da imagem em pixels
 * @param {number} texHeight - Altura original da imagem em pixels
 * @param {number} cols - Quantidade de colunas (quadrados na horizontal)
 * @param {number} rows - Quantidade de linhas (quadrados na vertical)
 * @param {object} [options={}] - Opções adicionais
 * @param {number} [options.fixedGridSize=0] - Tamanho fixo de grade (se > 0)
 * @returns {{ width: number, height: number, gridSize: number, cols: number, rows: number }}
 */
export function calculateSceneGrid(texWidth, texHeight, cols, rows, options = {}) {
  let gridSize;

  if (options.fixedGridSize && options.fixedGridSize >= 50) {
    gridSize = Math.round(options.fixedGridSize);
  } else {
    // Calcula o tamanho médio do quadrado baseado na resolução da imagem
    const rawGridX = texWidth / cols;
    const rawGridY = texHeight / rows;
    const avgGrid = (rawGridX + rawGridY) / 2;

    // O Foundry VTT exige gridSize >= 50 pixels
    gridSize = Math.max(50, Math.round(avgGrid));
  }

  // As dimensões da cena são múltiplos exatos do gridSize,
  // garantindo que width / gridSize == cols e height / gridSize == rows com 0% de desvio
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
 * Aplica as configurações calculadas a um documento Scene do Foundry VTT.
 * 
 * @param {Scene} scene - Documento da Cena do Foundry
 * @param {{ width: number, height: number, gridSize: number, cols: number, rows: number }} dimensions
 * @param {object} [options={}]
 * @param {number} [options.padding] - Proporção de padding (0 a 0.5)
 * @param {boolean} [options.notify=true] - Exibir notificação na tela
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

  // Atualiza a cena passando uma flag customizada para evitar loops no hook updateScene
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

