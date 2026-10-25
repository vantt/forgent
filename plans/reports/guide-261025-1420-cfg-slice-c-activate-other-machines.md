# Activate Slice C on fg-server2 and design-lap

Date 2026-10-25 (Asia/Saigon). These are the steps fg-server ran on 2026-10-25, 14:20–14:30 ([board](../261017-1313-fgos-platform-program-board/log.md), line "fg-server ĐÃ CHẠY SLICE C"), plus the two lessons it taught. Run it once per machine, one machine at a time, by the session that works on that machine:
- fg-server2: OPC;
- design-lap: SEAT or DOC.

These decisions were taken by the owner on 2026-10-25 (board line "Owner quyết các câu để đóng lane CFG"):
- D9: the session on the machine runs the steps.
- Q2: stage 2 runs right after activation.
- Q3: stale global values are removed by script, after the owner has read the path list.

Print paths, counts, digests and modes only. Never print a config value.

Slice C is on main at `b6fac0706`. Until step 4, **do not `git pull` in the shared main checkout**: the running release would read the tombstoned `.fgos/config.json` and fail.

## 0. Before you start

- Stage 1 (the copy to `~/.fgos/private/`) must already be done. The board says both machines did it on 2026-10-25. Check: `ls -la ~/.fgos/private/` shows `accounts.yaml` and `gateway-token`, both mode 600.
- Tell every agent session on the machine that the window starts. During the window: no `git pull` in the main checkout, no `fgos run`/workflow, no `fgos setup`.
- Check that the pull is safe for files other sessions have left modified. Both commands must print nothing:
  - `git diff --name-only HEAD origin/main | grep -Fx -f <(git status --short | awk '{print $2}')`
  - the same check for untracked paths the pull would add.

## 1. Back up

```sh
B=~/.fgos/private/upgrade-c-$(date +%y%m%d); mkdir -p -m 700 $B
cp -p <project>/.fgos/installation/activation.json <project>/.fgos/distribution.json $B/
cp -p ~/.fgos/config.json $B/global-config.json
cp -p ~/.local/bin/fgctl $B/fgctl.prev
chmod 600 $B/*
```

## 2. Build the release from origin/main

Build in a clean detached worktree with its own cargo output directory. Never build in the shared checkout.

```sh
git fetch origin && git worktree add --detach <wt> origin/main
export CARGO_TARGET_DIR=<wt>/rel-build
cargo build --locked --release --workspace -j 4
node scripts/build-rust-distribution.mjs --repo-root <wt> --out <tree>   # prints artifactDigest; <tree>/libexec/native/fgos.node must exist
cargo install --locked --path <wt>/apps/fgctl --root ~/.local
```

## 3. List the global values that would win after the cutover (machine overrides)

Lesson 1. This repository's old `config.json` held values equal to the standard. Those values hid the machine's own global values. The cutover drops them, so any different value in `~/.fgos/config.json` now wins. On fg-server that was:
- 22 old catalog values;
- 6 `command` values: `confinement.mode` of four capabilities and the `openai` executor's `invocations`.

The 6 broke `fgos dispatch decide` right after activation.

**Run the check in a plain directory, never in a linked worktree.** In a linked worktree, `command` values come from the main checkout, so the check misses them. This is a CFG bug that CFG is fixing.

```sh
S=$(mktemp -d); mkdir -p $S/.fgos; git -C <wt> show b6fac0706^1:.fgos/config.json > $S/.fgos/config.json; git -C $S init -q
env -C $S $CARGO_TARGET_DIR/release/fgos config migrate --dry-run --json \
  | python3 -c "import json,sys; r=json.load(sys.stdin)['data']; print(len(r['machineOverrides'])); print('\n'.join(r['machineOverrides']))"
```

- **0 paths:** nothing to remove; skip step 5.
- **Some paths:** post the list (paths only) on the board for the owner. Keep it in `$B/overrides.txt`, one path per line, for step 5.

## 4. The window: pull and upgrade back to back

