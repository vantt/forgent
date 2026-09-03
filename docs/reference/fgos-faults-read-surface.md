---
authoritative_for: fgos faults verb, invocation-fault side log read surface, what counts as an invocation fault
---

# `fgos faults` — reading the invocation-fault side log

`fgos faults` is the read surface for a side log (`.fgos/`-resident,
never `events.jsonl`) recording malformed CLI **invocations** — distinct
from a **business refusal** (item not found, Iron Law trip, lock held),
which is a correct handler answer and stays stderr-only, unrecorded. The
write side (`src/cli/invocation-fault-log.mjs`, `recordInvocationFault`)
landed earlier (`tsk-5z0`, `docs/history/cli-invocation-fault-
provenance/`); `tsk-1wdf` added this read verb as the separate follow-on
work that item's own D6 explicitly deferred.

## What actually gets recorded

Only what the CLI's single failure handler can observe *before* a verb's
handler ever runs: an unknown verb, the `requiresExistingStore` refusal,
the `init`-inside-worktree refusal, `dataDir`/`--dir` faults, and
arg-parse faults. **Missing-required-flag and invalid-id faults are
explicitly NOT covered** — despite looking like invocation faults, they're
validated *inside* each of the 73 hand-rolled handler sites,
positionally indistinguishable from a business refusal without either
message-string matching (rejected — couples the log to 73 wordings) or
enforcing the command registry's `required` field at dispatch (deferred
to a separate consolidation item). This is an honest, narrower scope than
the log's own name might suggest — check before assuming a given failure
class is covered.

## Provenance captured

Only free signals already available at the point of failure, no new
caller-side contract: `resolveWriterIdentity()`'s `{id, source}`, the raw
`argv`, and the `cwd`. This answers "which session, what command, from
where" — never "which skill called this" or "which slash-command
originated it," since that needs a caller-side declaration outside this
log's scope.

## Where it's written, and why never inside a worktree

When the resolved `.fgos/` is missing or is a linked worktree, the log
resolves the main checkout the same way fgOS skills' own gate checks do
(`git rev-parse --path-format=absolute --git-common-dir`) and records
there — never inside a worktree, honoring ADR0020 and not defeating the
phantom-store guard that refuses `.fgos/` creation inside one.

## The CLI verb

```bash
fgos faults [--limit <n>]
```

Reads the log path via `resolveFaultLogPath(dir, process.cwd())`; if the
log doesn't exist yet, returns `{ path, count: 0, records: [] }` rather
than erroring — an empty fault log is a legitimate, expected state, not a
failure.
