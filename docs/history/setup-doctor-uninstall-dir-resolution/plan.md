# plan.md — tsk-2xj: doctor/setup/uninstall ignore --dir, materialize .fgos/ into worktrees

Mode: standard

Lane decided directly (no prior Orient hand-off in this session; no
`fgos-routing` pass ran before this item was claimed). Flags counted per
`fgos-routing`'s Mode-gate: **public contracts** (doctor/setup/uninstall are
the CLI's own install-health surface, exercised by real users and CI) and
**existing covered behavior** (`test/setup/*`, `test/cli/fgos-setup.test.mjs`
already cover parts of this code path — the fix must not regress them). 2
flags, no hard-gate flag (no auth/data-loss/audit-security/external-provider/
removing-a-validation) → **standard**.

This item skipped `exploring` (discovery verdict `clear`, both of the
item's own open questions answered by direct evidence — see
`docs/history/setup-doctor-uninstall-dir-resolution/RESEARCH.md`), so there
is no `CONTEXT.md` for this feature and no locked D-IDs to cite. No split is
proposed (see step 4 below), so no child spec needs a D-ID citation either.

## Approach

**Chosen path:** apply the exact fix pattern already proven at 12 call
sites in `src/setup/registrations.mjs` (`resolveMainCheckout(cwd)`,
self-detecting the real main checkout via `git rev-parse --git-common-dir`
regardless of worktree, `src/runner/paths.mjs:72-85`) to the 11 remaining
raw-`cwd`/`process.cwd()` call sites:

- `bin/fgos.mjs:4859,4861` — `doctor` case (2 sites: `runFixes`, the
  `DOCTOR_CHECKS.map` check call)
- `bin/fgos.mjs:4705` (`const repoRoot = process.cwd()`) feeding 5 call
  sites in the `setup` case: `sharedConfigFilePath`(:4727)/`ensureSharedConfigDefaults`(:4729),
  `installGitHooks`(:4740), `runFixes`(:4748), `materializeSkillsIntoProject`(:4755)
- `bin/fgos.mjs:4814` (`const repoRoot = process.cwd()`) feeding 2 call
  sites in the `uninstall` case: `uninstallGitHooks`(within the case)
- `src/setup/registrations.mjs:~377` and `~899-911` — the gate-bypass
  config check/fix pair, the only 2 registered checks/fixes still on raw
  `cwd`

**Resolution shape** (matches the existing convention at `bin/fgos.mjs:4939`):
`flags.dir !== undefined ? path.dirname(dir) : (resolveMainCheckoutRoot(cwd) ?? cwd)`
— an explicit `--dir` always wins outright; otherwise self-detect the real
main checkout from wherever the process is running; fall back to the raw
value only when neither resolves (not inside a git checkout at all, the
same graceful-`null` case `resolveMainCheckoutRoot` already documents).

**Alternatives rejected:**
- *Inventing a new resolution helper* — rejected; `resolveMainCheckout`
  already exists, is already used by the majority of checks, and is
  already covered by its own tests. A second helper for the same job would
  itself be new surface to review and diverge from.
- *Gating only `doctor --fix`/`setup`/`uninstall`'s writes, leaving reads
  unfixed* — rejected; `doctor` (no `--fix`) is the higher-frequency,
  lower-risk half of the bug (false alarms only) but is exactly as wrong
  today, and leaving it unfixed keeps the "every worker-slot-ceiling /
  invariant / herdr-orchestrator check lies from a worktree" cost live.

**Risk map:**

| Component | How risky | Proof point |
|---|---|---|
| `doctor`'s 2 call sites (read + `--fix` write) | Medium — read-only diagnostic, but `--fix` still writes; blast radius is "which checks report differently" | Compare `fgos doctor --json` output from inside a worktree vs. an explicit `--dir` pointing at the main checkout — must match |
| `setup`'s 5 call sites (all unconditional writes) | **High** — setup runs unconditionally, not gated behind a flag; ADR0020 violation is live today (RESEARCH.md finding #3) | Run `fgos setup` from inside a linked worktree; assert no `<worktree>/.fgos/` is created afterward |
| `uninstall`'s 2 call sites | Medium — same pattern, narrower blast radius (uninstall is rare) | Run `fgos uninstall --yes` (no `--remove-package`) from inside a worktree; assert it acts on the main checkout's git hooks, not the worktree's |
| `registrations.mjs`'s gate-bypass check/fix pair | Medium — already covered by `test/setup/checks.test.mjs` per prior audit | Existing test suite must still pass; add a worktree-cwd case if the existing suite doesn't already parametrize cwd |

**Impact-analysis posture:** `degraded`. `fgos tool query --capability
impact-analysis --status present` returns GitNexus as `present`, but
`list_repos` shows the `forgentX` index is 173 commits behind HEAD
(`staleness.commitsBehind: 173`) — per `CLAUDE.md`'s capability gate this
is "present but flagged stale," so blast-radius evidence from GitNexus is
weak, not confirmed fresh. Cross-checked with direct `grep`/`Read` instead
(RESEARCH.md round 1) — every call site cited above was confirmed by
reading the actual current source, not by GitNexus query. GitNexus's own
`impact` tool was not used as primary evidence for this item.

`fgos graph --json` was not consulted for ordering: this item is a single
mechanical piece (no split), so `criticalPath`/`topUnblock` have nothing to
inform.

## Shape

Single phase — the fix is the same one-line substitution repeated across
11 call sites plus the local `resolveMainCheckoutRoot`/`path` imports
`bin/fgos.mjs` may still need (check existing imports first; `resolveMainCheckout`
is already imported from `src/setup/registrations.mjs` if any check already
calls it there, or needs the same `resolveMainCheckoutRoot` import
`registrations.mjs` itself uses from `src/runner/paths.mjs`).

**Concrete cases to prove against:**
- Empty/boundary: running any of the three verbs from the main checkout
  itself (not a worktree) — must be byte-identical to today's behavior
  (no `--dir` given, `resolveMainCheckoutRoot(cwd)` resolves to the same
  `cwd` already in use).
- Existing behavior that must not regress: `test/setup/checks.test.mjs`,
  `test/cli/fgos-setup.test.mjs`, `test/setup/uninstall-wiring.test.mjs` —
  full suite must stay green.
- The actual bug case: running `doctor`/`setup`/`uninstall` from inside a
  linked worktree (no `--dir`) must resolve to the main checkout, not the
  worktree, matching what an explicit `--dir` already produces today.
- Partial failure: `resolveMainCheckoutRoot` returns `null` when not
  inside a git checkout at all (e.g. an extracted npm tarball outside any
  `.git`) — the fallback `?? cwd` must keep today's existing behavior for
  that case, not throw.

New test file: `test/setup/dir-resolution.test.mjs` — covers the
worktree-cwd case for all three verbs (`doctor`, `setup`, `uninstall`)
directly, since none of the existing suites (`checks.test.mjs`,
`fgos-setup.test.mjs`, `uninstall-wiring.test.mjs`) currently spawn a
linked worktree as the cwd under test.

## Split decision

**No split.** One honest piece: the same mechanical substitution repeated
across 11 known call sites in 2 files, verified together by one test run.
Splitting by verb (doctor/setup/uninstall as 3 items) would only fragment
one proof into three PRs touching the same Iron-Law-gated files with
overlapping footprints — real risk of a footprint collision this repo's
own gate exists to catch, for no isolation benefit since all three share
the identical bug and fix shape.

## Outstanding questions

None
