# Code review: doctor names login copies the account layout no longer reads (59934a2d6)

## Scope

- Commit: `59934a2d6` (parent `3e30ecd37`), 6 files, +127/-16.
- Files read in full at the touched functions:
  - [src/runner/dispatch/provider-credential-renewal.mjs](../../../src/runner/dispatch/provider-credential-renewal.mjs) `inspectRetainedCredentialCopies` and `layoutStoreDirs`, lines 674-724
  - [src/setup/registrations.mjs](../../../src/setup/registrations.mjs) `checkCredentialCopiesRetained`, `strandedByStore` and the registration, lines 5432-5505
  - [test/setup/credential-copies-retained-check.test.mjs](../../../test/setup/credential-copies-retained-check.test.mjs) (5 new tests)
  - CHANGELOG.md, docs/specs/distribution.md, docs/specs/runner.md
- Also cross-read:
  - the dispatch-side layout rule: `credentialStoreDir` (provider-capacity.mjs:669), `refreshAhead` (renewal:865), `credentialWriteBackMarker` (renewal:1001) and `acquireProviderAccountLease` (capacity:828);
  - the inventory read path: `validateProviderAccountInventory` (capacity:68), `loadRunnerConfigFromDir` (config.mjs:300) and `loadGlobalConfig` (global-config.mjs:37).
- Tests run:
  - `env -u CLAUDE_CODE_SESSION_ID node --test test/setup/credential-copies-retained-check.test.mjs test/runner/provider-credential-renewal.test.mjs`: 104/104 pass. This includes the boundary test "no provider module reaches into confinement" at renewal.test.mjs:1535.
  - `test/runner/provider-per-cli-credential-sources.test.mjs`: 9/9 pass.
  - `test/setup/checks.test.mjs` filtered to the registry tests: 3/3 pass.
- Probes: a scratch script in the session scratchpad ran on throwaway `/tmp/fgos-probe-*` runtime dirs, which were removed afterwards. Inventory reads printed counts only. `~/.fgos/config.json` was read but never written.

## Overall assessment

The classification rule matches how dispatch actually lays out its stores:
- `credentialSources` present: dispatch writes to `stores/<cli>` for the declared CLI keys.
- otherwise: dispatch writes to the account root.
- The provider key on disk is the normalized inventory key, because the lease indexes `inventory[provider]` directly.

The change adds no delete or move path, and `--fix` still settles held private homes only. The cases the commit names all classify correctly; I checked them by probe as well as by the tests:
- root copies after a switch to per-CLI stores;
- `stores/<cli>` copies after a switch back to one store;
- a dropped CLI;
- a scratch home at a stranded root;
- an account no longer listed.

There is no false FAIL on a healthy account in the shapes I tried:
- a single store with copies at the root;
- per-CLI stores with copies under a declared CLI;
- torn copies, which stay a warning.

Two gaps remain:
- The inventory is read through the project config even though it lives only in the global config, so the new FAIL silently turns off whenever doctor runs outside a configured project, or when any unrelated project-config check fails.
- An account id that matches an `Object.prototype` key is judged "still listed".

Neither one deletes or hides a token. Both bring back the old wording, "a dispatch for that account applies them", which this commit exists to remove.

## Critical issues

None.

## High priority

None.

## Medium priority

### M1. The layout check needs a valid project config, but the inventory lives only in the global config

- Location: [src/setup/registrations.mjs:5495-5498](../../../src/setup/registrations.mjs)
- Code: `try { inventory = providerAccountInventory(loadRunnerConfigFromDir(cwd)); } catch { inventory = undefined; }`

`loadRunnerConfigFromDir` throws in two situations:
- `cwd` has no `.fgos/config.json` (config.mjs:302);
- the merged runner section fails `validateRunnerConfigShape` for any reason.

The inventory cannot come from the project file anyway: `rejectProjectProviderAccountInventory` refuses it (config.mjs:312). It lives only in the global config, which is the same config dispatch uses.

Probe:
- `loadRunnerConfigFromDir('/tmp')` throws `RunnerConfigError`;
- `providerAccountInventory(loadGlobalConfig())` returns all 4 providers.

Failure scenario:
1. The owner runs `fgos doctor` from `~`, from a project that is not set up, or from a project whose config has a stale executor key.
2. The inventory goes `undefined` and no layout is judged.
3. A copy stranded at `account-locks/openai/acct/` after the account moved to `credentialSources` is reported as `warning: ... waiting for a renewal (a dispatch for that account applies them)`, and the check passes.

