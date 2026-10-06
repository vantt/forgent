# Pilot B fresh-reader answer key

Written by the lead on 2026-10-07 from the legacy documents `docs/specs/work-state.md` and `docs/io-contract.md` and the repository root instructions, before any reader ran. The commit hash of this file is recorded in the fresh-reader report. Readers do not see this file.

Scoring. A scenario answer (one of the six questions) is correct when it names an owner among the acceptable ones below, with a `path#anchor` citation that exists in the cited document and whose content supports the claim, and does not treat `docs/specs/work-state.md` or `docs/io-contract.md` as the authority. A cited anchor that does not exist is a fabrication (fails the whole run). All paths below are under `docs/platform/work-state/` unless they start with another root.

The six questions (the repository definition-of-done, `AGENTS.md` and `docs/platform-foundations.md` L5): 1 what to read first; 2 what kind of work this is; 3 what contract it touches; 4 how much risk; 5 what proof means done; 6 what learning gets left behind.

## Scenario A: add a work-item status

| Q | Expected answer | Acceptable owners |
|---|---|---|
| 1 | Start at the area portal, then the data dictionary where the status field and its closed set of ten values live, the domain model (the domain owns the pre-delivered status vocabulary) and the Move verb behavior | `README.md`; `spec.md#3-work-item-data-dictionary`; `spec.md#6-domain-model`; `spec.md#move-verb`; `decisions/retired-decision-history.md#12-adr-0027-domain-owns-the-pre-delivered-status-vocabulary` |
| 2 | A change to the specification of the state model (vocabulary and transitions) of this area; it changes a settled decision, so it is not a pure implementation task | `spec.md`; the decision record for status vocabulary |
| 3 | The work item record and event schema (data dictionary), the status vocabulary decision, and the CLI surface that prints statuses (envelope and manifest) | `spec.md#3-work-item-data-dictionary`; `contracts/cli-io-contract.md` (envelope shape or manifest sections) |
| 4 | Elevated: event log already committed must keep replaying (the log is immutable, replay is backward compatible and tested, each event carries a schema version); a new status value must have an explicit default and replay old logs | `decisions/retired-decision-history.md#6-adr-0007-schema-and-event-evolution`; `spec.md#11-business-rules` (the schema-evolution rule) |
| 5 | Existing replay and state tests stay green and the new behavior gets a matching test (`npm test`) | ADR 0007 consequences (replay test is the line of defence); `AGENTS.md` definition of done |
| 6 | The settled decision goes into a new decision record that supersedes or extends the status-vocabulary decision (a decision is changed by a new record, never edited in place); the spec fact goes into the work-state spec | `decisions/retired-decision-history.md` (the closing line of ADR 0027 and ADR 0007: change by superseding with a new record); `AGENTS.md` |

## Scenario B: change an exit code in the CLI envelope

| Q | Expected answer | Acceptable owners |
|---|---|---|
| 1 | The CLI I/O contract: exit codes section, then envelope shape | `README.md`; `contracts/cli-io-contract.md#4-exit-codes`; `contracts/cli-io-contract.md#3-output-direction-unified-envelope` |
| 2 | A public contract change (normative CLI surface), not an internal edit | `contracts/cli-io-contract.md` |
| 3 | The exit-code table (one table only: 0 ok, 1 unexpected, 2 precondition, 3 conflict, 4 validation, 5 corrupt-log, 6 busy (runner), 7 lock-timeout, 8 session-fail, 9 merge-fail) and the version tokens that version each contract | `contracts/cli-io-contract.md#4-exit-codes`; `contracts/cli-io-contract.md#10-version-tokens` |
| 4 | High: consumers branch on the category exit code, never on messages, so any change breaks them; every contract carries an explicit version and a breaking change needs a new version | `contracts/cli-io-contract.md#4-exit-codes`; `decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract` |
| 5 | Tests that pin the exit-code table and the envelope still pass and the changed code has a test; the version token of the contract is bumped | `contracts/cli-io-contract.md#10-version-tokens`; `AGENTS.md` definition of done |
| 6 | A decision record for the change (new record, supersede) and the contract document updated | ADR 0011 consequences; `AGENTS.md` |

## Scenario C: remove a retired state field

| Q | Expected answer | Acceptable owners |
|---|---|---|
| 1 | The schema-evolution rule (RUL11) and its decision, then the data dictionary entry of the field, then the retired decision history for why the field was retired | `README.md`; `decisions/retired-decision-history.md#6-adr-0007-schema-and-event-evolution`; `spec.md#3-work-item-data-dictionary`; `spec.md#11-business-rules` |
| 2 | A schema-evolution change of persisted event data: governed by the schema-evolution rule, not a free refactor | `decisions/retired-decision-history.md#6-adr-0007-schema-and-event-evolution` |
| 3 | The event/work-item schema (data dictionary and record sections) and, if the field is visible in CLI output, the envelope/manifest contract and its version token | `spec.md#3-work-item-data-dictionary`; `spec.md#4-capture-and-evidence-records`; `contracts/cli-io-contract.md#10-version-tokens` |
| 4 | High: committed logs are immutable, never rewritten; removing a field must keep old logs replayable with an explicit default; the pre-release exemption that once allowed in-place rewriting lapses at v1.0.0 and covered only the stores it named | ADR 0007; `decisions/retired-decision-history.md#10-adr-0019-pre-release-exemption-for-the-schema-evolution-rule` |
| 5 | The backward-compatibility replay test passes (previous-version logs replay under the new code) plus new tests; version token bump where visible | ADR 0007 consequences; `AGENTS.md` definition of done |
| 6 | A new decision record (the removal and its replay default); the data dictionary updated; superseding rather than editing an existing record | ADR 0007 and ADR 0019 closing lines; `AGENTS.md` |

## Pass criteria (from the phase file)

Per reader, per scenario: at least 5 of the 6 answers correct; 0 cited anchors that do not exist; 0 answers that rely on a legacy path as authority; at most 8 files opened before the first correct owner document.
