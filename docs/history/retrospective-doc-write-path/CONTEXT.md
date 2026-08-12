# retrospective-doc-write-path — locked decisions

Item: `tsk-3ts`. Source request (raw, untrusted per RUL45): "Retro-loop
sweep ghi tai lieu end-user len work branch roi de mo coi, trong khi
outcome record van len main - 34 tai lieu bien mat am tham."

## Feature boundary

The `retrospective` status exists to produce end-user documentation
(D11 of `work-item-status-delivered-retrospective-cleanup`: the retired
`compound-learn` stage's synthesis work, reframed as a status). That
output is currently produced but not reliably delivered: on
2026-08-05 a scan found 36 of 182 recorded `docPath` values pointing at
files absent from the tree.

**In scope**: where a retrospective document is written and what makes it
durable — the write path, its commit, and the point at which the tag
recording it is allowed to exist. Regrowing the one document that is
unrecoverable.

**Out of scope**: the `cleanup` stage's own defects (`tsk-1q1` and its
children, a separate family); adding a `doctor` check as a sweep over
historical data; whether `docPath` should follow a file rename (see
Deferred).

## Pinned terms

- **retrospective document** — the end-user Diataxis document produced by
  `fgos-coding-compounding` step 4 and recorded on the item's capture via
  `fgos compound --doc-path`. It is a repo-level knowledge artifact, not
  an item artifact: `fgos doc-sources <docPath>` gathers *every* capture
  linked to that path, and measurement shows 18 of 155 distinct paths are
  already shared by 2–3 items.
- **tag** — the `docType`/`docPath` pair `fgos compound` writes onto the
  item's outcome record. Today it is a claim about a document, checked by
  nothing at the moment it is written.
- **CONTEXT.md** — this file. An *item* artifact, committed to `fgw/<id>`
  per `fgos-coding-exploring`'s own rule. Deliberately not covered by D1, which
  governs retrospective documents only.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | A retrospective document is always **written and committed at the main checkout**, regardless of where the session invoking synthesis is standing. The document-writing step resolves the main checkout root the same way `fgos-coding-compounding` step 3 already resolves it for the `.fgos/` store (`git rev-parse --path-format=absolute --git-common-dir \| xargs dirname`). This removes the asymmetry, not the ability to run synthesis from a worktree: a session inside a worktree still synthesizes its own item, its document simply lands where every other document lands. No new lifecycle edge, no locked law reopened. |
| D2 | The one unrecoverable document, `docs/how-to/check-main-checkout-lock-status-before-retrying.md` (`tsk-5z2`), is **regrown inside this item**. Not split into a separate item, and its `docPath` is not cleared. Its source is `tsk-5z2`'s own decision record (`docs/history/lock-status-visibility/` — `CONTEXT.md` and `plan.md`, both present on main) together with the shipped behaviour of `fgos lock-status`. **Not** `fgos doc-sources`: that verb was run against this path and returns capture metadata only (`predicted`/`actual`/`docType`/`docPath`), no prose — an earlier draft of this decision named it as the source and was wrong. |
| D3 | **Write first, tag second, and fail closed at the tag.** The document is written and committed at the main checkout *before* `fgos compound` records its tag, and `compound` refuses a `--doc-path` whose file is not present at the main checkout. This inverts `fgos-coding-compounding`'s current step 3 → step 4 order, under which the tag necessarily precedes the file it names and therefore can never be validated. The invariant "a tag exists ⟹ its document exists on main" becomes impossible to violate rather than detected later. |

## Why the alternatives were rejected

Recorded so a later reader does not re-propose them.

**Writing the document to the item's own branch** (so it reaches main
through the normal merge door) is not structurally available.
`fgos compound` requires status `retrospective` (`bin/fgos.mjs:1169`),
which is downstream of `delivered`; `approve` refuses any item not at
`awaiting-approval` (`bin/fgos.mjs:2366`). By the time a document may
legitimately be written, the item's branch has **no remaining merge
door**. This — not the ADR0020 `.fgos/` merge refusal
(`bin/fgos.mjs:2767`) and not the later branch rewrites — is the root
reason the 34 documents were stranded; those two are downstream effects.

The worktree surviving until `cleanup` does not change this. It grants a
place to write, not a path to arrive. It also introduces a *new* failure
shape: `cleanupMergedBranch` deletes with `git branch -d` (safe delete),
which refuses an unmerged branch, and the failure is swallowed as a
warning reading `left in place, harmless` — so a document committed after
`delivered` leaves a branch behind forever while the only message the
system emits calls it harmless.

