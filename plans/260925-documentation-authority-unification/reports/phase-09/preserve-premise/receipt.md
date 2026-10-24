# Sentence-scoped preserve-premise receipt

Status: **Scoped work complete; combined G2/G6 remains blocked on the G2 final pin.** No gate acceptance, authority flip or independent approval is claimed.
Source pin: `4178dcc6e3445d5d9b8ffd55963cdd02a418af73`; checkout HEAD: `77bdddccbdb42fa9193088095bdeb9a143eec671`.
Read first: [brief](../w6-misc-sentence-brief.md), [review](../reviews/w6-misc-rework-review.md), [double replay](sentence-replay.json), [row delta](sentence-delta.json), [verification](verification.json).

## Predicate and prior art

Reused `historical_evidence`, exact span binding, the physical-move simulator and the owning G6 assertions. `git log -S'bound_text'` identifies `9d6070828` as the change from expanded-unit to physical-line framing; `ad94156cf` introduced the overbroad whole-unit rule. This changes only the missing sentence/cell boundary, not the stable-operand rule or the earlier carriage/provenance rules.

The marker search now resolves the span's exact `columnStart` (or a unique exact occurrence), then searches only the containing section bounded by `|`, `. `, `; ` and `—`. The abbreviation `e.g.` is kept intact, so its final dot does not erase the example marker. Ambiguous column fallback supplies no evidence. A placeholder **inside the bound span** is independently sufficient when the reason says `illustrative`; a marker elsewhere is unnecessary. A locally framed placeholder retains the existing preferred placeholder citation.

Ten negative controls include the four previous controls plus same-line markers across each sentence separator, a different table cell, a duplicate path selected by column, and a marker-free placeholder without an illustrative reason. Five positive controls retain the original three and add marker-free and cross-cell illustrative placeholders. The owning verifier reuses the predicate, not a second sentence splitter. All earlier live-pointer, removed-consumer, self-successor and wrapper assertions still pass.

## Lead ruling and named rows

**A42 is recorded as settled:** f00445, f08621, f08646 and f08700 retain `preserve-operand-reachability-unchanged`, with `evidence: null`. They are real citations whose targets exist at the source pin and after the move; this is also their pre-whole-unit result. No further adjudication is requested.

**f07821** at `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:67`, column 939, is now `preserve-operand-reachability-unchanged`, with `evidence: null`. The owning verifier asserts its identity, result and null evidence. The unrelated `ví dụ` no longer frames it.

f07822 still cites `docs/history/<id>/iron-law-evidence.md` / `<id>`, and f08072 cites `docs/history/<feature>/` / `<feature>`, through their own illustrative placeholders, not borrowed markers. All five previously named confirmations (f00167, f08807, f07822, f08072, f08073), nine named parks and three self-successor parks remain covered.

## Real counts, not the expected five

The brief expected example/placeholder evidence to fall from 6 to 5. **The actual general rule produces 57 evidence rows:** 55 placeholder citations and 2 local example markers. Besides f07822/f08072, the population contains **52 other previously unframed illustrative placeholders**: 51 formerly unconfirmed parks now confirm, while f03419 remains `park-source-removed-by-cutover` despite its new placeholder evidence. Thus 56 of the 57 evidence rows are confirmations; source removal still wins over evidence. Restricting the standalone-placeholder rule to two named IDs would introduce a whitelist and contradict the requested rule. All **53** evidence/result changes are enumerated in [sentence-delta.json](sentence-delta.json).

Baseline is the delivered line-scoped proof in checkout HEAD, not the older whole-unit proof. Both baseline and replay prove the same source pin.

