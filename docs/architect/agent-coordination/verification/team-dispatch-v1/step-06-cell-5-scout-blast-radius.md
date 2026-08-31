# Cell 6.5 — executing.scout-blast-radius read-only researcher

Status: blocked — needs coordinator decision
Date opened: 2026-08-31

## Scope

Audit + gap-fill `executing.scout-blast-radius` fake-executor coverage
against step-06-work-attached-team-adoption.md §3/§4/§5/§6. See
`current-cell.md` for full contract.

## Gap analysis vs step-06 §3/§4/§5/§6

Existing coverage confirmed present (all already satisfy their scenario,
no duplication needed):

- §6 "scout-blast-radius report does not mutate Work": covered —
  `test/runner/operation-choice.test.mjs:1306` (happy path, stores
  artifacts, no Work mutation) and `:1338` (mutating-repo-state fails
  closed with `assignment-scout-blast-radius-failed`); mirrored at
  `test/runner/loop.test.mjs:2283` (runOnce loop safety) and `:2346`
  (Finding P2: no-evidence settles to `blocked`, no fallthrough to
  `implement-item`) and `:2660` (Finding 5: no duplicate cleanup-failure
  logs).
- §5 evidence row `scout-blast-radius | reported | named files/symbols
  and search/graph posture`: multi-axis isolation is covered —
  `operation-choice.test.mjs:1791` (fully generic report, no axis),
  `:1906` (impact/search buzzwords, still no named files/posture),
  `:2447` (whitespace-only files/posture arrays/strings),
  `:3559` "Finding 4" (file-only report fails closed AND posture-only
  report fails closed — proves neither axis alone is sufficient), and
  the valid positive case at `:2069-2092` (named symbol + file + posture
  + callers + affected + risk all present → `scout-blast-radius-reported`).
- §3 Slice 6.3 acceptance "researcher Assignment writes blast-radius
  report" / "driver treats report as `reported`, not `verified`" /
  "implementation still requires normal verify/return": covered by the
  same happy-path test (`:1306`) — `interpretAssignmentRunResult` never
  returns `canAdvanceEdge: true` for this operation (confirmed by reading
  every `return` in the `scout-blast-radius` block,
  `src/runner/dispatch/operation-choice.mjs:1731-1809` — `canAdvanceEdge`
  is hardcoded `false` in all three return paths), so there is no path
  where a scout report alone advances a Work edge.

**Genuine gap found (not filled — see Finding below):** §3's "degraded/
inactive impact-analysis posture is explicit" acceptance criterion, and
the task-spec's Output requirement (`domains/coding/task-specs/
scout-blast-radius.md`: "the output says so plainly and backs its claims
with a direct `rg` cross-check instead of trusting a possibly stale graph
silently") are **not enforced** by the evidence-sufficiency check. No
existing test isolates this because every existing posture-positive test
uses wording like `"Search posture: active rg cross-check performed"` —
never a bare generic technique-word with no posture state named.

## Finding: posture-evidence check accepts generic technique-words with no explicit posture state

`src/runner/dispatch/operation-choice.mjs:1764-1768`:

```js
const hasReportTextPosture = Boolean(
  reportText && /\brg\b|ripgrep|graph\b|\bposture\b|degraded|inactive|cross-check/i.test(reportText)
);
const hasClaimPosture = isNonEmptyString(agentClaim?.posture) || isNonEmptyString(agentClaim?.searchPosture) || isNonEmptyString(agentClaim?.graphPosture);
const hasPostureEvidence = hasReportTextPosture || hasClaimPosture;
```

This is a single OR across technique-words (`rg`, `ripgrep`, `graph`,
bare `posture`) and state-words (`degraded`, `inactive`). Any one of
those substrings anywhere in the report satisfies `hasPostureEvidence` —
the check never requires that an actual posture **state**
(inactive/degraded/full/active) be named. A report can describe real
findings (named symbol, callers, affected, risk) while only ever saying
it "used the dependency graph" — engaging the impact-analysis capability
in name only, never disclosing whether that capability was inactive,
degraded, or fully fresh — and the driver accepts it as
`scout-blast-radius-reported` with `canProceed: true`, i.e. treats it as
equivalent to a report that plainly named a healthy posture. This is the
"stale index silently treated as full coverage" failure mode the root
`CLAUDE.md` gate explicitly warns against for the human/agent workflow;
here it recurs at the automated-evidence-check layer.

Empirically confirmed via `interpretAssignmentRunResult` (read-only
probe, no repo files changed):

- Report body: `"Used the dependency graph to trace callers."` (plus
  valid symbol/callers/affected/risk lines, no posture state named at
  all) → result: `{"stop":false,"canProceed":true,"reason":"scout-blast-radius-reported"}`.
- Contrast: report with zero technique/state words at all (`"Traced
  callers by reading the source directly."`) → correctly rejected:
  `{"stop":true,"canProceed":false,"reason":"scout-blast-radius-insufficient-evidence"}`.

