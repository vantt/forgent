# Design review — Provider Capacity Rotator

Reviewed: `plans/260916-account-rotator/design.md`, `plan.md` (2026-09-16).
Context read per `review-prompt.md`; code inspected: `.fgos/config.json`,
`src/runner/dispatch/{config,plan,resolve,assignment-policy,assignment-runner,transport,run-result,run-lock}.mjs`,
`src/runner/dispatch/confinement/{drivers/bwrap,resources,policies}.mjs`,
`src/config/global-config.mjs`, `src/setup/{config-merge,registrations}.mjs`,
`src/state/fgos-file-registry.mjs`, plus real quota evidence under `.fgos/assignments/`.

Verdict up front: the dependency direction is right, but the design does not
match the live confinement path that carries almost all Codex dispatch today,
and it leaves the tier bridge undefined for the first slice. Two blockers, six
highs. Re-cut the first slice and it becomes small and safe; the long-term
architecture (six-tier target vocabulary, provider fallback boundary) stays.

## 0. Disposition (fair reading, after a second pass)

| Finding | Disposition | Boundary |
|---|---|---|
| B1 bwrap overlay dead | accept, blocker | code-confirmed; rotator would record one account and run another |
| B2 tier bridge missing | accept partially | keep six-tier as *target* vocabulary; slice 1 simply does not wire it into production routing |
| H1 state scope | accept | quota is per account per machine; state + inventory are user scope |
| H2 lease TTL | accept | lease = run lifetime; TTL only gates the dead-pid probe |
| H3 fallback governance | accept, deferred with fallback | only matters when fallback is implemented |
| H4 classifier inputs | accept, scoped | slice 1 = high-confidence stderr/provider patterns for quota + auth only; no full adapter-outcome parsing |
| H5 fallback/runtimes placement | accept for slice 1 only | fallback belongs to PlacementPolicy, but the design must keep the rotator↔fallback contract so PlacementPolicy can call it later; not deleted from the architecture |
| H6 opt-in knob | folds into H5 | no key needed while fallback is out of the track |
| M1 env keys per CLI | accept, scoped | slice 1 rotates one CLI family per provider |
| M2 table disagreement | accept | one table |
| M3 accounts array | accept | keyed object |
| M4 sticky semantics | accept | define or drop |
| M5 retry loop | accept | rotator quarantines + refuses; retry stays with recovery/coordination |
| M6 `executionKind` | accept partially | design keeps the two named branches (provider-backed agent vs tool/MCP); implementation uses existing `executor.kind` + `mechanism`, no new field |
| M7 naming | accept on naming only | do not touch `EffectiveExecutionIntent` until the seams track reaches it |
| M8 Codex-only relief | accept | say it plainly |
| L1–L4 | accept | minor |

## 1. Findings

### B1 — blocker — account env overlay is dead under `bwrap`; two rotators; quarantine mis-attribution

- Where: design §Config shape (`accounts[].env.CODEX_HOME`), §Dispatch
  integration ("overlay only selected account env keys"); code
  `src/runner/dispatch/confinement/drivers/bwrap.mjs:21-80` (`CODEX_HOME_CREDENTIAL_EXECUTOR_IDS`,
  `configuredCodexCredentialHomes`, `provisionCodexCredential`), `:397`, `:415-425`;
  `.fgos/config.json` `executors.codex-bwrap.invocations[].env.FGOS_CODEX_CREDENTIAL_HOMES`
  + `resourceBindings[private-home -> env CODEX_HOME]`.
- Why: for every `runtimeClass: bwrap` run (today: `code:review`, `code:debug`,
  the read-only redirect pool — i.e. the main Codex volume) the bwrap driver
  allocates a per-dispatch temp `private-home`, then sets
  `resolvedEnv.CODEX_HOME = <temp home>` from the resource binding, which
  overwrites any overlay. The credential is *copied in* (`auth.json`) from a
  home picked by `stableIndex(dispatchId)` over `FGOS_CODEX_CREDENTIAL_HOMES`.
  Consequences: (a) Phase 04 as written is a silent no-op on the main path;
  (b) the bwrap driver keeps its own stateless rotation; (c) the rotator's
  state/evidence would say `tetnu` while the sandbox ran on `fgovn`'s token,
  so quarantines land on the wrong account; (d) `FGOS_CODEX_CREDENTIAL_HOMES`
  in an executor env block already *is* the `executors.<id>.accountPool` the
  plan forbids, and the executor-id allowlist is an executor→account arrow in
  code. Neither is mentioned for retirement.
