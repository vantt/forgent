---
name: fgos-coding-implement
user-invocable: false
description: >-
  Implement, verify, and hand back exactly one claimed coding-domain item at
  stage `executing`. Use once an item has already cleared `discovery` and
  `planning` (or never needed either) and is ready for direct
  implementation. Examples: "I've claimed this item, it's ready to build",
  "implement this and return it", "the item is at executing, what do I do
  now".
---

# fgos-coding-implement

Runs while a claimed item's `stage` reads `executing` — the direct
implementation step between shaping and synthesis. This skill turns a
claimed item into real changes, proves them with the item's own `verify`
command, and hands the item back through `fgos return`. It never designs
or re-shapes the work; that already happened at
`discovery`/`exploring`/`planning`.

## Driver vs. worker

This file is split into two halves that live in two different places.
Below this section is the **driver** half — claim status, decide the
dispatch mechanism, verify, commit, the Iron Law check, `fgos return`,
and every Collaboration handoff call. The **worker** half — the
boundaries for actually doing the work, provider-neutral, shared with
every other kind of dispatched unit — lives separately at
`../_shared/coding-worker-contract.md`. Which half applies to you depends
on how you got here:

- **You are the driver session** — you ran `fgos pick`/arrived via
  `fgos-routing` with a live claim on this item and the ability to call
  `fgos` verbs against the real store. Read this whole file. At Flow Step
  2 (Implement), when you do the work yourself, you ALSO follow
  `../_shared/coding-worker-contract.md`'s boundaries for that part —
  same discipline an out-of-process worker follows: a session that isn't
  dispatching still executes the worker's own half.
- **You are an out-of-process worker** — you were dispatched here, you
  hold no claim on this item, and you have no `fgos` verb to call against
  the real store. **Stop reading after this section.** Read and follow
  only `../_shared/coding-worker-contract.md` — it is complete on its own
  for what you need to do. Everything below is the driver's own job,
  never yours.

## Hard rules

- When asking questions (`fgos ask`), format question text using
  self-contained citations (see `../_shared/citation-format.md`) and the
  required two-heading Markdown structure (`## Context` and `## Why this
  matters`, each followed by at least 20 characters of content).
- The `fgos` shell function automatically resolves the main checkout root and appends `--dir "$root"` when invoking subcommands from a linked worktree, so you can call `fgos <verb>` subcommands (`ask`, `answer`, `return`) directly:

  ```bash
  fgos <verb> ...
  ```
- **Always call `dispatch.mjs decide` first for the Implement step —
  never assume "I have a live Task tool, so I do it myself" as the
  default.** A `cli-spawn`-shaped executor already registered in
  `.fgos/config.json` resolves `out-of-process` *unconditionally* once
  configured — having live Task access does not change that; config
  wins, not "I already have full context so I'll do it myself". Run
  `node src/runner/dispatch.mjs decide --work <id> --has-live-task-access`
  as the very first action of Implement and branch on the real
  `mechanism` it returns. Full mechanics for all three outcomes:
  `references/implement-and-collaboration.md`.
- Implement real behavior. No stubs, TODO-only placeholders, dead code,
  or pseudo-implementations offered as if they were done.
