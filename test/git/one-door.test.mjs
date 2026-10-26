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
import { sandboxNamedPaths } from '../../scripts/lib/git-spawn-match.mjs';
import { scan, census, verifyCensus, MUTATION_CENSUS_PATH } from '../../scripts/git-one-door-scan.mjs';
import { productFrame } from '../helpers/git-spawn-spy.mjs';

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
  // A function handed on as a value, a method of a returned object, and a Vec's first element built by push.
  ['function-value-flow', 'src/probe.mjs', 'wrapper-caller', 'a returned method passed under a key to an unresolved callee'],
  ['method-return', 'src/run.mjs', 'spawn', "the binary returned by a method of a factory's object"],
  ['rust-first-push', 'packages/demo/rust/src/lib.rs', 'rust', 'git as the first push of a Vec a local Rust function builds'],
  ['shell-data-operand', 'scripts/setup.sh', 'shell', 'a command substitution inside a quoted echo operand'],
  // Configuration and value shapes the flow follows by property path, and the N-API boundary.
  ['config-path-flow', 'src/run.mjs', 'wrapper-caller', 'git as an executor command in defaults deep-merged under parsed config'],
  ['function-param-call', 'src/run.mjs', 'wrapper-caller', 'git returned by a function the caller passes in a parameter'],
  ['map-registry', 'src/run.mjs', 'spawn', 'git returned by a method of a value stored in a module-private Map'],
  ['both-ways-value', 'src/run.mjs', 'wrapper-caller', 'a wrapper called by name and also handed on as a value called with git'],
  ['rust-option-match', 'packages/demo/rust/src/lib.rs', 'rust', 'a Rust if-let over a match whose arm picks git from a const list'],
  ['rust-sandbox-argv', 'packages/demo/rust/src/lib.rs', 'rust', 'git through a Rust argv runner on a repository the caller names'],
  ['napi-node-caller', 'src/port.mjs', 'rust', 'git passed from Node to an N-API constructor whose field a Rust spawn runs'],
  // Spawn functions reached through promisify, a shell option held in a variable, a computed member.
  ['promisify-exec', 'src/push.mjs', 'spawn', 'a promisified execFile exported by one module and called with git in another'],
  ['shell-option-variable', 'src/stage.mjs', 'shell', 'a shell string run with shell: true from an options variable'],
  ['computed-member', 'src/commit.mjs', 'unresolved-binary', 'a child_process function picked by a computed member the scan cannot read'],
  // Read verbs in their write forms inside a hook, and a Rust reset whose function also touches temp_dir().
  ['hook-read-verb-writes', '.githooks/post-checkout', 'shell', 'reflog expire and a two-operand symbolic-ref in a hook'],
  ['rust-temp-dir-unrelated', 'packages/demo/rust/src/lib.rs', 'rust', 'git -C on a caller-named repository in a function that writes under temp_dir()'],
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

test('a command read through the config door is one configured binary, never a site and never a number; a lookalike of its name is not the door', () => {
  const { sites, classes } = scan({ root: path.join(PROBES, 'config-door-value') });
  assert.deepEqual(classes.filter((c) => c.path === 'src/run.mjs').map((c) => c.class), ['configured-binary']);
  // The door is trusted by where `readConfig` resolves, so a lookalike of the same name is read through.
  assert.deepEqual(sites.map((s) => [s.path, s.binary]), [['src/lookalike.mjs', 'git']]);
});

test('a declared standalone skill and text quoted into a data command are not sites', () => {
  // The skill is known by its own SKILL.md declaration: the same script in an undeclared skill is a site.
  const skills = scan({ root: path.join(PROBES, 'standalone-skill') });
  assert.deepEqual(skills.sites.map((s) => s.path), ['core/skills/plain/scripts/run.mjs']);
  assert.deepEqual(skills.classes.map((c) => [c.class, c.path, c.skill]), [['standalone-skill-script', 'core/skills/learn/scripts/run.mjs', 'learn']]);
  // `die "... (git clone ...)"` only prints: line 3 is not a site, the substitution on line 4 is.
  assert.deepEqual(scan({ root: path.join(PROBES, 'shell-data-operand') }).sites.map((s) => s.line), [4]);
  // The same argv runner: on a repository under temp_dir() it is the sandbox probe, on a named one a site.
  const sandbox = scan({ root: path.join(PROBES, 'rust-sandbox-argv') });
  assert.deepEqual(sandbox.sites.map((s) => s.line), [22]);
  assert.deepEqual(sandbox.classes.map((c) => [c.class, c.function]), [['production-sandbox-probe', 'probe']]);
  // temp_dir() and `init` in the same body are no proof: only the repository's own data flow is.
  assert.deepEqual(scan({ root: path.join(PROBES, 'rust-temp-dir-unrelated') }).classes, []);
});

