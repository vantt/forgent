# Blind scorer report — case-2 (asgn_i27_scorer_driver_op_002)

Sources read in order: `question.md`, `redteam-findings-source.md`, `control-objections-source-X.md`, `control-objections-source-Y.md`, `explanation-X.md`, `explanation-Y.md`, `ground-truth.md`. No other files.

PRESENT = same object + same risk/failure + same consequence, any wording. Adopting, conditioning-on, or naming-and-rebutting all count. No partial credit.

---

## RT findings (frozen list)

**RT-1.** The decision was trapped in a paralyzing dichotomy: either over-engineer a full `HarnessAdapter` (Proposal B) for a cosmetic wrap/pan issue, or accept guaranteed architectural degradation from reactive patching (Proposal C), with no cheaper structural alternative in view.
- Quote: “By framing the debate this way, the panel accepted a paralyzing dichotomy: either over-engineer for a cosmetic issue, or accept guaranteed architectural degradation.”

**RT-2.** `block-classify.ts` is already per-agent in fact: it hardcodes Claude Code grammar (`MENU_CURSOR_ITEM`, `SUMMARY_QUESTION` / `SUMMARY_ANSWER`) inside a nominally universal classifier, so debating a “universal heuristic” as a pure abstract reality is false.
- Quote: “In truth, `[REDACTED]/web/src/block-classify.ts` is already infected with per-agent grammar. It contains hardcoded logic specifically for Claude Code, explicitly documented in comments: - `MENU_CURSOR_ITEM` (“Claude Code's own menu”) - `SUMMARY_QUESTION` / `SUMMARY_ANSWER` (“Claude's own answer-summary layout”).”

**RT-3.** A middle path was not evaluated: formalize those existing undocumented per-agent special cases into an explicit, tested, lightweight per-agent extension point/registry, short of a full `HarnessAdapter` (extract the existing per-agent hacks into a formalized extension point).
- Quote: “Did anyone seriously evaluate a middle path (e.g., formalizing the already-existing but undocumented per-agent special cases inside `block-classify.ts` into an explicit, tested per-agent extension point)? **No.**”
- Quote: “failed to propose the obvious, cheap structural fix: extracting the existing per-agent hacks into a formalized extension point.”

**RT-4.** Maintaining a nominally “universal” classifier that secretly relies on Claude-specific heuristics risks false positives on Codex and Agy panes; PBI-061’s undocumented blast radius (unknown whether the convention applies only to Claude or also Codex/Agy) was not treated as a central constraint.
- Quote: “PBI-061 (`backlog.md`) explicitly notes an open risk: `(4) chỉ áp Claude (giống collie) hay Codex/Agy cũng có convention tương tự — chưa biết`.”
- Quote: “By maintaining a nominally “universal” classifier that secretly relies on Claude-specific heuristics, they are actively risking false positives on Codex and Agy panes.”

