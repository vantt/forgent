---
id: p-7yffe3obap
title: "The secretary (Miu) acts far less than the supervisor, although both hold the same powers by design (secretary, priority P1; source: owner order 2026-11-26 13:56 +07, relayed from discussion ds-jxoz3h2qgk)"
status: proposed
priority: P1
area: secretary
created: 2026-11-26
---

# Why

The owner observed on 2026-11-26 that Miu acts far less than the supervisor, although both hold the same powers by
design (the secretary keeps them asleep in peace, but must take over when the supervisor is gone or a help request is
overdue). Round 8 of discussion `ds-jxoz3h2qgk-when-to-ask` makes Miu the one who gathers the decisions agents took on
their own and reports them to the owner; a quiet Miu means the owner never sees those decisions.

Related: `p-dgs2lsfudr` (the secretary's 15-minute tick stops firing for hours in some generations), which may be one
cause.

# Done when

The cause of Miu's low activity is proven from evidence (her wakes, ticks and acts against the supervisor's over the
same window), and the fix makes her take every act her charter gives her: the overdue-help takeover, the relay of
answered questions, and the report of decisions agents took on their own (ds-jxoz3h2qgk round 8).

# Notes

The owner's order reached the supervisor as a help event because the shaper's `mailbox send` fails `host-failed` from
its sandbox; the supervisor's `mailbox send` fails the same way on 2026-11-26 (activated release predates plan
`261125-2313` phase 4, mail through the request socket).
