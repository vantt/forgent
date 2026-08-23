# main-checkout-hook-wired false negative on absolute core.hooksPath

**Item:** tsk-1gn
**Stage:** clarify → decompose

## Feature boundary

Three functions in `src/setup/git-hooks.mjs` compare git's `core.hooksPath`
config value against the literal string `.githooks` using exact string
equality:

- `mainCheckoutHookWired(cwd)` (read check, used by `fgos doctor` via
  `checkMainCheckoutHookWired` in `src/setup/registrations.mjs:321-326`)
- `installGitHooks(repoRoot)` (fill-only write detector — decides whether
  to leave an existing value alone)
- `uninstallGitHooks(repoRoot)` (ownership detector — decides whether it's
  safe to unset the value)

When `core.hooksPath` is set to an absolute path that resolves to the same
directory as `.githooks` (rather than the relative literal), all three
give the wrong answer even though the hook is correctly wired and actually
running:

- `mainCheckoutHookWired` returns `false` → `fgos doctor` reports
  `main-checkout-hook-wired: failed` (false negative — commits ARE
  guarded, doctor says they aren't).
- `installGitHooks` treats the absolute value as a foreign custom hook
  path and reports `skippedExisting: "<absolute path>"`, even though it's
  fgOS's own hook just stored in a different representation.
- `uninstallGitHooks` refuses to unwire fgOS's own hook, treating the
  absolute value the same way.

This item fixes the comparison logic in all three so that any
representation of the same target directory (relative or absolute) is
recognized as "wired," instead of only the literal relative string.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix scope covers all 3 functions in `src/setup/git-hooks.mjs` sharing the exact-string bug: `mainCheckoutHookWired`, `installGitHooks`, `uninstallGitHooks` — not just the doctor-facing read check named in the item title. |
| D2 | Normalize both sides to absolute paths before comparing: `path.resolve(repoRoot, current)` vs `path.resolve(repoRoot, '.githooks')`, compare the resolved paths instead of raw string equality. No symlink resolution, no case-insensitive handling — no evidence either is needed in this repo. **Implementation correction (found live during Execute, tsk-1gn):** `repoRoot` cannot be trusted as-is when it's actually a linked worktree's cwd (e.g. `mainCheckoutHookWired(process.cwd())` called from `fgos doctor` run inside a worktree, or `installGitHooks(process.cwd())`/`uninstallGitHooks(process.cwd())` likewise, per `bin/fgos.mjs`'s existing `repoRoot = process.cwd()` pattern in the `setup`/`uninstall`/`doctor` verbs) — resolving `.githooks` against the worktree path instead of the real main checkout produced a fresh false negative, reproduced live by running `fgos doctor` from inside this very item's own worktree after the first pass of the fix. Fixed by resolving the true repo root via `git rev-parse --path-format=absolute --git-common-dir` (its parent), the same resolution `resolveMainCheckout` already uses in `registrations.mjs`, before resolving either side of the comparison. |
| D3 | Root cause of *why* `core.hooksPath` drifted from relative to absolute sometime after 2026-07-28 stays out of scope for this item. Only the comparison logic is fixed, so equivalent representations are recognized as wired regardless of how/why the value's representation changed. |
| D4 | `verify` is the narrow test files touched by the fix, not full `npm test`: `node --test test/setup/checks.test.mjs test/scripts/install-git-hooks.test.mjs test/setup/uninstall-wiring.test.mjs` (matches the repo's own test runner pattern from `package.json`'s `test` script, scoped down per narrowest-useful-test-first). Strengthened after the clarify→decompose second-pass judge disputed the plain command (a pass wouldn't prove the absolute-path scenario is actually exercised, since none of these files yet has a test for it): the `verify` field now also names the required new test cases explicitly — `mainCheckoutHookWired is true when core.hooksPath is an absolute path resolving to repoRoot/.githooks` (`checks.test.mjs`), an absolute-path-equivalence case for `installGitHooks` (`install-git-hooks.test.mjs`), and an absolute-path-equivalence case for `uninstallGitHooks` (`uninstall-wiring.test.mjs`) — so a pass self-evidently covers the scenario, not just "the existing files still pass." **Correction (`fgos-coding-validating`'s reality gate):** the file for the `uninstallGitHooks` case was originally misidentified as `install-git-hooks.test.mjs` — grep proved that file has zero `uninstallGitHooks` references; GitNexus confirmed the real existing coverage (4 tests) lives in `test/setup/uninstall-wiring.test.mjs`. Corrected here and in `plan.md`. |

## Scout evidence

- **Bug reproduced live**, not hypothetical: this checkout's
  `core.hooksPath` is currently
  `/home/vantt/projects/forgentX/.githooks` (absolute — confirmed via
  `git config --get --show-origin core.hooksPath`, stored directly in
  `.git/config`, not a per-worktree override —
  `extensions.worktreeConfig` is unset). `node bin/fgos.mjs doctor --dir
  /home/vantt/projects/forgentX` currently prints:
  `"core.hooksPath not wired to .githooks — commits here are NOT guarded
  against concurrent-writer clobbering (str65) — run fgos setup"` — the
  exact false negative the item describes.
- `mainCheckoutHookWired` (`src/setup/git-hooks.mjs:60-66`): `execFileSync('git',
  ['config', '--get', 'core.hooksPath'], {cwd, encoding:'utf8'}).trim() ===
  '.githooks'`.
- `installGitHooks` (`git-hooks.mjs:43-50`): `current === '.githooks'` →
  already wired; `current !== ''` → `{wired:false, skippedExisting:
  current}` (fill-only, never overwrites a value it doesn't recognize as
  its own).
- `uninstallGitHooks` (`git-hooks.mjs:81-95`): `current !== '.githooks'` →
  leaves it untouched (same ownership-detection pattern, inverted).
- `checkMainCheckoutHookWired` (`src/setup/registrations.mjs:321-326`) is
  the doctor check wrapping `mainCheckoutHookWired`, registered as
  `main-checkout-hook-wired` at `registrations.mjs:374-378`.
- Existing test coverage, none of which currently exercises an absolute
  `core.hooksPath` value:
  - `test/setup/checks.test.mjs:429-522` — `mainCheckoutHookWired` unit
    tests (unset / no-git / other-dir / `.githooks` cases) + doctor-check
    integration test + `fgos setup` wiring/fill-only e2e tests.
  - `test/scripts/install-git-hooks.test.mjs` — `installGitHooks` /
    `uninstallGitHooks` coverage.
  - `test/e2e/main-checkout-lock-hook.test.mjs` — real subprocess `git
    commit` lock-contention e2e (unaffected by this fix's scope, cited for
    completeness).
- `docs/journals/260728-2130-hook-reachability-tsk-3w8.md` — background on
  why the hook exists (str65 main-checkout lock) and its original
  activation-gap incident. No mention of absolute-vs-relative path
  representation; unrelated to this item's root cause (consistent with D3
  — the drift's cause isn't documented anywhere found).
- Capability gate: `fgos tool query --capability impact-analysis --status
  present` → GitNexus `present`. Impact-analysis posture: **full** per
  `CLAUDE.md`'s gate — informational only at this stage; applies when code
  editing starts at `executing`.
- No prior `judgeDiscovery` verdicts recorded for this item
  (`view.discovery["tsk-1gn"]` was empty).

## Pinned terms

- "wired" = `core.hooksPath` (in any representation — relative or
  absolute) resolves to the same directory as this repo's own
  `.githooks/`.

## Outstanding questions for planning

None — all gray areas resolved above. `fgos-coding-planning` decides the actual
code shape (e.g. whether a single shared `hooksPathIsGithooks(cwd,
repoRoot)` helper backs all three call sites, or each keeps its own
resolve-and-compare) — that's an implementation choice, not a locked
product decision here.
