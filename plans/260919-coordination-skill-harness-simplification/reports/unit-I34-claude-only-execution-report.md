# Unit I34 — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I34`,
worktree `.claude/worktrees/coordination-skill-harness-i34-drift-test-suite`,
base `main@0ead6156e` (post-I33), integrated `main@baed9b22e`.

Phase 7 item 5 (drift-test completion), sequenced last among the Phase 7
code units per its own audit-the-finished-state purpose. Depended on
I30-I33, all merged.

## Implementer (sonnet, tester)

Directly verified, in this unit, every one of the phase text's 9 (+1)
named drift checks rather than inheriting another unit's secondhand claim
about coverage — the review-flagged risk this unit's own plan.md context
explicitly warned against.

**6 confirmed already covered** (each cited with the real file and line
range, independently spot-checked by Lead where load-bearing):
documented-commands-equal-registry (`test/cli/fgos-manifest.test.mjs`);
semantic-action-kinds-map-to-kernel-actions
(`test/runner/coordination-request-composers.test.mjs`);
generated-skill-projections-byte-identical (`test/skills/fgos-mirror.test.mjs`
— a real dynamic scan, correcting the plan's own secondhand citation of a
weaker test); stale-auto-close-language-absent, facades-restate-no-rule,
fragment-carries-no-domain-vocabulary (all in
`test/skills/coordination-phase4-driver-discipline.test.mjs`);
capability-serves-set-validity + policy.capability-resolution
(`src/setup/registrations.mjs`'s doctor checks, exercised in
`test/setup/checks.test.mjs`); no-portable-executor-pin — confirmed the
REAL guard is `binding.mjs`'s H1 fix (not the narrower
`assertNoPortableExecutorPin` the plan warned against), tested in
`test/verbs/coordination-binding.test.mjs`.

**3 genuine gaps, new tests written**:
- Raw request JSON allowlist (`test/skills/coordination-raw-request-json-allowlist.test.mjs`)
  — asserts no runtime skill embeds raw `declared-protocol` JSON outside
  `fgos-code-change`'s documented Two-Request DAG Mode carve-out.
  Implementer verified the check actually fires (not just a passing
  assertion) by injecting a real violation into `fgos-panel/SKILL.md`,
  confirming failure, then cleanly reverting.
- Keyword-trigger reversal (`test/skills/coordination-capability-matching-keyword-trigger.test.mjs`)
  — proves the 4 runtime skills linking `capability-matching.md` never
  affirmatively trigger off the bare user-text presence of
  "implement"/"code" (I17's own trigger-reversal doctrine). Correctly
  self-corrected mid-work: dropped an initially-added stricter assertion
  ("explicitly disclaims keyword-based triggering") that failed against
  already-merged `fgos-architecture-panel` content and was stricter than
  the phase text actually requires — kept only the real requirement.
- Contract-template resolution (`test/runner/operation-prompt-templates.test.mjs`)
  — see finding below.

## Real, significant finding: 9 of 13 protocols have no authored prompt templates

An exhaustive pass over every registered `CoordinationProtocol`'s declared
`task.contractTemplate` found that 9 of the repo's 13 registered protocols
(`declared-consult`, `deliberation-delphi-chain`,
`deliberation-nominal-group-chain`, `deliberation-rfc-chain`,
`group-cognition-framework`, `group-thinking-delphi-feedback-lite`,
`group-thinking-nominal-group-lite`,
`independent-research-fan-out-fan-in`,
`independent-research-fan-out-fan-in-gated`) have ZERO authored templates
for ANY operation — not a partial gap. `session-engine.mjs` silently falls
back to a legacy objective/expectedOutputs prompt path when a template
doesn't resolve, so this never surfaced as a test failure; these protocols
simply never got their intended `contractTemplate` rendering.

Lead independently confirmed this directly via `core/prompt-templates/`'s
real directory listing: only `architecture-advisory-panel-v1-*` (12
files), `master-loop-review-candidate` (for
`standalone-master-coordination-loop`), and `rfc-review-lite-*` (4 files,
for `group-thinking-rfc-review-lite`) exist. None of the other 9 protocol
name prefixes appear anywhere in the directory.

Correctly left unfixed (authoring ~30 missing templates needs domain
judgment about content this unit has no authority to invent, and several
of the 9 broken protocols are live-dispatchable — e.g. the
`group-thinking-nominal-group-lite`/`delphi-feedback-lite` packs).
Allowlisted the 9 out with an "allowlist honesty" companion test that
fails if any of the 9 quietly regains a resolving template without the
allowlist itself being updated — so the check still catches new
regressions on the 4 working protocols without masking the other 9 behind
a false-green result.

**Recommended follow-up** (not this track's remaining scope, named here so
it isn't silently lost): either author the missing templates for the 9
protocols, or make an explicit product decision that some/all of them are
intentionally dormant/pending removal.

## Lead verification and merge

Independently confirmed the template-gap finding directly against
`core/prompt-templates/`'s real contents (not taken on the implementer's
report alone). Confirmed the implementer's own commit (`dc7d2bc9a`) touches
only the 3 test files, no scope creep. Reran the 3 touched/new test files
myself: 45/45 pass, including a live rerun of the raw-JSON allowlist and
keyword-trigger tests. Ran the full suite myself: 7982 tests, 7909 pass, 0
fail — this worktree had its Rust binaries built fresh
(`cargo build --release --workspace`, ~12s, unrelated to this unit's own
diff), so no environment-gap failures this time, a genuinely clean run.

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I34` from the main
checkout onto post-I33 main, `ort` strategy, clean auto-merge, no
conflicts. `integratedSha = baed9b22e7295e87b7b7823b1427fc0abfd0646d`.
Reran the 3 key suites on the merged tree: 45/45 pass.

## Unresolved / follow-up

- 9 of 13 registered CoordinationProtocols have no authored prompt
  templates (see finding above) — real, significant, out of this unit's
  and this track's declared scope; recommend a dedicated future work item.
