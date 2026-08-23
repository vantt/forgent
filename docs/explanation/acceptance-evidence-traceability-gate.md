# Why `work.acceptance` gets a narrow write-time evidence-traceability check

## The failure this backstops

No judge function generates or touches `work.acceptance` — whichever
session is drafting it (during `fgos-coding-exploring`/`fgos-coding-planning`/
`fgos-coding-implement`) writes it by hand, and nothing checked whether a supplied
`evidence` string was actually true or traceable to anything real.

Confirmed failure: `tsk-d3c`'s own `acceptance` array asserted a root cause
("needs-plugin-registration") *and* an evidence citation for it at the same
time — both wrong, later disproven and corrected. It also undercounted the
affected skill set at 8 when the real directory held 9 (missed
`fgos-unlock`).

This is the sibling half of the judge-verdict evidence discipline work: the
other half (a second model judgment pass on `judgeDiscovery`/
`judgeDecompose`'s proposed `verify` string) is covered separately in
[`judge-verdict-second-pass-semantic-check.md`](judge-verdict-second-pass-semantic-check.md)
(`tsk-5q5-1`). Both mechanisms come from the same locked decisions
(`docs/history/judge-verdict-evidence-discipline/CONTEXT.md`), but they are
independent write paths touching disjoint files, so they shipped as two
separate child items.

## Why the gate is narrow, not universal

The check only fires when a clause supplies `text` **and** `evidence`
together in the same write — never a blanket "evidence required at
authorship" rule. A clause with `text` only (no `evidence` yet) is
completely untouched. This deliberately preserves an existing allowance
(RUL58 D4, `docs/specs/work-state.md`) that a forward-looking acceptance
clause may state its claim before evidence exists, with evidence added
later before the item reaches `done`. Requiring evidence at authorship for
every clause was explicitly rejected — it would break the common,
already-relied-on case where `evidence` is deliberately absent until the
item nears completion.

## Why "traceable" means mechanical, not semantic

From `src/state/work.mjs`'s `checkAcceptanceEvidenceTraceable`:

> "Traceable" here is MECHANICAL, not semantic: at least one path-like
> substring in `evidence` must resolve to a real file under `repoRoot`.
> This catches an evidence string that cites nothing checkable at all — it
> does NOT verify the cited file actually says what the clause claims,
> which is a judgment call this item's own CONTEXT.md D3 leaves open, not
> something a pure shape validator can prove.

Concretely: the check extracts path-like substrings from `evidence` (a
token needs at least one `/` separator and a file extension — e.g.
`docs/history/foo/CONTEXT.md` or `src/state/work.mjs` — deliberately
excluding a bare filename with no directory separator like `work.mjs`
alone, to cut down on false positives against ordinary prose such as "e.g."
or "v1.2"), then checks whether any candidate resolves to a real file under
the repo root via `fs.existsSync`. If none resolve, the write is rejected
with a `WorkValidationError` naming the offending clause — the same error
contract every other shape rule in `work.mjs` already uses.

This mechanical bar is exactly enough to catch the `tsk-d3c` shape (a
citation pointing at nothing checkable), without pretending a shape
validator can verify a citation actually supports the claim it's attached
to — that stays a human/model judgment call, left open by CONTEXT.md's D3.

## Why it's opt-in, called only where a real repo root exists

`checkAcceptanceEvidenceTraceable(work, repoRoot)` no-ops (returns `true`)
whenever `work.acceptance` is missing, `repoRoot` is omitted, or a clause
lacks either `text` or `evidence`. It's called only from `store.mjs`'s
`addWork`/`editWork` — the only callers that actually have a real
repository root to check candidate paths against.
