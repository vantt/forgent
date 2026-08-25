# `.fgos/` diagnostic-log bucketing

## Status
Phase 1: done — 5 files moved to `.fgos/logs/`, path resolvers/tests/docs
updated, dead `.gitattributes` union rules removed, `npm test` green
(4023 pass, 0 fail). Not yet committed — pending user go-ahead.
Phase 2: deferred (see below).

## Context
`git status` stays dirty continuously because 4 diagnostic/telemetry
jsonl files are git-tracked at `.fgos/` root and rewritten on nearly
every command: `approve-post-success-faults.jsonl`,
`main-checkout-guard-warnings.jsonl`, `changelog-nag-history.jsonl`,
`entropy-history.jsonl`. None of these is the event log (source of
truth, protected by D1) — each is a standalone diagnostic record its
own author explicitly kept out of `events.jsonl`'s write path.
`.gitignore` already reserves `.fgos/logs/` (D4, worker-dispatch-log,
unused today) — this plan reuses that bucket instead of inventing a
new one.

`state.json`, `sessions.json`, `tool-status.local.json`, `*.lock`,
`events-jsonl.truncation-guard.json` were also considered for
`cache/`/`runtime/` buckets, but are **already gitignored** — moving
them fixes no dirty-tree problem and only adds regression risk to
concurrency-critical code (`session-identity.mjs`,
`main-checkout-lock.mjs`). Deferred to Phase 2, not part of this pass.

## Phases
- [phase-01-logs-bucket.md](phase-01-logs-bucket.md) — done, committed
  (`dcaa6dee`).
- [phase-02-cache-runtime-bucket.md](phase-02-cache-runtime-bucket.md) —
  done (partial by design). `tool-status.local.json` and
  `events-jsonl.truncation-guard.json` moved to `.fgos/runtime/`.
  `state.json` → `.fgos/cache/` attempted and reverted (51 test
  failures from 21 files hardcoding the old path, zero dirty-tree
  benefit). `sessions.json`/lock files never attempted (on the git
  hook's own live import path — too risky for zero benefit).
- [phase-03-shared-path-registry.md](phase-03-shared-path-registry.md) —
  done. Built `src/state/fgos-file-registry.mjs` (kernel layer, one
  resolver + lookup table) so no module/test ever hardcodes a `.fgos/`
  file path again; retried and landed the `state.json` → `.fgos/cache/`
  move on top of it. `npm test` green (4023 pass, 0 fail).
  `sessions.json`/lock files still not attempted (unchanged reasoning).

## Acceptance criteria
- `git status` no longer shows the 4 files at `.fgos/` root after a
  normal session (they write under `.fgos/logs/` instead).
- `git ls-files` no longer lists the 4 old paths.
- `npm test` green.
- CHANGELOG.md `[Unreleased]` updated (user-visible path change).
