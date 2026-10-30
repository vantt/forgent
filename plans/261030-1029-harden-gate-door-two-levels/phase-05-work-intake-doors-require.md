# Phase 05: Guarded Work doors call `require`; Work drops its approval fields

The two skill gates become enforced at the verb that performs the step, and the engine's own consent parks release on a grant instead of on the Work view. Work-owned files: this phase runs in the Work batch. Runs in parallel with phase 06 (disjoint files).

## Context

- No verb refuses a stage advance or a materialize for a missing skill-gate approval today (research §1 M1, M3).
- The record is the authority: `src/intake/plan.mjs:723-744` releases its heavy-risk and blast-radius parks when `view.gates[id].approved === true` and the stored ask text equals `formatProposalAsk(...)`; `plan.mjs:737` gates on `work.risk === 'heavy'`, a keyword placeholder from `classify.mjs`; `plan.mjs:737` also skips the gate when the verdict cites a locked `D<n>` from CONTEXT.md (tsk-wve D1), an escape from the keyword gate.
- Verify commands come from approval records: `src/intake/discovery.mjs:354` (`gates[id].contextApprove.verify`), `src/intake/plan.mjs:530` (`gates[id].planApprove.verify`, a retired gate).
- `approved` is written on `work.move` by `answerAwaiting` (`src/state/store.mjs:817-820,1428-1433`) and folded at `src/state/replay.mjs:377-380`.
- Display readers of `view.gates`: `src/verbs/state/read.mjs:100,136,157` (`fgos show`/`list`), the dashboard, `src/runner/loop.mjs:983,1404` (answer text fed back to the worker, information only, kept).

## Requirements

1. **Context gate at the advance.** `resolveDiscovery`'s locked-context advance (`discovery.mjs:~340-356`) calls `require({kind: 'context', ref: {work: id}, facts: {writes: item footprint, capabilities}, hint})`. A refusal stops the advance by name. The verify command is the item's own `verify` (real) or `FALLBACK_VERIFY`; the skill sets it with `fgos edit --verify` (phase 07).
2. **Plan gate at materialize.** `resolvePlan` calls `decide` on the plan subject (union of the children's footprints and capabilities, the blast radius as a `raise` reason when it reaches `BLAST_RADIUS_GATE_THRESHOLD` (`plan.mjs:61`), `need-human` verdicts as a raise reason) and then `require` before writing any child. With no covering grant it asks once (`gate.ask` with the formatted proposal, then `putInAwaiting` for the Work display and frontier) and returns `need-human` as today. One question per plan: the skill's validate gate and this park are the same subject, so a grant from either covers both.
3. **Delete the record-as-authority paths:** the `approved`-plus-ask-text release, `keywordRiskGate` on `work.risk`, the `citesRealEvidence` escape and its helper use (keep `extractLockedDecisionIds` only if `normalizeChild` still needs it, `plan.mjs:179`), the `planApprove.verify` read, the `contextApprove.verify` read.
4. **Work drops `approved`.** `answerAwaiting`, `moveWorkOnce` and the `answer` verb stop carrying `approved`; the replay fold of it goes. Old events with `approved: true` stay in history and replay as plain answers.
5. **Display join.** `fgos show <id>` and `fgos list` add `gate: {pending[], granted[]}` from `door.show({work: id})`; nothing decides from it.

## Files

- **Modify:** `src/intake/discovery.mjs:340-356`; `src/intake/plan.mjs:54-61,94,137-154,515-540,714-760`; `src/state/store.mjs:615,817-820,1428-1433`; `src/state/replay.mjs:173,377-380`; `bin/fgos.mjs:1886-1900` (`answer`: stop passing `approved`; the phase 03 grant call stays); `src/verbs/state/read.mjs:100,136,157` (display join).
- **Delete:** `heavyRiskAlreadyConfirmed`, `blastRadiusAlreadyConfirmed`, `keywordRiskGate`, `citesRealEvidence`, `HEAVY_RISK` and `DEFAULT_RISK_GATE_REASON` in `plan.mjs` if no other reader (`rg` at build), `planApproveVerify`; the `approved` payload field and fold.

## Tests to retire, and the test that now owns the behaviour

| Retired | Now owned by |
|---|---|
| `test/intake/plan.test.mjs:883,900,915,965,984,997,1494` (heavy-risk park, release on `--approve` of the same ask, stale answer, D-ID escape) and `:746` (heavy gate preempts footprint check) | `packages/gate/rust/tests/require.rs` (grant covers, stale grant refused) and `tests/facts.rs` (risk class); `plan.test.mjs` keeps two wiring cases: no grant parks with one ask and writes no child; a grant lets materialize proceed |
| `test/intake/discovery.test.mjs` cases asserting `contextApprove.verify` is used | behaviour removed (verify comes from the item); one case proves the advance is refused without a grant and passes with one |
| `approved` assertions in `test/state/store.test.mjs` and `test/state/show-list-move-consistency.test.mjs` | behaviour removed; the `gate` display field gets one case in the `show` test |

## Steps

1. WORK agrees the batch slot (board row).
2. Discovery advance onto `require`; verify source changed.
3. `resolvePlan` onto `decide`/`ask`/`require`; delete the old release and keyword gate.
4. Remove `approved` from the Work write path and fold.
5. Display join in `show`/`list`.

## Validation

- Focused Node via `fr.mjs`: `test/intake/plan.test.mjs`, `test/intake/discovery.test.mjs`, `test/state/store.test.mjs`, `test/state/show-list-move-consistency.test.mjs`, `test/state/runtime-coordination.test.mjs`, `test/cli/fgos-return.test.mjs`
- Dogfood: on a scratch item, `fgos plan` parks once; a dashboard approval releases it; a second `fgos plan` with one more child path inside the approved frame does not ask again; a child path in a `high` class does.
- `rg -n "gates\?\.\[id\]\?\.(approved|contextApprove|planApprove)|keywordRiskGate|approved: true" src` returns nothing.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| `require` inside Work's hot mutex spawns or blocks | M x H | Called through the addon, in process (phase 02); `resolvePlan` calls the door before entering the Work transaction where the code allows; measured under `exec-under-hot-lock` guard |
| Items parked under the old release wait for an approval that no longer counts | M x M | On upgrade, such items re-ask once (`consent-missing`), toward asking; the guide lists parked items (`fgos list --status awaiting-human`) |
| A pre-redesign item relied on `planApprove.verify` | L x L | `work.verify` already carries the real command for post-redesign items (`plan.mjs:519-529` comment); the guide names `fgos edit --verify` for any old item |

## Rollback

Revert with drop B. Old Work events are unchanged; the previous release folds them as before.

## Net size (estimate)

Node: about -180 (release logic and its long comments, keyword gate, two verify reads, `approved` path) and +50 (door calls, display join), net about -130. Tests: about -200, +60.
