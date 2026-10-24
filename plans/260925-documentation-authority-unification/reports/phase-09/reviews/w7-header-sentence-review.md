# w7 review: contract headers and sentence-scoped example evidence

**14 APPROVE / 2 REWORK.** Full verdicts: [w7-header-sentence-review.json](w7-header-sentence-review.json).
Commits: 30ed2bbf4 (headers, [brief](../w6-header-brief.md)), afb5bb35c (sentence scope, [brief](../w6-misc-sentence-brief.md)) and the Lead's 6c628b07e script edits. Review HEAD 0d468a225.

## How I checked
- **Headers.** I read the diff of the four docs. It has zero `-` lines, so no claim text was dropped. Each fenced `txt` block sits directly under the H1 and has all six fields, like the sibling `knowledge-registry.md`. Every Related path exists, and both anchors (`#lịch-sử-quyết-định`, `#0026--native-first-...`) resolve to real headings.
- **Check H.** I ran `env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=<release>/bin/fgos node --test test/scripts/doc-rationale-reproduction.test.mjs` in W. It passed 8/8, and that test asserts `checks.mjs` exits 0. `rebind/rebind.py --check` reports drift 0.
- **G6 replay.** `proof.py --pin 4178dcc6e --out /tmp/fgos-work/w7-hdr-review/x{1,2}` ran twice. Both exit 0, stdout is identical, and all four artifacts are byte-identical to each other and to the committed bytes.
- **Verifiers.** I ran them in a shared clone at 0d468a225 because `misc-fix/verify.py` writes `checks.json`. `misc-fix/verify.py` exits 0. `preserve-premise/verify.py --pin HEAD` exits 1 only at line 26, the G2 census pin.
- **G6 at HEAD.** I also ran `proof.py --pin 0d468a225`. The counts are identical. Only 4 rows differ (f00140–f00143, CHANGELOG.md), and only in line numbers and sha.

## Approved
- **Headers (4 docs).** The fields match each doc's body and owner. Owner, Status and Source lines are unchanged. The vendored-yaml pointer is marked superseded, not current guidance.
- **Sentence and cell scope.** The marker search runs only between the nearest `|`, `. ` (but not inside `e.g.`), `; ` or `—` around `columnStart`. If the span's column does not match, a unique exact occurrence is used; an ambiguous one gives no evidence.
- **Negative controls are real.** There are 10, including a marker in a different sentence on the same line, after a semicolon, before an em dash, and in a different table cell. All 10 park with evidence null.
- **Named rows.** f07821 is `preserve-operand-reachability-unchanged` with evidence null. f07822 (`<id>`) and f08072 (`<feature>`) are confirmed through their own placeholder, with an "Illustrative" reason. The four A42 rows stay stable-operand.
- **Placeholder rule.** Every placeholder-evidence row that lacks "illustrative" in its reason is f00167. That row has an in-sentence `e.g.`, so it would be confirmed by the marker anyway. The rule does not widen beyond the brief.
- **Counts.** The receipt's 2,574 / 1,416 / 959 / 57 equal the replay. The unexpected 51 extra confirmations are disclosed and listed in `sentence-delta.json`.

## REWORK
1. **The Lead's `misc-fix/verify.py` edit pins the replay but not the assertions that read it.**
   - Line 62 now replays G6 at `g6pin` (4178dcc6e).
   - Line 75 still writes `pin=HEAD` into the owning G6 assertion header. Its `source()` and the new `historical_evidence(raw, row['currentLines'], ...)` check therefore read HEAD blobs against line numbers recorded at 4178dcc6e. It passes today only because no evidence-row file shifted. The 4 CHANGELOG rows already shifted by 2 lines.
   - `checks.json` also records `sourceCommit` = HEAD and `sourcePinScope` = "G6 tracked source blobs at input HEAD". Both are false for the G6 part.
   - The pin change itself is correct and is not a weakening. Freshness against HEAD stays with the combined verifier (`verify.py:51` requires `proof.sourceCommit == pin`).
   - **Fix:** in line 75 use `repr(g6pin)` instead of `repr(pin)`. Add `g6SourceCommit=g6pin` to `result`, and reword `sourcePinScope` to "G6 replay and owning assertions at proof.json sourceCommit; registry/nav/rebind checks at HEAD". I tested the line-75 change in a scratch clone: it exits 0.
2. **`misc-fix/receipt.md` still carries the previous wave's numbers and claims.**
   - Lines 59–67 still say 2,524 / 1,415 / 1,010 / 6.
   - It still says "This does **not** admit new marker-free rows", which is now false: 51 marker-free placeholder rows went from park to confirmed.
   - It still asks the Lead to adjudicate the four rows, which A42 has settled.
   - The Doer's handoff in `preserve-premise/receipt.md` asked the Lead to apply these changes. 6c628b07e did not, and `owner-answers.md` L13-9 does not record that the Lead accepts the 6→57 divergence.
   - **Fix:** apply the handoff numbers to `misc-fix/receipt.md`: 2,574 / 1,416 / 959 / 3,990 / 1,260 / 1,423, and 57 example/placeholder rows. Replace the "does not admit new marker-free rows" sentence and the four-row qualification with the A42 ruling. Then add one line under L13-9 ruling 3 that accepts the general illustrative-placeholder rule and its 51 new confirmations, citing `sentence-delta.json`.

## Notes
- Side effects of running `misc-fix/verify.py`: its scratch root is hardcoded to `/tmp/fgos-work/w5-misc-rework` and `proof.py` still creates `/tmp/fgos-work/w6-misc-sentence`. I backed up and restored the two files it overwrites.
- Not run: npm/cargo suites, the fgos CLI and impact analysis (all forbidden). No git write was made in W.
