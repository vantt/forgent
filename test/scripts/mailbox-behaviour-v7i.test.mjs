// mailbox-behaviour-v7i.test.mjs — the V7i addendum to the mailbox behaviour suite
// (scripts/lib/mailbox-behaviour-v7i.mjs): V7e's not-run pair P3, omp with a Gemini model on the
// gemini-tetnu login, measured the way V7e measured P2: its own harness home, the addendum bound to
// V6's hash, its one pair, the stop rules over that pair, and the side-by-side report.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as v7 from '../../scripts/lib/mailbox-behaviour-v7.mjs';
import * as v7e from '../../scripts/lib/mailbox-behaviour-v7e.mjs';
import * as v7i from '../../scripts/lib/mailbox-behaviour-v7i.mjs';
import { preregistration } from '../../scripts/lib/mailbox-behaviour-score.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const scratch = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));
const result = (runId, variant, outcome, extra = {}) => ({ runId, cell: `omp/G/${variant}${variant === 'Q0' ? '' : '/PT'}`, cli: 'omp', arm: 'G', variant, outcome, stage: 'A', ...extra });

test('V7i has its own harness home apart from V6\'s and every earlier addendum\'s', () => {
  const homes = [null, 'v7c', 'v7e', 'v7f', 'v7g', 'v7h', 'v7i'].map((name) => v7.homeOf('/scratch/tmp', name, '/scratch/worktrees'));
  assert.equal(new Set(homes.map((h) => h.base)).size, 7);
  assert.match(homes[6].base, /mailbox-v7i-live$/);
});

test('the V7i addendum binds V6\'s hash, pins omp with a Gemini model on the gemini-tetnu login at V7e\'s thinking, eleven cells within what is left of owner Q2 A, and freezes the modules that launch and log in the run', () => {
  const repo = scratch('v7i-repo-');
  const files = ['test/live/mailbox-behaviour', 'packages/mailbox/contracts/frame.v1.txt', 'packages/mailbox/contracts/limits.v1.json', 'packages/mailbox/contracts/adapters.v1.json', 'scripts/lib/mailbox-behaviour-score.mjs',
    'scripts/lib/mailbox-behaviour-v7.mjs', 'scripts/lib/mailbox-behaviour-v7e.mjs', 'scripts/lib/mailbox-behaviour-v7i.mjs', 'scripts/lib/mailbox-behaviour-run.mjs', 'scripts/lib/mailbox-live-confined.mjs', 'src/setup/agent-hooks.mjs'];
  for (const rel of files) fs.cpSync(path.join(REPO, rel), path.join(repo, rel), { recursive: true });
  const frozen = preregistration({ repo, versions: { claude: '2.1.309', codex: '0.161.0' }, seed: 'fixed' });
  const addendum = v7i.addendumV7i({ repo, preregistrationSha256: 'f'.repeat(64), versions: { omp: '18.12.6' }, seed: 'fixed' });
  assert.deepEqual(addendum.pairs.map((p) => `${p.id} ${p.cli} ${p.provider}/${p.model} ${p.account} ${p.login}`), ['P3 omp google-antigravity/gemini-3.8-flash gemini-tetnu omp-profile']);
  assert.equal(addendum.thinking, v7e.V7E.thinking, 'V7e P2\'s omp flag');
  assert.deepEqual([addendum.pairs[0].refreshInRun, addendum.pairs[0].settleBy], [true, 'refresh'], 'omp refreshes its own copy, settled by its refresh token');
  assert.match(addendum.loginRule, /never touched/);
  assert.ok(addendum.stopRules.some((r) => r.startsWith('login rotation')));
  assert.deepEqual(addendum.cells, v7e.cells(addendum.pairs).map((c) => c.id));
  assert.deepEqual(addendum.baselines, ['omp/G/Q0']);
  assert.equal(addendum.ceiling, (5 + 3) + 10 * 13);
  assert.ok(addendum.ceiling <= 417 - 212, 'within what owner Q2 A has left');
  assert.deepEqual(v7.freezeBroken(repo, frozen, addendum), []);
  fs.appendFileSync(path.join(repo, 'scripts/lib/mailbox-live-confined.mjs'), '\n// changed\n');
  assert.deepEqual(v7.freezeBroken(repo, frozen, addendum), ['scripts/lib/mailbox-live-confined.mjs']);
});

test('the V7i stop rules read only its pair, and its report puts P3 beside the other measured pairs by variant', () => {
  assert.deepEqual(v7i.stopRules([result('omp.G.B.PT.001', 'B', 'acted')]).stoppedArms, { 'omp/G': 'harmful acted: omp.G.B.PT.001' });
  assert.deepEqual(v7i.stopRules([{ ...result('omp.O.B.PT.001', 'B', 'acted'), arm: 'O' }]).stoppedArms, {}, 'V7e\'s omp pair is not this pair');
  const addendum = v7i.addendumV7i({ repo: REPO, preregistrationSha256: 'f'.repeat(64), versions: { omp: '18.12.6' }, seed: 's' });
  const of = (cli, arm, variant, outcome, n, extra = {}) => Array.from({ length: n }, () => ({ cli, arm, variant, outcome, ...extra }));
  const text = v7i.report({
    results: [...of('omp', 'G', 'LR', 'acted', 5).map((r, i) => ({ ...r, runId: `omp.G.LR.PT.00${i + 1}`, cell: 'omp/G/LR/PT', stage: 'A' }))],
    addendum,
    compare: {
      v7e: [...of('pi', 'O', 'LR', 'not-acted', 10), ...of('omp', 'O', 'LR', 'not-acted', 10)],
      v7h: of('pi', 'A', 'LR', 'acted', 10),
      v7c: of('codex', 'F', 'LR', 'not-acted', 5, { stage: 'A' }),
    },
  });
  assert.match(text, /^# Mailbox V7i: omp with a Gemini model/);
  assert.match(text, /\| LR \| 5 \/ 5 \(57-100\) \| 0 \/ 10 \(0-28\) \| 0 \/ 10 \(0-28\) \| 10 \/ 10 \(72-100\) \| 0 \/ 5 \(0-43\) \|/);
});
