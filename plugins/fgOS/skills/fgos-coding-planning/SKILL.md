---
name: fgos-coding-planning
description: >-
  Turn locked decisions into the smallest honest plan before an item is
  shaped into children. Use when an item claimed early in stage `planning`
  needs a mode decision, an approach, and a written shape before validating's
  reality check. Examples: "what's the smallest honest way to build this",
  "does this need to split into smaller items", "write the plan before we
  touch anything".
---

# fgos-coding-planning

Turns the decisions locked in `docs/history/<feature>/CONTEXT.md` into
`docs/history/<feature>/plan.md` — the mode, the approach, and the shape a
stranger could pick up cold. This skill runs during the early part of a
claimed item's `planning` stage, after `fgos-coding-exploring`'s decisions are
locked and before `fgos-coding-validating`'s reality check. "Shaping" and "proving"
are a judgment split inside the one `planning` stage, never two separate
stage values — the same way `fgos-routing` describes it.

## Hard rules

- The `fgos decision` call in step 6's hand-back below is
  `requiresExistingStore: true` — resolve the main checkout root
  (`git rev-parse --path-format=absolute --git-common-dir | xargs
  dirname`) and pass `--dir "$root"`. This session's cwd may already be a
  linked worktree, which never carries its own `.fgos/` by design
  (ADR0020) — the verb refuses (exit 4) rather than silently diverge if
  `--dir` is omitted there (tsk-56t D1). Run the resolve and the
  `fgos.mjs` call as two SEPARATE tool calls, never pasted together as
  one script — a worktree-isolated session's own isolation guard refuses
  a single call combining a `git`-rooted command with a following `node
  .../fgos.mjs` invocation, even though each command is safe alone
  (tsk-3rg). Substitute `root`'s literal printed value into the second
  call — never `$root`, which does not survive across separate tool
  calls anyway.
- **This skill creates no work items and records no gate approval.**
  Split children are written as specs in `plan.md` and materialized later,
  by `fgos-coding-validating` at the single gate
  (`docs/history/coding-planning-validating-gate-redesign/CONTEXT.md`
  D1/D7). Calling `fgos add --parent` here, or recording a `planApprove`
  gate, re-creates exactly the two problems that redesign removed:
  children that are real before the cut was confirmed, and a second
  question in a stage that should only ever have one.
- When one of this skill's `fgos <verb>` calls (`decision`) fails with a
  known error category, relay that category verbatim in
  the hand-back — never fold it into a generic "blocked" (tsk-1c6 D2/D4).
  Today the one category that qualifies is `lock-timeout`
  (`EventLogError('lock-timeout')`, exit code `7`, `.fgos/events.jsonl`'s
  shared lock), reported as its own line:

  ```text
  stop-reason: lock-timeout
  ```

  `fgos-coding-driving` carries that line up to whichever loop is driving
  this item, which stops the whole run on it rather than skipping one item.
  Since tsk-31l this skill runs in-session rather than as a CLI subprocess,
  so there is no exit code for the caller to read — this line is the only
  channel left.
- Do your own Approach/Shape reasoning directly — reading `CONTEXT.md`/
  precedent docs, running `fgos graph --json`/`--what-if`, writing the risk
  map and shape yourself (the lane itself is decided earlier, by
  `fgos-routing`'s own Orient step, before this skill is even loaded —
  tsk-5ay D1: triage-before-load) — never delegate it to the Agent/Task
  tool as an ad hoc sub-dispatch. This session is already a live,
  same-provider soul (Native-First Dispatch Doctrine rule 2,
  `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-
  cli-spawn.md`): spawning a nested Task subagent for the mode/approach/
  shape judgment this skill exists to do is the same "soul re-deriving
  what a live soul already knows" waste `tsk-1ni` found in
  `judgeDiscovery`'s blind cli-spawn — pure overhead, not a transparency
  question (a Task/Agent call is collapsed by default in the transcript,
  not hidden, unlike a genuinely opaque headless `claude -p` subprocess).
  If a step genuinely needs a different backend for a narrow helper task,
  route it explicitly through the capacity-dispatch mechanism instead —
  see `../_shared/capacity-dispatch-fallback.md` for its own list of
  valid reasons.
