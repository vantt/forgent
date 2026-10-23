# Phase 9 PRE-FLIP gates — execution plan

Authority: [L12-137](../phase-08/owner-answers.md#l12-137--owner-authorizes-phase-9-pre-flip-gate-work-only-owner-decision) (owner, 2026-10-23 ~18:15). Gate register: [step-08-preflip-gates.json](../phase-08/step-08-preflip-gates.json) (`gates[0..11]`, ids below as G0–G11 in register order). Phase contract: [phase-09](../../phase-09-atomic-platform-authority-cutover.md). Plan prefix `P` = `plans/260925-documentation-authority-unification`.

## 1. Boundary and bookkeeping

- Allowed: plan-branch commits, Doer/reviewer turns, a LOCAL archive ref, asking SEAT to stage a release with `docs-lease`, asking the Git owner (board) for git spec §7 consent. Not allowed: main landing, real-repo lease hold, push, deletion on main. Cutover (lease + Land) is a separate owner approval.
- New Lead-only files: `P/reports/phase-09/owner-answers.md` (entries `L13-n`), `P/reports/phase-09/progress.md`, `P/reports/phase-09/preflip-gate-status.json` (`{gateId, status: unmet|partial|met-local|met, evidence[], commit, pin}`). Phase 8 records stay historical; the register is never edited, only joined by id.
- Every verdict is digest-bound: a later byte change to its target reopens that id only (delta review), never the batch.
- `.agents/`, `plugins/`, `.claude/skills` are renders: compose `core/` + regenerate in scratch, never hand-edit.

## 2. Gates: met, inputs, owner, work, size, proof

| G | Gate id | "Met" (machine-checkable) | Owner / work type | Size | Proof |
|---|---|---|---|---|---|
| 0 | changed-binding-independent-review | every id in `changedBindings` (191) plus every later rebind row has a verdict `{id, bindingSha256, targetUnitDigest, APPROVE}` whose two digests equal the ledger shard values at final pin F; 0 open REWORK | Lead / independent reviewers | 191 rows, 16 shard files, 16 targets | `python3 -B` join: shards@F × verdict file → 0 missing/mismatch |
| 1 | L12-96-uncomposed-duty | all 115 members of families 8/13/14/15/16/17/18 carry `{memberId, verbatim source sha, live holder anchor, candidate edit commit or composed spec id}`; families 8/13 successor scan replayed on post-move scratch with findings ⊇ current; GAP-05 `dynamic-023895` placed by Lead; per-member APPROVE | Doer records + candidate-doc turn (D1 carries, D2 scan/convention) + independent review | 44 claims, 48+16+8 scan/convention/holder members, ~40 files | join check members→specs/commits; scratch replay log; dead-vocabulary guard replay |
| 2 | non-behavioral-census-join | 1,126 site ids each joined to owning proof (`file:test-title`) or confirmed grade-record REJECT; plus every post-pin literal site found at F (e.g. `packages/yaml-doc/contracts/fixtures/parse.v1.json`) joined; APPROVE | Doer records (D4) + census reviewer | 1,126 sites / 140 files (805 fixture-literal, 314 graded) | join file covers all ids; re-enumeration at F diff = joined set |
| 3 | dropped-claims-register | `P/dropped-claims-register.json` 17 ids each `restored@{anchor,unitDigest}` / `deferred{owner,item}` / `retired{rationale}`; dropped-001 = restored (missing mechanism stated honestly; Plan C not a dependency); per-id APPROVE | Doer candidate-doc turn (D1) + review; Lead decides 002–017 under A42 | 17 ids, 2 areas | register status scan: 0 `dropped-needs-*` |
| 4 | git-one-door-census-widening | `node scripts/git-one-door-scan.mjs` on branch reports 0 undeclared sites; 57 typed-port fixes; `.githooks/pre-commit:507` only via owner-declared exemption registered in `packages/git/contracts/mutation-census.v1.json` | Doer code turn (D3) + code review; owner for exemption (§6 S1) | 58 sites / 14 files | `test/git/one-door.test.mjs`, `test/setup/checks.test.mjs` green; doctor check `git-mutation-one-door` line |
| 5 | retention-L11-23-L11-25 | each `retentionReceipts` span sha256 found at its file at F; reading-map entry-union record keeps L11-25 banner and both compounding→knowledge lines | Lead (mechanical) | 3 items, 3 files | hash script exit 0 at W0 and F |
| 6 | step3-step4-preserve-premise-review | 4,804 Step 3 + 609 Step 4 preserves each have a premise row from the L12-121 method (physical scratch move, operand + source digest join, negative probes); overturns become prepared patch or owned park; APPROVE of proof replay and every overturn/judgment row | Doer records (D4) + census reviewer | 5,413 rows / 163 record batches | proof run twice byte-identical; 3 negative probes reject |
| 7 | composition-independent-review | 423 composed specs each APPROVE + owning parity replay at bytes == `beforeSha256`; 101 parks each composed (92 generator/render actions, 9 ambiguous/absent hunks) or kept as an exact cutover-step action with replay command, APPROVE | independent reviewers; D2 composes parks | 524 specs (`step-07-patch-order.json`) | `patch --fuzz=0` forward/rollback byte equality AND whole-file sha check |
| 8 | L12-129-archive-ref-and-checkout | **met-local** now: archive manifest design `{path, blobId, sha256, size}`; LOCAL archive ref; rehearsal branch with tip records removed and every reader (47 historical files / 135 joins / 48 inputs, 6 owning restores, live readers re-enumerated at F) repointed or retired with owning proof named; candidate `git worktree add` median of 3 < 60 s (target ≤ 20 s). **met** needs origin publish + main manifest merge = cutover approval | Doer script/records (D5) + Lead measurement | 2.76 GB plan dir, 279+ inputs | timing log; reader rescan at F 0 unresolved |
| 9 | source-context-and-post-pin-recomposition | pin F recorded; 518 records + 10/9/125 overlaps + every spec whose file changed since `5e03159` (incl. branch edits, D1/D3 writes, main imports) re-judged at F; recomposed specs have `beforeSha256 == sha256(file@F)`; APPROVE | Doer records (D6 interim, D7 delta) + source reviewer | 518 + 144 + ≥8 specs | all-spec hash sweep at F: 0 drift |
| 10 | final-code-holder-land-rehearsal | on the G8 shrunk rehearsal clone, with G11 release: holder Land publishes (ref verified), non-holder refused (result code), rollback verified; code commit == F code | Lead / lease + Git landing owners (needs §7 consent) | 1 rehearsal | receipt JSON with release id, commits, exits |
| 11 | cutover-release-with-docs-lease | SEAT-staged release id R, `sourcePin` == F code commit; installed host `docs-lease acquire/status/release/abandon` routes proven in a disposable clone (activation local to the clone, never global config) | SEAT (external) + Lead proof | 1 release | four JSON outputs + release manifest provenance |

## 3. Dependencies and waves

```
W0 main import M1 + prep ──► W1 D1‖D2‖D3‖D4 + R1/R2 (G0, G7 unaffected) ──► W1 close: linearize + A1 accounting
   ──► W2 reviews of D1–D4, D5 archive design/rehearsal, D6 interim G9 ──► W3 main import M2 = pin F, D7 deltas, delta reviews
   ──► W4 SEAT release (G11) ──► G10 rehearsal + final G8 timing ──► status ledger, cutover approval packet
```

- **W0 (Lead + accounting Doer).** Main is 116 commits past last import `a0db9ca8e` (6 legacy/platform doc files changed). Merge main (M1) and run L12-130-style accounting: merge record, Step 0 extractor rebind of changed docs, incoming `docs/platform/**` union, census rerun, pair accounting. Lead prep: post board requests (Git §7 consent; SEAT heads-up, staging later); G5 hash check; init status ledger; build G0/G7 batch files; drift prefilter = hash all 423 composed spec files at M1, defer (to G9) every spec whose bytes changed OR whose path is in a W1 writable list (D1 dirs, D3 files); one clean detached review worktree at M1 for reviewers (never a Doer worktree).
- **W1.** Four Doers in separate linked worktrees (disjoint writes, §4). Reviewers in parallel: R1 = G0 b1–b5 + G7 c1; R2 = G7 c2–c7. G0 rows whose target lies in D1 dirs are reviewed now at M1 digest; D1's changed units return as delta rows.
- **W1 close (Lead).** Cherry-pick D3, D1, D2, D4 onto the plan branch in that order (linear first-parent; no side-branch merges, the checks-A recipe is `--first-parent --no-merges`). Single-file proofs on clean bytes. Then ONE accounting Unit A1 (L12-11) for every commit since `2e3d92ea0`; Lead accounts A1's own commit after.
- **W2 (parallel, reviewers ≤ 6).** Reviews: G1+G3 (D1 output, 2 batches), G7 parks + G1 scan specs (D2, 2), G4 code (D3, 1), G2 census (3 batches by file family), G6 (2: Step 3 / Step 4). D5: archive manifest, local ref, rehearsal clone in `/tmp/fgos-work/archive/`, reader repoint/retire patch set, timing; runs after W1 because W1 adds new record readers. D6: G9 interim recheck at the W1-close commit (bulk of 518+144). Then G9 review (2 batches).
- **W3 = final pin F, as late as possible.** Lead imports main (M2) with accounting, records F. D7 delta: all-spec hash sweep at F, recompose drifted, post-pin census literals (G2), reader re-enumeration (G8), rebind rows from D1. Delta reviews G0/G7/G9/G2. G5 recheck. Freeze: no further main import before cutover; any later import reopens W3 for its changed paths only.
- **W4.** Board request to SEAT: stage from the F code commit. Lead proves installed-host routes (G11), then G10 rehearsal on the shrunk clone with that release, then final G8 timing at F. Any relevant code change after F reruns G11+G10.

## 4. Wave 1 Doer briefs (Lead writes each as `P/reports/phase-09/w1-<name>-brief.md`)

Common rules for all four: read this plan §2 row(s), the named register sections and the cited owner answers completely. Never a git write, never the fgos CLI against this repo, never `.fgos/` or secrets, never `scripts/run-tests.mjs` or `npm test`. Python `python3 -B`; scratch `/tmp/fgos-work/<brief-name>/`. Single tests only: `env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=<releasePath>/bin/fgos node --test <file>` (`releasePath` from `/home/vantt/projects/forgentX/.fgos/installation/activation.json`); report what could not run. No pair accounting (A1 does it). No `owner-answers.md`/`progress.md` writes: each Doer writes `receipt.md` + `receipt.json` (commands, exits, counts, touched ids) in its own directory. Anything outside the writable list: stop, report `needsWrites`. Final message: first line a conventional commit subject (≤ 100 chars, no plan ids/phase/finding labels), then a short Vietnamese summary (anh/em).

**D1 — conserved claim carries and dropped claims (G1 families 14/15/16/18, G3).** Bind the 44 verbatim claims to live holders and carry them into candidate docs; restore dropped-001; restore/defer/retire 002–017 with rationale, flagging any genuine tie for the Lead. Pointer fixes in non-candidate files (AGENTS.md, `src/`, `bin/`, tests, `core/` skills, gateway Rust) are composed patch specs with `beforeSha256`/`expectedAfterSha256`, not applied. Every changed candidate unit gets its rebind row (L12-3). Writable: `docs/platform/packaging-distribution/**`, `docs/platform/host-invocation-routing/**`, `docs/platform/runner/**`, `docs/platform/work-state/**`, `docs/platform/herdr-web-dashboard/**`, `docs/platform/platform-foundations.md`, `P/dropped-claims-register.json`, `P/ledger/decisions/s11-preflip-carries.json` (new shard; existing shards only for rows whose unit D1 changes, each listed in the receipt), `P/reports/phase-09/carries/**`. Preserve D-ADR0035/0054/0062, RUL11/RUL104 and the 0032 heading layout; Identity §7a scope untouched.

**D2 — scan successors, convention/holder table and composition parks (G1 families 8/13/17, G7 parks).** Compose successor scan sets (family 8, 48 members, GAP-05 placement proposal for the Lead), per-area decision convention + citation-drift recursive `docs/platform/**/spec.md` scan (13), area-to-holder table for `fgos decision --scope` (17), and the 101 parked specs: render parks become core patch + scratch `build:skills` regeneration diff; 9 hunk parks recomposed at M1 bytes. Replay owning guards on a scratch post-move copy; coverage ⊇ current, no rebaseline. Writable: `P/reports/phase-09/composition/**` only (all outputs are records/specs).

**D3 — Git one-door (G4).** Migrate the 57 typed-port sites to existing typed Git ports (reuse; no new port), retiring a script only if its owning proof is already gone (name it). Leave `.githooks/pre-commit:507` for the owner exemption (§6 S1); prepare the exact census row text. Tests first; extend owning tests. Writable: `scripts/check-doc-inventory-gates.mjs`, `scripts/verify-phase-01.mjs`, `scripts/verify-phase-02.mjs`, `scripts/generate-doc-inventory.mjs`, `scripts/generate-shipped-path-inventory.mjs`, `scripts/propose-doc-decisions.mjs`, `scripts/check-doc-constitution.mjs`, `scripts/check-doc-retirement.mjs`, `scripts/check-evidence-relocation.mjs`, `scripts/doc-alias-resolver.mjs`, `bin/fgos.mjs`, `src/runner/merge.mjs`, `src/runner/worktree.mjs`, `packages/git/contracts/mutation-census.v1.json`, `test/git/one-door.test.mjs`, the owning `test/scripts/*.test.mjs` of the touched scripts (listed in receipt), `CHANGELOG.md`, `P/reports/phase-09/git-one-door/**`. Run `rg` first; report GitNexus impact posture (degraded under no-CLI).

**D4 — census joins and preserve premises (G2, G6).** Join all 1,126 sites (mechanical join first: fixture literal inside its own test file → that test as owning proof; graded rows → confirm REJECT custody), then list the residue needing judgment. Extend the L12-121 proof (`P/reports/phase-08/step-07-post-move-proof.mjs`, imported or copied, not edited) to 4,804 + 609 Step 3/4 preserves; run twice byte-identical; 3 negative probes. Writable: `P/reports/phase-09/census-join/**`, `P/reports/phase-09/preserve-premise/**`.

Disjointness: D1 = candidate docs + register + ledger; D2/D4 = own record dirs; D3 = code/tests/census/CHANGELOG. Composed specs targeting D1/D3 files are deferred to G9 by the W0 prefilter. **A1 (after W1 close)**: writable `P/reports/phase-06/step10-round5-reproduction.json`, `P/reports/phase-06/step10-sync4d-reproduction.json` (exception arrays only) and `P/reports/phase-09/w1-pair-accounting.json`; unchanged checks-A recipe, append actual `{commit,path,authority}` pairs, preserve all other bytes, replay both recipes + `test/scripts/doc-rationale-reproduction.test.mjs`.

## 5. Reviewer batches (≤ 6 concurrent; read-only on the clean review worktree; verdict per id with exact digests; Lead commits review files)

**G0 — 191 rows by `targetOwner`** (R1, five reviewers):

| Batch | Targets | Rows |
|---|---|---|
| g0-b1 | `docs/platform/packaging-distribution/spec.md` | 55 |
| g0-b2 | `packaging-distribution/contracts/activation-binding.md` | 50 |
| g0-b3 | `docs/specs/runner.md` | 42 |
| g0-b4 | `release-manifest.md` 14, `setup-doctor-registry.md` 3 (with C-F9 line 207 truth), `docs/specs/distribution.md` 3, `component-boundary.md` 1, `how-to/install-fgos-in-a-project-and-use-doctor.md` 1 | 22 |
| g0-b5 | `agent-coordination/vision.md` 10, `architecture-manifest.json` 3, `confinement-authority.md` 3, observe spec 2 + `docs/specs/observe.md` 1, holder-lock 1, `cli-io-contract.md` 1, `io-contract.md` 1 | 22 |

**G7 — 423 composed specs** (R1 slot 6 + R2 six reviewers; counts before the W0 prefilter, deferred specs move to G9):

| Batch | Scope | Specs |
|---|---|---|
| g7-c1 | `docs/platform/agent-coordination/history/retired-engine/**` | 73 |
| g7-c2 | `docs/knowledge/**` first half (sorted path) | 68 |
| g7-c3 | `docs/knowledge/**` second half | 68 |
| g7-c4 | rest of `docs/platform/agent-coordination/**` | 41 |
| g7-c5 | code: `src` 19, `apps` 11, `test` 11, `core` 8, `domains` 6, `scripts` 4, `plugins` 3, `.githooks`, `AGENTS.md`, `herdr-dashboard`, `packages`, `plans` | 67 |
| g7-c6 | other `docs/platform/**` (runner 17, ui-spec 12, confinement 5, herdr 4, packaging 3, 2+2+2, 12 singles) | 59 |
| g7-c7 | other `docs/**` (explanation 15, how-to 12, ui-spec 12, root 5, contracts, distillery, reference) | 47 |

Reviewer prompt core: re-hash the target at the review commit; APPROVE only if bytes == `beforeSha256`, the forward/rollback round trip holds, and the semantic change is a correct, conservation-preserving successor; otherwise REWORK with exact locator. Author roundtrip is not acceptance.

## 6. Risks and stop conditions

| Risk | L×I | Mitigation |
|---|---|---|
| Main keeps moving after F | H×M | F as late as possible; delta-only reopen; cutover lease drift step catches the rest |
| W1 code (D3) drifts composed specs/bindings | H×L | W0 prefilter defers them; G9 owns recomposition |
| Disk: worktrees ~5 GB each, 68 GB free | M×H | ≤ 4 Doer worktrees + 1 review worktree + rehearsal clones; stop new worktrees below 20 GB free; cleanup batched at track end |
| Accounting race from parallel commits | M×M | linear cherry-pick, single A1 Unit, never pre-account |
| Review batches too big for one turn | M×M | split any batch > 70 on the sorted path; verdicts digest-bound so splits are free |
| G8 timing still ≥ 60 s after shrink | L×H | measure in D5 rehearsal early (W2), not at W4 |

Owner stops (one batched packet, each in the decision-question template):

- **S1 `.githooks/pre-commit:507` exemption (W1).** What: one one-door site needs a declared exemption. Cause: the cold hook runs Git directly; the register says only the owner can declare it. Options: (A) owner declares a registered exemption for this one line — one sentence, no code; (B) migrate the hook to a typed port — hook cost and addon dependency in a cold client. Recommendation A. Scope: that line only.
- **S2 G8 publication (raise with cutover approval, not a stop now).** What: G8 ends `met-local`. Cause: origin push and main manifest merge are outside L12-137. Options: (A) include archive-ref push + manifest merge in the cutover approval; (B) separate earlier approval for the push only, cost ~610 MiB extra packed history on every main clone. Recommendation A. Scope: archive ref name + manifest.
- **S3 Git §7 consent refused or silent past W3.** What: G10 cannot run. Cause: §7 consent belongs to the Git owner. Options: (A) wait, all else proceeds; (B) owner overrides; (C) narrow rehearsal to refusal/rollback only, Land publication left unmet. Recommendation A, then B. Scope: G10 only.
- **S4 SEAT cannot stage from a plan-branch commit.** Options: (A) SEAT stages from the plan branch commit (preferred, no main landing); (B) owner allows a dev-host staged equivalent — but the register says dev-door proof does not qualify. Recommendation A; if refused, ask the owner. Scope: G11.
- **S5 A G3/G1 disposition loses a conserved claim with no live holder,** or G6/G2 finds an overturn that changes a contract meaning: the Lead decides under A42 when one option clearly wins, else asks with options and cost. Scope: that id.
- Hard stops (no option, report): any step needing main landing, push, real lease hold or deletion on main; any checker weakening or baseline edit to get green.

## 7. Rollback

Plan-branch only: revert the offending commit(s) with `git revert` (never reset a shared branch), then account the revert like any commit. Local archive ref and `/tmp/fgos-work` clones are disposable. SEAT staging is not activated globally; the disposable clone activation is deleted with the clone. Records keep superseded verdicts with their digests (no rewrite).

## 8. Test matrix

- Unit/owning: `test/git/one-door.test.mjs`, touched `test/scripts/*.test.mjs`, lease tests (`test/runner/documentation-cutover-lease.test.mjs`, `test/e2e/documentation-cutover-lease-hooks.test.mjs`) when D3 touches `bin/fgos.mjs`.
- Records: assembler-style double run byte-identical for D4 proofs; register/ledger join scripts (G0, G2, G3, G9 hash sweep).
- Integration: Lead full suite in an isolated clone at F (main-vs-branch attribution as L12-131), both reproduction recipes + owning test after A-accounting.
- End-to-end: G11 installed-host routes, G10 holder Land rehearsal, G8 timing, all on disposable clones.

## 9. Done for this authorization

`preflip-gate-status.json`: G0–G7, G9–G11 `met`, G8 `met-local`, each with evidence at F; independent review of the status file; cutover approval packet (S2 plus the remaining lease/Land steps) sent to the owner.

## Unresolved questions

1. Archive ref name (L12-129 example `refs/heads/archive/260925-records`) — fix in D5, confirm in the cutover packet.
2. Whether `scripts/verify-phase-01.mjs` / `verify-phase-02.mjs` (23 sites) still have owning proofs; D3 decides typed port vs retirement and names the proof.
3. Exact live holders of family 15 (knowledge registry) may sit outside D1's writable dirs; D1 reports `needsWrites` rather than writing.
