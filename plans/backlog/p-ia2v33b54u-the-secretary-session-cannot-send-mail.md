---
id: p-ia2v33b54u
title: "The secretary session cannot send mail: fgos mailbox send is refused event-store-unavailable on a read-only file system (agent confinement, priority medium; source: owner via Miu, 2026-11-22 21:30)"
status: proposed
priority: P2
area: agent-confinement
created: 2026-11-22
---

# Why

On 2026-11-22 21:26 Miu ran `fgos mailbox send --to lead:DOCOS` and got `event-store-unavailable: git-floor-probe-failed: git-driver-io: Read-only file system (os error 30)`; nothing was recorded. The secretary skill lists mailbox send as not audited live. Same family as `p-btxvtb34u3` and `p-zgbqe2bpig`. The owner chose to have a head with write access send the message instead of working around the fence.

# Done when

`fgos mailbox send` from the confined secretary head records the mail and reaches a peer, or the secretary row of the skill states the door that does and the refusal text. One proof in the owning mailbox or confinement test.

# Notes

Pending message for DOCOS (owner approved asking, 2026-11-22): where is the boundary between the authority register of plan `261121-2109-component-authority` and H2 document identity and admission, so no eighth register appears; does DOCOS want to review phase 1 (spec and schema) before it runs; fold in the open Agent Context Engine versus ASC seam boundary and the H2 admission/search timing. Default if no reply: the plan runs under its current lead without DOCOS review.
