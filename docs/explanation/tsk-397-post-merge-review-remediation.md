---
authoritative_for: tsk-397 post-merge two-round review remediation, 10 findings and their fixes
---

# Two independent post-merge reviews of `tsk-397` found 10 real gaps

`tsk-3ti` and its 10 children (`tsk-3ti-1` through `tsk-3ti-10`) closed
every finding from two independent code-review rounds of the merged
`fgw/tsk-397` diff (the [core/domain architecture
reorganization](core-foundation-domain-boundary.md), merged to `main` at
`ae476f22`) — confirming that a large, 34-decision architecture merge
still carries real residual gaps even after its own extensive `tsk-397-*`
implementation pass, and that a second independent review round found
gaps the first round missed.

## Why a second review round mattered

Round 1 found the fail-open eligibility gap (below). Round 2 — run
separately against the same merged diff — found nine more findings round
1 missed, ranging from an unused function parameter to a genuinely load-
bearing test-gap. Two independent passes over the same diff caught
materially different things; a single review round would have shipped
with several of these unresolved.

## The 10 findings and their fixes

1. **`executorIdForWork` accepted a `role` param it never used**
   (`tsk-3ti-1`) — D15 intended the resolution key to widen to `(domain,
   stage, role)`, but `role` was silently dropped; JSDoc described
   behavior that didn't exist. Fixed: removed the dead param, corrected
   the doc.
2. **Registry/workflow field spread-order inconsistency**
   (`tsk-3ti-2`) — `workflow-stage-graphs.mjs` spread `registry.yaml`
   data *after* workflow fields when building a domain object, letting
   registry.yaml silently override workflow — while other consumers
   (`stage-fsm.mjs`, `plan.mjs`) prioritized workflow first. Fixed:
   unified the precedence order, added a test asserting it explicitly.
3. **Domain-siloing architecture check had a real blind spot**
   (`tsk-3ti-3`) — the check only scanned import specifiers, missing
   coupling via string path-joining (`path.join(cwd, 'domains', ...)`),
   and — since zero `.mjs` files existed under `domains/` at merge time —
   had never actually been exercised. Fixed: extended the check to also
   scan for hardcoded domain-name strings in `src/`/`bin/`.
4. **~60 lines of invariant-explaining comments were lost during the
   rename/refactor** (`tsk-3ti-4`) — comments in
   `scripts/project-agents.mjs`/`src/setup/registrations.mjs` explaining
   *why* the canonical agent root isn't under `.fgos/`, why tool-scope is
   authoritative, why `readRunnerModels` uses
   `resolveMainCheckoutRoot`, why `extractSkillsFromYamlText`
   hand-parses YAML instead of importing a library. Code behavior was
   unchanged; the reasoning was gone. Fixed: restored at the
   corresponding new locations.
5. **`docs/specs/reading-map.md` pointed at a section that no longer
   existed** (`tsk-3ti-5`) — still referenced `AGENTS.md`'s old "fgOS
   Workflow" section after the core/domain split, and this is the doc
   `AGENTS.md` itself names as read-first. Fixed.
6. **`dispatch.mjs decide`'s new `--stage` flag was undocumented**
   (`tsk-3ti-6`) — missing from the CLI usage string, `AGENTS.md`'s "Four
   ways to call decide" section, and `core/skills/_shared/executor-
   dispatch-fallback.md`. Fixed in all three places.
7. **`resolveAgentTypeForTaskSpec` fail-open in two places**
   (`tsk-3ti-7`, round-1 finding M1) — a pinned agent absent from the
   roster still returned `pinnedAgents[0]` (a name that doesn't exist);
   no agent matching `requires-skill` still returned
   `currentAgentType`/`agentDefs[0]` instead of `null`/refusing. This
   defeated the actual purpose of the eligibility gate. Fixed: both
   paths now fail closed.
8. **D20's `soul` field was never implemented** (`tsk-3ti-8`,
   round-1 M9) — `CONTEXT.md` documented an agent-type declaring
   `soul` + `skills`; only `skills` ever shipped. Resolved by correcting
   the doc language rather than retrofitting an unused field — `soul`
   removed from the documented contract rather than built to match a
   spec nobody was using.
9. **Legacy `agents/` scan turned a half-finished migration into a hard
   throw** (`tsk-3ti-9`) — `findAgentYamlFiles` still scanned the legacy
   `agents/` directory as a fallback, but D33's new uniqueness check
   would `throw` on any name collision between `agents/` and
   `core/agents/` — converting an in-progress migration into a hard
   error instead of a soft fallback. Fixed: legacy `agents/` is now
   deprioritized (warn-and-skip on collision) rather than throwing.
10. **`assembleSkills` had no prune mechanism and no cross-domain
    name-collision check** (`tsk-3ti-10`, round-1 H6 + round-2) — a
    skill removed from `core/`/`domains/` stayed orphaned forever in the
    committed `.agents/skills/` output, and no check caught the same
    skill name existing in two domains. D33 already had an equivalent
    uniqueness check for agent-type names; this added the skill-name
    equivalent, plus pruning. **A real incident during this fix**: the
    first prune pass deleted `.claude/skills/ui-spec` — a genuine,
    hand-authored skill that was never routed through the wrapper
    pipeline, because it lacked a matching `.agents/skills` source (the
    exact signal the naive prune used). Fixed by gating the prune on an
    explicit generated-wrapper marker, so it only ever removes files it
    actually generated — restored `ui-spec` and never again risks a
    hand-authored skill.

## A follow-up fix after landing

A subsequent commit (`ae69d8ee`) addressed code-review findings on the
remediation diff itself: `materializeSkillsIntoProject` no longer prunes
freshly-copied base skills when a target project has its own
`domains/*/skills` but no `core/skills`; the `architecture.test.mjs`
`DEFAULT_DOMAIN` guard now matches only the actual declaration line
(not any line containing both tokens) and its literal-path regex accepts
`../` as well as `./`; two missing `CHANGELOG.md` entries were added; a
test name was rewritten to describe the invariant directly instead of
citing a work-item id (this repo's own stable-code-artifacts convention);
and a duplicated legacy-agents-source string literal was consolidated
into one shared constant.
