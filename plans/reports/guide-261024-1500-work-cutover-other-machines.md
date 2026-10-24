# Guide: take the Work → Event Store cutover on the other machines

Written 2026-10-24 14:30 (Asia/Saigon) by the WORK lane for every machine other than `fg-server2` (machine A). Machine A runs `plans/reports/runbook-261024-1500-work-cutover-fg-server2.md` from 15:00. Do nothing here until the board says machine A finished its step 10 and gives three values:

- `MAIN` = the grant commit on main (`chore(events): move event truth to refs/fgos (D-ADR0055)`), parent = the code commit `TIP`;
- `REV` = the baseline Work view revision of machine A (`fgos rebuild` before the cutover, equal after it);
- the release digest machine A activated (for reference only: a machine that builds its own release gets its own digest, board D7).

Work writes stay stopped on this machine from 14:50 until its last step passes.

## What changes

- Work's event history leaves the tracked files `.fgos/events.jsonl`, `.fgos/events/*.jsonl` (and `.fgos/state.json`, the two backups, `docs/distillery/state/porting/events.jsonl` and `state.json` in forgent). Main now holds a regular file `.fgos/events` (the fence) and the history lives in `refs/fgos/legacy` and `refs/fgos/events/*`, fetched by `fgos events sync`.
- An old release cannot read a fenced checkout (`ENOTDIR` on `.fgos/events`). So on every workspace: **fetch, build, pull, activate, in that order, and run no plain `fgos` between the pull and the activation.**
- New verbs `fgos events sync|status|export|migrate`; `fgos rebuild` prints a per-consumer summary with the view `revision`. Full list: `CHANGELOG.md` `[Unreleased]`.

## Steps for one workspace that is already migrated on main (forgent / forgentX on every machine)

Run from a shell whose cwd is outside the workspace unless a step says `cd`.

1. **Stop check.** `fgos internal quiesce-scan --protocol 1 --root <workspace>` → `clean`. Other sessions' processes are listed with pid and cwd; ask their owners to exit, never kill them. `git -C <workspace> status --porcelain --untracked-files=all -- .fgos/events .fgos/events.jsonl` must be empty (anything there was not pushed by 14:50: stop and tell WORK; an unpushed shard is recovered by a person).
2. **Fetch only.** `git -C <workspace> fetch origin`; `git -C <workspace> log --oneline -3 origin/main` shows `MAIN` (or newer).
3. **Build the release from `origin/main` in a clean worktree** (as in the landing reports; Cargo target on ext4, never `/tmp`):
   ```bash
   fgos worktree create <scratch-worktree> --detach --base origin/main
   cd <scratch-worktree>
   export CARGO_TARGET_DIR=<ext4 dir of its own>
   cargo build --locked --release --workspace
   node scripts/build-rust-distribution.mjs --out <staged dir>
   cd /tmp
   ```
4. **Backups** into `<workspace>/.fgos/runtime/tmp/landing-es-cutover-261024/`: `.fgos/distribution.json`, `.fgos/installation/activation.json`, `.fgos/config.json`, `~/.fgos/config.json` (mode 600), `git config --get-all remote.origin.fetch`, `sha256sum` of `.fgos/config.json AGENTS.md CLAUDE.md .claude/settings.json ~/.fgos/config.json`, `git rev-parse HEAD`, `~/.local/bin/fgctl`. If the workspace has local edits of tracked files, also `git diff -- <file> > <backup>/<file>.patch` for each.
5. **Pull with local-edit care.** `git -C <workspace> status --short | grep -v '^??'`.
   - No local edits: `git -C <workspace> merge --ff-only origin/main`.
   - Local edits in files main does not change (check `git diff --name-only HEAD origin/main -- <file>` is empty): `merge --ff-only` keeps them.
   - Local edits in a file main changes: save the patch (step 4), `git checkout -- <file>`, `merge --ff-only`, `git apply --3way <patch>`, `git restore --staged <file>`. Never `git stash` in a main checkout.
   Check: `git -C <workspace> rev-parse HEAD` = `origin/main`; `git -C <workspace> ls-files .fgos | grep -E '^\.fgos/(events/|events\.jsonl|state\.json)'` prints nothing; `git -C <workspace> ls-files .fgos/events` prints the fence.