So the check does distinguish "some technique-word present" from "none
present," but does not distinguish "named an actual posture state" from
"used a technique-word in passing." A second, related instance of the
same class of gap: a report that plainly says `"posture: degraded
(GitNexus registered but not present)"` **without** the task-spec-required
`rg` cross-check anywhere in the text is also accepted
(`{"canProceed":true,"reason":"scout-blast-radius-reported"}`) — the
`degraded`/`inactive` keywords are OR'd into the same bucket as the
technique-words rather than requiring the compound "explicit state +
backing cross-check" the task-spec's Output section calls for.

This is production evidence-validation logic in
`src/runner/dispatch/operation-choice.mjs` (in the do-not-touch-without-
stop list per `current-cell.md`), not a missing-test gap — writing
a test to lock in the *current* behavior would be locking in the gap
itself, and writing a test asserting the *desired* (rejecting) behavior
would fail against current code. Per the cell's stop condition ("no
`operation-choice.mjs` production code changes unless the audit surfaces
a genuine bug — if so, STOP and report before fixing"), this halts here
for a coordinator decision rather than being fixed or test-covered
in-cell.

## lastRunResult self-fetch shape check (per current-cell.md, brief)

Does NOT need to re-litigate Cell 6.4's finding — verified directly:
`executeDriverOperationChoice`'s `dispatch === 'assignment'` branch
(`operation-choice.mjs:1943-1984`) is operation-agnostic — it builds the
assignment, calls `executeAssignment`, then immediately calls
`interpretAssignmentRunResult` with the fresh `runResult` in the same
function call, for every assignment-dispatched operation including
`scout-blast-radius`. So scout-blast-radius shares the same "dispatch +
interpret inline, single call, no cross-call resumption" shape as
review-item's single-call case.

One real difference, confirmed not to matter: `chooseStageOperation`'s
executing-stage branch has a `lastRunResult`-aware sub-branch specific to
`review-item` (`operation-choice.mjs:854-909`) that inspects a **prior**
run's verdict on a later loop pass to reroute to `fix-verify-red` — i.e.
review-item's reject verdict must change *which operation runs next*.
`scout-blast-radius` has no equivalent `lastRunResult` branch; it falls
through the generic secondary-operation branch (`operation-choice.mjs:
912-923`), which does not inspect `lastRunResult` at all. This does not
matter functionally: scout-blast-radius has no reroute-to-a-different-
operation requirement analogous to review-item's reject path — a
stop/insufficient-evidence outcome is handled by `loop.mjs` settling the
Work to `blocked` on the same pass (`test/runner/loop.test.mjs:2346-2378`,
"Finding P2 fix"), not by a next-pass `chooseStageOperation` re-decision.
By-design, not a gap.

## New tests (if any)

None written. The only genuinely missing coverage traces back to the
Finding above (production logic gap), which per the cell's stop
condition must not be paired with new tests until the coordinator
decides whether/how to fix the underlying check.

## Regression battery

Not run — no files were modified in this cell (audit-only, all reads
plus one throwaway read-only probe script under
`/tmp/claude-1000/.../scratchpad`, never touching the repo).

## Status

done — see Fix Round 1 below.

## Fix Round 1

Tightened the posture-evidence check at
`src/runner/dispatch/operation-choice.mjs` (scout-blast-radius block,
~lines 1764-1786) per the Finding above.

### Diff summary

- Replaced `hasReportTextPosture` (any technique-word: `rg`, `ripgrep`,
  `graph`, bare `posture`, `degraded`, `inactive`, `cross-check`,
  anywhere in the report) and `hasClaimPosture` (non-empty-string check
  only) with a single `postureStateOf(text)` helper that requires an
  explicit state token — `\b(active|full|degraded|inactive)\b`,
  case-insensitive — matched against report text and each of
  `agentClaim.posture` / `.searchPosture` / `.graphPosture`.
- Added `namedPostureState`: the first state token found across report
  text or those three claim fields (or `null` if none).
