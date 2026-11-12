# HARDEN known-reds: V7n overrides and document-identity glosses

Branch `harden/known-reds`, base origin/main 1bfad3b09. Owner decisions 2026-11-12 23:33, both option (a).

## V7n addendum
- Method (from 3bbbd315f, 0a6816281): the addendum records a plain sha256 of each file's bytes; only the hash strings for the changed files move, nothing else in the JSON.
- Changed: `overrides` for `packages/mailbox/contracts/frame.v1.txt` (2b40708f... -> 186a6617...) and `limits.v1.json` (24d1bc34... -> 2165b846...). Hashes taken with `sha256sum` on the worktree files.
- Untouched: every `added` measurement-module hash, `adapters.v1.json`, all other fields.
- Why they drifted: mailbox body-in-ref and acknowledgement work (340c86f9a, 4afb59cef, 806fb36c6). The owner re-attests the freeze against the contracts as they stand after that work.

## Citation drift
- `docs/platform/documentation/subcomponents/document-identity/spec.md` lines 52, 206, 207, 550 (RUL84 twice).
- Glosses reused from other docs: D-ADR0055 "event log as sealed changesets on per-machine refs", RUL84 "one write-scope matcher", D-ADR0035 "the fgOS mission boundary". The checker needs the ID directly followed by `(`, so the backticks around the IDs in the two table cells were dropped; line 550's second sentence was reworded so the gloss is not repeated.
- Checker and baseline not touched ("no new findings (57 baselined)").

## Gates
- run-tests: mailbox-behaviour-v7n, check-decision-citation-drift, doc-health: 44 pass, 0 fail.
- Full `npm test` through the queue (log `/dev/shm/known-reds-full-233554.log`): 8859 tests, 8828 pass, 0 fail, 0 cancelled, no ERROR lines, 0 known reds. No load flake appeared.

## Authority
none.

## Lessons
- A gloss check wants `ID (gloss)` adjacent; markdown code spans around the ID defeat it. Test with the checker script, not by eye.
