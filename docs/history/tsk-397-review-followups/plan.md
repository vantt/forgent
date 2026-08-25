# plan.md — tsk-3ti: tsk-397 review followups

Mode: high-risk

Lane decided via `fgos-routing`'s Mode gate (no lane was handed off —
discovery went `clear` and skipped `exploring`/`fgos-routing`'s own
Orient, so this is the direct-entry fallback, applying the gate here).
Flags counted: **audit/security** (finding 7's eligibility-gate fail-open
is a hard-gate flag on its own — regardless of count this forces
high-risk), **existing covered behavior** (dispatch/cli.mjs,
workflow-stage-graphs.mjs, architecture.test.mjs all have live test
coverage this plan must not regress), **weak proof around the area**
(findings 2 and 3 both note the area has never been exercised by a real
test/real domain file). 3 flags + 1 hard-gate flag → **high-risk**.

No `CONTEXT.md` exists for this item — discovery verdict was `clear`,
which skips `exploring` entirely. Per `normalizeChild`'s own
graceful-degrade rule (src/intake/plan.mjs:230-241), child specs below
need no D-ID citation since there are no locked decisions to cite.

Impact-analysis posture: **degraded**. `fgos tool query --capability
impact-analysis --status present` reports GitNexus `present`, but
`list_repos` shows the matching index (`forgent` @
`/home/vantt/projects/forgentX`) is **927 commits behind HEAD** — too
stale to trust for blast-radius evidence here. Proof for each finding
instead relies on direct grep/Read verification recorded in
`RESEARCH.md` (7 parallel Explore-agent passes, each citing exact
file:line against the CURRENT checked-out tree, not the stale graph).

## Approach

Ten independent findings from tsk-397's two review rounds, verified
against current `main` HEAD (`ae476f22`) in `RESEARCH.md` — all still
present except two whose status is more nuanced (see below). Each
finding touches a distinct file or file-cluster with no shared editing
surface between clusters, and no ordering dependency between them (none
of the ten fixes needs another to land first) — a clean split into ten
independently workable pieces, one per finding, same numbering as the
item's own description.

Alternatives rejected:
- **One monolithic fix** — rejected: ten unrelated files/concerns in one
  diff makes review and revert granularity worse for no benefit; nothing
  here needs to land atomically.
- **Fewer, merged pieces** (e.g. grouping all `dispatch/cli.mjs` findings
  1+7 into one child) — rejected: 1 and 7 are two independently
  verifiable, independently revertable fixes in the same file but
  different functions (`executorIdForWork` vs
  `resolveAgentTypeForTaskSpec`); merging them would hide two distinct
  verify commands behind one.

Risk map:

