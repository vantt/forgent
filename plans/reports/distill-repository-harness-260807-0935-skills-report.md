# Inventory: New Repository-Harness Agent Skills

**Date:** 2026-08-07  
**Tested Upstream Revision:** 0a79bbe (moved from 9cc306d, added 4 skills)  
**Inventory Scope:** Mechanical facts only, no judgment or adoption recommendation

---

## Skill 1: engineering-wisdom

**File:** `.agents/skills/engineering-wisdom/SKILL.md`  
**One-line purpose:** Provide an explicitly requested, repository-grounded engineering review using contextual heuristics for code clarity, SOLID and design, testing, refactoring, architecture, and professional practice.

### When It's Used

- Triggered by explicit user invocation: `$engineering-wisdom` or explicit user request
- **Not** implicitly invoked; installation alone does not activate it
- User must confirm skill invocation; it is read-only and provides advice/review only

### Workflow Steps (from SKILL.md lines 11-78)

1. **Establish Scope**
   - Read `AGENTS.md`, `docs/WORKFLOW.md`, and only repository material relevant to the request
   - Confirm explicit user invocation (installation alone is not activation)
   - Determine whether the request is advice/review (read-only) or authorized change (follow repository authority)
   - Read `references/heuristics.md`; select only heuristics matching observed evidence
   - Read `references/sources.md` when attribution or intellectual basis matters
   - For host-boundary requests, inspect composition root, external input, adapter semantics, shipped artifact, and cumulative state

2. **Review From Evidence** (lines 28-47)
   - For each finding, keep distinct: Observation (concrete repository fact with path/symbol/test/command), Heuristic (named rule with applicability), Trade-off (counter-pressure), Proposed repository-owned enforcement (ownership, authority, mechanism, removal condition), Verification (focused check)
   - Rank by user impact and change risk
   - Prefer one concrete example over several abstract claims

3. **Advise Before Enforcing** (lines 49-62)
   - Do not rewrite application architecture merely because heuristic suggests different shape
   - Do not introduce interfaces, layers, tests, linters, size limits, coverage targets, or dependency rules without repository-owned authority
   - Propose smallest reversible experiment when evidence is incomplete
   - Preserve deliberate duplication, coupling, or framework dependency when local benefit outweighs heuristic
   - Say when no heuristic materially improves observed code

4. **Response Shape** (lines 64-78)
   - Start with outcome in one sentence
   - Report only material findings with exact structure: Finding, Observation, Heuristic, Trade-off, Proposed repository-owned enforcement, Verification
   - End with unresolved risks or "None"

### Supporting Reference Files

**`.agents/skills/engineering-wisdom/references/heuristics.md`**  
(Lines 1-242) Contains eight sections of candidate heuristics:
- **Code Clarity** (lines 7-29): reveal intent, remove duplication after shared concept stabilizes
- **SOLID and Design** (lines 31-64): group by reason to change, put abstractions at volatile boundaries, prefer substitutable contracts, pass external values as data
- **Testing** (lines 66-103): test observable behavior at narrowest boundary, keep doubles at owned seams, exercise composition roots, make automation failure honest
- **Boundary Data and Adapter Semantics** (lines 118-171): decode/validate at input boundaries, pass external values as data, preserve semantics across adapters, bound cumulative state
- **Refactoring** (lines 173-193): separate behavior-preserving from feature change, add characterization before changing legacy
- **Architecture** (lines 195-217): point dependencies toward stable policy, introduce boundaries where change cost justifies them
- **Professional Practice** (lines 219-241): make uncertainty and commitments explicit, protect definition of done

Each heuristic includes: helps-when statement, can-hurt statement, concrete example, verification approach (lines 8-20 pattern).

**`.agents/skills/engineering-wisdom/references/sources.md`**  
(Lines 1-20) Bibliography: paraphrases recurring ideas from Robert C. Martin's work (Agile Software Development 2002, Clean Code 2008, The Clean Coder 2011, Clean Architecture 2017, Clean Agile 2019). States sources are inspiration, not repository authority.

### Notable Technique

**Evidence-first review structure:** Skill separates Observation (concrete fact), Heuristic (rule of thumb with conditions), Trade-off (counter-pressure), and Proposed enforcement (owner/authority/mechanism/removal) into distinct fields. This prevents promoting observations as universal rules or treating heuristics as fixed policy without repository authority (lines 30-46).

---

## Skill 2: onboard-repository

**File:** `.agents/skills/onboard-repository/SKILL.md`  
**One-line purpose:** Inspect an unfamiliar or brownfield repository, trace one real operational path, and propose evidence-backed improvements that help future agents work independently.

### When It's Used

- Explicitly requested by user: `$onboard-repository` or user explicitly asks to "onboard, map, assess, or backfill agent-facing repository guidance"
- First pass is always read-only inspection and proposal only, even on writable worktrees
- Later pass applies approved items only after exact user approval
- Never invokes without explicit request

