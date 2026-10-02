# Review: confined herdr-pane home recipe

## Verdict: findings

**Recommendation: keep the recipe as per-invocation configuration.** Do not move the home layout or credential-file declarations into a provider adapter.

The split is already the architecture described by the authoritative spec. `docs/specs/confinement-authority.md` §13.1 lines 1293–1297 assigns (1) the private-home target binding to each `herdr-spawn` invocation and (2) login material to the machine-global `runner.providers.<provider>.accounts.<id>.credentialSource` inventory. Its earlier resource rule, lines 306–310, also keeps policy resources provider-neutral and resolves concrete paths only in dispatch.

The three concrete invocations confirm why this is invocation-specific rather than provider-adapter-specific: `openai/codex-herdr-fgovn` binds `private-home` to `CODEX_HOME`; `gemini/agy-herdr-mucdong` binds it to `HOME`; and `xai/pi-herdr-vantt` binds it to `PI_CODING_AGENT_DIR` (`.fgos/config.json`; asserted in `test/runner/herdr-provider-invocations.test.mjs:16–35`). The bwrap driver consumes this declaratively: it allocates/copies credentials into the resolved `private-home` resource, then applies every invocation `resourceBindings` entry generically (`src/runner/dispatch/confinement/drivers/bwrap.mjs:400–475`). No provider or agent branch determines the confinement control.

Moving this into a provider adapter would conflate two different axes:

- A provider account inventory selects which account and allow-listed credentials are available on this machine. The driver supports inventory-selected `codex-home` and generic `home-files`, fails closed on missing/escaping/non-regular files, and never mounts the real account home (`bwrap.mjs:34–95`). Duplicating file lists in an adapter would create a second credential authority and conflict with the §13.1/RUL65b inventory boundary.
- A private-home target is a property of the launched CLI/state layout. The same provider family can have different commands or state roots, and pi is explicitly multi-provider. An adapter-wide declaration would either hard-code agent knowledge into shared transport or need per-invocation exceptions again.

Prior art is decisive: commit `cfd670c43` applied bwrap posture to all herdr invocations without bindings; §13.1 records that codex/pi/agy then failed immediately because their state directory was read-only. Commit `acde5fd07` restored the three per-invocation bindings and added the direct regression test. This is a concrete recurrence risk, not a hypothetical abstraction concern.

## Required finding before accepting the proposed guard

The suggested doctor guard is necessary, but the existing `confined-pane-accounts` check is insufficient. `checkConfinedPaneAccounts` only enters its account validation after finding a `herdr-spawn` invocation that already contains a `private-home` binding (`src/setup/registrations.mjs:4135–4137`). If a new non-Claude bwrap herdr invocation omits that binding—the exact `cfd670c43` regression—the check silently skips it and can return the successful message “no confined herdr invocation binds a private home” (`registrations.mjs:4155–4156`).

Acceptance condition for the per-invocation approach: add a doctor/config invariant that scans every `herdr-spawn` invocation with `confinement.backend: "bwrap"` and a non-Claude `interactiveMode.kind`, failing unless it declares a `private-home` binding to an environment target. Keep the existing account check as the second check; it proves that the selected inventory can populate a binding once present. Preserve the explicit three-agent test for the known target-variable mapping, and add a negative generic test for a missing binding.

## Trade-offs

Per-invocation config preserves the authority boundary, keeps the bwrap driver agent-agnostic, and lets each launch name its actual state root. Its cost is repetition and the risk of omission when adding a pane; the generic doctor/config invariant removes that omission risk. An adapter declaration reduces repetition but creates an incorrect shared abstraction, duplicates credential authority, and makes new layouts require driver/provider changes rather than a declared invocation binding.

## Verification

Read: `docs/specs/reading-map.md`; `docs/specs/confinement-authority.md` §13.1; `.fgos/config.json`; `src/runner/dispatch/confinement/drivers/bwrap.mjs`; `src/setup/registrations.mjs`; `test/runner/herdr-provider-invocations.test.mjs`.

Ran:

```text
node --test test/runner/herdr-provider-invocations.test.mjs test/setup/checks.test.mjs
118 passed, 0 failed
```
