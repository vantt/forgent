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
