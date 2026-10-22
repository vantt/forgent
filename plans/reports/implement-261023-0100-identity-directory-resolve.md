---
title: "Implement: local directory, resolve and list; machine-id mint and ISO clock cleanup"
lane: IDENT
date: 2026-10-23
branch: ident/p04-directory-resolve
---

# Implement: local directory, resolve and list; cleanup after HARDEN T1 phase 6

Worktree `/home/vantt/projects/forgent-worktrees/identity-p04`, branch `ident/p04-directory-resolve`, base `88ed45b36`. Nothing pushed, nothing merged. Two code commits: A `feat(identity): register sessions in a local directory ...`, B `refactor(identity): mint the machine id only through the identity namespace ...`.

## A. Local directory, role aliases, resolve, list

| Piece | Where |
|---|---|
| Directory: one file per session under `<stateRoot>/identity/sessions/<base32 of sha256(handle)>.json`; `register`, `resolve`, `list`, `head_liveness`, cap 512, prune | `packages/identity/rust/src/directory.rs` |
| `terminal_head` extracted from `tree_identity` (one walk for the writer-id rule and the directory's liveness) | `resolve.rs` |
| Verbs: `session --register`, `session --role lead:<LANE> [--take]` (implies register), `resolve <handle\|lead:LANE>`, `list [--project] [--prune]`; operation per flag (`identity.read` for resolve and plain list, `identity.write` for register and `list --prune`) | `provider.rs`, `apps/fgos/src/cli_projector.rs`, `src/cli/command-registry.mjs`, regenerated `command-routes.json` |
| Convention kind `lane-id` (first `A-Z`, rest `A-Z0-9-`, max 16), rules and golden cases | `packages/convention/contracts/` |
| Contracts, spec section 4/5/7/10, CHANGELOG | `identity.{read,write}.v1.json`, `docs/platform/identity/spec.md`, `CHANGELOG.md` |

Decisions, all inside the phase frame:

- **Handle collision is settled by the file name, no lock.** The file name derives from the handle, so two sessions with one handle contend for one name and the atomic create-once picks the winner; the loser re-reads and is refused `handle-in-use` with both full ids. Proven by an 8-thread race test (exactly one wins).
- **Liveness** is the `fgos_process::facts::Record` of the highest terminal-holding ancestor (`terminal_head`), through `identity_of`. No terminal ancestor: no record, `liveness: unknown` (resolves, never proven dead). Dead entries are removed on every write; reads only filter.
- **`list --prune`** removes every entry not proven alive (dead or unknown). The plan only said the cap message names `list --prune`; this is its definition. A file of another format version is never touched, and counts toward the cap.
- **Refusal codes** `ambiguous` and `not-found` match the mailbox; the candidates travel in the refusal detail (exit 65, stderr `[code] detail`, like every other identity refusal).
- `--machine` of the spec's `list [--project] [--machine]` is left for the shared directory (I4): locally every entry is this machine's. Spec text says so.
- Re-registering the same session refreshes its entry, keeps the first `registeredAt` and unions the roles.
- Not done by design: no doctor row (the directory is created lazily by an explicit write, depends on no new file, tool or config).

### Acceptance: two live sessions resolve each other by handle and by role

Scratch state root, real binary of this branch, each session registered from a pseudo-terminal (`script`), then resolved from another shell:

```
$ FGOS_STATE_ROOT=<scratch> script -qec "env CLAUDE_CODE_SESSION_ID=alpha fgos identity session --register --role lead:MAIL --json"
  -> {"id":"fg-server-abc234/alpha","handle":"claude-r3j7@fg-server","cli":"claude","projectId":null,"clone":"...identity-p04","registeredAt":"2026-10-22T17:55:10.659Z","roles":["lead:MAIL"],"liveness":"alive"}
$ ... CLAUDE_CODE_SESSION_ID=beta  fgos identity session --register --role lead:IDENT --json
  -> {"id":"fg-server-abc234/beta","handle":"claude-6rhg@fg-server", ... "roles":["lead:IDENT"],"liveness":"alive"}
$ fgos identity resolve claude-r3j7@fg-server --json   -> id fg-server-abc234/alpha, roles ["lead:MAIL"], liveness alive
$ fgos identity resolve lead:IDENT --json              -> id fg-server-abc234/beta,  handle claude-6rhg@fg-server
$ fgos identity resolve lead:NOPE                      -> exit 65: no live session is named "lead:NOPE"; candidates: none [not-found]
$ fgos identity list                                   -> {"sessions":[alpha, beta],"pruned":0}
```

Both sessions ran under one terminal, so both recorded the same head (the tool shell, the highest ancestor holding a terminal, which is what the writer-id rule defines); they stay distinct by handle but would die together. Wiring in CI form: `identity_directory_registers_only_on_request_and_resolves_by_handle_and_role` (host CLI tests).

### Proof, owner per behaviour

- `packages/identity/rust/tests/directory.rs` (14): resolve by handle and role; not-found candidates; ambiguous; dead never resolved and removed on the next write; unknown liveness and prune; list by project; role refused then taken; role must be `lead:` plus lane-id; re-register keeps roles and first time; handle-in-use with both ids; 8-way race lets one in; cap 512 refused and `--prune` the way out; foreign-format files untouched; liveness judged by the terminal head, never the `fgos` child (fake process tree).
- Convention golden: `lane-id` cases. Projector unit tests: operation per flag, flags belong to their verbs. One host CLI wiring test (bare verb and plain `session` never create the directory).
- `cargo test --workspace --no-fail-fast`: green, rc 0, no failure (after both commits).

## B. Cleanup after HARDEN T1 phase 6

### 1. Machine-id mint

- Addon: `mint_event_store_machine_id` deleted from `event_store.rs` and its re-export; `sessionIdentity.mintMachineId(stateRoot, hostname)` added in `session_identity.rs`, calling `fgos_identity::machine::mint`. Event Store's `identity::mint_machine_id` wrapper deleted (its only caller was the addon).
- Node: `src/util/identity-mint.mjs` `mintMachineId(stateRoot)` is the one facade (mkdir private, realpath, hostname). Callers: `fixIdentityMachineId` (doctor fix) and `fixEventStoreMachineId`, which stays by name because `src/verbs/events/migrate.mjs` still calls it; it is now one line over the same mint. `mintEventStoreMachineId` removed from `src/event-store/{native,index}.mjs`, from `eventStoreAddonAvailable` and from the architecture test's pattern. The Event Store spec no longer lists a machine-id setup fix of its own.
- `rg 'mintMachineId|mint_machine_id'` finds only: the addon's identity namespace, the Node facade and its two callers. No `mintEventStoreMachineId` anywhere outside plans.
- Layering note: the facade is kernel layer, so it takes the state root as a parameter; the two setup callers resolve the default (an import of `holder-lock/state-root.mjs` from it failed the architecture test).

### 2. One ISO-8601 UTC clock

Findings (current tree, not the brief's picture): observe, distribution and the CLI presenter already call `fgos_host_runtime::civil_time::format_system_time_utc`; their functions (`format_iso_now`, `chrono_now_iso`, `format_iso8601_utc`, `format_iso8601`) are thin wrappers, not copies of the algorithm. The algorithm existed three times: host-runtime `civil_time`, identity `text`, run-supervisor `publish`.

- Done: run-supervisor deletes its copy (`iso_utc_now`, `iso_utc`, its test) and calls `fgos_identity::text::iso_utc_now` through a `default-features = false` dependency (the library without the host provider; component-boundary already names run supervisor to identity as a caller). All six call sites moved. Owning proof of the clock text: `iso_utc_formats_known_instants_to_the_millisecond` in `packages/identity/rust/tests/machine.rs` (the retired `civil_date_matches_known_instants` had the same three vectors).
- Left on purpose: host-runtime `civil_time` stays. Identity's provider depends on host-runtime, so host-runtime cannot call identity (cargo cycle), and identity's library must not depend on host-runtime (Event Store and the addon would pull the host runtime in). Observe, distribution and the presenter already sit on host-runtime, so moving them to identity would add a second door for them, not remove one. Result: two implementations instead of three. Getting to one needs a leaf crate below both (a new crate: a decision question, not taken here).
- Docs: `component-boundary.md` identity row.

## Verification

- `cargo test -p fgos-identity`, `-p fgos --test cli_tests identity`, `-p fgos --bin fgos identity`: green. `cargo test --workspace --no-fail-fast`: rc 0, no failures. `cargo clippy -p fgos-identity -p fgos`: no findings in the touched files.
- First full `npm test` (after commit B): 8711 tests, 20 red = 17 fgctl init/upgrade/download, codex `cli-bypass`, 1 more fgctl-upgrade test (`holder-lock gate: a git that leaves a background gc ...`, failed on `untrusted-driver-directory ... mode 0775`, the group-writable umask family), and 2 mine: `subcommand-flag-drift` (the source parser wants `AVAILABLE_SUBCOMMANDS` on one line) and the one-way import test (the layering finding above). Both fixed and amended into B; the five affected files (architecture, subcommand-flag-drift, identity-checks, event-store-fixes, mint-door) pass, 54 of 54.
- Second full `npm test` on the committed tree (7a31dbb0e): 8711 tests, 8595 pass, 18 red, all known: 16 fgctl init/upgrade/download tests, the `holder-lock gate ... background gc` test (fgctl-upgrade family, `untrusted-driver-directory` mode 0775) and codex `cli-bypass`. No red outside the known families.

## Unresolved

- One ISO clock needs a leaf crate below host-runtime and identity (above); not built. Owner decision.
- Impact analysis (GitNexus) was not run for the edited symbols; the capability gate was not queried in this session. Blast radius was checked by `cargo check --workspace --all-targets`, `rg` over the moved names and the suites above.
- `docs/platform/identity/spec.md` Event Store row still says "Event Store reads it through that crate"; unchanged and still true.
