# Identity register_writer hook-path cost

Branch `ident/register-fast`. Commits: head read only for a `PI_SESSION_ID` key; register without a directory scan in the common case. Durability untouched (option below).

## Method

Throwaway harness (not committed; source was `.fgos/runtime/tmp/register-timing.rs`, run as a cargo example, release build, `-j 4`). Temp state root on ext4 (`/dev/nvme0n1p2`, under `forgent-worktrees/ident-tmp/`). Each of 200 iterations: restore a template directory (0 or 450 entries: 1/3 live head, 1/3 dead head, 1/3 unknown liveness), `sync`, then one `register_writer` call (Claude key, new handle, live head, `clone_dir` = a git repo with `.fgos/project.json`, no roles). Part times are separate probes of the same operation against the same directory state (scan = read + parse + judge every entry; prune = unlink of the dead files; durable write = `install_once_with_mode`; project id read = `project_info`; head read; `session_for`).

Load average during the runs: 3.6 to 5.0 (1-minute), a noisy disk. Fsync time on this machine swung between 7 and 35 ms p50 within minutes, for the same code. The before/after runs below were therefore interleaved (before, after, before, after, ...) three rounds each, and the table gives the median of the three rounds' p50 and p95.

"Before" = the tree with change 1 already applied (its effect is about 0.05 ms) and without change 2.

## Part breakdown, before (first quiet run, load 1.9 to 2.4, 0 / 450 entries; p50 / p95 ms)

| part | 0 entries | 450 entries |
|---|---|---|
| register_writer total | 7.7 / 8.6 | 24.3 / 46.4 (a second run: 20.9 / 30.7) |
| scan (read+parse+judge) | 0.01 / 0.01 | 2.2 / 3.0 |
| prune deletes (150 dead) | 0 | 0.47 / 0.54 (unlink only; their journal commit lands in the fsync) |
| durable write (file + dir fsync) | 7.1 / 8.2 | 14.3 / 36.4 |
| project id read | 0.02 / 0.04 | 0.02 / 0.04 |
| head read | 0.04 / 0.07 | 0.05 / 0.08 |
| session_for | 0.05 / 0.07 | 0.05 / 0.06 |

Fsync split (separate probe, 200 x 300-byte file on the same ext4, load 3.7): file write+fsync p50 4.8 to 7.1 ms; rename + directory fsync p50 4.5 to 5.8 ms; together p50 9.6 to 15.9, p95 18 to 55.

## Before / after, same harness, interleaved (median of 3 rounds; p50 / p95 ms; load 3.6 to 5.0)

| entries | before total | after total | durable-write probe, before | durable-write probe, after |
|---|---|---|---|---|
| 0 | 20.3 / 40.9 | 17.9 / 38.1 | 21.4 / 40.6 | 20.2 / 44.5 |
| 450 | 27.5 / 50.5 | 21.7 / 42.7 | 19.3 / 34.9 | 17.5 / 31.7 |

Raw rounds (total p50 / p95): 0 before 17.1/36.1, 34.0/61.0, 20.3/40.9; 0 after 20.3/38.1, 9.9/23.2, 17.9/39.7; 450 before 27.5/39.8, 29.7/59.7, 26.0/50.5; 450 after 28.7/69.5, 19.6/39.5, 21.7/42.7.

## Reading

- With 0 entries the scan and prune are already nil: the cost is the durable write (total is within noise of the fsync probe). Change 2 cannot move it.
- With 450 entries change 2 removes the scan (about 2 ms, p95 about 3.5) and the prune of the dead third. The prune matters more than its unlink time: the unlinks dirty the directory and the following fsyncs pay the journal commit, so the 450 case's total sat 6 to 13 ms above the 0 case; after the change the median p50 gap is 3.8 ms (the rest of the gap is noise).
- Disk noise (7 to 35 ms for the same fsync) is larger than the remaining difference, so p95 comparisons on this machine are only indicative. In the quiet run, before: 7.7 / 8.6 at 0 entries, so the floor is about one 7 to 8 ms fsync pair; under load it reaches 17 to 40 ms.
- After change 2 the fsync (file + directory) is the whole cost: total tracks the durable-write probe at both sizes. Everything else (project id 0.02, head read 0.04, session_for under 0.05, scan only when due) is under 0.2 ms in total.

## Step 3 (durability): option only, not changed

fsync dominates now, about half in the file fsync and half in the rename + directory fsync. The entry is a derived record the same session can rewrite on its next registration, so options for the IDENT lead, from cheapest in risk:

1. Skip the directory fsync of a created entry (keep the file fsync): saves about half of the floor; a crash can lose the newest registration, not corrupt one.
2. Skip both fsyncs for the directory entry (write temp, link): a crash can leave an empty or lost entry file; the reader already treats an unparsable file as foreign, which still counts toward the cap, so this needs the reader to treat a zero-length file as removable.
3. Keep the durable write but move it off the hook's critical path (write after the hook returns): needs a caller change, not an Identity one.

`fgos_durable_file` has no no-fsync mode today, so 1 and 2 need a new option there (a separate owner).

## Proofs

- `tests/directory.rs`: dead holder of the handle replaced (and resolves to the new id); live different id refused `handle-in-use` (existing); `role-held` (existing, role writes still scan); at the cap one dead entry is pruned and the registration succeeds; at the cap with no dead entries `directory-full` (existing); a full directory of unknown-liveness entries is never pruned and refuses `directory-full`; a no-role write below the cap prunes nothing, a role write prunes (the changed existing test).
- `tests/session.rs`: a Claude key with a bogus head pid names the same session as with none.
- `cargo test -p fgos-identity` and `cargo test -p fgos --test cli_tests identity` green.

## Behaviour notes

- A dead entry with the same full id as the registrant is replaced as a new registration (fresh `registered_at`, roles dropped), as before; a live or unknown same-id entry refreshes and keeps its roles.
- A dead holder is replaced by remove then create-once; if a concurrent registration wins the create, it decides (`handle-in-use` unless it is the same session). The racing-handles test still lets exactly one in.
- A foreign file at the handle's name is overwritten, as before.
- Spec section 5 (local directory and in-process doors paragraphs) updated to the new prune rule.

## Unresolved

- Cap count is by `.json` file names in the first 1024 directory items, same bound as the scan.
