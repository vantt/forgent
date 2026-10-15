# Independent bounded runner source review

Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15

Entries: **8**. Target: `docs/platform/runner/contracts/h-b3eb60fb4d2b.md`; part 1/1. Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json`; SHA256 `de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b`. Sidecar SHA256 `5e5585731969b6dd4cca46d91935385110485d9a79ba284b9cdb9c6fcd247d61`.

Read review-brief.md, owner-answers.md A19/A22/A28/A34/A36 and the frozen runner map. Ordinary conservation review only; no truth, promotion or retirement approval. Mechanically verify every digest, anchor, ancestry, native identity, one owner and shard/pack equality. Reviewer independently selects and records seeds and IDs, reads both directions with the full diff, and labels every own note deep or mechanical. More than 3% deep rework requires full-pack deep reading. Return Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and one five-column Claim | Verdict | Note | Source digest | Target digest row per entry; full 64-hex digests, literal none for absent target, ok/rework/hold. No producer verdict, draw or seed is supplied. Consolidate source packs by the original shard before ordinary application.

A36: reviewer-drawn minimum **8/8** Weak-exact/Judgment entries for this pack, plus every unequal-digest pair. Complete batch: 494 Weak-exact and 1 Judgment; at least 75 Weak-exact plus the sole Judgment overall (per-pack minima can require more). No Unit-exact population exists. Full direct-section text is shown for headings; large single sections may span consecutive block packs, without truncating any unit. Map additions and both rebound anchors are explicitly marked on every affected section row.

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [
      "claim_ef6c4ace21b84e2eeb9de2ad200e5cfb",
      "claim_66d031f3f3d5009c11d96357e48d985a",
      "claim_95d2ecdb9d54c1d56116b65a9df0c04d",
      "claim_cb3c65b7e70173d58c23d44f7dfe0199",
      "claim_b8467c061279966217c968d3b0e21419",
      "claim_d29be3d33893c060220d82b135fcb7c0",
      "claim_2811db1449ad8dc4655f8531d5c5701e",
      "claim_5f91b173c863af29efb4d8af8c734b4c"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "mapAmendmentIDs": [],
  "reboundAnchorIDs": []
}
```

## claim_ef6c4ace21b84e2eeb9de2ad200e5cfb

Source digest: 0f54c4919dedb58d73fc7cf55e8d217fb054b04f36911b7990b6e9a78a361713

Target digest: 0f54c4919dedb58d73fc7cf55e8d217fb054b04f36911b7990b6e9a78a361713

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration",
  "sourceLines": [
    1297,
    1297
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)"
  ],
  "targetPath": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
  "targetAnchor": "executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration",
  "targetAncestry": [
    "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
  ],
  "nativeTargetClaimId": "claim_11e48676b08b7ffd0ebb5039374fc720",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ef6c4ace21b84e2eeb9de2ad200e5cfb",
    "sourceUnitDigest": "0f54c4919dedb58d73fc7cf55e8d217fb054b04f36911b7990b6e9a78a361713",
    "targetOwner": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
    "targetAnchor": "executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole heading docs/specs/runner.md#executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration (lines 1297–1297) carried at docs/platform/runner/contracts/h-b3eb60fb4d2b.md#executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "0f54c4919dedb58d73fc7cf55e8d217fb054b04f36911b7990b6e9a78a361713",
    "targetAncestry": [
      "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
    ]
  }
}
```

### Full source unit

```text
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
```

### Full target unit

```text
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
```

### Full diff

```diff
No text difference.
```

## claim_66d031f3f3d5009c11d96357e48d985a

Source digest: 5fde748feccce5cce2990f23d3f2b681442d6ec366063c45ca96204a3458fbcf

Target digest: 5fde748feccce5cce2990f23d3f2b681442d6ec366063c45ca96204a3458fbcf

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-106",
  "sourceLines": [
    1299,
    1320
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
  ],
  "targetPath": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
  "targetAnchor": "unheaded-block-3",
  "targetAncestry": [
    "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)",
    "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
  ],
  "nativeTargetClaimId": "claim_f1e4c309467523897e0a16ee8ba9619d",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_66d031f3f3d5009c11d96357e48d985a",
    "sourceUnitDigest": "5fde748feccce5cce2990f23d3f2b681442d6ec366063c45ca96204a3458fbcf",
    "targetOwner": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-106 (lines 1299–1320) carried at docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-3. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "5fde748feccce5cce2990f23d3f2b681442d6ec366063c45ca96204a3458fbcf",
    "targetAncestry": [
      "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)",
      "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
    ]
  }
}
```

