# Read confinement, slice 1 (blind units), 2026-10-05

Branch `worktree-agent-a30376a4225622fa1`. Built from the design in `advisor-read-confinement-design-261005.md` ("Slice 1"). Slice 2 (a Workflow sets `blind`, hand-off copies, the canary) and slice 3 (default flip) are not touched; no `core/workflows/*.yaml` edit. No live paid-model run. Impact analysis: `fgos tool query --capability impact-analysis --status present` returned 0 providers, so that gate is inactive (not a gap).

## What changed

| File | Change |
|---|---|
| `src/runner/dispatch/confinement/policies.mjs` | `hostRead` axis is `deny, blind, allow`; order `deny 3 > blind 2 > allow 1`. Re-exports `BLIND_HIDDEN_ROOTS` and `requestIsBlind`. Built-in policies unchanged. |
| `src/runner/dispatch/confinement/resources.mjs` | Defines `BLIND_HIDDEN_ROOTS` (tokens: three `{fgosDir}` run-state dirs, `{herdrSocketDir}`, `{confinementTempRoot}`) and `requestIsBlind`. New `resolveBlindHiddenRoots` (existing dirs only, realpath). With `blind: true` the resolver adds one `hidden-root` resource per existing root (`delivery: mask`, `access: hidden`) and one `own-assignment` resource (read; the round dir, or the run dir without an assignment; must sit inside `fgosDir` and exist). |
| `src/runner/dispatch/confinement/drivers/bwrap.mjs` | Accepts exactly the override `{controls:{hostRead:'blind'}}`; any other override stays refused. Coverage satisfied for `allow` and `blind`. `blind-hides-workspace` and `blind-ref-hidden` refusals, read off the resolved resources. `prepareBwrap` now wraps a synchronous `prepareBwrapSync` (same body; the probe needs it). Blind argv, see below. Non-blind argv is byte-identical (test compares it to the old algorithm). |
| `src/runner/dispatch/confinement/request.mjs` | `buildConfinementRequest({blind})` sets the override; refuses `blind-requires-confinement` (mode not `required` or no policy) and `blind-in-process` (`authorityScope: external-harness`); passes `context.contextRefs` through for the ref check. |
| `src/runner/dispatch/confinement/authority.mjs` | Probe fingerprint and probe run include `blind`; attestation records `requested.override`, `effectiveControls.hostRead: blind` and `hiddenRoots`. |
| `src/runner/dispatch/confinement/probes/harness.mjs` | New probe `peer-run-hidden` (`probePeerRunHidden`), built from the real `prepareBwrapSync` fed by the real resolver; `runAllConfinementProbes({blind})` runs it as the ninth. Fingerprint gets `blind: true` only when blind, so non-blind cache keys are unchanged. Falsifier: same plan without the masks must read the planted peer file. |
| `src/setup/registrations.mjs` | Doctor check `confinement-blind-read`: `blind-read: pass`, `fail (<what it could read>)`, `backend-unsupported (...)`. |
| `src/runner/execution/unit.mjs`, `src/workflow/definition.mjs`, `src/workflow/runner.mjs` | `blind` boolean on Unit and template, passed through the same way `anonymizeInputs` is (absent unless true). |
| `src/runner/execution/bind.mjs` | `ask.blind`: an in-process candidate is skipped (`blind-in-process`), and the Lead-inline fallback is off. |
| `src/runner/execution/run.mjs`, `src/runner/dispatch/assignment-runner.mjs`, `src/runner/dispatch/cli.mjs` | `unit.blind` reaches `bind()` and `executeAssignment({blind})`, then `buildConfinementRequest({blind})` on both the cli-spawn path and the `executeExecutorCli` (herdr) path. The herdr pane runs the Authority-prepared argv, so it carries the blind shape. |
| Docs | `docs/specs/confinement-authority.md` (axis, interface, order, support matrix, new §9.2), `docs/specs/runner.md` (paragraph), `docs/routing-handoff-contract.md` (trust-boundary lines), `docs/specs/distribution.md` (doctor row list), the two how-to guides, `CHANGELOG.md` `[Unreleased]`. |

No new `.mjs` file, so `docs/architecture-manifest.json` is unchanged (architecture test passes). **No component-boundary change** (same Dispatch Transport and Confinement row, no new component, no new write authority).

## Blind argv (what `prepareBwrapSync` emits)

```
--ro-bind / /  --dev /dev  --proc /proc  --tmpfs /tmp
--unshare-pid
<mounts that are not under a mask or the own dir>     (a workspace may contain a hidden root)
--tmpfs <hidden root> ...
--ro-bind <own dir> <own dir>
<mounts under a mask or the own dir>                  (outbox rw, private home rw)
--remount-ro <hidden root> ...
```

One deviation from the design's single order: a mount that **contains** a hidden root (for example a read-write workspace when the unit runs in the main checkout) is emitted before the masks. A later mount over a parent hides an earlier one beneath it, so the design's order would have un-masked the run state in that case. The probe falsifier showed the same effect for the outbox (own dir bound after it makes it read-only), hence the "under the own dir" group.

## Proof

All hermetic except bwrap, which ran for real here (bwrap 0.6.1, non-setuid). Tests skip only when bwrap is unusable.

