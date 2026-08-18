# PLAN: tsk-1lv-4 — Retire docs/decisions/*.md corpus into docs/specs/<area>.md narrative + state.decisions short records

Status: **delivered-pending-approve** (implemented, verified, returned).

## Context

Split child 4 of 6 from `tsk-1lv` (parent docsRef:
`docs/history/canonical-decision-projection/`). Full design: `DISCUSSION.md`
§6/§7 (`#task-retire-decisions-corpus-to-specs`), `plan.md`'s risk map row 4
("Cao" — highest of the 6), `CONTEXT.md` D5. This file records this child's
own shape and what actually shipped; it does not repeat the parent's design
reasoning.

## Shape

- 34 hand-authored ADRs (`docs/decisions/0001-0033.md`, including a real
  numbering collision at `0032` — two distinct files, both real, both
  preserved as separate sections) migrated **verbatim** (full Bối cảnh/
  Quyết định/Hệ quả content, headings bumped two levels to nest under a new
  `### <id> — <title>` heading) into the target `docs/specs/<area>.md` (or
  `docs/architecture-map.md`) each ADR's own `relates_specs` frontmatter
  already declared — no guessing, the target mapping was already written
  down by the original author of each record.
- Each ADR also got a short `fgos decision --scope <area>` record logged
  directly against the shared main-checkout event log — the real,
  machine-readable trace `state.decisions` was designed to hold (D4).
- `docs/decisions/0000-index.md` (hand-written) removed. `docs/decisions/`
  persists as a directory holding only the generated `docs/decisions/
  index.md` (`fgos decision-index`, tsk-1lv-2's own verb).

## Migration mechanism

A one-time Node script (not shipped, deleted after use — same pattern this
repo's own `scripts/migrate-*.mjs` precedent already establishes) did the
mechanical relocation: read each ADR, strip frontmatter + H1 title, bump
internal heading levels, append under a new `## Lịch sử quyết định retired
từ docs/decisions/ (tsk-1lv-4)` section in the target file, then delete the
source file. A companion shell script ran the 34 `fgos decision --scope`
calls. Both were run directly against the real repo/main-checkout — this is
content migration, not a shipped feature; nothing about the mechanism itself
is part of what merges.

## Real findings during implementation

1. **Heading-nesting bug, caught by direct verification.** First pass left
   `## Bối cảnh` etc. as literal H2s under the new `### <id>` H3 — backwards
   nesting. Fixed by bumping every internal heading two levels
   (`## → ####`), verified by reading the rendered output before proceeding.
2. **`docs/decisions/` is also a Diataxis "explanation" quadrant alias**
   (`enduser-index.mjs`'s `QUADRANT_DIR_ALIASES`) — every retired ADR
   carried `type: explanation` frontmatter for exactly this reason. Two
   `test/report/enduser-index.test.mjs` assertions hardcoded ADR0001's now-
   deleted path; fixed by giving the generated `index.md` the same
   `type: explanation` frontmatter and updating those two assertions to
   check the generated file instead. Real regression, not scope creep —
   these tests run against the real repo tree by design.
3. **`scripts/check-decision-supersession.mjs`'s CLI mode** (wired to `npm
   run check:decision-supersession`) read `docs/decisions/0000-index.md`
   unconditionally — would have crashed (ENOENT) the moment that file was
   deleted. Fixed with a graceful "corpus retired, 0 findings" exit instead
   of a crash, matching this repo's own "absent capability = clean skip"
   convention used elsewhere (`checkEnduserDocsIndexStale`).
4. **A real operational mistake**, caught and fixed within this item: an
   accidental second run of the decision-logging script appended 33
   duplicate events to the shared, live `.fgos/events.jsonl`. Caught
   immediately (no other session had written to the log since), fixed via a
   backed-up direct truncation of the exact duplicate tail range + `fgos
   rebuild`, confirmed contiguous via `scripts/events-jsonl-contiguity.mjs
   --check` (`{ok:true, gaps:[], duplicates:[]}`).

## Blast radius acknowledged, not fully closed (documented, not silent)

`docs/how-to/find-every-caller-before-requiring-a-cli-flag.md`'s own
playbook was followed for the citation surface: ~150 files across the repo
cite old `ADR00NN`/`docs/decisions/00NN-*.md` forms. The overwhelming
majority are `docs/history/` archival records — frozen by this repo's own
convention (append-only, point-in-time, never retroactively edited; `tsk-1lv`
parent's own D6 discussion confirms this). Fixing every citation
individually was judged disproportionate to this item's own scope; content
is not lost (every retired id is findable via `docs/decisions/index.md`,
`state.decisions`, and the real `### <id>` heading in its new
`docs/specs/`/`docs/architecture-map.md` home) — only the convenience of a
clickable file-path link degrades for citations outside the ones this item
did fix (`AGENTS.md`'s product-priority pointer, the two `enduser-index`
tests). See `iron-law-evidence.md`'s own accounting for the fuller list of
what was and was not touched.

**Explicitly out of scope, deferred (not silently dropped):** the OLD
`docs/decisions/0000-index.md`-specific collision-resolve subsystem in
`src/runner/merge.mjs` (`classifyDecisionIndexCollision`/
`autoResolveDecisionIndexCollision`/`renumberDecisionFile`/
`nextFreeDecisionId`) is now genuinely unreachable dead code — that file
path can never be recreated under the new design. Removing it (plus its
~10 tests in `test/runner/merge.test.mjs`) is a real, separate decision
(bigger diff, its own risk) left for a follow-up item rather than folded
into this one.

## Acceptance criteria

- `docs/decisions/` contains no `NNNN-slug.md` files, only the generated
  `index.md`.
- Every one of the 34 retired ADR ids has a `### <id> — ...` heading
  somewhere under `docs/specs/*.md`/`docs/architecture-map.md`.
- `node --test test/docs/decisions-corpus-retired.test.mjs` — 7/7 green.
- Full `npm test` (3543 tests) clean except the same two pre-existing,
  unrelated `test/runner/dispatch.test.mjs` failures already confirmed
  present before this item's own changes (ADR0020 worktree isolation —
  this worktree carries no committed `.fgos/config.json`).

## Dependencies

`deps: [tsk-1lv-1, tsk-1lv-2]` — needed the `--relation` field (task 1) and
the `scope` field + `decision-index` generator (task 2) both landed first.

## Links

- `docs/history/canonical-decision-projection/plan.md` — parent plan,
  §Risk map row 4, §Split children entry 3.
- `docs/history/tsk-1lv-4/iron-law-evidence.md` — Iron Law proof, real
  failing-before/passing-after transcripts, and the full citation-blast-
  radius accounting.
