# tsk-55h — Dọn nốt 2 finding còn lại của `check-decision-supersession.mjs`

## Feature boundary

After tsk-18t landed (checker now reads `superseded_by` as scalar or
list), running the checker for real still reports 3 findings, which are
really **two distinct problems** (not one):

```
$ node scripts/check-decision-supersession.mjs
check-decision-supersession: 3 finding(s):
  - 0027: supersedes frontmatter is not a clean list of ids -- check by hand
  - 0026: no row found in 0000-index.md (expected a "[0026]" anchor)  x2
```

**VAN DE A** — `docs/decisions/0000-index.md` is missing rows for 0026,
0027, 0028, AND 0029 (confirmed: `rg "\[002[6789]\]" docs/decisions/0000-index.md`
returns nothing). The checker only surfaces this for 0026 (twice, once per
supersede event) because it only scans the *targets* of a supersession, not
the whole directory — so the apparent "1 doc missing" is really 4. Add 4
rows to `0000-index.md` in the file's own existing table format (see rows
for 0002/0023/0025 for the "**Đã supersede bởi [00MM]**" convention). 0026's
row must state it was superseded TWICE — by 0028 (orchestrator→launcher
rename, STR72) and by 0029 (three vocabulary clauses). Whether the checker
should scan the *entire* `docs/decisions/` directory instead of just
supersession targets is explicitly out of scope — a separate item if
wanted, not a scope change bundled into this data fix.

**VAN DE B** — `0027`'s frontmatter carries `supersedes: [2ae492d8]`, a
capture hash (from `base-workflow-model` D1-D3), not a 4-digit decision
id. Semantically correct (0027 genuinely supersedes that capture), but
`classifySupersedes()` only recognizes `supersedes:` as an id-list or
"prose" (unparseable) — a capture-hash falls into "prose" today, producing
the "check by hand" finding. This item locks how to resolve that
ambiguity (see Locked decisions below).

Out of scope: fixing the `superseded_by` scalar/list read logic — already
done in tsk-18t.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | 0027's capture-hash supersession reference moves to a new `supersedes_capture:` frontmatter field. `supersedes:` keeps its existing meaning (decision-doc ids only, checked by `classifySupersedes`) unchanged — `scripts/check-decision-supersession.mjs` needs no code change for this. User chose this (option B) over teaching the checker a second "capture-hash" target kind (option A, rejected): a capture has no frontmatter of its own to verify a back-pointer against, so the checker would gain nothing by recognizing it as a valid target — keeping `supersedes:` single-purpose (decision ids only) is simpler and matches YAGNI. Confirmed by scanning all of `docs/decisions/*.md`: `0027` is the ONLY record using a capture-hash in `supersedes:` today, so this migration touches exactly one file. |

VAN DE A needs no separate D-ID — the item's own description already
fully specifies the fix (exact table format, exact content for 0026's
double-supersede note); it is a direct data-completeness fix, not an
open product decision.

## Pinned terms

- **capture hash** — an 8-char hex id (e.g. `2ae492d8`) referencing a
  compound-learning capture record, distinct from a 4-digit
  `docs/decisions/NNNN-*.md` decision id. `classifySupersedes()` has no
  notion of this term today; after D1, `supersedes_capture:` is the field
  that carries it.

## Scout evidence

- `scripts/check-decision-supersession.mjs:19-27` (`classifySupersedes`) —
  classifies `supersedes:` as `'ids'` (array of 4-digit strings),
  `'empty'`, `'prose'` (anything else, including a capture-hash array), or
  `'none'`. No third "capture" category exists.
- `scripts/check-decision-supersession.mjs:60-108`
  (`findSupersessionFindings`) — `'prose'` classification produces the
  "not a clean list of ids -- check by hand" finding; a `'missing-index-row'`
  finding fires per target with no `[<id>]` anchor row in `0000-index.md`.
- `docs/decisions/0027-...md:9` — `supersedes: [2ae492d8]`, the only
  capture-hash use of `supersedes:` found across the whole directory.
- `rg "supersedes:|superseded_by:" docs/decisions/*.md` — every other
  occurrence (0002, 0006, 0012, 0024, 0025, 0026, 0028, 0029) uses 4-digit
  decision ids; `0027` is the sole outlier.
- `rg "\[002[6789]\]" docs/decisions/0000-index.md` — zero matches,
  confirming 0026/0027/0028/0029 all lack an index row (VAN DE A).
- `tsk-5jb` (still `todo`, blocked on `tsk-3o3`/`tsk-3p1`) will create a
  second instance of this same capture-hash-supersession pattern later
  (a new record superseding capture `9c67c3d1`) — not yet landed, so it
  adds no second file to migrate today, but confirms the pattern recurs
  and D1's field-rename approach should hold for it too when it lands.
- `docs/decisions/0000-index.md` rows for 0002/0023/0025 — the existing
  "**Đã supersede bởi [00MM](...)**" convention this item's new rows must
  follow.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` returned
GitNexus `present` (freshly checked 2026-08-09). Posture: **full** per
`CLAUDE.md`'s gate, but not exercised in this clarify/decompose-handback
stage — no code is being read or edited here, only docs/decision
frontmatter and (per D1) zero lines of `scripts/check-decision-
supersession.mjs`.

## Canonical references

- `scripts/check-decision-supersession.mjs`
- `docs/decisions/0000-index.md`
- `docs/decisions/0027-domain-so-huu-status-doan-truoc-delivered-supersede-base-workflow-model-d1-d3.md`
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
- `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`
- `docs/decisions/0029-sua-dinh-nghia-roottask-subtask-capacity-t1-cua-0026.md`
- `docs/history/tsk-18t/CONTEXT.md` — parent item, explicitly deferred both
  findings this item now resolves.

## Outstanding questions

None
