# Seat door selectors removal

## Removed
- `bin/fgos.mjs`: `fgos run` no longer passes `selectors` to runUnit (it was the only producer). `raiseAuthorized: false` stays.
- `run.mjs`: `hasSelectors`, `options.selectors`, the `mayRaise` term, the unit-record `selectors` field, bind-context selectors.
- `bind.mjs`: door selectors, the `DEFAULT_RUN_CAPABILITY` swap (ask capability is now `unit?.capability`), `ask.selectors.persona`.
- `seat-resolver.mjs`: replay `unitRecord.selectors`, and the now-unused `DEFAULT_RUN_CAPABILITY`. `dry-bind.mjs` option; `seat-policy.mjs` doc.
- Crate: `Selectors.capability`/`seat`, `raising_selectors`, capability golden case.

## Kept on purpose (decision for the SEAT lead)
The crate keeps `Selectors { persona }`, fed only by an override's persona (`workflow start --seats @name`, `--override` persona). That path is an override raise: `test/workflow/unit-handoff-raise-door.test.mjs` and the three persona golden cases prove it, so removing it would drop override-raise behaviour. Persona goldens renamed to say "override persona". Possible follow-up: model it as `override.persona` and delete `Selectors` entirely.

## Line deltas (commit ba77ece1b)
- Node (bin + src): +19 -49
- Rust (crate src): +8 -49
- Tests + golden: +17 -48 (includes one new compat test)
- Docs/changelog added: spec 5.5 line, dated history entry, CHANGELOG line.

## Tests
- Retired (behaviour removed): run-verb "--persona whose seat tier is above..." and "--capability whose tier is above..." -> replaced by one wiring test (capability docs:write at flagship binds flagship with source naming docs:write; door --persona binds at persona tier). Golden "door-chosen capability selector ... refused" (behaviour removed).
- Kept (override/--tier raises): seat-policy, dispatch-plan-policy, unit-handoff-raise-door, bind.
- Added: seat-resolver test that an old unit record with a `selectors` field replays.

## Old-record compatibility
Nothing reads `unitRecord.selectors` now (rg confirms); `seatSchema` check reads fields by key; the crate ask is built explicitly by bind.mjs, so no unknown key reaches serde. Proven by the seat-resolver test.

## Verification
- `cargo test -p fgos-seat-binding`: 13 passed.
- Node: run-verb, seat-policy, bind, unit-handoff-raise-door, dispatch-plan-policy: 146 pass; seat-resolver: 10 pass.
- Full `npm test`: started before the SEAT lead's stop order. Result: 5 files hit the 600 s timeout (crash-matrix-adopt-resume, run-provider-failover, run, loop, worktree; log shows `spawnSync cargo ENOENT` warnings and heavy IO load) plus a leak error from my own cargo target dir under .fgos/runtime. These are not rerun alone and are unattributed; none touches the changed files. `cargo test --workspace` was killed on order. The SEAT lead runs the full suite serialized.

## Open questions
- Remove persona selector via `override.persona` (see above)?
- Full-suite result is not clean from my side; needs the serialized run.

Status: DONE_WITH_CONCERNS
Summary: Door selector mechanism removed; `fgos run --capability docs:write` binds at committed tier. Override-persona raise path kept.
Concerns: full suite not confirmed green (IO load).
Worktree: /home/vantt/projects/forgentX/.claude/worktrees/agent-a4882797023229b84, branch worktree-agent-a4882797023229b84