6. **Activate at once** (board D7 guide: restore `distribution.json` after the upgrade):
   ```bash
   cd /tmp
   cargo install --locked --path <scratch-worktree>/apps/fgctl --root ~/.local --force   # same CARGO_TARGET_DIR as step 3
   fgctl stage --from <staged dir>
   cd <workspace> && fgctl upgrade --from <staged dir> </dev/null; echo upgrade-exit $?
   cp <backup>/distribution.json .fgos/distribution.json
   sha256sum -c <backup>/hashes.txt; fgctl verify; echo verify-exit $?
   cd /tmp
   ```
   Expect both exits 0. A changed `AGENTS.md` is acceptable only when the uncommitted AgentKit block is still there exactly once (`grep -c AGENTKIT-OMP:START AGENTS.md` = 1) and the committed part equals HEAD.
7. **Setup and history.** In `<workspace>`:
   - `fgos setup --json </dev/null`: exit 0; it adds the fetch refspecs `+refs/fgos/events/*:refs/fgos/remotes/origin/events/*` and `+refs/fgos/legacy*:refs/fgos/remotes/origin/legacy*` and the `eventStore` config defaults; nothing else.
   - `fgos events sync --json </dev/null`: fetches `refs/fgos/legacy` and machine A's events.
   - `fgos rebuild --json </dev/null`: the Work consumer's `revision` must equal `REV` and its `counts.work` the same count as on machine A. A different revision: stop, do not resume writers, send the JSON to WORK.
8. **Doctor green.** `fgos doctor --json </dev/null`: every `event-store-*` row passes (no `event-store-migration-required`, `event-store-legacy-layout` passes), `active-release-matches-checkout` passes, the `git-*` rows as at the previous landing. `fgos events status --json`: `refspecMissing` false, `integrityErrors` and `missing` empty.
9. **Resume** writers on this workspace and write one board line: machine, workspace, release digest, `revision` = `REV`, doctor result.

## Workspaces that still carry their own tracked event files (mdview, mcp-skill-hub on the owner machine)

These are separate repositories; their own main has no fence yet. Each one needs its own `fgos events migrate`, which writes a grant commit in that repository. **Only after the owner says "go" for that repository.**

1. Steps 1-4 and 6 above for the workspace (pull its own main normally first: it has no fence yet, so the old release can still read it; activate the same release built in step 3 of forgentX).
2. Baseline with the **old** release before activating (step order): `fgos rebuild --json`, then write `.fgos/runtime/tmp/es-cutover/baseline.json` = `.fgos/cache/state.json` without `snapshot` (the node one-liner of the runbook step 3).
3. After activation: `fgos events migrate --check --baseline .fgos/runtime/tmp/es-cutover/baseline.json --json` → `parity.equal: true`, 0 differences. Any difference: stop, nothing is committed.
4. `fgos events migrate --baseline .fgos/runtime/tmp/es-cutover/baseline.json --json` → `commit.status: committed`; `git push origin main`; `fgos events sync`; then steps 7-9.

## Máy owner (`design-lap`): forgentX, mdview, mcp-skill-hub

- **forgentX:** làm theo các bước 1-9 ở trên, sau khi board ghi máy A xong bước 10. Cần owner nói "go" trước khi activate (như mọi landing trên máy owner). So `revision` sau `fgos rebuild` với `REV` của máy A; khác thì dừng, không cho writer chạy lại.
- **mdview** và **mcp-skill-hub:** chỉ `fgos events migrate` sau khi owner nói "go" cho từng repo, theo phần "Workspaces that still carry their own tracked event files". Làm lần lượt từng repo; mỗi repo một grant commit riêng trên main của nó, push xong mới làm repo tiếp theo. Chưa có "go" thì vẫn activate release mới được (Work trên repo đó bị từ chối ghi với `event-store-migration-required` cho tới khi migrate), hoặc giữ release cũ trên workspace đó — owner chọn.
- Ghi lên board một dòng cho mỗi workspace: release digest, `revision`, kết quả doctor.

## Machine `fg-server` (one workspace `~/projects/forgent`)

Steps 1-9 for forgent; nothing else. It needs only its own machine's permissions.

## Rollback

- Before step 5 on a workspace: nothing changed; resume writers on the old release.
- After step 5 but before step 6 finished: activate the old release again only after main is unfenced (machine A's rollback B2). Until then keep writers stopped and tell WORK.
- After activation: spec §18 (`fgos events export --format legacy-layout`, a person decides). Machine A's runbook section B is the procedure.