### Workflow Steps (from SKILL.md lines 12-476)

#### First Pass: Inspect and Propose (lines 57-407)

**1. Establish the Boundary** (lines 59-74)
- Read applicable instructions and smallest repository map
- Record pre-existing changes before inspection
- If `.harness-core/manifest.json` exists and active managed file conflicts with base, treat installed file as active; show conflict; propose replacing only managed-marker content
- A checksum-verified conflict in active mandatory instruction is first proposal priority

**2. Find Repository Authority** (lines 76-129)
- Inspect only material to understand requested path: root overview, developer docs, product/architecture sources, package/build manifests, CI workflows, deployment/runtime config, focused tests
- For every claim, cite exact path and classify: **Authoritative** (instruction/decision/contract/documentation), **Observed** (code/config/tests show behavior), **Derived** (direct consequence of implementation/config), **Decision required** (proposed policy without existing authority), **Unknown** (repository cannot establish)
- Never silently promote Observed/Derived/Decision required/Unknown to Authoritative
- Treat operational authority as context-specific; do not transplant CI command into local procedure without local owning document authority
- Verify every clause independently; distinguish required from optional fields, same-key merge precedence vs fallback, checked-in values making later fallbacks unreachable
- Name each identifier separately with its own source as fixed/defaulted/configurable

**3. Trace One Complete Operational Path** (lines 131-200)
- Prefer one already-documented local happy path over broad architecture summary
- Trace through: prerequisites → start → readiness → deterministic setup → real interface exercise → evidence/correlation boundary → stop and cleanup
- Use exact operational-path table schema with columns: Stage/branch, Command/interface and expected result, Classification and source, Write at this stage, Process/container owner, Host/container ports, Evidence/log boundary, Cleanup, Unknowns
- Every cell must have value or Unknown; omitted cells fail the gate
- Trace lifecycle flags as separate rows: default startup, each no-start mode, cleanup after success, failure after startup
- Verify whether cleanup is unconditional, after assertions, or in finally/trap
- "No teardown command invoked" does not prove resources remain running
- Add resource-and-identifier ledger before path table with columns: Item, Kind (fixed/defaulted/configurable/generated/logical/observed), Exact behavior, Classification/source
- One row per identifier; do not combine two identifiers even if classification identical
- Source entire causal chain for each effect

**4. Propose Smallest Useful Backfill** (lines 202-299)
- Return proposal (do not write it)
- Each item must include six fields: concrete agent failure prevented, evidence and exact source paths, exact destination file/section, factual content to add/correct, what remains unknown, how fresh agent replay proves improvement
- Show all six for every proposal, including "Unknowns: none" when applicable
- Do not infer completion from prose in another section
- Prepare exact patch preview; classify and cite every proposed sentence, not proposal number
- Never handwrite unified-diff headers, line ranges, context, or patch hashes
- Construct complete proposed destination in memory, pipe complete bytes to `render_patch.py`:
  ```
  <command-printing-complete-after-image> | \
    python3 .agents/skills/onboard-repository/scripts/render_patch.py \
      --repository <tested-root> \
      --revision <full-tested-revision> \
      --destination <repository-relative-path> \
      --hunk-id H1
  ```
- Give every hunk stable H1, H2, ... identifier
- Emitter wraps as:
  ```
  <!-- ONBOARDING_PATCH:H1:BEGIN -->
  ```diff
  <one complete diff hunk>
  ```
  <!-- ONBOARDING_PATCH:H1:END -->
  ```
- Hunk digest is SHA-256 over exact UTF-8 bytes inside diff fence plus final newline, excluding fence lines
- Do not reuse identifier or place two hunks in one marker pair
- For control-flow, cite every branch needed: flag parsing, startup, checks, failure handling, teardown
- Treat temporal words as causal claims; locate exact success/failure signal
- Do not promote sentinel/partial probe into aggregate claim; enumerate membership boundary and evidence for every member
- Phrase negative lifecycle evidence narrowly
- Before displaying command as new runbook, require authority from same operational context
- Order proposals by leverage: correct false/stale/conflicting active instruction; link to existing guidance; add narrowly missing mechanics; request new decision only when task requires
- Use existing file owning procedure; do not add current runbook to generic/historical/future document
- Never put Unknown sentence in patch preview; keep in gap report
- When no maintained operational guide exists, use `docs/templates/application-runbook.md` to structure proposal; omit unsupported instructions, retain as unknowns

**5. Emit Machine-Authenticated Evidence Bundle** (lines 309-389)
- Read `references/evidence-capsule-v2.md` completely before constructing
- Do not manually copy hashes; build compact JSON spec in memory, pipe to `emit_evidence_bundle.py`:
  ```
  <command-printing-JSON-spec> | \
    python3 .agents/skills/onboard-repository/scripts/emit_evidence_bundle.py \
      --repository <tested-root> \
      --revision <full-tested-revision> \
      --branch <tested-branch>
  ```
