# explain-recommendation (real, asgn_coordinator_driver_op_039)

## Dispatched objective (verbatim)

Write the one document meant for the person, about whether herdr-gateway's terminal-detail classification (/home/vantt/projects/herdr-gateway/web/src/block-classify.ts) should stay a universal heuristic or move to a per-agent grammar -- consequence first, architecture second, defensible to colleagues who will live in the resulting codebase. The real synthesis recommendation: stay in-system (Proposal A), evolve the existing classifier, with two conditions -- source a real fixture corpus from the repo's already-catalogued composer-testdata-ground-truth candidate (airemote, scored R2 E2 F2 in the repo's own prior-art log) rather than importing collie's own conformance suite (scored R3 E1 F3, single-source, high build cost), and explicitly name the Claude-specific rules already living inside the module instead of building a separate harness/ subsystem for them. Proposal B (a full per-agent HarnessAdapter grammar, collie-inspired) is refuted on a sharper ground than the critic's own cosmetic-risk argument: collie's OWN internal tier ladder classifies read-only lift (which is what wrap/pan classification is) as Tier 1, cosmetic-risk, and reserves its fixture-corpus/conformance/live-verify machinery for Tier 2, interactive send (keystroke injection, dialog-swallowing) -- so importing collie's full apparatus is importing Tier-2 machinery for a Tier-1 capability. Proposal C (keep patching reactively, no real change) is confirmed the highest-risk of the three, by observation not argument: the last three real releases (0.1.18, 0.1.19, 0.1.20) are each one more reactive Claude-specific patch, with no corpus and no cross-agent regression testing. State plainly, unresolved: nobody's proposal actually measured the real blast radius on Codex/Agy panes (PBI-061). A genuine, concrete mechanism for real damage was found during this session: MENU_CURSOR_ITEM (the panel's own recently-added detector) hardcodes Claude Code's own selection-cursor glyph (U+276F, '❯') -- but Codex's own real captured fixture data (already in the repo, per the composer-testdata source) uses a DIFFERENT cursor glyph (U+203A, '›') for the identical UI concept. This means the classifier, as it stands today, would silently fail to recognize a real Codex selection menu as structured -- exactly the failure this whole debate is about -- and nobody has captured a real Codex or Agy fixture to confirm or refute it. Relay the independent red-team's live, unresolved dissent plainly, do not smooth it over: the red-team called this a false dichotomy, noting the panel ignored that block-classify.ts already secretly contains hardcoded per-agent (Claude-specific) rules, that a real middle path -- formalizing those existing per-agent special cases into a lightweight, explicit, tested extension point, short of importing collie's full HarnessAdapter -- was never proposed or evaluated by any of the three shapers, and that ranking reactive-patching (C) as riskier than a full per-agent grammar (B) while still recommending 'do nothing structurally different from C, just be more disciplined about it' is in tension with the panel's own risk ranking. Use absolute paths for anything you read (e.g. /home/vantt/projects/herdr-gateway/web/src/block-classify.ts). This session's own coordination bookkeeping lives at /home/vantt/projects/forgentX/.fgos/ -- you are authorized to write your result artifacts at the exact runDir path this dispatch gives you under that tree. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Wrote the decision document recommending Proposal A (stay in-system, evolve web/src/block-classify.ts) with two binding conditions: source a fixture corpus from the composer-testdata-ground-truth pattern (airemote, R2 E2 F2) rather than collie's conformance suite (R3 E1 F3), and name the Claude-specific rules in place instead of building a harness/ subsystem. Proposal B refuted on collie's own tier ladder (wrap/pan is Tier 1 read-only lift, cosmetic-risk; the fixture-corpus/conformance/live-verify machinery is gated behind Tier 2 interactive send). Proposal C confirmed highest-risk by the release log (0.1.18/0.1.19/0.1.20 each a Claude-named reactive patch). Relayed the red-team's live dissent unsmoothed and adopted its middle path as Condition 2. Corrected one dispatch premise on evidence: the Codex '›' glyph is documentation prose about airemote's upstream Go adapter, not a captured fixture in this repo, and describes Codex's composer prompt ('nothing enumerated'), not a numbered-menu cursor -- so the MENU_CURSOR_ITEM failure mechanism is a documented hypothesis, not a demonstrated bug. Surfaced one uncosted blocker no proposal raised: real captures are deliberately not committed to this repo, which is why the existing capture-based suite skips to zero on fresh checkout.",
  "recommendation": "Proposal A with two binding conditions; A without both conditions is Proposal C and should be called that.",
  "artifacts": [
    "/home/vantt/projects/forgentX/.fgos/assignments/asgn_coordinator_driver_op_039/runs/01/agent-report.md"
  ],
  "evidence_verified": [
    "web/src/block-classify.ts:70 MENU_CURSOR_ITEM hardcodes U+276F; :77,:79 SUMMARY_QUESTION/SUMMARY_ANSWER; :90,:162 comments name Claude explicitly -- the module is already per-agent, contradicting the 'universal heuristic' framing",
    "docs/distillery/porting-log.md:103 harness-adapter-capability-tiers (collie, candidate, R3 E1 F3): Tier 1 read-only lift = 'mis-detect chi hong cosmetic'; Tier 2 interactive requires fixture corpus + choreography notes + conformance suite + maintainer live-verify",
    "docs/distillery/porting-log.md:101 composer-testdata-ground-truth (airemote, candidate, R2 E2 F2): real screen fixtures + completeness assertion + 10 synthetic unseen-shape default-deny fixtures",
    "docs/distillery/sources/airemote.md:38 and porting-log.md:96 record Codex '›' vs Claude '❯'; airemote.md:38 also records an upstream 'glyph anywhere' bug that had to be tightened",
    "docs/backlog.md:8 PBI-061 open question #4 verbatim: whether Codex/Agy share the convention is 'chua biet' -- the unknown is already on record and unresolved",
    "docs/specs/terminal-detail.md:197-203 R12 forbids branching on which coding agent is running (agent name is not a stable key); :316-322 concedes live verification against only one agent's display",
    "web/test/block-classify.test.ts: 19 tests, all inputs hand-typed string literals, zero captured fixtures; the line-99 'Real Claude Code footer' comment sits above typed prose, not a capture",
    "web/test/ansi-xterm-equivalence.test.ts:15-17,155 -- real captures are not committed by policy, so the only capture-based suite describe.skipIf's to zero on fresh checkout",
    "plans/260811-1426-terminal-dom-renderer-swap/phase-01-sgr-parser-and-styled-line-model.md:105-107 -- no Codex/Agy fixture exists in the repo"
  ],
  "premise_corrections": [
    "Dispatch stated Codex's '›' is 'real captured fixture data already in the repo'. It is not: it is documentation prose in docs/distillery/sources/airemote.md:38 describing airemote's upstream Go adapter. No Codex or Agy capture is committed anywhere in this repo.",
    "Dispatch stated the two glyphs serve 'the identical UI concept'. They do not as documented: Codex's '›' is its composer prompt ('single line, nothing enumerated'), while MENU_CURSOR_ITEM matches a cursor before a numbered option. The keyed-to-one-agent's-glyph concern survives; the 'identical concept' claim does not."
  ],
  "unresolved": [
    "Blast radius on Codex/Agy panes is unmeasured by every proposal including this recommendation; open since PBI-061 was filed",
    "The MENU_CURSOR_ITEM glyph risk is documentary, not demonstrated -- no Codex or Agy pane has been captured to confirm or refute it",
    "Fixture-commit policy blocks Condition 1: real captures are excluded by policy and nobody has specified what the corpus would be made of (redacted captures, synthesised, or accepted skip-on-fresh-checkout)",
    "Red-team's process complaint (false dichotomy; middle path never evaluated by any of the three shapers) is adopted as Condition 2 but not resolved as a complaint -- it stands on the record",
    "Panel's own risk ranking (C riskiest, yet A resembles C plus discipline) is reconciled only by making the two conditions binding"
  ],
  "recommended_next_action": "Capture one real Codex pane and one real Agy pane, run the current classifier over them, and look at the result. One afternoon; settles the only disagreement that is currently reasoning from zero non-Claude observations."
}
```

## Real agent-report.md (verbatim)

# Should terminal-detail classification stay a heuristic, or become a per-agent grammar?

**Recommendation: stay in-system. Evolve `web/src/block-classify.ts`. Do not build a per-agent adapter subsystem.**

Two conditions attach, and one correction to how the question was framed. Both matter more than the headline.

---

## 1. The consequence, before the architecture

The thing you actually decide here is *what happens the next time an agent draws a shape this classifier has not seen.*

Today the answer is: someone notices in the app, files it, and a rule gets added. That is not a slur — it is literally the last three releases:

| Release | Commit | What shipped |
|---|---|---|
| 0.1.18 | `881fa33` | "stop rules and choice menus from wrapping under real Claude Code footers" |
| 0.1.19 | `15b1203` | "pan Claude's 'Review your answers' Q&A summary" |
| 0.1.20 | `c1bebce` | "widen reply guard tail window past Claude Code's footer" |

Three consecutive releases, each named after Claude Code. You can read two of them straight out of the file: `isFramingRule` + `MENU_CURSOR_ITEM` (`block-classify.ts:63,70`) is 0.1.18; `SUMMARY_QUESTION`/`SUMMARY_ANSWER`/`countSummaryPairs` (`:77-98`) is 0.1.19.

The cost of that loop is not the patches. It is that **no patch in it has ever been checked against a non-Claude pane**, because there is nothing to check against. `web/test/block-classify.test.ts` has 19 tests and every input is a hand-typed string literal — including the one at line 99 commented `// Real Claude Code footer:`, which is not a capture, it is prose someone typed to look like one. The only suite in the repo that consumes real captures (`web/test/ansi-xterm-equivalence.test.ts:15-17,155`) `describe.skipIf`s itself to zero on any fresh checkout, because real captures contain live work and are deliberately not committed.

So the honest framing is not "heuristic vs. grammar." It is: **you are shipping per-agent rules already, with no per-agent evidence.** Continuing exactly as-is (Proposal C) is the highest-risk of the three options — not by argument, by the release log.

---

## 2. Why not the full per-agent grammar (Proposal B)

The strongest refutation of B is not that it is expensive. It is that **collie's own tier ladder — the source B is drawn from — classifies this capability as the tier that does not need any of that machinery.**

From this repo's own prior-art log, `docs/distillery/porting-log.md:103` (`harness-adapter-capability-tiers`, collie, scored `R3 E1 F3`, status `candidate`, never ported):

> Tier 0 raw mirror miễn phí, **Tier 1 read-only lift (mis-detect chỉ hỏng cosmetic)**, Tier 2 interactive (yêu cầu fixture corpus + choreography notes + conformance suite xanh + maintainer live-verify trước khi bật send)

Wrap-vs-pan is read-only lift. A mis-detect makes a block pan that should have wrapped. That is Tier 1 by collie's own definition. The fixture corpus, the choreography notes, the green conformance run, the maintainer live-verify — collie gates those behind **Tier 2, interactive send**, where a mis-detect injects keystrokes into someone's live session.

Importing B is importing Tier-2 apparatus to protect a Tier-1 capability. `F3` in that row is not a guess either; the log spells out why: *"cả hệ thống tier+fence+conformance là 1 subsystem."*

**One nuance I will not hide,** because it cuts slightly against me: that same row says the conformance suite is a gate *"chung cho mọi adapter"* — for every adapter, not only Tier 2. So collie does apply some shared conformance at Tier 1. But look at what it asserts: *conservative-detection + tail-anchor + **key-grammar***. Key-grammar is `isValidHerdrKey` — a send-path invariant. Two of the three conformance assertions have no meaning for a module that emits no keystrokes. The gate is real; roughly a third of it applies here.

There is also a standing architectural commitment that B would break. `docs/specs/terminal-detail.md:197-203`, R12:

> Whether a pane has real extra history to scroll back into is discovered by actually reading it, **never assumed from which coding agent is running** — an agent can change whether it takes over the whole screen between its own versions while its name stays the same.

That reasoning transfers directly. Agent identity is not a stable key. Claude Code changed its own footer three times in three releases; the *name* never changed. A grammar dispatched on agent identity inherits that instability at its dispatch point, which is the worst place to put it.

---

## 3. The correction: this was posed as a false dichotomy, and the red-team is right

The independent red-team's dissent is live, unresolved, and I am not going to smooth it over — because checking the file confirms it.

**`block-classify.ts` is not a universal heuristic today.** It already contains hardcoded, undeclared per-agent rules:

- `:70` — `MENU_CURSOR_ITEM = /^\s*❯\s*\d{1,2}[.)]\s/` — Claude Code's selection cursor, U+276F, hardcoded.
- `:77,79` — `SUMMARY_QUESTION` / `SUMMARY_ANSWER` — Claude's "Review your answers" layout.
- `:162` — comment: *"is Claude Code's own menu, not text."*
- `:90` — comment: *"that specific repetition is Claude's own answer-summary layout."*

The comments are honest about it. The module structure is not — these sit inline among genuinely universal signals (`stableGutters`, `BOX_CHARS`, pipe-column detection) with nothing marking the boundary.

So "A vs B" was really "keep per-agent rules hidden vs. build a subsystem to hold them." The red-team names the option none of the three shapers proposed: **make the existing per-agent rules explicit and tested, and stop there.** A named, separated set of agent-specific predicates in the same module — not a `harness/` directory, not an adapter interface, not a registry, not a conformance framework. Just: the file says which rules are Claude-shaped and which are not.

The red-team also caught a real inconsistency in the panel's own reasoning, and it lands: ranking C as riskier than B while recommending "A, which is C plus discipline" is only coherent if the discipline is the entire point. It is. **The conditions below are not caveats on the recommendation — they are the recommendation.** A without them is C.

---

## 4. The concrete failure nobody has measured — stated at its real strength

`MENU_CURSOR_ITEM` hardcodes U+276F `❯`. This repo's own prior-art notes record that Codex uses a different glyph, U+203A `›`:

- `docs/distillery/sources/airemote.md:38` — *"Codex composer glyph `›` (single line, nothing enumerated); Claude `❯` inside a rule-delimited box"*
- `docs/distillery/porting-log.md:96` — *"1 adapter/agent (Codex `›`, Claude `❯` trong box)"*

**Two corrections to how this was handed to me, both of which weaken the claim as stated:**

1. **This is not a captured Codex fixture in this repo.** It is documentation prose describing airemote's *upstream Go* adapter. There is no committed Codex or Agy capture anywhere here — stated explicitly in `plans/260811-1426-terminal-dom-renderer-swap/phase-01-sgr-parser-and-styled-line-model.md:105-107`: *"No Codex/Agy fixture — none were running at corpus-capture time."*
2. **It is not the identical UI concept.** The documented `›` is Codex's *composer prompt*, and airemote's own note says "nothing enumerated" — whereas `MENU_CURSOR_ITEM` matches a cursor in front of a *numbered option* (`❯ 1. Red`). Whether Codex draws numbered selection menus, and with which glyph, is unverified.

**What survives, and it is enough:** the classifier's menu detector is keyed to one agent's glyph, and the repo has already written down that agents differ on exactly this glyph. Whether that costs anything on a Codex pane is unknown — which is the finding. The specific worry is sharp because of *why* that rule exists: `:163-164` says varying description lengths defeat the gutter check, *"the cursor is the signal that survives."* For the one shape where the cursor is the only signal, the cursor is Claude's.

Two more pieces of evidence make this more than theoretical:

- `docs/backlog.md:8` (PBI-061, `proposed`) lists as open question #4, verbatim: *"chỉ áp Claude (giống collie) hay Codex/Agy cũng có convention tương tự — **chưa biết**"* — the repo already recorded "we don't know" about Codex/Agy conventions, and has not resolved it.
- `airemote.md:38` records that upstream *already hit* a glyph-matching bug: *"an older 'glyph anywhere' form wrongly accepted a boxed menu and was tightened."* Somebody has been burned by exactly this class of rule before.

And `terminal-detail.md:316-322` already concedes the pattern at spec level: *"has only been verified, live, against one coding agent's own display."*

**Unresolved, plainly: none of the three proposals measured the real blast radius on Codex/Agy panes.** Not A, not B, not C. Nobody captured a pane. The glyph is the one concrete mechanism found this session, and it is a hypothesis with documentary support, not a demonstrated bug.

---

## 5. The two conditions

### Condition 1 — a real fixture corpus, from `composer-testdata-ground-truth`, not collie's conformance suite

`docs/distillery/porting-log.md:101` — `composer-testdata-ground-truth | airemote | candidate | R2 E2 F2`:

> Fixture màn hình thật + completeness assertion + 10 synthetic unseen-shape chứng minh default-deny; gap không backfill giả.

`R2 E2 F2` against collie's `R3 E1 F3`. Lower reach, better evidence, a third of the build cost. And its three parts map onto this classifier exactly:

- **Real captured screens** — replaces 19 hand-typed literals with bytes an agent actually emitted.
- **Completeness assertion** — a test that fails if a fixture is added and never judged. This is the piece that makes the corpus self-defending instead of decorative.
- **Synthetic unseen-shape fixtures proving default-deny** — proves the classifier is *conservative*, not *memorising a list*. This is the direct analogue of the module's own stated bias (`:15-16`: *"`pan` is the default and `wrap` is the path that has to prove itself"*). It tests the invariant, not the rules.

**A real cost nobody costed, and it is the thing most likely to sink this:** real captures are deliberately not committed to this repo — they contain live work. `ansi-xterm-equivalence.test.ts:15-17`. That is why that suite skips to zero on a fresh checkout, and why "just add a fixture corpus" is not free here. Something has to give: redacted/synthesised captures, a scrubbing step, or an accepted skip-on-fresh-checkout. **Decide this before committing to Condition 1** — it is the difference between a corpus and a second suite that silently tests nothing.

Note also: airemote's testdata lives in *its* repo (`internal/agents/testdata/`, Go). You are adopting the pattern, not importing files.

### Condition 2 — name the Claude-specific rules in place

In `block-classify.ts`, mark the agent-specific predicates as agent-specific, and give the boundary a name. No `harness/`, no adapter interface, no registry. When a Codex fixture eventually lands and `MENU_CURSOR_ITEM` misses, the diff is a glyph in a named place — not an archaeology expedition through a file that claims to be universal.

Condition 2 is also the red-team's middle path, executed at its smallest honest size. If it later needs to grow into an extension point, it will grow from evidence rather than from analogy to another project.

---

## 6. What to do first

Capture one real Codex pane and one real Agy pane. Run the current classifier over them. Look at what it does.

That is one afternoon and it settles the actual disagreement. If both pan correctly, the glyph concern is closed and Condition 2 shrinks to a comment. If a Codex menu wraps, you have the first real bug this debate ever produced — and the corpus has its first two entries. Either result is worth more than another round of proposals, because **every position in this debate, including mine, is currently reasoning from zero non-Claude observations.**

---

## Unresolved

1. **Blast radius on Codex/Agy is unmeasured.** No proposal measured it. Open in this repo since PBI-061 was filed (open question #4, `docs/backlog.md:8`).
2. **The `›` glyph risk is documentary, not demonstrated** — and the documented Codex `›` is a composer prompt, not a numbered-menu cursor. Under-evidenced as originally stated; the underlying key-on-one-agent's-glyph concern stands.
3. **Fixture-commit policy is unresolved and blocks Condition 1.** Real captures are not committed by policy. Nobody has said what the corpus is made of.
4. **Red-team dissent is live.** The panel posed a false dichotomy; the middle path was never evaluated by any of the three shapers. This document adopts it as Condition 2 rather than resolving the process complaint — the complaint is fair and stands on the record.
5. **The panel's own risk ranking is in tension with its recommendation** (C riskiest, yet A ≈ "C with discipline"). Resolved here only by making the discipline binding — A without both conditions is C, and should be called C.
