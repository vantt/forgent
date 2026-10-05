# D: read confinement — make blind roles really blind (advisor, 2026-10-05)

## 1. Recommendation

A blind unit adds one field, `blind: true`. Its workers run under one bwrap shape:

```
--ro-bind / /  --dev /dev  --proc /proc  --tmpfs /tmp      (today, unchanged)
--unshare-pid                                              (new: hide sibling processes)
--tmpfs <hidden root>   for every hidden root that exists  (new: mask peer state)
...today's resource binds (outbox rw, private home rw, workspace, credentials)...
--ro-bind <own dir> <own dir>                              (new: own round dir, read-only)
--remount-ro <hidden root>                                 (new: the mask itself is not writable)
```

There are three hidden roots. They are fixed data in the contract, not per-executor code:

| Hidden root | Why |
|---|---|
| `{fgosDir}/assignments`, `{fgosDir}/workflow-runs`, `{fgosDir}/dispatch-runs` | Every role's report, brief, stdout, and the gate answers live here. |
| herdr socket dir (`~/.config/herdr` here) | Verified: a confined worker can `connect()` to the herdr socket through `--ro-bind`, so it could run `herdr pane read` on a sibling pane. |
| confinement temp root (`resolveConfinementTempRoot`) | Siblings' private homes, which hold their agent transcripts. It is under `/tmp` today, so this one is defensive. |

`{own dir}` is the role's assignment round dir (`.fgos/assignments/<unitRun>/<role>/<round>`). For a dispatch that has no assignment, it is the run dir. B already copies every granted ref into this dir. D therefore needs no per-ref binds: **B decides what a role may see, and D makes that the only thing it can see.** It is the same mechanism.

In the contract, this is one new value on an axis that already exists: `hostRead: allow | blind | deny`, ordered `deny > blind > allow`. Meaning of `blind`: the host stays readable except other dispatches' fgOS run state and live agent sessions. The runner sends it as an override that only narrows, through the request's existing `override` slot (`validateOverrideConfinementShape`). The built-in policies do not change, so there is no new policy ID.

Fail closed. If a unit is blind and the dispatch cannot enforce it, the dispatch is refused with a reason code. It never runs unblind. Cases:
- not bwrap: `container` and `remote` are allowed driver types, but neither is registered;
- `unconfined` mode;
- `in-process` (Agent tool) — `bind()` must not choose it for a blind unit;
- probe not fresh or not passing;
- a contextRef that points into a hidden root;
- a cwd that lies inside a hidden root.

## 2. Verified on this machine (bwrap 0.6.1, non-setuid, so it uses a user namespace)

All runs used a scratch dir, which is now removed.

- A sibling report read by absolute path gives ENOENT. `find .fgos` shows only the own chain (`assignments/u1/panelist-a/...`). `grep -r` finds nothing.
- Own brief and own copied refs can be read but not written (EROFS). The own outbox can be written, and the host sees the write. Writing into a masked dir gives EROFS.
- Binding a dir back inside a `--tmpfs` mask works: bwrap creates the parent dirs. `--remount-ro` on the mask does not make the writable outbox bound under it read-only.
- A sibling home under the masked temp root gives ENOENT. The own private home bound back is writable. `HOME`, node, DNS and the repo all work.
- **Masking all of `.fgos` is wrong.** 99 tracked files under `.fgos` (config.json, events) then show as ` D` in `git status`. A workspace-write role could commit those deletions. Masking only the three untracked run-state dirs leaves `git status` clean. This is why the list names subdirs, not `.fgos`.
- Without `--unshare-pid`, a confined worker can read a sibling process's `/proc/<pid>/cmdline`. With the flag, it cannot. `/proc/<pid>/root` and `cwd` were already denied: the sibling is in another user namespace.
- The herdr socket is reachable through `--ro-bind / /`. The tmpfs mask closes it.
- Five recent briefs reference only paths inside their own round dir. A worker needs nothing else from `.fgos`.

## 3. Ordered slices

### Slice 1: contract, driver and proof, opt-in, no live behaviour change (ships alone)

No existing unit sets `blind`, so nothing changes for current runs. The first blind role that is usable on its own is a round-1 panelist: it has no peer refs, so it does not need B.

