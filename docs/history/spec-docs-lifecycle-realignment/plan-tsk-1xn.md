# plan-tsk-1xn.md — the non-spec end-user docs (child 4 of tsk-5eq)

Mode: standard

Flag count: 2 of 10 — **existing covered behavior** (`npm test` runs
`scripts/check-decision-citation-drift.mjs` over `docs/backlog.md`, one of this
item's three files), **weak proof around the area** (the item's pinned `verify`
carries targeted negatives for the tutorial and `distribution-vision.md` only —
`docs/backlog.md` has no clause at all, so a third of the footprint is proven by
a manual targeted grep rather than by the recorded command; see Assumption A2).
No hard-gate flag applies (no auth, no data loss, no audit/security, no external
provider, no removed validation), so this is not `high-risk`; it is not one
yes/no question, so not a `spike`. It sits above `small` for one honest reason
beyond the flag count: the tutorial's step 6 is not a pure rename — retiring
`compound-learn` as a stage moves the synthesis it gated onto the **status**
axis, which sits *after* `approve`, so renaming the words alone would leave a
reader running `fgos compound` against an item the verb refuses (see Phase 1
below). That is a factual sequence correction, and it deserves the phased
treatment rather than being waved through as a find-and-replace.

No per-child `CONTEXT.md` exists. This child inherits the parent's locked shape
and its single vocabulary map: `docs/history/spec-docs-lifecycle-realignment/plan.md`
(§ "The one rewrite rule"), grounded in `RESEARCH.md` p4's per-line LIVE vs
HISTORICAL classification. Nothing below reopens either.

impact-analysis: **full** — `fgos tool query --capability impact-analysis
--status present` returns GitNexus `present`. Recorded for completeness only:
this item's whole footprint is Markdown prose with no code symbols, so no proof
point below leans on blast-radius evidence, and a `present` status is not a
freshness guarantee (`CLAUDE.md`'s capability gate).

## Scope — three files, and what stays untouched

Footprint (unchanged from the item record):

1. `docs/tutorials/walking-a-heavy-item-through-a-3-child-split.md`
2. `docs/distribution-vision.md`
3. `docs/backlog.md` — **open rows only**

Untouched, per `RESEARCH.md` p4 and the parent's "Never rewrite" rule:

- `docs/backlog.md:62`, `:107`, `:128`, `:130`, `:132`, `:133` — every one ends
  `— done`. They are historical records of completed work (STR89/STR90/STR92/
  STR93 among them) and name the retired skills correctly *for their own time*.
- `docs/backlog.md:43` — an open (`proposed`) row whose `compound-learn` mention
  narrates a dated dogfood incident (2026-07-28): historical text inside a live
  row.
- `docs/backlog.md:13`, `:26`, `:28` — open rows using `clarify`/`decompose` as
  the ordinary vocabulary of their time rather than as an instruction to follow.
  `RESEARCH.md` p4 recorded these as genuinely ambiguous rather than forcing
  them; this child does not force them either.
- Sibling-owned files: `docs/specs/*` (children 1–3), `AGENTS.md` (`tsk-2el`),
  `CHANGELOG.md` (`tsk-q88`), `src/cli/command-registry.mjs` (`tsk-2so`). The
  CLI's own `fgos discover` help text still says "at stage clarify" — that is
  `tsk-2so`'s file, deliberately left alone here.

## Approach

**Chosen path: apply the parent's vocabulary map file by file, correcting a
claim only where the rename would otherwise leave the reader with something
that does not work.**

Rejected — *pure token substitution across all three files*: the tutorial's
step 6 would then instruct a reader to run `fgos compound` before `fgos
approve`, which the verb refuses (`fgos compound` requires status
`retrospective`, reachable only after `approve` → `delivered` →
`retrospective`). A tutorial is Diataxis learning-oriented and meant to be
followed; a rename that leaves it unrunnable is not done.

Rejected — *rewriting the tutorial's narrative into today's flow wholesale*:
it narrates one real past run (`tsk-3wr`). The events stay as they happened;
only the names, verbs, and the ordering a reader would copy get corrected.

Rejected — *extending to `docs/backlog.md`'s ambiguous rows (`:13`, `:26`,
`:28`)*: `RESEARCH.md` p4 classified them as neither clearly LIVE nor clearly
HISTORICAL, and the item description names exactly three rows. Forcing them
would be this child inventing a classification the research deliberately
declined to make.

