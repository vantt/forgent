# tsk-38h — plan.md

Mode: tiny

Flag count: 0 (auth, authorization, data model, audit/security, external
systems, public contracts, cross-platform — none apply). One prose
sentence in one doc file, no production code path touched.

## Approach

Discovery's own research (`RESEARCH.md` round 1) found: GitNexus's
`impact()` silently misses real callers for very large/complex files (here
`bin/fgos.mjs`, 5000+ lines — confirmed zero indexed `Function` symbols for
the whole file) even on a genuinely fresh, non-stale reindex. This is
distinct from the staleness/corruption gap `tsk-j7y` already fixed
(`docs/history/impact-analysis-stale-index-detection/CONTEXT.md` D2
explicitly scoped FTS/graph corruption detection OUT, and tsk-j7y's own
staleness signal — comparing `.gitnexus/meta.json`'s `lastCommit` against
`git HEAD` — reports `full`, not `degraded`, for a file that is fully
fresh but whose parser silently skipped it).

The operational risk this raises (trusting a false-negative `impact()`
result) is ALREADY fully mitigated: `CLAUDE.md`'s current gate prose reads
"a suspicious zero-result or 'not found' answer from an impact-analysis
tool is worth a quick grep/rg cross-check before being trusted,
**regardless of what `fgos tool query` reports**" — unconditional, not
staleness-scoped, so it already covers this exact scenario as written.
Confirmed live today: `impact({target:"runVerb", ...})` still reports "not
found" and `impact({target:"resolveDiscovery", ...})` still reports
`impactedCount:0`, while `rg`/`grep` confirm real callers for both — the
cross-check catches the false negative correctly when followed.

GitNexus is an external MCP-served tool; no code inside this repo can fix
its own parser's per-file symbol coverage. The only real, low-cost,
genuinely valuable action left is naming this SPECIFIC mechanism (large/
complex file → zero indexed symbols, independent of staleness) explicitly
in `CLAUDE.md`'s gate prose, next to the existing tsk-j7y citation — so a
future reader who sees `full` posture and still gets burned by one huge
file understands why the cross-check line is unconditional, instead of
assuming "full" means "safe" for every file size.

**Alternatives rejected:**
- Building a code-level detector for "this file has zero indexed symbols
  despite being non-stale" (a genuine per-file coverage check) — rejected
  as over-scoped for what discovery found: the operational risk is already
  fully closed by the existing unconditional cross-check prose; a new
  detector would duplicate a mitigation that already works, for a residual
  mechanism this repo cannot fix anyway (GitNexus's own parser).
- Closing as `wontfix`/superseded with no doc change at all — rejected:
  the one-sentence addition is cheap, low-risk, and adds real
  understanding for the next reader who hits this exact confusion (a
  `full` posture that still silently misses one huge file) — worth doing
  since it costs almost nothing, unlike tsk-1dsz's genuinely no-op case.

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| `CLAUDE.md`'s "Impact-analysis capability gate" section | light | Prose-only, one sentence, no code/behavior change. `npm test` full suite green (nothing in the suite depends on this section's exact wording) plus a direct `grep` confirming the new sentence exists. |

No medium/high risk items — pure documentation change, no production or
test-code path touched.

**Impact-analysis posture:** `full` — GitNexus is present and was queried
live during discovery (`fgos tool query --capability impact-analysis
--status present`). Not load-bearing here — no symbol is edited, so no
`impact()` call applies to this change itself.

**Graph position:** `tsk-38h` has no deps and no children (`fgos graph
--id tsk-38h --json` — not re-run this round; nothing about a doc-only
one-line change depends on ordering).

## Shape

Single piece, no split. Add one sentence to `CLAUDE.md`'s "Impact-analysis
capability gate" section, in the `Degraded`/mitigation bullet right after
the existing "regardless of what `fgos tool query` reports" clause,
naming the large-file/complex-file zero-symbol-coverage mechanism this
item found as a second, distinct example alongside staleness — citing
`tsk-38h` the same way the existing sentence cites `tsk-j7y`.

Verify: `grep -q "tsk-38h" CLAUDE.md && npm test`

## Outstanding questions

None