This is the false claim the commit set out to remove. No dispatch will ever apply that copy, and it may hold the only valid refresh token. The fallback is also silent: the message does not say that the layout was not judged.

Fix:
- Read the inventory from the global config alone: `providerAccountInventory(loadGlobalConfig())`, the same source a lease resolves against. Keep `undefined` only for a parse or validation error of that file.
- When the inventory is unreadable, add a clause to the message, for example `layout not judged: provider inventory unreadable (<err.message>)`, so a degraded PASS is visible.
- Add a test that calls the registered check with a cwd that has no project config.

### M2. An account id equal to an `Object.prototype` key is judged as still listed

- Location: [src/runner/dispatch/provider-credential-renewal.mjs:698](../../../src/runner/dispatch/provider-credential-renewal.mjs) together with lines 718-722.
- Code: `inventory?.[provider]?.accounts?.[accountId]` uses a plain property read.

The inventory's `accounts` is a plain `{}`. `validateAccountId` (`^[a-zA-Z0-9][a-zA-Z0-9_.-]*$`) allows ids such as `constructor`, `toString`, `valueOf` and `hasOwnProperty`, so dispatch can create these account dirs. If such an account is later removed from the inventory, `accounts['constructor']` returns `Object`, which is truthy and has no `credentialSources`. `layoutStoreDirs` therefore returns `{accountDir}`, and the root copies are judged readable.

Probe (scenario A): `openai/constructor` with a 3-day-old pending copy, with the inventory listing only `acct`, gives `passed: true` and the message `openai/constructor: 1 pending login copy(ies) waiting for a renewal (a dispatch for that account applies them)`. This is a missed mismatch and a false PASS.

The same prototype-key read applies to the provider level (`inventory['constructor']`), but that branch is harmless: its `.accounts` is undefined, so the copies are correctly judged stranded.

This is exotic, because it needs an account named after a prototype key. It is still a correctness hole in a check whose whole job is "never silently". This repo has had the same lookup bug before (`--work[id]` accepting `__proto__`/`constructor`).

Fix: `const providerEntry = Object.hasOwn(inventory ?? {}, provider) ? inventory[provider] : undefined; const account = providerEntry && Object.hasOwn(providerEntry.accounts ?? {}, accountId) ? providerEntry.accounts[accountId] : undefined;`. Add a test with account id `constructor`.

## Low priority

### L1. A stranded copy younger than 24 hours is not reported at all

- Location: [provider-credential-renewal.mjs:711](../../../src/runner/dispatch/provider-credential-renewal.mjs) (`ageMs >= minAgeMs || torn`) together with `RETAINED_COPY_REPORT_AFTER_MS` in registrations.mjs.

The 24h grace exists because "a younger one is simply waiting for the next renewal". That reason does not hold for a stranded copy, which no renewal ever applies.

Probe (scenario E): a 1-hour-old copy at a stranded root reports `no login copy is being retained past its dispatch`.

Failure scenario: the owner switches an account to `credentialSources` and runs doctor right away to confirm the switch is safe. Doctor passes clean, even though there is an unapplicable copy at the root.

Fix: list stranded copies regardless of age, as torn copies already are. Alternatively, state the 24h window in the docs and CHANGELOG line.

### L2. The over-limit message contradicts the stranded message for the same directory

- Location: [registrations.mjs:5455](../../../src/setup/registrations.mjs), where `inspectPendingCopiesOverLimit` is unchanged and scans stranded dirs too.

Probe (scenario G): 40 copies at a stranded root produce both of these lines:
- "...a dispatch for that account re-checks them...";
- "...that no dispatch applies...".

The verdict is still FAIL, so nothing is hidden, but the owner gets contradictory instructions.

Fix: when an inventory is available, skip or reword over-limit entries whose store dir is stranded. `inspectPendingCopiesOverLimit` would have to return `storeDir`, and the commit intentionally left it alone, so this may belong in a follow-up.

### L3. A torn copy in a stranded directory is reported without its directory

- Location: [registrations.mjs:5453](../../../src/setup/registrations.mjs) (`c.kind !== 'torn'` excludes torn copies from `stranded`).

Torn copies stay a warning and are reported per account with no path. A torn copy is already marked for hand recovery and is never applied in any layout, so the PASS/FAIL outcome is defensible. The gap is that the owner is not told it sits in a directory that dispatch no longer even scans.

