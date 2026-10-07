# Owner question bundle for Phases 7 and 8 (drafts, 2026-10-07)

Format per question: what is asked, options, recommendation with the reason, what it blocks. Recommendations are marked with `*`. Evidence sources are in `consumer-survey.md`, `phase-07-draft.md`, `phase-08-draft.md`. Questions that restate a decision the owner already took are written as "confirm", not as new choices.

## Phase 7

**Q7-1. Real contradictions found in the source content (not in the transformation).**
- Options: (a)* the owner decides the truth, the executor writes it (the SC-1 precedent: the code was declared the truth); (b) the executor proposes a resolution and the owner approves a list.
- Why (a): the constitution says no agent silently chooses a winner; Phase 5 already ran this way; (b) costs a second round for every conflict.
- Blocks: closing any `needs-owner` finding in Step 6.

**Q7-2. Where a new decision record is written after the cutover.** Both Pilot B readers could not answer this (the old decision corpus is retired and the candidate documents do not say).
- Options: (a)* per-area `docs/platform/<area>/decisions/` documents (constitution kind `decision`), with the generated `docs/decisions/index.md` staying the platform-wide index (Phase 6 answer N1) and `state.decisions` unchanged; (b) something else.
- Why (a): both pieces already exist (kind and generated index); it needs only one sentence in the area portals and the platform README.
- Blocks: the fresh-reader key of Step 7 (the question "where does the learning go" has no acceptable owner without it).

**Q7-3. Authoring probe in the fresh-reader round.** Plan section 10 requires that a fresh agent can "navigate and author without chat history or legacy paths". Phase 6 readers only answered the six questions.
- Options: (a)* add one authoring scenario per reader (state where a made-up claim is written, metadata needed, documents that must link it; nothing is written in the repository); (b) navigation only.
- Why (a): cheap (one extra scenario) and it is the only test of the "author" half of the acceptance sentence.

**Q7-4. Who the reader sessions are.**
- Options: (a)* two sessions started by the owner, of a model family other than the author's when available; (b) two in-process read-only readers (allowed by plan 7.2).
- Why (a): the pilots used in-process readers of the same family as the author; isolation was an instruction, not a sandbox, and shared blind spots are the main weakness of the method. (b) is acceptable if cost matters.

**Q7-5. Sample sizes.** 64 documents for the kind-separation sample (8 per kind), 150 cross-area edges for the contract sample, 20 evidence citations. These are chosen thresholds, not measured (the Phase 6 file uses the same wording for its own). Confirm or give other numbers.

**Q7-6. Component-boundary check if Plan B lands later.** Plan B (convention component) would change `docs/platform/component-boundary.md` and add an area. Phase 7 records `No component-boundary change` or the change as of its date.
- Confirm* that the check is repeated at Phase 9 step 3 (final candidate updates) if Plan B landed in between.

## Phase 8

**Q8-1. How consumers are changed.**
- Options: (a)* a digest-bound rewrite manifest applied in the cutover commit under the lease (prose, comments, help text, test paths); nothing a reader reads changes before then; (b) edit the consumers on the branch now.
- Why (a): matches the plan text ("rather than holding hundreds of edits on a long-lived branch"); keeps checks C and I green (no reader switch before Phase 9, Phase 5 rule); 1,347 reference edges in 275 files, hot files (`AGENTS.md`, `docs/specs/runner.md` neighbours) move on main meanwhile; the same manifest is rehearsed twice. (b) would need constant re-sync and would show readers candidate paths early.
- Blocks: the whole of Step 2 onward.

**Q8-2. Early harvest of behavioral-reader fixes (plan 5 item 9 lists only switchboard, inventory, ratchet, alias table, evidence relocation as approved early merges).**
- Options: (a)* only the lease goes to main early; reader fixes are patches in the manifest; (b) also merge the fixes that work on both the old and the new tree (default scan root made configurable, a test that tolerates both) to main early.
- Why (a): smaller surface on main, and the plan list does not include consumer fixes; (b) shortens the cutover diff by a handful of tests and one script default. The lease itself is not a question: its guard must be in the main checkout's hook (`core.hooksPath` is the absolute main path), so it has to merge early.

**Q8-3. Where the lease spec entry lives.** The AGENTS.md install/setup/doctor gate requires a spec row before code. The only current owner is `docs/specs/distribution.md`, a legacy root whose rows Phase 6 has already decided; a new row after Phase 6 is a new unit with no decision and makes the batch rows stale.
- Options: (a)* add the row to `docs/specs/distribution.md` (the current owner), record the ratchet exception, and give the new unit a decision row `delete-as-obsolete` tied to the lease removal after the cutover (the lease is migration-specific and the design removes it afterwards); (b) write it into a document under `docs/platform/packaging-distribution/` (violates "never dual-author, update only the declared current owner" until cutover); (c) a short standalone design document under the plan directory is accepted as the spec by the owner for this migration-only tool.
- Note: (c) is the cheapest and touches no reviewed row, but needs your explicit exception to the gate. I would take (a) if you want the gate untouched, (c) if not.

