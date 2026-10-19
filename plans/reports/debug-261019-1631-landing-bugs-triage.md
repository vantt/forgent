# Landing bugs triage (B1-B7)

Date: 2026-10-19 16:31 (Asia/Saigon). Scope: diagnosis only, nothing fixed. Base: origin/main `cc118e8c3`.
Sources: landing reports 0659, 0914, 1051, 1539 (plans/reports/landing-261019-*), gate notes, live reproduction.
Method: every root cause below was reproduced or read from source at the cited line; where I patched to prove a fix it was in a scratch worktree and reverted.
Scratch scripts: `/home/vantt/.claude/jobs/e1505f04/tmp/triage/`.

## Summary

| Bug | Root cause (one line) | Real bug? | Lane | Size | Safe without owner decision |
|---|---|---|---|---|---|
| B1 | Supervisor loop only asks "is a complete result there?"; an unparseable `result-N.json` is indistinguishable from "absent", so only the idle timer (90 min) ends it | Yes | runner / agent-protocol (terminal) | ~40 lines Rust + 1 vector test | Fail-closed version: yes. Nudge-the-agent variant: owner call |
| B2 | Generator renders only from local `state.decisions`; 6 decisions exist only as committed index rows (their events never reached any tracked event file) | Yes (design assumption false across machines) | setup / report (decision-index) | ~40 lines + test | Interim union fix: yes, with one-line contract note; true cure is Event Store cutover |
| B3 | `worktree_not_live` prints its warning and `remove_worktree` calls it 3 times | Yes (cosmetic) | Git | ~15 lines | Yes |
| B4 | `worktree_clean` refuses on mere existence of `.fgos`; correct for port-created (skip-worktree) checkouts, over-broad for plain `git worktree add` checkouts that track `.fgos` | Partly intended, partly bug | Git | ~25 lines + 2 tests + 1 spec sentence | Yes; spec sentence wants owner glance |
| B5 | Test depends on an earlier test having placed the machine-wide install tombstone; alone it is one fence short | Test bug only | holder-lock | ~10 lines test | Yes |
| B6a | bwrap ignores `--die-with-parent` when `--as-pid-1` is set: the flag is applied only in bwrap's reaper pid 1, which `--as-pid-1` removes | Yes, production guarantee gap | process | ~20 lines | Needs owner pick between two mechanisms |
| B6b | `lock_table_entries()` does one `read(2)`; `/proc/locks` returns one 4 KiB page per read, so entries past the first page are missing | Yes, production bug | process | 4 lines (patch proven) | Yes |
| B7 | `package.json` `files` declares `.agents/skills`, a mostly git-ignored dir; the payload walker reads the live filesystem, so setup render output counts as source | Yes | distribution | ~20 lines | Yes; changes release digest once |

## B1. Invalid result JSON stalls a writing round until idle

Evidence
- Landing 15:39 smoke b0: agent wrote `result-1.json` with a raw newline inside `summary`; round stalled, lease held until SIGINT.
- `packages/agent-protocol/rust/src/terminal/mod.rs:140-153` `FsOutbox::newest_complete`: `serde_json::from_slice(&first).ok()?` returns `None` for unparseable bytes, same as "no file" and same as "file still being filled" (pi creates it empty first, doc comment line 125-127).
- `packages/run-supervisor/rust/src/supervise/terminal.rs:658-667` (`drive` loop): `detect_completed` -> `None` -> `io.pause(WORK_POLL_MS)` forever. The only exits are completion, blocker/quota, cancel, soft deadline, or `idle` (`terminal.rs:407`, `self.last_active.elapsed() >= idle`, `idleMs` from `src/run-supervisor/direct-launch.mjs:208`).
- Idle is "screen unchanged for idleMs" (`note_screen`, `terminal.rs:436-443`), so it only fires after the full configured idle window (90 min), even though the agent is visibly back at its prompt.

Root cause: a missing tri-state. "Complete", "absent" and "present but unreadable" collapse into `Option<PathBuf>`, so the loop cannot tell "agent finished with a bad file" from "agent still working".

