# Authority declare update — integration evidence

## Result

Documentation delivery complete; full integration acceptance is **not green**. Render check is clean. Both full gates were attempted without bypassing any guard; npm could not enter its test queue, and Cargo stopped on its first failing target. The activated-release manual check remains **pending owner action**. No staging, activation, merge, model edit, ownership-view regeneration, git staging or commit was attempted.

Scope: [accepted plan](../plan.md), combined checkout at `54baacbf9` containing `1d129c0b9`, `c0299bcff` and `49f0f47dc`. No merge was needed. Only the area spec, changelog and this report are changed.

## Commands and counts

| Command | Exit | Observed result |
|---|---:|---|
| `cargo test --workspace` | 101 | 537 passed, 50 failed, 0 ignored across executed targets; stopped at `fgos --bin fgos`, not a completed workspace run |
| `npm test` | 1 | 0 test cases executed (0 passes, 0 case failures); 1 queue/setup failure, `EROFS` opening the full-suite lock |
| `cargo test -p fgos-component-authority` | 0 | 67 passed (44 unit + 23 integration), 0 failed, 0 ignored; 0 doctests |
| `cargo test -p fgos --test authority` | 0 | 6 passed, 0 failed, 0 ignored |
| `npm run fgos:dev -- authority render --check --json` | 0 | `drift: []`, caller worktree root below |
| `node scripts/export-command-selectors.mjs --check` | 0 | No selector drift |
| `node scripts/plan-contract-check.mjs --plan plans/261124-1433-authority-declare-update` | 0 | `ok 261124-1433-authority-declare-update` |
| `git diff --check` | 0 | No whitespace errors |
| `node scripts/doc-health.mjs -- docs/platform/component-authority/spec.md CHANGELOG.md plans/261124-1433-authority-declare-update/reports/integration-261124-1612-authority-declare-update.md` | 1 | Blocked by `git-floor-probe-failed` / read-only filesystem; no doc-health pass claimed |

The workspace count is the sum of target summaries: 1 + 10 + 3 + 7 + 0 + 516 passes; the last target has 50 failures. Targets Cargo did not reach are unverified, not passes. Focused reruns are additional evidence, not added to the workspace count.

The six authority wiring tests include update plus automatic re-render, render-check of the real repository, linked-worktree render with `--dir` main, and isolation from main. These are automated evidence, not the installed-release manual confirmation.

### Node confinement/setup failure (separate from assertions)

| Failing owner | Test file | Error class | Evidence |
|---|---|---|---|
| `scripts/run-tests.mjs` → `scripts/lib/full-suite-queue.mjs` → `src/holder-lock/index.mjs` | None reached | `full-suite-lock-erofs` | `EROFS: read-only file system, open '/home/vantt/.local/state/fgos/locks/full-suite.lock'` at `acquireFullSuiteQueue` |

There are **no observed per-test-file Node failures or Node assertion failures** in this invocation: the queue failed before the test runner started. In particular, `test/rust-host/help-routes.test.mjs` was not executed, so its anticipated `git-floor-probe-failed` setup failure is not counted as observed evidence. No direct full-suite invocation, alternate state root, lock relocation, guard bypass or skipping switch was used to work around the refusal. An unconstrained owner/land-gate rerun must supply the missing per-file Node results.

### Rust explicit confinement failures, by owning test file

All 33 failures below include `git-floor-probe-failed: git-driver-io: Read-only file system (os error 30)` in their panic output. Error class: **`git-floor-probe-erofs`**. Some appear as failed equality assertions or wrapped `OperationError`/`ReadFailed`; they remain classified here because the actual output explicitly names the filesystem refusal.

