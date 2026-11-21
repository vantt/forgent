---
id: p-djznnfrbbe
title: A milestone can be accepted by an evaluator kind its guard does not name, because the rule is not enforced on every event path
status: proposed
priority: P2
area: collaboration-degree-part-b
created: 2026-10-24
---

# Why

The evaluator-kind rule must hold on `settle`, `step.complete` and `gate.answer`: a milestone accepts only the evaluator kind its guard names, and findings never achieve a guarded milestone. The rule has to be versioned per workflow snapshot (a case pinned to an older workflow keeps today's fold) so existing ledgers and in-flight cases fold as before. Not yet checked: which shipped playbooks and `domains/marketing` milestones rely on receiptless `step.complete`, and which core workflows would regress. Owner question: do the shipped playbooks rely on receiptless `step.complete`? The evidence for it is still to be gathered inside this item. Review findings: A-F1, A-F2, packet F3, RR5. Source: plans/261023-1619-collaboration-degree-spec/part-b-evidence-hardening.md B1; owner 2026-10-24 18:09 opened item by item. Dependencies: one change with p-3ydqquajy2; p-xtwobjzl2i can go with them; p-lwdpukgwhd and p-shtdt7wpfh need this item to be meaningful.

# Done when

A listed set of shipped playbooks and `domains/marketing` milestones that rely on receiptless `step.complete` is recorded before any change; a test per event path (`settle`, `step.complete`, `gate.answer`) shows a milestone refusing a non-matching evaluator kind and findings never achieving a guarded milestone on a case pinned to the new workflow snapshot; a ledger replay test shows a case pinned to an older workflow folds exactly as before

# Notes

Migrated from the legacy backlog table. Original status: proposed.
