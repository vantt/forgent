// Runs one vector of packages/execution/contracts/checks.v1.json against the Node judges of the doctor rows
// that read the runner config or the machine it names. The same file serves whoever records the vectors, so a
// vector is read one way only. A vector is `{ name, row, runner?, machine?, expect }`; `machine` describes what a
// row reads of the machine (`omp`: what `omp --version` does, `env`, `files`, `dirs`, `platform`, `arch`; paths
// begin with `$ROOT`, the temporary directory the machine is built under, and `$ROOT/home` is the home), so a
// vector never depends on the machine running it. A vector with `"handRecorded": true` states an answer written
// from reading the Node body, because that body reads the live machine and cannot be fed a described one.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateGeneratedPathsShape } from '../../src/runner/dispatch/config.mjs';
import { normalizeLegacyConfinement } from '../../src/runner/dispatch/confinement/policies.mjs';
import { capabilityNamesOf, capabilityServesOf } from '../../src/runner/execution/capability-config.mjs';
import { checkExecutorConfinement, checkInvocationGitWriteGrants } from '../../src/setup/registrations.mjs';
import { checkOmpNativesPresent, ompExecutorsOf } from '../../src/setup/omp-natives-checks.mjs';
import { checkAgySubHomesConfigured } from '../../src/setup/agy-permissions.mjs';

const ROOT = '$ROOT';

const substitute = (value, root) => JSON.parse(JSON.stringify(value ?? null).split(ROOT).join(root));

/** `normalizeConfigConfinement` of the runner loader: an executor's own confinement as the loaded config holds it. */
function loadedConfinement(runner) {
  const cfg = JSON.parse(JSON.stringify(runner ?? {}));
  for (const executor of Object.values(cfg.executors ?? {})) {
    if (!executor?.confinement) continue;
    const normalized = normalizeLegacyConfinement(executor.confinement);
    if (!normalized) continue;
    if (executor.confinement.backend) normalized.backend = executor.confinement.backend;
    executor.confinement = normalized;
  }
  return cfg;
}

/** The body of `checkRunnerGeneratedPathsConfig` over a section the config door already read. */
function generatedPathsRow(runner) {
  const generatedPaths = runner.generatedPaths ?? [];
  try {
    validateGeneratedPathsShape(generatedPaths, 'runner');
  } catch (err) {
    return { passed: false, message: err.message };
  }
  return { passed: true, message: `runner.generatedPaths is valid (${generatedPaths.length} mapping(s))` };
}

/** The body of `checkCapabilityServesValid` over a section the config door already read. */
function servesRow(runner) {
  const normalize = (serves) => JSON.stringify(Object.fromEntries(Object.entries(serves).sort(([a], [b]) => a.localeCompare(b))));
  const servesByName = new Map();
  for (const name of capabilityNamesOf(runner)) {
    const serves = capabilityServesOf(runner, name);
    if (serves !== undefined) servesByName.set(name, serves);
  }
  const seen = new Map();
  for (const [name, serves] of servesByName) {
    const signature = normalize(serves);
    const prior = seen.get(signature);
    if (prior) return { passed: false, message: `"${prior}" and "${name}" declare the identical "serves" attribute set -- capability matching can never distinguish them` };
    seen.set(signature, name);
  }
  return { passed: true, message: `${servesByName.size} capability entr${servesByName.size === 1 ? 'y declares' : 'ies declare'} a valid "serves" attribute set, none identical` };
}

function withRoot(machine = {}, fn) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'checks-vector-')));
  try {
    const home = path.join(root, 'home');
    fs.mkdirSync(home);
    for (const dir of machine.dirs ?? []) fs.mkdirSync(substitute(dir, root), { recursive: true });
    for (const file of machine.files ?? []) {
      const at = substitute(file, root);
      fs.mkdirSync(path.dirname(at), { recursive: true });
      fs.writeFileSync(at, '');
    }
    const answer = fn({ root, home });
    return JSON.parse(JSON.stringify(answer).split(root).join(ROOT));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function ompRow(vector) {
  const machine = vector.machine ?? {};
  return withRoot(machine, ({ root, home }) => {
    const bin = path.join(root, 'bin');
    fs.mkdirSync(bin);
    if (machine.omp?.output !== undefined) {
      fs.writeFileSync(path.join(bin, 'omp'), `#!/bin/sh\necho '${machine.omp.output}'\n`, { mode: 0o755 });
    } else if (machine.omp?.exit !== undefined) {
      fs.writeFileSync(path.join(bin, 'omp'), `#!/bin/sh\nexit ${machine.omp.exit}\n`, { mode: 0o755 });
    }
    const env = { PATH: bin, ...substitute(machine.env ?? {}, root) };
    return checkOmpNativesPresent({
      ompExecutors: ompExecutorsOf(vector.runner ?? {}),
      env,
      home,
      platform: machine.platform ?? 'linux',
      arch: machine.arch ?? 'x64',
    });
  });
}

function agyRow(vector) {
  return withRoot(vector.machine, ({ root, home }) => {
    const runner = substitute(vector.runner ?? {}, root);
    return checkAgySubHomesConfigured(root, { homeDir: home, config: { runner } });
  });
}

/** The answer of one vector, with the temporary root written back as `$ROOT`. */
export function evaluateVector(vector) {
  if (vector.handRecorded) return vector.expect;
  const runner = vector.runner ?? {};
  switch (vector.row) {
    case 'runner-generated-paths': return generatedPathsRow(runner);
    case 'executor-confinement': return checkExecutorConfinement(loadedConfinement(runner));
    case 'invocation-git-write-grants': return checkInvocationGitWriteGrants(runner);
    case 'capability-serves-valid': return servesRow(runner);
    case 'omp-natives-present': return ompRow(vector);
    case 'agy-sub-homes-configured': return agyRow(vector);
    default: throw new Error(`checks vector "${vector.name}": no Node judge for row ${vector.row}`);
  }
}
