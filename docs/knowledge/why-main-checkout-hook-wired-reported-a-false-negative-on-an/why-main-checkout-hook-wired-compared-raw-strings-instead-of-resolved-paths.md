---
framework: diataxis
mode: explanation
---
# Why `main-checkout-hook-wired` reported a false negative on an absolute `core.hooksPath`

`tsk-1gn` found `fgos doctor` reporting `main-checkout-hook-wired:
failed` — "core.hooksPath not wired to .githooks — commits here are NOT
guarded against concurrent-writer clobbering (str65) — run fgos setup"
— on a checkout where the hook was genuinely wired and actively blocking
commits. This wasn't a hypothetical: it was reproduced live, twice, on
this repo's own main checkout.

## The bug: exact string equality instead of path equivalence

Three functions in `src/setup/git-hooks.mjs` all compared git's
`core.hooksPath` config value against the literal string `.githooks`
using exact string equality:

- `mainCheckoutHookWired(cwd)` — the read check `fgos doctor` calls.
- `installGitHooks(repoRoot)` — the fill-only write detector deciding
  whether to leave an existing value alone.
- `uninstallGitHooks(repoRoot)` — the ownership detector deciding
  whether it's safe to unset the value.

`core.hooksPath` can hold either a relative value (`.githooks`) or an
absolute path (`/repo/root/.githooks`) that resolves to the exact same
directory — git treats both identically when actually running hooks.
This checkout's own `core.hooksPath` had drifted from relative to
absolute sometime after 2026-07-28 (confirmed against
`docs/decisions/0021`'s dogfood note, which recorded it as relative and
green at that date) — the cause of that drift was never identified and
was explicitly left out of this item's scope, since fixing the
comparison logic makes the drift's cause irrelevant either way.

With exact-string comparison, all three functions gave the wrong answer
the moment the value became absolute, even though the hook was correctly
wired and actively running:

- `mainCheckoutHookWired` returned `false` → doctor reported a false
  negative — commits *were* guarded, doctor said they weren't.
- `installGitHooks` treated the absolute value as a foreign custom hook
  path, reporting `skippedExisting: "<absolute path>"` even though it
  was fgOS's own hook, just stored in a different representation.
- `uninstallGitHooks` refused to unwire fgOS's own hook, for the same
  reason inverted.

## The fix: normalize both sides before comparing

`path.resolve(repoRoot, current)` versus `path.resolve(repoRoot,
'.githooks')`, comparing the *resolved* paths instead of raw string
equality — no symlink resolution, no case-insensitive handling, since no
evidence surfaced that either was needed in this repo. "Wired" is
redefined as: `core.hooksPath`, in any representation, resolves to the
same directory as this repo's own `.githooks/`.

## A second bug found live, mid-fix: `repoRoot` itself can't be trusted as `process.cwd()`

The first pass of the fix introduced a fresh false negative of its own,
reproduced live by running `fgos doctor` from inside this very item's
own worktree: `bin/fgos.mjs`'s `setup`/`uninstall`/`doctor` verbs pass
`repoRoot = process.cwd()` into these functions — which is correct from
the main checkout, but wrong from inside a linked worktree, since a
worktree's `.githooks` path resolves against the *worktree's* directory,
not the real shared main checkout's.

Fixed by resolving the true repo root via `git rev-parse
--path-format=absolute --git-common-dir` (its parent) before resolving
either side of the comparison — the same resolution `resolveMainCheckout`
already used elsewhere in `registrations.mjs`. This is the same class of
bug documented more generally in
`docs/how-to/run-a-state-verb-from-inside-a-worktree.md`: any function
that resolves a real filesystem path from `process.cwd()` instead of the
git-common-dir-resolved root will silently target the wrong location
once it's called from inside a worktree rather than the main checkout —
here it wasn't a state write going to the wrong place, but a comparison
being computed against the wrong directory entirely.

## Test discipline: verify named the specific new scenario, not just "existing tests still pass"

The second-pass judge disputed the first proposed `verify` command
(the existing narrow test files, unmodified) — a pass on that command
wouldn't prove the absolute-path scenario was actually exercised, since
none of the existing test files had a case for it yet. The `verify` was
strengthened to name the required new test cases explicitly:
`mainCheckoutHookWired is true when core.hooksPath is an absolute path
resolving to repoRoot/.githooks` (`checks.test.mjs`), plus an
absolute-path-equivalence case each for `installGitHooks` and
`uninstallGitHooks` — so a pass self-evidently covers the real scenario,
not just "the file that already existed still runs green."

A related correction surfaced at `fgos-coding-validating`'s reality-check gate:
the file expected to hold the `uninstallGitHooks` test case was
originally misidentified — a grep proved that file had zero
`uninstallGitHooks` references at all; the real existing coverage lived
in a different, correctly-named test file. Caught before merge, not
after — the reality gate's own job.

Full decision record: `docs/history/main-checkout-hook-wired-absolute-path/CONTEXT.md`
(D1-D4).
