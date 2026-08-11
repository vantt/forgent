# promote-to-component trust-dir opt-in flag — plan (tsk-2bg)

CONTEXT.md: `docs/history/catchup-worktree-cwd-fix/CONTEXT.md` (D5/D6
locked and approved, gate-bypass level `standard`). This plan covers ONLY
tsk-2bg's own scope; `catchup` (tsk-5vl) and `sync-root`/`approve`
(tsk-4uj) are delivered/in-review separately, same feature dir, different
D-IDs.

## Mode gate

No lane was handed off before this skill loaded (this session reached
`tsk-2bg` via `/fgOS:pick` → `fgos-coding-driving`, never through
`fgos-routing`'s own Orient step), and no `plan.md` existed yet on this
branch to carry a prior `Mode:` line — per this skill's own direct-entry
fallback, the lane is derived directly here from `fgos-routing`'s
Mode-gate table. `tsk-4uj`'s own `plan.md` (same feature, sibling verbs)
is direct precedent — read in full before this analysis.

Flags counted:

- **audit/security (hard-gate)** — this item adds an opt-in bypass to a
  trust-boundary/verification guard (`isMainWorktree`) on
  `promote-to-component`, a verb that performs real git merges of
  multiple member branches into a shared integration branch
  (`fgw/<rootId>`). Same guard class tsk-4uj already classified as
  hard-gate for `approve`/`sync-root` — the flag fires on the TYPE of
  change (bypassing a trust-boundary/verification guard on a
  git-mutating verb), independent of whether this specific verb carries
  its own prior-incident history. **Hard-gate flag present.**
- **existing covered behavior** — `promote-to-component` has an existing
  suite of ~10 tests in `test/cli/fgos.test.mjs` (validation, happy
  path new-root, happy path reuse-member, cycle-rejection, conflict
  handling — lines ~6613-6850+) that must stay green unmodified when the
  new flag is omitted. **1 flag.**
- **weak proof around the area** — confirmed this item's own
  `fgos-researching` Round 3: NEITHER guard layer
  (`bin/fgos.mjs`'s CLI-level `isMainWorktree` check, nor
  `retargetMember`'s own independent check in
  `src/runner/promote-engine.mjs:53-58`) has ANY existing test coverage
  today — worse than tsk-4uj's own finding for `approve`/`sync-root`
  (which at least had P44-guard tests, just not the untested `--dir`
  combination). **1 flag.**
- **public contract** — adds a new CLI flag to an already-documented verb
  (`fgos promote-to-component`), visible to anyone scripting against it.
  **1 flag.**

A hard-gate flag alone is enough → **high-risk**, regardless of the total
count (4, here) — matching tsk-4uj's own lane for the sibling verbs. This
differs from the item's own intake-time `tier: standard` — a preliminary
classification made before this deeper analysis; the Mode-gate table's
flag count is the authoritative sizing signal for planning depth, not the
intake tier. Per D5, this verb's own comparative risk (vs. `approve`) is
lower — that distinction lives in the risk map below, not in the lane
decision itself (the same relationship tsk-4uj's plan drew between its
own `approve` row (High) and `sync-root` row (Medium) inside one
high-risk-lane plan).

## Approach

Locked scope (CONTEXT.md D5/D6): add the **same** opt-in trust-dir flag
`promote-to-component` (`bin/fgos.mjs`, `case 'promote-to-component'`,
currently lines 3535-3547) that tsk-4uj is adding to `sync-root`/
`approve` — when passed, `repoRoot` derives from `path.dirname(dir)`
instead of `process.cwd()`, before the existing `isMainWorktree(repoRoot)`
guard at line 3542 (guard itself UNCHANGED code, evaluating a different
`repoRoot` value depending on the flag). When the flag is OMITTED
(default), behavior is byte-identical to today.

**D6's own scope boundary: zero change to `src/runner/promote-engine.mjs`.**
`retargetMember` (`promote-engine.mjs:53-58`) is called at
`bin/fgos.mjs:3624` with the exact same `repoRoot` variable the CLI
handler resolves once at line 3541 — never re-derived downstream. Once
the CLI layer resolves `repoRoot` correctly (flag-gated), `retargetMember`'s
own `isMainWorktree(repoRoot)` check passes through transparently on an
already-correct input; the guard is neither removed nor weakened, it
simply receives correct input, same as today when invoked from the real
main checkout.

**Hard dependency on tsk-4uj landing first** (CONTEXT.md's own tsk-2bg
assumption note): tsk-4uj is currently `status: awaiting-approval`
(returned, not yet merged to `main`), and its exact flag name/no-op-vs-
error shape for a bare flag without `--dir` is explicitly left to
`fgos-planning` in D3's own text — not yet finalized as of this pass.
**Whoever implements this item must reuse tsk-4uj's actual shipped
mechanism verbatim** (flag name, `repoRoot`-resolution shape, test
pattern) rather than inventing a parallel one ahead of it. If tsk-4uj has
not yet merged to `main` when this item reaches `executing`, implementation
should pull tsk-4uj's real flag name/shape from its merged code (or its
own `fgw/tsk-4uj` branch if still unmerged) before writing this item's
diff — never guess the flag name independently.

