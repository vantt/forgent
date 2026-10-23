# Implement report: PI_SESSION_ID as writer-id source

Date: 2026-10-23 16:45 (Asia/Saigon). Branch `ident/pi-session-id`. No code changed.

## Update 16:54

Owner decided: add `PI_SESSION_ID` after `CODEX_THREAD_ID`; the CLI label (`pi` or `omp`) is read from the process ancestry, never from env. Implemented below. The section after this one is the first stop report, kept as the probe record.

## Ancestry probe (pi 1.4.0, omp 18.12.6, `-p`, one run each; tool process up to the terminal)

| CLI | chain, tool upward: comm / exe / argv[0..1] |
|---|---|
| pi | python3 (`/usr/bin/python3.14`, `python3 -I`) > bash (`/usr/bin/bash`, `/bin/bash -c`) > **pi** (exe `~/.nvm/versions/node/v24.21.0/bin/node`, argv `pi ''`) > zsh (wrapper `zsh -ic`) > timeout > zsh > claude > zsh |
| omp | python3 > **omp** (exe `~/.local/bin/omp`, argv `omp --profile=openai-tetnu`) > zsh (`zsh -ic`) > timeout > zsh > claude > zsh > ... herdr |

Conclusions: pi is node whose process title is `pi` (comm `pi`, exe is a version-specific node path); omp is its own ELF (comm `omp`). Only the kernel command name is stable for both, so the rule matches comm. omp's tool runs directly under omp (no bash in between). In both, the nearest `pi`/`omp` ancestor is the CLI; the terminal head is the user's shell above it, so `terminal_head` is not used.

## Implementation

Label rule: from a reference pid upward (itself included), the nearest ancestor whose command name is `omp` gives `omp`, one named `pi` gives `pi`; none gives `pi`.

Final signature: `session_for(state_root: &Path, key: &WriterKey, head_pid: Option<u32>) -> Result<CurrentSession, Refusal>`; `register_writer` passes `Some(head_pid)`; `resolve` uses the caller pid.

Files changed:
- `packages/process/rust/src/{facts.rs,platform/mod.rs,platform/linux.rs}`: `facts::command_name_of` and `parse_command_name` (one stat parser; `Relation` stays `Copy`), with a parser test.
- `packages/identity/rust/src/{resolve.rs,session.rs,current.rs,directory.rs,launcher.rs,proc_tree.rs,lib.rs}`: `ENV_ORDER` gains `PI_SESSION_ID`; `ProcessTree::comm` (default `None`); `pi_family_cli`, `ancestry_cli`; `WriterIdentity.cli`; `cli_of` maps `PI_SESSION_ID` to neutral `pi`; `session_for` gains `head_pid`; `SCRUBBED` gains `PI_SESSION_ID` and `PI_SESSION_FILE`.
- Contracts: `identity.writer.v1.json` (`x-envOrder`), `identity.writer.golden.v1.json` (5 env cases: pi alone, codex over pi, pi over claude, fgos over pi, invalid pi falls through), `attempt-writer-id.v1.json` (`scrubbed`).
- Node: `src/util/session-identity.mjs` (cache key list), `src/runner/dispatch/adapters.mjs` (`workerBaseEnv` drops both), `src/cli/command-registry.mjs` (help text), `scripts/event-store/v-spawn-bench.mjs`.
- Tests: `packages/identity/rust/tests/{session.rs,directory.rs,attempt_writer_id.rs}`, `apps/fgos/tests/cli_tests.rs` (env removal list), `test/session-identity/attempt-writer-id.test.mjs`, `test/run-supervisor/contracts-terminal.test.mjs`.
- Docs: `docs/platform/identity/spec.md` (sections 4, 7a L3, L5, L5a, L6, 10), `docs/io-contract.md`, `docs/specs/observe.md`, `CHANGELOG.md`.

Scrub decision: both `PI_SESSION_ID` and `PI_SESSION_FILE` are scrubbed (Rust launcher and Node `workerBaseEnv`), because pi and omp pass both to children and a worker would otherwise claim its parent's session.

Note: the Node facade's `ENV_ORDER` is a cache key list that already existed; the door does not expose the Rust list, so it was moved, not added.

## First stop report (kept as probe record)

Re-probe contradicts the 10-20 report for omp: **omp 18.12.6 exports `PI_SESSION_ID`** (and `PI_SESSION_FILE`) to its Bash tool, same name and shape as pi. Per the brief ("if omp DOES export a session id variable, do NOT add it") implementation was not started. The owner approved `PI_SESSION_ID` with CLI name `pi`; the same variable also appears under omp, so adding it would label omp sessions `pi-xxxx@machine`. That is an owner question.

## Probe table (one run per CLI, `-p`, model openai-codex/gpt-5.6-luna, account openai-tetnu, via the zsh wrapper functions; my env had no PI_*/OMP_* beforehand; `CLAUDE_CODE_SESSION_ID`/`CODEX_THREAD_ID` unset; values not printed)

| Question | pi 1.4.0 | omp 18.12.6 |
|---|---|---|
| `PI_SESSION_ID` in Bash tool | yes, uuid-like, len 36, equals id in newest session file name (`...ece46b`) | **yes**, uuid-like, len 36, equals id in newest session file name in omp profile (`...a20772`) |
| `PI_SESSION_FILE` | yes, path, equals newest session file path | yes, path, equals newest session file path |
| Other session/profile vars | `PI_CODING_AGENT`, `PI_CODING_AGENT_DIR`, `PI_MANAGED_INSTALL_ROOT`, `PI_MODEL`, `PI_PROVIDER`, `PI_REASONING_LEVEL` | `OMP_PROFILE`, `PI_PROFILE`, `PI_CODING_AGENT_DIR`, `__PI_NATIVE_VARIANT_CACHE` |
| `OMP_SESSION*` | none | none |
| Distinguishing var | none beyond `PI_CODING_AGENT` | `OMP_PROFILE`/`PI_PROFILE` (also set), no pi-only var |
| Session id shape | uuid v7 | uuid v7 |

Other `*SESSION*` names seen are inherited or OS (`CK_SESSION_ID`, `CLAUDE_CODE_*`, `XDG_SESSION_*`, `DBUS_SESSION_BUS_ADDRESS`), not from pi/omp.

CLI help: `omp --help` and `pi --help` list `--session-id`, `--session`, `--resume`, `--session-dir`; no env var documented. omp also has `--restore`. Not measured: REPL mode, `/new` changing the value, subagents, herdr env.

Scratch (gitignored): `.fgos/runtime/tmp/pi-probe/` (`probe-env.py`, `p1-pi.out`, `p1-omp.out`).

## Decision needed from owner

omp (18.12.6) exports the same `PI_SESSION_ID`, so a single `PI_SESSION_ID` source cannot tell pi from omp by that variable alone. Options:
1. Add `PI_SESSION_ID` as approved, CLI name `pi`, accept that omp sessions also appear as `pi-xxxx` (same id space, collision-free, but label is imprecise). Cheapest; Mailbox gets omp too.
2. Add it, and tell omp apart via `OMP_PROFILE` present => CLI `omp` (extra rule, one more env name to approve).
3. Do not add; wait.

Recommendation: option 2 gives correct labels, but it adds a variable the owner did not approve, so it needs approval. Option 1 is acceptable if the label does not matter.

## Files changed / scrub decision / tests

None yet (report only). Scrub decision pending: if `PI_SESSION_ID` is added, it must be scrubbed in `launcher.rs` `scrub_and_set` like the other session ids, because pi and omp both export it to children.
