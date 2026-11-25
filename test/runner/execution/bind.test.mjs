// test/runner/execution/bind.test.mjs
//
// What the live Node facade owns of a bind: that it reads no state or coordination module, and the lease state
// it reads and hands the host (only when the caller names `accounts`). The ask it builds from the seat ledger is
// owned by packages/execution/engine/tests/planning.rs over packages/execution/contracts/planning/bind-facade.json, and
// every decision of a bind (tier, ranking, independence, pins, persona, effort, refusal, provenance) by
// packages/execution/rust/tests/golden_bind.rs over packages/execution/contracts/bind.v1.json.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensureScriptAddon } from '../../../scripts/lib/git-ports.mjs';
import { bind } from '../../../src/runner/execution/bind.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';
import { seedStubAgentClis } from '../../helpers/agent-clis.mjs';

// posture filtering consults the machine backend registry; keep it file-local
seedFileLocalBwrapRegistry();
seedStubAgentClis('claude', 'codex', 'agy', 'duo', 'pi', 'omp', 'unknown-bin');
ensureScriptAddon();

test('architecture guard: bind.mjs does NOT import src/state or src/runner/coordination', async () => {
  const content = await fs.promises.readFile(new URL('../../../src/runner/execution/bind.mjs', import.meta.url), 'utf8');

  assert.doesNotMatch(content, /from\s+['"][^'"]*\/state\//);
  assert.doesNotMatch(content, /from\s+['"][^'"]*\/runner\/coordination\//);
  assert.doesNotMatch(content, /from\s+['"][^'"]*worktree/);
  assert.doesNotMatch(content, /from\s+['"][^'"]*merge/);
});

// ---- the account the lease takes is named by the bind --------------------------------------------------

function accountConfig(accounts) {
  return {
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    modelPolicies: { alpha: { standard: 'alpha-m' } },
    capabilities: { 'docs:write': { prefer: [{ executor: 'alpha' }] } },
    executors: {
      alpha: {
        kind: 'agent', providerModel: 'alpha',
        invocations: [{ id: 'alpha-cli', via: 'cli', adapter: 'cli-spawn', command: 'pi', confinement: { backend: 'bwrap' }, credentialStore: { use: 'pi', homeEnv: 'PI_HOME', files: ['auth.json'] } }],
      },
    },
    llmAccounts: { alpha: accounts },
  };
}
const piStore = (name) => ({ credentialStore: { pi: `/srv/pi/${name}` } });
const docsAsk = { unit: { id: 'u', capability: 'docs:write', writes: [] }, role: 'producer' };

test('the lease state counts for a bind only when the caller passes it: a quarantined account is skipped, and a replay without it names the candidate the runner bound', async () => {
  const { quarantineProviderAccount, readAccountStateOverlay } = await import('../../../src/runner/dispatch/provider-capacity.mjs');
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bind-accounts-'));
  const runnerConfig = accountConfig({ a: piStore('a'), b: piStore('b') });
  const ctx = () => ({ runnerConfig, session: {}, accountState: readAccountStateOverlay({ runtimeDir, assignmentId: 'asgn' }) });
  assert.equal(bind(docsAsk, ctx()).leaseAccount, 'a');
  quarantineProviderAccount({ provider: 'alpha', accountId: 'a', reasonCode: 'quota-limit', until: new Date(Date.now() + 3_600_000).toISOString(), runtimeDir });
  assert.equal(bind(docsAsk, ctx()).leaseAccount, 'b', 'the quarantined account is out until its end time');
  const replayed = bind(docsAsk, { runnerConfig, session: {} });
  assert.equal(replayed.leaseAccount, 'a', 'a replay reads no lease state, so it arrives at the account the seat was first bound to');
});
