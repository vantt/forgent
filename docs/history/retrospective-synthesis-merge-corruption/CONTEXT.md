# CONTEXT.md — retrospective-synthesis-merge-corruption (tsk-2oy)

## Feature boundary

tsk-2oy fixes one confirmed instance of a real bug — tsk-4v6's actual code
fix (`687abfb8`) never reached `main` — plus the systemic root cause that
produced it: `fgos-coding-compounding`'s retrospective-synthesis step 3 runs a raw
`git commit` on the shared main checkout with no `MERGE_HEAD` guard, no
`.fgos/main-checkout.lock` acquisition, and no working-tree-clean
precondition. When a concurrent or crashed `fgos approve` merge is
staged-but-uncommitted at that moment, this step silently completes it and
mislabels it under the wrong item's own commit message, burying the other
item's real diff.

`docs/history/retrospective-synthesis-merge-corruption/RESEARCH.md` (round
1, 2026-08-11) already confirms this pattern in 5 commits reachable via
`git log --all --min-parents=2 --grep="retrospective synthesis"`:
`tsk-648`, `tsk-4v6`, `tsk-1q5`, `tsk-1vi`, `tsk-2x9`. One of these
(`tsk-2x9`'s synthesis commit, `45aa107f`) buried a genuine code fix
(`fix(tsk-1r3)`), the same severity class as tsk-4v6's own loss — not just
a docs-vs-docs collision.

In scope for tsk-2oy itself (revised, see D3):
1. Add a guard to the retrospective-synthesis commit step (`fgos-coding-compounding`
   step 3, `.claude/skills/fgos-coding-compounding/SKILL.md`) so it refuses (or
   safely stops) instead of silently absorbing a stray `MERGE_HEAD` — exact
   mechanism (skill-prose precondition vs. a code-level check) is
   `fgos-coding-planning`'s call, not decided here.
2. Report the audit findings already gathered in `RESEARCH.md` (the 5
   confirmed instances) as this item's own audit deliverable for requirement
   3 — see D2 below for why this is treated as already satisfying that
   requirement's scope.

Out of scope for tsk-2oy (see D1, D3): remediating the OTHER 4 items'
own corrupted retrospective-synthesis commits — filed as `tsk-67t`
(tsk-648, absorbed tsk-5nj), `tsk-4dy` (tsk-1q5, absorbed a `fgw/tsk-13m`
sync merge — possibly benign, needs real investigation), `tsk-3u8`
(tsk-1vi, absorbed tsk-66t), and `tsk-5z9` (tsk-2x9, absorbed
`fix(tsk-1r3)` — a real code fix, higher severity than the other three,
prioritize first); landing `fgw/tsk-4b2`'s real content on `main` (now
`tsk-13z` — a DIFFERENT bug, a manual `fgos move --to delivered` bypass
around two failed merges, not the stray-`MERGE_HEAD` corruption this item
investigates); and the `checkMergeStillResolves` decomposed-root gap (now
`tsk-5j0`).

