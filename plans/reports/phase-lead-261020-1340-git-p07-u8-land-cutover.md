Unit 8 is incomplete. This patch contains verified Land preparation prerequisites and merge-reader migrations; it does not complete the coordinated caller cutover.

Land prepare now pins an omitted target under its own full-ref slot, accepts an acquisition wait budget without a construction/publication retry loop, and retains the original request/writer replay binding through cleanup and compaction. Exact-target requests retain their stale and identical-tip refusals. Literal consumer file declarations can resolve only exactly covered candidate conflicts before the commit/tree is frozen; uncovered conflicts still abort and preserve both refs. These extend the existing Land transaction, not a second publisher.

Merge review patches, changed-path lists, own-file clean gates, ancestry and redundant-verification facts use Inspect. The bounded diffText read retains the 50 MiB review ceiling and existing buffer-error message; external diff configuration remains subject to the existing trust refusal. Spec, port inventory and changelog agree. No new module, configuration default, environment switch or infrastructure dependency was introduced. The architecture manifest needs no new file row.

| Census family | Disposition |
|---|---|
| merge.mjs / row 44 | Partial. The reader functions above migrated. Decision helpers, content-integrity history reads, merge/abort/commit, source catchup, event sweep, CAS publication and post-CAS restaging remain open. |
| promote-engine.mjs / row 45 | Open, unchanged. Branch creation already uses the existing Refs-backed wrapper; landing still uses the legacy merge/ephemeral sequence. |
| approve / sync-root / merge verbs and bin call sites | Open, unchanged. Their slot ownership, candidate verification, publication translation and operation-bound settlement still require the coordinated change. |
| worktree publication and kept-checkout wrapper | Open, unchanged. The ephemeral publication/cleanup wrapper remains. No L10 closure is claimed. |
| Work event adapter | Existing unit-7 checkpoint/compaction migration retained. Merge sweep and post-CAS restage migration remain open. |
| Native Land preparation / Inspect patch read | Implemented and verified in this patch. This is not production Land caller adoption. |

Prior art reused: native Land prepare/publish/WAL/Worktree cleanup, Inspect paging/status/ancestry/commit comparison, and worktree.mjs's inspectGit/resolveRefSha adapters. The unit-4 and unit-7 findings and coordinator sequence remain the migration contract. Impact-analysis: inactive (zero registered providers). An overbroad formatting pass was fully restored; no unrelated formatting remains in the final diff.

E6: every prior assertion line in test/git/land.test.mjs, test/git/inspect.test.mjs, test/runner/merge.test.mjs and packages/git/rust/tests/land.rs remains verbatim (checked against HEAD). Existing-assertion old/new mapping is therefore identity; no assertion is retired or weakened. Added coverage has no internal labels in test titles:

| Added proof | Old expectation | New expectation | Git spec line |
|---|---|---|---|
| Current target and slot wait | No previous assertion | Candidate includes a sibling commit made before admission, with exact current-target/source parents; no-wait refuses the held full-ref slot. | 373, 385–386 |
| Current-target replay | No previous assertion | Same operation returns its receipt after cleanup/compaction and external ABA; changed request refuses. | 371, 373 |
| Declared conflict bytes / negative control | No previous assertion | Exact declared bytes are frozen before verification; an unrelated declaration cannot cover another conflict; source and target remain preserved before publication. | 375–386 |
| Inspect patch | No previous assertion | Patch equals real Git output; bounded overflow and untrusted external-diff configuration refuse. | 113 |
| Subtree clean gate | No previous assertion | Dirty siblings are ignored only for subtree scope; dirty own bytes block and remain unchanged. | 388 |

Merge/promote/verb/kept-checkout assertion retargeting and full E6 acceptance remain open. The ancestry/redundant-verification consumers also need their mutating caller-suite coverage in the outer session.

