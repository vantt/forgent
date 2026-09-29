# Panel-Depth Experiment Scoring Rubric

## 0. Provenance disclosure (read first)

- The locked plan decision says this rubric must be committed **before** the first real call. That did not happen: real sessions were dispatched before the rubric existed.
- As a disclosed mitigation, an agent with **no exposure** to any real run content wrote this file after the fact. It never read, listed, or grepped the experiment's `corpus/`, `real-runs/`, logs, or JSON, or `P05.2.md`. It worked only from the locked specification text, which is quoted in Section 1.
- The final report MUST:
  1. cite the git SHA of the commit that added this file;
  2. state plainly that the rubric was written after real dispatch, as a mitigation, by a blind author.
- This file does not change after its commit. A later correction goes in a new, dated section appended at the end, with its reason. The final report then cites both SHAs and says which results were scored under which version.

## 1. Locked specification being operationalized (verbatim)

> (a) The scoring rubric must be committed to the experiment's own directory BEFORE the first real call, with its git SHA cited in the final report — never written or adjusted after seeing results.
>
> (b) Explanations are stripped of any profile-identifying text and scored BLIND, by an executor on a DIFFERENT provider than the panel's own synthesizer/lead-advisor executors, plus a human spot-check of at least one case — the Lead (who knows which explanation is which) must never self-score.
>
> (c) "Dissent retention" is mechanical, not impressionistic: enumerate every distinct material finding in the full run's own `redteam.md`, then mark present/absent BY SUBSTANCE in each of the two explanations; also track whether critique/constraint objections (which exist in both profiles) survive, as a control.
>
> (d) Factual error is scored ONLY against independently VERIFIED ground truth (see corpus below) — never scorer opinion where no ground truth exists.

This rubric adds no scoring dimension beyond (a)–(d).

## 2. Roles

| Role | Who | May see | Must never |
|---|---|---|---|
| Packet preparer | Anyone except the blind scorer. Can be the Lead, because this work is mechanical. | Everything | Score, or edit explanation substance beyond the redactions in Section 4 |
| Blind scorer | An executor on a provider that differs from **every** provider used by the panel's synthesizer and lead-advisor executors in any scored run | Blinded packet only (Section 3) | See profile names, run IDs, the unblinding key, or unredacted explanations |
| Human spot-checker | A person, not the Lead | Blinded packet only | See the unblinding key before their marks are committed |
| Lead | The experiment Lead | Everything | Score, re-score, adjudicate scorer or human disagreements, or edit any mark |

**Provider check, done before scoring.** The preparer records in `scoring/provider-check.md`:
- the synthesizer and lead-advisor executor and provider for every scored run;
- the blind scorer's executor and provider.

If the scorer's provider matches any of the panel providers, stop and choose another scorer.

## 3. Blinded packet contents (per case)

For each case, the preparer builds `scoring/<case-label>/`, where `<case-label>` is a neutral label such as `case-1`:

1. `question.md`: the decision question as posed to the panel, identical for both runs.
2. `explanation-X.md` and `explanation-Y.md`: the two final explanations, redacted per Section 4. Assign X and Y by an independent coin flip for each case, and record the result only in the unblinding key.
3. `redteam-findings-source.md`: the full run's own `redteam.md`, verbatim. This is needed for (c). The scorer already knows one run had a red-team phase, so this file reveals nothing about which explanation came from which run.
4. `control-objections-source-X.md` and `control-objections-source-Y.md`: each run's own architecture-critic and constraint-advocate objection outputs, verbatim, labelled with the same X/Y letter as that run's explanation. Apply the Section 4 redactions to these as well.
5. For core cases only: `ground-truth.md` (Section 7.1).

**Unblinding key.** Store the key at `scoring/unblinding-key.md` and commit it **only after** every scorer mark and every human spot-check mark is committed. Until then, keep it outside the repo or unstaged.

## 4. Blinding: what counts as profile-identifying text

In each explanation and in each control-objection source, replace every occurrence of the items below with `[REDACTED]`. Do not reword the surrounding text.

1. Profile names and synonyms: `full`, `standard`, `lite`, and any profile or variant name used by the protocol, when they refer to the run's profile.
2. Any mention of a red-team phase or role as a process step: `red-team`, `red team`, `redteam`, `redteam.md`, `independent red-team`, `adversarial reviewer`. **Keep the substance** of any objection the sentence attributes to that role.
   - Example: "The red-team flagged that X fails under Y" becomes "[REDACTED] flagged that X fails under Y".
