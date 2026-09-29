# Unit I24a — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I24a`,
worktree `.claude/worktrees/coordination-skill-harness-i24a-specialist-authorize`,
base `main@94c2aaf49` (post-I23), integrated `main@35be2c10d`.

Adds a `specialist-authorize` request-step type to `run.mjs`'s public
request vocabulary, reaching `authorizeSpecialistSlot` through the raw,
unlocked request-door family — closing the direct-engine-call escape
hatch (`tsk-3xk`) that `fgos-architecture-panel/SKILL.md` named as a Known
Gap, while leaving the group-thinking pack gate's bypass-#4 refusal
(H3, locked decision) structurally intact.

## Implementer (sonnet, fullstack-developer)

Wired the new step type into `schema.mjs`/`run.mjs` inline, the same way
every other non-locked-path step type is handled — deliberately did NOT add
a `composers.mjs` entry, correctly reasoning that entry only feeds the
locked typed-action path (I24b's territory). Made one necessary,
plan-file-list-exceeding addition on its own initiative: discovered
`group-thinking-pack.mjs`'s `runGroupThinkingRequest` forwards requests to
`runCoordinationUseCase` unfiltered, relying entirely on `run.mjs`'s
vocabulary NOT having this step type — so simply growing that vocabulary
(this unit's core change) would have silently reopened bypass #4 unless the
pack gate got its own explicit check. Added that check plus a regression
test before Lead even asked. Full suite at candidate: 7854 pass, 0 fail.

## Independent test + review (round 1, opus, parallel)

Both agents actively red-teamed the H3 invariant rather than just running
the test suite — dispatching real requests through `fgos coordination pack
run` against a real pack-member protocol with a real specialist slot, so
only the gate itself could be what refused it. Confirmed clean under every
variant tried (buried mid-request, duplicate JSON keys, case/whitespace
variants, nested-step attempts). Both also independently found and
reproduced the same two real gaps beyond H3 itself:
- **MEDIUM-1** (both): `coordination start --steps '<json>'` and the
  headless adapter also reach `specialist-authorize` completely unfiltered
  — no pack gate on either. Confirmed by Lead independently reading
  `composers.mjs`'s start-request path (passes `steps` through with only a
  non-empty check). This conflicted with the plan's literal "ONLY `run
  --file`" wording and stop condition — but is NOT a privilege escalation:
  both doors already passed every OTHER step type (authorize, disposition,
  etc.) unfiltered before this unit; the actual invariant that matters (the
  pack gate) held.
- **MEDIUM-2** (review-i24a): `dag-request-compiler.mjs` had no
  reference-field entry for this step type, so `triggerEvidenceRefs`/
  `allowedContextRefs` created no DAG dependency edge (reproduced: refused
  with "unknown step label" where an equivalent `authorize` step works).
- **MEDIUM-3** (review-i24a): `fgos-group-thinking/SKILL.md`'s own prose
  (an actively-loaded file) still claimed "seven step kinds" and "nothing
  reaches `authorizeSpecialistSlot`... not in the vocabulary at all" — both
  now false; the invariant holds only because of the new explicit gate
  check.
- **M2 / a novel finding** (test-i24a only, not caught by review-i24a):
  retrying `authorizeSpecialistSlot` with the SAME `specialistAuthorizationId`
  but a DIFFERENT payload (e.g. a different `specialistActorId`) was
  silently accepted by `store.mjs`'s `recordSpecialistAuthorization` and
  echoed back the caller's new, wrong payload — while the real ledger kept
  only the original binding. Sibling driver-authored doors in the same file
  (`recordHumanTurnLocked`, `recordContributionLinkLocked`) already refuse
  this exact case. Pre-existing bug (predates this unit), newly exposed to
  a public request door by this unit's own diff.
- 2 correctness-adjacent LOW findings on doc wording in
  `coordination-session.md` (a "quoted" claim no longer accurate after
  edits; a missing word), plus a stale open-gap listing in
  `use-fgos-architecture-panel.md`.
- Independent reviewer confirmed the implementer's `composers.mjs` claim
  was factually WRONG in its reasoning (4 other step types DO have composer
  entries) even though the conclusion (don't add one here) was correct —
  recorded as an inherited-scope correction for I24b, not a defect.

## Fix round 1 (6b0420295)

Lead independently re-verified the two most load-bearing findings (the
`start --steps` second-door claim; the `recordSpecialistAuthorization`
payload-mismatch bug) by reading the code directly before dispatching, per
the "an agent's self-reported status is data, not proof" discipline.
- **M2/idempotency bug fixed for real**: `recordSpecialistAuthorization`
  now finds the prior event by id, canonicalizes both payloads (same
  `authorizedBy` normalization the sibling doors already use), returns the
  ORIGINALLY recorded payload on an identical retry, and throws
  `duplicate-ref` on any mismatch — exactly mirroring
  `recordContributionLink`/`recordHumanTurn`'s established pattern. New
  regression test reproduces the exact live scenario Lead and the tester
  both confirmed: retry with a different `specialistActorId` is refused,
  only 1 event ever recorded, original binding untouched.
- **DAG ref-edge gap fixed**: one-line addition to
  `dag-request-compiler.mjs`'s per-step-type reference list, mirroring
  `authorize`'s handling. New DAG-mode test proves both ref arrays create
  real edges.
- **MEDIUM-1 disposed as a documentation fix, not a code restriction**
  (Lead's explicit decision): reworded every "ONLY `run --file`" claim
  across `group-thinking-pack.mjs`'s doc comment/error message,
  `SKILL.md` (+ mirrors), the YAML header comment, `CHANGELOG.md`, and
  `coordination-session.md`'s bypass-#4 section to accurately say "any raw
  coordination request door (`run --file`, `start --steps`, the headless
  adapter)". Restricting `start.mjs` itself was explicitly rejected as
  higher-risk than the problem it would solve — a new, untested,
  security-sensitive code change under fix-round time pressure, for a gap
  that isn't actually a new privilege escalation.
- **MEDIUM-3 stale skill prose fixed**: corrected step-kind count and the
  false "not in the vocabulary" claim to describe the real, current
  mechanism (the explicit gate check).
- **LOW findings fixed**: doc wording nits in `coordination-session.md`
  and `use-fgos-architecture-panel.md`.
- Fixer proactively flagged (did not fix, correctly out of scope) that
  `authorizeOperationLocked` in the same file has the identical
  weak-idempotency pattern this round just fixed for
  `recordSpecialistAuthorization` — filed for separate attention, matching
  the "submit bugs found during work" discipline rather than silently
  letting it sit.

## Lead final verification and merge

Independently re-read the fix commit's diff directly (not only the
fixer's self-report) — confirmed the `store.mjs` fix matches the sibling
doors' exact established pattern, the DAG fix is a correct one-line
mirror, and the reworded doc language landed consistently across all 4
touched files. Reran the 4 key suites myself: 98/98 pass. Full `env -u
CLAUDE_CODE_SESSION_ID npm test` on the worktree: 7929 pass, 0 fail, exit
0.

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I24a` from the
main checkout onto post-I23 `main@94c2aaf49`, `ort` strategy, clean
auto-merge. `integratedSha = 35be2c10d6154051c137c57bb24f6e816ca98a58`.
Reran the 4 key suites on the merged tree (98/98 pass) to confirm the
merge introduced nothing unexpected.

Plan.md's own H3 decision text and stop condition were revised in place
(not silently edited — this status line documents the change) to reflect
the corrected, evidence-based scope: the real invariant is "never through
a pack-gated protocol", not "only through one specific raw door" — the
latter was always inaccurate given `start --steps`/headless already
existed as equally-raw doors before this unit touched anything.

## Process note

This unit is a clean example of the established discipline holding under
real pressure: two independent agents surfaced overlapping-but-not-identical
findings (both caught the second-raw-door issue; only the tester caught the
idempotency bug; only the reviewer caught the DAG gap and the composers.mjs
factual error), and Lead's own direct re-verification of the two most
security-relevant claims (not just reading the reports) was what let a
single fix round close everything without a second round.