### Decided: rewrite the tutorial's H1, do not run `fgos docs-index`

The parent's plan dropped `fgos docs-index` from the working footprint on the
premise that no child edits a doc's first H1. This child does: `:3`
(front-matter `title:`) and `:8` (the H1) both carry the retired stage name
`clarify` and are both named in the item's own description. Checked against the
real mechanism rather than assumed:

- `docs/enduser-docs-index.json:2142-2144` currently holds this doc's entry as
  `{docPath, title: "Walking a heavy fgOS item through clarify, …",
  sourceCaptureId: "tsk-3wr"}`.
- The `enduser-docs-index-stale` doctor check
  (`src/setup/registrations.mjs:1133-1154`) compares **`docPath` sets only**,
  one-directional, and never looks at `title`. A changed headline cannot make it
  fail.
- `sourceCaptureId` is resolved by exact-matching `docPath`
  (`src/report/enduser-index.mjs`), so the `tsk-3wr` back-link is untouched by a
  title change — the irreversibility the parent's no-rename decision protects
  against does not apply here.
- Nothing in `test/report/enduser-index.test.mjs` asserts this doc's title.

So: rewrite both lines, leave `docs/enduser-docs-index.json` alone. The index's
`title` field goes cosmetically stale until the next `fgos docs-index` run
(which `fgos-indexing` performs after any compound-learn doc write, and which
`fgos doctor --fix` can also do), with no check, test, or back-link affected.
That keeps this child inside its declared footprint, which is the sibling-safety
property the parent split for in the first place.

### Risk map

| Component | Risk | What would prove it |
|---|---|---|
| Renaming `compound-learn` in the tutorial's step 6 without fixing the sequence, leaving a reader with a command the engine refuses | **medium** | Read `bin/fgos.mjs`'s own `compound` help text and `src/state/status-fsm.mjs`'s `TRANSITIONS` before writing step 6; the written sequence must match the real status chain. Proof point carried to `fgos-coding-validating`. |
| Editing a historical `done` backlog row, or the dated dogfood narration at `:43` | **medium** | Per-line classification is already fixed by `RESEARCH.md` p4 and restated under Scope above; after the edit, `git diff docs/backlog.md` must show hunks touching only the three `proposed` rows `p-4b7dd2ed` / `p-af05e742` / `p-4c81ca74`. Proof point carried to `fgos-coding-validating`. |
| Breaking `scripts/check-decision-citation-drift.mjs`, which scans `docs/backlog.md` | **medium** | `npm test` is the first clause of the item's own verify. |
| `docs/backlog.md` correctness resting on no verify clause at all | **medium** | A targeted grep over just those three rows, run and quoted at implement time (see Assumption A2). |
| The tutorial's front-matter `title:` (`:3`) drifting from its first H1 (`:8`) | low | Both lines carry the same sentence and both get the same edit; `docs/enduser-docs-index.json`'s `title` is derived from the H1, so the two must move together. See A3. |

### Order

`fgos graph --json` puts this graph at 603 nodes / 331 components with
`topUnblock` skipped at that size and `tsk-1xn` off the `criticalPath`; the item
carries `deps: []` and no other item depends on it, so ordering is free of
external leverage. The three files are independent of one another. Order below
is by risk-first: the file needing real judgment goes first, while the session
still has the FSM freshly read.

## Shape — three phases, one item

### Phase 1 — `docs/tutorials/walking-a-heavy-item-through-a-3-child-split.md`

Retired names, per `RESEARCH.md` p4: `:3`, `:8`, `:14`, `:23`, `:30`, `:48`
(`clarify`, `decompose` as live stages), `:54` (`fgos-planning`), `:94`
(`fgos-validating`), `:167` (`fgos-code-implement`), `:138`, `:161`, `:177`
(`compound-learn`).

