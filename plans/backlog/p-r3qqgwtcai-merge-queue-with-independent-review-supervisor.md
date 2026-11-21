---
id: p-r3qqgwtcai
title: "Merge queue with independent review (supervisor, priority medium; source: supervisor-review §7 T3, §6 steps 2-7)"
status: proposed
priority: P2
area: supervisor
created: 2026-11-21
---

# Why

`fgos land` becomes a submission to one queue run by code; a review unit's verdict is bound to the SHA; every branch, orphan ones included, merges through it; `land-branch.sh` is retired in the same change (L10). Goes with p-sdwybf7yre, together or in that order.

# Done when

`cargo test -p fgos-supervision` covers queue, verdict binding and refusal without a verdict; a live merge of a shaper branch passes.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
