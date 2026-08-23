# RESEARCH — spec/docs lifecycle realignment (tsk-5eq)

Accumulating record. Each round appends its own dated section; never overwrite
an earlier round.

## Round 1 — 2026-08-12 (stage `discovery`, called by `fgos-coding-discovering`)

### What was asked

Four independent branches, dispatched as contracted six-field gather packets
(`tsk-5eq#p1`..`#p4`):

- **p1** — the exact live lifecycle of domain `coding`: stages, edges, verdicts,
  retired names, stage→skill map.
- **p2** — line-anchored staleness inventory of the three target specs, plus the
  frontmatter convention each uses.
- **p3** — which `docs/how-to/` filenames carry retired names, and how the
  end-user docs index is generated/regenerated.
- **p4** — retired names in the non-spec targets, each classified LIVE guidance
  vs HISTORICAL narration.

### How it was checked

The four packets were dispatched out-of-process through the registered
`gather` capacity (`agy`, Gemini 3.5 Flash), announced and logged
(`capacity.dispatch`, seq 14343). **All four returned empty**: `agy` in headless
mode auto-denies its own `read_file` permission, so it produced no digest —

```
jetski: no output produced — a tool required the "read_file" permission that
headless mode cannot prompt for, so it was auto-denied.
```

Per the shared fragment's Step D (malformed/missing response), all four branches
fell back and were resolved inline by direct reads. Every finding below carries a
`path:line` anchor read directly, not summarized from memory.

### What was found

#### p1 — live lifecycle ground truth

Source: `src/state/workflow-stage-graphs.mjs`.

- Live `coding` stages, in registry order (`:90`):
  `['discovery', 'exploring', 'decompose', 'planning', 'executing']`.
- `stepMap` (`:107-110`) declares only `planning: 'Divide'` and
  `executing: 'Execute'`. `discovery`/`exploring` deliberately carry no
  base-workflow step (`:94-101`); `decompose` was deliberately stripped of its
  entry so no NEW item can ever land there (`:102-106`).
- `decompose` survives **only as a drain-only legacy alias** (`:66-76`, tsk-403
  D18) — kept because `stage` is not in `EDITABLE_FIELDS`, so open items parked
  on that name cannot be relabelled and would be stranded.
- `clarify` is **retired entirely**, not aliased (`:78-89`, tsk-qod D1/D2): the
  90 items open on it were migrated for real by
  `scripts/migrate-clarify-split.mjs`, and `stages[0]` is now `discovery`. The
  two `clarify -> …` transitions that remain (`:139-140`) exist only so
  `moveStage`'s FSM check can still legally advance a historical item; the
  comment states `validateWorkShape` refuses `stage: 'clarify'` on any new item.
- `compound-learn` is retired as a stage (`:25-29`); the synthesis it gated is
  now the **status** `retrospective`'s job.
- Edges (`:125-157`), the live chain a new item walks:
  `discovery -> planning` (verdict `clear`, `:153`, skips `exploring`),
  `discovery -> exploring` (verdict `unclear`, `:147`),
  `exploring -> planning` (`:155`), `planning -> executing` (`:156`).
  Legacy-only: `decompose -> executing` (`:145`), `exploring -> decompose`
  (`:146`).
- `skillMap` (`:223-230`): `discovery → fgos-coding-discovering`,
  `exploring → fgos-coding-exploring`, `decompose → fgos-coding-planning`,
  `planning → fgos-coding-planning`, `executing → fgos-coding-implement`,
  `retrospective → fgos-coding-compounding`.
- `fgos-validating` **never had a `skillMap` entry** (`:216-217`, tsk-403 D16) —
  it runs as `fgos-coding-planning`'s own second phase.
- `classification` (`:339-342`): `kind` ∈ `[bug, chore, design, feature, docs,
  task]`, `risk` ∈ `[light, standard, heavy]`.