Applying the parent's map:

- `clarify` as the stage where decisions get locked Socratically → stage
  `exploring`, run by `fgos-coding-exploring`. The tutorial's own step 2 is
  exactly that work. `clarify` itself is gone as a stage
  (`workflow-stage-graphs.mjs:78-89`); it survives only as a pre-item-creation
  Init helper, which is not what step 2 describes.
- `clarify -> decompose` (`:48`) → `exploring -> planning`, still applied by
  `fgos discover` (`src/intake/discovery.mjs`'s `nextDiscoveryEdge` returns
  `exploring -> planning`), so the command in the code block stays correct.
- `decompose` as the live split stage (`:23`, `:54`) → `planning`. The verb that
  runs the split judgment there is `fgos plan`, not a second `fgos discover`
  call — so the two `fgos discover tsk-3wr` calls in step 3 (`:61`, `:84`)
  become `fgos plan tsk-3wr`, and `judgeDecompose` is named as what `fgos plan`
  runs. The verdict values (`decompose` / `pass-through`) are outcome names and
  stay byte-for-byte, per the parent's map.
- `fgos-planning` (`:54`) → `fgos-coding-planning`; `fgos-validating` (`:94`) →
  `fgos-coding-validating`, described as `fgos-coding-planning`'s own second
  phase inside stage `planning` rather than a stage of its own (it holds no
  `skillMap` entry); `fgos-code-implement` (`:167`) → `fgos-coding-implement`.
- `compound-learn` (`:138`, `:161`, `:177`) → the **status** `retrospective`.
  This is the sequence correction: `status-fsm.mjs`'s chain is
  `awaiting-approval → delivered → retrospective → cleanup → done`, so step 6's
  order becomes `approve` (merge, → `delivered`) → `retrospective` → `compound`
  + write the doc → `cleanup` → `done`, not `compound` → `approve` → `done`.
  Step 8's "the same six steps as any other item" is re-counted against whatever
  the rewritten walkthrough actually contains.

Keep as-is: `fgos pick` / `fgos take --role session` / `fgos return` / `fgos
move` and the whole narrative of what happened in the real `tsk-3wr` run,
including the flake recovery in step 5 and the `docs/reference/` test breakage
in step 7. Front-matter `source_capture_ids: [tsk-3wr]` and `timestamp` stay
untouched (the parent's "never rewrite a capture link" rule).

### Phase 2 — `docs/distribution-vision.md`

- `:151-152` — "Mỗi milestone vẫn phải qua `fgos-exploring` … trước khi
  `fgos-planning`/thi công" → `fgos-coding-exploring` / `fgos-coding-planning`.
- `:157`, `:160`, `:162`, `:164`, `:166` — each asserts "(stage `clarify`,
  `<not-started>`)" (see the Notation note under Verify). Re-read from the real
  store at plan time: `tsk-2qz`, `tsk-2cs`,
  `tsk-2ta`, `tsk-49r`, `tsk-1qm` are all `status: done`; the first four still
  carry the historical `stage: compound-learn`, `tsk-1qm` carries no stage.
  These lines are wrong on both axes and a reader would act on them, so each
  becomes a plain `done` statement rather than a stage claim — the stage field
  on a closed item is a historical artifact, not information a reader of §7
  needs.
- `:146` — "cây decompose" describes the `parent` field's tree. Left alone: it
  is a noun for the lineage tree, and `rollup`'s real behavior it documents is
  unchanged. Renaming it would state something about a stage that sentence is
  not about.

Vietnamese voice, matching the file.

### Phase 3 — `docs/backlog.md`, three open rows only

- `:36` (`p-4b7dd2ed`) — `fgos-exploring/SKILL.md` → `fgos-coding-exploring/SKILL.md`
  (three mentions in the row, including the acceptance column).
