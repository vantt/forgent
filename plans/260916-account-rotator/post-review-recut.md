# Post-review recut — Provider Capacity Rotator

Status: proposed recut after independent review.

Review source:
`plans/260916-account-rotator/reports/design-review-260916-1637-provider-capacity-rotator.md`.

Second review source: inline Reviewer 2 findings received 2026-09-16. Accepted
corrections: make `plan.md` the single implementation contract, select after
Run admission, fail closed on credential provisioning, reject project-local
account inventory, define a manual-clear door, and avoid raw credential hashes
in persisted evidence.

## Summary

The dependency direction in the design remains correct, but the first
implementation slice must be smaller.

Review disposition:

- Accepted outright: B1, H1, H2, H3 when fallback is implemented, M1-M5, M8,
  L1-L4.
- Accepted with scope limits: B2, H5, M6, M7. H6 is folded into H5.
- Withdrawn from review pressure: M4's earlier "drop sticky" conclusion was
  too broad; sticky-by-assignment stays, but only while the selected account is
  healthy and not quarantined.

Two accepted findings are blockers for the original plan:

1. `CODEX_HOME` env overlay does not select the real account on the current
   `codex-bwrap` path. The bwrap confinement driver creates a temporary
   private home, binds it to `CODEX_HOME`, then copies `auth.json` from a
   hash-selected source in `FGOS_CODEX_CREDENTIAL_HOMES`. Therefore an env
   overlay can silently disagree with the credential actually used.
2. The design introduced a six-level `modelTier` vocabulary without defining
   the bridge from the live five-level `modelPolicies`/policy-tier resolver.
   That makes Phase 04 under-specified.

## Recut first slice

First slice should solve the real quota leak without becoming PlacementPolicy:

- Add provider account inventory only. Do not add
  `providers.<provider>.models` in the first slice.
- Add global provider-capacity state and lock.
- Add account selector with LRU, assignment stickiness, and run-lifetime lease.
- Add high-confidence fault classifier for quota/rate-limit and auth failures.
- Add evidence/inspect/doctor for selected account and quarantine state.
- Wire Codex bwrap credential provisioning to the selected account.
- Fail closed before spawn if selected credential materialization fails.
- Remove the existing `FGOS_CODEX_CREDENTIAL_HOMES` hash rotation from the
  Codex bwrap path once the new selector is active.

First slice should not add:

- cross-provider fallback;
- `providerFallback`;
- `providerRuntimes`;
- `providers.<provider>.models`;
- fixed modelTier enum validation in runtime config;
- broad migration tooling;
- model-tier re-keying in production routing.

This means Phase 01 is account inventory validation, not model table
validation. The six-tier `modelTier` remains a design target in `design.md`
until the seams track has a canonical quality/minRigor bridge.

## Decisions recommended

### 1. bwrap credential mode

Use copy-credential provisioning, not bind-mounting the real account home.

Reason:

- It preserves the existing private-home confinement shape.
- It avoids exposing the whole host account home to the sandbox.
- It lets the implementation prove attribution before launch without exposing
  the real home.

Implementation target:

```text
providerCapacity.selectedAccount.credentialSource
  -> confinement request
  -> bwrap private-home provisioning
  -> copy selected auth.json into temporary CODEX_HOME
```

The bwrap driver must key off the confinement resource plus selected provider
capacity, not off executor id or `FGOS_CODEX_CREDENTIAL_HOMES`.

Credential provisioning is fail-closed. Missing source, unreadable source, or
copy failure refuses before spawn. This is a credential-provisioning/config
failure and must not quarantine the selected account.

Do not persist raw SHA-256 or any stable digest of `auth.json` bytes. If a
durable proof marker is needed, persist `credentialProvisioned: true` plus an
opaque machine-local revision/HMAC that cannot be correlated across projects.

### 2. Account inventory scope

Account inventory and provider-capacity runtime state are machine/operator
scope, not project source truth.

Recommended scope:

```text
~/.fgos/config.json
  runner.providers.<provider>.accounts

~/.fgos/runtime/provider-capacity/state.json
~/.fgos/runtime/provider-capacity/state.lock
```

Project config may keep model policy and executor/runtime policy, but shared
account credentials and quota state are per user/machine because the same
account quota is consumed across projects and worktrees.

Project-local `runner.providers.*.accounts` must be rejected, not merged. The
current global/project merge lets project config win by default; provider
account inventory must therefore be loaded with provenance and protected from
project override.

Use keyed objects for accounts, not arrays:

