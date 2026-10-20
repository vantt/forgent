# Review rr4 p07 (seam 4 source files)

Payload: s4-src-p07.json, 22 files, all hand-written source (plugins/fgOS/skills/* have no generated header or core counterpart for merge-loop/terminal; scripts/*). No diffs, no parks in any file.

## Per file

All verdicts ok. Items reviewed per file:

- plugins/fgOS/skills/merge-loop/SKILL.md: ok, 1
- plugins/fgOS/skills/merge-next/SKILL.md: ok, 6
- plugins/fgOS/skills/move/SKILL.md: ok, 1
- plugins/fgOS/skills/pick/SKILL.md: ok, 1
- plugins/fgOS/skills/plan-next/SKILL.md: ok, 2
- plugins/fgOS/skills/plan/SKILL.md: ok, 3
- plugins/fgOS/skills/ready/SKILL.md: ok, 1
- plugins/fgOS/skills/retro-next/SKILL.md: ok, 8
- plugins/fgOS/skills/return/SKILL.md: ok, 1
- plugins/fgOS/skills/rollup/SKILL.md: ok, 1
- plugins/fgOS/skills/show/SKILL.md: ok, 1
- plugins/fgOS/skills/stale/SKILL.md: ok, 1
- plugins/fgOS/skills/submit/SKILL.md: ok, 2
- plugins/fgOS/skills/terminal-close/SKILL.md: ok, 2
- plugins/fgOS/skills/terminal-close/close.sh: ok, 2
- plugins/fgOS/skills/terminal/SKILL.md: ok, 5
- plugins/fgOS/skills/terminal/rename.sh: ok, 4
- plugins/fgOS/skills/terminal/terminal-port.sh: ok, 1
- plugins/fgOS/skills/triage/SKILL.md: ok, 1
- scripts/backfill-status-category.mjs: ok, 21
- scripts/backfill-unit-summaries.mjs: ok, 16
- scripts/build-domain-registry.mjs: ok, 17

Total 98 items (ADMIT/preserve 18 literal references, REJECT 80 dynamic tuples).

## OUTCOME defects

None.

## What was verified

- Admitted preserves: every cited target exists at the pin. docs/history/*/CONTEXT.md and DISCUSSION.md, docs/operator-runbook-herdr-cockpit.md and docs/platform-foundations.md are outside docs/specs/** and docs/architect/**, so the retained-in-place rule (owner-answers L262 item 3: root authorities and non-specs legacy paths) applies. docs/platform-foundations.md is a root authority; its docs/platform/ copy is a promoted anchor, not a live replacement holder, so preserve rather than patch is consistent with Step 4 AGENTS.md precedent.
- 002431 (retired ADR0027 citation, L4-5): preserve with successorNote to retired-decision-history.md#12-adr-0027...; existsAtPin=false is true (the decision file is retired). Satisfies R8.
- 002429/002430 are on different lines from 002431 (L13, L11 vs L4) and share one outcome (preserve) with their neighbors.
- Inherited-preserve items (merge-next, plan, retro-next, terminal*, rename.sh) are joined Step 3/4 dispositions; nothing contradicts them.
- Rejects: all 80 rejected tuples are true non-document uses. `${CLAUDE_PROJECT_DIR}` / `cwd` / `git-common-dir` instructions and root defaults (root-only), `.fgos` state paths (`repoRoot + '/.fgos'`, workflow-runs, assignments, events.jsonl: state-event-store), path.resolve/dirname scalars, backup-path guards, text joins, domains/*.yaml parse and error text (config data, not a legacy doc). No rejected tuple constructs or reads a document path. No docs/ literal in any window is left without an item (the remaining `../_shared/*.md` and `references/*.md` mentions belong to other census classes).
- pathOperand is null on every item, which is correct: no admitted dynamic tuple exists in this part.
- No parks, so no blocker boilerplate. No diffs, so no source/generated concern.

## Record-text notes

- dynamic-006342/6355/6356 (build-domain-registry L21, L69, L73) carry nonDocumentUse `caller-data-formatting` for messages built from a fixed `domains/` root. The outcome is correct because domains/<domain>/registry.yaml and compiled.json are config data, not legacy docs; a `config-or-metadata` label would state the real reason better.
- dynamic-006283/6293/6298 (prose "`.fgos/` by design ... `${CLAUDE_PROJECT_DIR}` resolves") use `caller-data-formatting`; it is prose, not emitted output. Label only.

## Lead-judgment questions

None.

## Counts

22 files, 98 items; defects 0; text notes 2; questions 0.

Status: DONE