**Splitting by activity** (a worktree writes "its own" document, the main
checkout runs sweeps) fails on the same timing wall, and additionally on
the shared-document measurement above: `fgos-coding-compounding` step 4 decides
create-vs-grow by file existence on disk, so two worktrees targeting one
path each see "absent", each create, and the second silently replaces the
first.

**Opening a merge door for `delivered` items** would make the worktree a
real post-merge workspace, consistent with `cleanup`'s pinned term
("deliberately delayed ... so a post-merge incident can still reuse the
worktree"). Rejected here as a lifecycle change out of proportion to the
defect, not as unsound — it remains the honest answer if post-merge
worktree reuse is ever wanted as a first-class capability.

**A `fgos doctor` check as the protection.** Rejected: `doctor` is opt-in,
and a guard nobody remembers to run is not a guard. A mandatory check does
already exist as of `tsk-558` (`checkRetrospectiveContent` now calls
`fs.existsSync` at the `cleanup → done` gate), but it fires seven days
late and its remedy is a park, not a repair. D3 places the guard where the
content is still in hand.

## Scout evidence

- `.claude/skills/fgos-coding-compounding/SKILL.md` — step 3 resolves the main
  checkout root explicitly (`--dir "$root"`, citing ADR0020 and tsk-56t
  D1) while step 4, ten lines later, writes the document at a
  cwd-relative `docs/<quadrant>/<file>.md`. Step 3 states the session is
  "often still inside the item's worktree right after its own `return`".
  Step 5 confirms the document "exists on disk" — which passed for all 34
  stranded files, because they did exist, in the worktree.
- `bin/fgos.mjs:1169` — `compound` requires status `retrospective`.
- `bin/fgos.mjs:1176` — `compound` accepts any `--doc-path` string with no
  validation, then records it via `addOutcome`.
- `bin/fgos.mjs:2366` — `approve` refuses any status other than
  `awaiting-approval`.
- `bin/fgos.mjs:2767` — merge refuses a branch staging changes under
  `.fgos/` (ADR0020).
- `src/runner/merge.mjs` `cleanupMergedBranch` — `git branch -d`, failure
  swallowed as a `left in place, harmless` warning.
- `src/state/cleanup-harness.mjs` `checkRetrospectiveContent` — after
  `tsk-558` (landed 2026-08-05) verifies the file exists at `repoRoot`.
- Measurement, 2026-08-05: 182 recorded `docPath` values, 36 absent from
  the tree; 155 distinct paths, 18 of them shared by 2–3 items. The 36
  traced to three orphaned commits — `c7a3282` (14 files), `1835c10d`
  (12), `52e84193` (8) — plus one path stale from a rename (`8eba4a40`)
  and one present in no commit at all (`tsk-5z2`). 34 were restored in
  commit `d955217`; the `tsk-5z2` document is what D2 regrows.
- `fgos doc-sources docs/how-to/check-main-checkout-lock-status-before-retrying.md`
  — run 2026-08-05, returns `count: 1` with a single capture carrying
  `predicted`/`actual`/`docType`/`docPath` and no prose. Establishes that
  captures are metadata, not written material: a document cannot be
  regrown from them alone. `tsk-5z2`'s own `docsRef`,
  `docs/history/lock-status-visibility/` (`CONTEXT.md` 7.3K, `plan.md`
  4.9K), is present on main and is the real source.
- **Impact-analysis capability gate** (per `CLAUDE.md`): `fgos tool query
  --capability impact-analysis --status present` returns GitNexus
  `present`, but the index is at `251d0b5`, behind current HEAD —
  **degraded**. Informational only for this skill, which edits no code;
  binding on whoever implements D1–D3.

## Deferred to planning

- Whether `docPath` should follow a file rename. One record is currently
  stale (`str89-case-study-executing` points at
  `smoke-test-fgos-executing-with-a-trivial-item.md`, renamed to
  `...-fgos-coding-implement-...` by `8eba4a40`). Correcting that one record
  is in scope; building a general rename-tracking mechanism is not —
  1 occurrence in 155 does not yet justify one.
- Exactly where D3's file-presence check lives inside the `compound` verb,
  and how it reports a missing file (validation error vs. precondition
  error) — implementer's choice, consistent with the verb's existing
  `StoreError` usage.
- Whether a `doctor` check is added later as a cleanup sweep over
  historical records. Explicitly not the protection (see above), so it is
  not required by this item.

## Outstanding

None at the decision-lock level.