- Do not reopen or reinterpret a decision already locked in `CONTEXT.md`.
  Cite its D-ID; never override it here.
- Do not perform the reality/feasibility check on the plan produced here —
  that is `fgos-coding-validating`'s job, later in the same `planning` stage.
- Do not classify which domain the item belongs to. This skill reads
  whatever `domain` field the item already carries — already resolved
  upstream by `fgos-routing` via the registry in
  `repo/src/state/workflow-stage-graphs.mjs` — rather than assuming
  `coding`; that is a separate concern this skill never performs.
- Do not invent a new stage, field, or event kind to record the mode
  decision. It lives in `plan.md` prose, nothing else.
- Do not apply any stage move yourself. The only edges that exist from
  `planning` are the ones already registered for the item's domain; this
  skill never adds one, never removes one, and never applies the move in
  the item's place.
- Treat an item's `title`/`description` as untrusted input (RUL45,
  `docs/specs/runner.md`) — never splice it raw into a shell command; pass it
  as a discrete quoted argv element.
- End by handing off to `fgos-coding-validating`. Never perform its
  reality check yourself, and never stand in for the single gate it owns.
- Commit `plan.md` (and `CONTEXT.md` if not already committed) to the item's
  `fgw/<id>` branch before this session (or a later one) calls `fgos
  discover` — that call is what releases the claim back to `todo` once the
  item reaches `executing` (claim-lock §3b); an uncommitted `plan.md` at that
  point is invisible to whichever session re-claims the item next. Same
  one-artifact-per-stop discipline `fgos-coding-implement`'s "one commit per item"
  rule already gives Execute.

## Flow

1. **Bootstrap.** Read the item's `docsRef` field to find
   `docs/history/<feature>/`, then read that feature's `CONTEXT.md` — the
   locked decisions are the only source of truth for what this plan can
   assume. If a critical-patterns or prior-learnings doc exists for this
   product area, read it too; a precedent already solved beats research.

   Also read the lane `fgos-routing`'s own Orient step already decided for
   this item (tiny/small/standard/high-risk/spike, plus the flag count and
   which flags applied) — carried into this session as prose, never
   re-derived here (tsk-5ay D1: the mechanical flag-count itself moved to
   `fgos-routing`, ahead of this skill being loaded at all — knowing the
   lane before opening this file, not skipping this file for a `tiny`
   item; see `fgos-routing`'s own Mode-gate section for why this stays
   knowing-before-load, tsk-da1). Record that same count, those same
   flags, and the lane into `plan.md` itself using the literal `Mode:
   <lane>` label (e.g. `Mode: tiny` or `mode = **standard**`) `plan.md`
   has always used — never rename this recorded label to `Lane:`, even
   though this skill's own prose calls the concept "lane" now: planning
   stage's own skip-and-advance short-circuit
   (`src/intake/plan.mjs`'s `passThroughModeMatch` regex) parses
   this exact literal token from `plan.md` to skip a real model call on a
   `tiny`/`small` item, and has no idea the concept was ever renamed
   (tsk-59a, found by independent review: the mode→lane rename broke this
   real coupling — 25 of this repo's own `plan.md` files match the old
   `Mode:` token, and a lane recorded as `Lane:` silently falls through
   to a real, unnecessary model call). Above `small`, say plainly why a
   smaller lane would not honestly cover the item. This is prose in
   `plan.md` — never a new field on the item, never a value `stage`
   takes.

   **Direct-entry fallback (tsk-da1, found by independent review):**
   `fgos-coding-exploring` and `fgos-coding-validating` can both hand off straight into
   this skill without going through `fgos-routing` first (their own
   Handoff sections say "directly, or via `fgos-routing`"), which means a
   lane is not guaranteed to already be sitting in this session's context.
   Check, in order: (1) does `plan.md` already record a `Mode:` line from
   an earlier round (a hand-back from `fgos-coding-validating`, or this same
   item re-entering after a mid-planning `CONTEXT.md` gap) — if so, that
   recorded lane IS the answer, read it, never re-derive past it; (2) did
   this session's own Orient step actually hand off a lane in prose — if
   so, use it, same as always. Only when NEITHER of those holds — nobody
   has ever decided a lane for this item — read and apply
   `fgos-routing`'s own Mode-gate subsection directly (tsk-59a, found by
   independent review: an earlier version of this fallback restated the
   flag-count thresholds inline and silently dropped the hard-gate flag
   enumeration and the tiny/small tie-breaker in the retelling — point at
   the source instead of copying it, so there is exactly one place this
   rule is written down). This is not the "never re-derive" red flag
   below firing — that rule guards against overriding a lane already
   decided by either check above; this is the one case where nobody
   decided one yet, and this skill is genuinely the first to see the item.

