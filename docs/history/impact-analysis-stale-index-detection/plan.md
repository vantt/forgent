# plan: impact-analysis-stale-index-detection (tsk-j7y)

## Mode

Flags counted against CONTEXT.md's locked decisions:

- **public contracts** — yes: adds a new possible status value (`stale`)
  to `fgos tool query`'s output and to `CLAUDE.md`'s three-way
  `inactive`/`degraded`/`full` framing that multiple docs already cite
  verbatim (D3).
- **existing covered behavior** — yes: `probeTool` and
  `classifyRegistryPosture` (`src/state/tool-registry.mjs`) are locked,
  tested functions with two real callers outside their own module
  (`bin/fgos.mjs`'s `tool check`/`query`, `src/setup/registrations.mjs`'s
  doctor check) — see Approach below for why both were checked and found
  safe.
- auth / authorization / data model / audit-security / external-systems
  integration / cross-platform / weak-proof-area / multi-domain — no:
  this reads a file GitNexus already writes, integrates no new external
  system, and touches one product area.

**2 flags → mode: standard.**

## Approach

**Path:** extend `probeTool`'s existing `mcp`/`skill` branch
(`src/state/tool-registry.mjs:183-192`) to also compare
`<scanTarget>/meta.json`'s `lastCommit` field (confirmed present on disk,
CONTEXT.md scout evidence) against the current `git rev-parse HEAD` of
`repoRoot`. Directory exists + commits match (or `meta.json`/`lastCommit`
absent — no marker to compare) → `'present'`, unchanged from today.
Directory exists + commits differ → new `'stale'` value. Directory absent →
`'missing'`, unchanged. This never regresses an already-passing case: every
existing `probeTool` caller either already only checks `=== 'present'`
(dispatch.mjs) or already treats "not present" uniformly (registrations.mjs,
after step 2 below).

**Alternative rejected:** having `fgos tool check` call GitNexus's real MCP
`impact()`/`check` tool to validate index health directly. Rejected in
CONTEXT.md D2 — `tool check` runs as a plain Node CLI process, not inside an
MCP-tool-capable session, so it cannot call GitNexus's own tools; the
on-disk `lastCommit` marker is the only signal reachable from that context.

**Files touched, in order:**

1. `src/state/tool-registry.mjs` — `probeTool`'s mcp/skill branch: add the
   `lastCommit`-vs-`HEAD` staleness check (D2). `classifyRegistryPosture`:
   add an explicit `staleCount` bucket alongside `missingCount`/
   `unknownCount` — needed so step 3 doesn't misreport a stale index as
   "never checked" (found while tracing `classifyRegistryPosture`'s only
   two real callers below; not itself required for the `degraded` posture
   verdict, which already folds any non-`'present'` status in regardless
   of bucket).
2. `src/setup/registrations.mjs` — `checkToolRegistryConfigured`'s degraded
   message: include `staleCount` so the doctor's remediation hint
   distinguishes "flagged stale — reindex" from "never checked — run
   `fgos tool check`" (today it would silently mislabel a stale tool as
   unchecked, since `classifyRegistryPosture` currently folds anything
   non-`present`/`missing` into `unknownCount`).
3. `src/cli/command-registry.mjs` — the `tool` verb's `status` parameter
   description: mention `stale` as a possible probed value (docs accuracy
   only; `tool query --status` already does free-string equality, so no
   behavior change or enum to widen).
4. `CLAUDE.md` — "Impact-analysis capability gate" section: widen the
   "Registered but not `present`" bullet to also cover "present but
   flagged stale" (D3 — folds into the existing `degraded` word, no fourth
   state).
5. `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` — add a
   short trust-boundary note next to the existing "Index is stale" callout:
   a zero-result or "not found" `impact()` call is not proof of zero real
   callers; cross-check with a quick `rg`/`grep` before trusting it,
   especially whenever `fgos tool query` reports anything other than a
   freshly-checked `present` (D1a).