test('the scan judges every file its root declares as product, whatever the directory is called, and only counts the rest', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-one-door-tree-'));
  try {
    const write = (file, text) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), text); };
    const reset = "import { execFileSync } from 'node:child_process';\nexecFileSync('git', ['reset', '--hard']);\n";
    write('package.json', JSON.stringify({ files: ['src'], bin: { tool: 'bin/tool.mjs' } }));
    write('src/runner/fixtures/x.mjs', reset);
    write('src/dist/y.mjs', reset);
    write('bin/tool.mjs', reset);
    write('test/z.test.mjs', reset);
    // Configured setup commands are consumer data, not an exemption for a fixed Git program.
    write('src/setup.mjs', "import { execFileSync } from 'node:child_process';\nconst commands = JSON.parse(process.env.SETUP_COMMANDS);\nfor (const command of commands) execFileSync(command, { shell: true, [Symbol.for('fgos.git.consumer-command')]: true });\n");
    const result = scan({ root });
    assert.deepEqual(result.sites.map((s) => s.path).sort(), ['bin/tool.mjs', 'src/dist/y.mjs', 'src/runner/fixtures/x.mjs']);
    assert.deepEqual(result.outsideProduct, { test: 1 });
    // With no product declared at its root, every file of the tree is judged.
    fs.rmSync(path.join(root, 'package.json'));
    assert.ok(scan({ root }).sites.some((s) => s.path === 'test/z.test.mjs'));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('a Rust file in a crate-root examples or benches target is test code, a product directory called examples is not', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-one-door-examples-'));
  try {
    const write = (file, text) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), text); };
    const push = 'pub fn push() -> std::io::Result<std::process::Output> {\n    std::process::Command::new("git").args(["push", "origin", "main"]).output()\n}\n';
    write('packages/demo/rust/Cargo.toml', '[package]\nname = "demo"\n');
    write('packages/demo/rust/examples/bench.rs', push);
    write('packages/demo/rust/benches/cost.rs', push);
    write('packages/demo/rust/src/examples/live.rs', push);
    assert.deepEqual(scan({ root }).sites.map((s) => s.path), ['packages/demo/rust/src/examples/live.rs']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('doctor refuses a census that lists a site, or whose files do not match the payload it sits in', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-one-door-'));
  fs.cpSync(path.join(PROBES, 'read-verb-writes'), root, { recursive: true });
  const write = (doc) => {
    fs.mkdirSync(path.join(root, path.dirname(MUTATION_CENSUS_PATH)), { recursive: true });
    fs.writeFileSync(path.join(root, MUTATION_CENSUS_PATH), JSON.stringify(doc));
  };
  const built = census(scan({ root }));
  assert.equal('outsideProduct' in built, false, 'the persisted census records the product only');
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

// The scan counts each runBorrowed call as its own site; the runtime spy must agree, or every
// test that borrows a lock to run git is charged to holder-lock (and a product caller would hide).
test('the spawn spy charges a command run through runBorrowed to the code that called runBorrowed', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const stack = (caller) => ['Error',
    `    at spiedSpawn (file://${root}/test/helpers/git-spawn-spy.mjs:110:20)`,
    `    at runBorrowed (file://${root}/src/holder-lock/index.mjs:552:13)`,
    `    at caller (file://${root}/${caller}:7:3)`].join('\n');
  assert.equal(productFrame(stack('test/e2e/main-checkout-borrow-hook.test.mjs')), null);
  assert.equal(productFrame(stack('src/runner/goal-check.mjs')), 'src/runner/goal-check.mjs:7');
  const direct = ['Error', `    at spawnSync (file://${root}/src/holder-lock/index.mjs:300:9)`].join('\n');
  assert.equal(productFrame(direct), 'src/holder-lock/index.mjs:300', 'holder-lock spawning git itself stays a site');
});

test('a sandbox Git call is judged by every repository path it names, in separate and = forms', () => {
  const cwd = '/sandbox/repo';
  assert.deepEqual(sandboxNamedPaths(['status'], cwd), [cwd]);
  assert.deepEqual(sandboxNamedPaths(['-C', 'sub', 'status'], cwd), [cwd, '/sandbox/repo/sub']);
  assert.deepEqual(sandboxNamedPaths(['--git-dir=/elsewhere/.git', 'status'], cwd), [cwd, '/elsewhere/.git']);
  assert.deepEqual(sandboxNamedPaths(['--work-tree', '../out', 'status'], cwd), [cwd, '/sandbox/out']);
  assert.deepEqual(sandboxNamedPaths(['--work-tree=../out', 'status'], cwd), [cwd, '/sandbox/out']);
  assert.deepEqual(sandboxNamedPaths(['status'], undefined).length, 0, 'no cwd and no path names nothing');
});
