# session-claim-liveness — CONTEXT.md

Item: `tsk-3ni`.

## Feature boundary

`pick`/`take` refuses unconditionally (CAS conflict, `transitionWork`,
`src/state/status-fsm.mjs:204-208`, exit 3) when a session tries to claim
an item already `status: doing` — with zero regard for whether the
claiming session (`claimRole: human`/`session`) is still actually working
or has gone quiet. `startupReap` (`src/runner/loop.mjs:360-372`)
deliberately never reaps a `human`/`session` claim, only a `runner`
claim that crashed — a documented, intentional gap
(`docs/specs/work-state.md:459-467,1160-1164`: pull-door claims
"deliberately... parks indefinitely").

In scope: adding a real-activity check into `pick`/`take`'s existing
claim-conflict path so a session can transparently reclaim a `doing`
item whose worktree has genuinely gone quiet, without a human in the
loop, while leaving every other case refusing exactly as it does today.

Out of scope: any change to `startupReap`'s runner-only reap policy;
any change to the `main-checkout-lock` mechanism (a different lock, a
different resource — the repo checkout, not a work item's claim); a new
verb or CLI flag (explicitly rejected — see D5); cross-machine claim
liveness (the activity signal is worktree-local; when it can't be read,
this falls through to today's unconditional refusal, not a new
degraded-mode branch).

## Locked decisions

All five decisions below were locked in a live design discussion
(`fgos-coding-shaping`) before this skill ran — `refs` already pointed
here, so no new gray area survived to ask about (see Outstanding
questions). Each is also recorded via `fgos decision --id tsk-3ni`
(`view.decisions`); full reasoning and the two rejected alternatives per
decision live in `docs/history/session-claim-liveness/DISCUSSION.md`
§4/§6 — this table is the citable summary, not a duplicate derivation.

| D-ID | Decision |
|------|----------|
| D1 | The "still alive" signal is real worktree/file modification activity — never session/process identity (PID, heartbeat) and never pure claim-age. Rejected: PID-based (same shape as `main-checkout-lock`, but same-machine-only and tracks the wrong resource — a lock file, not a worktree); event-log-age (cheap, reuses `staleDoingAdvisory`'s existing idiom, `src/state/store.mjs:1050-1059`, but structurally blind during `fgos-coding-implement`'s actual editing — no `.fgos` event fires while a session is just editing files). |
| D2 | A session may self-reclaim a quiet `doing` claim with no human confirmation, when all three hold: (a) silence clears a conservative, `claimRole`-scoped threshold (D3); (b) the reclaim is non-destructive — reattach to the existing `fgw/<id>` worktree/branch, never force-remove; (c) the decision is logged with its evidence. Mirrors `main-checkout-lock.mjs`'s own precedent: auto-reclaim on conclusive evidence (`isPidAlive(pid) === false`), fail-closed (`AMBIGUOUS`) only when evidence is genuinely inconclusive. Does not repeal `loop.mjs:364-372`'s "indefinite hold" — adds one conditional door a session walks through deliberately, not an unattended reap. |
| D3 | Silence threshold reuses `/fgOS:stale`'s existing `agentMs: 15 * 60 * 1000` / `humanMs: 24 * 60 * 60 * 1000` (`src/state/graph-metrics.mjs:483-484`) as-is, same `claimRole` scoping — not a separate, more conservative pair. |
| D4 | Activity signal = `max(git log -1 --format=%ct on fgw/<id>, newest mtime among files git status --porcelain lists in that worktree)`. Not a blind `find -newermt` tree scan — reuses git's own already-computed dirty/untracked file list, which already excludes `.gitignore`d paths (`node_modules`, etc.) for free. |
| D5 | Integration point is `pick`/`take`'s existing claim-conflict path itself — no new verb, no new flag. Conclusive evidence (D4 clears D3's threshold) → transparent reattach-reclaim (D2). Inconclusive evidence — recent activity, OR the signal can't be read at all (deleted worktree, cross-machine, any other read failure) — → refuse exactly as today, same `FsmError('conflict')`, same exit 3; the error message may additionally carry the evidence found, for a human reading it. |

## Pinned terms

- **Conclusive** (D2/D5) — silence measured by D4's signal exceeds D3's
  threshold for the item's `claimRole`. Anything else — recent activity,
  or the signal itself unreadable — is **not conclusive** and takes the
  refuse-as-today branch. There is no third, "ask a human" branch inside
  `pick`/`take` itself; that stays a manual, out-of-band judgment call the
  same way it is today (a human/agent free to read the enriched error and
  investigate, exactly as the `tsk-2ec` report that prompted this item
  did by hand).
- **Reattach** (D2, reusing `pick-reattach-live-worktree`'s own pinned
  term, `docs/history/pick-reattach-live-worktree/CONTEXT.md`) — resuming
  an existing live checkout of `fgw/<id>` in place, never destroying and
  recreating it. That mechanism already shipped (`tsk-65n`, `status:
  done`) — this item's D2 reuses it, does not rebuild it.
