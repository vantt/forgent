# Phase 2a result: retire the Node agent hook table (door row `agent-hook-table`)

Base HEAD: 20ad16de0. Nothing was committed or staged by this run.

## Commands I could not run
`cargo` and `node` were refused in this session, and so were compound shell commands. **None of these ran**, and every
claim below is from reading the code:
`cargo test -p fgos-distribution`, `cargo test -p fgos` (the `mod.rs` projection test), `cargo test -p fgos-mailbox`,
`node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs test/scripts/mailbox-live-confined.test.mjs test/scripts/mailbox-behaviour-v7*.test.mjs`,
`node scripts/git-one-door-scan.mjs --write-census` (left to the land door), the manifest and routes regeneration check.

## Owner answer q-xs6oex5amb A: `fgos doctor --fix --only <fix-id>`
- `packages/distribution/rust/src/doctor.rs`: `Options` is now `{ fix, only: Vec<String> }` (no longer `Copy`).
  `Options::check(&Registry)` refuses `--only` without `--fix` and an id no registered fix has, each by name.
  `run_fixes` runs just the named fixes, still in registry order and still one call per run of one owner.
  New crate test: `only_runs_just_the_named_fixes_in_registry_order_and_refuses_what_it_cannot_honour`.
  The five existing `Options { fix: .. }` call sites were updated.
- `apps/fgos/src/wiring/doctor/mod.rs`: `DoctorRequest.only` is parsed with `parse_args_repeating(.., ["--only"])`.
  A bare `--only` is refused (`doctor --only needs a fix id`). `invoke` calls `Options::check` before the blocking
  task and answers a refusal as `ProviderError::SemanticValidation`; `answer` projects `only`. The existing test
  `the_flags_read_as_the_node_cli_read_them` now also pins repeated, absent and bare `--only`.
- `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-manifest.json` and `command-routes.json`:
  `only` (array of string, appended after `strict`) and one example, with the same text in the registry and the
  manifest; the routes' `accepted_flags` gains `only` in registry order.
  `test/cli/subcommand-flag-drift.test.mjs` needed no change: `doctor` is a native verb with no `case 'doctor'` in
  `bin/fgos.mjs`, so that test never reads it.

`project_root_refusal` (`apps/fgos/src/wiring/doctor/mod.rs:122`) only refuses a directory that cannot be
canonicalised, so it does not refuse a temporary workspace that exists. The rule is unchanged.

## Step 3: the harnesses install and check through the doctor
- `scripts/lib/mailbox-live-confined.mjs`: `installHookThroughDoctor(ws, cli)` runs
  `invokeHost(['doctor','--fix','--only',<fix>], { dir: ws })` and throws when the fix is absent from `fixed` or
  reports `changed: false`. `installRunRows` uses it for claude, codex, omp and pi. The Node import is gone.
- `test/live/mailbox-claude.live.mjs`: `wireHooks` does the same for claude and codex; `runL2` reads the
  `dispatch-decide-hook-wired` row of `invokeHost(['doctor'], { dir: project }).checks`.
- `test/live/mailbox-behaviour.live.mjs`: the pi/omp `layOut` runs the same `doctor --fix --only <cli>-hook-wired`.
- `test/scripts/mailbox-live-confined.test.mjs` needed no change: it reaches the install only through
  `layOutRunProject`, and it already requires `FGOS_HOST_BIN`.

## Step 4: frozen sets
Retired (file deleted; last SHA that still had it):

| Addendum | Last SHA |
|---|---|
| `test/live/mailbox-behaviour.v7e-addendum.json` | 415bfaa4e |
| `test/live/mailbox-behaviour.v7h-addendum.json` | b39078c81 |
| `test/live/mailbox-behaviour.v7i-addendum.json` | 9ea3b5cb2 |
| `test/live/mailbox-behaviour.v7j-addendum.json` | ea77f12ec |
| `test/live/mailbox-behaviour.v7k-addendum.json` | ea77f12ec |
| `test/live/mailbox-behaviour.v7m-addendum.json` | ae427787b |

`test/live/mailbox-behaviour.v7n-addendum.json` is kept as the record of what was measured; see "Fix round 4 (v7n)".

Builders: the `src/setup/agent-hooks.mjs` freeze entry was removed from `scripts/lib/mailbox-behaviour-v7e.mjs`
(`EXTENSION`), `-v7h.mjs` and `-v7i.mjs` (`ADDED`); their `delivery` strings now name
`fgos-distribution agent_hooks.rs`. The v7j builder never listed the Node table (only `mailbox-live-confined.mjs`),
so `scripts/lib/mailbox-behaviour-v7j.mjs` is untouched and its test needed no change: it freezes whatever bytes
`mailbox-live-confined.mjs` has now.

Tests narrowed (assert the same behaviour, minus the freeze of a deleted file; v7e's break-the-freeze check now
appends to `scripts/lib/mailbox-behaviour-v7e.mjs`):
- `test/scripts/mailbox-behaviour-v7e.test.mjs`: the addendum freeze test (last SHA b9e860215)
- `test/scripts/mailbox-behaviour-v7h.test.mjs` (last SHA b39078c81) and `-v7i.test.mjs` (last SHA 9ea3b5cb2): the
  addendum freeze tests.