- Run emitter as final tool call with output budget large enough for complete result
- Do not rerun unless it fails
- Do not reproduce patch/capsule bytes in assistant message; raw tool result is auditable artifact
- Use schema `onboarding-evidence-capsule/v2`
- Capsule contains exactly: tested_repository, producer_skill, boundary, claims, hunks, limitations
- For each source: repository-relative path, inclusive start/end lines, role; set revision only when differs from tested
- Emitter adds pinned revision and SHA-256
- Make each capsule claim one subject-condition-effect fact; split sentinel, branch, path, file read, subprocess, failure, cleanup into separate claims
- For boundary row: Pass requires equal non-null initial/final; Fail requires different hashes; Unknown when missing/incomplete
- Reflect Unknowns from prose gate, not silent upgrade
- When audit skill installed, validator is:
  ```
  python3 .agents/skills/audit-onboarding-proposal/scripts/validate_evidence_capsule.py \
    --transcript <raw-session.jsonl> \
    --expected-transcript-sha256 <sha256> \
    --repository <tested-worktree>
  ```
- Validator read-only, runs only after transcript exists

**6. Report the Gate** (lines 391-435)
- End first pass with: pinned revision and initial dirty state, operational-path table with classifications, ranked proposals, exact machine-emitted patch preview with classification/source for each clause, verified managed-marker replacement when active guidance stale, one machine-emitted v2 bundle with marked patches and computed hashes, blockers and unsupported claims avoided, final Git status/diff comparison, pre/post ignored-state and runtime comparison
- Gate passes only when: repository authority read, complete path table with every field, every patch sentence evidence-reviewed, run stopped at suggestions, all required no-mutation comparisons proven
- Compute no-mutation conjunctively; any required Unknown makes gate fail
- Do not convert "no mutating command observed" into "external state unchanged"
- Perform contradiction scan: each resource has one ledger row; every checked-in default present; optional log fields separated; process-wide not instance-local; every write in stage where occurs; absence of cleanup not promoted to liveness; every Unknown reflected; intermediate mistakes not in final map

#### Later Pass: Apply Approved Items (lines 437-458)

1. Re-read instructions, capture current Git state
2. Recheck target-file hashes, recompute if changed
3. For normative claims, require existing authority or explicit user decision; for mechanics, require observed evidence
4. For verified managed-file drift, replace only approved managed-marker content
5. Edit only approved agent-facing docs/knowledge files
6. Match existing structure/terminology; keep patch small
7. Run relevant documentation checks and repository-prescribed validation
8. Inspect complete diff for invented policy or unrelated changes
9. Rerun inspection logic; must not propose duplicate
10. Produce documentation-only replay patch applicable to baseline without this skill
11. Report changed files, validation evidence, remaining gaps, frozen prompt for fresh replay

### Scripts Used

**`.agents/skills/onboard-repository/scripts/emit_evidence_bundle.py`**  
(Lines 1-391) Emits one authenticated evidence bundle without materializing draft.
- Reads JSON spec from stdin (boundary, claims, hunks, limitations)
- Validates spec: all required keys, valid IDs, classifications, roles, path rules, boundary kinds/results
- Reads each pinned blob via Git to compute SHA-256 hashes
- For each hunk, calls render_patch to generate unified diff
- Assembles capsule JSON with computed digests
- Outputs one HTML-wrapped bundle with inner sha256 digest verification
- Schema: `onboarding-evidence-capsule/v2`
- Includes self-test mode (`--self-test`)

**`.agents/skills/onboard-repository/scripts/render_patch.py`**  
(Lines 1-138) Renders one authenticated read-only patch from complete destination image.
- Reads before bytes via `git show <revision>:<destination>`
- Accepts after bytes from stdin
- Generates unified diff with exact file headers and hunk counts
- Outputs JSON metadata: destination, before/after SHA-256, patch SHA-256
- Outputs marked patch in fenced code block
- Validates after image is UTF-8, ends with LF, differs from before
- Includes self-test mode (`--self-test`)

### Supporting Reference Files

**`.agents/skills/onboard-repository/references/evidence-capsule-v1.md`**  
(Lines 1-145) Legacy capsule schema (v1):
- Patch markers with hunk ID
- Capsule shape: schema, tested_repository, producer_skill, boundary, claims, hunks, limitations
- Closed vocabularies for classification (Authoritative/Observed/Derived), role, boundary kind (git/ignored_or_managed/runtime/temporary_paths), result (Pass/Fail/Unknown)
- Hash definitions for source, boundary, patch, observation digests
- Referential rules: every hunk has claims, every claim one hunk, every claim pinned source, hunk IDs match markers