- `test/runner/dispatch-confinement-blind.test.mjs` (15 tests). A confined blind worker, with the same script run unblind as a control:
  - sibling report by absolute path, gate answer, a peer's private home: `ENOENT` (unblind: readable);
  - `find` and `grep -r` under the project show none of the planted peer text; the `.fgos` tree shows only its own chain plus tracked `config.json`;
  - sibling process `/proc/<pid>/cmdline`: `ENOENT` (unblind: readable);
  - herdr-like unix socket in the herdr dir: `ENOENT` (unblind: connects);
  - own brief and granted ref: readable, write gives `EROFS`; outbox and private home writable (outbox file lands on the host); writing into a masked dir gives `EROFS`;
  - repo file, DNS lookup, `node`, `git status --porcelain` empty (no ` D .fgos/...`);
  - argv order (masks before binds, own dir after masks, remount-ro last; default-off argv equals the old algorithm);
  - refusals before any adapter call, with names: `blind-ref-hidden`, `blind-hides-workspace`, `blind-requires-confinement` (unconfined and preferred), `blind-in-process`, `confinement-backend-disabled`, `confinement-probe-failed` (and a passing non-blind probe cache entry does not satisfy a blind dispatch);
  - attestation holds the override, `effectiveControls.hostRead: blind`, `hiddenRoots`, the `own-assignment` resource;
  - probe passes on the real argv and fails on the falsifier; the probe set is 8 without and 9 with `blind`; the doctor row reports `pass` and `backend-unsupported`.
- `test/runner/execution/run.test.mjs`: through `runUnit` with a real confined worker, a blind unit reads `peer-read: ENOENT` where the same unit unblind reads `ok`; a blind unit whose `unit-run:` input lies in a peer's run state is refused with `blind-ref-hidden` before launch.
- `bind`, `unit`, `workflow-runner` tests for the field and the in-process refusal.
- Narrow runs, all green (`env -u CLAUDE_CODE_SESSION_ID`): `test/runner/execution` + `test/workflow` (214), the six `dispatch-confinement-*` files + `herdr-reconciliation` + `herdr-spawn-assignment-dispatch` + `assignment-dispatch` (248), `test/setup` + `test/architecture.test.mjs` + `test/report/enduser-index.test.mjs` (723). I did not run the full suite.

## Design points checked against the code

1. **True:** `own dir = .fgos/assignments/<unitRun>/<role>/<round>` (assignment id is `<unitRun>/<role>/<round>`, run dir is `.../runs/NN`); the three run-state dirs, `--ro-bind / /` plus tmpfs masks, `--unshare-pid` and `--remount-ro` behave as the design measured.
2. **FALSE as stated: "B already copies every granted ref into this dir".** `anonymizeInputs` copies only `unit-run:` reports, only when that flag is on, and into `<unitDir>/inputs/seat-X` (the unit directory, shared by every role of the unit), not into the role's round dir. Non-anonymized refs are absolute paths into the source report. Consequence in slice 1: a blind unit with a `unit-run:` or `gate-answer:` input is refused with `blind-ref-hidden` (this is the guard working, and `run.test.mjs` pins it). Slice 2 has to make the hand-off copy unconditional for blind units and put the copies in the role's own round dir (or widen "own dir" to include `<unitDir>/inputs`, which leaks sibling roles' copies; I recommend per-role copies).
3. **Open (not wrong, but a risk the design only half names):** `~/.config/herdr` also holds the worker's own session socket (`sessions/<name>/herdr.sock`, which `worker-session.mjs` points `HERDR_SOCKET_PATH` at). Masking the directory hides that too. A herdr hook or status call from inside the sandbox will fail. The canary below must check this.
4. Request-level `override` was not recorded in the attestation before; I added `requested.override` (only when present).
5. Circular import: `policies.mjs` -> `backend-registry.mjs` -> `drivers/bwrap.mjs`, so the driver cannot import `policies.mjs`. The hidden-root constant and `requestIsBlind` live in `resources.mjs` and `policies.mjs` re-exports them.

## Decisions I took inside the design

- `blind: true` is checked at request build and at assess, not by a new refusal path in `authority.mjs`; the existing refusal plumbing (`DispatchError` with the mismatch code, attestation `refused`) is reused.
- A policy that itself declares `hostRead: blind` (custom policy) is treated the same as the override; not forbidden because it enforces the same thing.
- Doctor: `backend-unsupported` is `passed: true` (no usable bwrap on a machine that runs no blind unit is not a fault; blind units are refused there by design). `fail` is `passed: false`. There is no `stale` state in the doctor: it always runs the probe live; staleness is enforced by the existing probe gate at dispatch (`confinement-probe-failed`).

## What the slice 2 canary must check

For each executor family (claude-herdr, claude-cli, codex-herdr, agy, pi glm/xai/deepseek, openai), one blind solo unit that runs `cat <planted sibling report>`, `ls .fgos/assignments`, and writes what it saw:

1. Settles; report says `ENOENT` and only its own chain.
2. herdr still reports `agentKnownToHerdr: detected` under `--unshare-pid` (pid 1 layer between the pane shell and the agent). If not, drop only `--unshare-pid` and accept the cmdline leak.
3. The agent's own herdr socket (`sessions/<name>/herdr.sock`, see point 3) and any herdr hook still work, or the executor's status/question flow breaks. If it does, narrow `{herdrSocketDir}` to the operator's `default` socket only.
4. The agent CLI finds its credentials and config (private home bound back, `executor-credentials` read-only), and nothing it needs lives under the three run-state dirs or the confinement temp root.
5. A repo hook that reads `.fgos` (for example `scripts/dispatch-decide-hook.mjs`) reads only `.fgos/config.json`.
6. Hand-off refs are regular files in the role's own round dir (not symlinks, which dangle under the mask).

## Notes

- Behaviour tests run on `/var/tmp` (not under `/tmp`, which every confined worker sees as an empty tmpfs). The probe and the doctor row use `os.tmpdir()` with a `workspace`-style read mount, so they work from `/tmp`.
- The run tests leave retained confinement homes under `/tmp/fgos-confinement` (I did not check whether this predates the slice; the next `fgos run` reaps them).

Status: DONE_WITH_CONCERNS
