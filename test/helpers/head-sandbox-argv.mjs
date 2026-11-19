// head-sandbox-argv.mjs -- prints the bwrap command a confined head session would be launched with, as one JSON line,
// for a test that runs a command inside that same sandbox (apps/fgos/tests/questions_head.rs).
//
// The argv comes from the real resolver and driver (`resolveConfinementResources`, `prepareBwrapSync`) in the terminal
// launch mode a head uses, with the head's request socket bound back; nothing here decides what the sandbox hides.
// usage: node head-sandbox-argv.mjs <json {project, scratch, home, runtimeDir, requestSocket, gateBin, bindBack}>
// `bindBack` lists host paths read-only bound back over the sandbox's private /tmp, for a fixture that lives there (a real
// project does not). The reply is {command, args, home}: `home` is the sandbox's private home, the HOME a head runs with.

import fs from 'node:fs';
import path from 'node:path';
import { prepareBwrapSync } from '../../src/runner/dispatch/confinement/drivers/bwrap.mjs';
import { resolveConfinementResources } from '../../src/runner/dispatch/confinement/resources.mjs';
import { BUILTIN_POLICIES } from '../../src/runner/dispatch/confinement/policies.mjs';
import { fgosDirFromRoot } from '../../src/util/fgos-file-registry.mjs';
import { GIT_ADDON_SOURCE_DIGEST_FILE, REPO_ROOT, ensureAddonForScript, gitAddonDirectory, gitAddonSourceDigest } from '../../scripts/lib/git-addon-stage.mjs';
import { devHostEnv } from '../../scripts/lib/dev-host-manifest.mjs';

// The driver reads and writes through the native addon. Use the one the caller's environment names, else the one already
// staged in this checkout for exactly these sources; only when neither exists is it built and staged (a cargo build).
function useStagedAddon() {
  const dir = gitAddonDirectory(REPO_ROOT);
  const manifest = path.join(dir, 'manifest.json');
  const host = path.join(dir, 'fgos');
  try {
    if (fs.readFileSync(path.join(dir, GIT_ADDON_SOURCE_DIGEST_FILE), 'utf8') !== gitAddonSourceDigest(REPO_ROOT)) return false;
    if (!fs.existsSync(manifest) || !fs.existsSync(host) || !fs.existsSync(path.join(dir, 'fgos.node'))) return false;
  } catch {
    return false;
  }
  Object.assign(process.env, devHostEnv({}, { fgosBin: host, checkoutRoot: REPO_ROOT, manifestPath: manifest }));
  return true;
}
if (!process.env.FGOS_ACTIVE_MANIFEST_PATH && !useStagedAddon()) ensureAddonForScript(process.env);
const { project, scratch, home, runtimeDir, requestSocket, gateBin, bindBack = [] } = JSON.parse(process.argv[2]);
const fgosDir = fgosDirFromRoot(project);
const runDir = path.join(fgosDir, 'assignments', 'head-sandbox-proof', 'self', '1', 'runs', '01');
const credsDir = path.join(scratch, 'creds');
for (const dir of [credsDir, path.join(runDir, 'worker-output', 'outbox')]) fs.mkdirSync(dir, { recursive: true });
process.env.XDG_RUNTIME_DIR = runtimeDir;

const resources = resolveConfinementResources({
  dispatchId: 'head-sandbox-proof',
  context: { cwd: project, repoRoot: project, runDir, fgosDir, assignmentLaunchContext: {} },
  grants: BUILTIN_POLICIES['host-write-denied'].grants,
  backendConfig: { tempRoot: path.join(scratch, 'confinement-temp') },
  providerSources: { credentialsPath: credsDir },
  blind: false,
  homeDir: home,
  claudeSocketBase: path.join(scratch, 'claude'),
  xdgRuntimeDir: runtimeDir,
  xdgConfigHome: null,
  herdrSocketPath: path.join(home, '.config', 'herdr', 'herdr.sock'),
  loginStores: [],
});
const request = {
  dispatchId: 'head-sandbox-proof',
  launchMode: 'terminal',
  attemptId: 'head-sandbox-proof',
  gateCommand: [gateBin, 'internal', 'gate', '--go-socket', path.join(runtimeDir, 'fgos', 'go.sock')],
  requestSocket,
  invocation: { command: 'agent', args: [], env: {} },
  context: { cwd: project, repoRoot: project, runDir, fgosDir },
};
const { invocation } = prepareBwrapSync({ resources }, request, { id: 'bwrap', config: { executable: '/usr/bin/bwrap' } });
// The private /tmp comes first in the argv; every later mount (the head's own binds) lands on top of it.
const args = [...invocation.args];
const tmpAt = args.findIndex((arg, at) => arg === '--tmpfs' && args[at + 1] === '/tmp');
args.splice(tmpAt + 2, 0, ...bindBack.flatMap((hostPath) => ['--ro-bind', hostPath, hostPath]));
const privateHome = resources.find((res) => res.resource === 'private-home');
process.stdout.write(`${JSON.stringify({ command: invocation.command, args, home: privateHome.executionTarget.path })}\n`);
