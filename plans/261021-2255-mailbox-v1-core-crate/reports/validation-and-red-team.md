# Mailbox V1 plan: validation and red-team record

Date 2026-10-21, Asia/Saigon. Plan: [plan.md](../plan.md). Main re-checked at `7ce5672b3`.

## Validation (summary; full log in plan.md "Validation Log")

- 7 questions were raised. 6 were resolved from the spec, the reports or the code. One went to the owner (Q1).
- 52 claims were checked: 49 verified and 3 failed. The 3 were fixed: the `--type` argument of `fgos convention`, the phase in which `MailboxState` is created, and the `register` signature.
- One claim was verified by experiment: a crate-local `clippy.toml` applies only to its own crate inside the workspace.
- One claim is left unverified for V5: `resolve_workspace_root` from a linked worktree, and its cost.

## Red team

Four hostile reviewers were run in parallel (`code-reviewer` agents; `fgos dispatch decide --for red-team-review --needs-soul --has-live-task-access` returned `in-process`): Failure Mode Analyst (Flow Tracer), Assumption Destroyer (Scope Auditor), Security Adversary (Fact Checker) and Scope & Complexity Critic (Contract Verifier).

They raised 36 raw findings. After deduplication, 25 remain: 3 Critical, 8 High and 14 Medium. All 25 cite file:line evidence. 23 were accepted in full and 2 in part; the 2 rejected parts are recorded with their reason.

