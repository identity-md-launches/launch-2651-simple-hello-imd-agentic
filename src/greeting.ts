export const NAME_MAX_LENGTH = 60;

/** Longest run of characters rendered without a break opportunity. */
export const BREAK_EVERY = 16;

/** Collapses inner whitespace and trims, so "  Ada   Lovelace " becomes "Ada Lovelace". */
export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, NAME_MAX_LENGTH);
}

/**
 * Splits a name into pieces of at most BREAK_EVERY characters so the page can offer a line break
 * between them. With no CSS there is no overflow-wrap, and one long word would scroll at 320 wide.
 */
export function breakablePieces(name: string): string[] {
  const pieces: string[] = [];
  for (let start = 0; start < name.length; start += BREAK_EVERY) {
    pieces.push(name.slice(start, start + BREAK_EVERY));
  }
  return pieces;
}