3. Protocol IDs, profile IDs, phase or step names that exist in only one profile, and window or reveal names tied to a red-team step.
4. Run, session, assignment, and dispatch IDs; file paths; branch names; commit SHAs.
5. Executor, model, and provider names, plus cost, token, round-count, and duration figures.
6. Timestamps and dates, unless they are part of the decision's substance.
7. Headings or sections that exist only because of a profile-specific phase, such as "Red-team response". Delete the heading text and keep the body, which is still subject to rule 2.

**Do not redact:**
- technical substance, findings, claims, numbers about the system under decision, or recommendations;
- length or structure. Do not pad or truncate. Record each explanation's word count before and after redaction in the unblinding key.

**Redaction self-check.** Before handing over the packet, the preparer greps each redacted file for every term in items 1–3 and records the zero-hit result in `scoring/redaction-check.md`. Any hit fails the packet.

## 5. Dissent retention (spec c), step by step

### 5.1 Enumerate red-team findings (before opening any explanation)

The blind scorer works from `redteam-findings-source.md` **only**, and has not yet opened `explanation-X.md` or `explanation-Y.md`.

1. Read the file end to end.
2. List every statement that meets **all** of these conditions. Each such statement is a candidate finding.
   - It asserts a risk, error, gap, missing consideration, unsupported assumption, or a recommendation to change, condition, or reject the decision.
   - It is about the decision's substance, not about wording, formatting, or the process of the panel itself.
3. Exclude from the candidates:
   - agreement or endorsement with no new objection;
   - pure restatements of the question;
   - style, wording, or formatting nits.
4. Split compound candidates into atomic findings. The test: could an explanation contain one part without the other? If yes, split.
5. Merge duplicates. Two candidates are the same finding only if they name **the same object** (component, assumption, or option) **and** the same failure or risk **and** the same claimed consequence.
6. Number the result `RT-1 … RT-n`. For each finding, record:
   - a one-sentence substance statement;
   - the verbatim source quote, or its line numbers.
7. **Freeze.** Commit `scoring/<case-label>/redteam-findings.md` before step 5.2. The list may not change after this commit.

### 5.2 Mark presence in each explanation

For each `RT-i` and each explanation (X and Y), mark exactly one value:

- **PRESENT**: the explanation states the same substance. That means the same object, the same risk or failure, and the same consequence, in any wording. The finding counts as present whether the explanation adopts it, conditions on it, or names it and rebuts it. Record the verbatim quote that satisfies the match.
- **ABSENT**: no such statement exists. This includes cases where the explanation mentions the object but not the risk, or the risk on a different object.

Rules for the scorer:
- Do not give partial credit. If you find yourself wanting to mark "partial", step 5.1.4 did not split the finding enough. Record that as a note in the marks file and mark ABSENT.
- Do not infer. An implication the scorer could derive, but the text does not state, counts as ABSENT.

### 5.3 Control: critique and constraint objections

1. Repeat steps 5.1.2–5.1.7 separately on `control-objections-source-X.md` and `control-objections-source-Y.md`. Number the results `CX-1…` and `CY-1…`, and freeze both lists.
2. Mark each `CX-i` PRESENT or ABSENT in `explanation-X.md`, and each `CY-i` in `explanation-Y.md`, using the Section 5.2 rules.

### 5.4 Per-case outputs

| Metric | Formula |
|---|---|
| Red-team retention X | PRESENT count of RT in X ÷ n |
| Red-team retention Y | PRESENT count of RT in Y ÷ n |
| Control retention X | PRESENT count of CX in X ÷ count of CX |
| Control retention Y | PRESENT count of CY in Y ÷ count of CY |

Report the raw counts next to every ratio. With a handful of cases, no significance test is claimed.

### 5.5 Disposition of present findings (the only "decision-quality" measure)

The corpus note allows "decision-quality" scoring but does not define it. So that no new dimension is invented, this rubric limits decision-quality to the handling of the findings already enumerated in 5.1 and 5.3.

For each PRESENT mark, record one disposition:
- **DISPOSED**: the explanation's final recommendation adopts the finding, adds a condition or mitigation for it, or rebuts it with a stated reason.
- **MENTIONED-ONLY**: the finding appears, but the recommendation neither acts on it nor rebuts it.

Report the DISPOSED count over the PRESENT count for each explanation. No other quality scale is applied.

