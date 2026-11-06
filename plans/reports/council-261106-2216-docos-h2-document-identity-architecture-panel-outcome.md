# DOCOS H2: architecture panel on document identity, outcome and owner decisions

Date: 2026-11-06. Lead `claude-wfgg@design-lap` (`lead:DOCOS`). Panel worktree at main `03b769181`.
Question put to the panel: how to identify documents and claims so that write-time proliferation is blocked for agent, developer and user audiences, without repeating the registry failure (479 topics for 479 documents; 365 roles, 362 used once). Object under review: the draft [documentation spec](../../docs/platform/documentation/spec.md) at `03b769181`.

This report is self-contained: the panel's run records live in the untracked `.fgos/assignments/` of design-lap and are quoted here, not linked.

## 1. How the run went (operations, not content)

Workflow `architecture-advisory`, sixth start (the first five died on provider faults; evidence in [the omp foreground report](debug-261106-1557-omp-update-banner-seat-foreground-not-agent.md) and section 6). Seats:

| Step | Seats | Result |
|---|---|---|
| framing | claude | pass |
| shaping | system (openai), alternative (claude), constraint (gemini Argon through agy, account tetnu), synthesis (xai) | pass |
| critique | producer, reviewer, red-team | pass |
| synthesis | producer claude fable: pass; reviewer xai: findings; red-team openai: findings; tester deepseek (pi): `terminal:blocked:usage-limit` | step `failed` (provider-limit) |
| explanation, close | — | not reached |

The failure is operational: one seat ran out of usage, so the revision round that would have answered the reviewers did not run. The packet itself was written and reviewed. The owner chose not to rerun (section 5).

## 2. Verdict of the panel (agreed across all rounds)

- Do not sign a new coordinate system. Do not sign "each claim has exactly one owner". Nothing is authorized to be built from the packet.
- The owner's fear is confirmed in current code. At least seven paths mint or move authority with no admission:
  1. `topic.register` sets `status: 'active'` (`src/state/knowledge-registry.mjs:256`);
  2. `topic.split` successors are active (line 370), and four refusal strings steer writers to `fgos topic split` (lines 182, 202, 248, 534; `bin/fgos.mjs:1591`);
  3. registering a document directly `active`: `scripts/knowledge-bootstrap.mjs:198` and `:235`;
  4. free role on reserve (the role guard at lines 92–95 does not close the set);
  5. `doc.supersede` (lines 673–717) accepts a reserved or provisional successor with no promote;
  6. `doc.path-move` (lines 772–789) checks only path safety and uniqueness, not area;
  7. open `<area>` globs in `packages/convention/contracts/convention.rules.v1.json` admit a new platform area.
- The draft's rule "no match, then create" (spec 6.1) is rejected by every seat: a missed lookup is never permission to create.
- Surviving direction: **admission first, through doors that already exist.** Bounded promise: an ordinary writer cannot open a new authority namespace (new platform area, user topic becoming authority, role outside the admitted set, directly active document, supersede to an unaccepted successor, path-move across area) without an existing reviewed door; a missing or non-matching lookup never grants create; the (rule id, title) cross-holder check is a backstop with a declared limit, not a proof of meaning.
- Write the admission contract by effect, not by verb: every transition that creates a topic with authority, opens a slot, creates an active document, moves authority to a successor, changes holder or area, or renames a purpose passes the same admission at the existing new-event door; replay of old events is untouched.
- Two actions independent of the identity contract: the retrospective writer grows or re-attests by default (ALT-0), and a separate commit-gate honesty item.
- Not recommended: a matcher verdict that grants create; a gate keyed on writer prefix (`att-*`) or on a decision id merely existing; grandfathering the 365 roles; tightening enums inside replay; choosing a `proposed` topic status before its activation, replay, merge and reader semantics are written; bulk remap of the 479 topics; reviving the H1 migration engine.

## 3. Review findings on the final packet (writing defects, not disagreement)

The two reviewers found the packet sound in verdict but defective in places. These are corrected in the spec, not by a rerun.

