# Filesystem confinement for a herdr worker — what was measured, 2026-09-08

## Why this was measured at all

On 2026-09-07 a real `fgos-coding-implement` dispatch through `agy-herdr` was
handed the worktree `.claude/worktrees/tsk-1fp-2-OmCN4o`, reported `settled`,
and had written six files into the **main checkout** instead — onto
`group-thinking-plan-loop`, another track's active branch. Four files created,
two tracked files modified.

The harness did its part: `herdr agent get` and `fgos dispatch show-run` both
reported the agent's cwd as the worktree. The worker went outside it on its own.

V0's doctrine — *a receipt is an artifact the receiver wrote* — establishes that
a worker **did** something. It establishes nothing about **where**. Confinement
as built covers the herdr socket and `HOME`; the filesystem leg was never built,
because everyone assumed an agent works where it is told.

## What was measured

| probe | question | answer |
|---|---|---|
| 1 | does agy start inside bwrap at all? | yes, in every configuration including a fully read-only one |
| 2 | is the boundary real? | yes — a write to the exact directory of the incident is refused `Read-only file system`; reads still work |
| 3 | does mount order matter? | yes, decisively (below) |
| 4 | can a bwrap pane host a herdr agent? | **no** — `agent_pane_busy` |
| 5 | which mechanisms preserve the pid? | `unshare` yes, `bwrap` no |
| 6 | does the pid-preserving one still confine? | yes, all four properties |
| 7 | can a herdr agent start in it? | **yes** — `agent_status: idle` |

## The three findings that matter

### 1. Mount order can silently delete the worker's own HOME

`--tmpfs /tmp` shadows anything bound underneath it. `createWorkerHome`
provisions the private HOME under `os.tmpdir()`, so a naive
`--bind <home> … --tmpfs /tmp` removes the HOME the worker is about to use.

Measured (probe 3):

| order | workspace | HOME | /tmp | write outside |
|---|---|---|---|---|
| no tmpfs | writable | writable | read-only | refused |
| `--tmpfs /tmp` **first**, binds after | writable | writable | writable | refused |
| binds first, `--tmpfs /tmp` **after** | **gone** | **gone** | writable | refused |

Writing outside is refused in every ordering. The ordering decides whether the
worker can do its job, not whether it is contained.

### 2. herdr rejects a bwrap pane, and the reason is pid identity

`herdr agent start --kind <k>` runs the canonical executable and accepts no
command override, so bwrap cannot be inserted there. It can only be inserted by
replacing the pane's own shell — and herdr then refuses the pane:

```
agent_pane_busy: agent target pane wS:p23R is not an available shell
```

The cause was measured against a control rather than guessed:

```
untouched pane -> shell_pid 2353540 | foreground [2353540] | match: True
bwrap pane     -> shell_pid 2351296 | foreground [2351335] | match: False
```

bwrap must fork to build its namespace, so the pane's interactive shell is no
longer the pid herdr recorded. herdr's "available shell" check compares them.

### 3. `unshare` confines just as hard and keeps the pid

`unshare --mount --map-root-user` calls the syscall and then `exec`s — no fork,
so the pid survives the whole chain (probe 6):

```
outer shell pid: 2400126
inside ns pid  : 2400126
after mounts   : 2400126
write inside workspace: yes
write OUTSIDE         : no (refused)
read the repo         : yes
```

And herdr accepts the resulting pane (probe 7):

```
shell_pid: 2401320 | foreground: [2401320] | match: True
CONFINED_OK                                    (write to the incident's directory refused)
agent start --kind agy -> exit 0, agent_status "idle"
```

**agy reaches ready inside a confined pane.** The path bwrap could not take is
open via unshare, for the reason measured rather than assumed.

One caveat carried forward: a mount namespace begins as a copy of the parent's
mounts, so unlike bwrap **nothing is restricted until something is remounted
read-only inside it**. A bind mount also inherits the read-only flag of what it
sits on, so handing the workspace back as writable takes a second
`remount,bind,rw`. Miss it and everything is read-only — which reads as
"confinement works" while the worker cannot do its job.

## Two probe bugs, recorded because each nearly produced a wrong conclusion

- The first pid measurement compared pids from two different shells, so the
  `exec` baseline itself reported "pid changed". A measurement that fails its
  own control is announcing that it is broken.
- The first confinement run reported `write inside workspace: NO` and would
  have retired `unshare` as unusable. The cause was the missing
  `remount,bind,rw`, buried three quoting levels deep in a nested shell string.
  The mount work now lives in its own file for that reason.

## What was NOT measured

- Whether agy can complete real implementation work inside the namespace. Only
  startup to `idle` was reached; no task was dispatched.
- Any provider other than agy.
- `landlock`, which this kernel reports active
  (`lockdown,capability,landlock,yama,apparmor`). It is the other pid-preserving
  shape — a syscall a process applies to itself, inherited by children — but no
  CLI here applies it, so using it would mean a small helper.
- Read isolation. `--ro-bind / /` and the unshare equivalent both leave the
  whole filesystem *readable*. What was measured is the write boundary only.

## Files

`bwrap-probe-1..7`, plus `unshare-inner.sh` and `unshare-shell.sh`, which hold
the mount work the probes run inside the namespace. Each takes a workspace path
and, where relevant, a private HOME; each prints what it observed rather than
asserting a verdict.