Fix: name the store directory in the torn line when the copy is stranded.

### L4. The docs and CHANGELOG overstate the guarantee

- CHANGELOG.md:23 says the copies "are no longer reported as applied by the next dispatch". That holds only when the inventory was read (see M1) and the copy is older than 24 hours (see L1).
- The distribution.md row and the runner.md paragraph say such copies "fail" with no condition attached.

Fix: after M1 and L1 are fixed the wording becomes true. Otherwise add "when the provider inventory is readable; copies older than a day".

## Test quality (the 5 new tests)

What the tests prove, with real directories on disk and no mocks:
- the root dir is stranded for a per-CLI account;
- `stores/pi` is stranded for a single-store account;
- the healthy per-CLI wording is kept;
- an unlisted account is stranded;
- with `inventory: undefined` the check falls back to the old behaviour;
- no token value appears in the message.

These are behavioural tests, not phantom tests.

Missing coverage:
- **Registered-check wiring.** The cwd → `loadRunnerConfigFromDir` → catch path is never exercised. The "unreadable inventory" test passes `undefined` directly, which is why M1 went unnoticed.
- **Healthy single-store account given an inventory.** No test covers a root copy for a single-store account with an inventory present (it should PASS with the waiting wording). This negative test matters most against a false FAIL. The probe (scenario B) shows the code is correct.
- **Dropped CLI.** No test covers a per-CLI account with a copy under an undeclared `stores/<cli>`. The probe (scenario C) shows the code is correct.
- **Scratch kind and mixed accounts.** No test covers a stranded `scratch-*` home, or a single account with both healthy and stranded dirs, where each should be classified on its own.
- **Prototype-key account id.** Not covered (M2).
- **--fix.** No test asserts that `fixCredentialCopiesRetained` leaves a stranded copy in place. The code path cannot reach these copies, so this is a regression guard only.

## Checks requested

1. Classification:
   - False FAIL on a healthy account: none found. Probes B and C, the test with healthy per-CLI wording, torn copies (which stay a warning), and `stores/<cli>` for a declared CLI all classify correctly.
   - Missed mismatch: M2 (prototype-key account id) and L1 (younger than 24 hours).
   - Read error turned into a false PASS: yes, by design. The trigger is far wider than intended, though: it fires for any missing or invalid project config (M1), and it is silent.
   - Partial inventory: `validateProviderAccountInventory` is all-or-nothing, since any bad entry throws and the code falls back. A provider without `accounts` is absent, so its on-disk accounts are judged stranded. That is consistent with dispatch, which refuses a lease for such a provider.
2. No new delete or move path. The diff adds no `rm`, `rename` or write. `fixCredentialCopiesRetained` is unchanged: it calls only `settleHeldCredentialHomes`, which acts on private homes under the confinement temp roots and never on `account-locks/`.
3. Dependency direction is intact:
   - The boundary test passes.
   - `provider-capacity.mjs` and `provider-credential-probe.mjs` do not import renewal or confinement.
   - Renewal imports only `credentialStoreDir` and the lock helpers from capacity.
   - The new `layoutStoreDirs` reads the inventory's shape without importing anything new.
   - registrations.mjs (setup) imports both, which is downward.
4. Tests: see the section above. The happy path and the main mismatch cases are proven. The wiring and the negative cases are not.
5. Docs: they match the code's mechanism but state it unconditionally (L4).

## Recommended actions

1. M1: read the inventory with `loadGlobalConfig()` instead of the project config, report a degraded judgement in the message, and add a wiring test with a cwd that has no project config.
2. M2: switch the inventory lookup to `Object.hasOwn`, and add a test with account id `constructor`.
3. L1: report stranded copies at any age, or document the 24h window.
4. Add the missing negative tests: a healthy single-store root, a dropped CLI, a stranded scratch home, and `--fix` leaving a stranded copy.
5. L2, L3 and L4 as wording follow-ups.

## Unresolved questions

- Should stranded copies ignore the 24h report window (L1)? This is a product choice about doctor noise right after a layout switch.
- Should the over-limit line be layout-aware (L2) even though `inspectPendingCopiesOverLimit` was meant to stay unchanged?

Status: DONE_WITH_CONCERNS
Verdict: not merge-ready as the final word on this invariant. It is safe to keep on local main because it never deletes or moves a copy, but M1 lets the new FAIL silently turn off outside a configured project, and M2 is a confirmed false PASS. Both are small fixes.