Fix proposal
1. `agent-protocol/terminal/mod.rs`: add `Outbox::newest_unreadable(&mut self) -> Option<PathBuf>` (default `None`, so the fake outbox in `tests/terminal_vectors.rs` is untouched). `FsOutbox` returns the newest `result-N.json` that exists, is non-empty, and does not parse as an object, with size and mtime unchanged across the existing 20 ms wait.
2. `run-supervisor/.../terminal.rs` `drive`: track `(path, first_seen)` of an unreadable file. When it has been unchanged for at least ~30 s AND `io.inspect()` shows the agent idle (`state == "idle"`, not working) on consecutive polls, call `end_early` with a new reason `terminal:result-unreadable`. `early_reason` gets one more arm.
3. Settlement then sees a stopped attempt with no result and a named reason (failed claim), the gate exits, the lease is released (same path as `terminal:completed-no-exit`).
4. Vector test: file with raw newline + idle pane -> ends with the reason; pi-style empty-then-filled file -> no early end.

Optional improvement (feature idea, owner choice, not required): before failing, send the agent one message "result-N.json is not valid JSON (control character in a string); rewrite it", then fail if it stays bad. Better for "release the human" priority, but it is new behavior.

Owner lane: runner / agent-protocol terminal. Safe without owner decision: the fail-closed version, yes (it only shortens an already-failing round). Nudge variant: owner.
Note: the program board already carries this as an open item (commit `cc118e8c3`).

## B2. `fgos setup` / `doctor --fix` rewrite `docs/decisions/index.md` and drop rows

