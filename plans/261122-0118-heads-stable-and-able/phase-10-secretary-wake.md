# Phase 10: The secretary wakes on new questions or mail

Capability: `code:implement` (skill text), after an owner choice.

Closes `p-vquz26ibnn` item (a). Status `draft` until the owner picks the mechanism; no other phase waits on it.

## Inputs

- Owner 2026-11-21 21:28: the secretary acts only when the owner types or mail arrives, so two owner questions sat open
  over 2 hours. She must wake when the question store or her mailbox has something new and relay open owner questions in
  the five-part form unasked. The supervisor proposes the mechanism (watcher event, timer, or both); the owner chooses.
- An idle live session gets no turn from mail alone: the mailbox hook runs at turn boundaries. A live idle pane is
  reached only by typing into it or by a timer inside the session.
- Draft plan `261122-0056-orchestration-skeleton` phase 6 ("Sleep and wake of players") and its question notifier
  (phase 3) are where an event-driven wake of a player is built. A watcher-event wake here would be a second wake
  mechanism beside it (L10).
- `core/skills/_shared/decision-question.md` (the five-part form).
- Phase 8's relay record and measure.

## Footprint

`core/skills/fgos-secretary/SKILL.md`, `.agents/skills/**` and `plugins/fgOS/skills/**` (regenerated only),
`plans/261122-0118-heads-stable-and-able/reports/secretary-wake.md`.

## Steps

1. Ask the owner, with `fgos questions ask` in the five-part form, and write the `q-` id under "Owner questions" in
   `plan.md`:
   - **What is happening:** Miu wakes only when you type or mail arrives, so questions wait unseen.
   - **Cause:** a live idle session gets no turn; nothing wakes it on a new question or mail.
   - **Options with cost:**
     (A) Timer. On every start, including a rotation successor, Miu arms a recurring check every 15 minutes in her own
     session. Each check reads open questions and unread mail and relays what is new. No code, and it can ship today.
     It costs one short turn per tick while idle, and a question can wait up to 15 minutes.
     (B) Watcher event. The watcher wakes Miu when the question store or her mailbox changes. Latency is about one
     watcher interval and there are no idle turns, but it needs a wake path into a live pane. That is the player wake
     of plan `261122-0056-orchestration-skeleton` phase 6, which is blocked behind s6a and work-data-model.
     (C) Both. A now, then B when that phase lands, with A kept as a slow fallback.
   - **Recommendation:** C. A closes the gap now at no code cost, and B arrives through the plan that owns waking
     players, so no second wake path is built here.
   - **Scope of the answer:** only this phase and the secretary skill.
2. Implement the chosen option. For A or C: the secretary skill's start ritual arms the recurring check with the
   harness's own scheduler, re-arms it on every start, and says what each tick does (questions, then mail, then relay
   in one batch, then the phase 8 record). For B or C: raise a `coordination-handoff` naming the requirement on
   `261122-0056-orchestration-skeleton`, with a wake of the secretary on a new owner question or new secretary mail.
   That plan's lead adds it there; this plan does not build it.
3. Run `npm run build:skills`.
4. Measure with phase 8's commands for 24 hours after the change. Write `reports/secretary-wake.md`: the ask-to-seen
   times before and after.

## Verify

`node scripts/run-tests.mjs test/skills/fgos-mirror.test.mjs` passes. `reports/secretary-wake.md` shows the ask-to-seen
times after the change and the bound the chosen option promises (for A, at most one tick).

## Rollback

Revert the phase commit and rebuild the renders. A live secretary drops the timer at her next rotation.
