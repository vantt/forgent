# Preserve-premise rework receipt

Status: **G6 scoped replay passes; assignment blocked, combined G2/G6 verification fails.** No gate accepted or independent approval claimed.
Current source pin: `4178dcc6e3445d5d9b8ffd55963cdd02a418af73`.
This replaces the W2/W4 receipt's predicate, counts and verification claim.
Read first: [current brief](../w5-misc-rework-brief.md), [full receipt](../misc-fix/receipt.md), [G6 double replay](../misc-fix/checks.json), [combined failure](verification.json), [row delta](../misc-fix/rejudgment.json).

## Predicate and controls

Example markers are searched only on the physical `currentLines` of the bound spans, not the expanded `currentUnit`. A new negative control puts an `e.g.` on a different line **within the same unit**: it parks with no evidence. All three existing negative controls and both existing positive controls remain; a third positive control checks citation of the bound placeholder. Physical-move controls remain unchanged.

For already line-framed rows, a placeholder in the path is cited preferentially. f07822 now cites `docs/history/<id>/iron-law-evidence.md` / `<id>`, not the unrelated `ví dụ` about `evolve --submit`. This citation refinement does not add marker-free confirmations.

## Before and after

Before: delivered W4 proof at `23f6eaccf5eb195a8f50e5788d38f386a901b6d2`. After: current source pin above.
All **5,413** final preserve identities (4,804 + 609), **38** separate retire-with-tree exclusions, **136** catalog batches and **27** zero-edge batches remain conserved.

| Result | Before | After |
|---|---:|---:|
| Source-confirmed history/provenance/carriage | 2,549 | 2,524 |
| Stable operand reachability | 1,399 | 1,415 |
| Park: unconfirmed premise | 1,001 | 1,010 |
| Park: unbound passage | 137 | 137 |
| Park: absent source | 2 | 2 |
| Park: source removed by physical cutover | 162 | 162 |
| Proposed dated wrapper note | 163 | 163 |
| Example-framed evidence, including placeholder citations | 31 | 6 |

Nine rows return to parked with no evidence: **f00166, f03953, f07667, f08643, f08645, f08668, f08681, f08748, f08817**.

**Qualification requiring Lead adjudication:** f00445, f08621, f08646 and f08700 also lose the false framing evidence, but become `preserve-operand-reachability-unchanged`, not parks. Their exact named operands survive before/after the physical move; the existing stable-operand branch remains intact. Twelve other rows behave likewise. No historical/external semantics or runtime parity is claimed for these 16. The brief's literal “do the same” parking expectation is therefore not claimed satisfied for those four rows.

The five previous named rows still confirm by the line rule: f00167 (`e.g.` / `<feature>` on line 840), f08807 (`e.g.` on line 852), f07822 (`<id>` on framed line 67), and f08072/f08073 (`ví dụ` / path convention on docsRef line 85). f07697/f08033/f08047 remain parked with self-successor exclusions and no candidate self-links.

The result is **3,939 bounded confirmations + 1,311 parks + 163 dated-note proposals = 5,413**, not a green G6 gate. `judgments.json` indexes **1,474** open rows. Owning assertions still cover all earlier live-pointer counterexamples, five deleted consumers, 163 wrapper positions and 73/73 named review-batch files.

## Replay and blocker

`proof.py --pin HEAD` exits **0**. `misc-fix/verify.py` exits **0** and runs the proof twice in isolated scratch directories: stdout and all **four G6 artifacts** are byte-identical and equal to delivered bytes. It runs the owning G6 assertion section from `verify.py` verbatim rather than duplicating the cases. Commands and hashes: [checks.json](../misc-fix/checks.json). `git diff --check` exits **0**.

`preserve-premise/verify.py --pin HEAD` exits **1**: it is the combined G2/G6 verifier, and the delivered G2 census remains pinned to `3d0169f390e21c67bc3fc69081fd1bc07186599f`. Its pre-existing pin-equality condition now fails early. The G2 checks were **not removed or skipped** to get green. [verification.json](verification.json) records the actual stderr, failed command and out-of-scope `needsWrites`. The G2 owner must refresh its four artifacts and its old scratch-path restriction in `census-join/join.py`, then rerun the combined proof. Neither a G2 refresh nor the brief's both-exit-0 requirement is claimed complete.

## Handoff boundaries

- Doctor correction is **136 literal plus 5 loop-registered Git ids**, total 141 checks / 32 fixes; all nine reason copies and the generator agree. Historical `resync-a/adjudications.json` still says 143 outside scope.
- Lead residuals, untouched: `docs/distribution-vision.md:87` and `docs/explanation/iron-law-classification-recipe-path.md:45` still describe `git rev-parse --git-common-dir`.
- No pair accounting, manifest/gate-register edit, Git mutation, fgOS CLI/lifecycle, secrets, product source change, full npm/Cargo suite, service or preview. Scratch is only `/tmp/fgos-work/w5-misc-rework/`. Impact-analysis: degraded/unqueried under no-CLI/no exposed GitNexus tool; preview deferred to Lead. No component-boundary or product behavior change.
- Independent review, final-pin replay, park/note/repoint co-composition and post-merge accounting remain Lead custody. See the full receipt for prior art and unchanged binding witnesses.
