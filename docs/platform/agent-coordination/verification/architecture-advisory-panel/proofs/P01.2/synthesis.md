Role: Synthesizer | Cell: P01.2 | Requested: `claude` via bwrap, tier `critical` | Derived: provider `claude`, model `opus`
Dispatch: bwrap (kongming-verified scratch-bind pattern)
Prompt: `proofs/P01.2/prompts/synthesizer.md` (full ledger: case, interpretation, scout report, all 3 proposals, critique)
Raw run: `proofs/P01.2/runs/7-synthesizer-raw.log`

---

# synthesis.md

**Case:** "decide whether the experimental native desktop shell should remain a thin client of the existing single-daemon registry/render/search authority or acquire local ownership"

**Session shape:** one investigator, one lead advisor (interpretation), three shapers, one critic. No rebuttal round occurred. Every critique below applies to **v1** of each proposal; no proposal was revised in response.

---

## 1. Recommendation (one)

**Adopt "Thin Shell, Measured First": the daemon keeps registry/render/search authority; the desktop shell owns only window, presentation, and connection state. Land CI and instrumentation on the shell *before* any launcher-coordination hardening, and do not open the ownership question again until real-workload numbers exist.**

This is the **constraint advocate's boundary (Proposal 3) with the critic's Attack 5 sequencing inversion applied.** Both halves are in the ledger as written: Proposal 3 defined the boundary and the delivery order (CI → attachment repair → diagnosability → watcher → measure); Attack 5 argued for inverting that order to measure-first without disturbing the core "stay thin" recommendation. I am integrating those two, not authoring a third position.

Concretely, in order:

1. **Put the shell in CI** (Proposal 3, finding-driven step 1). It has no tests, is not in CI, and its bundling is disabled — nothing else in this list is trustworthy until this exists.
2. **Fix the three deterministic launcher defects** the investigator observed as real: silent-fallback-on-failure, wrong-port fallback, raw-bind-host URL bug. These are attachment/URL correctness bugs, not state-machine work.
3. **Deploy TTI and search-latency telemetry, plus launcher-failure diagnosability** (Attack 2's demanded evidence; Proposal 3's step 3).
4. **Do NOT yet build robust cold-start coordination.** The cold-start race is recorded by the investigator as POTENTIAL and *not reproduced*. This is precisely the work Attack 1 identifies as entrenching, and Attack 5 as possibly theoretical. Leave it open, instrumented, until the telemetry says whether users hit it.
5. **Ask the maintainer the Attack 3 question directly** — did shell development stop because the shell is abandoned or because it is considered done? This is a question, not engineering, and it is the cheapest item on the list.
6. Reopen ownership only against measured workloads.

### What this is chosen *against*

