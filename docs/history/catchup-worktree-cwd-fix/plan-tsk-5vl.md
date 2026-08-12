# catchup worktree cwd fix — plan

CONTEXT.md: `docs/history/catchup-worktree-cwd-fix/CONTEXT.md` (D1 locked
and approved, gate-bypass level `standard`).

## Mode gate

Flags counted (per `fgos-routing`'s Mode-gate table — no lane was handed
off before this skill loaded, so derived directly here per this skill's
own direct-entry fallback):

- **existing covered behavior** — `catchup`, `approve`, and `sync-root`
  are all exercised by an extensive existing suite in
  `test/cli/fgos.test.mjs` (catchup: root/leaf catch-up-by-merge cases
  from line ~7096; approve: ~30 cases from line ~5572 covering merge,
  conflict, footprint, legacy, and timeout paths). **1 flag.**
- **weak proof around the area** — every one of those existing tests
  spawns the CLI via the suite's `run(cwd, [...])` helper with the
  process `cwd` always equal to the test's own `repoRoot` fixture; none
  simulates the doomed case (`cwd` inside a linked worktree different
  from the main checkout) — exactly the gap that let this bug ship and
  stay latent, same shape tsk-k8u's own plan.md already documented for
  `pick`/`take`. **1 flag.**

No auth/authorization/data-model/audit-security/external-system/public-
contract/cross-platform/multi-domain flags — the CLI's own args/behavior
contract is unchanged from a caller's perspective; only the internal
`repoRoot` derivation for git ops changes. Not a hard-gate item.

2 flags, no hard gate → **standard** (matches the item's own recorded
`tier: standard`).

## Approach

