# fgos-unlock-main-checkout-lock — locked decisions (tsk-3h4)

## Feature boundary

`tsk-3h4`: add a convenient, safe way for a person or session to clear a
stuck `.fgos/main-checkout.lock` when `fgos take`/`fgos pick` fails with
`lock-held` or `lock-ambiguous`. Today there is no recovery path at all —
the only way out is a hand-run `rm .fgos/main-checkout.lock` against the
raw file, bypassing every safety check the lock exists to enforce.

Out of scope: `runner.lock`, `sessions.lock`, `events.lock` (same lock
lineage, same problem class, not requested here — see D3).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | A new `fgos` CLI verb does the real work of clearing the lock (exact verb name/flags left to `fgos-coding-planning`, e.g. `fgos unlock`); the user/agent-facing "skill" from the item title is a thin wrapper that calls that verb — it never mutates `.fgos/main-checkout.lock` itself. Matches the pattern every existing fgOS skill already follows (`fgos-routing`'s `fgos take`/`fgos ask`, etc.): skills call verbs, they don't reimplement engine logic. |
| D2 | The verb must not blindly delete the lock file. It reuses `acquireMainCheckoutLock`'s own staleness/liveness judgment (`src/runner/main-checkout-lock.mjs`) before removing anything: if a *different* identity's lock is still live (numeric pid alive, or string identity within its `ttlMs` freshness window), the verb refuses and reports that holder's identity rather than clearing it. Only a stale, corrupt, or otherwise reclaimable lock is actually removed. This preserves the STR65 concurrent-writer guarantee the lock lineage exists for (`.git/index` clobbering, decision 0021) — a force-delete would silently reopen that exact race. |
| D3 | Scoped to `.fgos/main-checkout.lock` only. `runner.lock` (`src/runner/loop.mjs`), `sessions.lock` (`src/runner/session.mjs`), and `events.lock` (`src/state/events.mjs`) are the same wx-atomic-create + stale-pid-reclaim lineage and share the same stuck-lock failure mode, but generalizing to all four is a bigger surface than the item's title ("git main checkout lock") asked for. A future item can extend this verb's shape to the other three if that need shows up. |

## Pinned terms

- **"git main checkout lock"** (item title) resolves to `.fgos/main-checkout.lock`
  (`src/runner/main-checkout-lock.mjs`) — the fgOS-internal STR65
  concurrent-writer activity lock — never git's own native
  `.git/index.lock`, and never `git worktree lock`/`git worktree unlock`.
  Ruled out, not just assumed:
  - Neither `.git/index.lock` nor `git worktree lock` appears anywhere in
    this repo's source, docs, or decision records (`grep -rIn` over
    `src`/`bin`/`docs` turns up zero hits for either) — there is no
    existing repo artifact either alternate reading would attach to.
  - `.fgos/main-checkout.lock` does exist, is actively used
    (`claim-port.mjs:80`, `.githooks/pre-commit`), and already has a
    decision record naming it specifically (0021) — a real, in-repo
    referent the title's wording matches directly ("main checkout lock").
  - The item asks for a **skill** — a concept meaningful only inside this
    repo's own fgOS/Claude-Code workflow (`.claude/skills/fgos/*`). A stuck
    native `.git/index.lock` is universal git knowledge with a one-line
    fix (`rm .git/index.lock`) that needs no bespoke skill or work item;
    only the fgOS-internal lock's safety semantics (D2) justify building
    one.
- **"convenient skill"** (item title) resolves to: a `fgos` CLI verb (the
  actual capability) plus a skill doc that calls it — not a skill doc that
  contains the unlock logic itself (see D1).
- **"stuck lock"** means the lock is in `HELD` state with a dead/expired
  holder, or `AMBIGUOUS` state (corrupt content, or a string-identity
  record with no `ttlMs` supplied) — the two non-`ACQUIRED` statuses
  `acquireMainCheckoutLock` already returns (`src/runner/main-checkout-lock.mjs:66-68`).

## Scout evidence

- `src/runner/main-checkout-lock.mjs` — the lock primitive itself:
  `acquireMainCheckoutLock`/`releaseMainCheckoutLock`, `ACQUIRED`/`HELD`/`AMBIGUOUS`
  statuses, `DEFAULT_TTL_MS` (3 min as of a concurrent tsk-3h4-unrelated fix,
  1dabb6b — was 5 min when this doc was first written), self-recognition (D6), string-identity
  vs numeric-pid staleness judgment.
- `src/runner/claim-port.mjs:73-86` — the only current caller. On `HELD` or
  `AMBIGUOUS` it throws `ClaimError('lock-held'|'lock-ambiguous', ...)` with
  no recovery path; the `finally` block only ever *releases* a lock this
  same call acquired, never repairs one left behind by a dead process.
- `bin/fgos.mjs:2233-2242` (`case 'doctor'`) — `doctor` is explicitly
  documented and implemented as read-only ("Never writes anything... no
  config write"); no verb anywhere touches `main-checkout.lock` removal
  today. `DOCTOR_CHECKS` (`src/setup/checks.mjs`) has no lock-related check.
- `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md` — prior
  team decision on this same lock lineage: prefer wiring/using existing
  primitives over building new app-level lock subsystems (YAGNI); this
  item's verb should be read the same way — a thin, safe wrapper around the
  primitive that already exists, not a new lock subsystem.

## Canonical references

- `src/runner/main-checkout-lock.mjs`
- `src/runner/claim-port.mjs`
- `bin/fgos.mjs` (`case 'doctor'`, `COMMAND_REGISTRY` — where a new verb
  gets registered)
- `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`

## Outstanding questions deferred to planning

- Exact verb name and flag shape (e.g. `fgos unlock`, `fgos unlock
  main-checkout`, or a flag on an existing verb) — implementation detail,
  not a product decision.
- Whether the verb needs a `--dry-run`/report-only mode before actually
  removing anything, or reporting is fully covered by the refusal message
  in D2.
- Whether the skill wrapper (D1) is a new file under `.claude/skills/fgos/`
  alongside the existing `fgos-routing`/`fgos-coding-exploring`/etc. skills, or
  folded into `fgos-routing`'s own gate-contract section — a shaping call,
  not a clarify-stage one.
