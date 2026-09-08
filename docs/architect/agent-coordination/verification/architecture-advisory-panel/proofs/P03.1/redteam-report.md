# P03.1 Red Team — `human-turn-recorded` Trusted-Input Door

**Date:** 2026-09-06
**Branch:** `group-thinking-plan-loop`
**Commits under attack:** `a0536301` (kernel door), `b7805868` (request step), `da1aaea8` (tests), `d61808c9` (contract section)
**Method:** live attacks against the real machinery — real `openSession`/`recordHumanTurn`/`replaySession`, the real `runCoordinationUseCase` request door with the existing project-tier protocol fixture and Node-subprocess fake executor, hand-crafted `events.jsonl` files, and two spin-synchronized 2-process concurrency races. No JS-level stubs over the engine. Machine-readable per-attack detail: `redteam-findings.json` alongside this file.

**Result: 30 attacks. 25 blocked as expected. 2 bypassed (one defect, reached two ways). 3 unexpected behaviors (all LOW, none a privilege issue).**

Baseline: `node --test test/runner/coordination-human-turn.test.mjs test/runner/coordination-replay.test.mjs test/verbs/coordination-run-driver-steps.test.mjs` → 99 pass / 0 fail. Everything below is uncaught by that suite.

---

## Finding 1 (MEDIUM) — replay does not re-check the driver-authored-ref-shape attribution

**The claim.** The contract's Human Turn Provenance section opens its refusal list with "**Refusals (write door and replay, independently)**" and includes among them "`attributedTo.id` is shaped like a driver-authored ref (`asgn_` Assignment prefix, or the reserved `contribution:`/`human-turn:` namespaces)". T1's Mechanism column repeats it: "`recordHumanTurn`'s `attributedTo` refusals (store.mjs), **re-checked independently at replay**".

**The reality.** The write door has four `attributedTo` refusals (`src/runner/coordination/store.mjs:1432-1450`). Replay implements three of them (`src/runner/coordination/replay.mjs:249-290`): `recordedBy` identity, self-attribution, panel-actor attribution. The fourth — the `/^asgn_/ | CONTRIBUTION_REF_PREFIX | HUMAN_TURN_REF_PREFIX` shape check at `store.mjs:1445` — has **no replay-side counterpart**.

**Proof.** Write door refuses all three shapes:

```
[A1d write attributedTo.id="asgn_abc"] REFUSED -> CoordinationError/validation:
  recordHumanTurn: attributedTo.id "asgn_abc" is shaped like a driver-authored ref ...
[A1d2 "contribution:x"] REFUSED  [A1d3 "human-turn:x"] REFUSED
```

Replay accepts all three:

```
[A1d_replay_asgn]         REPLAY ACCEPTED -> humanTurns=[{"type":"person","id":"asgn_abc"}]
[A1d2_replay_contribution] REPLAY ACCEPTED -> humanTurns=[{"type":"person","id":"contribution:x"}]
[A1d3_replay_humanturn]    REPLAY ACCEPTED -> humanTurns=[{"type":"person","id":"human-turn:x"}]
```

And it survives all the way to the read surface — `showCoordinationUseCase` renders the forged record inside its `humanTurns` section as a legitimate person-attributed turn:

```
[A7j2-show renders it?] ACCEPTED -> [{"turnId":"turn_1","turnOrdinal":1,...,
  "attributedTo":{"type":"person","id":"asgn_driverartifact"},
  "recordedBy":{"type":"driver","id":"coordinator-1"},...}]
```

**Two ways in, not one.** The obvious path is a hand-edited `events.jsonl` (the T8 scenario, already disclosed as "narrowed, not fully closed"). The less obvious path needs no filesystem tampering at all: `src/runner/coordination/store.mjs:2174` re-exports the generic `appendEvent` primitive — commented "re-exported only for tests", but nothing enforces that — and an in-process `appendEvent(eventsPath, {type: 'human-turn-recorded', payload}, sessionDir)` writes the same forged event with no coordination-schema validation whatsoever. Replay is the only thing that would catch it, and for this shape it doesn't.

