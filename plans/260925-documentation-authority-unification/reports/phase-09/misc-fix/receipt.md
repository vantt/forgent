# Miscellaneous rework receipt

Status: **scoped corrections verified; assignment blocked on the combined G2/G6 verifier.** No gate accepted or independent approval claimed.
Input HEAD: `4178dcc6e3445d5d9b8ffd55963cdd02a418af73`.
Read first: [brief](../w5-misc-rework-brief.md), [review](../reviews/w5-misc-fix-review.md), [checks](checks.json), [rejudgment delta](rejudgment.json), [combined failure](../preserve-premise/verification.json).
This receipt supersedes W4's counts and whole-unit example predicate, not its doc edits or immutable binding witnesses.

## Doctor and bindings

- Corrected the block-5 reason in `s13-resync-a.json`, all eight block-90 reasons in `s17-misc-review-fixes.json`, and their `rebind.py` generator to **141 checks: 136 literal plus 5 loop-registered Git ids; 32 fixes**. Totals before/after remain 141/32; the previous split was false.
- `misc-fix/verify.py` now derives literal ids and loop ids from `src/setup/registrations.mjs`, asserts 136/5, unique/disjoint ids, one five-id Git loop, and agreement with the reused owning enumerator. The five ids are `git-worktree-recovery`, `git-component-compatible`, `git-repository-config`, `git-operation-journal`, `git-native-locks`.
- Replayed the existing dual extractors and four-key sorted compact JSON + LF binding recipe at the original W4 preimage pin. **283 effective bindings checked; 27 existing overlays unchanged (21 content, 6 neighbour-only)**. Regenerating the shard changed exactly eight disposition reasons; no binding hash, placement, predecessor or witness changed. All review statuses remain pending; no rebind or gate-register edit was needed.
- Known stale historical copy: `resync-a/adjudications.json` still says **143**. It is outside scope and was not edited; `s13`/the effective overlay records carry the correction.

Prior art: W4 `ad94156cf` widened example matching; `b25dadae2`/`bade6b6b3` own exact binding and premise checks. Registry history and `bc5589ed7` were inspected: its integrated registry already has the smaller five-id loop. This turn extends those mechanisms; it does not change setup/doctor product behavior or component boundaries.

## G6: line-scoped evidence

`historical_evidence()` receives all bound `currentLines` and searches **only those physical lines** for example markers. Expanded `currentUnit` remains a source witness, never the example search surface. The added negative control has a marker on the next line **inside the same unit** and parks. The three older negative controls still reject; the two older positive controls remain, plus one placeholder-citation control. No cases were retired.

Where a line is framed and the path itself has a placeholder, the evidence cites that path/placeholder instead of a distant same-line marker. This does **not** admit new marker-free rows. In particular f07822 now cites `docs/history/<id>/iron-law-evidence.md` / `<id>`, not the unrelated `ví dụ` about `evolve --submit`.

All **5,413** identities (4,804 Step 3 + 609 Step 4), **38** retire-with-tree exclusions, **136** catalog batches and **27** zero-edge batches are conserved. Before is the delivered W4 proof at `23f6eaccf`; after is the input HEAD above.

| Result | Before | After |
|---|---:|---:|
| Source-confirmed history/provenance/carriage | 2,549 | 2,524 |
| Stable operand reachability | 1,399 | 1,415 |
| Park: unconfirmed premise | 1,001 | 1,010 |
| Park: unbound passage | 137 | 137 |
| Park: absent source | 2 | 2 |
| Park: source removed by cutover | 162 | 162 |
| Proposed dated wrapper note | 163 | 163 |
| Example-framed evidence (including path-placeholder citations) | 31 | 6 |

Nine rows return to `park-unconfirmed-preserve-premise`, with no evidence: **f00166, f03953, f07667, f08643, f08645, f08668, f08681, f08748, f08817**.

**Explicit qualification to the brief's “do the same” request:** f00445, f08621, f08646 and f08700 lose all example/history evidence, but are **not parked by the existing premise contract**: their exact operands exist before and after the physical cutover, so they become `preserve-operand-reachability-unchanged`. Twelve other rows take the same route. This is bounded reachability, not historical/external semantics or runtime parity. Forcing these into parks would change the separate stable-operand rule; that was not silently done. The Lead should adjudicate this wording/expectation before accepting the rework.

The five prior named rows still confirm under the line rule:

| Row | Source-bound evidence |
|---|---|
| f00167 | Line 840 has `e.g.`; citation is its `docs/history/<feature>/` placeholder. |
| f08807 | Line 852 has `e.g.` immediately before the path-token example. |
| f07822 | Line 67 is framed; evidence re-cites the path's own `<id>` placeholder. |
| f08072 | docsRef line 85 has `ví dụ`; citation is its `<feature>` path. |
| f08073 | Same docsRef line 85, explicit `ví dụ` value. |

The three self-successor rows stay parked with no candidate self-link. All existing live-pointer, removed-consumer, wrapper-position (163 lines / 73 review-batch files), physical-move and identity assertions pass via the unchanged scoped assertion-extraction door. **3,939 bounded confirmations + 1,474 open judgment/note rows** remain, not a green G6 gate.

## Verification and blocker

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/misc-fix/rebind.py --check
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/proof.py --pin HEAD
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/misc-fix/verify.py
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/verify.py --pin HEAD
```

The first three exit **0**. The scoped verifier runs `proof.py --pin <HEAD>` twice in isolated scratch directories; stdout and all four artifacts are byte-identical and equal to delivered bytes. Hashes/commands are in [checks.json](checks.json). It executes the owning G6 assertion section from `preserve-premise/verify.py` verbatim. `git diff --check` passes.

The last command exits **1**, not 0. The combined verifier also requires G2's delivered artifacts at the same pin; those remain pinned to `3d0169f390e21c67bc3fc69081fd1bc07186599f`. The same pre-existing pin equality now fails early, before scratch work. **No G2 assertion was removed, disabled or downgraded to manufacture a passing verifier.** G2's `join.py` also hardcodes the previous scratch directory. Completion therefore needs the owning turn to update these out-of-scope paths (none was written):

- `reports/phase-09/census-join/join.py` (scratch plumbing)
- `reports/phase-09/census-join/{join,residue,post-pin-literals,post-pin-dynamics}.json` (current-pin replay)

All paths above are under `plans/260925-documentation-authority-unification/`. Full `needsWrites` paths and actual stderr are in [verification.json](../preserve-premise/verification.json). G2 refresh may expose further owning-proof work; this turn does not predict or certify its success. The brief's both-verifiers-exit-0 requirement is **unmet**.

## Residuals and boundaries

- Lead residual, untouched: `docs/distribution-vision.md:87` and `docs/explanation/iron-law-classification-recipe-path.md:45` still say `git rev-parse --git-common-dir`. The former is a dated code reading; the latter needs its owning review.
- No pair accounting or manifest/register write: Lead handles it after merge. Independent G6 review, final-pin replay, all parks and wrapper co-composition remain open.
- Scratch only `/tmp/fgos-work/w5-misc-rework/`. No Git mutation, fgOS CLI/lifecycle, secrets, product source, full npm/Cargo suite, product test, setup/doctor execution, service or preview. Impact-analysis: **degraded/unqueried** (CLI forbidden, no exposed GitNexus tool). Markdown preview deferred to Lead to avoid extra service state. No user-visible product behavior change or component-boundary change.