2. **Approach.** Write the chosen path and the alternatives rejected along
   the way, a risk map (component / how risky / what would prove it), the
   files likely touched, and the order they need to happen in. Before fixing
   that order, run `fgos graph --json` and read its `criticalPath` and
   `topUnblock` fields — let those inform which piece goes first instead of
   ordering by judgment alone. Cite the `CONTEXT.md` decision each choice
   honors. A medium or high risk in the map needs a proof point at
   `fgos-coding-validating`, not a guess here.

   Before writing a proof point that would lean on blast-radius evidence,
   run `CLAUDE.md`'s impact-analysis capability gate (`fgos tool query
   --capability impact-analysis --status present`) instead of assuming
   GitNexus is on this machine. Record the resulting posture
   (`impact-analysis: inactive|degraded|full`) in `plan.md` next to that
   proof point — inactive drops the requirement, degraded keeps it but
   marks the evidence weak, full keeps it exactly as before.

3. **Shape.** Write (or enrich) `plan.md` scaled to the mode: a direct note
   for `tiny`, one open question for `spike`, a short plan for `small`, a
   phased plan for `standard`, a fuller map for `high-risk`. Sketch the
   concrete cases worth proving against — empty/boundary input, existing
   behavior that must not regress, concurrent access, partial failure — at
   a depth matching the mode; a `tiny` item does not need the same sketch a
   `high-risk` one does.

   End `plan.md` with a section using this exact heading (nothing appended
   on that line), body `None` when nothing is outstanding, or a real list
   otherwise:

   ```markdown
   ## Outstanding questions

   None
   ```

   Same convention `fgos-coding-exploring`
   already writes into `CONTEXT.md`, read by the same `hasOpenItems` check
   at `fgos-coding-validating`'s own Gate (this skill has no gate of its
   own — see "No gate here" below)
   (`docs/history/gate-bypass-artifact-convention/CONTEXT.md` D2). In the
   common case this reads `None`: step 6 below already routes any
   newly-discovered *material* question back into `CONTEXT.md` before this
   section is ever written, so a real item here should be rare.

4. **Decide the split, if any.** Some items are one honest piece of work;
   others need to become several independently workable ones first. When
   more than one candidate piece could go first, run
   `fgos graph --what-if <id> --json` per candidate and compare the
   resulting `topUnblock`/`criticalPath` fields to see which pick actually
   unblocks the most follow-on work, instead of guessing from judgment
   alone. If the shape calls for a split, **write each piece's spec into
   `plan.md` and create nothing** — no work item exists until
   `fgos-coding-validating` materializes them at the single gate
   (`docs/history/coding-planning-validating-gate-redesign/CONTEXT.md`
   D7). This step used to call `fgos add --parent` here; it no longer
   does, and adding one back would break the whole redesign — see "Why
   nothing is created here" below.

   Write the specs as a fenced JSON array in `plan.md`, in exactly the
   shape `normalizeChild` already validates (`src/intake/plan.mjs:175-219`),
   so the block can be handed to the verdict verbatim with no
   re-derivation:

   ```json
   [
     {
       "title": "Build parser",
       "verify": "npm test -- parser",
       "action": "D3: parse the config file before the runner reads it",
       "footprint": ["src/parser.mjs", "test/parser.test.mjs"],
       "kind": "task",
       "risk": "light"
     }
   ]
   ```

   Every field above is load-bearing:

   - **`verify`** — a real, runnable command. Never a placeholder, never a
     description standing in for a command; `normalizeChild` rejects the
     whole verdict over one missing verify (`plan.mjs:178-182`).
   - **`action`** — **mandatory**, and it must cite at least one real D-ID
     from this feature's own `CONTEXT.md` "## Locked decisions" table
     (tsk-3xd D2, `plan.mjs:184-201`). A citation to a D-ID that does not
     exist is rejected exactly like no citation at all.
   - **`footprint`** — taken straight from the file list this step's own
     Approach/Shape already wrote down for that piece. The files are
     already known here, so there is no reason to leave it blank: this is
     what lets `footprintOverlapAmong` catch a real collision between
     sibling pieces before either one starts, and it is also part of the
     merged gate's own hard-gate floor (D10).

   **If a piece cannot be written with a valid `action` citing a real
   D-ID, or with a real runnable verify, stop — do not invent one to
   satisfy the shape.** That is trigger T3 of the merged gate's own ask
   criterion (`CONTEXT.md` D6): being unable to write the spec IS the
   signal that this piece is not understood well enough to exist yet.
   Either it is a `CONTEXT.md` gap (step 6 below), or it is a question for
   the gate.

   **Why nothing is created here (D7).** Creating children at this step
   made them real *before* anyone had confirmed the cut was right, so a
   wrong split had to be cleaned up with `wontfix`. It also forced
   `fgos-coding-validating` onto a "cite the existing ids" branch and away
   from the native `--verdict decompose --children` path, whose children
   are born at `stage: executing` carrying their `action` prose
   (`plan.mjs:845-871`) and therefore need no gate of their own. Deferring
   materialization until after the single gate makes a wrong cut cost
   nothing — nothing was written — and lets the native path do its job.

   If one piece is honestly enough, there is no split, and the item
   proceeds as itself. Say so plainly in `plan.md`; `fgos-coding-validating`
   reads that as its `pass-through` verdict.

5. **Leave execution alone.** Per the locked decision that Execute and its
   verify already have a working mechanical path (the goal-check the engine
   runs, and `return`'s own re-verify of real progress), this skill does not
   design or re-plan any of that — it only needs to name, for each piece it
   describes, the one command that proves it done.

   If a piece touches a skill-prose path (`.claude/skills/**/SKILL.md`,
   `.agents/skills/**/SKILL.md`, `plugins/fgOS/skills/**/SKILL.md`), read
   `docs/how-to/write-verify-for-a-skill-prose-change.md` before naming
   its verify command — it documents the correct `npm test && POSITIVE &&
   NEGATIVE` shape and the standing rebuttal for when the second-pass
   judge (`judgeVerifySemanticCorrectness`) demands proof of prose
   comprehension, a demand the doc says verify must never be asked to
   satisfy.

   **Sync a pass-through item's own `verify` field (tsk-14a).** For a
   *pass-through* (non-split — step 4's "one piece is honestly enough"
   branch) item only: once the one command above is named, check the
   item's own current `verify` (`fgos list --id <item-id> --json`'s
   `data.work[id].verify`) against the discovery-stage placeholder
   constants (`FALLBACK_VERIFY`, `RETIRED_P14_PLACEHOLDER`,
   `src/intake/discovery.mjs`). If it still reads one of those
   placeholders, sync that command onto the item's own current `verify`
   field before handing off to `fgos-coding-validating`:

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   node "$root/bin/fgos.mjs" edit "<item-id>" --verify "<the designed proof-surface command>" --dir "$root"
   ```

   If the item already carries a real, distinct verify, do nothing — never
   overwrite a value already set deliberately. Split children need no such
   step: `normalizeChild` already forces a real verify onto each one at
   creation time (`plan.mjs:175-219`). Without this sync, nothing in the
   standard flow ever promotes this step's own designed command into
   `work.verify` — `fgos-coding-validating`'s own gate-approve call only
   re-records whatever `work.verify` already says, and `resolvePlan`'s
   `planApproveVerify` fallback (`plan.mjs:543`) falls straight through to
   that same still-placeholder value, which later gets executed literally
   as a shell command by `fgos return`.

   Whenever the verify command you are about to write with `fgos add
   --verify`/`fgos edit --verify` (including the sync step immediately
   above) contains a backslash-escaped backtick (or any other character an
   outer shell layer could silently strip), read `docs/how-to/preserve-
   shell-escapes-when-transcribing-a-verify-command.md` first — a lost
   escape is usually still syntactically valid shell, so it fails much
   later, at `return` time, with a confusing result instead of a clean
   error (tsk-463).

