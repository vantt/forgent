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
  one-artifact-per-stop discipline `fgos-executing`'s "one commit per item"
  rule already gives Execute.

## Flow

1. **Bootstrap.** Read the item's `docsRef` field to find
   `docs/history/<feature>/`, then read that feature's `CONTEXT.md` — the
   locked decisions are the only source of truth for what this plan can
   assume. If a critical-patterns or prior-learnings doc exists for this
   product area, read it too; a precedent already solved beats research.

2. **Mode gate (mechanical, not vibes).** Count how many of these actually
   apply to the item: auth, authorization, data model, audit/security,
   external systems, public contracts, cross-platform, existing covered
   behavior, weak proof around the area, multi-domain.
   - 0–1 flags → **tiny** (a couple of files, one direct task) or **small**
     (a few files, no gray areas).
   - 2–3 flags, or story-sized behavior → **standard**.
   - 4+ flags, or any hard-gate flag (auth, data loss, audit/security,
     external provider, removing a validation) → **high-risk**.
   - One yes/no question decides whether the plan is even real →
     **spike**, regardless of flag count.

   Record the count, the flags, and the chosen mode in `plan.md` itself.
   Above `small`, say plainly why a smaller mode would not honestly cover
   the item. This decision is prose in `plan.md` — never a new field on the
   item, never a value `stage` takes.

3. **Approach.** Write the chosen path and the alternatives rejected along
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

4. **Shape.** Write (or enrich) `plan.md` scaled to the mode: a direct note
   for `tiny`, one open question for `spike`, a short plan for `small`, a
   phased plan for `standard`, a fuller map for `high-risk`. Sketch the
   concrete cases worth proving against — empty/boundary input, existing
   behavior that must not regress, concurrent access, partial failure — at
   a depth matching the mode; a `tiny` item does not need the same sketch a
   `high-risk` one does.

5. **Decide the split, if any.** Some items are one honest piece of work;
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
   way of recording "this item came from that one." If one piece is
   honestly enough, there is no split, and the item proceeds as itself.

6. **Leave execution alone.** Per the locked decision that Execute and its
   verify already have a working mechanical path (the goal-check the engine
   runs, and `return`'s own re-verify of real progress), this skill does not
   design or re-plan any of that — it only needs to name, for each piece it
   describes, the one command that proves it done.

## Gate

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

- **`true`** — skip the question. Post the non-question line
  `auto-approved: plan.md (gate-bypass level <level>)`, log it
  (`fgos decision --text "auto-approved plan.md gate for <item-id> at
  level <level>" --rationale "gate-bypass level <level> permits
  auto-approval per docs/history/gate-bypass/CONTEXT.md D1-D5"`, D3's
  audit trail), then continue straight to `fgos-validating`.
- **`false`** — present the mode, the approach, and the shape in plain
  language — what gets built, why this size and not a bigger or smaller
  one, what it costs if the shape turns out wrong — with `plan.md` linked,
  then ask exactly: "Work shape is ready. Approve before execution?"
  `plan.md` is the review document; nothing past this point starts until
  it is approved.

The mode decision reached in step 2 does not, by itself, move the item
anywhere. It only informs which of the item's own already-registered edges
the session picks next once work resumes — the engine is still the only
thing that validates and applies that move; this skill's decision is input
to that choice, never a substitute for it.

## Handoff

Once `plan.md` is written and approved, load `fgos-validating` to run the
reality check that gates whatever comes after `decompose` — or hand back to
`fgos-routing` first if it is not obvious which comes next. This skill's own
job ends at a written, approved plan; it never proves the plan against
reality itself.

## Red flags

- a mode picked without counting the flags, or vibed instead of counted
- reopening a decision `CONTEXT.md` already locked, instead of citing it
- a risk-map entry with no proof point carried to `fgos-validating`
- a child item listed with no real verify command, or a vague one
- recording the mode decision as a new field or stage instead of `plan.md`
  prose
- applying a stage move directly instead of leaving it to the engine
- running `fgos-validating`'s reality check here to skip the gate
- classifying the item's domain — not this skill's job

Violating the letter of the rules is violating the spirit of the rules.

Plan shaped and approved. Invoke `fgos-validating` (directly, or via
`fgos-routing` once the item's next stage is clear).
