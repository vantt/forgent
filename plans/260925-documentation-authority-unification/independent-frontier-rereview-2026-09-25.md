# Independent Frontier Re-review — 2026-09-25

```txt
Reviewer: Gemini 3.1 Pro High (frontier policy model) via fgOS dispatch
Mode: advisory/read-only, host writes denied
Plan reviewed: revised plans/260925-documentation-authority-unification/plan.md
Disposition: PROCEED WITH REQUIRED CHANGES for Phase 00 only; migration execution remains unauthorized.
```

## 1. Bottom line

**PROCEED WITH REQUIRED CHANGES** for Phase 00 only. The plan successfully incorporates critical corrections from the prior review, particularly regarding the current mixed-authority state, claim-level ledger requirements, dual-pilot strategy, and separation of consumer path contracts. However, execution remains unauthorized until shell-verifiable facts (evidence consumers, locked-law text, active development races) are confirmed, and the remaining ambiguities in the plan are addressed.

## 2. Severity-ranked findings

### High

**H1. Missing execution blocking mechanism during the cutover window.**
- **Evidence:** `plans/260925-documentation-authority-unification/plan.md` Phase 08 step 1 states "freeze writes during the cutover window" and step 2 "rerun inventory and detect source drift since baseline."
- **Finding:** Detecting drift is not a freeze. There is no mechanical enforcement preventing a concurrent `fgos dispatch` or session from mutating `docs/architect/agent-coordination/` during the cutover. A race condition could cause the cutover commit to silently delete an active uncommitted or newly committed file.

**H2. Risk of breaking active coordination workflows via evidence payload deletion.**
- **Evidence:** `plan.md` §3 rule 10 and Phase 08 step 6 state non-authority evidence payloads will be relocated and their consumers verified before deletion.
- **Finding:** The plan does not explicitly require an audit of whether tests or `src/runner/coordination/` code actively read these payloads at runtime (e.g., `docs/architect/agent-coordination/**/*.json`). Relocating them without verifying runtime execution dependencies could break active agent coordination.

### Medium

**M1. Unverified assumptions about `platform-foundations.md` locked laws.**
- **Evidence:** `plan.md` Phase 00 deliverable asks to "determine whether moving named roots touches locked L5/L8 text... require the proper superseding decision."
- **Finding:** This is an open check rather than a settled fact. If `docs/platform-foundations.md` explicitly hardcodes `docs/specs/reading-map.md`, moving it without a superseding D-ID violates the locked-law protocol.

**M2. Ambiguous post-cutover disposition for the migration claim ledger.**
- **Evidence:** `plan.md` §6.2 says the ledger is "retained after cutover as migration evidence and an import source for H2", but Phase 08/09 does not assign it a durable home.
- **Finding:** The ledger must be given a canonical location (e.g., `docs/platform/history/migration-ledger.jsonl`) to prevent it from being treated as a disposable plan artifact and lost before H2.

### Low

**L1. Minor discrepancy in provisional vs. active user document counts.**
- **Evidence:** `plan.md` §2.4 says "147 active and 332 provisional." The editorial post-review in `independent-frontier-review-2026-09-25.md` says the same. However, the reviewer note (M1) previously found 332 documents, all provisional, meaning no active docs existed.
- **Finding:** This is a minor statistical drift likely caused by the latest harness execution, but it should be confirmed.

## 3. Assumption ledger

| Assumption | Verdict | Evidence |
|---|---|---|
| The revision resolves the prior review's C1 (falsely assuming a clean state). | **Confirmed** | `plan.md` §2.1 and §2.4 explicitly map the current mixed/flipped areas. |
| The revision resolves C2 (missing alias resolver). | **Confirmed** | `plan.md` Phase 03 now requires a minimal importable platform alias artifact. |
| Pilot selection tests the method without guaranteed success. | **Confirmed** | Phase 04 mandates a dual pilot (re-audit `host-invocation-routing` + transform `work-state`). |
| Consumer path contracts are isolated from repo documentation unification. | **Confirmed** | Phase 01/07 separate shipped `core/skills` from repo docs. |
| Cutover rollback handles non-git state. | **Confirmed** | Phase 08 explicitly requires rollback of projections, aliases, and ledgers, and bans cutover event-log appends. |
| `docs/architect` evidence payloads have no runtime dependencies. | **Unresolved** | A shell pass is required to verify if coordination code reads these files. |
| Locked laws L5/L8 do not hardcode `docs/specs/` paths. | **Unresolved** | Needs inspection of `docs/platform-foundations.md`. |

## 4. Scope-loss audit

**Long-horizon elements preserved:**
- The separation of H1 (Authority unification), H2 (Knowledge and Documentation Engine), and H3 (Agent Context Engine).
- OKF v0.2 lessons (provenance, queryable trust, verifiable attestation) are preserved for H2 without blocking H1.
- Claim-level semantic tracking is preserved via the newly required `relations[]`, `decisionRefs[]`, and `sourceDigest` fields in the migration ledger.

**Long-horizon elements weakened or at risk:**
- **Claim-level decision supersession:** Because H2 is deferred, migrating decision text from `docs/specs/` to `docs/platform/<area>/decisions/` relies on manual prose updates rather than clause-level IDs. This weakens decision traceability until H2 is implemented.
- **Dynamic task-scoped instruction packets (ACE):** H1 relies on static reading maps and generated effective sets. This may cause agents to become overly reliant on static links, making the transition to dynamic budgeted packets in H3 culturally harder.

