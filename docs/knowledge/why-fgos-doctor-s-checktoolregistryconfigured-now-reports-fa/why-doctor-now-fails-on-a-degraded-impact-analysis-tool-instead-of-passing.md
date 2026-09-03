---
type: explanation
title: Why doctor now fails on a degraded impact-analysis tool instead of passing
tags: [doctor, impact-analysis, gitnexus, tool-registry, capability-gate]
source_capture_ids: [tsk-3oa2]
authoritative_for: why fgos doctor's checkToolRegistryConfigured now reports failure for a degraded impact-analysis tool instead of passed:true
framework: diataxis
mode: explanation
---
# Why `doctor` now fails on a degraded impact-analysis tool instead of passing

`tsk-3oa2`. `fgos doctor`'s `checkToolRegistryConfigured`
(`src/setup/registrations.mjs`) returned `passed: true` on all three
posture branches — inactive, full, *and* degraded (a registered
impact-analysis tool that is missing, never checked, or stale). The
degraded branch's own message literally said "degraded — run `fgos tool
check`," but still reported `passed: true` — so `AGENTS.md`'s own
impact-analysis capability gate "Degraded" posture (the middle state
between "inactive, not a gap" and "full, MUST rules apply") had no
`doctor` signal a person watching `doctor` output would ever see
flagged.

`fgos tool query` also had no freshness/staleness field at all, so even
a session that thought to check couldn't easily tell how stale a
"present" answer actually was.

## Why this wasn't hypothetical

This gap had already produced one real wrong blast-radius answer that
survived review — the `tsk-46a` incident, later connected to `tsk-38h`
(the same case `CLAUDE.md`'s own impact-analysis capability gate cites
today: "a genuinely fresh, non-stale index can still carry zero indexed
symbols for one large/complex file — confirmed on `bin/fgos.mjs`,
5000+ lines, zero indexed `Function` symbols even immediately after a
fresh reindex"). A session trusting a silently-passing `doctor` check had
no reason to suspect the tool it was relying on for blast-radius
confirmation was in a degraded state.

## The fix

`checkToolRegistryConfigured`'s degraded branch now reports failure
(`passed: false`) rather than `passed: true` — the same posture the
message text had already been describing, now actually reflected in the
check's own pass/fail result. A degraded impact-analysis tool is no
longer silent in `doctor`'s own output.
