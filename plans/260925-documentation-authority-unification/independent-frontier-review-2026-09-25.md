# Independent Frontier Review — 2026-09-25

```txt
Reviewer: Claude Opus via fgOS dispatch
Mode: advisory/read-only
Plan reviewed: plans/260925-documentation-authority-unification/plan.md
Disposition: Source review preserved verbatim below; plan-level required changes were incorporated, but execution remains unauthorized pending re-review.
```

# Independent Frontier Review: Documentation Authority Unification

**Scope and limits.** This review is advisory only; I edited no files. I read every required document in full. The live tree was checked through direct reads plus three read-only Explore agents.

The shell was blocked for me and for the agents in this session, so these were **not independently verified**:
- `git show --stat 5c948d2a4` and whether that commit is an ancestor of HEAD
- `fgos doctor` and `knowledge status` output
- exact reference counts from `rg`, and which doc-related CLI verbs and doctor checks are registered

The consumer counts below are estimates by the agents, not grep results. Claims marked **(PLAUSIBLE)** need a shell pass before anyone relies on them.

## 1. Bottom line

**PROCEED WITH REQUIRED CHANGES**, for Phase 00 only. Phases 01–08 cannot be authorized as written. The plan is aimed at a clean two-system repository. The live repository already has per-area authority flips, three user-doc systems, and decision history stored in `docs/specs`. The plan has no step for reconciling any of that.

## 2. Severity-ranked findings

### Critical

**C1. The plan forbids a state the repo is already in, and the governance doc requires the method the plan forbids.**
- Plan §3 decision 4 says no area becomes canonical on its own. But in the live tree:
  - `docs/platform/packaging-distribution/`, `host-invocation-routing/` and `agent-coordination/` all carry "Canonical: Yes, after review".
  - Each has source inventories and preservation audits, for example `docs/platform/host-invocation-routing/history/source-inventory.md` and `verification/source-preservation-audit.md`.
  - The legacy sources are marked "keep legacy" plus "redirect".
- Three authority rules are live at the same time and disagree:
  - `docs/reading-map.md` §3: a partial target does not outrank the legacy source.
  - `docs/specs/reading-map.md:7`: read the packaging portal first; `docs/specs/distribution.md` is legacy.
  - The agent-coordination portal defers to `docs/architect/**` for contracts and decisions.
- `docs/doc-governance.md` §13, which is Accepted and canonical, says "Migrate one area at a time, with redirect/stub pointers". That is exactly the per-area approach the plan bans.
- Plan §2.1 describes the problem as a generic overlap and never lists these areas that have already flipped.

**C2. Deleting legacy platform paths needs a way to look them up afterwards, and that doesn't exist before cutover.**
- Plan decision 9 and Phase 08 step 7 say legacy paths will keep resolving "in the resolver".
- The only resolver is the knowledge registry. It is Diataxis-only: `diataxis` is the only framework (`knowledge-registry.mjs:24`), and there's no profile, area or docType. It has no rows for `docs/specs/**` or `docs/architect/**`.
- Generalizing the registry by profile is deferred until after cutover (Phase 09 / H2). So at cutover, nothing can resolve a platform alias.
- The legacy paths can't simply be rewritten away either:
  - The committed append-only event log (`.fgos/events.jsonl`, the source of truth under L1/L3) and decision records probably hold `docs/specs/...` paths **(PLAUSIBLE)**, and those cannot be edited.
  - AGENTS.md says decision narrative now lives in the "Lịch sử quyết định" (decision history) sections of `docs/specs/<area>.md`. `docs/decisions/` contains only `index.md`.
- The gate "no reader treats a legacy path as authority" therefore collides with immutable history.
- A quick static redirect map would conflict with PF-I006 ("do not hard-code migration identity so tightly to paths").

### High

**H1. The suggested pilots can't disprove the method.**
- Phase 04 suggests host-invocation-routing or packaging-distribution as the pilot. Both were already migrated with their own audits.
- host-invocation-routing's legacy source is only 6 files.
- A pilot there will almost certainly succeed and prove nothing.
- No pilot candidate includes an area with decision-history sections in `docs/specs` or a root-level authority document.

