# Controller death (plan 6.4): merged to main, activation joins the Git landing

Date 2026-10-18 21:56, on the owner's machine, under the owner's 10-18 delegation.

- **Plan:** [plan.md](../261016-1351-controller-death-settle-and-resume/plan.md), block "CẮT LẠI 2026-10-18".
- **Section A:** [P07A report](phase-lead-261018-2121-controller-death-p07a-integration-and-t8.md); it has the landing steps and the rollback runbook.
- **Decision:** D-ADR0060 recorded with `fgos decision` (`touches:f87c11eb`, the D-ADR0056 record); `docs/decisions/index.md` regenerated.

## Why the code is on main but not activated
Main also carries Git phase 01 Lane B since 20:05. The second machine's [guide](guide-261018-2005-owner-machine-after-git-lane-b.md) says "nothing to activate yet"; the Git lane asks for one stop-everything landing when phase 01 is complete (E3 is still open).

A release built from main now would also activate Lane B on this machine:
- `fgos setup` would write the events fetch refspecs into each repository's config;
- `fgctl` would get its C5 activation gate;
- there would be six new Git doctor checks and the native addon.

That is the Git lane's call, so this machine keeps release `a6bcdc29…` (6.3). The 6.4 activation runs together with the Git landing, using the P07A steps. 6.4's own doctor sweep (step 5: `run-attempts-stuck`, `legacy-attempts-stuck`) runs with the new release after it is activated.

## Proof
- **Full `npm test`** on integration `1a68f7880` (main with Git Lane B merged in), host, addon and `target` from a private release build, `--test-concurrency=4`: 8190 tests, 8087 pass, 8 fail.
  - `native-load` (3): git 2.34 is below the Git lane's floor of 2.53.
  - `fences-v1-tombstone`: needs the `yaml` package of the v1 sources.
  - `skill-wrappers`: worktree only.
  - `observe-store-lock`: a timing test, 2/2 alone.
  - `registrations` (2): real. The merge moved the doctor list to `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` without 6.4's `cancel-wait`, `legacy-attempts-stuck` and `units-awaiting-resume`. Fixed in `113d8bc3e`; 88/88.
- **Main commits after that run** (`a2bb4b636` and the ones before it) touch only the dormant event store and Git crates and docs, nothing 6.4 changed.
- **Phases:** each phase was verified on integration by the big lead, with every test that imports a touched module. Big-lead fixes:
  - `dee503f93`: inspect import guard, proven read-only carve-outs;
  - `ed5d25250`: a unit is resolved from its assignment id through the layout instead of listing `.fgos/assignments`;
  - `304181cfe`: decision citations glossed, the adopt route contract names the legacy sweep;
  - `113d8bc3e`: registry contract.
- **Crash matrix** of r6 §9.7, direct and terminal, five green runs (P05). "direct: no-binding" is load-sensitive: 30/30 alone.
- **T8 rerun (P07A):** all eight cases as expected, the herdr ones in a claude-trusted scratch path under `/tmp`. Two real bugs found by the review were fixed with tests:
  - resume over an `abandoned-legacy` attempt;
  - the legacy sweep refusing herdr runs with an unread outbox result.
- **CI `process-containment`:** Linux and Windows green on every push. macOS fails only `fgos-process` `a_thousand_fast_exits_are_normal_spawns` (Git lane, board 16:45; it is flaky and passes in some runs).

## Result
- **main:** `d91fad3fa`, a fast-forward from `controller-death/integration` with main merged in.
- **Not done here:** release build, `fgctl` install, activation, fences, smoke. They are part of the joint landing.

## Decisions taken on the way
- "Binding present, gate dead, agent never started" stays `gate-lost` (r6 §9.7, fail closed). The spec names the limit and a deferred item.
- `dispatch.cancelWaitMs` shares the `gateKillGraceMs` reader and has no setup default; it is read with a default, like the grace.

## Open
- Review findings 3–6 of P07A: signal races, rated low; none changes the safety of a settled attempt.
- `adopt` has no fallback when the envelope's `hostBin` release was pruned. Do not prune old releases before the 6.4 doctor sweep.
- Folder trust is checked only after the pane opens (board lane TRUST, not planned).

Component boundary: no component-boundary change (6.4 uses the existing adopt door).