- Minimal correction: make the selection output carry a provider-agnostic
  `credentialSource` (the account's home path or file) and thread it through
  the confinement request; bwrap provisioning keys on
  `res.resource === 'private-home' && request.providerCapacity?.credentialSource`,
  not on executor id or env. Phase 07 deletes `FGOS_CODEX_CREDENTIAL_HOMES`,
  `CODEX_HOME_CREDENTIAL_EXECUTOR_IDS`, and the hash rotation. Add a test:
  sha256 of the `auth.json` placed in the private-home equals sha256 of the
  selected account's `auth.json`; record that digest in evidence (not the path).

### B2 — blocker — policyTier → modelTier bridge is undefined; third ordinal tier vocabulary

- Where: design §Tier vocabulary, §Existing capability in context
  (`minModelTier`), §Config shape (`providers.<p>.models`); code
  `assignment-policy.mjs:96-131` (`effectiveTier` ∈ `MODEL_POLICY_TIERS`),
  `resolve.mjs:104` (`resolvePolicyTierModel` reads `modelPolicies.<p>.<tier>`),
  `config.mjs:457,1196-1202` (`modelPolicies` or `models` is *required*),
  seams design §3.2 (`minRigor` 4-level + nominal `mode`).
- Why: the effective policy already resolves provider + `tier` + `model`
  through `modelPolicies`. The design never states how `tier`
  (`lightweight|standard|creative|analytical|critical`) becomes `modelTier`,
  what wins when capability `minModelTier` and policy `tier` disagree, or which
  table produces the model when both `modelPolicies.<p>` and
  `providers.<p>.models` exist (they will — `modelPolicies` cannot be removed).
  `creative` is nominal (seams splits it into `mode`) and has no ordinal slot.
  `standard` now means four different things in one file (work tier, policy
  tier, minRigor, modelTier). Phase 04 cannot be implemented from the text.
- Minimal correction: keep the six-tier enum as the *target* vocabulary in the
  design, but do not wire it into production routing in slice 1. Slice 1 keeps
  resolving the model exactly as today (`modelPolicies.<p>.<policyTier>`); the
  rotator receives the already-resolved provider and only picks an account.
  Before the tier becomes live (a later slice, after seams Phase 04 lands
  `minRigor`), the design must add: an explicit tested bridge
  `policyTier/minRigor -> modelTier`, a precedence rule
  (`max(capability floor, policy tier)`), a stated winner between
  `modelPolicies.<p>` and `providers.<p>.models`, and a rename for `standard`
  to avoid the four-way collision.

### H1 — high — state scope is per-checkout, but accounts are per-user/machine

- Where: design §State (`.fgos/runtime/provider-capacity/`); `git worktree list`
  (10 live worktrees), cell worktrees carry their own `.fgos/`
  (`~/projects/executor-policy-dispatch-seams-cell-01/.fgos/config.json`);
  AGENTS.md D-ADR0035 (fgOS runs globally on other projects).
- Why: one Codex account's quota is shared by every project and worktree on
  the machine. Per-checkout LRU/quarantine cannot see each other, so
  `parallel.maxRoots 4 × maxLeavesPerRoot 4` across worktrees re-concentrates,
  and a quarantine learned in one project is unknown in the next.
- Minimal correction: state + lock under `~/.fgos/runtime/provider-capacity/`
  (user scope), registered through `FGOS_FILE`; account inventory belongs in
  global `~/.fgos/config.json` (deep-merge in `src/setup/config-merge.mjs`
  fills it into any project); project config keeps model tables only.

### H2 — high — lease TTL shorter than a run; contradicts the repo's lock doctrine

- Where: design §Config `leaseTtlMs: 900000`; `.fgos/config.json runner.timeoutMs: 2100000`;
  `src/runner/dispatch/run-lock.mjs:19-23` ("a live PID remains HELD no matter
  how stale… reclaim decision is PID-dead proof, never elapsed time alone").
- Why: a 15-minute lease expires while the 35-minute run is still on that
  account, so the account is re-offered under load — exactly when
  concentration matters. "Expired leases are ignored" reintroduces the bug the
  runtime-recovery track corrected.
- Minimal correction: lease lifetime = Run lifetime (release on settle; reclaim
  only when `isProcessAlive(pid)` is false, TTL only gates the probe). Reuse
  `run-lock.mjs`. State what a lease does in ranking: sort by
  `(openLeases asc, lastSelectedAt asc, stableHash(seed, id))`; never refuse
  when every account is leased unless an explicit per-account cap is set.

### H3 — high — cross-provider fallback skips governance and runtime-class re-admission

- Where: `assignment-policy.mjs:329-337` (`disallowedProviders` checked before
  capacity), `resolve.mjs` RUL63 `allowCrossProvider` (checked on resolved
  command), design §Config example (`gemini` has no `bwrap`), §Safety invariant 8
  (fail closed only on missing modelTier).
- Why: if capacity changes provider after policy resolution, governance was
  admitted against the wrong provider; a fallback provider lacking the required
  runtime class is not addressed — the only outcomes are refuse or downgrade.
- Minimal correction: selector receives `disallowedProviders` and the required
  runtimeClass as filters; a candidate missing the runtimeClass is skipped with
  a reason code, never downgraded; executor re-resolution goes through
  `resolveExecutorConfig` so RUL63 still fires. (Moot if H5 is accepted.)

### H4 — high — fault classifier inputs do not exist; real signals are elsewhere; stdout matching will false-positive

- Where: design §Fault classification (`adapterError.kind`, `completion.kind`,
  `stdout`); `run-result.mjs:318-341` (any non-zero exit → `provider/nonzero-process-exit`,
  test failures included); real quota run
  `.fgos/assignments/asgn_codex_coordinator_op_104/runs/01/run.json` →
  `exitCode: null, failure: null`, quota text only in `stderr.log`;
  `herdr-round.mjs:329` maps `paused-limit` → `worker-timeout`.
- Real patterns found in evidence: Codex CLI stderr
  `ERROR: You've hit your usage limit…` (104 occurrences); pi JSON
  `"stopReason":"error","errorMessage":"Codex error: The usage limit has been reached"`;
  agy `error: Individual quota reached… Resets in 3h` (reset window present);
  Claude via herdr: `paused-limit` outcome. Prompts/briefs/reports also contain
  "quota failure", "hit quota" as narrative — scanning stdout or the brief will
  quarantine healthy accounts.
- Minimal correction (scoped — do not over-design the classifier): slice 1
  classifies from stderr only, with anchored, per-provider allowlisted patterns
  for quota and auth, backed by fixture tests cut from these logs; never
  stdout/prompt. Parsing `Resets in Nh`, the herdr `paused-limit` outcome, pi
  `stopReason`, and a new RunResult `failure.code` are follow-ups once the
  stderr path is proven, not slice-1 scope.

### H5 — high — `providerFallback` + `providerRuntimes` are a fourth placement source

- Where: seams design §3.6 PlacementPolicy (`providerPreference.allow`,
  `fallback: {on: ["capacity","transient"], maxAttempts}`), seams plan close
  criteria ("no production path has a fourth hidden placement source"),
  live `runner.readOnlyExecutorRedirects` (`assignment-runner.mjs:231-251`),
  `capabilities.*.prefer`.
- Why: provider fallback *is* placement. Adding provider-keyed fallback and a
  provider→executor map beside `prefer`, `readOnlyExecutorRedirects`, and the
  planned PlacementPolicy recreates the scatter the seams track exists to
  remove. `legacyExecutorRuntimeProjection` is also unnecessary: provider is
  `deriveProviderFamily(entry)`, runtimeClass is `confinement.backend === 'bwrap'`
  → `bwrap`, `adapter === 'herdr-spawn'` → `visible`, else `headless`.
- Minimal correction (slice-1 scope only — not a deletion from the
  architecture): the rotator implements *account selection inside an
  already-chosen provider* and returns a structured capacity refusal. Provider
  fallback is implemented by PlacementPolicy's `fallback.on: capacity` (seams
  Phase 05) consuming that refusal. Until then `readOnlyExecutorRedirects`
  remains the single static cross-provider bridge. The design keeps its
  fallback section as the *boundary contract* PlacementPolicy will call —
  input (provider, tier, runtimeClass, disallowedProviders), output (selection
  or refusal with reason codes) — but `providerFallback`, `providerRuntimes`,
  and `legacyExecutorRuntimeProjection` are not implemented in this track.

### H6 — high — no opt-in knob for fallback exists in the planned phases

- Where: design "Cross-provider fallback is opt-in per effective execution
  need/operator policy"; `config.mjs:1040` capability keys are closed
  (`description, aliases, prefer, overrides, confinement`); plan Phases 01-07
  add no such key.
- Why: Phase 04 cannot know whether fallback is allowed. Moot if H5 is
  accepted; otherwise name exactly one key and its scope.

### M1 — medium — account env keys are per CLI runtime, not per provider

- Where: `.fgos/config.json`: `openai-codex` runs through `codex`
  (`CODEX_HOME`) and `pi`/`codex-pi`/`pi-herdr` (own auth store, no env);
  `z-ai` runs the `claude` CLI with `ANTHROPIC_AUTH_TOKEN=${GLM_OPENROUTER_API_KEY}`;
  `gemini` uses `HOME` itself. Design §Operability
  `provider-capacity-env-keys` ("no secret-looking keys").
- Why: one `accountEnvKeys` per provider assumes one CLI per provider. The
  z-ai account overlay is inherently a credential-shaped key name and would be
  rejected by the doctor rule as written. `HOME` overlay has a large blast
  radius (already true today, but the design should say the agy account *is*
  a HOME).
- Minimal correction: slice 1 rotates only providers whose executors share one
  `command` (doctor check); rule = env *values* must be `${VAR}` references or
  paths, key names may be credential-shaped; pi executors are implicitly
  single-account. The secret scrubber in `effective-execution-contract.mjs`
  (`SECRET_KEY_PATTERN`) already handles the evidence side.

### M2 — medium — the design's own tables disagree

- Where: §Initial provider mapping (Claude `advanced` = "Opus medium") vs the
  dogfood jsonc (`advanced: sonnet`, no `frontier`) vs §Config shape
  (`frontier: opus`). §Runtime example falls back to `claude/opus @ frontier`,
  which fails closed under the dogfood table.
- Correction: one table; the runtime example must run against it.

### M3 — medium — `accounts` as an array defeats global/project merge

- Where: `src/setup/config-merge.mjs:11-15` ("ARRAYS ARE LEAVES").
- Why: a project array masks the global list wholesale; ids are not unique by
  construction.
- Correction: keyed object `accounts: { tetnu: {...} }`.

### M4 — medium — sticky-by-assignment is undefined against quarantine, retry and multi-round sessions

- Where: design §Selection policy, §Config `sticky: "assignment"`.
- Why: sticky beats LRU, so a long CoordinationSession pins one account; a
  retry after a quota fault would re-pick the quarantined account unless
  stated. The reason for stickiness (Codex session continuity in
  `CODEX_HOME`?) is not given.
- Correction: sticky only when the previous account is healthy and
  un-quarantined; state the reason or drop it from slice 1.

### M5 — medium — the rotator must not own a retry loop

- Where: plan Phase 04 "retry within configured attempt limits if safe";
  evidence `docs/architect/... "Doer hit the account's own Claude usage/session
  limit mid-produce, leaving real uncommitted work"`.
- Why: quota strikes mid-mutation; "safe" is exactly what `recovery.mjs` /
  `repeatMode` already decide.
- Correction: rotator quarantines at settle and returns a structured refusal
  on the next selection; retry policy stays with the recovery matrix.

### M6 — medium — `executionKind` duplicates existing discriminators

- Where: design §Tool executor boundary; `plan.mjs:186-195` (mcp-handback →
  `in-process` before any transport), `executors.<id>.kind`.
- Correction: the design keeps the two named branches (provider-backed agent
  vs tool/MCP) — that boundary is correct and already holds in code. The
  implementation should express it through existing `executor.kind` +
  `mechanism` (`kind !== 'agent'` or `mechanism !== 'out-of-process'` →
  bypass) rather than a new `executionKind` field.

### M7 — medium — third "Effective Execution *" name

- Where: `EffectiveExecutionNeed` (this design), `EffectiveExecutionIntent`
  (seams §3.1), `effective-execution-contract.mjs` (existing, persisted).
- Correction: naming only — plan to add `providerPreference`/`modelTier`/
  `runtimeClass`/`allowProviderFallback` as fields of `EffectiveExecutionIntent`
  when the seams track reaches that object; slice 1 does not touch Intent. The
  design's statement that it is code-internal is clear.

### M8 — medium — rotation relieves only Codex today

- Where: `.fgos/config.json`: Codex has 3-4 homes; Claude 1 (`claude/main`);
  agy 1 (`mucdong`).
- Why: for Claude and agy, same-provider rotation is a no-op; only more
  accounts or fallback helps. The design should say so plainly so the operator
  does not expect Claude relief from Phase 07.

### L1 — low — evidence

Shape is fine. Add the credential-source digest (B1) to prove attribution.
`~/.fgos/runtime/.../state.json` must also avoid absolute homes (inspect prints it).

### L2 — low — `provider-singleton-warning` will be permanently noisy

Claude and gemini are singletons by fact. Make it informational unless the
provider carries more than N dispatches/day or sits in a fallback chain.

### L3 — low — config example contradicts the stated first-slice rule

`faultPolicy.unavailable: 600000` and `transient-provider-error: 120000` appear
in the example while the text says slice 1 quarantines only quota/auth.

### L4 — low — missing tests

bwrap attribution (B1); cross-worktree/global state (H1); stderr-only
classifier false-positive on narrative "quota" text (H4); governance after
fallback (H3); lease survives past `leaseTtlMs` while pid alive (H2).

## 2. Simplicity verdict

Not simple yet. As written the track adds three top-level maps
(`providers`, `providerFallback`, `providerRuntimes`), a bridge table
(`legacyExecutorRuntimeProjection`), a sixth tier vocabulary, and per-provider
`selection`/`faultPolicy` knobs — while `modelPolicies`, `readOnlyExecutorRedirects`,
`allowCrossProvider`, and the bwrap credential pool keep living beside them.

Keep for slice 1:

- `runner.providers.<p>.accounts` (keyed object, global config, `accountEnvKeys`,
  optional `credentialSource`).
- optional `runner.providers.<p>.faultPolicy` limited to `quota-exhausted` and
  `authentication-failed`.

Postpone (stay in the design as target, not implemented in this track):

- `providerFallback`, `providerRuntimes`, `legacyExecutorRuntimeProjection` →
  implemented by seams Phase 05 PlacementPolicy against the rotator's refusal
  contract.
- `modelTier` enum and `providers.<p>.models` → target vocabulary; slice 1
  keeps `modelPolicies.<p>` as the live model table.
- `selection` block → hardcode LRU + run-lifetime lease; no strategy knob.
- `unavailable` / transient cooldowns.
- `sticky` unless a reason is recorded.

## 3. Implementation readiness

**Not ready as written** (B1, B2). **Ready with changes** if the first slice is
re-cut as below — every step is additive and Phase 00 snapshot-neutral (no
model, argv, or env-key change; `CODEX_HOME` is already in the env-key set).

Smallest safe slice:

1. Config: `runner.providers.<p>.accounts` (keyed), `accountEnvKeys`,
   validation of cross-leak fields; register default (inert) via
   `registerConfigDefault`.
2. Pure selector + state/lock at `~/.fgos/runtime/provider-capacity/`
   (`FGOS_FILE` entry; `run-lock.mjs` primitives; lease = run lifetime;
   ranking `(openLeases, lastSelectedAt, hash)`).
3. Hook: after `resolveAssignmentDispatchPolicy` yields `providerModel`, select
   an account for that provider only. Unconfined executors: overlay
   `accountEnvKeys`. Confined (`bwrap`): pass `credentialSource` in the
   confinement request; bwrap provisioning reads it; delete
   `FGOS_CODEX_CREDENTIAL_HOMES` + executor allowlist + hash rotation.
4. Settle: stderr/adapter-outcome classifier for quota + auth only; RunResult
   `failure.code`; quarantine with reset-window TTL when parsed.
5. Evidence: requested/selected provider (same in slice 1), account id/label,
   env key names, credential digest, reason codes.
6. Doctor: `provider-capacity-shape`, `provider-capacity-env-keys` (values
   rule), `provider-capacity-state-readable`, `provider-capacity-quarantine`.
7. Dogfood: move the Codex homes into global config accounts; strip
   `CODEX_HOME` literals from `codex-cli`/`codex-herdr`/`codex-readonly`.

Sequence against the seams track: land 1-2 now (new files only). Land 3 after
seams Phase 01 ProviderAdapter merges, so the env overlay enters through its
`envPatch` rather than a parallel edit of `transport.mjs`/`assignment-runner.mjs`
(cells 01/02 are live in worktrees on those files).

## 4. Open questions

Operator decisions, not accepted on the reviewer's own authority:

1. bwrap credential delivery: copy `auth.json` (today) or bind-mount the real
   account home? Security/confinement decision. Reviewer leans copy — it keeps
   the private-home isolation intact. Determines the shape of
   `credentialSource` in B1.
2. Account inventory: global `~/.fgos/config.json` (reviewer leans strongly
   global) with project allowed to override model/runtime tables but never
   accounts? Determines H1/M3 and Phase 07's target file.
3. Fallback: stay in this track (then H3/H6 must be solved here) or move to
   seams Phase 05 with the rotator exposing only the refusal contract?
   Reviewer leans Phase 05. This is the Q12 answer.
4. Six-tier `modelTier`: keep as target vocabulary, not wired in slice 1
   (reviewer's recommendation), or wire now with the bridge from B2?
