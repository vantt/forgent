# P04.2 Red-Team — surface, examples, and dialogue

Independent adversarial round on `docs/how-to/use-fgos-architecture-panel.md`
and the 8 example families under `docs/how-to/coordination-examples/`.
I did not read the Doer's or Reviewer's reports.

10 attacks run: **6 HOLD, 3 WEAK, 1 FAILS.**

The one failure is blocking, and it is not a prose problem.

---

## BLOCKER — RT-P04.2-08: the documented request shape cannot reach Phase 9

`src/verbs/coordination/schema.mjs:79` applies a default
`aggregateBounds.maxRounds: 10` to any request that does not declare its own.
This protocol's mandatory pre-dialogue path is exactly ten operations —
`interpret-request`, `investigate-context`, three shapers, `critique-proposals`,
`assess-constraints`, `synthesize-recommendation`, `red-team-packet`,
`explain-recommendation`. Ten operations, ten rounds, cap reached.

**No file in this cell declares `aggregateBounds`.** Not the how-to guide, not
any of the 8 example request fragments, not `SKILL.md`:

```
grep -rn "aggregateBounds" docs/how-to/ core/skills/fgos-architecture-panel/
→ (no matches)
```

I built session `rt_aap_entry_1` from the documented shapes in a throwaway
stub-executor sandbox and drove it forward. `explain-recommendation` succeeded
as round 10. Then every Phase-9 operation was refused at the dispatch door —
identically for `revise-synthesis` (both attempts) and for `close-dialogue`:

```
fgos: createSessionAssignment: session "rt_aap_entry_1" has already used
10 round(s) session-wide, at or above the declared aggregateBounds.maxRounds
cap of 10 -- refusing to create a new Assignment for a new round
```

(exit 4 each time)

So for a coordinator who follows these examples literally:

- the entire Decision Dialogue is unreachable — the two-reopen budget the
  how-to calls "real, not a suggestion" can never be spent even once;
- `close-dialogue` cannot dispatch, and it is the **only** route to
  `lead-advisor-actor`'s quorum. The session can therefore never reach quorum
  completion — not even for a pure `decide` turn that consumes no reopen at
  all. `final-decision-and-defer.md`, which is entirely about that path, does
  not run as written.

This is a documentation defect, not an architecture defect. An otherwise
identical session opened with `"aggregateBounds": {"maxRounds": 20,
"maxAssignments": 30}` ran all eleven operations including `close-dialogue`,
exit 0, and `fgos coordination show` reported `status: completed`,
`quorum.missing: []`.

What makes this a genuine transfer failure rather than an unknowable: the
knowledge was already in the repository, in the sibling cell's own test.
`test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`
passes `{ aggregateBounds: { maxRounds: 20 } }` at both call sites and
comments the reason at line 202 — *"`aggregateBounds.maxRounds` is raised at
open time: this full chain dispatches 12 real Assignments, above the default
session-wide cap of 10"* — and again at line 833. P04.2's documentation is the
one artifact whose entire job is to show a coordinator the real request shape,
and it is the one place that fact did not land.

**Fix:** declare `aggregateBounds` in the opening request of the clear-start
and unclear-start examples (a session that will run the full panel plus
dialogue needs roughly `maxRounds: 20` / `maxAssignments: 30`), and state the
default and why it must be raised in the how-to's own request section and in
`SKILL.md`'s Entry Flow. Cheap, but it has to happen before anyone runs a real
session from this guide.

### Why the cell's own live proof missed it

Not carelessness — a structural blind spot worth naming. The proof cited in
the how-to (`aap_entry_proof_1`) ran two Phase-1 operations and three Phase-5
shapers: five rounds. It was incapable of reaching round 11. The proof was
real and it proved what it claimed (entry and resume); it simply could not
reach the failure. Any future live proof for this protocol should drive
through `close-dialogue`, because that is where the session-wide bounds bind.

---

## The founding premise holds (RT-P04.2-06)