- Status chain (`src/state/status-fsm.mjs:10-19`):
  `todo → doing → awaiting-approval → delivered → retrospective → cleanup →
  done`, with `blocked`/`awaiting-human`/`wontfix` as branches.
- `src/intake/decompose.mjs` **no longer exists** — it was renamed to
  `src/intake/plan.mjs` (`src/intake/discovery.mjs:25-27`); `src/intake/` today
  holds exactly `classify.mjs`, `discovery.mjs`, `plan.mjs`,
  `risk-keywords.mjs`, `verify-pattern-check.mjs`.
- `src/intake/judge-executor.mjs` **no longer exists** either.
- `judgeDiscovery` (the nested `claude -p` judge) is **retired**
  (`src/intake/discovery.mjs:44-51`, tsk-1x3 D1/D9) — `resolveDiscovery` now
  requires an explicit caller-supplied verdict.

**Live item distribution (read from the real store, `fgos list --all`):**
`executing` 289, `compound-learn` 158, `discovery` 85, `(none)` 48,
`exploring` 8, `decompose` 8, `clarify` **0**, `planning` **0**. The
drain-only `decompose` alias is still load-bearing for 8 open items; the
`clarify` migration is genuinely complete.

#### p2 — spec staleness and frontmatter convention

House frontmatter convention (`docs/specs/work-state.md:1-7`,
`docs/specs/runner.md:1-7`, `docs/specs/system-overview.md:1-6`):
`area`, `updated` (`YYYY-MM-DD`), `sources: [feature-slug, ...]`,
`decisions: [hex, ...]`, `coverage: full|partial`.
**`docs/specs/reading-map.md` carries no frontmatter at all** — it is a plain
bullet list, 44 lines.

Retired-term counts (case-insensitive, whole file):

| file | clarify | decompose | compound-learn | planning | discovery | exploring |
|---|---|---|---|---|---|---|
| `work-state.md` (1215 ln) | 80 | 73 | 67 | 2 | 81 | 2 |
| `runner.md` (1043 ln) | 24 | 35 | 7 | 1 | 23 | 1 |

`reading-map.md`'s own stale lines, read directly:

- `:20` — declares the coding stage chain as
  `` `clarify→decompose→executing→compound-learn` `` and describes the domain
  registry as `coding` + `synthetic` only (the registry now also carries
  `triage` and `fixture-marketing`).
- `:23` — `src/intake/discovery.mjs` described as "context-discovery của stage
  clarify", advancing to `decompose`, and still crediting the retired
  `judgeDiscovery`.
- `:24` — `src/intake/plan.mjs` described as "phán chia-việc của stage
  decompose", reached via verb `discover` (the verb is `plan` now).
- `:25` — points at `src/intake/judge-executor.mjs`, a file that no longer
  exists.
- `:26` — states `fgos-routing` has a row `compound-learn → fgos-coding-compounding`
  (it is keyed on status `retrospective` now). The `fgos-coding-*` skill names
  on this line are already correct.
- `:28` — end-user docs "sinh bởi kỹ năng `fgos-coding-compounding` ở stage
  compound-learn".
- `:42` — claims "625 test".

**Blast radius is wider than the item's declared footprint.** Three further
specs plus `AGENTS.md` carry the same disease and are NOT in `footprint`:

- `docs/specs/system-overview.md:16,53` — "ở khâu compound-learn".
- `docs/specs/enduser-docs-authoring.md:11,19,23,42,74,121` — six live mentions
  of "khâu compound-learn".
- `docs/specs/enduser-docs-index.md:30,200` — same.
- `AGENTS.md:80` — names `fgos-exploring`, `fgos-planning`, `fgos-validating`.

**False positives to protect, not rewrite:**
`sources: [compound-learn-enduser-docs]`
(`enduser-docs-authoring.md:4`, `enduser-docs-index.md:4`) is a **feature slug**,
not a stage name. `docs/platform-foundations.md`'s five hits are all the phrase
"compound-learning" (the stack/concept), never the stage — and that file holds
locked laws that `AGENTS.md` forbids editing in place. Both are out of scope.