Excluded as agreement/restatement/process: that rejecting B because the failure is cosmetic (unlike collie incident #34) is internally coherent; restatement of the panel’s own ranking of C as architectural rot; “intellectually dishonest” / conduct wording.

---

## CX findings (frozen list)

From `control-objections-source-X.md` (architecture critique rejecting B + constraint-advocate ranking).

**CX-1.** Nominally universal `block-classify.ts` / `looksStructured` already hardcodes Claude-specific regexes (`MENU_CURSOR_ITEM`/`MENU_ITEM`, `SUMMARY_QUESTION`/`SUMMARY_ANSWER`, `BOX_CHARS` arrow exclusion); about 3 of ~5 structural heuristics are single-agent-shaped, violating the universal mandate.
- Quote: “`block-classify.ts` is already violating its “universal” mandate by hardcoding agent-specific regexes (e.g., Claude's `SUMMARY_QUESTION` and `MENU_CURSOR_ITEM`).”
- Quote: “3 of ~5 structural heuristics in a “universal” file are actually single-agent-shaped.”

**CX-2.** Proposal B mismatches domain severity: collie’s `HarnessAdapter` exists because a false positive is destructive (Tier-2 executable native buttons; stray keystroke into a live shell; wrong-dialog message loss / incident #34), whereas herdr classification is visual wrap vs pan with R22/R25 asymmetric cosmetic cost (“getting it wrong in the R22 direction leaves the block exactly as it always looked”; wrong-toward-`pan` never data loss or misdirected input).
- Quote: “A false positive in Collie injects a stray keystroke into a live, running shell—a destructive capability.”
- Quote: “The cost of a false positive is purely cosmetic.”

**CX-3.** Importing collie’s heavy, registry-bound `HarnessAdapter` machinery (fixture corpora, capability fences, fail-closed detectors, CI gates, 3-tier subsystem) to decide CSS word-wrapping is architectural overkill / disproportionate engineering; pan fallback is already acceptable; an occasional regex-collision mis-wrap has microscopic blast radius versus per-agent-registry maintenance. Reject B.
- Quote: “Importing Collie's heavy, registry-bound `HarnessAdapter` machinery just to decide CSS word-wrapping is architectural overkill.”
- Quote: “if a global heuristic (Proposal C) occasionally mis-wraps a line due to a regex collision, the blast radius is microscopic compared to the maintenance burden of a per-agent registry.”

**CX-4.** Proposal C / status quo is already incident-driven drift: three successive reactive patches, each narrowing the shared function around one agent’s UI quirks.
- Quote: “three reactive patches in quick succession, each narrowing a shared function around one agent's UI quirks” — subjects “widen reply guard tail window past Claude Code's footer,” “pan Claude's Review your answers Q&A summary,” “stop rules and choice menus from wrapping under real Claude Code footers.”

**CX-5.** There is no regression/fixture corpus (`terminal-detail.md` Open Gaps: real miss rates have not been measured against a corpus of the output the operator actually reads), so every reactive patch is validated only against the last incident, not other agents.
- Quote: “Real miss rates have not been measured against a corpus of the output the operator actually reads” — “there is no regression/fixture corpus today.”

**CX-6.** PBI-061 undocumented blast radius: `agent_presets` already supports Claude/Codex/Agy (PBI-036); it is unknown whether Codex/Agy have equivalent UI conventions; Claude-tuned regexes in one shared function may false-positive on every other agent and plain-shell pane, and nobody is testing that.
- Quote: “PBI-061 explicitly flags as unknown whether Codex/Agy have equivalent UI conventions the Claude-tuned regexes might misfire on.”
- Quote: “a patch tuned to fix Claude Code has undocumented blast radius on every other agent and plain-shell pane — nobody is testing that.”

**CX-7.** Prior-art for B is E1: `harness-adapter-capability-tiers` scored R3 E1 F3 from only one source (collie), not independently converged.
- Quote: “E1 = only one source (collie), not independently converged like other patterns in the same log.”

**CX-8.** B is F3: an entire subsystem (tier ladder + capability fence + conformance suite), not a small local change.
- Quote: “F3 = ‘an entire subsystem’ (tier ladder + capability fence + conformance suite).”

**CX-9.** B is green-field: `web/src/lib/harness/` does not exist yet — a new build, not an extension.
- Quote: “`web/src/lib/harness/` does not exist yet — this is a green-field build, not an extension.”

**CX-10.** Splitting into per-agent adapters has short-term cutover/regression risk: 20+ locked `terminal-detail.md` decision IDs (R21–R30 govern the classifier), existing unit tests assume one shared classifier, and there is no fixture corpus yet to validate a split.
- Quote: “`terminal-detail.md` has 20+ locked decision IDs (R21-R30 specifically govern the classifier) and existing unit tests assume one shared classifier. Splitting into per-agent adapters means re-deriving/reconciling those decisions per adapter with no fixture corpus yet built to validate against — real short-term regression risk during the cutover itself.”

**CX-11.** B’s real upside is that it forces a fixture corpus and conformance suite as a hard gate rather than relying on someone remembering tests; that case gets stronger if herdr later includes interactive per-agent send/detect, because B is currently sized for a harder problem than wrap/pan.
- Quote: “this is the one option that *forces* the missing rigor (fixture corpus + conformance suite as a hard gate).”
- Quote: “If herdr-gateway's problem space grows to include interactive per-agent send/detect logic (not just passive wrap/pan), B's evidence case gets stronger.”

**CX-12.** A is lower-risk than C only if “stay in-system” is paired with an explicit, checked fixture/regression corpus from each already-supported agent (Claude, Codex, Agy) run against `looksStructured` before merging patches; without that gate A is indistinguishable from C (same file, same drift, same undocumented Codex/Agy blast) and should be re-ranked risk-equivalent to C.
- Quote: “A is lower risk than C **only if** “stay in-system” is paired with closing the admitted gap: building a real fixture/regression corpus captured from each already-supported agent kind (Claude, Codex, Agy).”
- Quote: “without that explicit corpus commitment, A is indistinguishable from C.”
- Quote: “If the driver picks A without that gate, re-rank it as risk-equivalent to C.”

Excluded: sandbox/process notes (could not read op_032/033/034; `git log` denied).

---

## CY findings (frozen list)

From `control-objections-source-Y.md`. The source text is the same as X; the enumeration is independent and yields the same atoms.

**CY-1.** Nominally universal `block-classify.ts` / `looksStructured` already hardcodes Claude-specific regexes (`MENU_CURSOR_ITEM`/`MENU_ITEM`, `SUMMARY_QUESTION`/`SUMMARY_ANSWER`, `BOX_CHARS` arrow exclusion); about 3 of ~5 structural heuristics are single-agent-shaped, violating the universal mandate.
- Quote: “`block-classify.ts` is already violating its “universal” mandate by hardcoding agent-specific regexes (e.g., Claude's `SUMMARY_QUESTION` and `MENU_CURSOR_ITEM`).”
- Quote: “3 of ~5 structural heuristics in a “universal” file are actually single-agent-shaped.”

**CY-2.** Proposal B mismatches domain severity: collie’s `HarnessAdapter` exists because a false positive is destructive (Tier-2 executable native buttons; stray keystroke into a live shell; wrong-dialog message loss / incident #34), whereas herdr classification is visual wrap vs pan with R22/R25 asymmetric cosmetic cost (“getting it wrong in the R22 direction leaves the block exactly as it always looked”; wrong-toward-`pan` never data loss or misdirected input).
- Quote: “A false positive in Collie injects a stray keystroke into a live, running shell—a destructive capability.”
- Quote: “The cost of a false positive is purely cosmetic.”

**CY-3.** Importing collie’s heavy, registry-bound `HarnessAdapter` machinery (fixture corpora, capability fences, fail-closed detectors, CI gates, 3-tier subsystem) to decide CSS word-wrapping is architectural overkill / disproportionate engineering; pan fallback is already acceptable; an occasional regex-collision mis-wrap has microscopic blast radius versus per-agent-registry maintenance. Reject B.
- Quote: “Importing Collie's heavy, registry-bound `HarnessAdapter` machinery just to decide CSS word-wrapping is architectural overkill.”
- Quote: “if a global heuristic (Proposal C) occasionally mis-wraps a line due to a regex collision, the blast radius is microscopic compared to the maintenance burden of a per-agent registry.”

**CY-4.** Proposal C / status quo is already incident-driven drift: three successive reactive patches, each narrowing the shared function around one agent’s UI quirks.
- Quote: “three reactive patches in quick succession, each narrowing a shared function around one agent's UI quirks” — subjects “widen reply guard tail window past Claude Code's footer,” “pan Claude's Review your answers Q&A summary,” “stop rules and choice menus from wrapping under real Claude Code footers.”

**CY-5.** There is no regression/fixture corpus (`terminal-detail.md` Open Gaps: real miss rates have not been measured against a corpus of the output the operator actually reads), so every reactive patch is validated only against the last incident, not other agents.
- Quote: “Real miss rates have not been measured against a corpus of the output the operator actually reads” — “there is no regression/fixture corpus today.”

**CY-6.** PBI-061 undocumented blast radius: `agent_presets` already supports Claude/Codex/Agy (PBI-036); it is unknown whether Codex/Agy have equivalent UI conventions; Claude-tuned regexes in one shared function may false-positive on every other agent and plain-shell pane, and nobody is testing that.
- Quote: “PBI-061 explicitly flags as unknown whether Codex/Agy have equivalent UI conventions the Claude-tuned regexes might misfire on.”
- Quote: “a patch tuned to fix Claude Code has undocumented blast radius on every other agent and plain-shell pane — nobody is testing that.”

**CY-7.** Prior-art for B is E1: `harness-adapter-capability-tiers` scored R3 E1 F3 from only one source (collie), not independently converged.
- Quote: “E1 = only one source (collie), not independently converged like other patterns in the same log.”

**CY-8.** B is F3: an entire subsystem (tier ladder + capability fence + conformance suite), not a small local change.
- Quote: “F3 = ‘an entire subsystem’ (tier ladder + capability fence + conformance suite).”

**CY-9.** B is green-field: `web/src/lib/harness/` does not exist yet — a new build, not an extension.
- Quote: “`web/src/lib/harness/` does not exist yet — this is a green-field build, not an extension.”

**CY-10.** Splitting into per-agent adapters has short-term cutover/regression risk: 20+ locked `terminal-detail.md` decision IDs (R21–R30 govern the classifier), existing unit tests assume one shared classifier, and there is no fixture corpus yet to validate a split.
- Quote: “Splitting into per-agent adapters means re-deriving/reconciling those decisions per adapter with no fixture corpus yet built to validate against — real short-term regression risk during the cutover itself.”

**CY-11.** B’s real upside is that it forces a fixture corpus and conformance suite as a hard gate rather than relying on someone remembering tests; that case gets stronger if herdr later includes interactive per-agent send/detect, because B is currently sized for a harder problem than wrap/pan.
- Quote: “this is the one option that *forces* the missing rigor (fixture corpus + conformance suite as a hard gate).”
- Quote: “If herdr-gateway's problem space grows to include interactive per-agent send/detect logic (not just passive wrap/pan), B's evidence case gets stronger.”

**CY-12.** A is lower-risk than C only if “stay in-system” is paired with an explicit, checked fixture/regression corpus from each already-supported agent (Claude, Codex, Agy) run against `looksStructured` before merging patches; without that gate A is indistinguishable from C and should be re-ranked risk-equivalent to C.
- Quote: “without that explicit corpus commitment, A is indistinguishable from C.”
- Quote: “If the driver picks A without that gate, re-rank it as risk-equivalent to C.”

Excluded: sandbox/process notes (could not read op_032/033/034; `git log` denied).

---

## RT marks in X

**RT-1 — PRESENT.** Same object (A/B/C option set), same failure (false dichotomy omitting a cheaper structural path), same consequence (need the omitted option / C-as-degradation vs B-as-overkill is not the real choice).
- Quote: “The correction: this was posed as a false dichotomy, and the [REDACTED] is right”
- Quote: “The panel posed a false dichotomy; the middle path was never evaluated by any of the three shapers.”

**RT-2 — PRESENT.** Same object (nominally universal `block-classify.ts`), same failure (hardcoded Claude grammar), same consequence (the heuristic is not universal).
- Quote: “**`block-classify.ts` is not a universal heuristic today.** It already contains hardcoded, undeclared per-agent rules:”
- Quote: “`:70` — `MENU_CURSOR_ITEM = /^\s*❯\s*\d{1,2}[.)]\s/` — Claude Code's selection cursor, U+276F, hardcoded.”
- Quote: “`:77,79` — `SUMMARY_QUESTION` / `SUMMARY_ANSWER` — Claude's “Review your answers” layout.”

**RT-3 — PRESENT.** Same object (middle path short of full `HarnessAdapter`), same failure (unformalized hidden per-agent rules), same consequence (need explicit tested special cases). Names-and-rebuts registry/extension-point form while adopting in-module named predicates.
- Quote: “The [REDACTED] names the option none of the three shapers proposed: **make the existing per-agent rules explicit and tested, and stop there.** A named, separated set of agent-specific predicates in the same module — not a `harness/` directory, not an adapter interface, not a registry, not a conformance framework.”
- Quote: “Condition 2 is also the [REDACTED]'s middle path, executed at its smallest honest size. If it later needs to grow into an extension point, it will grow from evidence rather than from analogy to another project.”

**RT-4 — PRESENT.** Same object (Claude-tuned classifier vs Codex/Agy), same risk (unmeasured/false-positive blast), same consequence (PBI-061 still open).
- Quote: “`docs/backlog.md:8` (PBI-061, `proposed`) lists as open question #4, verbatim: *“chỉ áp Claude (giống collie) hay Codex/Agy cũng có convention tương tự — **chưa biết**”*”
- Quote: “**Unresolved, plainly: none of the three proposals measured the real blast radius on Codex/Agy panes.**”

---

## RT marks in Y

**RT-1 — ABSENT.** Y never states a paralyzing/false dichotomy of over-engineering B versus architectural degradation from C, and never treats that framing as a failure of the option set. Surface/altitude remarks about “universal heuristic or per-agent grammar” are not that finding.

**RT-2 — PRESENT.** Same object, same failure (Claude-specific rules inside a pretended-universal module), same consequence.
- Quote: “You keep one module that already contains Claude-specific rules, and you make those rules visible by name instead of pretending the heuristic is universal.”
- Quote: “The word “universal” in the question reads as an aspiration the module never met, not a property it has.”

**RT-3 — PRESENT.** Adopts formalizing existing special cases short of a `HarnessAdapter` (label in place; not `harness/`; not an adapter interface).
- Quote: “**Condition 2: name the Claude-specific rules that already live in the module.** Do not move them into a `harness/` directory. Do not build an adapter interface for them. Label them where they are, so that a reader of the file can see which lines assume Claude Code and which lines are agent-neutral.”

**RT-4 — PRESENT.** Same object (Codex/Agy blast / PBI-061), same unmeasured false-positive risk, same open consequence.
- Quote: “Nobody's proposal measured the real blast radius on Codex or Agy panes. That is the PBI-061 gap and it stays open.”
- Quote: “You accept that the question of what actually breaks on Codex and Agy panes stays open until someone captures a real fixture from each.”

---

## CX marks in X

**CX-1 — PRESENT.**
- Quote: “**`block-classify.ts` is not a universal heuristic today.** It already contains hardcoded, undeclared per-agent rules:” plus `MENU_CURSOR_ITEM` and `SUMMARY_QUESTION`/`SUMMARY_ANSWER`. (X treats `BOX_CHARS` as a genuine universal signal; that extra CX example is not required for the same object/failure/consequence.)

**CX-2 — PRESENT.** Wrap/pan as read-only cosmetic mis-detect vs collie Tier-2 keystroke injection; used to reject B.
- Quote: “Wrap-vs-pan is read-only lift. A mis-detect makes a block pan that should have wrapped.”
- Quote: “collie gates those behind **Tier 2, interactive send**, where a mis-detect injects keystrokes into someone's live session.”
- Quote: “Importing B is importing Tier-2 apparatus to protect a Tier-1 capability.”

**CX-3 — PRESENT.** Rejects building the adapter subsystem as Tier-2 apparatus / F3 subsystem for a Tier-1 capability (same overkill object, failure, and reject-B consequence). Naming that expense is “not the strongest” refutation is not a denial of overkill.
- Quote: “Do not build a per-agent adapter subsystem.”
- Quote: “Importing B is importing Tier-2 apparatus to protect a Tier-1 capability.”
- Quote: “`F3` … *“cả hệ thống tier+fence+conformance là 1 subsystem.”*”

**CX-4 — PRESENT.** Same three Claude-named patches as consecutive releases.
- Quote: “That is not a slur — it is literally the last three releases:” table rows 0.1.18 “stop rules and choice menus from wrapping under real Claude Code footers”; 0.1.19 “pan Claude's 'Review your answers' Q&A summary”; 0.1.20 “widen reply guard tail window past Claude Code's footer.”
- Quote: “Three consecutive releases, each named after Claude Code.”

**CX-5 — PRESENT.** No real corpus; patches never checked against non-Claude panes; tests are hand-typed literals; live captures not committed.
- Quote: “The cost of that loop is not the patches. It is that **no patch in it has ever been checked against a non-Claude pane**, because there is nothing to check against.”
- Quote: “`web/test/block-classify.test.ts` has 19 tests and every input is a hand-typed string literal”

**CX-6 — PRESENT.** PBI-061 open; Codex/Agy blast unmeasured.
- Quote: PBI-061 question #4 “chưa biết” (see RT-4).
- Quote: “none of the three proposals measured the real blast radius on Codex/Agy panes.”

**CX-7 — ABSENT.** X prints the score token `R3 E1 F3` but never states E1 = only one source / not independently converged. No inference from the letter.

**CX-8 — PRESENT.**
- Quote: “`F3` in that row is not a guess either; the log spells out why: *“cả hệ thống tier+fence+conformance là 1 subsystem.”*”

**CX-9 — ABSENT.** X says not to create a `harness/` directory; it never states that `web/src/lib/harness/` does not exist or that B would be green-field.

**CX-10 — ABSENT.** X argues R12 (agent identity is not a stable dispatch key) and footer churn under a constant name. That is not cutover regression from 20+ locked IDs / tests that assume one shared classifier.

**CX-11 — ABSENT.** X does not credit B as the option that forces corpus/conformance as a hard gate, nor say B’s case strengthens if interactive send/detect arrives. Condition 1 adopts an airemote corpus under A instead.

**CX-12 — PRESENT.** Conditions are the recommendation; A without them is C.
- Quote: “ranking C as riskier than B while recommending “A, which is C plus discipline” is only coherent if the discipline is the entire point. It is. **The conditions below are not caveats on the recommendation — they are the recommendation.** A without them is C.”
- Quote: “A without both conditions is C, and should be called C.”

---

## CY marks in Y

**CY-1 — PRESENT.**
- Quote: “You keep one module that already contains Claude-specific rules, and you make those rules visible by name instead of pretending the heuristic is universal.”
- Quote: “The two real gaps (no corpus, unnamed Claude-specific rules)”

**CY-2 — PRESENT.** Cosmetic wrap/pan vs keystroke injection / dialog-swallowing; critic’s cosmetic argument called correct; collie Tier 1 vs Tier 2.
- Quote: “A wrong classification wraps or pans a block incorrectly. It does not inject keystrokes, swallow dialogs, or lose data.”
- Quote: “The critic's argument against it was that the risk is cosmetic, so a grammar is overkill. That argument is correct but soft.”
- Quote: “Collie reserves its fixture-corpus, conformance-suite, and live-verify machinery for Tier 2, interactive send: keystroke injection and dialog-swallowing.”

**CY-3 — PRESENT.** Assembly cost / full apparatus for a cosmetic/Tier-1 capability; reject B.
- Quote: “you never pay the assembly cost of an adapter architecture for a capability whose own reference implementation treats it as cosmetic.”
- Quote: “Importing collie's full apparatus for block classification is importing Tier-2 machinery for a Tier-1 capability.”

**CY-4 — PRESENT.**
- Quote: “three releases in a row (0.1.18, 0.1.19, 0.1.20) each shipped one more Claude-specific patch”
- Quote: “The last three real releases are each a Claude patch with no corpus and no cross-agent regression run.”

**CY-5 — PRESENT.**
- Quote: “there is no way to know whether any of them broke the other agents.”
- Quote: “You commit to sourcing a real fixture corpus, not a hand-written one, before the next Claude-specific patch lands.”
- Quote: “The last three real releases are each a Claude patch with no corpus and no cross-agent regression run.”

**CY-6 — PRESENT.**
- Quote: “Nobody's proposal measured the real blast radius on Codex or Agy panes. That is the PBI-061 gap and it stays open.”

**CY-7 — PRESENT.** Unpacks E1 as single-source (same object, failure, consequence as “only one source, not independently converged”).
- Quote: “Collie's conformance suite scored R3 E1 F3, single-source, high assembly cost.”

**CY-8 — ABSENT.** Y never states F3 = an entire subsystem (tier ladder + capability fence + conformance suite). “High assembly cost” / “full apparatus” is not that claim; no inference from the letter F3.

**CY-9 — ABSENT.** “Do not move them into a `harness/` directory” is a recommendation, not the claim that `web/src/lib/harness/` does not exist / green-field.

**CY-10 — ABSENT.** No locked R21–R30 IDs, no “tests assume one shared classifier,” no cutover-regression claim.

**CY-11 — ABSENT.** Y does not credit B with forcing corpus/conformance as a hard gate. Glyph section says B would still need the same corpus A needs — that rebuts B-for-the-glyph, it does not state CX/CY-11.

**CY-12 — PRESENT.** Proposal A is recommended only with the two conditions, including a real corpus before the next Claude-specific patch (conditioning-on the A-without-gate≡C requirement).
- Quote: “That is Proposal A, with two conditions attached below.”
- Quote: “You commit to sourcing a real fixture corpus, not a hand-written one, before the next Claude-specific patch lands.”

---

## Dispositions

Only PRESENT marks. DISPOSED = final recommendation adopts, conditions-on, or rebuts-with-reason. MENTIONED-ONLY = appears but the recommendation neither acts on it nor rebuts it.

### explanation-X

| ID | Disposition | Reason |
|---|---|---|
| RT-1 | DISPOSED | Adopts the omitted middle path as Condition 2; states the false-dichotomy complaint “is fair and stands on the record.” |
| RT-2 | DISPOSED | Condition 2: name/separate the already-Claude predicates in-module. |
| RT-3 | DISPOSED | Adopts the middle path at “smallest honest size”; names-and-rebuts registry/adapter/`harness/`/conformance. |
| RT-4 | DISPOSED | First action is capture a real Codex pane and a real Agy pane; corpus Condition 1; blast left unresolved as a bound, not ignored. |
| CX-1 | DISPOSED | Same as RT-2 / Condition 2. |
| CX-2 | DISPOSED | Used as a (secondary-to-tier-ladder) reason to reject B. |
| CX-3 | DISPOSED | Headline recommendation: do not build a per-agent adapter subsystem. |
| CX-4 | DISPOSED | Used to rank C highest-risk and to refuse “continuing exactly as-is.” |
| CX-5 | DISPOSED | Condition 1: real fixture corpus (airemote pattern), with fixture-commit policy called out as a blocker to decide first. |
| CX-6 | DISPOSED | “What to do first” is measure Codex/Agy; PBI-061 kept open on the unresolved list. |
| CX-8 | DISPOSED | F3-as-entire-subsystem used to refuse importing B. |
| CX-12 | DISPOSED | “The conditions … are the recommendation. A without them is C.” |

### explanation-Y

| ID | Disposition | Reason |
|---|---|---|
| RT-2 | DISPOSED | Condition 2: name Claude-specific rules in place. |
| RT-3 | DISPOSED | Condition 2 adopts in-file labeling and rebuts `harness/` / adapter interface. |
| RT-4 | DISPOSED | Stated as a cost of the recommendation (“you accept … stays open”); Condition 1 corpus; glyph called out for context investigation. |
| CY-1 | DISPOSED | Condition 2. |
| CY-2 | DISPOSED | Used to refute B (cosmetic/Tier-1 vs Tier-2 send). |
| CY-3 | DISPOSED | Refute B: do not pay adapter assembly cost for this capability. |
| CY-4 | DISPOSED | Used to rank C highest and refuse reactive continuation. |
| CY-5 | DISPOSED | Condition 1: real corpus, not hand-authored, before the next Claude-specific patch. |
| CY-6 | DISPOSED | Held open as an accepted cost of A; corpus/glyph check are the mitigation path. |
| CY-7 | DISPOSED | Single-source/high-assembly collie score used to choose airemote corpus over collie conformance under Condition 1. |
| CY-12 | DISPOSED | A is recommended only with both conditions attached. |

No PRESENT mark in either explanation is MENTIONED-ONLY.

---

## GT-2 marks

GT-2 (live-confirmed): Codex uses U+203A and Claude uses U+276F for the **identical** selection-cursor concept; Codex’s real menu really did wrap incorrectly.

**explanation-X.md — CONTRADICTS.** Calls the glyph mismatch unconfirmed/hypothetical and asserts incompatible behavior (not the identical UI concept: composer prompt vs numbered-menu cursor).
- Quote: “**It is not the identical UI concept.** The documented `›` is Codex's *composer prompt*, and airemote's own note says “nothing enumerated” — whereas `MENU_CURSOR_ITEM` matches a cursor in front of a *numbered option* (`❯ 1. Red`). Whether Codex draws numbered selection menus, and with which glyph, is unverified.”
- Quote: “**The `›` glyph risk is documentary, not demonstrated** — and the documented Codex `›` is a composer prompt, not a numbered-menu cursor. Under-evidenced as originally stated”
- Quote: “the glyph is the one concrete mechanism found this session, and it is a hypothesis with documentary support, not a demonstrated bug.”

**explanation-Y.md — CONSISTENT.** States Claude U+276F vs Codex U+203A for the identical concept and relies on that mismatch as real (packet-reported; “real captured fixture data”). Hedging is about whether `MENU_CURSOR_ITEM` matches the glyph literally, not about denying the glyph/concept claim.
- Quote: “The module's recently added `MENU_CURSOR_ITEM` detector hardcodes Claude Code's selection-cursor glyph, U+276F, the heavy right-pointing angle `❯`. Codex's real captured fixture data, already in the repo per the composer-testdata source, uses a different glyph for the identical concept: U+203A, the single right-pointing angle quotation mark `›`.”
