# tsk-38h — RESEARCH.md

## Round 1 — 2026-08-13 (discovery stage, via fgos-researching)

**Asked:** (A) Is tsk-38h's failure (zero indexed Function symbols for a
large file, on a genuinely fresh, non-stale index) the same root cause
tsk-j7y already fixed, or a distinct gap tsk-j7y's staleness-detection
code would not catch? (B) Does `CLAUDE.md`'s current prose already fully
cover tsk-38h's operational risk, or only staleness? (C) Is anything
actionable inside this repo, or is the remaining scope purely
documentation? (D) Does the bug still reproduce today?

**Checked:**
- `docs/history/impact-analysis-stale-index-detection/CONTEXT.md`
  (tsk-j7y) — feature boundary explicitly scopes OUT "pre-emptive
  detection of FTS/graph corruption itself" (D2) and only builds a
  staleness signal comparing `.gitnexus/meta.json`'s `lastCommit` against
  `git rev-parse HEAD`. Nothing in tsk-j7y's code change inspects
  per-file/per-symbol coverage — a file that is fully, freshly indexed
  (not stale) but whose parser silently skipped its functions would still
  read `lastCommit == HEAD` and report `full`/`present`, not `degraded`.
- `git log --oneline -- CLAUDE.md`: commit `08046def` ("fix(tsk-j7y):
  detect stale GitNexus index instead of reporting present") is what
  introduced the cross-check prose.
- `CLAUDE.md` current text (`## Impact-analysis capability gate`, read
  fresh this session): "A `present` status only means the tool is
  installed, never that its index is fresh or intact (tsk-j7y) — a
  suspicious zero-result or 'not found' answer from an impact-analysis
  tool is worth a quick grep/rg cross-check before being trusted,
  **regardless of what `fgos tool query` reports**." This sentence is
  UNCONDITIONAL — it applies even under the `full` bucket ("`present`,
  freshly checked"), not only under `degraded`. It is not staleness-scoped
  prose; it is a general "always cross-check a suspicious zero-result"
  rule that already covers tsk-38h's exact scenario (a fresh index that is
  silently wrong for one large file) by construction, independent of the
  cause.
- Live re-run today (`mcp__gitnexus__impact`, repo
  `/home/vantt/projects/forgentX`):
  - `impact({target:"runVerb", direction:"upstream",
    file_path:"bin/fgos.mjs"})` → `{"error":"Target 'runVerb' not found",
    "impactedCount":0}`.
  - `impact({target:"resolveDiscovery", direction:"upstream"})` →
    `{"impactedCount":0,"risk":"LOW", ...}`.
  - Cross-check via `rg`/`grep` (per `CLAUDE.md`'s own prescribed
    mitigation): `runVerb` has 4 real call sites in `bin/fgos.mjs`
    (lines 2396, 2406, 2461, 5102) — a real, confirmed false "not found".
    `resolveDiscovery` has 2 real upstream callers
    (`src/runner/loop.mjs:1233`, `bin/fgos.mjs:1391`) — a real, confirmed
    false `impactedCount:0`.
  - **The bug reproduces today, exactly as described**, and the
    prescribed cross-check discipline correctly catches both false
    negatives when applied.
- GitNexus is an external MCP-served tool (its own npm package/index, not
  part of this repo's own `src/`) — no code change inside `forgentX` can
  fix the parser's own per-file symbol coverage. The only actionable
  surface inside this repo is documentation.

**Found:**
- (A) Distinct gap, not the same root cause: tsk-j7y's staleness check
  would report `full` for tsk-38h's exact scenario (fresh, non-stale
  index), so it structurally cannot catch this.
- (B) Already fully covered operationally: the cross-check prose is
  unconditional ("regardless of what `fgos tool query` reports"), not
  staleness-scoped — it already applies to tsk-38h's scenario as written,
  with no gap in coverage.
- (C) No code fix is possible inside this repo (GitNexus is external); the
  only remaining actionable scope is an optional documentation refinement
  naming the specific mechanism (large/complex files may carry zero
  indexed Function symbols even on a fresh reindex — a distinct residual
  gap from staleness) for future readers' understanding, not for closing
  an operational risk that is already closed.
- (D) Confirmed live: both symbols still reproduce the false-negative
  today, and the existing cross-check discipline catches both correctly
  when followed.

**Still open:** whether the marginal documentation refinement (naming the
large-file mechanism explicitly, alongside staleness/corruption in
tsk-j7y's already-pinned terms) is worth a small item, or whether the
operational risk being already fully mitigated by unconditional existing
prose makes tsk-38h fully superseded by tsk-j7y with nothing left to do.
