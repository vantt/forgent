---
type: explanation
title: Why mergeRunnerItem's commit-failure error now carries git's real stderr
tags: [merge, approve, error-handling, diagnosability]
source_capture_ids: [tsk-50i7]
framework: diataxis
mode: explanation
---
# Why `mergeRunnerItem`'s commit-failure error now carries git's real stderr

`mergeRunnerItem`'s two catch branches around `git(repoRoot, ['commit',
'--no-edit'])` threw a `MergeError` carrying only `err.message` — the
generic `execFileSync` wrapper text (`Command failed: git commit
--no-edit`), never the real git reason (hook rejection, nothing to
commit, missing identity, ...) that lives on `err.stderr`. This was a
divergence from the same file's own established convention, not a
general gap: `merge.mjs`'s own `git()` helper already runs every
subprocess with `stdio: ['ignore', 'pipe', 'pipe']`, so stderr was always
captured — just never used at these two call sites. A sibling catch
branch in the very same file already did it correctly:
`{ message: err.message, stderr: err.stderr ?? null, status: err.status
?? null }`. Further precedent for `err.stderr` as the established way to
surface subprocess failure detail exists across `loop.mjs`,
`github-adapter.mjs`, and `bin/fgos.mjs`.

## Why this mattered

On 2026-08-10, `fgos approve tsk-4qu` failed twice with exit 9 and this
exact empty-detail message. With no diagnosable output, the only path
forward was reading code, forming a hypothesis (a pre-commit hook
rejecting due to a lock identity conflict), disproving it by running the
hook directly, and finally hand-reproducing the merge with a raw `git
merge --no-commit --no-ff` + `git commit` outside the verb entirely —
which then succeeded, landing the merge **outside** `fgos`'s own
one-door-write contract. Why the original commit failed twice that day
is still unknown; the evidence is gone. Had the error message already
carried `err.stderr`, none of that detour would have been necessary.

## The fix, and what stayed deliberately out of scope

Both commit-failed catch branches now attach `err.stderr ?? null` and
`err.status ?? null` to the thrown `MergeError`'s details, matching the
existing same-file precedent's shape exactly (D2) — no new shape
invented. No control-flow change: merge still aborts cleanly on failure
and `main` stays untouched; this only adds information to the error.
Stderr is never printed to the verb's own stdout, since that would
corrupt the JSON output the verb returns (the same failure mode `tsk-mgb`
already documented for main-checkout-lock's own progress lines).

The same `err.message`-only gap exists at five other throw sites in the
same file (`merge.mjs:372`, `:744`, `:909`, `:930-931`, `:943`) — this
item's own scope, matching its explicit "VIỆC CẦN LÀM" text, targeted
only the two commit-failed branches (D1). Widening to the other sites
was deliberately deferred, not silently expanded — a candidate follow-up
only if a future incident makes one of them diagnostically necessary the
same way this one did for the commit-failed branches.

## Related

- `docs/history/tsk-50i7-merge-commit-stderr-swallowed/CONTEXT.md` — the
  full decision record (D1: scope exactly the two commit-failed
  branches; D2: shape matches the existing same-file precedent) and the
  deferred-scope list of the other five throw sites.
