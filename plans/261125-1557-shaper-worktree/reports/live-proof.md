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

## Rerun on af9a5d5b15

Run 2026-11-27 20:56–21:06 (+07). Release `sha256:21c454c9f6cb…` (distribution `/var/tmp/r/fgos-rc-af9a5d5b15`,
which includes phase 7: the shaper start creates `<project>-worktrees/` and links `.fgos/installation` into the
worktree). Fresh scratch `/var/tmp/r/shaper-live2/`: origin.git with `refs/fgos/legacy` fetched from the real repo,
and proj cloned at `47389ff551`. Setup was the same as the first run: `fgctl init --override-pin …`, then
`event-store-refspec-missing`, then `doctor --fix` + `git fetch`, then re-init (exit 2, the same 6 environmental
checks), plus a temporary Claude trust entry. Workspace id `cb23c7cc47917fc0`. All fgos calls went through
`/var/tmp/r/shaper-live2/proj/.fgos/installation/bin/fgos … --dir /var/tmp/r/shaper-live2/proj`.
`proj-worktrees/` was **not** created by hand.

| Check | Result |
|---|---|
| First shaper start on a fresh project | **PASS** |
| Two rounds saved on the branch; main checkout and main tip unchanged | **PASS** (`544b40b4cb`, `74d387f09b`) |
| Questions hook and mailbox hook answer inside the shaper | **PASS** |
| Identity holder of `head:shaper-ds-livetest-shaper2` is the shaper's CLI session | **PASS** |
| One rotation completes; the successor answers and can save | **FAIL**: `no-answer` again, from a new cause (defect D) |
| Land from the role holder: one commit on origin main, discussion dir only | **PASS** on first-parent (`0c09937984`, a merge) |
| Stop and cleanup | **PASS** |

### Step 2: discussion
`plans/discussions/ds-livetest-shaper2/DISCUSSION.md`, plain commit `d6cab03a8f`, pushed; origin/main = `d6cab03a8f`.

### Step 3: first start, no worktrees dir beforehand
```
ls -d /var/tmp/r/shaper-live2/proj-worktrees   -> No such file or directory   (before)
fgos session start shaper --name ds-livetest-shaper2 --json -> exit 0, role head:shaper-ds-livetest-shaper2,
     key cmd_1795787903270_29319ff4, pane w6:p2HF, visibility trustSeeded: claude-json
git worktree list -> /var/tmp/r/shaper-live2/proj-worktrees/ds-livetest-shaper2 d6cab03a8f [discussion/ds-livetest-shaper2]
<worktree>/.fgos/installation -> /var/tmp/r/shaper-live2/proj/.fgos/installation   (symlink)
/proc/3619866/cwd (claude) = /var/tmp/r/shaper-live2/proj-worktrees/ds-livetest-shaper2
```
Defect A is fixed. A side effect: in the worktree, `git status --short` shows `?? .fgos/installation`. The link is
untracked and not ignored there. That is harmless for `session save` (it names paths) and for the branch land,
but anything that requires a clean worktree will count it.

### Step 4: rounds
The shaper saved both rounds itself during its opening turn:
`544b40b4cb discussion(ds-livetest-shaper2): round 1, scout and baseline` and
`74d387f09b discussion(ds-livetest-shaper2): round 2, record round 1 save evidence`.
Proj main checkout afterwards: HEAD `d6cab03a8f` (unchanged), and `git status --short` = the init baseline
(` M .fgos/coexistence.json`, `?? .fgos/observe/records/`). PASS.

### Step 5: questions, mailbox, identity (inside the shaper)
```
ls -la .fgos/installation/bin/fgos                           -> -rwxr-xr-x … (present)
echo '{}' | $S hook mailbox --cli claude --event post-tool-use -> exit 0
echo '{"prompt":"x"}' | $S hook questions --event user-prompt-submit -> exit 0
fgos questions -> {"needsYou":5,"questions":[],"work":{…5 asks…}}
fgos identity session -> {"id":"fg-server2-jdp2bv/3c4d654c-c725-43c5-8321-ca18eb69c79e","handle":"claude-25d3@fg-server2"}
```
From outside, `fgos identity resolve head:shaper-ds-livetest-shaper2` → id `…/3c4d654c-…` (the Claude CLI session),
`roles: ["head:shaper-ds-livetest-shaper2"]`, `clone: /var/tmp/r/shaper-live2/proj-worktrees/ds-livetest-shaper2`,
`ids.cliSession.source CLAUDE_CODE_SESSION_ID`, `ids.mailbox {fgosDir: /var/tmp/r/shaper-live2/proj/.fgos, name: proj-claude-78}`,
`ids.head {persona: shaper, name: ds-livetest-shaper2, gen: 1}`. So the mailbox hook's `session bind session` ran.
In run 1 the holder was the attempt's `worker-q6x2`. (`identity session` prints the bound CLI session's handle,
`claude-25d3`; the role is on that record.)
Live mailbox delivery: `fgos mailbox send --to head:shaper-ds-livetest-shaper2 "…probe…"` returned
`recorded 30f60c61ff1a1dd8 for proj-claude-78 … delivered to the current holder of head:shaper-ds-livetest-shaper2`.
After the shaper's next tool call, its post-tool-use hook injected
`<mailbox-message … id="30f60c61ff1a1dd8">… probe …</mailbox-message>` and the shaper replied `MAILBOX-PROBE-RECEIVED`. PASS.