**`.agents/skills/onboard-repository/references/evidence-capsule-v2.md`**  
(Lines 1-242) Current capsule schema (v2):
- Replaces prose hunk boundaries with complete destination file before/after hashes
- Repository-aware validator verifies every pinned source range and producer-skill blob
- Patch markers unchanged
- Machine bundle route: pass JSON spec to `emit_evidence_bundle.py` (omits hashes, supplies boundary/claims/hunks/limitations)
- Emitter computes capsule and patch blocks, wraps in v2 bundle markers
- Capsule shape same as v1 plus destination_before_sha256, destination_after_sha256 (no boundary field)
- Hash definitions: source (LF-terminated bytes from git show), producer-skill (complete blob), destination-before (complete pinned file), destination-after (result of in-memory patch), patch (bytes inside diff fence plus final LF), boundary-observation (normalized stable output)
- Referential rules plus: every causal claim includes complete command-to-effect chain; paths relative, no `..`

### Notable Techniques

1. **Non-materializing pipelines** (lines 32-40, 222-241): Skill avoids creating temporary files. Uses quoted python3/node programs, stdin pipes, or read-only commands to compare and construct data in memory, then pipes directly to renderer/emitter. Prevents stale or leaked temp artifacts.

2. **Deterministic patch rendering** (lines 222-241, `render_patch.py` lines 40-62): Constructs complete after-image in memory, reads pinned before from Git, generates unified diff with exact SHA-256. Never hand-writes diff ranges or hashes. Paired with emitter for authenticated bundle.

3. **Evidence capsule v2 verification** (lines 309-389, `emit_evidence_bundle.py`): Capsule contains destination before/after hashes computed from actual git blobs and in-memory patch application. Validator (`validate_evidence_capsule.py`) verifies: capsule structure, source-range hashes, producer-skill hash, patch hashes, exact patch applicability, whole-destination before/after hashes. Prevents transcription errors and incomplete preimage.

4. **Authority classification table** (lines 76-129): Every claim classified Authoritative/Observed/Derived/Decision required/Unknown separately. Never silently promotes observations to authority. Allows audit to distinguish what is rule, what is current behavior, what requires user choice.

5. **Six-field proposal structure** (lines 202-299): Every proposal requires concrete failure prevented, evidence with paths, destination, factual content, unknowns, replay proof. Rejects partial or abstract proposals.

---

## Skill 3: improve-harness

**File:** `.agents/skills/improve-harness/SKILL.md`  
**One-line purpose:** Run one explicitly authorized, evidence-backed improvement to a repository's agent guidance, tools, runbooks, or validation.

### When It's Used

- Triggered by explicit user invocation: `$improve-harness` or explicit user request to "improve the Harness after observed reusable agent friction"
- **Not** used for ordinary product changes, speculative cleanup, one unexplained agent mistake, or automatic post-task reflection
- Requires explicit authorization; does not authorize application-code changes, invented product policy, hooks, databases, or background automation unless separately requested

### Workflow Steps (from SKILL.md lines 12-112)

**1. Establish Authority** (lines 12-21)
- Read `AGENTS.md`, `docs/WORKFLOW.md`, applicable local instructions
- Confirm request authorizes Harness behavior change
- Inspection or friction report alone does not authorize edits
- Record initial repo root, revision, branch, status, unrelated changes; preserve existing work
- Treat invocation as authority for bounded experiment only, not for product policy/proof weakening/credentials/external mutation

**2. Preserve The Baseline** (lines 23-40)
- Use observed task trajectory when available
- Record: representative job, accepted outcome, concrete failure, evidence, human steering/relay/recovery, worker/revision/external state/tools/authority, existing proof and limitations
- Do not diagnose limitation from one run; if no observed baseline, stop with experiment proposal
- Copy `docs/templates/harness-improvement.md` to `docs/plans/active/harness-improvement-<slug>.md`
- Reuse existing active record for same experiment

**3. Locate The Earliest Gap** (lines 42-57)
- Trace failure upstream to first owner that could prevent or expose it
- Categories: **Context** (knowledge absent/stale/overloaded), **Capability** (discovery/invocation/interpretation/repair/verification failed), **Domain ownership** (no canonical type/API/state machine), **Authority** (permission/approval/audit/recovery unclear), **Proof** (checks proxy rather than outcome), **Environment** (external prerequisite unavailable)
- Assign to repository-harness, consumer, external environment, or human decision
- Do not copy consumer commands/policy into generic template

**4. State and Apply One Intervention** (lines 59-73)
- Before editing, write: "If <smallest change> is added at <owner>, then fresh agent will <observable change> on <representative job>, because <mechanism>. Evidence that would weaken this: Maintenance owner and removal condition:"
- Make only authorized intervention
- Prefer existing owner, clearer route, actionable diagnostic, runbook fact, type/API, or claim-matched proof
- Run repository-native checks protecting changed boundary

**5. Require Fresh Rerun** (lines 75-84)
- Use fresh agent session, equivalent starting state
- Hold worker, task class, authority, tools, relevant external conditions materially steady
- Record separately whether intervention available, retrieved/invoked, relevant
- If fresh rerun not authorized/available, leave record active with "Decision: pending fresh rerun"