## 6. Scope per case type

| Case type | Dissent retention (5.1–5.4) | Disposition (5.5) | Factual error (Section 7) |
|---|---|---|---|
| Core: the two herdr-gateway cases from `docs/platform/agent-coordination/verification/architecture-advisory-panel/P05.2.md` (one "clear", one "unclear") | Yes | Yes | Yes, against the ground-truth facts only |
| Extra: 1–2 cases from this track's own decisions (for example I18 rust-host-regen, I21 executor-pin bypass, I24a H3 wording, I26 H1/H2 reconciliation) | Yes | Yes | **Forbidden.** These cases have no independent ground truth. |

The report must not state, estimate, or imply a factual-error rate, count, or comparison for any extra case. That includes qualitative claims such as "X made more mistakes". If the scorer believes an extra-case explanation is factually wrong, the scorer may record it as an unscored note, which is excluded from every metric.

## 7. Factual error (spec d): core cases only

### 7.1 Ground-truth sheet

The packet preparer extracts the two verified facts verbatim from `P05.2.md`, at about lines 170–200, into `scoring/<case-label>/ground-truth.md`. The extract must include the line citations and state which core case or cases each fact bears on. The facts are:

- **GT-1**: a reproduced false-wrap rate of **30.8%**, from a real test run.
- **GT-2**: a live-confirmed finding about the **Codex cursor glyph**.

Nothing else counts as ground truth. The scorer may not add facts.

### 7.2 Procedure

For each core case, each explanation (X and Y), and each GT fact that bears on that case, mark exactly one value.

**For GT-1:**

| Mark | When |
|---|---|
| CONSISTENT | The explanation states a figure of 30.8%, or any figure from 30% to 32% inclusive, for the same measurement. It also counts if the explanation uses a qualitative description compatible with that level (for example "about a third" or "roughly 30%"), or relies on the rate being real and material. |
| CONTRADICTS | The explanation states a figure outside 30–32% for the same measurement. It also counts if the explanation calls the rate negligible, rare, unconfirmed, or non-existent, or reasons as though the false-wrap problem does not occur. |
| SILENT | The explanation makes no claim about this rate or problem. |

**For GT-2:**

| Mark | When |
|---|---|
| CONSISTENT | The explanation's claims about the Codex cursor-glyph behavior agree with the verified finding, or rely on that finding being real. |
| CONTRADICTS | The explanation denies it, calls it unconfirmed or speculative, or asserts behavior that the verified finding is incompatible with. |
| SILENT | The explanation makes no claim about this behavior. |

For every CONSISTENT or CONTRADICTS mark, record the verbatim quote.

**Factual-error count** for an explanation is the number of CONTRADICTS marks. Report it with the number of facts actually engaged, meaning CONSISTENT plus CONTRADICTS, and never as a rate over facts the explanation stayed SILENT on.

Every other factual claim in a core-case explanation is **not scored**, even if the scorer believes it is wrong.

## 8. Human spot-check (spec b)

1. The human spot-checker independently repeats Sections 5.2, 5.3 (marking only), 5.5 and, for core cases, Section 7 on **at least one case**. Prefer a core case. They use the frozen finding lists from 5.1 and 5.3.
2. The human's marks are committed before unblinding, in `scoring/<case-label>/human-marks.md`.
3. Every mark where the human and the scorer disagree is listed in the report with both values. **No one reconciles the disagreements.** The Lead in particular does not adjudicate. The report shows the scorer's metrics and the human's metrics side by side for that case.

## 9. Order of operations checklist

- [ ] This rubric is committed, and its SHA is recorded for the final report (spec a).
- [ ] The provider check is done (Section 2).
- [ ] The blinded packets are built, and the redaction check passes (Sections 3–4).
- [ ] For each case, the RT list is frozen and committed (5.1.7).
- [ ] For each case, the CX and CY lists are frozen and committed (5.3).
- [ ] For each case, the scorer's PRESENT/ABSENT marks, dispositions, and core-case factual marks are committed.
- [ ] The human spot-check marks are committed for at least one case.
- [ ] Only now is the unblinding key committed and X/Y mapped to the full and standard runs.
- [ ] The report cites this rubric's SHA, the provenance disclosure from Section 0, the per-case tables from Section 5.4, the Section 5.5 disposition counts, core-case CONTRADICTS counts only, and the human-versus-scorer disagreements.
