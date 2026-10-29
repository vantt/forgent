# HARDEN batch B: phase lead report

Worktree `/home/vantt/projects/forgent-worktrees/harden-batch-b`, branch `harden/recheck-new-batch-b`, 12 commits on top of origin/main (`0fa0c0129`). Not pushed, not merged. Each commit that touched covered files also carries the regenerated `packages/git/contracts/mutation-census.v1.json` (line shifts only; the scan reports 0 undeclared sites).

Test method: focused `runChosenTests` only; Rust `cargo test -p <crate>` with `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/harden-batch-b-target`, clippy `-D warnings` and `cargo check --target x86_64-pc-windows-msvc` (the target is installed). No `npm test`, no `cargo test --workspace`.

## Per item

Net size is lines added/removed, split Node / Rust / tests+fixtures / contracts+other (the census file excluded).

| # | Item | SHA | Node | Rust | Tests + fixtures | Contracts |
|---|---|---|---|---|---|---|
| 1 | N1 envPatch | `18b50dba8` | +1 -22 | | +1 -18 | |
| 2 | N4 dependencies-installed row | `3697c07c3` | -36 | | -1 | |
| 3 | N5 + N9 + N10 | `dc79704d1` | | +26 -32 | +83 -25 | |
| 4 | C1 addon trusted root | `07635f4ef` | | +8 -53 | | |
| 5 | C2 one detector | `9a26ee453` | | +41 -63 | | |
| 11 | extra: retire insert and set_inline_comment | `5e944a8fb` | | +13 -205 | +56 -746 | -12 |
| 6 | C3 one home resolver | `8bcedcd94` | | +23 -16 | +7 -1 | |
| 7 | C7 + C8 doctor rows | `3e1953acd` | +26 -117 | | +13 -18 | |
| 8 | C9 platform-unsupported warning | `9013ee20b` | +10 -1 | | +20 | |
| 9a | C10 dead Rust and failure ids | `0714da481` | | -24 | +4 -39 | +16 -11 |
| 9b | C14 (event store, terminal) | `77581731b` | +9 -14 | | +6 -6 | |
| 9c | C16 lock-holder helper | `db770a620` | | | +35 -67 | |
| 10 | Frontmatter | none | | | | |

### 1. N1 `18b50dba8`
Deleted `resolveEnvPatch`, the `envPatch` field of the render result and its doc line. Retired the test that only proved `resolveEnvPatch` and the two `envPatch` assertions in the glm render test. Owner of `${VAR}` expansion: `test/runner/dispatch.test.mjs` ("resolveExecutorEnv substitutes ${VAR} against baseEnv...", "... returns empty object when rawEnv is absent or invalid"). Tests: provider-adapter 69 pass, 0 fail, no ERROR lines.

### 2. N4 `3697c07c3`
Deleted the `dependencies-installed` check, its comment and function (one contiguous region in `registrations.mjs`; the `fs`/`path`/`resolveMainCheckout` helpers it used are still used elsewhere) and its entry in `checks.test.mjs`. Tests: checks.test 46 pass, doctor-fresh-run 1 pass.
CONCERN: `test/setup/registrations.test.mjs` "Data Dictionary #7 names exactly the registered doctor checks" now FAILS (1 fail) because `docs/specs/distribution.md:77` still names `dependencies-installed`. Docs are frozen, so the fix is a docs line (below). Land this branch together with, or after, that docs change.