- `:37` (`p-af05e742`) — `fgos-validating` → `fgos-coding-validating`.
- `:38` (`p-4c81ca74`) — `src/intake/decompose.mjs` → `src/intake/plan.mjs`;
  `judge-executor.mjs` no longer exists, so the pointer is dropped rather than
  renamed; `fgos-exploring`/`fgos-planning` → `fgos-coding-exploring`/
  `fgos-coding-planning`; "clarify stage" as the name of `discovery.mjs`'s own
  stage → `discovery`.

The dated dogfood facts inside those rows (2026-07-28, `tsk-1wd`, commit
`ffd211a`, the 1463/1463 suite number) are historical evidence and stay
verbatim. Only the names of things that still exist under new names change.

### Cases worth proving against

- **Boundary — historical rows survive.** After the edit, `docs/backlog.md`
  must still contain `fgos-planning`, `fgos-validating`, `fgos-exploring` in
  its `— done` rows. A pass that scrubs every occurrence is wrong even though
  no verify clause would catch it.
- **Existing behavior must not regress.** `npm test` covers
  `check-decision-citation-drift` and `check-decision-codes` over
  `docs/backlog.md`.
- **The tutorial stays runnable.** Every command in a code block must be a verb
  that exists today and would be legal at the point the tutorial issues it.
- **Empty case.** `README.md` is clean (`RESEARCH.md` p4, zero hits) and is not
  in this footprint; no file is edited to "look consistent" without a real
  stale name in it.

## Verify

**Notation.** Throughout this plan, `<not-started>` stands in for the literal
lowercase word fgOS uses for a not-yet-started status — the first value in
`src/state/status-fsm.mjs`'s chain. It is written this way rather than pasted
because the plan gate's own completeness check (`src/state/gate-bypass.mjs:114`)
matches that word case-insensitively **anywhere** in the artifact and reads it as
a stray unfinished-work marker; quoting a stale doc line verbatim would flip an
otherwise clean plan to "has open items" on nothing but a quoted string. The
authoritative, byte-exact command lives on the item itself — read it with
`fgos show tsk-1xn`. Nothing else in this plan is abbreviated.

The item's pinned command, unchanged (with that one substitution):

```
npm test && ! grep -qE 'fgos-(planning|validating|code-implement)' docs/tutorials/walking-a-heavy-item-through-a-3-child-split.md && ! grep -q 'fgos-planning' docs/distribution-vision.md && ! grep -q 'stage `clarify`, <not-started>' docs/distribution-vision.md
```

All three negatives are RED today, re-checked at plan time: the tutorial matches
at `:54`/`:94`/`:167`, `distribution-vision.md` matches `fgos-planning` at
`:152` and "stage `clarify`, `<not-started>`" at
`:157`/`:160`/`:162`/`:164`/`:166`. The
renamed forms (`fgos-coding-planning` etc.) do not match either pattern, so the
clauses flip only on real work.

`npm test` cannot go red from doc content alone, so it is a regression guard
here, not evidence this item worked. The three greps are.

## Assumptions

- **A1** — each file keeps its own existing voice and language (the tutorial and
  the backlog rows in the mix of Vietnamese/English they already use,
  `distribution-vision.md` in Vietnamese). Not material to scope; pinned rather
  than asked.
- **A2** — **the pinned `verify` is kept as-is even though it says nothing about
  `docs/backlog.md`.** It could be tightened via `fgos edit --verify` to anchor
  on the three row ids, but any blanket backlog grep would be permanently red
  against the historical `— done` rows that must keep the old names, and a
  row-anchored clause adds real quoting fragility to the string `goal-check.mjs`
  spawns. The caller pinned this command; it is real and red-today for two of
  three files, and the third is covered by the risk map's own targeted grep at
  implement time. Flagged as unproven-by-verify for `fgos-coding-validating`
  rather than silently patched.
- **A3** — the tutorial's front-matter `title:` (`:3`) and its first H1 (`:8`)
  stay identical to each other after the edit, matching how they read today.
  `docs/enduser-docs-index.json`'s `title` for this doc goes cosmetically stale
  as a result; that is a decided, evidence-backed consequence (see § "Decided:
  rewrite the tutorial's H1"), not an open question.

## Outstanding questions

None