- `src/runner/dispatch/confinement/policies.mjs`:
  - `CONTROL_AXES.hostRead` gets `blind`, and `CONTROL_ORDER` becomes `deny 3 > blind 2 > allow 1`.
  - New frozen constant `BLIND_HIDDEN_ROOTS`, made of tokens (`{fgosDir}/assignments`, `{fgosDir}/workflow-runs`, `{fgosDir}/dispatch-runs`, `{herdrSocketDir}`, `{confinementTempRoot}`).
- `src/runner/dispatch/confinement/resources.mjs`:
  - New read resource `own-assignment`: the round dir, or the run dir when there is no assignment. It is canonicalized and must sit inside `fgosDir`.
  - Resolve the hidden roots into absolute paths. Skip any that do not exist.
- `src/runner/dispatch/confinement/drivers/bwrap.mjs`:
  - Accept `hostRead: blind`, only as an override. Any other override key stays refused.
  - In `prepareBwrap`, emit the shape in section 1.
  - Refuse `blind-hides-workspace` when the cwd or repo root is inside a hidden root.
  - Refuse `blind-ref-hidden` when a contextRef resolves inside a hidden root and outside the own dir.
- `src/runner/dispatch/confinement/request.mjs`: `invocation.blind === true` becomes `override: { controls: { hostRead: 'blind' } }`.
- `src/runner/dispatch/confinement/authority.mjs`, attestation: record the override (already done for overrides), the resolved `hiddenRoots`, and `control:hostRead: satisfied (blind)`.
- `src/runner/dispatch/confinement/probes/harness.mjs`:
  - New probe `peer-run-hidden`. It must build its args through the real `prepareBwrap`, not hand-written argv; today's probes hand-roll argv, which is a weak spot.
  - Red falsifier: the same shape without the tmpfs mask must read the planted sibling file.
- `src/setup/checks.mjs`: `fgos doctor` shows the probe as `blind-read: pass | fail | stale | backend-unsupported`. Blind dispatch needs a fresh pass, which is the existing fail-closed probe gate.
- `src/runner/execution/bind.mjs`: a blind unit never resolves to `in-process`.
- Unit template field `blind: true` is passed through to each role's dispatch. It works at unit level: every role in that unit is blind. That is one knob, not a per-role one.
- Tests (new `test/runner/dispatch-confinement-blind.test.mjs`, plus the probe test):
  1. A confined worker runs `cat <sibling>/outbox/report-1.md` → ENOENT. `ls`/`find` of `.fgos/assignments` lists only the own chain. `grep -r` for a planted marker finds nothing.
  2. Positive checks: own brief and own copied refs are readable, the outbox is writable, the repo file is readable, `git status` has no ` D .fgos/` lines, and node runs.
  3. The herdr-like unix socket under the hidden dir cannot be connected. A sibling `/proc/<pid>/cmdline` is absent.
  4. Fail closed: blind with the backend unavailable, `unconfined`, a stale probe, a ref into a hidden root, or a cwd under a hidden root → refused, and no launch happens.
  5. Unit test of the argv order: masks come before binds, own dir comes after the masks, and remount-ro comes last.
  6. The attestation contains `hiddenRoots` and the override.
- Rollback: remove `blind` from the unit template. The code path is dead when no unit asks for it.

### Slice 2: pair with B, then a live canary per executor family

- B's hand-off resolver (`src/runner/execution/handoff-refs.mjs`) copies `unit-run:` and `gate-answer:` refs into the own dir whenever the unit is blind. Simpler still: copy always. The `blind-ref-hidden` refusal from slice 1 is the guard that proves B did its job.
- Set `blind: true` on `core/workflows/delphi.yaml` `blind-proposals` and `second-round`, and on council's blind rounds. The synthesizer can be blind too, because its peer reports arrive as B copies.
- Canary (owner runs it; about one cheap unit per family). For each of claude-herdr, claude-cli, codex-herdr, agy, pi (glm, xai, deepseek), openai, run one blind solo unit whose objective is: "run `cat <planted sibling path>` and `ls .fgos/assignments`, write what you saw into your report".
  - Pass means: the run settles, the report says ENOENT plus only its own chain, and herdr still reports `agentKnownToHerdr: detected`.
  - The last point matters because `--unshare-pid` adds a pid-1 layer between the pane shell and the agent; herdr's process detection has not been tested with it.