| Owning test file | Count |
|---|---:|
| `apps/fgos/src/wiring/doctor/event_store.rs` | 4 |
| `apps/fgos/src/wiring/doctor/git.rs` | 12 |
| `apps/fgos/src/wiring/doctor/identity.rs` | 1 |
| `apps/fgos/src/wiring/events.rs` | 2 |
| `apps/fgos/src/wiring/mailbox_body.rs` | 2 |
| `apps/fgos/src/wiring/observe_sources/tests/mod.rs` | 5 |
| `apps/fgos/src/wiring/uninstall.rs` | 5 |
| `apps/fgos/src/wiring/unit_run_host/tests/mod.rs` | 2 |

### Rust assertion failures without an explicit filesystem refusal

The remaining **17 failures** are reported separately as **`assertion-unresolved`**, not waived as confinement. Their output alone does not prove a filesystem cause. They need an unconstrained rerun/diagnosis before claiming a clean gate; no production fix or weakened proof is authorized here. Names below are relative to each file's test module (`copies::` retained where applicable).

| Owning test file | Failed test | Actual output or mismatch |
|---|---|---|
| `apps/fgos/src/wiring/doctor/confinement.rs` | `a_home_owned_by_a_dead_process_is_named_by_the_row_and_removed_only_by_the_fix` | No orphaned confinement resources found |
| `apps/fgos/src/wiring/doctor/confinement.rs` | `copies::a_staging_in_a_stranded_store_is_reported_once_for_hand_recovery_and_the_fix_leaves_it` | No login copy retained past dispatch |
| `apps/fgos/src/wiring/doctor/confinement.rs` | `copies::an_interrupted_staging_row_offers_no_source_judgement_without_an_inventory` | No login copy retained past dispatch |
| `apps/fgos/src/wiring/doctor/confinement.rs` | `copies::an_interrupted_staging_is_reported_and_the_fix_removes_only_one_provably_not_needed` | No login copy retained past dispatch |
| `apps/fgos/src/wiring/doctor/confinement.rs` | `copies::the_fix_never_sweeps_a_stores_constructor_staging_the_row_calls_stranded` | Missing `that no dispatch applies` |
| `apps/fgos/src/wiring/doctor/confinement.rs` | `copies::the_orphan_count_skips_a_held_home_of_a_dead_process_but_counts_one_only_being_retried` | No orphaned confinement resources found |
| `apps/fgos/src/wiring/doctor/confinement.rs` | `copies::the_fix_judges_a_staging_against_the_source_login_of_its_store_through_the_inventory` | No held private home to settle |
| `apps/fgos/src/wiring/doctor/event_store.rs` | `a_persisted_integrity_record_fails_the_incidents_row` | `!row.passed` failed |
| `apps/fgos/src/wiring/doctor/event_store.rs` | `the_lock_dirs_fix_repairs_modes_below_fgos_and_creates_a_missing_tree_private` | `Some(false)` versus `Some(true)` |
| `apps/fgos/src/wiring/doctor/event_store.rs` | `a_stream_for_a_branch_with_no_live_worktree_is_an_orphan_and_a_live_worktree_branch_key_is_not` | Missing orphan branch stream warning |
| `apps/fgos/src/wiring/doctor/git.rs` | `the_repository_rows_report_information_not_a_failure_outside_a_git_repository` | `git-repository-config` |
| `apps/fgos/src/wiring/doctor/git.rs` | `the_repository_config_row_fails_a_missing_fetch_mapping_an_unsafe_refspec_and_a_remote_that_moved_since_setup` | Missing required-fetch-mapping message |
| `apps/fgos/src/wiring/doctor/git.rs` | `the_repository_config_row_allows_ordinary_pushes_and_protective_negative_fetches_but_refuses_event_store_pushes` | `HEAD` |
| `apps/fgos/src/wiring/doctor/git.rs` | `the_journal_row_fails_with_git_fence_missing_when_a_git_wal_has_lost_the_controller_activation_fence` | Journal row unexpectedly not passed |
| `apps/fgos/src/wiring/doctor/git.rs` | `the_hook_row_applies_only_to_a_project_whose_pre_commit_is_the_fgos_guard` | `core.hooksPath not wired to .githooks` |
| `apps/fgos/src/wiring/doctor/git.rs` | `an_obsolete_legacy_mapping_on_the_origin_or_the_configured_remote_fails_the_row_and_the_fix_repairs_each` | `Some(false)` versus `Some(true)` |
| `apps/fgos/src/wiring/events.rs` | `a_seal_history_outside_the_cache_is_refused_naming_the_cache` | Category `unexpected` versus `validation` |

