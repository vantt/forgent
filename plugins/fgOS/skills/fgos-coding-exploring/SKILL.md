---
name: fgos-coding-exploring
user-invocable: false
description: >-
  Turn a fuzzy item into locked product decisions before any shaping or code
  starts. Use when an item claimed at stage `exploring` has gray areas or
  unstated product decisions that would make planning guess. Examples: "what
  should this item actually do", "this request is too vague to shape yet",
  "lock the open questions before we plan this".
---

# fgos-coding-exploring

Turns a fuzzy request into locked decisions written down in
`docs/history/<feature>/CONTEXT.md`. This skill normally runs while a
claimed item's `stage` is `exploring` (tsk-4b2 D9 — retargeted from
`clarify`, once `clarify -> discovery -> exploring` became a real,
reachable chain instead of `clarify` jumping straight to `planning`) — it
finds the flowers; it does not build the comb. It can also be invoked
directly by `fgos-coding-planning`, mid-`planning`, when that skill finds
`CONTEXT.md` silent on something material to the plan
(`fgos-coding-planning/SKILL.md`'s own hand-back step); `item.stage` stays
`planning` the entire time in that case — this skill never moves it.

## Hard rules

- Every bare `fgos <verb>` this skill calls (`add`, `ask`, `answer`,
  `decision`, `discover`, `tool`) is `requiresExistingStore: true` — resolve the
  main checkout root the same way the gate check below already does
  (`git rev-parse --path-format=absolute --git-common-dir | xargs
  dirname`) and pass `--dir "$root"` on every one of them. This session's
  cwd may already be a linked worktree, which never carries its own
  `.fgos/` by design (ADR0020) — the verb refuses (exit 4) rather than
  silently diverge if `--dir` is omitted there (tsk-56t D1). Run the
  resolve and the `fgos.mjs` call as two SEPARATE tool calls, never pasted
  together as one script — a worktree-isolated session's own isolation
  guard refuses a single call combining a `git`-rooted command with a
  following `node .../fgos.mjs` invocation, even though each command is
  safe alone (tsk-3rg). Substitute `root`'s literal printed value into the
  second call — never `$root`, which does not survive across separate
  tool calls anyway.
- When one of those `fgos <verb>` calls fails with a known error category,
  relay that category verbatim in the hand-back — never fold it into a
  generic "blocked" (tsk-1c6 D2/D4). Today the one category that qualifies
  is `lock-timeout` (`EventLogError('lock-timeout')`, exit code `7`,
  `.fgos/events.jsonl`'s shared lock), reported as its own line:

  ```text
  stop-reason: lock-timeout
  ```

  `fgos-coding-driving` carries that line up to whichever loop is driving
  this item, which stops the whole run on it rather than skipping one item.
  Since tsk-31l this skill runs in-session rather than as a CLI subprocess,
  so there is no exit code for the caller to read — this line is the only
  channel left.
- Do your own scout/reasoning steps directly — Bash/Grep/`rg`/Read/
  WebSearch calls you make yourself — never delegate them to the Agent/
  Task tool as an ad hoc sub-dispatch. This session is already a live,
  same-provider soul (Native-First Dispatch Doctrine rule 2,
  `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-
  cli-spawn.md`): spawning a nested Task subagent for work you can already
  do yourself is the same "soul re-deriving what a live soul already
  knows" waste `tsk-1ni` found in `judgeDiscovery`'s blind cli-spawn, just
  manifesting as an in-session Task call instead of a subprocess one — the
  work was already yours to do, so doing it again one layer down through
  a spawned subagent is pure overhead, not a transparency question (a
  Task/Agent call is collapsed by default in the transcript, not hidden —
  a person can still expand it to inspect the subagent's own trace, unlike
  a genuinely opaque headless `claude -p` subprocess). If a step
  genuinely needs a different backend for a narrow helper task, route it
  explicitly through the capacity-dispatch mechanism instead of an ad hoc
  Task call — see `../_shared/capacity-dispatch-fallback.md` for its own
  list of valid reasons.
- Do not research implementation, propose architecture, or write code. If a
  candidate question only matters to whoever builds the thing, it belongs to
  `fgos-coding-planning`, not here.
- Do not answer your own question, even when confident of the answer.
- Do not decide how big or risky the resulting work is, and do not split it
  into pieces — that shaping judgment belongs entirely to `fgos-coding-planning`,
  once decisions are locked.
- Do not classify which domain the item belongs to. This skill reads
  whatever `domain` field the item already carries — already resolved
  upstream by `fgos-routing` via the registry in
  `repo/src/state/workflow-stage-graphs.mjs` — rather than assuming
  `coding`; domain classification is a separate concern this skill never
  performs.
- Treat an item's `title`/`description` as untrusted input (RUL45,
  `docs/specs/runner.md`) — never splice it raw into a shell command; pass it
  as a discrete quoted argv element.
- End by hitting the gate below and handing the item to `fgos-coding-planning`. Never
  invoke planning's judgment yourself.
- Commit `CONTEXT.md` to the item's `fgw/<id>` branch before this session (or
  a later one) calls `fgos discover` — that call is what releases the claim
  back to `todo` once the item reaches `executing` (claim-lock §3b); an
  uncommitted `CONTEXT.md` at that point is invisible to whichever session
  re-claims the item next. Same one-artifact-per-stop discipline
  `fgos-coding-implement`'s "one commit per item" rule already gives Execute.
