# Live proof: plan 261125-1557-shaper-worktree, phase 6, job B

Run 2026-11-27 20:13–20:27 (+07) on fg-server2. Release `sha256:09a7a747a9e6…` (built from main `349b4dd8ff`),
distribution `/var/tmp/r/fgos-rc-349b4dd8ff`, fgctl `/var/tmp/r/tgt-rel/release/fgctl`. Every write happened in
`/var/tmp/r/shaper-live/`; the real repo stayed at `349b4dd8ff` with the same `git status` as before the run.
Every fgos call: `env -u FGOS_STATE_ROOT TMPDIR=/var/tmp/r /var/tmp/r/shaper-live/proj/.fgos/installation/bin/fgos … --dir /var/tmp/r/shaper-live/proj`
(proj's own activated host, `activation.json` → `releasePath …/releases/sha256:09a7a747…`).

## Summary

| Step | Result |
|---|---|
| 1 Scratch project + activation | PASS, after 2 setup fixes (pin override, seeding `refs/fgos/legacy`) |
| 2 Scratch discussion on main, pushed | PASS (`ccf9b69447`) |
| 3 `session start shaper` | **FAIL on a fresh project** (defect A); PASS after creating the empty `proj-worktrees/` dir plus a one-time Claude trust entry. cwd = worktree, branch `discussion/ds-livetest-shaper` |
| 4 Two saved rounds; main checkout clean, main tip unchanged | PASS (`e61d183f51`, `a90706945b`) |
| 5 `fgos questions` + mailbox hook in the worktree | questions PASS; **mailbox hook FAIL** (defect B: every fgOS hook does nothing in a linked worktree) |
| 6 Rotation; the successor runs in the same worktree | cwd PASS; **rotation FAIL** (`no-answer`, a consequence of defect B) |
| 7 Land once | PASS with a caveat: one merge commit `a8150c82e6` on main's first-parent line, touching only `plans/discussions/ds-livetest-shaper/`; landed by gen 2, because the successor never got the role |
| 8 Stop | PASS (`session stop` → `stopped: true`, both panes gone) |

## Step 1: scratch project

```
git clone --bare /home/vantt/projects/forgent /var/tmp/r/shaper-live/origin.git
git clone /var/tmp/r/shaper-live/origin.git /var/tmp/r/shaper-live/proj      # HEAD 349b4dd8ff
fgctl upgrade --from /var/tmp/r/fgos-rc-349b4dd8ff
  -> Error: no active runtime found in workspace -- run 'fgctl init' first
fgctl init --from /var/tmp/r/fgos-rc-349b4dd8ff
  -> Error: pin-mismatch: workspace is pinned to sha256:abe41ad0…, --from resolved to sha256:09a7a747…
fgctl init --from … --override-pin "live proof of plan 261125-1557 on scratch copy; release built from 349b4dd8ff"
  -> activation written (status ready, artifactDigest sha256:09a7a747…), then
     fgos: event-store-refspec-missing: run fgos doctor --fix and fetch the pinned legacy ref
fgos doctor --fix          # added the refs/fgos/* fetch refspecs to proj
git -C origin.git fetch /home/vantt/projects/forgent refs/fgos/legacy:refs/fgos/legacy   # a bare clone copies only heads and tags
git -C proj fetch origin   # refs/fgos/remotes/origin/legacy 7e456df674
fgctl init … --override-pin …  -> exit 2 "activated but not ready": 6 environmental checks
  (executor skills for omp, hooksPath not wired, codex trust, provider quarantine, tool registry, one stale work step)
```

Setup finding (not this plan's scope): a plain `git clone --bare` of an fgOS project lacks `refs/fgos/legacy`, so
`fgctl init` fails until that ref is seeded by hand. Baseline main checkout after init:
` M .fgos/coexistence.json`, `?? .fgos/observe/records/`. Both come from init and stay the same for the whole run.

## Step 2: scratch discussion

`plans/discussions/ds-livetest-shaper/DISCUSSION.md` (frontmatter id, title, `status: open`, source, created), with a
plain git commit `ccf9b69447` on proj main, pushed to origin.git. `origin/main` = `ccf9b69447`.

## Step 3: shaper start

```
fgos session start shaper --name ds-livetest-shaper --json
  -> exit 2  fgos: shaper-worktree-failed: the worktree /var/tmp/r/shaper-live/proj-worktrees/ds-livetest-shaper
     was not created: fgos: No such file or directory (os error 2)
```

**Defect A (blocks every first shaper in a project).** Reproduced directly:
`<release>/bin/fgos worktree create /var/tmp/r/shaper-live/proj-worktrees/probe --branch probe-wt --base main --json`
gives the same error and creates nothing. strace shows the last failing call is
`readlink("/var/tmp/r/shaper-live/proj-worktrees") = -1 ENOENT`. The cause is `canonical_destination` in
`packages/git/rust/src/worktree.rs` (around line 185), which runs `path.parent().canonicalize()` and so needs the
sibling `<project>-worktrees/` directory to exist already. The real repo never hits this because
`/home/vantt/projects/forgent-worktrees` already exists. `defaultEnsureWorktree` (`src/session-host/head-start.mjs`)
calls the door without creating the parent, so on any project where no lead has made a worktree yet, the shaper
start fails. To continue, I created only the empty directory: `mkdir /var/tmp/r/shaper-live/proj-worktrees`.

Second attempt: `exit 0`, head-shaper-…-1, pane `w6:p2HA`. The attempt was cancelled about 7 s later:
`receipt.json` `outcome: cancelled`, `reason: terminal:delivery-unknown`, and `visibility.json`
`trustSeedFailed: "… its repo root /var/tmp/r/shaper-live/proj is not trusted in /home/vantt/.fgos/private/claude-vantt/.claude.json …"`.
The pane was waiting at Claude Code's first-run "Press Enter to continue" screen. This is an environment precondition,
not a plan defect: a new project must be trusted once. I added `projects["/var/tmp/r/shaper-live/proj"].hasTrustDialogAccepted=true`
(atomic rename) and removed it again after the run.

Third attempt: `exit 0`, role `head:shaper-ds-livetest-shaper`, key `cmd_1795785532821_040eec2e`, gen 2, pane `w6:p2HB`,
`visibility.json` `trustSeeded: claude-json`.

```
git worktree list
  /var/tmp/r/shaper-live/proj                              ccf9b69447 [main]
  /var/tmp/r/shaper-live/proj-worktrees/ds-livetest-shaper ccf9b69447 [discussion/ds-livetest-shaper]
herdr pane list: w6:p2HB shaper cwd=<proj>/.fgos/assignments/head-shaper-ds-livetest-shaper-2/runs/01
                 foreground_cwd=/var/tmp/r/shaper-live/proj-worktrees/ds-livetest-shaper
/proc/4145503/cwd (claude) = /var/tmp/r/shaper-live/proj-worktrees/ds-livetest-shaper
status line: 📁 /var/tmp/r/shaper-live/proj-worktrees/ds-livetest-shaper  🌿 discussion/ds-livetest-shaper
```

PASS for cwd and branch.

## Step 4: two saved rounds

Round 1: the shaper ran its opening on its own, wrote the seven sections, and saved them itself.
The branch got `e61d183f51 round 1: frame the live-proof scratch topic, record checks and open points` (1 file, +76 −1).

Round 2 (typed by me with send-text, then enter in a separate call; the pane showed `working`):
```
fgos session save plans/discussions/ds-livetest-shaper/DISCUSSION.md --message "round 2"
  -> committed a90706945bcc6f4d9df3c61543195d3bd547a2f7     (exit 0)
```
After each save, in the proj main checkout:
```
git status --short   ->  M .fgos/coexistence.json / ?? .fgos/observe/records/   (baseline, unchanged)
git rev-parse HEAD   ->  ccf9b69447c36839542f3bdb5bb122ce768862e9               (unchanged)
git branch --contains e61d183f51 -> discussion/ds-livetest-shaper only
git log discussion/ds-livetest-shaper: a90706945b round 2 / e61d183f51 round 1 / ccf9b69447
```
PASS.

## Step 5: questions and the mailbox hook from the worktree

```
(a) fgos questions -> {"needsYou":5,"questions":[],"work":{"gates":[],"asks":[tsk-1pv,tsk-1yf,tsk-3wd,tsk-5ui,tsk-wvz]}}  exit 0
(b) pwd -> /var/tmp/r/shaper-live/proj-worktrees/ds-livetest-shaper ; branch discussion/ds-livetest-shaper
    ls -la .fgos/installation/bin/fgos -> No such file or directory
(d) fgos identity session -> {"id":"fg-server2-jdp2bv/att-cmd_1795785532821_040eec2e","handle":"worker-q6x2@fg-server2"}
```
`fgos questions` works from inside the worktree: PASS.

**Defect B (mailbox hook, and every other fgOS hook, does nothing in a shaper worktree).** Each fgOS hook in
`.claude/settings.json` begins `S="${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos"; [ -x "$S" ] || exit 0; …`.
In a linked worktree, `CLAUDE_PROJECT_DIR` is the worktree, and the worktree has no `.fgos/installation/`.
Its tracked `.fgos/*` entries are skip-worktree (`git ls-files -v .fgos` → `S …`), and `installation/` is untracked.
I checked this from outside and from inside the sandbox; the real repo's lead worktrees look the same (`.fgos` holds only `runtime` and the like).
So in the shaper, these hooks all `exit 0` silently: `hook mailbox` (post-tool-use and stop), `hook questions`
(user-prompt-submit and stop), `hook session-rotation` (session-start and stop), `identity session --register`,
`hook dispatch-decide`, `hook decision-question`, and the main-checkout delete guard.
Visible effects: the head is never bound to its CLI session. `identity session` returns the attempt's worker handle
`worker-q6x2` (then `worker-dzbg` for gen 3), not `head:shaper-ds-livetest-shaper`, and no mailbox bind happens.
Step 6 shows the rotation failure. (The shaper's own check (c) printed an empty `CLAUDE_PROJECT_DIR` because that
variable exists only in a hook's environment, not in the Bash tool's. The missing binary in (b) is the decisive evidence.)
This is the risk the plan names under "Risks", and it is confirmed. Leads never hit it because they run in the main checkout.

## Step 6: rotation

```
fgos session rotate shaper --name ds-livetest-shaper --json -> {"started":true,"pid":242713}  exit 0
successor: head-shaper-ds-livetest-shaper-3, pane w6:p2HC,
  foreground_cwd and /proc/248686/cwd = /var/tmp/r/shaper-live/proj-worktrees/ds-livetest-shaper   (same worktree: PASS)
successor's round-3 save:
  role-pending-rotation: session save was refused: role-pending-rotation (shaper-ds-livetest-shaper generation 2 still holds the role)  exit 2
rotation.log:      {"rotated":false,"reason":"no-answer","detail":"no valid answer from head-shaper-ds-livetest-shaper-3 within 120000 ms"}
incidents.jsonl:   {"event":"rotation-failed","code":"no-answer","successor":"ended", "at":"2026-11-27T13:23:26.667Z"}
```
The successor's `session answered` is sent by its Stop hook `hook session-rotation --event stop`
(`apps/fgos/src/wiring/session_rotation_hook.rs`). Defect B stops that hook from running, so the role never moves.
The executor ends the successor after 120 s, gen 2 keeps the role, and the successor's uncommitted round-3 edit is
left behind in the worktree. Successor cwd: PASS. Rotation completing: FAIL.

## Step 7: land

The successor could not land (it does not hold the role), so I asked gen 2 (`w6:p2HB`, still the role holder) to land:
```
fgos land --branch discussion/ds-livetest-shaper -> {"ticket":"c-1080-1795785824157","state":"running"}  exit 0
```
In proj, after `git fetch`:
```
origin/main = a8150c82e6acf88e877428de5c9e6da7e77d53d8 "land discussion/ds-livetest-shaper", parents ccf9b69447 a90706945b
git rev-list --first-parent --count ccf9b69447..origin/main -> 1
git rev-list --count ccf9b69447..origin/main               -> 3   (merge + round 1 + round 2)
git diff --name-only ccf9b69447 origin/main                -> plans/discussions/ds-livetest-shaper/DISCUSSION.md
proj main checkout HEAD -> a8150c82e6 (fast-forwarded by the land); status = baseline
```
PASS on main's first-parent line: one commit, touching only `plans/discussions/ds-livetest-shaper/`.
Caveat: this is a merge, the same shape as the lead lands (`63606ea634 land shaper-worktree/p05` has two parents),
so the per-round commits become reachable from main. `fgos land --help` says a branch land "fast-forwards or squashes";
it did neither. If criterion 6's "exactly one commit" means no round commits reachable from main, it is not met.
The round-3 edit was correctly not included.

## Step 8: stop and cleanup

```
fgos session stop shaper --name ds-livetest-shaper --json -> {"stopped":true}  exit 0; panes w6:p2HB and w6:p2HC gone
```
Other things this run started in scratch, all stopped:
- `fgctl init` installed user systemd timers for proj: `fgos-watcher-40f96c35.timer` and
  `fgos-mailbox-sync-40f96c35.timer`. I stopped and disabled them. Their unit files remain in
  `~/.config/systemd/user/` because I don't delete outside scratch. Note that `fgctl uninstall --dry-run` does not list the watcher timer.
- An independent periodic-review Unit (`unit-run-1795785410966-8ac193b3`, agy producer) was started in proj soon
  after init. I sent its `internal supervise`/bwrap/gate processes SIGTERM; none remain.
- The trust entry in `/home/vantt/.fgos/private/claude-vantt/.claude.json` was removed.
- `/var/tmp/r/shaper-live/` (origin.git, proj, proj-worktrees with the uncommitted round-3 edit) is left in place for inspection.

## Defects for the owning phases

- **A (phase 4 / Git worktree door):** the first shaper start in a project without `<project>-worktrees/` fails with
  `shaper-worktree-failed … No such file or directory`. Fix it where the door canonicalizes the parent
  (`canonical_destination`), or by creating the parent in `defaultEnsureWorktree`. The phase 4 tests used ports, so they never caught it.
- **B (phase 1/4, hooks in worktree):** project hooks resolve `${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos`,
  which does not exist in a linked worktree. Mailbox, questions, identity register and rotation hooks are all silent
  no-ops in a shaper, so rotation always ends `no-answer`, and the head never binds its CLI session or mailbox.
- **C (minor, land shape):** a branch land produces a merge commit. Round commits become reachable from main.
