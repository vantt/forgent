# Credential and confinement doors (branch `harden/t5-p03`, base `7a4fa3654`)

Phase file: `plans/261106-0950-harden-t5-execution-core/phase-03-credential-and-confinement-doors.md`. Rebased onto `origin/main` `166afbc53` (P07 landed); hashes below are after the rebase. Every command below ran in the worktree with every `HERDR_*`/`CLAUDE*` variable unset, `PATH=$HOME/.cargo/bin:$PATH`, `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/cargo-harden-t5-p03`. No Rust change.

## Commits

| Commit | What |
|---|---|
| `095ba3687`, `c61111b0c` | red rows taken from `origin/harden/t5-p01-red-proofs` (`4ec72bfb2`, `d4b67c065`), unchanged |
| `02d8bba46` | masks, host record, settle restored, probe gate, attestation default removed, doctor row, CHANGELOG |
| `1264925fc` | `test/workflow/units-runner.test.mjs` fixture: the account's login store was the project directory itself |
| `b15d27f7c` | dead unsupervised branch of `prepareConfinementForLaunch` deleted; comment trim to keep confinement in budget |
| `0797ecb5b` | security review fixes (all items below) |
| `4e23cc237` | spec lines (agent-confinement §9.3, runner RUL75/RUL80 change notes) |
| `daf65a24f` | an executor `homeEnv: HOME` is no login store; the live mailbox harness resolves no confinement root |

## What changed

