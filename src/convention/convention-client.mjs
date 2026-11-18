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
  return invokeHost(args, { dir });
}

/**
 * Whether `name` is a plan directory name the Convention rules accept ({YYMMDD-HHMM}-{slug}): null when it is,
 * the provider's refusal text when it is not. Asked through `convention path --plan`, the one place that rule lives;
 * a host that cannot answer throws.
 *
 * @param {string} name plan directory name, without the `plans/` prefix
 * @param {{dir?: string}} [options]
 * @returns {string|null}
 */
export function planDirNameProblem(name, { dir = process.cwd() } = {}) {
  try {
    invokeHost(['convention', 'path', '--kind', 'report', '--type', 'check', '--plan', name, '--slug', 'plan-check', '--json'], { dir });
    return null;
  } catch (err) {
    if (err.code === 'host-exec-error' && /invalid-plan-dir/.test(err.stderr ?? '')) return err.stderr.trim();
    throw err;
  }
}
