---
name: fgos-coding-implement
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
command, and hands the item back through `fgos return`. It never designs or
re-shapes the work; that already happened at `discovery`/`exploring`/`planning`.

## Hard rules

- This skill runs precisely while the session is inside the claimed
  item's worktree (the case tsk-56t exists for) — which never carries its
  own `.fgos/` by design (ADR0020). Every `fgos <verb>` this skill calls
  (`ask`, `answer`, `return`) is `requiresExistingStore: true` and refuses
  (exit 4) rather than silently diverge if run bare from here. Resolve
  the main checkout root and pass it explicitly on every one of them:

  ```bash
  root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
  node "$root/bin/fgos.mjs" <verb> ... --dir "$root"
  ```

  (tsk-56t D1 — the same `root` resolution `fgos-coding-exploring`'s and
  `fgos-coding-planning`'s own gate-bypass checks already rely on). Run
  these as two SEPARATE tool calls, never pasted together as one script —
  a worktree-isolated session's own isolation guard refuses a single call
  that combines a `git`-rooted command with a following `node
  .../fgos.mjs ... --dir` invocation ("too complex to verify that it
  stays inside the worktree"), even though each command is safe on its
  own (tsk-3rg). Resolve `root` alone first, read its printed value, then
  substitute that literal path into the following `fgos.mjs` call —
  never `$root`, since a fresh tool call starts a new shell with no
  memory of the previous one's variables anyway.
- Do your own Implement work directly — reading files, writing the real
  change, running the Iron Law classify yourself — never delegate it to
  the Agent/Task tool as an ad hoc sub-dispatch. This session is already a
  live, same-provider soul (Native-First Dispatch Doctrine rule 2,
  `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-
  cli-spawn.md`): spawning a nested Task subagent to implement work you
  already have full context for (the locked decisions, the plan, the
  item's own verify) is the same "soul re-deriving what a live soul
  already knows" waste `tsk-1ni` found in `judgeDiscovery`'s blind
  cli-spawn — pure overhead, not a transparency question (a Task/Agent
  call is collapsed by default in the transcript, not hidden, unlike a
  genuinely opaque headless `claude -p` subprocess). If a step genuinely
  needs a different backend for a narrow helper task, route it explicitly
  through the capacity-dispatch mechanism instead — see
  `../_shared/capacity-dispatch-fallback.md` for its own list of valid
  reasons.
- Implement real behavior. No stubs, TODO-only placeholders, dead code, or
  pseudo-implementations offered as if they were done.
- Match existing patterns in the touched files and the decisions already
  locked in `docs/history/<feature>/CONTEXT.md` (cite the D-ID; never
  reopen or reinterpret a locked decision here — that is `fgos-coding-exploring`'s
  and `fgos-coding-planning`'s job, not this skill's).
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

   If this session did not arrive here via the `fgos-coding-driving` loop
   (which already re-checks claim status fresh right before invoking this
   skill) — for example, a session driving stage-by-stage by hand, straight
   from `fgos-coding-validating`'s own `fgos plan` call — re-check the item's
   live `status` (`fgos list --id <id> --json`) before doing anything else:
   the `planning`→`executing` edge releases the claim back to `todo`
   (`releaseClaimOnExecuting`, `src/intake/plan.mjs:488-494`,
   claim-lock §3b), so the claim may already be released. If `status` reads
   `todo`, re-claim (`fgos pick <id>`) before Implementing — proceeding
   without a live claim risks `fgos return` refusing later with "is todo,
   not doing".

2. **Implement.** Make the real change the item describes, reading every
   file before editing it. Before editing a symbol, apply `CLAUDE.md`'s
   impact-analysis capability gate rather than assuming GitNexus is on this
   machine: `fgos tool query --capability impact-analysis --status present`
   decides whether the MUST-run-impact rule below is Full (present — run
   it), Degraded (registered but not present — proceed, but say the blast
   radius is unconfirmed), or Inactive (nothing registered — proceed
   without it). When reality disagrees with what the item assumed:
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
   defect from `fgos-coding-planning`; park the item and say so rather than
   inventing a check. On failure, fix the root cause and rerun the exact
   command — never weaken the command or swap in an easier one to make it
   pass. If the failure is a confusing "command not found"/wrong-output
   result rather than a clean test failure or a clean shell syntax error,
   read `docs/how-to/preserve-shell-escapes-when-transcribing-a-verify-
   command.md` (tsk-463) — a backslash-escaped backtick lost during an
   earlier hand-transcription is a common, quiet cause.

4. **Commit, then check Iron Law evidence (when applicable).** The Iron Law
   gate's own file-set computation (`changedFiles`, `src/runner/merge.mjs`)
   diffs `trunk...branch` — COMMITTED history only, the exact same
   committed-ref shape `approve`/`sync-root`'s own gate diffs at merge time
   (`docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` D2: the
   trigger must reuse the real classifier against the real diff, never an
   early-prediction heuristic). Running this check before committing the
   implementation is a false negative, not a skip — the diff sees only
   whatever was already committed (typically just the earlier
   `plan.md`/`CONTEXT.md` commits), so the classification comes back
   `{required:false}` even when the real diff would trip the gate, silently
   skipping `iron-law-evidence.md` and forcing a retroactive scramble to
   reconstruct proof once `approve` correctly catches it later (`tsk-2l0`,
   reproduced live on `tsk-1ne` the session immediately before this fix was
   written). So: `git add` and `git commit` the real implementation (and
   its now-passing verify from step 3) FIRST —

   ```bash
   git add <files this item actually changed>
   git commit -m "<conventional-commit message, item id included>"
   ```

   — THEN compute the exact file set the gate itself uses and classify it
   the same way (`classifyIronLaw`, `src/evolve/iron-law.mjs`), against
   that now-real committed diff:

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   node --input-type=module -e "
   import { changedFiles } from './src/runner/merge.mjs';
   import { classifyIronLaw } from './src/evolve/iron-law.mjs';
   import { listWork } from './src/state/store.mjs';
   const item = listWork(process.argv[1] + '/.fgos').work[process.argv[2]];
   const filesChanged = changedFiles(process.argv[1], item);
   console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
   " "$root" "<id>"
   ```

   When the result's `required` is `true`, write
   `docs/history/<id>/iron-law-evidence.md` — the matched flags/modules
   from that same result, the test command step 3 already ran, and its
   real failing-before/passing-after transcript excerpts (the
   "failing-test-first proof" `CONTEXT.md` D1 pins) — and commit it as its
   own follow-up commit (the implementation already landed in its own
   commit above; the "one commit per item" rule above is about the
   implementation itself, not a ban on this small additive evidence
   commit that necessarily comes after it). When `required` is `false`,
   write nothing; this cost is only paid for the items the gate will
   actually apply to.

5. **Return.** Hand the item back with:

   ```
   fgos return <id>
   ```

   This is the fgOS equivalent of a bee cell's cap: `return` re-runs the
   item's `verify` itself, checks for a clean working tree and an advanced
   commit history, and only then moves the item to `awaiting-approval` (verify red
   moves it to `blocked` instead) — it never takes the caller's word for
   it, the same "proof, not assertion" discipline bee's cap-with-evidence
   rule enforces, just applied by the engine instead of a recorded trace
   field. If `return` itself just moved the item to `blocked` (a verify
   failure caught while `status` was still `doing`), treat that exactly
   like a failed verify: diagnose, fix, and return again — never re-run
   `return` hoping the same red state passes on a retry without a real
   change underneath it.

   If the item is instead ALREADY `blocked` when you go to call `return`
   (e.g. `approve`'s post-merge verify-fail rollback left it
   `reason: verify-fail-post-merge`), `return` structurally refuses — it
   requires `status: doing`, and this item's `blocked → awaiting-approval`
   edge never passes through `doing` (RUL33/RUL34,
   `docs/specs/work-state.md`). The correct recovery verb there is `fgos
   catchup <id>`, not another `return` call: it re-runs `verify` on a
   staged merge into the item's target branch and, on green, moves it
   straight to `awaiting-approval`.

## Headless

This skill runs effectively headless: never wait silently on a question a
person could answer later. An unambiguous deviation (rule 2's auto-fix
cases) is applied and reported; anything genuinely ambiguous — scope,
architecture, a package install — is parked via `fgos ask`, never guessed
past. This is the same discipline `fgos-routing`'s gate contract describes
for the whole chain, applied here at the implementation step specifically.

## Next

Once `fgos return <id>` reports the item moved to `awaiting-approval`, load
`fgos-routing` to re-read its stage and continue — routing decides whether
`compound-learn` (and `fgos-coding-compounding`) comes next; this skill's own job
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
- fabricating or paraphrasing the failing-test-first transcript in
  `iron-law-evidence.md` instead of pasting the real command output
- writing `iron-law-evidence.md` for an item `classifyIronLaw` says
  `required: false` for

Violating the letter of the rules is violating the spirit of the rules.

Item implemented, verified, and returned. Invoke `fgos-routing` to
continue.
