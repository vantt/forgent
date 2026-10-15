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

> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: R9-5: remove decisions-placement boilerplate from non-decision carrier.

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
same file) that survive `resolveExecutorAndOverrides` unchanged. **Added in
candidate — current-state correction:** `supports.reasoningEffort` is consumed
by `resolveExecutorCommand` when validating the requested effort; identity
remains validated profile metadata, so the former blanket “no consumer”
statement is stale. The archived migration plan records Phases A–E merged,
including executor-id consolidation. The legacy reviewer ids no longer exist
as registered executors; `EXECUTOR_KINDS` is now `agent|tool`. These facts
come from code and the completed plan, without reading live configuration.
Evidence: `src/runner/dispatch/transport.mjs:176`,
`src/runner/dispatch/assignment-policy.mjs:88-98`,
`src/runner/dispatch/config.mjs:457`, and
`archive/plans/260917-executor-profile-schema-migration/plan.md:1-14,733-741`.

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

**Added in candidate — migration status correction:** The following table
records the migration mapping, rather than a migration still awaiting Phase
D/E. The completed archived plan records consolidation as merged
(`archive/plans/260917-executor-profile-schema-migration/plan.md:1-14,733-741`):

| Legacy pattern | Target |
|---|---|
| policy-shaped flag hardcoded in `executors.<id>` args (`--model`, `--effort`, `--allowedTools`, `--permission-mode`, Codex `-s`, …) | `ProviderAdapter` runtime option (design.md §3.5) |
| role/persona baked into an executor id (`claude-reviewer`) | Former compatibility alias patch; retired after consolidation. Callers now declare invocation/policy explicitly (`src/runner/dispatch/assignment-policy.mjs:88-98`). |
| legacy model overrides on an executor | `runner.modelPolicies.<provider>` tier entry |
| adapter choice encoded as a separate executor id | an `invocation` on one `ExecutorProfile` |
| bwrap/confinement encoded as a separate executor id | an invocation's confinement envelope, unless trust/egress genuinely differs |
| account pool / credential home env on an executor (e.g. the retired `FGOS_CODEX_CREDENTIAL_HOMES`) | Provider Capacity Rotator's global `runner.providers.<provider>.accounts` inventory (`plans/260916-account-rotator/`) |

**Added in candidate — consolidation correction:** Phase E is complete;
the archived plan records `claude`/`codex`/`agy` as multi-invocation
executors and the former separate ids as removed. The assignment-policy
module confirms retirement of its legacy-id alias seam. The doctor warning
check remains a migration diagnostic, not evidence that Phase E is pending.
Evidence: `archive/plans/260917-executor-profile-schema-migration/plan.md:733-741`
and `src/runner/dispatch/assignment-policy.mjs:88-98`.
