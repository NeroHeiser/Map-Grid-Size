/**
 * Utility to extract grid dimensions (columns x rows) from map image filenames.
 */

/**
 * Parses a file path or filename and extracts grid column and row counts.
 *
 * Supported examples:
 * - "Entrada de Maglura - 30x30.png" -> { cols: 30, rows: 30 }
 * - "Masmorra_40x25.webp" -> { cols: 40, rows: 25 }
 * - "Caverna [20 x 30].jpg" -> { cols: 20, rows: 30 }
 * - "Salao 15X10.jpeg" -> { cols: 15, rows: 10 }
 * - "Mapa_30x30_1920x1080.png" -> { cols: 30, rows: 30 }
 *
 * @param {string} filePath - Full path or filename
 * @returns {{ cols: number, rows: number } | null}
 */
export function parseGridDimensions(filePath) {
  if (!filePath || typeof filePath !== "string") return null;

  let decoded = filePath;
  try {
    decoded = decodeURIComponent(filePath);
  } catch {
    // Retain original string if URI decoding fails
  }

  const filename = decoded.split("/").pop().split("\\").pop();
  const nameWithoutExt = filename.replace(/\.[a-zA-Z0-9]+$/, "");

  // Match dimension patterns like 30x30, 30 x 30, 30X30 without consuming delimiters
  const regex = /(?<!\d)(\d+)\s*[xX]\s*(\d+)(?!\d)/g;
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

  // Distinguish grid tile counts (<= 250) from pixel resolutions (>= 300)
  const gridCandidate = matches.find((m) => m.cols <= 250 && m.rows <= 250);
  if (gridCandidate) return gridCandidate;

  return matches[0];
}
