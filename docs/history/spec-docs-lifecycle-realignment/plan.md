# plan.md — spec/docs lifecycle realignment (tsk-5eq)

Mode: standard

Flag count: 3 of 10 — **public contracts** (`docs/specs/` is this repo's own
state layer; `AGENTS.md`'s Definition-of-done question 1 sends every stranger
agent to `docs/specs/reading-map.md`, and question 3 to an area spec's Shared
Entities table), **existing covered behavior** (`npm test` runs
`scripts/check-decision-citation-drift.mjs` over `docs/specs/*.md` and
`docs/backlog.md`, and a `enduser-docs-index-stale` doctor check covers
`docs/how-to/`), **weak proof around the area** (this item's own inherited
verify is vacuous — see Assumption A3). No hard-gate flag applies (no auth, no
data loss, no audit/security, no external provider, no removed validation), so
this is not `high-risk`; it is not one yes/no question, so not a `spike`. It is
above `small` because the work is not "a few files, no gray areas": eleven
files across four doc trees, two of them over 1000 lines, plus a real
LIVE-vs-HISTORICAL boundary that has to be honoured per file.

No `CONTEXT.md` exists for this feature — the item reached `planning` on a
`clear` discovery verdict (`discovery -> planning`, skipping `exploring`), so
no Socratic lock ever ran. The evidence base is
`docs/history/spec-docs-lifecycle-realignment/RESEARCH.md` round 1; every
decision below cites it.

impact-analysis: **full** — `fgos tool query --capability impact-analysis
--status present` returns GitNexus `present`. Recorded for completeness only:
this item's entire footprint is Markdown prose with no code symbols, so no
proof point below leans on blast-radius evidence. A `present` status is not a
freshness guarantee (`CLAUDE.md`), which is a second reason nothing here is
gated on it.

## The one rewrite rule (children must not each re-invent this)

Every child applies this same vocabulary map, so four independently-merged
children do not leave four different Vietnamese phrasings of the same stage
behind. Ground truth: `src/state/workflow-stage-graphs.mjs`.

| Stale text | Correct text | Evidence |
|---|---|---|
| stage `clarify` | retired entirely; a pre-item-creation Init helper `fgos-clarifying`, called by `/fgOS:submit` before an item exists | `workflow-stage-graphs.mjs:78-89` |
| chain `clarify→decompose→executing→compound-learn` | `discovery → exploring → planning → executing`, where a `clear` discovery verdict skips `exploring` and goes `discovery → planning` | `:90`, `:147`, `:153`, `:155-156` |
| stage `decompose` (as the live split stage) | stage `planning` | `:66-76` (rename), `:107-110` (`planning: 'Divide'`) |
| stage `decompose` (as a name that still exists) | keep, described plainly as a **drain-only legacy alias**: no new item can land there, 8 open items are still parked on it | `:66-76`; live store count |
| stage `compound-learn` | retired as a stage; the synthesis it gated is the **status** `retrospective` | `:25-29`; `status-fsm.mjs:10-19` |
| `fgos-planning` / `fgos-validating` / `fgos-code-implement` / `fgos-exploring` / `fgos-compounding` | `fgos-coding-planning` / `fgos-coding-validating` / `fgos-coding-implement` / `fgos-coding-exploring` / `fgos-coding-compounding` | `:211-222` |
| `fgos-validating` as a stage skill | it has no `skillMap` entry at all — it runs as `fgos-coding-planning`'s own second phase | `:216-217` |
| verb `fgos decompose` | verb `fgos plan` | `:66-68` |
| `src/intake/decompose.mjs` | `src/intake/plan.mjs` | `discovery.mjs:25-27` |
| `src/intake/judge-executor.mjs` | file no longer exists — drop the pointer | `src/intake/` listing |
| `judgeDiscovery` as a live nested judge | retired; `resolveDiscovery` requires a caller-supplied verdict | `discovery.mjs:44-51` |

**Never rewrite** a `sources:` frontmatter slug. `compound-learn-enduser-docs`
is a feature slug, not a stage name (`RESEARCH.md` p2). Likewise leave
`docs/decisions/`, `docs/history/`, `docs/journals/`, released `CHANGELOG.md`
sections, and every `done` backlog row alone — they describe the past
correctly.

