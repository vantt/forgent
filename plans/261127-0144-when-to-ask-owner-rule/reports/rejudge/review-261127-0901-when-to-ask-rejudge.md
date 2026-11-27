# Re-judgment of all 163 owner questions

## Result

**Review complete; phase-2 pass condition NOT met.** Applying the whole rule yields **27 ask, 70 no-ask, 66 hands**. Eight asks lie outside the old direction verdicts and the four decision overrides. Their own records contain an acceptance waiver, an explicit owner reservation/order, or a standing boundary change. The expected classification must not override those records.

Two wording findings are accepted for phase 1 (A1–A2). Eight evidence corrections are accepted (E1–E8); they are **not** reasons to weaken the rule to reproduce the old labels. Other label changes are explained below. No source, plan, evidence file, generated surface, index, or existing dirty file was edited or staged.

## Inputs and method

Read first: [phase brief](../../phase-02-rejudge-evidence.md), [plan](../../plan.md), [new shared rule](../../../../core/skills/_shared/decision-question.md#when-to-ask), [163-question evidence](../../../discussions/ds-jxoz3h2qgk-when-to-ask/evidence-question-classification.md), and [settled discussion](../../../discussions/ds-jxoz3h2qgk-when-to-ask/DISCUSSION.md), especially sections 4 and 6. The discussion provides the intended outcome; it does not replace the rule or a question's own facts when judging a row.

- Checkout HEAD: `7490ea7e991afbadc0340ace2854bc2b261218fd`.
- Reviewed uncommitted canonical rule SHA-256: `7638edab822714192d92a00098d5a8535a2fc90b1b52ada31512e6a217b1cd1f`.
- Evidence file SHA-256: `9840142e0c051692a57b5fda23ad5954cc2941bcb3419cfd1b7dc2941bacd1e9`.
- `fgos questions show q-hui44iwzw4 --json` refused with `event-store-unavailable`, cause `git-floor-probe-failed: git-driver-io: Read-only file system (os error 30)`. No bypass or state repair attempted.
- Read-only fallback: `/home/vantt/projects/forgent/.fgos/cache/questions.json`, the Questions spec section 3's existing per-machine view. All **163 distinct input ids** have a record there. Inspected their question parts, options, costs/harms and scope, rather than relying only on the evidence headline. This is cached evidence, not a successfully refreshed live `show`; freshness against the event stream is unconfirmed.
- Fingerprint of the 163 `asked` records, in evidence-row order, serialized as JSON with sorted keys, UTF-8, `ensure_ascii=False`, compact separators: `0811c429be980c17ce6c088f33d13759860c568aeaa3bf328d63b7b0cfb7ef01`.
- Names: `fgos convention path --kind report --slug when-to-ask-rejudge --type review --json` returned `plans/reports/review-261127-0901-when-to-ask-rejudge.md`; its basename is placed in this phase's allowed report directory. Initial calls without slug/type failed validation; no artifact was produced by them.

### Judgment semantics

Apply the three questions together, not question 3 as an override of question 2:

1. Determine intent from the question's own record; look up machine facts rather than solicit a preference prematurely.
2. Preserve the approved outcome, acceptance, standing constraints and owner orders. An authorization **to waive/change one** is `ask`, even if the agent can instead continue completing the original work without asking. `ask` does not mean park every other route or phase.
3. For in-frame action, establish a real reverse path. Confinement is not permission to bypass a door, nor to declare an unmet gate met.

`hands` identifies an execution/grant/communication obstacle, even where the rule now names a supervisor route. It is **not an owner decision**. An ordinary reversible task with a safe route is `no-ask`. For mixed records, the verdict identifies the consequential authorization: e.g. q-nt7ptsq2nd's **standing global grant** is `ask`; the already-approved one-run execution remains `hands`. Similarly, q-trgzaa34ua's gate waiver is `ask`; running the gates is `hands`.

Judge the historical proposed authorization, not whether a question is still open today. Later owner answers confirm what was chosen but do not retroactively make the original recommendation correct. In particular, a later unexpected answer can trigger a **new** brief intent clarification under question 1 without proving that the original permission request was necessary.

### Rule references used in the ledger

Line numbers refer to the reviewed canonical rule above.

| Code | Rule text / application |
|---|---|
| I | Lines 30–38, question 1: clarify owner-only intent; machine facts are looked up. |
| G | Lines 39–49, question 2: fastest non-deviating path; outcome, acceptance, trust boundary, other goals and owner orders remain binding. |
| R | Lines 50–57, question 3: genuine reverse path; no confinement escape. |
| H | Lines 65–68, Missing hands: supervisor when granted; activation is owner's execution step; full-suite inability is an infrastructure gap. |
| W | Lines 23–26 and 75: a footprint/size widening to meet acceptance is actionable, not goal approval. |
| C | Lines 76–77: clean rebuildable/delivered work; recovery through the existing door. |
| S | Line 78: do not re-confirm a settled decision; cite its authority. |
| D | Lines 19–21 and 75–79: new organization/rules, changed acceptance/boundary, genuine intent tie are owner directions. |

## Counts

### Evidence verdict against re-judged verdict

These are the evidence file's **literal verdicts**, not its approximate prose estimate of the hands class.

| Evidence verdict | Re-judged ask | Re-judged no-ask | Re-judged hands | Total |
|---|---:|---:|---:|---:|
| ask | 18 | 3 | 0 | 21 |
| no-ask | 7 | 66 | 41 | 114 |
| ask-only-if-no-safe-path | 2 | 1 | 25 | 28 |
| **Total** | **27** | **70** | **66** | **163** |

### Evidence group against re-judged verdict

| Evidence group | Ask | No-ask | Hands | Total |
|---|---:|---:|---:|---:|
| missing-grant-or-door | 0 | 8 | 36 | 44 |
| footprint-widen | 1 | 39 | 0 | 40 |
| git-recovery-ops | 0 | 3 | 17 | 20 |
| cleanup-hygiene | 1 | 5 | 12 | 18 |
| component-or-org-structure | 10 | 0 | 0 | 10 |
| scope-or-acceptance-change | 6 | 3 | 0 | 9 |
| new-rule-or-policy | 4 | 1 | 0 | 5 |
| priority-or-order | 2 | 2 | 0 | 4 |
| reconfirm-settled-decision | 1 | 3 | 0 | 4 |
| resource-or-cost | 0 | 2 | 1 | 3 |
| trust-security-boundary | 2 | 1 | 0 | 3 |
| product-behaviour-change | 0 | 2 | 0 | 2 |
| tie-needs-intent | 0 | 1 | 0 | 1 |
| **Total** | **27** | **70** | **66** | **163** |

The eight asks outside the phase's allowed historical set are q-hui44iwzw4, q-ulx4nkztpq, q-uxrx52jm2q, q-x3ata7iuej, q-yoxcjqa46z, q-anofq5k6pf, q-e2bpqz65c2 and q-4xd2a3eqxq (E1–E8).

## Findings and dispositions

### Accepted rule-wording findings — return to phase 1

**A1 — “The frame may be narrowed” is ambiguous about waiving acceptance. Accepted.**

- Misleading line: 26, “The frame may be narrowed, never widened by the agent.” The frame was just defined as the owner's outcome and acceptance, not merely a selected task subset.
- Counterexamples: q-lnjt5zzbfq and q-aanvfxaopa retain debt; q-trgzaa34ua waives the full gate. These are acceptance **narrowings**, yet question 2 and the quick table correctly require approval. q-hui44iwzw4, q-ulx4nkztpq and q-uxrx52jm2q expose the same ambiguity outside the three named overrides.
- Proposed replacement: “An agent may narrow its chosen work slice while preserving every approved outcome and acceptance criterion. It may not waive or weaken those criteria, or widen standing constraints, without the owner's decision.”
- Verdicts here follow the explicit acceptance protection in question 2; they do not use the ambiguous sentence to permit waivers. Recheck the six ids above after the wording fix.

**A2 — Reverse-path permission should explicitly remain subordinate to the goal check. Accepted.**

- Misleading lines: 50–53, especially line 52, “With a reverse path, act now; do not wait.” Read alone, this permits a reversible config or acceptance edit even after question 2 found a deviation.
- Counterexamples: q-nt7ptsq2nd's global grant can be reverted in config but affects later workers; the three acceptance overrides can be represented by reversible plan edits. Revertability does not authorize changing their approved goal/boundary.
- Proposed replacement opening: “For an action that question 1 has grounded and question 2 has found within the approved goal, act now when a real reverse path exists; otherwise establish that path first. Reversibility never authorizes a goal, acceptance, standing-boundary or owner-order deviation.”
- The whole-section reading preserves all four decision overrides today. This finding removes the local contradiction, not the third question or its cost-of-waiting lens. Recheck q-nt7ptsq2nd, q-lnjt5zzbfq, q-aanvfxaopa and q-trgzaa34ua.

### Accepted evidence corrections — do not change the rule to fit the old verdict

For each row below, **no line of the new rule misled the reviewer**: the cited line contradicts the old evidence classification. Disposition is **accepted as an evidence correction; rejected as a rule defect**. The proposed wording belongs to the old evidence row or its expectation, not to a weakening of question 2. All changes outside this report remain unwritten.

| Finding / question | Own-record evidence and new verdict | Relevant rule line | Wording that fixes the mismatch |
|---|---|---|---|
| E1 / q-hui44iwzw4 | Cause quotes criterion 7 as “exits 0 with all plans adhering to the plan-v1 enum”; requested scope reads it as vocabulary only although `--all` stays red. **ask** to waive the written zero-exit condition; alternatively keep the gate open and coordinate fixes. | 42–45; 75 | “Ask to change criterion 7 from a green `--all` run to status-only proof; do not mark the literal gate met.” |
| E2 / q-ulx4nkztpq | Scope explicitly authorizes “Marking phase 2 done with the step 9 check recorded as partly met.” Not just three more files. **ask** for that waiver; widening and completing the step is no-ask. | 42–45; 75 | “Widening is actionable; closing with step 9 partly met requires approval.” |
| E3 / q-uxrx52jm2q | What says pass criterion requires all five personas; scope allows closure without planner/shaper probes. **ask** to accept three, not an independent technical substitution. | 42–45; 75; 82–85 | “Ask to waive two required live probes, or keep that criterion open until they can run.” |
| E4 / q-x3ata7iuej | Cause says the settled discussion explicitly left partial/deferred mapping to the owner. A status-only edit is reversible, but this is reserved intent about unfinished work. **ask**. | 23–26; 35–38; 42–45 | “Owner-reserved legacy-status mapping is ask; apply a mapping without asking only after it is recorded.” |
| E5 / q-yoxcjqa46z | What quotes the owner's 21:45 order to run skeleton in parallel; proposed scope instead blocks it behind three entire plans because core overlap cannot be removed. **ask** about the order deviation. | 42–49 | “Ask to replace the explicit parallel-run order with serial blocking, naming measured overlaps; park only blocked work.” |
| E6 / q-anofq5k6pf | What quotes “complete and released in this order.” Proposed scope makes a step end at main even while running fgOS lacks it. Existing implementation's done state cannot settle the owner's release intent. **ask** briefly for that intent. | 35–38; 42–45 | “Clarify whether the owner's release order requires activation; do not silently redefine released as landed.” |
| E7 / q-e2bpqz65c2 | Cause distinguishes OS-D12's explicit “ok” from OS-D19's mere absence of objection. Jointly locking both includes an unapproved handoff contract. **ask** for OS-D19; do not re-ask OS-D12. | 35–38; 76; 78 | “Cite OS-D12 as settled; ask only whether OS-D19's handoff contract is approved. Silence alone is not its recorded assent.” |
| E8 / q-4xd2a3eqxq | First option's harm explicitly says it widens the launcher's trust boundary; answer selects that option. **ask** for that standing expansion. A refuse-and-name-the-door interim fix is no-ask but is not authorization for the expansion. | 42–45; 77 | “Refusal improvement is actionable; following a worktree's Git metadata to an owning release needs boundary approval and validation.” |

### Remaining comparison differences

Each affected id is identified in the full ledger. These dispositions account for every other off-diagonal count, rather than treating a category conversion as a new rule defect.

| Finding | Affected questions | Disposition, rule line and wording |
|---|---|---|
| T-H | All 66 `hands` rows below: 41 previously no-ask and 25 previously conditional | **Rejected as a rule defect.** Lines 65–68 explicitly separate missing execution capability from owner judgment. Old “no safe path” may mean no executable route in that cage, not a reason to ask for direction. Comparison wording: “hands — route the approved host step to its grant holder; keep unproven acceptance open.” This is the new report taxonomy, not a proposal to broaden grants. |
| T-B | q-nt7ptsq2nd (old conditional → ask) | **Rejected as a rule defect; expected protected override.** Lines 42–45 and 77 require the owner's decision for a standing global worker grant. Comparison wording: “ask for the standing grant; hands for the already-approved one-run rerun.” |
| T-F | q-va5vu7zeza (old conditional → no-ask) | **Rejected as a rule defect.** Lines 46–47 and 77 allow failing closed and retaining the project-only boundary. The question says the unsafe grant has already been removed. Wording: “no-ask to keep the verb withheld or fix the owning host's destination guard; never ship global/account access.” |
| T-S | q-otq7dwgory (old ask → no-ask) | **Rejected as a rule defect.** Lines 23–26 and 75 now answer the exact footprint question. Its cancellation in the evidence/discussion is consistent. Wording: “no-ask under the new rule; the historical question helped set the rule.” Do not require a question to set this policy again. |
| T-P | q-kjat6xjwfv (old ask → no-ask) | **Rejected as a rule defect.** Lines 37–40 and 79: the original record recommends an existing read-only panel under its backlog recommendation; it records no already-known freeze/order conflict. Launch permission alone is actionable. Wording: “no-ask for the authorized advisory step; after the unexpected ‘Not now’ answer, clarify/record the changed priority once under question 1.” Do not use the later freeze as hindsight evidence that the original agent knew it. |
| T-I | q-t6xfzdl3eu (old ask → no-ask) | **Rejected as a rule defect.** Lines 37–38 and 46: the record has not established a real tie; it says the relevant module does not exist and the real walking point has not been found. Wording: “trace the next-step seam first and propose the smallest slice; ask only if the owner's desired slice is still unresolved after that fact-finding.” No options are established in this discovery-stage record. |

### Same-verdict traps checked

- q-jol5tcok22 remains **no-ask**, but not because debt is always permitted. Its cause says the row's existing debt reasons assign retirement to later moves; option A cites the existing D6 handling, and scope expressly forbids changing the outcome. Apply the documented deferral, checking its actual coverage before closure; if it does not authorize these three entries, question 2 requires a decision. The short evidence headline alone was insufficient.
- q-tvhmli3fns remains **no-ask** for its recommended fix: it explicitly keeps the check's existing promise while filing the independently measured 277 issues. Its alternative that retires the promise would be ask.
- q-fvulgjz2iz remains **no-ask** for using the already-owning proofs of the same behavior rather than introducing forbidden duplicate proofs. This does not authorize omitting behavior.
- q-vdefxq4upy, q-kghmwfmrtm, q-l3rskjibl3 and q-rpx35ztfph are **hands** for their requested gate/activation execution. Their evidence-file fallback of closing on focused/old/land-gate proof is **not** a safe autonomous path: their records explicitly identify unmet acceptance. Route execution and leave the criterion open, or ask separately for a waiver.
- q-7wfzidusod remains **no-ask**, but the safe action is not the evidence's recommended reversal. Its record already contains the owner answer putting owner-communication before skeleton. Repair the contradictory planner dependency to preserve that order; changing the owner's order would be ask.
- q-rzyim2hm3b remains **no-ask** for restoring the explicit hold/reverting premature implementation. The question's actual later “keep and count as approved” answer is a new owner authorization, not permission for an agent to approve its own premature land.

## Complete per-question ledger

Each row applies I (intent) first, then the named goal/authorization check; H rows stop at the execution obstacle rather than inventing a decision. All actionable no-ask paths remain subject to R (a real reverse path) and existing doors. `conditional` below is the evidence's exact `ask-only-if-no-safe-path` verdict. T-H, T-B, T-F, T-S, T-P, T-I and E1–E8 resolve all changed labels.

### missing-grant-or-door — 44

| Question | Evidence | Re-judged | Basis / safe next action |
|---|---|---|---|
| q-f74scrmcij | no-ask | no-ask | I/G/W: inspect unit-file format and use the existing door, or fix its route within the live-run goal; do not redefine the proof. |
| q-y7brsup6gb | no-ask | no-ask | I/G: establish whether the old socket still serves the request; use the existing unit route or supervisor restart, preserving the live proof. |
| q-ixu4hnbgyd | no-ask | hands | H/T-H: cargo PATH or an admitted host land is an execution environment repair. |
| q-jteaglm67v | no-ask | hands | H/S/T-H: apply the owner's already-ordered planner pin through the config grant holder. |
| q-h7fetx3l35 | no-ask | hands | H/S/T-H: duplicate request for the same approved pin, not a new preference. |
| q-o3omqvtsuc | no-ask | hands | H/S/T-H: ordered config commands; no new planner is needed. |
| q-ns4o7uqamq | no-ask | hands | H/T-H: supervisor applies the named config items; preserve the owner's dirty edits. |
| q-3f6qen2bsd | no-ask | hands | H/T-H: execute approved phase4 config block, not delete its assertion. |
| q-vgwalbohwj | no-ask | hands | H/G/T-H: host full gate unavailable in cage; preserve acceptance and mark sandbox evidence unverified. |
| q-vs4eqnprod | no-ask | hands | H/G/T-H: approved host restage/activation is needed; do not assume temporarily disabling the gate is safe approval. |
| q-y24ukwgfpo | no-ask | no-ask | I/G/R: repair the existing regeneration trigger for core/**; use the config door, never hand-edit census. |
| q-rfxqncjrax | conditional | hands | H/T-H: account probe needs its grant holder; do not bypass the account fence. |
| q-dcbq73d2rr | conditional | hands | H/C/T-H: activation plus verified delivered-worktree removal are host steps. |
| q-zcileomdpa | conditional | hands | H/G/T-H: missing host suite run, not permission to accept sandbox failures. |
| q-4lmw3q6la7 | no-ask | hands | H/T-H: relay a prepared preview to DOCOS through a permitted channel; retain table until approval. |
| q-br5rlczzav | conditional | hands | H/G/T-H: keep full-suite criterion open until valid host evidence exists. |
| q-nudu6zlusf | no-ask | no-ask | I/G: correct the documented backlog-write grant mismatch through normal reviewed work; no ownership change requested. |
| q-ec5bdhkwoz | no-ask | hands | H/T-H: an already-defined index write waits for its grant fix/activation, not owner judgment. |
| q-ptcieh72p6 | conditional | hands | H/S/T-H: execute two existing owner orders within their bounds; do not choose to retain maxLeads=2 instead. |
| q-p5p5q5jlvy | conditional | hands | H/S/T-H: apply ordered secretary threshold/comment change via an admitted plan or host holder. |
| q-xs6oex5amb | no-ask | no-ask | I/G/W: extend the existing owning doctor hook-install door, avoiding a second installer and preserving deletion acceptance. |
| q-vbh2knqpnu | conditional | hands | H/G/C/T-H: activation, full suites and verified cleanup; do not waive live proof. |
| q-q6peavqy7b | no-ask | hands | H/W/T-H: prepared changelog/index writes need an admitted writer; no content decision. |
| q-pcwf3slkfp | conditional | hands | H/G/T-H: reuse a valid shared host suite run when revision equivalence is established. |
| q-2vehh564d2 | no-ask | hands | H/W/T-H: land exactly the prepared changelog lines through the permitted writer. |
| q-5v6jpbmbcy | conditional | hands | H/G/T-H: a host full-suite run is owed; unrelated reds do not authorize weakening acceptance. |
| q-j4yeougr72 | conditional | hands | H/T-H: host build/stage/activation of already-landed crate; leave dependent phases parked. |
| q-ozu6l2ioxa | conditional | hands | H/S/T-H: apply the recorded 0.30 config decision, not re-decide it. |
| q-twjsu3cywc | conditional | hands | H/T-H: release activation and authority render are execution steps. |
| q-vdefxq4upy | conditional | hands | H/G/T-H: execute full gates/release check; focused proofs cannot silently replace criteria 5–6. |
| q-qzcq5xti2k | no-ask | no-ask | I/G: inspect and use the existing confined invocation route; no standing global grant is authorized. |
| q-owq4jhwng7 | no-ask | no-ask | I/G/S: choose the existing fully confined one-run invocation within the recorded rerun authorization. |
| q-aucsjasc25 | conditional | hands | H/S/T-H: global patch decision was already made in q-nt7ptsq2nd; now execution only. |
| q-nii67wdhv3 | conditional | hands | H/T-H: stage/activate and prove the already-approved tool grant; do not broaden it. |
| q-vfansuhg7y | no-ask | hands | H/G/T-H: perform the owed full witness-versus-walk check; record weak evidence without declaring it proven. |
| q-dhhezn67em | no-ask | no-ask | I/G: use declared DoD checks in the existing argv recipe rather than shell placeholder copying; config execution uses its holder. |
| q-dzh2ojhcvc | no-ask | hands | H/S/T-H: relay the previously ordered full-suite check across the broken peer channel. |
| q-kghmwfmrtm | no-ask | hands | H/G/T-H: full gate needs a host; focused closure explicitly leaves criterion 4 unmet. |
| q-l3rskjibl3 | no-ask | hands | H/G/T-H: activate fixed host and run live/full proofs; old probe fails acceptance 3. |
| q-rpx35ztfph | no-ask | hands | H/G/T-H: full gates still required by acceptance 6; land-gate proof is not a self-approved substitute. |
| q-irosdru6sy | no-ask | hands | H/I/T-H: get real failing-test names from the host; do not guess their cause or waive the run. |
| q-zgij6efo5g | no-ask | hands | H/G/T-H: host suites and counts on the qualifying main revision; no code/rebaseline authorization. |
| q-okdzvolti3 | conditional | hands | H/T-H: source/dependency delivery or an admitted host probe is missing; do not expand sandbox reads on your own. |
| q-cmio6uyrqz | no-ask | hands | H/I/T-H: obtain the host run/cause; disk suspicion alone is not proof or permission for a retry loop. |

### footprint-widen — 40

| Question | Evidence | Re-judged | Basis / safe next action |
|---|---|---|---|
| q-y3ypxlucin | no-ask | no-ask | W/G: add actual session-write door and its proof; creation acceptance unchanged. |
| q-b3acdzi4ur | no-ask | no-ask | W/G: fix requirementOf mapping, retaining narrow grants rather than widening directory meaning. |
| q-ekkgwaavrb | no-ask | no-ask | W/G/R: migrate references together; coordinate writers and reverse path, not partial broken migration. |
| q-wb6bdz3c72 | no-ask | no-ask | W/G: status/contract-only footprint widening under the approved mapping. |
| q-76qpywi7if | no-ask | no-ask | I/W: replace nonexistent path with the real land owner, preserving atomic behavior. |
| q-exu5x27hbq | no-ask | no-ask | W/G: include all five wiring/dependency files needed by the accepted migration. |
| q-psvhjlmjxl | no-ask | no-ask | W/G: declare existing planned migration operation in the host catalog. |
| q-4qtu54bnxz | no-ask | no-ask | W/G: correct the one owning fixture entry without weakening proof. |
| q-pn6ur6wrjf | no-ask | no-ask | W/G: move pure activation read to the shared lower layer rather than duplicate it. |
| q-obm5mrukjc | no-ask | no-ask | W/G: add actual doctor inventory/hook error surfaces needed by phase 6. |
| q-eyb5i7m7wq | no-ask | no-ask | W/S: footprint for the already-approved project-only flag; not new boundary consent. |
| q-2ul3tjw3kd | no-ask | no-ask | W/G: declare the phase's already-required relay record kind. |
| q-lnq3nbjssw | no-ask | no-ask | W/G: declare the built project-only flag through the registry/exporter. |
| q-zwvjlsuqgc | no-ask | no-ask | W/G: head-request-only handover; retain other attempt pinning. |
| q-r5w6funyv5 | no-ask | no-ask | W/G: existing scanner declaration with bounded provenance/retirement, not a scanner-shaped code workaround. |
| q-qki26cwunf | no-ask | no-ask | W/G: inject the existing checked removal port; no copied checks. |
| q-d5mrno2mfk | no-ask | no-ask | W/G: fill the two necessary LandPorts literals; no session-write behavior change. |
| q-3g32txifg5 | no-ask | no-ask | W/S: include paths for the already-folded login-expiry repair. |
| q-swxkda2x5r | no-ask | no-ask | W/G: re-cut retirement by owner/callers; preserve every outcome instead of dropping rows. |
| q-6rdolvgvz2 | no-ask | no-ask | W/G: register planned authority verb at actual entry point. |
| q-sieckdvccb | no-ask | no-ask | W/G: include registration and native-verb drift proof. |
| q-klz3vkxjee | no-ask | no-ask | W/G: add planned authority operations to admission catalog. |
| q-75yeaifwzn | no-ask | no-ask | W/G: regenerate the owning version vector through its generator. |
| q-bioobcr52m | no-ask | no-ask | W/S: migrate all callers of the already-ordered deleted Node hook table. |
| q-jol5tcok22 | no-ask | no-ask | S/G: record existing later-move debt treatment cited in the row and D6; no new outcome waiver assumed. See trap note. |
| q-nog2h4wfjm | no-ask | no-ask | W/G: add three callers and rerun the incomplete phase in its approved frame. |
| q-ulx4nkztpq | no-ask | ask | G/E2: requested partly-met step-9 closure is a waiver; widening and completing it would remain no-ask. |
| q-ms5ifcqex6 | no-ask | no-ask | W/G: repoint deleted-test references and retire recorder; do not preserve dead closure. |
| q-zw4htizjz2 | no-ask | no-ask | I/G: fix false collision on a generated census through its owning contract; retain real writer-overlap protection. |
| q-4aalqblcof | no-ask | no-ask | W/G: update fake-spawn wiring through existing witness, keeping fail-closed AC3. |
| q-pegjald5eu | no-ask | no-ask | W/G: retire the owning proof case for deleted dead adapters; no production dead code kept only for test. |
| q-5roz2uy3sa | no-ask | no-ask | W/G: minimal link fixes through coordinated ownership; no history exemption or lost prose. |
| q-xcuwpxa4kn | no-ask | no-ask | W/G: repair stale fixtures/tests caused by the phase; do not weaken product assertions. |
| q-if5yugbigg | no-ask | no-ask | I/W: substitute the actual owning fixture path, not a new acceptance. |
| q-vqyxe5oi6j | no-ask | no-ask | W/G: include actual mailbox route arm and proof; coordinate shared file. |
| q-vkcf6eyeak | no-ask | no-ask | W/G: add --role/outcome declarations required for real wakes. |
| q-myvzcbz3sx | no-ask | no-ask | W/G: same required route/vocabulary widening, not fixture-only acceptance. |
| q-qzchcwl7ya | no-ask | no-ask | W/G: declare the implemented session stop flag so real calls reach it. |
| q-embi4w5hfi | no-ask | no-ask | W/G: extend the owning nudge capability proof for the approved typed channel. |
| q-ep6wknrzop | no-ask | no-ask | W/G: regenerate manifest from the edited registry, never hand-edit projection. |

### git-recovery-ops — 20

| Question | Evidence | Re-judged | Basis / safe next action |
|---|---|---|---|
| q-bo3abbpcm6 | no-ask | hands | H/C/T-H: approved recover door needs a host executor; seal journal and verify recovery. |
| q-tj4cw2epbq | no-ask | no-ask | G/R: coordinate bounded writer pause/restart or safe migration retry without losing concurrent edits. |
| q-wpzbpqnq24 | no-ask | hands | H/C/T-H: reconcile pushed move through recover; no manual revert or data loss. |
| q-wjecldhcmr | no-ask | hands | H/C/T-H: recover the unpublished local commit, not reset away its note. |
| q-gelkp64lo4 | no-ask | hands | H/C/T-H: restore consistent index through the permitted recovery owner; preserve bytes. |
| q-rbleatcask | no-ask | hands | H/C/T-H: documented recovery for the interrupted land resource. |
| q-ctjxjol33f | no-ask | hands | H/C/T-H: grant holder recovers the abandoned land; no hand-edited Git state. |
| q-pfecbg6ffn | no-ask | hands | H/C/T-H: recover the merge resource, then retry the reviewed branch. |
| q-3hu7p6iy6p | no-ask | hands | H/C/T-H: route the stuck writer recovery rather than ask a direction. |
| q-7x7b33ekew | no-ask | hands | H/C/T-H: ownership/grant prevents execution; do not clear another writer's chain manually. |
| q-7t27x2qfk2 | conditional | hands | H/C/T-H: missing writable lock/host executor, not a policy choice. |
| q-hlbqhlyrct | conditional | hands | H/S/C/T-H: recover plus already-ordered secretary threshold edit through holders. |
| q-e62q73d2au | conditional | hands | H/C/T-H: recover pending land after disk repair using the normal door. |
| q-kvlgsoyjje | conditional | hands | H/C/T-H: host-owned checkout/index recovery; do not splice raw read-tree into an agent bypass. |
| q-erkpiafbij | conditional | hands | H/C/T-H: publish/recover existing local commit before retry; preserve unpublished note. |
| q-3svd4ttdn7 | no-ask | no-ask | G/R: rerun fresh with old dirty tree preserved; no provenance bypass needed. |
| q-hwtikojjei | no-ask | no-ask | I/G/R: fix the diagnosed doc reference and rerun fresh; do not skip hooks. |
| q-pc6qapoegx | no-ask | hands | H/C/T-H: dead-writer recovery requires the permitted host path. |
| q-5tmdgbgopd | no-ask | hands | H/C/T-H: lost stop/request sockets and recovery need host hands; parking preserves work, not completion. |
| q-bvvdct5edg | no-ask | hands | H/C/T-H: route recover to its holder, then retry land; no direction decision. |

### cleanup-hygiene — 18

| Question | Evidence | Re-judged | Basis / safe next action |
|---|---|---|---|
| q-w33h3vozt7 | no-ask | no-ask | I/C/R: resolve the measured name collision by one coordinated reversible rename. |
| q-x3ata7iuej | no-ask | ask | I/G/E4: the agreed migration explicitly reserves these two status meanings for the owner. |
| q-tjzfq5em4h | no-ask | hands | H/G/T-H: cease duplicate work, transfer review, supervisor stops the duplicate; preserve active lead's work. |
| q-2dwvrkgabm | no-ask | no-ask | G/R: coordinate with the owning shaper and retry; never overwrite its dirty discussion. |
| q-uvr4yu4x3c | no-ask | no-ask | I/G/C: add missing citation glosses through owner, not hide findings in baseline. |
| q-t5anmlcb7q | conditional | hands | H/C/T-H: verified superseded worktree removal through its checked door. |
| q-ddj673fmju | no-ask | hands | H/S/T-H: owner chose host execution of already-identified leftovers, not changed acceptance. |
| q-v7o5temdml | conditional | hands | H/C/T-H: no removal grant; verify fresh-base replacement before cleanup. |
| q-73vfpynmhd | conditional | hands | H/C/T-H: clean merged worktree cleanup; no decision content. |
| q-2dncwfeoy4 | conditional | hands | H/C/T-H: host cleanup after proof that dirty copy is delivered/superseded. |
| q-jhzastcweb | no-ask | no-ask | I/G/C: owning secretary repairs mechanical portfolio contract defects. |
| q-3rhc6lroqc | no-ask | no-ask | I/G/C: same mechanical repair through owning writer; do not reinterpret scope. |
| q-2ghcivkv34 | no-ask | hands | H/C/T-H: checked delivered-to-main removal, not confinement escape. |
| q-42ihbng27e | no-ask | hands | H/C/T-H: remove clean merged trees; preserve dirty copy until delivery proof. |
| q-eyzkt2ttrg | no-ask | hands | H/T-H: host stops unreachable idle pane; leaving it is not proof of plan completion. |
| q-pkvxdfpg3n | no-ask | hands | H/C/T-H: remove only proven merged branches through permitted holder; retain seven unique tips. |
| q-ubi34e6xd3 | no-ask | hands | H/S/T-H: carry out owner's already-stated duplicate-run cancellation, confirming exact process ownership. |
| q-pmhxzsfpr7 | no-ask | hands | H/C/R/T-H: verify superseding delivery, use checked removal; never hand-delete active land candidates. |

### component-or-org-structure — 10

| Question | Evidence | Re-judged | Basis |
|---|---|---|---|
| q-ruxzcol6db | ask | ask | I/D: choose the one authority source and retire/generate six competing registers. |
| q-je5lfplvuh | ask | ask | I/D: assign ownership of ownership and its approval policy. |
| q-7wd766tu4p | ask | ask | I/D: choose a new component-authority component versus architecture/documentation ownership. |
| q-pdce2aqupm | ask | ask | I/D: move architecture-layer ownership into a shared structural model or keep it separate. |
| q-6yhs63ru4i | ask | ask | I/D: choose coach's query architecture and whether to introduce a SQL view layer. |
| q-kml4ipaweg | ask | ask | I/D: corrected architectural proposal for arbitrary coach SQL versus predefined queries. |
| q-werrxi4i7i | ask | ask | I/D: new generic privileged policy broker versus per-chore doors/standing unconfined session. |
| q-ng4ojyph5r | ask | ask | I/D: set which subsystem owns the guaranteed peer channel. |
| q-hcnhbtf74z | ask | ask | I/D: place channel-fallback responsibility in one send door or each head. |
| q-ee2f2g3aoj | ask | ask | I/D/G: amend PS-24's caller/approval policy, not merely execute an ordinary footprint widen. |

### scope-or-acceptance-change — 9

| Question | Evidence | Re-judged | Basis / safe next action |
|---|---|---|---|
| q-fvulgjz2iz | no-ask | no-ask | I/G: preserve the same behavior with named owning proofs; do not land duplicate weaker tests. |
| q-hui44iwzw4 | no-ask | ask | G/E1: explicitly waive written exit-zero condition in favor of vocabulary-only proof. |
| q-excujq527g | ask | ask | I/D: choose whether fgOS's instruction seam governs third-party installations. |
| q-msslhlmfkt | no-ask | no-ask | I/G/W: identify the already-approved rotation row from machine evidence, fold it without inventing intent. |
| q-tvhmli3fns | no-ask | no-ask | I/G: keep check promise; fix original-id reading and track independently measured old reconciliation debt. |
| q-trgzaa34ua | ask | ask | G/D: closing on focused proofs waives explicit full-gate acceptance; running those gates remains hands. |
| q-lnjt5zzbfq | ask | ask | G/D: retaining five checkout copies changes the approved no-debt outcome. |
| q-aanvfxaopa | ask | ask | G/D: keeping missing-survivor copies/polls as debt changes no-debt acceptance. |
| q-uxrx52jm2q | no-ask | ask | G/E3: requested three-persona closure omits two required live personas. |

### new-rule-or-policy — 5

| Question | Evidence | Re-judged | Basis |
|---|---|---|---|
| q-djyjckiygr | ask | ask | I/D: set migration twin policy with enforced expiry versus one-step ban. |
| q-von37r6ef6 | ask | ask | I/D: set cancellation authority and policy for moot questions of gone askers. |
| q-xkrbp66xy6 | ask | ask | I/D: new default/headline validation obligations for every asker. |
| q-nfgvjge6zg | ask | ask | I/D: new end-of-turn enforcement policy, not execution of a current requirement. |
| q-otq7dwgory | ask | no-ask | W/S/T-S: reviewed rule now settles footprint as coordination, not owner's frame. |

### priority-or-order — 4

| Question | Evidence | Re-judged | Basis / safe next action |
|---|---|---|---|
| q-kjat6xjwfv | ask | no-ask | I/G/T-P: existing advisory run serves stated goal; unexpected later freeze triggers intent clarification, not retroactive permission need. |
| q-yoxcjqa46z | no-ask | ask | G/E5: serialize work despite explicit parallel-run order after measured irreducible overlap. |
| q-7wfzidusod | no-ask | no-ask | G/S: remove planner-created cycle preserving the recorded owner order; reversing that order is not autonomous. |
| q-anofq5k6pf | no-ask | ask | I/G/E6: only owner can settle whether “released” in his order requires activation, not merely landing. |

### reconfirm-settled-decision — 4

| Question | Evidence | Re-judged | Basis / safe next action |
|---|---|---|---|
| q-rzyim2hm3b | no-ask | no-ask | G/S/R: restore the explicit unapproved hold; treating premature land as approval requires owner authorization. |
| q-e2bpqz65c2 | no-ask | ask | I/D/E7: OS-D12 is explicit assent; OS-D19 is only absence of objection, so ask only that unresolved contract. |
| q-n2o2nbs2or | no-ask | no-ask | I/G: derive real workspace facts from plan/Git under existing no-second-store constraint. |
| q-s4oy6tinfr | no-ask | no-ask | S/H: portfolio component already approved in chat; door's q-id requirement is an implementation gap, not a second decision. |

### resource-or-cost — 3

| Question | Evidence | Re-judged | Basis / safe next action |
|---|---|---|---|
| q-luhbwwvlpc | no-ask | hands | H/C/T-H: both sessions explicitly lack removal/recovery writes; route only proven delivered work/candidates. |
| q-eoxlvo7i4r | no-ask | no-ask | I/G: scoped admission fix uses existing waiting data; avoid unneeded capacity-input mechanism and preserve safety constraints. |
| q-wwsaazcrbz | no-ask | no-ask | G/R: reversible maxLeads=2 enforces owner's already-set two-suite cap without adding a new lock mechanism. |

### trust-security-boundary — 3

| Question | Evidence | Re-judged | Basis / safe next action |
|---|---|---|---|
| q-va5vu7zeza | conditional | no-ask | G/T-F: withhold unsafe verb, implement destination restriction in its owning door; no widening of project-only trust. |
| q-nt7ptsq2nd | conditional | ask | G/D/T-B: standing global worker grant differs from already-approved one-run pin; hands alone does not authorize it. |
| q-4xd2a3eqxq | conditional | ask | G/E8: following linked-worktree metadata widens launcher trust; refusal-only interim path remains no-ask. |

### product-behaviour-change — 2

| Question | Evidence | Re-judged | Basis / safe next action |
|---|---|---|---|
| q-3iylevstr2 | no-ask | no-ask | I/G: capability gate handles absent model without forcing other projects to carry repository-only data. |
| q-jwnker2n4y | no-ask | no-ask | I/G/R: scoped wake transport trade-off has a clear threshold-based path; preserve ordinary rotation/handoff contracts. |

### tie-needs-intent — 1

| Question | Evidence | Re-judged | Basis / safe next action |
|---|---|---|---|
| q-t6xfzdl3eu | ask | no-ask | I/G/T-I: first trace the actual legal-next-step seam; record establishes no genuine tie needing a preference yet. |

## Override check and completion boundary

| Named override | Re-judged | Protection |
|---|---|---|
| q-lnjt5zzbfq | ask | No-debt outcome cannot be replaced by debt without owner decision. |
| q-aanvfxaopa | ask | No-debt/door-row acceptance cannot be relaxed by agent inference. |
| q-trgzaa34ua | ask | Full-gate acceptance cannot be waived because a cage cannot run it. |
| q-nt7ptsq2nd | ask | One-run execution permission does not imply standing global worker permission. |
| q-ddj673fmju | hands | Owner performed already-scoped leftovers; this is not a fifth direction decision. |

The plan's criterion 6 says “five owner overrides” as asks, but its phase brief and discussion correctly distinguish **four decision overrides and one hands override**. This report follows the latter; the discrepancy must not cause q-ddj673fmju to be reclassified as ask.

Verification scope: documentation re-judgment and mechanical table/id checks only. The report has exactly 163 unique ledger ids matching the input set, its verdict/cross-table counts agree, all local report links resolve, and the phase's `ls` check succeeds. MDView preview was attempted once but refused with `attempt to write a readonly database`; no preview URL is available in this confinement. No cargo, npm test, build, lifecycle, staging, or commit commands were run. No symbols changed; GitNexus symbol impact is not applicable. Cache-based source lookup remains weaker than a live refreshed question read.

### Accepted findings for the lead

1. **A1:** disambiguate “frame may be narrowed” so it cannot authorize acceptance waivers.
2. **A2:** qualify reverse-path “act now” by the earlier intent/goal checks.
3. **E1:** q-hui44iwzw4 is an acceptance waiver, not a free status-only reinterpretation.
4. **E2:** q-ulx4nkztpq's requested partly-met closure is not an ordinary footprint widening.
5. **E3:** q-uxrx52jm2q's three-of-five live probe closure changes acceptance.
6. **E4:** q-x3ata7iuej's status mapping was explicitly reserved to the owner.
7. **E5:** q-yoxcjqa46z's proposed serialization deviates from an explicit parallel-run order.
8. **E6:** q-anofq5k6pf requires clarification of the owner's release-order intent.
9. **E7:** q-e2bpqz65c2 conflates explicit OS-D12 assent with OS-D19 silence.
10. **E8:** q-4xd2a3eqxq's selected launcher lookup widens a standing trust boundary.

A1–A2 require only wording fixes, then targeted rechecks of their named records. E1–E8 require reconciliation of the old evidence/phase expectation with the records; **do not make new rule exceptions merely to satisfy the historical whitelist**. This assignment does not authorize any of those external edits. Phase 3 should not be represented as cleared by this report.
