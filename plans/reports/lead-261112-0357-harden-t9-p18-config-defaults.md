# HARDEN T9 P18: config defaults only in the config door

Landed on main as `936a9152f..0680cb40b`, plus plan/board commit `0cc042370`. Branch, worktree and Cargo target removed. (The convention path would be `lead-261112-0427-harden-t9-p18-config-defaults.md`; this file uses the path the big lead named.)

## What changed
- **Added scope, `p-hyjxtludoy` (done).** Cause: the config snapshot records origins per leaf (`...supports.skills[0]`); `explain` matched the exact path, so a list or mapping set by one file printed `current: null, file: null`. Fix: one `origins_under` rule in `packages/config/rust/src/inspect.rs`, used by `show` and `explain`; explain names the first leaf's layer and file. Owning test: `explain_names_the_layer_of_a_list_or_mapping_that_only_the_global_file_sets` in `packages/config/rust/tests/inspect_verbs.rs` (red before, green after; it also asserts explain and show return the same origin). Reproduced first on fg-server2 with the global file declaring `skills: ["ak:cook"]`.
- **`dispatch` section.** New `core/config-schema/dispatch.schema.yaml` (type, minimum 1000, scope both) and `core/config-standard/dispatch.yaml` (10000, 15000), registered in `bundle.rs`. `gate-kill-grace.mjs` lost its literals, the minimum checks and the swallow-a-refusal fallback; it reads the effective value through the facade. Doctor `run-supervisor-config` keeps only the cross-key rule (wait shorter than grace); a value below 1000 or not an integer is now the door's refusal.
- **Runtime key list deleted.** Both keys left `runtime-keys.v1.json`; the file had no other user, so the file, `runtime_keys/runtime_key/on_runtime_key` in `schema.rs`, the explain branch, and the three fixtures cases about it were removed in the same change (L10). The typo-suggestion proof stays in `inspect_verbs.rs` over the bundled schemas; undescribed-key proofs stay in the doctor and write fixtures.
- **`maxRounds`.** `DEFAULT_MAX_ROUNDS` and the catalog `builtin` slot for it are gone. `runner.loops.reviewed.maxRounds` in the standard is the one value; `runReviewed` and `reviewedHistoryOutcome` refuse with `reviewed-max-rounds-missing` (names the config key) when no usable limit reached them. A run record that kept no limit (legacy decoder, summary) reads the standard's value through `shippedCatalog()`, not a literal.
- Docs: config spec history line, run-supervisor spec, packaging spec row 7g, `unit-state.v1.json` contract text, CHANGELOG line, backlog row done.

## Verification
- `cargo test -p fgos-config` and `-p fgos` green; `cargo fmt --check`, `clippy -D warnings`, msvc and aarch64-apple-darwin `cargo check` on `fgos-config` clean; census scan 0 undeclared, census regenerated.
- Full `npm test` (log `/dev/shm/p18-full-041429.log`): 8669 tests, 2 failed: the known V7n addendum, and `seat-binding-dry-bind` (mine: its fixture runner config had no `loops`; fixed, 23/23). After the final rebase the focused set (263 tests incl. architecture, doc-health, decision-citation-drift) passed; no second full run.
- Retired tests: `DEFAULT_MAX_ROUNDS` export check (behaviour removed; the refusal test owns the new rule), "defaults maxRounds when params and cfg omit it" (replaced by the refusal test), cancel-wait "grace + 5s" case (behaviour removed; `run-supervisor-checks.test.mjs` owns the cancel-wait reader, and the duplicate in `cancel-registry.test.mjs` was deleted), the three runtime-key fixture cases (mechanism removed).

## Behaviour changes to know about
- **`dispatch.cancelWaitMs` is now a literal 15000.** The schema vocabulary has no derived value (plan's stated fallback). Same numbers for everyone on defaults; a user who raised only `gateKillGraceMs` above 10000 used to get a longer wait and now keeps 15000, and the doctor row fails with "shorter than the grace" until they raise both. Doc and CHANGELOG say so. If the owner wants the coupling back it needs a schema feature (derived default), not reader arithmetic.
- Doctor source label for an unset key is `standard` (was `default`).
- A config file the door refuses now propagates from `readGateKillGraceMs/readCancelWaitMs` instead of reading as "nothing configured"; `fgos run` reads the same config through the same door on the same path, so no new failing case, but the message is the door's.

## Authority
- Two stale tests pinned `gateway.bind` to `0.0.0.0` after the gateway commit flipped the standard to loopback (`registry-defaults.v1.json` known-differences row and `machine_view.rs`); both were red on origin/main. Fixed here (files in the config crate). The gateway lead should know its landing left them red.
- `DEFAULT_REBUTTAL` (`loops/debate.mjs`, catalog `builtin` slot) is the same shape of second default for `runner.loops.debate.rebuttal`. Not in this phase's scope; not changed. Worker-slot "recommended 8" stays with Work.
- `src/setup/registrations.mjs` (doctor description and comment) was edited; no running phase owns those lines.

## Lessons
- A mechanism listed as a "stop-gap" is easy to leave behind: when its last entries move, delete the mechanism and its fixtures in the same change; I found the Rust branches by grepping the contract's name, not by reading the phase's file list.
- Removing a code default means every test config that omitted the key must carry the standard's value: I missed the dry-bind fixture and only the full suite showed it. A focused grep for `runnerConfig`-style helpers that build configs by hand would have caught it earlier.
- The brief's report path (convention) and the lead's named path differ by the timestamp; one source would avoid a guess.

Status: DONE_WITH_CONCERNS
Summary: Config defaults for the dispatch waits and `maxRounds` now live only in the config door, `fgos config explain` reads origins like `show` (`p-hyjxtludoy` done), and all of it is landed on main.
Concerns/Blockers: `cancelWaitMs` is no longer derived from the grace (literal 15000, doctor flags a wait shorter than the grace); the only full-suite red left is the known V7n addendum, and no second full run followed the last rebase.