**H2. Conservation can't be checked because nothing says what a "claim" is.**
- §6.2 defines the fields of a claim ledger row but not how claims are extracted.
- It doesn't say whether a claim is a sentence, a section or a table row, and there's no mechanical coverage floor.
- A green ledger would only show the ledger agrees with itself, not that the source text was covered.
- The scale makes this serious: about 415 `.md` files in `docs/architect/`, 439 in `docs/platform/`, and 13 large specs.

**H3. There are now three disposition vocabularies and the plan's is incomplete.**
- The plan uses moved, merged, extracted, superseded, archived-with-reason, deleted-as-duplicate and deleted-as-obsolete.
- The already-migrated areas use promote, split, keep legacy, redirect, archive, deferred, superseded, rejected and unknown (`host-invocation-routing/verification/source-preservation-audit.md` §3).
- `scripts/knowledge-migration.mjs` uses lifecycle states and assumes one source maps to one target.
- The plan's vocabulary has nothing for:
  - a file split across many targets (only partly covered by "extracted"),
  - reclassifying a file out of platform scope (for example `docs/specs/enduser-docs-*.md` and `distillery.md`),
  - evidence kept where it is,
  - regenerating a generated source (`docs/specs/platform-foundations.md` is described as a "generated/curated spec projection").

**H4. What counts as "the platform" isn't specified.**
- The area registry in `docs/platform/README.md` §2 omits several things that exist today:
  - `confinement-authority`, herdr web dashboard / gateway, `fgos-plugin`, `distillery`, `decision-citation-drift`
  - `docs/architect/domainization/`, `docs/architect/component-boundary/` and `docs/architect/proposals/` (Step 09/10)
  - `docs/ui-spec/` (15 files, not under platform), `docs/contracts/`, and `docs/backlog.md`
- Root-level authority documents are "in scope" (§2.3) but never listed.

**H5. Evidence payloads sit inside the trees that would be deleted.**
- About 566 non-markdown files in `docs/platform/` and about 566 in `docs/architect/`, most of them in `agent-coordination` (937 files).
- The plan's model of three corpora puts evidence under `docs/history/**`.
- "Delete maintained files under `docs/architect/**`" gives no rule for requests, results and raw proofs that live alongside those files. It also doesn't say whether tests or coordination sessions read them **(PLAUSIBLE)**.

**H6. The always-loaded instructions and locked laws are touched without the governance gates.**
- AGENTS.md lines 9, 10, 38 and 46 route agents to `docs/specs/reading-map.md`. AGENTS.md's definition-of-done restates L5 with the same routing.
- If L5's own text in `docs/platform-foundations.md` names these paths, changing them is a locked-law change. AGENTS.md says that requires superseding the decision, not editing in place. This is unchecked.
- `core/instructions/platform-laws.md` generates AGENTS.md anchors of the form `docs/platform-foundations.md#l1--…`. Moving that root file makes the instruction projection stale, which affects setup/doctor.
- L8 (where always-loaded doctrine may be placed) isn't mentioned at all.

**H7. The plan never separates this repo's own docs from path conventions fgOS ships to other projects.**
- fgOS runs globally on other projects, so the mission boundary in AGENTS.md (D-ADR0035) applies.
- Skills built from `core/skills`/`domains` into `.agents/skills` and `plugins/` may tell agents in *consumer* projects to read or write `docs/specs/<area>.md`, `docs/history/<slug>/`, or `docs/knowledge/` **(PLAUSIBLE)**.
- A "repository-wide consumer rewrite" could quietly change a shipped contract. That is mission #1 impact inside a task framed as mission #3, and the plan doesn't state how it serves mission #1/#2.

