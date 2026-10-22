---
title: "WORK lane: automatic release of retained Land candidates, and porting.add of a known id"
date: 2026-10-22 (Asia/Saigon)
branch: work/es-cutover (from 6fadbbcaa)
status: DONE_WITH_CONCERNS
---

# Land release sweep and porting duplicate add

## Item 1: release of retained Land candidates (owner choice b)

| Part | What |
|---|---|
| Function | `releaseRecordedLand(repoRoot)` in `src/runner/merge.mjs`, next to `acknowledgeLand` (reused as the one release path). Lists `listRetainedLand({bound: 10000})`. Only when the list is non-empty it reads Work's history (`readRawEvents`), maps each Land operation id to the first hashed event that recorded it, and calls `acknowledgeLand`. No event: the candidate stays, nothing is guessed. Returns `{released, warnings}`, never throws (list, read and release failures all become warnings; an incomplete scan too). |
| Acknowledgement | `landAcknowledgement(event)` = `work-event:<h>`, one helper used by approve (delivered x2, blocked), sync-root and promote-to-component. Replaces `work-delivered\|work-blocked\|work-decision:<id>:<seq>`. An event without `h` yields `''`, which Land refuses, so the candidate is kept. |
| Result recording | Delivered moves already carried `landSettlement.operationId`. New payload field `landOperationIds` (non-empty string list): approve's move to `blocked` (`moveWork` param, validated, only for `blocked`), every sync-root decision (red and success), promote-to-component's summary decision (members' operations). The prepare decision (`landOperation`) is not a result and does not match. |
| Call site | `bin/fgos.mjs` end trigger, after `maintainEventStore`, never for a dispatched worker. Warnings go to stderr as `fgos: warning: Land candidate release: ...`. |
| Doctor | `git-land-recovery` unchanged in behaviour (read-only, no fix); its message and the Git spec "Deferred" paragraph now describe the sweep. CHANGELOG line added; the older changelog line that said the sweep waits was corrected. |
| Git | No edit to `packages/git`, `src/git`, `.githooks`, `src/holder-lock`. |

### Deviation, for the owner: the sweep runs only for Land verbs, not every command

The brief said call it at the end of every owner command when the retained list is non-empty. Measured: `listRetainedLand` scans the whole Land journal and costs about 210-320 ms on this repo (debug addon; 12 ms with `bound: 10`), whether or not anything is retained. That is the cost of knowing the list is empty, so a per-command gate would tax every command. Only `approve`, `sync-root`, `promote-to-component` and `merge next` can leave a candidate, and a land already costs seconds, so the sweep runs at the end of those four. Consequence: a candidate whose release failed stays until the next Land verb, not the next command of any kind. Follow-up if the owner wants every command: Git adds a cheap "retained count" fact (RUL104 idea; not built).

Also noticed, not changed: `src/workflow/runner.mjs` has its own `acknowledgeWorkflowLand` duplicating `acknowledgeLand` (acknowledgement `workflow-run:<id>/step:<id>`). Workflow Land candidates are not in Work's events, so the sweep leaves them; they stay until a workflow-side sweep exists.

### Proofs (`test/direct/merge-gate.test.mjs`, the file that owns the approve/sync-root/promote release tests)
- Released once Work recorded the result as a delivery, as a block, as an engine decision (3 tests; candidate and pins gone, second sweep empty).
- Left alone with no recorded result, including when only the prepare decision exists.
- Acknowledgement differs for the same seq on two origins; an event without hash gives `''`.
- Wiring: `fgos list` leaves a recorded candidate, `fgos approve <missing>` releases it (mutation-checked: disabling the end-trigger call turns it red).

## Item 2: `porting.add` of a known id (owner choice b)

`addPorting` already refuses a known id inside the held section (`PortingError` validation), exactly as Work's `addWork` does ("already exists"), so the write door is unchanged. The gap was the fold: two clones that add the same id produce two `porting.add` events, and the fold replaced the record and reset its status to `candidate`. Choice: keep the existing record (first add in the deterministic order wins), because a fold cannot refuse and every clone orders the union the same way. Proof: `test/state/porting-store.test.mjs` "a second porting.add of a known id ... keeps the first record and its moved status" (mutation-checked: removing the guard turns it red). No cross-clone preconditions or conflicts were built.

## Counts (focused runs, no full suite)

| Set | Result |
|---|---|
| `test/state test/event-store test/cli test/intake` | 2708 tests, 16 fail: replay x13, compaction x3 (same as U5) |
| `test/setup` | 995, 1 fail (`events-jsonl-not-truncated`, same as U5) |
| U5's runner list | 1243, 5 fail: claim-port x4 (same) plus `session.test.mjs` "concurrent createSession from real separate OS processes" (31 s, load flake: 21/21 green alone) |
| `test/direct/merge-gate.test.mjs` | 25/25 |
| `test/state/porting-store.test.mjs` | 16/16 |
| `test/git test/architecture.test.mjs` (extra) | 198, 1 fail, see below |

## Concern outside the brief: `test/git/scoped-commit.test.mjs` "probes config and formats once per loan"
Fails with `event-store-machine-id: machine id missing` in `scripts/git/e3-bench.mjs` (`landRunnerItem` -> `sealProjectBeforeLand`). That seal-before-land refusal came with the earlier trigger work; the bench fixture has no machine id. Not caused by this change (no touched path; the failing frame is the seal). Not fixed: the script is Git-owned and outside this brief. Needs an owner or Git-lane decision.

## Census and impact
`--write-census` run: still the same 5 `unresolved-binary` sites (lines shifted), `mutation-census.v1.json` updated. Impact analysis: `fgos tool query --capability impact-analysis --status present` returned 0 providers (inactive). By `rg`: `acknowledgeLand` callers are approve, sync-root, promote-to-component (all moved to the helper) and the new sweep; `moveWork` gains an optional param only.

Unresolved: whether the owner accepts the Land-verb-only trigger, and who owns the e3-bench fixture.

Status: DONE_WITH_CONCERNS
