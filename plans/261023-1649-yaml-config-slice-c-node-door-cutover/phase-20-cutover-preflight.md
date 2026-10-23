# Phase 20: Cutover preflight (stops if any precondition fails) and owner gate G-C1

Depends on 19 and Slice D landed **and activated** on the machine under test. Suggested executor: haiku for the checklist script (read-only), the lead for the gate. The output is a guide under `plans/reports/` (name from `fgos convention name|path --json`, for example `guide-<stamp>-config-cutover-preflight`).

## The checklist (one table per machine; every line is a command and its result, ids and paths only, never values)

| # | Check | Command / evidence | Stops if |
|---|---|---|---|
| 1 | D is active | `fgos config --help` lists the verbs; the addon marker reports `config >= 1` (`fgos doctor` row `rust-host-*`) | missing |
| 2 | Every activated project passes | per project from `find ~ -maxdepth 4 -path '*/.fgos/installation/activation.json'` (expected: forgentX, mdview, mcp-skill-hub on design-lap; `~/projects/forgent` on fg-server and fg-server2; this repository): `fgos config check` on project and global file | any `refused`; the project is migrated first (`fgos config migrate`, its own item, dry run first) or removed from the cutover list by the owner |
| 3 | Global file clean | no `runner.rigorToTier`, no extended tier cells (B's D10 owner action), no stale key the snapshot refuses | any refusal |
| 4 | Machine files | `~/.fgos/private` 0700, `accounts.yaml` and `gateway-token` 0600, `config-machine-files` green; D stage 1 done | missing |
| 5 | No older release reads the old keys | every release and activation on the machine listed (`~/.fgos`, each `activation.json`); D stage 2 done with the recorded **G-D3** answer for this machine | not done: the machine is simply not activated yet (G-C1 option A) |
| 6 | Parity report | phase 09's report: no open `changed` or `refused` line for any project on this machine | open line |
| 7 | Windows | no Windows asset is produced from landing C; gate G4 still open | an asset is built |
| 8 | `fgctl` independent of Node config | `fgctl status` and `fgctl verify` on a scratch copy holding a tombstone and a `config.yaml` | fails |
| 9 | Branch green | `cargo test --workspace --jobs 4`, then `npm test`, gateway and dashboard suites, run sequentially on `cfg/slice-c` merged with `origin/main` | red beyond the 18 known cases |
| 10 | Other worktrees | `git worktree list` and `git status` per worktree: none holds uncommitted edits to `.fgos/config.json` | any |
| 11 | Rollback ready | each machine's `previousArtifactDigest` and release store path recorded; this repository's backup path known | missing |

## Gate G-C1

Posted per machine with the table attached (text in the plan). A red line parks that machine only. The preflight is re-run on the machine immediately before its activation (phase 22), because projects change.

## Owning proof

The checklist output itself (live evidence); nothing duplicates a test.

## Risk / rollback

Read-only; no rollback. Risk: the list of projects is incomplete (a project nobody remembered): mitigated by deriving it from activation records, not memory, and by `fgos doctor` on each machine.
