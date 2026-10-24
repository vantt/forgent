// A CLI Work command run by a worker inside a real bwrap domain (spec §16). The sandbox leaves the project store
// read-only, so the command is refused before it appends anything: no event exists to lose and no seal child is ever
// started in the domain. A seal child that did exist would share the fate proven in direct-crash-matrix (a session
// leader the worker leaves behind dies with the attempt domain), and the next command outside seals the backlog.
import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { BIN_FGOS, bwrapUsable, createProject, readJson, startRun, waitUntil } from '../run-supervisor/support/direct-harness.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';
import { prepareWorkStore } from '../../src/state/work-event-store.mjs';
import { scan, judge } from '../../src/runner/dispatch/process-identity.mjs';

seedFileLocalBwrapRegistry();
const skip = !bwrapUsable() && 'bwrap with a pid namespace is not usable on this machine';
const AGENT = path.resolve(import.meta.dirname, 'fixtures/seal-handoff-agent.mjs');

function useAgent(project, options) {
  const file = path.join(project.repoDir, '.fgos', 'config.json');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const invocation = config.runner.executors.noisy.invocations[0];
  invocation.args = [AGENT, '{prompt}'];
  invocation.env = { AGENT_OPTS: JSON.stringify(options) };
  writeProjectConfig(project.repoDir, config);
}

test('a CLI Work command inside a confined attempt is refused read-only, starts no seal child, and the next command outside seals', { skip, timeout: 240_000 }, async () => {
  const project = createProject();
  const cli = (args) => spawnSync(process.execPath, [BIN_FGOS, ...args, '--dir', project.repoDir], { cwd: project.repoDir, env: project.env, encoding: 'utf8' });
  const added = cli(['add', 'cf-1', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--step', 'executing', '--description', 'confined seal fixture']);
  assert.equal(added.status, 0, added.stderr);
  const dirOf = path.join(project.repoDir, '.fgos');
  const store = prepareWorkStore(dirOf, dirOf).store;
  const total = () => store.read({ streams: ['project'] }, []).events.length;
  const eventsBefore = total();
  // The sandbox scrubs the environment: the worker is handed the host and identity variables the command needs.
  const env = Object.fromEntries(Object.entries(project.env).filter(([key]) => key.startsWith('FGOS_') && key !== 'FGOS_SESSION_ID'));
  useAgent(project, { bin: BIN_FGOS, repo: project.repoDir, args: ['move', 'cf-1', '--to', 'blocked'], env });

  await startRun(project, project.unitFile('confined-seal')).exited;
  const dir = await waitUntil(() => project.attemptDirs().find((d) => fs.existsSync(path.join(d, 'closed.json'))), { timeoutMs: 150_000, what: 'the attempt to close' });
  const command = readJson(path.join(dir, 'worker-output/outbox/command.json'));
  assert.notEqual(command.status, 0, 'the command did not succeed inside the sandbox');
  assert.match(command.stderr, /EROFS/, 'the store is read-only for the worker');
  assert.equal(total(), eventsBefore, 'the refused command appended nothing');

  const views = scan({});
  const sealChildren = views === 'unsupported' ? [] : views.filter((view) => {
    const args = Array.isArray(view.cmdline) ? view.cmdline.join(' ') : String(view.cmdline);
    return args.includes(' events seal ') && args.includes(project.repoDir) && (view.tuple === null || judge(view.tuple) !== 'dead');
  });
  assert.deepEqual(sealChildren, [], 'no seal child was started');

  const moved = cli(['move', 'cf-1', '--to', 'blocked']);
  assert.equal(moved.status, 0, moved.stderr);
  const receipt = () => {
    const file = path.join(project.repoDir, '.git', 'fgos', 'events', 'project', 'sealed.json');
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)).lastSeq : 0;
  };
  await waitUntil(() => receipt() === total(), { timeoutMs: 20_000, what: 'the command outside the sandbox to seal every event' });
});