### Full source unit

```text
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
```

### Full target unit

```text
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
```

### Full diff

```diff
No text difference.
```

## claim_95d2ecdb9d54c1d56116b65a9df0c04d

Source digest: a1e669c10b27c418810291736bbd23a74f0b8a1519cb89bd800b657e59eb921a

Target digest: a1e669c10b27c418810291736bbd23a74f0b8a1519cb89bd800b657e59eb921a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-107",
  "sourceLines": [
    1322,
    1323
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
  ],
  "targetPath": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
  "targetAnchor": "unheaded-block-4",
  "targetAncestry": [
    "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)",
    "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
  ],
  "nativeTargetClaimId": "claim_7dbe4219d38532d1dd336463c5e91174",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_95d2ecdb9d54c1d56116b65a9df0c04d",
    "sourceUnitDigest": "a1e669c10b27c418810291736bbd23a74f0b8a1519cb89bd800b657e59eb921a",
    "targetOwner": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
    "targetAnchor": "unheaded-block-4",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-107 (lines 1322–1323) carried at docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-4. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a1e669c10b27c418810291736bbd23a74f0b8a1519cb89bd800b657e59eb921a",
    "targetAncestry": [
      "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)",
      "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
    ]
  }
}
```

### Full source unit

```text
**ExecutorProfile** answers "which principal/backend/trust boundary is
this?" — a stable runtime boundary, never a policy choice:
```

### Full target unit

```text
**ExecutorProfile** answers "which principal/backend/trust boundary is
this?" — a stable runtime boundary, never a policy choice:
```

### Full diff

```diff
No text difference.
```

## claim_cb3c65b7e70173d58c23d44f7dfe0199

Source digest: 8b4bfaca15661a77c17a4085af210b9fd239a810c76d1c086f4978b30249c2ef

Target digest: 8b4bfaca15661a77c17a4085af210b9fd239a810c76d1c086f4978b30249c2ef

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-108",
  "sourceLines": [
    1325,
    1330
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
  ],
  "targetPath": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
  "targetAnchor": "unheaded-block-5",
  "targetAncestry": [
    "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)",
    "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
  ],
  "nativeTargetClaimId": "claim_5daa6a9da3f29df9be6c1b8c4eb9f9aa",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_cb3c65b7e70173d58c23d44f7dfe0199",
    "sourceUnitDigest": "8b4bfaca15661a77c17a4085af210b9fd239a810c76d1c086f4978b30249c2ef",
    "targetOwner": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-108 (lines 1325–1330) carried at docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-5. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8b4bfaca15661a77c17a4085af210b9fd239a810c76d1c086f4978b30249c2ef",
    "targetAncestry": [
      "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)",
      "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
    ]
  }
}
```

### Full source unit

```text
| Field | Answers | Must NOT be derived from |
|---|---|---|
| `identity.principalRef` | which account/credential family | a concrete rotating account id (Provider Capacity Rotator's own scope, `plans/260916-account-rotator/`) |
| `identity.runtimeBackendRef` | which CLI/runtime this is | model, quality tier, reasoning effort |
| `identity.trustDomain` | how privileged this principal is | persona/role/business case |
| `identity.egressClass` | what it may reach over the network | visibility (visible/headless) alone |
```

### Full target unit

```text
| Field | Answers | Must NOT be derived from |
|---|---|---|
| `identity.principalRef` | which account/credential family | a concrete rotating account id (Provider Capacity Rotator's own scope, `plans/260916-account-rotator/`) |
| `identity.runtimeBackendRef` | which CLI/runtime this is | model, quality tier, reasoning effort |
| `identity.trustDomain` | how privileged this principal is | persona/role/business case |
| `identity.egressClass` | what it may reach over the network | visibility (visible/headless) alone |
```

### Full diff

```diff
No text difference.
```

## claim_b8467c061279966217c968d3b0e21419

Source digest: 770f4acda1f192cd4b53aaf5f746e4952661815dd5222849df64c42cf039e297