I reproduced the Step-1 claim independently, from scratch, without the Doer's
fixture. Plain `fgos coordination run --file` against
`core.coordination-protocol.architecture-advisory-panel-v1` works, and
`fgos coordination show --json` genuinely orients a caller with no chat
history. Two specific claims in the guide that I expected to be loose are
exact:

- `lead-advisor-actor` really does stay in `quorum.missing` after its own
  `interpret-request` reports `"done"` — its other two gating operations are
  still owed. The guide calls this "a real, load-bearing behavior of the
  multi-operation quorum rule, not a quirk." Confirmed.
- Resume across a genuinely separate CLI invocation works: eventCount grew
  13 → 19 and `quorum.missing` correctly shrank from 7 actors to 5.

I also confirmed something the guide asserts only indirectly: the `human-turn`
request step, which appears in five of the eight example files, really does
work through this door, and the engine computed
`revision: sha256:414f08fe...` from the artifact file's actual bytes — exactly
as `clarification-and-challenge.md` claims it does.

One small inaccuracy in the guide's own transcription of that proof: it lists
eight pending driver authorizations and says each is named with "the exact
node, operation, and actor." The real output has **nine** entries, and the
ninth — `answer-specialist-question`, the specialist slot — has no `actorId`
at all, correctly, since it has no static actor. Worth correcting for the same
reason the rest of that section is trustworthy.

---

## Attacks that hold, and why that is evidence

Three of the guardrails I most expected to be performative are real.

**The challenge is not a softball (RT-P04.2-02).** The constructed challenge
targets P01.2's Attack 1 — `synthesis.md:77` titles it *"'Stay Thin'
Reversibility Illusion (architecture-critic; HIGH decision impact) — **LIVE**"*
and `synthesis.md:69` concedes *"Attack 1 was never answered."* It is the
strongest unrebutted objection in the whole real session. Decisively, the
example's **first** taught outcome is that the panel cannot win it: *"this is
the same open disagreement the panel already named and did not resolve."* A
designated-loser challenge would have been written so the panel could refute
it. This one is written so the panel must admit it is stuck — and the file
then spends its closing paragraph arguing against reopening on it, which is
the harder and less flattering lesson.

**The material-context reopen does not over-promise (RT-P04.2-03).** I read it
hunting for a sentence a reader could stretch into a Phase-3 reopen. There
isn't one. The heading itself marks the real behavior as *"no longer available
as-is"*, and the graph limit is stated absolutely — *"There is no operation
that re-dispatches the context investigator"* — which matches
`architecture-advisory-panel-v1.yaml:512-530` exactly.

**The homogeneous fallback does not collapse isolation (RT-P04.2-04).** I
checked the JSON, not the prose. Eight discrete `-actor` entries survive, so
eight separate Assignments with eight separate prompt packages survive. No
`grantedContextRefs`, no merged roles, no `model` key anywhere.

---

## WEAK — worth fixing, not blocking

**RT-P04.2-07 — citation drift in one file.** Four of five spot-checked
citations verify exactly, including counted ones: `architecture-critic.md`
contains exactly 5 `Decision impact:` entries, two marked High, one explicit
concession ("I must concede this attack fails") — matching clear-start.md's
"5 attacks, conceded one, and two were decision-changing" precisely. The
Vietnamese turns and the "permission, not instruction" classification are
verbatim from `human/2-person.md` and `dialogue/2-impact.md:70`.

The drift is in `alternative-and-composite-reopen.md`, which claims *"Three
independently shaped, genuinely different proposals reached the person:
stay-thin-and-fix, stay-thin-smaller-path, and delete-entirely."* The real
`P01.2/proposals/` holds three files, and `alternative-shaper.md` contains
**both** "The Candidate: Delete the Experiment" **and** "The Smaller Path: The
'Launcher Fix'" — two arms of one shaper's single proposal. Meanwhile
`constraint-advocate.md`'s own distinct candidate ("Keep Authority in the
Daemon; Repair Desktop Attachment") is not represented at all. This matters
past pedantry: the file exists to exercise `request-composition` *"against
real candidate material"*, but the composition it constructs then combines two
arms of the same shaper's proposal, which is not a cross-proposal composition.