**Long-horizon elements lost:**
- None. The plan successfully defers features via the intent-preservation ledger (`docs/platform/intent-preservation-ledger.md`) rather than omitting them silently.

## 5. Sequence critique

The revised sequence is highly robust and incorporates the prior review's recommendations well.
1. **Dependency Loop Broken:** Phase 01 establishes a preliminary vocabulary, which Phase 03 freezes based on Phase 02 inventory evidence.
2. **Switchboard Early Harvest:** Phase 01 correctly introduces the switchboard to stop divergence, rather than waiting for the cutover.
3. **Correction:** Phase 08 should explicitly mandate a hard write-lock mechanism (e.g., locking `.fgos/events.lock` or failing any `fgos` mutation verbs via a temporary config hook) rather than just "detecting drift", to prevent concurrent modification races (H1).

## 6. Cutover falsification scenarios

1. **Evidence Payload Execution Failure:** `docs/architect` is deleted, and its evidence payloads are relocated, but `src/runner/coordination/` had hardcoded paths to those JSONs, causing runtime crashes that doc-linting missed.
2. **Locked-Law Invalidation:** `docs/specs/reading-map.md` is deleted, but L5 in `platform-foundations.md` referenced it explicitly. The instruction projection regenerates with a broken link, invalidating the agent's definition of done.
3. **Consumer Skill Drift:** The repo's docs move, but `plugins/fgOS/skills/` are not updated because they were deemed "out of platform scope." Consumer projects running fgOS globally are now instructed to read non-existent paths.
4. **Ledger Discard:** The migration is successful, but the claim ledger is left on the plan branch and eventually deleted, destroying the fine-grained decision mapping needed for H2.
5. **Alias Resolution Bypass:** The minimal platform alias artifact is created, but `bin/fgos.mjs` read commands are not wired to use it, causing historical event log paths to fail resolution.
6. **Concurrent Edit Loss:** A long-running agent coordination session writes to `docs/architect/agent-coordination/` during Phase 08. The cutover commit deletes the folder, silently erasing the agent's output.
7. **Incomplete Claim Mapping:** A large table in a legacy spec is assigned a single claim row. The migration drops half the rows in prose, but the ledger shows "100% source coverage" because the single claim ID was marked as migrated.
8. **Provisional User Docs Age Out:** The plan ignores the user-doc corpus. 332 provisional documents age indefinitely without promotion or retirement, degrading the quality of the end-user index.
9. **Event Log Poisoning:** Cutover scripts accidentally append `doc.move-path` events to `.fgos/events.jsonl` using the Diataxis-only registry format, corrupting the event stream with incompatible platform-profile events before H2 exists.
10. **Re-audit Confirmation Bias:** Pilot A re-audits `host-invocation-routing` using the same reviewer or agent that performed the original audit, resulting in a rubber-stamp pass that fails to falsify the method.

## 7. Required changes before authorization

**Before Phase 00:**
1. Execute a read-only shell pass to determine whether runtime code or tests read evidence payloads under `docs/architect/`.
2. Execute a read-only shell pass to inspect `docs/platform-foundations.md` and determine if moving legacy roots requires a superseding decision for L5/L8.

**Plan text corrections:**
3. **Phase 08:** Add a requirement for a mechanical write-lock (e.g., config flag or lockfile) during the cutover window, rather than relying solely on drift detection.
4. **Phase 08/09:** Explicitly assign the migration claim ledger a durable, canonical location in the target structure (e.g., `docs/platform/history/`) so it is preserved for H2.

## 8. Optional improvements after cutover

- Consolidate the two separate `intent-preservation-ledger.md` files for `agent-coordination` into a single canonical ledger.
- Implement automated verification of the platform alias resolver against the historical `.fgos/events.jsonl` log to ensure no historical paths are dead.
- Address the 332 provisional user knowledge documents by running a bulk promotion/retirement review cycle.

## 9. Independent recommendation

**Proceed with the proposed plan, incorporating the required changes.**

The plan's structure—early switchboard, claim-level ledger, dual pilot, and atomic cutover—is now structurally sound and correctly defers the complex H2/H3 engines.

My preferred roadmap aligns with the revised plan's phases, provided that the critical pre-execution shell checks (evidence payloads and locked laws) are performed immediately, and a hard mechanical lock is used during Phase 08.

**Next Action:** Do not execute mutations. Launch a read-only agent to run the required shell checks (grep for evidence consumers and inspect `platform-foundations.md`), then update Phase 00 with the findings before seeking execution authorization.

## Editorial post-review verification

This section is not part of the independent review above. A subsequent read-only
shell pass found:

- L5 and L8 in `docs/platform-foundations.md` contain no hardcoded
  `docs/specs/**` or `docs/architect/**` paths. Relocating the source does not by
  itself supersede their wording, but generated instruction anchors/projections
  and the L8 anchor suite must be updated and verified.
- No production-code text reference was found that directly opens a non-Markdown
  proof payload under `docs/architect/**`. There are nevertheless 566 such
  payloads, many source/test comments and skill references, at least one test
  asserting an architect contract path, and possible dynamic/glob consumers.
  Full consumer inventory therefore remains a pre-relocation gate rather than an
  assumed all-clear.

The plan now requires a migration-specific cutover lease and a sealed D2 claim
ledger under `docs/platform/history/documentation-authority-unification/`.
Migration execution remains unauthorized.