| # | Component | Risk | Proof point (for validating) |
|---|---|---|---|
| 1 | `src/runner/dispatch/cli.mjs` `executorIdForWork` | light | `npm test` covering `test/runner/dispatch*.test.mjs` still green; new test asserts `role` param is either wired or removed, JSDoc matches code |
| 2 | `src/state/workflow-stage-graphs.mjs` `domainObj` build | medium | new test pins precedence (workflow fields win over `registryData`) matching `stage-fsm.mjs`/`plan.mjs`'s existing precedence; `npm test` full suite green (this file is a hub — 923-node graph, high fan-in) |
| 3 | `test/architecture.test.mjs` | medium | new/extended check catches at least one of the 6 already-found `path.join(..., 'domains', ...)` call sites and the `DEFAULT_DOMAIN`/prompt-template hardcoded-`'coding'` literal listed in `RESEARCH.md`, without producing false positives on legitimate cross-cutting code; `npm test` green |
| 4 | `scripts/project-agents.mjs`, `src/setup/registrations.mjs` | light | comment-only change; `npm test` green (no behavior change) |
| 5 | `docs/specs/reading-map.md` | light | doc-only; grep confirms the stale `## fgOS Workflow` pointer is replaced with the real current location (`domains/coding/AGENTS.md`) |
| 6 | `src/runner/dispatch/cli.mjs` usage string, `AGENTS.md`, `core/skills/_shared/executor-dispatch-fallback.md` | light | doc-only; grep confirms `--stage` appears in all 3 previously-silent locations |
| 7 | `src/runner/dispatch/cli.mjs` `resolveAgentTypeForTaskSpec` | **high** | this is the audit/security hard-gate flag — a change here alters which agent a task-spec eligibility check actually selects. New tests must cover all 4 fail-open sites (`cli.mjs:90,101,110,126`) with a case that currently silently succeeds with a wrong agent and, after the fix, either resolves correctly or refuses (never returns an unvalidated name); `npm test` full suite green since this function has broad fan-in across the dispatch path |
| 8 | scope/doc question, no schema change assumed (see Assumptions) | light | doc/CONTEXT-language fix only; `npm test` green (no code path touches a literal `soul` field today) |
| 9 | `scripts/project-agents.mjs` `findAgentYamlFiles`/D33 check | medium | new test simulates a legacy-vs-core name collision and asserts the chosen graceful behavior (soft/deprioritized, not a hard throw) — `npm test` green, `node scripts/project-agents.mjs` (or its `npm run` wrapper if any) still succeeds against the current repo (no legacy dir today, so this is a regression-guard test, not a live-bug fix) |
| 10 | `src/setup/skill-wrappers.mjs` `assembleSkills`/`generateAllSkillWrappers` | medium | new test: (a) a skill removed from `core/skills`/`domains/*/skills` no longer has a stale wrapper after a re-run, (b) two same-named skills across domain/core produce a detected collision (mirroring the `scripts/project-agents.mjs:166-190` D33 pattern) instead of silent overwrite; `npm test` green |

## Shape

Ten pieces, each a `task`-kind fix scoped to the file(s) `RESEARCH.md`
already named for it. Every piece: fix the described gap, add/extend the
test that pins the fixed behavior so the same regression can't silently
return, `npm test` green.

Concrete cases each piece must prove against (beyond its own row above):
- **#2, #7, #9, #10** (the four with real behavior/precedence change):
  existing-behavior-must-not-regress is the dominant case — the specific
  new test asserting the OLD silent-bad behavior no longer happens, run
  alongside the full suite, not just the new test in isolation.
- **#3**: false-positive risk — a broadened architecture check must not
  start failing on legitimate core code; sketch at least one "should NOT
  flag" case alongside the "should flag" case.
- **#4, #5, #6**: no behavior risk — the sketch is just "content present
  where it was absent," verified by grep, not by test framework.

## Split

Footprint overlap check at the Gate flagged 4 sibling pairs sharing a file
(`src/runner/dispatch/cli.mjs` across #1/#6/#7; `scripts/project-agents.mjs`
across #4/#9) — resolved via explicit `deps` edges (never a re-slice, since
each pair edits a different function/section of the shared file): #6 deps
on #1, #7 deps on #1 and #6, #9 deps on #4.

