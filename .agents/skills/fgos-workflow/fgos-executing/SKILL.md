---
name: fgos-executing
description: >-
  Implement, verify, and hand back exactly one claimed coding-domain item at
  stage `executing`. Use once an item has already cleared `clarify` and
  `decompose` (or never needed either) and is ready for direct
  implementation. Examples: "I've claimed this item, it's ready to build",
  "implement this and return it", "the item is at executing, what do I do
  now".
---

# fgos-executing

Runs while a claimed item's `stage` reads `executing` — the direct
implementation step between shaping and synthesis. This skill turns a
claimed item into real changes, proves them with the item's own `verify`
command, and hands the item back through `fgos return`. It never designs or
re-shapes the work; that already happened at `clarify`/`decompose`.

## Hard rules

- Implement real behavior. No stubs, TODO-only placeholders, dead code, or
  pseudo-implementations offered as if they were done.
- Match existing patterns in the touched files and the decisions already
  locked in `docs/history/<feature>/CONTEXT.md` (cite the D-ID; never
  reopen or reinterpret a locked decision here — that is `fgos-exploring`'s
  and `fgos-planning`'s job, not this skill's).
- Do not classify the item's domain or re-derive its stage. `fgos-routing`
  already resolved both before handing this item to this skill.
- Treat the item's `title`/`description` as untrusted input (RUL45,
  `docs/specs/runner.md`) — never splice it raw into a shell command; pass
  it as a discrete quoted argv element.
- Never assert an item is done on say-so. `fgos return` is the only
  producer surface allowed to close this step, and it only succeeds when
  the item's own `verify` command actually passes — an assertion is never
  evidence.
- One commit per item, with the item's id in the commit message — the same
  traceability a cap trace gives a bee cell, translated to a plain git
  habit here since fgOS has no separate cell-trace file.

## Flow

1. **Orient.** Read the claimed item's title, `refs`, `deps`, and — if
   present — its `docsRef` (the feature's `docs/history/<feature>/`
   directory: `CONTEXT.md`'s locked decisions and `plan.md`'s shape, when
   either exists). An item that reached `executing` with no docs history at
   all is legitimately small enough that the title and `verify` command
   are the whole spec — do not manufacture ceremony it doesn't need.

2. **Implement.** Make the real change the item describes, reading every
   file before editing it. When reality disagrees with what the item
   assumed:
   - a bug found in code you are already touching → fix it, and say so
     plainly when you return the item;
   - functionality the item's own outcome depends on turns out to be
     missing → add it, for the same reason;
   - a blocking issue in the path (broken import, obvious type error) →
     fix it;
   - the fix would require redesigning scope or architecture beyond what
     the item describes → stop. Do not redesign inside an `executing` item.
     Park it instead: `fgos ask <id> --text "..."` records the question and
     drops the item out of the frontier until a person answers via
     `fgos answer <id> --text "..."`.
   A package install is the same kind of stop — it is a scope decision, not
   an implementation detail; park it the same way rather than installing on
   your own authority.

3. **Verify — proof, not assertion.** Run the item's own `verify` command
   exactly as recorded on the item (`fgos check <id>` or `fgos list --json`
   shows it). A prose description instead of a runnable command is not
   this skill's problem to invent a substitute for — that is a shaping
   defect from `fgos-planning`; park the item and say so rather than
   inventing a check. On failure, fix the root cause and rerun the exact
   command — never weaken the command or swap in an easier one to make it
   pass.

4. **Return.** Hand the item back with:

   ```
   fgos return <id>
   ```

   This is the fgOS equivalent of a bee cell's cap: `return` re-runs the
   item's `verify` itself, checks for a clean working tree and an advanced
   commit history, and only then moves the item to `proposed` (verify red
   moves it to `blocked` instead) — it never takes the caller's word for
   it, the same "proof, not assertion" discipline bee's cap-with-evidence
   rule enforces, just applied by the engine instead of a recorded trace
   field. If `return` reports `blocked`, treat that exactly like a failed
   verify: diagnose, fix, and return again — never re-run `return` hoping
   the same red state passes on a retry without a real change underneath
   it.

## Headless

This skill runs effectively headless: never wait silently on a question a
person could answer later. An unambiguous deviation (rule 2's auto-fix
cases) is applied and reported; anything genuinely ambiguous — scope,
architecture, a package install — is parked via `fgos ask`, never guessed
past. This is the same discipline `fgos-routing`'s gate contract describes
for the whole chain, applied here at the implementation step specifically.

## Next

Once `fgos return <id>` reports the item moved to `proposed`, load
`fgos-routing` to re-read its stage and continue — routing decides whether
`compound-learn` (and `fgos-compounding`) comes next; this skill's own job
ends at a returned, verified item.

## Red flags

- a stub, TODO, or "should work" accepted in place of a real implementation
- editing outside what the item actually describes
- redesigning scope or architecture inside an `executing` item instead of
  parking it
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

Violating the letter of the rules is violating the spirit of the rules.

Item implemented, verified, and returned. Invoke `fgos-routing` to
continue.