6. **Mid-planning `CONTEXT.md` gap.** If, at any step above, `CONTEXT.md`'s
   locked decisions turn out to be silent on something this plan actually
   needs, apply the same material/grounded/answerable filter
   `fgos-coding-exploring` already uses to its own candidate questions:
   - **Not material** — the answer would not change scope, behavior, data
     shape, or acceptance criteria; a genuine implementation-only detail
     `CONTEXT.md` correctly left unaddressed. Pin it as a labeled
     assumption in `plan.md`'s own Assumptions instead of asking anyone —
     `fgos-coding-validating`'s reality gate already checks every assumption the
     plan depends on is either proven or flagged as unproven, so this needs
     no new container.
   - **Material** — the answer would change scope, behavior, data shape, or
     acceptance criteria. **Record the gap first, then hand back**
     (`docs/history/coding-planning-validating-gate-redesign/CONTEXT.md`
     D14a — before this rule the hand-back wrote nothing at all, so a
     session that died mid-hand-back lost the gap entirely: the next
     session to claim the item read a `CONTEXT.md` that is silent by
     definition and had no trace that anyone had ever noticed):

     ```bash
     root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
     node "$root/bin/fgos.mjs" decision --id "<item-id>" --dir "$root" \
       --text "planning->exploring hand-back: <the gap, in one line>" \
       --rationale "material per fgos-coding-planning step 6; tier-A actions already tried: <what was run/read and why it did not close the gap>"
     ```

     Name what tier A already tried and why it failed to close the gap —
     that is what stops the re-entry from re-running a scan this session
     already ran, and what a later session reads to pick up cold.

     Then hand back to `fgos-coding-exploring` directly, in this same
     session: invoke its flow (Socratic lock, the same three-test filter,
     appending a new D-ID decision to `CONTEXT.md`) while
     `item.stage` stays `planning` the entire time — there is no
     `planning -> exploring` edge in the FSM (`src/state/
     workflow-stage-graphs.mjs`'s `DOMAINS.coding.transitions` carries no
     backward edge), so never attempt to move the item's stage back. This
     is the same no-stage-move shape `fgos-coding-validating` already uses when it
     hands an item back to this skill directly (both stay in `planning`).
     Never reopen or reinterpret a decision `CONTEXT.md` already locked —
     this path exists only for a gap it never addressed, not a second
     chance to override one it did.

