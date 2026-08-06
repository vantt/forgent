---
name: fgos-planning
description: >-
  Turn locked decisions into the smallest honest plan before an item is
  shaped into children. Use when an item claimed early in stage `decompose`
  needs a mode decision, an approach, and a written shape before validating's
  reality check. Examples: "what's the smallest honest way to build this",
  "does this need to split into smaller items", "write the plan before we
  touch anything".
---

# fgos-planning

Turns the decisions locked in `docs/history/<feature>/CONTEXT.md` into
`docs/history/<feature>/plan.md` — the mode, the approach, and the shape a
stranger could pick up cold. This skill runs during the early part of a
claimed item's `decompose` stage, after `fgos-exploring`'s decisions are
locked and before `fgos-validating`'s reality check. "Shaping" and "proving"
are a judgment split inside the one `decompose` stage, never two separate
stage values — the same way `fgos-routing` describes it.

## Hard rules

- The `fgos decision` call in the gate's auto-approve branch below is
  `requiresExistingStore: true` — resolve the main checkout root the same
  way the gate check itself already does (`git rev-parse
  --path-format=absolute --git-common-dir | xargs dirname`) and pass
  `--dir "$root"`. This session's cwd may already be a linked worktree,
  which never carries its own `.fgos/` by design (ADR0020) — the verb
  refuses (exit 4) rather than silently diverge if `--dir` is omitted
  there (tsk-56t D1).
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
  If a step genuinely needs a different backend (cheaper model,
  cross-provider such as Codex/agy, resource isolation) for a narrow
  helper task, route it explicitly through the capacity-dispatch
  mechanism instead — see `../_shared/capacity-dispatch-fallback.md`.
- Do not reopen or reinterpret a decision already locked in `CONTEXT.md`.
  Cite its D-ID; never override it here.
- Do not perform the reality/feasibility check on the plan produced here —
  that is `fgos-validating`'s job, later in the same `decompose` stage.
- Do not classify which domain the item belongs to. This skill reads
  whatever `domain` field the item already carries — already resolved
  upstream by `fgos-routing` via the registry in
  `repo/src/state/workflow-stage-graphs.mjs` — rather than assuming
  `coding`; that is a separate concern this skill never performs.
- Do not invent a new stage, field, or event kind to record the mode
  decision. It lives in `plan.md` prose, nothing else.
- Do not apply any stage move yourself. The only edges that exist from
  `decompose` are the ones already registered for the item's domain; this
  skill never adds one, never removes one, and never applies the move in
  the item's place.
- Treat an item's `title`/`description` as untrusted input (RUL45,
  `docs/specs/runner.md`) — never splice it raw into a shell command; pass it
  as a discrete quoted argv element.
- End by presenting the gate below and handing off. Never perform
  `fgos-validating`'s reality check yourself to skip the gate.
