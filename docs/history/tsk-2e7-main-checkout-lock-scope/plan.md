# Plan — main-checkout lock scope in dispatch execute() (tsk-2e7)

Mode: tiny

## Locked decisions this plan honors

No `CONTEXT.md` exists — discovery's own `clear` verdict (recorded on the
item) skipped `exploring`. Source of truth: this item's own
`RESEARCH.md` (`docs/history/tsk-2e7-main-checkout-lock-scope/RESEARCH.md`,
round 1), which already answers the item's own stated ambiguity with real
`file:line` citations — reasserted here, never reopened.

Lane derivation (`fgos-routing`'s Mode gate, applied directly — no lane was
handed off, this session entered `planning` straight from the driving
loop): 0 of the 10 hard-gate/standard flags apply — no auth, no
authorization, no data-model change, no audit/security surface, no
external system, no public contract, no cross-platform concern, no
existing *covered behavior change* (nothing in the cited test suite
changes — this plan only cites an already-green test as its proof, it does
not modify what that test asserts), no weak proof (the evidence is
already strong, see RESEARCH.md finding 3), no multi-domain span. → 0–1
flags → **tiny**: one direct task, two files (`plan.md` +
already-written `RESEARCH.md`), no code change.

## Approach

**Chosen path:** the item's own text asked to "audit call sites in
`execute()` to classify which touch main checkout / `.fgos/` state
(need the lock) vs which touch only an item's own worktree (could drop
the lock), then decide whether to widen the lock's scope." RESEARCH.md
round 1 already did that audit with real citations and reached a
concrete answer:

- The ONE call site inside `execute()` the item itself cites
  (`src/runner/dispatch/cli.mjs:488`) is **already** per-`cwd`
  (`dispatchLockFile(cwd)`, `main-checkout-lock.mjs:77-79`), not global —
  deliberately narrowed by `tsk-64hk` (delivered, merged;
  `docs/history/dispatch-execute-per-item-concurrency-guard/plan.md`).
  It does not serialize independent worktree-isolated items today; two
  different items' `executeExecutorCli` calls acquire two different lock
  files and run fully concurrently. `fanoutBatchExecutorCli`
  (`cli.mjs:737-826`) already relies on exactly this, passing each
  candidate's own worktree path as `cwd`, and the existing test
  `fanoutBatchExecutorCli fires candidates in batch concurrently with
  overlapping execution windows` (`test/runner/dispatch.test.mjs:4880`)
  is live, already-green proof.
- The two call sites that ARE genuinely global today
  (`claim-port.mjs:105,119` behind `fgos pick`/`fgos take`, and
  `merge.mjs:906` behind `fgos approve`'s commit onto `main`) are global
  because they mutate the one shared main-checkout git working tree
  and/or append to the one shared `.fgos/events.jsonl` — a genuinely
  single-writer resource. Narrowing either would risk exactly the
  "race/mất state" the item's own submit text already named as the
  danger of narrowing wrong (RESEARCH.md finding 6).

**Decision: no code change.** The premise that motivated this item
("dispatch execute()'s lock serializes ALL out-of-process dispatch,
even independent worktree-isolated items") does not hold against the
current code — it was already fixed by `tsk-64hk` before this item was
even filed (both landed the same day, 2026-08-24; this item's own
scouts evidently did not cross-check that prior fix). There is no
narrower-but-still-safe scope left to carve out of the two genuinely
global sites without reintroducing the exact race this item warned
against. The only honest deliverable is recording that answer where the
next person who wonders the same thing will find it, so the question is
not re-scouted from zero.

**Alternatives rejected:**

- Widening `dispatchLockFile`'s narrowing further, or inventing a new
  per-resource lock for `claim-port.mjs`/`merge.mjs:906` — rejected:
  both protect a real single-writer resource (the shared event log /
  the shared main-checkout working tree); per-resource locking there has
  no meaningful finer grain to cut along (there is only one main
  checkout, one `events.jsonl`), so "narrower" would mean "unsynchronized",
  not "more precise".
- Filing a documentation-only follow-up under `docs/specs/runner.md`
  instead of `docs/history/` — rejected for THIS item's scope: the
  runner spec documents current behavior/contracts, and "the lock is
  already correctly scoped, audited on `<date>`" is a point-in-time
  investigation record, not a durable spec fact about the system's
  contract — `docs/history/<feature>/` is exactly where this repo's own
  convention already puts that (see `tsk-6ci`'s own
  `docs/history/tsk-6ci-lock-wait-eta-visibility/`).

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| Correctness of the "no code change" call | light — the claim rests on reading the exact cited lines plus one already-green, already-existing test, not on new code | `node --test test/runner/dispatch.test.mjs` (RESEARCH.md finding 3's cited test is in this file) |
| Blast radius | none — no production file is touched, only `docs/history/tsk-2e7-main-checkout-lock-scope/**` | n/a — impact-analysis capability gate not invoked; `fgos tool query --capability impact-analysis --status present` shows `gitnexus` present, but no blast-radius proof point is needed when no source file changes |

Impact-analysis posture: not applicable (no code change proposed) —
checked the capability gate anyway per `CLAUDE.md`'s "before any change is
done" framing; `gitnexus` reports `present`, recorded here only because
the gate asks for the posture to be recorded, not because a proof point
leans on it.

**Files touched:** `docs/history/tsk-2e7-main-checkout-lock-scope/plan.md`
(this file), `docs/history/tsk-2e7-main-checkout-lock-scope/RESEARCH.md`
(already written, discovery stage). No `src/`, `test/`, or `bin/` file
changes.

**Order:** none — one file already exists (`RESEARCH.md`), this plan is
the second and last.

## Shape

This is the whole shape: RESEARCH.md's round 1 already contains the full
file:line-cited classification the item's own text asked for. Execute's
only remaining job is to point the item's `verify` at a command that
re-confirms the cited evidence still holds, then return — there is no
implementation surface beyond that.

Concrete case already proven (not re-proven at Execute, just re-run to
confirm it hasn't regressed since discovery): `fanoutBatchExecutorCli`
dispatching two different candidates with two different `cwd`s completes
with overlapping execution windows (`dispatch.test.mjs:4880`), and a
second dispatch for the SAME `cwd` while the first is still running is
correctly refused (`dispatch.test.mjs:3480`) — both already covered by
the one verify command below.

## Split decision

Pass-through — one honest piece. There is nothing here that splits into
independently workable pieces; the entire deliverable is one audit
finding, already written.

## Outstanding questions

None
