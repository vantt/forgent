# Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)


```txt
Document type: Contract
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve frozen-map runner content for independent conservation review
Design status: Candidate
Implementation: Carriage only; implementation truth not certified
Provenance: docs/specs/runner.md at 63fa6f15266f45c881f610235e0be8d61ff07120; blob ddfa78cc7183cf1f7db8ee64d2339653a0aa0023
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing runner carriage, placement and conservation
Do not use this for: Canonical behavior, source retirement or current truth proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/specs/runner.md
Supersedes: None; legacy authority retained
Superseded by: None
```

> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Placement in decisions does not declare the subject retired. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim.

## ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)

Target vocabulary from design.md §3.7 of
`plans/260915-executor-policy-dispatch-seams/design.md` — documented here so
config/doctor warnings (`executor-profile-warnings` check,
`src/setup/executor-profile-warnings.mjs`) have a named migration target to
point at. The **Invocation** half of this vocabulary was already real config
before this section existed (`executors.<id>.invocations[]`, each entry's
own `via`/`command`/`args`/`adapter` — `src/runner/dispatch/config.mjs`'s
`validateInvocationShape`). Phase C (`plans/260917-executor-profile-schema-migration/plan.md`)
made the **ExecutorProfile** half real too: `executors.<id>.identity`
(all four fields required together when declared) and `executors.<id>.supports`
(each field independently optional) are now validated, additive config
fields (`validateExecutorIdentityShape`/`validateExecutorSupportsShape`,
same file) that survive `resolveExecutorAndOverrides` unchanged. Neither
field has a real consumer yet — no resolution/dispatch/PlacementPolicy code
reads `identity`/`supports` for any decision — this is metadata a later
phase can build on, not a behavior change. `claude` is the one real
executor declaring both today (`.fgos/config.json`), proving the shape end
to end; every other `runner.executors.<id>` entry stays exactly as it was,
and legacy executor ids remain fully accepted. **No executor-id
consolidation or config-shape retirement has happened** (that is Phase E,
not started) — this section still describes the fuller target the
vocabulary is headed toward, not a completed migration.

**ExecutorProfile** answers "which principal/backend/trust boundary is
this?" — a stable runtime boundary, never a policy choice:

| Field | Answers | Must NOT be derived from |
|---|---|---|
| `identity.principalRef` | which account/credential family | a concrete rotating account id (Provider Capacity Rotator's own scope, `plans/260916-account-rotator/`) |
| `identity.runtimeBackendRef` | which CLI/runtime this is | model, quality tier, reasoning effort |
| `identity.trustDomain` | how privileged this principal is | persona/role/business case |
| `identity.egressClass` | what it may reach over the network | visibility (visible/headless) alone |

**Invocation** answers "how is this profile actually used for one dispatch?":
adapter (`cli-spawn`/`herdr-spawn`/mcp/api), prompt delivery (argv vs
file-pointer), visible/headless mode, confinement backend/envelope, resource
bindings, provider adapter id. Confinement is normally an invocation
envelope, not identity — it only becomes identity when it changes principal,
backend trust, or egress boundary materially (the same rule design.md's
ProviderAdapter section already states for the shadow-mode Phase 01 module,
`src/runner/dispatch/provider-adapter.mjs`).

Migration targets a legacy config entry maps onto once every executor
consolidates onto this vocabulary (Phase D/E of
`plans/260917-executor-profile-schema-migration/plan.md`, not yet — the
`identity`/`supports` fields being real config, above, is not the same as
this consolidation happening):

| Legacy pattern | Target |
|---|---|
| policy-shaped flag hardcoded in `executors.<id>` args (`--model`, `--effort`, `--allowedTools`, `--permission-mode`, Codex `-s`, …) | `ProviderAdapter` runtime option (design.md §3.5) |
| role/persona baked into an executor id (`claude-reviewer`) | a compatibility alias patch (Phase 03, `LEGACY_EXECUTOR_ALIASES` in `src/runner/dispatch/assignment-policy.mjs`) carrying `personaRef`/`toolIntent`/`reasoningEffort` |
| legacy model overrides on an executor | `runner.modelPolicies.<provider>` tier entry |
| adapter choice encoded as a separate executor id | an `invocation` on one `ExecutorProfile` |
| bwrap/confinement encoded as a separate executor id | an invocation's confinement envelope, unless trust/egress genuinely differs |
| account pool / credential home env on an executor (e.g. the retired `FGOS_CODEX_CREDENTIAL_HOMES`) | Provider Capacity Rotator's global `runner.providers.<provider>.accounts` inventory (`plans/260916-account-rotator/`) |

A later migration (Phase E) can map `claude` + `claude-reviewer` +
`claude-reviewer-herdr` and similar id families into one `ExecutorProfile`
with multiple invocations, but that consolidation has not happened —
`fgos doctor`'s `executor-profile-warnings` check makes the gap between
current config and this target vocabulary machine-visible in the meantime.