**H8. Rollback isn't coherent for anything outside git.**
- Reverting one commit restores tracked files. It does not restore:
  - generated projections under `.fgos/instructions/effective/` or `.fgos/installation/projections/ledger.json`,
  - skills already installed in other projects,
  - any registry or alias events appended during cutover. Reverting `.fgos/events.jsonl` is hazardous and is blocked by the repo's `.fgos` commit guards.
- The plan's rollback section assumes all state is in git.

**H9. The historical-truth rules are already broken in the working tree, on the main checkout, and uncommitted.**
- Proposal §0 says the tsk-28x plan "must not be renamed". Yet git status shows every file under `plans/260825-1841-knowledge-registry/` deleted and `plans/260825-1841-end-user-knowledge-registry/` untracked. That is an uncommitted rename.
- The historical evidence files `docs/history/tsk-28x/plan.md` and `iron-law-evidence.md` are modified.
- Plan §5.1 says "Do not execute on the main checkout", but the Phase 00 edits were made there.
- These edits are exposed to the known risk of concurrent sessions wiping uncommitted work.

### Medium

**M1. The tsk-28x history is described inaccurately, and it has drifted.**
- "Shipped at commit `5c948d2a4`" mixes up two events:
  - landing the code (at `5c948d2a4`), and
  - the migration apply and the enforcement flip. `knowledge-registry-redesign.md` §18 says neither had happened as of 2026-08-27. Today the 332 docs are under `docs/knowledge/…` and `docRegistry.enforce` is `true` (`.fgos/config.json:830`). No artifact names the commit that did this.
- The historical plan's layout is `docs/<purposeSlug>/<role>.md`. The implemented layout is `docs/knowledge/…`, and the aliases show the corpus moved twice.
- Drift against the acceptance criteria:
  - **Roles:** the role field equals the document's own slug. That means 332 topics and 332 docs, where Phase 11 targeted roughly 268 files folded into about 33 targets. No deduplication happened.
  - **Lifecycle:** every sampled doc is `provisional`, so promotion was never run.
  - **Legacy roots:** `docs/explanation/` has 137 files, `docs/how-to/` 20 `.md` files and `docs/reference/` 6. Whether those were excluded from migration or grew back is unknown.
  - **Projection names:** the files are `docs/doc-registry.*`, not `docs/knowledge-registry.*`.
  - **Dead skill references:** `docs/specs/reading-map.md:26,29` still name `fgos-coding-compounding`, which no longer exists.
- This is negative evidence about whether claim folding works at scale. The plan cites tsk-28x only as a positive precedent.

**M2. Ledger rows needed for the future engines are missing, and the ledger's fate after cutover is undefined.**
- The claim ledger (§6.2) has no `relations[]`, no `authorityKind`, no per-claim source digest, and no decision lineage.
- PF-I007 says those seams must be kept.
- Nothing says whether the ledger is archived, deleted, or imported into H2. It is the most valuable seed for H2 and H3.

**M3. The intent ledger has defects.**
- The §5 host-invocation row points to a legacy plan and a nonexistent path, `docs/platform/host-invocation/…`. The real ledger is `docs/platform/host-invocation-routing/intent-preservation-ledger.md`.
- The agent-coordination row points to the `docs/architect` ledger, but `docs/platform/agent-coordination/intent-preservation-ledger.md` also exists. That's two ledgers for one area.
- PF-I005 to PF-I010 have no `Source` or `Proof/evidence` columns, which the ledger's own §3 requires.
- The ledger itself is Draft and "Canonical: after review". The whole non-preclusion safeguard rests on an unreviewed document.

**M4. The phases depend on each other in circles.**
- Phase 01's authority map "per area and claim kind" needs Phase 02's inventory.
- Phase 02's claim kinds need Phase 03's constitution.
- Phase 07 rewrites consumers on a long-lived branch, which will conflict with main for weeks.

**M5. The write freeze has no enforcement.** The ratchet blocks new files, not edits. Nothing stops concurrent sessions or dispatch from editing legacy roots during the window. `docs/architect/agent-coordination` is the most active tree.