### Step 6: rotation
```
fgos session rotate shaper --name ds-livetest-shaper2 --json -> {"started":true,"pid":3780848}
rotation.log:    {"rotated":false,"reason":"no-answer","detail":"no valid answer from head-shaper-ds-livetest-shaper2-2 within 120000 ms"}
incidents.jsonl: {"event":"rotation-failed","code":"no-answer","successor":"ended","at":"2026-11-27T14:02:45.920Z"}
successor (gen 2, pane w6:p2HG) supervisor.log:
  head-request … session save refused role-pending-rotation: … generation 1 still holds the role   (x6)
  head-request mbx-504 / mbx-849 session bind session done
  head-request hook-853-1795788149354 session rotate refused role-pending-rotation …
```
This time the successor's hooks did run (mailbox bind, the Stop hook). But its Stop hook sent `session rotate` (the
measuring path) instead of `session answered`.

**Defect D (rotation lineage resolved in the worktree, not the project).** `hook session-rotation` resolves its
lineage with `fgos_dir_of(CLAUDE_PROJECT_DIR, cwd)` (`apps/fgos/src/wiring/session_rotation_hook.rs` ~409), which
gives `<worktree>/.fgos`. `fgos session rotate` and the start door write the lineage under the project root:
`proj/.fgos/runtime/session-rotation/shaper-ds-livetest-shaper2/` holds `placement.json`, `rotation.json` (gen 2
pending), the handoff `261127-1400-cmd17957.md` and `latest.json`. The hook instead reads and writes
`<worktree>/.fgos/runtime/session-rotation/shaper-ds-livetest-shaper2/` (only a `stop-trace.jsonl` there:
`decision below-soft, outcome below-threshold`). So `awaits_answer` finds no `rotation.json` and returns false,
the successor never answers, and its session-start hook also cannot see the handoff. The code comment states the
assumption ("not always the main checkout (a head started in a linked worktree)"). For the shaper that assumption
is wrong: the door records the lineage under the project root, and only the attempt's cwd is the worktree.
The fix is to resolve the lineage under the project root behind the worktree (for example its git common dir's
checkout, or the `.fgos/installation` link target's parent), not under `CLAUDE_PROJECT_DIR`.
The successor's uncommitted round-3 edit was left in the worktree (` M …/DISCUSSION.md`).

### Step 7: land (by gen 1, the role holder)
```
fgos land --branch discussion/ds-livetest-shaper2 -> {"ticket":"c-1328-1795788205839","state":"running"}  exit 0
origin/main: 0c09937984 (parents d6cab03a8f 74d387f09b) "land discussion/ds-livetest-shaper2"
git rev-list --first-parent --count d6cab03a8f..origin/main -> 1 ; --count (all) -> 3
git diff --name-only d6cab03a8f origin/main -> plans/discussions/ds-livetest-shaper2/DISCUSSION.md
proj main checkout HEAD -> 0c09937984 ; status = baseline
```
One merge commit on main's first-parent line, touching only the discussion dir. As in run 1, the two round commits
are reachable from main (defect C stands). The successor's uncommitted edit was not landed.

### Step 8: stop and cleanup
- `fgos session stop shaper --name ds-livetest-shaper2 --json` -> `stopped: true`; panes w6:p2HF/p2HG gone.
- **Unexpected: the scratch watcher started heads from the cloned portfolio.** In the ~8 minutes the
  `fgos-watcher-cb23c7cc` timer ran, it started a periodic-review Unit (`unit-run-1795787867188-9ea5e690`, agy) and a
  **lead head for a cloned real plan**, `head-lead-forgent-261127-0018-dead-s-6acc8-1` (pane w6:p2HH, confined to the
  scratch project, origin = scratch bare). The lead ended `cancelled` after I stopped the timers. I sent SIGTERM to the
  review Unit's supervise, bwrap and gate. origin.git main is still `0c09937984`, so the lead landed nothing. No
  process with `/var/tmp/r/shaper-live2` on its command line remains. (Two other `agy` processes on the machine run in
  real `forgent-worktrees/` and are not mine; I left them alone.) Lesson for future live proofs: an `fgctl init` of a
  clone of this repo installs a watcher that will start leads for the clone's running plans. Disarm the timers right
  after init.
- Timers: `systemctl --user stop` + `disable` on `fgos-watcher-cb23c7cc.timer` and `fgos-mailbox-sync-cb23c7cc.timer`
  (and their services). I deleted exactly `~/.config/systemd/user/fgos-{watcher,mailbox-sync}-cb23c7cc.{timer,service}`,
  then ran `systemctl --user daemon-reload`. The run-1 unit files for 40f96c35 were already gone when I looked. The
  real project's `fgos-*-e9756c48` timers are still active and enabled.
- Removed the Claude trust entries for the two scratch projects from the claude-vantt login home config.
- The real repo was not touched by this run (HEAD has since moved to `89b9da658e` through other sessions' lands).
  `/var/tmp/r/shaper-live2/` is kept for inspection.

### Defects after the rerun
- A: fixed. B: fixed (hooks run and bind in the worktree).
- **D (open, blocks "rotation in the same worktree completes"):** the rotation hook's lineage dir is under the
  worktree's `.fgos`, while the door writes it under the project's `.fgos`, so every shaper rotation ends `no-answer`.
- C (open, minor): a branch land is a merge, so round commits become reachable from main.
- Minor: `?? .fgos/installation` is untracked in the shaper worktree.

## Rerun on 31b1a9955c

Run 2026-11-27 22:48–22:59 (+07). Release `sha256:f584c232458a…` (distribution `/var/tmp/r/fgos-rc-31b1a9955c`,
built from main `31b1a9955c`, which includes phase 8: `placeHead` puts `FGOS_HEAD_PROJECT_ROOT` into the launch
environment and the rotation hook's `fgos_dir_of` prefers it). I confirmed the fix is in the staged host binary
(the string `FGOS_HEAD_PROJECT_ROOT` sits next to `CLAUDE_PROJECT_DIR` in `<release>/bin/fgos`). Fresh scratch
`/var/tmp/r/shaper-live3/`: origin.git cloned bare from the real repo with `refs/fgos/legacy` fetched into it, and
proj cloned at `f652a47531`. Workspace id `1d7db594ae8b5a8e`. Every fgos call went through
`env -u FGOS_STATE_ROOT TMPDIR=/var/tmp/r /var/tmp/r/shaper-live3/proj/.fgos/installation/bin/fgos … --dir /var/tmp/r/shaper-live3/proj`.
`proj-worktrees/` was not created by hand.

| Check | Result |
|---|---|
| Scratch timers disarmed before any other step | **PASS** (no scratch timer was ever active outside the init call) |
| First shaper start on a fresh project | **PASS** |
| Two rounds saved on the branch; main checkout and main tip unchanged | **PASS** (`8cab71be5e`, `e178e90c94`) |
| Questions hook and mailbox hook answer inside the shaper; identity holder is the shaper's CLI session | **PASS** |
| One rotation completes; the successor answers and can save | **FAIL**: `no-answer` again. The phase 8 fix works (the successor's Stop hook now finds the pending rotation and sends `session answered`), but the answer is refused by a new cause (defect E) |
| Land from the role holder: one commit on origin main, discussion dir only | **PASS** on first-parent (`5b0ee4c5cd`, a merge) |
| Stop and cleanup | **PASS** |

### Setup and the timer safety step
`fgctl init --from /var/tmp/r/fgos-rc-31b1a9955c --override-pin …` wrote the activation (status ready, digest
`sha256:f584c232…`) and then stopped at `event-store-refspec-missing`, as before. The first init installed no units.
I ran every later init-like step (`doctor --fix`, the re-init) under a small wrapper that polls
`~/.config/systemd/user/fgos-*.timer` every 0.3 s and stops and disables any unit that is not one of the units that
existed before the run (`fgos-watcher-e9756c48`, `fgos-mailbox-sync-e9756c48`, `fgos-watcher-e2b8b5cc`).
- `doctor --fix` installed `fgos-watcher-1d7db594` and `fgos-mailbox-sync-1d7db594`. The watcher service started at
  22:48:51 and was killed by SIGTERM in the same second (journal: `Main process exited, code=killed, status=15/TERM`).
- The re-init (exit 2, "not ready", 8 checks: executor skills, hooksPath, tool registry, one stale work step,
  provider quarantine, codex/agy trust, plus the two timer checks I had disarmed) re-enabled both units at 22:49:21,
  and the wrapper disarmed them in the same second. Both services ended `killed, status=15/TERM`.
- Afterwards both timers were `inactive / disabled`, `systemctl --user list-timers --all` listed only the real
  project's `e9756c48` timers, and no process had `/var/tmp/r/shaper-live3` in its command line or cwd.
  No scratch watcher ever started a head in this run.

### Step 2: discussion
`plans/discussions/ds-livetest-shaper3/DISCUSSION.md`, plain commit `2d7b4359fc`, pushed; origin/main = `2d7b4359fc`.
The proj main checkout baseline after init is ` M .fgos/coexistence.json`, ` M .fgos/config.yaml` (a regenerated
`@fgos:doc` comment), and later `?? .fgos/observe/records/`. All three come from init and the observe recorder, not from the shaper.

### Step 3: first start
```
ls -d /var/tmp/r/shaper-live3/proj-worktrees -> No such file or directory   (before)
fgos session start shaper --name ds-livetest-shaper3 --json -> exit 0, role head:shaper-ds-livetest-shaper3,
     key cmd_1795794607614_0dc1ab05, pane w6:p2HP, visibility trustSeeded: claude-json, confined
git worktree list -> /var/tmp/r/shaper-live3/proj-worktrees/ds-livetest-shaper3 2d7b4359fc [discussion/ds-livetest-shaper3]
<worktree>/.fgos/installation -> /var/tmp/r/shaper-live3/proj/.fgos/installation   (symlink)
/proc/596915/cwd (claude) = /var/tmp/r/shaper-live3/proj-worktrees/ds-livetest-shaper3
/proc/596915/environ: FGOS_HEAD_PROJECT_ROOT=/var/tmp/r/shaper-live3/proj
```
PASS. The new launch variable is present in the shaper's environment.

### Step 4: rounds
The shaper saved round 1 itself during its opening turn (`8cab71be5e round 1: orient on portfolio, write the seven
sections`). I typed round 2, and it saved with `fgos session save … --message "round 2"` → `committed e178e90c94`.
Proj main checkout afterwards: HEAD `2d7b4359fc` (unchanged), `git status --short` = the baseline above, and
`git branch --contains 8cab71be5e` → only `discussion/ds-livetest-shaper3`. PASS.

### Step 5: questions, mailbox, identity
Inside the shaper (all exit 0): `pwd` = the worktree, branch `discussion/ds-livetest-shaper3`;
`.fgos/installation/bin/fgos` present; `hook mailbox --cli claude --event post-tool-use` and
`hook questions --event user-prompt-submit` ran silently; `fgos questions` → `needsYou: 5`, `questions: []`, 5 work asks;
`fgos identity session` → `fg-server2-jdp2bv/ed1e58a1-…`, handle `claude-zbjp@fg-server2`.
From outside, `fgos identity resolve head:shaper-ds-livetest-shaper3` → the same id, `roles: [head:shaper-ds-livetest-shaper3]`,
`clone` = the worktree, `ids.cliSession.source CLAUDE_CODE_SESSION_ID`,
`ids.mailbox {fgosDir: /var/tmp/r/shaper-live3/proj/.fgos, name: proj-claude-59}`, `ids.head {shaper, ds-livetest-shaper3, gen 1}`.
`fgos mailbox send --to head:shaper-ds-livetest-shaper3 "live proof probe 3 …"` → `recorded 7641def4f267cf43 for proj-claude-59 …
delivered to the current holder`. The shaper's next PostToolUse hook injected it, and the shaper answered `MAILBOX-PROBE-RECEIVED`. PASS.

### Step 6: rotation
```
22:55:02 fgos session rotate shaper --name ds-livetest-shaper3 --json -> {"started":true,"pid":983730}  exit 0
successor: head-shaper-ds-livetest-shaper3-2, key cmd_1795794903281_e226c020, pane w6:p2HR
rotation.log:    {"rotated":false,"reason":"no-answer","detail":"no valid answer from head-shaper-ds-livetest-shaper3-2 within 120000 ms"}
incidents.jsonl: {"at":"2026-11-27T15:57:06.508Z","event":"rotation-failed","role":"head:shaper-ds-livetest-shaper3",
                  "code":"no-answer","detail":"…","successor":"ended"}
successor supervisor.log (head-request lines, in order):
  c-462-…  fgos done
  mbx-488  session bind session done (x2)
  hook-606-1795794924506 route no-rotation-pending: head:shaper-ds-livetest-shaper3 has no rotation waiting for head-shaper-ds-livetest-shaper3-2
  hook-606-1795794924506 session answered refused verb-failed: no-rotation-pending
  b754e04f63aafe37 … f7e0332faf6c6856, 8b33dcb2a111a1f1  session save refused role-pending-rotation:
                   shaper-ds-livetest-shaper3 generation 1 still holds the role   (x18)
  mbx-817  session bind session refused busy
  hook-819-1795795007521 route no-rotation-pending … ; session answered refused verb-failed: no-rotation-pending
successor receipt.json: outcome cancelled, gateExit stoppedBy cancel (15:57:05); role holder afterwards: gen 1 (pane w6:p2HP)
```
Where the files live:
- `proj/.fgos/runtime/session-rotation/shaper-ds-livetest-shaper3/` holds `placement.json` (gen 1), the
  `request-807f6122f4b2.json` while the request ran, the handoff `261127-1555-cmd17957.md` (with
  `Rotation id: 8f5dc3902c681e32`), `latest.json` (`{"file":"261127-1555-cmd17957.md","rotate":"manual",…}`),
  `rotation.log` and `incidents.jsonl`. The executor wrote `rotation.json` there and removed it when it gave up,
  as designed. All of this is under the project root, as required.
- The hook now reads the same place. The successor's Stop hook sent `session answered` 22 s after the rotation
  began (`hook-606-…` at 15:55:24). It only does that when `awaits_answer` finds `rotation.json` and it has read the
  rotation id from the handoff. Neither file exists under the worktree, so the hook resolved `proj/.fgos`. In
  rerun 2 the same hook sent `session rotate` instead. **The phase 8 fix works for the hook.**
- `<worktree>/.fgos/runtime/session-rotation/shaper-ds-livetest-shaper3/` still exists. It holds only
  `stop-trace.jsonl` with three gen 1 lines (22:50:57, 22:54:13, 22:54:45; `below-soft`, `below-threshold`).
  Those lines are written by the head-request route, not by the hook (see defect E).

**Defect E (the head-request route uses the attempt's cwd as the project root).** In
`src/session-host/head-request.mjs` (~line 676), the request socket's route sets `const projectRoot = envelope.cwd;`.
For a shaper, `envelope.cwd` is the worktree (`/var/tmp/r/shaper-live3/proj-worktrees/ds-livetest-shaper3`), while
`envelope.runDir` is under `proj/.fgos/assignments/…`. So `session answered` calls `markSuccessorAnswered` with
`projectRoot` = the worktree, `lineageDirOf` points at `<worktree>/.fgos/runtime/session-rotation/…`, there is no
`rotation.json` there, and the answer is refused `no-rotation-pending` (the successor key matched:
`successorKey` = `headKeyOf` = `head-shaper-ds-livetest-shaper3-2` = `envelope.unitRunId`). The role never moves,
the successor's saves are refused `role-pending-rotation`, and the executor ends it at 120 s. The same root sends gen 1's
measuring `session rotate` requests to `requestRotation` under the worktree, which is why `stop-trace.jsonl` lands
there, so the real lineage never sees the head's measured context fraction (an automatic, threshold-driven rotation
would also be judged from the wrong lineage). The land ticket is also kept under the worktree
(`<worktree>/.fgos/runtime/head-tickets/shaper-ds-livetest-shaper3/c-1413-1795795113155.json`, `cwd` = the worktree).
The land itself is fine, because git works from a linked worktree. The fix is to give the route the project root
the attempt was launched for (the same value `placeHead` now puts in `FGOS_HEAD_PROJECT_ROOT`, recorded in the
envelope, or derived from `runDir`), not `envelope.cwd`. Every verb in that route that reads or writes `.fgos` state
under `projectRoot` (rotate, answered, head tickets, the plan and discussion lookups, start) is affected for a head
whose cwd is a worktree.
The successor's uncommitted round-3 edit was left in the worktree (` M …/DISCUSSION.md`, 8 insertions, 6 deletions).
Successor cwd and handoff: PASS. Rotation completing: **FAIL**.

### Step 7: land (by gen 1, the role holder)
```
fgos land --branch discussion/ds-livetest-shaper3 -> ticket c-1413-1795795113155, state done
origin/main: 5b0ee4c5cd (parents 2d7b4359fc e178e90c94) "land discussion/ds-livetest-shaper3"
git rev-list --first-parent --count 2d7b4359fc..origin/main -> 1 ; --count (all) -> 3
git diff --name-only 2d7b4359fc origin/main -> plans/discussions/ds-livetest-shaper3/DISCUSSION.md
proj main checkout HEAD -> 5b0ee4c5cd ; status = baseline
```
One merge commit on main's first-parent line, touching only the discussion dir. The two round commits are reachable
from main, so defect C stands. The successor's uncommitted edit was not landed. The shaper could not read its ticket's
state: it tried `fgos land status` and `fgos land --status`, which were refused (`land-branch-not-own`, which took
"status" as a branch name, and `bad-args`).

### Step 8: stop and cleanup
- `fgos session stop shaper --name ds-livetest-shaper3 --json` → `stopped: true`; pane w6:p2HP is gone (w6:p2HR had
  already closed at 15:57:05). No process has `/var/tmp/r/shaper-live3` in its command line or cwd.
- Timers: `fgos-watcher-1d7db594` and `fgos-mailbox-sync-1d7db594` (timer and service) were stopped and disabled
  again. I deleted exactly `~/.config/systemd/user/fgos-{watcher,mailbox-sync}-1d7db594.{timer,service}`, then ran
  `systemctl --user daemon-reload` and `reset-failed` on the two services. The real project's `fgos-*-e9756c48`
  timers are still enabled. `fgos-watcher-e2b8b5cc` was there before the run and is not mine; I left it alone.
- Removed the Claude trust entry for `/var/tmp/r/shaper-live3/proj` from the claude-vantt login home config.
- The real repo was not touched by this run (its HEAD has since moved to `6b884bc7ff` through other sessions' lands,
  and its dirty files are the same as at the start). `/var/tmp/r/shaper-live3/` is kept for inspection.

### Defects after rerun 3
- A: fixed. B: fixed. D: fixed. The rotation hook now resolves the lineage under the project root and the successor sends `session answered`.
- **E (open, blocks "rotation in the same worktree completes"):** the head-request route takes `projectRoot` from
  `envelope.cwd` (`src/session-host/head-request.mjs` ~676). For a shaper that is the worktree, so `session answered`
  is refused `no-rotation-pending` and every shaper rotation still ends `no-answer`. The same root misplaces the
  stop trace (measured fractions go to the worktree's lineage, which hurts automatic rotation) and the head tickets.
- C (open, minor): a branch land is a merge, so round commits become reachable from main.
- Minor: `?? .fgos/installation` is untracked in the shaper worktree.
- Minor: a head has no obvious way to read its land ticket's state; `fgos land status` is read as a branch name.
- Minor: the successor's `session bind session` was refused `busy` once (`mbx-817`), while it was being refused saves.
- Setup note: `fgctl init`/`doctor --fix` on a scratch clone still install and immediately start the watcher and
  mailbox-sync timers. Each start was killed within the same second here, but only because of the polling wrapper.

## Rerun on 5a30a00947

Run 2026-11-27 23:42–23:48 (+07). Release `sha256:13476a30040931e48d745aa3aa0d7066b11862a79a6b75a120e1e54ea5f7e091`
(distribution `/var/tmp/r/fgos-rc-5a30a00947`, built from main `5a30a00947`, which includes the defect E fix
`381c124466`, landed as `35c609b820`: the head-request handler uses the envelope's `session.projectRoot`). Fresh scratch
`/var/tmp/r/shaper-live4/`: origin.git cloned bare from the real repo with `refs/fgos/legacy` fetched into it, and proj
cloned at `512da89724`. Workspace id `adf914b25ba5a1d0`. Every fgos call went through
`env -u FGOS_STATE_ROOT TMPDIR=/var/tmp/r /var/tmp/r/shaper-live4/proj/.fgos/installation/bin/fgos … --dir /var/tmp/r/shaper-live4/proj`.
`proj-worktrees/` was not created by hand. The procedure was the same as rerun 3.

| Check | Result |
|---|---|
| Scratch timers disarmed before any other step | **PASS** |
| First shaper start on a fresh project | **PASS** |
| Two rounds saved on the branch; main checkout and main tip unchanged | **PASS** (`c655837928`, `384d102ee6`) |
| Questions hook and mailbox hook answer inside the shaper; identity holder is the shaper's CLI session | **PASS** |
| One rotation completes; the successor answers, takes the role and its save is accepted | **PASS** (`rotated: true` after 22 s; the successor saved round 3 as `37d79df863`) |
| Gen 1 stop trace and the land ticket are under the project's `.fgos`, not the worktree's | **PASS** (the worktree has no `.fgos/runtime` at all) |
| Land from the role holder (the successor, gen 2): one commit on origin main, discussion dir only | **PASS** on first-parent (`f1b7d7e31d`, a merge) |
| Stop and cleanup | **PASS** |

### Setup and the timer safety step
The first `fgctl init --from /var/tmp/r/fgos-rc-5a30a00947 --override-pin …` wrote the activation and stopped at
`event-store-refspec-missing`, and it installed no units. `doctor --fix` and the re-init ran under the same polling
wrapper as rerun 3. `doctor --fix` installed and started `fgos-watcher-adf914b2` and `fgos-mailbox-sync-adf914b2`, and
the wrapper stopped and disabled both at 23:42:52. The re-init started them again, and the wrapper disarmed them at
23:43:25. Both times the watcher service was killed in the same second (`Main process exited, code=killed, status=15/TERM`).
The re-init ended exit 2, "not ready", with 9 environmental checks: the same 8 as rerun 3, plus
`active-release-matches-checkout`, because the clone (`512da89724`) is not the tree the release was built from.
Afterwards both scratch timers were `inactive / disabled`, `list-timers` showed only the real project's `e9756c48`
timers, and no scratch watcher started a head.

### Step 2: discussion
`plans/discussions/ds-livetest-shaper4/DISCUSSION.md`, plain commit `57e805489c`, pushed; origin/main = `57e805489c`.
The proj main checkout baseline is ` M .fgos/coexistence.json`, ` M .fgos/config.yaml`, and later `?? .fgos/observe/records/`, as in rerun 3.

### Step 3: first start
```
ls -d /var/tmp/r/shaper-live4/proj-worktrees -> No such file or directory   (before)
fgos session start shaper --name ds-livetest-shaper4 --json -> exit 0, role head:shaper-ds-livetest-shaper4,
     key cmd_1795797871999_cd2aff18, pane w6:p2HT, visibility trustSeeded: claude-json
git worktree list -> /var/tmp/r/shaper-live4/proj-worktrees/ds-livetest-shaper4 57e805489c [discussion/ds-livetest-shaper4]
<worktree>/.fgos/installation -> /var/tmp/r/shaper-live4/proj/.fgos/installation   (symlink)
envelope.json: cwd = the worktree; session.projectRoot = /var/tmp/r/shaper-live4/proj
/proc/1154341 (claude): cwd = the worktree; FGOS_HEAD_PROJECT_ROOT=/var/tmp/r/shaper-live4/proj
```
PASS. The envelope now carries the project root separately from the cwd.

### Step 4: rounds
The shaper saved round 1 itself (`c655837928 round 1: seven sections, domain coding, open points listed`). I typed
round 2, and it saved `384d102ee6 round 2`. Proj main checkout afterwards: HEAD `57e805489c` (unchanged), status =
the baseline, and `git branch --contains c655837928` → only `discussion/ds-livetest-shaper4`. PASS.

### Step 5: questions, mailbox, identity
Inside the shaper, all six checks exited 0: `pwd` = the worktree, branch `discussion/ds-livetest-shaper4`; the
`.fgos/installation/bin/fgos` link target is present; `hook mailbox` and `hook questions` ran silently;
`fgos questions` → `needsYou: 5`, no owner questions; `fgos identity session` → `fg-server2-jdp2bv/60cd4961-…`.
From outside, `fgos identity resolve head:shaper-ds-livetest-shaper4` → the same id, handle `claude-bmj7`,
`clone` = the worktree, `cliSession.source CLAUDE_CODE_SESSION_ID`, `mailbox {fgosDir: /var/tmp/r/shaper-live4/proj/.fgos,
name: proj-claude-5b}`, `head gen 1`. `fgos mailbox send … "live proof probe 4 …"` → `recorded 42e8736e0a2d5f5c for proj-claude-5b`.
The shaper's PostToolUse hook delivered it, and the shaper answered `MAILBOX-PROBE-RECEIVED`. PASS.

### Step 6: rotation
Before the rotation, gen 1's stop trace was already under the project:
`proj/.fgos/runtime/session-rotation/shaper-ds-livetest-shaper4/stop-trace.jsonl` →
`{"at":"2026-11-27T16:45:21.964Z","fraction":0.091285,"source":"sidecar","decision":"below-soft","outcome":"below-threshold"}`.
`<worktree>/.fgos` holds only `cache` and `installation`, and it has no `runtime/` directory at all.
```
23:46:26 fgos session rotate shaper --name ds-livetest-shaper4 --json -> {"started":true,"pid":1298637}  exit 0
23:46:48 rotation.log: {"rotated":true,"key":"cmd_1795797987780_82790f06","gen":2,"oldEnded":true}
incidents.jsonl: not written (no failure)
answered.json: {"gen":2,"key":"head-shaper-ds-livetest-shaper4-2","sessionId":"fg-server2-jdp2bv/6dffc067-…",
                "message":"None pending: no owner question belongs to this discussion. Resuming after the rotation, in round 3.",
                "answeredAt":"2026-11-27T16:46:44.708Z"}
placement.json:  gen 2, key cmd_1795797987780_82790f06, runDir …/head-shaper-ds-livetest-shaper4-2/runs/01
latest.json:     {"file":"261127-1646-cmd17957.md","session":"cmd_1795797871999_cd2aff18","rotate":"manual",…}
handoff 261127-1646-cmd17957.md line 14: "Rotation id: 7f84e5678fd70227"
successor (gen 2, pane w6:p2HV) supervisor.log head-request lines:
  c-448-…  fgos done
  mbx-472  session bind session done (x2)
  hook-523-1795798004574  session answered done
  141f1b4904296f12  session save done
identity resolve head:shaper-ds-livetest-shaper4 -> id …/6dffc067-…, handle claude-ydqa, alive, paneId w6:p2HV, gen 2
gen 1 run dir: stop-requested.json, receipt.json, closed.json (ended by the rotation)
successor claude cwd (/proc/1301134) = /var/tmp/r/shaper-live4/proj-worktrees/ds-livetest-shaper4
```
Every rotation file (`placement.json`, the handoff, `latest.json`, the short-lived `rotation.json`, `answered.json`,
`rotation.log`, `stop-trace.jsonl`) is under `proj/.fgos/runtime/session-rotation/shaper-ds-livetest-shaper4/`. The
successor's hook read the handoff and pending rotation from there, and the request handler now checks the answer
against the same place. The role moved, gen 1 was ended, and the successor saved round 3 on its own
(`37d79df863 round 3: successor after rotation, points 3 and 4 clear`). **Rotation: PASS.** Defects D and E are fixed.

### Step 7: land (by gen 2, the role holder after the rotation)
```
fgos land --branch discussion/ds-livetest-shaper4 -> ticket c-738-1795798029008, state done
ticket file: proj/.fgos/runtime/head-tickets/shaper-ds-livetest-shaper4/c-738-1795798029008.json
  cwd /var/tmp/r/shaper-live4/proj, argv [land --json --branch discussion/ds-livetest-shaper4 --footprint plans/discussions/ds-livetest-shaper4],
  result mainSha f1b7d7e31d, landedPaths [plans/discussions/ds-livetest-shaper4/DISCUSSION.md],
  worktreesKept [{path: <worktree>, code: worktree-live-cwd-preserved}]
origin/main: f1b7d7e31d (parents 57e805489c 37d79df863) "land discussion/ds-livetest-shaper4"
git rev-list --first-parent --count 57e805489c..origin/main -> 1 ; --count (all) -> 4
git diff --name-only 57e805489c origin/main -> plans/discussions/ds-livetest-shaper4/DISCUSSION.md
proj main checkout HEAD -> f1b7d7e31d (fast-forwarded a few seconds after the land); status = baseline
```
One merge commit on main's first-parent line, touching only the discussion dir, landed by the successor. The land
ticket is under the project's `.fgos`. The three round commits are reachable from main, so defect C stands.

### Step 8: stop and cleanup
- `fgos session stop shaper --name ds-livetest-shaper4 --json` → `stopped: true`; no herdr pane for the scratch remains.
  No process has `/var/tmp/r/shaper-live4` in its command line or cwd.
- Timers: `fgos-watcher-adf914b2` and `fgos-mailbox-sync-adf914b2` (timer and service) were stopped and disabled again.
  I deleted exactly `~/.config/systemd/user/fgos-{watcher,mailbox-sync}-adf914b2.{timer,service}`, then ran
  `systemctl --user daemon-reload` and `reset-failed` on the two services. The real project's `fgos-*-e9756c48` timers
  are still enabled. I left `fgos-watcher-e2b8b5cc` alone because it is not mine.
- Removed the Claude trust entry for `/var/tmp/r/shaper-live4/proj` from the claude-vantt login home config.
- This run did not touch the real repo. `/var/tmp/r/shaper-live4/` is kept for inspection.

### Defects after rerun 4
- A, B, D, E: fixed. A shaper starts on a fresh project, its hooks run in the worktree, and a rotation in the same
  worktree completes. The successor answers, takes the role, saves, and lands.
- C (open, minor): a branch land is a merge, so round commits become reachable from main.
- Minor: `?? .fgos/installation` is untracked in the shaper worktree.
- Minor: two of gen 1's measuring Stop-hook requests were refused `busy` (`hook-1050-…`, `hook-1147-…`, before the
  rotation), so `stop-trace.jsonl` holds one line for three stops. That is harmless here, but a busy refusal drops a
  context measurement that an automatic rotation would rely on.
- Setup note: `fgctl init`/`doctor --fix` on a scratch clone still install and immediately start the watcher and
  mailbox-sync timers, so a live proof on a clone needs the polling disarm.