- **Masks.** `MACHINE_PRIVATE_ROOTS` gains `{loginStore}`. `machineLoginStores` (in `resources.mjs`) reads the machine config through the config door (`readMachineConfig`, accounts layer included when unconfined) and returns every store of `runner.llmAccounts.*.*.credentialStore.*` and of `runner.providers.*.accounts.*.credentialSource(s).home`, expanded with `expandCredentialHome`, plus each executor's `credentialStore` home: the runner's own value of `homeEnv`, else the CLI default (`codex` `~/.codex`, `pi` `~/.pi/agent`, `omp` `~/.omp/agent`; the omp default read from the omp binary's own strings). Each existing store is a `--tmpfs` mask, outermost only. Refused by name: relative path or file `login-store-not-a-directory`, the home or a parent of it `login-store-is-home`, unreadable config `login-store-inventory-unreadable` (all surface as assess mismatches, so the launch is refused, never skipped). `gh` and `~/.ssh` are not added. The machine-private probe plants a stand-in store (`loginStores` injected) and gains the falsifier `login-stores`; `computeProbeFingerprint` hashes the list, so attestations re-probe once (CHANGELOG says so).
- **Host record (A7).** `prepareBwrapSync` writes `<tempRoot>/<dispatchId>/attempt-home.json` (0600, dispatch dir 0700) for every attempt private home: `attemptId`, `runDir`, `dispatchId`, `home`, `credentialWriteBack` (the object the descriptor holds), later `credentialKept`. Prepare rollback removes it. `finalizeAttemptHome` reads and counts only there (`countCredentialKeep(homeDir, fields)`; a home with no record gets one written from the descriptor's data on its first failure); the marker keeps identity only. `listKeptCredentialHomes` returns the record (null for a home an older release counted in its marker). `settleHeldCredentialHomes` (cleanup.mjs, prior-art shape from `0f6843fc6^`) stages a held home's login from the record and removes home + record + dispatch dir; a home without a record stays held. Triggers: `fgos doctor --fix` (all scan roots, unretried roots count as held, as before) and the end of every `finalizeAttemptHome` (same temp roots as the attempt's homes).
- **Probe gate (A8).** `writeBackRenewedCredential` only stages: pending name `<ts>-agent-<pid>-<hex>`; it never applies; it still drops redundant copies under a lock it tries once. `applyLeftovers` skips agent copies. `refreshAhead` runs `applyAgentCopies` under the account lock: not newer → dropped; newer and of another account → dropped, stderr `credential-copy-refused (account-mismatch)`; no identity on either side, or undetermined → kept; otherwise the existing credential probe runs against the copy itself (`spawnHolding`), failure keeps it and records a cooldown, success re-checks the identity on the post-probe copy and applies. Identity: superseded by the security review fixes below (provider-signed claim only, proven by a renewal). fgOS scratch copies (`renewInScratch`, pending `<ts>-<hex>`) keep today's path.
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

Retired (owner in commit `02d8bba46` body): "a busy account lock stages the copy … the next refresh-ahead applies it" → rewritten as the first A8 test; "an omp copy renewed inside a pane is written back as a row update" → row update owned by "omp apply updates only the matching row inside a transaction", write-back no longer applies; "a retained home written back after its renewed access token expired …" → "a staged copy applied after its access token expired is applied, …"; "write-back reports applied or unchanged … when the lock is free" → behaviour removed; "the fix never removes a held home …" → rewritten as "the fix settles a held home from its host record, and never one without a record, whatever its marker names".

Changed expectations (behaviour moved, same file owns it): attempt-steps "finalize-home after a timeout stages the renewed login beside its account …" and "… writes back only where the descriptor says" now assert the staged copy, not an applied source; the budget test reads the count from the host record. `units-runner.test.mjs` (3 cases) named the workspace itself as the account's login store, which the new masks correctly refuse (`machine-private-hides-workspace`); the store now sits in its own fixture directory.

Test cost: no new spawns besides the existing real-bwrap red row and probe variants; the A8 tests use the injected fake spawn.

## Proofs run

- Focused (FR one-liner): every test file importing a changed module (47 files) plus `units-runner`, `doc-health`, `check-decision-citation-drift`, `provider-credential-probe`, `architecture`: 723 pass / 0 fail after the last commit (`release-targets` excluded there: it needs a release build and failed for that reason alone in the first focused run; it passes in the full suite).
- Confined placement of the record (scratch script, real bwrap, record written by `prepareBwrapSync`): temp root under `/tmp`: the sandbox's own tmpfs shows only `home` (no record), a write lands in the sandbox tmpfs, host record intact; temp root under `/var/tmp`: the record is visible read-only, the write fails `Read-only file system`, host record intact. Not forgeable either way; under a non-`/tmp` root it is readable (names, paths, attempt id, no secret).
- Full suite (`node scripts/run-tests.mjs`, after `b15d27f7c`): 8745 tests, 8712 pass, 1 fail (known frozen V7n addendum), 0 `run-tests: ERROR` lines. The first full run (after `02d8bba46`) found the 3 `units-runner` fixture cases, fixed in `1264925fc`.
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


## Security review fixes

Independent review of the branch found three High and six Medium items. Fixed in `0797ecb5b` unless named otherwise; proofs are the named tests (focused set of 62 files plus the terminal and mailbox files: 0 fail).

| Item | Fix | Proof |
|---|---|---|
| H1 `accountId` is a label the agent writes | The account is only the provider-signed claim of the access token (`https://api.openai.com/auth`.`chatgpt_account_id`; Codex and the `openai-codex` entries of pi/omp). Read from code and format: xai OAuth tokens carry no such claim (omp fetches xai identity from an endpoint, `fetchXAIOAuthIdentity`), so xai and any provider without the claim names no account and is never applied. Because a copy can hold the leased account's real access token beside another account's refresh token, a copy is proven by a renewal: an isolated copy is marked due, the probe makes the CLI redeem the copy's own refresh token, and only a new pair whose token names the leased account is applied. | "a renewed login is never applied while its tokens name no account the provider signs, whatever label it carries, …" (forged label); "a copy holding the leased account's access token and another account's refresh token is never applied"; "a login renewed in a private home is staged … applied only once a renewal with its own refresh token returns a token of the leased account" |
| H2 sibling homes readable outside `/tmp` | `{confinementRoot}` in `MACHINE_PRIVATE_ROOTS`: the registered roots (`credentialScanRoots`, handed in by the authority so resources never imports the registry: an import cycle the SCC test forbids), the default and the backend's own root are masked for every policy. One mount order for blind and non-blind: mounts outside masks, masks, own dir (blind), mounts inside masks (own home, program), `--remount-ro`. A root inside a writable mount refuses `confinement-root-in-writable-grant`. | real bwrap: "a blind worker cannot read … unblind it still reaches files but neither processes, a peer home nor the herdr socket" (fixture under `/var/tmp`, peer home `ENOENT`, own home writable); argv: "a non-blind dispatch's argv … masks only its confinement root, and binds its own home back after that mask"; "a confinement root inside a writable mount refuses the launch by name" |
| H3 probe on the agent's data, host cwd, full env | Probe sees an isolated copy: the login file alone, or for omp a fresh `agent.db` holding only the `auth_credentials` rows (columns quoted, values bound; the agent's other tables never reach the CLI). `runCredentialProbe` runs every probe with `cwd` and `HOME` = the probed home and only `PATH`, `LANG`, `LC_ALL`, `TZ`, `TERM` of the runner's env. Running the probe inside the confinement door would need the provider module to import confinement (forbidden by "no provider module reaches into confinement") or a new door: not done. | "an omp copy reaches the probe as a fresh database with its login rows alone, …" (tables seen by the CLI = `auth_credentials`); the codex A8 test asserts cwd, HOME and the env key set |
| M1 old-release copies skipped the gate | Only `<15 digits>-<8 hex>` and scratch homes are host copies; every other pending copy goes through the gate. | "a pending copy named the way an older release staged a private home goes through the probe gate" |
| M2 mask gaps | Known homes table (`codex ~/.codex $CODEX_HOME`, `pi ~/.pi/agent`, `omp ~/.omp/agent` `$PI_CODING_AGENT_DIR`, `claude ~/.claude $CLAUDE_CONFIG_DIR`, `agy ~/.gemini`): every default and every variable value, always. Executors read from the config the lease reads (`readConfig({projectRoot})`). Two consequences handled: a launch that declares no `credentialStore` reads its CLI's login in place (claude seats until the private-config phase lands), so that CLI's homes stay visible to that launch alone; a program installed inside a masked home (pi lives in `~/.pi/agent/bin` on this machine) is bound back alone (`launch-program`, read-only). `homeEnv: HOME` names the home, not a login dir, and is skipped (`daf65a24f`). The inventory walk moved to `llm-accounts.mjs` (the account module), which keeps the confinement directory within its line budget. | "every login store the inventory and the executors name is masked, …" (CODEX_HOME set: `~/.codex` still masked; in-place claude keeps `~/.claude`); terminal-cutover / terminal-fallback e2e (agent with `homeEnv: HOME`) |
| M3 settle target from the record | Record v2 holds `{attemptId, runDir, dispatchId, launchCommandId, home, credentialKept}`; settle reads `credentialWriteBack` from `runDir/protected/confinement-finalization/<launchCommandId>.json` only. The record is read with `O_NOFOLLOW`, and only as a regular file of this uid with one link, at most 64 KiB. | "the fix settles a held home from its host record, …" (descriptor-backed settle; a record reached through a link is ignored) |
| M4 agent can block settling | Write-back runs after the attempt's processes are gone: a login file or sidecar that cannot be read (mode 000, a directory as a sidecar, a link as a sidecar) is `home-unreadable`, no `keepHome`; finalize and settle remove the home and say so on stderr. | "a login file that cannot be read once its attempt is over is no login: …"; "a sidecar that cannot be read is never taken for an absent one, and keeps no home once its attempt is over" |
| M5 re-probe of a known-other copy | A copy whose signed account is another one is dropped before or after the probe (`credential-copy-refused`); only a copy that names no account is kept. | the mixed-token test above (pending directory empty afterwards); row "a renewed login whose account differs from the leased account is never applied" |
| M6 + Low | Spec lines written (`4e23cc237`): runner spec RUL75 and RUL80 change notes, agent-confinement §9.3 `{loginStore}` and `{confinementRoot}`. `publishSecretSideFile` and `consumeSecretSideFile` deleted (no caller); stale comments in `attestation-store.mjs`, the `prepareConfinementForLaunch` doc and the `protected` 0700 comment fixed. The held-home test uses its own temp root. "write-back never waits for the lock" is asserted again in the first A8 test. omp gate test added. `extendOwnershipMarker` (no production caller) replaced by a test helper `test/helpers/ownership-marker.mjs`; `home-marker.v2.json` says the marker has no extension. | doc-health and citation-drift run (see below) |

Other files touched for the review: `scripts/lib/mailbox-live-confined.mjs` (MAIL lane's live harness, one argument): it uses its run base as the temp root and binds it read-only so its runs share one mailbox record; it now passes `confinementRoots: []`, keeping its behaviour (`daf65a24f`).

Full suite after `daf65a24f` (base `166afbc53`): 8738 tests, 8703 pass, 3 fail, 0 `run-tests: ERROR` lines.
- frozen V7n addendum: known red.
- doc-health live self-check: dead reference `docs/storytelling-material/` in `docs/platform/governance.md` from the base; fixed upstream by `b1ef08a8f` (not in this branch's base). Not a file of this branch.
- mailbox-live-confined "the orphan sweep kills a run the harness did not finish …": load-dependent; the file passed twice in a row alone (19/19) right after.

Size after the review (`166afbc53..HEAD`, P01 rows included): Node src+scripts +537 / −296 = **+241**; tests +508 / −179 = **+329**; confinement directory **5 949** (budget 5 950).

## Concerns

- No xai login (pi or omp) renewed inside a pane is ever applied automatically any more: its tokens carry no provider-signed account, so the copy waits for the owner (doctor lists it) while the leased store keeps a refresh token the pane already spent. Until a verifiable identity exists for xai (an identity endpoint call made by the host, which would be a new mechanism), every xai pane renewal means a hand recovery. Owner choice: accept that, or have the confined xai pane not renew inside the home (refresh-ahead before launch with a wider window).
- Masking `~/.claude` waits on the launch declaring no login store; once the private-config phase gives claude panes a `credentialStore`, `~/.claude` is masked for them too, as intended.
- Running the probe inside the bwrap door was not done (the provider modules may not import confinement); the probe runs unconfined on an isolated, minimal copy.

Status: DONE_WITH_CONCERNS
Summary: Login stores, every CLI login home and every private-home root are masked; held homes settle from a host record that names only the descriptor; a renewed login is applied only when a renewal with its own refresh token returns a token the provider signed for the leased account. All review items are fixed; the full suite fails only the known V7n test, a doc-health dead reference already fixed on main, and one load-dependent mailbox test.
Concerns/Blockers: xai pane renewals are never applied automatically (owner choice); the probe runs isolated but outside bwrap.