**M6. The user side already has three systems:** the legacy quadrant roots, `docs/knowledge/` (332 files), and `docs/user/` (1 file). There's also a `docs/generated/` shell (1 file) and `docs/platform/proposals/`, which isn't in the governance placement map. The plan defers user-doc topology with no deadline, so a stable third system is likely.

**M7. "Candidate" status isn't machine-visible.** On the plan branch, an edit to a doc that is already "Canonical: Yes, after review" looks exactly like a candidate edit. There's no metadata field or check for it.

**M8. Claim anchors are fragile.** Source anchors are headings in Vietnamese, unnumbered, and often edited in active areas. "Positional-order-independent" IDs need an anchor based on content digests, and none is specified.

**M9. The fresh-reader review has no pass criterion.** There's no protocol (for example, the six L5 questions per area) and no independent sample audit of claims traced from source to target.

### Low

- **L1.** `iron-law-evidence.md` says 6 failures but itemizes 2 + 2 while claiming "4 in workflow-stage-graphs". This is a historical record, so note it rather than edit it.
- **L2.** The proposal's "## 4.8" violates the governance numbering rule.
- **L3.** CLAUDE.md duplicates the GitNexus and MDView blocks that it also imports through `@AGENTS.md`. The cutover would have to rewrite both copies.
- **L4.** Proposal §2.2 lists `fgos doc … demote`, which isn't in the tsk-28x verb list (unverified either way).

## 3. Assumption ledger

