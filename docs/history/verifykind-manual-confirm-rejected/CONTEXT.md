# CONTEXT — `verifyKind` rejected; manual confirmation belongs in an attestation artifact, not in `runGoalCheck`

Item: `tsk-2rp` (kind `feature`, tier `heavy`, risk `high`), closed `wontfix`
from stage `clarify` without ever being planned or built. Refs:
`plans/reports/research-260730-0931-work-item-schema-multi-domain-upgrade-report.md`
(the 12-round survey that proposed it), `tsk-3w3` (the multi-domain milestone
that held it as a dependency), `tsk-38t` (Phase 2, delivered).

## What was proposed

A `verifyKind` enum on the work item, two values:

- `shell` — today's behavior, `runGoalCheck` spawns `item.verify`.
- `manual-confirm` — `runGoalCheck` spawns nothing; the check passes because
  "a person with role `human` called `approve`".

Motivation: `runGoalCheck` (`src/runner/goal-check.mjs`) always runs
`item.verify` as a real shell command and judges only by exit status. A
non-coding domain (the report's example: marketing) has no shell command that
answers "has the client signed off on the banner", so `return`/`approve` for
such a domain would be unusable.

## Why it was rejected

### 1. The stated blocker does not exist

`fgos list --all --json` over all 330 work items: **zero** carry a `domain`
field. `DOMAINS` (`src/state/workflow-stage-graphs.mjs`) holds four entries,
but three of them — `synthetic`, `triage`, `fixture-marketing` — declare
themselves in their own block comments as illustrative, disposable test
fixtures, all `worktreeBacked: false`. `fixture-marketing` was created by
`tsk-38t-7` as a regression fixture for the Phase 2 schema, not as a user.

Nothing is blocked today. The cost of not building this is zero.

### 2. The design grew every round instead of converging

| Round | Call sites | `return` gates | Acceptance clauses |
|---|---|---|---|
| Initial description | 4 | 1 (`verify`) | 7 |
| Round 10 | 8 | 3 (clean-tree, HEAD-advance, verify) | 11 |
| Round 12 re-audit | 9 | 3 | 13 |

Three discovery rounds ran; all three closed `clear: false`. Growth under
analysis with no bounding consumer is the signature of speculative design —
a fourth clarify round would not close it either. Only a real non-coding
item can bound the scope.

### 3. `catchup` has no answer under this design, and the report admits it

`case 'catchup'` (`bin/fgos.mjs:3155`, `:3214`) calls `runGoalCheck` twice
and moves the item with `role: 'runner'` — there is **no person anywhere in
that path** to have "called approve". Both readings of `manual-confirm`
fail there:

- Enforce it strictly → the item is stuck `blocked` permanently, because the
  condition can never be met on this path.
- Default it to always-pass → the runner merges with nothing checked, which
  is exactly what `manual-confirm` was supposed to prevent.

The same holds for `loop.mjs:362` (startupReap) and `loop.mjs:714`
(dispatchClaimedItem), and is actively dangerous at `merge.mjs:893`
(verify-before-commit): an always-pass there commits a merge into `main`
with nothing verified, defeating the `git merge --abort` that guards it.

An item cannot honestly leave `clarify` while one of its nine call sites is
self-declared unsolved.

### 4. It attacks three locked laws for a hypothetical payoff

- `docs/specs/runner.md:850` (RUL3) — the runner runs the item's own proof;
  the assistant's word is never evidence.
- `runner.md:860` (RUL13) — actual outcome values always come from the
  runner's own goal-check measurement, never from a self-report.
- `runner.md:866` (RUL19) — `return` moves `doing → awaiting-approval` only
  after measuring all three itself: clean tree, HEAD advanced past
  `headAtTake`, and a real verify green through **the same** `runGoalCheck`.

`manual-confirm` requires superseding all three. Per `AGENTS.md`
("Changing a locked law", definition-of-done question 4), that raises the
bar — and here it buys zero users.

### 5. It makes an existing escape hatch worse, not better

`verify` is already in `EDITABLE_FIELDS` (`src/state/store.mjs:228`), so any
session can already weaken a check by editing the command (`tsk-1ni` is a
real instance of that class). But an edited `verify` stays a readable string
in the record, and still produces spawn output a reviewer can inspect. A
`verifyKind` boolean removes both: the bypass becomes silent and produces no
output at all. Note `domain` is deliberately **not** in `EDITABLE_FIELDS`.

## The replacement design (recorded, not built)

Do not change `runGoalCheck`. Keep its invariant intact: *always spawn one
real command, judge only by exit status.*

Express manual confirmation as an **attestation artifact** that an ordinary
shell `verify` reads:

- a person records the confirmation through a write verb, which appends an
  attestation event;
- the item's `verify` is a normal command — e.g. `fgos attest-check <id>` —
  that exits 0 only when a genuine attestation exists.

What this buys, compared to `verifyKind`:

| Problem | `verifyKind` | Attestation artifact |
|---|---|---|
| `goal-check.mjs` + 9 call sites | all must change | **unchanged** |
| Circularity at `return` | unsolved (return precedes approve) | gone — the person attests *before* returning, exactly as they commit code before returning |
| `catchup` (no human present) | unsolved | correct by construction — the runner spawns a real command that reads an attestation recorded earlier |
| `merge.mjs:893` always-pass | merges into `main` unchecked | never happens — a real command still runs, abort still works |
| RUL3 / RUL13 / RUL19 | must be superseded | **still literally true** |
| Auditability | silent boolean, no output | readable command, real output |

Residual real work under this design is two items, not thirteen: `return`'s
clean-tree gate and HEAD-advance gate must skip for a domain with no git
deliverable. Both read `domain.worktreeBacked` — a field that already exists
in the registry and that `.claude/skills/fgos-coding-driving/SKILL.md`
already branches on. No new concept.

**Unproven, and the one thing to settle before adopting this design:** where
`fgos attest-check` reads `.fgos/` from when it runs inside an ephemeral
worktree (`catchup`, `merge`). `.fgos/events.jsonl` is committed to git, so
the copy inside a worktree can be stale — the check must resolve against the
main checkout, not the worktree's copy. Prove that before building.

## Locked decisions

| ID | Decision | Why |
|---|---|---|
| D1 | `verifyKind` is rejected as a mechanism. `runGoalCheck` keeps its single implementation and its "always spawn a real command, judge by exit status" contract unchanged. | Reasons 3, 4, 5 above: unsolvable at `catchup`, dangerous at `merge.mjs:893`, requires superseding RUL3/RUL13/RUL19, and converts an auditable bypass into a silent one. |
| D2 | If a non-coding domain ever needs manual confirmation, it is expressed as an attestation artifact read by an ordinary shell `verify` — not as a branch inside `runGoalCheck`. | Preserves every locked law verbatim, touches zero of the nine call sites, and dissolves the circularity at `return` and the impossibility at `catchup` rather than working around them. |
| D3 | `tsk-2rp` closes `wontfix` now rather than staying parked in `clarify`. The multi-domain milestone `tsk-3w3` drops it from `deps`. | The premise ("this blocks functionality") is false while no item carries a `domain`. Holding the milestone on a speculative dependency hides that Phase 2 (`tsk-38t`) already delivered what the milestone can honestly claim today. |
| D4 | The right next step for multi-domain is **not** a verify mechanism. It is to pick one real non-coding domain and drive one real item through end to end; what `verify` needs there is then observed, not guessed. | Every gap this item hit came from designing the mechanism before the consumer existed. Reversing that order is what kept it in `clarify` for six days across three inconclusive discovery rounds. |

## Pinned terms

- **attestation artifact** — a recorded, replayable statement that a named
  person confirmed something, written *before* the check runs and read by an
  ordinary shell command. Distinct from **manual-confirm**, the rejected
  design, in which the check itself had no command to run and inferred
  approval from who called which verb.
- **the nine call sites** — every caller of `runGoalCheck`:
  `bin/fgos.mjs:2058` (`return`, branch-source), `:2116` (`return`,
  main-source), `:2773` (`approve`), `:3155` (`catchup`, already-caught-up),
  `:3214` (`catchup`, clean-merge); `src/runner/loop.mjs:362`
  (startupReap), `:714` (dispatchClaimedItem); `src/runner/merge.mjs:832`
  (already-merged re-verify), `:893` (verify-before-commit).
- **the three `return` gates** — clean-tree, HEAD-advance past
  `headAtTake`/`branchHeadAtTake`, and verify. `verifyKind` only ever
  addressed the third. Each is duplicated across the main-source and
  branch-source paths, doubling any change's surface.

## Scout evidence

- `src/runner/goal-check.mjs:20-23` — `runGoalCheck(item, cwd, timeoutMs)`
  spawns `item.verify` with `shell: true`; it receives no role, actor, or
  domain, and has no other branch.
- `bin/fgos.mjs:3155`, `:3214` — the two `catchup` calls;
  `bin/fgos.mjs` `case 'catchup'` moves with `role: 'runner'`.
- `src/runner/merge.mjs:893` — verify-before-commit; a red result triggers
  `git merge --abort`, which an always-pass would bypass.
- `src/runner/loop.mjs:362`, `:714` — the two autonomous-runner calls.
- `docs/specs/runner.md:850` (RUL3), `:860` (RUL13), `:866` (RUL19) — the
  three locked laws `manual-confirm` would supersede.
- `src/state/store.mjs:228` — `EDITABLE_FIELDS` includes `verify`, excludes
  `domain`.
- `src/state/workflow-stage-graphs.mjs:51-336` — `DOMAINS`; the per-domain
  field precedent (`worktreeBacked`, `statusLabels`, `parkReason`,
  `skillMap`, `fieldSchema`) delivered by `tsk-38t`, and the
  self-declared-fixture comments on `synthetic` / `triage` /
  `fixture-marketing`.
- `.claude/skills/fgos-coding-driving/SKILL.md:124-143` — the existing
  `domain.worktreeBacked` branch, the precedent D2's residual work would
  follow.
- `fgos list --all --json` — 330 items, none with a `domain` field.
