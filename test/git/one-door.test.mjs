// The one-door gate's owning proof (Git spec §12, V-GATE): the static scan finds a Git spawn in each
// shape a literal `execFile('git', ['<write verb>', ...])` search misses, and doctor's
// git-mutation-one-door refuses a census that lists a site or was not built from its payload.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scan, census, verifyCensus, MUTATION_CENSUS_PATH } from '../../scripts/git-one-door-scan.mjs';

const PROBES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'git-one-door');

// Each probe tree hides one shape; the scan must report a site in the named file with that family.
const SHAPES = [
  ['callback-argv', 'src/runner.mjs', 'spawn', 'argv injected through a callback from another file'],
  ['borrowed-facade', 'src/borrow.mjs', 'borrowed', "spawn through holder-lock's runBorrowed facade"],
  ['argv-variable', 'src/reset.mjs', 'spawn', 'binary and argv held in variables, argv mutated'],
  ['global-options', 'src/remote.mjs', 'spawn', 'global options and a spread prefix before the verb'],
  ['wrapper-prepends-verb', 'src/wrap.mjs', 'spawn', 'a wrapper that prepends the verb, binary chosen by a ternary'],
  ['rust-variable-binary', 'packages/demo/rust/src/lib.rs', 'rust', 'Rust Command::new with the binary passed as a parameter'],
  ['shell-string', 'scripts/release.mjs', 'shell', 'a shell string with git after &&'],
  ['hook-replay-and-skill', 'src/replay.mjs', 'hook-spawn', 'a direct hook replay'],
  ['hook-replay-and-skill', 'core/skills/demo/SKILL.md', 'skill', 'skill text telling an agent to run a Git write'],
  ['read-verb-writes', 'bin/status.mjs', 'spawn', 'a read verb (status) that refreshes the index'],
  // Shapes the resolution must still catch now that it follows argv runners and launchers.
  ['rust-command-alias', 'packages/demo/rust/src/lib.rs', 'rust', 'Rust Command imported under another name'],
  ['rust-shell-args', 'packages/demo/rust/src/lib.rs', 'rust', 'a Rust shell with git in its .args(["-c", ...]) script'],
  ['rust-argv-runner', 'packages/demo/rust/src/lib.rs', 'rust', 'git passed to a Rust argv-running primitive through a struct field'],
  ['launcher-operand', 'src/plan.mjs', 'wrapper-caller', 'git as the command operand of a timeout launcher'],
  ['consumer-marker-on-git', 'src/verify.mjs', 'consumer-marker', 'the consumer-command marker on a spawn of git itself'],
];

test('the static scan reports a Git spawn in each shape a literal search misses', () => {
  for (const [probe, file, family, shape] of SHAPES) {
    const { sites } = scan({ root: path.join(PROBES, probe) });
    assert.ok(sites.some((s) => s.path === file && s.family === family), `${probe}: ${shape} not reported (got ${JSON.stringify(sites)})`);
  }
  // The callback shape counts the caller in the other file on the spawn site.
  const [site] = scan({ root: path.join(PROBES, 'callback-argv') }).sites;
  assert.deepEqual(site.callers, ['src/caller.mjs:4']);
});

test('doctor refuses a census that lists a site, or whose files do not match the payload it sits in', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-one-door-'));
  fs.cpSync(path.join(PROBES, 'read-verb-writes'), root, { recursive: true });
  const write = (doc) => {
    fs.mkdirSync(path.join(root, path.dirname(MUTATION_CENSUS_PATH)), { recursive: true });
    fs.writeFileSync(path.join(root, MUTATION_CENSUS_PATH), JSON.stringify(doc));
  };
  const built = census(scan({ root }));
  assert.equal(verifyCensus(built, root).passed, false, 'a listed site fails the check');
  assert.match(verifyCensus(built, root).message, /bin\/status\.mjs:\d+ \(spawn\)/);

  const empty = census({ ...scan({ root }), sites: [] });
  assert.equal(verifyCensus(empty, root).passed, true, 'an empty census built from this payload passes');
  fs.appendFileSync(path.join(root, 'bin/status.mjs'), '// edited after the build\n');
  assert.match(verifyCensus(empty, root).message, /not built from this payload: bin\/status\.mjs/);

  write({ ...empty, files: { ...empty.files, 'bin/other.mjs': 'x' } });
  assert.match(verifyCensus(JSON.parse(fs.readFileSync(path.join(root, MUTATION_CENSUS_PATH), 'utf8')), root).message, /digest does not match its own file list/);
  assert.equal(verifyCensus(null, root).passed, false, 'a missing census fails');
});
