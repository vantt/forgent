# Code review: fix round for doctor stranded login copies (51c8394e0)

## Scope

- Commit: `51c8394e0` on `fix/doctor-stranded-copies-review` (parent `59934a2d6`), 7 files, +212/-56.
- Checkout used: the existing worktree `~/projects/forgentX-doctor-stranded-review`, which is at HEAD `51c8394e0` and clean. No temporary worktree was needed.
- Previous review: [code-review-261014-0930-doctor-layout-mismatched-copies.md](code-review-261014-0930-doctor-layout-mismatched-copies.md).
- Code read:
  - `src/runner/dispatch/provider-credential-renewal.mjs` lines 649-728: `inspectPendingCopiesOverLimit`, `inspectRetainedCredentialCopies`, `listCredentialStoreDirs`, `inventoryAccount` and `layoutStoreDirs`.
  - `src/setup/registrations.mjs` lines 5417-5520: `checkCredentialCopiesRetained`, `strandedByStore`, `readDoctorProviderInventory`, the fix, and the registration.
  - The dispatch inventory path: `executeAssignment` (assignment-runner.mjs:1306) → `ensureRunnerConfigForDir` / `loadRunnerConfigFromDir` (dispatch/config.mjs:300, 353) → `rejectProjectProviderAccountInventory` + `mergeWithGlobalConfig` → `mergeConfigDefaults` (setup/config-merge.mjs:21, fill-only).
  - The other doctor inventory readers: registrations.mjs:2178 and :4588.
- Tests run:
  - `env -u CLAUDE_CODE_SESSION_ID node --test test/setup/credential-copies-retained-check.test.mjs test/runner/provider-credential-renewal.test.mjs`: **114/114 pass**.
- Probe:
  - A scratch script in the session scratchpad drove the *registered* check through `DOCTOR_CHECKS`.
  - Each case used a throwaway `/tmp/fgos-probe-*` HOME with a cwd that has no project config. The dirs were removed afterwards.
  - The real `~/.fgos/config.json` was never read or written.
  - The test fixtures contain no token values, and none were printed.

## Verification of the previous findings