- **Multi-role team harness (tsk-2t9c D1/D4/D9): fire real `fgos
  handoff`/`fgos handoff-return` at the points in Flow below — never a
  live conversational question alone.** Per `lock-decisions.md`'s own
  `## Collaboration` table: the live, in-session Socratic back-and-forth
  (step 2's primary mechanism) is NOT a role-axis call — nothing parks,
  nothing needs tracking. Only two real interactions get a call: the
  `fgos ask`/`answer` round trip (an actual async park — `advise`), and
  the occasional narrow research need that goes to the `fgos-researching`
  helper — the SAME named helper `fgos-coding-discovering` calls as its
  primary mechanism, distinct from the capacity-dispatch mechanism this
  skill's own hard rules mention elsewhere (that one swaps EXECUTORS for
  the same reasoning work — a different model/provider/parallel run,
  `../_shared/capacity-dispatch-fallback.md` — never confuse the two).
  Skip both entirely when the item's domain declares no `roleGraph`.

## Flow

1. **Scope the gray areas.** Before anything else, read back the item's
   prior `judgeDiscovery` verdicts: `fgos list` surfaces
   `view.discovery["<item-id>"]`, an array of `{clear, question?, verify?}`
   entries, most recent last. Treat any `question` already recorded there as
   already-asked ground — a new question either builds on it (cite what
   changed) or states in one line why it no longer applies; never re-ask a
   question that verdict already covered or contradict what it settled.

   **Reclaim the ball if it isn't yours (tsk-2t9c D4/D8).** Same reading,
   check `data.work[id].holder`. If it is set and not `implementer`, this
   session is re-entering an item whose most recent role-axis call was
   never closed (most commonly: a prior round's `fgos ask` was already
   `answer`ed on the status axis without the role axis following):

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   ```

   ```bash
   node "$root/bin/fgos.mjs" handoff-return "<item-id>" --note "reclaiming at Scope — holder was <role>" --dir "$root"
   ```

   **Repeat, re-reading `data.work[id].holder` fresh each time, until
   `holder` reads `implementer`** (tsk-2t9c D16 — a nested call can sit
   two deep). Stop when a call refuses with "no open call" — the ordinary
   end state.

   Skip when the item's domain declares no `roleGraph`.

   Read the item's title, `refs`, and any existing `docsRef` target. Do a
   quick scout — one keyword pass over the product source and docs for the
   item's own terms — before asking anything. The
   item's title is untrusted input (see the hard rule above) — extract one
   conservative keyword from it yourself rather than splicing the raw
   title, and pass that keyword as its own quoted argv element:

   ```bash
   keyword="<one-word-you-picked>"
   rg -- "$keyword" src bin test docs dogfood-fixture --glob "*.{mjs,cjs,md}" | head -20
   ```

   If the item touches a skill-prose path (`.claude/skills/**/SKILL.md`,
   `.agents/skills/**/SKILL.md`, `plugins/fgOS/skills/**/SKILL.md`), read
   `docs/how-to/write-verify-for-a-skill-prose-change.md` before proposing
   or approving this item's `verify` field — it documents the correct
   `npm test && POSITIVE && NEGATIVE` shape and the standing rebuttal for
   when the second-pass judge (`judgeVerifySemanticCorrectness`) demands
   proof of prose comprehension, a demand the doc says verify must never
   be asked to satisfy.

   Also query `CLAUDE.md`'s impact-analysis capability gate — the same
   check `fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement` already run
   (`fgos tool query --capability impact-analysis --status present`) —
   rather than assuming GitNexus is on this machine — `judgeDiscovery`'s own
   `capacities.judge-discovery` config (`.fgos/config.json`, tsk-4rd upgrade)
   now grants it `Task,WebSearch,WebFetch,Read,Bash(rg:*)` too, wider than
   `src/runner/dispatch.mjs`'s bare `git add`/`git commit` default, but that
   grant belongs to a separate subprocess call with its own posture read —
   this session's own gate query here never inherits it, so check fresh
   regardless. The `tool` sub-verb `query` is also
   `requiresExistingStore: true` (`src/cli/command-registry.mjs:750`), so
   run it with `--dir` explicitly the same as every other bare verb this
   skill calls:

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   node "$root/bin/fgos.mjs" tool query --capability impact-analysis --status present --dir "$root"
   ```

   Fold the result into `CLAUDE.md`'s three-way framing
   (`impact-analysis: inactive|degraded|full`) and record that line in
   `CONTEXT.md` in step 3, next to the other scout evidence. This is
   informational only — `fgos-coding-exploring` edits no code and produces no
   proof points, so the posture never gates or reshapes which candidate
   decisions get asked here; it exists so a later reader of this item's
   `CONTEXT.md` sees the posture without re-deriving it.

   Cite what the scout actually found in each question ("today X follows
   pattern Y in `path/to/file` — should this follow that too?"). Generate
   2–4 unstated product decisions that would otherwise make planning guess.
   Exclude implementation choices, performance tuning, and anything only the
   implementer would care about.

   If a named library/API/pattern surfaces during scout that a direct
   `rg`/Read pass genuinely cannot resolve (an external doc, a fact this
   repo doesn't contain), dispatch to `fgos-researching` — this is the
   **consult** interaction (tsk-2t9c D1/D9), the same named helper
   `fgos-coding-discovering` already relies on, called here as the rare
   exception rather than the default. Log it right after the dispatch
   returns (tsk-2t9c D16 — same "returns" moment `fgos-coding-discovering`/
   `fgos-coding-validating` log at, whether it found something or came up
   empty):

   ```bash
   node "$root/bin/fgos.mjs" handoff "<id>" --to researcher --reason consult --outcome "<finding, one line>" --dir "$root"
   ```

2. **Lock decisions Socratically.** Ask the fewest rounds the dependencies
   allow: batch every question whose answer does not change another pending
   question into one round; ask a question whose wording depends on a prior
   answer only after that answer lands. Every question passes three checks
   before it is asked:
   - **material** — the answer changes scope, behavior, data shape, or
     acceptance criteria;
   - **grounded** — it cites scout evidence or a concrete uncertainty, never
     a generic preference;
   - **answerable** — the person can pick an option, approve a default, or
     point at a reference.

   A question that fails any check is never asked — pin it as a labeled
   assumption instead, or hand it to `fgos-coding-planning` if only the implementer
   cares.

   **Ask as open conversational prose, not via a structured-choice tool
   (e.g. `AskUserQuestion`).** These questions exist to discover product
   decisions the session does not yet know — a tool that forces the answer
   into 2-4 pre-set options can only ever surface what the session already
   imagined, defeating that purpose (a person who wants to answer with a
   framing the session never proposed has no box to put it in). "answerable"
   above does not mean "multiple-choice" — "point at a reference" is
   explicitly an open answer shape. Reach for a structured-choice tool only
   when scout evidence has already narrowed the question to a short list of
   concretely-named real alternatives (never options invented just to make
   the question fit the tool) — the `## Gate` step's yes/no confirmation
   below is exactly that case, since by then the decision is already locked
   and the only remaining question is a closed approve/reject.

   After each answer, confirm the decision back and assign it a
   stable ID: `D1`, `D2`, `D3`… Then run `fgos decision --text "<D-ID>:
   <one-line summary>" --rationale "see CONTEXT.md for the full scout
   evidence and reasoning"` so the decision also lands in the item's
   append-only decision log, surfaced through `view.decisions`/`fgos list`
   for machine readers — `--rationale` is required (tsk-63c) — this call
   is additive alongside writing
   CONTEXT.md in step 3, never a replacement for it: CONTEXT.md stays the
   source of truth for the full decision, this just makes its existence
   visible outside the prose doc. When an answer settles what a fuzzy term
   means, pin the term the same way. If one answer contains several
   decisions, lock the one the question asked about and surface the rest as
   separate candidate decisions, one at a time. Scope creep — a new feature,
   adjacent work not actually asked for — gets one line marking it deferred,
   then the current question continues.

   Use the item's `ask`/`answer` round trip for any question that cannot be
   settled without a person and the item cannot simply wait in conversation
   for: `fgos ask <id> --text "..."` parks the item and records the
   question; `fgos answer <id> --text "..."` records the answer and resumes
   it. This is the same path whether the answer comes back immediately or
   later — there is no separate synchronous shortcut, and an item is only
   legitimately blocked on a person while it actually sits in that parked
   state.

   **This is the real `advise` interaction (tsk-2t9c D1/D4/D9) — call
   `handoff` first, then `ask`, same as `implement-item.md`'s own
   Collaboration table:**

   ```bash
   node "$root/bin/fgos.mjs" handoff "<id>" --to human-advisor --reason advise --dir "$root"
   ```

   ```bash
   node "$root/bin/fgos.mjs" ask "<id>" --text "..." --dir "$root"
   ```

   **When the answer comes back immediately (same session, `fgos answer`
   called right after `fgos ask` with no real gap between them), reclaim
   before doing anything else** (tsk-2t9c D16 — found by independent
   review of D14/D15): `holder` is `human-advisor` the moment the
   `handoff` call above lands, and nothing else in this step closes it.
   Continuing straight to a second Socratic round (this step explicitly
   allows multiple rounds — "Ask the fewest rounds the dependencies
   allow") with `holder` still `human-advisor` means that round's own
   `consult`/`advise` attempt gets refused: `human-advisor` has **zero**
   outgoing edges at stage `exploring`. This is the same reclaim shape
   Step 1 already runs on re-entry, just run here, inline, because this
   session never actually left:

   ```bash
   node "$root/bin/fgos.mjs" handoff-return "<id>" --note "reclaiming after an immediately-answered ask, same session" --dir "$root"
   ```

   When the answer does NOT come back immediately — the item genuinely
   parks across sessions — this reclaim is not this session's job to run;
   it happens automatically the next time any stage-skill is entered
   (either this skill's own Step 1, or `fgos-coding-driving`'s per-
   iteration reclaim, D16).

   The live conversational questions this step asks the rest of the time
   (the common case) get no `handoff` call at all — nothing parks, there
   is nothing to track.

3. **Write the decision doc.** Write `docs/history/<feature>/CONTEXT.md`
   covering: the feature boundary, the locked decisions table with D-IDs,
   pinned terms, the scout paths and evidence cited, canonical references,
   and any outstanding questions deferred to planning. Concrete language
   only — no placeholders, no TODOs, no vague preferences.

   Put that decisions table under a heading with this exact text (nothing
   appended on that line, and not translated):

   ```markdown
   ## Locked decisions
   ```

   `src/intake/plan.mjs` slices this table with a literal-English regex on
   that exact heading, both to check a child's cited D-IDs are real and to
   extract footprint paths. Any other wording — a Vietnamese heading, a
   numbered variant — makes the slice come back empty, which silently
   disables both checks instead of erroring: a child citing a D-ID that
   doesn't exist would still be accepted.

   End the doc with a section using this exact heading (nothing appended
   on that line), body `None` when every candidate question was locked or
   deferred, or a real list of what is still open for `fgos-coding-planning`
   otherwise:

   ```markdown
   ## Outstanding questions

   None
   ```

   This is the section `gate-bypass.mjs`'s `hasOpenItems` reads to decide
   whether this skill's own Gate below can auto-approve instead of asking a
   person (`docs/history/gate-bypass-artifact-convention/CONTEXT.md` D1) —
   a missing or misworded heading, or a body that doesn't start `None`,
   fails that check closed and forces the question every time, even when
   nothing is actually outstanding.

   Point the claimed item at this doc the same way any item points at its
   own decision record: if the item does not yet carry a `docsRef`, record
   one at creation time —

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   fgos add --title "<title>" --kind <kind> --risk <risk> --verify "<real, runnable command>" --description "<full-text description>" --docs-ref "docs/history/<feature>/" --dir "$root"
   ```

   (no positional argument — `fgos add`'s positional/`--id` is the item's
   own id, not its title; omitting `--id` entirely auto-generates a
   collision-free one from `--title`. tsk-59a: an earlier version of this
   example passed the title positionally and omitted the other required
   fields, which `fgos add` rejects outright — same class of bug found
   and fixed in `fgos-coding-planning`'s own split-step example, never grepped
   for elsewhere until now.)

   — `--docs-ref` is the item's existing pointer field, not a new one; the
   doc itself is what's git-versioned, the field only points at its
   directory. An item created earlier without `docsRef` is unaffected —
   the field is optional, and this skill does not need every item to
   already carry it.

4. **Hand off.** Locking decisions here never decides the item's next edge.
   Once CONTEXT.md is written and approved, it is the session's own
   judgment — reading what was just locked, not this skill mechanically —
   that decides whether the item is simple enough to move straight to
   `executing` or needs `fgos-coding-planning`'s shaping first. Either way, the
   only edges that exist from `exploring` are the ones already registered
   for the item's domain; this skill never adds one, never removes one, and
   never applies the move itself. Load `fgos-routing` to re-read the item's
   `stage` and get pointed at the right next skill, or hand it to
   `fgos-coding-planning` directly if the next step is already obvious.

## Re-entry from `fgos-coding-planning` (mid-planning gap)

`fgos-coding-planning`'s step 6 invokes this skill directly when
`CONTEXT.md` turns out silent on something material to the plan. That
re-entry is **not** a fresh exploring pass, and treating it as one is the
failure this section exists to prevent
(`docs/history/coding-planning-validating-gate-redesign/CONTEXT.md` D14).

Recognize it by the `fgos decision` planning is required to write before
handing back (D14a): a `planning->exploring hand-back:` line naming the
gap, and a rationale naming which tier-A actions were already tried. Read
it from `fgos list --id <id> --json`'s `data.decisions`, most recent last.

When re-entering this way:

- **Handle only the recorded gap.** Do not re-run step 1's scan and do not
  generate a fresh 2-4 question set — `CONTEXT.md`'s existing decisions
  already cover everything else, and re-asking what a prior round settled
  is exactly what step 1's own "already-asked ground" rule forbids. The
  tier-A actions named in that rationale were already run; do not repeat
  them either.
- **Append, never rewrite.** Lock the answer as a new D-ID appended to
  `CONTEXT.md`'s existing decisions table, and leave `## Outstanding
  questions` reading `None`.
- **Do not run the Gate below, and do not record `contextApprove`**
  (D14c). It already ran once for this `CONTEXT.md`; the re-entry adds one
  decision, and asking "Approve CONTEXT.md before planning?" immediately
  after a person has just answered the Socratic question is the empty gate
  this redesign removes. If the gap resolved without needing a person at
  all, the new decision still reaches one — the plan built on it goes
  through `fgos-coding-validating`'s single gate.
- **`item.stage` stays `planning` throughout.** There is no
  `planning -> exploring` edge (`src/state/workflow-stage-graphs.mjs`'s
  `DOMAINS.coding.transitions` is forward-only); this is a skill
  invocation, never a stage move. Hand back to `fgos-coding-planning` when
  the gap is closed.

Everything below this section applies to a normal `exploring`-stage
entry — an item that arrived here because `fgos discover` returned
`unclear`.

## Gate

Before asking, check whether this gate can auto-approve instead
(`docs/history/gate-bypass/CONTEXT.md` D1-D5 — never the `awaiting-human`
park, only this skill-embedded question):

Run these as two SEPARATE tool calls, never pasted together as one script —
a worktree-isolated session's own isolation guard refuses a single call
combining a `git`-rooted command with a following `node .../fgos.mjs`
invocation (tsk-3rg). Resolve `root` first, read its printed value, then
substitute that literal path into the second call.

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
```

```bash
node "$root/bin/fgos.mjs" gate-check "<item-id>" --gate contextApprove --artifact "docs/history/<feature>/CONTEXT.md" --dir "$root"
```

`gate-check` (tsk-65q) wraps `canAutoApprove` (`src/state/gate-bypass.mjs`)
behind the CLI's own static imports — `bin/fgos.mjs` imports
`gate-bypass.mjs` with a plain relative specifier, which Node resolves
against `bin/fgos.mjs`'s own file location, never the caller's cwd or repo
root. That is what lets it resolve correctly from any install shape (dev
checkout, global npm install, npx) with zero special-casing — unlike the
two-tier cwd-relative/`$root`-relative resolver this Gate section used to
embed inline, which had no path back to the package's own install location
and crashed unconditionally for a pure global-install consumer whose own
repo carries no `src/state/*.mjs` at all
(`docs/history/tsk-65q-gate-bypass-global-install-resolution/RESEARCH.md`).
Read the verb's `data.canAutoApprove` field (`true`/`false`) from its JSON
output.

Treat anything other than exactly `data.canAutoApprove === true` in the
verb's JSON output — `false`, a non-zero exit, a malformed response — as
`false`: fail closed, never skip the question on a check that couldn't run
cleanly.

Either branch below also records a structured approve record (tsk-19j
D1/D11) — separate from, and in addition to, `fgos decision`'s free-text
audit line: `fgos gate-approve <item-id> --gate contextApprove --actor
<human|bypass> --verify "<item's current verify field>"` (`fgos list --id
<item-id> --json`'s `data.work[id].verify`, read fresh right before this
call — fgos-coding-exploring does not design a new verify command, per this
skill's own "do not research implementation" rule; it only snapshots
whatever verify the item already carries into the structured record).

Immediately after that gate-approve record, in BOTH branches, this session
fires the exploring→planning engine transition itself (tsk-4b2 D6 —
retargeted from clarify→planning now that this skill runs at `exploring`,
not `clarify`; `nextDiscoveryEdge`, `src/intake/discovery.mjs`, resolves
the right edge from the item's own `stage`, so this is still the exact
same verb call) — this session is already the live soul that just did the
real Socratic reasoning, so it passes that verdict directly instead of
leaving the transition to a LATER blind `fgos discover` call or the
fragile `readLockedContext` file-read trust signal (tsk-27y D1/D2,
Native-First Dispatch Doctrine Phase 2 — `docs/decisions/0026-...md`):

```bash
node "$root/bin/fgos.mjs" discover "<item-id>" --verdict clear --verify "<the same verify value just recorded via gate-approve>" --dir "$root"
```

- **`true`** — skip the question. Post the non-question line
  `auto-approved: CONTEXT.md (gate-bypass level <level>)`, log it
  (`fgos decision --text "auto-approved CONTEXT.md gate for <item-id> at
  level <level>" --rationale "gate-bypass level <level> permits
  auto-approval per docs/history/gate-bypass/CONTEXT.md D1-D5"`, D3's
  audit trail), record it (`fgos gate-approve <item-id> --gate
  contextApprove --actor bypass --verify "..."`, per above), fire the
  `fgos discover --verdict clear` call above, then continue straight to
  `fgos-coding-planning`.
- **`false`** — surface the locked decisions in plain language — what was
  decided, why it can be trusted, what it costs if wrong — with CONTEXT.md
  linked, then ask exactly: "Decisions locked. Approve CONTEXT.md before
  planning?" CONTEXT.md is the source of truth for every downstream step;
  its decision IDs are stable and cited, never silently reinterpreted. Once
  the person approves, record it (`fgos gate-approve <item-id> --gate
  contextApprove --actor human --verify "..."`, per above), fire the `fgos
  discover --verdict clear` call above, then continue to `fgos-coding-planning`.

## Red flags

- batching a question whose wording a prior answer could still change
- a question asked that fails the material/grounded/answerable check
- deep implementation analysis or architecture proposals during this skill
- writing code, other than the decision doc itself
- classifying the item's domain, or deciding its shape/size — not this
  skill's job
- CONTEXT.md left with placeholders, or handed off without the gate question
- locking a "decision" from a guess instead of an answer
- scope creep absorbed instead of marked deferred
- on a mid-planning re-entry: re-running step 1's scan, regenerating a
  full question set, or re-asking `contextApprove` — all three turn a
  narrow gap-closing pass into a second gate in stage `planning`
- re-running a tier-A action the hand-back decision already records as
  tried
- calling `fgos ask` without the paired `handoff --reason advise` first
  (when the domain has a `roleGraph`), or firing `handoff` for a live
  conversational question that never actually parks
- continuing to a second Socratic round, or any further `consult`/
  `advise` attempt, with `holder` still `human-advisor` after an
  immediately-answered `ask` — reclaim first (tsk-2t9c D16)
- reclaiming only once at Scope and stopping even though `holder` has not
  reached `implementer` yet (a depth-2 nested call needs two reclaims)

Violating the letter of the rules is violating the spirit of the rules.

Decisions captured and CONTEXT.md written. Invoke `fgos-coding-planning` (directly,
or via `fgos-routing` once the item's next stage is clear).