- Added `hasCrossCheckMention`: true when an `rg`/`ripgrep`/`cross-check`
  mention appears in report text or any of the three posture claim
  fields, or when `agentClaim.crossCheck` is `true`/non-empty-string, or
  `agentClaim.rgCrossCheck` is non-empty-string.
- Added `requiresCrossCheck`: true when `namedPostureState` is
  `degraded` or `inactive`.
- `hasPostureEvidence` (same name, same call site at the
  insufficient-evidence gate) is now
  `Boolean(namedPostureState) && (!requiresCrossCheck || hasCrossCheckMention)`
  — a bare technique-word no longer counts, and a degraded/inactive claim
  with no rg cross-check now fails.
- No change to `hasNamedFilesOrSymbols`, `hasCallersEvidence`,
  `hasAffectedEvidence`, `hasRiskEvidence`, `src/runner/loop.mjs`, or
  `validate-plan`/`review-item` behavior.

### New tests

Added to `test/runner/operation-choice.test.mjs` (all files/callers/
affected/risk evidence held constant so only posture wording varies):

1. `Fix Round 1: scout-blast-radius posture with technique-word only (no
   state token) must stop` — report says "Used the dependency graph to
   trace callers via rg" (technique-words `graph`/`rg`, no state token)
   → `scout-blast-radius-insufficient-evidence`.
2. `Fix Round 1: scout-blast-radius posture naming active/full without rg
   cross-check still passes` — "Search posture: active." with no rg
   mention → `scout-blast-radius-reported` (cross-check only required for
   degraded/inactive).
3. `Fix Round 1: scout-blast-radius posture naming degraded/inactive
   WITHOUT rg cross-check now fails` — "Search posture: degraded." with
   no rg mention → `scout-blast-radius-insufficient-evidence`.
4. `Fix Round 1: scout-blast-radius posture naming degraded/inactive WITH
   rg cross-check still passes` — "Search posture: degraded, backed by an
   rg cross-check of direct callers." → `scout-blast-radius-reported`.

### Regression check on pre-existing scout-blast-radius tests

Verified each pre-existing scout-blast-radius test named in
`current-cell.md`'s Must-read list still passes and, where it was
predicted to fail for other reasons, confirmed it does:

- `:1306` (fake-executor happy path) — no posture wording involved
  (`hasWorkerReportArtifact`/generic flow); unaffected.
- `:1338` (mutating-repo fails closed) — report text says "Search
  posture: active rg cross-check" (names `active` + rg), but the test
  never reaches the posture-evidence gate: it fails earlier on
  `confidence !== 'reported'/'verified'` after mutation detection.
  Unaffected either way.
- `:1791` (generic report, no posture wording at all) — still fails
  `scout-blast-radius-insufficient-evidence`, now for both missing files
  and missing posture (previously missing files alone was enough).
- `:1906` (generic impact/search words, no state token, no files) —
  still fails `scout-blast-radius-insufficient-evidence`.
- `:2069-2092` (positive fixture) — report text is "Search posture:
  active rg cross-check performed." This already names an explicit state
  token (`active`) and mentions `rg`, so `hasPostureEvidence` is true
  under the tightened check with zero fixture changes needed; test still
  passes with `scout-blast-radius-reported`.
- `:2447` (whitespace/blank-array negative tests) — both sub-cases still
  fail `scout-blast-radius-insufficient-evidence` via
  `hasNamedFilesOrSymbols` being false (whitespace-only `files`/`posture`
  strings, or a blank array element) — the tightened posture check makes
  no difference to the outcome here (posture: `'active'` in the
  blank-array sub-case is a real state token, but files evidence still
  fails independently).
- `:3559` (file-only / posture-only fixtures) — file-only case unaffected
  (posture missing entirely, was already failing). Posture-only case has
  `posture: 'rg checked'` — no state token, so it no longer counts as
  posture evidence at all (previously it did, via the bare `rg` match),
  but the test still fails `scout-blast-radius-insufficient-evidence`
  because files/callers/affected/risk are all still missing regardless.

### Test results

- `test/runner/operation-choice.test.mjs`: 123/123 pass.
- Full battery — `test/runner/operation-choice.test.mjs`,
  `test/runner/loop.test.mjs`, `test/runner/assignment-runresult.test.mjs`,
  `test/runner/assignment-dispatch.test.mjs`,
  `test/e2e/runner-loop.test.mjs`, `test/cli/fgos-stage.test.mjs`:
  297/297 pass, 0 fail.
