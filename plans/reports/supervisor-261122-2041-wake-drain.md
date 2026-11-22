# Supervisor wake drain — 2026-11-22 20:41

## Events (4, all handled)

- `258757ffea88cd15`, `33c35b57627e17dd` session-idle on `f381c6d2…` and `4f660b01…`: neither is a lead head of a running plan. No action.
- `41d474f5d048ce02` session-no-result on `run_unit-run-1795353883804-bd82586f/producer/1_01`: a worker attempt from the heads-stable lead's land/ticket flow. The lead is live and handling its own tickets. No action.
- `06ffadf0ff575779` lane-freed on fg-server2: there are 3 free lanes, but no plan can be admitted (see below).

## Admission

- `261122-1950-owner-communication-standard` (ready, P1) shows `admissible: false`. Its footprint overlaps the running heads-stable plan on `core/skills/fgos-secretary/SKILL.md`, `.agents/skills/**` and `plugins/fgOS/skills/**` (heads-stable phases 8 and 10 are running). It stays held until those phases finish.

## Running plans

- `261122-0118-heads-stable-and-able`: the lead is live and busy (`session read` showed it retrying `fgos land heads-stable-and-able/p11`). Phases 8, 9 and 10 are running their 24-hour measures; phase 9's window ends around 2026-11-23 14:20. Phase 11 stays ready and is parked on `q-pfecbg6ffn` (`fgos git recover`). Nothing to do.

## Open owner questions on the portfolio

- `q-pfecbg6ffn`: run `fgos git recover` in the main checkout. It blocks the p11 land and likely other lands.
- `q-3g32txifg5`: widen the heads-stable footprint for phase 12b. The footprint already carries the renew/probe files, so this question may be stale.
- `q-rfxqncjrax`: Miu's account probe.
- `q-6yhs63ru4i`: views for the coach agent (shaper).
- `q-4qtu54bnxz`, `q-vgwalbohwj`: both were asked by the red-tests lead, but that plan is now `done`. They look stale. The asker or the secretary should cancel them; the supervisor never cancels a question.
