# P10-KERNEL-FIX — Reviewer Recheck 2 (independent verification of Fix Round 2)

Reviewer, 2026-09-04. Independent recheck of the seven findings §9 accepted and
§10 claims to have fixed. Nothing below is taken from the Fixer's narration:
every claim was re-derived from the real file, a scratch copy of the tree, or a
probe/test run performed in this session.

**Verdict: APPROVE WITH CONCERNS.** All seven items are genuinely addressed in
the kernel and in the tests, and every one was independently falsified (a
deliberate revert produces a real failure; the real code produces a real pass).
The concerns are entirely in the evidence trail — one Gap whose stated scope is
factually wrong and materially understates what it covers, one section (§7.5)
left describing superseded code and citing a test that no longer exists, one
quoted command output that does not reproduce, and one unnamed residual on the
read path. No kernel code change is requested.

## 0. Method

- Read `classifySessionQuorum` (session-engine.mjs:3289-3319) and
  `actorGatingOperationIds` (session-engine.mjs:1376-1442) directly from the
  working tree, not from the §10 quote.
- Built a **hardlinked scratch copy** of the whole worktree at
  `.claude/worktrees/zz-recheck2-scratch` with `session-engine.mjs` unlinked to
  a private inode, so every revert experiment ran against real module
  resolution without ever mutating the real file. Verified by inode comparison
  before use, and the scratch tree was deleted afterwards. `git status --short`
  on the real worktree is unchanged from the session start.
- Wrote three probes of my own (`zz-probe.mjs`, `zz-probe-drift.mjs`,
  `zz-probe-runverb.mjs`) rather than reusing §7/§10's fixtures, driving
  `runCoordinationUseCase`, `evaluateSessionQuorum`,
  `showCoordinationUseCase` and `closeSessionByQuorum` against a temp-dir
  project-tier protocol.
- Ran each variant against three code states: real Fix Round 2, a
  reconstructed Fix Round 1 resolution block, and pre-fix `HEAD`
  (`git show HEAD:src/runner/coordination/session-engine.mjs`).

## 1. Item-by-item verification

### N1 — close must refuse on a resolution failure: **VERIFIED FIXED**

Code confirmed at session-engine.mjs:3302-3308: with
`opts.enforceDefinitionVersion` truthy and `resolved === null`, an explicit
`CoordinationError('validation', …)` is thrown. `closeSessionByQuorum` is the
only caller that sets that flag (session-engine.mjs:3500).

My own probe — a two-required-op protocol, `op-one` settled, `op-two` never
dispatched, worker-actor genuinely incomplete:

```
manifest status after dispatch of op-one only: active
  clean registry, close      : REFUSED [CoordinationError/validation] closeSessionByQuorum: … missing required actor(s) [worker-actor] …
  + malformed sibling, close : REFUSED [CoordinationError/validation] classifySessionQuorum: session "coord_probe_n1" was opened
                               against definition "…@1.0.0", but the definition could not be resolved -- refusing to close …
  manifest status now        : active
  bound protocol REMOVED, close: REFUSED [CoordinationError/validation] … could not be resolved …
  manifest status now        : active
```

Both resolution-failure flavours refuse; the session stays `active`. The read
path under the same broken registry does not throw.

Pre-fix `HEAD`, same probe, reproduces the bug this cell exists to kill:
`manifest status after dispatch of op-one only: completed` — HEAD closed the
session with `op-two` never performed at all.

### N2 / NEW-HIGH-A — a drifted read must report the pre-fix truth: **VERIFIED FIXED**

Code confirmed at session-engine.mjs:3316-3318: on the read path,
`definition = drifted ? null : resolved`.

Focused probe (`zz-probe-drift.mjs`): `worker-actor` settles **both** its
gating operations; a second `idle-actor` never acts, so the session stays
active and can be read before and after an in-place version bump. Same probe,
three code states:

| code state | AFTER drift, `evaluateSessionQuorum` | AFTER drift, `show` |
|---|---|---|
| pre-fix `HEAD` | `completed=["worker-actor"] missing=["idle-actor"]` | same |
| Fix Round 1 (reconstructed) | `completed=[] missing=["worker-actor","idle-actor"]` | same — **misreport** |
| Fix Round 2 (real) | `completed=["worker-actor"] missing=["idle-actor"]` | same |

