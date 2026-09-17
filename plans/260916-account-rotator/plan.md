# Provider Capacity Rotator — recut implementation plan

Status: proposed implementation contract, not implemented.

This plan supersedes the pre-review plan. Implement this file, not the earlier
target architecture sections in `design.md`.

Execution mode: direct implementation by the current agent using shell/git and
`apply_patch`. Do not use `fgos-plan-loop`, `fgos-code-panel`, dispatch panels,
or other fgOS dispatch harnesses until the Codex bwrap provider-capacity path is
green end-to-end. The feature being fixed is the dispatch/account routing layer;
using that layer to implement the fix would hide or amplify the incident.

Review inputs:

- `reports/design-review-260916-1637-provider-capacity-rotator.md`
- `post-review-recut.md`

## Goal

Fix the real quota/account bottleneck in the current dogfood path without
creating a new placement policy.

Slice 1 rotates accounts only inside an already resolved provider. It does not
choose provider, model, executor, runtime class, or cross-provider fallback.

Primary target: Codex bwrap dispatch.

Non-targets for slice 1:

- no `providerFallback`;
- no `providerRuntimes`;
- no `providers.<provider>.models`;
- no six-tier `modelTier` validation in runtime config;
- no cross-provider fallback;
- no retry loop owned by the rotator;
- no broad migration framework.

## Implementation Contract

Existing dispatch still resolves:

```text
capability/policy -> executor/provider/model/confinement through existing code
```

Provider Capacity Rotator receives the already resolved provider/executor/run
context and selects only provider account capacity:

```text
admitted Run + resolved provider + executor/confinement context
  -> selected account or structured capacity refusal
  -> credential materialization before launch
```

Tool/MCP paths such as `gitnexus` bypass this entirely through existing
`executor.kind` / mechanism checks. Do not introduce a new `executionKind`
enum in slice 1.

## Config Contract

Account inventory is global/operator scope only:

```text
~/.fgos/config.json
  runner.providers.<provider>.accounts
```

Project config must not declare or override `runner.providers.*.accounts`.
The loader/validator for provider account inventory must preserve provenance
and reject project-local account inventory.

Use keyed objects, not arrays:

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
          },
          "tetnu": {
            "label": "codex/tetnu",
            "credentialSource": {
              "kind": "codex-home",
              "home": "${HOME}/.codex-tetnu"
            }
          },
          "fgovn": {
            "label": "codex/fgovn",
            "credentialSource": {
              "kind": "codex-home",
              "home": "${HOME}/.codex-fgovn"
            }
          }
        }
      }
    }
  }
}
```

Account entries must not declare executors, capabilities, mutation policy,
tools, approval mode, confinement, model tier, model, effort, fallback, or
runtime class.

## State Contract

Provider capacity state is global/operator runtime state:

```text
~/.fgos/runtime/provider-capacity/state.json
~/.fgos/runtime/provider-capacity/state.lock
```

State must not persist credential home paths, tokens, raw credential hashes, or
env values.

State tracks selected timestamps, success/fault timestamps, quarantine status,
and open leases keyed by `runId`.

## Run Lifecycle Integration

Selection must happen after `admitRunAttempt`, because the lease identity is
the Run.

Flow:

```text
compileDispatchPlan
  -> write dispatch-plan.json with requirements only, no selected account
  -> admitRunAttempt creates runId/runDir
  -> acquire provider account under global lock using runId
  -> write selection into Run-owned evidence before launch
  -> build/update effective execution contract with providerCapacity facts
  -> prepare confinement / materialize credential
  -> launch
  -> release lease on every settlement/abort path
```

`dispatch-plan.json` must not pretend to know the selected account before Run
admission. Persist selection in a Run-owned record and/or
`effective-execution-contract.json`.

Lease rules:

- lease lifetime is Run lifetime;
- release on settled/aborted Run;
- reclaim only with PID/run-dead proof;
- elapsed TTL alone must not make a live lease available;
- sticky-by-assignment applies only while the prior account is present,
  healthy, and not quarantined.

Ranking:

```text
openLeases asc
lastSelectedAt asc
stableHash(seed, accountId)
```

## Codex bwrap Credential Provisioning

Slice 1 must replace the current Codex bwrap hash rotation:

- remove dependence on executor env `FGOS_CODEX_CREDENTIAL_HOMES`;
- remove the executor-id credential allowlist as placement authority;
- use the selected account's `credentialSource` to provision the private
  `CODEX_HOME`.

Credential provisioning mode: copy selected `auth.json` into the temporary
private home before spawn.

Provisioning is fail-closed:

- missing source credential -> refuse before spawn;
- unreadable source credential -> refuse before spawn;
- copy failure -> refuse before spawn;
- classify as credential-provisioning/config failure;
- do not quarantine the selected account for provisioning failure.

Do not bind-mount the real Codex home in slice 1.

Evidence may persist:

- provider;
- account id/label;
- `credentialProvisioned: true`;
- opaque local credential revision/HMAC if needed.

Evidence must not persist:

- raw `auth.json` digest;
- credential home path;
- token values;
- env values.

## Fault And Quarantine

Quarantine means "temporarily skip this account during selection". It does not
modify credentials and has no recovery or approval authority.

Slice 1 classifier inputs:

- provider stderr logs;
- known adapter outcomes such as `paused-limit`;
- structured agent JSON such as pi `stopReason`.

Do not scan prompts, briefs, reports, or general stdout for quota words.

Actions:

- high-confidence quota/rate-limit -> account quarantine with parsed reset
  window when available, otherwise conservative long TTL;
- auth/login/token failure -> manual-clear quarantine;
- credential provisioning/config failure -> no account quarantine;
- executor/config/test/confinement/work-product failure -> no account
  quarantine;
- unknown/low-confidence failure -> evidence only.

Manual-clear quarantine uses the existing Dispatch reconciliation surface, not
a new top-level verb:

```sh
fgos dispatch reconcile provider-capacity clear-quarantine \
  --provider openai-codex \
  --account tetnu \
  --reason "token refreshed"