**Why it matters, honestly scoped.** This does not widen the write-door guarantee — every path that goes through `recordHumanTurn` is refused correctly, and T8 already concedes that a forger holding the driver identity is narrowed rather than closed. What it is: a **real doc-vs-reality mismatch on a refusal the contract explicitly promises at both layers**, in the exact position (a driver-authored ref occupying the human-decision slot) the door was built to make impossible. Note that T8's own mechanism list is honest — it enumerates "driver identity, self-attribution, panel-actor attribution, ordinal contiguity, and duplicate turnId/externalRef" and does **not** include the ref-shape check. So the contract contradicts itself: the Refusals paragraph and T1 claim four, T8 lists three, the code implements three.

**Recommended fix (Coordinator's call).** Either (a) add the shape check to `replay.mjs`'s human-turn branch, mirroring `store.mjs:1445`, plus a `coordination-replay.test.mjs` case for it — three lines and one test, which makes the doc true as written; or (b) correct the contract's Refusals paragraph and T1 Mechanism column to match T8's honest three-item list, and say why the shape check is write-door-only. (a) is the smaller lie-to-truth distance and costs almost nothing.

## Finding 2 (LOW) — `respondsToRefs` ownership is write-door-only, unlike its disposition analogue

`recordHumanTurn` validates every `respondsToRefs[]` entry through `assertDispositionRefOwnedBySession` (both the dangling-ref and the bare-id near-miss fire correctly — attacks A2g/A2h). Replay's human-turn branch copies `respondsToRefs` straight into the reconstructed record with no ownership or ordering check:

```
[A2k replay: turn.respondsToRefs dangling] ACCEPTED -> ["human-turn:never_recorded"]
```

The contract does not claim replay checks this, so it is not a false claim — but it is an asymmetry worth naming, because the *disposition*'s own `human-turn:` refs **are** re-checked at replay (`out-of-order-ref`, `replay.mjs:482-489`, confirmed by attack A2j). Same reserved namespace, same ledger, two different read-time postures. Low severity: reachable only via the same forged-log path as Finding 1.

## Finding 3 (LOW) — `artifactRef` accepts traversal, absolute paths, and symlinks

`src/verbs/coordination/schema.mjs:525-532` deliberately does not charset-restrict `artifactRef` ("operator-authored trusted data"), while `turnId` and `respondsToRefs[]` in the same step **do** get a `path escape rejected` refusal. Consequences, all confirmed live through the real request door:

```
[A7g1 artifactRef = "../../../../etc/hostname"] ACCEPTED -> appended:true, revision:sha256:4ec33d74...
[A7g2 artifactRef = "/etc/hostname"]            ACCEPTED -> revisionMatchesEtcHostname: true
[A7g3 artifactRef is a symlink, target swapped after recording] ACCEPTED, recorded revision unchanged, nothing re-checks it
```

Read-only, same-privilege, no escalation. The provenance cost is real though: the contract says `artifactRef` + `revision` "pin the real bytes the transcription rests on", and that claim is satisfiable by a file outside the repo entirely — which a later reader holding only the repo can never resolve or re-verify. Whether to restrict this is a product call (the operator may legitimately cite an out-of-tree transcript); if it stays open, the contract should say so, since the neighbouring fields in the same step are restricted.

## Finding 4 (LOW) — self-attribution refusal is exact-string

```
[A7i attributedTo.id = WRITER_ID upper-cased] ACCEPTED -> {"type":"person","id":"MASTER-COORDINATOR-1"}
```
against `writerId: master-coordinator-1`. Adds no capability (T6 already lets a driver pick any handle it likes), but a case-variant of the driver's own identity in the human-decision slot is visually confusable for a human reading the ledger. Informational.

---

## What held (the defenses are real, not theorized)

**T1 at the write door — fully closed.** Self-attribution, panel-actor attribution, `type: "driver"`, and all three driver-authored-ref shapes are each refused with a distinct, specific message. The `type` check is a genuine closed enum at the pure-schema layer, so it also fires on a forged log.

**T2 immutability — closed.** Same `turnId` with a different `artifactRef` or `revision` is a hard `duplicate-ref`; the event count stayed at 1 through four calls. A byte-identical repeat is a true no-op (`appended: false`, no second event), and `canonicalizeHumanTurnPayload` holds even when the caller supplies the object keys in reverse order.

**T3 externalRef uniqueness / T4 ordinal contiguity — closed at both layers.** Gap (5 after 3), reuse (3 again), ordinal 0, and externalRef reuse under a new turnId are each refused with their own message; replay re-derives the same rules independently against a hand-written log.

**T5 human-turn ref ownership — closed.** Bare turn id → named near-miss telling the caller to write the prefix. `human-turn:ghost` → `dangling-ref`. Both apply to `targetRef` *and* `evidenceRefs[]`. A disposition citing a turn recorded later in the log → `out-of-order-ref` at replay.

**T6 — open exactly as disclosed.** A fabricated `externalRef` naming a nonexistent transcript uuid, backing a `human/1-person.md` the coordinator wrote itself, is accepted through the real request door. That matches the design's own claim; had it been rejected, the doc's "cannot be closed in-process" would have been the false statement. The resulting record does permanently name `recordedBy` and a specific artifact revision, so the fabrication is attributable rather than invisible — the narrowing the doc claims is the narrowing you actually get.

**T7 concurrency — closed under real cross-process load.** Two spin-synchronized OS processes, 20 rounds each:
- `recordHumanTurn` vs `transitionSessionStatus('completed')`: **0/20** post-terminal turns. 18 rounds refused the turn, 2 landed it strictly before the terminal event.
- Two processes both claiming `turnOrdinal: 1`: **0/20** duplicate ordinals, exactly one winner per round, winner alternating between processes across rounds (so the race window was genuinely being hit, not missed).

**No worker path exists.** Traced, not assumed: exactly one `appendEventLocked({type: 'human-turn-recorded'})` site in the codebase (`store.mjs:1497`, inside `recordHumanTurn`) and exactly one caller of `recordHumanTurn` (`src/verbs/coordination/run.mjs:607`), which supplies `recordedBy` from the request's own `writerId` and refuses a step that tries to declare `recordedBy` or `revision` itself. `recordContributionLink` cannot be coerced — `type: 'human-turn'` is refused against the closed contribution-type enum. A session driven purely through worker paths produced only `session-opened` / `actor-bound`.

**Event log is kind-closed at read time.** An invented `human-turn-verified` event (an attempt to make a forged turn look independently verified) writes, but replay refuses it: `unknown event kind "human-turn-verified"`.

**No prototype-pollution surface.** `turnId` / `attributedTo.id` of `__proto__` are accepted as ordinary opaque strings; replay's bookkeeping is `Set`/`Map`-based and reconstructed cleanly.

---

## Cleanup

All attack scripts and temp sessions were created under the session scratchpad (`/tmp/claude-1000/.../scratchpad/`) and OS temp dirs, never in the repo. Nothing was committed. The two files this red team added to the repo are this report and `redteam-findings.json`.

## Unresolved questions for the Coordinator

1. Finding 1: close the code gap (add the shape check to replay + a test) or correct the contract to T8's honest three-item list? Recommend the former.
2. Finding 3: is an out-of-repo `artifactRef` intended (operator cites a transcript outside the tree), or should it get the same `path escape rejected` treatment `turnId` already has? Either way the contract should state the choice.
3. Should `appendEvent`'s "tests only" re-export be enforced rather than merely commented, given it is a validation-free write door onto a live session's ledger?
