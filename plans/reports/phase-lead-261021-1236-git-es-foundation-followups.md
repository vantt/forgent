# Git and Event Store foundation follow-ups

Date 2026-10-21 (Asia/Saigon). Branch `git/followups` from `origin/main` `6cae23201`, worktree `.claude/worktrees/git-fu`. Not pushed, not merged. Work-lane code and `src/state/hot-lock.mjs` untouched.

## Per item

### 1. `recover_publications` and a stuck pin release
- Changed: `packages/git/rust/src/publication.rs`. A chain whose pin release fails (native lock on the ref store, a pin that no longer holds its candidate) is added to the returned pending list by id and recovery continues with the other chains. Before, the first failing `release_pin_and_compact` returned `Err` and abandoned the loop. Non-release errors from `recover` still abort (unchanged).
- Owning test: `recovery_reports_a_chain_whose_pin_release_is_stuck_and_still_settles_the_others` in `packages/git/rust/tests/publication.rs` (files and reftable; the stuck chain sorts first, the two later chains are released and compacted, the stuck one stays retained and is named).
- Verdict: fixed. `cargo test -p fgos-git --test publication` 32 passed; lib 50 passed.

### 2. One ref grammar for `worktree create --base` and `remove --delivered-to`
- Changed: `GitDriver::resolve_literal_ref` (`packages/git/rust/src/worktree.rs`) is now the only literal-ref resolver (full `refs/` name, else branch, tag, remote-tracking; direct refs only). `resolve_worktree_base` calls it. Exposed through the existing Inspect addon door as `resolveLiteralRef` (`packages/git/node-addon/src/git/inspect.rs`, `src/git/inspect.mjs`). `src/verbs/worktree/remove.mjs` dropped its own `refs/heads/` resolver and uses it (an object id is still taken as is). Registry text, spec §13 sentence and CHANGELOG updated.
- Owning test: `test/verbs/worktree-remove.test.mjs` (first test now also removes with `--delivered-to origin/main` and expects `refs/remotes/origin/main`). 7/7.
- Verdict: fixed. No second resolver left; the old JS path is deleted.

### 3. Census churn
- Changed: `census()` in `scripts/git-one-door-scan.mjs` no longer persists `outsideProduct`; the scan still counts and prints it. The tracked census now holds only product files, their digests and classes. `verifyCensus` / doctor `git-mutation-one-door` unchanged: the census is still built from the payload it sits in. Regenerated `packages/git/contracts/mutation-census.v1.json` (it was also stale for `scripts/git/p-space.sh`). Spec §12 sentence updated.
- Owning test: `test/git/one-door.test.mjs` (persisted census has no `outsideProduct`; existing tests keep the scan count and the verify rules). 6/6.
- Check: adding a file under `plans/` and regenerating gives a byte-identical census.
- Verdict: fixed. `npm test` and the distribution build can no longer dirty the file because of non-product files.

### 4. Review M3 and L2-L4
- **L2 (fixed, narrowed):** `sandboxNamedPaths` (`scripts/lib/git-spawn-match.mjs`, shared by the sandbox door and the spy) now also reads `--work-tree <p>`, `--work-tree=<p>` and `--git-dir=<p>`; before only the separate `--git-dir` form was judged. Test: `a sandbox Git call is judged by every repository path it names, in separate and = forms` in `test/git/one-door.test.mjs`. Not changed, by evidence: `GIT_DIR`/`GIT_WORK_TREE` env are already stripped by the door (`REDIRECTING` in `scripts/lib/sandbox-git.mjs`); the spy accepting `CONSUMER_COMMAND` without a binary check is covered by the static scan, which reports `consumer-marker` on a fixed program (`scripts/git-one-door-scan.mjs`, one proof). The Rust-spawn half of L2 stays static-only by design.
- **L4 (not a defect):** `deliveredTo` defaulting to `expectedTip` makes only the ancestry test trivial. The port still refuses `worktree-delivery-unreachable` unless a non-`refs/fgos/` ref contains the tip (`packages/git/rust/src/worktree.rs`, after `worktree-delivery-unproven`), and the dirty, live-process and preserved-state refusals hold. A runner removal of an unpublished tip is therefore refused, not silently allowed. Nothing changed.
- **M3 and L3: owner decisions, below. Nothing implemented.**

### 5. Proof bookkeeping
Recorded in `docs/platform/git/spec.md` §19, block "Follow-up runs, 2026-10-21", and the two summary sentences that listed them as open were updated.
- V-EVENT: `cargo test -p fgos-event-store --test v_event` 4/4 on this tree.
- V-CONSUMER: `test/git/e2e-consumer-noncoding.test.mjs` 2/2 on this host under real bwrap (detached HEAD without `origin/HEAD`; not a repository).
- P-RELEASE: protocol 2 on both machines (second machine 06:03, owner machine 08:32), six rows pass under umask 022 per the 03:12 gate rerun. Not rerun here (cited). Still needed: stale-npm row, asset build.
- E4: this host selects `bwrap-pidns` (probe exit 0); `test/git/scoped-commit.test.mjs` 26/26 including the `setsid` escapee tests. "Owner decision" is out of the still-needed column: the `linux-pgroup` answer is the 2026-10-20 unit 22 decision (spec §15 E4) and the handoff rule is the 2026-10-19 decision (spec §6). Still needed: `macos-tree` and Windows drivers, and a `linux-pgroup` run on a host without user namespaces.

