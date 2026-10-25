# W17 review: source parity rework and scratch hygiene

Reviewer: independent, read-only. Branch `plan/260925-documentation-authority-unification`, commit `a8ea05c50` (HEAD did not move during the review). Brief: `w16-parity-rework-brief.md`. F2 is deferred by L13-15.2 and not counted.

## Verdict

**REWORK (narrow).** F1, F3, F4, F6, F8 and I3 are fixed and every required proof exits 0. One Medium remains: to make the carries checker pass, the commit moved its heading census and direct-block coverage check to a historical pin. That hides the same defect class F1 was about: 4 stale `distribution.md` heading rows, plus 1 current source block that no parity row covers.

## 1. Scope: pass

All 21 changed files are inside the writable list: `carries/**`, `ledger/decisions/**`, `g0rework/**`, `rebind/rebind.py`, `import3/**` and `composition/**`. No docs, `.fgos` or code files changed.

## 2. F1 parity rows: pass, with W17-1

- `node …/carries/verify-carries.mjs`, run with `process.dlopen` blocked through a `--require` preload, exits 0. It reports 345 current source rows and 1,208 current ledger-successor assertions.
- **No row was dropped.** The file has 345 rows at the parent and 345 at HEAD, in the same order, and every `sourcePath` is unchanged.
- **The real failure count was 97, not 35.** I replayed the parent's parity loop on the parent's rows against the current tree:
  - 35 rows fail because their source unit is gone. These are the 21 new rows plus the 14 `distribution.md` rows.
  - 62 rows fail because their target ordinal moved.

  The commit changes exactly these 97 rows. Each one keeps its pre-edit row byte-for-byte in `accounting.previousParityRow`, with `oldLegacyAnchor` and `oldLegacyDigest` set. The 21 new rows keep `historicalSourceAnchor` and `historicalSourceUnitDigest` too.
- **Spot-check: pass.** I checked rows 156, 305, 313, 318, 324, 334, 337, 343 and 344 against `git show HEAD:<source>`, using the repo extractor (`extractMarkdownConservationUnits`). In every row:
  - the current source anchor and digest match;
  - the target anchor and digest match;
  - the normalized target text includes the source text.
- **Four rows changed status.** The checker gained two statuses for them:
  - 249, 301 and 323 → `accounted-current-source-adaptation`. Each has an exact forward and rollback diff with hashes, and each is `pending`. 249 records a target edit made after the carry; 301 records the current registry counts; 323 records the shell-helper supersede, `b5695d38`.
  - 312 → `current-complete-unit-split-present`. The RUL107 and RUL108 split is checked by full concatenation.

  These rows are honest and checked. They are not false equality.
- **Info.** Rows 324 and 334 now name the same current unit, `confinement-authority.md#unheaded-block-112`. The original legacy blocks 112 and 113 merged. Both carry this in their history fields, and c25e8cf6a, which was reviewed in w16, already had the anchor.
- **Info.** 18 rows dropped a duplicate second target. The checker requires only one including target, and the earlier targets remain in `previousParityRow`.

## 3. F3, F4 and binding hashes: pass

- **F3.** In `claim_5ba6768e`, each clause now has its own sources:
  - the id clause cites `identity §4a`, `63b777873` and `11733af37`;
  - the rigor clause cites `seat-binding §5.2`, `e0e52312a` and `bd8d64fdd`.

  `verify.py` asserts this split.
- **F4.** The `claim_320ba622` rationale now names the change from "(9 file)" to "trong nhiều file (ví dụ …)".
- **Binding hashes.** I recomputed all 127 `bindingSha256` in `g0-content-redecisions.json` with the four-key compact+LF recipe: 0 mismatches. Rationale is not a hash key.
- **New shard.** `carries-current-rebindings.json` adds 25 rebinds through the existing `supersedesBinding` field. All 25 are `pending`, none carries `reviewedBy`, and the checker's successor pass covers their hashes. 8 of them change the target digest. Their before and after witnesses are in `carries/current-binding-refresh.json`.

## 4. F8 and F6: pass

- **F8.** The parity base is `receipt.json.sourceHead`, which is `568a11f21` (= `c25e8cf6a^`). The check is still strict:
  - the base must have 324 rows;
  - every row outside the refreshed and target-only sets must be byte-equal;
  - every refreshed row must have `previousParityRow` equal to its pinned row;
  - target-only rows must keep their source identity;
  - exactly 21 rows were appended.