**6. Keep, Revise, or Remove** (lines 86-100)
- Compare accepted outcome, claim-matched proof, human intervention, retries, authority behavior, maintenance cost
- **Keep** when rerun exercised intervention and improved bounded job enough to justify cost
- **Revise** when owner correct but route/interface remains hard
- **Remove** when adds noise, duplicates better owner, or does not improve job
- Record decision, evidence, owner, removal condition
- Move to `docs/plans/completed/` only after native validation and fresh-rerun decision
- Preserve removed intervention's result in completed record

### Report Structure (lines 102-112)

Return: representative job/baseline, earliest gap/owner, intervention/changed files, native validation, fresh-rerun status/comparison, keep/revise/remove/pending, remaining authority/risk/follow-up

### Notable Technique

**Evidence-driven improvement loop with fresh-rerun gate** (lines 42-100): Skill requires: (1) observed baseline with concrete failure, (2) earliest gap diagnosis (not symptoms), (3) one intervention statement before edit, (4) repository native checks, (5) independent fresh-rerun with steady conditions, (6) comparison before claiming improvement. Prevents speculative cleanup or turning one mistake into permanent process. Removes bad interventions after fresh rerun proves them ineffective.

---

## Skill 4: audit-onboarding-proposal

**File:** `.agents/skills/audit-onboarding-proposal/SKILL.md`  
**One-line purpose:** Independently audit a brownfield onboarding transcript, operational map, or exact proposed documentation patch before application.

### When It's Used

- Triggered when fresh reviewer must verify `$onboard-repository` first pass
- Used to distinguish environment-caused Unknowns from reasoning defects
- Used to score safety and evidence gates before application
- Used to run narrow patch-admissibility decision for specific capsule-backed hunks
- Read-only; does not edit files, install tools, start services, create state, or trust producer's self-score

### Three Audit Modes

#### Mode 1: Patch-Admissibility (lines 50-80)

Used when request is only whether exact hunks from valid `onboarding-evidence-capsule/v2` are safe to present for approval.

For each requested hunk:
1. Retrieve and hash every cited source range at pinned revision
2. Split changed wording into atomic clauses, verify every clause
3. Reconstruct complete destination boundary and exact before/after text
4. Trace every causal claim through required implementation depth
5. Run complete Patch Verification Worksheet and counterexample pass
6. Return `PATCH_APPLY` only if every required check passes

Do not reconstruct complete resource ledger, operational path, producer no-mutation, or five-gate score unless directly necessary. State "Producer gates: not recomputed; patch-admissibility audit only". Missing capsule, invalid capsule, missing hunk ID, source mismatch, incomplete source chain, omitted worksheet, or unresolved counterexample forces `PATCH_NO_APPLY`.

End with `PATCH_APPLY` or `PATCH_NO_APPLY` per hunk, then `PATCH_ADMISSIBILITY_COMPLETE`. Do not emit full-audit `AUDIT_COMPLETE` marker.

#### Mode 2: Corrected-Reissue (lines 82-100)

Used when authenticated producer transcript contains evidence for previously displayed hunk and producer has issued exact corrected replacement.

Authenticate original transcript, reconstruct evidence only for reissued hunk. Do not rescore unrelated maps/proposals/hunks. State "Producer gates: not recomputed; corrected-reissue audit only". Run complete Patch Verification Worksheet and counterexample for reissued hunk. Compare destination boundary and exact changed text against tested repository and every claimed canonical source. Verify all changed clauses independently even if correction described as verbatim.

End with `REISSUE_APPLY` or `REISSUE_NO_APPLY`, then `AUDIT_COMPLETE`.

#### Mode 3: Full Onboarding-Quality Audit (lines 133-316)

Use complete workflow only for full onboarding audit.

### Full Audit Workflow (lines 133-316)

**1. Authenticate and Reconstruct** (lines 139-151)
- Verify transcript hash
- Extract in order: user prompt/injected instructions, model/reasoning effort, tool calls/results, initial boundary observations, intermediate corrections, final resource ledger/path table/proposals/patches/self-score
- Score final answer using intermediate tool evidence
- Do not credit claim merely because producer stated it

**2. Verify Safety Boundary** (lines 153-174)
- Compare initial/final evidence separately for: Git revision/branch/tracked/staged/untracked, every relevant ignore pattern/managed state, content-sensitive hashes for ignored/managed paths, runtime projects/processes/services/ports/volumes, task-owned temporary paths, repository-local binaries/Harness state
- Read every root/nested ignore file applicable to inspected paths
- Expand patterns into independent checklist
- Compare producer's initial capture
- Path first checked later cannot receive pre/post pass
- Producer summary "ignored state passed" not evidence every pattern baselined
- Use Pass/Fail/Unknown per component
- Compute no-mutation conjunctively; every required component must pass; one Unknown fails gate