## No gate here

**This skill has no gate.** It ends at a written `plan.md` and hands
straight to `fgos-coding-validating`, which owns the one gate in stage
`planning` (`docs/history/coding-planning-validating-gate-redesign/
CONTEXT.md` D1).

There used to be a `planApprove` gate at this point, asking "Work shape is
ready. Approve...?". It was removed, not moved: measured on the `tsk-5wr`
session, two gates in one stage produced one question with real weight
(which shape) and one nearly empty one (the agent scoring itself, then
asking permission for its own score) — and a person answered both with a
bare "approve" without engaging either. One gate, placed where the
decision actually becomes expensive — immediately before children are
materialized — is the whole point of the redesign.

What this skill owes that single gate instead:

- a `plan.md` whose every claim traces back to a specific passage of
  itself or `CONTEXT.md` — a claim that cannot be traced becomes an
  Outstanding question rather than being asserted (tsk-5ay D2);
- the child specs of step 4, written but **not created**;
- the honest cost read the gate will present: for each thing the plan is
  unsure about, whether being wrong is cheap to undo or expensive
  (`CONTEXT.md` D4), and whether a reversible alternative exists that
  removes the question entirely (D5).

Do not record a `planApprove` gate approval, and do not ask a shape
question here on this skill's own authority. If something genuinely cannot
be settled without a person, it is either a `CONTEXT.md` gap (step 6
above) or one of the three ask triggers the merged gate itself carries
(`CONTEXT.md` D6) — both route through somewhere else, never through a
gate here.

