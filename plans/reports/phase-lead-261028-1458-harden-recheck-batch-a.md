# HARDEN re-check, batch A: phase lead report

Branch `harden/recheck-fixes`, from main `984ee3d91`. One commit per item, 12 commits, plus this report. Focused tests only; the full gate is the big lead's.

## Needs the big lead before landing

1. **Architecture test is red on this branch** (`test/architecture.test.mjs`: "file .mjs on disk vs manifest row", and the import-direction test). Cause: deleting `src/verbs/events/import-legacy.mjs` leaves its row `docs/architecture-manifest.json:352` (`"src/verbs/events/import-legacy.mjs": "use-case"`). The docs tree is frozen, so I did not remove it. Delete that one line at landing (or in the docs lane's next commit). Nothing else in that test fails.
2. `src/seat-binding/client.mjs`: a one-line import change (`routeEnv` now comes from `src/util/host-bin-path.mjs`). The brief names that file in its import list for the shared environment helper, yet the hard-rule list forbids `src/seat-binding/*`. I made the one-line change because the old export is deleted in the same change (L10). If SEAT objects, the alternative is a re-export from the driver, which keeps the old path alive.

## Per item

| Item | Commit | What changed | Tests (pass/fail) |
|---|---|---|---|
| Hook on Windows | `9e36152fc` (replaced, see Review fixes) | `probeSharedSync` in `src/holder-lock/hold-transport.mjs` takes one shared try through the existing `lock-hold` helper (`--mode sh --try`); `startHold` now forwards `mode`. The hook uses it when `lockTransport()` is `hold` (Windows) and still uses `lock-fd --shared-try` elsewhere. `acquired` is free (helper released at once), `held` is held, any other answer or a helper that never answers is an error and the hook still refuses. No fail-open path; no Rust change. | `hold-transport-borrow` (new: 3 cases through a stand-in host that records argv, answers via `ready.json`, and checks the work dir and helper are gone) + `main-checkout-lock-hook`: 13 pass, 0 fail. `cargo check -p fgos-holder-lock --target x86_64-pc-windows-msvc` ok (target installed; only a comment changed in Rust later). Not run on a real Windows machine. |
| Dev-host keep rule | `66028cc47`, then the age-only keep commit | One process scan per `pruneRunDirs` call. Where the scan is `unsupported` (macOS, Windows) `releaseRunDir` keeps the run directory and `pruneRunDirs` removes it only once older than `STALE_RUN_DIR_MS`. `unreadable` views stay non-holders (another user's; our detached child runs as us), stated in a comment in `releaseRunDir`. | `run-rust-dev-host-staging.test.mjs` (+2: supplied scan is honoured; `unsupported` keeps at once, injected through the `views` argument) and `dev-host.test.mjs`: 18 pass, 0 fail. The prune-side removal of a stale directory under `unsupported` has no seam on Linux, so it is not proven here; the young-directory floor is. |
| Stale test comments | `af594ca3a` | `run-lock-identity.test.mjs` points at `process-facts-vectors.test.mjs` for the verdict table; `dispatch-runtime-inspect.test.mjs` loses the `isProcessAlive` sentence. | comment-only |
| Dead addon descriptor route | `9d1fb1632` | `loadNativeAddon` no longer reads `native-addon.json` (`packageDescriptor` gone). `native-load.test.mjs`: the invalid-descriptor cases and the "door loads from an npm payload" assertion are retired (behaviour removed); the new assertion is that a payload with only `native-addon.json` refuses with `git-addon-not-shipped` / `process-door-not-shipped`. `checks-setup-rc-line.test.mjs` now builds a release-shaped tree (`manifest.json`, `bin/fgos`, `native/`, payload under `libexec/legacy-node`). `store-hardening.test.mjs` already passed the descriptor as an argument; I only renamed its temp file to `addon-descriptor.json`. | native-load + rc-line: 19 pass, 0 fail (1 skipped by design); store-hardening: 10 pass, 0 fail. |
| Temp names | `8635bd18b` | `uniqueTmpTag()` at `case-runtime.mjs` and `recover.mjs`. | case-runtime, dispatch-recovery, architecture: 74 pass. |
| Mint facade | `3121e5992` | `session-identity.mjs` exports `identityDoor()`; `identity-mint.mjs` uses it and drops its copy. The `mkdirSync(stateRoot)` in the mint facade stays (moving it needs a Rust door change; not in scope). | session-identity 44 pass; mint-door 2 pass. |
| One route environment | `af4a4712c` | `routeEnv` moved to `src/util/host-bin-path.mjs` (already a kernel row, so no manifest edit). Imported by `holder-lock` (driver, index, hold-transport), seat-binding client, terminal-control client, run-supervisor checks, identity checks and `probeIdentity`, and the hook. The three hand-written `delete env.FGOS_INVOCATION_RECORD_PATH` copies are gone. Orphan doc comment moved onto `interpretRoute`. | New owning test in `host-bin-path.test.mjs`; consumers' tests (session-identity, seat-binding client, terminal-control route, setup rows, hook): 94 + 61 pass, 0 fail. |
| Id generator | `b767694b3` | Deleted `scripts/next-doc-id.mjs` and its test; removed the exclude entry and, with it, the now-empty exclude plumbing in `check-decision-codes.mjs`; removed its row in `test/suite-baseline.json`. Retired: the check-decision-codes case "next-doc-id.test.mjs is excluded..." (the exclusion is gone). `docs/` still mentions the script (frozen). | check-decision-codes: 19 pass. |
| Git doctor rows | `226cbaa03` | `checkGit` takes the doctor `run`; the five rows share one `inspectGit` (and one worktree-recovery view), through `createDoctorRun`. | New proof in `test/setup/git-checks.test.mjs` (one inspection per run); git-checks + native-load + worktree-recovery: 32 pass, 0 fail. |
| Recovery decisions in the adapter | none (left) | See "Skipped". | n/a |
| Legacy import verb | `c8fb19bf7` | Deleted verb, `bin/fgos.mjs` route, registry entry, use case, `import-legacy.test.mjs` (behaviour removed; no new owner), and the usage assert in `triggers.test.mjs` now lists four verbs. CHANGELOG `[Unreleased]` line added, and the earlier "`import-legacy` stays" clause removed. | triggers + command-registry: pass; architecture red as stated above. |
| Stale migration wording | `1eb5130ce` | Reworded: `.gitignore`, hook fence comment, `event-store/native.mjs`, `regenerate-observe-fixtures.mjs`, `route.rs` and the `quiesce-scan` protocol note. Module `legacy_import.rs` **not renamed**: the name is a public module of `fgos-event-store` used by `packages/git/node-addon/src/event_store.rs`, `apps/fgos/src/wiring/identity_log.rs` and several crate tests, and `HolderAuthority::legacy_import` lives in the Git crate; that is not a pure in-crate rename. Its module doc already describes the fence. | `cargo clippy -p fgos-holder-lock -- -D warnings` clean; msvc `cargo check` ok; registry-contract + triggers: 30 pass. |
| One proof of hook refusal | `27476e80d` | The land test dropped its repeat of "a commit is refused while main is held" and its title now says what it owns. | land-vs-manual-commit + activity-beacon: 13 pass. |

Owning proof for "the hook refuses a commit while main is held": `test/e2e/main-checkout-activity-beacon.test.mjs`, "a commit is refused while fgOS holds main, without waiting, and writes no beacon".

## Skipped, and why

- **Keep on `unreadable` views** (dev-host): not applied by decision. 440 of 612 views here are unreadable (other users, kernel threads); keeping on them would pin every directory. Our detached child runs as our own user.
- **Recovery choices in `git-checks.mjs`** (`fixGitOperationRecovery`). They cannot move without a contract change. The checkout custody (`dispatch-cwd`, a holder-lock lock held by Node and passed to `reconcile` as a loan), the "checkout gone" test and the choice of recoverable kinds would have to move into the Rust Recovery port: `reconcile` would take the lock itself, return kept-reasons, and a list-and-recover operation would replace Node's loop. That changes `packages/git/contracts/ports.v1.json` and Git Rust (OPC). The file is now 193 lines (budget 150 already missed at close).
- **registry-contract restatements.** The audit's claim does not check out: `scope_rank.rs` pins acquisition order, not exact ranks, paths or owners, and the schema test checks shape, not values. The five tests are the only direct pin of those values, so folding or removing them would weaken a proof. Left as is.
- **Borrow-hook stale-descriptor test** (`main-checkout-borrow-hook.test.mjs`, "a stale FGOS_LOCK_FD ..."). I kept it whole. Its held half proves a stale `FGOS_LOCK_FD` is not taken as a borrower; no other test covers that input. Only the land test was a pure repeat.
- **`mkdirSync` in `identity-mint.mjs`** (second half of that audit row): needs the Rust door to create the root; out of scope.

## Census

`node scripts/git-one-door-scan.mjs --root . --write-census` run before every commit that touched scanned files; 0 undeclared sites each time. The census file was staged in each commit it changed (line-shift churn only). `test/git/e3-census.test.mjs` and `test/git/one-door.test.mjs`: 11 pass.

## Net change

`git diff --stat origin/main...HEAD | tail -1` before this report: 45 files changed, 346 insertions(+), 530 deletions(-) (about 100 insertions are census line shifts).

## Docs frozen, to pick up elsewhere

- `docs/architecture-manifest.json:352` (row above).
- `docs/platform/config/spec.md` mentions `native-addon.json` as a route; `docs/` still mentions `next-doc-id`, `events import-legacy` and the Windows hook probe path.

## Unresolved questions

1. Nothing was run on Windows; the hold-helper probe is proven through a stand-in host on Linux and by msvc compile only (no Rust changed for it).

## Review fixes

Review verdict was CHANGES (independent review plus OPC on the Windows test). One commit per item.

| Item | Commit | Result |
|---|---|---|
| Windows lock probe | `958812a82` | The `lock-hold` probe is gone (`probeSharedSync`, the `mode` argument it added to `startHold`, and its three stand-in tests). The `lock-fd` route has `--shared-try-path <lockFile>` (`packages/holder-lock/rust/src/route.rs`, contract `internal-route.lock-fd.v1.json`): it opens the existing file **read-only** (never created, truncated or cleaned; no predecessor admission), takes one non-blocking shared try through the driver's `lock_description`, **releases and closes before it writes the answer**, and answers free, held or unavailable on the same lines and exit codes as the descriptor form; an unopenable file is an error. The descriptor form shares the same probe function and is unchanged; the path form is accepted on Unix too (one argument shape for the logic, no Unix behaviour change). The hook calls it through `runLockRouteSync` on the hold transport, and refuses on any other answer. Proofs: Rust `shared_try_path_answers_free_or_held_without_creating_or_obstructing` (Linux), and `windows-borrow.test.mjs` "the shared try by path answers free on an unheld lock, then held while a holder holds it, then free" against the real host (win32-gated; skipped here, **not run on Windows**). |
| Windows borrower check | `e9bbc7687` | The door already has one: `checkBorrowedDescription` goes to `checkBorrowedJob` (route `--borrowed-check <path>` with `FGOS_LOCK_JOB`) on the hold transport, a cold process call with no in-process door. The hook now asks when `FGOS_LOCK_FD` or `FGOS_LOCK_JOB` is set. Nothing invented. No Windows run. |
| Caller-named time in `tx.append` | `ca3716d5d` | `rg` over src, bin, scripts, packages, apps, test and the hook: no caller passes `ts`. Contrary to the review, a proof existed: `hot-lock-tx.test.mjs` "an append keeps a given ISO time and refuses one that is not an ISO time", which exercised only the removed path. Deleted the override and `isExactIsoTime`; that test became "an append is stamped when it is acknowledged, whatever time the caller names". |
| Dev-host prune | `a72db9996` | `pruneRunDirs` takes an optional `views` (the scan; default is the real scan, taken once), mirroring `releaseRunDir`. Proof: a stale directory is removed when the scan is `unsupported`. The duplicate young-directory half is retired (owned by "an unused staged host is removed at once, and a young one is never pruned..."). Each removal is wrapped: a failure leaves the directory for the next prune and never throws; a scan failure still surfaces. |
| One-inspection comment | `95cd1aac4` | Comment now names the extra inspection for a non-origin remote and the worktree recovery view. |

Checks:
- Tests: `cargo test -p fgos-holder-lock` all green; `cargo test -p fgos --test internal_lock_routes` 8 pass; `cargo clippy -p fgos-holder-lock -p fgos --tests -- -D warnings` clean.
- `cargo check -p fgos-holder-lock -p fgos --target x86_64-pc-windows-msvc`: ok (target installed). `--target aarch64-apple-darwin`: ok (installed).
- Node: lock-hook, borrow-hook, hold-transport-borrow, windows-borrow (skipped off Windows), registry-contract: 35 pass, 0 fail, 5 skipped; hot-lock-tx 13 pass; work-gate and runtime-coordination pass; dev-host staging and dev-host: 18 pass.
- Census: scan run before each commit, 0 undeclared sites, census file staged in each.
- Still open: `docs/architecture-manifest.json:352`; nothing run on a real Windows machine.