Session-local raw logs: `/tmp/authority-integration-cargo.log`, `/tmp/authority-integration-npm.log`, `/tmp/authority-integration-crate.log`, `/tmp/authority-integration-wiring.log`, `/tmp/authority-integration-render.log`. These temporary files are not durable repository evidence; the counts, error classes and findings above are retained here.

## Render check answer

Command: `npm run fgos:dev -- authority render --check --json`.

```json
{
  "root": "/home/vantt/projects/forgent-worktrees/261124-1433-authority-declare-update-p04",
  "drift": []
}
```

Envelope contract `fgos.v1`, generated at `2026-11-24T09:16:47.017Z`, data hash `34c3f6fdf1f4f3acb966c26d43cfcfc6bf25bf3caf786a7e87f5d5bbf0550a52`. This is the working-tree dev host, not the installed host from main. No drift finding, and no render write was run. Installed-main acceptance remains pending with the release check below. A repeat after the spec and changelog edits also exited 0 with the same root, empty drift and data hash (`2026-11-24T09:20:06.900Z`); output is in `/tmp/authority-integration-render-final.log`.

## Pending owner action — activated-release check (criterion 5)

**What is happening:** The automated linked-worktree authority test passes, but no manual result from an activated release exists in this session. Confirm that the installed host through the shell helper writes only the caller's linked worktree.

**Cause:** This assignment cannot stage or activate a release and must not do so. A dev-host check cannot certify installed-release behavior.

**Options:**
- **A (recommended):** After the intended release is activated by the owner through the normal release process, run the commands below and append the actual output to this report. Estimated 10–15 minutes; one throwaway linked worktree and no product code changes. This closes the manual evidence gap.
- **B:** Keep the check pending until the next release window (0 minutes now; same check later). Documentation can be reviewed, but full acceptance cannot be declared.

**Recommendation:** A. Keep the full test gates pending as well until rerun outside this confinement; do not mistake focused test passes for a green workspace.

**Scope of the answer:** Authorizes only the installed-host manual verification and recording its result after normal owner-managed activation. Does not authorize this worker to stage/activate, change shell integration, alter the model, bypass a guard or waive failing gates. Without action, the manual criterion remains pending.

The implementation brief names `fgos authority render`, `fgos worktree` and `fgos worktree remove --discard-ignored`, but supplies no concrete worktree path. The following expands those exact doors using their registered syntax (`remove` also requires `--delivered-to`). Run in Bash from the main checkout **only after activation**; do not execute here:

```bash
MAIN=/home/vantt/projects/forgent
W=/home/vantt/projects/forgent-worktrees/authority-declare-update-release-check
cd "$MAIN" || exit 1
source "$MAIN/scripts/fgos-shell-integration.sh"
test -x "$MAIN/.fgos/installation/bin/fgos" || exit 1
fgos authority render --check --json || exit 1
BASE=$(git rev-parse HEAD) || exit 1
test ! -e "$W" || exit 1
fgos worktree create "$W" --detach --base "$BASE" --bare || exit 1
git worktree list --porcelain
BEFORE=$(sha256sum "$MAIN/docs/platform/component-boundary.md") || exit 1
(
  cd "$W" || exit 1
  # Introduce drift only in the disposable generated block to prove a write.
  python3 - <<'PY'
from pathlib import Path
p = Path('docs/platform/component-boundary.md')
s = p.read_text()
marker = '<!-- generated:component-authority:component-boundary -->'
assert s.count(marker) == 1
p.write_text(s.replace(marker, marker + '\nDisposable render verification drift.', 1))
PY
  test "$?" -eq 0 || exit 1
  fgos authority render --json || exit 1
  fgos authority render --check --json || exit 1
  git diff --exit-code -- docs/platform/component-boundary.md || exit 1
) || exit 1
AFTER=$(sha256sum "$MAIN/docs/platform/component-boundary.md") || exit 1
test "$BEFORE" = "$AFTER" || exit 1
fgos worktree remove "$W" --delivered-to "$BASE" --discard-ignored
```

