# Phase 07: The Node facade `src/config/facade.mjs`

Depends on 06. Suggested executor: sonnet. Cap: facade 260 lines (it absorbs D's `machine-config.mjs`, cap 90, so the net is about +170). Shared files: the importers of `machine-config.mjs` (list from phase 00; **this phase edits only their import lines**, and finishes before the parallel tracks of 10-16 start, so no two phases edit one file at once).

## Context

Spec section 12: one Node facade module replaces `src/config/shared-config-file.mjs` and `global-config.mjs`; it is the only Node code that reads a config file. D-11's client functions (`checkConfig`, `fixConfig`, `readMachineAccounts`; `machine-config.mjs` was never created) is its first half; this phase makes one module of both and deletes the interim `withMachineAccounts` (C16: the unconfined snapshot already carries the accounts layer).

## Files it may touch

`src/config/facade.mjs` (new), `src/config/machine-config.mjs` (deleted), the import line of each importer of it (phase 00's list, minimum: `src/setup/config-checks.mjs`, the D account-reader assembly sites `src/runner/dispatch/config.mjs`, `src/verbs/dispatch/inspect.mjs`, `reconcile.mjs`, `src/setup/model-pool-checks.mjs`, `src/setup/registrations.mjs`), `docs/architecture-manifest.json` (a `kernel` row for `src/config/facade.mjs`, so every layer may import it; it imports only `../native/door.mjs`), `test/config/facade.test.mjs` (new, about 120 lines), `test/config/config-door.test.mjs` (D's import path).

## Design

The facade exports a small surface, each function one door call plus marshalling:

- `readConfig({ projectRoot, globalDir, sections, origins })` -> `{ value, revisions, accounts, origins? }`; `readMachineConfig({ globalDir, sections })` (no project); `projectConfigPresent(projectRoot)` (does a `config.yaml`, `config.json` or a tombstone exist; replaces the two `existsSync` calls at `cli.mjs:384,841`; answered by `snapshot`'s revisions, no extra file read in Node).
- `explainConfigPath(...)`, `applyConfigPatch(...)`, `initConfigFile(...)`, `checkConfig(...)`, `fixConfig(...)`, `readMachineAccounts(...)` (D's, unchanged semantics).
- **Defaults are computed at call time**: `globalDir` is `path.join(os.homedir(), '.fgos')` on every call (the reason `global-config.mjs:20-29` made it a function: tests override `HOME`), never frozen at import.
- **Session class** is read from the marker environment variable `FGOS_CONFINED` here and nowhere else in Node; an argument overrides it for callers that already know.
- **Define semantics and prototype-free objects (C2):** results come from `fromDoorJson(text, { nullPrototype: true })`; each returned section is a prototype-free object tree, arrays are plain.
- **Errors:** a door failure becomes `ConfigDoorError` with `.code` (the failure id, e.g. `config-parse`, `config-schema`, `config-key-out-of-scope`, `config-legacy-shadowed`), `.refusals` (`[{ id, file, line, column, path, keyword }]`), and a message of the form `<id> <file>:<line>:<column> <path>` per refusal, never a value. A missing addon is the door's own error and passes through unchanged (no fallback). A helper `isConfigRefusal(err)` serves C7 and C14.
- Nothing is cached in Node: one call is the cost (spec section 12: about 12 µs plus the digest check).
- A reader never `catch`es into `{}`; the few documented fail-closed readers do it themselves (C7) and say so in a comment citing the spec line.

## Steps

1. Merge `origin/main`; read D's landed `machine-config.mjs`; `rg` its importers; `impact` on its exports.
2. Write the facade by moving D's functions in and adding the rest; update the importers' import lines and delete `machine-config.mjs`; `withMachineAccounts` has no remaining caller after phases 10 and 13 move the assembly points, so until then it stays as a thin function in the facade marked for deletion by phase 10 (the one transitional symbol; the closing `rg` in the success criteria proves it is gone).
3. `test/config/facade.test.mjs` (wiring plus the facade's own shape rules): prototype-free sections and `Object.getPrototypeOf(value.runner) === null`; a `__proto__` key in a global-file fixture is refused by the profile (B) so the facade shows `config-parse` and no prototype changed; `HOME` override honoured per call; a malformed project file throws `ConfigDoorError` naming file, line, column and containing no input text; a legacy `config.json` project reads (one proof of the legacy read path, C20); a tombstone counts as no source; a confined class has no accounts layer; the missing-addon error passes through.
4. Run the facade, door and the D `config-checks` tests through the launcher; `node --test test/architecture.test.mjs` for the manifest row.

## Owning proofs

Facade shape and error type: `facade.test.mjs`. Everything below it is B/D/05/06.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| A consumer needs `plain` objects (`hasOwnProperty`, `deepEqual`) | M x M | phase 00 audit; `plainConfig` in the test helper (phase 18) |
| Two modules briefly export the same helper | L x L | `withMachineAccounts` is the only transitional export |
| The facade grows into a second implementation | L x M | cap 260; no merge, no validation, no cache in it; reviewed against the cap |

## Rollback

Revert: D's `machine-config.mjs` returns with the import lines; nothing else calls the facade yet.

## Landed (2026-10-24, landing B)

- `src/config/facade.mjs` (kernel row in the manifest; imports only `../native/door.mjs`): `readConfig` (needs `projectRoot`, a `TypeError` otherwise so a forgotten root cannot silently become the machine view), `readMachineConfig`, `projectConfigPresent`, `readMachineAccounts`, `checkConfig`, `fixConfig`, `initConfigFile`, `ConfigDoorError`, `isConfigRefusal`, `CONFINED_MARKER_ENV`. **No `explainConfigPath`, `applyConfigPatch`, `withMachineAccounts`, `machine-config.mjs`** (coordinator answer 1, decision C22); nothing imports the facade yet (landing B moves no reader: `rg "config/facade" src bin scripts` finds none).
- Defaults per call: `globalDir` from `os.homedir()` and the session class from `FGOS_CONFINED=1` are computed in `call`, never at import; an argument overrides both. `undefined` fields are dropped from the request (the addon refuses a `null` list).
- `isConfigRefusal(err)`: a `ConfigDoorError` whose code is not one of the door's own ids (`config-request-invalid`, `config-io`, `config-trusted-root-unresolved`, `config-internal-error`). This is the test C7 and C14 use; a missing addon (`git-addon-*`) is not a `ConfigDoorError` and passes through unchanged.
- `projectConfigPresent` answers from the snapshot's `project` revision, so a migration tombstone counts as absent (it is no source); the two `existsSync` calls it replaces in `dispatch/cli.mjs` asked about a legacy file only, phase 11 settles what they should now mean.
- Lines: facade 72 (cap 260), `facade.test.mjs` 120 (plan 120). The marker is pinned to the launch driver's export in the facade test (the crate's side is pinned by `dispatch-confinement-machine-private.test.mjs`).