`fgos graph tsk-2bg --json`: isolated item, no deps, no children, own
connected component of size 1 — `criticalPath`/`topUnblock` carry no
ordering signal; one honest piece of work, no split (step 4 of this
skill's flow doesn't apply).

Impact-analysis posture: **degraded** (`fgos tool query --capability
impact-analysis --status present` → `gitnexus` present, re-confirmed
fresh this session — see CONTEXT.md's own Round 3 scout evidence — but
per CLAUDE.md's own three-way framing, `present` alone is not `full`;
it is `full` only when freshly checked, `degraded` when `present` but
flagged stale). GitNexus's index is independently confirmed STALE a
second time this item (after D4's own `isMainWorktree` finding): its
`impact()` query on `retargetMember` returned only 1 caller
(`promote-engine.test.mjs`), omitting the real production call site at
`bin/fgos.mjs:3624` — manual `grep`/`rg` cross-check substitutes and is
what confirmed both guard
layers' real call graph this pass. GitNexus `impact()` MUST still be
re-run before editing the `promote-to-component` handler and
`retargetMember` — CLAUDE.md's Always-Do rules — but its degraded output
should be treated as a starting point, not the full picture, until the
index is refreshed (`gitnexus analyze`).

### Changes

1. **`bin/fgos.mjs` — `promote-to-component` handler.** Add the same flag
   tsk-4uj lands on `sync-root`/`approve` (exact name is tsk-4uj's own
   call, reused here verbatim — see the dependency note above). When
   passed, `repoRoot = path.dirname(dir)` instead of `process.cwd()`
   (currently line 3541), before the existing `isMainWorktree(repoRoot)`
   guard (currently line 3542) — the guard itself stays unchanged code,
   it now just evaluates a different `repoRoot` value depending on the
   flag.

2. **`src/runner/promote-engine.mjs` — no change** (D6). `retargetMember`'s
   own `isMainWorktree` check at line 54 is left exactly as-is; it inherits
   the relaxation for free once change 1 above resolves `repoRoot`
   correctly at the call site (`bin/fgos.mjs:3624`).

3. **New regression tests in `test/cli/fgos.test.mjs`** (near the existing
   `promote-to-component` suite, ~line 6613+): today's complete absence of
   any worktree-guard test for this verb (either layer) is itself a gap
   this item must close, independent of the new flag — see risk map below.

4. **Docs** — if tsk-4uj already added a `docs/how-to/` page for the
   flag on `approve`/`sync-root` by the time this item is implemented,
   extend that same page with a `promote-to-component` section rather
   than writing a new one (same flag, same trust trade-off, same target
   audience — a person running the command by hand from inside a
   worktree session). If tsk-4uj's doc page does not exist yet, whoever
   implements this item decides placement the same way tsk-4uj's own
   plan left it — a documentation organization choice, not a product
   decision.

### Risk map

| Component | Risk | Proof point (carried to `fgos-validating`) |
|---|---|---|
| `promote-to-component`'s CLI-layer guard interaction with the new flag | **Medium** — same guard shape as `sync-root` (D5: lower stakes than `approve`, merges land on a runner-owned integration branch, never `main` directly), but touches N member branches in one call instead of one | `impact({target: "isMainWorktree", direction: "upstream"})` and a manual `grep -n "isMainWorktree(" bin/fgos.mjs src/runner/promote-engine.mjs` cross-check (re-run both at implementation time; GitNexus's index was confirmed stale this pass and last time, tsk-4uj D4). Full existing `promote-to-component` suite (~10 tests) green with UNCHANGED pass/fail set when the new flag is NOT passed (regression baseline) |
| `retargetMember`'s guard (D6: expected to require zero code change) | **Low-Medium** — the change is provably a no-op for this function (same `repoRoot` value, already correctly resolved upstream), but this is the item's own central technical claim and deserves direct proof, not just the D6 argument on paper | A new test exercising `retargetMember` directly (or through the CLI with the flag) confirming it still correctly REFUSES when `repoRoot` is NOT flag-relaxed (i.e., the guard still fires on a bad `repoRoot`), and correctly SUCCEEDS when the CLI layer already resolved a good one — proves the "guard receives correct input, unmodified" claim empirically, not just by code reading |
| New CLI-level and engine-level regression coverage (currently absent entirely, for either guard layer) | The whole point of this item's test scope — nothing today proves EITHER guard actually refuses correctly from a worktree, or that the new flag's happy path actually works | New tests in `test/cli/fgos.test.mjs`: (a) `promote-to-component` with NO flag, cwd inside a linked worktree — refuses (new baseline test, since none exists today); (b) `promote-to-component` WITH the flag, cwd inside the item's own worktree, `--dir` at the main checkout — succeeds; (c) WITH the flag but WITHOUT `--dir` — reduces to `process.cwd()`, still refuses (confirms the flag alone grants no bypass, mirroring tsk-4uj's own equivalent case) |
| Doc addition (if any) | Low — prose-only | A plain markdown read-through is enough proof |

