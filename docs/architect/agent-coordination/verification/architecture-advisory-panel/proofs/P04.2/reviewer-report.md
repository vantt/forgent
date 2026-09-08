# P04.2 independent Reviewer report — surface, examples, and dialogue

Reviewer: independent (`p04-2-reviewer`), 2026-09-06. Formed without reading
the Doer's own report first.

Scope reviewed: `docs/how-to/use-fgos-architecture-panel.md` (218 lines) and
all 8 files under `docs/how-to/coordination-examples/architecture-advisory-panel-v1-*.md`
(1067 lines), against `core/skills/fgos-architecture-panel/SKILL.md`,
`core/coordination-protocols/architecture-advisory-panel-v1.yaml`,
`plans/260905-architecture-advisory-panel/phase-04-production-skill-and-dialogue.md`,
and the real P01.2/P01.3 proof artifacts.

**Verdict: 10 findings (3 high, 3 medium, 4 low).** The work is substantially
real — the grounding in P01.2/P01.3 is accurate wherever I checked it, the
disclosed manual-playbook-vs-bounded-graph divergence is handled honestly, and
the doer's Step-1 investigation claim holds under independent reproduction.
Three findings are genuine production defects, not style: a published reopen
shape that silently starves the synthesizer of the ledger (R1), a
copy-pasteable roster block binding all 8 advisory roles to a git-write-enabled
executor (R3), and a CHANGELOG claim about the artifacts that is measurably
false (R2).

---

## Independent reproduction of the Step-1 investigation claim (item 1) — HOLDS

I did not take the doer's word for it. I built my own scratch sandbox
(`.fgos/config.json` with a fake `cli-spawn` executor), took the
`clear-start` example's request JSON **verbatim, unmodified**, and drove it
through the real CLI:

```
node bin/fgos.mjs coordination run --file request-1.json --dir <scratch> --cwd <scratch>
```

The request was accepted, the session opened, all 8 declared actors were
bound, and two Assignments were created and dispatched through the real
`declared-protocol` path (13 events on the log). My fake executor's cwd
assumption was wrong so the two runs came back `failed`, which is my
fixture's fault and not the example's — the point proven is that the
published request JSON is schema-valid and drives the registered protocol
through the plain door with no new verb.

`fgos coordination show <id> --json` then returned, with no chat history and
no raw log:

- `status: active`, `phase: running`, `eventCount: 13`
- `definitionRef: core.coordination-protocol.architecture-advisory-panel-v1@1.0.0`
- `quorum.missing`: 6 actors by real actor id
  (`system-shaper-actor`, `alternative-shaper-actor`, `constraint-advocate-actor`,
  `architecture-critic-actor`, `synthesizer-actor`, `red-team-actor`)
- `pendingDriverAuthorizations`: **9 entries**, each naming nodeId +
  operationId + actorId — `critique-proposals`, `assess-constraints`,
  `answer-specialist-question`, `synthesize-recommendation`,
  `red-team-packet`, `explain-recommendation`, `revise-synthesis`,
  `revise-explanation`, `close-dialogue`.

That is genuinely sufficient orientation to know what to do next without
reconstructing chat. **The claim that no new use-case or CLI verb is needed
is confirmed, independently.** (One sub-claim I could not reproduce — the
lead-advisor-still-missing detail — is separately corroborated by a real
passing conformance assertion; see R10.)

## Real-vs-constructed disclosure honesty (item 2) — HOLDS

All 8 files carry a disclosure. Seven are explicit and unambiguous; the
eighth (heterogeneous/homogeneous) labels its heterogeneous half but not its
homogeneous half, which is a gap only because of R3.

I spot-checked five "real" claims against source, not three:

| Claim | Source | Verdict |
|---|---|---|
| P01.2 Turn 1 verbatim: "anh bỏ quên, vì nhiều việc quá..." | `proofs/P01.2/human/1-person.md` | exact |
| P01.2 Turn 2 verbatim (two answers) | `proofs/P01.2/human/2-person.md` | accurate, one undisclosed typo fix (R8) |
| explanation quote "Keep the daemon as the single authority... Step 5 is cheap and it changes everything downstream" | `proofs/P01.2/explanation.md:11,22` | exact, elisions disclosed |
| "5 attacks, 1 conceded, 2 decision-changing" (P01.2) and "5 attacks, 1 conceded" (P01.3) | `P01.2.md:46`, `P01.3.md:82` | exact |
| final outcome: four named fixes, Windows packaging deferred, telemetry-first dropped | `proofs/P01.2/dialogue/2-response.md:8-20` | exact |
| P01.3 clarify turn "giải thích lại câu hỏi", three utterances, kongming consultation | `proofs/P01.3/human/1-person.md`, `dialogue/1-impact.md` | exact |