Target digest: 770f4acda1f192cd4b53aaf5f746e4952661815dd5222849df64c42cf039e297

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-109",
  "sourceLines": [
    1332,
    1339
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
  ],
  "targetPath": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
  "targetAnchor": "unheaded-block-6",
  "targetAncestry": [
    "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)",
    "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
  ],
  "nativeTargetClaimId": "claim_262fc1bca43a504fec7b1c035328b022",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b8467c061279966217c968d3b0e21419",
    "sourceUnitDigest": "770f4acda1f192cd4b53aaf5f746e4952661815dd5222849df64c42cf039e297",
    "targetOwner": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
    "targetAnchor": "unheaded-block-6",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-109 (lines 1332–1339) carried at docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-6. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "770f4acda1f192cd4b53aaf5f746e4952661815dd5222849df64c42cf039e297",
    "targetAncestry": [
      "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)",
      "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
    ]
  }
}
```

### Full source unit

```text
**Invocation** answers "how is this profile actually used for one dispatch?":
adapter (`cli-spawn`/`herdr-spawn`/mcp/api), prompt delivery (argv vs
file-pointer), visible/headless mode, confinement backend/envelope, resource
bindings, provider adapter id. Confinement is normally an invocation
envelope, not identity — it only becomes identity when it changes principal,
backend trust, or egress boundary materially (the same rule design.md's
ProviderAdapter section already states for the shadow-mode Phase 01 module,
`src/runner/dispatch/provider-adapter.mjs`).
```

### Full target unit

```text
**Invocation** answers "how is this profile actually used for one dispatch?":
adapter (`cli-spawn`/`herdr-spawn`/mcp/api), prompt delivery (argv vs
file-pointer), visible/headless mode, confinement backend/envelope, resource
bindings, provider adapter id. Confinement is normally an invocation
envelope, not identity — it only becomes identity when it changes principal,
backend trust, or egress boundary materially (the same rule design.md's
ProviderAdapter section already states for the shadow-mode Phase 01 module,
`src/runner/dispatch/provider-adapter.mjs`).
```

### Full diff

```diff
No text difference.
```

## claim_d29be3d33893c060220d82b135fcb7c0

Source digest: dfa2fbd2381337a7bc8440220851e83137d4ebf9014eb9e18bc6d9161a615964

Target digest: dfa2fbd2381337a7bc8440220851e83137d4ebf9014eb9e18bc6d9161a615964

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-110",
  "sourceLines": [
    1341,
    1345
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
  ],
  "targetPath": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
  "targetAnchor": "unheaded-block-7",
  "targetAncestry": [
    "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)",
    "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
  ],
  "nativeTargetClaimId": "claim_81324337002b28be819370d2e4c48274",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d29be3d33893c060220d82b135fcb7c0",
    "sourceUnitDigest": "dfa2fbd2381337a7bc8440220851e83137d4ebf9014eb9e18bc6d9161a615964",
    "targetOwner": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-110 (lines 1341–1345) carried at docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-7. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "dfa2fbd2381337a7bc8440220851e83137d4ebf9014eb9e18bc6d9161a615964",
    "targetAncestry": [
      "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)",
      "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
    ]
  }
}
```

### Full source unit

```text
Migration targets a legacy config entry maps onto once every executor
consolidates onto this vocabulary (Phase D/E of
`plans/260917-executor-profile-schema-migration/plan.md`, not yet — the
`identity`/`supports` fields being real config, above, is not the same as
this consolidation happening):
```

### Full target unit

```text
Migration targets a legacy config entry maps onto once every executor
consolidates onto this vocabulary (Phase D/E of
`plans/260917-executor-profile-schema-migration/plan.md`, not yet — the
`identity`/`supports` fields being real config, above, is not the same as
this consolidation happening):
```

### Full diff

```diff
No text difference.
```

## claim_2811db1449ad8dc4655f8531d5c5701e

Source digest: fc05b724a8cf91d0a56fcedb8c1f936f8771e44e77ae345055e5525b8bdf6bc5

