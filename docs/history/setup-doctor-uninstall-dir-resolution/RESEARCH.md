# RESEARCH — setup/doctor/uninstall --dir resolution (tsk-2xj)

## Round 1 — 2026-08-14

**Asked:** verify the exact current scope of the "--dir ignored" bug across
`fgos doctor`/`setup`/`uninstall`, and confirm the fix pattern already used
by the majority of `src/setup/registrations.mjs` checks, to decide fix
shape for planning.

**Checked / found:**

1. `bin/fgos.mjs:4859,4861` — `doctor` case: `runFixes(process.cwd())` and
   `check(process.cwd())` for every `DOCTOR_CHECKS` entry. The parsed `dir`
   global (set at `bin/fgos.mjs:5222`, `dir = dataDir(flags.dir)`) is never
   read inside this case block. **Confirmed.**

2. `src/config/shared-config-file.mjs:19` `sharedConfigFilePath(dir)` joins
   `dir/.fgos/config.json`. **Confirmed** (matches item description).

3. `src/config/shared-config-file.mjs:85-87` — `writeSharedConfig(dir, config)`
   calls `fs.mkdirSync(path.dirname(sharedPath), { recursive: true })`
   before writing. This is an unconditional directory-creating write, not a
   rewrite-only-if-exists — so `doctor --fix` run from inside a linked
   worktree WOULD materialize `<worktree>/.fgos/config.json`. **Confirmed,
   real today, not latent** (answers the item's own open question).

4. `bin/fgos.mjs:4704-4755` (`setup` case) — `const repoRoot =
   process.cwd()` at :4705, never reads `flags.dir`/`dir`. Then
   unconditionally: `ensureSharedConfigDefaults(repoRoot)` (:4729),
   `installGitHooks(repoRoot)` (:4740), `runFixes(repoRoot)` (:4748, no
   `--fix` gate — tsk-5hi made this unconditional), `materializeSkillsIntoProject(PACKAGE_ROOT,
   repoRoot)` (:4755). `bin/fgos.mjs:4814` (`uninstall` case) — same
   `const repoRoot = process.cwd()` pattern, also never reads `flags.dir`.
   `--remove-package` (uninstall) also never checks which package manager
   installed the running copy (separately filed as tsk-652). **Confirmed —
   setup's exposure is worse than doctor's: unconditional, not gated behind
   a flag.**

5. `src/setup/registrations.mjs` — grep for `resolveMainCheckout(` hits 12
   call sites: lines 234, 405, 496, 558, 607, 661, 711, 730, 773, 848, 1342,
   1435, 1462 (line 234 is inside `resolveMainCheckout`'s own sibling
   `integrationScriptPath` helper, not a check; the other 12 are check/fix
   bodies). Raw `sharedConfigFilePath(cwd)` (bypassing `resolveMainCheckout`)
   appears at lines 179 (a top-level accumulator, not a check body), 377,
   and 911. **Confirmed**: 12 checks already resolve correctly; only the
   gate-bypass config-family check/fix pair (~377, ~899-911) reads/writes
   raw `cwd`.

   `resolveMainCheckout(dir)` (`registrations.mjs:204-206`) is a thin
   wrapper over `resolveMainCheckoutRoot(dir)`
   (`src/runner/paths.mjs:72-85`), which shells out to `git rev-parse
   --path-format=absolute --git-common-dir` FROM `cwd` — this always
   resolves to the main checkout's `.git`, regardless of whether `cwd` is
   inside a linked worktree, and returns `null` (never throws) when `cwd`
   is not inside a git checkout at all. **It self-detects; it does not
   require an explicit `--dir`.** The existing call-site convention for
   verbs that also want to honor an explicit `--dir` override is visible at
   `bin/fgos.mjs:4939`: `flags.dir !== undefined ? path.dirname(dir) :
   (resolveMainCheckoutRoot(worktreePath) ?? path.dirname(dir))` — explicit
   `--dir` wins outright, otherwise self-detect, with a graceful fallback
   rather than a throw.

**Still open:** none — all 5 claims verified directly against current
source with file:line citations. No contradictory evidence found.

**Verdict: clear.**

- Fix pattern: route `doctor`/`setup`/`uninstall`'s `process.cwd()` through
  the same `flags.dir !== undefined ? ... : (resolveMainCheckout(cwd) ??
  cwd)` shape the majority of `registrations.mjs` checks and `bin/fgos.mjs:4939`
  already use — not a new pattern, applying an existing proven one to the
  remaining raw-`cwd` call sites (doctor's two call sites, setup's five
  call sites, uninstall's two call sites, plus the gate-bypass config
  check/fix pair at `registrations.mjs:~377,~899-911`).
- Real verify command (runnable, proves the fix): from a linked worktree,
  `fgos doctor` should report the SAME `passed` values as running it from
  the main checkout with an explicit `--dir`, and `fgos doctor --fix`
  should never create `<worktree>/.fgos/`. Concretely:
  `test -d .fgos || true; node bin/fgos.mjs doctor --json | node -e "..."`
  compared between the two cwds — left to planning to write as an exact
  script, but the shape (compare doctor output from worktree vs main
  checkout, assert no `.fgos/` materializes in the worktree after `--fix`)
  is real and runnable.