No misattribution of the P04.1 kind found. The one drift is R4 ("reproduced
in full" for a paraphrased table).

## The disclosed divergence (item 3) — handled honestly, credit due

`architecture-advisory-panel-v1-material-context-reopen.md` does not paper
over the gap. It opens by naming it ("this file's own second half is a
deliberate, disclosed rewrite"), states what the manual playbook did (a real
Phase-3 reopen that found a real defect, with a working link to
`scout-report-followup-1.md`), then states plainly that
`phase-dialogue-reopen` offers exactly three operations and none re-dispatches
the context investigator. It then does the harder thing: it presents an honest
fork, says the real case fell on the *harder* side ("as it did for real here,
since 'does the shell still build against the current daemon' is a
scout-answerable question no amount of re-reasoning over existing evidence can
settle"), and shows the new-cell request rather than pretending
`revise-synthesis` can cover it. That matches the registered graph exactly
(verified against the YAML) and matches SKILL.md's own Bounded Reopen Scope.

This is the correct handling. It promises nothing the graph cannot do.

## Protocol id and per-actor routing (item 4) — FAILS, see R2

Grep-counted, all 8 files: 3 name the protocol id, 1 shows an `actors[]`
block, **0 do both**. CHANGELOG.md:15 tells users all 8 do both.

## Heterogeneous/homogeneous correctness (item 5) — semantics right, safety wrong

The semantic distinction is correct and well stated: "Homogeneous means 'same
provider,' never 'same context or session.'... `architecture-critic` still
never sees a shaper's private working notes; `red-team` still gets a fresh
assignment routed independently of the synthesizer's own run, on the same
executor, not the same invocation." That is accurate against the graph — I
confirmed `required` bindings carry `contextGrant: undefined` (opt-in grant
only, nothing auto-propagated) and the 8 static actors each get their own
Assignment.

The heterogeneous roster matches P00.1's admitted allowlist exactly
(`codex-readonly`, `claude-bwrap`, `agy-bwrap`; `claude-reviewer` correctly
absent, it was `allowlist-rejected`). The cited conformance case exists and
its `model-a-critical` vs `model-a-analytical` claim is accurate
(conformance test lines 1013, 1092-1093).

The homogeneous half is where it breaks — see **R3**.

## How-to doc accuracy (item 6) — accurate except R9

Checked against the YAML and SKILL.md: the 9-role count, the nine-phase
table, the node/operation/actor/gating mapping, the `maxInvocations: 2` caps,
the "no backward edge" narrowing, the resume order, and the "Both dispatch
blind to each other" claim all hold. The blindness claim I verified
mechanically, not by reading prose. One inconsistency (R9): the dialogue
table header implies one shared pool of two reopens; the cap is per binding.

## Loss-of-soul, adversarial read of two examples (item 7)

**`clarification-and-challenge.md` — passes on discipline, fails on grounding.**
This file does the thing that separates advisory writing from ceremony: it
argues *against* the flattering action. "A challenge that merely restates a
disagreement the packet already visibly carries earns a defense, not a
reopen. Spending a reopen on a challenge that changes nothing is how a
two-invocation budget gets burned on ceremony instead of the genuinely new
material it exists for." That is real judgment with a real cost attached, and
it is the opposite of checklist filler. But the constructed turn it hangs
this on misreads the real recommendation — see **R5**. Verdict: genuine
advisory voice, defective evidence.

**`decision-request-and-resume.md` Part 2 — this is the one section that reads
as ceremony.** It demonstrates the *form* of a good consolidated Decision
Request while declining to do the actual work: the section whose whole lesson
is "state your current default up front" literally prints
`"we'll proceed with [named default] for #1 and [named default] for #2"`. Its
two questions (data residency, contractual SLA) are stock consulting
boilerplate attached to no case, no scout finding, and no repository — the
exact "generic risk recitation ... regardless of relevance" shape SKILL.md
names as an anti-pattern. See **R6**. Part 1 and Part 3 of the same file are
strong; this is a localized defect, not a whole-file verdict.

For balance: the other six files read as genuine. `unclear-start.md`'s
account of the panel refusing to author a tiebreak ("The synthesis correctly
refused to pick between three competing mechanisms for one remaining seam
when no shaper had produced a fact that would separate them — it named the
missing observation instead of authoring a tiebreak nobody had earned") and
`final-decision-and-defer.md`'s insistence that *"làm luôn cũng được"* was
"permission, not instruction" are both real, verified-against-source, and are
precisely the kind of thing a checklist-satisfying generator does not
produce.

## The two pre-existing bugs (item 8) — both fixes verified independently

- `test/runner/flow-definition-protocol-loader.test.mjs` line 58 now lists
  `'core.coordination-protocol.architecture-advisory-panel-v1'`, and line 54's
  test name names it. **14/14 pass.**
- `core/skills/fgos-architecture-panel/SKILL.md` — grep for `P01.3 D1` returns
  nothing, in both the core source and the `.agents/` projection.
  `test/scripts/check-decision-citation-drift.test.mjs`: **31/31 pass.**

## Test runs (item 9)

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' \
  'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'
→ tests 757 | pass 757 | fail 0

node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs
→ tests 39 | pass 39 | fail 0

node --test test/scripts/check-decision-citation-drift.test.mjs   → 31/31 pass
node --test test/runner/flow-definition-protocol-loader.test.mjs  → 14/14 pass

npm test
→ tests 5695 | pass 5686 | fail 3 | skipped 6 | duration 187.9s
```

The 3 full-suite failures are a strict **subset** of plan.md's recorded
4-item baseline — **0 new failures**:

1. `test/cli/fgos-intake-4.test.mjs:318` — legacy durable-doing ask/answer
   (`seq: 3` vs expected `2`). Baseline item 1.
2. `test/report/enduser-index.test.mjs:187` — "expected docs/tutorials to
   exist today so this test can hide it". Baseline item 2.
3. `test/setup/coordination-doctor-check.test.mjs:42` — placeholder charset
   in `group-thinking-nominal-group-lite-resume-request.json` and
   `group-thinking-rfc-review-lite-resume-request.json`. Baseline item 4.

Baseline item 3 (live codex usage-limit) did not surface. Nothing in the
failure set touches the architecture-advisory-panel track. The two
regressions the Coordinator fixed are confirmed gone.

Relative-link check over `use-fgos-architecture-panel.md`, all 8 example
files, and `SKILL.md`, using plan.md's exact command: **all relative links
resolve.** `docs/enduser-docs-index.json` carries
`docs/how-to/use-fgos-architecture-panel.md`; the `coordination-examples/`
subdirectory is not indexed for any protocol, so that is consistent, not a
gap. `CHANGELOG.md` has an Unreleased entry (but see R2).

---

## Reproduction of R1 (the one finding worth re-running yourself)

R1 is the finding most likely to be waved off as pedantic, so here is the
exact repro. Copy `test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`,
keep only the full-chain test, and change the `revise-synthesis` authorize to
the shape the examples publish:

```js
- grantedContextRefs: [synthId, critiqueId, assessId],
+ grantedContextRefs: [],
```

The test still passes. Then print the resulting Assignment's grant:

```
PROBE revise assignment contextGrant = {"refs":[]}
PROBE original synth contextGrant = {"refs":["asgn_aap_driver_op_001", ... 7 refs ]}
```

The reopen dispatches a synthesizer that can read none of the proposals, none
of the critique, and not even its own prior synthesis — while the surrounding
prose tells the reader it is "re-weighting the existing ledger". It fails
silently, which is the whole problem.

---

## Recommended actions, in order

1. **R1** — fix the published `grantedContextRefs` on all four reopen/close
   fragments. This is the one that would produce a bad session in production.
2. **R3** — remove or warn the `claude` homogeneous roster block.
3. **R2** — either satisfy the phase-04 requirement in the 8 files, or
   correct CHANGELOG.md:15 to describe what shipped.
4. **R5, R6** — re-ground the constructed challenge turn; fill in the
   Decision Request's defaults.
5. **R4, R7, R8, R9, R10** — cheap corrections, all mechanical.

## Unresolved questions

- **R2's fix is a scope decision, not mine to make.** clear-start.md's
  deviation is deliberate and DRY-motivated; the requirement is explicit and
  the CHANGELOG claim is false. Somebody has to choose which one moves — I am
  flagging both, not picking.
- **R3's homogeneous replacement depends on product intent.** If no confined
  single-provider pair exists on a one-provider host, the honest answer may be
  that homogeneous fallback is not currently safe to run at all, which is a
  larger statement than a doc edit. That is a call for the track owner.
