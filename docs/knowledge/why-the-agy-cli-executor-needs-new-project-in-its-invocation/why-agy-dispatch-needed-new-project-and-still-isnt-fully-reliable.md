---
authoritative_for: why the agy CLI executor needs --new-project in its invocation args, the real incident that surfaced the cwd bug, and why agy dispatch still isn't considered fully reliable even after that fix
framework: diataxis
mode: explanation
---

# Why `agy` dispatch needed `--new-project`, and still isn't fully reliable

## The incident: real cross-branch contamination, not a hypothetical

Dispatching real `code-implement` work for `tsk-1fk` through the `agy`
capacity — `spawnWorker` (`src/runner/dispatch.mjs`) invoked with `cwd`
correctly pointed at `tsk-1fk`'s own worktree
(`.claude/worktrees/tsk-1fk-oskkGK`, branch `fgw/tsk-1fk`) — reported exit
0 success, but the real commit it produced (`acb4a27f`,
`feat(tsk-1lv): add reverse-string dispatch proof example and unit test`)
landed on `fgw/tsk-1lv`, a completely unrelated work item that was actively
claimed (`status: doing`) by a different session at the time. `tsk-1fk`'s
own branch received no implementation at all.

## Root cause: `agy` resumes its own tracked project, ignoring the spawned `cwd`

Live reproduction (two independent temp directories, run back-to-back
through the real `agy` binary, v1.1.13, not just the adapter) confirmed:
`agy`'s print-mode (`-p`) does not use the OS process `cwd` it was spawned
with at all — it resumes whichever project/conversation it last had open
internally.

- Without `--new-project`: `agy` reported
  `/home/vantt/.gemini/antigravity-cli/scratch` — wrong, even though it was
  spawned from `/tmp/agy-repro-a`.
- With `--new-project`: `agy` correctly reported the actual spawn `cwd`.

`cliSpawnAdapter`/`spawnWorker` were checked directly and confirmed to pass
`cwd` through to `child_process.spawn` correctly — this is a real `agy`
binary behavior, not a bug in fgOS's own dispatch code, worked around
entirely at the config layer: `"--new-project"` appended to
`runner.executors.agy.invocations[0].args` in `.fgos/config.json`, no
adapter or `dispatch.mjs` code change needed.

## The fix didn't make `agy` fully reliable — a second, different failure mode followed

A day later, dispatching real work for `tsk-539` through the same `agy`
capacity (still carrying `--new-project`, unchanged since the fix above)
hit a *different* failure: `dispatch.mjs decide` correctly resolved
`out-of-process`, but the `execute` call itself errored cleanly —
`{"mechanism":"out-of-process","status":1,"stdout":"","stderr":"Error:
timeout waiting for response\n"}` — leaving substantial real, uncommitted
work sitting in the correct worktree (verified via `git log`/`git status`
before trusting anything), and nothing committed anywhere. No cross-branch
contamination this time, but a second distinct way for the same capacity
to fail under real dispatch. Per the driving session's own read rule, an
error result falls through to inline dispatch rather than being retried
blind — that's what happened: the implementation was completed in-process
instead, verified real via a full `npm test` run (3619/3622 pass, across
two runs).

## What this means for anyone dispatching to `agy`

Two independent failure modes, confirmed by two separate live incidents,
mean `agy` should not be trusted as safe for real dispatch — especially
fan-out across multiple items concurrently — on `exit 0`/success alone. A
verification step against the real branch/commit target after any `agy`
success report is the honest mitigation until `agy` itself is proven more
reliable, not just the one config fix this item made.

## The second failure mode's root cause found (`tsk-1up`)

A dedicated investigation traced `tsk-539`'s timeout to its real source:
`agy`'s own print-mode carries its own `--print-timeout`, defaulting to
5 minutes, **independent of** the outer 15-minute spawn timeout
(`.fgos/config.json`'s `runner.timeoutMs`) — so a genuinely heavy coding
task could exceed `agy`'s own internal wait long before the outer spawn
timeout would ever fire. Confirmed by a live repro that reproduced the
real `tsk-539` failure byte-for-byte. Fix: `--print-timeout 10m` added to
`agy`'s invocation args in `.fgos/config.json` — same one-line-config-fix
shape as the earlier `--new-project` fix. The real implementation was then
successfully dispatched through `agy` itself on the first attempt after
the fix.

A second confirmed occurrence of the exact same error (`tsk-37d`,
2026-08-20, a different item than `tsk-539`) landed *after* this fix
shipped — same error string, same dispatch shape — but a retry with a
fresh `agy` invocation succeeded cleanly on the second attempt. This
closes part of the "only one observation" gap this investigation started
with (now two confirmed live occurrences, both on `fgos-coding-implement`'s
out-of-process dispatch via `agy`) without fully resolving whether the
timeout is now rare-but-real or still needs a retry/circuit-breaker layer
in front of the Step C inline fallback.

Landing this fix also hit two real, unrelated operational snags worth
naming: an `fgos-write-rejected` refusal on the first return attempt (the
branch had picked up a `.fgos/config.json`-only commit — forbidden under
ADR0020, a branch may never carry a `.fgos/` change — fixed by dropping
that commit and deferring the real config change to a direct main-checkout
commit); and a flaky `test/runner/session.test.mjs` lock-timeout under
full-suite contention on the second return attempt, confirmed
non-deterministic (not a regression) via two clean isolated re-runs before
a third full-suite attempt passed clean.

## Source

`tsk-it0`. `docs/history/agy-cwd-fidelity/` and `docs/history/
dispatch-proof-agy/plan.md` (`tsk-1fk`) carry the fuller incident records.
Verify: a live repro spawning `agy` from two independent directories,
confirming each reports its own actual spawn `cwd`.
