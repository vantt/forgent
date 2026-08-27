# Plan: tsk-4e1 — `fgos preflight` verb

Mode: small

No `fgos-coding-exploring` round happened for this item (discovery verdict
was `clear`, so `exploring`/`CONTEXT.md` were skipped) — no per-item
locked-decision table exists to cite. Every claim below traces back
instead to `docs/history/fgos-preflight-verb/RESEARCH.md`'s discovery
round (2026-08-25).

Lane derivation (no lane was handed off by `fgos-routing`'s Orient step —
this session entered via `fgos-coding-driving`'s mechanical loop directly
— so the Mode-gate table itself was applied here, per
`fgos-coding-planning`'s own direct-entry fallback): auth/authorization/
data-model/audit-security/external-systems/cross-platform/existing-
covered-behavior/weak-proof-area/multi-domain all **no** — this adds a
new, purely additive CLI verb that shells out to already-existing scripts
and never touches `.fgos/` state. One soft flag: **public contract**
(`src/cli/command-registry.mjs`'s manifest is `fgos --help --json`'s
machine-readable surface, and this adds a new entry to it) — additive
only, no existing entry changes shape. 0–1 flags → **small** (a few
files, no gray areas): new verb handler + registry entry + its own test
file.

## Approach

**Chosen path.** Add `fgos preflight` as a new, read-only-shaped CLI verb
(no `.fgos/` involvement at all) that runs the item's 3 named checks and
reports/fails fast, mirroring the existing `doctor` verb's own
aggregate-and-report shape (`bin/fgos.mjs:3943-3956`, `DOCTOR_CHECKS.map(({id,
description, check}) => ({id, description, passed, message}))` →
`{checks}`):

1. **`mirror-sync-diff`** — spawn `npm run build:skills` (which drives
   `scripts/build-skill-wrappers.mjs`: source `.agents/skills/` →
   `generateAllSkillWrappers` into `.claude/skills/` + `mirrorDevSkillsIntoPlugin`
   into `plugins/fgOS/skills/`, confirmed by reading the full script,
   RESEARCH.md round 1), then `git diff --exit-code -- .claude/skills
   plugins/fgOS/skills` scoped to just the 2 real mirror dirs (not the
   whole tree, so an unrelated dirty file elsewhere never false-fails this
   check — pinned as an assumption, not material: it does not change what
   this check is for, only narrows its blast radius to what it actually
   owns). This literally reproduces the item's own specified design ("chạy
   `npm run build:skills` rồi `git diff --exit-code`") rather than a
   non-mutating alternative (e.g. rendering to a temp dir and diffing
   there) — the item's own text locks this shape explicitly, so it is
   honored as written, not second-guessed here.
2. **`decision-citation-drift`** — spawn `node
   scripts/check-decision-citation-drift.mjs` (confirmed clean CLI
   contract: `runCli` returns `0`/`1`, only self-invokes under its own
   `import.meta.url` guard — `scripts/check-decision-citation-drift.mjs:437,
   509-513` — safe to spawn as a subprocess).
3. **`backlog-reconciliation`** — spawn `node
   scripts/check-backlog-reconciliation.mjs` (confirmed it runs
   unconditionally at module top level and calls `process.exit(1)`
   directly with no `import.meta.url` guard — safe ONLY as a subprocess,
   never as an `import`, or it would execute as a side effect of loading
   the new verb's own module).

All 3 run via `child_process.spawnSync` (not `execFileSync`, which throws
on nonzero exit — `spawnSync` returns `{status, stdout, stderr}` without
throwing, letting all 3 checks run and report even when one fails).

**Repo root — the one real divergence from the `doctor` pattern.**
`doctor` resolves its root to the shared MAIN checkout
(`resolveMainCheckoutRoot(process.cwd()) ?? process.cwd()`), because it
diagnoses the shared `.fgos/` store. `preflight` must NOT do that: its
whole purpose (per the item's own text) is to run inside a worker's own
linked worktree, right before that worktree's own `fgos return`, checking
the files about to be committed THERE. A linked worktree carries its own
full working-tree copy of every tracked path except `.fgos/` (`git
worktree add` behavior, confirmed by `.githooks/pre-commit`'s own
`committingToplevel` pattern at `.githooks/pre-commit:198` doing the same
cwd-strict resolution for the identical reason). So `preflight` resolves
`repoRoot` via `execFileSync('git', ['rev-parse', '--show-toplevel'],
{cwd: process.cwd()})` — the CURRENT checkout's own toplevel, never
`dataDir()`'s `.fgos`-resolved `dir`, and never `resolveMainCheckoutRoot`.
This also confirms `requiresExistingStore: false` (no `.fgos/` dependency
at all). **Correction after an initial reality-gate FAIL**: `touchesState`
was first claimed `false` here on a literal reading of
`src/cli/command-registry.mjs`'s header comment ("true for any verb that
ever appends an event or overwrites `.fgos/state.json`") — wrong. The
same file's `setup` entry (`src/cli/command-registry.mjs:1201-1204`,
`touchesState: true`) is the closest real precedent: `setup` writes the
shared config file/shell rc files/git hooks, never `.fgos/` at all, and
is still `touchesState: true` — the header comment's own next sentence
says so explicitly. The field tracks any persistent-state write, not only
`.fgos/`. `preflight`'s check 1 writes real files
(`.claude/skills/`/`plugins/fgOS/skills/`) as an intentional side effect,
so its registry entry is `touchesState: true`, `externalEffect: false`
(no external-system effect like `review --github`'s GitHub PR touch),
matching `setup`'s own shape exactly.

**Exit code.** Confirmed by reading `bin/fgos.mjs`'s `main()` dispatch
(`bin/fgos.mjs:4341-4368`): a verb's success path always sets
`process.exitCode = 0` regardless of what data it returns — `doctor`
itself exits 0 even when some checks fail, because it is diagnostic-only.
That is wrong for `preflight`: its entire value is being usable in a
shell conditional (`fgos preflight || ...`) from a driver skill, so it
must signal failure via a nonzero exit. Confirmed the mechanism
(`src/state/store.mjs:47-75`): throwing `StoreError('validation', ...)`
maps to exit code 4 via the existing `EXIT_CODES` table — reusing the
existing `validation` category (no new category, no `EXIT_CODES`/
`categoryOf` edit) keeps this additive and small. When any check fails,
the handler throws `StoreError('validation', 'fgos preflight: N of 3
check(s) failed:\n  - <id>: <message>\n  ...')` listing every failing
check's own message (never just the first) — matching the
`assert-if-any-fail-list-all` shape `doctor`'s own report already uses
conceptually. When all 3 pass, it returns `{checks}` (exit 0), the same
shape as `doctor`.

**Alternatives rejected.**
- A blocking `.githooks/pre-commit` addition — rejected by the item's own
  stated rationale (confirmed: the real hook today, `.githooks/pre-commit`,
  full file read, protects exactly 5 `.fgos/`-invariant guards and nothing
  else; adding 3 unrelated, slower checks there creates `--no-verify`
  pressure against those 5 real invariants — a strictly worse trade-off).
- Importing `check-backlog-reconciliation.mjs` instead of spawning it —
  rejected: it runs its own logic unconditionally at module top level with
  no `import.meta.url` guard, so importing it would execute (and
  `process.exit`) as a side effect of merely loading the new verb's code.
- Rendering skill wrappers to a temp dir and diffing there instead of
  running the real `npm run build:skills` in place — rejected as
  overriding the item's own explicitly specified check design (see check
  1 above).

**Impact-analysis posture:** `fgos tool query --capability impact-analysis
--status present` → 1 provider (`gitnexus`), `status: "present"` →
posture **full**. Not leaned on for a proof point here regardless: this
change adds a brand-new verb with no existing callers to trace blast
radius through, so a code-graph query has nothing to answer that reading
`bin/fgos.mjs`'s existing verb shapes directly does not already answer
more precisely. Noted per the CLAUDE.md gate's own recording requirement,
not because a query was skipped for convenience.

**Files touched, in order:**
1. `bin/fgos.mjs` — add `case 'preflight': { ... }` (placed next to
   `doctor`, `bin/fgos.mjs:3943`, the closest sibling pattern).
2. `src/cli/command-registry.mjs` — add the matching `preflight` manifest
   entry (`touchesState: true`, `requiresExistingStore: false`,
   `externalEffect: false`, `paginated: false`).
3. `test/cli/fgos-preflight.test.mjs` — new test file (naming convention
   confirmed via `ls test/cli/`: `fgos-<verb>.test.mjs`).

This order is dictated by the code itself (the test needs the verb to
exist; the verb needs no other new file) — `fgos graph tsk-4e1 --json`
was still run per this skill's own instruction: `tsk-4e1` has no deps and
sits in its own size-1 component, so the work-item critical-path/
topUnblock fields carry no file-ordering signal for a single, unsplit
item; the ordering above comes from the source dependency shape instead.

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| `mirror-sync-diff` check correctness | medium — runs a real subprocess (`npm run build:skills`) and depends on git being available/the working tree being a real git checkout | `test/cli/fgos-preflight.test.mjs` exercises this check against a fixture repo seeded with a deliberately stale mirror (built via the existing `test/cli/helpers/fgos-cli-harness.mjs` git-fixture helpers, e.g. `initGitCwd`), asserting `passed: false` and a nonzero exit; a second fixture with mirrors already in sync asserts `passed: true` |
| exit-code/aggregation behavior (the verb's actual reason to exist) | medium — the 3 checks already have their own correctness proofs elsewhere (`test/scripts/check-decision-citation-drift.test.mjs` for check 2; check 3 currently has none, see Outstanding below); this verb's own job is only to dispatch + aggregate + fail fast | same test file: one all-pass case (exit 0), one single-check-fail case per check (exit 4, `StoreError` category `validation`), confirming the verb reports every failing check's message, not just the first |
| `check-backlog-reconciliation.mjs` invoked as a subprocess for the first time ever | light — script itself is unchanged, only how it's invoked is new | the same fixture-driven test above exercises it as a real subprocess once; its own internal logic is out of this item's scope (already proven or not is a pre-existing gap this item does not need to close) |

## Shape

Single, pass-through piece — no split. The whole deliverable is: one new
verb (`bin/fgos.mjs` + `src/cli/command-registry.mjs`) plus its own test
file, following the `doctor` verb's aggregate-and-report shape with the
one real divergence (cwd-strict repo root, nonzero exit via
`StoreError('validation', ...)`) documented above.

Concrete cases to prove, at `small`-lane depth:
- All 3 checks pass → `{checks: [...]}`, exit 0.
- Exactly one check fails (each of the 3, independently) → `StoreError`
  category `validation`, exit 4, message lists the failing check's own
  `id`/message; the other 2 checks still ran and are reported.
- More than one check fails → message lists every failing check, not just
  the first.
- Run from inside a linked worktree (not just the main checkout) — the
  cwd-strict `git rev-parse --show-toplevel` resolution is this item's
  one real design decision, so at least one test case must exercise it
  from a worktree, not only a main-checkout-shaped fixture.

Not in scope for this item (see Outstanding questions): wiring an actual
call to `fgos preflight` into `fgos-coding-implement`'s own Verify step.

## Outstanding questions

None. (One scope-sizing note, not a gap: whether to also edit
`fgos-coding-implement` to call this new verb before `fgos return` is left
for a follow-up rather than folded into this item — the item's own text
states a design CONSTRAINT on how the verb must be buildable ("should be
CALLED by the driver skill, not a hook"), which this plan honors by
making the verb itself standalone/scriptable, but does not itself mandate
editing that skill in the same change. Smallest-honest-plan: ship the
verb, callable and provably correct on its own, first.)
