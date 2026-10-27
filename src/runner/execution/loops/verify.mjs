/**
 * Verification command resolution for collaboration loops.
 * Reads the unit's own `verify`, else its capability's. Nothing else supplies one,
 * so a unit without either is not verified, and says so.
 */

/**
 * The verify command of a unit: its own `verify`, else its capability's. Nothing else supplies one,
 * so a unit without either is not verified, and says so.
 *
 * @param {object} unit
 * @param {object} cfg
 * @returns {string|undefined}
 */
export function verifyCommandOf(unit, cfg) {
  const command = unit?.verify || cfg?.capabilities?.[unit?.capability]?.verify;
  return typeof command === 'string' && command.trim() ? command : undefined;
}

/**
 * Check if a verify command exists on the unit or its capability.
 *
 * @param {object} unit
 * @param {object} cfg
 * @returns {boolean}
 */
export function hasVerifyCommand(unit, cfg) {
  return verifyCommandOf(unit, cfg) !== undefined;
}
