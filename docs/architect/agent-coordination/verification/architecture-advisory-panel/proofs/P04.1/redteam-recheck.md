# P04.1 Red-Team Recheck — fix round 1

Re-ran my original adversarial reading against the current
`core/skills/fgos-architecture-panel/SKILL.md` (848 lines, up from 627) rather
than reading the Doer's report. Every mechanical claim re-verified live against
source; every Phase-01 citation the fix round added or changed re-checked against
the actual artifact.

**Recheck verdict: 7 fixed, 1 still weak, 0 still failed.**

Test suites re-run myself:

- `node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs`
  → **39/39 pass, 0 fail**
- `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'`
  → **757/757 pass, 0 fail**

---

## 1. A5 — explanation standard (was FAILS/HIGH) → **FIXED**

Present at L295-304 as a dedicated bullet, and it survives my original attack.
All three missing elements restored:

> "lead with the *consequence*, not the architecture. Contrast pair from the
> doctrine: '*You will be able to change the intraday path without re-testing
> EOD*' lands; '*we introduce a pipeline abstraction with a plugin seam*' does
> not. Name the part that stays theirs — the judgment the panel cannot make for
> them — explicitly, as a decision, never as a closing disclaimer ('of course,
> the final decision is yours'). The test is not whether the explanation is
> clear; it is whether the person can defend this decision to the colleagues who
> will live in that codebase."

Re-ran the attack: the architecture-vocabulary-heavy explanation I constructed in
round 1 is now literally the losing half of the contrast pair, so it cannot pass.
The **"never as a closing disclaimer"** clause is an addition beyond the doctrine
and it closes the obvious cheap-compliance path (bolting "the final decision is
yours" onto an otherwise system-facing explanation) — that clause makes this
guardrail stronger than the source doctrine, not merely equal to it.

"Flattening for comfort" restored to the Lead Advisor's Avoid list at L309-313,
with a locator the doctrine does not have ("in `explanation.md`") and the reason
it matters ("it is the one surface where dissent actually reaches the person at
all").

## 2. A6b — three ungraphed artifacts (was FAILS/HIGH) → **still WEAK**

The core resolution is sound and its reasoning checks out against the real YAML.
I verified both load-bearing claims independently:

- *"none of which exists at Phase 4 (too early — `phase-shaping` starts
  immediately after `phase-framing`, with nothing in between)"* — confirmed:
  `phase-framing` declares `transitions: [phase-shaping]` (YAML L448), and no
  operation anywhere in the file declares a decision-request contract template
  (all 14 `contractTemplate` values enumerated; the set is interpretation /
  scout-report / 3 proposals / critique / constraint-findings / specialist-answer
  / synthesis / redteam / explanation / close-dialogue). The topological
  unreachability argument is correct on both axes — graph position and artifact
  envelope.
- *"`revise-explanation` is capped at 2 invocations total, which a `clarify` turn
  ... must never spend"* — consistent with the verb table's own "Consumes a
  reopen cycle? No" for `clarify`, and with `maxInvocations: 2` in the YAML.

The BOUNDS #7 carve-out is legitimate rather than a rationalization: it draws the
line at fabricating what an *advisory role* would have produced and presenting it
as that role's independent work, versus the driver recording its own
interpretation-and-authorization trail. `dispositions.md` is a real precedent for
the latter, and the note requires these three be "explicitly labelled as your own
reading ... never presented as if a dispatched, isolated lead advisor produced
them." I agree this is the right resolution, and it is more honest than the
alternative of having the coordinator ghost-write in the lead advisor's voice.

**Why it is still weak — the file now contradicts itself in one cell.** The phase
table's row 4 (L123) is unchanged from before the fix round:

> `| 4 Ask Reluctantly | — (coordinator + lead advisor) | none — decision-request.md, sent or explicitly not sent | you + lead-advisor | — | — |`

The Actor column still reads **"you + lead-advisor"** for the exact artifact the
new reconciliation note says the coordinator authors alone, in a section that
argues no lead-advisor operation is reachable at that point. The table is the
first thing a fresh agent reads to learn "which request to build at each point";
a stale co-author attribution there is precisely what produces the behavior the
reconciliation note exists to prevent. One-cell fix: change the Actor to `you`
and point the cell at the reconciliation note.

**Second, smaller residual.** The preamble (L53-55) states: *"If a judgment call
here and the deep doctrine ever disagree, the deep doctrine wins — this file is a
projection of it, not a replacement."* The reconciliation note **does** disagree
with the doctrine — role-doctrine.md's Lead Advisor Handoff Shape assigns
`decision-request.md` and `dialogue/<n>-impact.md` to the lead advisor, and its
Posture section says the lead advisor "is the only role permitted to speak to the
person," which bears directly on a clarify-turn response. The note engages
BOUNDS #7 carefully and never engages either doctrine line. A fresh agent that
follows the preamble's own instruction will go read the doctrine, find the lead
advisor named as author, and resolve against the note. The fix is one clause
saying this divergence is a mechanical consequence of the graph, not a judgment
call, and therefore outside the precedence rule.

Neither residual is severe on its own; together they mean the "who authors these
three" question is not yet answered consistently across the file, which was the
specific question this recheck was asked to settle. Downgraded FAILS → WEAK.

## 3. A8a — driver disposition doctrine (was FAILS/HIGH) → **FIXED**

New section at L675-726, "Driver Disposition — You Author This File." Checked
against the doctrine's own Driver-Disposition Doctrine; nothing load-bearing is
missing:

- Ownership stated as the opening sentence, which also closes the round-1 gap
  where the resume packet pointed at a file the skill never told you to write:
  *"`dispositions.md` does not exist until you write it — no operation produces
  it, and nothing dispatches it."*
- All six dispositions, each carrying its own guard rather than just its name:
  `accepted` needs a named consequence; `answered` needs a path citation;
  `mitigated`'s mitigation must be "authored by an **advisor**, never by you" and
  must state residual risk; `deferred` flagged as "the one disposition you may
  make entirely on your own authority"; `invalidated-by-evidence` requires an
  advisor observation "never your own reasoning about the codebase."
- The must-not-disposition-alone rule (L716-722) with the doctrine's own
  framing ("deciding it yourself is opining inside an authority role, not
  dispositioning") and the remedy (dispatch the investigator and wait).
- The self-clearing prohibition (L722-726), which I had listed as missing.

Cross-linked from the red-team packet (L488-489), so the role that catches the
violation now points at the rule it violates.

## 4. A3b — dissent laundering / undefined `unresolved` (was WEAK/HIGH) → **FIXED**

The Doer's claim that the new Driver Disposition section supplies the definition
A3b needed **checks out**, and the cross-referencing is bidirectional, which is
what makes it work rather than merely co-locating the two:

- Synthesizer Avoid (L477-479): "converting an `unresolved` disposition (see
  Driver Disposition, below, for exactly what that means) into a 'consideration'
  or a 'future concern' so the packet reads clean."
- Driver Disposition (L704-706): "(This is the exact term the Synthesizer's
  dissent-laundering guard, above, refers to: converting a real `unresolved` into
  a 'consideration' so the packet reads tidier is forbidden.)"

The definition itself is operational, not just a gloss — "nobody has produced
evidence that settles it, and neither side has conceded ... goes to the person as
**visible dissent**, in the packet body, not a footnote" — plus a contrast
paragraph distinguishing a genuine `unresolved` from a claim that actually *was*
settled by concession or evidence. That contrast is the part that stops the
inverse abuse (labelling everything `unresolved` to look scrupulous), which I had
not asked for.

## 5. A2c — falsification theatre (was WEAK/MEDIUM) → **FIXED**

Restored in all three places, which is what the attack required — one alone would
have left the compliant-but-hollow path open:

- System Shaper (L356-362): "each criterion must name a condition that could
  actually occur and that the panel could observe; 'this would be wrong if the
  requirements were completely different' is falsification theatre, not a
  criterion."
- Alternative Shaper (L386-388): same discipline, cross-referenced.
- Architecture Critic (L436-439): "**Also attack a shaper's own stated
  falsification criteria** — a criterion that could never actually occur is
  itself a finding (falsification theatre disguised as rigor), and calling it out
  is decision-relevant, not a formality."

The critic's new duty is grounded in real precedent I verified independently:
`proofs/P01.3/critiques/architecture-critic.md` attack 4 does exactly this —
"*What would settle it:* Discard them. A true falsification criterion must be
observable in the present system state." So this is a restored behavior with a
live example behind it, not an invented rule.

## 6. A2b — a reframe still owes a candidate (was FAILS/MEDIUM) → **FIXED**

L379-383, bolded and named as the doctrine's own anti-pattern:

> "**A reframe still owes a candidate.** Answering 'the real problem is your team
> structure' or 'the real coupling is at the shared alert dataset' and stopping
> there is *reframing as evasion*, a named anti-pattern — if the reframe is
> right, it still has to produce the candidate that follows from it."

The Notice line that previously issued the bare invitation now carries the
pointer: "whether the framing itself is the constraint — **but noticing this is
not the finish line, see Reason**." Both halves of my round-1 finding closed.

## 7. A8b — reopen-budget exhaustion (was WEAK/MEDIUM) → **FIXED**

L668-673, a dedicated paragraph covering the case the new-cell hatch previously
missed (budget spent for reasons other than needing a fresh shaper). It forbids
both escape routes I named, by name — "never inline authorship, never 'the panel
would probably say'" — and supplies the sentence to say to the person.

## 8. A8c — `actors[].model` citation (was WEAK/LOW) → **FIXED**

L236-246 now names both layers and warns against the misleading one:

> "the request schema's own `ACTOR_ALLOWED_KEYS`
> (`src/verbs/coordination/schema.mjs:133`) *does* accept a `model` key at the
> validation layer — the real refusal is `assertModelSupportedForKind`
> (`src/verbs/coordination/run.mjs:166-175`) ... Cite that function, not the
> request whitelist, if asked to verify this rule."

Verified live: `assertModelSupportedForKind` opens at `run.mjs:166` and closes at
`:175` — the cited range is exact. This is better than the fix I suggested, which
was to simply re-point the citation; naming both layers means the next person to
verify does not rediscover the same confusion.

## A1 — not under recheck, but materially strengthened

The Scout Before Ask section was rewritten (L529-571) into three ordered tests,
and it corrects a real defect in the text I graded HOLDS in round 1. The old
wording — "it must be material ... if not, delete it" — **inverted** what the
real sessions did. The new text states the discriminator explicitly:

> "**A gap that fails test 3 is never deleted — it is carried forward as an
> explicit named default.**"

I verified the supporting claim against the source rather than the report:
`proofs/P01.3/decision-request.md`'s table has exactly **7 data rows**, and
exactly **3** are marked affirmatively user-exclusive in the source's own words
(rows 2 and 3, "**Yes — only the person can say**"; row 7, "**Yes — only the
person has this**"). "Three of its seven" is correct. The quoted closing line
("This is a recorded decision, not a skipped step...") is present verbatim. My
one round-1 residual — the doctrine's "Ceremonial questions" anti-pattern and the
coordinator prompt's "never turn an authority gap into a question" — is still
absent, and still non-disqualifying, because neither survives the three-test gate.

## New content added by the fix round — verified, no regressions found

I attacked the new material as well, since removing or reversing a prior gap is
where a fix round is most likely to introduce one.

**The Executor Roster WARNING (L166-194) is a genuine safety finding I missed in
round 1, and every element of it reproduces.**

- `node src/runner/dispatch.mjs decide <e> --has-live-task-access` returns
  `{"mechanism":"out-of-process","configured":false}` for all three of
  `claude-bwrap`, `agy-bwrap`, `codex-readonly` — reproduced verbatim.
- None of the three appears in `.fgos/config.json`'s registered executors
  (`claude`, `claude-reviewer`, `agy-cli`, `agy-herdr`, `codex-cli`, `codex-pi`,
  `glm-cli`, `claude-herdr`, `pi-herdr`, `codex-herdr`, `gitnexus`, `herdr`).
- `src/runner/dispatch/resolve.mjs:398` is `const executor = byExecutor ?? (cfg && cfg.executor);`
  — quoted exactly, and it is a silent substitution, not a refusal.
- The substituted default is `runner.executor` =
  `claude -p {prompt} --model {model} --permission-mode acceptEdits --allowedTools Bash(git add:*),Bash(git commit:*),...`
  — a mutating, git-write-enabled invocation, exactly as the WARNING states.

Forwarding the roster as written would have run all nine advisory roles on one
unconfined, git-write-capable provider with no error anywhere. The WARNING is
correctly scoped (it does not overclaim — it names `tsk-1o4`, gives the manual
workaround P01.2/P01.3 actually used, and tells you to re-run `decide` every
session).

**Reversal of the bwrap runnability gap (L204-214) is justified.** P02.1's
findings table row B7 states the same `--tmpfs /tmp`-before-rebind recipe, records
it as "fixed via a kongming design consult before P01.2's first substantive
dispatch," and classifies it as **skill-task-prose** — explicitly listed among
findings "deliberately NOT added" to the blocker list. Reclassifying it from open
gap to operating recipe matches the source. The "13 times" count is conservative:
19 run records across P01.2/P01.3 reference a bwrap pair, so the claim is
understated, not inflated.

**Two Phase-01 citation corrections are right, and both remove claims that were
false in the version I reviewed.**

- The "làm luôn cũng được" example moved from P01.3 to **P01.2** (correct — the
  phrase appears only in P01.2's artifacts) and was reclassified from "a complete,
  actionable dialogue turn" to permission-not-instruction. The quote at L74-78
  matches `proofs/P01.2/dialogue/2-impact.md` verbatim, including "I don't want
  the panel recording this as 'the person decided to build.'"
- The critique re-verification (L583-591) was reattributed from the critic to the
  **coordinator**. Correct: the critic's own artifact only ever states
  "*What would settle it:*" per attack — it names settling observations rather
  than asserting it performed them — while `proofs/P01.3/session.md:14` records
  "5 attacks + 1 conceded, 2 independently re-verified against real source" as
  the coordinator's phase-6 line.

**Link-path change is a repair, not a regression.** The protocol link moved from
`../../coordination-protocols/...` to `../../../core/coordination-protocols/...`.
The old form resolved only from `core/skills/`; it was dead in
`.agents/skills/`, which is the projection agents actually read. All 13 distinct
relative link targets now resolve from **both** `core/skills/` and
`.agents/skills/`. `core` / `.agents` / `plugins` copies are byte-identical
(`diff -q` clean, 848 lines each).

**Non-issue, recorded so it is not re-raised:** relative doc links do not resolve
from the `plugins/fgOS/skills/` copy, because `../../../` lands in `plugins/`
rather than the repo root. This is a repo-wide property of the plugin projection,
not a P04.1 defect — `fgos-group-thinking` has 3 of 3 dead and `fgos-code-panel`
4 of 4 dead by the same mechanism, and the mirror test asserts byte-identity with
`.agents/`, which is satisfied.

## Remaining recommendation

One edit closes A6b completely:

1. Phase table row 4 — change the Actor cell from `you + lead-advisor` to `you`,
   and reference the Decision Dialogue reconciliation note from that row.
2. Add one clause to the reconciliation note stating that this divergence from
   the role doctrine is a mechanical consequence of the registered graph, not a
   judgment call, so the preamble's "the deep doctrine wins" precedence rule does
   not apply to it.

Both are prose-only and do not touch any claim I verified above.

```
Status: DONE
Summary: Re-ran all 8 attacks against the rewritten skill and independently verified every new factual claim the fix round introduced; 7 of 8 are genuinely fixed, and A6b's resolution is sound but leaves the phase table still naming the lead advisor as co-author of decision-request.md.
Recheck verdict: 7 held/fixed, 1 still weak, 0 still failed
```