Focused verification passed: Node Land/Inspect/architecture 56/56, filtered merge readers 30/30; Rust 37 passed, with two intentionally ignored child/controller entry points; clippy and whitespace checks passed. Exact final commands:

~~~sh
mkdir -p /tmp/fgos-work/u8-state /tmp/fgos-work/u8-fixtures
chmod 700 /tmp/fgos-work/u8-state
export FGOS_STATE_ROOT=/tmp/fgos-work/u8-state
export FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/u8-fixtures
export FGOS_HOST_BIN="$PWD/target/debug/fgos"
node --input-type=module - <<'JS'
import { ensureGitAddon } from './test/helpers/git-addon.mjs';
import { spawnSync } from 'node:child_process';
ensureGitAddon();
let status = spawnSync(process.execPath, ['--test',
  'test/git/land.test.mjs', 'test/git/inspect.test.mjs',
  'test/architecture.test.mjs'],
  {stdio:'inherit', env:process.env}).status ?? 1;
if (!status) status = spawnSync(process.execPath, ['--test',
  '--test-name-pattern=reviewDiff|changedFiles|isWorkingTreeClean|isIgnorableStatusPath|buildOwnFileSet|subtree clean gate',
  'test/runner/merge.test.mjs'],
  {stdio:'inherit', env:process.env}).status ?? 1;
process.exitCode = status;
JS
cargo test --locked -p fgos-git --test land --test land_crash_matrix --test inspect --test contracts
cargo clippy --locked -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
git diff --check
~~~

No full npm test, E3, lifecycle verb, staging, commit or activation was run. After completing the caller migration, the outer session must run the mutating suites through the unit-6 host/addon recipe; these are follow-up commands, not evidence from this round:

~~~sh
export FGOS_STATE_ROOT=/var/tmp/fgos-p07-u8-state
export FGOS_TEST_FIXTURE_ROOT=/var/tmp/fgos-p07-u8-fixtures
mkdir -p "$FGOS_STATE_ROOT" "$FGOS_TEST_FIXTURE_ROOT"
chmod 700 "$FGOS_STATE_ROOT" "$FGOS_TEST_FIXTURE_ROOT"
cargo build --locked -p fgos
export FGOS_HOST_BIN="${CARGO_TARGET_DIR:-$PWD/target}/debug/fgos"
node --input-type=module - <<'JS'
import fs from 'node:fs';
import { ensureGitAddon } from './test/helpers/git-addon.mjs';
import { spawnSync } from 'node:child_process';
ensureGitAddon();
const files = fs.readdirSync('test/runner').filter(name =>
  /^(merge.*|loop.*|promote-engine|land-vs-manual-commit|worktree.*|session|claim-port|claim-capacity-race|concurrent-claim-eventlog-loss|repo-locks-multiprocess)\.test\.mjs$/.test(name)
).map(name => 'test/runner/' + name);
files.push('test/runner/execution/run.test.mjs',
  'test/runner/execution/run-sync.test.mjs',
  'test/runner/execution/run-resume-order.test.mjs',
  'test/direct/merge-gate.test.mjs', 'test/cli/fgos-post-merge.test.mjs',
  'test/e2e/main-checkout-borrow-hook.test.mjs');
process.exitCode = spawnSync(process.execPath,
  ['--test', '--test-concurrency=1', ...files],
  {stdio:'inherit', env:process.env}).status ?? 1;
JS
~~~

The program-board lane update requires the out-of-scope plans/261017-1313-fgos-platform-program-board/plan.md. The coordinator must update it; it was not edited. Report path was verified with fgos convention path. MDView preview is unavailable because its database is read-only.

Status: BLOCKED
Summary: Verified Land preparation prerequisites and migrated merge readers; the requested coordinated Land caller cutover is not completed.
Concerns/Blockers: Acceptance remains blocked by the open implementation rows above. No external blocker or owner policy decision is identified; this round must not be scored done.
Context refs:
- (none)
