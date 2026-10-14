// Shared fixture for tests whose Work driver steps run as Units (runUnit).
//
// A driver operation binds from the runner config its caller hands over, and its worker runs
// confined (bwrap). A test config that only names the legacy global `executor` (or executors
// without invocations) therefore gets confined executors and a pool per driver capability.

import { execFileSync } from 'node:child_process';

const UNIT_CAPABILITIES = ['review', 'coding:review', 'implement', 'code:implement'];

/** A runner config a confined Unit can bind with: each executor (the global `executor` too) under
 * a `fixture-` id -- a bare `claude` id would pick up the real CLI from the machine's global
 * config -- with a bwrap-confined cli invocation, and a pool for each driver capability. */
export function confinedUnitConfig(config = {}) {
  const source = { ...(config.executors ?? {}) };
  if (config.executor && !source.claude) source.claude = { ...config.executor };
  // The test's own executors stay as they are, for whatever else of the loop reads them.
  const executors = { ...(config.executors ?? {}) };
  for (const [id, entry] of Object.entries(source)) {
    executors[`fixture-${id}`] = Array.isArray(entry.invocations) && entry.invocations.length > 0 ? entry : {
      kind: 'agent',
      allowCrossProvider: true,
      providerModel: 'node',
      ...entry,
      invocations: [{ id: 'cli', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: entry.command, args: entry.args ?? [] }],
    };
  }
  const first = Object.keys(executors).find((id) => id.startsWith('fixture-'));
  const capabilities = { ...(config.capabilities ?? {}) };
  for (const cap of UNIT_CAPABILITIES) capabilities[cap] ??= { prefer: [{ executor: first }] };
  const modelPolicies = { ...(config.modelPolicies ?? {}) };
  modelPolicies.node ??= modelPolicies.claude ?? { standard: 'test-model' };
  return { ...config, executors, capabilities, modelPolicies };
}

/** A Unit runs only in a git repo: make `root` one when a test's temp dir is not. */
export function ensureGitRepo(root) {
  try {
    execFileSync('git', ['rev-parse', '--git-dir'], { cwd: root, stdio: 'ignore' });
  } catch {
    execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: root });
    execFileSync('git', ['config', 'user.name', 'test'], { cwd: root });
    execFileSync('git', ['config', 'user.email', 'test@test'], { cwd: root });
    execFileSync('git', ['commit', '-q', '--allow-empty', '-m', 'initial commit'], { cwd: root });
  }
}

