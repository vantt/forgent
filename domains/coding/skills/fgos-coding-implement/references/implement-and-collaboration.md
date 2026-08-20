# Implement and Collaboration — full mechanics

The full detail behind SKILL.md's Step 2.

## The dispatch-decide branches

Run `dispatch.mjs decide` first, per SKILL.md's Hard rule, and branch on
its answer:

- **`unavailable`** — do your own Implement work directly: reading
  files, writing the real change, running the Iron Law classify
  yourself — never spin up an ad hoc Agent/Task sub-dispatch for it. This
  session is already a live, same-provider soul; doing that would be the
  same "soul re-deriving what a live soul already knows" waste a blind
  cli-spawn produces elsewhere — pure overhead, not a transparency
  question.
- **`in-process`** — same as `unavailable`, optionally via the returned
  `agentType`.
- **`out-of-process`** — dispatch via `node src/runner/dispatch.mjs
  execute <executorId> --prompt "..." --has-live-task-access` instead of
  writing the change yourself; read the result's `stdout` as the work
  product. **Commit ownership shifts here:** per
  `../_shared/coding-worker-contract.md`'s Layer 2 rules, the dispatched
  worker already ran the item's own verify and committed its own change
  before returning — you do NOT run Verify/Commit yourself for this
  mechanism. Confirm the worker's own commit is real (`git log -1` shows
  a new commit citing this item, `git status` is clean) then skip
  straight to Step 4's Iron Law classification against that commit. If
  the worker returned `[BLOCKED]` or the tree is not clean, that is a
  driver-side problem to handle (park the item / retry dispatch) — never
  silently run Verify/Commit yourself to paper over a worker that didn't
  finish its own half.

Either way, before editing a symbol yourself, apply `CLAUDE.md`'s
impact-analysis capability gate rather than assuming GitNexus is on this
machine: `fgos tool query --capability impact-analysis --status present`
decides whether the MUST-run-impact rule is Full (present — run it),
Degraded (registered but not present — proceed, but say the blast radius
is unconfirmed), or Inactive (nothing registered — proceed without it).

## When reality disagrees with what the item assumed

- a bug found in code you are already touching → fix it, and say so
  plainly when you return the item;
- functionality the item's own outcome depends on turns out to be
  missing → add it, for the same reason;
- a blocking issue in the path (broken import, obvious type error) →
  fix it;
- the fix would require redesigning scope or architecture beyond what
  the item describes → stop. Do not redesign inside an `executing` item.
  Park it instead: `fgos ask <id> --text "..."` records the question and
  drops the item out of the frontier until a person answers via `fgos
  answer <id> --text "..."`.

A package install is the same kind of stop — it is a scope decision, not
an implementation detail; park it the same way rather than installing on
your own authority.

## Collaboration calls

The same four interactions this skill already performs implicitly, now
made visible through the role/holder axis. Each fires ONLY when its
trigger actually matches; no trigger matching means no call:

- **consult (sync)** — a named library/API/pattern surfaces that cannot
  be resolved from context already in hand. After getting the finding
  (`fgos-researching`, or your own direct read), log it:

  ```bash
  node "$root/bin/fgos.mjs" handoff "<id>" --to researcher --reason consult --outcome "<the finding, one line>" --dir "$root"
  ```

- **assist (sync)** — an independent scoped subtask exists whose
  footprint does not touch the file(s) you are currently editing. After
  the subagent (`fgos-fanout`/Agent tool) hands back its work product,
  log it:

  ```bash
  node "$root/bin/fgos.mjs" handoff "<id>" --to helper --reason assist --outcome "<the work product, one line>" --dir "$root"
  ```

- **advise (async)** — a product decision outside the locked decisions
  is needed, and the question passes the material/grounded/answerable
  filter. This is `fgos ask`'s own async park — call `handoff` FIRST
  (moves `holder` to `advisor` without touching `status`), THEN
  `ask` (parks `status` to `awaiting-human`):

  ```bash
  node "$root/bin/fgos.mjs" handoff "<id>" --to advisor --reason advise --dir "$root"
  ```

  ```bash
  node "$root/bin/fgos.mjs" ask "<id>" --text "..." --dir "$root"
  ```

  The role-axis side of this call closes later, at a future session's
  Orient step (the reclaim rule) — never assume the same session that
  asked is the one that gets answered.

Both `--outcome`/consult/assist calls are single, after-the-fact logs
(sync — the role-graph edge decides this, never a flag you pass) — there
is no separate "start" call for a sync interaction.
