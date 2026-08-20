/**
 * Counts case-insensitive a/e/i/o/u occurrences in a string.
 * @param {string} str
 * @returns {number}
 */
export function countVowels(str) {
  if (!str) return 0;
  const matches = str.match(/[aeiou]/gi);
  return matches ? matches.length : 0;
}
