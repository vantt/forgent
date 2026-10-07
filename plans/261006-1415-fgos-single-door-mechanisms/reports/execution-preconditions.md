# Execution preconditions — 2026-10-06

## Snapshot and provenance

New execution checkout: `/home/vantt/projects/worktrees/forgentX-single-door-execution`, branch `feat/single-door-execution`, HEAD `36dc5f083fea3e43c769596cb1e2a2ce70dfb387`. This is a new measurement, not a rerun of historical user observations. Counts below were collected before downstream edits, using `git ls-files -z` and raw Node `fs.readFileSync`/`lstatSync`; generated and ignored dependencies were not traversed. They are baseline counts, not final implementation counts.

Historical [Phase 00 evidence](phase-00-baseline.md) remains intact at its original `b3d8fa4` snapshot. Its H1d commit/caller closure, historical confinement binding, staged manifest inventory and user-reported runtime failures were not repeated. Revised [Phase 00](../phase-00-preconditions-and-verify-close.md) separates evidence completion from acceptance. Advisory runtime/product/quality proof is separate scope, not a single-door implementation prerequisite.

Only this report and [current dev-door evidence](dev-door-current-evidence.md) are owned by this assignment. No builds, tests, lint, formatters, host invocation, stage, upgrade, setup, activation mutation, reindex, commits, or generated projection writes occurred.

## PC1 and impact-analysis posture

**Current observed:** `git diff HEAD -- AGENTS.md CLAUDE.md` returned empty in the new execution checkout before doctrine edits. PC1 is satisfied for that observation; Phase 06 still requires its contemporaneous ownership check. **Coordinator-supplied:** main has seven unrelated edits that must remain preserved. This worker neither modified main nor reran its status to confirm that observation.

**Coordinator-supplied current query:** the new worktree's `tool query --capability impact-analysis --status present` returned `providers: []`, whereas explicit main-checkout query returned GitNexus present. This is not evidence that the main-bound CLI is unavailable, nor proof of a worktree-bound MCP provider. Keep these two bindings distinct.

**Current observed metadata:** `/home/vantt/projects/forgentX/.gitnexus/meta.json` is bound to main, indexed commit `b3346957a3a63328d3831d6f6c3ab66934219a53`, indexed at `2026-10-06T02:59:48.595Z`, 6,834 files, 58,821 nodes, 81,138 edges. `git rev-list --count <indexed>..<execution HEAD>` returned **20**, rather than historical 19. No reindex was performed.

**Degraded posture:** use explicit main-bound CLI, never ambiguous repository name `forgent`:

```sh
# Run with cwd /home/vantt/projects/forgentX; replace SYMBOL with the actual edit target.
node /home/vantt/projects/forgentX/.gitnexus/run.cjs impact SYMBOL --repo /home/vantt/projects/forgentX --direction upstream --summary-only
```

Historical report already exercised that CLI successfully for `assembleSkills`; this assignment does not claim a new impact result. Each symbol-edit owner must pair its explicit-repo graph result with current execution-source caller searches; zero graph callers cannot clear an edit. Provider discovery absence in this worktree and stale main graph remain explicit limitations, not permission to skip the gate.

## Raw source and render baseline

Tracked canonical `core/skills/**` and `domains/*/skills/**`: **28** retired executor occurrences, all in `core/skills/fgos-architecture-panel/SKILL.md`, unchanged from historical baseline:

| Token | Count | Lines |
| --- | ---: | --- |
| `claude-bwrap` | 9 | 134,137,163,191,223,224,225,229,606 |
| `agy-bwrap` | 10 | 134,163,168,191,226,228,230,606,613,682 |
| `codex-bwrap` | 9 | 134,159,171,191,194,227,230,231,607 |

Tracked `src/`, `bin/`, `test/`, `scripts/` literal `FGOS_TEST_SUITE`: **0 files / 0 occurrences**. This is snapshot absence, not permanent anti-recurrence acceptance.

Header predicate used in the scan: `<!--[^\n]*(?:GENERATED|generated)`. Exact thin-wrapper marker was read from `src/setup/skill-wrappers.mjs:106`: `This is a generated thin wrapper (tsk-1qi) -- do not edit directly, edit the source instead.` An initial probe using a different phrase was discarded; the table uses the exact source marker.

| Recursive tracked markdown target | Files | Generated headers | Exact wrapper markers | Missing both | SKILL.md |
| --- | ---: | ---: | ---: | ---: | ---: |
| `.agents/skills/**` | 53 | 0 | 0 | 53 | 19 |
| `plugins/fgOS/skills/{fgos-*,_shared}/**` | 48 | 0 | 0 | 48 | 18 |
| `.claude/skills/fgos-*/**` | 37 | 0 | 18 | 19 | 18 |
| Total | **138** | **0** | **18** | **120** | **55** |

