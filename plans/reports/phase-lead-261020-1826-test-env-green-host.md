# Green suite on this host — lead report

Date: 2026-10-20 (Asia/Saigon). Worktree `.claude/worktrees/test-env`, branch `fix/test-env-green-host`.
Input: host gate logs in `~/.claude/jobs/e1505f04/tmp/test-gov-host/` (85 failures, also on main).

## Verdict per cause

| Cause | Files (failures) | Owner of the fix | Where it lands |
|---|---|---|---|
| A. Release artifacts not built by `npm test` | fgctl-upgrade 18, fgctl-stage 13, fgctl-init 8, fgctl-init-download 8, fgctl-init-preflight-tail 6, fgctl-init-activation 6, fgctl-init-download-sources 5, fences-rust-locks 4, release-tree 3, release-targets 1, active-release-drift-check 1 | `scripts/run-tests.mjs` (the documented test command) + one release-dir owner | in-scope part done; **patch 1** (Git 07) |
| B. Unix socket path too long under the run root | run-supervisor-checks 4 | the test's own scratch name | **patch 2** (Git 07) |
| C. Committed config changed, pins not updated | dispatch-policy-baseline-snapshot 6, herdr-claude-invocations 1 | the tests (config is the owner's truth) | **patch 3** (Git 07) |
| D. bind now fails closed on a missing tier cell | spawn-worker 1 | the test fixture | **patch 3** (Git 07) |
| E. v1 tree imports the `yaml` package | fences-v1-tombstone 1 | holder-lock fixture (+ one stale assertion it hid) | **patch 4** (holder-lock lane) |
| "Fixture-root ENOENT" | none on its own | — | the only ENOENT in the log (`xdg-no-table/fgos/...sock`) is cause B cascading: the too-long dir was never created |

No skips, env switches or test-only production branches. No test added.

### A. Release artifacts (73 failures)

Errors: `fgctl binary must exist at <repo>/target/release/fgctl`, `Compiled native addon not found at .../release/libfgos_node_addon.so`.
CI already runs `cargo build --locked --release --workspace` before `npm test` (`.github/workflows/ci.yml`), so the suite assumes release artifacts that only CI produces. `scripts/run-tests.mjs` already builds the debug host and the debug addon inside the full-suite queue; the release build belongs in the same place (one door for "what the test command builds"), not in each fixture (would run cargo from ~10 test files) and not in a separate release-gate suite (these are the only proofs of `fgctl` init/stage/upgrade and the release tree; CI already runs them in the main suite). Because `npm test` then produces the artifacts itself, there is no new prerequisite for `fgos doctor` to check (cargo is already required by `ensureHostBin`).
Done in scope: `releaseOutputDir()` exported from `scripts/build-rust-distribution.mjs` (the builder already honoured `CARGO_TARGET_DIR`; the fgctl fixtures hardcoded `<repo>/target/release`, so they would look in the wrong place whenever the target is shared). `fgctl-init-fixture.mjs`, `fgctl-stage`, `fgctl-upgrade`, `fgctl-init` (R10, which also lacked `.exe`) now use it.
Evidence: `cargo build --locked --release -p fgctl -p fgos -p fgos-node-addon` (16 s incremental here), then the 11 files: 92 pass; every remaining failure is this sandbox (`git-predecessor-writer-live: ... PID namespace ...`, or EROFS writing the main checkout) — none mention a missing artifact. fgctl-stage, release-targets, release-tree (2 of 3), active-release-drift-check, native-addon, release-packaging fully green.

### B. Socket path (4)
`<tmp>/fgos-test-run-XXXXXX/fgos-tp-XXXXXX/fgos-run-supervisor-checks-XXXXXX/xdg-no-table/fgos` + `/<16hex>.sock` = 109 bytes > `SOCKET_PATH_MAX_BYTES` (100). The other three cases cascade from the same refusal. I did not shorten `test/helpers/process-tmp-root.mjs`: the runner fails a run on leftover `fgos-*` dirs, which is how a killed file's helper root is caught; any prefix that keeps `fgos-` saves at most 3 bytes (9 needed). The test's own 27-byte scratch prefix is the cause; patch 2 saves 18 bytes (91 ≤ 100). Verified with patch applied under a runner-shaped TMPDIR: 22 pass; the 2 failures (legacy-attempts-stuck, `pid-unknown`) are this sandbox's PID namespace and pass in the host log.

### C. Config pins (7)
`69867e09b chore(config): prefer thehive for the deepseek and glm flash cells` changed `.fgos/config.json` (`z-ai` nano/standard became `[thehive..., openrouter...]`, pi credential stores gained `models.json`) without updating the tests that pin the committed config. Patch 3 updates the glm-cli snapshot rows and the herdr assertion. Verified: 33/33 pass.

### D. spawn-worker (1)
`d81af6087` made bind refuse an out-of-process candidate with no tier cell. The test's `glm` executor has no `providerModel`, so its family is the full `process.execPath`, while the test only offers `modelPolicies.node`. Reproduced deterministically here (independent of HOME). Patch 3 adds `providerModel: 'node'`, as `baseConfig` in the same file does. Here the test then stops at bwrap (no user namespaces in this sandbox), like every other spawn-worker test — past the tier-cell refusal.

### E. v1 yaml (1)
Patch 4: the extracted v1 tree gets a real `node_modules/yaml` whose `parse` calls `src/util/yaml.mjs` (fixture only; no package added; `test/architecture.test.mjs` stays green). The dangling `node_modules` symlink goes (the repo has none). With the import fixed, the test reached its last loop, which asserted every target `fenced` — but since `6849f9d89` the `activation.lock` target is fgctl-managed and `placeFences` never fences it (another test in the same file already asserts that). The loop now asserts the failed acquires left the fence status exactly as placed (`complete` before, deep-equal after). Verified: fences-v1-tombstone + architecture 36/36.

## Tally of the 85
- Fixed by in-scope changes alone: 0 (the in-scope change is what makes patch 1 correct under a shared `CARGO_TARGET_DIR`).
- Fixed once the patches land: all 85 — A via patch 1 (73), B patch 2 (4), C+D patch 3 (8), E patch 4 (1).
- Remaining unknowns: none known; the host run below is the proof I could not run here.

## Host commands (sandbox: no full npm test, PID namespace, read-only /var/tmp and main checkout)
```
cd /home/vantt/projects/forgent/.claude/worktrees/test-env
R=plans/reports/phase-lead-261020-1826-test-env-green-host.md
awk '/^```diff$/{f=1;next} /^```$/{f=0} f' "$R" > /tmp/green-host.diff   # all four patches, checked with git apply --check
git apply /tmp/green-host.diff
npm test                                   # expect 0 failures; first run builds release (~minutes cold)
node scripts/test-timing.mjs profile --top 50 --log-dir .fgos/runtime/tmp/test-profile-green   # expect valid: true
```
When patch 1 lands, add a CHANGELOG `[Unreleased]` line: "`npm test` now builds the release fgos, fgctl and native addon it tests against (incremental)". CI's own release build step then becomes a no-op and can stay.

## Separate finding (not one of the 85)
`test/rust-host/release-tree.test.mjs:165` runs the staged `fgos doctor --dir REPO_ROOT` against the live checkout; from a linked worktree it takes `<main checkout>/.fgos/locks/sessions.lock` (EROFS here). A test writing the shared main checkout's `.fgos` is outside the runner's `.fgos` snapshot guard. Worth its own item.

## Patches for the coordinator (apply after the owning lanes merge)

### Patch 1 — scripts/run-tests.mjs (Git 07)
```diff
--- a/scripts/run-tests.mjs	2026-10-20 18:34:02.357915201 +0700
+++ b/scripts/run-tests.mjs	2026-10-20 18:34:02.383915620 +0700
@@ -74,6 +74,21 @@
   return { addon, manifest, cargoEnv };
 }
 
+/**
+ * Builds the release-profile artifacts the release-tree tests stage from (`fgos`, `fgctl` and the
+ * native addon under `releaseOutputDir()`), as CI does before `npm test`. Incremental: a no-op when
+ * they are current. Runs inside the full-suite queue, so worktrees sharing a cargo target never
+ * rebuild under one another's run.
+ */
+export function ensureReleaseArtifacts(env = process.env, cwd = REPO_ROOT) {
+  const targetDir = path.resolve(cwd, env.CARGO_TARGET_DIR || 'target');
+  execFileSync('cargo', ['build', '--locked', '--release', '-p', 'fgos', '-p', 'fgctl', '-p', 'fgos-node-addon'], {
+    cwd,
+    env: { ...env, CARGO_TARGET_DIR: targetDir },
+    stdio: 'inherit',
+  });
+}
+
 const TEST_FILE_SUFFIX = '.test.mjs';
 
 /**
@@ -602,6 +617,7 @@
         const host = ensureHostBin(process.env, REPO_ROOT);
         process.env.FGOS_HOST_BIN = host;
         ensureGitAddon(process.env, REPO_ROOT);
+        ensureReleaseArtifacts(process.env, REPO_ROOT);
         return release;
       } catch (err) {
         release();
```

### Patch 2 — test/setup/run-supervisor-checks.test.mjs (Git 07)
```diff
--- a/test/setup/run-supervisor-checks.test.mjs	2026-10-20 18:34:02.362155113 +0700
+++ b/test/setup/run-supervisor-checks.test.mjs	2026-10-20 18:34:02.384652167 +0700
@@ -35,7 +35,9 @@
 const children = new Set();
 before(() => {
   assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout (npm test does): ${HOST_BIN}`);