- Rollback: per workflow, remove `blind`. A family that fails the canary is left out of blind units through the existing fallback ladder (refused → next executor).

### Slice 3: blind by default, then delete the knob (owner decision)

- After every family passes the canary, every confined dispatch uses `hostRead: blind`, and the `blind` field is deleted. This follows the single-user, no-compat rule.
- The spec says that changing a built-in policy's meaning is a breaking contract. So this slice needs a decision record, and either new built-in IDs or a recorded exception.

## 4. Laws, specs and docs

- No locked law (L1–L8) is touched. Confinement is not one of them.
- `docs/specs/confinement-authority.md`:
  - §4 table and §6.1 axis order: add `blind`.
  - §9.1 support matrix: `hostRead` becomes `allow | blind`, and `deny` stays unsupported.
  - List the hidden roots.
  - Add a "Lịch sử quyết định" entry (the spec has no such section yet). It records: why subdirs and not `.fgos` (tracked files), why `--unshare-pid`, and why herdr's socket is on the list.
- `docs/specs/runner.md` hand-off paragraph and the `docs/routing-handoff-contract.md` trust-boundary bullet: replace "readable because `hostRead: allow`" with "blind units read only their own dir; refs are copied in".
- `docs/how-to/configure-and-operate-agent-confinement.md`: one paragraph and the doctor row.
- `CHANGELOG.md` `[Unreleased]`: one line.
- `docs/platform/component-boundary.md`: **No component-boundary change.** The Dispatch Transport & Confinement row already owns this. No new component and no new write authority.
- Install gate: no new config key and no env var. The doctor gets one new probe row.

## 5. Risks

| Risk | Detection / mitigation |
|---|---|
| herdr loses agent detection under `--unshare-pid` | Slice 2 canary checks `agentKnownToHerdr`. If it fails, drop only `--unshare-pid`. The cmdline leak stays as a residual, and briefs pass paths, not prompt text. |
| An agent CLI or repo hook reads a hidden dir (for example `scripts/dispatch-decide-hook.mjs` on Agent tool use) | The hook reads `.fgos/config.json`, which stays visible. The canary run catches anything else. |
| A read-only role whose cwd is a `/tmp/fgos-worktrees` worktree | Already masked by `--tmpfs /tmp` today. Blind refuses it loudly instead of failing silently. |
| B creates symlinks instead of copies | The symlinks would dangle under the mask. Slice 2 test: refs are regular files. |
| A blind unit can't run anywhere (no bwrap) | It is refused with a reason code. That is intended; it never falls back to unblind. |

Leaks that stay open, cut on purpose because they are rare or a different concern:
- the Lead's own agent transcripts in the host home;
- `.fgos/secrets.local.env` and other projects (confidentiality, not blindness);
- network: a blind worker can still reach localhost. The gateway serves work items, not run reports, and it should stay that way.

## 6. Not recommended, and why

- **Allowlist instead of `/` (option b).** Agent CLIs need a long, machine-specific tail: node/npm global bins under `$HOME`, certs, locale, `/etc` for DNS, provider config. Each executor would need its own list. That is the per-executor complexity the owner ruled out, and it is the reason the 261001 red-team's `hostRead: deny` proposal (Finding 14 in its adjudication) was deferred.
- **Per-role view dir with real `.fgos` hidden wholesale (option c).** This breaks tracked `.fgos` files (`git status` shows deletions), as verified above.
- **Moving run state out of the repo (`~/.fgos/runtime/...`).** It moves the problem, because `/` is still readable, and it churns every reader.
- **Per-ref `--ro-bind` grants.** Not needed, because B's copies already sit in the own dir.

## 7. Owner decisions

1. Approve `hostRead: blind` as a new axis value sent as a narrowing override. The alternative is a new built-in policy ID.
2. Confirm that blind is set at unit level (every role in the unit), not per role.
3. Confirm refusing over running unblind when the backend can't enforce. I recommend refusing.
4. Decide whether to go to slice 3 (blind by default, field deleted) after the canary.

Status: DONE