- **F6.** `verify.py` reports `status: partial`, `ok: false` and `fullAuditPassed: false`. `nativeDependentChecksNotRun` names `checks.mjs` for both phase-06 manifests. It no longer calls `phase-08/audit-report.py`. It runs the embedded `ownership.mjs` and `audit-ownership.mjs` pairs directly, and all four exit 0. The carries checker and `refresh-carries.py --check` are now among its proofs. Exit 0 here means only that the scoped proofs passed.

## 5. I3 scratch: pass

- The script diffs change only scratch handling: a fixed root becomes a `tempfile` directory that is removed on exit.
  - `rebind.py` gets a per-call `TemporaryDirectory`;
  - `import3/resync.py` gets a `with TemporaryDirectory`;
  - `import3/extract-units.mjs` gets `mkdtemp` with `finally rmSync`;
  - the four `composition/` scripts get an `atexit` cleanup.

  No algorithm line changed. All four composition scripts parse.
- **Before and after.** `/tmp/fgos-work` held only my own disposable directory before and after each of these runs, and nothing else appeared: `rebind.py --check`, `g0rework/verify.py`, `import3/resync.py --check`, `refresh-carries.py --check`, `misc-fix/verify.py`, `sweep.py` and the carries checker.
- **Info.** `w10-rework.py` records `scratchOnly: str(TMP)`. If that script is ever re-run, the value is now a random path. No current check runs it.

## 6. Proofs (host, at a8ea05c50)

| Command | Exit |
|---|---|
| `python3 -B …/rebind/rebind.py --check` | 0, drift 0 |
| `python3 -B …/g0rework/verify.py` | 0, status partial (correct) |
| `node …/carries/verify-carries.mjs` (dlopen blocked) | 0 |
| `python3 -B …/misc-fix/verify.py` | 0 (it rewrote 8 lines of `checks.json`; I restored that file from HEAD) |
| `python3 -B …/g9/sweep.py --check --pin HEAD` | 0 |
| `python3 -B …/import3/resync.py --check` | 0 |
| `python3 -B …/g0rework/refresh-carries.py --check` | 0 |

The worktree was clean afterwards.

## Findings

| ID | Sev | Verdict | Summary |
|---|---|---|---|
| W17-1 | Medium | REWORK | The commit rewrote `verify-carries.mjs` so that `source-heading-parity.json` is read at `witnessPin` (`f534aeaea`). Before, it was checked live. A live replay at HEAD finds two things the checker now hides. (a) 4 heading rows are stale: `distribution.md#data-dictionary`, `#setup`, `#business-rules` and `#lịch-sử-quyết-định`. This is the same class as F1's 14 rows. (b) The current block `distribution.md#unheaded-block-17` ("Terminal setup loses a row and a fix", 2026-10-23) has no parity row. Its text is in `docs/platform/packaging-distribution/spec.md`, so no content is lost, but it is not accounted. The receipt discloses "final-pin coverage not certified", but the brief made this checker the permanent proof. Fix: refresh the 4 heading rows the same way as F1, keeping their history in an accounting field. Add a parity row for block-17. Run the heading and direct-block coverage loop live again. |
| W17-2 | Low | ACCEPT-DISCLOSED | The pointer-patch `beforeSha256` drift check also moved to `witnessPin`. Live, 2 of the 24 unapplied patches have drifted: `bin/fgos.mjs` and `docs/backlog.md`. The receipt says "patch recomposition is not certified". That is a duty at the final pin. |
| W17-3 | Info | PASS | 62 target-only parity repairs and 25 candidate rebinds go beyond the 35 rows that w16 named. The old checker failed on all of them. The scope is disclosed, every item is pending, and all of it is inside the writable list. |
| W17-4 | Info | NOTE | `claim_2e2bc926` still gives the same nine-source union to each of its three clauses. This is the F3 pattern, but that claim belongs to the deferred F2, so it is not counted. |

Commands: host, read-only. Node ran with a `--require` preload that throws on `process.dlopen`. My scratch was a mktemp directory under `/tmp/fgos-work/`, removed afterwards.
