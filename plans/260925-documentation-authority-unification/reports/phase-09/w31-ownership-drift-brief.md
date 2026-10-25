# Account for target drift in the ownership audit (Doer brief, records slice)

Status: Lead brief under L12-137. The Lead ran the Phase 6 ownership audit twice.
- At the last pair accounting (6bb1c7d61), its `ownership.mjs` and `audit-ownership.mjs` both exit 0, with 0 `targetDigestDrift` rows.
- At the plan HEAD, `audit-ownership.mjs` exits 1 (`assert(current.noNewDoubleOwnership)`), with 23 `targetDigestDrift` rows:
  - 16 rows with `targetOwner` `docs/specs/runner.md` and no anchor, for example `claim_004b47fc…` (supersede, decision footer group);
  - `docs/platform/work-state/spec.md`: `3-work-item-data-dictionary`, `unheaded-block-4`, `6-domain-model`, `unheaded-block-54`, `11-business-rules`;
  - `docs/platform/component-boundary.md`: `9-hexagonal-architecture-view`, `unheaded-block-70`.

Three docs commits landed since then: 594fe4194, 5a849befc and e88d4e283. None of them ran this audit. `g0rework/verify.py` accepts the same changes through the edges in `rebind/g0-rework-rebindings.json`, but the Phase 6 audit reads its own records.

1. Find out exactly which commit and change caused each of the 23 rows. Explain the 16 `docs/specs/runner.md` rows in particular: `docs/specs/runner.md` has not changed since 6bb1c7d61.
2. Account for each row in the records this audit already reads. Follow the existing rebinding pattern under `reports/phase-08/step-00-*-rebindings.json`, or add a new file of that kind if the audit's recipe names one, with the commit, old and new digest, and reason. Reuse the witnesses and edges from `rebind/g0-rework-rebindings.json`; do not copy them. If a ledger row's own target digest is simply stale, say so and list it as `needsWrites` instead of editing the ledger.
3. Do not change any assertion or embedded script in `phase-06/step10-*-reproduction.json`.
4. **Keep this from recurring.** Add the two ownership scripts to the nested proofs of `g0rework/verify.py`:
   - extract them from `phase-06/step10-round5-reproduction.json` (key `scripts`) and from `step10-sync4d-reproduction.json` (key `readOnlyScripts`) into a tempfile directory;
   - run `ownership.mjs` and `audit-ownership.mjs` with `--output-dir <that dir>`, `NODE_OPTIONS=--no-addons`, and `CLAUDE_CODE_SESSION_ID` unset;
   - never run `checks.mjs`, and never run `phase-08/audit-report.py`.

Proofs, all exit 0:
- both ownership scripts, from both manifests, run as in step 4, with 0 `targetDigestDrift` rows;
- `g0rework/verify.py`;
- `g0rework/refresh-carries.py --check`;
- `rebind/rebind.py --check`;
- `g0join/join.py --pin HEAD`.

Update `g0rework/receipt.md` with the 23 rows, the cause of each, and every command with its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-08/step-00-*-rebindings.json
- plans/260925-documentation-authority-unification/reports/phase-09/rebind/g0-rework-rebindings.json
- plans/260925-documentation-authority-unification/reports/phase-09/g0rework/**

Do not edit docs/, ledgers, the register, reviews, the reproduction manifests or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py` or `checks.mjs`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
