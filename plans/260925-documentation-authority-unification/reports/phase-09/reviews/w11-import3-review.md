# Review: import 3 re-sync (7693ae514 + d786e305e)

Verdict: **accept, with two follow-ups for the Lead.** Reviewed at d786e305e. Read-only.

## Scope

Every file changed in both commits is on its brief's writable list. 7693ae514 changed only the phase-09 file and `import3/**`. d786e305e changed `docs/platform/**`, `docs/reading-map.md`, `ledger/decisions/**`, `import3/**`, the two late-areas files and the ratchet exceptions file.

Docs carry check. I compared every `+`/`-` line of `git diff 571a996f5^1 571a996f5 -- docs/specs` with the `+`/`-` lines of d786e305e in `docs/platform` and `docs/reading-map.md`:
- 46 of the 47 lines main added appear byte-identical in the plan.
- The one exception is the confinement banner. The plan keeps its own live-migration/invocation tail and carries the new probe clause verbatim. This is a declared adaptation.
- The plan adds no line that is not in main.
- None of the lines main removed survives in a successor. The only "8/8 probes" text left is historical P03 evidence.

The reading-map change is two lines in section 5. The L11-25 banner, the knowledge routes and CTR011 are untouched.

## Units (24)

I re-extracted every s18 row with the production `extractMarkdownConservationUnits` (not the Doer's frozen copies):
- All 24 source digests match at HEAD and at 571a996f5.
- All 24 target digests and self-inclusive ancestries match the current successor bytes.
- All 24 hashes recompute under the sorted compact 4-key JSON + LF recipe.
- All rows are `reviewStatus: pending`.

Placement is correct:
- §9.3, §9.2 tail, the banner and §11.3 go to `agent-confinement/spec.md`.
- The §10 S3 row and settled fact 5 go to `history/rollout-and-settled-facts.md`.
- The §12 row goes to `decisions/confinement-authority-decisions.md`.
- Seat-binding item 2 and the dated bullet go to `seat-binding/spec.md`.

Cross-references resolve: §9.1, §9.2, Secrets §7.3, Config §9. §6.6 lives in `contracts/confinement-authority-v1.md`, which is the existing §-number convention.

## Ledger edits to s3/s8/s12/s14/s17

98 rows changed or were added (s18 24, s3 1, s8 28, s12 4, s14 38, s17 3). All 98 recompute: hash, target digest and ancestry all match at HEAD.

The edits are justified. The successor bytes changed, so the rows needed refreshing:
- The front matter `updated:` changed.
- §9.3 inserted new unheaded blocks and renumbered the anchors that follow it.
- The seat-binding sections changed.

Every touched row ends `pending`. The 19 previously `reviewed` s8 claims were downgraded, not carried over, so no approval carries silently. Each pre-edit row, with its review provenance (reviewReport and commit), is preserved in `import3/binding-refresh.json` (`preimages`, `directOriginMaterializations`). The 11 s14 `supersedesBinding` refreshes follow the 11 materialized s8 origins.

## Scanner

The diff only adds the `appliedToDocs===false` guard, `preparedPendingApply` (path, rowCount, historicalLookupRowCount) and the output field.
- Prepared shards still count toward `shards` input hashing.
- The scanner has no supersession logic, so skipping a shard leaves the old rows effective by construction.
- The guard also catches w8, which is flagged too. That is correct and disclosed: 44 + 44 rows.
- `scanner-proof.json`: an unflagged missing holder fails with exit 1 and ENOENT, and the output is unchanged. In the composed scratch, 134 overlays resolve.
- My run of `scan-legacy-drift.mjs --check` exits 0 with 0 missing. Its recorded head 814c06f3d is an ancestor of HEAD.

## Ratchet and checks

- Only the three `expectedDigest` values changed. With digests and accounting blocks removed, the file is byte-equal to 814c06f3d.
- Each new digest equals the sha256 of its HEAD blob.
- The `mainMergeAccounting` rows name 571a996f5.
- `previousMainMergeAccounting.objectSha256` (90fa080f…) recomputes at 814c06f3d, which is an ancestor.
- No baseline or allowance changed.
- `node scripts/check-legacy-docs-ratchet.mjs`: exit 0.
- `rebind.py --check`: exit 0, drift 0.

## Native addon

- The evidence relocation `--before` check was correctly not run.
- However, the mandatory `phase-08/audit-report.py` started `checks.mjs`, which loaded the existing cached git addon. The receipt discloses this (`auditNativeDiagnostic`).
- There was no new staging: `.fgos/runtime/git-addon/` was last written 2026-10-24 11:31.

## Findings

- **F1 medium, open.** The phase-09 file (line 104, added in 7693ae514) still says the legacy re-sync is "**blocked, not complete**" and names the two blockers. d786e305e resolved both and the file was writable, but the prose was not updated. Fix: replace that sentence with the done state and link the receipt.
- **F2 medium, open (Lead decision).**
  - `phase-08/audit-report.py` exited 1 overall. audit-ownership is 0 with no failing rows, so the brief's literal bar is met.
  - Both `checks.mjs` children died on `git-floor-probe-failed` (EROFS in the Doer sandbox) before giving a verdict. Those checks have no verdict at this commit.
  - Running them loads the cached native addon, which is the thing the brief wanted kept out. The Lead should either rerun them outside the sandbox, accepting the addon load, or record them as owed.
- **F3 low, open (route to composition owner).**
  - Once the w8/w9 prepared shards are applied, the drift scan reports 2 changed-unit gaps (README and repo-layout-vision), because the source join does not inherit `sourcePath` through supersession.
  - This is disclosed and out of this brief's scope ("no other scanner change"). If no one owns it, it will turn red at the final pin.
- **F4 info.** The 8 adapted rows are bindings, not approvals. Each needs independent per-unit review, which the receipt says.

No blocking findings.