## Locked decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | tsk-2oy's own remediation is scoped to **tsk-4v6 only** (merge its real tip + fix the pipeline root cause), not to also re-merge the other 4 items RESEARCH.md's audit already found with the same corruption. Each of those becomes its own follow-up work item. | tsk-2oy's own description names tsk-4v6 specifically for requirement (1)'s merge, and frames requirement (3) as "audit ... **to scope how widespread this is**" — scoping/reporting language, not a remediation mandate for every item the audit turns up. Pinned as a labeled assumption (not asked to a person) per RUL "release con người": the text itself already resolves it, asking would be a redundant interrupt. If this reading is wrong, the person can correct it at the Gate below or at `fgos-coding-planning`. |
| D2 | The audit for requirement (3) is treated as **already executed and sufficient** by `RESEARCH.md` round 1's `git log --all --min-parents=2 --grep="retrospective synthesis"` pass (5 instances found, full reachable history, not a bounded "recent" window) — `fgos-coding-planning`/`fgos-coding-implement` do not need to re-run a broader audit; they only need to (a) fix the root cause and (b) write the 5 findings into a durable, linkable artifact (this doc + RESEARCH.md already are that artifact) so the follow-up items in D1 have something concrete to point at. | The item's own wording said "recent" but gave no explicit boundary; a full-history `--all` grep is strictly more complete than any bounded "recent" window and was already cheap to run. Re-scoping narrower would throw away real evidence for no benefit. |
| D3 | tsk-2oy's own remediation is narrowed further, dropping the merge-`fgw/tsk-4v6` piece entirely: `fgos cleanup tsk-4v6` (run during Execute) correctly moved tsk-4v6 to `done`, since its real fix (`687abfb8`/`dbd31b42`) had already landed on its *parent* item's branch, `fgw/tsk-4b2` — confirmed via `git merge-base --is-ancestor dbd31b42 fgw/tsk-4b2`. No content was lost; tsk-4v6's own remediation is complete. But `fgw/tsk-4b2` itself has never reached `main` — filed separately as `tsk-13z`, because its cause is a DIFFERENT bug (a direct `fgos move tsk-4b2 --to delivered` bypass around two failed `fgos approve` attempts — `event seq 11979`, `role: human` — never a stray `MERGE_HEAD` absorption). A related harness gap found investigating (`checkMergeStillResolves` never validates a decomposed root's own branch against `main`, only children-onto-parent) is filed as `tsk-5j0`. tsk-2oy's own item `verify` is revised to drop the `git merge-base --is-ancestor 687abfb8 main` clause accordingly — that proof now belongs to `tsk-13z`. | Real evidence found mid-Execute (`fgos-coding-implement`), not a guess: `fgos cleanup tsk-4v6`'s own output, `git merge-base --is-ancestor` checks, and `.fgos/events.jsonl`'s real event history for tsk-4b2 (`seq 11979`). Splitting into 3 independent items (per user decision, not this session's own call) keeps each fix independently reviewable — tsk-2oy's own guard fix does not depend on either follow-up landing first. |

## Pinned terms

- **Stray-merge absorption** — the failure mode this item names: a plain
  `git commit` on the main checkout silently completing and mislabeling an
  unrelated, already-staged (`MERGE_HEAD`-present) merge left by a different
  process, because the committing step never checked for `MERGE_HEAD` first.

## Scout evidence

- `.claude/skills/fgos-coding-compounding/SKILL.md:121-128` — the only git write in
  the retrospective-synthesis flow: `git -C "$root" add ...` then
  `git -C "$root" commit -m "docs(<id>): retrospective synthesis"`. No lock,
  no `MERGE_HEAD` check, no clean-tree check.
- `src/runner/merge.mjs`'s `mergeRunnerItem` — the one other main-checkout
  writer in this codebase, and the one that DOES guard correctly:
  acquires `.fgos/main-checkout.lock` before its own
  `git merge --no-commit --no-ff` / `git commit` / `git merge --abort`
  sequence (lines 664-724).
- `docs/history/retrospective-synthesis-merge-corruption/RESEARCH.md` round
  1 — full evidence trail: commit hashes, parents, and the 5-instance audit
  table.
- Impact-analysis capability gate (per `CLAUDE.md`): `fgos tool query
  --capability impact-analysis --status present` → GitNexus registered and
  `present` → **full**. `fgos-coding-implement` must run real `impact()`
  calls before editing `fgos-coding-compounding`'s own commit-step logic (a prose
  skill file, but GitNexus indexes prose/skill files as part of this repo
  too) or `src/runner/merge.mjs` if the eventual fix touches it.

## Canonical references

- `.claude/skills/fgos-coding-compounding/SKILL.md`
- `src/runner/merge.mjs` (`mergeRunnerItem`, `acquireMainCheckoutLock` usage
  pattern to mirror)
- `docs/history/retrospective-synthesis-merge-corruption/RESEARCH.md`

## Outstanding questions

None
