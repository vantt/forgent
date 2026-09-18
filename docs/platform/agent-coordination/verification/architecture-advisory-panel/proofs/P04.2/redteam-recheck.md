# P04.2 Red-Team — recheck of fix round 1

Re-verification of commits `a5112f76` + `32ef2dd6` against my own round-1
findings. I re-ran everything live rather than reading the Doer's report or
replaying the committed logs.

**Verdict: blocker fixed, 3/3 WEAK fixed, new-gap claim verified real.**
One new, non-blocking observation at the end.

---

## 1. RT-P04.2-08 (BLOCKING) — fixed, independently reproduced

I did not trust the committed `show-final.json`. I built a fresh sandbox with
two registered executors (`exec-family-a`/`exec-family-b`, mirroring the
conformance suite's own fixture so tier→model differentiation is real), copied
the six committed request files, and **rewrote the coordinationId** to
`rt_recheck_full` so nothing could resolve against their session state. Then I
ran all six as six separate CLI invocations.

```
CALL 1 (request-1-open.json)           EXIT=0
CALL 2 (request-2-critique.json)       EXIT=0
CALL 3 (request-3-synth.json)          EXIT=0
CALL 4 (request-4-redteam-explain.json) EXIT=0
CALL 5 (request-5-dialogue.json)       EXIT=0
CALL 6 (request-6-close.json)          EXIT=0

fgos coordination show rt_recheck_full --json
  status: completed
  quorum.missing: []
  eventCount: 42
  assignmentRefs: 12
  humanTurns: 1
```

Twelve real assignments — twelve rounds — across six invocations, reaching
quorum completion. Crucially I confirmed from the event log that **Phase 9
genuinely dispatched**, rather than the session merely surviving to the end:

```
2 "operationId":"revise-synthesis"
2 "operationId":"close-dialogue"
```

Both operations that were unreachable in round 1 now run. The exact failure I
reported — `createSessionAssignment: ... already used 10 round(s)
session-wide` — does not occur anywhere in the six calls.

The doc fix is where it needs to be: the how-to now carries a dedicated
section (`## The platform's default round cap is too low for this protocol —
raise it`) that states the mechanism, the ten-operation arithmetic, the exact
refusal string, and the `close-dialogue`/quorum consequence. All opening
request fragments across the examples now declare
`{"maxRounds": 20, "maxAssignments": 30}`.

## 2. My three WEAK items — 3/3 fixed

**RT-P04.2-07 (citation drift) — fixed, and re-grounded rather than
relabeled.** `alternative-and-composite-reopen.md`'s "Real starting material"
now names the three real proposals correctly, with the alternative shaper's
two arms identified as arms of one proposal. I verified the three new
quotations verbatim against the real artifacts rather than accepting the
restructure at face value:

- `proposals/system-shaper.md:17` — "Keep the desktop shell a thin client. Do
  not begin local ownership work now."
- `proposals/alternative-shaper.md:28` — "defer any architectural shift until
  a verifiable metric ... proves that the HTTP daemon hop is an actual
  bottleneck"
- `proposals/constraint-advocate.md:44` — "Show connecting, connected, and
  failed states with actionable diagnostics."

The constraint advocate's candidate, which round 1 found missing entirely, is
now present as a distinct proposal.

**RT-P04.2-09 (`clear-start.md` models the collapse it forbids) — fixed,
beyond what I asked.** The flagship request now carries `actors[]`, so it no
longer demonstrates the collapse at all, and it states the cost explicitly:
*"without it, every one of the 8 roles above would have resolved through this
host's single global default executor — the exact 'collapses the panel to one
session-wide provider' failure `SKILL.md` and phase-04's own Requirements
forbid."*

**RT-P04.2-10 (reopen budget header) — fixed.** The column header now reads
`Costs a reopen invocation?`, consistent with the per-binding cap the body
describes and that I confirmed live in round 1.

## 3. The new gap the Doer claims — real, and I reproduced it

This is the item I was most prepared to reject as plausible-sounding. It
holds, on both the code path and live.

**Code.** `src/verbs/coordination/run.mjs:437` builds per-step policy from the
*current* request only:

```js
const actorEntry = step.targetActorId ? findActor(request.actors, step.targetActorId) : undefined;
const cliPolicy = actorPolicyFields(actorEntry, { globalExecutor: cliExecutor, globalTier: cliTier });
```

`findActor` reads `request.actors` — never the manifest, never an earlier
call. When a resumed request omits `actors[]`, `actorEntry` is `undefined`,
`actorPolicyFields` returns `{}`, no `cliPolicy` is passed, and dispatch falls
through to the global default.

**Live.** Same session, same protocol, two calls:

```
CALL 1 (actors[] declares exec-family-b):
  "executor": "exec-family-b"   "provider": "family-b"   "tier": "critical"

CALL 2 (identical session, actors[] OMITTED):
  "executor": "/home/vantt/.local/bin/node"   "provider": "claude"   "tier": "standard"
  EXIT=0
```

Exit 0. No warning, no error. In this repository the global default is the
unconfined, git-write-capable `claude -p ... --permission-mode acceptEdits`
invocation `SKILL.md`'s Executor Roster WARNING is about. So a coordinator who
does everything right at open, and then resumes with a reopen or close
fragment that drops `actors[]`, silently un-confines that role for that
dispatch. That is a sharper failure than my own RT-P04.2-09, because it
survives a correct opening request.

**I also verified the asymmetry the docs now assert**, since it is a new claim
in its own right: `aggregateBounds` *does* persist while `actors[]` does not.
Their own calls 2-6 omit `aggregateBounds` entirely (`grep -c` returns 0 for
all five), and my independent probe resumed a session to 13 rounds without
ever re-declaring it — well past the default cap of 10, exit 0. The
asymmetry is real and correctly characterized in the guide.

## 4. Focused suite

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' \
  'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'

tests 757 | pass 757 | fail 0 | EXIT=0
```

Ran it myself. Matches the expected 757/757.

## 5. New observation — the mechanical guard `clear-start.md` cites is
currently non-signalling

Not a regression from this cell, and not blocking, but it undercuts a claim
the cell now makes. `clear-start.md` says its shipped fixture is *"covered by
this repository's own `coordination-example-requests-valid` doctor check, so a
future regression like an empty `grantedContextRefs` or a dropped
`aggregateBounds` in the opening request shape is caught mechanically, not
just by review."*

The check exists and does validate the new fixture — but it is **already
failing**, and has been since before this cell:

```
"id": "coordination-example-requests-valid",
"passed": false,
"message": "group-thinking-nominal-group-lite-resume-request.json: fails
validateCoordinationRequest (... \"<the share assignmentId from the first
call's own result>\" contains characters outside the safe filesystem
charset ...); group-thinking-rfc-review-lite-resume-request.json: ..."
```

Both named fixtures come from `7914e807` (the earlier fgos-group-thinking
guide commit), not from P04.2 — they carry human-readable placeholder tokens
where a real ref belongs. This cell's own fixture is not among the failures.

The consequence is narrow but real: the check reports one aggregate
pass/fail, and it is already red, so a future regression in *this* cell's
fixture would flip nothing that anyone is watching. The guard validates
correctly but cannot signal. Fixing the two stale sibling fixtures would make
the mechanical guarantee `clear-start.md` promises actually operative.
Suggested as follow-up work outside P04.2, since the defect is inherited.

## Unresolved questions

- Should `actors[]` non-persistence be closed in the kernel (persist the
  opening roster on the manifest, or refuse a resumed dispatch that would
  silently downgrade a previously-confined actor) rather than carried as a
  documented discipline? Documenting it is the right call for this cell, but
  "repeat it on every call or you silently lose confinement" is a sharp edge
  that prose alone will not hold across many sessions. That is a Phase 03
  kernel question, not a P04.2 one.
- The two stale group-thinking fixtures above need an owner.

## Reproduction

`/tmp/claude-1000/-home-vantt-projects-forgentX/1b6fb381-92ae-4764-b75e-f1a39844aa49/scratchpad/rt-recheck/`
— sandbox config, the six rewritten request files, all six call outputs, and
the `actors[]`/`aggregateBounds` persistence probes (`gap-1`, `gap-2`,
`gap-3`). Sessions `rt_recheck_full` and `rt_gap_actors`.