**Q8-4. Which gates survive the cutover.** The ratchet, the retirement check, the inventory generator and gates, the alias resolver, `verify-phase-01/02` (already frozen). The retirement evaluator and the ratchet name the legacy roots and have no job after the roots are gone.
- Options: (a)* keep ratchet, retirement check, inventory tools and alias resolver until Phase 10 decides their fate, with the legacy-root constants updated to the exempt set; delete `verify-phase-0x` and their tests at the cutover; (b) delete all migration gates at the cutover.
- Why (a): Phase 10 (maintenance MVP) will want the inventory and alias tools; deleting now loses the 1,026 gate-script edges but also the checks. Evidence policy decision 3 only requires the ratchet to be retired or rebaselined in the cutover change.

**Q8-5. Shipped skill, prompt and help text.** About 65 reference edges in `core/`, `domains/` and the renders (all targets), plus three CLI help strings, name repository-local documents. They are classified `repository-local-contract` (consumer projects never had these paths).
- Options: (a)* repoint like any other consumer; (b) remove the repository-local document link from shipped text.
- Why (a): smallest change, no behavior or contract change for consumer projects; (b) is the better product (a shipped skill should not point into this repository) but is a content change outside this plan; park as an improvement if you like it.

**Q8-6. Live work items that name a retiring path** (12 in the branch snapshot of `.fgos/state.json`; main's live number unknown). Their `verify` commands run at return and their `footprint` feeds the conflict advisory.
- Options: (a)* the owning session amends each through the supported write door before the lease and the count must be 0 at acquire; (b) accept the list and let those verifies fail or be edited at the time.
- Why (a): the lease and cutover cannot assume a session is free to fix them later.

**Q8-7. Plan B ordering.** Plan 7.5 requires the cutover after Plan A phase 06 (done) and Plan B phase 06. Plan B is pending and not authorized.
- Options: (a)* keep plan 7.5 as written (Phase 9 waits); (b) treat Plan B like Plan C (not a dependency) and let it rebase on platform paths afterwards.
- Why (a): it is your recorded decision (7.5b); I am only asking what happens if Plan B is still unscheduled when Phase 8 closes. Prepared `AGENTS.md` text is independent of the answer. Do not read this as a request to reverse the order.

**Q8-8. Lease branch, worktree, and who merges.** Recommended branch `feat/doc-cutover-lease`, worktree `/home/vantt/projects/forgentX-doc-cutover-lease`, built tests-first, reviewed by another session, merged to main by you (the plan worktree never writes the main checkout). Confirm or change the names. Phase 9 cannot start before the merge.

**Q8-9. `docs/ui-spec` toolchain.** The directory holds `spec.config.yaml`, `schema/`, `generated/` files, and the hand-authored skill `.claude/skills/ui-spec/tools/*` finds its root there (8 mentions in 5 tracked files). The Phase 6 Step 8 map gives `docs/ui-spec/**` an area under `docs/platform/`.
- Options: (a)* the area map decides the new home and the tool defaults and skill text follow it in the manifest; (b) keep `docs/ui-spec` where it is and exclude it from the retirement.
- Needed from you at the latest at Phase 6 Step 8 so the map is frozen consistently.

**Q8-10. Consumers outside git.** `.claude/rules/**` is gitignored (`/.claude/*`) and `~/.claude/**` is yours. A scan found no legacy path in `.claude/rules` today. Options: (a)* out of scope, recorded in the handover; (b) bring the rules into the repository. The lease cannot freeze either.

**Q8-11. `core/workflows` rule in `scripts/generate-shipped-path-inventory.mjs`.** The plan (7.4 item 3) leaves this to Phase 8, but the file is inside the extractor closure that Phase 6 froze (the document inventory generator imports it).
- Options: (a)* allowed if the document inventory is byte-identical in items, rows, digests and edges before and after the change (a script proves it); (b) skip and keep the known gap in the shipped-path inventory.

## Not questions, but needed from the team lead before these drafts become phase files

1. The Phase 6 close changes numbers: re-run the survey census (Phase 8 Step 2 does it) and fix every number marked "pre-Phase-6".
2. Phase 6 file names that Phases 7 and 8 assume but Phase 6 does not fix: the merged alias draft, the per-source link queues, the scorecard. Please name them in the Phase 6 file or accept UNPROVEN markers.
3. A decision on the Phase 6 owner queue item `strict-registry-input` determines the exact gate command D and E forms used in both drafts.
