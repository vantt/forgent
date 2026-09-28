# Should terminal-detail classification stay a heuristic, or become a per-agent grammar?

**Recommendation: stay in-system. Evolve `web/src/block-classify.ts`. Do not build a per-agent adapter subsystem.**

Two conditions attach, and one correction to how the question was framed. Both matter more than the headline.

---

## 1. The consequence, before the architecture

The thing you actually decide here is *what happens the next time an agent draws a shape this classifier has not seen.*

Today the answer is: someone notices in the app, files it, and a rule gets added. That is not a slur — it is literally the last three releases:

| Release | Commit | What shipped |
|---|---|---|
| 0.1.18 | `[REDACTED-COMMIT]` | "stop rules and choice menus from wrapping under real Claude Code footers" |
| 0.1.19 | `[REDACTED-COMMIT]` | "pan Claude's 'Review your answers' Q&A summary" |
| 0.1.20 | `[REDACTED-COMMIT]` | "widen reply guard tail window past Claude Code's footer" |

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

## 3. The correction: this was posed as a false dichotomy, and the [REDACTED] is right

The [REDACTED]'s dissent is live, unresolved, and I am not going to smooth it over — because checking the file confirms it.

**`block-classify.ts` is not a universal heuristic today.** It already contains hardcoded, undeclared per-agent rules:

- `:70` — `MENU_CURSOR_ITEM = /^\s*❯\s*\d{1,2}[.)]\s/` — Claude Code's selection cursor, U+276F, hardcoded.
- `:77,79` — `SUMMARY_QUESTION` / `SUMMARY_ANSWER` — Claude's "Review your answers" layout.
- `:162` — comment: *"is Claude Code's own menu, not text."*
- `:90` — comment: *"that specific repetition is Claude's own answer-summary layout."*

The comments are honest about it. The module structure is not — these sit inline among genuinely universal signals (`stableGutters`, `BOX_CHARS`, pipe-column detection) with nothing marking the boundary.

So "A vs B" was really "keep per-agent rules hidden vs. build a subsystem to hold them." The [REDACTED] names the option none of the three shapers proposed: **make the existing per-agent rules explicit and tested, and stop there.** A named, separated set of agent-specific predicates in the same module — not a `harness/` directory, not an adapter interface, not a registry, not a conformance framework. Just: the file says which rules are Claude-shaped and which are not.

The [REDACTED] also caught a real inconsistency in the panel's own reasoning, and it lands: ranking C as riskier than B while recommending "A, which is C plus discipline" is only coherent if the discipline is the entire point. It is. **The conditions below are not caveats on the recommendation — they are the recommendation.** A without them is C.

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

Condition 2 is also the [REDACTED]'s middle path, executed at its smallest honest size. If it later needs to grow into an extension point, it will grow from evidence rather than from analogy to another project.

---

## 6. What to do first

Capture one real Codex pane and one real Agy pane. Run the current classifier over them. Look at what it does.

That is one afternoon and it settles the actual disagreement. If both pan correctly, the glyph concern is closed and Condition 2 shrinks to a comment. If a Codex menu wraps, you have the first real bug this debate ever produced — and the corpus has its first two entries. Either result is worth more than another round of proposals, because **every position in this debate, including mine, is currently reasoning from zero non-Claude observations.**

---

## Unresolved

1. **Blast radius on Codex/Agy is unmeasured.** No proposal measured it. Open in this repo since PBI-061 was filed (open question #4, `docs/backlog.md:8`).
2. **The `›` glyph risk is documentary, not demonstrated** — and the documented Codex `›` is a composer prompt, not a numbered-menu cursor. Under-evidenced as originally stated; the underlying key-on-one-agent's-glyph concern stands.
3. **Fixture-commit policy is unresolved and blocks Condition 1.** Real captures are not committed by policy. Nobody has said what the corpus is made of.
4. **[REDACTED] dissent is live.** The panel posed a false dichotomy; the middle path was never evaluated by any of the three shapers. This document adopts it as Condition 2 rather than resolving the process complaint — the complaint is fair and stands on the record.
5. **The panel's own risk ranking is in tension with its recommendation** (C riskiest, yet A ≈ "C with discipline"). Resolved here only by making the discipline binding — A without both conditions is C, and should be called C.