- **Local ownership / a second authority in the shell** (the case's own alternative). Rejected for now on the strongest uncontested finding in the session: it means a second, unmaintained implementation of registry/render/search, borne by one maintainer, and it is expensive to reverse once local state exists.
- **Deleting the shell entirely** (alternative shaper's PRIMARY). Not refuted — *deferred*, and deferred only behind step 5. See §5, Attack 3.
- **Read-only local-search hybrid.** Abandoned by the alternative shaper themself as over-investment; no other actor revived it.
- **Embedding the daemon into the desktop binary now.** The critic raised and then conceded this: the investigator confirms there is nothing to relocate, so embedding is new work, not a move. Note the tension the ledger leaves standing — Attack 1 nonetheless uses embedding as its cost-comparison arm, and the critic's own concession bounds that comparison: embedding is not free on either side of the ledger.
- **Proposal 3's original fix-before-measure order.** Displaced by Attack 5, which the constraint advocate never got to answer.

---

## 2. What the recommendation rests on — per claim

| # | Claim | Confidence | Basis / limit |
|---|---|---|---|
| 1 | Shell (144 lines) holds zero domain logic; it is a WebView pointed at the daemon | **High** | Direct code read by the investigator; no actor contested it |
| 2 | Local ownership would mean a second, unmaintained service implementation | **High** | Proposal 3's finding (2); reinforced by the critic's own *failed* attack — nothing exists to relocate |
| 3 | One maintainer bears every cost on either path | **High** | Lead advisor; uncontested by all three shapers |
| 4 | "Single-daemon authority" framing is partly false — CLI/MCP already bypass the HTTP daemon | **High** | Investigator, direct observation. Weakens the premise of the question as posed |
| 5 | Three of the four launcher issues are real, evidenced defects | **Medium-High** | Investigator observed them; magnitude of user impact never measured |
| 6 | The cold-start race is a live problem | **Low** | Recorded as POTENTIAL and **not reproduced**. This is why step 4 defers it |
| 7 | Daemon capability grew Sept 3–5 with zero shell changes needed | **High as observation** | Investigator, dated |
| 8 | …and that observation means the shell needs no ownership | **Low** | This is inference, not observation. The system shaper flagged "no evidence of a gap" as an *assumed leap*, and Attack 2 shows zero instrumentation cannot produce "no gap" |
| 9 | The shell is a stalled spike (0 commits since July 20, frozen version, no CI/tests, bundling disabled) | **Facts: High. Inference of abandonment: Low** | Attack 3 broke the inference (see §5). The same facts now support two readings and discriminate between neither |
| 10 | Registry has real concurrency exposure | **Medium on existence, Low on magnitude** | Investigator + Proposal 3 finding (3); explicitly unmeasured. Instrumentation judged highly reversible |
| 11 | No latency gap exists on the thin path | **Low** | Zero benchmarks or traces exist for *either* path. Attack 2's silent-abandonment mechanism is unfalsified and unfalsified-against |
| 12 | PRD.md's thin-client statement is authoritative | **Low** | PRD independently shown stale on 3 unrelated claims. Do not lean on it |
| 13 | Staying thin is highly reversible | **Contested — Medium-Low** | Attack 1 is live and unrebutted (see §5) |
| 14 | The real altitude is a product bet, not a service boundary | **Medium**, and out of scope | Lead advisor's reading of "experimental"; explicitly not resolvable by this panel |

---

## 3. What this recommendation costs

- **The cold-start race stays open.** If it is real and users hit it, they keep hitting it while telemetry accumulates. This is a deliberate, named cost of following Attack 5 over Proposal 3's order.
- **CI and telemetry on a component with no tests and disabled bundling is real setup work** on an "experimental" artifact — paid by the single maintainer, producing no user-visible improvement.
- **If the maintainer answers "abandoned" at step 5, steps 1–3 were wasted.** Step 5 is cheap and could have gone first; I am placing it fifth only because it is a question to a person rather than work, and can be asked in parallel with step 1. If you can ask it today, ask it today.
- **If a real latency gap exists, this path delays fixing it** by the length of the instrumentation cycle. Attack 2's point cuts against my recommendation as much as it cut against Proposal 1.
- **The ownership question stays formally open**, which carries a recurring cost: it will be re-litigated, and deferral is not the same as an answer.
- **It buys reversibility that Attack 1 disputes.** Every dollar of "cheap and reversible" in the framing above is contingent on Attack 1 being wrong, and Attack 1 was never answered.

---

## 4. Surviving dissent — attributed, unresolved

Two attacks are genuinely live. I am not picking a side on either, and the recommendation above is arranged so that neither has to be resolved before work starts.

### Attack 1 — "Stay Thin" Reversibility Illusion (architecture-critic; HIGH decision impact) — **LIVE**

**The objection:** engineering robust launcher coordination — cold-start races and all — is itself complex state-machine work that *entrenches* the multi-process split. If local ownership later proves necessary, that effort is sunk, and the architecture was only "highly reversible" if you did nothing at all.

**Target:** Proposal 1 (system shaper) as v1. Never answered — the system shaper got no rebuttal round.

**How my recommendation stands toward it:** *partially concessive, not resolving.* Step 4 declines exactly the state-machine work Attack 1 names as entrenching, which removes the attack's near-term bite. It does **not** settle the underlying claim, because the claim is about relative cost and no cost comparison was ever performed.

**Resolution condition (unmet):** the critic's own named evidence — a spike comparing engineering hours for robust launcher coordination vs. embedding the daemon directly into the desktop process. **Not run.** Until it is, the assertion "coordination hardening costs more than embedding" is untested *in both directions*, and the critic's earlier conceded attack establishes only that embedding is also new work, not that it is cheaper.

### Attack 3 — Punishing the Architecture for Succeeding (architecture-critic; HIGH decision impact, FLIPS Proposal 2) — **LIVE**

**The objection:** a thin client that needs zero changes when the daemon gains capability — exactly the Sept 3–5 observation — is the defining signature of a thin client working *as designed*. "0 commits = abandoned" is equally consistent with "0 commits = feature-complete as a dumb wrapper."

**Target:** the alternative shaper's (agy-bwrap/gemini-3.1-pro-low) PRIMARY recommendation to delete the shell, v1. Never answered.

**Status:** the attack is strong enough that I do not treat "stalled spike" as established — and it is *symmetric*. It breaks the inference from the commit gap; it does not establish that the shell is alive or wanted. The commit-gap evidence is now uninformative in both directions, which is why deletion is deferred rather than refuted. This also brushes the altitude the lead advisor ruled out of scope: whether "experimental" names a live product bet is the person's call, not the panel's.

**Resolution condition (unmet):** ask the maintainer directly whether development stopped because the shell is abandoned or because it is considered done. **Not asked.** This is step 5, and it is the single cheapest unresolved item in the entire session.

### Attack 5 — Sequencing (architecture-critic; MODERATE) — **adopted, and I am telling you I adopted it**

Attack 5 argued Proposal 3's fix-before-measure order may be over-investment if the launcher bugs are theoretical rather than active pain. I have applied it, which means **the constraint advocate's stated delivery sequence has been overridden without them being heard.** Proposal 3 explicitly ordered attachment repair *before* measurement on the grounds that "an unreliable thin client isn't operable regardless of ownership." If you weight operability above measurement discipline, restore Proposal 3's original order — that is a values call, and it belongs to you, not to me. My split (fix the three deterministic bugs, defer the unreproduced race) is an attempt to honor both, and it is my integration, not either actor's position.

### Attack 4 (LOW) — noted, no bearing

The critic showed the alternative shaper's falsification criterion #2 ("launcher issues are structurally unfixable with separate processes") is practically unfalsifiable. It therefore cannot discharge anything, and nothing below rests on it.

### Attack 2 (MODERATE) — folded into the recommendation, not disposed of

Attack 2 targeted Proposal 1's own self-declared leap and is the reason step 3 exists. It remains unsettled as a claim: no telemetry was deployed during this session, so "no latency gap" retains **Low** confidence (claim 11).

---

## 5. Unchecked falsification criteria

Every criterion below was stated by its author and **not checked**. None is satisfied; none is refuted. Do not read the recommendation as having cleared any of them.

**System shaper (Proposal 1):**
- Measured latency pain surfaces — **unchecked; no benchmarks or traces exist for either path.**
- "Experimental" is confirmed to mean must-work-offline — **unchecked; never put to the person.**
- A second maintainer takes ownership — **unchecked; lead advisor records one maintainer.**
- The cold-start race reproduces and is not fixed by the atomic gate — **unchecked; the race was never reproduced at all.**

**Alternative shaper (Proposal 2):**
- The commit gap is misleading, e.g. a desktop push is imminent — **unchecked, and now the crux of Attack 3.**
- The launcher issues are structurally unfixable with separate processes — **unchecked and, per Attack 4, not practically checkable as phrased.**

**Constraint advocate (Proposal 3):**
- Registry contention magnitude (finding 3) — **unmeasured by the proposal's own admission**; instrumentation named as the highly reversible way to check it, not performed.
- Real-workload measurement before reopening ownership — **not performed; it is the gate this recommendation adopts.**

**Critic's own evidence-to-settle:**
- Attack 1's hours-comparison spike — **not run.**
- Attack 2's TTI/search-latency telemetry — **not deployed.**
- Attack 3's direct question to the maintainer — **not asked.**

---

## 6. Actor provenance

All actors that were dispatched ran and returned. **No actor is missing; no actor failed; no specialist was dispatched.**

| Role | Actor | Executor | Model |
|---|---|---|---|
| Investigator | context-investigator | codex-readonly | gpt-5.5 (recorded — Coordinator note: this was omitted from the synthesizer's own briefing, a real gap in that dispatch's prompt; filled in here from `runs/1-context-investigator.json`, not asserted by the synthesizer itself) |
| Interpretation | lead-advisor | claude-bwrap | opus (recorded — same Coordinator-filled gap, from `runs/2-lead-advisor-interpretation.json`) |
| Proposal 1 | system shaper | claude-bwrap | sonnet (recorded) |
| Proposal 2 | alternative shaper | agy-bwrap | gemini-3.1-pro-low (recorded) |
| Proposal 3 | constraint advocate | codex-readonly | gpt-5.5 (recorded) |
| Critique | architecture-critic | agy-bwrap | gemini-3.1-pro-low (recorded — same Coordinator-filled gap, from `runs/6-architecture-critic.json`) |

**Provenance consequences worth weighing:**

- **No specialist was dispatched.** No performance or benchmark specialist ran, which is *why* claims 6, 10, and 11 sit at Low/Medium and why Attacks 1 and 2 could not be settled inside the session. This is a gap in coverage, not a gap in the ledger.
- The critic (agy-bwrap) shares an executor with the alternative shaper (agy-bwrap) yet produced Attack 3, which flips that shaper's primary recommendation. Worth recording as evidence the critique was not executor-captured.
- PRD.md staleness is single-sourced to the investigator and was not independently confirmed. It is load-bearing only negatively — it is the reason claim 12 is Low.

**Source revisions:** none. Every attack in §4 lands on the **v1** text of its target. There is no stale-integration risk here — but the converse holds and matters more: **Attacks 1, 2, 3, and 5 stand unrebutted, which is not the same as validated.** Three shapers were given the option to respond (doctrine: "may," not "must") and the session was time-bounded; no shaper declined on the merits. Nothing in this synthesis should be read as shaper agreement with any critique.

**No consensus is being reported.** All three shapers independently converged on daemon-holds-authority (Proposal 2 only via its SMALLER PATH, with deletion as its stated primary) — that convergence is real and is recorded in their v1 texts, and it is the strongest single input to the recommendation. It is *not* agreement about sequencing, about deletion, or about reversibility.

---

## 7. The open observation that would most change this answer

**Ask the maintainer why shell development stopped — abandoned, or done?**

Nothing else in the ledger has this leverage. If the answer is "abandoned," the alternative shaper's deletion path becomes live again, Attack 3 dissolves, and the entire ownership question — along with steps 1 through 4 above — evaporates rather than being answered. If the answer is "done as designed," Attack 3 is confirmed, the thin-client boundary is vindicated on its own terms, and the remaining work is exactly reliability and instrumentation. It is one question to one person, it is free, and it is currently unasked.

Runner-up, and the one that would most change the *shape* of the work rather than its existence: **deploy TTI/search-latency telemetry** (Attack 2). If a real latency gap surfaces, "no evidence of a gap" — the leap the system shaper named in their own proposal and never had settled — falls, and local ownership stops being a speculative concession and becomes a measured requirement.