```json
[
  {
    "title": "dispatch cli: wire or remove the unused role param on executorIdForWork",
    "verify": "npm test",
    "action": "src/runner/dispatch/cli.mjs:76-80's executorIdForWork accepts role but never reads it, and its JSDoc (72-74) describes a role??work?.holder??work?.role resolution that doesn't exist in the body -- either wire role into the resolution key (matching the JSDoc's own claimed behavior) or drop the dead param and correct the JSDoc to match reality; verified still-true against current main HEAD in docs/history/tsk-397-review-followups/RESEARCH.md finding 1",
    "footprint": ["src/runner/dispatch/cli.mjs"],
    "kind": "task",
    "risk": "light"
  },
  {
    "title": "workflow-stage-graphs: fix registryData/workflow-fields spread precedence",
    "verify": "npm test",
    "action": "src/state/workflow-stage-graphs.mjs:308-320 spreads registryData AFTER workflow-derived fields in domainObj, letting registry.yaml silently override stages/transitions/skillMap/taskSpecMap/stepMap -- while stage-fsm.mjs:94-95 and plan.mjs:560-561 both prefer the workflow-resolved value first. Flip the spread order to match the rest of the codebase's precedence, and add a test (none exists today per RESEARCH.md finding 2's grep of test/ for 'registryData') that pins which side wins when registry.yaml declares a conflicting top-level key",
    "footprint": ["src/state/workflow-stage-graphs.mjs", "test/state/workflow-stage-graphs.test.mjs"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "architecture check: detect hardcoded domain-path/name coupling, not just import specifiers",
    "verify": "npm test",
    "action": "test/architecture.test.mjs's domain-siloing check (extractImports, lines 54-67) only scans import/export/dynamic-import specifiers, missing coupling via path.join(cwd,'domains',...) string construction and hardcoded domain-name literals -- confirmed live by RESEARCH.md finding 3's 6 path.join call sites (agent-roster.mjs:46, workflow-stage-graphs.mjs:244,706, registrations.mjs:438,539, skill-wrappers.mjs:125) plus DEFAULT_DOMAIN/prompt-templates.mjs hardcoded 'coding' literals. Extend the check to also scan for these patterns in src/ and bin/, with a false-positive guard for legitimate cross-cutting constants like DEFAULT_DOMAIN itself",
    "footprint": ["test/architecture.test.mjs"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "restore invariant comments deleted during tsk-397 rename in project-agents.mjs and registrations.mjs",
    "verify": "npm test",
    "action": "commits f18c9e87 (tsk-397-12) and b4e8e621 (tsk-397-11) deleted ~60 lines of explanatory comments -- why canonical agent root isn't under .fgos/, why tool-scope is authoritative, why readRunnerModels uses resolveMainCheckoutRoot, why extractSkillsFromYamlText hand-parses YAML instead of importing -- with no behavior change intended. Restore the substance of each explanation at its corresponding location in the current (renamed/refactored) code, per the exact deleted text quoted in docs/history/tsk-397-review-followups/RESEARCH.md finding 4",
    "footprint": ["scripts/project-agents.mjs", "src/setup/registrations.mjs"],
    "kind": "task",
    "risk": "light"
  },
  {
    "title": "fix reading-map.md's stale AGENTS.md 'fgOS Workflow' pointer",
    "verify": "npm test",
    "action": "docs/specs/reading-map.md:25 points to AGENTS.md's '## fgOS Workflow' heading, which no longer exists (confirmed via grep in RESEARCH.md finding 5) -- that content now lives at domains/coding/AGENTS.md per current AGENTS.md:14. Update the reading-map.md reference to point at the real current location",
    "footprint": ["docs/specs/reading-map.md"],
    "kind": "task",
    "risk": "light"
  },
  {
    "title": "document dispatch.mjs decide's --stage flag in all 3 places RESEARCH.md found it missing",
    "verify": "npm test",
    "action": "the --stage flag (src/runner/dispatch/cli.mjs:868, used at :253) is undocumented in the CLI usage string (cli.mjs:590,921), AGENTS.md's 'Four ways to call decide' (AGENTS.md:99-104), and core/skills/_shared/executor-dispatch-fallback.md:60-64 (byte-identical .agents/ mirror) -- confirmed by RESEARCH.md finding 6. Add --stage to all 3, keeping the .agents/ mirror byte-identical to core/ per the file's own stated invariant",
    "footprint": ["src/runner/dispatch/cli.mjs", "AGENTS.md", "core/skills/_shared/executor-dispatch-fallback.md", ".agents/skills/_shared/executor-dispatch-fallback.md"],
    "kind": "task",
    "risk": "light",
    "deps": [0]
  },
  {
    "title": "resolveAgentTypeForTaskSpec: stop fail-open eligibility fallback to an unvalidated agent name",
    "verify": "npm test",
    "action": "resolveAgentTypeForTaskSpec (src/runner/dispatch/cli.mjs) fails open at 4 points -- :90 (no taskSpecHeader), :101 (pinned agent not in roster returns pinnedAgents[0] verbatim), :110 (no requires-skill), :126 (no agent matches requires-skill) -- all falling back to currentAgentType||agentDefs[0]?.name??null instead of refusing/null, defeating the real purpose of the eligibility gate per RESEARCH.md finding 7. Change all 4 to return null (refuse) instead of an unvalidated/mismatched name, and update every caller of this function to handle a null result explicitly -- this is the audit/security hard-gate flag driving this item's high-risk lane, needs the widest test coverage of the ten pieces",
    "footprint": ["src/runner/dispatch/cli.mjs"],
    "kind": "task",
    "risk": "heavy",
    "deps": [0, 5]
  },
  {
    "title": "correct D20 'soul' field doc language -- role+persona already carries the intent",
    "verify": "npm test",
    "action": "no literal `soul` field exists anywhere in code/schema/agent-yaml (scripts/project-agents.mjs:19 REQUIRED_FIELDS has no soul) -- D20's intent (agent-type declares 'what it has') is already materialized via the existing role+persona fields present in every core/agents/*.yaml, confirmed by RESEARCH.md finding 8's repo-wide grep (the only other 'soul' hits are the unrelated needsSoul dispatch-flag concept). Assumption pinned here (not material -- doesn't change scope/behavior/acceptance criteria, only doc accuracy): treat this as a doc-correction task, not a new schema field. Update docs/history/core-foundation-domain-boundary/CONTEXT.md's D20 entry (and any other doc asserting a live soul field) to state plainly that soul intent = role+persona, not a separate field",
    "footprint": ["docs/history/core-foundation-domain-boundary/CONTEXT.md"],
    "kind": "task",
    "risk": "light"
  },
  {
    "title": "D33 agent-name uniqueness: make legacy agents/ scan lose gracefully instead of hard-throwing",
    "verify": "npm test",
    "action": "findAgentYamlFiles (scripts/project-agents.mjs:74-118) still scans legacy agents/ as a fallback, but D33's uniqueness check (scripts/project-agents.mjs:166-190) throws unconditionally on any cross-source name collision, with no legacy-loses softness -- confirmed dormant-not-firing today only because the legacy agents/ dir no longer exists (RESEARCH.md finding 9). Assumption pinned here (not material -- repo has zero live legacy files today, so neither option changes current behavior; picking the safer default): change the D33 check so a collision specifically between the legacy agents/ source and core/agents or domains/*/agents is resolved by deprioritizing the legacy entry (core/domain wins, legacy is skipped with a logged warning) rather than throwing, while a collision between two non-legacy sources still throws as today. Add a test simulating a legacy-vs-core name collision to prove the new graceful behavior",
    "footprint": ["scripts/project-agents.mjs"],
    "kind": "task",
    "risk": "standard",
    "deps": [3]
  },
  {
    "title": "skill-wrappers: prune orphaned wrappers and detect cross-domain skill-name collisions",
    "verify": "npm test",
    "action": "assembleSkills and generateAllSkillWrappers (src/setup/skill-wrappers.mjs:122-162, :62-90) only ever add/overwrite -- a skill deleted from core/domains leaves an orphaned wrapper under .agents/skills/ and .claude/skills/ forever, and two domains (or a domain and core) defining the same skill name silently overwrite each other with no error, confirmed by RESEARCH.md finding 10. Add a prune pass (remove any existing wrapper whose source skill no longer exists) and a collision check mirroring the existing D33 pattern in scripts/project-agents.mjs:166-190 (accumulate name->source Map while assembling, throw on any name with >1 source)",
    "footprint": ["src/setup/skill-wrappers.mjs"],
    "kind": "task",
    "risk": "standard"
  }
]
```

## Assumptions

- **#8 (D20 soul field)**: pinned as not-material — role+persona already
  satisfies the intent the "soul" language describes; treated as a
  doc-correction, not a schema addition. If a future session finds a real
  functional gap role+persona doesn't cover, that's a new finding, not a
  reopening of this one.
- **#9 (D33 legacy scan)**: pinned as not-material — the legacy `agents/`
  dir doesn't exist today so neither "drop the scan" nor "deprioritize
  it" changes any current behavior; deprioritize-with-warning was chosen
  as the safer default (preserves the fallback path if `agents/` is ever
  repopulated, while removing the hard-throw-on-migration-artifact
  behavior the finding actually complains about).

## Outstanding questions

None
