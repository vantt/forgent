# Evidence Payload Relocation Policy And Consumer Proof

```txt
Document type: Policy and consumer proof
Audience: Plan executor, reviewer, owner
Purpose: Decide how non-authority evidence payloads may leave the legacy roots before the atomic cutover, and prove who reads them
Design status: Draft (for owner review; nothing here is implemented)
Last reviewed: 2026-10-06
Related:
- plan.md section 3 item 10, section 5 item 9, section 10 and section 11
- minimum-constitution.md and minimum-constitution.json (kind evidence-payload, retirementGate check evidence-digests)
- phase-04-freeze-the-minimum-constitution-and-migration-method.md
```

Related files: [plan.md](plan.md), [minimum-constitution.md](minimum-constitution.md), [minimum-constitution.json](minimum-constitution.json), [phase 4](phase-04-freeze-the-minimum-constitution-and-migration-method.md), [legacy ratchet](../../scripts/check-legacy-docs-ratchet.mjs), [ratchet baseline](../../scripts/check-legacy-docs-ratchet.baseline.json), [constitution validator](../../scripts/check-doc-constitution.mjs), [cutover write lease design](cutover-write-lease-design.md).

## 1. Summary

- Every evidence payload sits under one area, `agent-coordination`. It exists **twice, byte for byte**: once under `docs/architect/` (legacy) and once under `docs/platform/` (target). Relocation is therefore a **deduplication**: repoint consumers to the platform copy, verify digests, delete the legacy copy. No bytes need to move.
- No product runtime code and no test reads a payload file from disk. The readers are documentation links, three generated skill copies, historical logs, and tools that walk the whole docs tree.
- Deleting the legacy copy before the cutover is blocked by the legacy ratchet (deletions are forbidden) and by about 190 files that name the legacy path (section 3). The ratchet also guards only the legacy copy: its roots are `docs/specs` and `docs/architect`, so deduplication deletes the protected copy and keeps the one no gate protects (decision 8). The safe action now is to record the manifest and build the checker; the deletion belongs to the cutover.

## 2. What counts as an evidence payload

The frozen constitution defines kind `evidence-payload`: proof, run and report files nested below a `verification` directory, classified by location only, not canonical, exempt from metadata, owned by the nearest `verification/README.md` (which stays a canonical `collection-index`). Placement patterns:

- `docs/platform/verification/<collection>/**`
- `docs/platform/<area>/verification/<collection>/**`
- `docs/platform/<area>/subcomponents/<subcomponent>/verification/<collection>/**`

Files directly under `verification/` (for example `README.md`, `implementation-alignment.md`) are not payloads. `docs/platform/<area>/reports/**` is `history`, not payload, and is out of scope here.

The constitution has no pattern for `docs/architect/**`; the legacy mirror of a payload is the same relative path under `docs/architect/<area>/verification/<collection>/**`.

### 2.1. Measured inventory

Method: `git ls-files` over `docs/architect` and `docs/platform`; a file is a payload when at least two path segments follow a `verification` segment; sizes from `fs.statSync`; counts and bytes by a node script (no `grep | wc`). Kind assignment was repeated with the validator's own `classifyPath` over all 1,006 tracked files under `docs/platform` (empty header): 867 `evidence-payload` (302 Markdown, 565 other), 10 `verification`, 14 `collection-index`.

| Measure | docs/architect | docs/platform |
|---|---|---|
| Tracked files in the tree | 981 (19,315,237 bytes) | 1,006 (18,959,258 bytes) |
| Payload files | 867 (17,176,516 bytes) | 867 (17,176,516 bytes) |
| Payload Markdown / other | 302 / 565 | 302 / 565 |
| Executable-bit files (mode 100755) | 12 | 12 |
| Payload directories | 17 collections, all under `agent-coordination/verification/` | same |

No other area has a payload: `packaging-distribution/verification` has 3 files and `host-invocation-routing/verification` 7, all directly under the directory.

Mirror test (method: compare `git ls-files -s` blob ids of the two `agent-coordination/verification` trees): 867 of 867 payload files are identical blobs. The only differences in the whole `verification` tree are `README.md` (different content) and `implementation-alignment.md` (platform only). The platform copy was created by commit `e1307d33f` (2026-09-18, "migrate to docs/platform/ target structure"); the legacy copy dates from the original proof commits. The legacy ratchet baseline lists all 867 payload paths (method: key filter on the baseline JSON), classified `maintained-authority` 296, `retained-source` 6, `history-evidence` 565. That classification is the ratchet's own path/extension rule, not the constitution's.

Collections (one tree; the other tree is identical):