| Assumption | Verdict | Evidence |
|---|---|---|
| Platform authority is two overlapping systems | **Falsified as stated.** It's more like four: `docs/specs`, `docs/architect`, root authority files, and `docs/platform` split between flipped and candidate areas. | C1 |
| No area is independently canonical yet | **Falsified** | Portal headers; `specs/reading-map.md:7` |
| tsk-28x is a completed foundation to reuse | **Partly confirmed.** Code, layout, and enforce=true exist; deduplication, roles and promotion were never achieved. | M1 |
| Existing resolver or aliases can carry legacy platform paths | **Falsified** | Diataxis-only registry |
| `docs/specs` is mostly current-state specs | **Falsified in part.** It also holds decision-history narrative and knowledge-profile specs. | AGENTS.md; file list |
| Minimum constitution precedes inventory without circularity | **Falsified** | M4 |
| One atomic commit can be reverted | **Unresolved; likely false** for state outside git | H8 |
| Consumer rewrite is internal to this repo | **Unresolved** | H7 |
| `5c948d2a4` is in HEAD's ancestry | **Unresolved** (shell blocked) | — |
| Doctor checks for the registry are wired | **Unresolved** (shell blocked; the agent's first "zero checks" answer was discarded) | — |
| H2/H3 stay off the critical path | **Confirmed in text, violated in substance:** cutover needs a platform alias capability (C2). | C2 |

## 4. Scope-loss audit

- **Preserved:** separation of the H1/H2/H3 horizons; the sequence law; the non-preclusion law; the Agent Context Engine as a separate component; OKF lessons placed in H2 at the right layer (confirmed); keeping the full proposal intact.
- **Weakened:**
  - typed relationships and decision lineage (the claim ledger has no fields for them);
  - path-independent identity (C2 pushes toward a static path map);
  - the user/platform profile distinction (no deadline);
  - claim-level decision supersession (decision narrative may be moved as prose without clause IDs).
- **At risk of loss:**
  - evidence payloads under `docs/architect` (H5);
  - the claim ledger itself, with no post-cutover disposition;
  - the ability of consumer projects to use their own doc layout (H7).

## 5. Sequence critique

1. Phase 00 must first **inventory the current authority state**: which areas have flipped, which are candidates, which are legacy. It must also amend `doc-governance.md` §13. Otherwise the plan contradicts canonical governance.
2. Put a **v0 claim-kind vocabulary into Phase 01**, before inventory. Phase 03 then freezes it using inventory evidence. That breaks the circular dependency.
3. **Move consumer indirection earlier, onto main, as early harvest.** Every instruction, skill and portal routes through one switchboard (`docs/reading-map.md` holding a per-area authority table). Cutover then changes table rows and deletes files; it doesn't rewrite hundreds of consumers on a stale branch. This keeps the atomic flip and shrinks Phase 07 to verifying that no path bypasses the switchboard.
4. Design a **minimal platform alias/redirect artifact in Phase 03**. It must be importable into the future registry profile, or it violates PF-I006. This must exist before Phase 08.
5. Treat evidence payloads under the maintained trees as a separate track. Moving non-authority payloads changes no authority, so it can happen before cutover without breaking the atomic-flip rule. This needs your decision; see §9.

## 6. Cutover falsification scenarios

Each of these can look like success while leaving two authorities or losing claims:

1. The conservation ledger is internally green, but whole source sections were never turned into claims (H2).
2. `docs/specs` is deleted, but "Lịch sử quyết định" narrative only moves into generic prose. Decision records in `.fgos` events still point at dead paths.
3. Legacy platform paths in the immutable event log have no resolver. Old lookups silently return nothing (C2).
4. An already-flipped area (packaging) is re-migrated. Its earlier audit and the new ledger disagree, and both stay in `history/` as competing preservation claims.
5. Two intent ledgers for agent-coordination both survive, one under `platform`, one moved into `platform/…/history`, and both are read as current.
6. Consumer projects keep installed skills that route to `docs/specs/<area>.md`. The fgOS repo passes its gate while shipped behavior diverges (H7).
7. The generated instruction projection (`.fgos/instructions/effective`) keeps stale anchors to root `platform-foundations.md`. Tests don't catch it because the projection lives outside git.
8. Evidence payloads are deleted with `docs/architect`. Verification docs keep links that now resolve to nothing, and the gate only looked for "authority" references.
9. `docs/explanation/` (137 files) and `docs/how-to/` stay as live user roots after the "platform cutover". The program declares success while the user side runs three systems.
10. A concurrent session edits `docs/architect/agent-coordination/**` during the freeze. The cutover commit deletes the file and loses the edit without anyone noticing (M5).
11. The fresh-reader review passes because reviewers had chat context or were steered to the new portal. No objective criterion was applied (M9).
12. Aliases are implemented as stub redirect files "temporarily". Writers keep editing the stubs.
13. Candidate docs on the branch overwrite canonical-flagged docs in `docs/platform/**`, and the difference isn't detectable at merge (M7).

## 7. Required changes before authorization

**Phase 00:**
1. Restore or commit the historical artifacts properly:
   - Decide explicitly whether the tsk-28x plan rename stands. If it does, amend proposal §0; either way, fix inbound references.
   - Don't edit `docs/history/tsk-28x/*`; put corrections in a new note.
   - Commit Phase 00 on a plan worktree, not the main checkout.
2. Add a live **current-authority table per area** (flipped / candidate / legacy) and amend `doc-governance.md` §13 and `reading-map.md` §3 so there is one rule.
3. Correct the intent ledger: fix the host-invocation path, choose one agent-coordination ledger, add the Source and Proof columns, and state whether the ledger is canonical.
4. Correct the tsk-28x wording: code at `5c948d2a4`; the apply and enforce flip at later, named commits; and record the drift listed in M1.

**Before Phase 01:**
5. Define claim granularity and a mechanical source-coverage floor (every source heading or anchor maps somewhere).
6. Unify the disposition vocabulary with the existing audits' terms, and add split, reclassify-out-of-scope, retain-as-evidence and regenerate.
7. Specify the platform alias mechanism, including how immutable paths in the event log resolve.
8. Enumerate the full area list and all root authority docs (H4). Add an explicit policy for evidence payloads.
9. Separate this repo's own paths from shipped conventions. Inventory the path contracts in `core/skills` and `domains/*/skills` separately, and state how the plan serves mission #1/#2.
10. Add `relations[]`, `sourceDigest` and `decisionRefs` to claim rows. Define the ledger's post-cutover disposition (import into H2).
11. For any ratchet or checker, choose between scripts-level with a baseline json (like `check-decision-codes`) and doctor-registered. Doctor-registered means entries in `src/setup/registrations.mjs` plus a CHANGELOG line, per the install/setup/doctor gate in AGENTS.md.
12. Check whether the text of locked law L5 (or L8) names the paths being changed. If it does, that change needs a superseding decision record.
13. Rewrite the rollback section to cover non-git state (projections, installed skills, events) and require that cutover writes no event-log entries.
14. Replace the pilot choice with the dual pilot described in §9.

## 8. Optional improvements after cutover (not blockers)

- Fix the tsk-28x role vocabulary and promotion backlog through the H2 profile work.
- Add a doc broken-link and nonexistent-skill checker to CI (none exists today).
- Deduplicate CLAUDE.md against AGENTS.md.
- Split `plan.md` into phase files, per the repo's plan conventions.
- Adopt OKF `stale_after` / `verified` semantics in the H2 schema.

## 9. Independent recommendation

Keep the goal: one platform authority, with H2/H3 off the critical path. Reorder the route so each step pays off on its own:

1. **Truth reset (Phase 00 as amended).** Current-authority table, governance amendment, history restored.
2. **Switchboard on main.** One read route, the legacy-root ratchet, and a dead-reference check. This removes reader guessing immediately without flipping any authority.
3. **Inventory at section-anchor level**, with mechanical coverage checks, the unified disposition vocabulary, and a first version of the platform alias table.
4. **Dual pilot:**
   - (a) Re-audit host-invocation-routing's *existing* migration using the new ledger. If the new method finds claims the old audit missed, the method is proven. If it finds none, check how sensitive it is before trusting that.
   - (b) Migrate one area that hasn't been touched and has mixed claims: work-state, i.e. `docs/specs/work-state.md` plus its decision history, plus the root `io-contract.md`.
5. **Candidate transformation** by target owner, with candidate status marked in metadata.
6. **Atomic authority flip through the switchboard.** Swap the table rows, delete maintained legacy files, activate the aliases.

One decision is yours, because it touches the "atomic cutover" choice you locked in:

- **Option A (my recommendation):** relocate non-authority evidence payloads before cutover. Authority still flips in one step, and the risk in the cutover commit drops sharply.
- **Option B:** move everything together at cutover, as the plan says. Rollback is simpler in principle, but the commit is huge and conflicts with active agent-coordination work.

After the flip, H2 starts from the retained claim ledger, and H3 later consumes the H2 graph.

**Unresolved questions:**
- Ancestry of `5c948d2a4`, and the commits that did the migration apply and flipped `enforce`.
- Whether the 137 files in `docs/explanation/` were excluded from migration or grew back.
- Whether tests or coordination code read evidence under `docs/architect`.
- Whether shipped skills impose `docs/specs` or `docs/history` paths on consumer projects.
- Whether L5 text names the legacy paths.
- Which doc/topic/knowledge verbs and doctor checks are registered today.

All of these need a shell-enabled read-only pass.

## Editorial post-review verification

This section is not part of the independent review above. The authoring session
subsequently verified read-only that:

- `5c948d2a4` is an ancestor of current `HEAD`;
- corpus migration appears as the `tsk-5mh` commit series dated 2026-08-27;
- `6cce97ab3` flipped `.fgos/config.json`'s `docRegistry.enforce` to `true`;
- `fgos knowledge status` currently reports 479 topics/documents, with 147 active
  and 332 provisional documents, and `fgos doctor` exits 0;
- the legacy quadrants currently contain 137 explanation, 20 how-to, and 6
  reference Markdown files;
- both target area intent ledgers exist, and a search found 64 legacy
  `docs/specs/**`/`docs/architect/**` path references in core/domain/plugin skill
  Markdown, confirming that shipped conventions need a separate inventory.

The remaining questions—evidence payload runtime consumers, locked-law path
mentions, and complete command/doctor registration—remain Phase 00 evidence
requirements.
