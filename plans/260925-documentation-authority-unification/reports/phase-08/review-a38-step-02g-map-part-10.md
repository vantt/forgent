# Review a38 step-02g map part 10

Reviewer: reviewer:sonnet-session:a36e3804394458c77@2026-10-19
Commits: worktree HEAD `a17de68c1` (accounting); author `271823d69`; input source commit `bcbef05c1`
Part: 10 (distinct-mappings, mapping-g-0541..0600, 60 entries, 0 retiring-root consumer edges in index metadata)

## Method

Resolved the 60 mapping ids via the index source table (`step-02g-distinct-mappings.json`), joined every edge in `step-02g-census-maps-portals-prose.json` (consumer, line, matched expression, action, dispositionReason, context) and read each consumer line. Verified every legacy reference against the input commit tree with `git cat-file -t`. Verified the `#design` anchor and line 461 of the cited DISCUSSION.md via git show. For the seven absent targets, ran `git log --all -S` and `git log --all -- <path>` to look for a deleted predecessor or successor.

Rules applied: L12-10 and L12-22 (docs/history is retained, references preserved), L12-21 (upstream/external citations preserved, no patch into verbatim carriage), L12-23 (explicit-carriage, successor notes only when a successor is findable). All 60 mappings are `preserve`, no owner, no anchor, no patch, no target check: this is the correct action for every one, since docs/history/** is not a retiring root and no entry is a writer, operative read in a retiring file that changes meaning, or migration-state cell.

## Per-entry verdicts

| Mapping | Legacy reference | Action | Verdict | Notes |
|---|---|---|---|---|
| mapping-g-0541 | `docs/history/agy-herdr-interactive-mode-multiline-prompt-corruption/RESEARCH.md` | preserve x3 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0542 | `docs/history/agy-permission-capability-allowlist/plan.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0543 | `docs/history/automated-changelog-compound-learn/DISCUSSION.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0544 | `docs/history/backfill-risk-kind-vocabulary-drift/plan.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0545 | `docs/history/backlog-execution-reconciliation/RECONCILIATION.md` | preserve x2 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0546 | `docs/history/caller-verdict-protocol-discover-decompose/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0547 | `docs/history/capability-capacity-remodel/` | preserve x2 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0548 | `docs/history/capability-capacity-remodel/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0549 | `docs/history/capability-executor-registry-unification/DISCUSSION.md#design` | preserve x1 (retained-history, reader) | ok | #design anchor exists in retained DISCUSSION.md ("{#design}" at section 6); preserve, no patch |
| mapping-g-0550 | `docs/history/capacity-cross-provider-governance/CONTEXT.md` | preserve x2 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0551 | `docs/history/capacity-naming-rename/` | preserve x2 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0552 | `docs/history/catchup-already-caught-up/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0553 | `docs/history/catchup-already-caught-up/plan.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0554 | `docs/history/chain-integrity/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | upstream beehive citation (docs/distillery/sources/beehive.md); path not in this repo; preserved as external citation per L12-21/L12-10 |
| mapping-g-0555 | `docs/history/checkpoint-distillate-gate-provenance/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0556 | `docs/history/claim-reclaim-branchhead-reset/CONTEXT.md` | preserve x2 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0557 | `docs/history/claude-code-hook-spawn-enoent/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0558 | `docs/history/claude-code-hook-spawn-enoent/plan.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0559 | `docs/history/cli-invocation-fault-provenance/` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0560 | `docs/history/close-distribution-spec-doctor-fix/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0561 | `docs/history/codex-agent-wait-loop/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | upstream beehive citation; path not in this repo; preserved |
| mapping-g-0562 | `docs/history/codex-bypass-executor/` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0563 | `docs/history/codex-harness-hardening/release-manifest.json` | preserve x1 (retained-history, reader) | ok | upstream beehive citation; path not in this repo; preserved |
| mapping-g-0564 | `docs/history/codex-sandbox-baseline/plan.md` | preserve x1 (retained-history, reader) | ok | upstream beehive citation; path not in this repo; preserved |
| mapping-g-0565 | `docs/history/coding-planning-validating-gate-redesign/` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0566 | `docs/history/coding-planning-validating-gate-redesign/CONTEXT.md` | preserve x2 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0567 | `docs/history/compound-learn-artifact-registry/` | preserve x2 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0568 | `docs/history/compound-learn-artifact-registry/DISCUSSION.md` | preserve x5 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0569 | `docs/history/context-md-enforcement-scope/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0570 | `docs/history/core-foundation-domain-boundary/DISCUSSION.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0571 | `docs/history/core-foundation-domain-boundary/DISCUSSION.md:461` | preserve x3 (retained-history, reader) | ok | ":461" line suffix kept in key; line 461 holds the D20 row; preserve (separate key from 0570, both preserve) |
| mapping-g-0572 | `docs/history/d0026-narrative-reconciliation/plan.md` | preserve x3 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0573 | `docs/history/data-dictionary-no-stuck-merge-abort-drift/RESEARCH.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0574 | `docs/history/decision-code-check-enforcement/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0575 | `docs/history/decision-schema-rationale-alternatives-source/CONTEXT.md` | preserve x2 (retained-history, reader) | ok | brace list is expanded to per-file edges (one maps edge per consumer line; matchedExpression keeps the brace text) and the rule is preserve; no partial-span patch |
| mapping-g-0576 | `docs/history/decision-schema-rationale-alternatives-source/plan.md` | preserve x3 (retained-history, reader) | ok | same brace-list handling as 0575; preserve |
| mapping-g-0577 | `docs/history/decompose-verdict-capture/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0578 | `docs/history/discover-decompose-skill-wrapper-verdict-routing/` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0579 | `docs/history/discover-stage-graph-and-skill-layering/FINDINGS.md` | preserve x2 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0580 | `docs/history/discover-verb-context-blind-clarify-judge/CONTEXT.md` | preserve x2 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0581 | `docs/history/discovery-decompose-reporoot-verify-overwrite/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0582 | `docs/history/dispatch-activation-and-handoff-redesign/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0583 | `docs/history/dispatch-concept-boundary/` | preserve x3 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0584 | `docs/history/dispatch-concept-boundary/DISCUSSION.md` | preserve x4 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0585 | `docs/history/dispatch-config-cache/RESEARCH.md` | preserve x1 (retained-history, reader) | ok | dangling historical citation (path never committed in git history, checked git log --all -S); preserve keeps text unchanged, no successor exists to note |
| mapping-g-0586 | `docs/history/dispatch-core-contract-normalization/plan.md` | preserve x2 (retained-history, reader) | ok | relative link ../../../history/... resolves to docs/history from both docs/architect and docs/platform consumers; link label kept; preserve, no patch |
| mapping-g-0587 | `docs/history/dispatch-fanout-research-dogfood/RESEARCH.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0588 | `docs/history/dispatch-plan-protocol-redesign/` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0589 | `docs/history/dispatch-plan-protocol-redesign/plan.md` | preserve x3 (retained-history, reader) | ok | consumers include a verbatim retired-engine carriage copy; preserve consistent with live twins |
| mapping-g-0590 | `docs/history/dispatch-proof-agy/plan.md` | preserve x1 (retained-history, reader) | ok | dangling historical citation (path absent at input commit; no history in git); preserve, no successor findable |
| mapping-g-0591 | `docs/history/dispatch-result-confidence-reader/plan.md` | preserve x3 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0592 | `docs/history/docs-index-repo-root-fix/CONTEXT.md` | preserve x3 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0593 | `docs/history/doctor-check-enduser-docs-index-stale/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0594 | `docs/history/doctor-fix-gate-bypass/` | preserve x3 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0595 | `docs/history/doctor-fix-gate-bypass/CONTEXT.md` | preserve x3 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0596 | `docs/history/doctor-fix-pretty-status-line/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0597 | `docs/history/dogfood-p25-run1/` | preserve x1 (retained-history, reader) | ok | dangling historical citation in retained docs/backlog.md (dir absent at input commit); preserve, backlog.md is its own retained target |
| mapping-g-0598 | `docs/history/enduser-index-test-dirty-manifest/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0599 | `docs/history/events-jsonl-git-tracked-truncation/` | preserve x2 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |
| mapping-g-0600 | `docs/history/events-jsonl-git-tracked-truncation/CONTEXT.md` | preserve x1 (retained-history, reader) | ok | retained docs/history target exists at input commit; reader-only consumer(s); action preserve, no patch |

## Totals

ok 60 / rework 0 / needs-Lead-judgment 0 (60 entries, 99 edges read through their consumer lines: all preserve).

## Old defect classes

None found: no partial-span patch, no corrupted key, no label/destination split, no prefix match inside a longer token, no code-token false positive, no image `!` loss (no patches exist to lose it), no inherited-flag carriage decision (preserve is driven by the history rule and is consistent with live twins).

## Observations (no rework)

- Seven references (0554, 0561, 0563, 0564, 0585, 0590, 0597) point at paths absent from the input tree. Four are upstream beehive citations; three are dangling historical citations that never existed in this repo's git history. The rationale text "docs/history is retained historical topology" does not say the path is absent; this is wording only and the byte-preserving action is right. Phase 9's post-cutover link check should list these among pre-existing broken links, not new ones.
- 0570 and 0571 differ only by the `:461` suffix, and 0575 holds a brace-list expansion; both are separate keys with the same action, harmless.
