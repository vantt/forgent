---
type: plan
title: "tsk-3ik — plan: Native-First Dispatch Doctrine Phase 4"
---

# tsk-3ik — plan

## Mode gate

Flags counted against `CONTEXT.md`'s locked scope (D1-D3):

| Flag | Applies? | Why |
|---|---|---|
| auth | no | — |
| authorization | no | — |
| data model | yes | `capacities.<id>` config schema likely gains a field/branch to declare native-eligibility (exact shape deferred to this plan's own risk map below). |
| audit/security | yes | Dispatch mechanism choice determines which provider/model actually runs; `docs/reference/capacity-cross-provider-governance.md`'s existing `allowCrossProvider` governance sits right next to this mechanism. |
| external systems | yes | Entire item is about how external processes (`claude`, `agy`, subprocess spawns) get dispatched. |
| public contracts | yes | `resolveExecutorConfig`/`resolveCapacityCli`'s return shape and the `_shared/capacity-dispatch-fallback.md` fragment are contracts already consumed by `fgos-submit-assist`, `judgeDiscovery`, `judgeDecompose` — this item changes both. |
| cross-platform | no | (cross-provider governance already counted under external systems/public contracts, not a literal OS-platform concern) |
| existing covered behavior | yes | `judgeDiscovery`/`judgeDecompose` (`test/intake/discovery.test.mjs`, `test/intake/plan.test.mjs`) and `submit-assist-classify` (`test/skills/fgos-mirror.test.mjs`) are existing, tested behavior this item modifies. |
| weak proof around the area | yes | Native-Task dispatch has never been built anywhere in this repo (CONTEXT.md scout evidence) — no precedent test pattern to lean on. |
| multi-domain | yes | Spans `src/runner/dispatch.mjs`, `src/intake/discovery.mjs`/`decompose.mjs`, `.claude/skills/_shared/`, and (per D3) documentation for future skill authors. |

**7 of 10 flags apply, including two hard-gate flags (audit/security, external systems).** Mode: **high-risk**. A `standard` plan would understate the real blast radius D1/D3 already locked (broad unification + full "wire everything" scope, explicitly split into children per user instruction) — this plan covers the split and each child's own shape instead of pretending it is one story-sized piece.

## Approach

**Chosen path:** build the shared native-vs-cli/spawn decision helper once (foundation), then migrate the two real existing `capacities.<id>` consumers onto it, then document the mandatory-consult convention any future direct-Task-tool skill call site must follow (per D3, since scout confirmed zero such call sites exist today to retrofit).

**Rejected alternative:** rewiring each consumer independently with its own inline native/cli branch (no shared helper). Rejected — DRY violation, same drift risk `tsk-53h`'s own D2 already flagged for the cli-only pattern; a second divergent copy of "check kind, check live-Task-access, decide" would drift the first time the decision logic changes.

**`fgos graph --json`:** tsk-3ik's own component (`{tsk-53h, tsk-3sw, tsk-27y, tsk-3ik, tsk-6db}`) shows nothing external currently depends on tsk-3ik finishing — `topUnblock`/`criticalPath` carry no signal for ordering the split below. Ordering is decided by internal logical dependency instead (helper must exist before either consumer can use it).

**impact-analysis posture:** `full` — GitNexus present (`fgos tool query --capability impact-analysis --status present`, confirmed in `CONTEXT.md`'s own scout evidence). Every risk-map entry below carries a real blast-radius proof point at `fgos-coding-validating`, not a guess.

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| Shared decision helper (new) | High — no precedent in this repo, first native-Task branch ever built; **Iron-Law-gated** — `src/runner/dispatch.mjs` matches `MODULE_RULES`'s `src/runner/` prefix rule (verified: `classifyIronLaw({filesChanged:['src/runner/dispatch.mjs'], description: <this item's own description>})` → `{required:true, matchedModules:['src/runner/dispatch.mjs']}`) | `impact({target: "resolveExecutorConfig", direction: "upstream"})` before touching `dispatch.mjs`; new unit tests covering both branches (native-eligible vs not); `docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`'s recipe since `required:true` |
| `judgeDiscovery`/`judgeDecompose` migration | Medium — **not** Iron-Law-gated (verified: `classifyIronLaw({filesChanged:['src/intake/discovery.mjs','src/intake/plan.mjs','src/intake/judge-executor.mjs'], description: <this item's own description>})` → `{required:false}` — none of these three files match any `MODULE_RULES` entry, only `src/intake/risk-keywords.mjs`/`classify.mjs` do) | `test/intake/discovery.test.mjs`, `test/intake/plan.test.mjs` green — ordinary test-pass evidence, no failing-test-first recipe required |
| `submit-assist-classify` shared fragment migration | Medium — prose-only, no runtime test executes SKILL.md branch logic (same gap `tsk-53h`'s own iron-law-evidence.md already named) | `test/skills/fgos-mirror.test.mjs` (mirror-drift structural check) + one live manual dispatch run, same acceptance pattern `tsk-53h` used |
| Future-skill consult convention (docs) | Low — documentation only, no runtime behavior change | Full regression suite (`node --test 'test/**/*.test.mjs'`) confirms no behavior regression from a doc-only diff |

## Shape (high-risk — fuller map)

Concrete cases each child's own execution needs to prove against:
- **Helper:** capacity declares `kind:"task"` but caller has no live Task access → falls back to cli/spawn exactly as today (never breaks the `not-configured`/`configured-but-absent` paths `capacity-dispatch-fallback.md` already covers).
- **Helper:** capacity declares `kind:"task"`, caller has live Task access, but config forces cli/spawn (0026 rule 4 exception, e.g. isolation) → cli/spawn wins, native never silently overridden.
- **judge-discovery/judge-decompose:** existing `readLockedContext`/plan.md-tiny-small trust-signal skip (untouched by `tsk-27y`) and the caller-supplied-verdict flags (`tsk-27y`, Phase 2) both still short-circuit BEFORE this item's new branch is ever reached — this item's change must never re-derive a judgment `tsk-27y`'s mechanism already skipped.
- **submit-assist-classify:** malformed-response fallback (Step D) still applies identically whether the response came from a native Task call or an exec'd subprocess.

## Split

Four child items, `parent: tsk-3ik`, built and merged one at a time (per D3's explicit continuous build/merge instruction) in this order (foundation first, then its two consumers, then the doc closing the loop):

1. **Build shared native-vs-cli/spawn dispatch decision helper**
   Extends `src/runner/dispatch.mjs` (or a new sibling module, exact shape left to this child's own `fgos-coding-planning` pass) with the decision logic: given a resolved capacity/`kind` and a caller's self-declared live-Task-access, decide native-Task vs cli/spawn, respecting the config-forces-cli/spawn exception (0026 rule 4).
   Verify: `node --test test/runner/dispatch.test.mjs`

2. **Wire `judge-discovery`/`judge-decompose` through the native-Task branch**
   `src/intake/judge-executor.mjs`'s `runJudgeExecutor`, consumed by `src/intake/discovery.mjs:383` and `src/intake/plan.mjs:317`, gains the ability to call Task natively when the calling session (a live `fgos-coding-exploring`/`fgos-coding-planning` session) already has access and the capacity is native-eligible per child 1's helper.
   Verify: `node --test test/intake/discovery.test.mjs test/intake/plan.test.mjs`

3. **Wire `submit-assist-classify` through the native-Task branch**
   `.claude/skills/_shared/capacity-dispatch-fallback.md`'s Step C gains a native-Task option (mirrored to `.agents/skills/_shared/`), consumed by `fgos-submit-assist`.
   Verify: `node --test test/skills/fgos-mirror.test.mjs`

4. **Document the mandatory-consult convention for future direct-Task-tool skill dispatch**
   A how-to (sibling to `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-capacity.md`) stating: any new skill that wants to call the Agent/Task tool directly for a capacity-shaped or subTask-shaped target must first consult child 1's shared decision helper, not invent its own branch.
   Verify: `node --test 'test/**/*.test.mjs'`

## Assumptions (implementer-level, not asked — fgos-coding-validating's call to confirm or revise)

- Child 1's helper is additive/optional-parameter shaped, matching every other `resolveExecutorConfig`/`resolveDiscovery`/`resolveDecompose` extension precedent in this codebase (`tsk-27y`, `tsk-3sw`, `tsk-2yp`) — no existing call site breaks by omitting the new capability.
- Children 2 and 3 can be built in either order once child 1 lands (no dependency between them) — the order above (2 before 3) is not load-bearing, just the order this plan happened to list them.
- Child 4 can be written any time after child 1 lands (documents the helper, not a specific consumer) — does not strictly need to wait for children 2/3, though writing it last means the how-to can cite a real, already-migrated consumer as precedent (matching every other how-to in this repo's own convention of citing a real example, not a hypothetical one).

## References

- `docs/history/native-first-dispatch-doctrine-phase-4-unify-capacity-and-task-dispatch/CONTEXT.md` — locked decisions D1-D3 this plan builds from.
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md` — doctrine this item is Phase 4 of.
- `docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md` — the recipe child 2's `src/intake/` change needs.
- `docs/history/tsk-53h/iron-law-evidence.md` — real precedent for both the "prose-only, no runtime test" gap (child 3) and the full-suite-as-regression-proof pattern (child 4).
