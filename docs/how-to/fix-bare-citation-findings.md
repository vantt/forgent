---
authoritative_for: fixing a bare-citation finding, check-decision-citation-drift.mjs fix contract
---

# Fix a `bare-citation` finding

`check-decision-citation-drift.mjs` flags a `bare-citation` finding when a
line cites an `ADR<n>`/`RUL<n>` id with no one-line gloss right after it
(`tsk-37i` D3). `tsk-2yu-1` fixed 124 of these in `docs/specs/work-state.md`
as the calibration slice for the larger citation-baseline cleanup — see
`docs/explanation/citation-baseline-cleanup-calibration-slice.md` for why
this specific slice was chosen.

## The fix, mechanically

Add a parenthetical one-line gloss immediately after the bare id, in the
shape `"<ID> (<one-line gloss>)"`:

```diff
- ... xem RUL45
+ ... xem RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)
```

```diff
- Mở rộng (per work-graph-intelligence S2a / record ADR0012)
+ Mở rộng (per work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất))
```

## Where the gloss text comes from — never invented

The gloss is the id's own canonical title, sourced from wherever that
rule/decision is actually defined:

- Most `RUL<n>` ids: the rule's own heading/title in the same spec doc
  citing it.
- A cross-spec `RUL<n>` reference: the rule's home spec (e.g.
  `docs/specs/runner.md` for a rule defined there but cited from
  `work-state.md`).
- `ADR<n>` ids: `docs/decisions/index.md` (the generated decision index).

This needs a real read of what the id actually means — it is not a
mechanical template fill, even though the *shape* of the fix (add
`"(...)"` after the id) is uniform. A wrong or misleading gloss silently
misinforms a future reader, so the checker only detects *absence* of a
gloss, never *correctness* of its text — a human/agent spot-read of a
sample of the added glosses against the real id they describe is still
needed after the mechanical pass.

## Regenerating the baseline afterward

```bash
node scripts/check-decision-citation-drift.mjs \
  --decisions-dir docs/decisions --backlog docs/backlog.md \
  --specs-dir docs/specs --skills-dir .agents/skills \
  --skills-dir plugins/fgOS/skills --write-baseline
```

`--write-baseline` re-snapshots every current finding — since the
baseline is keyed by full line content (not just id + line number), fixed
lines simply drop out and any `d-local-outside-home` finding sharing the
same line shifts its own baseline key without changing in substance
(confirmed live: `tsk-2yu-1`'s run dropped the baseline from 1788 to 1664,
exactly the 124 `bare-citation` findings fixed, with `d-local-outside-home`
entries on those same lines untouched in content).

## Not the same fix as `d-local-outside-home`

A `d-local-outside-home` finding (a `D<n>` id cited outside its own home
`CONTEXT.md`) is NOT fixed this way — per decision 0017, the only correct
fix for that kind is inlining the actual decision content at the citing
location and deleting the id entirely, a heavier per-occurrence effort
than adding a gloss. Do not mix the two fix kinds in one pass; see the
calibration-slice doc above for why keeping them separate matters for
planning the rest of a citation cleanup backlog.