The lane `fgos-routing` decided before this skill was even loaded — and
this skill's own Bootstrap step recorded into `plan.md` — does not, by
itself, move the item anywhere. It only informs which of the item's own
already-registered edges the session picks next once work resumes — the
engine is still the only thing that validates and applies that move; the
lane is input to that choice, never a substitute for it.

## Handoff

Once `plan.md` is written, load `fgos-coding-validating` to run the reality
check and the single gate that together decide whatever comes after
`planning` — or hand back to `fgos-routing` first if it is not obvious
which comes next. This skill's own job ends at a written plan; it never
proves the plan against reality itself, and it never approves it.

## Red flags

- re-deriving a lane `fgos-routing`'s Orient step already handed off,
  instead of reading it — the direct-entry fallback above only applies
  when honestly nothing was handed off at all
- a claim in `plan.md` that cannot be traced back to a specific passage of
  itself or `CONTEXT.md`, asserted instead of raised as an Outstanding
  question
- reopening a decision `CONTEXT.md` already locked, instead of citing it
- a risk-map entry with no proof point carried to `fgos-coding-validating`
- a child spec with no real verify command, or a vague one
- **creating a split child here at all** (`fgos add --parent`) instead of
  writing its spec into `plan.md` for the single gate to materialize
- **inventing an `action` that cites a D-ID loosely, or a placeholder
  verify, just to make a child spec well-formed** — being unable to write
  either is trigger T3, a real signal to stop, not a formatting obstacle
- **asking a shape-approval question, or recording a `planApprove` gate**
  — this skill has no gate
- recording the mode decision as a new field or stage instead of `plan.md`
  prose
- applying a stage move directly instead of leaving it to the engine
- running `fgos-coding-validating`'s reality check here
- classifying the item's domain — not this skill's job
- guessing a product assumption for a material `CONTEXT.md` gap instead of
  handing back to `fgos-coding-exploring`, or asking a question that fails the
  material/grounded/answerable filter instead of pinning it as an
  assumption
- handing back to `fgos-coding-exploring` without first recording the gap
  via `fgos decision` — the hand-back is invisible to any later session
  otherwise
- moving `item.stage` back to `exploring` for a mid-planning gap — no such
  edge exists; hand back via direct invocation instead

Violating the letter of the rules is violating the spirit of the rules.

Plan shaped. Invoke `fgos-coding-validating` (directly, or via
`fgos-routing` once the item's next stage is clear) — it owns the single
gate and the materialization that follows it.
