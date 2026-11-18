// test/runner/execution/bind.test.mjs
//
// What the Node facade owns of a bind: the ask it builds from the seat ledger, that it reads no state or
// coordination module, and the lease state it reads and hands the host (only when the caller names `accounts`).
// Every decision of a bind (tier, ranking, independence, pins, persona, effort, refusal, provenance) is owned by
// packages/execution/rust/tests/golden_bind.rs over packages/execution/contracts/bind.v1.json.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensureScriptAddon } from '../../../scripts/lib/git-ports.mjs';
import { askFor, bind } from '../../../src/runner/execution/bind.mjs';
import { createSeatLedger } from '../../../src/runner/execution/seat-ledger.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';
import { seedStubAgentClis } from '../../helpers/agent-clis.mjs';

// posture filtering consults the machine backend registry; keep it file-local
seedFileLocalBwrapRegistry();
seedStubAgentClis('claude', 'codex', 'agy', 'duo', 'pi', 'omp', 'unknown-bin');
ensureScriptAddon();

const POSTURE = { readOnly: false, writer: false, forceOutOfProcess: false, stance: false, verdict: false };
const CHECKER = { seat: 'reviewer', role: 'reviewer', posture: { ...POSTURE, readOnly: true, forceOutOfProcess: true, verdict: true } };

test('the bind ask holds a seat to the executor of a seat bound earlier that must differ from it', () => {
  const unit = { id: 'u1', capability: 'docs:write', writes: [] };
  const ledger = createSeatLedger();
  const seat = (id) => ({ ...CHECKER, seat: id });
  // The checker binds first and names the producer, not bound yet: nothing is excluded.
  assert.deepEqual(askFor({ seat: seat('checker'), unit, independentOf: ['producer'] }, ledger).independentOf, ['producer']);
  ledger.note('checker', 'codex');
  ledger.noteDependence('checker', ['producer']);
  // The producer names no independence of its own, yet it may not share the checker's family.
  assert.deepEqual(askFor({ seat: seat('producer'), unit }, ledger).independentOf, ['codex']);
});

test('a reviewed unit that declares a tier asks every seat at it, naming the unit as the source', () => {
  const unit = { id: 'review-it', capability: 'docs:write', writes: [], tier: 'flagship' };
  const ledger = createSeatLedger();
  for (const seat of [{ ...CHECKER, seat: 'red-team' }, { seat: 'producer', role: 'producer', posture: CHECKER.posture }]) {
    assert.deepEqual(askFor({ seat, unit }, ledger, { workflowId: 'wf' }).workflowTier, { tier: 'flagship', source: 'workflow:wf/review-it' }, seat.seat);
  }
});

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

test('the lease state is read for a bind only when the caller names accounts: a quarantined account is skipped, and a replay without them names the candidate the runner bound', async () => {
  const { quarantineProviderAccount } = await import('../../../src/runner/dispatch/provider-capacity.mjs');
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bind-accounts-'));
  const runnerConfig = accountConfig({ a: piStore('a'), b: piStore('b') });
  const ctx = { runnerConfig, session: {}, accounts: { runtimeDir, assignmentId: 'asgn' } };
  assert.equal(bind(docsAsk, ctx).leaseAccount, 'a');
  quarantineProviderAccount({ provider: 'alpha', accountId: 'a', reasonCode: 'quota-limit', until: new Date(Date.now() + 3_600_000).toISOString(), runtimeDir });
  assert.equal(bind(docsAsk, ctx).leaseAccount, 'b', 'the quarantined account is out until its end time');
  const replayed = bind(docsAsk, { runnerConfig, session: {} });
  assert.equal(replayed.leaseAccount, 'a', 'a replay reads no lease state, so it arrives at the account the seat was first bound to');
});