Locked scope (CONTEXT.md D1): `bin/fgos.mjs`'s `catchup`, `sync-root`, and
`approve` handlers — all three replace `const repoRoot = process.cwd();`
with the already-proven `const repoRoot = path.dirname(dir);` pattern
`take`/`pick` already use (`tsk-k8u D1/D2`). Plus the `fgos-coding-implement/
SKILL.md` Return-step hard-rule fix (CONTEXT.md's pinned assumption).

`fgos graph tsk-5vl --json`: isolated item, no deps, no children —
`criticalPath`/`topUnblock` carry no ordering signal; this is one honest
piece of work, no split (step 4 of this skill's flow doesn't apply).

Impact-analysis posture: **full** (`fgos tool query --capability
impact-analysis --status present` → `gitnexus` present, confirmed during
`fgos-coding-exploring`). GitNexus `impact()` MUST run before editing the
`catchup`/`sync-root`/`approve` handlers (CLAUDE.md's Always-Do rules) —
this is the blast-radius proof point for the risk-map rows below, carried
to `fgos-coding-validating`.

### Changes

1. **`bin/fgos.mjs` — `catchup` handler (currently line ~3576).** Replace
   `const repoRoot = process.cwd();` with `const repoRoot =
   path.dirname(dir);` — byte-identical to today whenever `--dir` is
   omitted (`dataDir()` already resolves `dir` from `process.cwd()` in
   that case), only changes behavior when `--dir` is passed explicitly
   (exactly the worktree-chaining scenario `fgos-coding-driving`'s own
   claim hard rule and `/fgOS:pick` both already trigger by always
   passing `--dir`).

2. **`bin/fgos.mjs` — `sync-root` handler (currently line ~3273).** Same
   substitution, same reasoning.

3. **`bin/fgos.mjs` — `approve` handler (currently line ~2739).** Same
   substitution, same reasoning.

4. **`.claude/skills/fgos-coding-implement/SKILL.md` — Return step
   (currently lines 174-189).** Add a `blocked`-specific branch to the
   existing hard rule: when `return` reports `blocked`, the general
   "diagnose, fix, and return again" guidance only applies while the item
   is still reachable via `return` (i.e. the verify failure happened
   while `status` was `doing`, before `return`'s own move). For an item
   that is ALREADY `blocked` (e.g. `approve`'s post-merge verify-fail
   rollback, `reason: verify-fail-post-merge`), `return` structurally
   refuses (`status: doing` precondition) — name `fgos catchup <id>` as
   the correct recovery verb for that case, citing RUL33/RUL34
   (`docs/specs/work-state.md`: the `blocked -> awaiting-approval`
   catch-up edge never passes through `doing`).

### Risk map

| Component | Risk | Proof point (carried to `fgos-coding-validating`) |
|---|---|---|
| `catchup`/`sync-root`/`approve` `repoRoot` derivation | Low-medium — mechanical substitution (same pattern already proven correct for `pick`/`take`), but on three verbs that mutate shared branch state (`git branch -f`) for both the pull-door and the merge/approve-gate path | `impact({target: "withMergeEphemeralWorktree", direction: "upstream"})` before editing (this is the shared function all three handlers funnel into); full existing `test/cli/fgos.test.mjs` catchup/approve/sync-root suites green after the change, unmodified pass/fail set except the new cases added below |
| CLI-level regression coverage for the worktree-cwd case (currently absent) | The bug's own root cause — nothing today catches a CLI handler passing the wrong `repoRoot` for these three verbs | New test(s) in `test/cli/fgos.test.mjs`: run `catchup`/`approve`/`sync-root` with `--dir <mainCheckoutFgosDir>` while the spawned process's `cwd` is set to a linked worktree checked out on the item's own `fgw/<id>` branch — assert no "Cannot force update the current branch" error and the branch/state land correctly against `--dir`'s root, not `cwd` |
| `fgos-coding-implement/SKILL.md` doc change | Low — prose-only, no code path affected | `docs/how-to/write-verify-for-a-skill-prose-change.md`'s own `npm test && POSITIVE && NEGATIVE` shape (this touches a `.claude/skills/**/SKILL.md` path) |

### Concrete cases to prove

- Normal `catchup`/`approve`/`sync-root` from the main checkout, no
  worktree involved — byte-identical behavior to today (regression
  baseline, existing suite already covers this).
- `catchup`/`approve`/`sync-root` invoked with `--dir` pointed at the main
  checkout while the process `cwd` is a linked worktree checked out on
  the item's own `fgw/<id>` branch — no "Cannot force update the current
  branch", the branch/state update lands correctly.
- The original tsk-5vl repro shape: an item lands `blocked` with reason
  `verify-fail-post-merge` while the session is still inside its own
  `pick`'d worktree; `fgos catchup <id>` (still inside that worktree, no
  `ExitWorktree` needed) recovers it to `awaiting-approval`.
- `fgos-coding-implement/SKILL.md`'s Return-step text: a reader following
  it on a `blocked` item now finds `fgos catchup` named, not just the
  "return again" guidance that cannot apply there.

## Assumptions

- Exact wording/placement of the `fgos-coding-implement/SKILL.md` fix
  (inline addition to the existing hard rule vs. a new sub-bullet) is an
  implementation/writing detail, not a product decision — left to
  whoever implements (per CONTEXT.md's own pinned assumption);
  `fgos-coding-validating`'s reality gate checks this assumption is proven, not
  asked about here.
- Exact shape of the new CLI-level regression test(s) (how to construct a
  worktree-checked-out-elsewhere `cwd` deterministically in the test
  fixture) is likewise an implementation detail, same class tsk-k8u's own
  plan.md already deferred for its sibling fix.

## Proof surface

`npm test` (`node --test 'test/**/*.test.mjs'`, per `package.json`'s
`test` script) is the full-suite bar named in AGENTS.md's own DoD and this
plan's own recorded proof point through the planning/validating gates.

Item's own `verify` (narrower, existence-confirmed set covering exactly
the risk-map rows above — what `fgos return`'s goal-check actually runs;
the full `npm test` stays the broader CI-level bar):

```
node --test test/cli/fgos.test.mjs
```

(`test/cli/fgos.test.mjs` is the one file already exercising `catchup`/
`approve`/`sync-root`'s CLI-layer behavior end to end, and is where the
new worktree-cwd regression case(s) from the risk map land — no separate
file needed for a change this narrow.)

## Split

None — one honest piece of work, no children created.

## Outstanding questions

None
