# RESEARCH.md — tsk-hes: /fgOS:cook branch isolation (discovery round)

## Round 1 — 2026-08-12 (discovery stage, via fgos-researching)

**Asked:** Is the bug premise still live (cook writes discovery/exploring/
planning-stage docs directly onto the main checkout because it never
claims a worktree before invoking `fgos-coding-driving`)? Is the proposed
fix (claim via `fgos pick` + `EnterWorktree` right after submit, before
handing off to the driver) sound, or does it reopen a locked design
decision?

**Checked:**

- `plugins/fgOS/skills/cook/SKILL.md` (read directly, current content).
  Its own Hard rules section states verbatim: *"This skill still never
  claims before stage `executing` — now enforced by `fgos-coding-driving`'s
  own claim-timing hard rule (tsk-19j-4), not by this skill's own manual
  step ordering... discovery/exploring/planning work happens on the item
  while it is still `todo`."* Step 2 invokes `fgos-coding-driving` with no
  prior claim. Confirms the bug premise exactly as described — this is
  documented, intentional current behavior, not a latent accident.
- `fa067c9c` (`git show --stat`): a `docs(tsk-2ej)` commit — `plan.md` +
  `RESEARCH.md` for `fgos-coding-planning`'s discovery round — sits
  directly on the branch's own linear history, single-parent, no merge
  commit. Confirms cook-driven pre-executing writes land straight on the
  checkout cook itself was invoked from.
- `git log --oneline -10` on the current tip: a run of single-parent
  `docs(tsk-2sj)`/`docs(tsk-2ej)` commits immediately below the tip,
  interleaved with real `Merge branch 'fgw/tsk-*'` commits — i.e. some
  work lands through the worktree+merge path and some lands as bare
  sequential commits. Matches the two-path split the bug describes.
- `docs/history/fgos-coding-shaping-branch-isolation/CONTEXT.md` (tsk-5qs,
  merged same day, ~1h before this discovery round — `6abea4bc`, `Merge
  branch 'fgw/tsk-5qs'` at `79fead39`). This is the load-bearing find:
  - Same defect class, different caller (`fgos-coding-shaping` instead of
    `cook`), same root cause named explicitly: *"`fgos-coding-driving`'s
    claim-timing rule only claims a worktree right before the `executing`
    stage, so nothing ever created the `fgw/<id>` branch."*
  - Fix shape is byte-identical to what this item's own description
    proposes: route through `submit` when no item exists yet, then `fgos
    pick <id>` + `EnterWorktree` **before** any file write, then proceed —
    "so `fgos-coding-driving`'s own claim-timing rule sees status already
    `doing` and skips its own claim" (tsk-hes description) is exactly
    `fgos-coding-shaping`'s own new D4 behavior.
  - **D1 explicitly scopes this exact follow-up out on purpose, not by
    oversight**: *"The same class of bug also hits
    `fgos-coding-exploring`/`fgos-coding-planning` (confirmed: `fa067c9c`
    ...) — that is real, but a separate, wider architectural question this
    item does not take on."* `fa067c9c` is the SAME commit tsk-hes's own
    description cites as its live evidence — tsk-5qs's own research already
    surfaced the cook/planning-side instance of this bug and deliberately
    deferred it, rather than missing it. tsk-hes is that deferred
    follow-up.
  - tsk-5qs's own CONTEXT.md records no separate decision point about the
    "item sits in `doing` through discovery/exploring/planning, shows up
    in `/fgOS:stale`'s advisory" cost — the same cost tsk-hes's own
    description flags as "worth a real decision at exploring." It was not
    treated as a blocking trade-off for the sibling fix; `/fgOS:pick`
    itself has carried the identical cost since its own step 2/4 shipped,
    with `/fgOS:stale` explicitly documented as read-only/advisory
    (never reclaims a claim) — so the cost is real but already paid twice
    in production with no correctness break, only advisory noise.
- `fgos-coding-driving`'s own Hard rules (`.claude/skills/fgos-coding-driving/
  SKILL.md`, read fresh this session before this discovery round): the
  claim-timing rule and its "never claims early" Red flag are both scoped
  to what the DRIVER itself does — the driver only claims right before its
  FIRST invocation of the `executing`-stage skill, and only when the item
  is not already `doing`. Nothing there forbids a CALLER from claiming
  before invoking the driver; `/fgOS:pick`'s own step 2 (claim) → step 5
  (invoke driver) already does exactly this, and the driver's own claim
  step explicitly reads `status == doing` first and skips its own claim in
  that case. Cook claiming before invoking the driver is the same
  sanctioned caller-claims-first shape, not a reopening of the driver's
  own default.
- `docs/how-to/write-verify-for-a-skill-prose-change.md` — this item edits
  a `SKILL.md` prose file (`plugins/fgOS/skills/cook/SKILL.md`), so verify
  must follow the two-sided `npm test && <POSITIVE> && <NEGATIVE>` shape
  (prose is LLM-interpreted at runtime, no static shell command asserts
  its behavior — only presence/absence of the deliverable text).

**Found:** Bug premise confirmed live and unchanged. Proposed fix mirrors
an already-shipped, same-day precedent (`tsk-5qs`) for the identical root
cause on a sibling caller, using the exact same claim-before-write pattern
already sanctioned by `fgos-coding-driving`'s own contract. The one
open concern the item's own description raised (stale-noise cost) is not
a fresh decision — it is the same cost already paid by `/fgOS:pick` and
`fgos-coding-shaping` in production, documented as advisory-only
(non-blocking) by `/fgOS:stale`'s own skill. `tsk-5qs`'s own D1 named
this exact follow-up as real and deliberately out of its scope, not as a
question still needing resolution — the resolution is "apply the same
pattern," which is what this item's description already specifies.

**Still open:** none blocking. The exact step-1/step-2 wording (whether
cook routes through `submit` first the way `coding-shape` does, or the
queue-id is already submitted by the time step 2 runs) is an
implementation/planning-stage detail, not a discovery-stage ambiguity —
cook's own step 1 already runs `submit` before the queue drain begins, so
the claim point folds in right after, mirroring tsk-5qs's D2 sequencing
exactly.
