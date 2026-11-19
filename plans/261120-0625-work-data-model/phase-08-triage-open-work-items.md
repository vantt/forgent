# Phase 8: Triage open Work items

## Inputs
- Settled discussion `docs/discussions/work-data-model/DISCUSSION.md` §6, §7 `#task-work-triage`, D-ADR0082.
- Current work items store (`.fgos/cache/state.json` and work state event streams).

## Files it may write
- `plans/261120-0625-work-data-model/reports/work-triage.md`

## Steps
1. Scan all ~273 open `tsk-` work items (status `todo`, `doing`, `blocked`, `awaiting`).
2. Classify each item with evidence:
   - `keep`: Still relevant product or technical requirement; extract core Why and Done When.
   - `done`: Behavior already implemented and verified on main; cite the commit or proof file.
   - `obsolete`: Superseded by subsequent architecture changes or no longer applicable; cite superseding decision or PR.
3. Write comprehensive triage report to `plans/261120-0625-work-data-model/reports/work-triage.md` detailing the breakdown, evidence citations, and recommended dispositions.
4. Prepare the list of `keep` items for ingestion into `plans/backlog/<p-id>-<slug>.md`, preserving historical `tsk-` IDs in the `Notes` section.

## Verify
The report exists at `plans/261120-0625-work-data-model/reports/work-triage.md` with 100% of open `tsk-` items accounted for and classified with evidence.

## Rollback
Remove the triage report file.