- Commit `plan.md` (and `CONTEXT.md` if not already committed) to the item's
  `fgw/<id>` branch before this session (or a later one) calls `fgos
  discover` — that call is what releases the claim back to `todo` once the
  item reaches `executing` (claim-lock §3b); an uncommitted `plan.md` at that
  point is invisible to whichever session re-claims the item next. Same
  one-artifact-per-stop discipline `fgos-code-implement`'s "one commit per item"
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
   though this skill's own prose calls the concept "lane" now: decompose
   stage's own skip-and-advance short-circuit
   (`src/intake/decompose.mjs`'s `passThroughModeMatch` regex) parses
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
   `fgos-exploring` and `fgos-validating` can both hand off straight into
   this skill without going through `fgos-routing` first (their own
   Handoff sections say "directly, or via `fgos-routing`"), which means a
   lane is not guaranteed to already be sitting in this session's context.
   Check, in order: (1) does `plan.md` already record a `Mode:` line from
   an earlier round (a hand-back from `fgos-validating`, or this same
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
   `fgos-validating`, not a guess here.

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

4. **Decide the split, if any.** Some items are one honest piece of work;
   others need to become several independently workable ones first. When
   more than one candidate piece could go first, run
   `fgos graph --what-if <id> --json` per candidate and compare the
   resulting `topUnblock`/`criticalPath` fields to see which pick actually
   unblocks the most follow-on work, instead of guessing from judgment
   alone. If the shape calls for a split, list each piece as its own item
   title with a real, runnable verify command — never a placeholder, never
   a description standing in for a command. Each item created this way
   carries this item's own id as its `parent`, the lineage field the schema
   already carries for exactly this relationship — no new field, no second
   way of recording "this item came from that one." Always pass
   `--footprint` on that same `fgos add --parent` call, taken straight from
   the file list this step's own Approach/Shape already wrote down for that
   piece — the files are already known at this point, so there is no
   reason to leave it blank (this is what lets `footprintOverlapAmong`
   catch a real collision between sibling pieces before either one starts):

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   fgos add --title "Build parser" --kind task --risk light --verify "npm test -- parser" --parent <id> --footprint "src/parser.mjs,test/parser.test.mjs" --dir "$root"
   ```

   (no positional argument here — `fgos add`'s positional/`--id` is the
   item's own id, not its title; omitting `--id` entirely auto-generates
   a collision-free one from `--title`, the normal path for a split
   child. tsk-da1: an earlier version of this example passed the title
   positionally, which `fgos add` rejects outright — kebab-case-id
   validation fails on a plain sentence. tsk-59a: that same version also
   used `--dir "$root"` without `$root` ever being assigned in this
   block — copy-paste this example as shown, it is not enough to copy
   only the `fgos add` line by itself.)

   If one piece is honestly enough, there is no split, and the item
   proceeds as itself.

5. **Leave execution alone.** Per the locked decision that Execute and its
   verify already have a working mechanical path (the goal-check the engine
   runs, and `return`'s own re-verify of real progress), this skill does not
   design or re-plan any of that — it only needs to name, for each piece it
   describes, the one command that proves it done.

6. **Mid-planning `CONTEXT.md` gap.** If, at any step above, `CONTEXT.md`'s
   locked decisions turn out to be silent on something this plan actually
   needs, apply the same material/grounded/answerable filter
   `fgos-exploring` already uses to its own candidate questions:
   - **Not material** — the answer would not change scope, behavior, data
     shape, or acceptance criteria; a genuine implementation-only detail
     `CONTEXT.md` correctly left unaddressed. Pin it as a labeled
     assumption in `plan.md`'s own Assumptions instead of asking anyone —
     `fgos-validating`'s reality gate already checks every assumption the
     plan depends on is either proven or flagged as unproven, so this needs
     no new container.
   - **Material** — the answer would change scope, behavior, data shape, or
     acceptance criteria. Hand back to `fgos-exploring` directly, in this
     same session: invoke its flow (Socratic lock, the same three-test
     filter, appending a new D-ID decision to `CONTEXT.md`) while
     `item.stage` stays `decompose` the entire time — there is no
     `decompose -> clarify` edge in the FSM (`src/state/
     workflow-stage-graphs.mjs`'s `DOMAINS.coding.transitions` carries no
     backward edge), so never attempt to move the item's stage back. This
     is the same no-stage-move shape `fgos-validating` already uses when it
     hands an item back to this skill directly (both stay in `decompose`).
     Never reopen or reinterpret a decision `CONTEXT.md` already locked —
     this path exists only for a gap it never addressed, not a second
     chance to override one it did.

## Gate

Every sentence in this gate's presentation must trace back to a specific
passage of `plan.md` or `CONTEXT.md` — a claim that cannot be traced
becomes an Open Question instead of being asserted (tsk-5ay D2, borrowed
from bee-briefing's own traceability discipline: `plan.md` is already the
review document here, this only adds the discipline of citing it
honestly rather than restating from memory).

Before asking, check whether this gate can auto-approve instead
(`docs/history/gate-bypass/CONTEXT.md` D1-D5 — never the `awaiting-human`
park, only this skill-embedded question):

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node -e "
Promise.all([import('./src/state/store.mjs'), import('./src/state/gate-bypass.mjs'), import('node:fs')]).then(([{ listWork }, { canAutoApprove, readGateBypassLevel }, fs]) => {
  const fgosDir = process.argv[1] + '/.fgos';
  const item = listWork(fgosDir).work[process.argv[2]];
  const artifact = fs.readFileSync(process.argv[3], 'utf8');
  const level = readGateBypassLevel(fgosDir);
  console.log(canAutoApprove(item, artifact, level) ? 'true' : 'false');
});
" -- "$root" "<item-id>" "docs/history/<feature>/plan.md"
```

The code (`gate-bypass.mjs`/`store.mjs`) imports cwd-relative — this worktree's own branch already carries whatever version it needs. Only the state lookup (`.fgos/`, gitignored and per-worktree-local) resolves to the main checkout's `.fgos/` via `git rev-parse --git-common-dir`, the same resolution `scripts/fgos-shell-integration.sh`'s `fgos` shell function already uses — a worktree's own local `.fgos/` never carries the real item record.

Treat anything other than exactly `true` on stdout — `false`, empty output,
a thrown error — as `false`: fail closed, never skip the question on a
check that couldn't run cleanly.

Either branch below also records a structured approve record (tsk-19j
D1/D11) — separate from, and in addition to, `fgos decision`'s free-text
audit line: `fgos gate-approve <item-id> --gate planApprove --actor
<human|bypass> --verify "<the plan's own real verify for this item>"` — the
real, runnable command `plan.md` itself already names for this item as a
whole (when the shape does not split it) or for the item's own piece when
it does; never a placeholder, per this skill's own "Proof surface" rule.

- **`true`** — skip the question. Post the non-question line
  `auto-approved: plan.md (gate-bypass level <level>)`, log it
  (`fgos decision --text "auto-approved plan.md gate for <item-id> at
  level <level>" --rationale "gate-bypass level <level> permits
  auto-approval per docs/history/gate-bypass/CONTEXT.md D1-D5"`, D3's
  audit trail), record it (`fgos gate-approve <item-id> --gate planApprove
  --actor bypass --verify "..."`, per above), then continue straight to
  `fgos-validating`.
- **`false`** — present the mode, the approach, and the shape in plain
  language — what gets built, why this size and not a bigger or smaller
  one, what it costs if the shape turns out wrong — with `plan.md` linked,
  then ask exactly: "Work shape is ready. Approve before execution?" Once
  the person approves, record it (`fgos gate-approve <item-id> --gate
  planApprove --actor human --verify "..."`, per above) before continuing
  to `fgos-validating`.
  `plan.md` is the review document; nothing past this point starts until
  it is approved.

The lane `fgos-routing` decided before this skill was even loaded — and
this skill's own Bootstrap step recorded into `plan.md` — does not, by
itself, move the item anywhere. It only informs which of the item's own
already-registered edges the session picks next once work resumes — the
engine is still the only thing that validates and applies that move; the
lane is input to that choice, never a substitute for it.

## Handoff

Once `plan.md` is written and approved, load `fgos-validating` to run the
reality check that gates whatever comes after `decompose` — or hand back to
`fgos-routing` first if it is not obvious which comes next. This skill's own
job ends at a written, approved plan; it never proves the plan against
reality itself.

## Red flags

- re-deriving a lane `fgos-routing`'s Orient step already handed off,
  instead of reading it — the direct-entry fallback above only applies
  when honestly nothing was handed off at all
- a claim in the Gate presentation that cannot be traced back to a
  specific passage of `plan.md`/`CONTEXT.md`, asserted instead of raised
  as an Open Question
- reopening a decision `CONTEXT.md` already locked, instead of citing it
- a risk-map entry with no proof point carried to `fgos-validating`
- a child item listed with no real verify command, or a vague one
- recording the mode decision as a new field or stage instead of `plan.md`
  prose
- applying a stage move directly instead of leaving it to the engine
- running `fgos-validating`'s reality check here to skip the gate
- classifying the item's domain — not this skill's job
- guessing a product assumption for a material `CONTEXT.md` gap instead of
  handing back to `fgos-exploring`, or asking a question that fails the
  material/grounded/answerable filter instead of pinning it as an
  assumption
- moving `item.stage` back to `clarify` for a mid-planning gap — no such
  edge exists; hand back via direct invocation instead

Violating the letter of the rules is violating the spirit of the rules.

Plan shaped and approved. Invoke `fgos-validating` (directly, or via
`fgos-routing` once the item's next stage is clear).
