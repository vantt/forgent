# P04.1 Red-Team — `fgos-architecture-panel` production skill

Target: `core/skills/fgos-architecture-panel/SKILL.md` (627 lines).
Mandate: phase-04's "Tests And Review" — hard correctness **and loss of soul**
(premature questions, shallow reframing, straw alternatives, performative
debate, hidden dissent, evasive recommendation, explanations written for the
system instead of the person).

Method: adversarial reading against the four Phase 01 playbooks' own named
anti-patterns, plus live verification of every mechanical claim against the real
`architecture-advisory-panel-v1.yaml` graph and the real request validator.

**14 attacks run — 6 held, 4 weak, 4 failed.** Machine-readable detail with full
quotes in `redteam-findings.json` alongside this file.

## Verdict

The mechanical half of this skill is sound. Every claim it makes about the graph,
the visibility windows, the invocation caps, and the two known kernel gaps checked
out live — I could not find a single overstatement about what the hard shell
enforces. The soul half is uneven in a specific, diagnosable way: the condensation
kept each role's *inbound* discipline and repeatedly dropped its *outbound*
obligation.

The four failures are not scattered. Three of them (A5, A6b, A8a) sit on the
same seam — everything the panel owes the **person** and everything the
**driver** owes the panel. That is the half of the doctrine that did not survive
the condensation, and it is the half phase-04 named as the thing to attack.

## What held (guardrails that are real, not decorative)

- **A1 — Scout Before Ask.** Four sequential, individually checkable gates
  (investigator has reported; the question survived investigation with a written
  record; genuinely user-exclusive; material), plus mandatory consolidation and
  a stated default. Not aspirational prose. I verified the cited precedent:
  `proofs/P01.3/decision-request.md` really does open with "Verdict: no Decision
  Request sent yet", really does run a user-exclusive/material table, and really
  does carry exactly four numbered defaults. `P01.2` matches. A mediocre agent
  reading only this section would not ask prematurely.
