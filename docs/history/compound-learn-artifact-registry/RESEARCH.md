# Research log — tsk-28x, stage `discovery`

## Round 1 (2026-08-11)

**Asked:** is tsk-28x's goal (extensible artifact-producer registry for
compound-learn, generalizing the register-style pattern, keeping the 4
Diataxis quadrants pure) clear enough to move forward to `fgos-exploring`?

**Routed mechanically:**

- `registerCheck`/`registerFix`/`registerConfigDefault` — found:
  `src/setup/registrations.mjs:69/90/115`. Simple pattern: a module-level
  array + a register function with a duplicate-id guard and shape
  validation, no framework magic. Confirmed as the cited precedent.
- `fgos-compounding`'s Diataxis-purity hard rule — found:
  `.claude/skills/fgos-compounding/SKILL.md:34` ("Do not invent a fifth
  Diataxis quadrant or blend two"), `:42`/`:89`-`90` (writes must land at
  `docs/<quadrant>/<file>.md` matching the stored tag).
- The actual choke point this hard rule sits on — found:
  `src/state/store.mjs:859` — `DIATAXIS_DOC_TYPES = new Set(['tutorial',
  'how-to', 'reference', 'explanation'])`, enforced by `assertValidDocType`
  (`store.mjs:870`, called from `bin/fgos.mjs:1376`'s `compound` verb).
  This is the literal field a `changelog` producer's write would fail
  against today — confirms the item's own stated tension is real and
  concrete, not speculative.
- **`docs/history/compound-learn-artifact-registry/DISCUSSION.md`** —
  found: a 579-line, actively-maintained `fgos-coding-shaping` discussion
  for this EXACT feature (title matches tsk-28x's own title near
  verbatim), last touched 2026-08-10 (one day before this research round).
  This is decisive evidence, not a side reference — see Findings below.

**Findings from `DISCUSSION.md`:**

- **D-tsk28x-1 is already locked** (two orthogonal axes: cognitive-state
  axis, of which Diataxis is one closed profile; identity axis, OKF
  9-type precedent) — matches the same decision already recorded on
  tsk-28x's own `view.decisions` before this session started. Confirmed
  stable through round 6 (§1, §6.2).
- **The actual registry shape is explicitly NOT yet decided.** §7 states
  plainly: "§6.4 còn bốn phương án chưa chọn, nên chưa chia được task thi
  công" (§6.4 still has undecided options, so implementation tasks can't
  be split yet). §6.4 narrows four options to one real candidate for the
  storytelling half (Option 2 / Lane B: batch-scan over the population,
  rank, spawn `draft` candidates, async human curation, self-monitoring
  doctor check) — but §1's own status line says outright: **"Kết luận
  chưa mint, chờ xác nhận"** (conclusion not yet minted, awaiting
  confirmation).
- **tsk-28x's own dependency list is flagged as possibly wrong**, in the
  same document, by the same author who wrote it: §3 row E — "Ranh giới
  scope tsk-28x vs tsk-12m | CHƯA RÕ" (unclear), and explicitly: "`deps:
  [tsk-12m]` đặt lúc submit có thể không còn đúng" (the tsk-12m dep set at
  submit time may no longer be correct). §7's "Quan hệ với tsk-28x (chính
  nó)" section confirms: the `tsk-1hy` dep is confirmed correct (that probe
  completed 2026-08-09 and its findings are folded into §3 rows J/J2/J3),
  but the `tsk-12m` dep is still an open question.
- **Three named risks are flagged as not yet addressed** even under the
  Lane-B proposal (§6.4, "Ba điều còn chưa chắc"): round-count-as-ranking-
  signal is a candidate, not a proven signal (no AUC measurement yet, no
  hand-labeled set exists in fgOS); the ask-material vein's second
  boilerplate layer (§3 row J3) isn't filtered yet; the human curation cost
  for Lane-B's `draft` candidates is unestimated (risk of an unreviewed
  `draft` graveyard).

**Verdict:** **unclear.**

This is not an implementation detail fgos-planning could just decide —
it's the item's own scope-defining shape, already substantially worked
through in an existing, still-open discussion, explicitly marked
un-finalized by whoever has been driving that discussion. Handing this to
`fgos-exploring` to lock Socratic decisions now would mean re-deciding (or
guessing past) a choice that discussion's own author flagged as
deliberately not yet made — the opposite of what `fgos-exploring`'s "cite
what was already checked, never re-ask what's already settled" discipline
calls for.

