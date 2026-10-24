# Miscellaneous rework receipt

## Current G6 fixes (supersedes all earlier G6 counts and verifier status)

The L13-10 / `w8-g6-fix-brief.md` replay stays at source pin
`4178dcc6e3445d5d9b8ffd55963cdd02a418af73`. Current owning receipts:
[details](../preserve-premise/receipt.md), [per-row delta](../preserve-premise/fix-delta.json),
[double replay](../preserve-premise/fix-replay.json), [checks](checks.json).

| G6 result | Before | After |
|---|---:|---:|
| Source-confirmed history | 2,574 | **2,926** |
| Stable operand reachability | 1,416 | **1,394** |
| Park: unconfirmed premise | 959 | **623** |
| Park: unbound passage | 137 | 137 |
| Park: absent source | 2 | 2 |
| Park: source removed by cutover | 162 | 162 |
| Dated wrapper note | 163 | 163 |
| Explicit repoint result | 0 | **6** |
| Bounded confirmations | 3,990 | **4,320** |
| Total parks | 1,260 | **924** |
| Open rows (parks + notes + repoints) | 1,423 | **1,093** |

Conservation: **4,320 + 924 + 163 + 6 = 5,413** (4,804 + 609), plus the
unchanged **38** retire-with-tree exclusions. f07526 previously had a repoint
disposition hidden inside its park result; its result is now explicit, together
with the two dispatch siblings and three live-link repoints. The dispatch
four-line patch is prepared, not applied to docs.

All **15** reviewed operand bugs are corrected. All **25** removed-source rows
now name a concrete recheck holder and per-row reason, rather than printing an
empty successor list. New file-level evidence moves **137 distillery parks**
and **182 dated-report parks** to history; another **32 + 3** previously stable
rows gain that evidence. No live `docs/history/<feature>/` convention acquires
file-level historical framing. The 163 wrapper positions / 73 review-batch
files remain covered; later note placement/merging/dating is recorded but not
applied.

`misc-fix/verify.py` exits **0**, through the scratch-only adapter in
[verification.json](../preserve-premise/verification.json). It changes only
scratch plumbing (including its rebind subprocess), never assertions, pins or
repository output destinations. The entire owning G6 assertion section passes
verbatim, as do the 283 historical bindings / 27 overlays and 141 doctor checks
(136 literal + 5 loop-registered) / 32 fixes. Two independent final G6 runs also
prove **five** generated artifacts byte-identical, including the prepared patch;
the misc verifier itself compares its existing four outputs.

The **unmodified combined** `preserve-premise/verify.py --pin HEAD` exits **1 only
at the G2 delivered-pin assertion**, not a G6 assertion. G2 refresh/shared-pin
replay and gate acceptance remain with Lead. No G2 proof was bypassed. Earlier
receipts below remain historical, not current-green or current-count claims.
No Git mutation, fgOS CLI, docs/product edit, test suite or pair accounting;
scratch only `/tmp/fgos-work/w8-g6-fix/`. Impact-analysis degraded/unqueried and
preview deferred under the brief's no-CLI/no-extra-state constraints.

## Ownership rebind replay at 8cab0204d (supersedes current-green claims below)

`misc-fix/rebind.py` now reads historical decision JSON with `git show` at its
recorded pin `23f6eaccf5eb195a8f50e5788d38f386a901b6d2`, including the eight
packaging preimages. It no longer mistakes mutable direct rows for historical
inputs. All prior assertions remain; the same `check()` owns both CLI replay
and the rebind author's hypothetical-row preflight. Current overlay bytes,
predecessor resolution, binding hashes and pending review status are still
asserted. The unchanged dual extractors and binding recipe are reused.

- `misc-fix/rebind.py --check`: **0 before / 0 after** applying 217 direct rows;
  **283 effective historical bindings / 27 unchanged overlays** (21 content,
  six neighbour-only). The final checker also replays both row sets in memory.
- `misc-fix/verify.py`, scratch-plumbing-only replay: **1 before / 1 after**,
  `AssertionError: proof.json` at the unchanged three-way comparison of two
  generated runs and the delivered G6 proof. No G6 pin, artifact
  or assertion was changed to force green. The apply brief explicitly reserves
  this comparison and combined G2/G6 recomposition for the final-pin Lead.
- Consequently the request that this verifier exit 0 remains **unmet**, not
  silently waived. Its historical green below applies only to `4178dcc6e`.

Exact commands, exits and stderr: [rebind/checks.json](../rebind/checks.json).
Applied-row evidence, counts and review list: [rebind/receipt.md](../rebind/receipt.md).
No A/B, gate acceptance, combined-verifier success or independent review claimed.
Only scoped record tooling changed; no docs/code/default/dependency changed.
Scratch is confined to `/tmp/fgos-work/w5-rebind-apply/`. Preview is deferred to
Lead; no service/state write was made. Impact-analysis degraded: no live MCP
tool; an initial CLI query failed (127, no installation), and was not repeated
once the no-CLI brief had been read.

## Earlier rework receipt (historical evidence retained)

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

Where a line is framed and the path itself has a placeholder, the evidence cites that path/placeholder instead of a distant same-line marker. (Superseded by the sentence-scope wave below: an illustrative `<placeholder>` in the span is now evidence on its own.) In particular f07822 now cites `docs/history/<id>/iron-law-evidence.md` / `<id>`, not the unrelated `ví dụ` about `evolve --submit`.

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

**Explicit qualification to the brief's “do the same” request:** f00445, f08621, f08646 and f08700 lose all example/history evidence, but are **not parked by the existing premise contract**: their exact operands exist before and after the physical cutover, so they become `preserve-operand-reachability-unchanged`. Twelve other rows take the same route. This is bounded reachability, not historical/external semantics or runtime parity. Forcing these into parks would change the separate stable-operand rule; that was not silently done. Lead ruling L13-9 (A42): these four rows keep `preserve-operand-reachability-unchanged`.

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

## Sentence-scope wave (afb5bb35c, Lead update 2026-10-24 20:35)

The tables above show the line-scope wave and are superseded for counts. At `afb5bb35c`, with `proof.py --pin 4178dcc6e`, the counts are:
- source-confirmed history: **2,574**
- stable operand reachability: **1,416**
- park, unconfirmed premise: **959**
- park, unbound passage: 137
- park, absent source: 2
- park, removed by cutover: 162
- dated wrapper note: 163
- example or placeholder evidence rows: **57**

The jump from 6 to 57 comes from the general illustrative-placeholder rule: a span whose path holds a `<placeholder>` cannot point at a real file. That rule moved 51 rows from parked to confirmed, and every one is listed in `../preserve-premise/sentence-delta.json`. Lead accepted it under L13-9.

`verify.py` now replays the G6 artifacts and runs the owning G6 assertions at `proof.json`'s `sourceCommit` (recorded as `g6SourceCommit`). The registry, navigation and rebind checks run at HEAD.

Totals at `afb5bb35c`: **3,990 confirmations** (2,574 + 1,416) and **1,423 open rows** (1,260 parks + 163 dated notes). `verify.py` exits 0 (see `checks.json`), and the G6 replay runs `proof.py --pin 4178dcc6e`. This section supersedes the earlier statements that `verify.py` exits 1 and the exit-0 request is unmet (§ at the top), the "3,939 + 1,474" totals and the `--pin HEAD` replay description.
