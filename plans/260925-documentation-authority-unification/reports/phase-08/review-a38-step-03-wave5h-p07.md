# Review a38 step-03 wave5h p07

Reviewer: independent read-only semantic review. No checker, probe or CLI was run. Part 07 contains one file, with 4 edges.

## File

- Path: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md`
- Batch/set: batch-103, targeted expansion "batch-103-not-yet-reviewed-expansion"
- Stratum: patched (2 patch edges, 2 preserve edges)
- Verdict: **ok**
- Edges reviewed: 4 of 4 (06932, 06933, 06934, 06935), one 100-edge page.
- Source read: whole file, 93 lines, in a single pass at pin ae141550c.

Hash bindings:
- Source sha256 at the pin: 1e6946675c09f08237ac65c65c4525b822ca219cd2fae6fcb99c72f3d63d105e. This equals the record's `digest` and `inventoryFileDigest`.
- authorInputCommit: ae141550c2e022310de7a0efea757580c0b2479f
- inventoryInputCommit: 1a0f61ac53433292e08fb378ebbb6c1c72fd3b74
- Diff sha256 over the record's `diff` string: 729bf0b80712c3520d1d4db9a1567ff598f968d84125fa45c6007ee5c1b4832c

## Per-edge outcomes

| edge | line | disposition | outcome |
|---|---|---|---|
| maps-j-06932 | 9 (Provenance) | preserve | ok. L12-47: a Provenance line keeps its lineage spelling. The root `docs/operator-runbook-herdr-cockpit.md` exists at the pin (confirmed with ls-tree) and is retained. |
| maps-j-06933 | 17 (Related) | preserve | ok. The Related target is a surviving retained root source, which L12-34(4) and the L12-53 ruling on retained-root Related say to preserve. The L12-52(2) duplicate-park rule applies only to a carriage wrapper with an explicit source-body start marker. This file has no carriage H1 and no marker, so preserve is correct. |
| maps-j-06934 | 22 | patch, Phase 9 | ok. Target `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules` exists, and its `## Business Rules` heading is at line 25. RUL40 is at line 72 and states the 2026-09-06 re-scope. That text says herdr is never the truth or a receipt, Dispatch may use herdr as transport and failure detector, the old statement is kept as history, and the entry carries `supersedes:d3dbe7f5`. The adjacent description ("re-scoped 2026-09-06 by RUL40 re-scope, scope runner, supersedes d3dbe7f5") stays true. |
| maps-j-06935 | 78 | patch, Phase 9 | ok. Same holder and anchor. The adjacent claim is "herdr is still never the source of truth, but Dispatch may use herdr's agent API as transport and failure detector". RUL40 states exactly that, so the description stays true. |

The diff is exactly two single-line hunks, at source lines 22 and 78. Each replaces `docs/specs/runner.md RUL40` with `<target>#business-rules RUL40`. There are no stray changes. The sourceSpans, matchedExpression and the diff text agree.

Missed-reference scan of the whole source:
- `upstreams/herdr/SKILL.md` (line 30), `scripts/herdr-cockpit.sh`, `bin/fgos-runner.mjs` and `.fgos/logs` are not legacy documentation roots.
- `STR35`, `STR39`, `STR40` and the `D d3dbe7f5` / `D ef6ed305` ids are bare ids without a path, so L12-49 says they are not edges.
- No other `docs/` path, no `docs/decisions` or `docs/specs` path, and no deleted decision basename appears. I found no missed edge.

## Counts

- Set batch-103 (this expansion file): reviewed 1, rework 0.
- Patched stratum: reviewed 1, rework 0.
- Unpatched stratum: reviewed 0, rework 0 (not applicable to this file).
- The YAML file in batch-103 is covered by p04 and is not counted here.

## Defects, notes and questions

- Outcome defects: none.
- Record-text notes: none. The reasons name the true holder and the true target state. Edge 06933's reason lists the adjacent source unit literally, which is acceptable.
- Lead-judgment questions: none.
- Checker limitations: none observed for this file.

Status: DONE
Summary: operator-runbook.md (4 edges: 2 preserve, 2 patch to RUL40 in the runner subcomponent spec #business-rules) is ok. Dispositions, targets, anchors, adjacent description and diff all check out against the pin, and I found no missed references.
