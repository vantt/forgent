# P04.1 Reviewer Report — Production Skill And Projections

Reviewer: independent, formed before reading the Doer's own summary.
Artifact: `core/skills/fgos-architecture-panel/SKILL.md` (627 lines).
Findings: 16 (1 high, 10 medium, 5 low) — machine-readable at
`reviewer-findings.json` in this directory.

## Verdict

The skill is real work, not a shell, and it is not rubber-stampable
either. Its per-role doctrine is the strongest part and clears the
phase's own bar. Its executor roster — the part that turns doctrine into
a running panel — names three executors that do not exist in this
repository's dispatch registry, and the dispatch layer answers an
unknown executor name by silently substituting a mutating default rather
than refusing. That single defect (R1) is the one thing that should
block, because following the skill literally produces a panel that is
neither confined nor heterogeneous, with no error anywhere.

## Check-by-check

### 1. Not a link-only shell — PASS, decisively

Phase 04's named failure mode does not apply. The file carries nine
substantive role packets, a real phase→node mapping against the actual
FlowDefinition, a six-verb Decision Dialogue classification table with
reopen-cost semantics, a six-step ordered resume packet, seven bounds,
and six known gaps. The links are supplementary, not load-bearing.

Specific evidence, as asked: the **Constraint Advocate** packet (lines
313-338) is operable standalone. From those 26 lines alone a fresh agent
gets the magnitude rule ("this has operational risk" is noise, "the
dual-write window is ~3 weeks and a rollback needs manual
reconciliation" is a finding), the ranking rule (which single concern
sinks this), the role's unique judgment (reversible vs. irreversible,
"the one judgment nobody else in the panel makes"), the mitigation test
(cheapest engineering mitigation, not a process promise; nothing
implementable in an afternoon means you declined to make the concern
survivable), and three named failure postures. That is enough to run the
role well without the playbook.

The one packet that leans on a link in a load-bearing way is mild: the
same Constraint Advocate section says "(see the role doctrine's own Bad
Example — it passes every checklist item and still fails the role)"
where the pointer stands in for the content — but the rule itself is
stated inline ("A flat list of MEDIUMs answers no question"), so the
link is genuinely supplementary. Not a finding.

### 2. Per-role packets — PASS on the letter, with two condensation losses

All nine packets carry all six dimensions phase-04 demands (notice,
reason, evidence to seek, when to change position, how to communicate
uncertainty, failure posture to avoid). None is thinner than the list.
Spot-checked three in depth:

