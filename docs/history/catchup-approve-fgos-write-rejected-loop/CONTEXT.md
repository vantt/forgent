# catchup/approve fgos-write-rejected loop (tsk-2f6)

## Feature boundary

`fgos catchup`/`fgos approve`'s interaction on `.fgos/*` diffs. The item's
original description theorized a structural deadlock in `performCatchUp`
(silently freezing a worker branch's stale `.fgos/*` content instead of
adopting main's drift, then `approve` rejecting it identically forever).
Full investigation (`docs/history/catchup-approve-fgos-write-rejected-loop/RESEARCH.md`,
3 rounds: code read, live reproduction, real-incident forensics) found
that theory does not hold. The real, evidenced boundary for this item is
narrower: make the `fgos-write-rejected` block message self-service by
pointing at the existing recovery playbook, unconditionally, every time it
fires.

## Scout evidence

- `src/runner/merge.mjs:1393` `performCatchUp` — 3 live sandbox
  reproductions (single `.fgos/config.json` drift, drift spanning both
  catchup and approve, and a brand-new file added under `.fgos/`) all
  complete cleanly end to end through the real `fgos catchup`/`fgos
  approve` CLI. No crash, no silent content freeze, no rejection.
- `src/runner/merge.mjs:1223-1237` `mergeRunnerItemLocked` — the actual
  `fgosPaths.length > 0` → `fgos-write-rejected` block. This is the exact
  site D2 changes.
- `docs/how-to/fix-fgos-write-rejected-merge-block.md` — the existing,
  already-written recovery playbook (6 real precedents:  tsk-n4i-1,
  tsk-5vf, tsk-4eu, tsk-5ge, tsk-53n, tsk-3v2). D2 points the block
  message at this file; no new doc needed.
- `tsk-3ti`'s real `.fgos/events.jsonl` friction/move history (seq
  22032-22062, 2026-08-20 07:28-08:01) and its actual git commit graph
  (`db2c3555`, `c905a10a`, `c3b0de89`) — the cited real incident, traced
  to a human running raw `git merge main` on `fgw/tsk-3ti` outside `fgos
  catchup` during a real-conflict recovery, not a `performCatchUp` defect.
  Confirms the 3x-identical-rejection pattern the item describes, and
  confirms it never self-resolves via retry (same branch head, same
  rejection, three times).
- `impact-analysis`: `full` posture query returned GitNexus `present`, but
  a prior hook note flagged its index as stale (last indexed `7bb3231`,
  behind current HEAD) — degraded in practice. Cross-checked the one real
  call site with a direct `grep` (`grep -rn "fgosPaths" src/`) instead of
  trusting the graph alone; only one call site exists
  (`mergeRunnerItemLocked` itself), so blast radius for this change is
  self-contained to that one function and its own tests
  (`test/cli/fgos-approve.test.mjs`).

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | drop the original 'approve should distinguish which side changed .fgos/*' proposal -- unnecessary, 3 live reproductions (single drift, double drift, new-file drift) all show ordinary catchup+approve adopt main's .fgos/* drift cleanly with no rejection |
| D2 | fix scope is the fgos-write-rejected friction/block detail in mergeRunnerItemLocked (src/runner/merge.mjs, the fgosPaths.length > 0 branch, ~line 1226-1236) -- append an unconditional pointer to docs/how-to/fix-fgos-write-rejected-merge-block.md to the block detail text, every time this outcome fires, not gated behind a repeat counter |
| D3 | no repeat-counter/loop-detection code added in catchup.mjs or the runner's retry logic -- the always-on message pointer (D2) makes counting repeats moot for this specific error class; kept out per YAGNI |

## Outstanding questions

None