- **Transparent** (D5) — the caller runs the exact same `fgos pick
  <id>`/`fgos take <id>` command that exists today; no new flag signals
  "check for staleness first." The check runs unconditionally inside the
  existing conflict path.

## Scout evidence

- `src/state/status-fsm.mjs:204-208` — the unconditional CAS refuse
  (`transitionWork`), `category: 'conflict'`, exit 3 per
  `src/state/store.mjs`'s `EXIT_CODES`. Carries no history/timestamp data
  today — confirmed by reading the throw site directly.
- `src/runner/loop.mjs:360-372` — `startupReap`'s explicit,
  commented-and-intentional skip of `claimRole === 'human' || 'session'`.
  The comment cites "stage-decompose S2-pull D1/cell action (4)" as the
  originating decision for "indefinite hold."
- `docs/specs/work-state.md:459-467` — the pull-door's own prose: no
  registry/heartbeat/push/lease layer exists; `docs/specs/work-state.md:
  1160-1164` (Open Gaps) names claim-timeout-for-a-person as
  "deliberately not done... parks indefinitely (per D4, deferred)."
- `src/state/store.mjs:1050-1059` (`staleDoingAdvisory`) — the existing
  `Map`-from-raw-events idiom (`in-order iteration -> latest wins`),
  filtered today to `work.move`/`to: 'doing'` only. D1's rejected
  event-log-age alternative would have widened this same filter rather
  than adding new plumbing — verified feasible, rejected on the
  structural-blind-spot grounds in D1's own text.
- `src/state/graph-metrics.mjs:483-484,504` — `/fgOS:stale`'s existing
  `agentMs`/`humanMs` thresholds and `ownerClass` split, reused verbatim
  by D3.
- `src/runner/main-checkout-lock.mjs` — `isPidAlive` (signal-0 PID
  check) auto-reclaims a stale lock inline in the normal acquire path
  (`tryAcquireOnce`); `AMBIGUOUS` (fail-closed, no auto-action) applies
  only when identity is a non-PID string with no TTL, i.e. genuinely
  inconclusive evidence. D2/D5's shape is a direct structural mirror of
  this, applied to a different resource (a work-item claim, not the
  main-checkout write lock).
- `docs/history/pick-reattach-live-worktree/CONTEXT.md` (`tsk-65n`,
  `status: done` per `fgos show tsk-65n`) — already-shipped reattach
  mechanism (D1/D3 there: reattach to an existing live `fgw/<id>`
  checkout instead of destroying it, works whether clean or dirty). D2
  here reuses this, not a new mechanism.
- `docs/history/reclaim-refuse-live-session-worktree/CONTEXT.md` —
  adjacent but distinct: that item's "live session worktree" guard only
  detects the CALLING process's own `cwd`, i.e. it cannot and does not
  answer "is a DIFFERENT session's claim still alive," which is this
  item's actual gap. Not reused, not duplicated.
- `rg claimWork` scout pass — confirms `claim-port.mjs:88`'s `claimWork`
  as the single choke point every claim path (`pick`, `take`) already
  funnels through; existing how-to docs
  (`docs/how-to/claim-a-clarify-or-decompose-stage-item.md`,
  `docs/how-to/recover-a-stuck-doing-claim-after-worktree-creation-failure.md`)
  describe today's manual recovery steps for adjacent claim failure
  modes — canonical references below.
- Impact-analysis capability gate (`CLAUDE.md`): `fgos tool query
  --capability impact-analysis --status present` reports GitNexus
  registered and `present` — full posture per the gate's own framing.
  Informational only per this skill's own instructions; does not gate or
  reshape this document. (A separate backlog item already flags
  GitNexus's index as stale/behind HEAD — worth a live re-check, not a
  blocker, when `fgos-coding-planning`/`fgos-coding-implement` actually touch
  `claim-port.mjs`.)

## Canonical references

- `docs/specs/work-state.md` — pull-door claim lifecycle, Open Gaps.
- `docs/history/pick-reattach-live-worktree/CONTEXT.md` — the reattach
  mechanism D2 reuses.
- `docs/history/reclaim-refuse-live-session-worktree/CONTEXT.md` — the
  adjacent, distinct same-process guard this item does not duplicate.
- `docs/history/pick-worktree-claim-race/CONTEXT.md` — `startupReap`'s
  own D3, keeping the human/session reap-skip explicitly out of scope for
  that item; this item does not reopen it either.
- `docs/how-to/claim-a-clarify-or-decompose-stage-item.md`,
  `docs/how-to/recover-a-stuck-doing-claim-after-worktree-creation-failure.md`
  — existing manual-recovery docs for adjacent claim failure modes;
  likely need a line added once this ships (planning's call).
- `docs/history/session-claim-liveness/DISCUSSION.md` — the full
  conversational design record (§4 decisions, §6 synthesis, §7 task
  breakdown) this CONTEXT.md summarizes for the locked-decision contract.

## Outstanding questions

None
