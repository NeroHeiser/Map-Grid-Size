/**
 * Utilitário para interpretar e extrair as dimensões da grade (colunas x linhas)
 * a partir do nome do arquivo da imagem do mapa.
 */

/**
 * Analisa o caminho ou nome de um arquivo e extrai o número de quadrados de grade (largura x altura).
 * 
 * Exemplos suportados:
 * - "Entrada de Maglura - 30x30.png" -> { cols: 30, rows: 30 }
 * - "Masmorra_40x25.webp" -> { cols: 40, rows: 25 }
 * - "Caverna [20 x 30].jpg" -> { cols: 20, rows: 30 }
 * - "Salao 15X10.jpeg" -> { cols: 15, rows: 10 }
 * - "Mapa_30x30_1920x1080.png" -> { cols: 30, rows: 30 } (prioriza grade ao invés de resolução)
 * 
 * @param {string} filePath - Caminho completo ou nome do arquivo
 * @returns {{ cols: number, rows: number } | null}
 */
export function parseGridDimensions(filePath) {
  if (!filePath || typeof filePath !== "string") return null;

  // Decodifica caracteres de URL (ex: %20 -> espaço)
  let decoded = filePath;
  try {
    decoded = decodeURIComponent(filePath);
  } catch (e) {
    // Caso haja caractere inválido na URI, mantém o original
  }

  // Extrai apenas o nome do arquivo (remove diretórios com / ou \)
  const filename = decoded.split("/").pop().split("\\").pop();

  // Remove a extensão do arquivo (ex: .png, .webp, .jpg, .jpeg)
  const nameWithoutExt = filename.replace(/\.[a-zA-Z0-9]+$/, "");

  // Busca todas as ocorrências de padrões "NUMxNUM"
  // Aceita: 30x30, 30 x 30, 30X30, etc.
  const regex = /(?:^|[^\d])(\d+)\s*[xX]\s*(\d+)(?:[^\d]|$)/g;
  const matches = [];
  let match;

  while ((match = regex.exec(nameWithoutExt)) !== null) {
    const cols = parseInt(match[1], 10);
    const rows = parseInt(match[2], 10);
    if (cols > 0 && rows > 0) {
      matches.push({ cols, rows });
    }
  }

  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Se houver mais de uma correspondência (ex: "Mapa_30x30_1920x1080.png"):
  // Diferencia número de quadrados de grade (geralmente entre 5 e 250)
  // de resoluções em pixels de tela/imagem (geralmente >= 300).
  const gridCandidate = matches.find(m => m.cols <= 250 && m.rows <= 250);
  if (gridCandidate) return gridCandidate;

  // Caso contrário, retorna a primeira ocorrência
  return matches[0];
}