### Concrete cases to prove

- `promote-to-component` with NO flag, from the main checkout —
  byte-identical to today (regression baseline, existing ~10 tests).
- `promote-to-component` with NO flag, from inside a linked worktree —
  refuses (new test; no existing coverage today, per the weak-proof
  finding above).
- `promote-to-component` WITH the new flag, cwd inside the item's own
  worktree, `--dir` at the main checkout — succeeds, git ops land
  correctly at the real main checkout, `retargetMember` runs unmodified
  and completes each member merge normally.
- `promote-to-component` WITH the flag but WITHOUT `--dir` —
  `path.dirname(dir)` reduces to the same value `process.cwd()` already
  gives, guard still correctly refuses.
- `sync-root`/`approve`/`catchup` — completely untouched by this item's
  diff; their own existing tests (plus tsk-4uj's new ones, once merged)
  pass unmodified.

## Assumptions

- Exact flag name is NOT this item's own call — reused verbatim from
  whatever tsk-4uj actually ships (see the hard dependency note in
  Approach above). This is a stronger constraint than tsk-4uj's own
  "implementation-detail" framing of its own flag name, precisely because
  tsk-2bg's whole point is consistency with that already-decided
  mechanism, not an independent design.
- Whether the doc lands as a `promote-to-component` section on tsk-4uj's
  own how-to page, or a new page, is left to whoever implements — a
  documentation organization choice (same class of assumption tsk-4uj's
  own plan pinned for its own doc placement).
- GitNexus's index was confirmed stale twice now in this same feature
  area (tsk-4uj D4, and again this item's Round 3) — `fgos-validating`/
  `fgos-code-implement` should re-check freshness rather than assume it
  has since been fixed; if still stale, the impact-analysis proof points
  above degrade per CLAUDE.md's own gate (manual grep cross-check
  substitutes, named plainly as weaker evidence).

## Proof surface

`npm test` (`node --test 'test/**/*.test.mjs'`, per `package.json`'s
`test` script) is the full-suite bar named in AGENTS.md's own DoD and
this plan's own recorded proof point through the planning/validating
gates.

Item's own `verify` (narrower, existence-confirmed set covering exactly
the risk-map rows above — what `fgos return`'s goal-check actually runs;
the full `npm test` stays the broader CI-level bar):

```
node --test test/cli/fgos.test.mjs test/runner/promote-engine.test.mjs
```

(the two files exercising `promote-to-component`'s full CLI-layer
behavior and `retargetMember`'s own engine-layer behavior respectively —
where this item's new guard/flag regression cases land.)

## Split

None — one honest piece of work, no children created.

## Outstanding questions

None