Frontmatter convention, applied per file that has one: `area`, `updated`
(`YYYY-MM-DD` → `2026-08-12`), `sources: [feature-slug, ...]` (append
`spec-docs-lifecycle-realignment`), `decisions: [hex, ...]` (leave alone),
`coverage`. `docs/specs/reading-map.md` has no frontmatter and does not gain
one.

## Approach

**Chosen path: split into four children by file, one shared rewrite rule.**

Rejected — *one item, one pass*: the two largest targets are 1215 and 1043
lines with 220 and 66 stale occurrences respectively (`RESEARCH.md` p2). One
session carrying all eleven files cannot park mid-way without leaving the spec
tree internally inconsistent, and `AGENTS.md` priority #2 explicitly asks for
pieces that "park/tiến độc lập".

Rejected — *split by concern* (e.g. "all stage renames" as one child, "all
skill renames" as another): the footprints would overlap on every file, which
is exactly what `footprintOverlapAmong` exists to prevent. Splitting by file
gives disjoint footprints for free.

The inconsistency risk that splitting introduces is answered by the single
vocabulary table above rather than by refusing to split: the rule is written
once, here, and each child cites this file rather than re-deriving it.

### Risk map

| Component | Risk | What would prove it |
|---|---|---|
| Deleting a `clarify`/`decompose` mention that is legitimate legacy documentation, not staleness | **medium** | Each child's verify uses *targeted* negatives (a specific stale heading or phrase), never a blanket `! grep -q clarify`. The drain-only `decompose` alias must survive in prose — 8 live items depend on it. Proof point carried to `fgos-coding-validating`. |
| Breaking `scripts/check-decision-citation-drift.mjs`, which scans `docs/specs/*.md` and `docs/backlog.md` for superseded decision citations | **medium** | `npm test` is the first clause of every child's verify. |
| Rewriting historical narration (`done` backlog rows, dated dogfood incidents) | **medium** | LIVE-vs-HISTORICAL classification already done per line in `RESEARCH.md` p4; child 4 carries it. Proof point at `fgos-coding-validating`. |
| Four children drifting into four phrasings | low | The vocabulary table above; each child cites it. |
| `docs/how-to` renames severing capture back-links | **resolved, not a risk** | Decided against — see below. |

### Decided: do not rename the `docs/how-to/` files

Ten files (not seven) carry a retired stage/verb name in the filename. An index
entry's `sourceCaptureId` is resolved by exact-matching `docPath` against the
outcomes view folded from the **append-only** event log
(`src/report/enduser-index.mjs:72-79`), so a rename permanently severs that
back-link and re-running `fgos docs-index` cannot repair it — it records
`sourceCaptureId: null`. Nine of the ten currently hold a live back-link
(`RESEARCH.md` p3). The gain would be cosmetic filenames; the cost is
irreversible evidence loss. Logged as a decision on the item.

Consequence: `fgos docs-index` does **not** need to run, and
`.fgos/docs/enduser-docs-index.json` / `docs/enduser-docs-index.json` are
dropped from the working footprint. If a later child edits a how-to's first
H1, the index's `title` would drift and regeneration becomes necessary — no
child below does that.

### Scope: three specs added, `AGENTS.md` excluded

`RESEARCH.md` p2 found the same staleness in three specs outside the declared
footprint: `system-overview.md`, `enduser-docs-authoring.md`,
`enduser-docs-index.md`. They are in `docs/specs/`, owned by no sibling, and
leaving them stale would defeat the item's own premise. Child 3 takes them.

`AGENTS.md:80` also names three retired skills, but `AGENTS.md` is in **sibling
`tsk-2el`'s** footprint (`awaiting-approval`). Excluded — not this item's to
touch. Same for `CHANGELOG.md` (`tsk-q88`) and
`src/cli/command-registry.mjs` (`tsk-2so`).

### Order

`fgos graph --json` puts `tsk-5eq` in a 10-item component with its parent
`tsk-5sr` and eight siblings, **not** on the `criticalPath` (depth 10, an
unrelated chain), with `topUnblock` skipped/empty at this graph size — nothing
downstream is waiting on it, so ordering is free. The children have disjoint
footprints and no `deps` between them; they can run in any order or
concurrently. Suggested order is by leverage only: child 3 first (it contains
`reading-map.md`, Definition-of-done question 1), then 1, 2, 4.

## Shape — four children

Each child's verify is `npm test` plus a **targeted** positive/negative pair,
every anchor confirmed RED today (`RESEARCH.md`, and re-checked at plan time)
so it cannot pass before the work is real. This is deliberate: the parent's own
inherited verify does not have that property (Assumption A3).

1. **`docs/specs/work-state.md`** — rewrite `### Giai đoạn Làm-rõ (stage
   clarify)` (`:234-291`) and `### Giai đoạn Chia-việc (stage decompose)`
   (`:308-382`); update `### Bản ghi cổng discovery` (`:292-307`), `### Mô
   hình domain` (`:383-458`, which must also stop describing the registry as
   `coding` + `synthetic` only — `triage` and `fixture-marketing` exist), and
   `### Chạy context-discovery / phán chia-việc (discover)` (`:831-862`, the
   `plan` verb is missing). Sweep `## Business Rules`, `## Edge Cases
   Settled`, `## Open Gaps`, `## Pointers`. Bump `updated`; keep `coverage:
   full` honest.

2. **`docs/specs/runner.md`** — rewrite `### Quét làm-rõ trước dispatch
   (clarify sweep)` (`:96`) and `### Quét chia-việc trước dispatch (decompose
   sweep)` (`:138`); sweep the remaining 24 `clarify` / 35 `decompose` / 7
   `compound-learn` mentions. Bump `updated`.

3. **The four small specs** — `reading-map.md` (`:20`, `:23`, `:24`, `:25`,
   `:26`, `:28`, `:42`), `system-overview.md` (`:16`, `:53`),
   `enduser-docs-authoring.md` (six mentions), `enduser-docs-index.md`
   (`:30`, `:200`). Bump `updated` on the three that have frontmatter.

4. **The non-spec end-user docs** — `docs/tutorials/walking-a-heavy-item-
   through-a-3-child-split.md` (retired skill names at `:54`, `:94`, `:167`;
   retired stage names at `:3`, `:8`, `:14`, `:23`, `:30`, `:48`, `:138`,
   `:161`, `:177`), `docs/distribution-vision.md` (`:152`, and `:157`/`:160`/
   `:162`/`:164`/`:166`, which claim five items are "stage `clarify`, todo"
   when all five are `done`), and `docs/backlog.md` **open rows only**
   (`:36`, `:37`, `:38`). Rows `:62`, `:107`, `:128`, `:130`, `:132`, `:133`
   end `— done` and stay untouched.

### Cases worth proving against

- **Boundary — legitimate legacy survives.** After child 1, `work-state.md`
  must still document `decompose` as a drain-only alias. A rewrite that
  deletes every occurrence is wrong even though it would pass a naive grep.
- **Existing behavior must not regress.** `npm test` covers
  `check-decision-citation-drift` and `check-decision-codes` over these exact
  paths.
- **Partial completion.** Because the children merge independently, the spec
  tree is briefly mixed (say `work-state.md` updated, `runner.md` not). That
  is acceptable and is the point of splitting; no child may edit another's
  file to "keep them in sync".
- **Empty/no-op case.** Child 3's `enduser-docs-index.md` has only two stale
  lines; its verify must still be meaningful rather than trivially green.

## Assumptions

- **A1** — `docs/specs/` prose stays BA-grade and tech-agnostic, in
  Vietnamese, matching each file's existing voice (`AGENTS.md`, "Before
  touching code"). Not material to scope; pinned rather than asked.
- **A2** — `sources:` gains the slug `spec-docs-lifecycle-realignment`.
  Convention-following, not a scope change.
- **A3** — **the item's inherited verify is vacuous and is kept anyway.**
  `npm test && grep -q planning docs/specs/work-state.md` already passes
  today, because `work-state.md:422-423` contain `fgos-coding-planning` and
  `fgos-coding-validating`. `hasRealVerify` (`src/intake/discovery.mjs:89`)
  treats the string as real, so `fgos discover --verify` cannot replace it
  (`:440`). It is kept because the caller pinned it explicitly; the real proof
  lives in the four children's own verify commands, which are red today. This
  is flagged as unproven for `fgos-coding-validating` rather than silently
  patched.
- **A4** — no `fgos docs-index` run is required, given the no-rename decision.

## Outstanding questions

None
