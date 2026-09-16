# Phase 06 — ExecutorProfile and invocation vocabulary

## Cell goal

Define and begin validating the target executor profile / invocation vocabulary
without deleting legacy executor ids.

This is a full-suite gate because it touches runner config validation and doctor
surface.

## Parallelization

Can be split:

- Phase 06a docs/doctor-warning vocabulary may run after Phase 00 and in
  parallel with Phase 03.
- Phase 06b config-validator changes should wait until Phase 04/05 vocabulary is
  stable, then run as the full-suite gate.

## Target vocabulary

ExecutorProfile identifies stable runtime boundary:

- principal/account family reference, not a concrete rotating account id;
- runtime backend reference;
- trust domain;
- egress class;
- maximum authority/confinement/provider capability envelope.

Invocation describes how that profile is used:

- adapter: CLI/herdr/API/MCP;
- prompt delivery;
- visible/headless or live-output mode;
- confinement backend/envelope;
- resource bindings;
- provider adapter id.

Do not create executor identity from:

- provider-capacity account id;
- model;
- quality tier;
- reasoning effort;
- persona/role/business case;
- visibility alone;
- prompt delivery alone;
- CLI/herdr/API adapter alone;
- `--allowedTools`, `--permission-mode`, Codex `-s`, or similar argv flags.

Provider Capacity Rotator owns concrete account inventory, leases,
quarantine, and credential materialization. ExecutorProfile may identify the
provider/principal family needed for placement and governance, but it must not
contain account pools or credential homes.

## Likely files

- `src/runner/dispatch/config.mjs`
- `src/setup/checks.mjs` or setup/doctor registry files if doctor owns the check
- `docs/specs/runner.md` or an architect dispatch config document, depending on
  where the repo currently records dispatch config contracts
- tests for config validation / doctor checks

## Validation / doctor scope

Add warnings first, not hard failures, for legacy config entries that:

- hardcode policy-shaped flags in executor args;
- use executor `rigorOverrides`;
- encode role/persona behavior in executor names;
- duplicate the same principal/backend/trust boundary as separate executor ids
  without a machine-checkable separation reason.
- encode account pools, credential homes, or provider-capacity rotation inside
  executor env/args instead of the Provider Capacity Rotator inventory.

Warnings must name the migration target:

- policy-shaped flag → ProviderAdapter/runtime option;
- role/persona executor → alias patch + persona/toolIntent/reasoningEffort;
- adapter executor → invocation;
- bwrap/confinement executor → invocation confinement envelope unless trust or
  egress boundary truly changes.
- executor-owned account env/pool → Provider Capacity Rotator global inventory.

## Verification

```sh
npm test
```

If full suite has baseline failures, compare exactly against the recorded
baseline from `plan.md` and triage every new failure.

## Exit criteria

- Doctor/config validation can identify policy-shaped executor entries without
  breaking existing config.
- Doctor/config validation can warn about executor-owned account placement
  without reintroducing account pools into ExecutorProfile.
- Target ExecutorProfile/invocation terms are documented near the dispatch
  config/spec surface.
- Legacy executor ids remain accepted.
- A later migration can map `claude` + `claude-herdr` + reviewer aliases into
  one profile with multiple invocations/aliases, but this phase does not have
  to perform that migration.
