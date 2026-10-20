// A throwaway git repo plus a confined fake worker, for suites that run registered Workflows end to end.
//
// Only the external worker is fake: settlement, bounded review, report handoff and the Workflow
// runner's own advance and projection stay in the execution path. The worker body is the code that
// writes a unit's outputs; it sees `fs`, `path`, `prompt` and `runDir` (the directory the worker
// leaves `agent-report.md` and `agent-result.json` in). bwrap mounts a tmpfs over /tmp, so the repo
// lives in a fixture directory a confined worker can see.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { withProviderFamilies } from './provider-families.mjs';
import { makeFixtureDir } from './fixture-dir.mjs';
import { activateGitFixture } from './git-fixture.mjs';

/**
 * @param {object} options
 * @param {string} options.prefix Fixture directory name prefix
 * @param {string} options.readme First line of the README the repo starts with
 * @param {string} options.gitName Committer name (the email is derived from it)
 * @param {string[]} options.capabilities Capabilities the executor serves
 * @param {string} options.workerBody Worker code that writes the unit's outputs into `runDir`
 * @param {object} [options.modelPolicies] Model policy per provider model
 * @param {object} [options.reviewed] The `reviewed` pattern config
 * @returns {string} The repo root
 */
export function setupWorkflowFixtureRepo({
  prefix,
  readme,
  gitName,
  capabilities,
  workerBody,
  modelPolicies = { node: { standard: 'node-std' } },
  reviewed = { maxRounds: 1, checkersByRigor: { standard: ['reviewer'] } },
}) {
  const tmp = makeFixtureDir(prefix);
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', gitName], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'wf@test.local'], { cwd: tmp, stdio: 'ignore' });

  fs.writeFileSync(path.join(tmp, 'README.md'), `${readme}\n`);
  execFileSync('git', ['add', 'README.md'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial commit'], { cwd: tmp, stdio: 'ignore' });
  activateGitFixture(tmp);

  const echoScript = path.join(tmp, 'echo-worker.mjs');
  fs.writeFileSync(
    echoScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      const runDir = (() => { const d = path.dirname(match[1]); const o = path.join(d, 'worker-output', 'outbox'); return fs.existsSync(o) ? o : d; })();
      fs.mkdirSync(runDir, { recursive: true });
      ${workerBody}
    }
    `,
  );

  const fgosDir = path.join(tmp, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });

  const cfg = {
    runner: {
      defaultExecutor: 'test-node',
      rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
      modelPolicies,
      executors: {
        'test-node': {
          kind: 'agent',
          description: 'Test node executor',
          allowCrossProvider: true,
          command: process.execPath,
          args: [echoScript, '{prompt}'],
          providerModel: 'node',
          invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: process.execPath, args: [echoScript, '{prompt}'] }],
        },
      },
      capabilities: Object.fromEntries(capabilities.map((name) => [name, { prefer: [{ executor: 'test-node' }], rigor: 'standard' }])),
      patterns: {
        defaultRule: { mutatingMinRigor: 'standard' },
        reviewed,
      },
    },
  };
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify(withProviderFamilies(cfg), null, 2));

  return tmp;
}