**3. Audit Resource and Identifier Ledger** (lines 176-194)
- Build independent inventory from request bodies, environment merges, configuration, Compose manifests, schemas, serializers, logging code
- Compare with producer ledger
- Require one row per: fixed/defaulted/configurable/generated identifier, checked-in default and its fallback reachability, logical project/service/image/volume/state path/observed runtime name, host/container port, terminal/process-wide/container/request-correlatable/instance-correlatable evidence boundary, required vs optional structured-log field
- Reject combined identifiers, logical names as runtime, optional as universal, process-wide as request/instance

**4. Audit Operational Path** (lines 196-214)
- Reconstruct actual control-flow order, not generic conceptual
- Verify prerequisites, startup, setup/migration, readiness, every interface exercise, evidence, completion, no-start modes, requested teardown, every failure-path relevant to cleanup
- For every row: command/result, classification/source, write at stage, owner, host/container ports, evidence/correlation, cleanup, unknowns
- Verify full causal chains for persistence, provider calls, logging, runtime effects
- Distinguish: direct (**Observed**), tool consequences (**Derived**), durable (**Authoritative**), unsupported choices (**Decision required**), irretrievable (**Unknown**)

**5. Audit Every Proposal and Patch Sentence** (lines 216-279)

Require all six proposal fields: prevented failure, evidence, destination, factual content, unknowns, replay proof.

**Patch Verification Worksheet** (before deciding any hunk):
| Hunk | Destination/boundary | Structural comparison | Atomic changed clauses | Complete source chain | Conditions preserved | Preliminary disposition |
| --- | --- | --- | --- | --- | --- | --- |

Every cell mandatory. **Structural comparison** identifies every heading/marker/unchanged boundary line, reports byte-for-byte equality or first differing line. **Atomic changed clauses** splits conjunctions/multi-sentence into numbered claims. **Conditions preserved** names every source branch/guard/fallback/failure-order qualifier; none allowed only after explicit checking.

For each displayed hunk:
1. Reconstruct exact before/after text
2. Verify unchanged context, every heading/marker
3. Verify every added/changed clause independently
4. Verify cited sources cover complete causal claim
5. Reject conditional stated as unconditional
6. Reject temporal wording (before/after/successful/complete/finally) whose named signal occurs at different control-flow point
7. Reject absence of teardown stated as runtime liveness
8. Reject CI/container command promoted to local guidance
9. Reject sentinel/partial probe promoted to aggregate schema/config/resource/readiness
10. Reject new cleanup or product obligation lacking authority

For managed-marker replacement: compare full displayed replacement byte-for-byte with checksum-verified base content. Missing heading/line makes hunk `NO APPLY`.

**Counterexample Pass** (after preliminary worksheet):
Try to disprove each `APPLY`:
1. Missing/extra heading/marker/context line/boundary
2. Conjunction whose clauses have different evidence
3. Conditional/fallback/failure order stated unconditionally
4. Absence of cleanup promoted to liveness/obligation
5. Optional field/configurable/runtime name stated universal
6. Source proves entrypoint but not downstream causal effect
7. before/after/successful/complete/finally not matching exact control-flow signal
8. Sentinel/partial probe stated as aggregate completeness

Record "Counterexample found: none" or exact counterexample per hunk. Omitted worksheet cell, omitted counterexample, incomplete extraction, or unverified clause forces `NO APPLY`; do not use reviewer confidence to fill gap.

Return `APPLY`, `NO APPLY`, or `SPLIT_AND_REISSUE` per hunk. Never approve entire bundle because most sentences correct.

### Score (Full Audit Mode Only, lines 281-296)

Return exact five-gate vector:
1. Repository authority read
2. Complete resource ledger and operational path
3. Every map, proposal, citation, patch clause evidence-backed
4. Stopped at suggestions
5. Conjunctive no-mutation equivalence

Then separately return `Output correctness: Pass|Fail`. Output correctness may pass with gate 5 failed only when producer accurately reported environment-caused **Unknown** and did not overclaim.

### Report (Full Audit Mode Only, lines 298-321)

Return: verified transcript/digest, evidence-capsule validation result/digest (when tested producer requires), five-gate vector/score, output-correctness verdict, exact defects with cause/effect, component no-mutation vector, completed Patch Verification Worksheet with counterexample per hunk, hunk-level dispositions, corrected wording only for narrow reissue, remaining decision-required items. End with explicit `AUDIT_COMPLETE` marker. Do not apply or commit patch.

Audit structurally incomplete unless every proposed hunk appears in both worksheet and counterexample pass. When incomplete, set `Output correctness: Fail` and return `NO APPLY` for every unverified hunk.

### Script Used