#### p3 — how-to filenames and the docs index

**Ten** files under `docs/how-to/` carry a retired stage/verb/skill name in the
filename, not seven as the item description estimated:

1. `advance-a-clarify-or-decompose-stage-item-with-discover-decompose.md`
2. `claim-a-clarify-or-decompose-stage-item.md`
3. `declare-footprint-when-fgos-planning-splits-an-item.md`
4. `fix-a-pre-existing-item-that-keeps-re-asking-an-already-answered-clarify-question.md`
5. `make-discover-decompose-domain-aware-via-stageforstep.md`
6. `pass-a-caller-supplied-verdict-to-discover-or-decompose.md`
7. `process-the-next-clarify-or-decompose-item-with-discover-next.md`
8. `smoke-test-fgos-code-implement-with-a-trivial-item.md`
9. `sweep-the-clarify-decompose-backlog-with-discover-loop.md`
10. `use-force-to-clear-a-red-first-verify-disagreement-at-clarify.md`

Index generation (`bin/fgos.mjs:2190-2206` → `generateEnduserDocsIndex`,
`src/report/enduser-index-generate.mjs`):

- An entry's `title` comes from the doc's **first H1**, not the filename
  (`enduser-index-generate.mjs:38`). An entry's `docPath` **is** the repo-relative
  file path (`:35`).
- The manifest written is `docs/enduser-docs-index.json` (268 entries, git-tracked,
  110 KB). A second tracked copy exists at `.fgos/docs/enduser-docs-index.json`.
- Regeneration: `node bin/fgos.mjs docs-index --dir <root>/.fgos`. It is
  `access: 'read'`, idempotent, and overwrites the manifest whole
  (`bin/fgos.mjs:2186-2189`). `repoRoot` is derived as `path.dirname(dir)`, so
  `--dir` is mandatory from a worktree (`:2191-2197`). This worktree has **no
  `.fgos/` directory at all**, confirming the `--dir` requirement empirically.
- The same generation path backs a `enduser-docs-index-stale` doctor check
  (`src/setup/registrations.mjs`).

**Decisive finding against renaming.** Each entry's `sourceCaptureId` is resolved
by exact-matching `docPath` against the replayed outcomes view
(`src/report/enduser-index.mjs:72-79`: `if (outcome?.docPath === docPath)`).
The outcomes view is folded from the append-only event log, so a capture's
recorded `docPath` cannot be rewritten. Renaming a how-to file therefore
**permanently severs its evidence back-link**, and regenerating the index does
not repair it — it just records `sourceCaptureId: null`. Nine of the ten
candidates currently have a live back-link that a rename would destroy:

| file | current sourceCaptureId |
|---|---|
| `advance-a-clarify-or-decompose-…` | `tsk-2b0` |
| `claim-a-clarify-or-decompose-…` | `tsk-1ab-1` |
| `declare-footprint-when-fgos-planning-…` | `tsk-3uz` |
| `fix-…-already-answered-clarify-question` | `tsk-2cs` |
| `make-discover-decompose-domain-aware-…` | `tsk-3xo` |
| `pass-a-caller-supplied-verdict-to-discover-or-decompose` | `tsk-27y` |
| `process-the-next-clarify-or-decompose-…` | `tsk-3go-2` |
| `smoke-test-fgos-code-implement-…` | **null** (already unlinked) |
| `sweep-the-clarify-decompose-backlog-…` | `tsk-3go-3` |
| `use-force-…-disagreement-at-clarify` | `tsk-66o` |

#### p4 — non-spec targets, LIVE vs HISTORICAL

`docs/backlog.md`:

- `:36`, `:37`, `:38` — status column `proposed`, i.e. **OPEN rows = LIVE**.
  `:36` cites `fgos-exploring/SKILL.md`; `:38` cites `src/intake/decompose.mjs`,
  `judge-executor.mjs`, `fgos-exploring`, `fgos-planning` — all renamed or
  deleted. `:37` cites `src/intake/discovery.mjs:113-137` and `fgos-validating`.