| # | Finding (reviewers) | Sev. | Disposition | Applied to |
|---|---|---|---|---|
| R1 | Idle-time pruning would leave a live but quiet head unable to receive mail for good, because registration happens once per process (spec lines 170, 192). It would also restart generations at 1, against the signed row at spec line 184, and reset the caps that are "never reset" (lines 264, 268) (FM1, SC2, AD4, AD5) | Critical | Accept: pruning removed from V1 (decision 11); retirement of dead bindings becomes owner Q2 | plan, phase 4 |
| R2 | `MailboxState` maps keyed by tuples or structs, and `&'static str`, cannot round-trip through `serde_json`, which V2 persists (SC1, SEC8) | Critical | Accept: snapshot rule with `String`-newtype keys, owned fields and serde enums | plan, phases 2, 4, 5, 6 |
| R3 | A rotating, unauthenticated `from` (`packages/session-identity/rust/src/resolve.rs:68-107`) grows the budget, exchange and lifetime maps without bound and bypasses the per-sender policies; the flood test checked only the counters (SEC1, FM5, AD2) | Critical | Accept: senders with no head share one accounting identity `unregistered` (decision 12); the flood test asserts the serialized size; lifetime caps for that identity become owner Q3 | phases 5, 6 |
| R4 | A `reply_to` hint chose the parent, so an agent could reset its own chain depth (spec line 278: "only the derived link feeds the guards") (FM4, AD1) | High | Accept: the link is always derived and the hint only validates (decision 6) | phase 5 |
| R5 | Notice dedupe looked only at the notices lane, which `finish` empties (FM6, SEC3, AD6) | High | Accept: separate `notice_last` record | phase 4 |
| R6 | A recorded notice had no TTL and was addressed to the sender's current generation, so it could reach a stranger process (spec line 176) (FM2) | High | Accept: notices are addressed to `(from, from_generation)`, dropped when that generation is no longer current, and expire after the record TTL | phase 4 |
| R7 | Mail left for an old generation filled the queue of the new generation for 24 h (FM3) | High | Accept: the queue counts only the current generation (decision 13) | phase 5 |
| R8 | Phase 3 test 10 asserted "state equal" after a refusal, but phase 5 makes refusals change state (AD3) | High | Accept: the assertion is now "no header added"; the API rule "install the snapshot after `Err` too" is stated | phase 3, plan |
| R9 | The snapshot test was not extended by the phases that add fields (SC3) | High | Accept: one owning test in phase 2, extended in phases 3-6 | phases 2-6 |
| R10 | The body escape left Unicode format characters in place: tag characters, zero-width characters, LRM/RLM (SEC4) | High | Accept: all Cf, private-use and noncharacter code points removed (decision 8) | phase 7 |
| R11 | Peer labels could imitate the system or another head (SEC2) | High | Accept: `from_label` defined (short name or `unregistered-…`); notices use their own `<mailbox-notice>` tag; no reply line for a sender with no head | phases 3, 7 |
| R12 | Counting only recorded sends removed the lifetime cap's role as the last brake (spec line 264) (FM7) | Medium | Accept: attempts are counted (decision 3) | phase 5 |
| R13 | A wall clock that steps back broke windows and deadlines; the only test was "no panic" (FM8) | Medium | Accept: `last_now` high-water mark, with an owning test | phase 2 |
| R14 | The branch rules contradicted each other ("Rebase or merge"), merged into dirty trees and pushed only in phase 8 (FM9) | Medium | Accept: commit, then merge, then prove, then push at every phase end; the "Rebase" line removed | plan, phase 1 |
| R15 | Duplicated proofs (SC4) | Medium | **Partial.** Accepted: the offer-cap test starts at `maxOffers − 1`; the driver-only assertion "no message 7" is deleted; the flood test now owns "snapshot size bounded", distinct from the eviction rule. **Rejected:** merging the replay tests 8-10 into the rule tests. Spec §14 V1 row (line 515) requires the measured numbers 6, 8 and 101 to be replayed as their own proof, and reproducing a measurement is a different behaviour from the rule | phases 4, 5, 6 |
| R16 | The `register` judge callback contradicted spec line 180 ("plain inputs") (SC5) | Medium | Accept: `judged: Option<StoredHead>` plus `binding(&self)`; mismatch refusal | phase 2 |
| R17 | The limits contract listed every key twice, used a non-standard contract-id shape and cited the wrong precedent (SC6) | Medium | **Partial.** Accepted: one `keys` list; `{id, version}`; corrected citation. **Rejected:** dropping the missing-key negative case. It guards plan decision 1 (no field may fall back to a code default), which is mailbox behaviour, not serde's | phase 1 |
| R18 | The purity lint had gaps (print macros, stdio, `Path::exists`, `OpenOptions`, `var_os`…) and was described as "enforcing" rule 3; the crate file shadows the root file (SC7, SEC9, AD8) | Medium | Accept: full list including `disallowed-macros`, `print_stdout`/`print_stderr` deny, one probe per family, the wording "narrows", and a shadowing comment | plan, phase 1 |
| R19 | V2/V3 surfaces were pulled into V1: body-GC query and Stop-block bound (SC8) | Medium | Accept: both moved out (decision 16); validation row V3 reversed | plan, phases 4, 6 |
| R20 | Placeholder substitution was not single-pass (SEC5) | Medium | Accept: single left-to-right fill, plus a test | phase 7 |
| R21 | `own_suffix` and the project part were unvalidated or unbounded (SEC6) | Medium | Accept: `[0-9a-z]{2}` check; the project part is cut so the name fits the header bound | phase 2 |
| R22 | A burst of cheap refusals could evict the counters that `status` needs (SEC7) | Medium | Accept: two tiers, with per-reason totals that are never evicted (decision 14) | phase 4 |
| R23 | The frame's reply command contradicted the `send` verb's contract (spec lines 290 vs 310) (AD7) | Medium | Accept: the frame follows §6.1 `--to`; phase 8 corrects the §5.5 example on the branch (decision 15) | phases 7, 8 |
| R24 | Deferring config-merge was attributed to an owner decision that covers only the doctor check (spec line 669) (AD9) | Medium | Accept: recorded as the plan's own choice, and V5 registers it | plan, phase 8 |
| R25 | Dead link to this record, stale main stamp, `attempt.rs:33` (AD10) | Medium | Accept: this file written; main re-stamped; line fixed to `:32` | plan |

Also applied: the integer widths of `Limits` are stated (`u64` for bytes and seconds, `u32` for counts; SC open question), and the cargo-deny line citation is corrected (`ci.yml:294-297`; SEC fact check).

## Whole-plan consistency sweep (after red-team)

- **Decision delta list:** decisions 3, 6, 8, 9 and 11 changed, and decisions 12-16 are new. Owner questions Q2 and Q3 are new.
- **Stale terms checked, none left:** searched all plan files for "prun", "callback", `referenced_bodies`, `stop_blocks`, `'static`, tuple map keys, "counts recorded", the positional reply command, "Rebase or", "enforces rule 3", `"defaults"` and `peer-frame`. The remaining hits are deliberate references to "no pruning" or Q2, plus `git fetch --prune`.
- **Cross-checked by hand for consistency:**
  - test counts in each phase's acceptance criteria;
  - the check table in phase 5 against decision 4;
  - the escape in phase 7 against decision 8;
  - the notice rules in phase 4 against decision 9;
  - the Stop-block removal across the plan, phase 1 (no `stopBlock` key) and phase 6;
  - the snapshot-test extension in phases 3-6.
- **Unresolved contradictions:** none. Owner questions Q1-Q3 each have a provisional default, so the plan is executable.
