/**
 * Utility functions for the Scrabble game
 */

/**
 * Generate a random game token (6 characters)
 */
export function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate score for placed tiles
 */
export function calculateScore(placements, board, language) {
  // TODO: Implement proper word validation and scoring
  // For now, just calculate basic points
  let totalScore = 0;
  let wordMultiplier = 1;

  placements.forEach(({ row, col, tile }) => {
    const cell = board[row][col];
    let letterScore = tile.points;

    // Apply letter multipliers
    if (cell.type === 'DL') letterScore *= 2;
    if (cell.type === 'TL') letterScore *= 3;

    // Track word multipliers
    if (cell.type === 'DW') wordMultiplier *= 2;
    if (cell.type === 'TW') wordMultiplier *= 3;

    totalScore += letterScore;
  });

  totalScore *= wordMultiplier;

  // Bonus for using all 7 tiles
  if (placements.length === 7) {
    totalScore += 50;
  }

  return totalScore;
}

/**
 * Validate tile placement
 */
export function validatePlacement(placements, board) {
  if (placements.length === 0) return false;

  // Check all placements are in a line
  const rows = placements.map(p => p.row);
  const cols = placements.map(p => p.col);

  const sameRow = rows.every(r => r === rows[0]);
  const sameCol = cols.every(c => c === cols[0]);

  if (!sameRow && !sameCol) return false;

  // Check continuity
  if (sameRow) {
    cols.sort((a, b) => a - b);
    for (let i = 0; i < cols.length - 1; i++) {
      const gap = cols[i + 1] - cols[i];
      if (gap > 1) {
        // Check if gap is filled by existing tiles
        for (let j = cols[i] + 1; j < cols[i + 1]; j++) {
          if (!board[rows[0]][j].tile) return false;
        }
      }
    }
  } else {
    rows.sort((a, b) => a - b);
    for (let i = 0; i < rows.length - 1; i++) {
      const gap = rows[i + 1] - rows[i];
      if (gap > 1) {
        // Check if gap is filled by existing tiles
        for (let j = rows[i] + 1; j < rows[i + 1]; j++) {
          if (!board[j][cols[0]].tile) return false;
        }
      }
    }
  }

  return true;
}

/**
 * Check if first move touches center
 */
export function isFirstMoveCentered(placements) {
  return placements.some(({ row, col }) => row === 7 && col === 7);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      document.body.removeChild(textarea);
      return false;
    }
  }
}
