---
authoritative_for: fgos catchup/approve .fgos structural deadlock when main advances past worker branch fork point, repeated identical fgos-write-rejected block, formatFgosWriteRejectedDetail
---

# `fgos catchup`/`approve` can deadlock identically forever — the error now says why

`tsk-2f6` closed part of a real, deeply-confirmed structural bug: `fgos
catchup` and `fgos approve` can produce a **structural deadlock** on
`.fgos/*` when `main` has advanced past a worker branch's fork point,
with no detection or warning that repeats are happening.

## The mechanism

`performCatchUp` (`src/runner/merge.mjs`) merges inside an ephemeral
worktree that `worktree.mjs` has already stripped `.fgos/` from entirely
(per ADR0020) — so the merge result always uses `.fgos/*` from the
**worker branch's own frozen, committed blob**, never adopting main's
current content. `approve`'s own check then unconditionally rejects
*any* `.fgos/*` diff in the merge result, with no distinction between
"the worker branch itself changed the value" (a real violation) and "the
worker branch is simply behind — only `main` has changed since the fork
point" (not really a worker write at all). Combined: once `main` changes
any `.fgos/*` path (e.g. `.fgos/config.json`) after a worker branch's
fork point, `catchup`+`approve` loop with **identical output every
time** — `catchup.mjs` had no retry counter or repeat-block detection to
tell "a temporary, retryable race" apart from "a structural deadlock
needing direct operator intervention on `.fgos/`."

## Confirmed live, at real cost

During `tsk-3ti`'s own implement/merge cycle: the identical block
repeated 3 times in a row (same two paths, `.fgos/config.json` +
`.fgos/events.jsonl.backup-*`, same diff stat) before it was recognized
as structural rather than a timing race — a real, significant debugging
time cost.

## What shipped — the smaller of the two proposed fixes

The item's own description proposed two directions: (a) making
`approve`'s `.fgos` diff check distinguish worker-authored changes from
main-only-advanced changes and auto-adopt the latter, or (b) tracking
repeated identical `fgos-write-rejected` blocks and switching the
message once a threshold is crossed. **Neither shipped as originally
scoped** — a smaller "tiny mode" fix landed instead: a shared
`formatFgosWriteRejectedDetail(branch, paths, targetLabel)` helper now
always names the recovery playbook
(`docs/how-to/fix-fgos-write-rejected-merge-block.md`) directly in the
block's own message, on every occurrence — not gated behind a repeat
counter or threshold. Both `approve` and `sync-root` now emit this same
consolidated message.

## The referenced recovery doc does not exist on disk

`docs/how-to/fix-fgos-write-rejected-merge-block.md`, the exact path the
new message points to, was not found anywhere in this repo at synthesis
time. The underlying structural deadlock mechanism itself — main-
advanced `.fgos/*` paths causing an unbreakable identical-repeat loop —
remains unaddressed beyond this message change; a person hitting it
today gets pointed at a recovery playbook that has not yet been written.