**`.agents/skills/audit-onboarding-proposal/scripts/validate_evidence_capsule.py`**  
(Lines 1-680) Extract and structurally validate evidence capsule.
- Read-only, uses only Python standard library
- Authenticates Codex JSONL transcript when requested
- Extracts last completed assistant message
- Validates capsule schema (v1 or v2)
- For v2: verifies pinned Git blobs, applies each marked patch in-memory to check whole-destination before/after digests
- Handles machine bundles: extracts and verifies inner SHA-256
- Validates boundary results, claim references, hunk references
- Applies unified-diff logic: parses `@@` ranges, verifies preimage match, accumulates output line-by-line
- Detects multi-file patches, no-newline markers, malformed hunks
- Verifies exact patch applicability, destination before/after hashes
- Includes self-test mode (`--self-test`)
- Outputs JSON result with schema, tested revision, counts, patch SHA by hunk ID, validity flag
- Reports error as JSON with error message if validation fails

### Notable Techniques

1. **Evidence-capsule v2 verification** (lines 244-476): Reconstructs complete resource/identifier ledger from request bodies, environment merges, configuration, schemas. Compares with producer ledger independently. Does not accept producer's self-score.

2. **Patch Verification Worksheet** (lines 221-279): Audit constructs table per hunk with mandatory cells: destination/boundary, structural comparison (byte-for-byte or first diff line), atomic changed clauses (split conjunctions), complete source chain, conditions preserved. Rejects incomplete cells and uses worksheet to drive counterexample pass. Prevents orphaned changes and "trusting" incomplete chains.

3. **Counterexample pass** (lines 280-316): After worksheet, proactively searches for eight categories of defects (missing boundaries, conjunction mismatches, temporal ordering bugs, dead teardown, optional-as-universal, entrypoint-only claims, missing control-flow signals, aggregate-from-partial). Forces `NO APPLY` for any unresolved item. Audit is fail-closed.

4. **In-memory patch application and hashing** (lines 171-241): Validator applies each marked patch in-memory without materializing files, computes destination before/after SHA-256 from actual git blobs, verifies patch preimage matches exactly, detects overlapping/out-of-order hunks. Proves exact patch applicability before approval.

---

## Supporting Documentation Files

### Plans

**`.agents/skills/engineering-wisdom/docs/plans/completed/engineering-wisdom.md`**  
(Lines 1-110) Execution plan for optional engineering-wisdom pack (completed 2026-07-25).
- **Status:** Completed
- **Outcome:** Consumer can explicitly install/invoke `engineering-wisdom` skill; normal installation remains philosophy-neutral and excludes pack
- **Scope:** One explicit-only skill covering clarity/design/testing/refactoring/architecture/practice; one separate optional manifest; Bash/PowerShell parity; default-exclusion and explicit-inclusion proof
- **Approach:** Add skill with compact workflow and reference catalog; add optional manifest consumed by `--with-engineering-wisdom` flag; add focused installer proof; validate and move to completed
- **Validation:** `tests/installer/test-engineering-wisdom-opt-in.sh` passed; default exclusion, opt-in inclusion, explicit metadata, non-removal on later normal install proven
- **Result:** Optional skill covers heuristics with applicability/counter-pressure/example/verification; default core unchanged; Bash and PowerShell consume separate optional manifest only after selection; no unresolved risk remains

**`.agents/skills/onboard-repository/docs/plans/completed/harness-improvement-engineering-boundary-wisdom.md`**  
(Lines 1-134) Harness improvement for engineering-boundary wisdom (completed 2026-07-26).
- **Status:** Completed, Decision: Keep
- **Representative Job:** Strengthen optional explicit-only `engineering-wisdom` skill using accepted audit of `unclebob/missile-command` at f16f8ab
- **Baseline:** Strong pure core, thin JVM/browser hosts, but boundary behavior escaped proof: duplicate composition-root invocation, fixed-frame vs wall-clock time, partial resize, unsafe persisted input parsing, false-green QA automation, unbounded sound events, path in shell
- **Earliest Gap:** Catalog says test at narrowest boundary, but did not make composition roots/adapter semantics/shipped artifacts/defensive decoding/bounded cumulative state concrete enough
- **Intervention:** Add concise boundary-review prompts to SKILL.md and cause-and-effect boundary heuristics to references/heuristics.md
- **Evidence Weakening:** Skill not invoked/retrieved; examples treated as universal; boundary risks missed; checks do not exercise delivered behavior
- **Fresh Rerun:** Independent tracked Herdr review (`repository-harness/review-engineering-wisdom`) exercised updated guidance, independently found six material risks, separated observation/heuristic/trade-off/enforcement/verification, kept product choices with consumer
- **Decision:** Keep. Fresh rerun improved review from shared-core/source evidence to claim-matched host-boundary proof without promoting advice into policy. Skills now prompt agents to inspect composition roots, boundary data, adapter semantics, shipped artifacts, honest automation, bounded cumulative state.

### Decisions

**`.agents/skills/onboard-repository/docs/decisions/0026-explicit-onboarding-skills-in-default-core.md`**  
(Lines 1-101) Decision 0026: Explicit Onboarding Skills In Default Core (accepted, active, 2026-07-23).

