# HARDEN writer scan by working directory

Branch `harden/writer-scan-by-cwd`, from `b80166ab6`. Owner picked option B (typed execution roots stay, free text goes).

## Cause (proved)

- **Gate (`fgctl upgrade`)**: the launching shell (cwd in the workspace, `-c "... fgos ...; fgctl upgrade"`) is listed by `quiesce-scan --workspace-only`, which lists every cwd match. `validate_predecessor_scan` then accepted any whitespace-split word with an fgos basename. Red test refused with `pid <shell> argv "sh -c echo fgos run; ..." lacks proven git-wal-v1`.
- **Migrate**: `names_payload` counted any argument that is an absolute path under the workspace (prompts, positionals), any argv word named fgos/fgos-runner/fgos-gateway or ending `bin/fgos.mjs`, any path under `<state>/releases`, plus every process whose environ carried `FGOS_STATE_ROOT`: all machine-wide. Proof: the new route test failed on the old code listing dozens of unrelated processes (other worktrees' test runs, a `bwrap git`, `sleep` in another workspace) attributed to a throwaway root.
- **Writer that needed argv (reported earlier)**: `fgos run --worktree <ws>` started from another cwd commits in-process (the code never calls `chdir`). Kept through the typed-root rule.

## Commits

| Commit | What |
|---|---|
| `375ac0a43` | red: launching shell must not block upgrade (+ census) |
| `8a5d05e7a` | gate judges by `argv[0]` / runtime + script (+ CHANGELOG, census) |
| `d724808ff` | red: route and gate-argv tests (+ census) |
| `e5633bda5` | scan per workspace, `argv` field, shared runtime test, docs (+ census) |

Commits 1-2 are the gate half already taken to a land branch; not rewritten.

## Behaviour now

- A process belongs to a workspace by cwd inside the root or a listed worktree, or by a typed `--dir`/`--worktree`/`--cwd`/`-C` value resolving inside it. Both modes. Outside `--workspace-only` both need `could_be_fgos` (I applied the rule to typed roots too, so `git -C <ws>` does not block migrate; the brief named it for cwd only).
- Removed: `names_payload`, machine-wide fgos-name and `releases/` matches, the `FGOS_STATE_ROOT` environ hit, `matched: "environ"`, `root: null`, the `PINNED_ROOT_ENV`/state-root use in the scan.
- Added: `argv` array beside `cmdline` in each process. `git_gate.rs` reads it (refuses a scan without it, fail closed) so a path with a space works.
- Shared: `fgos_holder_lock::origin::is_script_runtime` and the now-public `FGOS_BINARIES` serve `could_be_fgos` and `runs_fgos`; the versioned-node rule lives in one place (distribution already depends on holder-lock).
- Unchanged by design: an unreadable same-uid entry that could be fgOS still counts in `unreadable` (it cannot be placed in a workspace, so it fails closed machine-wide). Gate keeps `--workspace-only`.

## Tests

| Behaviour | Owner | Change |
|---|---|---|
| prompt or positional path in argv of a process elsewhere is not reported | `apps/fgos/tests/internal_lock_routes.rs::quiesce_scan_lists_a_process_working_in_the_workspace` | the old `runner` case (asserted the process was reported, `matched: cmdline`) flipped to assert not reported; also asserts exact `argv` |
| fgOS process of another workspace not reported; typed `--worktree` reported | same file, new `quiesce_scan_counts_a_process_by_its_own_workspace_and_its_typed_execution_root` | new, real processes |
| typed root vs text, `git -C`, cwd rules | `route.rs` unit `a_cwd_in_the_workspace_counts_only_for_a_process_that_could_be_fgos` | extended |
| launching shell does not block upgrade; `directed` writer still refuses | `apps/fgctl/tests/git_wal_activation_gate.rs` | new shell test; `directed` case kept |
| gate judgement from exact argv, spaces, versioned node, missing argv | `git_gate.rs` unit tests | new + existing adapted to the `argv` field |
| migrate counts only a real process in its workspace/worktree | `test/event-store/migrate-cutover-grant.test.mjs` | removed the `--workspace-only` host wrapper (it existed because production scanned the machine); the linked-worktree case now uses a node process, since a plain `sleep` no longer counts outside workspace-only |

Retired: nothing; the `runner` case was inverted, not dropped.

## Commands (target `/home/vantt/projects/forgent-worktrees/harden-writer-scan-target`)

- `cargo test -p fgctl --test git_wal_activation_gate`: red before gate fix, 3 pass after.
- `cargo test -p fgos --test internal_lock_routes`: both new quiesce tests red on old code, 7 pass after.
- `cargo test -p fgos-holder-lock`, `-p fgos-distribution`: all pass (holder-lock lib 21, distribution lib 59).
- `cargo clippy -p fgos-holder-lock -p fgos-distribution -p fgctl -p fgos --all-targets -- -D warnings`: clean.
- Node, through `runChosenTests(['test/event-store/migrate-cutover-grant.test.mjs'])`: 8 pass, 0 skipped.
- `node scripts/git-one-door-scan.mjs --check`: exit 1 with 5 `unresolved-binary` sites (`bin/fgos.mjs:3436,3580`, `src/runner/merge.mjs:943,973`, `src/runner/worktree.mjs:147`); identical at base `b80166ab6`, none mine. Census regenerated and committed with each Rust change.

## Net lines vs `b80166ab6`

- Rust src: `route.rs` -22, `origin.rs` +7, `git_gate.rs` about +70 (includes about 25 of its unit tests, rustfmt reflow).
- Rust tests: `internal_lock_routes.rs` +46, `git_wal_activation_gate.rs` +49.
- Node: `migrate-cutover-grant.test.mjs` -14. No Node src change (`migrate.mjs` already excluded its own ancestors and assumed nothing machine-wide).
- Docs/contract: holder-lock spec row, Event Store spec cutover text (stop-everything is a cross-machine operator procedure; the scan covers one workspace on this machine), quiesce-scan contract, two CHANGELOG lines. Census json churn only.

## Left for others

- **lead:ES (migrate)**: none required. Note the Event Store spec step 1 now says the scan is per workspace; cross-machine stop is the operator's.
- **OPC (Git/distribution)**: `git_gate.rs` and the census changed; the gate half (`375ac0a43`, `8a5d05e7a`) is the part already in a land branch. A mixed pair (old payload with new host) only gains the extra `argv` field; `fgctl` always stages one release, so the gate's missing-`argv` refusal cannot be hit by its own host.
- Pre-existing: one-door `--check` exit 1 (5 JS sites above).
- Not verified: the full docs-claims Node tests were not run (focused files only, per rules).
