---
phase: 2
title: "Review agy invocation args dropped in the move to the generic form"
status: pending
priority: P2
effort: 1h
depends_on: [P1 stopgap if applied]
touches: global config (runner.executors.gemini.invocations), owner approval
---

# Phase 2: Review agy invocation args

## Context

The config backup `~/.fgos/private/config-backup-261117-tetcu72/config.global.before-agy.yaml`
(args lines only were read) shows these old gemini invocations:

| old id | confined | args |
|--------|----------|------|
| `agy-cli-mucdong`, `agy-cli-tetnu` | no (env HOME pinned) | `-p {prompt} --mode accept-edits --new-project --print-timeout 30m --model {model}` |
| `agy-cli-bwrap-mucdong` | bwrap | `-p {prompt} --model {model}` |
| `agy-herdr-mucdong` | bwrap | `--mode accept-edits --new-project --model {model}` |

The new `agy-cli-bwrap` took the args of the old **confined** cli form. So compared with the old
confined form nothing regressed. Compared with the unconfined form, it lost `--mode accept-edits`,
`--new-project` and `--print-timeout 30m`. `agy --help` (local, no quota) says:

- `--mode`: execution mode `accept-edits|auto|plan`. Without it, a headless `-p` writer may stop to
  ask for permission or refuse edits. **[UNVERIFIED for -p]**
- `--new-project`: creates a new project for the session. It avoids agy's per-folder project
  binding, and `agy-herdr` already passes it.
- `--print-timeout`: "0 waits until the turn completes (default 0s)". Dropping it is benign,
  because the runner's own timeout bounds the run.

## Requirements

- `agy-cli-bwrap` must serve writer units (`workspace-write` posture) the same way `agy-herdr` does.
- The args of the two agy invocations differ only where the transport demands it (`-p {prompt}` for cli).

## Steps

1. Decide from the facts above: add `--mode accept-edits --new-project` to `agy-cli-bwrap`, which
   matches `agy-herdr` and the old cli form. Do not restore `--print-timeout` (benign, the runner
   bounds it).
2. Back up `~/.fgos/config.yaml` to `~/.fgos/private/config-backup-<YYMMDD-HHMM>-agy-args/`.
3. Write the whole gemini sequence: `fgos config set --global runner.executors.gemini.invocations
   '<flow list: agy-cli-bwrap with new args, agy-herdr unchanged or with the P1 stopgap>'
   --reason "agy headless form passes accept-edits and new-project like the pane form so writer units can edit"`.
   If the door refuses because nested notes would be lost, run `fgos config unset --global
   runner.executors.gemini.invocations --acknowledge-comment-loss --reason ...` and then `set`
   immediately, with no runs in flight.
4. Run `fgos config check` (no new finding under gemini), `fgos doctor`, and
   `fgos dispatch explain --for code:implement` (gemini still binds).
5. **Owner-gated probe (quota):** `fgos dispatch probe-account --provider gemini --account tetcu72 --leg harness`.
   Expected: `agy-cli-bwrap` is `ok`. A read-only prompt proves the flags parse. The optional writer
   proof is P3 step E.

## Validation

`fgos config show --path runner.executors.gemini.invocations` shows the new args, and the probe row
is `ok`.

## Risk

`--mode accept-edits` under the read-only posture could make agy try writes that the sandbox
refuses: L x L, because bwrap is the boundary and `agy-herdr` already runs that way. A wrong
flag name would refuse at launch: the probe catches it.

## Rollback

Restore the sequence from the backup with `fgos config set --global` (same path, old flow value).