Target digest: fc05b724a8cf91d0a56fcedb8c1f936f8771e44e77ae345055e5525b8bdf6bc5

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-111",
  "sourceLines": [
    1347,
    1354
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
  ],
  "targetPath": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
  "targetAnchor": "unheaded-block-8",
  "targetAncestry": [
    "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)",
    "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
  ],
  "nativeTargetClaimId": "claim_8cb585efea1f1cc6e6e491cc1699702e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_2811db1449ad8dc4655f8531d5c5701e",
    "sourceUnitDigest": "fc05b724a8cf91d0a56fcedb8c1f936f8771e44e77ae345055e5525b8bdf6bc5",
    "targetOwner": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
    "targetAnchor": "unheaded-block-8",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-111 (lines 1347–1354) carried at docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-8. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "fc05b724a8cf91d0a56fcedb8c1f936f8771e44e77ae345055e5525b8bdf6bc5",
    "targetAncestry": [
      "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)",
      "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
    ]
  }
}
```

### Full source unit

```text
| Legacy pattern | Target |
|---|---|
| policy-shaped flag hardcoded in `executors.<id>` args (`--model`, `--effort`, `--allowedTools`, `--permission-mode`, Codex `-s`, …) | `ProviderAdapter` runtime option (design.md §3.5) |
| role/persona baked into an executor id (`claude-reviewer`) | a compatibility alias patch (Phase 03, `LEGACY_EXECUTOR_ALIASES` in `src/runner/dispatch/assignment-policy.mjs`) carrying `personaRef`/`toolIntent`/`reasoningEffort` |
| legacy model overrides on an executor | `runner.modelPolicies.<provider>` tier entry |
| adapter choice encoded as a separate executor id | an `invocation` on one `ExecutorProfile` |
| bwrap/confinement encoded as a separate executor id | an invocation's confinement envelope, unless trust/egress genuinely differs |
| account pool / credential home env on an executor (e.g. the retired `FGOS_CODEX_CREDENTIAL_HOMES`) | Provider Capacity Rotator's global `runner.providers.<provider>.accounts` inventory (`plans/260916-account-rotator/`) |
```

### Full target unit

```text
| Legacy pattern | Target |
|---|---|
| policy-shaped flag hardcoded in `executors.<id>` args (`--model`, `--effort`, `--allowedTools`, `--permission-mode`, Codex `-s`, …) | `ProviderAdapter` runtime option (design.md §3.5) |
| role/persona baked into an executor id (`claude-reviewer`) | a compatibility alias patch (Phase 03, `LEGACY_EXECUTOR_ALIASES` in `src/runner/dispatch/assignment-policy.mjs`) carrying `personaRef`/`toolIntent`/`reasoningEffort` |
| legacy model overrides on an executor | `runner.modelPolicies.<provider>` tier entry |
| adapter choice encoded as a separate executor id | an `invocation` on one `ExecutorProfile` |
| bwrap/confinement encoded as a separate executor id | an invocation's confinement envelope, unless trust/egress genuinely differs |
| account pool / credential home env on an executor (e.g. the retired `FGOS_CODEX_CREDENTIAL_HOMES`) | Provider Capacity Rotator's global `runner.providers.<provider>.accounts` inventory (`plans/260916-account-rotator/`) |
```

### Full diff

```diff
No text difference.
```

## claim_5f91b173c863af29efb4d8af8c734b4c

Source digest: 8effb31b306362d3a2022b786937e6f66411717f00e1e3679117d7fa3cdf6e4d

Target digest: 8effb31b306362d3a2022b786937e6f66411717f00e1e3679117d7fa3cdf6e4d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-112",
  "sourceLines": [
    1356,
    1360
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
  ],
  "targetPath": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
  "targetAnchor": "unheaded-block-9",
  "targetAncestry": [
    "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)",
    "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
  ],
  "nativeTargetClaimId": "claim_9813f6e4e9a87964c55786e36424572e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "executorprofile-invocation-target-vocabulary-phase-06-executor-policy-dispatch-seams-identitysupports-made-real-config-phase-c-executor-profile-schema-migration",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5f91b173c863af29efb4d8af8c734b4c",
    "sourceUnitDigest": "8effb31b306362d3a2022b786937e6f66411717f00e1e3679117d7fa3cdf6e4d",
    "targetOwner": "docs/platform/runner/contracts/h-b3eb60fb4d2b.md",
    "targetAnchor": "unheaded-block-9",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-112 (lines 1356–1360) carried at docs/platform/runner/contracts/h-b3eb60fb4d2b.md#unheaded-block-9. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8effb31b306362d3a2022b786937e6f66411717f00e1e3679117d7fa3cdf6e4d",
    "targetAncestry": [
      "Added in candidate: Runner ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)",
      "ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration)"
    ]
  }
}
```

### Full source unit

```text
A later migration (Phase E) can map `claude` + `claude-reviewer` +
`claude-reviewer-herdr` and similar id families into one `ExecutorProfile`
with multiple invocations, but that consolidation has not happened —
`fgos doctor`'s `executor-profile-warnings` check makes the gap between
current config and this target vocabulary machine-visible in the meantime.
```

### Full target unit

```text
A later migration (Phase E) can map `claude` + `claude-reviewer` +
`claude-reviewer-herdr` and similar id families into one `ExecutorProfile`
with multiple invocations, but that consolidation has not happened —
`fgos doctor`'s `executor-profile-warnings` check makes the gap between
current config and this target vocabulary machine-visible in the meantime.
```

### Full diff

```diff
No text difference.
```
