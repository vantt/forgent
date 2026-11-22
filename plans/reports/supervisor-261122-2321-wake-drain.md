# Supervisor wake drain 2026-11-22 23:19

Pending owner question: q-rfxqncjrax (who runs the account probe for Miu's quota). It is still open, and only Miu's account move waits on it.

## Events
- `a0984581cd6fb6c2` coordination-handoff, `plan:261121-2109-component-authority`. The owner chose option c: start component-authority now, and keep its edits to the two files it shares with heads-stable for its last phase. Miu's mail was not in this session's inbox, so I acted on the event text. The two files are `docs/architecture-manifest.json` and `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`. Today phase 2 writes both of them.
  - I started `head:planner-component-authority` (no planner was live) to reshape the plan. Phase 2 copies the manifest into the model, and the manifest deletion plus both file edits move to phase 7, which waits for heads-stable. The planner then drops heads-stable from `blockedBy`, runs the check and sets `ready`.
  - I recorded the order and that brief in the plan. Landed as `118735c6f`. A direct mail to the planner was refused (`event-store-unavailable`, read-only file system from this confined session), so the plan text carries the brief.
  - Open point: heads-stable's open phases 8-11 write neither file, but its plan-level footprint still lists both. Admission may therefore still refuse component-authority. The planner reports whether the check accepts it or what remains.
  - Handled.

## Running plans
- `261122-0118-heads-stable-and-able`: the lead is live and idle on the verified measurement windows recorded at 23:11 (phase 9 closes 2026-11-23 14:20, phases 8 and 10 close 2026-11-23 21:06). Left alone.

## Admission
- leadsLive 1/4, lanes free 4. No plan is admissible yet. component-authority becomes admissible once the planner flips it to `ready` and the footprint overlap is cleared.

## Friction
- `fgos mailbox send` from the confined supervisor fails with `git-floor-probe-failed ... Read-only file system`.

## Later event in the same wake
- `58b946817ad97a8b` coordination-handoff, `plan:261122-0118-heads-stable-and-able`. Owner order: heads-stable blocks nobody, so heads-rotate and component-authority are admitted now, and heads-stable's lead watches the shared files.
  - heads-rotate: I set `status: running`, `lead: head:lead-forgent-261122-2307-heads-5c830` and `base: 27fd8a9b0`. I removed heads-stable from `blockedBy`, marked phases 1-4 `ready` and recorded the order. Landed as `4a75c0d4e`. I started the lead and stopped the finished planner `head:planner-heads-rotate-on-their-own`.
  - component-authority: not admitted yet. `head:planner-component-authority` is still applying option c to `plan.md`, so a lead started now would be a second writer on the same file. The next wake admits it once the planner lands `ready` (owner order: no further question).
  - Handled.
- Leads live: 2 of 4 (heads-stable, heads-rotate).
