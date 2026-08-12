# impact-analysis-stale-index-detection (tsk-j7y)

## Feature boundary

During tsk-480, GitNexus's `impact()` MCP tool gave false-negative and
false-not-found blast-radius evidence (`appendWorkerLog` reported
`impactedCount:0` despite real callers at `src/runner/loop.mjs:702,761`;
`runVerb` reported "not found" despite being a real top-level function at
`bin/fgos.mjs:770`), while `fgos tool query --capability impact-analysis
--status present` reported the capability as fully healthy. This item
closes the gap between "gitnexus is registered and present" and "gitnexus's
index is actually trustworthy right now" — for the presence check itself,
and for the prose that governs how sessions trust it.

Out of scope: fixing the specific corrupted `.gitnexus/` index on this
machine right now (an operational, per-machine, gitignored-artifact action
— `drop and recreate file_fts`, per the `analyze` command's own error —
not a code change this branch ships) and pre-emptive detection of FTS/graph
corruption itself (see D2).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix scope is both: (a) documentation — update `CLAUDE.md`'s impact-analysis gate prose and `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` to state plainly that `present` means "tool installed", not "index fresh/valid", and instruct cross-checking a suspicious zero-result `impact()` call (e.g. a target that a quick `rg` confirms has real callers) before trusting it; (b) code — extend the impact-analysis capability's presence check to also surface staleness as a distinct signal, not just directory-existence. |
| D2 | Staleness signal source: GitNexus's own on-disk `.gitnexus/meta.json` already carries a `lastCommit` field (confirmed by reading it directly: `lastCommit: "bbbe414eb..."`, `indexedAt`, `capabilities.fts.status`) recording which commit the index reflects. Compare that against the current `git rev-parse HEAD` to detect staleness. FTS/graph **corruption** (the deeper tsk-480 failure, distinct from staleness — `meta.json`'s own `capabilities.fts.status` still read `"available"` even though the live index was later found corrupted on reindex) has no cheap on-disk pre-flight signal; detecting it for real requires actually running `analyze`, which is too expensive to run as part of every presence probe. Corruption detection stays a documented residual gap, not built in this item (YAGNI) — `analyze`'s own error already names its fix (drop/recreate `file_fts`) when it does surface. |
| D3 (pinned assumption, not asked — low-risk, reversible in planning) | The new staleness signal folds into the existing "degraded" bucket of `CLAUDE.md`'s three-way framing (`inactive`/`degraded`/`full`) rather than inventing a fourth word. Reason: at least 12 files under `docs/history/**` already cite that exact three-way framing verbatim; widening "degraded" to mean "registered but not present, OR present but flagged stale" is a one-line prose change there, versus a fourth word needing review everywhere the three-way framing is copied. Planning can override this if it finds a reason a fourth state is load-bearing somewhere this scout pass didn't check. |

## Pinned terms

- **present** (tool-registry status): the registered tool's `scanTarget`
  exists on disk. Says nothing about the index's freshness or integrity.
- **stale** (new, this item): `present`, but the index's own recorded
  `lastCommit` no longer matches the repo's current `HEAD`.
- **corrupted**: the index exists and may even claim `available` in its own
  metadata, but a real operation against it fails (e.g. the FTS
  `file_fts`-inconsistent crash from tsk-480). Not detected pre-emptively by
  this item — surfaces only when `analyze` (or a query) is actually run.

## Scout evidence

- `appendWorkerLog` real, called `src/runner/loop.mjs:702` and `:761`
  (confirmed via `rg -n "appendWorkerLog" src bin test`) — the tsk-480
  false-negative (`impactedCount:0`) was against a real caller.
- `runVerb` real, `async function runVerb(...)` at `bin/fgos.mjs:770` —
  the tsk-480 "not found" was against a real top-level function.
- `git log --oneline 905c82b..bbbe414 -- src/runner/loop.mjs bin/fgos.mjs`
  shows both files were touched by many commits between the index's last
  indexed commit (`905c82b`, per tsk-480's report) and current `HEAD`
  (`bbbe414`) — staleness alone plausibly explains at least part of both
  tsk-480 false readings, independent of the separate FTS corruption.
- `fgos tool query --capability impact-analysis --status present` (run
  fresh this session) → gitnexus registered, `kind: mcp`, `status:
  "present"`.
- `src/state/tool-registry.mjs:183-192` (`probeTool`): for `mcp`/`skill`
  kind, presence is exactly `fs.existsSync(path.resolve(repoRoot,
  tool.scanTarget))` — directory-existence only, no health/freshness check.
  This is the exact code location the false-positive "present" comes from.
- `.gitnexus/meta.json` (read directly this session) carries `lastCommit`,
  `indexedAt`, and `capabilities: {graph, fts, vectorSearch}` each with
  their own `status` field written by GitNexus itself — confirms an
  on-disk marker exists for D2 without needing to invent one.
- `fgos tool` sub-verb `check`/`query`/`register` schema:
  `src/cli/command-registry.mjs` (~line 900) — the two-way registry this
  item's code change extends.
- No prior `judgeDiscovery` verdicts on this item (`view.discovery['tsk-j7y']`
  is null) — nothing to reconcile against.

## Canonical references

- `CLAUDE.md`'s "Impact-analysis capability gate" section (project root) —
  the three-way framing (`inactive`/`degraded`/`full`) this item's D3
  extends.
- `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` — the
  session-facing guidance this item's D1(a) updates.
- `src/state/tool-registry.mjs` — `probeTool`, the presence-check function
  this item's D1(b)/D2 extend.
- `docs/history/fgos-coding-exploring-impact-analysis-gate/` — prior art for how
  the impact-analysis capability gate itself was introduced.

## Deferred to planning

- Exact function/data shape for the staleness check (new return value from
  `probeTool`? a wrapping check? where the `git rev-parse HEAD` comparison
  runs from, given `.fgos/` vs repo-root resolution rules) — implementation
  design, not a product decision.
- Whether `fgos tool check`'s local status overlay file needs a new field
  to carry staleness, or whether `status` itself grows a third value
  (`present`/`stale`/`missing`) — planning's shaping call, informed by D2's
  locked intent (staleness must be visible, corruption need not be).
- Test/verify plan for the new behavior (item's `verify` field is currently
  unset — "chưa xác định — P15 bổ sung").

## Outstanding questions

None — D1/D2 locked with the user; D3 pinned as a low-risk, reversible
assumption per the exploring skill's own rule for questions that don't need
to interrupt the person.
