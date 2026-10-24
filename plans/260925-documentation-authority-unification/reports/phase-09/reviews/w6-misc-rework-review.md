# w6 misc rework review (commit 9d6070828)

10 APPROVE / 1 REWORK. Full verdicts: [w6-misc-rework-review.json](w6-misc-rework-review.json). Brief: [w5-misc-rework-brief.md](../w5-misc-rework-brief.md). Prior review: [w5-misc-fix-review.md](w5-misc-fix-review.md).

## How I checked
- I made a shared clone under `/tmp/fgos-work/w6-misc-rereview/`, detached it at the input HEAD `4178dcc6e`, and laid the 18 files of `9d6070828` over it. That reproduces the Doer's working tree. I changed only the hardcoded scratch path, in five scripts.
- `proof.py --pin 4178dcc6e` twice: both runs exit 0, stdout is identical, and all four artifacts (proof, judgments, retire-with-tree, history-wrapper-proposals) are byte-identical to each other and to the committed bytes.
- `rebind.py --check` exits 0 (283 effective bindings, 27 overlays). `misc-fix/verify.py` exits 0. Its regenerated `checks.json` differs from the committed one only in two random temp-dir names.
- `preserve-premise/verify.py --pin HEAD` exits 1 on the early G2 pin assertion. To confirm that is the only cause, I ran a scratch variant. It drops the G2 census replay and the G2 pin-equality lines, and checks the G2 Rust test locators at the G2 pin `3d0169f39`. Every other G2 and G6 assertion is unchanged. The variant exits 0. One thing to know: the G2 refresh is more than re-pinning. At `4178dcc6e`, 33 G2 owning-proof locators no longer point at a `#[test]` line. They are in `packages/git/rust/tests/{inspect,recovery_matrix,scoped_commit_sync}.rs`.
- I counted the registry myself in `src/setup/registrations.mjs`: 136 unique literal `registerCheck({ id: '…' })` calls plus one loop at line 6340 with 5 Git ids, so 141 in total. `git grep '133 literal'` at `9d6070828` now finds the phrase only in the old review and brief text. The older "143 / 135+8" copies are pre-`bc5589ed7` historical records (resync-a, import2, ledgerfix).
- `git diff --name-only 4178dcc6e 9d6070828`: all 18 files are inside the brief's writable list.

## Approved
- **Doctor split:** the s13 block-5 reason, all 8 s17 block-90 reasons and the `rebind.py` generator now say "136 literal plus 5 loop-registered Git ids". `misc-fix/verify.py` derives both numbers from source and asserts 136, 5, disjoint ids, a single loop, and a total of 141.
- **Nine rows** (f00166, f03953, f07667, f08643, f08645, f08668, f08681, f08748, f08817) are parked with no evidence. None of their bound lines carries an example marker; I checked each line.
- **The 25 rows that lost framing** all returned exactly to their pre-W4 result (`ad94156cf~1`): 9 parks and 16 stable-operand rows.
- **Replay and verifiers:** both are covered under "How I checked" above. The combined verifier is blocked only by the G2 refresh.

## Adjudication: the four stable-operand rows
The four rows are f00445, f08621, f08646 and f08700. **My recommendation is to accept `preserve-operand-reachability-unchanged`.** All four are real, dereferencing citations. Each operand exists at `4178dcc6e` and after the physical move (`beforePresent`/`afterPresent` are true, with no wildcard or unsafe literal):
- `docs/history/tsk-65q-gate-bypass-global-install-resolution/RESEARCH.md`
- `docs/history/iron-law-gate-human-ux/CONTEXT.md`
- `docs/history/tsk-3bn-merge-conductor-harness-v2/plan.md`
- `docs/history/fanout-and-delegation-rubric/CONTEXT.md`

That was also their pre-W4 result. The intent of "do the same" was to remove the false example framing, and that is done. Parking a live pointer that still resolves would contradict the separate, previously reviewed stable-operand rule.

## REWORK
1. **"Line-scoped" is not sentence-scoped on long markdown lines, and f07821 is still falsely example-framed.** `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:67` is a single 4,076-character line.
   - f07821's span is at column 939: "RANH GIỚI (per `0032`, `docs/history/iron-law-gate-human-ux/CONTEXT.md`)". This is a real citation of the same file as f08621.
   - It is confirmed `explicit-external-or-example-framing` by a "ví dụ" at column 494. That marker belongs to a different sentence, about `evolve --submit`.
   - W4 introduced this false framing; before W4 the row was `preserve-operand-reachability-unchanged`.
   - The same off-sentence marker is what lets f07822 (placeholder at column 2945) reach the placeholder branch. On `work-state/spec.md:85`, f08072's marker sits in a different table cell.

   **Fix:** in `proof.py`, search for the marker only in the sentence or table cell that contains the span's columns. Use `|` cell bounds, and split sentences on `. `, `; ` and `—` around `columnStart`. Then accept a `<placeholder>` inside the span text itself as evidence on its own when the reason says "illustrative", so f07822 and f08072 stay confirmed without borrowing a marker. Add a negative control with the marker on the same physical line but in a different sentence. Assert that f07821 becomes `preserve-operand-reachability-unchanged` with `evidence: null`, rerun the double replay, and update the before/after counts in both receipts. The expected result is 5 framed rows, and stable-operand rises by 1.

## Notes
- The new same-unit negative control is real: the old whole-unit predicate would have framed it, because its reason matches "literal example" and `currentUnit` holds the `e.g.`.
- Not run: npm/cargo suites, the fgos CLI and impact analysis (all forbidden).