```

Behavior:

- Clears quarantine only for the named provider/account.
- Requires provider and account to exist in global account inventory.
- Refuses if the provider/account is unknown.
- Refuses if the account is not quarantined unless `--force` is explicitly
  supplied.
- Does not validate, create, or modify credential files.
- Writes an audit record to the global provider-capacity state/audit log with
  timestamp, provider, account id, previous fault/quarantine state, reason, and
  caller identity when available.
- `fgos doctor` may report the condition but must not auto-clear auth
  quarantine.

## Existing Fallback And Redirects

`readOnlyExecutorRedirects` stays as-is in slice 1.

Provider Capacity Rotator must not add dynamic cross-provider fallback.

Cross-provider fallback belongs to
`plans/260915-executor-policy-dispatch-seams/` Phase 05 PlacementPolicy, which
will later consume structured capacity refusals and retire
`readOnlyExecutorRedirects`.

If fallback is implemented later, governance must be re-admitted against:

- disallowed providers;
- required runtime class;
- confinement requirements;
- tool/mutation policy.

## Phases

| Phase | Capability | Exit |
|---|---|---|
| 01 | Global Codex account inventory | Global keyed accounts validate; project-local `runner.providers.*.accounts` is rejected. |
| 02 | Selector/state/lease | Global state+lock, LRU ranking, healthy stickiness, run-lifetime leases, dead-run reclaim. |
| 03 | Run lifecycle integration | Selection happens after Run admission and before launch; selection is persisted in Run-owned evidence/effective contract. |
| 04 | Codex bwrap provisioning | Selected account credential is copied fail-closed into private `CODEX_HOME`; old hash rotation is removed after proof. |
| 05 | Fault/quarantine/clear | High-confidence quota/auth classification, quarantine state, explicit manual-clear door. |
| 06 | Evidence/inspect/doctor | Secret-free evidence, inspect output, doctor checks, global/project config provenance checks. |

## Direct Execution Rules

- Work sequentially in this checkout; do not open plan-loop/code-panel cells.
- Before editing implementation code, run impact analysis when a named symbol is
  being modified, per repo instructions.
- Keep each phase shippable on its own, with tests committed/ready beside the
  code change.
- Preserve no-config behavior; Phase 00 baseline snapshots must remain green.
- Do not modify unrelated dirty user changes.
- Do not add `providers.<provider>.models`, `providerFallback`, or
  `providerRuntimes` in any slice of this plan.
- Do not migrate Claude/agy fallback in this track; note in evidence that slice
  1 only relieves Codex account rotation.
- After every markdown update, refresh mdview when available.

Suggested direct order:

1. Phase 01 config loader/validator and tests.
2. Phase 02 selector/state/lease pure module and tests.
3. Phase 03 Run lifecycle insertion point with tests proving selection happens
   after `admitRunAttempt`.
4. Phase 04 Codex bwrap credential provisioning with fail-closed tests.
5. Phase 05 classifier/quarantine/clear command and tests.
6. Phase 06 evidence/inspect/doctor and full suite.

Stop only for a real blocker:

- selected credential cannot be provisioned without weakening confinement;
- global config provenance cannot be distinguished from project config without
  a broader config-loader change;
- Run settlement/abort paths cannot all release leases without changing a
  higher-level lifecycle contract.

Otherwise continue phase-by-phase directly.

## Tests

Unit tests:

- global account inventory accepts keyed Codex accounts;
- project-local account inventory is rejected;
- accounts cannot declare executor/capability/model/mutation/confinement fields;
- selector ranks by open leases, last selection, stable tie-break;
- sticky account is ignored when quarantined or removed;
- lease reclaim requires dead-run/PID proof, not elapsed time alone;
- quota/auth classifier fixtures quarantine only high-confidence cases;
- credential provisioning failure refuses launch and does not quarantine.

Integration tests:

- selection occurs after `admitRunAttempt` and uses `runId`;
- effective contract/evidence records selected account before launch;
- bwrap private `CODEX_HOME/auth.json` bytes match selected account source;
- old `FGOS_CODEX_CREDENTIAL_HOMES` hash rotation is not used on new path;
- selected credential missing/unreadable fails closed before spawn;
- tool/MCP executor such as `gitnexus` bypasses provider capacity;
- no-config behavior remains Phase 00 snapshot-equivalent.

Operability tests:

- inspect shows selected account, quarantine, reason codes, and lease owner
  without paths/secrets/raw digests;
- doctor reports global account inventory, singleton providers, quarantines,
  and project-local account inventory violations;
- manual-clear command clears exactly one provider/account quarantine and
  writes an audit record.

Full proof after implementation: `npm test`.

## Implementation Readiness

This recut is ready to implement once these operator decisions are confirmed:

1. Codex bwrap credential delivery uses copy-credential provisioning.
2. Account inventory and state are global/operator scope.
3. Cross-provider fallback is deferred to PlacementPolicy.
4. Six-tier `modelTier` remains target architecture only for now.
5. Manual-clear quarantine gets one explicit mutation door.
