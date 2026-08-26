# events-jsonl-truncation-force-rebaseline — plan.md

Mode: high-risk (data model — this touches the exact safety mechanism that
protects the shared event log from silent data loss; existing covered
behavior — `test/state/events-jsonl-truncation-guard.test.mjs` already has
dedicated coverage of `advanceEventsJsonlTruncationGuard`'s "never move
past a break" behavior, which must stay unchanged; weak proof around the
area — this exact area has already caused real, confirmed data loss
multiple times; a bug in the NEW force-rebaseline path itself could mask a
future real break if written carelessly, which is the single highest-
consequence mistake possible in this file).

## Approach

RESEARCH.md Round 1 already root-caused and live-remediated the immediate
break (main checkout's real guard sidecar is force-rebaselined manually;
`fgos doctor` already confirmed passing). What remains is making that
remediation REPEATABLE via real, committed code instead of a one-off
manual script, and fixing the doc that currently describes a capability
that does not exist.

`discoverGuardedFiles` (`src/state/events-jsonl-truncation-guard.mjs:233`,
private) already enumerates every tracked file the SAME way
`runOpportunisticMainCheckoutChecks`'s own D1 loop and the doctor check
(`checkEventsJsonlNotTruncated`, `src/setup/registrations.mjs:1158`) do —
reuse it directly (same file, no new export needed) rather than
re-deriving file discovery a third way.

Files touched: `src/state/events-jsonl-truncation-guard.mjs` (new function),
`scripts/events-jsonl-truncation-guard.mjs` (new CLI mode),
`docs/how-to/resolve-an-events-jsonl-truncation.md` (corrected command),
`test/state/events-jsonl-truncation-guard.test.mjs` (new tests).

Risk map: high. Proof point required: (1) the existing "never move past a
break" test(s) for `advanceEventsJsonlTruncationGuard` must stay green,
completely unmodified — this plan must not touch that function's own
behavior at all, only ADD a separate, explicitly-named force path; (2) a
new test must prove the force path genuinely moves a BROKEN mark to the
current tip (not just a clean one, which would prove nothing new); (3) a
new test must prove the force path is never reachable from
`runOpportunisticMainCheckoutChecks`'s own automatic path — it is only
ever invoked by an explicit CLI flag, matching the runbook's own "a
deliberate, human-run step, never an automatic `doctor --fix`" framing
already documented for this whole area.

Alternative rejected: changing `advanceEventsJsonlTruncationGuard` itself
to accept a `force` option instead of adding a new function name.
Rejected — every existing call site (the opportunistic checks, the
doctor check) calls this function positionally with 3 args and relies on
its CURRENT "never advance past a break" behavior being the only thing it
ever does; adding a force branch to the SAME function increases the
chance a future caller passes the option by accident (or a copy-pasted
call site silently inherits it), exactly the kind of mistake this file's
own high-risk classification above warns against. A distinctly-named
function (`forceRebaselineTruncationGuard`, taking a whole `fgosDir`
rather than one file, since the runbook's real use case is always "fix
everything doctor is currently complaining about," not one file at a
time) is unambiguous at every call site.

## Shape

1. In `src/state/events-jsonl-truncation-guard.mjs`, add
   `forceRebaselineTruncationGuard(fgosDir, guardPath)`: iterate
   `discoverGuardedFiles(fgosDir)`, skip any file that does not exist on
   disk (mirrors `checkEventsJsonlNotTruncated`'s own `existingFiles`
   filter), and for each remaining file: read it, `computeGuardMark`,
   `writeGuardMark` UNCONDITIONALLY (regardless of whether the file was
   previously broken) — this is the one and only place in this module
   that ever writes a mark without first checking `report.ok`. Return a
   summary `{rebaselined: [{fileKey, mark}], skippedEmpty: [fileKey,...]}`
   for the CLI to report plainly (never silent).
2. In `scripts/events-jsonl-truncation-guard.mjs`, add a `--force-rebaseline-all
   <fgosDir> <guardPath>` mode (distinct token from `--advance`, never a
   flag ON `--advance` — same "no ambiguity at the call site" reasoning as
   above), printing the returned summary as JSON, same shape/exit-code
   convention (`process.exitCode = 0`, this mode always "succeeds" once it
   runs — there is no not-ok outcome for an unconditional write) as the
   existing `--check`/`--advance` modes.
3. Update `docs/how-to/resolve-an-events-jsonl-truncation.md`'s step 3:
   correct path (`.fgos/runtime/events-jsonl.truncation-guard.json`,
   citing `FGOS_FILE.GUARD_MARK`) and the new command:
   ```bash
   node scripts/events-jsonl-truncation-guard.mjs --force-rebaseline-all .fgos .fgos/runtime/events-jsonl.truncation-guard.json
   ```
   Keep the surrounding prose (steps 1/2/4, the "why this is different
   from a merge-conflict break" section) — only step 3's own command and
   path are wrong today.
4. Add tests to `test/state/events-jsonl-truncation-guard.test.mjs`:
   (a) `forceRebaselineTruncationGuard` moves a genuinely BROKEN file's
   mark to its current tip (construct a break the same way the existing
   `regressed`/`content-mismatch` tests already do, then force-rebaseline,
   then assert a fresh `checkEventsJsonlTruncationGuard` call against the
   SAME file now reports `ok: true`); (b) a clean/bootstrap file also
   works (no regression on the easy case); (c) confirm
   `runOpportunisticMainCheckoutChecks` never calls this new function
   (a grep-based or call-count assertion, or simply: the existing
   opportunistic tests already fully exercise that function without this
   one ever being invoked — no NEW test strictly required here beyond
   making sure the new function is never imported into that function's
   own module scope in a way that could get called from it — a code-read
   confirmation, not necessarily a runtime assertion).
5. Run the full test file, not just the new cases.

## Outstanding questions

None.
