# W9 review of the G6 fix commit

**Verdicts: 7 APPROVE, 0 REWORK** (one per brief item). Per-item verdicts: [w9-g6-fix-review.json](w9-g6-fix-review.json).

- Commit reviewed: `db023f065` ("fix(records): normalize preserve operands and bind historical framing"). Branch HEAD `081e0362a`. Source pin `4178dcc6e`.
- Inputs read: [w8-g6-fix-brief.md](../w8-g6-fix-brief.md), [w8-g6-parks-review.md](w8-g6-parks-review.md), [w8-g6-judgments-review.md](w8-g6-judgments-review.md), and ruling L13-10 in [owner-answers.md](../owner-answers.md).
- This was a read-only review. I made no git writes and ran no fgos CLI, npm test or scripts/run-tests.mjs. I ran the verifiers in a scratch clone, and I have deleted all scratch.

## Method

- I ran `proof.py --pin 4178dcc6e` twice. Then I compared each of the 5413 rows with the parent commit's `proof.json` (`db023f065^`).
- I listed every row whose result changed, whose operand list changed, or whose operand stability changed.
- I read the bound lines and file headers at the pin.

## Findings by brief item

1. **Operand normalization: APPROVE.** 20 rows gain a stable operand. They are the 15 class-A rows plus f00420, f07646, f07715, f08493 (a trailing `>` is stripped) and f08561 (a truncated `docs/history/main-checkout-destructive-` is expanded from the line).
   - For all 20, the normalized path is a blob or tree at the pin and appears on the bound line. None is touched by the move.
   - Results: 11 class-A rows, plus f08493 and f08561, now resolve to `preserve-operand-reachability-unchanged`. The other 4 class-A rows (f00417, f00418, f00419, f00429, all in archive/plans) become `preserve-source-confirmed-history`, because file evidence takes precedence.
   - Three rows lose stability: f00587, f00588 and f00591. Their operand `docs/history` is expanded to the wildcard `docs/history/*/CONTEXT.md`. This is safe, because their result still comes from sentence evidence.
   - The move set has no source outside `docs/`. No operand outside `docs/` is removed or gets a successor.
   - Controls: line-locator, import-prefix, full-bound-path and outside-docs each have a real positive and a real negative control, all asserted inside `proof.py`.
2. **Class-B rows: APPROVE.** All 25 rows (24 in reading-map, plus f08335) now carry `recheckHolder`, with `docs/reading-map.md` or `docs/platform/workflow/spec.md`. Each holder is present after the cutover and pinned by sha.
   - Each blocker names the row and its operand.
   - In all 5413 rows, no blocker matches `successor(s)  and` and no blocker has a double space.
   - Choosing "recheck" for every row is defensible, because every bound unit is a live navigation entry.
3. **File-level framing: APPROVE.** Unconfirmed parks went from **959 to 623**.
   - Rule (b), dated report location: 182 parks become confirmed, and 3 rows that were already stable gain this evidence (185 in total). Afterwards, 0 unconfirmed parks remain in archive/plans or plans/reports.
   - Rule (a), external repository header: 137 parks become confirmed, and 32 stable rows gain this evidence (169 in total). Unconfirmed parks in the distillery went from 142 to 5.
   - The markers are real. All 12 distillery files carry a quoted `type: git-repo` + `url` + `local: upstreams/…` header, or an introductory `Source…: …upstreams/…` / "Mechanical inventory pass … for the distillery source" line.
   - The negative controls are real: 6 of the 10 file controls are negative. They cover an unmarked file, a marker in the body only, the wrong location, an undated report, a dated `docs/history/`, and a file with no heading.
   - Live conventions stay parked: f08463, f08472, f08489, f00475 and f08803. The 31 `docs/history/<feature>` rows confirmed by rule (a) are bee upstream paths, not fgOS conventions.
   - I spot-checked 56 newly confirmed rows (40 under rule (a), 16 under rule (b)). For 19 of the 20 rule-(a) rows whose operand is also a path in fgOS, the path is an upstream coordinate.
4. **Repoints: APPROVE.** Each of f08113, f08071 and f06985 now points to the successor its old blocker or candidate list named. For f06985, `architecture/node-to-rust-migration.md` is the "Promoted from" holder under L12-26(1).
5. **f07526 patch: APPROVE.** The patch in `prepared-patches.json` changes exactly lines 22, 29, 33 and 37 to the text the brief specifies, and its status is `prepared-not-applied`. The doc is unchanged from the pin to HEAD, and the commit touches no `docs/` file. f07527 and f07528 are now `repoint-proposal`, and all three rows link to `patches[0]`.
6. **Determinism and verifiers: APPROVE.**
   - The two runs produce byte-identical stdout and all 5 artifacts, and each artifact equals the committed bytes.
   - `misc-fix/verify.py` exits 0 in a clone at HEAD, and its counts match.
   - `preserve-premise/verify.py --pin HEAD` stops only at the G2 census-pin assertion (G2 is at `3d0169f39`). With `--pin 4178dcc6e` it stops earlier, at source drift, which is expected.
7. **Receipts and scope: APPROVE.** The receipt arithmetic adds up: 4,320 + 924 + 163 + 6 = 5,413. The per-rule counts match my diff. All 14 changed files are on the brief's writable list.

## Low notes (non-blocking)

- **f01182** (`compound-engineering-plugin.md`) is confirmed under `file-external-repository-header`. But its sentence names fgOS's own `docs/specs/`, and its stated reason is L12-38(7), "fgOS-side observation". The preserve outcome matches that reason; only the evidence kind is wrong (L12-26(9): labels follow the path owner).
- **Distillery group-c** (`distill-bee-inventory-2026-07-28-group-c.md`) has a real `Source root:` marker, but the marker is in the middle of a line, so its 5 rows stay parked. This is a safe false negative.
- **Normalizer extras with no control:** punctuation and `>` stripping, and resolving `./` and `../` at the consumer. The relative-path rule has a positive control but no negative.
- **Committed `misc-fix/checks.json`:** it was produced by a scratch adapter (`/tmp/fgos-work/w8-g6-fix/rebind-adapter.py`, at `eb744281d`), not by the committed script. The receipt discloses this. The committed `verify.py` reproduces the same content; only the HEAD sha and scratch paths differ.
- **Receipt wording:** the receipt says "per-row reason" for class B, but the reason is a single template, filled in with each row's operand.