6. `test/state/tool-registry.test.mjs` — makes the item's own red test
   (already committed this session, `tsk-j7y`) pass; add one more case:
   `classifyRegistryPosture` folds a `'stale'` entry into `degraded` with a
   distinct `staleCount`.
7. `test/setup/registrations.test.mjs` — check whether it already exercises
   `checkToolRegistryConfigured`'s degraded message; add/extend a case for
   the new `staleCount` wording if so (existing file, not a new one).

**Callers checked for hidden assumptions (both real, non-test callers of
the two changed functions):**

- `src/runner/dispatch.mjs:660` — `if (status !== 'present') throw ...`.
  Already fails safe: a `'stale'` capacity is already rejected with a clear
  error naming the actual status string. No change needed here; verified
  by reading, not assumed.
- `src/setup/registrations.mjs:343` — see file 2 above; this is the one
  real caller that needed a change, not just a check.

**Proof points (carried to `fgos-coding-validating`, not proven here):**

| Risk | Proof point |
|---|---|
| `probeTool` staleness branch (medium — locked, multi-caller function) | The item's own verify: `node --test test/state/tool-registry.test.mjs` green (already red today, confirmed this session) |
| Regression across the two real callers | Full `npm test` green |
| Doctor message wording | `test/setup/registrations.test.mjs` (extend if it covers `checkToolRegistryConfigured`, per file 7 above) |
| Docs-only changes (CLAUDE.md, gitnexus-impact-analysis SKILL.md) | Inspection — no test, per D1a (prose, not behavior) |

**Impact-analysis posture for this plan:** `fgos tool query --capability
impact-analysis --status present` → gitnexus registered, `present` — nominally
**full**. Noted for the record: this is the exact posture this item's own
CONTEXT.md D2 says is not fully trustworthy without corroboration — the
scout evidence (real callers confirmed via `rg`, not `impact()`) is this
plan's own corroboration, consistent with D1a's proposed practice.

`fgos graph --json` consulted per this skill's own step 3 — not load-bearing
here: this item is not being split (see below), so there is no ordering
choice between sibling pieces for `criticalPath`/`topUnblock` to inform.

## Shape

Standard-mode plan, single piece, no split — see Approach for the ordered
file list; that ordering IS the phased plan (each step is independently
committable and each earlier step's behavior is verified by tests already
in the repo before the next step touches a shared function).

Concrete cases to prove against, matching mode depth:

- **Boundary:** `meta.json` present but missing/malformed `lastCommit` —
  must fall back to `'present'` (today's behavior), never throw or regress
  to `'missing'`.
- **Existing behavior that must not regress:** every current
  `probeTool`/`classifyRegistryPosture` test in
  `test/state/tool-registry.test.mjs` (23 tests today) stays green.
  `dispatch.mjs`'s capacity-resolution `!== 'present'` check already covers
  its own "must not silently accept stale" case (verified by reading, not a
  new test — no capacity in this repo is currently `kind: mcp`, so there is
  no live case to exercise).
- **Partial failure:** `git rev-parse HEAD` failing (e.g. `repoRoot` isn't
  a git repo, or has no commits yet) must degrade to today's
  dir-existence-only behavior, never throw — same "never throws" discipline
  `probeTool`'s own header already states for the rest of the function.

## Assumptions (pinned, not asked — per this skill's material/grounded/
answerable filter; none changes scope/behavior/data shape/acceptance)

- `git rev-parse HEAD` is available and fast enough to run synchronously
  inside `probeTool` (an `async` function already; no new perf budget
  concern — `git` calls elsewhere in this codebase, e.g.
  `src/runner/merge.mjs`'s `detectTrunk`, already do this).
- No other product area currently registers a `kind: mcp`/`skill` tool
  besides `gitnexus` — confirmed by this session's own `fgos tool query`
  (single provider returned) — so this change's real-world blast radius
  today is exactly GitNexus, even though the code stays capability-agnostic
  per D2/D3's own generality intent.

## No CONTEXT.md gaps found

Every choice above cites D1/D2/D3 directly; nothing required handing back
to `fgos-coding-exploring`.
