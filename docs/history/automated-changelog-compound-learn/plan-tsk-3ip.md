# Plan — tsk-3ip: cơ chế quan sát/nhắc CHANGELOG + bộ đếm tỉ lệ quên

Mode: small

Flags counted (per `fgos-routing`'s Mode gate): **existing covered
behavior** only (`test/setup/checks.test.mjs`'s own `DOCTOR_CHECKS has
exactly the ... checks` assertion enumerates every registered check id by
name — adding `changelog-unreleased-stale` requires updating that existing
list). No auth/authorization/data-model/audit-security/external-systems/
public-contracts/cross-platform/multi-domain flags apply — this item adds
two new, self-contained, read-only-or-append-only functions, it does not
touch an existing behavior's logic. **weak proof around the area** does
NOT apply: `fgos tool query --capability impact-analysis --status present`
returned exactly one provider (gitnexus), `status: present`, checked fresh
this session — posture is **full**. 1 flag → **small** lane (a few files,
no gray areas — narrower than the item's own submission-time `tier:
standard`, which predates this design pass; `plan.md`'s `Mode:` line is
the authoritative lane per `fgos-coding-planning`, not `item.tier`).

No `CONTEXT.md` for this feature dir — same precedent `tsk-469`'s own
`plan.md` already set (see its own `## Scope` note): the item's
`description` already carries the locked decisions directly, quoted from
`docs/history/automated-changelog-compound-learn/DISCUSSION.md` §6.1/§6.4/
§7 (`#task-changelog-observe-remind`). Nothing here reopens or reinterprets
those — every choice below cites the passage it honors.

## Approach

Two independent, mechanical observations — neither writes a verdict about
"is this changelog-worthy," neither blocks merge (DISCUSSION.md §6.1's
table: quan-sát/nhắc is exactly "đếm, báo cáo, nhắc," never "phán đoán,"
and R2 from `tsk-28x` §6.4 forbids a merge gate outright):

1. **Doctor check `changelog-unreleased-stale`** (§6.1's own named example,
   registered via `registerCheck` per `src/setup/registrations.mjs:65` —
   the AGENTS.md Install/setup/doctor gate obligation the item's
   description calls out as non-optional). Purely structural, read-only,
   stateless — no git-log walk, no persisted checkpoint:
   - `CHANGELOG.md` absent at the main-checkout root → `passed: true`,
     informational ("not found — nothing to check"). This is the item's
     own required graceful-absent handling; a fresh `fgos setup` consumer
     with no changelog yet is a normal state, not an error, and is also
     why this item never waited on sibling `tsk-469` (§7's own "không
     phải dependency cứng" line).
   - `CHANGELOG.md` present: extract the substring between the literal
     heading `## [Unreleased]` (exact string, per the item's own "CHI
     TIET KY THUAT" requirement — matches what `tsk-469` actually wrote,
     confirmed by reading the real `CHANGELOG.md` this session: heading
     present at line 8, `### Added`/`### Changed`/`### Fixed`/`### Removed`
     immediately under it, currently empty) and the next `\n## ` heading
     (or EOF). Test that substring for any line matching `/^-\s+\S/m` — a
     real bullet with content, not just the four empty sub-headings.
     - A bullet found → `passed: true` ("has pending entr(ies)").
     - No bullet found (including the heading itself missing — same
       "nothing to report against" bucket, no separate branch) →
       `passed: false`, message states it is a reminder only and never
       blocks merge.
   This is the "structural non-empty check" reading of §6.4's "đếm, đừng
   mắng" — mechanical string/regex work, never a judgment about whether
   any specific merged change deserved an entry.

2. **`fgos check` nag + forget-rate counter** (`bin/fgos.mjs`,
   `collectMissingOutcomeNag` at line 620 is the mold this item's own
   acceptance criteria name explicitly — same shape: a `collect*` function
   folded into `collectCheckData`'s returned object, aggregate never
   per-merge). New `collectChangelogNag(view, dir)`:
   - Reads `CHANGELOG.md` the same way as (1) (shared `unreleasedHasEntries`
     helper, exported from `registrations.mjs`, imported into `bin/fgos.mjs`
     — avoids duplicating the extraction/regex logic in two files).
   - Absent file → `{ fileExists: false }`, no write (nothing to
     checkpoint yet).
   - Present → `{ fileExists: true, hasEntries, deliveredCount }`
     (`deliveredCount` = current count of items at `status: 'delivered'`
     in `view.work`, the same aggregate-not-per-item shape the ~176/week
     figure in the item's own description demands), and appends one line
     `{ ts, hasEntries, deliveredCount }` to a new
     `changelog-nag-history.jsonl` in the same data dir `entropy-
     history.jsonl` already lives in (`entropyHistoryPath`'s own precedent,
     same file — append-only, mirrors `appendHistoryEntry`). This is the
     item's own required "bộ đếm ghi lại tỉ lệ quên" — each run's
     `{ts, hasEntries, deliveredCount}` snapshot is what lets someone,
     after N real runs spread across N real merges, read off the three
     numbers the item's description says are currently guesses: how often
     `deliveredCount` actually climbs (real user-visible change
     frequency), and how many of those climbs happened while `hasEntries`
     stayed `false` (the forget rate itself). This item does not compute
     the three numbers — only accumulates the raw data point every
     `fgos check` run, honoring "đếm, đừng mắng."
   - Wired into `collectCheckData`'s returned object as
     `changelogNag: collectChangelogNag(view, dir)`, purely additive next
     to the existing `missingOutcomeNag`/`entropy` fields (RUL11
     optional-additive discipline already governing every other field on
     that object) — no existing field's shape changes.

No config default is registered (`registerConfigDefault`) — nothing here
introduces a configurable threshold or shape; the item's own description
only requires this "if any config default" is added, and none is.

**Rejected alternative:** deriving "stale" from `git log` on `CHANGELOG.md`
(last commit touching the file, or diffing the Unreleased section across
commits) to detect whether a merge included a real entry. Rejected because
(a) it makes the doctor check no longer read-only-and-self-contained in
the way `checkConfigNotStale`/`checkRootDrift` already are — every existing
check in `registrations.mjs` reads current state, none shells out to `git
log` for a *history* walk; (b) it would require the checkpoint state doctor
depends on to be *written* somewhere, and doctor checks are read-only by
construction (RUL9) — the write has to live in `fgos check`'s own
collector instead, so doctor would end up depending on `fgos check` having
already run, an ordering coupling this item's own description never asks
for; (c) the structural "does Unreleased currently have a bullet" read is
simpler, fully mechanical, and answers the same real question ("is there
something pending that hasn't been captured yet") without needing git
plumbing at all.

## Risk map

| Component | Risk | Proof point (→ `fgos-coding-validating`) |
|---|---|---|
| `test/setup/checks.test.mjs`'s existing `DOCTOR_CHECKS has exactly the ... checks` assertion | medium — the one flagged "existing covered behavior" touch; forgetting to add `changelog-unreleased-stale` to that list fails an existing test, not a new one | run the existing test unmodified first to see it fail on the new registration, then update the `deepEqual` list — same forcing-function precedent `checks.test.mjs`'s own file history already relies on for every prior new check |
| Heading-extraction regex correctness against the real, already-existing `CHANGELOG.md` (tsk-469 already landed it) | low — verified directly this session by reading the real file: `## [Unreleased]` at line 8, four empty `###` sub-headings, next `## ` heading (`## [0.1.0]`) at line 18 | unit test both the doctor check and the nag's shared helper against the real repo-root `CHANGELOG.md` fixture shape (empty Unreleased) plus a fixture with a real bullet added |
| `collectChangelogNag`'s history-file write path | low — mirrors `appendHistoryEntry`'s existing, already-tested append-only shape 1:1 (same `.fgos` data dir, same mkdir-then-append discipline) | no dedicated proof needed beyond the entropy precedent already covering this shape; covered incidentally by the CLI-level `fgos check` test below |

`impact-analysis: full` (GitNexus present, checked fresh this session) —
`collectCheckData` (an existing, already-covered symbol) gets one new
field added to its return object; `fgos-coding-implement` runs
`impact({target: "collectCheckData", direction: "upstream"})` before
editing it, per the repo's own Always-Do gate, and reports the blast
radius before touching it.

## Files touched

- `src/setup/registrations.mjs` — new `unreleasedHasEntries`/section-
  extraction helper (exported), new `checkChangelogUnreleasedStale`,
  `registerCheck({id: 'changelog-unreleased-stale', ...})`
- `bin/fgos.mjs` — new import of the shared helper from
  `../src/setup/registrations.mjs`, new `collectChangelogNag(view, dir)`
  + `changelog-nag-history.jsonl` append helper, `collectCheckData` gains
  the new `changelogNag` field
- `test/setup/checks.test.mjs` — update the existing `DOCTOR_CHECKS has
  exactly the ...` id list; three new cases per the item's own required
  branches (file + Unreleased has an entry; file + Unreleased empty; file
  absent); one CLI-level `fgos check` case proving `changelogNag` appears
  in `fgos check --json` output and the history file gets appended

## Verify (unchanged from the item's own submitted value)

```
node --test test/setup/checks.test.mjs
```

## Assumptions

- The exact heading strings (`## [Unreleased]`, `### Added`/`### Changed`/
  `### Fixed`/`### Removed`) match what `tsk-469` actually wrote — not
  guessed: confirmed by reading the real `CHANGELOG.md` at the repo root
  this session (already merged; sibling task landed first in practice,
  though this item's own design never depended on that order per §7's
  "không phải dependency cứng").
- "Has entries" is decided structurally (any `- ` bullet line present in
  the Unreleased section), never semantically — this is the mechanical
  reading of the item's own "chỉ quan sát và nhắc" boundary, not a product
  judgment about which merged change deserved the bullet.

## Outstanding questions

None
