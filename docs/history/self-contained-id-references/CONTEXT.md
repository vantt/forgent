# self-contained-id-references — CONTEXT.md

Item: `tsk-37i`. Feature boundary: fgOS citations of ADR/RUL/D-local ids
inside skill prose and specs must be self-contained (id + one-line gloss,
never a bare id) and structurally valid (point at a real file/heading).
Scope is deliberately narrow after `DISCUSSION.md` D2 (round 7) handed the
decision-storage-architecture half of this problem (reversal sweep on ADR
supersede, routing close-gate on `fgos approve`/`return`) to `tsk-1lv`
(`canonical-decision-projection`) — this item does not touch where a
decision lives, only whether a single citation of it reads as
self-contained.

Full discussion history, scout evidence, and the 3-tier structure analysis
live in `docs/history/self-contained-id-references/DISCUSSION.md` (7
rounds) — this file locks only what carries forward into planning.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | fgOS's existing 3-tier citation ID structure (ADR global-permanent / RUL area-scoped-reset-per-spec-file / D-local feature-scoped) is validated, not the defect — beegog (upstream, v2.7.0) independently converged on the identical 3-tier shape. No tier-count restructuring, no id-scheme change. The fix targets citation FORMAT (bare id → id+gloss) and mechanical ENFORCEMENT only. |
| D2 | Scope narrowed to two tasks: (a) citation-format convention + a machine check, (b) retroactive cleanup of ~36-69 files already citing bare D-local/RUL/ADR ids in `.agents/skills/**/SKILL.md` and `docs/specs/*.md`. The reversal-sweep-on-ADR-supersede and routing-close-gate-on-`fgos approve` mechanisms are OUT of scope — `tsk-1lv` owns both, confirmed by that item's own session. |
| D3 | The machine check for (a) extends the EXISTING `scripts/check-decision-citation-drift.mjs` — a new finding type (bare id with no gloss; a D-local id cited outside its own `CONTEXT.md`) plus a widened scan surface (`.agents/skills/**/SKILL.md`, currently it only scans `docs/backlog.md` + `docs/specs/*.md`) — rather than a third sibling CLI script. `scripts/check-decision-supersession.mjs` is untouched: confirmed by reading both scripts' source that it checks a structurally different surface (internal `docs/decisions/*.md` frontmatter backward-pointer pairs, not prose citations elsewhere). |
| D4 | The new finding types ship as a ratchet against a checked-in baseline snapshot (same shape as `scripts/check-decision-codes.baseline.json`, this repo's own prior art for exactly this situation) — only a violation NOT already in the baseline fails `npm test`; the ~36-69 known files stay visible in the check's own output but non-blocking until the retroactive-cleanup task shrinks the baseline. Direct local precedent: `tsk-3ch` hard-blocked immediately once and broke `npm test` red across 42.7% of test files (254/117), forcing 5 blocked merges before a human intervened (`docs/history/decision-code-check-enforcement/CONTEXT.md` D1). |

## Pinned terms

- **"Self-contained citation"** — `<ID> (<one-line gloss of what the id
  says>)`. Never a bare id (`0026`, `RUL42`, `D2`) with no accompanying
  summary. The gloss's accuracy/completeness is prose discipline (review),
  not machine-checkable; whether the citation resolves to a real
  file/heading IS machine-checkable.
- **"Bare citation"** — an ADR/RUL/D-local id appearing in prose with no
  parenthetical gloss immediately after it. The new finding type in D3.
- **"D-local citation-outside-home"** — a `D<n>` id cited anywhere other
  than its own `docs/history/<feature>/CONTEXT.md` — already a locked
  fgOS rule (decision `0017`), currently unenforced. The new check makes
  it a detected finding, not a new rule.
- **"Baseline"** (D4) — the checked-in snapshot of every currently-known
  finding (file + matched line) at the moment the new finding types ship.
  Not auto-shrinking; the retroactive-cleanup task shrinks it by hand as
  files get fixed.

## Scout evidence

- `docs/decisions/0000-index.md` lines 22-25: existing citation convention
  for ADR (`ADR<n>` prefix, no gloss requirement).
- `docs/id-systems-audit.md` line 49 (§5): RUL is NOT globally unique —
  citing outside its home spec requires an area suffix, e.g. `RUL42
  (runner)`. Line 152: D-local citation is locked to never leave its own
  `CONTEXT.md` (decision `0017`).
- `.agents/skills/fgos-coding-shaping/SKILL.md`: confirmed live violation
  — cites `(D2)`, `(D4)`, `(D6)` bare, outside
  `docs/history/fgos-coding-shaping/CONTEXT.md` where those ids are
  actually defined. One instance of the ~36-69 file scope this item's
  retroactive-cleanup task covers.
- `scripts/check-decision-citation-drift.mjs` (source read directly):
  exports `extractCitedIds`/`findCitationDriftFindings`, scans
  `docs/backlog.md` + `docs/specs/*.md` for a citation of an
  ALREADY-SUPERSEDED decision with no same-line acknowledgement
  ("dead-framing"). Proven only via
  `test/scripts/check-decision-citation-drift.test.mjs` against synthetic
  tmp fixtures — never invoked against the live repo tree as part of
  `npm test`, confirmed by reading the test file (no real-repo run
  anywhere in it).
- `scripts/check-decision-supersession.mjs` (source read directly): checks
  a `supersedes:` frontmatter target's own `superseded_by:` backward
  pointer plus its `docs/decisions/0000-index.md` row — a different check
  target from citation-drift, confirmed by reading the file header comment
  and the `classifySupersedes`/`findIndexRow` functions.
- `docs/history/decision-code-check-enforcement/CONTEXT.md` +
  `docs/explanation/why-the-decision-code-check-ratchets-against-a-baseline-instead-of-blocking-everything.md`:
  this repo's own prior baseline-ratchet precedent (`tsk-3ch`), including
  the concrete failure mode it was built to avoid (254/117 files, 42.7%,
  5 blocked merges) — directly informs D4.
- `fgos tool query --capability impact-analysis --status present`: 1
  provider, `gitnexus`, `status: "present"`. GitNexus's own index is
  currently flagged stale by this session's tool hooks ("last indexed:
  7bb3231") — per `CLAUDE.md`'s impact-analysis gate this reads as
  **degraded**, not full: registered and present, but the index may be
  behind current HEAD. Informational only — this item is docs/scripts-only
  prose+check work, not a code-symbol edit GitNexus would meaningfully
  blast-radius anyway; recorded here per the gate's own requirement, not
  because it changed any candidate decision above.
- `docs/history/canonical-decision-projection/DISCUSSION.md` (branch
  `fgw/tsk-1lv`): the overlap analysis behind D2 — read in full, 8 rounds,
  D1-D6 locked there as of this item's own round 7.

## Outstanding questions

None