| Collection | Files | Bytes |
|---|---:|---:|
| architecture-advisory-panel | 373 | 10,245,854 |
| step-08-standalone-coordination | 275 | 1,990,854 |
| step-09-mvp6-to-mvp9 | 48 | 1,598,572 |
| step-09-group-thinking-mvp1-mvp2 | 10 | 1,169,369 |
| step-07-mvp | 33 | 688,090 |
| step-09-mvp3-to-mvp5 | 9 | 339,539 |
| group-thinking-plan-loop | 7 | 239,189 |
| rust-host-r1-kernel | 17 | 163,271 |
| team-dispatch-v1 | 11 | 157,153 |
| visibility-herdr | 36 | 147,844 |
| confinement-authority-implementation | 10 | 110,442 |
| code-panel-multicell-facade | 9 | 103,852 |
| runtime-recovery | 10 | 67,735 |
| dispatch-operability-implementation | 5 | 60,041 |
| code-implementation-track-policy | 6 | 59,623 |
| coordination-envelope | 7 | 26,919 |
| executor-policy-dispatch-seams | 1 | 8,169 |

Content that makes a naive move unsafe (method: node scan of the 867 platform payload files): 45 are `.mjs`/`.sh` scripts; 17 carry path-dependent code: 16 use `import.meta.url` (the deepest `../` climb is 7 levels in 6 of them, 6 levels in 6, 1 level in 3 and none in 1) and 1 shell driver names `docs/` paths; 136 files mention `docs/architect/` and 218 mention an absolute `/home/` path in their text (platform tree, method: node scan). The legacy and platform copies sit at the same depth, so the depth-bound scripts resolve the same way in either place. A location with a different depth would break re-running them, and any rewrite of their text would change the digest.

## 3. Consumer proof

Method: `git grep -l -F` over every tracked file (`.`), excluding the two payload trees and the plan reports, for the pinned patterns `agent-coordination/verification` and each of the 17 collection names; then `git grep -n -F` over `src test scripts bin apps core domains plugins .agents` for the full path, and a read of every hit. A collection name alone is not evidence of a path read: `runtime-recovery`, `coordination-envelope`, `step-07-mvp` and similar words appear as track and coordination ids, which were checked and discarded. The union of all patterns hit 521 distinct files, which were sorted by hand into the table below (most are `archive/plans`).

Counts of files naming any form of the legacy payload path (full or relative, pattern `agent-coordination/verification/`), outside the two payload trees and this plan directory (method: `git grep -l -F`, grouped by top directory with a node script): about 195 files (the exact number depends on how the two README files and this directory are excluded: 195 in the first count, 197 when a node re-scan excludes only the payload trees, the two `verification/README.md` files and this plan directory): 114 under `archive/`, 23 under `docs/architect`, 19 under `docs/platform`, 12 other docs (9 how-to, 2 `docs/history`, 1 `docs/knowledge`), 11 under `test/`, 6 under `plans/`, 3 skill copies, 3 under `src/`, 2 `.fgos/events`, 1 `CHANGELOG.md`, 1 script. Which form they name (node re-scan of the 197): the legacy form `architect/agent-coordination/verification` in 188, the full path `docs/architect/agent-coordination/verification/` in 176, the platform form in 10 (some name both). The platform-form mentions are not consumers of the legacy copy; the legacy-form count is the figure that matters for deletion.