```sh
cd <project>
git pull --ff-only origin main
env -C /tmp fgctl stage --from <tree>
fgctl upgrade --from <tree>
cmp -s .fgos/distribution.json $B/distribution.json || cp -p $B/distribution.json .fgos/distribution.json   # D7
fgctl verify                                                                                                  # "verified active release sha256:…"
```

## 5. Remove the listed global values at once, before any dispatch

Run this right after step 4, and only after the owner has read the list. It removes exactly the listed paths and any parent left empty, then writes through a temporary file and a rename. It keeps mode 600 and prints counts only.

```sh
cp -p ~/.fgos/config.json ~/.fgos/private/config.json.bak-before-override-removal && chmod 600 ~/.fgos/private/config.json.bak-before-override-removal
python3 - "$B/overrides.txt" <<'EOF'
import json, os, sys
src = os.path.expanduser('~/.fgos/config.json'); raw = open(src).read(); d = json.loads(raw)
paths = [l.strip() for l in open(sys.argv[1]) if l.strip()]
removed = pruned = 0
for p in paths:
    segs = p.split('.'); chain = [d]
    for s in segs[:-1]: chain.append(chain[-1][s])
    del chain[-1][segs[-1]]; removed += 1
    for i in range(len(segs) - 1, 0, -1):
        if chain[i] == {}: del chain[i-1][segs[i-1]]; pruned += 1
        else: break
out = json.dumps(d, indent=2, ensure_ascii=False) + ('\n' if raw.endswith('\n') else '')
tmp = src + '.tmp'; fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
os.write(fd, out.encode()); os.fsync(fd); os.close(fd); os.replace(tmp, src)
print('removed', removed, 'pruned', pruned, 'mode', oct(os.stat(src).st_mode & 0o777))
EOF
```

The script splits each path on `.`, so a key that itself contains a `.` needs a manual look. None did on fg-server.

## 6. Setup, then stage 2

- Run `fgos setup </dev/null`. It must exit 0. On C it only creates a header-only config file when none exists; it no longer writes `~/.fgos/config.json`. Check that `sha256sum ~/.fgos/config.json` is the same before and after.
- Run `fgos config migrate --global --finish --machine-checked --dry-run --json` from the project. It should show `pending: 2`.
- Run the same command without `--dry-run`. It should show `{"stage":"finish","paths":2}`. Then check that `~/.fgos/config.json` is still mode 600 and no longer holds `gateway.token` or `runner.llmAccounts` (key presence only).

## 7. Verify

| Check | Expected (fg-server's result) |
|---|---|
| `fgos config check --json` | `ok: true`; warnings only (`config-comment-migrated-why` per kept value, `config-format-legacy-json` for the global file) |
| `fgos doctor --json` | no config row failed; **no message containing "runner config not loadable"**; `seat-binding-dry-bind` binds every seat (62 of 27 units) |
| `fgos dispatch decide --for execute --json` | a mechanism and an executor (fg-server: `out-of-process`, `gemini`) |
| `fgos gateway start` / `status` / `stop` | `reachable: true` (the token comes from `~/.fgos/private/gateway-token`); stop it again if it was not running before |

If dispatch is refused for a `runner` key, the global file still holds a value that step 3 should have listed. Run `fgos config show --path <path> --json` to see which layer it comes from (provenance; do not print the value). Then report it on the board.

## 8. After

- Remove the build worktree (`rm -rf <wt>/rel-build`, `git worktree remove <wt>`).
- Tell the machine's sessions the window is over.
- Post one board line: release digest, the override count, every step's result (ids only), and the doctor rows that are not green.
- **fg-server2 only:** OPC then runs its side of the two-machine identity proof (board line 13:25). CFG runs the fg-server side.

## Rollback

`fgctl upgrade --from ~/.local/state/fgos/releases/<previousArtifactDigest>` alone does not roll back. An older release cannot read the tombstoned project file. A rollback also needs `git revert -m 1 b6fac0706` on main and a pull. To restore the global file, copy it back from `$B/global-config.json`; the private files stay.