- `test/architecture.test.mjs`: the assertion that `src/setup/agent-hooks.mjs` is an allowed holder of
  `legacyMarkers: ['dispatch-decide-hook.mjs']` (the next assertion, for `agent_hooks.rs`, still owns that rule).

**Mailbox re-measurement owner: backlog `p-irt4weqipe`.** It produces the new frozen sets on the new bytes.

## Step 5: deletion
- `src/setup/agent-hooks.mjs` and `test/setup/agent-hooks.test.mjs` deleted; last SHA 871a77074 for both. The commit
  should name survivor `packages/distribution/rust/src/agent_hooks.rs` and that SHA.
- `extension.rs:1` now names `agent_hooks.rs`.
- Door rows: `agent-hook-table` has `debt: []`; `scripts/lib/mailbox-live-confined.mjs` moved to `allowed` (it still
  moves the hook file the host wrote out of the project, so the door walk would otherwise flag it).
  `delete-guard-keyword-list` has `debt: []`. The `src/setup/agent-hooks.mjs` entries were removed from
  `retired-node-s5-hook-script` and `writer-and-session-id-environment`.
- `mutation-census.v1.json`: only the deleted file's line removed. `test/suite-baseline.json`: its line removed.
  The census still carries stale hashes for the other files this run changed; regenerate at the land door.

## Owning test of each retired behaviour
Every Node test case maps to the survivor's tests in `agent_hooks.rs` and the recorded vectors in
`tests/goldens/agent-hooks-vectors.json`
(`every_recorded_case_installs_checks_and_uninstalls_byte_for_byte_as_the_earlier_module_did`,
`a_claude_hook_file_without_the_questions_rows_fails_the_check_and_an_install_restores_them`,
`our_own_commands_are_recognised_by_kind_and_a_lookalike_never_is`, the link, mode and umask tests, the shim-probe
memo test, `the_prefilter_data_renders_...`) for: install/check/uninstall of every CLI, user-hook preservation,
idempotence, legacy-command replacement, mailbox opt-in rows, the questions and session-start rows, malformed files,
and the prefilter list equal to its data file.

**Gap, not covered by anything left (DONE_WITH_CONCERNS):** the Node tests that *execute* the generated pi/omp
extension in Node: it loads and registers handlers; stays inert for a runner worker and never writes the process
environment; appends the frame after real output; treats exactly the minted attempt prefix as a worker; refuses a
shim another user owns, a group-writable shim and a non-regular-file shim; finds the shim from a subdirectory; a
hanging hook holds the CLI no longer than the hook timeout; the delete-guard prefilter skips the shim.
`agent_hooks.rs` pins only the extension's bytes (byte-for-byte vectors), which are the bytes those tests passed on
at 871a77074. Nothing runs them in Node any more. Re-homing them needs a new test file that installs through
`fgos doctor --fix --only pi-hook-wired`; that is outside this unit's scope (see `needsWrites`).

## Concerns
1. **Row id.** The brief says `claude-hook-wired`; no such row exists. Claude Code's hooks are the row and fix
   `dispatch-decide-hook-wired` (`apps/fgos/src/wiring/doctor/packaging.rs:130`). I used that id; codex, omp and pi
   use `<cli>-hook-wired` as stated.
2. **Host timeout.** `invokeHost` kills the host after 5 s (`HOST_TIMEOUT_MS`, `src/util/host-bin.mjs`, outside
   scope). `doctor --fix --only` still judges every row afterwards, which probes tools and may exceed 5 s in a cold
   confined workspace. Unmeasured; I could not run it.
3. **Host version.** Every harness needs a host built with `--only`: `mailbox-live-confined.test.mjs` through
   `FGOS_HOST_BIN`, `mailbox-claude.live.mjs` through the workspace activation, and `mailbox-behaviour.live.mjs`
   pi/omp through `FGOS_HOST_BIN` only (its workspace has no activation when the hook is wired).
4. **Verify line.** `rg -n "agent-hooks\.mjs"` outside plans, archive and CHANGELOG still finds docs: see `needsWrites`.
5. The doctor spec and `CHANGELOG.md` `[Unreleased]` should mention `--only` (user-visible flag); neither is in scope.

## Decision-history line for phase 11
"The Node agent hook table `src/setup/agent-hooks.mjs` is retired (last at 871a77074); `agent_hooks.rs` is the one
hook table. The live mailbox harnesses wire hooks through `fgos doctor --fix --only <fix-id>`. The mailbox
behaviour addenda v7e, v7h, v7i, v7j, v7k and v7m were measured on bytes that no longer exist and are retired; v7n stays as its
measured record, no longer compared with a rebuild; backlog `p-irt4weqipe` owns the re-measurement."

Status: DONE_WITH_CONCERNS
Summary: Added `doctor --fix --only`, moved the live mailbox harnesses onto it, retired the Node hook table with its frozen addenda; nothing could be compiled or run here.
Concerns/Blockers: Node-executed extension runtime tests lost their only proof; row id `dispatch-decide-hook-wired` stands in for `claude-hook-wired`; invokeHost's 5 s timeout vs a full doctor judge; cargo and node never ran.

