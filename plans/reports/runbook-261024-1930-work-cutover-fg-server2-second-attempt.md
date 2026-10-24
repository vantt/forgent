# Runbook: Work → Event Store cutover on fg-server2, second attempt

Prepared 2026-10-24 19:30 (Asia/Saigon) by the WORK lane controller. It replaces `runbook-261024-1500-work-cutover-fg-server2.md` after the first attempt (18:05–18:35) was refused at the grant commit and rolled back (board log 18:35 and 18:45). Steps and checks are the same as the first runbook except where marked **(changed)**.

## What changed since the first attempt

- **Grant commit record bound.** The ScopedCommit intent stored the path list three times plus the dirty-worktree baseline (~290 KB on this checkout) and was refused (`git-wal-corrupt: record byte bound`, 64 KiB). Fixed in `98bb577ad` (digest form for paths, baseline and request; size checked before the operation directory exists, typed `wal-record-too-large`) and `8eebda3f1`. OPC: MERGE.
- **Empty operation directory.** The refusal left `event-store-cutover-9f371889…-1` with no record. `659e368e5` keeps such a directory out of the WAL scan, and `cutover_operation_id` treats it as a free attempt. Without it the new code read the real WAL as `git-wal-corrupt`. OPC: MERGE.
- **Unordered fetch-mapping records.** Two 10-19 records without a config sequence made every Event Store diagnostic fail (`fetch-provenance-order-unknown`). `2e6814faf` reads that as no provenance; the setup fix inside migrate records an ordered one. The `--check` of the first attempt already recorded it on this checkout.
- **Quiesce gate.** `556453735` (merge `217a67c18`, HARDEN: APPROVE): a process whose cwd is in the checkout counts only when its argv could be fgOS. Idle shells and Claude Code sessions no longer block migrate, so **nobody has to exit their session**. Any `node` process with cwd in the checkout still counts (for example an agent CLI started as `node …/codex`).
- **Route wiring proof** of the quiesce scan moved to the new rule (`0df15a1ad`; TEST found it red on the full gate): the child is a `bash` named `fgos` with cwd in the workspace.
- **Key-order proof** made explicit (`d0734ca23`, TEST accepted).
- **Rehearsal of the real write path** on a full-size clone with a local bare mirror as origin (`/home/vantt/projects/forgent-worktrees/rehearse-es`): parity equal (0 differences, 33,718 events, revision `af617cb5…`), real migrate committed (99 files), release staged and upgraded, `fgctl verify` ok, every `event-store-*` and `git-*` doctor row green, `events sync` pushed both refs, `rebuild` revision equal, write smoke (`add`, `move`) sealed within about 1 s. A copied WAL cannot be rehearsed (the WAL is bound to its common dir's dev:inode), so the real WAL was checked with the new code's read-only doctor: every `event-store-*` row passes except the expected `event-store-migration-required`.
- The rehearsal's `fgos setup` already added the `eventStore.*` defaults to the global `~/.fgos/config.json`; the old release ignores them (checked). Step 10's `globalConfigAddedKeys` may therefore be empty.
- Release candidate rebuilt from the final tip: `sha256:882b8df676cda24e7d0a2837a7c97aea485faffe8500c5737e10cb4e21863fb6`, 858 files, in `$STAGED`.
- On this checkout a local `refs/fgos/legacy` (`dc82cbae0`, from the first attempt) exists; migrate replaces it by CAS (`import.action` `replace-unfenced-stale`, rehearsed).

## Variables (paste once into the shell you run everything from)

```bash
export M=/home/vantt/projects/forgent                                   # main checkout
export W=/home/vantt/projects/forgent/.claude/worktrees/work-es         # branch worktree (dev host for migrate)
export DEVT=/home/vantt/projects/forgent-worktrees/work-es-target       # its Cargo target (already warm)
export LW=/home/vantt/projects/forgent-worktrees/land-261024-es         # clean release worktree at TIP
export RELT=/home/vantt/projects/.cargo-out-land-261024-es              # release Cargo target
export STAGED=/home/vantt/projects/.fgos-staged-261024-es               # built release tree
export B=$M/.fgos/runtime/tmp/landing-es-cutover-261024b                 # backups
export PREV=sha256:d6d3d08224e56894becb095d69a572a3255e5272bd94b37eb6988d39f93344c0   # active release now
export NEW=sha256:882b8df676cda24e7d0a2837a7c97aea485faffe8500c5737e10cb4e21863fb6    # candidate in $STAGED
export TIP=0df15a1adec6b36fed347abf2f700d5c9d6704f1
cd /tmp
```

Check: `git -C "$LW" rev-parse HEAD` prints `$TIP` (the code the release was built from); `$W` may be ahead of it only by `plans/` commits such as this runbook (`git -C "$W" diff --stat "$TIP" HEAD -- . ':!plans'` prints nothing), and either commit may be merged in step 4; `jq -r .artifactDigest $STAGED/manifest.json` prints `$NEW`; `jq -r .artifactDigest $M/.fgos/installation/activation.json` prints `$PREV`.

## Step 1. Stop check (at the hour the owner sets)

1. **(changed)** Writers on this machine, read only (never kill another session's process). Run the scan through the new code, because the active release still has the old rule:
   ```bash
   cd "$M" && CARGO_TARGET_DIR="$DEVT" npm --prefix "$W" run --silent fgos:dev -- internal quiesce-scan --protocol 1 --root "$M" </dev/null | jq -r '.result, (.processes[]? | "\(.pid) \(.matched) \(.cmdline[0:80])")'; cd /tmp
   pgrep -af 'fgos|fgctl|fgos-gateway' | grep -v quiesce-scan
   ```
   Expect only this session's own chain (its `claude`, its pane `zsh` and the Bash tool shell running the scan; `migrate` excludes its ancestors). Idle shells and other Claude Code sessions are no longer listed, so the other lanes stay open; they only stop issuing Work writes (board STOP line).
   - A listed `fgos …`, `node …/fgos.mjs …`, runner or gateway process is a writer: ask its owner to finish or stop it.
   - A listed `node …` process that is not fgOS (an agent CLI launched through node, a dev server) still counts by design: ask its owner to `cd` it out of `$M` or stop it.
   - An old background shell of your own (a `sleep` loop) is a sibling of `migrate`, not an ancestor: stop it yourself.
   **Stop condition:** anything else listed after the owners were asked. Do not continue.
2. `fgos internal git-grant-check --protocol 1 --operation probe` → a typed refusal (the route exists on the active host). Anything else: stop.
3. Tracked event changes of this machine: `git -C "$M" status --porcelain --untracked-files=all -- .fgos/events .fgos/events.jsonl docs/distillery/state/porting .gitattributes`.
   - Empty: continue.
   - Modified or new shards: commit and push them with the current release (they merge by `merge=union`): `cd "$M" && git add -- <the exact paths listed> && git diff --cached --stat && git commit -m "chore(events): push this machine's events before the cutover" && git push origin main && cd /tmp`.
4. Other machines: `git -C "$M" fetch origin && git -C "$M" log --oneline -5 origin/main`. Every machine had to push before the STOP line. **If `origin/main` is no longer an ancestor of `$TIP`** (`git -C "$M" merge-base --is-ancestor origin/main "$TIP" || echo MOVED`), look at what moved: `git -C "$M" diff --stat "$TIP"...origin/main`.
   - Only `plans/` or `docs/backlog.md` (board lines, reports; neither is in the release payload or the census) — **expected this time**, because board lines land all evening: the release payload does not contain `plans/`, so the release built from `$TIP` still matches. In step 4 use `git merge --no-ff -m "merge: work/es-cutover (Work Event Store cutover code)" "$TIP"` instead of `--ff-only` (after `git merge --ff-only origin/main` to bring the checkout to main); everything else is unchanged, and `fromCommit` of step 5 is that merge commit.
   - Tracked event files: they were pushed by a machine after the stop; pull them (`git merge --ff-only origin/main`) and redo step 3 (baseline) before step 4 with the same `--no-ff` merge. The migrate reads HEAD, so they are imported.
   - Anything else (code, `docs/`, `packages/`, `src/`): stop and tell me; I merge it into the branch, regenerate baseline and census, rebuild the release (about 10 min), and you resume at step 1.

## Step 2. Backups

```bash
mkdir -p "$B" && chmod 700 "$B"
cp "$M/.fgos/distribution.json" "$B/distribution.json"
cp "$M/.fgos/installation/activation.json" "$B/activation.json"
cp "$M/.fgos/config.json" "$B/project-config.json"
install -m 600 ~/.fgos/config.json "$B/global-config.json"
git -C "$M" config --get-all remote.origin.fetch > "$B/refspecs.txt"
git -C "$M" rev-parse HEAD > "$B/premain.txt"            # rollback point; equals origin/main
git -C "$M" diff -- AGENTS.md > "$B/agents-md.patch"
git -C "$M" diff -- .claude/settings.json > "$B/settings-json.patch"
(cd "$M" && sha256sum .fgos/config.json AGENTS.md CLAUDE.md .claude/settings.json ~/.fgos/config.json) > "$B/hashes.txt"
cp ~/.local/bin/fgctl "$B/fgctl.prev"
grep -c AGENTKIT-OMP:START "$M/AGENTS.md"              # expect 1
```

Check: `ls "$B"` lists 11 files; the two patches are not empty.

## Step 3. Baseline with the current release (phase 11 step 3)

```bash
cd "$M" && fgos rebuild --json </dev/null | jq .data && cd /tmp
mkdir -p "$M/.fgos/runtime/tmp/es-cutover"
node -e 'const fs=require("fs");const s=JSON.parse(fs.readFileSync(process.argv[1]+"/.fgos/cache/state.json","utf8"));delete s.snapshot;fs.writeFileSync(process.argv[1]+"/.fgos/runtime/tmp/es-cutover/baseline.json",JSON.stringify(s));console.log(s.revision)' "$M" | tee "$B/baseline-revision.txt"
```

Expect `workCount`/`decisionCount` (1195 / 5545 at 14:00) and one revision line. Record it: it is the value every clone must reproduce.

## Step 4. Code to main, locally (first of the two commits)

The branch does not touch `AGENTS.md`, `.claude/settings.json` or `CLAUDE.md`, so the merge leaves the local edits alone; the patches of step 2 are the safety net.

```bash
cd "$M"
# (changed) main is expected to be ahead of $TIP by board lines only (step 1.4), so merge, do not fast-forward:
git fetch origin && git merge --ff-only origin/main           # bring the checkout to origin/main
git merge --no-ff -m "merge: work/es-cutover (Work Event Store cutover code)" "$TIP"
git rev-parse HEAD > "$B/fromcommit.txt"; git log --oneline -2  # HEAD = the merge, second parent $TIP
git merge-base --is-ancestor "$TIP" HEAD && echo TIP-IN        # expect TIP-IN
grep -c AGENTKIT-OMP:START AGENTS.md                          # expect 1
sha256sum -c "$B/hashes.txt"                                  # expect all OK
cd /tmp
```

If `git merge --ff-only` refuses because a local edit would be overwritten (it should not): `git -C "$M" checkout -- AGENTS.md .claude/settings.json`, merge, then `git -C "$M" apply --3way "$B/agents-md.patch" "$B/settings-json.patch"`, `git -C "$M" restore --staged AGENTS.md .claude/settings.json`, and re-check the count and hashes. Never stash in `$M`.
**Stop condition:** the merge conflicts or `TIP-IN` is missing. Roll back with A1 (`git merge --abort` first if a merge is in progress).

## Step 5. Parity check in the main checkout

```bash
cd "$M" && CARGO_TARGET_DIR="$DEVT" npm --prefix "$W" run --silent fgos:dev -- events migrate --check --baseline .fgos/runtime/tmp/es-cutover/baseline.json --json </dev/null > "$B/migrate-check.json"; echo exit=$?; cd /tmp
jq '.data.parity | {equal, n: (.differences|length), cacheCompared, workEvents, portingEntities, revision}, .data.plan | {fromCommit, deletions: (.deletions|length), writes, action: .import.action}' "$B/migrate-check.json"
```

Expect exit 0, `equal: true`, `n: 0`, `revision` = `$B/baseline-revision.txt`, `fromCommit` = `$(cat $B/fromcommit.txt)` **(changed)**, 97 deletions, writes `docs/distillery/state/porting/events.jsonl`, `docs/distillery/state/porting/state.json`, `.gitattributes`, action `replace-unfenced-stale` **(changed: the local legacy ref of the first attempt is replaced)**; `create` or `reuse` are also fine.
**Stop condition:** exit ≠ 0, `event-store-writers-active` (back to step 1), or any difference. Nothing is committed yet. Roll back with A1.

## Step 6. Grant commit (second of the two commits)

```bash
cd "$M" && CARGO_TARGET_DIR="$DEVT" npm --prefix "$W" run --silent fgos:dev -- events migrate --baseline .fgos/runtime/tmp/es-cutover/baseline.json --json </dev/null > "$B/migrate.json"; echo exit=$?
jq '.data | {status: .commit.status, oid: .commit.oid, operationId, pin}' "$B/migrate.json"
git log --oneline -3                                           # HEAD = chore(events): move event truth to refs/fgos (D-ADR0055), parent = the step 4 merge
git show --stat --format=%s HEAD | tail -3                     # 97 deleted, .fgos/events added, .gitattributes changed
git ls-files .fgos | grep -E '^\.fgos/(events(/|\.jsonl)|state\.json)'   # expect only ".fgos/events" (the fence file)
git for-each-ref refs/fgos/legacy                             # one ref, OID = pin.legacyRefOid
git status --short | grep -v '^??'                             # expect only " M AGENTS.md" and " M .claude/settings.json"
cd /tmp
```

Expect exit 0, `status: committed`, a new `oid`, `pin` with `legacyRefOid`, `sealDigest`, `fromCommit` = `$(cat $B/fromcommit.txt)`. The `git ls-files` line shows the fence `.fgos/events` itself, which is a file now; no `events.jsonl`, no `events/…`, no `state.json`.
**Stop condition:** any refusal. If the error names a Git operation id (recovery class), do not retry and do not roll back by hand: send me the JSON. If HEAD is still `$TIP` and the files are restored (pre-attempt refusal), roll back with A1.

## Step 7. Push both commits (one push)

```bash
cd "$M" && git push origin main; echo exit=$?; git rev-parse HEAD origin/main; cd /tmp
```

Expect `<premain>..<grant oid>  main -> main` and both SHAs equal. If the push is rejected (main moved): `git -C "$M" fetch origin`; nothing is published; roll back with A1, then step 1 again.
From here on rollback is B.

## Step 8. (nothing between push and activation)

Do not run plain `fgos` now: the active release is still `$PREV`, which cannot read the fence.

## Step 9. Stage and activate the release built from `$TIP`

`$TIP` holds the whole Node and Rust payload; the grant commit changes only data files, so the release built from `$TIP` matches the checkout's payload.

```bash
cat > /tmp/es-activate.sh <<'EOF'
#!/bin/sh
set -e
export CARGO_TARGET_DIR=$RELT
cd /tmp
cargo install --locked --path $LW/apps/fgctl --root ~/.local --force 2>&1 | tail -3
fgctl stage --from $STAGED
cd $M
date +%T; fgctl upgrade --from $STAGED </dev/null; echo upgrade-exit $?; date +%T
cp $B/distribution.json .fgos/distribution.json
sha256sum -c $B/hashes.txt || true
fgctl verify; echo verify-exit $?
EOF
sh /tmp/es-activate.sh 2>&1 | tee "$B/activate.log"
jq -r .artifactDigest "$M/.fgos/installation/activation.json"   # expect $NEW
grep -c AGENTKIT-OMP:START "$M/AGENTS.md"                        # expect 1
```

Expect `upgrade-exit 0`, `verify-exit 0`, the new digest active. `sha256sum -c` may report `AGENTS.md` changed: the setup inside `fgctl upgrade` rewrites the uncommitted omp block (seen at the 09:37 landing); accept it when the count is 1 and `git -C "$M" diff -- AGENTS.md` still contains only the AgentKit block. Any other hash change: restore that file from `$B` or its patch.
**Stop condition:** upgrade or verify fails → B1 (reactivate `$PREV`), then tell me.

## Step 10. Setup, doctor, sync, checks

```bash
cd "$M"
fgos setup --json </dev/null > "$B/setup.json"; echo setup-exit=$?
jq '.data | {configAddedKeys, globalConfigAddedKeys}' "$B/setup.json"        # expect eventStore keys at most; nothing else
git config --get-all remote.origin.fetch                                     # adds +refs/fgos/events/*… and +refs/fgos/legacy*… ; nothing removed vs $B/refspecs.txt
fgos doctor --json </dev/null > "$B/doctor.json"; echo doctor-exit=$?
jq -r '.data.checks[] | select(.status!="pass") | "\(.id) \(.status) \(.message[0:100])"' "$B/doctor.json"
fgos events sync --json </dev/null | jq '.data | {pushed, fetched, status: {sync: .status.sync.error, unpublishedSince: .status.sync.unpublishedSince}}'
fgos events status --json </dev/null | jq '.data | {machineId, refspecMissing, aheadBehind, integrityErrors, missing, streams: [.streams[] | {stream, unsealedCount}]}'
git ls-remote origin 'refs/fgos/*'                                           # refs/fgos/legacy (= pin) and this machine's refs/fgos/events/<machine>
git ls-files .fgos | grep -E '^\.fgos/(events/|events\.jsonl|state\.json)'   # expect no output
git ls-files .fgos | grep -xF .fgos/events                                    # expect the fence
fgos rebuild --json </dev/null | jq '.data'                                   # Work view revision must equal $B/baseline-revision.txt
cd /tmp
```

Expect:
- doctor: every `event-store-*` row passes (`event-store-legacy-layout`, `-refspec`, `-machine-id`, `-integrity`, `-sync`, `-native-addon`, …), no `event-store-migration-required`; `git-*` as before (only `git-mutation-one-door` with its 5 known sites); `active-release-matches-checkout` passes (changed 0); the known unrelated reds of the 09:37 landing (`executor-skills-installed`, `tool-registry-configured`, `executor-profile-warnings`, `confined-pane-accounts`, `agent-cli-project-trusted`, `work-step-vocabulary`, `run-attempts-stuck`, `doc-current-path-missing`, `doc-source-conservation`).
- `events status`: `refspecMissing: false`, `integrityErrors` and `missing` empty, `unsealedCount` 0, `aheadBehind.ahead` 0 after the sync.
- `fgos rebuild`: the Work consumer's `revision` equals the baseline revision.
**Stop condition:** an `event-store-*` row fails, the revision differs, or `refs/fgos/legacy` is not on origin. Do not resume writers; send me the JSON (B applies only after a person decides).

## Step 11. Smoke (read-only)

```bash
cd "$M"
fgos list --json </dev/null | jq '.data | length'          # same count as the baseline workCount scope
fgos show tsk-5db --json </dev/null | jq '.data.id, .data.status'
fgos ready --json </dev/null | jq '.data | length'
fgos dispatch decide --for judge --json </dev/null | jq '.data.mechanism'
cd /tmp
```

A write smoke would put a permanent item into the shared history, so it is left out. The first real `fgos move` after resume is the write proof; watch `fgos events status` afterwards (`unsealedCount` back to 0 within seconds, the detached seal child).

## Step 12. Resume and record

- Tell the other lanes writers may resume on this machine only after step 10 passed.
- Board: ES and WORK rows landed (release digest, `$TIP`, grant commit oid, fence `legacyRefOid`, 97 deletions); GIT row "adapter gone"; `.gitattributes` row "union line gone at Work cutover; strip rule unchanged"; one line on top of the board `log.md`.
- Hand the other machines `plans/reports/guide-261024-1500-work-cutover-other-machines.md` with the baseline revision, the grant commit oid and the release digest.
- Leave `$B` until the release is accepted. Remove `$STAGED` and `$RELT` after acceptance; `$LW` through `fgos worktree remove` (it may refuse for ignored bytes, as on 10-23).

## Rollback

### A. Before the push of step 7 (nothing published)

A1. Back to the pre-cutover main, keeping the local `AGENTS.md`/`settings.json` edits:

```bash
cd "$M"
git reset --keep "$(cat "$B/premain.txt")"      # undoes the grant commit and the fast-forward; tracked event files come back
git ls-files .fgos | grep -c '^\.fgos/events/'   # back to the shard count (90+)
grep -c AGENTKIT-OMP:START AGENTS.md; sha256sum -c "$B/hashes.txt"
cd /tmp
```

The release was not activated yet, so `$PREV` is still active. A local `refs/fgos/legacy` may exist; it is unpublished and unread, and the next `migrate` replaces it by CAS (spec §18), so do not delete it by hand. Writers may resume on the old release.

### B. After the push of step 7

B1. Activation failed (step 9) but main is pushed: reactivate the old release and keep writers stopped. **(changed, OPC)** First check with the new release that no ScopedCommit operation is unresolved (`fgos doctor` row `git-operation-journal`); an open digest-form record wedges the old release.

```bash
cd /tmp && fgctl upgrade --from ~/.local/state/fgos/releases/$PREV </dev/null
cp "$B/distribution.json" "$M/.fgos/distribution.json"; cp "$B/project-config.json" "$M/.fgos/config.json"; install -m 600 "$B/global-config.json" ~/.fgos/config.json
cp "$B/fgctl.prev" ~/.local/bin/fgctl && fgctl verify
```

The old release cannot work on the fenced checkout, so this is only a holding state: fix the activation and redo step 9, or go to B2.

B2. Full rollback (spec §18), only after a person decided from the parity report:

```bash
cd "$M" && fgos events export --format legacy-layout --out "$B/legacy-export" --json </dev/null > "$B/export.json"; jq '.data.parity' "$B/export.json"; cd /tmp
```

Then, with writers stopped: remove the tracked fence `.fgos/events`, copy `$B/legacy-export/events.jsonl` and `events/` into `.fgos/`, map `porting/<original path>` back to its path (`docs/distillery/state/porting/events.jsonl`), restore the `merge=union` line in `.gitattributes`, commit and push; then reactivate `$PREV` as in B1. Git refuses the `fgctl` downgrade while Git WAL records are pending (`fgos doctor` `git-operation-journal`).

## Known risks

- **(changed)** A non-fgOS `node` process with cwd in `$M` blocks `migrate` (step 1). Idle shells and Claude Code sessions do not.
- The grant commit runs the checkout's new `.githooks/pre-commit` (proved with the real hook by `test/event-store/migrate-cutover-grant.test.mjs`); the hook's convention check talks to the old active host and only warns.
- `fromCommit` is the step 4 merge commit, so the operation id (`event-store-cutover-<first 32 hex of fromCommit>-1`) and `legacyRefOid` differ from the first attempt and from the rehearsal; only parity, the deletion count and the revision are comparable.
- The empty operation directory `event-store-cutover-9f371889…-1` from the first attempt stays; the new code skips it (no manual deletion).
- **(changed, OPC)** Releases before `98bb577ad` read a digest-form ScopedCommit record as `git-wal-corrupt`. Never downgrade the release past an open digest-form operation: before rollback B1/B2 reactivates `$PREV`, run `fgos doctor` with the new release and check that `git-operation-journal` shows no unresolved operation (the cutover operation settled and compacted).