-  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-run-supervisor-checks-'));
+  // Short: the runtime-socket-dir cases build `<scratch>/xdg-*/fgos/<hash>.sock`, which must fit
+  // SOCKET_PATH_MAX_BYTES under the runner's run directory and the process temp root.
+  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-rsc-'));
 });
 after(() => {
   for (const child of children) child.kill('SIGKILL');
```

### Patch 3 — test/runner/* (Git 07)
```diff
diff --git a/test/runner/dispatch-policy-baseline-snapshot.test.mjs b/test/runner/dispatch-policy-baseline-snapshot.test.mjs
index ac2687c69..f8fa88782 100644
--- a/test/runner/dispatch-policy-baseline-snapshot.test.mjs
+++ b/test/runner/dispatch-policy-baseline-snapshot.test.mjs
@@ -939,11 +939,11 @@ export const BASELINE_SNAPSHOT_FIXTURE = [
     workTier: 'light',
     bindingSource: 'executor-id',
     provider: 'z-ai',
-    model: 'z-ai/glm-5.3-flash',
+    model: 'thehive/zai-org/glm-5.3-flash',
     command: 'pi',
     args: [
       '--model',
-      'z-ai/glm-5.3-flash',
+      'thehive/zai-org/glm-5.3-flash',
       '--thinking',
       'medium',
       '--tools',
@@ -963,7 +963,8 @@ export const BASELINE_SNAPSHOT_FIXTURE = [
         'models-store.json',
         'settings.json',
         'trust.json',
-        'bin/fd'
+        'bin/fd',
+        'models.json'
       ]
     },
     adapter: 'cli-spawn',
@@ -976,11 +977,11 @@ export const BASELINE_SNAPSHOT_FIXTURE = [
     workTier: 'standard',
     bindingSource: 'executor-id',
     provider: 'z-ai',
-    model: 'z-ai/glm-5.3-flash',
+    model: 'thehive/zai-org/glm-5.3-flash',
     command: 'pi',
     args: [
       '--model',
-      'z-ai/glm-5.3-flash',
+      'thehive/zai-org/glm-5.3-flash',
       '--thinking',
       'medium',
       '--tools',
@@ -1000,7 +1001,8 @@ export const BASELINE_SNAPSHOT_FIXTURE = [
         'models-store.json',
         'settings.json',
         'trust.json',
-        'bin/fd'
+        'bin/fd',
+        'models.json'
       ]
     },
     adapter: 'cli-spawn',
@@ -1037,7 +1039,8 @@ export const BASELINE_SNAPSHOT_FIXTURE = [
         'models-store.json',
         'settings.json',
         'trust.json',
-        'bin/fd'
+        'bin/fd',
+        'models.json'
       ]
     },
     adapter: 'cli-spawn',
diff --git a/test/runner/herdr-claude-invocations.test.mjs b/test/runner/herdr-claude-invocations.test.mjs
index 73cf49277..1c74e9e66 100644
--- a/test/runner/herdr-claude-invocations.test.mjs
+++ b/test/runner/herdr-claude-invocations.test.mjs
@@ -27,7 +27,7 @@ test('claude runs a claude REPL in a pane under the bwrap posture', () => {
 test('glm has no pane invocation: in a herdr pane GLM loops on one tool call, so it runs headless only', () => {
   assert.equal(invocation('glm'), undefined);
   assert.equal(runner.executors.glm.providerModel, 'z-ai');
-  assert.equal(runner.modelPolicies['z-ai'].standard, 'z-ai/glm-5.3-flash@openrouter');
+  assert.deepEqual(runner.modelPolicies['z-ai'].standard, ['thehive/zai-org/glm-5.3-flash@thehive', 'z-ai/glm-5.3-flash@openrouter']);
 });
 
 test('glm is headless pi through OpenRouter, its key read from its login store, with no claude gateway variables', () => {
diff --git a/test/runner/spawn-worker.test.mjs b/test/runner/spawn-worker.test.mjs
index 636c7a3df..c46c726ca 100644
--- a/test/runner/spawn-worker.test.mjs
+++ b/test/runner/spawn-worker.test.mjs
@@ -363,7 +363,7 @@ test('spawnWorker passes an executor\'s own resolved env to the worker, never in
     const fx = fixture({
       executors: {
         glm: {
-          kind: 'agent', command: process.execPath, args: [envEcho], allowCrossProvider: true, env,
+          kind: 'agent', command: process.execPath, args: [envEcho], providerModel: 'node', allowCrossProvider: true, env,
           invocations: [{ id: 'cli', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: process.execPath, args: [envEcho], env }],
         },
       },
```

### Patch 4 — test/holder-lock/* (holder-lock lane)
```diff
diff --git a/test/holder-lock/fences-v1-tombstone.test.mjs b/test/holder-lock/fences-v1-tombstone.test.mjs
index c5772cd87..c2fbfdc4a 100644
--- a/test/holder-lock/fences-v1-tombstone.test.mjs
+++ b/test/holder-lock/fences-v1-tombstone.test.mjs
@@ -110,7 +110,10 @@ test('a run made by the run supervisor after the cutover needs no recovery tombs
 
 test('every real v1 acquire fails loudly against the tombstones instead of taking the lock', (t) => {
   const ws = makeWorkspace('v1-acquires');
-  assert.equal(placeFences({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot }).ok, true);
+  const fenceOptions = { fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot };
+  assert.equal(placeFences(fenceOptions).ok, true);
+  const placed = fenceStatus(fenceOptions);
+  assert.equal(placed.complete, true);
   const fgosDir = JSON.stringify(ws.fgosDir);
   const root = JSON.stringify(ws.root);
 
@@ -146,10 +149,8 @@ test('every real v1 acquire fails loudly against the tombstones instead of takin
     assert.ok(expectations[name](observed), `${name} failed in an unexpected way: ${JSON.stringify({ outcome: observed.outcome, code: observed.code, name: observed.name, message: observed.message, value: observed.value })}`);
   }
 
-  // The tombstones are untouched by the failed acquires.
-  for (const target of fenceStatus({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, stateRoot: ws.stateRoot }).targets) {
-    assert.equal(target.fenced, true, `${target.path} still fenced`);
-  }
+  // The failed acquires leave every fence as it was placed (fgctl's controller path stays fgctl's).
+  assert.deepEqual(fenceStatus(fenceOptions), placed);
 });
 
 test('an old lock file still present stops the placement before anything is written', () => {
diff --git a/test/holder-lock/fixtures/extract-v1.mjs b/test/holder-lock/fixtures/extract-v1.mjs
index 391472045..2aefacada 100644
--- a/test/holder-lock/fixtures/extract-v1.mjs
+++ b/test/holder-lock/fixtures/extract-v1.mjs
@@ -3,9 +3,11 @@
 // The cutover deletes the v1 lock code from the tree, so the fence tests
 // cannot import it from `src/`. This fixture materializes `src/` as it was
 // at the base commit (`git archive <base> src`, the same bytes `git show
-// <base>:<path>` gives for each file) into a scratch directory, next to a
-// `node_modules` link (plus `scripts/lib`, which old `src/` modules import) so the old modules resolve their one dependency, and
-// lets a test import any old module from there.
+// <base>:<path>` gives for each file) into a scratch directory, plus
+// `scripts/lib`, which old `src/` modules import, and lets a test import any
+// old module from there. Old `src/` imports its one dependency, the `yaml`
+// package, which the repo no longer installs: the scratch tree gets a `yaml`
+// module whose `parse` is today's YAML door (src/util/yaml.mjs).
 //
 // Old lock acquires can block synchronously (`Atomics.wait` loops), which no
 // in-process timer can interrupt, so `probeV1` runs a snippet against the
@@ -34,7 +36,11 @@ export function extractV1Source({ base = DEFAULT_V1_BASE, repoRoot = REPO_ROOT }
   const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-holder-lock-v1-'));
   const tarball = execFileSync('git', ['archive', '--format=tar', sha, 'src', 'scripts/lib'], { cwd: repoRoot, maxBuffer: 256 * 1024 * 1024 });
   execFileSync('tar', ['-x', '-C', dir], { input: tarball });
-  fs.symlinkSync(path.join(repoRoot, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
+  const yamlShim = path.join(dir, 'node_modules', 'yaml');
+  fs.mkdirSync(yamlShim, { recursive: true });
+  fs.writeFileSync(path.join(yamlShim, 'package.json'), '{"name":"yaml","type":"module","exports":"./index.mjs"}\n');
+  const door = pathToFileURL(path.join(repoRoot, 'src', 'util', 'yaml.mjs')).href;
+  fs.writeFileSync(path.join(yamlShim, 'index.mjs'), `import { parseYaml } from ${JSON.stringify(door)};\nexport const parse = (text) => parseYaml(text);\nexport default { parse };\n`);
   fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}\n');
   const handle = {
     dir,
```

Status: DONE_WITH_CONCERNS
Summary: All 85 host failures are classified with cause and fix; the in-scope part (one release-output-dir owner honouring CARGO_TARGET_DIR) is done, and four verified patches for Git 07 / holder-lock-owned files are above.
Concerns/Blockers: none of the 85 turn green until patches 1-4 are applied; the full `npm test` proof must run on the host (this sandbox has no host PID view, no user namespaces, read-only /var/tmp).
