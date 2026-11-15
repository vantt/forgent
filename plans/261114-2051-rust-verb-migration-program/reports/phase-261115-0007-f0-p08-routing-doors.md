# F0 phase 08: host routing, doors and F0 guard rows

Branch `rust-verb-migration-program/f0-p08`, based on `origin/rust-verb-migration-program/f0` (`845d4144e`). Not landed.

## Done

- `apps/fgos/src/routing.rs` (pure): the route descriptor and table moved here, with the new fields (`native_subcommands`, `store`, `mutates_store`, `lands_work`, `event_store_child`) and no `native_kinds`. `Call` reads the tokens after the verb once with `fgos_host_runtime::cli_args`. `decide` gives `HookProtocol(kind)`, `Native { operation_id }` or `Legacy`. `declared` matches the shape lists over the parser output. `check_call` holds the sub-command check and the unknown-flag message (moved from `main.rs`).
- `apps/fgos/src/invocation_doors.rs`: around a native call, in Node's order: call check, root through `fgos_git::invocation_root`, admission through `fgos_git::store_admission`, start trigger (dispatched, opens the store, not `init`, not a publish child), the invocation, end trigger. Faults go through `fgos_observe::invocation_fault::record`; the `invocation fault recorded to <path>` line prints only when a record landed. The Event Store port is a small `Lifecycle` trait; the real one reads the section through `fgos-config`, runs `lifecycle::maintain`, and starts the publish child with the recursion guard removed from its environment (Unix only; no spawn exists elsewhere). An unknown verb is recorded as `unknown-verb`.
- `main.rs` loses `native_kind`, `unknown_native_flag`, the descriptor and the sub-command table (-170 lines); the native body is `run_native` returning the exit code so the end trigger always runs. `cli_projector.rs` loses `resolve_target_root` and its three tests.
- `fgos-config`: `EventStoreConfig::from_snapshot`, `read_project`, `from_config` and `ReadError` (with `code()`); the addon entry now calls the same reader (one rule for refused files), and `mailbox_config.rs` reads its Event Store keys through it. The missing home is the one refusal `config-io` / `HomeUnset` ("set HOME"); `home-unset` is gone.
- Generator and registry: `native_kinds`, `helpRoute`, `HELP_SELECTORS` and the help count assumptions are gone; the generator now refuses any annotation field outside a closed list (so a retired name cannot return). `command-routes.json` has 80 routes, no `--help`/`-h`, no `native_kinds`; `command-manifest.json` bytes unchanged. `packages/distribution/rust/src/lib.rs` keeps "no verb starts with `-`" as a fact about the table.
- Unknown verb (phase step 8, decision): both doors print `unknown verb "<x>". Usage: fgos <verb|verb|...> ...` with the verbs in registry order, the host from the embedded manifest, Node from `COMMAND_REGISTRY` (Node's old string was a hand list that omitted most verbs). `bogus-verb-probe --help` is a case of `help.cases.mjs` (exact bytes, exit 4). One line of `bin/fgos.mjs` changed (the `runVerb` default arm); it is outside the help code phase 09 deletes.
- Parse-args vectors: four new rows (a verb name given is just a positional; three `keys` rows pinning the JavaScript key order: whole numbers first ascending, `01` and `=` names keep their place). Node and Rust both check `keys`; Rust names the first unknown flag in that order.
- `doors` rows: ten added (below).

## `doors` rows

| Row | Allowed | Debt | Narrowing |
|---|---|---|---|
| render CLI help from the manifest | generator (reason), `help.rs` | none | none |
| retired native declarations | none | none | none |
| decide the lane of an invocation | generator (reason), `routing.rs` | none | `main.rs` not allowed: it no longer names the field |
| resolve the invocation root | `invocation_root.rs`, addon `git.rs` (carries the door) | distribution `workspace.rs`, `mailbox_root.rs`, `host-bin-path.mjs`, `worktree.mjs` (`isMainWorktree`) | patterns name definitions, not callers (`fn resolve_workspace_root`, `pub fn mailbox_fgos_dir`, `export function isMainWorktree`, the `host-bin-path` walk) |
| global fgOS directory (`retiredBy`) | `machine.rs`, `facade.mjs` | `registrations.mjs`, `llm-accounts.mjs`, `probes/harness.mjs`, `setup-use-case.mjs`, `fgos-gateway/gateway.rs`, `holder-lock/state_root.rs` (backlog `p-n22bigucgp`) | `pub fn home_dir(` (not the private one); extra patterns find stragglers; no `uninstall.rs` entry (the debt plan moved it) |
| admit store access | `store_admission.rs`, `worktree.mjs` (no-door fallback names one class, reason given) | none | none |
| record a malformed call (twin, `retiredBy`) | Rust writer, Node writer, file registry, capped-append leaf | none | capped append covered by `export function appendFaultRecord` and `fn append_capped`; the Node writer's missing `message` redaction is in the row reason (a debt entry cannot sit on an allowed file) |
| parse CLI arguments (twin, `retiredBy`) | Node parser, `cli_args.rs`, `routing.rs` and `invocation_fault.rs` (reasons) | `cli_projector.rs`, `mailbox_verbs.rs`, observe `flags.rs`, holder-lock `route.rs`, run-supervisor `route.rs`/`adopt.rs`/`supervise.rs`, terminal-control `route.rs`, `fgctl/help.rs`, `write-test-marker.mjs` | extra patterns `starts_with("--")` / `strip_prefix("--")` and the holder-lock typed-root match |
| Event Store maintain policy (`retiredBy`) | `lifecycle.rs`, addon entry, `maintenance.mjs` (reasons) | none | patterns are `syncDue`, `fn sync_due`, `fn maintain(`: `sync_interval_sec` is data, read by the mailbox hook for a different job (reason says so) |
| read the Event Store config section (`retiredBy`) | `src/event-store/config.mjs`, `event_store.rs` | none | the Rust literal narrowed to `.get("eventStore")` |

Also changed: the manifest-projection row's `bin/fgos.mjs` reason now reads "until the Node help renderer is deleted". I did not touch the second manifest formatter at `bin/fgos.mjs` (~3971); phase 09's text does not ask phase 08 to remove it.

## Where the code differs from the phase text

- Admission runs for every native call, as Node's does (a `store: none` call with a mutating shape still reaches it); the phase text says "when `store != none`".
- A root the Git door refuses (untrusted checkout, relative worktree, empty `--dir`) is `dir-invalid` for every verb, as in Node. The one exception is a named list of today's eight native verbs (`LENIENT_ROOT_VERBS` in `invocation_doors.rs`, marked as debt in code): for them the refusal reaches only a project reader's not-a-project answer. Reason: `mailbox_routes.rs` pins two behaviours the door would otherwise change for them (the submodule `unsupported-checkout` answer and a relative worktree reading its main checkout), and the phase says today's native verbs behave as before. A verb is never added to the list; a test fails if an unlisted store-less verb takes that arm or a listed name is no longer a store-less native route. (The first version keyed the exception on `store: none`, which would have let `git`, `worktree` and later verbs lose the refusal.)
- Store-less native verbs now find the root by the Git door's caller-tree walk: it stops at the work-tree top as Node does, returns the real path, and costs one disk-only Git read per native call, `version` included. The latency numbers below were measured from `/tmp`, where no repository exists, so they do not include a real Git read.
- `fgos_process::mapped::spawn_detached` takes a list of variable names to remove (empty keeps the caller's environment); the publish child uses it for the recursion guard, with a process-crate test that the named variable is gone, the others kept and the given ones set.
- The host still prints `did you mean` for a near-miss verb and Node does not. Decision: the host's text is authoritative (the host is the door users reach; Node's direct channel is a fallback), so no near-typo parity case; the parity case uses a word with no near match.
- Sub-command word and the `--dir` source keep the host's old rule for now (the first token after the verb, not a flag; `--dir <p>` or `--dir=<p>`), because the native projectors read their own argv the same way. Flags and declarations use the parser. Owner question below.
- `mailbox_hook.rs` has no shared sync-due owner (phase 06 found a different job), so only its comment changed.
- The state root's home functions named in the coordinator's note do not exist at this head as `home_from`; the row matches `get("HOME")` in `state_root.rs` instead.

## Owner question for COOK to relay (not decided)

- **What is happening:** the host reads `--dir` from native verbs in its own way: `--dir <path>` and `--dir=<path>`, a bare trailing `--dir` ignored, and `--dir` naming the home directory refused. The Node CLI (and the Rust parser that mirrors it) has no `--dir=<path>` form: it reads `dir=/x` as a flag with that name, and a bare `--dir` is a refusal.
- **Cause:** the native verbs were written against their own parsers, which also take `--flag=value`; the shared parser was written to match Node.
- **Options:**
  - (a) Keep the host's reading for native verbs until each verb moves onto the shared parser. Cost: one named function (`named_dir`, debt in the code and in the parse row), two spellings live.
  - (b) Move `--dir` onto Node's rules now. Cost: native verbs stop accepting `--dir=/x` (a user-visible break for scripts and agents that use it), a bare `--dir` becomes exit 4, and the same would be needed for every `--flag=value` the native verbs accept.
- **Recommendation:** (a). Same behaviour for users, nothing lost; revisit when the projectors move.
- **Scope of the answer:** the native verbs' `--dir` and `--flag=value` spellings in the host; not the Node CLI.

## Behaviour changes to know

- Native verbs record malformed calls (`unknown-flag`, `arg-parse`, `dir-invalid`, admission classes) in the caller's store and print the record line; before, none were recorded.
- Unknown flags are named in JavaScript key order (`--zzz --1` names `--1`); before, argv order.
- A `--dir` relative path is now handed on as an absolute path; an empty `--dir ""` is a refusal where it was accepted as an empty path.
- Host unknown-verb text now lists the verbs (was `<command> [args...]`); Node's list is now complete and in registry order.

## Tests

Retired with the code they tested:
- `cli_projector.rs`: `the_root_walk_never_takes_the_global_fgos_under_home_as_a_project`, `the_root_walk_takes_the_nearest_project_below_home_and_dir_as_given`, `the_root_walk_answers_the_shared_root_table`. Owners: the root table and policy rows in `packages/git/rust/src/invocation_root.rs` (home `.fgos` is never a project, nearest project, ceiling), and in `invocation_doors.rs` `the_project_is_the_dir_as_named_else_the_found_root_and_never_the_global_directory` (the `--dir`-names-home refusal, which Node's door does not have).
- `command-routes.test.mjs`: the `native_kinds` equality and the stale `native_kinds` annotation case (behaviour removed; replaced by "an annotation field the registry owns is refused"); help-selector count and route assertions (behaviour removed). `help-routes.test.mjs`: "`--help` and `-h` are legacy-node routes" (behaviour removed; the host answering is owned by `help.rs` unit tests, `test_every_help_form_starts_no_node` and the parity table).
- Changed form, same proof: `fgos-post-merge-2.test.mjs` now checks that the usage line names exactly the route table's verbs (was two hand-picked words).

New proofs: `routing.rs` (store-declaration rows, every native sub-command has a server, no native route lands work, lanes, call reading, sub-command and flag faults, key order, `=` names, bare `--`), `invocation_doors.rs` (14: caller's store gets the record not `--dir`'s; require-store refusal recorded; read warning passes; frozen worktree store refused by class; both triggers on Linux and none elsewhere; no trigger for `store: none` or a publish child; trigger errors recorded; sync child env without the guard; dispatch depth; the real trigger outside a repository; root refusal split), `event_store_section.rs` (project read, missing home), `cli_tests.rs` (`nosuch --help`; unknown flag on a native verb inside a project writes one record and prints the line, `--dir` target untouched), parity case `refusal-unknown-verb`.

## Gates (logs in /dev/shm, `rvm-f0-p08-*.log`)

- `cargo fmt --all --check`; `cargo clippy -p fgos -p fgos-distribution -p fgos-config -p fgos-host-runtime -p fgos-node-addon --all-targets -- -D warnings` (and `fgos-config --features host-provider`; it also fixes an unused import left in `provider.rs`).
- `cargo test -p fgos -p fgos-distribution -p fgos-config -p fgos-host-runtime`: all green (fgos: 83 unit, 52 `cli_tests`, 50 `mailbox_routes`, 2 `mailbox_sync_child`).
- `cargo check` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` on those crates plus the addon: exit 0.
- `export-command-selectors.mjs --check`: clean. One-door scan: 0 undeclared; `rust-test` class 156 to 160 (new spawn tests and fixtures), census regenerated.
- Focused node run (the phase list plus every reader: post-merge-2, claim-2, help and verb-help-json, manifest, flag drift, citation drift, config facade, Event Store triggers and verbs, host-bin, session-identity, shell integration and more): 619 tests, 618 pass, 0 fail, no ERROR lines.
- Parity: `verb-parity.test.mjs` 497 exact-byte cases (496 plus the unknown-verb case), 0 differences.
- Latency (release host, `/tmp`, load about 14 on the machine): `--help --json` 1.1 ms median; `version` 4.7 ms; `config show --json` 5.0 ms (a no-project refusal from `/tmp`, so not comparable with phase 02's 28.9 ms). The end trigger runs only for a store-opening verb, so none of today's native verbs pay it.
- Not run (needs COOK): full `npm test`, `cargo test --workspace`.

## Docs for phase 11 (not done here)

- `docs/platform/host-invocation-routing/contracts/command-route-descriptor.md:35-40` (route_kind from annotations and `native_kinds`; now `native_subcommands`, the store fields, closed annotation fields).
- `docs/platform/host-invocation-routing/spec.md:40` (and line 80, the R1 matrix note on `native_kinds`).
- `docs/platform/agent-mailbox/spec.md:175` (and lines 166, 524, 641, 850 naming `native_kinds`).
- `docs/platform/config/spec.md` section 12 straggler sentence (`mailbox_config.rs` now uses the one refusal).
- `docs/reading-map.md:144` and `docs/platform/packaging-distribution/spec.md:868` (`HELP_SELECTORS`); `docs/platform/observe/spec.md:73` and the observe decision file (`nativeOnly`).
- Decision-history lines for the new Event Store config reader and the doors rows.

## Authority

- The `eventStore` section is read in one place (`fgos-config::event_store`): the addon, the host trigger and the host mailbox now share it. The refusal rule for a refused file still differs between callers by design (`strict`).
- The invocation root is now decided in `fgos-git` for the host too. Still held elsewhere (all rows' debt): distribution `workspace.rs`, `mailbox_root.rs`, `host-bin-path.mjs` (no Git ceiling), Node `isMainWorktree` vs Rust admission.
- Node and host both keep a copy of "the verbs of the surface" for the unknown-verb line, each from its own copy of the one registry/manifest; the parity case guards the bytes.
- The home directory is decided by two rules (state root HOME-first, Config USERPROFILE on Windows); backlog `p-n22bigucgp`, visible as debt.

## Proposed `[Unreleased]` line

- Native `fgos` verbs (`config`, `convention`, `friction`, `metrics`, `mailbox`, `identity`, `gate-bypass`, `version`) now record a malformed call (unknown flag, bad sub-command, refused root) in `.fgos/logs/invocation-faults.jsonl` and say so, and find their project with the same walk as the Node CLI (it stops at the repository top and costs one disk-only Git read per call); an unknown verb lists the verbs of the surface; a missing home directory is refused as `config-io` "set HOME" by the mailbox config too.

## Lessons

- A guard row written from a census is a hypothesis: ten rows produced about forty hits on the first run; narrowing patterns to definitions (not callers) and naming the real leaks as debt took two passes.
- A phase text that says "behave as before" and a generic door order can contradict each other: two `mailbox_routes.rs` cases found it within minutes. Run the owning integration test file before shaping the door.
- `cargo fmt` rewrites test text, so a scripted edit made before it fails to match after it; re-read the file before scripting an edit.
- The one-door scan classifies a spawn by finding `current_exe()` in the function that builds argv; a helper returning argv hid it and cost a round.
- `fgos convention path` works only from the main checkout, and rustfmt plus the census hook mean every Rust change needs fmt and `--write-census` before commit.

Status: DONE_WITH_CONCERNS
Summary: Routing, doors and the F0 guard rows are in on the branch with all focused gates green; head pushed, not landed.
Concerns/Blockers: (1) the root-door refusal is skipped only for a named list of today's eight native verbs (debt, tested); (2) `--dir` and sub-command reading keep the host's old rule pending the owner question above; (3) one line of `bin/fgos.mjs` changed outside the phase's hot-file order (different hunk from phase 09's deletions); (4) full `npm test` and `cargo test --workspace` not run.