### 3. N5, N9, N10 `dc79704d1`
- N5: one `Value::json(refuse_non_finite)` walker in `model.rs`; `Value::to_json` and `Document::to_json` both call it; `json_of` deleted.
- N9: retired the no-addon case in `test/util/yaml.test.mjs` (and its now-unused imports). Owner: `test/git/native-load.test.mjs` (the "descriptor beside the payload ... git-addon-not-shipped" case).
- N10: `api_seal.rs` now walks every Cargo manifest under the root, `apps`, `packages`, `tools` and `herdr-dashboard` (vendored and build output skipped) for `panic = "abort"`; the new `every_resolution_root_pins_the_vendored_parser` test requires every manifest that resolves on its own (own workspace table or lock) and reaches the parser to patch `saphyr-parser` and `arraydeque` to the vendored directories. It found 6 resolution roots (>= 4 asserted). `tools/*` probes are skipped by design: they do not reach yaml-doc.
Tests: `cargo test -p fgos-yaml-doc` all green (api_seal 10 pass), clippy clean, windows-msvc check clean (nothing cfg'd). Node yaml test 3 pass.

### 4. C1 `07635f4ef` (own commit, for OPC review)
`packages/git/node-addon/src/config.rs`: `trusted_root` calls `GitDriver::trusted_root_at` (disk-only topology, no `require_floor`, no repository facts) like `provider.rs`. Deleted `MEMO`, `MEMO_SLOTS`, `stamp_of`. Non-repository still answers the project itself; a failure keeps the id `config-trusted-root-unresolved` with the cause. Behaviour change to review: the Node readers no longer fail on a git-floor or repo-config refusal, and nothing is memoised any more (each Node config read pays the topology check; the audit says it is disk-only). Tests: config-door 9 + facade 10 = 19 pass (including "a linked worktree takes command values from the main checkout", the one proof of this route), `cargo test -p fgos-node-addon` 3 pass, clippy clean. The addon crate has a pre-existing windows-only dead-code warning (`Request::project`), not mine.
Note: `cargo fmt -p fgos-node-addon` would reformat 12 other files; I reverted that and kept only my hunk formatted.

### 5. C2 `9a26ee453`
`packages/config/rust/src/provider.rs` and `provider/unix_verbs.rs`: the private `Bundle` and its "until the PATH probe lands" comment are gone; the provider builds `PathDetectors { path: PATH }` and `machine::context`, and every verb takes `&Context`. `fgos config show/explain` (and the write verbs' validation) now see the detected executor, like Node `readConfig`. Tests: `cargo test -p fgos-config --features host-provider` 95 pass, clippy clean, windows-msvc check clean. No new test: the provider has no existing test that sets `PATH`, and one would need env mutation; the Node side already proves the detected value (`config-door` / authoring_equivalence). Say if you want a provider-level proof.

### 11. Extra: retire `insert` and `set_inline_comment` `5e944a8fb`
Proof of no caller: `rg` over `packages/`, `apps/`, `src/`, `bin/` finds no use outside yaml-doc's own tests, fuzz target and contracts (no config, addon, gateway, host-runtime or Node caller).
Removed: `Document::insert` and `insert_inner`, `apply_insert`, `Position` (the `After` variant had only `insert` as user, and `End` was only `plan_insert`'s default, so the whole type goes; `plan_insert` always appends after the last entry), the public re-export, `set_inline_comment` and its inner function. Consequences in the same commit: `sanitize_inline` (its only caller was `set_inline_comment`), the three rule ids `inline-comment-multiline`, `inline-comment-empty`, `inline-comment-unplaceable` (rule list 32 -> 29; `refusal-rules.v1.json` updated, `fixture_shape` pins code and file equal), the 12 `inline` comment fixtures, the 12 `setInlineComment` edit fixtures, the API-seal table rows, the fuzz target (ops 7 -> 4).
Fixtures NOT lost: of 16 `insert` edit cases, 13 exercised the new-key layout code that `set` of a missing key still runs (CRLF, no trailing newline, quoting, flow rewrite, comment-would-be-lost). They were converted to `set` ops with the same input and expectation (renamed `set-new-key-*`); one was an exact duplicate of an existing set case and was dropped. Dropped with the API: `insert-after-sibling`, `insert-after-non-ascii-sibling`, `insert-existing-key-refused`. Edit fixtures 114 -> 98; comment fixtures 40 -> 28.
Tests: `cargo test -p fgos-yaml-doc` all green, clippy `-D warnings` clean, `cargo check -p fgos-config -p fgos-node-addon --all-targets` clean. The fuzz crate (`packages/yaml-doc/rust/fuzz`, outside the workspace) could not be compiled offline (libfuzzer-sys not vendored); I edited it by hand, so check it when a fuzz run is next done.

### 6. C3 `8bcedcd94`
`fgos_config::machine::{HOME_VAR, home_dir}` (HOME on Unix, USERPROFILE elsewhere, blank is unset). Users moved: `machine::project_snapshot` (so work-state gate-bypass and herdr settings readers now find a home on Windows), `provider::roots`, and `apps/fgos-gateway/src/gateway.rs::load_gateway_config`. Tests that fed a literal `"HOME"` now use `HOME_VAR` (machine_view, herdr-fgos-common settings, work-state); machine_view gained a blank-home case. `cargo test` fgos-config 95 + work-state (105 total with it), herdr-fgos-common 25, gateway `cargo check --all-targets --offline` clean, windows-msvc check of config, work-state and herdr-fgos-common clean.
Left over (not touched, MAIL files): `apps/fgos/src/wiring/mailbox_config.rs:114` (`std::env::var_os("HOME")`; it also still rebuilds the bundle per hook call instead of `machine::context`), plus the other MAIL-owned HOME reads (`mailbox_identity.rs:32`, `mailbox_hook.rs:75`, `mailbox_verbs.rs:406`, `packages/mailbox/rust/store/src/hook/resolve.rs:47`). Outside MAIL and not a snapshot builder, left alone: `packages/observe/rust/src/sources/claude_transcripts.rs:134`, `packages/terminal-control/rust/src/driver/herdr.rs:73`, `packages/git/rust/src/driver.rs:596,1297`. `gateway.rs` now takes the home through `env::var` (not `var_os`): a non-UTF-8 HOME is "no home", as in the CLI provider.

### 7. C7 + C8 `3e1953acd`
- `config-checks.mjs`: the time-window memo is deleted; rows call `checkConfigOnce(cwd, run)` = `run.once('config-check:'+cwd, ...)`. A row called without a run (tests) reads for itself. The config module does not import `createDoctorRun` (it never imports the registry back), so the run is the argument the registry already passes.
- `registrations.mjs` `checkRunnerPatternsConfig(cwd, run)`: uses the same `checkConfigOnce` (one door read per doctor run for the 17 config rows plus this row), no longer re-derives legacy JSON (returns pass "not evaluated: ... reported by config-format-legacy-json" when that finding exists), one `display` helper instead of two label-to-path copies, `os.homedir()` instead of `process.env.HOME || os.homedir()`. Unused imports (`checkConfig`, `formatLegacyJsonAdvice`) dropped.
- Retired test: "runner-patterns-config: legacy json project file gives honest edit-then-migrate instruction" (it proved the duplicate). New owner of that failure: the `config-format-legacy-json` row (registered check; `test/config/config-door.test.mjs:73` and `facade.test.mjs` prove the finding; a replacement wiring test in `registrations.test.mjs` asserts the door row fails on `project:config.json` and the patterns row stays out). The richer "edit then migrate, naming the retired key" advice of the old row is no longer shown by this row; `formatLegacyJsonAdvice` is still used by COOK's conversion module (untouched).
- `config-checks.test.mjs`: the helper now passes one `createDoctorRun()` per simulated doctor run (the real calling convention); "one door call serves every row ... second run reads afresh" still passes.
Tests: config-checks, checks-doctor-config, registrations, checks, facade, runner-config-conversion: all pass except the N4 docs test above.
Not touched: `runner-config-conversion.mjs:272` still calls `checkConfig` itself (COOK's second caller, per your instruction).

### 8. C9 `9013ee20b`
`facade.mjs` `call`: when the door refuses with `config-platform-unsupported`, the process emits one warning (`process.emitWarning`, code `config-platform-unsupported`) saying that fail-closed readers use their default; the refusal is still thrown unchanged, so all 8 readers keep their behaviour. No new mechanism: one id constant and one flag in the one function every read goes through. Test: stubs the door to refuse and checks the refusal, `isConfigRefusal`, and exactly one warning across two reads. facade.test 11 pass. Not done: listing the door ids in `failure-codes.v1.json` and reading `DOOR_IDS` from there (the audit's second half); that is a contract change to the addon's ids (see open items).

### 9a. C10 `0714da481`
Deleted `Snapshot::require_accounts` and `Reason::suggested` (test-only callers), their fixtures (`grammar-reason-suggested*`, the `require_accounts` assertion; the snapshot case still proves the accounts layer is unavailable when confined), the `suggested-source-tag` entry of `comment-grammar.v1.json`, the stale "stubs" comments in `lib.rs`. `failure-codes.v1.json`: `config-addon-missing` replaced by the ids the Node door really throws (`git-addon-unavailable`, `git-addon-not-shipped`); `config-accounts-unavailable-confined` moved to `not-produced-here` (its producer is `src/runner/dispatch/provider-capacity.mjs:631`, owner proof `test/runner/provider-capacity.test.mjs:73`), and `failure-matrix.v1.json` `proven-in-rust` is now empty. Tests: fgos-config 95 pass, clippy clean; config-door 44 incl. provider-capacity pass.

### 9b. C13: gate-bypass level decided in one place: STOPPED, no change
Reachability answer: the Node `case 'gate-bypass'` (`bin/fgos.mjs:2261`) is NOT reachable through the supported door: `packages/host-runtime/contracts/command-routes.json:410` routes `gate-bypass` natively to `work.gate-bypass.show` (`packages/work-state/rust`). It IS reachable (and tested) through the direct legacy entry `node bin/fgos.mjs gate-bypass`: `test/cli/fgos-setup.test.mjs:117,120` spawns exactly that, and AGENTS.md lists only process, lock and identity verbs as unsupported there. Node `canAutoApprove` also needs the level in process (`src/state/gate-bypass.mjs`). So the single authority needs a new addon entry that exposes the Rust reader to Node (new surface), or removing the direct-entry verb and its test: both are decisions, not a deletion. Left as is.

### 9c. C14 (event store, terminal) `77581731b`; dispatch part STOPPED
- `EVENT_STORE_DEFAULTS` deleted; `eventStoreConfig` reads unset keys from `readStandardValue('eventStore')` (lazy, per call). The test that pinned the copy to the standard became "an unset eventStore key takes the bundled standard value".
- `DEFAULT_TERMINAL_CONFIG` deleted; the retain default is a literal `null` inside `defaultOf` (its standard value). The test that pinned the copy to the core's `capabilities.defaults` now reads `readStandardValue('terminal')`, so that proof stays.
- NOT done: the `dispatch` section (default 10 000 ms and validation of `gateKillGraceMs`/`cancelWaitMs` in `src/run-supervisor/gate-kill-grace.mjs`). Moving it needs a new section schema and standard file, a `bundle.rs` entry, the section lists in spec and fixtures: a config contract change, so I stopped (nothing half-edited).
Tests: all 11 event-store and terminal-control files, 134 pass, 0 fail, no ERROR lines.

### 9d. C16 `db770a620`
`tests/common/machine_fs.rs` gained `hold_lock(dir, name, lock)` (lock name and path are parameters; `hold` keeps its global-config meaning) plus the early-exit check the write test had; `write_concurrency.rs` includes it and lost its copy of `child_entry` body, `Holder`, `hold` and the env constants. Tests: `write_concurrency` 5, `machine_files` 3, `relocate` 2 pass; clippy clean.

### 10. Frontmatter: NOT done (cannot meet identical behaviour)
Measured with a throwaway test (deleted, worktree clean) comparing `parseFrontmatter` with `parseYaml` of the same block, values stringified: 1358 repo `.md` files with a parsed frontmatter, 1157 identical, 182 differ in value (the hand parser reads `description: >-` blocks and a `key: value` inside folded text as separate keys, so real YAML is more correct but not identical), 19 refuse with `syntax-error` where the hand parser is lenient. Under `docs/` and `plans/` only: 1140 of 1220 identical, 64 value differences, 16 syntax errors. The contract of `parseFrontmatter` is "never throws"; matching it would need a try/catch fallback to the hand parser, which deletes nothing. `renderFrontmatter` has no YAML writer to move to either. Recorded as: keep. The only open point is the exception's stated reason (zero dependencies), which no longer holds; the owner may still prefer a stricter parser and accept the 19 refusals (the repo's own `.claude/agents/council-*.md` would then need fixing).

## What was retired, and who owns the behaviour now

| Retired | Owner of the behaviour |
|---|---|
| `resolveEnvPatch` test and `res.envPatch` assertions | `resolveExecutorEnv` tests in `test/runner/dispatch.test.mjs` |
| `dependencies-installed` row and test entry | behaviour removed (row could not fail) |
| no-addon case in `test/util/yaml.test.mjs` | `test/git/native-load.test.mjs` |
| runner-patterns legacy JSON test | `config-format-legacy-json` row (`test/config/config-door.test.mjs`, new wiring test in `registrations.test.mjs`) |
| `insert`/`set_inline_comment` fixtures and tests | behaviour removed; new-key layout cases kept as `set` cases |
| `sanitize_inline` fixtures | behaviour removed |
| EVENT_STORE_DEFAULTS / DEFAULT_TERMINAL_CONFIG pin tests | rewritten against the standard files |
| `require_accounts` test assertion | behaviour removed (runner builds the refusal; `test/runner/provider-capacity.test.mjs:73`) |

## Docs lines needed (docs/ is frozen; nothing was edited)

1. `docs/specs/distribution.md:77`: remove the token `` `dependencies-installed`, `` from the doctor-check list. REQUIRED for green: `test/setup/registrations.test.mjs` "Data Dictionary #7" fails until then.
2. `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:222`: remove the `dependencies-installed` table row. `docs/knowledge/add-a-new-npm-dependency-to-forgent/*.md` should say to register a check together with the first dependency (audit N4).
3. `docs/platform/yaml-document/spec.md`: line 89 (`insert` row), line 92 (`setInlineComment` row), line 101 (`set`, `insert` and `remove` take one acknowledgement), lines 113 and 184 (inline comment text refusal), line 219 (decision row naming `insert`); the rule list of the spec if it names `inline-comment-multiline`, `inline-comment-empty`, `inline-comment-unplaceable` (checked: the contract file lists them, the spec text at 92 names `inline-comment-empty`); add a decision row for the 2026-10-29 owner retirement.
4. `docs/platform/config/spec.md`: lines 125, 214 and the 377 decision text name `[setup:suggested]` written by `init`/`doctor --fix` through `Reason::suggested`, which no longer exists; section 14 and 12 should name `git-addon-unavailable`/`git-addon-not-shipped` and say `config-accounts-unavailable-confined` is built by the runner; rule 6 (line 160) still says `snapshot` takes the main checkout root itself (audit C4, still open); section 2 dependency sentence (audit C15).
5. `CHANGELOG.md` `## [Unreleased]`: user-visible: `fgos config show` and `explain` now report the detected executor; the `dependencies-installed` doctor row is gone; `runner-patterns-config` no longer repeats the legacy JSON failure; a platform that cannot read config prints one warning.
6. `scripts/check-decision-codes.baseline.json:227` holds a stale entry for a test title (`dependencies-installed passes when package.json has no dependencies field`) that no longer exists in `checks.test.mjs` (it did not before my change either); not touched, outside my file list.

## Open items and unresolved questions

1. C13: pick one: add an addon entry for the Rust gate-bypass reader, or retire the direct-entry `node bin/fgos.mjs gate-bypass` verb and its test (`fgos-setup.test.mjs:117-122`).
2. C14 dispatch section: approve a `dispatch` config schema and standard (new section) or keep the Node defaults.
3. C9 second half: list the addon's door ids in `failure-codes.v1.json` and read `DOOR_IDS` from there?
4. C1 review (OPC): confirm that dropping the repository-facts check and the memo from Node reads is wanted (each Node config read now runs the topology check once more).
5. C2: want a provider-level test with a controlled `PATH`?
6. C3 left over: MAIL's `mailbox_config.rs` HOME read (and the other MAIL-owned HOME reads listed above) move when MAIL finishes.
7. The yaml-doc fuzz crate edit is uncompiled (libfuzzer-sys unavailable offline).
8. The N4 commit leaves one red doc-consistency test until docs line 1 lands.

## Review fixes

Branch `harden/recheck-new-batch-b` is rebased onto current origin/main (`9438d333e`) and force-pushed with `--force-with-lease` (head `0fd7fc6da`, 13 commits). SHAs in the tables above are the pre-rebase ones.

1. **Doctor row moved off.** The `dependencies-installed` removal is now the only commit (`caf9da1e7`) of the local, unpushed branch `harden/drop-dependencies-installed`, with a corrected message (the row read the doctored project's own package.json, so it failed on projects that declare dependencies but have no installed packages directory). It was skipped during the rebase, so the branch no longer carries it and the "Data Dictionary #7" red test and docs lines 1 and 2 of the earlier list no longer apply to this branch. It waits for the docs line and the owner decision.
2. **Rebase.** Census conflicts resolved per commit with `checkout --theirs`, `--write-census`, `add`. No other conflicts.
3. **Retired-key advice (`ef759d732`).** `runner-patterns-config` keeps the advice for a legacy JSON file: only the generic legacy-format text is dropped (the legacy finding still passes it to `config-format-legacy-json`); a legacy file holding a retired pattern key gets `<file>: ... maxRounds was retired; use runner.loops.reviewed.maxRounds instead; edit <file>, then run fgos config migrate`, and a retired key in the YAML file is still reported when the other scope is legacy. The door gives no retired-key path for a legacy file (probed: the finding sits on a `project:config.yaml` twin), so the row still reads the replacement through `formatLegacyJsonAdvice` (COOK's file, untouched) and keeps its text only when it names a retired key. Test: the existing owning test was extended (retired key case with the replacement text, no `config.yaml`, door row fails; a legacy file with no retired key passes as "not evaluated").
4. **CHANGELOG (`4a0f82d36`).** Two `## [Unreleased]` lines: `config show`/`explain` show the detected `runner.executor`; a Windows process prints one warning when config cannot be read and defaults are used. Nothing for `dependencies-installed`.
5. **Warning text.** Now neutral: "where a reader keeps a default for a refused config, it uses that default". It still fires once per process on whichever entry refuses first.
6. **Leftovers.** Terminal `defaultOf` reads the retain value from the snapshot (no literal `null`); `registry-defaults.v1.json` names the bundled standard instead of `EVENT_STORE_DEFAULTS`; the `inline_slot` doc is corrected; the panic-abort test and the parser-pin test now share one `parser_roots()` (manifests that resolve on their own and reach the parser). Justification: cargo ignores a member's profile, so only those roots can carry a effective panic strategy, and crates that never link yaml-doc are out of scope; the previous list also had two members. `test/util/yaml.test.mjs` header now names both owners (native-load loader refusal, the architecture no-parser guard). The fuzz crate edit was compile-checked by the reviewer.
7. **mailbox_config.rs HOME** untouched; stays a left-over for MAIL (also the `gateway.rs:72` message says `$HOME`, not changed).

Tests after the fixes: Node focused set (facade, config-door, config-checks, checks-doctor-config, registrations, checks, runner-config-conversion, event-store verbs, terminal client-route, provider-adapter, util/yaml, native-load): 287 tests, 286 pass, 0 fail, no ERROR lines. Rust: fgos-config (host-provider) 95 pass, fgos-yaml-doc 25 pass, fgos-node-addon 5 pass, 0 fail; clippy `-D warnings` clean on all three.
