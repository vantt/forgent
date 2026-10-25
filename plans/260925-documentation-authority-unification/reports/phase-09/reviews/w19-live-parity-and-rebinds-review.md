Verdicts: 27 APPROVE / 0 REWORK

# W19 review: live source parity, current carry rebinds, and misc receipt counts

Reviewer: independent, read-only. Branch `plan/260925-documentation-authority-unification`. HEAD was `a808bc676` from start to end. Per-item verdicts are in [w19-live-parity-and-rebinds-review.json](w19-live-parity-and-rebinds-review.json).

## A. 5a3f7580a, live parity next to the witness pin: APPROVE (2 Low/Info notes)

- **The checker is green.** I ran `node carries/verify-carries.mjs` with `NODE_OPTIONS="--no-addons --require <dlopen block>"`, so its node children were blocked too. It exits 0 and reports:
  - 346 current parity rows;
  - 91 live heading rows and 321 live section blocks;
  - 1,208 ledger successors;
  - live drift on exactly `bin/fgos.mjs` and `docs/backlog.md`, both carrying their duty.
- **The witness-pin checks are unchanged.** The checker diff is +34/-3, and the heading, coverage and patch loops at `f534aeaea` were not touched. The new live loops check four things:
  - the exact heading census for each source path;
  - source and target heading digests and direct payload digests;
  - ordered direct-block membership;
  - live parity coverage of every direct block, by anchor and digest.
- **No row was dropped.** `source-parity.json` went from 345 to 346 rows. The old rows are a byte-equal prefix, and the only new row is `distribution.md#unheaded-block-17`. It maps to `packaging-distribution/spec.md#unheaded-block-98`, with digest `45ccc798` on both sides, and its addition commit `f06b30fa3` is recorded.
- **The heading rows changed more than the brief named.** Heading rows stay at 91, but 12 changed, not 4:
  - the 4 named source refreshes;
  - 4 block-ordinal shifts caused by the block-17 insertion;
  - 8 target refreshes that overlap those, 4 of them in runtime-identity rows.

  Each changed row keeps its complete old row, byte-equal, in `accounting.previousParityRow`. The receipt discloses all 12.
- **The duty list is machine-readable and complete.** `carries/final-pin-duties.json` (version 1) lists exactly the two paths, each with the required reason. I ran negative controls through a read overlay; no checkout bytes changed. Six of them failed as they should:
  - dropping the backlog duty;
  - an unlisted drift on `src/runner/dispatch/mechanism.mjs` (all 3 drifting paths were named);
  - a duty that names no patch;
  - a blank reason;
  - dropping the `distribution#setup` heading row;
  - editing the block-17 text.
- **Low.** A duty listed for a path that does *not* drift is accepted: an added `AGENTS.md` duty still exits 0. A stale duty therefore silently pre-authorizes future drift on that path. Fix: when a listed duty matches the live bytes, fail it as stale.
- **Info.** `source-heading-parity.json[55]` now lists the same target, `release-manifest.md#release-tree-canonicalization`, twice. The old `-1` duplicate heading no longer exists, so the second entry should be dropped. The record still has history.
- **Info.** Setting `historical=false` before the trailing RUL104/foundation assertions moved those checks from the witness pin to live bytes. They pass live. It is a side effect, not a weakening.

## B. 25 pending rebinds in `carries-current-rebindings.json`: 25 APPROVE

For every row, I checked these with the repo's own `rebind.py` extract and `ledgerfix/bindings.digest`:

- the target is a unique current unit;
- the ancestry matches;
- the recomputed `bindingSha256` matches;
- the placement content and its previous/next neighbours match current bytes;
- `supersedesBinding` equals the `s11-preflip-carries.json /unitCarries/<n>` row it names.

All 25 rows are `new-or-changed-candidate-unit` carries. They follow the metadata fence that `30ed2bbf4` added at the top of 4 candidate docs.

- **17 rows only moved ordinals** and are byte-identical. They are 4, 5-9, 12-18 and 21-24.
  - 5 of them carry claim ids: `claim_a9bc0a5c`, `claim_ef20fa89`, `claim_5eb3738c`, `claim_b96048ae` and `claim_80498f2c` (rows 5-9, `non-transitioning-records.md` blocks 4-8). In each, the live `docs/specs/work-state.md` source unit is byte-equal to the target unit.
- **4 heading rows changed digest** (0, 2, 10, 19). The heading text and ancestry are identical; the digest changed because the section payload changed.
- **4 first-block rows changed digest** (1, 3, 11, 20):
  - each still carries its Owner/Status lines (and Source, for the vendored-parser file);
  - each gained a "Related links" line;
  - each old "Document type: …" line moved verbatim into the new fence (`unheaded-block-1`).

  No carried text was lost. **Info:** none of the 4 new fence blocks is bound by any ledger row.

## C. 25e8842d3, misc-fix receipt counts: APPROVE (1 Low note)

- **The counts match the data at 25e8842d3.** The receipt's 2,574 / 1,416 / 959 / 137 / 2 / 162 / 163 equal `misc-fix/checks.json` `counts.byResult`. The totals also hold: 5,413 overall, 3,990 confirmations, 1,260 parks and 1,423 open rows.
- **The example counts match too.** 57 = 55 `explicit-path-placeholder` + 2 example framing, in `preserve-premise/proof.json`. The 51 rows moved from park to confirmed are in `sentence-delta.json` (53 rows in all).
- **The other REWORK items are done.** The "does not admit new marker-free rows" sentence is gone, and L13-9.3 records the acceptance.
- **Low.** This comes from later commits, not this one. At HEAD, the newer "Current G6 fixes" table (2,926 / 1,394 / 623 / … / repoint 6) matches HEAD `checks.json`. But the older "Sentence-scope wave" section below it still says "the tables above … are superseded" and "This section supersedes …". Relabel that section as historical.

## Commands

- Host, read-only. No git writes, no fgos CLI, no suites, no `audit-report.py`.
- Native addons were blocked in every node process.
- Scratch was a mktemp directory under `/tmp/fgos-work/`, removed at the end.
- The worktree is clean apart from these two reports.