| Result or measure | Before | After |
|---|---:|---:|
| Source-confirmed history/provenance/carriage | 2,524 | 2,574 |
| Stable operand reachability | 1,415 | 1,416 |
| Park: unconfirmed premise | 1,010 | 959 |
| Park: unbound passage | 137 | 137 |
| Park: absent source | 2 | 2 |
| Park: source removed by physical cutover | 162 | 162 |
| Proposed dated wrapper note | 163 | 163 |
| Example/placeholder evidence rows (all results) | 6 | 57 |
| Bounded confirmations | 3,939 | 3,990 |
| Total parks | 1,311 | 1,260 |
| Open judgment/note rows | 1,474 | 1,423 |

Conserved: **5,413 identities = 4,804 + 609**, **38** retire-with-tree exclusions, **136** catalog batches, **27** zero-edge batches and the full **130 + 33** batch-directory population. **3,990 + 1,260 + 163 = 5,413**. The 163 wrapper positions and 73/73 review-batch files remain covered.

**Handoff for the parallel `misc-fix/receipt.md` owner (file untouched):** replace the current G6 totals with 2,574 source-confirmed, 1,416 stable operands, 959 unconfirmed parks, 3,990 bounded confirmations, 1,260 total parks, 1,423 open judgment/note rows, and 57 example/placeholder evidence rows (56 confirmed, one removed-source park). Replace the unresolved four-row qualification with the settled A42 ruling above. The count difference is the general standalone-placeholder rule, not extra borrowed markers.

## Commands and evidence

- `proof.py --pin 4178dcc6e`: exit **0**. Two additional isolated runs with that exact pin also exit **0**; stdout and all **four artifacts** are byte-identical between runs and equal to delivered bytes. Commands, sizes and SHA-256 values: [sentence-replay.json](sentence-replay.json).
- `misc-fix/verify.py` executed with scope-only scratch plumbing: exit **0**. It repeats the double replay, checks 283 bindings / 27 overlays and the 136 literal + 5 loop-registered doctor checks / 32 fixes, and executes the entire owning G6 assertion section. Since the original writes `misc-fix/checks.json` and uses an old scratch root, its compiled adapter redirects that output to [misc-checks.json](misc-checks.json), redirects scratch (including read-only `rebind.py --check`), and fixes the source pin to `4178dcc6e` instead of moving HEAD. No assertions changed. The exact adapter source is embedded in [verification.json](verification.json).
- **Unmodified fail-closed path:** `preserve-premise/verify.py --pin HEAD` exits **1**, only at its early G2 pin-equality assertion. Actual argv/stdout/stderr are in [verification.json](verification.json). HEAD is used for this combined check because it includes later intentional source changes; the G6 replay above remains at the brief's requested historical pin.
- To inspect the remaining checks, a **diagnostic only** scratch variant uses delivered G2 sources at `3d0169f390e21c67bc3fc69081fd1bc07186599f` and G6 sources at `4178dcc6e`. Like the reviewed probe, it does not replay G2 or assert a shared pin; all other G2/G6 assertions run unchanged and exit **0**. The full diagnostic patch and its caveat are in [verification.json](verification.json), with output in [historical-pin-diagnostic.json](historical-pin-diagnostic.json). This is **not** a combined-verifier pass or proof that merely editing the G2 pin is sufficient.
- The G2 refresh includes **33 stale Rust proof locators** at the requested G6 pin, in `packages/git/rust/tests/{inspect,recovery_matrix,scoped_commit_sync}.rs`. The exact rows are recorded in `verification.json`. This is part of the known G2 final-pin item, not a G6 failure. No other diagnostic assertion fails.
- `git diff --check`: exit **0**.

## Boundaries

Only `preserve-premise/**` changed. `misc-fix/**`, decision files and census artifacts were not written. No Git mutation, fgOS CLI/lifecycle, `.fgos/` workspace access, secrets, product-code edits, product test suites or services. Scratch is exclusively `/tmp/fgos-work/w6-misc-sentence/`. Impact-analysis: degraded/unqueried (brief forbids the capability CLI; no exposed GitNexus tool). Markdown preview remains Lead custody to avoid extra service/state writes. Final-pin G2 refresh/replay, independent review and gate acceptance remain with Lead.