- `:128`, `:130`, `:132`, `:133` — every one of these rows ends `— done`.
  They are **HISTORICAL** records of completed work (STR89/STR90/STR92/STR93)
  and must not be rewritten.
- `:62`, `:107` — also `done` rows mentioning `compound-learn`: HISTORICAL.
- `:43` — an open (`proposed`) row, but its `compound-learn` mention narrates a
  dated dogfood incident (2026-07-28): HISTORICAL text inside a live row.
- `:13`, `:26`, `:28` — open rows using `clarify`/`decompose` as the then-current
  vocabulary in prose. **Ambiguous** — listed under "still open" below.

`docs/distribution-vision.md`:

- `:152` — "trước khi `fgos-planning`/thi công": **LIVE**, a retired skill name.
- `:157`, `:160`, `:162`, `:164`, `:166` — assert `tsk-2qz`, `tsk-2cs`,
  `tsk-2ta`, `tsk-49r`, `tsk-1qm` are "(stage `clarify`, todo)". Checked against
  the real store: **all five are `status: done`**, four at stage
  `compound-learn`, one with no stage. These lines are doubly wrong (retired
  stage name *and* wrong status) and are **LIVE** — a reader would act on them.

`docs/tutorials/walking-a-heavy-item-through-a-3-child-split.md`: this is a
Diataxis **tutorial** — learning-oriented and meant to be followed — that
narrates one real past run (`tsk-3wr`). Retired names at `:3`, `:8`, `:14`,
`:23`, `:30`, `:48` (`clarify`, `decompose` as live stages), `:54`
(`fgos-planning`), `:94` (`fgos-validating`), `:138`, `:161`, `:177`
(`compound-learn`), `:167` (`fgos-code-implement`). Classified **LIVE**: the
three skill names still denote skills that exist under new names, and a reader
following the tutorial today would issue retired stage names.

`README.md`: clean, zero hits.

#### Cross-cutting: the item's own `verify` is vacuous

The item carries
`verify: "npm test && grep -q planning docs/specs/work-state.md"`.
`docs/specs/work-state.md` **already** contains "planning" today, at `:422` and
`:423` — inside the strings `fgos-coding-planning` and `fgos-coding-validating`.
So `grep -q planning` passes **before any work is done**; the second clause
cannot distinguish done from not-done.

`resolveDiscovery` will not replace it: `hasRealVerify`
(`src/intake/discovery.mjs:89`) only treats the two known sentinels as unreal, so
this string counts as "real" and any `--verify` passed to `fgos discover` is
ignored (`:440`). Tightening it requires an explicit `fgos edit --verify` at the
planning stage.

### What is still open

Nothing that blocks a verdict. Three items are **planning decisions**, not
research gaps — each now has the evidence it needs:

1. **Scope**: whether to extend beyond the declared `footprint` to
   `system-overview.md`, `enduser-docs-authoring.md`, `enduser-docs-index.md`,
   and `AGENTS.md:80`. Evidence gathered; the call belongs to `planning`.
2. **Rename or not**: evidence points hard at *not* renaming the ten how-to
   files (nine live back-links would be permanently severed for a cosmetic
   filename gain). `planning` decides.
3. **Verify**: needs tightening via `fgos edit --verify` because the current
   string is already green.

Two `docs/backlog.md` occurrences are genuinely ambiguous between LIVE and
HISTORICAL and are recorded rather than forced: `:13`, `:26`, `:28` — open rows
whose prose uses `clarify`/`decompose` as ordinary vocabulary of the time rather
than as an instruction to follow.

### Verdict returned to the caller

`{clear: true}` — every ambiguity raised at stage `discovery` was resolved from
real, cited evidence. No product decision requiring a person surfaced; what
remains is shaping work, which is `planning`'s own job.