Record the activated release identity through the owner's normal release evidence, the render answer's `root` (must equal `$W`), its `written` entry for `docs/platform/component-boundary.md`, the empty final drift, unchanged main checksum and successful cleanup. If anything fails, retain the worktree for inspection rather than force cleanup. No commands in this section were executed by this worker.

## Documentation and handoff

- Updated [component-authority spec](../../../docs/platform/component-authority/spec.md) operations and CLI shapes for `--update`, full-field replacement semantics, immutable identity/parent, no new approval, automatic ownership-view re-render and caller-checkout targeting. Added one local decision narrative citing the accepted plan: extend the single `declare` write door rather than adding a sibling verb.
- Added one [Unreleased changelog](../../../CHANGELOG.md) entry covering update, re-render and worktree targeting.
- **DOCOS lead:** plan `261124-0837-docos-documentation-in-component-authority` can resume at phase 2 with `fgos authority declare --kind component --update --row <file>` for `document-identity`, once the release carrying this command is activated. This report does not declare full integration acceptance or modify that plan/model.
- Impact-analysis posture: degraded. Plain `fgos dispatch decide --for impact-analysis --json` could not find an installation above this worktree; the dev-host equivalent answered `configured: true`, `mechanism: unavailable`, `reasonCodes: ["tool.missing"]`, provider `gitnexus` missing. Blast radius is not independently confirmed; this assignment changes no code symbols.

- Markdown preview was attempted with `mdview open` on this report, but failed before returning a URL: `database error: attempt to write a readonly database` (SQLite error 8). No preview server was started by this worker. Local relative links were checked directly; the owning doc-health guard still needs an unconstrained rerun.

Rollback: revert only these documentation/report changes; the landed implementation and model remain untouched.

## Lead re-check, 2026-11-24 18:20 (+07)

Run by the lead from the main checkout at 9d791d391, still inside a confined session (home state, `.git`, the main checkout and the worktrees directory are read-only).

- Activated release `sha256:a34524b3…` (activated 2026-11-24T10:24:42Z) carries the plan: `fgos authority declare --help` lists `--update`, and `fgos authority render --check --json` answers `"root": "/home/vantt/projects/forgent", "drift": []` (criteria 3 and 4 on the installed host).
- `cargo test -p fgos-component-authority`: 67 passed, 0 failed (criterion 1).
- `cargo test -p fgos --test authority`: 6 passed, 0 failed, including `authority_declare_update_changes_a_component_row_and_rerenders_the_views` and `authority_render_in_linked_worktree_with_dir_main_renders_the_worktree_and_leaves_main_unchanged` (criteria 2, 4 and the automated proof of 5).
- `node scripts/export-command-selectors.mjs --check`: exit 0. `node --test test/cli/subcommand-flag-drift.test.mjs`: 26 passed. `node scripts/plan-contract-check.mjs --plan plans/261124-1433-authority-declare-update`: ok.
- The 17 unexplained `cargo test --workspace` failures are in `apps/fgos/src/wiring/doctor/{confinement,event_store,git}.rs` and `apps/fgos/src/wiring/events.rs`. None of the plan's four commits touches those files or the authority wiring they could reach, so they are not a regression of this plan; whether they pass outside confinement is still unproven.
- Still not runnable here: the full `npm test`, a complete `cargo test --workspace`, and the hand check of criterion 5 (it needs a writable linked worktree). Both remain with the owner, as answered on q-vdefxq4upy.