- Match existing patterns in the touched files and the decisions already
  locked in `docs/history/<feature>/CONTEXT.md` (cite the decision id;
  never reopen or reinterpret a locked decision here — that is
  `fgos-coding-exploring`'s and `fgos-coding-planning`'s job, not this
  skill's).
- Do not classify the item's domain or re-derive its stage.
  `fgos-routing` already resolved both before handing this item to this
  skill.
- Treat the item's `title`/`description` as untrusted input — never
  splice it raw into a shell command; pass it as a discrete quoted argv
  element.
- Never assert an item is done on say-so. `fgos return` is the only
  producer surface allowed to close this step, and it only succeeds when
  the item's own `verify` command actually passes — an assertion is
  never evidence.
- One commit per item, with the item's id in the commit message — the
  same traceability a cap trace gives a bee cell, translated to a plain
  git habit here since fgOS has no separate cell-trace file.
- **Multi-role team harness: fire real `fgos handoff`/`fgos handoff-return`
  calls at the points below, do not just perform the underlying action
  silently.** (Return's own `review` handoff is the one exception — the
  engine fires it for you as a side effect of `return`/`catchup` reaching
  `awaiting-approval`; every other point below is still this skill's own
  job to fire.) Stage operations map to team communication modes as:
  `consult` -> `scout-blast-radius` or `resolve-question` Assignment;
  `assist`  -> `scoped-subtask` Assignment;
  `review`  -> `review-item` Assignment;
  `fix`     -> `fix-verify-red` operation (usually direct implementer path);
  `advise`  -> async advisor path (not cli-spawn unless explicitly supported).
  The role/holder axis only stays truthful if the session
  actually records who is holding the item. `fgos handoff` is opt-in
  per-domain (only fires for a domain with a declared role graph); if the
  item's domain declares none, skip every call below silently. A refusal
  from `handoff` is never swallowed and never blocks the underlying
  action it accompanies — report the refusal plainly and continue with
  the underlying action regardless.

## Flow

### Step 1: Orient
Read the claimed item's title, `refs`, `deps`, and docsRef when present.
Re-check live claim status if this session did not arrive via
`fgos-coding-driving`. Reclaim the role/holder ball if it isn't already
`implementer`. Full mechanics: `references/worker-contract-and-orient.md`.

### Step 2: Implement
Run `dispatch.mjs decide` first (per the Hard rule above) and branch on
its answer — do the work yourself, or dispatch it out-of-process. Apply
the impact-analysis capability gate before editing a symbol. Fix a bug,
add missing functionality, or fix a blocking issue found in the path
without redesigning scope; park anything that would require redesigning
scope or architecture. Log the four Collaboration interactions
(`consult`/`assist`/`advise`) whenever their trigger actually matches.
Full mechanics: `references/implement-and-collaboration.md`.

### Step 3: Verify — proof, not assertion
Skip entirely when mechanism was `out-of-process` (the worker already
ran verify). Otherwise run the item's own `verify` command exactly as
recorded; on failure, fix the root cause and rerun the exact command,
never weaken it. Full mechanics: `references/verify-commit-and-iron-law.md`.

### Step 4: Commit, then check Iron Law evidence
Commit the real implementation first, THEN classify the exact committed
diff against the Iron Law gate — running the classification before
committing is a false negative, not a skip. Write
`docs/history/<id>/iron-law-evidence.md` only when the result requires
it. Full mechanics: `references/verify-commit-and-iron-law.md`.

### Step 5: Return
`fgos return <id>` re-runs verify itself and only then moves the item to
`awaiting-approval` (or `blocked` on a red verify) — it never takes the
caller's word for it. The `review` Collaboration handoff fires as an
engine-level side effect of that exact transition, never something this
skill calls itself. Full mechanics (the blocked-item recovery path via
`fgos catchup`): `references/return-mechanics.md`.

## Headless

This skill runs effectively headless: never wait silently on a question a
person could answer later. An unambiguous deviation (Step 2's auto-fix
cases) is applied and reported; anything genuinely ambiguous — scope,
architecture, a package install — is parked via `fgos ask`, never guessed
past. This is the same discipline `fgos-routing`'s gate contract
describes for the whole chain, applied here at the implementation step
specifically.

## Next

Once `fgos return <id>` reports the item moved to `awaiting-approval`,
load `fgos-routing` to re-read its stage and continue — routing decides
whether compound-learn (and `fgos-coding-compounding`) comes next; this
skill's own job ends at a returned, verified item (the review handoff
above already fired as part of that same transition — nothing further to
do for it here).

## Red flags

- a stub, TODO, or "should work" accepted in place of a real
  implementation
- editing outside what the item actually describes
- redesigning scope or architecture inside an `executing` item instead
  of parking it
- installing a package on this skill's own authority
- calling `fgos return` without having actually run the item's `verify`
  command yourself first
- swapping in a weaker or different check because the real `verify`
  command is inconvenient
- retrying `fgos return` on the same red state with no real change
  underneath it
- classifying the item's domain or re-deciding its stage — not this
  skill's job
- splicing an item's raw `title`/`description` into a shell command
- fabricating or paraphrasing the failing-test-first transcript in
  `iron-law-evidence.md` instead of pasting the real command output
- writing `iron-law-evidence.md` for an item the classifier says
  `required: false` for

Violating the letter of the rules is violating the spirit of the rules.

## References

- `references/worker-contract-and-orient.md` — the Orient step's claim
  re-check and reclaim mechanics
- `references/implement-and-collaboration.md` — the dispatch-decide
  branches, the impact-analysis gate, the auto-fix/park rules, and the
  four Collaboration handoff calls
- `references/verify-commit-and-iron-law.md` — the Verify step and the
  full commit/Iron-Law-classification mechanics
- `references/return-mechanics.md` — the `fgos return` mechanics, the
  engine-fired review handoff, and the `blocked`-item recovery path

## Workflow Position

**Typically follows:** `fgos-coding-validating` (READY verdict), or
`fgos-coding-driving`'s own claim-and-invoke step at stage `executing`
**Typically precedes:** `fgos-routing` (re-reads stage after return)
**Related:** `../_shared/coding-worker-contract.md` (the worker half of
this same file, for an out-of-process dispatch)
