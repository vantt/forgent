# promote-to-component trust-dir opt-in flag — plan (tsk-2bg)

CONTEXT.md: `docs/history/catchup-worktree-cwd-fix/CONTEXT.md` (D5/D6
locked and approved, gate-bypass level `standard`). This plan covers ONLY
tsk-2bg's own scope; `catchup` (tsk-5vl, `plan-tsk-5vl.md`) and
`sync-root`/`approve` (tsk-4uj, `plan-tsk-4uj.md`) are delivered
separately, same feature dir, different D-IDs — this shared dir's bare
`plan.md` always belongs to whichever item is currently being planned
here; an outgoing item's own final plan is preserved at `plan-<id>.md`
before the next one takes the slot (the same pattern tsk-4uj's own
`plan-tsk-5vl.md` already established).

**Revision note (`fgos-coding-validating`, 260811):** tsk-4uj merged to `main`
while this plan was being validated (`64f86633`, `status: delivered`).
This revision replaces every "reuse whatever tsk-4uj ships" hedge below
with the real, shipped mechanism, and corrects every `bin/fgos.mjs` line
citation to match `main`'s current HEAD (tsk-4uj's own diff shifted
everything after `approve`/`sync-root` down by ~24-30 lines). See
CONTEXT.md's own superseded-assumption note for the full citation.

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
- **weak proof around the area** — **corrected during `fgos-coding-implement`
  (RESEARCH.md's own correction note)**: `retargetMember`'s guard already
  had a test (`test/runner/promote-engine.test.mjs`,
  `56b34d9a`, original implementation — Round 3's keyword search missed it).
  The real gap was narrower: `bin/fgos.mjs`'s CLI-level guard for
  `promote-to-component` had NO worktree-refusal test at all before this
  item — now closed by three new tests in `test/cli/fgos.test.mjs`.
  **1 flag** (still applies — the CLI layer's gap was real).
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

Locked scope (CONTEXT.md D5/D6): add the **same, real, already-shipped**
`--trust-dir` flag `promote-to-component` (`bin/fgos.mjs`,
`case 'promote-to-component'`, currently line 3559 on `main`, `repoRoot`
declared at line 3565) that tsk-4uj already added to `sync-root`/
`approve` (`64f86633`, confirmed by reading the merged diff directly):

```js
const repoRoot = flags['trust-dir'] === true ? path.dirname(dir) : process.cwd();
```

placed ahead of the existing `isMainWorktree(repoRoot)` guard (currently
line 3566) — guard itself UNCHANGED code, evaluating a different
`repoRoot` value depending on the flag. When the flag is OMITTED
(default), behavior is byte-identical to today.

**D6's own scope boundary: zero change to `src/runner/promote-engine.mjs`.**
`retargetMember` (`promote-engine.mjs:53-58`) is called at
`bin/fgos.mjs:3648` (current `main` HEAD) with the exact same `repoRoot`
variable the CLI handler resolves once at line 3565 — never re-derived
downstream. Once the CLI layer resolves `repoRoot` correctly (flag-gated),
`retargetMember`'s own `isMainWorktree(repoRoot)` check passes through
transparently on an already-correct input; the guard is neither removed
nor weakened, it simply receives correct input, same as today when
invoked from the real main checkout.

**tsk-4uj dependency resolved** (CONTEXT.md's own superseded assumption
note): tsk-4uj is `status: delivered`, merged to `main` as `64f86633`.
Whoever implements this item must **rebase/sync `fgw/tsk-2bg` onto
current `main` before editing `bin/fgos.mjs`** — this plan's own branch
was forked before tsk-4uj merged, so its local copy of `bin/fgos.mjs`
still has `promote-to-component` at the OLD pre-tsk-4uj line numbers
(3535/3541/3542/3624 — cited in this plan's own earlier revision and in
`CONTEXT.md`'s scout evidence); the real, current line numbers above are
read from `main`'s HEAD, not from this branch's own stale snapshot. Do
not trust either plan's line citations without re-`grep`ping fresh at
implementation time regardless — both are a moving target.

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
(`promote-engine.test.mjs`), omitting the real production call site
(then `bin/fgos.mjs:3624`, now `:3648` on current `main` HEAD post-tsk-4uj
— see the revision note above) — manual `grep`/`rg` cross-check
substitutes and is what confirmed both guard layers' real call graph
this pass. GitNexus `impact()` MUST still be
re-run before editing the `promote-to-component` handler and
`retargetMember` — CLAUDE.md's Always-Do rules — but its degraded output
should be treated as a starting point, not the full picture, until the
index is refreshed (`gitnexus analyze`).

### Changes

1. **`bin/fgos.mjs` — `promote-to-component` handler.** Add
   `const repoRoot = flags['trust-dir'] === true ? path.dirname(dir) : process.cwd();`
   in place of the current `const repoRoot = process.cwd();` (real `main`
   line 3565 as of this pass — re-`grep` fresh at implementation time,
   see the dependency note above), immediately before the existing
   `isMainWorktree(repoRoot)` guard (line 3566) — the guard itself stays
   unchanged code, it now just evaluates a different `repoRoot` value
   depending on the flag. Byte-identical shape to tsk-4uj's own
   `approve`/`sync-root` change (`64f86633`).

2. **`src/runner/promote-engine.mjs` — no change** (D6). `retargetMember`'s
   own `isMainWorktree` check at line 54 is left exactly as-is; it inherits
   the relaxation for free once change 1 above resolves `repoRoot`
   correctly at the call site (`bin/fgos.mjs:3648`, current `main` HEAD).

3. **New regression tests in `test/cli/fgos.test.mjs`** (near the existing
   `promote-to-component` suite, ~line 6613+): today's complete absence of
   any worktree-guard test for this verb (either layer) is itself a gap
   this item must close, independent of the new flag — see risk map below.
   Directly adapt tsk-4uj's own four new tests (`64f86633`,
   `test('sync-root --trust-dir with --dir succeeds from inside a linked
   worktree (tsk-4uj)', ...)` and its no-op counterpart, plus the
   `approve`/`approve --github` equivalents) to `promote-to-component`'s
   own call shape (`--ids <a,b>` instead of a single id) rather than
   writing the pattern from scratch.

4. **Docs** — extend tsk-4uj's own real how-to page,
   `docs/how-to/recover-approve-sync-root-from-inside-a-worktree-with-
   trust-dir.md`, with a `promote-to-component` section (same flag, same
   trust trade-off, same target audience — a person running the command
   by hand from inside a worktree session) rather than writing a new
   page. The page's own title implies `approve`/`sync-root` only —
   whoever implements should judge whether the title needs updating too
   (e.g. dropping the specific verb names) or whether a scoped addition
   under the existing title reads fine; a documentation wording choice,
   not a product decision.

### Risk map

| Component | Risk | Proof point (carried to `fgos-coding-validating`) |
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

- Flag name and `repoRoot`-resolution shape are no longer assumptions —
  confirmed directly from tsk-4uj's real merged diff (`64f86633`), cited
  verbatim in Approach/Changes above.
- Exact wording/placement of the `promote-to-component` addition to
  tsk-4uj's real how-to page is left to whoever implements — a
  documentation wording choice, not a product decision.
- `fgw/tsk-2bg` will need a rebase/sync onto `main` before implementation
  to pick up tsk-4uj's real code — every `bin/fgos.mjs` line number in
  this plan is a snapshot of `main`'s HEAD as of this validating pass,
  not a promise it will still be exact by the time this item reaches
  `executing` (repo state kept moving during this item's own planning
  pass — `main` gained several other merges in the same window). Re-`grep`
  fresh, do not trust either this plan's or `CONTEXT.md`'s cited line
  numbers blindly.
- GitNexus's index was confirmed stale twice now in this same feature
  area (tsk-4uj D4, and again this item's Round 3) — `fgos-coding-validating`/
  `fgos-coding-implement` should re-check freshness rather than assume it
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