```jsonc
{
  "runner": {
    "providers": {
      "openai-codex": {
        "accounts": {
          "tetcu72": {
            "label": "codex/tetcu72",
            "credentialSource": {
              "kind": "codex-home",
              "home": "${HOME}/.codex-tetcu72"
            }
          }
        }
      }
    }
  }
}
```

Arrays are leaves in the existing config merge, so keyed objects are required
for sane global/project merge behavior.

### 3. Fallback ownership

Move cross-provider fallback out of this track.

Provider fallback is placement policy. It should be owned by
`executor-policy-dispatch-seams` Phase 05 / PlacementPolicy, consuming
structured capacity refusals from the rotator.

For this track:

```text
same provider, multiple accounts -> rotate
same provider exhausted -> structured capacity refusal
cross-provider fallback -> future PlacementPolicy concern
```

This avoids adding a fourth placement source beside capability `prefer`,
read-only redirects, and the planned PlacementPolicy.

`readOnlyExecutorRedirects` is the existing live static bridge. This track does
not remove or replace it in the first slice. Its explicit disposition is:

```text
keep as-is until PlacementPolicy can absorb it;
do not add a second dynamic fallback bridge in Provider Capacity Rotator;
retire readOnlyExecutorRedirects only in the PlacementPolicy migration.
```

If fallback is later implemented by PlacementPolicy, H3's governance filters
apply there: candidates must be re-admitted against disallowed providers and
required runtime class before launch.

### 4. Tier vocabulary

Keep the six-level `modelTier` vocabulary as a design target, but do not wire
it into production routing in the first slice.

First slice should leave existing model resolution alone:

```text
work tier / policy tier -> existing modelPolicies.<provider> -> model
```

The rotator selects account capacity for the already-resolved provider. It does
not choose a provider/model tier yet.

When seams introduces the canonical quality vocabulary/minRigor bridge, re-key
provider model tables once and migrate the six-level `modelTier` into the
PlacementPolicy layer.

Therefore Phase 01 must not create a second validated model table beside live
`modelPolicies`. A validated-but-unused provider model table is worse than no
table: it creates the appearance of control without affecting routing.

### 5. Runtime mapping

Do not add `providerRuntimes` as required config in this track, and do not make
it the long-term default.

In most cases the runtime identity is derivable from the selected executor
entry:

```text
provider       -> deriveProviderFamily(executor entry)
runtimeClass   -> confinement.backend === "bwrap" ? "bwrap"
               -> adapter === "herdr-spawn" ? "visible"
               -> otherwise "headless"
```

A manual runtime map is only justified for ambiguous cases where more than one
executor has the same `(provider, runtimeClass)` but different static policy,
for example `claude` vs `claude-reviewer`. Even there, the ambiguity belongs
in PlacementPolicy or executor-policy seams, not in the account rotator.

Provider Capacity Rotator's contract for future PlacementPolicy should be:

```text
input: selected provider/account family from already-admitted placement
output: selected account or structured capacity refusal
```

It should not own provider/runtime/executor placement.

## Lease correction

Lease lifetime is run lifetime, not a fixed short TTL.

Rules:

- acquire lease when selected for a run;
- release on run settlement;
- reclaim only when the owning PID/run is proven dead;
- TTL may gate how often to probe stale leases, but elapsed time alone must not
  make a live lease available.
- sticky-by-assignment is honored only when the previous account is healthy,
  not quarantined, and still present in inventory.

Ranking should prefer fewer open leases, then least recently selected, then a
stable hash tie-break:

```text
openLeases asc
lastSelectedAt asc
stableHash(seed, accountId)
```

## Fault classifier correction

Classifier should use high-confidence sources only:

- provider stderr logs;
- known adapter outcome such as `paused-limit`;
- structured agent JSON such as pi `stopReason`.

Do not scan prompt, brief, report, or general stdout for quota words.

First slice quarantine:

- quota/rate-limit -> account quarantine with parsed reset window when
  available, otherwise conservative long TTL;
- auth/login/token failure -> manual-clear quarantine;
- executor/config/test/confinement/work-product failure -> no account
  quarantine.

Unknown/low-confidence failures are evidence only.

Manual-clear quarantine needs one explicit mutation door before implementation.
`fgos doctor` may report auth quarantine but must not auto-clear it. The clear
door must target exactly one provider/account and write an audit record with
the operator, prior fault, and clear reason.

## Updated readiness

The original design is not implementation-ready as written.

The recut implementation plan now assumes these recommendations:

1. bwrap credential delivery copies selected `auth.json` into private home.
2. account inventory/state scope is global operator scope; project-local
   account inventory is rejected.
3. fallback ownership is deferred to seams PlacementPolicy.
4. six-tier modelTier remains target architecture only for now.
5. manual-clear quarantine uses one explicit audited mutation door.