- **A2a — the designated loser.** The best-operationalized guardrail in the file.
  Three independent tripwires, one of which ("would this shaper defend this
  option if asked directly?") an agent can actually run against its own output.
  The literal failure signature — "five drawbacks and one vague benefit" —
  matches the doctrine's Bad Example closely enough to pattern-match.
- **A3a — performative critique.** Independently forbids all four counts the
  doctrine's Bad Example fails on. The ranking rule ("lead with the one that
  flips the recommendation if it lands", "attack the option most likely to win
  hardest") is what converts a survey into a critique, and it is stated as a rule.
- **A4 — evasive recommendation.** "Recommend **one thing**" is stated as a hard
  requirement *and* paired with the named counter-example ("the balanced menu
  (three options, no recommendation)"). The escape hatch is priced: using it
  costs you naming the one observation that would separate the candidates.
- **A6a — graph claims.** Read the YAML directly. `phase-dialogue-reopen` has
  `transitions: []` and exactly three operations; no node transitions backward;
  both `revise-*` carry `maxInvocations: 2` and no `contextAccess`;
  `close-dialogue` is gated by `post-explanation-open`; `post-shaping-open` lists
  all three shapers and `post-critique-open` lists both Phase-6 operations. Every
  row of the skill's phase table is accurate. The "no backward edge" disclosure
  is honest and correctly placed.
- **A7 — known gaps, live.** Reproduced all three refusals through the real
  `validateCoordinationRequest`. `human-turn:`/`contribution:` refs die at the
  charset check in `grantedContextRefs`, `targetRef`, **and** `evidenceRefs`;
  the free-text-`reason` workaround was accepted as the control;
  `specialist-authorize` is not in the step-type vocabulary. Both gaps are real,
  correctly described, and correctly scoped as protocol-general.

## What failed

### A5 — the explanation is written for the system (HIGH)

Phase-04's Requirements bullet demands the skill carry "the explanation
standard ... proven in Phase 01." It does not carry it at all.

The skill's lead-advisor packet is six bullets, five of which are about *intake*
(read the gap between stated question and actual worry; mark uncertainty per
inference; prefer the reading that makes the person reasonable; never resolve an
ambiguity by picking a side). The only explanation-side line is a prohibition:
"becoming the panel by writing the explanation's own architecture opinion instead
of the synthesizer's."

Absent, all three load-bearing:

- "lead with the consequence, not the architecture" — with the doctrine's own
  contrast pair, "*You will be able to change the intraday path without
  re-testing EOD*" versus "*we introduce a pipeline abstraction with a plugin
  seam*";
- "name the part that stays theirs";
- the Purpose test: "not whether the explanation is clear ... whether the person
  can defend this decision to the colleagues who will live in that codebase."

Confirmed by grep: `consequence` appears once in the whole file and it belongs to
the alternative shaper's no-build path. `ownership` appears twice — one is the
bare table label **"8 Explain For Ownership"**, which names the phase and says
nothing about what ownership requires. The skill titles the phase after the thing
it then never teaches.

A technically-correct explanation written entirely in architecture vocabulary,
naming no consequence and leaving no judgment to the person, violates nothing
this file says.

Same root, worth naming separately: the doctrine calls **"Flattening for
comfort"** "the single most damaging thing this role can do, because it is
invisible and it feels like good service." The skill's lead-advisor Avoid list
drops it. Both `flatten` hits in the file are about the synthesizer. So the one
surface where dissent actually reaches the person — the explanation — has no
anti-flattening guard, while the upstream artifact nobody outside the panel reads
has two.

### A6b — three lead-advisor artifacts the graph cannot carry (HIGH)

The skill assigns the lead advisor `dialogue/<n>-impact.md` ("only after that
step succeeds does the lead advisor draft..."), Phase 4's `decision-request.md`,
and a person-facing `dialogue/<n>-response.md` for every turn "including a
clarification with no reopen at all."

The lead advisor has four operations. The skill lists them itself at the top of
its own role packet, and the YAML confirms: `interpret-request`,
`explain-recommendation`, `revise-explanation`, `close-dialogue`. None of them
carries an impact assessment or a decision request. The `clarify` row is explicit
that there is **no operation dispatch** — and still requires a response to the
person.

So each of these has exactly two possible authors: the coordinator writing them
itself, or burning one of the session's two total `revise-explanation`
invocations. The first is what the file's own **BOUNDS #7** forbids — "never
perform that role inline and present it as panel output. One session writing
every advisor's output is a failed session even when the prose reads well" — and
what the doctrine forbids twice more ("the external driver ... never authors
panel interpretation"; "the lead advisor is the only role permitted to speak to
the person").

The file states both the prohibition and the instruction that breaks it, four
pages apart, and never reconciles them. The tension is inherited from the manual
coordinator prompt, where the coordinator had latitude the hard shell has since
removed — but this skill is what a fresh agent will read, and it gives that agent
no reason to resolve the contradiction the expensive way.

### A8a — the driver is armed to be caught, never taught the rule (HIGH)

The reader of this skill *is* the external driver. It is the actor that
dispositions.

The skill tells the red-team to look for "a driver disposition that decided a
technical question without an advisor's evidence" and instructs it to "check
`dispositions.md` against `runs/`, every session." The resume packet tells a
fresh session to read `dispositions.md` as "what the driver has authorized."

The skill never states the disposition rules. Not the six dispositions
(`accepted` / `answered` / `mitigated` / `deferred` / `unresolved` /
`invalidated-by-evidence`); not the coordinator prompt's hard rule that
`invalidated-by-evidence` and `answered` require an advisor's observation
("if you have not been shown that fact by an advisor who looked, you are not
dispositioning, you are opining inside an authority role"); not that `deferred`
is the one call the driver may make alone; not that a finding about the driver's
own conduct may never be self-dispositioned. It also never instructs the driver
to *create* `dispositions.md` — the resume section points at a file the skill
never tells you to write.

This is worse than omitting both halves, because the predictable outcome is a
red-team finding raised against a driver who was never given the rule. It is also
the cleanest falsification of the file's own claim that "a fresh agent with no
other context can run a good session from this document alone."

It has a second-order cost: **A3b**. The synthesizer's dissent-laundering
guardrail is phrased as "converting `unresolved` into a 'consideration'" — but
`unresolved` is a disposition from the vocabulary the skill didn't carry. The
tripwire only fires for a reader who already has the doctrine, which is exactly
the reader this file exists to serve without.

### A2b — shallow reframing has zero coverage (MEDIUM)

`grep -ic 'reframe\|reframing'` against the skill returns **0**.

The alternative shaper's packet invites the reframe — "**Notice:** ... whether
the framing itself is the constraint" — and never attaches the obligation that
makes one honest. The doctrine's anti-pattern is explicit: "**Reframing as
evasion.** Answering 'the real problem is your team structure' and stopping. If
the reframe is right, it still owes a candidate."

The condensation kept the license and dropped the guardrail. A shaper that writes
"the framing is wrong, the real coupling is at the shared alert dataset" and
produces no candidate satisfies every word of this packet — while "shallow
reframing" is one of the seven modes phase-04 names by name.

Notable because it is the *same role* whose designated-loser guard (A2a) is the
strongest thing in the file. This is a targeted omission, not a weak packet.

## What is weak

- **A3b — dissent laundering.** Named with its exact mechanism and reinforced
  with "in the packet body, not a footnote," but anchored on `unresolved`, a term
  the skill never defines. See A8a.
- **A2c — falsification theatre.** The skill requires criteria "stated **before**
  seeing the critique (timestamp-checkable)" but never says a criterion must be
  able to *occur*, and it dropped the critic's corresponding duty to attack
  vacuous ones. "This is wrong if the requirements change completely" passes both
  packets and reaches synthesis as advocacy — the exact outcome the doctrine says
  the criteria requirement exists to prevent.
- **A8b — reopen-budget exhaustion.** The cap is stated accurately; its
  consequence is not. The "open a new cell" escape hatch is conditioned solely on
  the material needing a fresh shaper/critic, not on the budget being spent. A
  third `introduce-context` turn has no documented path, and the two tempting
  resolutions are the two the skill forbids elsewhere (inline authorship; "the
  panel would probably say"). One sentence closes this.
- **A8c — `actors[].model` citation.** The *rule* is right and is enforced harder
  than the skill claims, but the evidence cited is at the wrong layer.
  `src/verbs/coordination/schema.mjs:133` declares
  `ACTOR_ALLOWED_KEYS = new Set(['id','persona','executor','model','tier'])` and
  the request validator **accepts** `actors[].model`; the real refusal is
  `run.mjs:168-172`, which rejects it specifically for `kind:"declared-protocol"`
  with a precise reason. An agent that verifies the skill's stated evidence will
  find `model` sitting in the allow-list and reasonably conclude the guardrail is
  bogus — the worst outcome for a rule the file labels "not optional." Citing
  `run.mjs:168-172` makes it self-verifying. Under the skill's own red-team
  standard ("cited evidence that doesn't exist"), this citation does not meet the
  bar the file sets for its advisors.

## Recommended fixes, in priority order

1. **A5** — add the explanation standard to the lead-advisor packet: lead with
   the consequence not the architecture (keep the doctrine's contrast pair), name
   the part that stays theirs, and the "can they defend it to colleagues" test.
   Restore "flattening for comfort" to that role's Avoid list.
2. **A8a** — carry the six dispositions and the "must not disposition alone"
   rule. Two short paragraphs. Also state that the driver writes
   `dispositions.md`, since the resume packet already assumes it exists.
3. **A6b** — reconcile explicitly. Either name impact/decision-request/clarify-
   response as coordinator-authored bookkeeping that is *not* panel output (and
   say why that does not breach BOUNDS #7), or route them through
   `revise-explanation` and state the budget cost. Silence is the one option that
   leaves a mediocre agent to guess.
4. **A2b** — one sentence to the alternative shaper: a reframe still owes a
   candidate.
5. **A2c** — one clause to the shaper ("a criterion that cannot occur is not
   one") and one to the critic (criteria are attackable).
6. **A8b** — extend the new-cell path to cover budget exhaustion.
7. **A8c** — re-cite the `actors[].model` rule to `run.mjs:168-172`.

None of these needs a kernel change or a graph change. All seven are prose edits
to `core/skills/fgos-architecture-panel/SKILL.md`, re-projected through
`npm run build:skills`.

## Mechanical checks (all clean)

- `.agents/skills/fgos-architecture-panel/SKILL.md` is byte-identical to the core
  source (627 lines, `diff -q` clean); `plugins/fgOS/` projection matches;
  `.claude/` carries the expected 24-line generated wrapper.
- All 13 distinct relative link targets from the core file resolve on disk,
  including the two deep proof-artifact links (`proofs/P01.3/decision-request.md`,
  `proofs/P01.3/critiques/architecture-critic.md`).
- Every Phase-01 citation I spot-checked is accurate, not decorative — the
  zero-question claim, the four carried-forward defaults, and the
  user-exclusive/material table shape are all really in the cited artifacts.
