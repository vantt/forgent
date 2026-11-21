// test/cli/run-verb.test.mjs -- the one wiring proof of `fgos run` end to end: a prompt reaches the host's unit run,
// which binds the stub executor, runs it confined through the run supervisor and prints the envelope of its result.
// What the flags build is owned by the run request vectors (fgos-execution), the run's outcomes by engine `unit_run`
// and the host's unit run tests, the call's wiring by the `fgos run` cases of apps/fgos/tests/cli_tests.rs.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { spawnFgos } from '../helpers/cli-entry.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();
// bwrap mounts a tmpfs over /tmp, so confined workers can only see fixtures elsewhere.
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { activateGitFixture } from '../helpers/git-fixture.mjs';
import { capabilityServedBy, writeProjectConfig } from '../helpers/config-fixture.mjs';

const BIN_FGOS = path.resolve('bin/fgos.mjs');

function setupTestRepo() {
  const tmp = makeFixtureDir('fgos-cli-run-test-');
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'CLI Test'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'cli@test.local'], { cwd: tmp, stdio: 'ignore' });
  activateGitFixture(tmp);

  fs.writeFileSync(path.join(tmp, 'README.md'), '# CLI Test\n');
  execFileSync('git', ['add', 'README.md'], { cwd: tmp, stdio: 'ignore' });
  const echoScript = path.join(tmp, 'echo-worker.mjs');
  fs.writeFileSync(
    echoScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+result-1\\.json)/.exec(prompt);
    let runDir;
    if (match) {
      runDir = (() => { const d = path.dirname(match[1]); const o = path.join(d, 'worker-output', 'outbox'); return fs.existsSync(o) ? o : d; })();
    } else {
      const asgnDir = path.join(process.cwd(), '.fgos', 'assignments');
      if (fs.existsSync(asgnDir)) {
        for (const top of fs.readdirSync(asgnDir)) {
          const p1 = path.join(asgnDir, top, 'runs', '01');
          if (fs.existsSync(p1)) { runDir = p1; break; }
        }
      }
    }
    if (runDir) {
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'report-1.md'), '# Report\\nAssignment execution completed successfully.\\n');
      fs.writeFileSync(path.join(runDir, 'result-1.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
    }
    `,
  );
  const fgosDir = path.join(tmp, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  const cfg = {
    runner: {
      defaultExecutor: 'test-node',
      defaults: { tier: 'standard' },
      modelPolicies: { node: { nano: 'node-nano', standard: 'node-std', advanced: 'node-adv', flagship: 'node-flagship', frontier: 'node-frontier' } },
      executors: {
        'test-node': {
          kind: 'agent',
          description: 'Test agent',
          allowCrossProvider: true,
          providerModel: 'node',
          invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: process.execPath, args: [echoScript, '{prompt}'] }],
        },
      },
      capabilities: {
        'docs:write': capabilityServedBy('test-node', 'docs:write'),
      },
      patterns: { seatBinding: { schema: 1 } },
      loops: {
        reviewed: { maxRounds: 2, checkersByRigor: { standard: ['reviewer'] } },
      },
    },
  };
  writeProjectConfig(tmp, cfg);

  return tmp;
}

test('fgos run "<prompt>" builds a read-only unit from the prompt, runs it and prints the envelope of its result', () => {
  const tmp = setupTestRepo();
  const run = spawnFgos(BIN_FGOS, ['run', 'Write the release notes', '--capability', 'docs:write', '--dir', tmp], { cwd: tmp, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const { data } = JSON.parse(run.stdout);
  assert.equal(data.outcome, 'pass');
  assert.equal(data.results.at(-1).runResult.agentClaim.summary, 'Done');
  const { unit } = JSON.parse(fs.readFileSync(path.join(tmp, '.fgos', 'assignments', data.unitRunId, 'unit.json'), 'utf8'));
  assert.match(unit.id, /^adhoc-write-the-release-notes-[0-9a-f]{4}$/);
  assert.equal(unit.objective, 'Write the release notes');
  assert.equal(unit.capability, 'docs:write');
  assert.deepEqual(unit.writes, []);
});
