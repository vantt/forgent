import { invokeHost } from '../util/host-bin.mjs';

/**
 * Checks explicit repository-relative paths or every rule-declared scope through
 * the native Convention provider. Measures the caller's tree, never its main
 * checkout; host discovery still follows the standard installation resolver.
 *
 * @param {string[]|{all: true}} selection
 * @param {{dir?: string}} [options]
 * @returns {{checked: number, violations: Array<{path: string, code: string, message: string}>}}
 */
export function conventionCheck(selection, { dir = process.cwd() } = {}) {
  const args = ['convention', 'check', '--json'];
  if (Array.isArray(selection)) {
    args.push('--', ...selection);
  } else if (selection?.all === true) {
    args.push('--all');
  } else {
    throw new TypeError('conventionCheck expects an array of paths or {all:true}');
  }
  return invokeHost(args, { dir, dirScope: 'caller' });
}
