Git phase 07 unit 6 fixes the four host findings. Changes are uncommitted; prohibited owner files are untouched.

- **R1:** `runUnit` reuses the existing cwd-posture resolver immediately after Unit validation, before native Sync/preflight or custody. The original main-checkout refusal test is unchanged and passes.
- **R2:** Replaced the fabricated `unit.json` crash state with a child running real `runUnit`, real supervised producer and real native commit. An observing adapter wrapper calls the original commit, then SIGKILLs the controller before runner settlement. Assertions inspect the untouched pending record, then require the same SHA/files/HEAD, settled intent and exactly one producer launch on resume. No production initialization defect was found: bindings exist at this actual crash point.
- **R3:** Both dispatch acquisition and resume now use the cwd-lock door's shared `DispatchError('dispatch-in-flight')` constructor. Updated the one old-message assertion to require the coded error, holder PID and cwd; the new Sync ordering test stays unchanged. The existing live-holder/dead-holder resume regression passes.
- **R4:** The existing addon builder stages the host beside its addon under `.fgos/runtime/git-addon/<checkout-key>/`, writes safe relative manifest entries, and supplies the staged host/manifest through the existing environment fields. The cached helper uses the same directory and refreshes changed hosts. Regression coverage checks external Cargo targets and distinct manifests for checkouts sharing `.fgos`. Payload-root safety rules are unchanged.

**Main-reference failures:** logs4 records 34 `run.test` and 8 `run-sync` failures, including structured worker exits 127 (`nonzero-process-exit`), rather than addon loading errors. `run-deciding.sh` sets `FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/u2h-fixtures`; both suites put their executor links/scripts in that root. The real bwrap driver mounts `--tmpfs /tmp` and only binds declared resources back, hiding those fixture executables. This is an environmental fixture-channel failure, not evidence of 42 Git regressions or a reason to change production confinement. Exact worker stderr is not included in logs4, so corrected-channel reruns remain the confirming proof. No unrelated fixture or confinement changes were made.

Prior art: `403d63b21` (addon builder), `42da56e68` (kernel cwd-lock/resume door), `ae1a59762` (Unit preflight), and unit-2/unit-3 reports. Reused those doors and the existing observing-module/child-death test patterns; no parallel mechanism, config default, environment switch or infrastructure dependency. `impact-analysis: inactive` (zero registered providers). Git spec and changelog updated. The program-board row is outside this assignment's write scope and needs coordinator update.

Verification:

- Main-checkout refusal and live-holder/dead-holder resume: **2 passed**. Addon descriptor/external-target/shared-directory regressions: **2 passed**.
- Adapters, ScopedCommit consumer, custody, architecture and test launcher: **130 passed / 1 environmental failure** across 131 checks. The launcher fixture-root test cannot allocate `/var/tmp` in this sandbox (`fs.accessSync` confirms `EROFS`); its implementation is unchanged.
- Complete distribution-addon, native-load and native parent-death files: **19 passed / 1 Windows-only skip**. Syntax checks and `git diff --check` pass.
- The two writing lifecycle regressions stop at the unchanged `nested-write-from-confined-worker` admission guard here. A read-only reviewed-run probe additionally confirms namespace creation is denied by this sandbox. No full `npm test` or E3 was run.

Outer-session commands (run in each intended checkout; use a real fixture directory outside `/tmp`, and the desired Cargo target):

```sh
export FGOS_STATE_ROOT=/var/tmp/fgos-p07-u6-state
export FGOS_TEST_FIXTURE_ROOT=/var/tmp/fgos-p07-u6-fixtures
mkdir -p "$FGOS_STATE_ROOT" "$FGOS_TEST_FIXTURE_ROOT"
chmod 700 "$FGOS_STATE_ROOT" "$FGOS_TEST_FIXTURE_ROOT"
cargo build --locked -p fgos
export FGOS_HOST_BIN="${CARGO_TARGET_DIR:-$PWD/target}/debug/fgos"
node --input-type=module - <<'JS'
import { ensureGitAddon } from './test/helpers/git-addon.mjs';
import { spawnSync } from 'node:child_process';
ensureGitAddon(); // sets this process's checkout-owned staged host and manifest
const result = spawnSync(process.execPath, ['--test',
  'test/runner/execution/run.test.mjs',
  'test/runner/execution/run-sync.test.mjs',
  'test/runner/execution/run-resume-order.test.mjs',
  'test/distribution/native-addon.test.mjs',
  'test/scripts/run-tests.test.mjs'], { stdio: 'inherit', env: process.env });
process.exitCode = result.status ?? 1;
JS
```

For the unchanged main reference, use its original manifest preparation with a copied host inside that checkout, while keeping the corrected fixture root outside `/tmp`. Re-run its two baseline files to confirm the classification above.

MDView preview was attempted but its database is read-only in this sandbox.

Status: DONE_WITH_CONCERNS
Summary: Fixed main-checkout refusal ordering, coded resume refusal and checkout-local host staging; replaced synthetic recovery state with a real controller-death regression.
Concerns/Blockers: Outer-session lifecycle and corrected-channel baseline reruns remain; coordinator owns the board update. This is not whole-phase acceptance.
Context refs:
- (none)