| Consumer | Kind | Path pattern read | What breaks if the legacy copy is deleted |
|---|---|---|---|
| `src/runner/dispatch/config.mjs`, `trust-store.mjs`, `worker-home.mjs` (comments) and `test/runner/dispatch-executor-profile.test.mjs`, `dispatch-worker-home.test.mjs`, `dispatch-worker-session.test.mjs` (comments) | prose in code comments | `.../verification/visibility-herdr/proofs/...` | nothing at run time; comments go stale and fail the "no legacy path in comments" acceptance of plan section 10 |
| `test/fixtures/run-outcome/legacy-derivation.json`, `test/fixtures/run-result/real-shapes/03,04,05,14,15-*.json`, `test/fixtures/usage/pi-multiturn-*.jsonl` | test fixture data | strings such as `.../code-panel-multicell-facade/index.md` inside recorded run results | nothing: `run-outcome.test.mjs` and `usage-parsers.test.mjs` load the fixture JSON and derive outcomes from it; `interpretRunResult` opens only the result file path it is given, never the paths listed inside. These strings are recorded history and must not be rewritten |
| `core/skills/fgos-architecture-panel/SKILL.md` (source), `.agents/skills/...` and `plugins/fgOS/skills/...` (render targets) | prose link, 5 relative links per copy | `../../../docs/architect/.../architecture-advisory-panel/{P00.1,P02.1}.md`, `proofs/P01.3/...` | links go dead. The package allowlist (`package.json` `files`) ships `core`, `.agents` and `docs/how-to` but not `docs/architect` or `docs/platform`, so installed copies already cannot resolve them. Edit `core/skills` and regenerate; never hand-edit the render targets |
| `docs/how-to/use-fgos-architecture-panel.md`, `author-a-plan-loop-track.md`, 8 `coordination-examples/architecture-advisory-panel-v1-*.md` | prose link in shipped end-user docs | payload paths | dead links in shipped documentation |
| `docs/platform/agent-coordination/verification/README.md` (8 links), `history/documentation-migration/proof-preservation.md` (23 table rows) and 18 further `docs/platform/agent-coordination` files (19 outside the payload tree in total, including proof-preservation) | prose link, deliberate | legacy proof roots, called "current proof root" | the promoted area points at the legacy copy by design during migration; must be repointed to the platform copy before deletion |
| 23 files under `docs/architect` | prose link | payload paths | stale links inside legacy documents that are themselves deleted at cutover |
| `docs/history/*` (2 files), `docs/knowledge/*` (1 file), `CHANGELOG.md` | prose / evidence mention | payload paths | historical text; alias table covers it, no rewrite |
| `archive/plans/**` (114 files), `plans/**` (6 files), `.fgos/events/*.jsonl` (2 files) | immutable historical record | payload paths | cannot be edited; the alias table must resolve them (plan section 3 item 9) |
| `scripts/check-legacy-docs-ratchet.mjs` with `.baseline.json` and `.exceptions.json` | gate script | all 867 payload paths as baseline entries with sha256 | deleting any baselined file fails the check with `unexpected-deletion`; the exception kinds are only `allowed-new-file` and `allowed-edit`, and deletions are refused by the loader |
| `scripts/generate-doc-inventory.mjs`, `scripts/check-doc-inventory-gates.mjs` | tree walker | whole tree, including both payload copies (they appear as exact-duplicate groups) | inventory counts change; regenerate before cutover |
| `scripts/check-doc-constitution.mjs` and its test | tree walker and unit-test strings | platform payload placement; the test uses synthetic paths | nothing (synthetic strings; the platform copy is the classified one) |
| `scripts/generate-shipped-path-inventory.mjs` | tree walker | classifies `docs/architect/**` and `docs/platform/**` as repository-self paths | nothing for payloads |

True runtime or test readers of payload files: **none found**. This matches the read-only check recorded in plan.md (no production code opens non-Markdown `docs/architect/**` proof payloads) and extends it to the Markdown payloads, tests, hooks (`.githooks`, `.claude/settings.json` show no payload path) and the `apps`, `packages`, `domains` trees (no hit). Completeness limits, UNPROVEN: dynamic path construction (a consumer that builds a collection path from a variable) cannot be excluded by a fixed-string search; the dynamic-pattern edges of the inventory (`identityStatus: unresolved-dynamic-pattern`) remain the gate for that. The inventory file [reports/doc-inventory.md](reports/doc-inventory.md) was used only as a cross-check: it lists the legacy and platform payload files as exact-duplicate pairs (615 pair groups with a path of 7 or more segments), consistent with the 867 measured by blob id, but its duplicate section was not used for any number.

## 4. Relocation rule

1. **Authority.** A payload is evidence, never authority (plan section 3 item 10). It may be relocated or deduplicated only when (a) the consumer table above is current for the commit, (b) every file is recorded in the digest manifest, and (c) the verifier passes.
2. **Destination.** Payloads live at `docs/platform/<area>/verification/<collection>/**`, the constitution's own pattern. For `agent-coordination` the destination already exists and is byte-identical, so the operation is: repoint consumers, verify, delete the legacy copy. Nothing is copied.
3. **No rewrite.** Payload bytes, line endings and git modes (12 executable files) are never edited. Stale paths inside payload text are covered by the alias table, not by editing.
4. **Digest manifest.** One committed JSON file, proposed at `docs/platform/history/documentation-authority-unification/evidence-relocation-manifest.json` (the directory plan section 11 names for the sealed ledger). Fields: `version`, `sourceCommit`, `generatedBy`, and one entry per file: `collection`, `before` (legacy path), `after` (platform path, or null when the file is deleted without a mirror), `sha256`, `bytes`, `mode`, `gitBlob`, `relation` (`identical-mirror` or `moved`). Sorted by `before`, UTF-8, POSIX paths, deterministic like the ratchet baseline.
5. **Verification command (to be built, not built now).** A script `scripts/check-evidence-relocation.mjs --manifest <path>` with two modes. `--before`: for every entry the legacy file and the platform file both exist and hash to the recorded `sha256`; no platform payload file exists that is absent from the manifest. `--after`: no legacy file remains, every platform file hashes to the recorded `sha256`, modes match, and no maintained text outside history, archive and the alias table names a legacy payload path. It re-hashes from the working tree, never from the manifest, and exits non-zero on any difference. It should also back the retirement gate `evidence-digests`, which the constitution currently marks as planned for this deliverable.
6. **Stays put.** The two `verification/README.md` files and `implementation-alignment.md` are canonical, not payloads; they stay and are rewritten as ordinary documents. Anything a runtime consumer reads stays put; none exists today, so the rule is a guard for later additions, enforced by the consumer table being regenerated in the checker's `--before` run (search for the full legacy path and the collection names in code, tests and instruction files).
7. **Rollback.** The deletion is one commit. `git revert` restores the legacy copy; `--before` then passes again. The manifest records the source commit, so `git checkout <sourceCommit> -- docs/architect/agent-coordination/verification` plus `--before` also proves a restore.

