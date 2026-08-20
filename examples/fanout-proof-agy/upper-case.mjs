/**
 * Uppercases the first character of a string, leaving the rest unchanged.
 * @param {string} str
 * @returns {string}
 */
export function toUpperFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