## Fix round 1

Design principle 8: the deleted `test/setup/agent-hooks.test.mjs` held the only proofs that execute the generated hook code, so it is recreated with only those cases. Every file is installed through the Rust door (`invokeHost(['doctor','--fix','--only','<row>-hook-wired'], { dir })`; the claude row is `dispatch-decide-hook-wired`); nothing is imported from `src/setup/agent-hooks.mjs`. The file carries a header comment naming `packages/distribution/rust/src/agent_hooks.rs` as the owner of byte-level cases.

**Kept (they run the generated code):**
- Claude Code dispatch and decision-question guards, with and without the shim.
- omp and pi extension loads and registers (imports only node builtins, entry is a function) and its delete guard blocks on exit 2 only for a prefilter keyword.
- Mailbox handlers present only for an opted-in project (omp, pi).
- Inert for a runner worker, never writes `process.env`, frame appended after real output.
- Exactly the minted attempt prefix counts as a worker (read from the installed extension).
- Refuses a shim another user owns; a hanging hook holds the CLI no longer than the hook timeout; shim found from a subdirectory, group/world-writable and non-regular shims refused.
- Claude delete guard passes a call without a mass-delete word; claude, codex and agy delete guards start the shim only for a prefilter keyword; omp/pi extensions skip the shim without a keyword (now through `tool_call`, instead of comparing the embedded regexp source).

**Dropped (owner: `packages/distribution/rust/src/agent_hooks.rs` and its golden vectors `tests/goldens/agent-hooks-vectors.json`):** canonical command bytes, legacy/unguarded replacement and migration, malformed-JSON handling, codex/agy install bytes and quoting, the `check*` pass/fail and drift cases, install-all/check-all, probe recursion guard and once-per-run probe, the hook table as source of rows, receipt and SessionStart rows, mailbox row install/opt-out removal, idempotence, user-hook preservation, ownership recognition, wrong file shape, uninstall, the frozen-literal prefilter list and the vector replay. Dropped as run-the-command cases not in the keep list: codex/agy run-from-another-directory and the claude mailbox guarded-no-shim case.

**Other:** `test/suite-baseline.json` has the old `test/setup/agent-hooks.test.mjs` entry (24.8) back. `doctor.rs` has the rustfmt diff applied exactly, so `cargo fmt --check` should now pass (applied by hand; cargo was not run). Node was not run: the test file was written without executing it, and the lead runs it. Assumption to check: `invokeHost` throws when doctor exits non-zero on an unrelated row; the helper tolerates `host-exec-error` and relies on the written file.

Status: DONE_WITH_CONCERNS
Summary: Recreated the executing hook-code proofs, restored the baseline entry, applied the rustfmt diff; nothing was run.
Concerns/Blockers: Test unrun; opted-out omp/pi handler shape and the 5 s invokeHost timeout vs a full doctor `--fix --only` are unverified.

## Fix round 2: the mailbox-handler cases clear the shim log after the install, because the doctor run probes each shim call. Lead ran node scripts/run-tests.mjs on agent-hooks, mailbox-live-confined, mailbox-behaviour-v7e/h/i/j/n and architecture with a host built from this branch: 151 tests, 138 pass, 0 fail.

## Fix round 3 (review)

- `test/setup/agent-hooks.test.mjs` re-adds three execution proofs, installed through `installThroughHost` and reading the commands from the written files, with the old assertions kept:
  - with no shim present, the claude mailbox Stop command (project opted in with `writeMailboxOptIn(repoRoot, true)`) exits 0 with empty output;
  - the codex command quotes a project path holding a space and a quote;
  - a project path naming a kind (`my decision-question 'app`) keeps all three codex guards, and every codex and agy command run with `sh -c` from `os.tmpdir()` exits with a status other than 127.
- `test/live/mailbox-claude.live.mjs` (`wireHooks`) and `test/live/mailbox-behaviour.live.mjs` (fixture layout) now call the exported `installHookThroughDoctor`, so they fail when the doctor fix is absent from `fixed` or reports `changed: false`. The unused `invokeHost` import was dropped from the behaviour script.
- Not run: node was refused in this session, so none of these edits was executed or syntax-checked; they were written by reading the neighbouring cases. The claude mailbox case selects its Stop command by the substring `mailbox`.

## Fix round 4 (v7n)

- `test/live/mailbox-behaviour.v7n-addendum.json` is back to its measured bytes (last SHA 97bad4d52).
- `test/scripts/mailbox-behaviour-v7n.test.mjs` keeps the V6 binding, instruction v3 hash and frame assertions and no longer compares the addendum with a rebuild, because the harness bytes it froze changed. Plan 261117-0831 decided there is no hash-only refresh of the addendum.
- Backlog `p-irt4weqipe` (and plan 261117-0831's v7o) owns the new frozen set.
- The lead ran the narrowed test: 3/3.

Status: DONE
Summary: Restored the v7n addendum to its measured bytes and dropped the rebuild comparison from its test.
