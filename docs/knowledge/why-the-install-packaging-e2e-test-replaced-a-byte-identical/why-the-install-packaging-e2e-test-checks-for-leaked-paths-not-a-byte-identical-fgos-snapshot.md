---
type: explanation
title: Why the install-packaging e2e test checks for leaked paths, not a byte-identical .fgos snapshot
tags: [testing, e2e, install-packaging, concurrency, flake]
source_capture_ids: [tsk-1u77]
authoritative_for: why the install-packaging e2e test replaced a byte-identical before/after .fgos snapshot diff with a leaked-path scan
framework: diataxis
mode: explanation
---
# Why the install-packaging e2e test checks for leaked paths, not a byte-identical `.fgos` snapshot

`tsk-1u77`. `test/install-packaging.test.mjs`'s e2e test ("npm pack ->
npm install -g -> fgos init from a fresh external cwd") originally
snapshotted `REPO_ROOT/.fgos` before and after the external `fgos init`
call and diffed them byte-identically (`diffSnapshots`), assuming
single-writer isolation on the source repo's own `.fgos/` for the
duration of the test. On a real dev machine, that assumption doesn't
hold — other concurrent sessions genuinely write to the same repo's
`.fgos/` during a multi-second npm-subprocess window, and those writes
are durable (a real event lands in `events.jsonl` and stays), not
transient noise that clears up if you wait.

## Why retry/quiesce — the other considered direction — was rejected

Waiting and re-snapshotting would never make a legitimate concurrent diff
disappear, since the diff isn't a race artifact. Retrying only helps with
a read racing a write mid-flush, which wasn't the actual failure mode:
at diagnosis time, the offending file's mtime was already 9 seconds
old — the write had already landed and settled well before the
comparison ran.

## The fix: `assertNoLeakedPaths`

The byte-identical snapshot diff was replaced with a scan
(`assertNoLeakedPaths`) over every file under `REPO_ROOT/.fgos` (after
the external `fgos init` ran) for the external test's own tmp paths
(`externalCwd`/`installPrefix`/`packDir`) appearing anywhere in their
content. This proves the actual invariant the test cares about — the
external process's artifacts never leaked into the source repo's own
store — without requiring the source repo's `.fgos/` to be quiescent
during the test's window at all.

## Why this is still a real check, not a weakened no-op

The external `fgos init` call's own `cwd` isn't even a git repository in
this test, and `dataDir()`'s resolution for a plain `init` (no `--dir`)
is purely `path.join(cwd, '.fgos')` — no main-checkout-walk logic at all.
So there is genuinely no code path today by which this specific call
could reach `REPO_ROOT/.fgos`. What the new assertion still catches is
exactly the failure mode a real regression in that resolution would
produce: the external process's own paths leaking into the source repo's
files — the real thing worth guarding against, just proven a different
way than a snapshot diff that happened to also be sensitive to unrelated
concurrent activity.

## Status of the item's own original premise

The item had earlier been flagged as refuted (2026-08-09 scan: the test
was passing at that point in time) — but re-scanning found the
underlying single-writer-isolation assumption was still real and still
worth fixing properly, rather than leaving the test's health dependent on
how quiet the dev machine happened to be at any given run.
