# Credential and confinement doors (branch `harden/t5-p03`, base `7a4fa3654`)

Phase file: `plans/261106-0950-harden-t5-execution-core/phase-03-credential-and-confinement-doors.md`. Every command below ran in the worktree with every `HERDR_*`/`CLAUDE*` variable unset, `PATH=$HOME/.cargo/bin:$PATH`, `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/cargo-harden-t5-p03`. No Rust change.

## Commits

| Commit | What |
|---|---|
| `930b07f03`, `03fe4484f` | red rows taken from `origin/harden/t5-p01-red-proofs` (`4ec72bfb2`, `d4b67c065`), unchanged |
| `65e06ba8e` | masks, host record, settle restored, probe gate, attestation default removed, doctor row, CHANGELOG |
| `b153aa4ae` | `test/workflow/units-runner.test.mjs` fixture: the account's login store was the project directory itself |
| `c55afb847` | dead unsupervised branch of `prepareConfinementForLaunch` deleted; comment trim to keep confinement in budget |

## What changed

- **Masks.** `MACHINE_PRIVATE_ROOTS` gains `{loginStore}`. `machineLoginStores` (in `resources.mjs`) reads the machine config through the config door (`readMachineConfig`, accounts layer included when unconfined) and returns every store of `runner.llmAccounts.*.*.credentialStore.*` and of `runner.providers.*.accounts.*.credentialSource(s).home`, expanded with `expandCredentialHome`, plus each executor's `credentialStore` home: the runner's own value of `homeEnv`, else the CLI default (`codex` `~/.codex`, `pi` `~/.pi/agent`, `omp` `~/.omp/agent`; the omp default read from the omp binary's own strings). Each existing store is a `--tmpfs` mask, outermost only. Refused by name: relative path or file `login-store-not-a-directory`, the home or a parent of it `login-store-is-home`, unreadable config `login-store-inventory-unreadable` (all surface as assess mismatches, so the launch is refused, never skipped). `gh` and `~/.ssh` are not added. The machine-private probe plants a stand-in store (`loginStores` injected) and gains the falsifier `login-stores`; `computeProbeFingerprint` hashes the list, so attestations re-probe once (CHANGELOG says so).
- **Host record (A7).** `prepareBwrapSync` writes `<tempRoot>/<dispatchId>/attempt-home.json` (0600, dispatch dir 0700) for every attempt private home: `attemptId`, `runDir`, `dispatchId`, `home`, `credentialWriteBack` (the object the descriptor holds), later `credentialKept`. Prepare rollback removes it. `finalizeAttemptHome` reads and counts only there (`countCredentialKeep(homeDir, fields)`; a home with no record gets one written from the descriptor's data on its first failure); the marker keeps identity only. `listKeptCredentialHomes` returns the record (null for a home an older release counted in its marker). `settleHeldCredentialHomes` (cleanup.mjs, prior-art shape from `0f6843fc6^`) stages a held home's login from the record and removes home + record + dispatch dir; a home without a record stays held. Triggers: `fgos doctor --fix` (all scan roots, unretried roots count as held, as before) and the end of every `finalizeAttemptHome` (same temp roots as the attempt's homes).
- **Probe gate (A8).** `writeBackRenewedCredential` only stages: pending name `<ts>-agent-<pid>-<hex>`; it never applies; it still drops redundant copies under a lock it tries once. `applyLeftovers` skips agent copies. `refreshAhead` runs `applyAgentCopies` under the account lock: not newer → dropped; newer and of another account → dropped, stderr `credential-copy-refused (account-mismatch)`; no identity on either side, or undetermined → kept; otherwise the existing credential probe runs against the copy itself (`spawnHolding`), failure keeps it and records a cooldown, success re-checks the identity on the post-probe copy and applies. Identity per layout: Codex the access token's `https://api.openai.com/auth`.`chatgpt_account_id` claim; pi the entry's `accountId`; omp `accountId` in the row's `data`. fgOS scratch copies (`renewInScratch`, pending `<ts>-<hex>`) keep today's path.
- **Doctor `credential-copies-retained`.** Held home with a record: "Its host record names where its login goes: `fgos doctor --fix`, or the next attempt that ends under the same root, stages the login …"; without one: the old recover-by-hand text. Agent copies get their own warning row. Fix message: `held private home(s): N settled, M still held (one without a host record is recovered by hand)`.
- **Dead code.** `buildConfinementAttestation`: unused `error` parameter and the `completed` default removed (`rg "phase: ['\"](completed|failed)['\"]" src` finds nothing; callers name the phase; 11 test calls now pass `phase: "prepared"`). `prepareConfinementForLaunch`: its one production caller (`assignment-runner.mjs:1903`) always sets `attemptId: launchCommandId`, and `launchCommandId` is already required, so the unsupervised branch (v2 cli-spawn envelope, `protected/secrets/*.env.json`, the herdr-spawn refusal after preparation) had no caller and no reader (`rg cli-spawn-launch-envelope|protected/secrets` in src/test: only that branch); a request without `attemptId` is now refused `attempt-required` before anything is prepared.

## Red → green

| Row | File | Red on base (observed) | Green |
|---|---|---|---|
| a confined worker cannot read a login store the account inventory names | `test/runner/dispatch-confinement-machine-private.test.mjs` | `the worker read a login store the account inventory names` | yes |
| a renewed login whose account differs from the leased account is never applied | `test/runner/provider-credential-renewal.test.mjs` | `the leased account's login was replaced by the login of another account` | yes |
| a held home settles by itself once its login is safe | same | `the held home is still there although its login can now be written back` | yes |

Fixture changes to the rows (as P01 allowed): row 4 puts the account in the Codex access-token claim instead of `tokens.account_id`, and also asserts the refused copy is not kept. Row 5 keeps the doctor fix as trigger; the pi login carries `accountId`, the test is async and adds one `refreshAhead` (fake spawn) after the fix, because settling stages the login and only the probe-gated refresh-ahead applies it.

## Tests added, retired, changed

Added: "every login store the inventory and the executors name is masked, and one that is relative, a file or the home is refused by name" (machine-private); "a login renewed in a private home is staged at write-back, and applied by the next refresh-ahead once the probe accepts it and it names the leased account"; "a login renewed in a private home is never applied while it names no account, or while the probe rejects it" (renewal). Extended: probe falsifier `login-stores`; the prepare test asserts the host record; the kept-home budget test plants a spent budget in the marker and proves it is not read; the launch-door test proves `attempt-required`.

Retired (owner in commit `65e06ba8e` body): "a busy account lock stages the copy … the next refresh-ahead applies it" → rewritten as the first A8 test; "an omp copy renewed inside a pane is written back as a row update" → row update owned by "omp apply updates only the matching row inside a transaction", write-back no longer applies; "a retained home written back after its renewed access token expired …" → "a staged copy applied after its access token expired is applied, …"; "write-back reports applied or unchanged … when the lock is free" → behaviour removed; "the fix never removes a held home …" → rewritten as "the fix settles a held home from its host record, and never one without a record, whatever its marker names".

Changed expectations (behaviour moved, same file owns it): attempt-steps "finalize-home after a timeout stages the renewed login beside its account …" and "… writes back only where the descriptor says" now assert the staged copy, not an applied source; the budget test reads the count from the host record. `units-runner.test.mjs` (3 cases) named the workspace itself as the account's login store, which the new masks correctly refuse (`machine-private-hides-workspace`); the store now sits in its own fixture directory.

Test cost: no new spawns besides the existing real-bwrap red row and probe variants; the A8 tests use the injected fake spawn.

## Proofs run

- Focused (FR one-liner): every test file importing a changed module (47 files) plus `units-runner`, `doc-health`, `check-decision-citation-drift`, `provider-credential-probe`, `architecture`: 723 pass / 0 fail after the last commit (`release-targets` excluded there: it needs a release build and failed for that reason alone in the first focused run; it passes in the full suite).
- Confined placement of the record (scratch script, real bwrap, record written by `prepareBwrapSync`): temp root under `/tmp`: the sandbox's own tmpfs shows only `home` (no record), a write lands in the sandbox tmpfs, host record intact; temp root under `/var/tmp`: the record is visible read-only, the write fails `Read-only file system`, host record intact. Not forgeable either way; under a non-`/tmp` root it is readable (names, paths, attempt id, no secret).
- Full suite (`node scripts/run-tests.mjs`, after `c55afb847`): 8745 tests, 8712 pass, 1 fail (known frozen V7n addendum), 0 `run-tests: ERROR` lines. The first full run (after `65e06ba8e`) found the 3 `units-runner` fixture cases, fixed in `b153aa4ae`.
- `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared; census regenerated in each src commit.

## Size

| | Phase estimate | Measured (`7a4fa3654..HEAD`) |
|---|---|---|
| Node `src` | +90 | +353 / −211 = **+142** |
| Tests (P01 rows +148/−2 included) | +100 | +304 / −128 = **+176** (fix commits alone +30) |
| Rust | 0 | 0 |
| Confinement dir (budget ≤ 5 950) | — | 5 892 → **5 950** |

Over the Node estimate by about 50: masks with refusals and executor homes (+74 in resources), host record + restored settle (+69 in cleanup), probe gate and identity (+77 in renewal), offset by the unsupervised envelope path (−97 in authority).

## Deviations from the phase file

- Record name `attempt-home.json` is a fixed constant: `fgos convention name` names repository artifacts (report/plan/journal), not runtime files.
- Settle trigger is `finalizeAttemptHome` + `doctor --fix`, not a `heldHomes` hook in `refreshAhead`: the hook needs `run.mjs`/`cli.mjs` to wire a confinement-aware renewal (`run.mjs` is P07's this wave), and the test "no provider module reaches into confinement" forbids the renewal module importing it. Since write-back now only stages (no lock, no apply), settling fits the finalize step; the next refresh-ahead applies through the probe gate.
- Unidentifiable logins: per the phase, never applied automatically. Real pi/omp logins of providers that keep no `accountId` (likely xai through omp) will therefore wait for the owner after every pane renewal instead of being applied; see Concerns.
- `extendOwnershipMarker` now has no production caller (tests still use it to plant marker fields, and `home-marker.v2.json` names it); left in place, item for P12.
- Spec lines (agent-confinement §3.2 non-goal, §9.3 roots, the host record format) left to P13 as the plan's table says; CHANGELOG written.

## Items for other phases

- P12: retire `extendOwnershipMarker` (tests `sweep`, `reaper-fence`, `credential-copies-retained-check`, renewal; contract `home-marker.v2.json`).
- P13: spec §9.3 gains `{loginStore}`; non-goal becomes "only the attempt's own login"; on-disk format row for `attempt-home.json` and agent-origin pending names; comment in `attestation-store.mjs:8` still names the deleted `cli-spawn-launch-envelope.v2` (not this phase's file).
- Owner-machine guide: after landing, `fgos doctor` rows `confinement-blind-read`, `confinement-probe-freshness` (re-probes once), `credential-copies-retained`; a confined seat smoke per CLI family. Rollback: an old release ignores the host records (homes stay held) and applies `-agent-` pending copies without the probe.

## Concerns

- A pi or omp login that stores no `accountId` (the identity field the phase names) is never applied automatically after a pane renews it, so the leased account's own store keeps the spent refresh token and the next renewal fails until the owner copies the pending login by hand (doctor names it). Whether the xai logins on fg-server2 carry `accountId` was not checked (real stores are off-limits). If they do not, the owner must choose: accept hand recovery, or allow a probe-only apply for layouts without an identity (the A8 residual reopens for them).

Status: DONE_WITH_CONCERNS
Summary: Login stores are masked from confined workers, held homes settle again from a host-only record, and a renewed login from a private home is applied only after the probe and an account match; the three red rows are green and the full suite fails only the known V7n test.
Concerns/Blockers: pi/omp logins without `accountId` are never applied automatically after a pane renewal (owner choice needed if xai logins lack it); Node size +142 vs +90 estimate.