- **Alternative Shaper** against role-doctrine §4: faithful. Priors
  stated up front, the no-build path made concrete with a rate/cost/
  trigger, the materiality test ("would this produce a materially
  different first three months"), abandoning-and-saying-why as real
  output, and the designated loser correctly named as the panel's single
  most damaging failure with a usable test ("would this shaper defend
  this option if asked directly?"). Loses "solution classes, not
  variants" (R16).
- **Synthesizer**: recommend one thing; the decline-to-separate case
  with the named missing observation; per-claim rather than per-document
  calibration; dissent laundering and the merged fourth architecture
  named. Complete.
- **Independent Red-Team**: correctly scoped to attacking the packet and
  the panel rather than the architecture, with "check artifacts, not
  narration" and the three-verdict discipline including honest use of
  `INSUFFICIENT-EVIDENCE`. Complete — but see R11, where the executor it
  is routed to has a known defect that manufactures the exact ceremonial
  appearance this packet warns against.

### 3. Executor roster — accurate on paper, unusable in practice

Every tier→model mapping matches P00.1's admitted allowlist and the role
doctrine's derived-models table exactly (`claude-bwrap` analytical→
`sonnet`, critical→`opus`; `codex-readonly` every tier→`gpt-5.5`;
`agy-bwrap` analytical→`gemini-3.1-pro-low`, critical→
`gemini-3.1-pro-high`). Only admitted pairs are used for advisory roles;
the falsified/excluded pairs (`claude-reviewer`, `agy-plan`, `codex-cli`,
`agy-cli`, `agy-sandbox`, `codex-bwrap`) appear nowhere. Every minTier
floor in the roster satisfies the protocol's own `policy.minTier`.

The cognitive rationales are real, not filler — they track the doctrine's
Diversity Posture column and add genuine specificity (the alternative
shaper's "different priors ... a different model family is a real hedge
against both shapers reaching for the same solution class"; the critic's
"a fresh assignment with a new prompt package is the isolation guarantee,
not a new executor per se"; the honest note that tier is immaterial on
`codex-readonly`).

But **R1**: none of the three is a registered executor.
`node src/runner/dispatch.mjs decide claude-bwrap|agy-bwrap|
codex-readonly` returns `configured:false` for all three, against a live
registry of `claude, claude-reviewer, agy-cli, agy-herdr, codex-cli,
codex-pi, glm-cli, claude-herdr, pi-herdr, codex-herdr, gitnexus, herdr,
pi`. `resolveExecutorAndOverrides` returns `{executorId: null,
configured: false}` without throwing, and `resolveExecutorConfig` then
does `const executor = byExecutor ?? (cfg && cfg.executor)`
(`src/runner/dispatch/resolve.mjs:398`), where the live global default is
`claude -p {prompt} --model {model} --permission-mode acceptEdits
--allowedTools Bash(git add:*),Bash(git commit:*),...`.

That is the same invocation shape P00.1 falsified and removed
(`claude-reviewer`: "MUTATION ATTACK SUCCEEDED under authorization").
So a fresh agent that forwards this roster gets nine advisory roles on
one mutating, git-write-enabled provider — no confinement, no diversity,
no error. It breaks the phase requirement ("never collapses the panel to
one session-wide provider"), P00.1's entire admission, and the skill's
own BOUNDS #2 simultaneously.

This was flagged as a Phase-04 carry-forward twice (P01.2 Real Gaps #1
— "either register these, or correct the playbook's ROLE ROUTING text";
P01.3 Real Gaps #1) and filed as P02.1 BL2. It is absent from Known
Gaps. The skill also drops the role doctrine's selection step 5 ("Run
the decision door ... and obey the mechanism it returns"), which is
precisely the step that would have caught it.

Corroborating: the conformance suite's own heterogeneity case proves the
mechanism using synthetic fixture executors `exec-family-a`/
`exec-family-b`, never the roster's real names — and asserts "two
genuinely different registered executors, **not one global default**",
naming this exact failure mode.

### 4. No `actors[].model` claim — behavior right, mechanism wrong (R3)

The skill does not emit the field, satisfying the requirement. But its
stated reason cites `ACTOR_FIELDS` (the FlowDefinition/manifest actor
whitelist) for a claim about the *request*. The request-level whitelist
is `ACTOR_ALLOWED_KEYS = new Set(['id','persona','executor','model',
'tier'])` (`src/verbs/coordination/schema.mjs:133`) and does include
`model`. The real refusal is `assertModelSupportedForKind`
(`src/verbs/coordination/run.mjs:166`), scoped to
`kind:"declared-protocol"`. The skill's cited grep was scoped to
`src/runner/`, which structurally cannot see `src/verbs/` — so
"confirmed: zero hits" reads stronger than it is.

### 5. Citations — mostly accurate, two real mismatches

Verified accurate: P01.2's "5 attacks, 1 conceded, 2 decision-changing";
"two `stay-thin`, one primary-recommends deletion"; the reversibility
dispute kept live and unresolved through the final dialogue response;
P01.3's synthesis declining to pick between three mechanisms and naming
the missing observation instead; P01.3's scout report finding the shared
engine already existed against the intake's own framing; "confirmed
workable across 7 dispatches in P01.3"; doctrine-by-path failing
identically twice; 757/757 focused tests.

Mismatches: **R4** — "làm luôn cũng được — P01.3 Turn 2" is P01.2's Turn
2 (P01.3 has exactly one turn; repo-wide grep for the phrase returns
only P01.2 paths). **R6** — "P01.3's critique independently re-verified
two attacks" attributes to the critic what P01.3.md says the
*coordinator* did; the linked critic artifact only says "*What would
settle it:* Read ...".

### 6. The disclosed "no backward edge" finding — VERIFIED TRUE

Checked directly against `core/coordination-protocols/
architecture-advisory-panel-v1.yaml`. `phase-dialogue-reopen`
(lines 512-530) declares exactly `revise-synthesis`,
`revise-explanation`, `close-dialogue`, and `transitions: []`. No node
transitions back to `phase-shaping` or `phase-critique`; the graph is
strictly linear forward. The skill names this plainly as V1's real
boundary and gives the honest operator behavior (integrate from the
existing ledger plus what the turn supplies; if a genuinely fresh shaper
pass is needed, open a new cell; say so to the person). This is the
opposite of hiding a limitation and is the strongest single passage in
the file.

The rest of the phase table also checks out against the YAML: the
vacuous `framing-shaping-open` window, `post-shaping-open` requiring all
three shapers, `post-critique-open` requiring both critique and
constraint-findings, the specialist gated at `post-shaping-open`, and
`revise-*` genuinely ungated while `close-dialogue` is gated by
`post-explanation-open`.

### 7. Known Gaps — accurate

`tsk-44p` is described correctly and matches the protocol file's own
corrected comment: `SAFE_ID_RE = /^[A-Za-z0-9_-]+$/`
(`src/verbs/coordination/schema.mjs:29`) admits no colon, and
`assertSafeRefOrId` is applied to `grantedContextRefs` (line 337),
`disposition.targetRef` (363) and `disposition.evidenceRefs` (374) —
all three fields, every protocol, as the skill states. The stated
workaround (the `authorize` step's free-text `reason`) is genuinely
available and unenforced, so it is not itself refusable.

`tsk-3xk` is accurate: `run.mjs`'s step vocabulary has no
`specialist-authorize`, and `authorizeSpecialistSlot` is a real exported
engine function (`session-engine.mjs:1728`), so the "call it directly,
then dispatch through the normal `operation` step" workaround is
consistent with what the kernel allows today.

The two doctrine gaps (path-vs-verbatim, example name collision) are
accurate. The bwrap runnability gap is stale — see R7.

### 8. Loss-of-soul, section-level: "Lead Advisor Discipline" — FAILS

Read adversarially as the only thing a fresh agent has, this section
gives contradictory instructions.

Its stated test is user-exclusive AND material, where material means
"would the recommendation actually differ by answer? — if not, delete
it". Run that test against P01.3's real `decision-request.md`: three of
seven candidate gaps are marked user-exclusive in the source's own words
("Yes — only the person can say" / "Yes — only the person has this") and
are material in principle. Under the skill's test, all three get asked.
The real session asked zero — and the section's own rhetoric ("This is
not aspirational ... **zero** questions") tells the agent zero is the
proven outcome. The agent is handed a rule that fires three times and an
exemplar that says none.

The missing discriminator is a third axis: material *now* — "material
enough to block Phase 5" versus "reserved for Phase 9's real dialogue,
where a concrete synthesis exists to react to". That axis is what the
real artifact actually turns on, and it is not in the skill.

"Delete it" is worse than incomplete; it inverts the recorded practice.
The real `decision-request.md` never deletes a surviving gap — it
carries four explicit named defaults into every shaper's prompt and
requires Phase 7/8 to name the dependency as "what stays theirs",
closing with "This is a recorded decision, not a skipped step — this
file exists so a successor coordinator does not re-ask what was already
reasoned through." Deleting a material, user-exclusive question is how a
panel silently assumes an answer, which the skill's own BOUNDS #6
forbids. Filed as R2.

Two further loss-of-soul findings sit next to it: R5 (the skill uses a
real dialogue turn as evidence for the reading the lead advisor
explicitly refused — "permission, not instruction ... I don't want the
panel recording this as 'the person decided to build'") and R10 (the
doctrine's "diversity is a hedge, not a decoration" end-of-session audit
is dropped, leaving an elaborate selection rationale with no check on
whether it paid off).

By contrast, "Debate And Synthesis Discipline" reads sound apart from
the R6 attribution error — its four claims are each anchored to a
specific recorded outcome rather than to an adjective.

## Test runs

Focused coordination suite (this cell should not have touched kernel
code — it did not):

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' \
  'test/verbs/coordination-*.test.mjs' \
  'test/cli/coordination.test.mjs' \
  'test/architecture.test.mjs'

ℹ tests 757
ℹ suites 0
ℹ pass 757
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 15032.907415
```

Projection/mirror suite:

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs

✔ every fgos-* dev-skill source in .agents/skills carries user-invocable: false
✔ every fgos-* dev-skill wrapper in .claude/skills inherits user-invocable: false
✔ every fgos-* dev-skill mirrored into plugins/fgOS/skills also carries user-invocable: false
✔ distill ... does NOT carry user-invocable: false

ℹ tests 39
ℹ pass 39
ℹ fail 0
```

Projections, independently confirmed byte-identical:

```
a5b4764070ad1496f61b766ba25bd547  core/skills/fgos-architecture-panel/SKILL.md
a5b4764070ad1496f61b766ba25bd547  .agents/skills/fgos-architecture-panel/SKILL.md
a5b4764070ad1496f61b766ba25bd547  plugins/fgOS/skills/fgos-architecture-panel/SKILL.md
```

`.claude/skills/fgos-architecture-panel/SKILL.md` is 24 lines: verbatim
frontmatter plus the standard tsk-1qi thin-wrapper pointer to
`.agents/skills/...`. Genuinely thin, not stale — the frontmatter matches
the source byte-for-byte.

Relative links: all 13 resolve from `core/skills/`; 12 of 13 from
`.agents/skills/` (R8); the `plugins/fgOS/` projection breaks all
`../../../`-rooted links, but so does the `fgos-code-panel` precedent, so
that is pre-existing and not charged to this cell.

`CHANGELOG.md` `[Unreleased]` carries a real entry for the capability.

## What I deliberately did not raise

- `user-invocable: false` is correct, not a contradiction of the phase's
  "a person can invoke one named capability" exit — the surface is
  P04.2's scope, and `test/skills/fgos-mirror.test.mjs` enforces `false`
  for every `fgos-*` dev skill.
- The out-of-scope note deferring example families and the how-to guide
  to P04.2 matches phase-04's own cell split; not scope-dodging.
- The `plugins/fgOS` link breakage (shared with the precedent).
- The skill's structural resemblance to `fgos-code-panel` is appropriate
  reuse of the established precedent, not duplication.

## Unresolved questions

1. Is R1 resolved by registering the three pairs in `.fgos/config.json`
   (closing P02.1 BL2) or by documenting the manual-dispatch workaround
   P01.2/P01.3 actually used? That is a Phase-04-scope decision I should
   not make for the lead — but the skill cannot ship claiming governed
   dispatch of this roster until one of them lands.
2. R7's stale bwrap text is inherited verbatim from
   `architecture-advisory-role-doctrine.md`, which P04.1's own scope
   says stays unchanged. Fixing it only in the skill leaves the two
   disagreeing; fixing the playbook is outside this cell. Lead's call.

Status: DONE_WITH_CONCERNS
