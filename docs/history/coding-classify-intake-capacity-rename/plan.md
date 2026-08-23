# Plan: rename+move submit-assist-classify capacity into coding-domain ownership

Item: tsk-3fj (child of tsk-5wz).
Mode: small

## Lane

No `Mode:` line recorded yet, no Orient hand-off (this session invoked
`fgos-coding-planning` directly on a split child). Applying `fgos-routing`'s
Mode-gate directly: auth/authz no, data-model no (config value rename,
not a schema shape change), audit/security no, cross-platform no, weak
proof no, multi-domain — arguably yes in spirit (moves ownership from
"global" to "coding domain") but the item's OWN scope is a single JSON
key edit, not new registry code (that part is `tsk-5wz`'s own remaining
scope). One real flag (existing covered behavior — see below) → **small**:
a few files, no gray areas, no design question.

## Decisions this plan is built on

Inherited from the parent's locked plan
(`docs/history/intake-classify-after-clarify/plan.md`, `tsk-5wz`): this is
one of two ADR0020-mandated split children; scope is exactly the
`.fgos/config.json` capacity rename, landed as a direct main-checkout
commit, never through this item's own `fgw/tsk-3fj` branch.

New finding from this session's own read (not in the parent plan or the
item's own description — found while shaping this child):
`test/runner/dispatch.test.mjs:643-653` is an EXISTING, PASSING test that
reads the real committed `.fgos/config.json` via `committedRunnerConfig()`
and asserts `cfg.capacities['submit-assist-classify']` exists with a
specific shape. Renaming the key without updating this test breaks a real,
currently-green test — this was NOT in the item's original footprint
(`.fgos/config.json` only). Every other `submit-assist-classify` hit in
that same file (lines 1168-2020) is a self-contained inline fixture object
inside its own test, not a read of the live file — those are unaffected by
this rename and are correctly out of scope.

Concrete new capacity name chosen (an implementation-shape decision, not a
product one — not material enough to ask): `coding-classify-intake`,
following the existing `judge-discovery`/`judge-decompose` naming
convention (domain-flavored action, kebab-case) already used by this same
config file's other capacity keys.

## Approach

1. In `.fgos/config.json`, rename the `runner.capacities.submit-assist-classify`
   key to `runner.capacities.coding-classify-intake` — same object shape,
   same values, key name only.
2. Update `test/runner/dispatch.test.mjs:643-653`'s test to read
   `cfg.capacities['coding-classify-intake']` instead — same assertions,
   new key name, and reword the test's own title to match.
3. Apply the `.fgos/config.json` edit as a direct, single-parent commit on
   the main checkout (never through `fgw/tsk-3fj`), per ADR0020 and the
   `tsk-5ge`/`tsk-5vf`/`tsk-n4i-1` precedent already read in the parent's
   own plan — `docs/how-to/fix-fgos-write-rejected-merge-block.md`.
4. This item does NOT update `.claude/skills/fgos-submit-assist/SKILL.md`'s
   own reference to the old key name — that consumer-side update is
   `tsk-4ns`'s job (sibling item, gated on `tsk-2ie5`). Until `tsk-4ns`
   lands, `fgos-submit-assist`'s Step A config check will read the OLD key
   name, find it `not-configured` (the key no longer exists under that
   name), and gracefully fall through to its own inline-reasoning path
   (`capacity-dispatch-fallback.md`'s own documented not-configured
   behavior — "byte-identical to before this capacity existed"). This is a
   real, temporary behavior change (submit-assist-classify's cli dispatch
   goes dark until tsk-4ns lands) but a SAFE one — never a crash, never a
   silently wrong classification, just a temporary loss of the optional
   dispatch-to-agy fast path.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| `.fgos/config.json` rename | medium (ADR0020: main-checkout-only, never via `fgw/<id>`) | direct commit on main, `git show --stat` confirms no `.fgos/` path in this branch's own history |
| `test/runner/dispatch.test.mjs` test update | medium (real, currently-passing test) | `npm test -- test/runner/dispatch.test.mjs` green after the rename, both in the test file (branch-visible) and against the live renamed config (main checkout, post-merge) |
| Temporary dispatch gap until `tsk-4ns` lands | low (documented, graceful fallback, not a regression per `capacity-dispatch-fallback.md`'s own Step A behavior) | cited above, no new proof needed |

Impact-analysis posture: not applicable — no code symbol is being renamed
or moved, only a JSON config key and one test's string literal.

## Validating findings (fgos-coding-validating pass, real evidence)

Read `test/runner/dispatch.test.mjs:618-626`'s `committedRunnerConfig()`
helper in full: it resolves the MAIN CHECKOUT root explicitly
(`resolveMainCheckoutRoot`), by design, specifically so this exact test
still reads the real committed `.fgos/config.json` even when the test
suite itself runs from inside a worktree (own comment: "only the main
checkout carries the real committed `.fgos/config.json`"). This is real,
already-existing infrastructure for exactly this situation — confirmed by
reading the function, not assumed.

This surfaces a real EXECUTION-ORDERING constraint the plan above did not
name explicitly: because the `.fgos/config.json` rename can only ever be
applied as a direct main-checkout commit (ADR0020 — it can never ride
`fgw/tsk-3fj`, and this worktree cannot even see the `.fgos/` path to edit
it locally), the rename must land on the MAIN checkout BEFORE this item's
final `fgos return` fires. `fgos return`'s re-verify runs
`committedRunnerConfig()` against whatever the main checkout holds AT THAT
MOMENT — if the manual rename has not landed yet, the test (updated to
expect the NEW key name) fails not because the branch's own code is wrong,
but because the precondition wasn't met first. `fgos-coding-implement`
executing this item must apply the main-checkout edit BEFORE running the
item's own verify/return cycle, not after.

## Outstanding questions

None