Fix Round 2's drifted read is byte-equal to pre-fix `HEAD`, through
`showCoordinationUseCase`'s own path, not just the engine export. Fix Round 1's
misreport is independently reproduced. Close under drift still refuses with the
drift-attributed message; session stays `active`.

### NEW-HIGH-B — the MEDIUM-5 regression test must be falsifiable: **VERIFIED FIXED**

In the scratch copy I reverted the actor-keyed exclusion
(`ref.ref === aggregationOutputOperationRef && actorId === aggregationActorId`)
back to operation-id-only, exactly the pre-Fix-Round-1 shape:

```
✖ P10-KERNEL-FIX Fix Round 2 N4/NEW-MEDIUM-C (b) + NEW-HIGH-B: …
  AssertionError: actual: [], expected: [ 'analyst-actor', 'coordinator-actor' ]
ℹ tests 14  pass 13  fail 1
```

Restored to the real code: `tests 14, pass 14, fail 0`. The test now fails for
the right reason (both actors read complete under the bug), not through the
fallback path. Confirmed genuinely discriminating.

### N4 / NEW-MEDIUM-C — exclusion only when exactly one actor binds: **VERIFIED FIXED**

Code confirmed at session-engine.mjs:1417-1429 and the exclusion at :1435. Two
independent falsification runs in the scratch copy:

- Reverting **only** N4 (back to Fix Round 1's "first graph binding found"
  heuristic, leaving the actor-keying intact) → test (b) fails with
  `actual: ['analyst-actor'], expected: ['analyst-actor','coordinator-actor']`
  — i.e. coordinator-actor is silently excused again, exactly the ambiguity N4
  removes. Test (a) still passes, correctly: the single-actor case is
  unaffected.
- Disabling the exclusion entirely (`if (false && boundActorIds.size === 1)`) →
  test (a) fails, plus three pre-existing aggregation tests. Test (a) is
  therefore not a phantom test.

