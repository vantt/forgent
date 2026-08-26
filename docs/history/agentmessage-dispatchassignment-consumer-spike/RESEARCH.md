# RESEARCH.md — tsk-3rn (Spike: concrete consumer for AgentMessage/DispatchAssignment)

## Round 1 — 2026-08-26 (discovery stage, fgos-coding-discovering via fgos-researching)

Redone under id `tsk-3rn` after the original `tsk-67t2` attempt's events were
lost to a live `.fgos/events.jsonl` truncation mid-session (tracked
separately as `tsk-46v`) and its id was left permanently colliding with an
orphaned runtime claim (`generateId` hashes the title; resubmitting
identical text reproduced the same `tsk-67t2` id, which `fgos pick` then
refused — claimed by a stale claim record the durable event loss never
cleared). This item's title was reworded to get a fresh, non-colliding id;
the underlying research below is unchanged from the original round, since
it depends only on `tsk-5x7` and the current repo state, neither of which
changed between attempts.

**Asked:** two questions needed to judge whether this item's own scope is
clear enough to skip `exploring` and move straight to `planning`:
(1) does this repo have a precedented convention for a *real* (non-
placeholder) `verify` field on a docs-only/research-only work item with no
code/tests, and (2) is `docs/history/dispatch-plan-protocol-redesign/
plan.md`'s "Deferred | Pull-in condition" table still the current,
undelivered state, or has any child of `tsk-5x7` already shipped one of
those four deferred pieces since delivery.

**Checked / found:**

1. **`verify` convention.** `src/intake/discovery.mjs:101-103`
   (`hasRealVerify`) is the only mechanical gate on a `verify` string: it is
   "real" iff non-empty and does not start with the placeholder prefix
   `"chưa xác định —"`. There is no shape requirement — no `node --test`/
   grep/shell-runnable form is mandated. `src/intake/verify-pattern-check.mjs`
   (`judgeVerifySemanticCorrectness`) only fires a specific check when the
   proposed text itself references `node --test`/`--test-name-pattern`
   (guards against a known vacuous-pass shape,
   `docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md`) —
   irrelevant here since this item's own scope has no test suite. A
   grep across `bin/fgos.mjs` found no site that `exec`s/spawns the
   `verify` string at `return` time — it is read and reported, not
   shelled out to, so a prose description of what evidence counts as
   passing (file/line citations in a written report) is a precedented,
   real verify, not a special case needing invention.

   Item tsk-3rn's *current* stored `work.verify` is
   `"chưa xác định — P15 bổ sung"` — matches the placeholder prefix exactly,
   so `hasRealVerify()` is `false` today even though the item's own
   `description` already states the intended verify in prose. This
   `discover --verdict clear` call supplies that prose as the real
   `--verify` value.

2. **Is the deferred table still current?** `grep -rln "AgentMessage|
   DispatchAssignment" src/` and `grep -rln "class Mailbox|ArtifactRef|
   artifact.store" src/` both return **zero files** — no implementation
   exists anywhere in `src/`. `git log --oneline --all -i --grep=
   "AgentMessage|DispatchAssignment|mailbox"` returns exactly one commit
   (`ebdf69d5`, a docs-only update to
   `docs/architect/dispatch-control-plane-redesign.md`) — no code commit.
   The three real children `tsk-5x7` split into (D6,
   `docs/history/dispatch-plan-protocol-redesign/plan.md`) are confirmed
   by `docs/history/tsk-5x7-{1,2,3}/plan.md`:
   - `tsk-5x7-1` — piece 0, `decide --for` fix + minimal `DispatchPlan`
   - `tsk-5x7-2` — piece 1, declared-egress governance
   - `tsk-5x7-3` — piece 2, `herdr-spawn` adapter (protocol untouched)

   None of the three touch `AgentMessage`, `ArtifactRef`, or mailbox/Herdr
   transport — `tsk-5x7-3`'s own plan.md is explicit that the adapter keeps
   "today's prompt/stdout contract" and introduces "no new result protocol
   and no telemetry claim". The Deferred | Pull-in-condition table (4 rows:
   `StructuredDispatchResult`+confidence reader, artifact store, AgentMessage
   envelope, mailbox/Herdr transport) is confirmed **still the current,
   undelivered state** as of this session — nothing has pulled any row in.

**Still open (belongs to tsk-3rn's own `executing` stage, not this
discovery pass):** whether a real consumer exists TODAY among the four
candidates the item's own description names (Herdr async handoff, dashboard
replay, compliance report, external provider) — this round only established
that no implementation has shipped; it did not yet survey each candidate's
own current need. That is the spike's actual deliverable, done at
`executing`.

**Verdict: clear.** Both discovery-stage ambiguities (verify shape, table
currency) are resolved by direct evidence above; no open question needs a
person before `planning`.
