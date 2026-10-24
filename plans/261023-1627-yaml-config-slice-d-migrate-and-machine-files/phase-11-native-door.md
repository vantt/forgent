# Phase 11: The native door, namespace `config` (`check`, `fix`, `accounts`)

> **Moved to Slice C** (owner decision 2026-10-24 10:00, option B). Not built in Slice D; this file is the detailed spec Slice C's plan links to. Slice C's plan says where it lands and which numbers (caps, ownership order) changed. Read "Slice D" below as "the slice that executes this phase".

Depends on 08 (check, fix), 04 (accounts), 05 (the copy fix), 03 (class). Suggested executor: sonnet. Cap: `config.rs` 110 lines. Impact analysis on `versions()` and the ABI check in `loadNativeAddon` first.

## Context

Owner decision: Node reaches Rust only through the native door, no spawn, no JavaScript fallback (spec section 12). The door's `config` namespace is Slice C in the spec; this slice opens it with the three entries its own consumers need (plan, "Honest ordering"). The addon pattern is small: `packages/git/node-addon/src/session_identity.rs` is 44 lines, `durable_file.rs` 46.

## Files it may touch

`packages/git/node-addon/src/config.rs` (new), `packages/git/node-addon/src/lib.rs` (module line, `versions()` key `"config": 1`), `packages/git/node-addon/Cargo.toml` (`fgos-config` path dependency, no feature), `src/native/door.mjs` (the ABI marker: `typeof v.config !== 'number'` joins the combined-ABI check at the line that checks `v.sessionIdentity`), `src/config/machine-config.mjs` (new Node client, about 60 lines), `docs/architecture-manifest.json` only if the layering test names door consumers (phase 00 checks), `test/config/config-door.test.mjs`.

## Design

- **Entries** (each marshals JSON in, plain data out, no protocol logic in the addon):
  - `config.check({ projectRoot, globalDir, class, rows? }) -> { findings: [...] }`: resolves `trusted_root` with `RepoHandle::trusted_main_root` (D22), `class` is passed by the Node client from the marker env (the one place Node reads it; the Rust function `session_class` is shared by pinning the marker name in a contract line both sides read), calls `doctor::check` with the `doctor` severities.
  - `config.fix({ projectRoot, globalDir, class, ids, acknowledge? }) -> { changed: [...], skipped: [...] }`: the writer identity is resolved in the addon (`fgos_identity::resolve_current`, the way `session_identity.rs` does); a confined class returns `config-write-confined`.
  - `config.accounts({ globalDir, class }) -> { present, state, runner }`: phase 04's `accounts::read`; `runner` holds only the account subtrees.
- **Errors** carry the failure id in the message JSON (the `durable_file.rs` `failure` shape: `{id, file?, line?, column?}`), never a value; the Node client throws a `ConfigDoorError` with `.code`. The channel without the addon fails by name (`git-addon-unavailable` / `git-addon-not-shipped`, `door.mjs`): **no JavaScript fallback**, so an unmigrated machine without the addon fails with the named error and the doctor row says "run `fgctl init`" (spec failure table).
- **Node client** `src/config/machine-config.mjs`: `checkConfig(opts)`, `fixConfig(opts)`, `readMachineAccounts(opts)`; builds every returned object with `Object.create(null)` and define semantics (spec section 5 rule 7, acceptance 16 for these data); keeps one pure helper `withMachineAccounts(runnerConfig, view)` for phase 13 (appended there). It imports only `../native/door.mjs`, honouring the layering (`test/architecture.test.mjs` against `docs/architecture-manifest.json`).
- **Not in this phase:** `snapshot`, `explain`, `applyPatch` (Slice C); a Node cache (the Rust side hashes per read; one N-API call is about 12 µs, spec section 12).

## Steps

1. Merge `origin/main`; `impact` on `versions` and the ABI check; list the other consumers of `versions()` (the doctor row `rust-host-*` and `native-addon.json` generation) and confirm adding a key breaks none.
2. `config.rs`, then the Node client, then `door.mjs`. Build the addon locally (`npm run` script the repo uses for the addon; check `package.json`/`scripts` in phase 00) with `CARGO_BUILD_JOBS=4`.
3. `test/config/config-door.test.mjs` (about 90 lines, one test per entry, wiring only): `accounts` over a temp `HOME` with a valid file (prototype-less object, `__proto__` key in the file cannot reach any prototype), a missing file (`present: false`), a confined class (`state: unavailable-confined`, file never opened: assert via a file whose open would fail); `check` returns findings for a temp project holding a legacy JSON and a stray `config.json.bak-x` with a pool; `fix` with `create-machine-files` creates the directory at 0700 and the token at 0600 and is idempotent; a missing addon gives the named error. Uses the addon staging helper the git door tests use (`test/helpers/git-addon.mjs`).
4. Cargo and node gates sequentially; line counts (cap 110).

## Owning proofs

Behaviour belongs to phases 04, 05, 08. This phase's proofs are the three wiring tests (one per entry) and the ABI marker check.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| The addon grows a dependency on the validator crate graph | M x L | measured by `cargo tree -p fgos-node-addon`; the addon already links git, event store, lock crates; recorded in the commit |
| ABI marker rejects an older addon during a mixed upgrade | L x M | marker is checked only against the same release's addon; release stages both together |
| Prototype pollution through returned data | L x H | `Object.create(null)` construction and one `__proto__` test |

## Rollback

Revert: the namespace, the marker line and the client go together; phases 12-13 must be reverted first (they call it).
