// agy-permissions.test.mjs -- one `fgos doctor` wiring proof that the host reports the agy sub-HOME row and the agy
// permissions row. Sub-HOME discovery is owned by the `find_sub_homes` tests in packages/execution/rust/src/checks.rs.
// The agy permissions row itself is owned by packages/distribution/rust/src/agent_config.rs; that no fgOS verb writes the
// person's own agy settings is proven in test/setup/agent-wiring.test.mjs. Every case overrides HOME.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import {
  NO_CLAUDE_ENV,
  assert,
  fs,
  mkTemp,
  runHostDoctor,
} from './helpers/setup-checks-harness.mjs';

function doctorCheck(result, id) {
  const { data } = JSON.parse(result.stdout);
  const entry = data.checks.find((c) => c.id === id);
  assert.ok(entry, `doctor did not report a "${id}" check`);
  return entry;
}

test('fgos doctor reports the agy-permissions and agy sub-HOME rows', () => {
  const cwd = mkTemp('agy-perms-doctor-cwd-');
  const homeDir = mkTemp('agy-perms-doctor-home-');
  const env = { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir };

  // boundary: the one wiring proof that the doctor verb registers and reports both agy rows.
  const result = runHostDoctor([], { cwd, env });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(doctorCheck(result, 'agy-permissions-configured').passed, true);
  // With no executor config the sub-HOME row has nothing to check.
  assert.equal(doctorCheck(result, 'agy-sub-homes-configured').passed, true);

  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});
