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
- [phase-01-logs-bucket.md](phase-01-logs-bucket.md) — move the 4
  tracked diagnostic files into `.fgos/logs/`, untrack them, update
  every writer/reader path + test + living doc. **Doing now.**
- Phase 2 (not written, backlog only): `cache/` for `state.json`,
  `runtime/` for `sessions.json`/`tool-status.local.json`/`*.lock`/
  `events-jsonl.truncation-guard.json`. Purely organizational (all
  already gitignored) — revisit only when touching that code for
  another reason, to avoid unrelated regression risk.

## Acceptance criteria
- `git status` no longer shows the 4 files at `.fgos/` root after a
  normal session (they write under `.fgos/logs/` instead).
- `git ls-files` no longer lists the 4 old paths.
- `npm test` green.
- CHANGELOG.md `[Unreleased]` updated (user-visible path change).
