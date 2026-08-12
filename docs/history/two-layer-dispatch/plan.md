# plan.md — tsk-2t6: hai lớp dispatch cho fgOS

Mode: tiny

Lane decided per `fgos-routing`'s own Mode-gate (0-1 flags → tiny/small):
0 of the 10 flags apply (no auth, no authorization, no data model, no
audit/security, no external systems, no public contracts, no
cross-platform, no existing covered behavior touched, no weak-proof area,
single domain) — a direct note, no phased shape needed.

## Approach

**No further work.** This item's own design deliverable (the B1/B2
two-layer-dispatch boundary, D1-D12) was already worked out and locked in
`docs/history/two-layer-dispatch/DISCUSSION.md`/`CONTEXT.md` — see
`CONTEXT.md`'s own "Locked decisions" table. Everything that boundary
implied got delegated to three real children:

- `tsk-2sl` — D2/D7 (parallelism reason, DRY the shared fragment). Delivered.
- `tsk-2k1` — D3/D6/D6b/D10 (ad-hoc packet shape, `--model`/`--tier`
  plumbing). Delivered.
- `tsk-503` — D5/D7/D10/D12 (per-dispatch tier judgment, recording via
  `appendWorkerLog`). Delivered.

This item's own remaining scope (separate from the children, per its own
description) — updating
`docs/distillery/deep-dives/parallel-decomposition-and-merge.md` and
adding a `docs/distillery/porting-log.md` row — is also already done
(DISCUSSION.md's own `#task-distillery-delta`, vòng 5), committed on
`fgw/tsk-2t6` before this planning pass even started.

There is nothing left to design, split, or build. No alternative approach
was considered because there is no remaining work to shape one for.

## Risk map

None. No files are changed by this plan — every real change already
landed via the three delivered children plus the pre-existing deep-dive/
porting-log commit. `impact-analysis` posture: **full** (GitNexus
registered and present, `fgos tool query --capability impact-analysis
--status present`) — not applicable here since no code is touched.

## Shape

A direct note, not a phased plan (mode `tiny`): this item is ready to
close. Proof surface is the item's own already-passing `verify`:

```
grep -q "Lớp 1 — cell (ghi file)" docs/distillery/deep-dives/parallel-decomposition-and-merge.md && grep -q "Lớp 2 — I/O worker" docs/distillery/deep-dives/parallel-decomposition-and-merge.md && grep -q "GHI file/mutate git thì phải có danh tính" docs/distillery/deep-dives/parallel-decomposition-and-merge.md && grep -q "cell KHÔNG phải backlog item" docs/distillery/deep-dives/parallel-decomposition-and-merge.md && grep -q "bee:fan-out-cost-tiering-rubric" docs/distillery/porting-log.md && grep -q "R3 E2 F2" docs/distillery/porting-log.md
```

Already passing at time of writing (confirmed during the `fgos-coding-exploring`
pass just before this one).

## Split decision

No split. One honest piece of work, and that piece is already complete —
this item proceeds as itself, straight to `fgos-coding-validating`'s reality
check and then `executing`, where `fgos-coding-implement` should find
nothing left to do beyond re-confirming the already-passing verify and
returning.

## Assumptions

None outstanding — `CONTEXT.md`'s own "Outstanding questions" section
already states nothing is open for this item.