| # | Seat | Finding | Disposition in the spec |
|---|---|---|---|
| R1 | xai | Says provisional policy keeps proposals out of authority while its own evidence shows the resolver treats provisional as live | Spec does not rely on provisional as a safe parking state; see R7 |
| R2 | xai | Role admission decided both as "close in the same batch" and as a silent default "defer" | Owner chose a set (section 5); no default deferral |
| R3 | xai | Claims the panel measured the paths that *produced* the 479 topics; causation is unproven (bootstrap is a confirmed direct source, the per-item writer a suspected one) | Spec says the paths exist; the cause stays open |
| R4 | xai | Missing-expertise list reopens a settled choice (area check in doc-health) | Not carried |
| R5 | openai, HIGH | ALT-0's "leave material" branch has no completion path: `checkRetrospectiveContent` (`src/state/cleanup-harness.mjs:361–458`) accepts only a non-engine decision, a linked existing document or a registry attestation; a probe of a material-only item returned `ok:false` | Item B carries the condition: find a legitimate completion path first, never weaken the gate or manufacture a decision |
| R6 | openai | The eight-role list was called the only candidate and contract-compatible; the signed contract (`knowledge-registry.md:55–73`) uses `decision`, not `decision-record`; the constraint seat also offered six roles; the ~15 LOC figure is unverified | Owner chose six roles named as the contract names them |
| R7 | openai | "332 provisional documents are current authority" overstates: the resolver returns the lifecycle with the document; `getActiveDocs` is strict. The real gap is `src/report/enduser-index.mjs:111–144` and `enduser-index-generate.mjs:44–79`, which emit entries without lifecycle | Recorded as a known finding in the spec |

## 4. Disagreement kept open (not consensus)

| Issue | Positions | Status |
|---|---|---|
| Role set | constraint: 8 values; system: derive from the corpus; alternative: role is not the load-bearing axis; critique: closing is mandatory, the list is not | owner decided (section 5) |
| Topic admission mechanism | alternative: `proposed` status + promote guard; constraint: `att-*` writer gate; system: an existing door, unnamed; critique: `proposed` incomplete, `att-*` insufficient | open; contract work for the lead |
| Where area membership is enforced | alternative: Convention enum; constraint and synthesis: doc-health over the boundary catalog; critique: neither is authorization | doc-health, for cost and one door; alternative's objection kept |
| "absent ⇒ create" inside a collection | constraint for; all others against | rejected |
| Partial supersession of D-tsk28x-4 (purpose as a coarse room) | alternative: now; synthesis and critique: not without evidence | deferred |
| Causal source of 479 × 1 | alternative: per-item writer; critique and red-team: bootstrap confirmed, no row-level trace | open; it decides how much item B buys |
| Is a new authoring skill a second door | constraint: no; synthesis: yes before the gate exists; critique: only with parallel logic | deferred to the contract |

Missing expertise named by the panel: Convention contract owner; identity owner for proving a person at promote; Event Store replay and release-compatibility owner for any new topic status; an operator of a project outside this repo for cross-project reach (B6, Convention Q13).

## 5. Owner decisions, 2026-11-06

Owner words (22:15): "ok, theo đề xuất" — accept the lead's recommendations as presented in chat:

1. **Bounded promise accepted; durable claim identity and any platform profile in the event store deferred.**
2. **Admitted role set for new writes: six roles** — `decision`, `runbook`, `pitfall`, `pattern`, `evidence`, `lookup-table`. `decision` follows the signed contract's name. Old roles replay and stay readable; the set binds new writes only.
3. **Two items opened now, separate from the identity contract:**
   - A. commit-gate honesty for documentation checks;
   - B. the retrospective writer grows or re-attests by default, on condition that the material-only branch gets a legitimate completion path first.

No rerun of the panel. Temporary panel routing (agy invocation, tetnu account, tetcu72 quarantine) removed the same evening.

## 6. Provider faults met on the way (for HARDEN)

- omp with `PI_CODING_AGENT_DIR=<profile>/agent` (how fgOS launches it) answers 404 "Requested entity was not found" for Gemini 4 Argon, while `omp --profile=gemini-tetcu72` interactive works.
- agy 1.5.2 in a herdr pane never submits the brief.
- `fgos workflow start --account gemini/tetnu` forced the gemini executor onto every seat, including framing (source `cliOverride`).
- pi/deepseek seat stopped on a usage limit shown only in its pane.

Status: DONE
Summary: Panel verdict is admission-first on existing doors with a bounded promise; owner accepted it, chose six roles, and opened two items.
