---
id: p-ti6npmvown
title: "The supervisor head cannot reach the unconfined lead:SUPERVISOR session, so every job its sandbox refuses becomes an owner question (supervisor, 2026-11-26)"
status: proposed
priority: P1
area: supervisor
created: 2026-11-26
---

# Why

The supervisor skill sends work its confinement refuses (full-suite runs, live suites, pushes, `git recover`) to the unconfined `lead:SUPERVISOR` session with one SendMessage. On 2026-11-26 16:15 (Asia/Saigon) `fgos identity resolve lead:SUPERVISOR` answered `liveness: alive` (handle claude-xonu@fg-server2, mailbox name forgent-claude-1f), yet `ListAgents` answered "No reachable agents" and `fgos mailbox send --to lead:SUPERVISOR`, `--to claude-xonu@fg-server2` and `--to forgent-claude-1f` were all refused `unknown-name`; `fgos mailbox list` has no row for it. So each such job turns into an owner question asking the owner to paste it by hand: q-lquw5eeksv, q-retiynhlh6, q-hwaf52z52m, q-jrieyr2eya and q-4ejwl22eah on 2026-11-26 alone.

# Done when

A confined supervisor head can hand a job to a live `lead:SUPERVISOR` through one door (mailbox or the request socket), and the skill names that door; or the skill names the owner question as the only route and stops trying the others.

# Notes

Related: p-vquz26ibnn item (8), the manual lead:SUPERVISOR session that has no retire condition.
