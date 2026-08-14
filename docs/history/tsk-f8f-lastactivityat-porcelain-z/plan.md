# plan: tsk-f8f — lastActivityAt parses porcelain -z, never quoted paths

Mode: standard

Flag count/lane: 1 explicit flag (existing covered behavior —
`test/runner/claim-liveness.test.mjs`/`claim-port.test.mjs` both carry real
suites for `lastActivityAt`/`isReclaimEligible` and the stale-claim reclaim
pre-check that consumes them). No hard-gate flag in the report's own
mechanical sense — but the failure mode itself is a real safety concern
worth naming honestly: it fails in the DESTRUCTIVE direction (a live
session's claim gets silently reclaimed and a second session can reattach
into the same still-in-use checkout), the opposite of this guard's own
documented fail-closed stance. Item's own `tier`/`risk` (`standard`/
`standard`, severity "low" per the report) still confirm standard lane —
the destructive direction is real but requires an unusual filename shape
(spaces/special chars) to trigger, matching the report's own "low"
severity call.

Direct-entry fallback: entered `planning` straight from a `clear` discovery
verdict — no `CONTEXT.md`/exploring round exists. `RESEARCH.md` round 1
stands in for it.

## Impact-analysis posture

Same as every sibling item this session: gitnexus `present` but 172 commits
behind HEAD — **degraded**. Not leaned on for this item: the fix decision
(switch to `-z` rather than unquote in place) came from an empirical
byte-level check of git's own actual output shape (`xxd`/`cat -A` against a
real repo), not blast-radius tooling — a case where direct experimentation
was the right evidence source, not code-graph analysis.

## Approach

**Chose the report's SECOND suggested option (`-z`) over the first
(unquote in place)** — RESEARCH.md round 1's own empirical check found
`-z` mode never quotes ANY path regardless of content, closing the whole
class of quoting/escaping bugs at the source instead of adding a
counter-parser for git's own C-style quote format. `git status --porcelain
-z` replaces `git status --porcelain` (no `-z`) at the one call site
(`lastActivityAt`).

**Parsing shape, confirmed empirically, not from documentation alone:**
each record is NUL-terminated `XY<space>path` (`status = entry.slice(0,
2)`, `path = entry.slice(3)`) — never newline-terminated, so a path
containing a literal newline can't be mistaken for a record boundary
either, a second correctness gain beyond the report's own named scenario.
A rename/copy record (`status` includes `R` or `C`) is followed by ONE
MORE NUL-terminated token holding the origin path — skipped, exactly
mirroring the old code's own behavior of taking only the destination path
from a `"orig -> path"` line, never the origin.

**Why this closes the failure scenario, not just papers over it:** the old
code's silent per-entry skip (`catch { /* skip */ }`) was itself correct
design for a genuinely stale/deleted file between the two git calls — the
bug was never in that catch, it was that a mis-parsed quoted path ALWAYS
hit that catch for a false reason (`statSync` on a name with a stray
trailing quote can never succeed). `-z` mode removes the false trigger
entirely; the catch itself is untouched and still correctly covers the
real "listed then deleted" race it was written for.

## Risk map

| Component | How risky | Proof point |
|---|---|---: |
| The `-z` parse (record splitting, rename-token skip) | Medium — must correctly handle a plain entry, a rename entry, AND continue to correctly skip a genuinely-deleted-between-calls file (the pre-existing catch) | Two new tests reproducing Finding 9's exact scenario: an untracked file with a space in its name (the report's own named case), and a rename into a spaced filename (exercising the `-z` rename record's extra origin-path token specifically — the new evidence this round's empirical check surfaced) |
| Every other existing `lastActivityAt`/`isReclaimEligible` test (no branch, no live worktree, plain uncommitted file, `.fgos` exclusion, reclaim-threshold boundaries) | Low — must stay byte-identical | Full existing `claim-liveness.test.mjs` (9 tests total, 7 pre-existing + 2 new) and `claim-port.test.mjs` (16 tests, the stale-claim reclaim pre-check's own consumer) rerun unchanged |

## Shape

Single piece, no split — one call-site flag change plus one parser
rewrite, already implemented and verified.

Verify (already synced onto the item at discovery, real and runnable):
```
node --test test/runner/claim-liveness.test.mjs test/runner/claim-port.test.mjs
```

## Outstanding questions

None