The 18 wrappers do not cover the recursive reference files. These counts match historical Phase 00, not a post-render acceptance result.

## Root inventory and authorized deletion set

**45** tracked root files:

```text
.gitattributes .gitignore AGENTS.md CHANGELOG.md CLAUDE.md Cargo.lock Cargo.toml
LICENSE README.md clippy.toml count.cjs debug_args.cjs debug_spec.cjs dump.cjs
fix_assignment.cjs fix_herdr.cjs fix_herdr2.cjs fix_openSession.cjs
fix_openSession2.cjs fix_openSession3.cjs fix_openSession4.cjs fix_openSession5.cjs
fix_openSession6.cjs fix_openSession_safe.cjs fix_test_legacy.cjs fix_tests.cjs
install.sh openSession.txt original.txt package-lock.json package.json reverse.patch
rewrite_store.cjs rustfmt.toml store_refactor.cjs test_atomics.mjs test_concurrency.cjs
test_concurrency.log test_concurrency2.cjs test_concurrency2.log test_herdr.cjs
test_regex.cjs timed-executor.mjs timed-executor2.mjs tsk-1op-case-study-note.md
```

`git diff-tree --no-commit-id --name-only --diff-filter=A -r ca854f443` gives **32** historical root additions; intersecting with current `git ls-files` gives **30** deletion candidates, unchanged:

```text
count.cjs debug_args.cjs debug_spec.cjs dump.cjs fix_assignment.cjs fix_herdr.cjs
fix_herdr2.cjs fix_openSession.cjs fix_openSession2.cjs fix_openSession3.cjs
fix_openSession4.cjs fix_openSession5.cjs fix_openSession6.cjs fix_openSession_safe.cjs
fix_test_legacy.cjs fix_tests.cjs openSession.txt original.txt reverse.patch
rewrite_store.cjs store_refactor.cjs test_atomics.mjs test_concurrency.cjs
test_concurrency.log test_concurrency2.cjs test_concurrency2.log test_herdr.cjs
test_regex.cjs timed-executor.mjs timed-executor2.mjs
```

Historical additions `patch_cli.cjs` and `patch_dispatch_test.cjs` are absent from current tracked inventory. With the separately authorized history-note move, target arithmetic remains **45 − 30 − 1 = 14**. This worker deleted nothing and created no cleanup tag. Preserve Phase 05's execution-time cleanup gates. Historical main-only ignored `output.txt` observation is not included in tracked counts and was not remeasured.

## Consumer inventories

Raw tracked `test/**/*.test.mjs` scan with `\.githooks|core\.hooksPath|installGitHooks|uninstallGitHooks`: **16** distinct files, unchanged from historical report. Includes comments; not proof that 16 files execute hooks.

```text
test/cli/fgos-claim-2.test.mjs
test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs
test/e2e/main-checkout-lock-hook.test.mjs
test/e2e/resync-worktree-bare-invocation.test.mjs
test/runner/claim-port.test.mjs
test/runner/main-checkout-lock.test.mjs
test/runner/merge.test.mjs
test/scripts/install-git-hooks.test.mjs
test/setup/checks-doctor-config.test.mjs
test/setup/checks-setup-config.test.mjs
test/setup/checks-setup-hookspath.test.mjs
test/setup/checks.test.mjs
test/setup/dir-resolution.test.mjs
test/setup/uninstall-wiring-2.test.mjs
test/setup/uninstall-wiring-3.test.mjs
test/setup/uninstall-wiring.test.mjs
```

Literal `build-rust-distribution` in executable source/test/CI files, excluding builder itself and prose/history: **7** consumers, unchanged:

```text
.github/workflows/ci.yml
.github/workflows/release.yml
scripts/run-rust-dev-host.mjs
test/rust-host/fgctl-init.test.mjs
test/rust-host/fgctl-stage.test.mjs
test/rust-host/fgctl-upgrade.test.mjs
test/rust-host/release-tree.test.mjs
```

## Handoff

Baseline evidence is complete for the new checkout. Phase 04 consumes the companion current dev-door report; Phase 05 consumes root/deletion/hook inventory. Coordinator owns all verification after edits land. No acceptance test, live confinement probe, drift check, release integrity check, fresh-shim result, or timing measurement is asserted here. H6 documentation-authority migration remains outside this assignment; no authority files were changed.
