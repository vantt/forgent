---
id: p-auypprszfz
title: "A head that hits its account quota rotates onto another account of one pool shared by heads and workers (execution/session-host, priority high; source: owner, 2026-11-22 20:51)"
status: proposed
priority: P1
area: session-host
created: 2026-11-22
---

# Why

On 2026-11-22 at 20:37 Miu neared the weekly quota of claude-miu/vantt, the only account in her pool. A worker run through `fgos run` already moves to another account when its account stops on quota (account rotation and provider failover). A long-lived head does not: it stops, and a rotation can only pick from its persona's pool, so Miu would land on the same account again. The owner asked at 20:51 whether one pool shared by heads and workers is enough once heads can rotate. Yes, provided two things hold. First, a head rotates on a quota stop, not only at the context threshold. Second, a second seat on the same account no longer starts with a spent refresh token (p-kghvlvmj6s), and refresh-ahead no longer spends a live seat's token (p-hzzcgzhrv6).

# Done when

1. A head whose provider answers with a quota stop records the quarantine and rotates itself onto another account of its pool, with the same handoff a context rotation writes.
2. Heads and workers draw from one shared Claude pool. The secretary keeps her tier and her provider floor, but no longer needs a private one-account pool.
3. A fixture shows a head rotated off a quota-stopped account onto a healthy one, and the next worker seat avoids the quarantined account.

# Notes

Depends on p-kghvlvmj6s and p-hzzcgzhrv6. Related: p-kqs6fjalvh (login expiry in long seats, folded into heads-stable phase 12), and heads-stable phase 12 (rotation reliability).
