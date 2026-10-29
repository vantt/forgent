# HARDEN re-check of the components added after the HARDEN plan: merged drift list

- **Big lead:** lead:HARDEN (`claude-p74h@fg-server2`).
- **Why:** the owner asked on 2026-10-29 whether the components that appeared after the HARDEN plan (2026-10-21) are checked. They were not; the T0–T3 re-check (decision 48) covered only the plan's layer table.
- **Code base:** main pinned at `a5358f127` in the detached worktree `forgent-worktrees/harden-recheck-new`.
- **Per-component audits:**
  - [yaml-doc and secrets](audit-261029-1029-harden-recheck-new-yaml-doc-secrets.md)
  - [config and herdr-fgos-common](audit-261029-1029-harden-recheck-new-config-herdr-common.md)
  - [mailbox](audit-261029-1029-harden-recheck-new-mailbox.md)
- **Not covered:** `work-state` waits for T5 (Work is isolated and comes later); `fgctl` stays under Packaging.

## Verdict

No component is broken and none depends upward.

| Component | Layer from its real dependencies | Findings |
|---|---|---|
| `yaml-doc` | T0 leaf; the one YAML authority for Rust and Node | 0 Medium, 4 Low |
| `secrets` | T0 leaf; no production consumer | 3 Medium, 3 Low (mostly docs and dead keys) |
| `config` | T2 core; the `fgos config` CLI feature is T3 because it adds Git; the Git edge points down | 10 Medium, 6 Low, at the call sites |
| `herdr-fgos-common` | above config; serves the dashboard (T9) | part of the config audit |
| `mailbox` | T3, beside agent-protocol | 3 Medium, 8 Low |

None was rated High.

## Verified by the big lead (independently, on current main)

- **C1.** Two routes to the trusted root: the addon uses `GitDriver::new(..).resolve_repo(..)` with its own memo (`packages/git/node-addon/src/config.rs:190-199`), while the CLI uses `GitDriver::trusted_root_at` (`packages/config/rust/src/provider.rs:253`).
- **C3.** Only `provider.rs:61` handles `USERPROFILE`. `machine.rs:103`, `apps/fgos/src/wiring/mailbox_config.rs:72` and `apps/fgos-gateway/src/gateway.rs:109` read `HOME` only.
- **C5.** `src/setup/runner-config-conversion.mjs:55,98` reads and parses the config file by hand, and `:182-183` copies a backup beside it.
- **N1.** `resolveEnvPatch` (`src/runner/dispatch/provider-adapter.mjs:185`) builds `envPatch`, and nothing in `src` or `bin` reads it.
- **N3.** `secrets.projectFile` and `secrets.sources` ship in `core/config-standard/secrets.yaml` and no code reads them.
- **M-1.** `packages/mailbox/rust/store/src/record/sys.rs` has 16 `unsafe` lines beside durable-file's `beneath` door.

## Decisions taken inside the approved frame (RUL104, decision 48)

### Batch B: HARDEN fixes now

One Sonnet lead, one branch, one commit per item. OPC reviews the Git route (C1).

| Item | Fix shape |
|---|---|
| C1 | The addon uses `GitDriver::trusted_root_at`, like the CLI; delete its memo and stat reader. |
| C2 | One detector for the CLI and Node reads, so `fgos config show` and `readConfig` agree; delete the stale "until the PATH probe lands" path. |
| C3 | One home-directory resolver exported from config; move every snapshot builder outside MAIL's files to it. The mailbox wiring site (`mailbox_config.rs:72`) moves when MAIL finishes (see below). |
| C7, C8 | Doctor: use `createDoctorRun().once` instead of the private memo; one row per fail condition. |
| C9 | Readers that keep a fail-closed value say so when config refuses on Windows, instead of falling back silently. |
| C10, C13, C14, C16 | Dead Rust code and failure code; gate-bypass level decided in one place; Node copies of defaults read through the door; one test helper. |
| N1 | Delete `resolveEnvPatch` and its output. |
| N4 | Delete the `dependencies-installed` row that can no longer fail. |
| N5, N9, N10 | One Value-to-JSON converter in yaml-doc; retire the duplicate no-addon test; the manifest check covers every Cargo manifest. |
| Frontmatter | `src/report/frontmatter.mjs` (103 lines) goes through the YAML door if that deletes code; the lead measures first. |

### Handed to other lanes

| Item | Lane | Fix shape |
|---|---|---|
| C5, C6 | COOK | `runner-config-conversion.mjs` reads through the door; the backup is not left as an unignored file beside the config; delete the uncalled `patchDoor` option. |
| C11, C12 | Dashboard and gateway (T9, outside HARDEN) | Recorded as an item: one `fgos` command builder, no hard-coded source path, one `fgos list` per refresh with a time limit. |

### Held until MAIL finishes (owner, 2026-10-29 10:4x)

The owner said MAIL is not finished and a deep audit now would get in its way. The mailbox and secrets findings below stay here, unsent; HARDEN does not message MAIL about them and does not touch MAIL's files. When MAIL closes its work, HARDEN re-runs a deep mailbox audit on the then-current main and only then hands over what still holds.

| Item | Then goes to | Fix shape |
|---|---|---|
| M-1 (`tsk-1lx`) | MAIL; HARDEN reviews | Move the raw `unsafe` calls onto durable-file `beneath`. |
| M-2, M-3, L-1 to L-8 | MAIL | One source for limit values; check hook facts before reading config, and install hook rows only where the facts exist; the Low items as listed. |
| N2, N3, N7, N8 | MAIL (caretaker of `secrets`) | Make the docs and the config test agree; the two unread keys; the file reader through the durable-file door; no sleep-poll test. A contract change stays the owner's call. |
| C3 (mailbox site) | HARDEN | `mailbox_config.rs:72` uses the shared home resolver. |

### After DOC Land

C4 (spec rule 6 matches the code: the caller passes the trusted root), C15, and the Secrets spec header.

## Owner questions

| Question | Item | Change |
|---|---|---|
| Q4 | N6 | Retire the signed YAML Document API `insert` and `set_inline_comment`, which have never had a production caller, or keep them. |

## Unverified (kept as items)

- Whether `fgos list`, `triage` and `merge list` take their root from the current directory; if so, the dashboard not setting it is a live bug.
- Whether the Node `gate-bypass` branch in `bin/fgos.mjs` can still be reached. The batch B lead checks this under C13.
