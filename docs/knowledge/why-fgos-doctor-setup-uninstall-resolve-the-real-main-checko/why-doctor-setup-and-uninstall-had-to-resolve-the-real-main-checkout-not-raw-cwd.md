---
type: explanation
title: Why doctor, setup, and uninstall had to resolve the real main checkout, not raw cwd
tags: [doctor, setup, uninstall, worktree, dir-resolution]
source_capture_ids: [tsk-2xj]
authoritative_for: why fgos doctor/setup/uninstall resolve the real main checkout instead of process.cwd(), and why every config check used to lie from inside a linked worktree
framework: diataxis
mode: explanation
---
# Why `doctor`, `setup`, and `uninstall` had to resolve the real main checkout, not raw cwd

`tsk-2xj`. Full evidence: `docs/history/setup-doctor-uninstall-dir-resolution/`.

## The bug

`fgos doctor`'s CLI case ignored its own `--dir` flag entirely, always
passing `process.cwd()` both to every registered check and to
`runFixes` — `const fixed = flags.fix ? runFixes(process.cwd()) :
undefined`, then `DOCTOR_CHECKS.map(({check}) => check(process.cwd()))`.
The `--dir` flag every other verb honors was parsed and then simply
never used.

Config checks resolve their target file as `sharedConfigFilePath(dir) =
dir/.fgos/config.json`. Run from inside a linked worktree, that resolves
to `<worktree>/.fgos/config.json` — which, per ADR0020, never exists.
`readSharedConfig` returns empty, and every section check reports
missing, even when the real config is sitting correctly in the main
checkout. `doctor --fix` would have gone one step further and actually
*written* `.fgos` into the worktree, violating ADR0020 directly.
Reproduced live from inside a real worktree with an explicit `--dir`
pointing at the real checkout: doctor still reported a real, present
`workerSlots` config section as missing.

## The fix: reuse the pattern already proven at 12 call sites

`src/setup/registrations.mjs` already had the correct fix pattern
established at 12 call sites: `resolveMainCheckout(cwd)`, which
self-detects the real main checkout via `git rev-parse
--git-common-dir` regardless of which worktree the session is actually
in (`src/runner/paths.mjs:72-85`). This item applied that exact same
pattern to the 11 remaining raw-`cwd`/`process.cwd()` sites that had
never been converted:

- `doctor`'s two call sites (`runFixes`, the `DOCTOR_CHECKS.map` check
  call).
- `setup`'s `repoRoot` feeding five downstream call sites
  (`sharedConfigFilePath`/`ensureSharedConfigDefaults`,
  `installGitHooks`, `runFixes`, `materializeSkillsIntoProject`).
- `uninstall`'s `repoRoot` feeding `uninstallGitHooks`.
- The gate-bypass config check/fix pair in `registrations.mjs` — the
  only two *registered* checks/fixes still left on raw `cwd`.

Resolution shape matches the existing convention already used elsewhere
in the file: `flags.dir !== undefined ? path.dirname(dir) :
(resolveMainCheckoutRoot(cwd) ?? cwd)` — an explicit `--dir` still wins
when given, and the fallback self-detects the real checkout instead of
trusting whatever directory the process happened to start in.

## A test-quality fix alongside the code fix

The existing doctor-comparison test was itself found to be comparing
against a baseline that didn't actually prove correctness — it was
rewritten to use a real correctness baseline, and Iron Law evidence was
recorded for the change (the file touched, `bin/fgos.mjs`, guarantees
this gate fires).