## 5. Safe now versus only at cutover

| Action | When | Reason |
|---|---|---|
| Generate and commit the manifest, build the verifier, run `--before` | designed now; built and run before the cutover (not built in Phase 4, owner decision 9) | read-only, changes no authority |
| Record this consumer table, refresh before cutover | now, then again at cutover | the table has to match the cutover commit |
| Repoint the promoted area's own links (verification README, proof-preservation table) to the platform copy | Phase 8 consumer rewrite | candidate-area edit; the table of 8 links states "current proof root" as an intentional migration state |
| Rewrite skill sources (`core/skills`), how-to links, code comments | Phase 8 | consumer rewrite; render targets regenerate |
| Delete the legacy payload copy | cutover step 6, after `--before` passes and consumers are repointed | the ratchet forbids earlier deletion; about 190 files still name the legacy path; plan section 10 and cutover step 6 already order it |
| Anything that edits payload bytes | never | digest contract |

Early deletion on main before the cutover is permitted by plan section 5 item 9 but gains little: it would need a new ratchet exception kind and an accounted edit of every legacy file that links to the payloads.

## 6. Open decisions for the owner

1. **Deduplicate or move.** Recommendation: deduplicate (keep the platform copy, delete the legacy copy), because 867 of 867 files are identical blobs and the platform copy already has the correct depth. A move would only add risk.
2. **When to delete.** Recommendation: at cutover step 6 in the cutover commit, gated by `--before` then `--after`, not on main earlier. Alternative: a separate early commit after the Phase 8 repoints, which shrinks the cutover diff by 867 files and 17.2 MB at the price of a ratchet change.
3. **Ratchet handling.** Recommendation: no new exception kind; the ratchet is retired or rebaselined in the same change as the cutover. If the owner chooses early deletion, add a single exception kind `allowed-relocation` that requires a matching manifest entry.
4. **Manifest home.** Recommendation: `docs/platform/history/documentation-authority-unification/evidence-relocation-manifest.json`, sealed with the migration ledger.
5. **Classification mismatch.** The ratchet calls 296 payload Markdown files `maintained-authority`; the constitution calls them `evidence-payload`. Recommendation: the inventory and cutover reports follow the constitution (location rule), and the dispositions of those files are `retain-as-evidence`. UNPROVEN: how the final inventory dispositions the 302 payload Markdown files; check before cutover with the validator's placement report.
6. **Absolute `/home/` paths and legacy paths inside payload text** (218 and 136 files). Recommendation: leave them and do not rewrite payloads. The alias table resolves repo-relative paths only (`fromPath` rejects a leading `/`), so it covers the legacy-path mentions (136) but not the 218 absolute paths, which are machine-specific and were never resolvable.
7. **Skill links already dead in installed copies.** Recommendation: when `core/skills/fgos-architecture-panel/SKILL.md` is rewritten in Phase 8, link to the platform copy and regenerate the render targets; no separate fix.
8. **The ratchet protects the wrong copy.** Its roots are `docs/specs` and `docs/architect`, so the legacy payload copy is baselined and the platform copy is not. Recommendation: before the legacy copy is deleted, the manifest verifier (`--before`, `--after`) is the only guard of the platform copy; add the platform payload tree to a baseline or give the verifier a standing run in `npm test`.
9. **Build the verifier now or at the cutover.** The policy above is designed in Phase 4; the manifest generator and `check-evidence-relocation` verifier are not built. Recommendation: build them in the cutover preparation (Phase 8), because the manifest must be generated from the cutover base commit anyway; until then the retirement dry run reports `evidence-digests` as blocked.

## 7. Unproven

- Dynamic or runtime-built references to payload paths (fixed-string search cannot exclude them).
- Whether any person re-runs the 17 depth-bound payload scripts; the policy keeps them runnable at the same depth but does not test that they run.
- Platform README text claims the platform copies are "navigable copies"; whether anyone treats the legacy copy as the only complete proof root was not checked beyond the links listed above.