**Context:**
- Decisions 0020, 0023 kept default small, excluded generic evaluation machinery
- Pilot testing on brownfield `e-inna-brain` produced two forward-tested skills
- Pilot showed direct improvement: stale installed instruction removal removed one obsolete attempt
- Kept skills only in experiment makes workflow unavailable to next install
- Auto-running would add hidden startup work and propose changes without explicit request

**Decision:**
1. Default Harness core installs both skills under `.agents/skills/`
2. Both remain explicit-only (`allow_implicit_invocation: false`); installation does not invoke; no first-run hook
3. `$onboard-repository` is user-facing entry point; first pass inspection/proposal only; edits require exact approval
4. `$audit-onboarding-proposal` is independent verification companion; read-only; does not grant approval alone
5. Scripts and references are managed core files (deterministic patch rendering, evidence transport, validation); do not become mandatory for ordinary work
6. Skills may use Python when explicitly invoked; core does not require Python; missing runtime must stop skill safely
7. Narrowly amends 0020, 0023; installer still has exactly two profiles; default core excludes benchmarks/trace/orchestrators/adapters/databases/compatibility control plane

**Alternatives Considered:**
1. Keep skills in pilot only — rejected; validated behavior would not reach new installs
2. Auto-run onboarding — rejected; installation cannot determine readiness/desired path/agent ownership
3. Add third profile — rejected; skills are generic, profile would recreate rejected feature matrix
4. Install only producer — rejected; pilot repeatedly found plausible but unsupported clauses requiring independent audit
5. Remove scripts before promotion — rejected; scripts fixed transcription/incomplete-preimage failures

**Consequences:**
- Positive: fresh install exposes tested brownfield path; first pass safe/approval-gated; updates through provenance merge; compact context for ordinary tasks
- Tradeoffs: payload grows by two skills and seven resources; Python needed for rendering/validation; managed skill edits can produce conflicts; evidence protocol more complex, isolated until invoked

**Follow-Up:**
- Keep both skills valid under `quick_validate.py`
- Exercise fresh and merge install on Bash and PowerShell
- Treat simplification as measured skill revision, not untested rewrite during packaging

---

## Summary

Four new skills now bundled in repository-harness upstream:

| Skill | Purpose | When Used | Key Scripts | Notable Technique |
|-------|---------|-----------|-------------|-------------------|
| engineering-wisdom | Repository-grounded engineering review with contextual heuristics | Explicit user invocation | None | Evidence-first structure (Observation/Heuristic/Trade-off/Enforcement/Verification separate) |
| onboard-repository | Inspect unfamiliar repository, propose evidence-backed improvements | Explicit user request | emit_evidence_bundle.py, render_patch.py | Non-materializing pipelines; deterministic patch rendering with SHA-256; v2 evidence capsule |
| improve-harness | Run authorized bounded improvement to agent guidance/runbooks/validation | Explicit `$improve-harness` or after observed friction | None | Evidence-driven loop with fresh-rerun gate before claiming improvement |
| audit-onboarding-proposal | Independently audit onboarding transcript/patch before application | Fresh reviewer verification | validate_evidence_capsule.py | Patch Verification Worksheet with counterexample pass; in-memory patch application and hashing |

All skills are **explicit-only** (`allow_implicit_invocation: false`). First passes are **read-only**. Evidence and authority remain distinct from policy. Bundles include supporting references, deterministic renderers, and read-only validators. Two completed plans and one active decision document the design, validation, and fresh-rerun evidence for engineering-wisdom and onboarding workflows.

---

## Scope Coverage

**Files read:**
- .agents/skills/engineering-wisdom/SKILL.md ✓
- .agents/skills/engineering-wisdom/references/heuristics.md ✓
- .agents/skills/engineering-wisdom/references/sources.md ✓
- .agents/skills/onboard-repository/SKILL.md ✓
- .agents/skills/onboard-repository/references/evidence-capsule-v1.md ✓
- .agents/skills/onboard-repository/references/evidence-capsule-v2.md ✓
- .agents/skills/onboard-repository/scripts/emit_evidence_bundle.py ✓
- .agents/skills/onboard-repository/scripts/render_patch.py ✓
- .agents/skills/improve-harness/SKILL.md ✓
- .agents/skills/audit-onboarding-proposal/SKILL.md ✓
- .agents/skills/audit-onboarding-proposal/scripts/validate_evidence_capsule.py ✓
- docs/plans/completed/engineering-wisdom.md ✓
- docs/plans/completed/harness-improvement-engineering-boundary-wisdom.md ✓
- docs/decisions/0026-explicit-onboarding-skills-in-default-core.md ✓

---

Status: DONE  
Summary: Inventoried four new repository-harness agent skills (engineering-wisdom, onboard-repository, improve-harness, audit-onboarding-proposal) with purpose, triggers, workflow steps, scripts, notable techniques, and supporting documentation. Pure mechanical facts covering all listed files.
