# Review a38 step-05 rr4 p12 (seam 4 source, 8 files, 110 items)

Pin 95301cb9 for all files. No diffs in any entry (all preserve/reject), so no diff or rollback checks apply. No parks. No retired-decision citations needing successorNote.

## Per file

| file | verdict | items | notes |
|---|---|---|---|
| scripts/check-doc-retirement.mjs | ok | 49 (4 refs, 45 tuples; 18 admitted incl. refs, 31 rejected) | no outcome defect |
| scripts/check-hook-registrations-guarded.mjs | ok | 6 (all reject) | no outcome defect |
| scripts/check-locked-decisions-heading-drift.mjs | rework (one admission) | 9 (2 refs, 7 tuples) | D1 below |
| scripts/ci-asset-server.mjs | ok | 7 (all reject) | |
| scripts/ci-external-consumer.ps1 | ok | 12 (all reject) | |
| scripts/ci-external-consumer.sh | ok | 17 (all reject) | |
| scripts/decision-question-hook.mjs | ok | 7 (all reject) | |
| scripts/dispatch-decide-hook.mjs | ok | 3 (all reject) | |

Counts: 110 items reviewed; 25 admitted (6 literal refs, 19 tuples), 85 rejected, all preserve. 1 outcome defect, 0 diffs.

## OUTCOME defects

D1. scripts/check-locked-decisions-heading-drift.mjs, dynamic-007236 (L125; same passage as L122-128). Rule R6 (R7 for the passage). The finding line prints `f.file`, which is `path.relative(cwd, full)` built at L98 from the root `path.resolve(cwd, docsHistoryDir)`. That root defaults to the fixed document root `docs/history` (L109, admitted as 007234). The printed path therefore comes from a fixed document root, and the output changes if that root moves. R6 says to admit this, with a pathOperand such as `path.relative(cwd, full)` at L98 and the L125 emission. The record rejects it as `caller-data-formatting`. The disposition stays preserve. Only the admission and pathOperand need correcting. 007235 (L122, count only) is correctly rejected. If the Lead reads `--docs-history-dir` override as making the path caller data only, this becomes a Lead-judgment item instead. The default-root reading is what R6 supports.

All other admit/reject calls hold up against the pinned source.

- check-doc-retirement.mjs admitted items (reads, probes or construction of document paths):
  - 002489 (L57 guard literal for the kept decision projection, a live generated file)
  - 002490 and 002492 (L44 LEGACY_ROOTS, sharing a passage with 007118)
  - 002491 (L48 prefix constant)
  - option()/path.resolve operands 007101-007108
  - 007110 readFile
  - 007118-007122 constants built from DEFAULT_CONSTITUTION_PATH plus ledger/*.json
  - Same-line tuples agree on outcome: 007119/120 on L45, 007121/122 on L46, 007118 with 002490/92.
- Rejected items there hold: every message tuple prints counts, ids, reviewer or err.message and no fixed document path (checked L141-161, 190-206, 278-288). 007111-007113 and 007126-007127 are root/argv/null-default plumbing. 007109 is a Map accumulator over data paths. 007123 is a scalar guard. The `.claude/hooks/` and `.claude/settings.json` mentions in the hook-registration script are config, not documents.
- check-locked-decisions-heading-drift.mjs: 003553/007234 (L109) and 007238/007239 (L90) and 007240 (L95) are real document-path operations; the two L90 tuples agree. 003554 is the L2 header pattern `docs/history/<feature>/ CONTEXT.md`, correctly labelled a pattern, with no relocation claimed (retained external-project convention, not under docs/specs or docs/architect). 007237 is a lines.join text join.
- ci-* scripts and the two hooks: no document paths. Release-asset dirs, env pass-through, PATH prefixes, tarball names and transcript/stdin handling are non-document use.

## Record-text notes (labels only, no outcome change)

- 007128/007129 (hook-registrations L21): nonDocumentUse `root-only`. The operand is a read of `.claude/settings.json`, a config file, so `config-or-metadata` is the truer label. Reject is correct.
- 007254 (ps1 L174, `.fgos\installation\bin`): labelled `state-event-store`. It is an installation binary dir, not an event store. Reject is correct. The same value applies to other readers of this label.
- 007277 (decision-question-hook L51, `texts.join('\n')`): labelled `scalar-pass-through`. `text-label-join` fits better, as for 007278/007281.
- 007280 (L64 `transcript_path` read): labelled `guard`. It is really a transcript (non-document) file read. Reject is correct.
- 002489 and 002491 role `navigation`: both sit in a gate constant or guard, so `retirement-gate-identity` is the closer role, matching 002490/002492. Preserve is right.
- check-doc-retirement L155 prints the bare filename `cutover-write-lease-design.md`. It is not a path, not in the census, and not a tuple, so nothing is owed. It is noted only in case the Lead wants a sweep for bare filenames in messages.

## Lead-judgment questions

- Q1: Confirm D1. Does the `--docs-history-dir` override stop `f.file` from counting as a fixed-root document path? The review view is that the default root is fixed, so the message is admitted.

Status: DONE
Summary: Reviewed all 110 items across 8 files at pin 95301cb9. One admission defect (dynamic-007236, heading-drift L125 message printing a path under the fixed docs/history root), plus label-only notes. Everything else matches R4-R9.