## Verification
- `cargo test -p fgos-git` (publication test file, lib), `cargo test -p fgos-event-store --test v_event`: green.
- `cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings`: clean.
- Focused node tests through the npm environment: `test/verbs/worktree-remove.test.mjs` 7/7, `test/git/one-door.test.mjs` 6/6, `test/git/e2e-consumer-noncoding.test.mjs` 2/2, `test/git/scoped-commit.test.mjs` 26/26.
- Full `npm test` (final run): rc 0, 8685 pass, 0 fail, 460 s class wall. The tracked census stayed byte-identical after the run (item 3). A first full run had 78 failures, all from this worktree's `.fgos/config.json`, which is a 1.3 KB skip-worktree stub without `runner.executors` (tracked file is 39.8 KB); the two executor-config files pass 60/60 with the tracked content, and the final run used it. The stub was put back afterwards; nothing of it is committed.

## Decisions for the owner

### M3. Land candidate retained when cleanup cannot take main within 5 s

**What is happening:** `acknowledgeLand` (`src/runner/merge.mjs`) calls Land recovery once. If the merge slot or `main-checkout` is busy for 5 s it returns a `land-cleanup-deferred` warning and the candidate worktree (possibly with `node_modules`) stays; nothing retries or sweeps later.

**Cause:** read `src/runner/merge.mjs` and `packages/git/rust/src/land.rs` (`recover_land`). Release needs the consumer acknowledgement (`work-decision:<id>:<seq>`), which only Work's durable log can confirm, so Git's `git-land-recovery` doctor row cannot release a candidate by itself. A sweep therefore needs a Work reader, which is the paused lane.

**Options:**
1. Bounded retry inside `acknowledgeLand` (2-3 tries with the same 5 s wait). Gain: covers short contention. Harm: delays the merge verb by up to ~15 s under load, still leaks when contention is long. Cost: about 15 lines in `src/runner/merge.mjs` plus a test; touches the runner merge path, which Work consumes.
2. A sweep (doctor `--fix` or `fgos land sweep`) that releases candidates whose acknowledgement exists in Work's log. Gain: closes the leak. Harm: new mechanism and a dependency on Work's reader. Cost: about 120-200 lines across Git recovery and a Work reader; blocked until the Work lane resumes.
3. Leave as is and make doctor report retained candidates with the manual release command. Gain: visible, no new mechanism. Harm: manual cleanup. Cost: about 30 lines in `src/setup/git-checks.mjs`.

**Recommendation:** option 3 now, option 2 when the Work lane resumes (it is the only option that fixes the leak without a guess about acknowledgement).

**Scope of the answer:** a yes to option 3 authorizes a doctor reporting change only. It does not authorize a Work reader, a retry loop, or touching Work-lane code.

### L3. Old Node payload with a new host omits `quiesce-scan --dir`

**What is happening:** the host `quiesce-scan` takes linked worktrees from the caller's repeated `--dir`; an older Node payload (`src/holder-lock/fences.mjs`) sends none, so a new host scans only the root and could miss a process working in a linked worktree during an upgrade quiescence check.

**Cause:** read `scanWorkspace` in `src/holder-lock/fences.mjs` and `apps/fgos/tests/internal_lock_routes.rs`. `quiesce-scan` deliberately stays on protocol 1, so a protocol bump would refuse the old payload that most needs to be upgraded. A mixed pair only arises on the compatibility channels (global npm `bin.fgos` with a newer `FGOS_HOST_BIN`); a normal release stages host and payload together.

**Options:**
1. Document the caveat (one sentence in `docs/specs/distribution.md` or the holder-lock spec). Cost: 1 line, no code. Gain: operators know. Harm: still silent.
2. Host refuses `quiesce-scan` with no `--dir` unless a flag says "workspace only" (the test shims already pass `--workspace-only`). Gain: fails closed. Harm: an old payload cannot run its quiescence check until upgraded by another route. Cost: about 10 lines in `apps/fgos` plus a test.
3. Bump `quiesce-scan` to protocol 2. Harm: same as 2 with a larger surface (holder-lock protocol is an owner decision).

**Recommendation:** option 1 now; option 2 only if a mixed pair is seen in practice.

**Scope of the answer:** a yes to option 1 authorizes a doc sentence only; it does not change the host route or any protocol.

## Left over
- M3 and L3: the decisions above.
- Not rerun: `p-release-checks.sh` (cited from the 03:12 gate rerun and the two landing reports; needs a release build).
- Prior-art items from the u24 report outside this scope: `tools/platform-probe` judging, installer declaration, tagging pre-attempt refusals (`land-effect-unknown`).
- The first two fixes share one commit (items 1 and 2).

Status: DONE_WITH_CONCERNS
Summary: Items 1, 2, 3, L2 and proof bookkeeping are fixed with owning tests and recorded in spec §19; L4 is not a defect; M3 and L3 are written as owner decisions.
Concerns/Blockers: the worktree's `.fgos/config.json` is a skip-worktree stub that makes about 78 executor-config tests fail unless the tracked file is restored for the run; unrelated to these commits.
