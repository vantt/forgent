// Doctor readiness of the paseo carrier (src/setup/paseo-checks.mjs). The daemon is replaced by an
// injected answer; the row never writes paseo's config.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPaseoExecutors } from '../../src/setup/paseo-checks.mjs';

const cfg = { executors: { 'codex-paseo': { invocations: [{ id: 'codex-paseo', via: 'cli', adapter: 'paseo-spawn', command: 'codex' }] }, other: { invocations: [{ id: 'x', via: 'cli', adapter: 'cli-spawn', command: 'codex' }] } } };

test('the paseo row passes without asking when nothing runs through paseo, warns on a silent daemon, and fails with the provider entry to add when one is missing', () => {
  let asked = 0;
  const ask = (answer) => () => { asked += 1; return answer; };
  assert.equal(checkPaseoExecutors({ executors: { other: cfg.executors.other } }, { ask: ask({ ok: true, providers: [] }), stateRoot: '/state' }).passed, true);
  assert.equal(asked, 0, 'no paseo invocation, no question to the daemon');

  const silent = checkPaseoExecutors(cfg, { ask: ask({ ok: false, detail: 'connect refused' }), stateRoot: '/state' });
  assert.equal(silent.passed, true);
  assert.match(silent.message, /^warning: .*codex-paseo\/codex-paseo.*connect refused/);

  const missing = checkPaseoExecutors(cfg, { ask: ask({ ok: true, providers: [{ provider: 'codex', status: 'available' }] }), stateRoot: '/state' });
  assert.equal(missing.passed, false);
  assert.match(missing.message, /needs provider fgos-codex/);
  assert.ok(missing.message.includes('"command":["/state/bin/fgos-exec-codex"]'), 'the entry to add names the state-root link');

  const unavailable = checkPaseoExecutors(cfg, { ask: ask({ ok: true, providers: [{ provider: 'fgos-codex', status: 'unavailable' }] }), stateRoot: '/state' });
  assert.equal(unavailable.passed, false);
  assert.match(unavailable.message, /fgos-codex is unavailable/);

  assert.equal(checkPaseoExecutors(cfg, { ask: ask({ ok: true, providers: [{ provider: 'fgos-codex', status: 'available' }] }), stateRoot: '/state' }).passed, true);
});