Evidence
- Generator: `src/report/decision-index.mjs:104-113` `computeDecisionIndex` -> `listWork(fgosDir).decisions` -> `buildDecisionIndexMarkdown` (lines 40-77). The file is replaced wholesale from the local state; the only guard (`generateDecisionIndex`, lines 130-140, F12) refuses just the "file has rows, new has zero rows" case.
- Callers: `src/setup/registrations.mjs:3697-3790` (`decision-index-stale` check + fix; setup runs the same fix).
- Reproduced read-only (`di.mjs`: build index from this machine's `.fgos` and diff against committed file): 6 rows lost: D-ADR0056, D-ADR0059, D-ADR0060, D-ADR0061, D-ADR0062, D-ADR0070 (landings saw 5, then 6, as D-ADR0070 was added).
- Why they are invisible: `git grep` for each of the six ids in `origin/main:.fgos` -> 0 hits; also 0 hits in this machine's `.fgos/events*`. They were recorded in the owner machine's local event log, whose shards never reached git, while the regenerated index (with the rows) was committed (e.g. `69c04f179`, `f7fc26ef6`). Prior manual repair: `3021b7ba3` "restore the run supervisor decision row that a regeneration on this machine dropped".
- Doctor `decision-index-stale` fails for the same reason: `checkDecisionIndexStale` compares the file to the local-state render (`registrations.mjs:3697-3725`).

Root cause: the generator header promises "complete by construction for the same store", but the store is per machine and decisions do not travel until the Event Store cutover (D-ADR0055: events on per-machine refs, shared by fetch). The committed index is currently the only carrier of those rows, and the generator treats it as disposable.

Fix proposal (interim, ~40 lines + test)
- `buildDecisionIndexMarkdown(decisions, existingMarkdown)`: parse existing rows (`| scope | text | rationale | ts |`), key by decision id (the `D-ADR\d+` / text prefix, falling back to `ts+scope`), union with state rows (state wins on key clash), same sort. Rows only in the file are kept.
- `computeDecisionIndex` passes `previousContent`; `checkDecisionIndexStale` and the fix keep sharing it (one door), so doctor goes green and setup stops touching the file.
- Explicit removal stays possible by editing the file and the state together (no silent retraction); say so in the file header comment.
- Test: a file with a row the state lacks survives regeneration; a state row missing from the file is added; idempotent second run.
- Real cure: Event Store cutover / syncing the owner machine's event shards. Then the union becomes a no-op and can be dropped.

Alternative rejected: derive from `docs/specs/*` "Lịch sử quyết định" narrative; those are prose, not structured rows.
Owner lane: setup (decision-index owner is the tsk-1lv lane). Safe: yes for the union; it slightly changes the "generated, never hand-edit" contract, so mention it in the header and spec line.

## B3. `worktree-cwd-unreadable` printed 3 times per remove

Evidence
- `packages/git/rust/src/worktree.rs:322-362` `worktree_not_live` does the `/proc` scan and `eprintln!("warning: worktree-cwd-unreadable ...")` (line 352) inside the loop.
- `remove_worktree` calls it at line 796 (pre-check), 848 (after `begin_worktree`), 860 (after the TargetAttempt append). Each call rescans and re-prints. `relocate` has the same triple (952, 981, 993).

Root cause: deliberate TOCTOU re-checks (live-cwd must be re-proved at each step under the WAL), but the warning side effect lives in the check.

Fix proposal (~15 lines, `worktree.rs` only)
- Give `worktree_not_live` a `warned: &mut BTreeSet<u32>` (created once per operation) and print only pids not yet in the set; keep scanning every time. Or return the unreadable `(pid, comm)` list and let the operation print the union once at the end. Add a test that two scans of the same unreadable pid emit one warning (capture via the returned list rather than stderr).
- No behavior change to the refusal logic.

Owner lane: Git. Safe: yes.

## B4. Port refuses to remove a clean linked worktree that tracks `.fgos`

Evidence
- `worktree.rs:236-238` `worktree_clean`: `if !missing(&path.join(".fgos"))? { return Err(failure("worktree-worker-state-preserved")); }` runs before any status check, so it triggers on any `.fgos` presence, tracked and clean included.
- Intent, from source: create strips `.fgos` and marks its tracked paths `skip-worktree` (`worktree.rs:677-690`, comment "A reappearing .fgos is always preserved"). Skip-worktree hides content changes from `git status`, so a blanket presence test is the only way to see worker state that came back in such a checkout. Spec: docs/platform/git/spec.md §3 Worktree line 136 "Remove preserves staged, unstaged, untracked, ignored and reappearing worker-state bytes".
- Landing 15:39: `land4/wt` and `land2/wt` were created by plain `git worktree add` (no skip-worktree bits, `.fgos` tracked and clean); plain `git worktree remove` worked, the port refused.
- Port `status` has no `.fgos` exclusion (checked), and untracked and ignored bytes are separately covered by `worktree_clean` lines 241-262.

Verdict: intended for port-created worktrees (G-195 says every creating door goes through the port), but over-broad for plain checkouts. The spec wording ("reappearing worker-state bytes") does not require refusing a checkout whose `.fgos` is byte-identical to HEAD and has no skip-worktree bit; nothing is lost by removing it.

Fix proposal (~25 lines + tests)
- Replace the existence test with a precise one: `ls-files -v -z -- .fgos`; refuse (`worktree-worker-state-preserved`) if any entry is skip-worktree (`S`/`s`) AND its path exists on disk (hidden state came back), or if `.fgos` exists and is not tracked at all (symlink, or paths unknown to the index). Everything else (modified, untracked, ignored) is already refused by status and the ignored scan.
- Tests: (1) plain `git worktree add` with tracked clean `.fgos` -> remove succeeds; (2) port-created worktree with `.fgos` recreated -> still refused; (3) plain worktree with a modified tracked `.fgos` file -> refused (dirty).
- Spec §3: add one sentence that a tracked, clean, non-skip-worktree `.fgos` is not worker state.

Owner lane: Git. Safe: yes (strictly narrower refusal, same preservation of bytes). Owner glance wanted for the spec sentence only.

## B5. `holder-lock-checks.test.mjs` "payload registry" fails alone

Evidence (origin/main `cc118e8c3`-era tree, host built from this tree, `FGOS_HOST_BIN` set, `node --test --test-name-pattern='payload registry'`):
- 5/5 runs alone fail with `Expected values to be strictly deep-equal`: actual `[ '../../../fgos-holder-lock-checks-state-root-XXXX/install.lock', 'installation/activation.lock', 'observe/.lock' ]`, expected `[ 'installation/activation.lock', 'observe/.lock' ]` (test line 413-415).
- Whole file: this test passes (the `lock-fences` test earlier in the file, line 361-384, places 13 fences including `STATE_ROOT/install.lock`; the in-test comment at line 413 says so).

Root cause: hidden test-order dependency on the machine-wide install tombstone under the shared `STATE_ROOT`. Not a production bug. The final `warning: 2 of 13` assertion (line 420) has the same dependency (alone it is 3 of 13); the deepEqual just fails first.

Fix proposal (~10 lines, test only): make the precondition explicit. Before `activate()` in this test, place the install tombstone with the same production placer the first test exercises (or assert `STATE_ROOT/install.lock` exists as a precondition after creating it), so the expected sets no longer depend on test order. Do not weaken the assertions.

Owner lane: holder-lock. Safe: yes.

Related, out of scope but seen: in the same file `lock-holders: a monitor whose parent is the supervisor of the attempt ...` fails on this host alone and in the full file (`supervisor and monitor did not both hold the lock`, line 271). `descriptionHolders` works for a plain flock holder pair (checked), and the B6b patch did not fix it, so cause is unconfirmed (candidates: `env -i` child plus the `FGOS_LOCK_FD` foreign env, or this host's lock table). Needs its own look (holder-lock lane).

## B6. fgos-process (Rust)

### B6a. `containment_terminal_gate_dies_with_a_killed_supervisor` fails deterministically

Evidence
- 3/3 fail: `containment_bwrap.rs:167` `assertion left == right`: heartbeat 37/38 vs 24 (grandchild still beating 300 ms after the supervisor was SIGKILLed). Direct-mode sibling passes (it expects survival).
- Reproduced without fgOS, plain `bwrap 0.11.1` (Ubuntu, kernel 7.0, `apparmor_restrict_unprivileged_userns=1`), parent killed with SIGKILL, heartbeat fixture as gate (`dwp.py`):
  - `--unshare-pid --dev-bind / / --proc /proc --die-with-parent` (no `--as-pid-1`): namespace dies. 
  - `--unshare-pid --as-pid-1 --dev-bind / / --proc /proc --die-with-parent` (what `BwrapPidns::prefix` builds, `containment/linux.rs:77-86`): gate `sleep 600` and grandchild keep running, reparented to host pid 1. Same without the flag.
  - Same `--as-pid-1` command with the gate run as `setpriv --pdeathsig kill -- <gate>`: namespace dies.
- Upstream source (bubblewrap v0.11.1 `bubblewrap.c`): `PR_SET_PDEATHSIG` is set in exactly one place, `handle_die_with_parent()`, called from `do_init()`; `do_init()` is the reaper pid 1, which `--as-pid-1` removes. So with `--as-pid-1` the flag only affects the host-side monitor (which does die), never the namespace init.

Root cause: the terminal-mode guarantee "attempt dies with the process that spawned it" (`containment/mod.rs:30`) rests on `--die-with-parent`, which bwrap does not deliver when `--as-pid-1` is present. Not a test flake; the test is right and this is a real gap on this host: a killed supervisor leaves a terminal gate (and the agent under it) running. (Other bwrap builds may behave the same; upstream design says they do. Not verified on the owner machine.)

Fix proposal (~20 lines, `containment/linux.rs`; pick one)
- A (preferred): in Terminal mode run the gate as pid 1 that sets its own `PR_SET_PDEATHSIG(SIGKILL)` first. For the production gate that is a `prctl` at gate start (plus a `getppid` re-check for the race); for arbitrary argv (the test's `sh`) a wrapper is needed: `setpriv --pdeathsig kill --` (proven above; util-linux, would have to be registered in `fgos doctor` per the install gate) or a self-exec shim in the supervisor binary (no new dependency, a few more lines).
- B: drop `--as-pid-1` in Terminal mode and accept bwrap's reaper as pid 1. Rejected here: it changes the gate identity contract ("domain is empty exactly when the gate is dead", `prefix()` check `missing-as-pid-1`).
- Keep the test as is; add a cleanup guard so a failing run does not leave `sleep 600` gates behind (my three failing runs left three; killed by hand).

Owner lane: process. Needs an owner pick between A-with-setpriv and A-with-shim (dependency vs code).

### B6b. `kernel_table_and_fdinfo_agree_on_the_locker_stamp` flakes in parallel

Evidence
- `packages/process/rust/src/platform/linux.rs:320-333` `lock_table_entries`: a single `read(2)` of up to 16 KiB; retries only when `n == size`. The kernel's `/proc/locks` returns one seq_file page (about 4 KiB) per read regardless of buffer size; the neighbouring test `a_large_userspace_buffer_does_not_make_proc_locks_a_complete_snapshot` (line 475) exists to prove exactly that.
- `lib` tests in parallel: fails 5/6 (assert at line 516, our FLOCK entry absent). `--test-threads=1`: 3/3 pass. Running only this test plus the large-lock test with 2 threads: 1/3 fail.
- Independent proof (`locks.py`): 300 range locks + one flock; first `read` = 4092 bytes, our entry not in it, found when reading to EOF (21581 bytes). This host already has 68 lock lines (> one page) without any test help.
- The production caller (`holder-lock/rust/src/driver/flock.rs:339-345`, `settle_release`) comments "seq_file may return a short prefix ... absence is only a reason to probe": the prefix behaviour is known and worked around, so this is a latent accuracy bug, not a regression; the test wrongly asserts completeness of a prefix.

Root cause: `lock_table_entries` is documented as a table read but returns a first page; the parallel `a_large_userspace...` test just pushes the entry past it.

Fix proposal (4 lines; patch verified in the scratch worktree, then reverted): read to EOF.
```rust
pub fn lock_table_entries() -> io::Result<Vec<LockEntry>> {
    use std::io::Read;
    let mut text = String::new();
    File::open("/proc/locks")?.read_to_string(&mut text)?;
    Ok(text.lines().filter_map(parse_lock).collect())
}
```
With it: `cargo test -p fgos-process --lib` 6/6 pass in parallel. Callers keep treating absence as "probe", so this only makes evidence more complete. (A multi-read snapshot is not atomic; that is already the stated contract.)

Owner lane: process. Safe: yes.

## B7. Doctor `active-release-matches-checkout` fails every landing

Evidence
- Each landing report: `changed=0, 4 missing`, all under `.agents/skills/instruction-audit/` (SKILL.md, references x2, scripts/instruction-audit.mjs; present in the main checkout, mtime 15:17 from setup).
- `.gitignore:72-78`: `/.agents/skills/*` ignored except `fgos-*`, `distill`, `_shared`. `git ls-files .agents/skills/instruction-audit` -> empty; `git check-ignore` confirms `.gitignore:73`.
- `package.json` `files` lists `.agents/skills`. `scripts/build-rust-distribution.mjs:109-185` `collectSourceFiles` / `listLegacyNodeSourceFiles` walk the live filesystem, ignoring git. `registrations.mjs:5136` feeds that same list to the check.
- `core/skills/instruction-audit` (commit `aae9455b1`) is a core skill whose name does not match the gitignore exceptions, so `fgos setup` assembles it into the ignored part of `.agents/skills` on every machine that runs setup. Releases are built from a clean worktree (landing: `land4/wt`), which lacks those 4 files; the checkout has them -> "missing in release".
- Existing precedent for the same defect: `registrations.mjs:5133` exempts `.agents/hooks.json` by name ("per-machine hook files setup writes inside a declared payload directory are not source").

Root cause: the payload definition is "everything on disk under a declared directory", so release contents depend on whether setup ran on the building machine, and the doctor check inherits that. Release builds from a post-setup checkout would ship render output; builds from a clean worktree would not; the check can never agree on both.

Decision on the three options
- Check ignores ignored files only: fixes the symptom, leaves the non-reproducible release. Not enough.
- Setup stops rendering: wrong. Setup must render core skills into the project (that is its job; instruction-audit would vanish for users).
- Payload carries them (un-ignore `instruction-audit`): fixes this skill, but the next core skill without the `fgos-` prefix recurs. Not a root fix.
- Correct: make git ignore rules the definition of source in the one shared door `listLegacyNodeSourceFiles` (used by packaging and by the doctor check). Use `git ls-files -z --cached --others --exclude-standard -- <declared entries>` when the root is a git work tree; fall back to the current walk otherwise (tarball). Then the `generatedHookFiles` name exemption can be deleted too (L10: one door, old path removed).

Fix proposal (~20 lines in `scripts/build-rust-distribution.mjs`, small test in the existing packaging test, delete the `.agents/hooks.json` special case). Effect: the next release digest changes once (ignored files no longer in the walk if any were being shipped from a dirty builder), doctor row goes green on every machine.

Owner lane: distribution (D-ADR for `docs/specs/distribution.md`: add one line "git-ignored files are never payload"). Safe without owner decision: yes; mention in CHANGELOG `[Unreleased]` only if a user-visible release content change is expected (it is not).

## Cross-cutting notes

- B6b and the B2-style "local view treated as complete" share a theme: a per-machine/partial view promoted to truth (lock table first page; local event log). Worth a doctor note in the Event Store cutover checklist for B2 only.
- B3, B4 touch the same file (`packages/git/rust/src/worktree.rs`) and the Git lane's open phases; sequence them in one change to avoid conflicts with the program board's lock/git rows.
- Leaked processes from my failing runs (`sleep 600` gates, heartbeat loops, `sleep 30`) were identified by cwd/start time and killed; no other process touched. Scratch worktree removed after commit.

## Unresolved questions

1. B6a: does the owner machine's bwrap behave the same (PDEATHSIG not applied under `--as-pid-1`)? If the test passes there, a bwrap version difference exists and the doctor should report the version.
2. B6a: `setpriv` dependency vs self-exec shim.
3. B2: should the union also drop a row when its decision is explicitly retracted in state (there is no retraction event type today)?
4. The `lock-holders ... monitor whose parent` failure on this host is unexplained (see B5).
5. B1: nudge-then-fail or fail only?