| Finding | Status | Evidence |
|---|---|---|
| M1 (inventory read through the project config) | **Fixed in its main part.** The fallback still uses the old wording (see M1' below). | The registration (registrations.mjs:5515) calls `readDoctorProviderInventory()` → `loadGlobalConfig()?.runner`, so cwd plays no part. Probe E: a per-CLI account with a copy in its declared `stores/codex`, run from a cwd with no config, passes with the waiting wording. On a corrupt or invalid global config the message says `login store layout not checked (provider account inventory not readable: …)` (probes A and G). |
| M2 (`Object.prototype` keys) | **Fixed.** | `inventoryAccount` (renewal:716-719) checks with `Object.hasOwn` at both the provider level and the account level. It is the only inventory lookup in the changed code: `layoutStoreDirs` takes the resolved account, and `Object.keys(credentialSources)` reads own keys only. The validator builds `accounts` as a plain `{}` keyed by `Object.entries`, so `hasOwn` is the right test. Covered by test :306 (`openai/constructor`, `toString/acct`). |
| L1 (stranded copies younger than 24h hidden) | **Fixed** when an inventory is read. | renewal:711 adds `\|\| stranded`, and `passed` is false when `stranded.length > 0` (registrations:5470). Test :257 uses a 1h copy. |
| L2 (contradictory over-limit wording) | **Fixed** when an inventory is read. | `inspectPendingCopiesOverLimit` now returns `storeDir` and `stranded`. A stranded over-limit dir gets its own wording, "no dispatch re-checks or drops them", and FAILs (registrations:5456-5457, 5470). Test :294 asserts the old phrase is absent. |
| L3 (torn copy in a stranded dir not named) | **Fixed.** | registrations:5460 names the dir, and the check now FAILs (it used to warn), which the docs state. Test :281. |
| L4 (docs overstate the guarantee) | **Fixed.** | distribution.md row 7, runner.md RUL80 and the CHANGELOG all now say "when the machine-global inventory was read", "of any age", and "the message says the layout was not checked". |
| Missing tests | **All 8 added.** One of them is weak (see L-T1). | Temp HOME + cwd with no config (:338), corrupt global config (:355), healthy single store (:234), dropped CLI (:246), stranded scratch home (:268), torn (:281) and over-limit (:294) stranded dirs, constructor/toString (:306), and `--fix` leaving a stranded copy in place (:319). |

## Critical issues

None.

## High priority

None.

## Medium priority

### M1'. The degraded fallback still says "a dispatch for that account applies them" for copies whose layout was never judged

- Location: [src/setup/registrations.mjs:5461](../../../../forgentX-doctor-stranded-review/src/setup/registrations.mjs) and :5458, with the added clause at :5465-5467. The behaviour is pinned by [test/setup/credential-copies-retained-check.test.mjs:220-229](../../../../forgentX-doctor-stranded-review/test/setup/credential-copies-retained-check.test.mjs).
- What happens: when `inventory === undefined`, every copy has `stranded: false`. The copies still go through `summarizeByAccount(..., '... waiting for a renewal (a dispatch for that account applies them)')` (:5461). Over-limit dirs still get "a dispatch for that account re-checks them" (:5458). The new "layout not checked" clause is appended *after* these lines; it does not replace them.
- Probe A, corrupt `~/.fgos/config.json`, 3-day copy at the root of a per-CLI account, which is really stranded:
  `passed: true | warning: openai-codex/acct: 1 pending login copy(ies) waiting for a renewal (a dispatch for that account applies them), oldest 3d; login store layout not checked (…)`.
- Probe C, the same setup with 7 copies: "a dispatch for that account re-checks them".
- Probe G, an inventory with an unknown account key, gives the same output as probe A.
- Failure scenario:
  1. The owner breaks `~/.fgos/config.json` with a typo, or adds an account key that the validator refuses.
  2. Doctor PASSes and tells them the next dispatch applies the copy.
  3. That claim is false twice over. Dispatch uses the same file, through `mergeWithGlobalConfig` → `loadGlobalConfig`, so with the file broken no dispatch runs at all. And the copy may be stranded once the config is repaired.
- The appended clause softens the line but does not withdraw it, so the message contradicts itself. The test at :220 now *asserts* the wording that the brief says must not appear.
- Fix:
  - With no inventory, use a neutral label for non-stranded copies, for example `login copy(ies) kept, oldest …; whether a dispatch applies them is not known until the provider inventory is readable`.
  - Use a neutral over-limit variant too.
  - Update the test at :220 to assert that the old phrase is absent.
  - Optional: FAIL instead of warn in this case. An unreadable global inventory stops every leased dispatch, so a PASS understates the problem. This is a product call; warning plus a clear reason is defensible.

## Low priority

### L1'. With no readable inventory, a stranded copy younger than a day is hidden and the "not checked" note is dropped

- Location: renewal:711 (`stranded` is always false without an inventory, so `minAgeMs` filters the copy out) and registrations:5465 (the clause is gated on `copies.length + overLimit.length > 0`).
- Probe B: a corrupt global config with a 1h copy gives `passed: true | no login copy is being retained past its dispatch`. The output does not say that the layout was not checked.
- Failure scenario: the owner switches an account to `credentialSources`, makes a JSON mistake in the same edit, and runs doctor to confirm. Doctor reports clean.
- Fix: emit the "layout not checked" clause whenever `inventory === undefined` and any copy exists at any age, for example by gating it on an unfiltered count. Or make an unreadable inventory a FAIL on its own.

### L-T1. The registered-check wiring test cannot tell "global inventory read" from "no global config"

- Location: [test/setup/credential-copies-retained-check.test.mjs:338-353](../../../../forgentX-doctor-stranded-review/test/setup/credential-copies-retained-check.test.mjs).
- The test puts a root copy under a per-CLI account and expects the stranded FAIL. `loadGlobalConfig` returns `{}` for a missing file, which makes the inventory empty and every account stranded. Probe D, with no config file, produces the same FAIL line.
- Failure scenario: a regression that reads the wrong path, for example a HOME snapshot taken at module load, would still pass this test.
- Fix: in the same test, also place a copy in the declared `stores/codex` and assert that it keeps the waiting wording. Probe E shows the code already does this, so only the assertion is missing.

### Informational (no action needed)

- **No global config file means everything is stranded.** With `~/.fgos/config.json` absent, or present without `runner.providers`, every on-disk account dir FAILs as stranded (probe D). This is consistent with dispatch: with no inventory there is no lease, so nothing is ever applied. It is also visible, not silent.
- **Normalized provider directories only.** A copy under a raw `account-locks/openai/…` directory is judged stranded, because the inventory key is `openai-codex` (probe F). This matches the lease's `inventory[provider]` indexing, so it is correct.

## Doctor vs dispatch config source

- **Dispatch.** `executeAssignment` → `ensureRunnerConfigForDir(root)` runs `rejectProjectProviderAccountInventory`, which throws if a project declares `providers.<p>.accounts`. It then merges with `mergeWithGlobalConfig`, and `mergeInto` is fill-only. Because a project can never add accounts, and `PROVIDER_ENTRY_KEYS = ['accounts']`, the inventory dispatch sees is exactly the global one.
- **Doctor.** Reading `loadGlobalConfig()?.runner` directly is therefore the same inventory dispatch uses, and it matches the existing doctor practice at registrations.mjs:2178 (`inspectProviderCapacity({ runnerConfig: loadGlobalConfig() })`). Precedence "project overrides global" does not apply here, because the inventory is global-only by rule. Merging project accounts would be wrong: they are refused at load.
- **Divergence 1: `checkConfinedPaneAccounts` (:4588).** It still reads the inventory through `loadRunnerConfigFromDir(cwd)`, so outside a configured project it never runs. This is the same class of issue as the old M1, but it is pre-existing and outside this commit.
- **Divergence 2: a project whose `runner.providers` is not a plain object** (`null`, an array). `rejectProjectProviderAccountInventory` returns early, and `mergeInto` keeps the project value byte-for-byte. Dispatch then throws in `validateProviderAccountInventory` for that project, while doctor judges by the global inventory. The project is already broken for every leased dispatch, so this is not a stranded-copy misjudgement. Noted only.
- **sanitizeGlobalModelPolicies.** It touches `runner.modelPolicies` only, never `providers`, so there is no divergence there.

## No new delete or move path

The added lines in `src/` contain no `rm`, `rename`, `unlink`, `writeFile`, `mkdir` or `cp` (checked by grep over the added lines of the diff). `fixCredentialCopiesRetained` is unchanged and calls only `settleHeldCredentialHomes` on the confinement temp roots. Test :319 shows that `--fix` leaves the stranded copy in `pending/`.

## Out-of-scope note

registrations.mjs:4357 (`inventory[provider]?.accounts` in `checkConfinedPaneAccounts`) uses a plain property read. A provider value of `constructor` would resolve to `Object.accounts`, which is undefined, so the code reports "no accounts". The outcome is correct by accident. It is outside this commit.

## Recommended actions

1. M1': stop printing "a dispatch for that account applies them / re-checks them" when the inventory is unreadable, and flip the test at :220 to assert that the phrase is absent.
2. L1': show the "layout not checked" clause, or FAIL, whenever the inventory is unreadable and any copy exists at any age.
3. L-T1: add a waiting-wording assertion for a declared store to the registered-check test, so it proves the inventory was actually read.

## Unresolved questions

- Should an unreadable global inventory FAIL rather than warn? An unreadable inventory also stops every leased dispatch.

Status: DONE_WITH_CONCERNS
Verdict: M1, M2 and L1-L4 are fixed and covered, with no delete path and 114/114 tests passing. One medium remains: the corrupt-config fallback still claims "a dispatch applies them" (probe-confirmed). It is a small wording fix plus one test; merge after it, or accept it explicitly as a warning-level degraded path.
