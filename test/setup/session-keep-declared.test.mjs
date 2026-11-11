import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { checkSessionKeepDeclared } from '../../src/setup/session-keep-declared.mjs';

const confined = { backend: 'bwrap' };
const store = (extra = {}) => ({ use: 'pi', homeEnv: 'PI_CODING_AGENT_DIR', ...extra });

test('doctor names the executors whose confined invocations declare no session directory and points at the probe, as a warning that never fails', () => {
  const cfg = {
    executors: {
      kept: { kind: 'agent', invocations: [{ id: 'pi-bwrap', via: 'cli', command: 'pi', confinement: confined, credentialStore: store({ sessionDir: 'sessions' }) }] },
      undeclared: { kind: 'agent', invocations: [{ id: 'pi-undeclared', via: 'cli', command: 'pi', confinement: confined, credentialStore: store() }] },
      unconfined: { kind: 'agent', invocations: [{ id: 'plain', via: 'cli', command: 'x' }] },
      tool: { kind: 'tool', invocations: [{ id: 't', via: 'cli', confinement: confined }] },
    },
  };
  const row = checkSessionKeepDeclared(cfg);
  assert.equal(row.passed, true);
  assert.match(row.message, /^warning: 1 confined invocation\(s\) keep no session transcript \(undeclared\/pi-undeclared\)/);
  assert.match(row.message, /fgos dispatch probe-session undeclared/);
  assert.equal(row.fix, undefined, 'a pointer row never carries a fix');
});

test('doctor stays plain when every confined invocation declares its session directory', () => {
  const cfg = { executors: { kept: { kind: 'agent', invocations: [{ id: 'pi-bwrap', via: 'cli', command: 'pi', confinement: confined, credentialStore: store({ sessionDir: 'sessions' }) }] } } };
  const row = checkSessionKeepDeclared(cfg);
  assert.equal(row.passed, true);
  assert.doesNotMatch(row.message, /^warning:/);
});