Test (b) also carries the anti-deadlock half through to a real close
(`third.closed === true` after both actors' `synthesize` settles), which I read
in full rather than trusting the summary. `boundActorIds` is guarded by
`ref.actor` truthiness, and `aggregationActorId` stays `undefined` for 2+
actors, so the exclusion predicate can never match a real actor id.

### N3, NEW-LOW-D, 2+-actors — named as Gaps: **PRESENT** (one is factually wrong — see §2)

All three are in §5 with concrete scenarios and stated reasoning, not one-line
mentions. N3's text, however, misstates when it fires; see finding **R2-1**.

### N5 — test-count correction: **VERIFIED CORRECT**

Counted directly, not trusted from either report:

```
git show HEAD:test/verbs/coordination-aggregation-surface.test.mjs | grep -c '^test('   -> 12
grep -c '^test(' test/verbs/coordination-aggregation-surface.test.mjs                    -> 14
```

"was 12 before this round's changes" is right. (12 at HEAD → 13 after Fix Round
1 → 14 after Fix Round 2's split.)

### HIGH-1 end-to-end: is the new error caught by `run.mjs`? **YES at the engine boundary; NO on the `run` verb — see R2-1**

`CoordinationError` (`src/runner/coordination/schema.mjs:93`) and
`FlowDefinitionError` (`src/runner/definitions/schema.mjs:160`) both extend
`Error` directly — neither is a subclass of the other. The error
`classifySessionQuorum` now throws IS a `CoordinationError`, so `run.mjs:529`'s
`err instanceof CoordinationError` catches it and turns it into
`closeRefusalReason`. That half is genuinely resolved. What is not resolved
end-to-end is covered in R2-1.

## 2. New findings from this recheck

### R2-1 (MEDIUM) — §5's N3 Gap misstates its own scope, and N1's user-visible fix does not land on the `run` verb

§5 says the surviving uncaught `FlowDefinitionError` fires "whenever the bound
protocol declares `completion.aggregation`". That is wrong.
`aggregationCloseParams` (`src/verbs/coordination/run.mjs:236`) calls
`loadCoordinationProtocol` **unconditionally**, seven lines *before* it checks
whether an aggregation is declared (`run.mjs:243`). So it throws for **every**
declared-protocol session, aggregation or not.

Verified empirically (`zz-probe-runverb.mjs`, one required op still pending, an
unrelated malformed sibling file added to the registry, then a
disposition-only resume request that goes straight to the close):

```
=== protocol WITHOUT completion.aggregation, registry broken ===
  run verb THREW UNCAUGHT: [FlowDefinitionError/parse] flow-definition: cannot parse ".../broken.json": Expected property name
  status now: active
  show      : completed=["worker-actor"] missing=[]

=== protocol WITH completion.aggregation, registry broken ===
  run verb THREW UNCAUGHT: [FlowDefinitionError/parse] … (identical)
  status now: active
```

Consequence, which no section names: `aggregationCloseParams(...)` is evaluated
as an **argument** to `closeSessionByQuorum` inside the same `try`
(`run.mjs:526`), so on the primary user-facing door a resolution failure throws
a non-`CoordinationError` *before* `classifySessionQuorum` is ever reached, and
`run.mjs:532` rethrows it. N1's honest, correctly-attributed refusal is
therefore **unreachable via `fgos coordination run`** for the
resolution-failure class — the user still gets a raw parse-error stack trace.

Calibration, stated plainly: the *safety* property N1 wanted still holds
end-to-end (a crash does not close the session — status stays `active` in both
scenarios above), and N1 remains a real, correctly-fixed defect at
`closeSessionByQuorum`'s own exported boundary. This is a scope-and-attribution
problem, not a re-opened premature close. But a future reader of §5 will
conclude the residual only bites aggregation protocols and only in an exotic
corner, and both halves of that are false.

**Asked for**: correct N3's Gap text to say it fires for every declared-protocol
session regardless of `completion.aggregation`, and add the interaction (that it
pre-empts N1's refusal on the `run` verb). Whether to actually fix `run.mjs:236`
is the Coordinator's call — §9 already scoped it out, and this recheck does not
reopen that decision.

### R2-2 (MEDIUM) — §7.5 was corrected for the count but left stale in four other ways

§10.5 claims the only thing wrong in §7.5 was the number. Reading §7.5 against
the current tree, it is stale in four separate ways:

1. It still describes the designated actor as "the actor bound to
   `completion.aggregation.outputOperationRef` at the **FIRST graph binding
   found**" — the exact heuristic §10.3 replaced. No supersession note.
2. It cites a test by name — *"P10-KERNEL-FIX MEDIUM-5: a DIFFERENT actor bound
   to the same outputOperationRef operation, for an unrelated reason, is NOT
   silently excluded"* — that **no longer exists**:
   `grep -c "P10-KERNEL-FIX MEDIUM-5" test/verbs/coordination-aggregation-surface.test.mjs` → `0`.
   It was split into the two Fix Round 2 tests.
3. Its quoted probe evidence, `completed=['coordinator-actor'] missing=['analyst-actor']`,
   is **no longer reproducible** under the code §10 ships: with two actors bound
   to `synthesize`, coordinator-actor is now missing too. My own N4 revert
   produced exactly that contrast (`['analyst-actor']` under the old heuristic
   vs `['analyst-actor','coordinator-actor']` under the real code).
4. Its stated file total is still `tests 13, pass 13, fail 0`; the file is now
   `tests 14, pass 14, fail 0`, which §10.6 itself states three sections later.

Same class as this track's step-07 P03.3 citation-drift precedent: a section
edited for one number while the surrounding prose silently decayed into
describing code that was deleted in the same round.

### R2-3 (LOW) — §10.6's quoted `git status --short` does not reproduce

§10.6 presents this as real command output:

```
 M src/runner/coordination/session-engine.mjs
 M test/verbs/coordination-aggregation-surface.test.mjs
```

The real command in this worktree prints eight modified paths (the three
group-thinking-lite conformance files, `coordination-recovery-and-quorum`,
`coordination-visibility-window-fixture`,
`coordination-deliberation-method-chains`, plus `current-cell.md`). The prose
immediately after explains those are Fix Round 1's diff, so the intent is
honest and the substantive claim ("this round touched two files") is true — but
the block is labelled as a command and its output, and it is a filtered
excerpt. In a track whose standing bar is "real runs, not narrated," label it as
filtered or quote the real output.

### R2-4 (LOW) — the degraded read has no signal at all, in either failure class

Accepted by §9 as the deliberate posture, so not a regression — but the
observable consequence is not named in §5. From my own N1 probe, with `op-two`
never dispatched and the registry broken:

```
show : completed=["worker-actor"] missing=[]
```

A genuinely incomplete actor is rendered as complete, exit 0, no drift field, no
degradation flag — while the close refuses. "Reads always degrade honestly" is a
generous description of a read that reports the opposite of the gating truth
with nothing marking it as degraded. A stuck user reaching for
`fgos coordination show` is told everyone is done. Worth a Gap bullet, and
worth a future cell considering a `definitionResolution: 'ok' | 'degraded'`
field on the quorum payload so `show` can say *why* it fell back.

## 3. Regression evidence — numbers I personally observed

All run from `/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9`
with `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1`.

| tier | result | §10's claim | match |
|---|---|---|---|
| `coordination-aggregation-surface.test.mjs` alone | `tests 14, pass 14, fail 0` | 14/14/0 | yes |
| the five Fix Round 1 files | `tests 118, pass 118, fail 0, skipped 0` | 118/118/0 | yes |
| master-loop / group-thinking-lite set (10 files) | `tests 170, pass 170, fail 0, skipped 0` | 170/170/0 | yes |
| combined focused regression | `tests 761, pass 760, fail 1` | 761/760/1 | yes |
| full repo minus `coordination-static` | `tests 5558, pass 5550, fail 1, skipped 7` | 5558/5550/1/7 | yes |

The combined-regression failure is `coordination-static.test.mjs`'s
"src/runner/coordination/** imports no Work lifecycle, merge, worktree,
transport-spawn, or mission-lite module". Inspected directly rather than
assumed: every reported violation resolves to a path under
`/home/vantt/projects/forgentX/.claude/worktrees/…`, matching the forbidden
substring "worktree" by checkout path alone (`cohort-planner.mjs` importing
`../dispatch/config.mjs`, etc.). Standing environment false-fail, not a
regression.

The full-repo failure is `test/cli/fgos-intake-4.test.mjs`'s "ask/answer
round-trip on a genuinely legacy durable-doing item" — the standing baseline
this track has documented in every prior cell, unrelated to
`src/runner/coordination/**`.

`coordination-store.test.mjs`'s known load-induced race flake did **not**
reproduce on any of my runs.

## 4. Newly-broken checks — none found

- Only two callers reach `classifySessionQuorum`, and only
  `closeSessionByQuorum` sets `enforceDefinitionVersion` (session-engine.mjs:3500).
  `evaluateSessionQuorum` forwards its caller's `opts` verbatim, but both
  production callers (`run.mjs:522/535`, `show.mjs:176`) build `engineOpts` as
  `{cwd, repoRoot}` — no path can smuggle the close posture into a read.
- `manifest.definitionRef.version` is schema-guaranteed non-empty
  (`schema.mjs:227`), so `drifted` cannot become spuriously true on a
  well-formed manifest.
- The drift refusal message is byte-identical to Fix Round 1's, and the existing
  drift test at `coordination-aggregation-surface.test.mjs:539` still passes.
- Error-type contract: the close path now throws `CoordinationError`, which
  `run.mjs:529` catches. No catch-site expecting `FlowDefinitionError` from this
  path exists.
- No assertion in the aggregation-surface diff is weakened. The two
  `dispatchRequest` → `dispatchRequestNoAggregation` substitutions
  (lines 564, 643 of the new file) *strengthen* those tests: they now dispatch
  `synthesize` as a real required operation, which is required once no
  aggregation is declared.

## 5. Recommended actions

1. Correct §5's N3 Gap: it fires for every declared-protocol session, not only
   aggregation-declaring ones, and it pre-empts N1's refusal on the `run` verb
   (R2-1).
2. Bring §7.5 into line with the code §10.3 ships, or mark it superseded: the
   graph-order description, the dead test citation, the non-reproducible probe
   quote, and the `tests 13` total (R2-2).
3. Label §10.6's `git status --short` excerpt as filtered, or quote the real
   output (R2-3).
4. Add a Gap bullet for the unsignalled degraded read (R2-4).

None of these is a kernel code change. Items 1-3 are evidence-trail integrity;
item 4 is a named residual.
