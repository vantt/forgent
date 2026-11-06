# Census: executor commands committed in project configs (fg-server2)

Date: 2026-11-06 12:2x Asia/Saigon. Owner decision 64 (UQ-1 a): executor `command`/`args` become global-only only after the values move. Read-only; key paths only, no values printed.

## Scope searched

- Every `.fgos/installation` on this machine (`find / -xdev`): **one** activated project, `~/projects/forgent`. Linked worktrees share its committed config.
- Config files: `~/.fgos/config.yaml` (global) and `~/projects/forgent/.fgos/config.yaml` (project). The `.json` twins and the plugin marketplace copy are legacy JSON and not read for these keys.

## Findings

| Project key path | In global today | Same value as global |
|---|---|---|
| `runner.executor.command` | yes | yes |
| `runner.executor.args` | yes | **no** (differs) |
| `runner.executors.gitnexus.invocations[0].command` (with `via`, `tools`) | no | n/a |
| `runner.executors.herdr.invocations[0].command`, `.args` (with `via`) | no | n/a |

Five key paths in one project file. Once the schema makes these global-only, the config door refuses the project file (`config-key-out-of-scope`; a list above a global-only key such as `invocations` counts) and every `fgos` verb in this repo stops on every machine at once.

## Move steps (for the guide; owner-made, each machine)

1. Global file of each machine gains `runner.executors.gitnexus` and `runner.executors.herdr` invocations as the project has them, and decides which `runner.executor.args` it wants (the project's differ from fg-server2's global).
2. One commit in this repo removes the five key paths from `.fgos/config.yaml` (and their invocation entries); executor entries that carry no command stay.
3. Only then T5 phase 04 half B (schema change) lands, in one announced window.

## Not covered

- The owner machine and fg-server: not reachable from here; the guide repeats the census there (`find / -xdev -path '*/.fgos/installation'`, then the same key-path listing).
- Other projects that use fgOS elsewhere: same guide step on their machines.