**Question returned to the caller:** tsk-28x's own scope depends on two
things `docs/history/compound-learn-artifact-registry/DISCUSSION.md`
itself marks as still open, as of 2026-08-10 (§1, §3 row E, §6.4, §7): (1)
minting/confirming the Lane-B conclusion for the registry's storytelling
half (or choosing differently), and (2) resolving whether tsk-28x still
correctly depends on `tsk-12m` given the scope-boundary question raised in
§3 row E. Which should happen first — continuing that discussion (e.g. via
`/fgOS:coding-shape tsk-28x`) to mint these before any Socratic
clarify-locking starts, or proceeding to `fgos-exploring` now on the
understanding that its own decisions may need to reopen or narrow what
`DISCUSSION.md` already drafted?

## Round 2 (2026-08-25)

**Asked:** stage `discovery` re-entry after an extensive `/fgOS:coding-shape
tsk-28x` continuation (agreed in Round 1's own answered ask, "đồng ý tiếp
tục thảo luận coding-shape") — are the two gaps Round 1 raised still open,
is the item clear enough to move to `planning` now, and does real evidence
support raising `tier`/`risk` off `light`?

**Routed mechanically:**

- Round 1's gap #1 (Lane-B storytelling-half conclusion) — resolved. Read
  `docs/history/compound-learn-artifact-registry/DISCUSSION.md`: 18 locked
  decisions `D-tsk28x-1` through `D-tsk28x-18` (`grep -oE
  "D-tsk28x-[0-9]+" DISCUSSION.md | sort -Vu` → 1..18, none skipped), the
  "## Thứ tự thi công" section carries a 10-step build order with named
  hard gates, and the item now has a full agent-ready plan at
  `plans/260825-1841-knowledge-registry/plan.md` plus 12 phase files
  (`phase-01-registry-domain-model.md` … `phase-12-deprecate-compound.md`)
  each self-contained (own context, deps, footprint, acceptance).
- Round 1's gap #2 (tsk-12m dependency) — resolved by `D-tsk28x-2`
  (DISCUSSION.md, round 7, 2026-08-11): dependency split, `tsk-12m` no
  longer blocks `tsk-28x`. The item's live `deps` field (`fgos list --id
  tsk-28x --json`) already reads `["tsk-1hy"]` only, and `tsk-1hy` is
  `delivered` — deps fully satisfied.
- Scope size for tier/risk — `plan.md`'s own footprint-conflict section
  reports the real engine (`fgos plan`) found **5** file-overlap pairs
  across the 12 phases, 2 of which manual footprint analysis missed
  (`src/cli/command-registry.mjs`, `src/setup/checks.mjs`), on top of the
  3 manually-caught `bin/fgos.mjs` overlaps (05↔06, 05↔07, 06↔07).
  `bin/fgos.mjs` itself is 4215 lines (`wc -l`) — the core CLI entrypoint,
  touched by phases 05/06/07/12. Phase 11 (migration) carries an explicit
  conservation gate over ~268 existing docs (`docs -name '*.md' | wc -l`
  → 1592 total repo-wide today, of which the plan's own "Vấn đề đang giải"
  section cites 268 as the pre-migration end-user doc corpus this specific
  registry governs) with a dry-run-before-apply hard gate, and phase 06
  adds a producer-door enforcement gate that can reject writes repo-wide
  once live. This is materially larger and more cross-cutting than
  `light`/`light` — no single-file, low-blast-radius change.

**Verdict:** **clear.**

Both Round 1 gaps are resolved by real, cited decisions and artifacts, not
by re-deciding them here. `tier`/`risk`: real evidence (footprint-conflict
count, core-CLI file size, migration conservation gate, enforcement gate)
supports `heavy`/`heavy`, up from the item's current `light`/`light` —
recommending the item's classification be updated to match.

**Verify (real, runnable):** `npm test && node bin/fgos.mjs doctor`
(plan.md's own Acceptance section: `npm test` green including new
harnesses, `fgos doctor` green including the 8 new knowledge checks phase
08 registers).

## Round 3 (2026-08-27) — tsk-5mh, stage `discovery`

**Asked:** is tsk-5mh's goal (run the real `--apply` of
`scripts/knowledge-migration.mjs` — plan.md's phase 11/§11 steps 9-10 —
against the live 332-doc corpus, then verify B3's doc-sources/docs-index
resolver subset holds after real paths change) clear enough to skip
`exploring` and move straight to `planning`?

**Routed mechanically:**

- Preconditions from the item's own description — checked live, not
  trusted from status text: `.fgos/config.json`'s `docRegistry.enforce` is
  `true` (confirmed by direct read, not by citing tsk-1uj's "delivered"
  status alone — matches CLAUDE.md's Impact-analysis gate discipline of
  never trusting a status label over a live check). `tsk-5mh`'s own `deps`
  is `["tsk-1uj"]`, and that item is `delivered` per `fgos list`.
- `scripts/knowledge-migration.mjs` dry-run, run live against the real
  store (`node scripts/knowledge-migration.mjs`, no `--apply`): clean
  report — `moveCount: 332`, `alreadyMigratedCount: 0`,
  `conservationErrors: []`. Zero errors on the actual corpus, not a
  synthetic fixture.
- `test/scripts/knowledge-migration.test.mjs` (749 lines) — found:
  extensive apply/rollback/conservation coverage against a synthetic
  store (path+content rollback on partial-apply failure, duplicate-source
  and duplicate-target conservation errors, missing-source-file refusal,
  not-registered/not-live/non-active-topic refusals, shell-metacharacter
  path safety via `execFileSync`). This is the tsk-3uc hardening the item
  description cites, confirmed present, not just claimed.
- B3's resolver mechanism (item's own acceptance-criteria subset: only the
  doc-sources/docs-index half of full B3, not `compound`'s
  no-new-path/no-auto-promote half) — found already built and wired, not
  something this item needs to construct:
  - `src/state/knowledge-registry.mjs:772-789` (`doc.path-move` reducer):
    on every move, the doc's OLD `currentPath` is pushed into its
    `aliases` array before `currentPath` is overwritten — this is what
    makes an old path keep resolving after a real move, mechanically, not
    by convention.
  - `bin/fgos.mjs:3143` (`doc-sources` verb) calls
    `findSourceCaptureIds` (`src/report/enduser-index.mjs:74`), which
    calls `resolveDocPath` (`src/report/knowledge-resolver.mjs:31-45`) —
    that resolver checks both `currentPath` AND `aliases` for a match.
    Old-path lookups after migration hit the alias branch; new-path
    lookups hit the currentPath branch; both resolve to the same `docId`.
  - `buildEnduserIndex` (`src/report/enduser-index.mjs:111`, the `docs-index`
    verb's core) also calls `resolveDocPath` per doc and surfaces its
    `aliases` in the output entry — a moved doc's index entry is not
    expected to null out its source.
  - No dedicated "B5 doctor check" (`doc-alias-broken` etc.) exists yet
    (`rg` for those names in `src/setup/checks.mjs`/`bin/fgos.mjs`: zero
    hits) — that is separately-scoped future work (DISCUSSION.md's own
    B5 section), not something tsk-5mh's verify can lean on; this item's
    own verify has to check the resolver directly instead.
- Minor non-blocking discrepancy: the item's own description says "330/332
  doc vẫn ở currentPath cũ", but the live dry-run reports `moveCount: 332`
  / `alreadyMigratedCount: 0` (i.e., all 332, not 330). This is a stale
  approximate count in the submitted text, not a real conservation gap —
  the dry-run's own `conservationErrors: []` is the authoritative live
  answer, and it is clean. Not something `exploring` needs a person to
  resolve.

**Verdict:** **clear.**

Every precondition the item's own description names is independently
confirmed live (not just cited from another item's "delivered" status),
the migration script's dry-run against the real corpus is clean, its
apply/rollback/conservation logic is already unit-tested, and the
resolver mechanism the item's own acceptance criteria (B3 subset) depends
on is already built and already does the aliasing this item needs — none
of this requires a product decision or a person's judgment call, only
execution + real-corpus verification. `tier`/`kind`/`risk` already read
`heavy`/`feature`/`heavy` on the item, matching this round's own evidence
(330 live files, producer-enforcement already on, no partial-apply safety
net beyond this script's own rollback) — no `fgos edit` needed, values
already correct.

**Verify (real, runnable):**

```bash
npm test                                    # full suite green, incl. test/scripts/knowledge-migration.test.mjs
node scripts/knowledge-migration.mjs        # dry-run: moveCount 332, conservationErrors: [], reviewed by a person before --apply
node scripts/knowledge-migration.mjs --apply
# then, for >=3 sampled moved docs (old + new path each):
node bin/fgos.mjs doc-sources <oldPath>     # same capture ids as pre-apply (resolves via new alias)
node bin/fgos.mjs doc-sources <newPath>     # same capture ids (resolves via currentPath)
node bin/fgos.mjs docs-index --dir <repoRoot>  # regenerates docs/enduser-docs-index.json with all 332 docs still present, none nulled
```
