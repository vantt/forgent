# Example family: heterogeneous roster, and the homogeneous fallback

Grounded in `SKILL.md`'s own Executor Roster table (the real, documented
per-role rationale) and in the real, passing conformance case
`heterogeneous actor bindings: two shaper roles resolve through genuinely
different registered executors...`
(`test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`)
— the mechanism below is proven, not aspirational; only the concrete
executor ids in the "intended" table are blocked on a real, named
registration gap.

## Heterogeneous — independently routed shaper/alternative/critic/synthesizer/red-team

`SKILL.md`'s own roster, restated as the `actors[]` override shape a
request would carry:

```json
"actors": [
  { "id": "lead-advisor-actor", "executor": "claude-bwrap", "tier": "critical", "persona": "person-facing-advisory-lead" },
  { "id": "context-investigator-actor", "executor": "codex-readonly", "tier": "analytical", "persona": "disconfirmation-seeking-scout" },
  { "id": "system-shaper-actor", "executor": "claude-bwrap", "tier": "analytical", "persona": "direct-response-architect" },
  { "id": "alternative-shaper-actor", "executor": "agy-bwrap", "tier": "analytical", "persona": "different-priors-designer" },
  { "id": "constraint-advocate-actor", "executor": "codex-readonly", "tier": "analytical", "persona": "production-reality-advocate" },
  { "id": "architecture-critic-actor", "executor": "codex-readonly", "tier": "analytical", "persona": "cross-proposal-attacker" },
  { "id": "synthesizer-actor", "executor": "claude-bwrap", "tier": "critical", "persona": "whole-ledger-integrator" },
  { "id": "red-team-actor", "executor": "agy-bwrap", "tier": "critical", "persona": "process-and-authority-attacker" }
]
```

Three provider families reachable (`claude`, `openai-codex`, `gemini`),
deliberately not collapsed onto one — the alternative shaper sits on a
different family from the system shaper specifically because its whole
value is different priors, and the red-team sits off the synthesizer's own
family specifically to catch what a similar mind would not. This is never
pinned in the FlowDefinition itself (`architecture-advisory-panel-v1.yaml`
declares no `preferExecutor` anywhere) — it lives entirely in the request's
own `actors[]`, exactly as the protocol's own header comment requires
("concrete executor/tier/persona selection is the request's own `actors[]`
field").

**Read this before dispatching any of the above for real.** None of
`claude-bwrap`/`agy-bwrap`/`codex-readonly` is registered in this
repository's live `.fgos/config.json` today
(`node src/runner/dispatch.mjs decide claude-bwrap --has-live-task-access`
returns `{"mechanism":"out-of-process","configured":false}`).
`resolveExecutorConfig`'s own fallback means naming one of these to `fgos
coordination run` does **not** refuse — it silently substitutes the global
default executor, an unconfined, git-write-capable invocation, with no
error anywhere (`SKILL.md`'s own Executor Roster WARNING, and `tsk-1o4`).
**Both real proof sessions (P01.2, P01.3) worked around this by invoking
`bwrap`/`codex` directly as a subprocess** — never through
`dispatch.mjs execute` with these names — using the kongming-verified mount
order (`--tmpfs /tmp` before re-pinning `PROJECT_ROOT`/`EVIDENCE_DIR`).
Re-run the `decide` check above before every session; this closes the
moment `tsk-1o4` registers the three real executors, not before.

## What the mechanism proves today, live (real, passing)

The conformance suite exercises the identical `actors[]` shape against two
REGISTERED fake executors (`exec-family-a`/`exec-family-b`, standing in for
two real, distinct provider families) and confirms, by reading the actual
`RunResult` files on disk, not just the step summary:

- `system-shaper-actor` and `alternative-shaper-actor` resolve through two
  genuinely different registered executors and providers — never one
  collapsed default.
- `synthesizer-actor`, routed through the SAME executor as the system
  shaper but at a higher tier (`critical` vs. `analytical`), resolves a
  **genuinely different model string** (`model-a-critical` vs.
  `model-a-analytical`) — proving the tier effect is real, not cosmetic,
  the exact condition phase-03 named for a tier assertion to count.

This is the real mechanism the "intended" roster above rides on once the
registration gap closes — the per-actor routing, the tier-to-model
derivation, and the isolation between roles are already proven; only the
specific bwrap-wrapped executor ids are pending registration.

## Homogeneous fallback — one provider, still isolated roles

A host with only one configured provider does not get to skip the roster
shape — it gets the same 8 static actor bindings, each still a genuinely
separate `Assignment` with its own fresh, isolated prompt package (no
sibling's private notes, no shared context beyond what a visibility window
explicitly grants):

```json
"actors": [
  { "id": "lead-advisor-actor", "executor": "claude", "tier": "critical" },
  { "id": "context-investigator-actor", "executor": "claude", "tier": "analytical" },
  { "id": "system-shaper-actor", "executor": "claude", "tier": "analytical" },
  { "id": "alternative-shaper-actor", "executor": "claude", "tier": "analytical" },
  { "id": "constraint-advocate-actor", "executor": "claude", "tier": "analytical" },
  { "id": "architecture-critic-actor", "executor": "claude", "tier": "analytical" },
  { "id": "synthesizer-actor", "executor": "claude", "tier": "critical" },
  { "id": "red-team-actor", "executor": "claude", "tier": "critical" }
]
```

**Homogeneous means "same provider," never "same context or session."**
Nothing about a single-provider host collapses the 8 roles into fewer
dispatches, and nothing shares a run between them — `architecture-critic`
still never sees a shaper's private working notes; `red-team` still gets a
fresh assignment routed independently of the synthesizer's own run, on the
same executor, not the same invocation. What is genuinely lost, and must be
said to the person rather than quietly absorbed: no provider-family
diversity to hedge against a shared blind spot. `SKILL.md`'s own audit
discipline applies directly here — "if the roster genuinely cannot satisfy
diversity ... say so and name what was given up," per the coordinator
prompt's own STOP CONDITIONS ("fewer than two safe provider families" is a
real stop, not a shrug). A homogeneous session that never says this out
loud is the exact failure this discipline exists to catch.