**RT-P04.2-09 — the flagship example models the collapse it forbids.**
`clear-start.md` is the first example a reader opens, and its request has no
`actors[]` at all. The file comments on the absence approvingly — *"Note what
is absent: no `actors[]` override naming a bwrap-wrapped executor here"* —
framing it as scope discipline. But in my live run of that exact shape, every
role resolved to one provider (`provider=claude`, `model=m`, the global
default executor). phase-04's Requirements say the skill *"never collapses the
panel to one session-wide provider."* The note explains what the absence
avoids and never says what it costs. One added sentence fixes it.

**RT-P04.2-10 — "your two reopens" understates the real budget.** The
Decision Dialogue table's column header reads *"Costs one of your two
reopens?"*, framing a single pool; the paragraph directly below correctly says
each of `revise-synthesis` and `revise-explanation` is capped at 2. Confirmed
live that the cap is per-binding, not session-wide (the third
`revise-synthesis` authorization was refused with `activation.maxInvocations
cap of 2` while the budget for `revise-explanation` remained untouched). This
under-promises, so no reader is misled toward capability that doesn't exist —
but it's an inconsistency inside one section, and "your two reopens" is the
phrase a person will carry away. `"Costs a reopen invocation?"` resolves it.

**RT-P04.2-01 — ceremony check.** Six of eight files are strongly
load-bearing: strip the citations and the substitution is caught by something
anyone can run (counted findings, verbatim quotes in the person's own
language, a named live defect, a quoted `dispatch.mjs decide` output). The two
weakest are `alternative-and-composite-reopen.md` (fully constructed; its only
falsifiable content is the roll-up that RT-P04.2-07 found inaccurate) and the
challenge half of `clarification-and-challenge.md`. Both disclose their
constructed status in their opening lines, which is why this is WEAK and not a
finding against the cell's honesty.

---

## Recommended actions, in order

1. **BLOCKING** — add `aggregateBounds` to the documented request shapes and
   explain the default-10 round cap in the how-to and `SKILL.md`. Nothing in
   Phase 9 runs without it. (RT-P04.2-08)
2. Correct the pending-authorization count in the how-to's resume section:
   nine entries, and the specialist slot legitimately carries no `actorId`.
   (RT-P04.2-06)
3. Fix the three-proposal roll-up in `alternative-and-composite-reopen.md`, or
   re-ground the composition on two genuinely separate shapers' candidates.
   (RT-P04.2-07)
4. Say in `clear-start.md` what omitting `actors[]` costs, not only what it
   avoids. (RT-P04.2-09)
5. Reword the reopen-budget column header. (RT-P04.2-10)

Also worth adopting as a standing rule for this protocol: any future live
proof must drive through `close-dialogue`. A proof that stops before round 11
cannot see the session-wide bounds, which is exactly how this one got through.

## Unresolved questions

- Should the round-cap fix land in the docs alone, or should
  `architecture-advisory-panel-v1.yaml` itself declare bounds appropriate to a
  protocol whose own happy path consumes the entire platform default? The
  FlowDefinition schema may not accept `aggregateBounds` at the definition
  scope — I did not test that, and it is a P03 question, not a P04.2 one.
- `close-dialogue` being unreachable under default bounds means a
  default-bounds session leaks as permanently `active`. Whether anything
  reaps or reports those is outside what I checked.

## Reproduction

Sandbox and every request/output file:
`/tmp/claude-1000/-home-vantt-projects-forgentX/1b6fb381-92ae-4764-b75e-f1a39844aa49/scratchpad/rt-live/`
(sessions `rt_aap_entry_1` — the failing default-bounds run — and
`rt_aap_bounds_2` — the passing explicit-bounds run).
