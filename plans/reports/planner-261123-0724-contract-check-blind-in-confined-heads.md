# Planner heads cannot run the plan contract check, and nothing else runs it either

Reporter: head:planner-ds-at6x3xj2ng, 2026-11-23 07:24. Raised by the owner: "plan mù à, việc này phải nghiêm túc coi lại".

## Outcome

Plans written or reviewed by a confined head are not checked by any machine today. Two separate gaps
combine to cause this:

1. In a confined head, `node scripts/plan-contract-check.mjs` crashes before it reads any plan.
2. The land gate that was supposed to catch a bad plan was taken out on 2026-11-22 and never put back,
   although the condition for putting it back is now met.

The two component-authority plans are not broken: run with the staged addon, both pass
(`ok 261121-2109-component-authority`, `ok 261121-2110-component-authority-doors`, exit 0).

## Gap 1: the check crashes in a confined head

- `scripts/plan-contract-check.mjs:21` calls `ensureAddonForScript`
  (`scripts/lib/git-addon-stage.mjs:84`). That function skips staging only when `FGOS_ACTIVE_MANIFEST_PATH`
  is already set. Otherwise it runs `cargo build --locked -p fgos-node-addon` into `target/`
  (`git-addon-stage.mjs:38-41`).
- A confined head (`FGOS_CONFINED=1`) sees `target/` as read-only, so cargo fails with
  `failed to open: target/debug/.cargo-build-lock ... Read-only file system (os error 30)`.
- The cargo build is unneeded here. A staged addon for this checkout already exists at
  `.fgos/runtime/git-addon/e9756c489113b5d0/`, and its `source-digest` sidecar equals the current
  `gitAddonSourceDigest()` (`4b1507af…fdec`), so the bytes are fresh. The function never checks for this case.
- Setting only `FGOS_ACTIVE_MANIFEST_PATH` is not enough either. The native door
  (`src/native/door.mjs:45-46`) finds the release through `FGOS_HOST_BIN`, so a run with just the manifest
  fails with `git-addon-unavailable: addon not shipped on this channel`. Setting the full trio from
  `devHostEnv` (`FGOS_HOST_BIN`, `FGOS_ACTIVE_RELEASE_PATH`, `FGOS_ACTIVE_MANIFEST_PATH`) makes the check
  run and pass.
- Blast radius: every script that calls `ensureAddonForScript` fails the same way in a confined head:
  `plan-contract-check`, `project-agents`, `check-decision-citation-drift`, `check-backlog-reconciliation`,
  `build-skill-wrappers`, `check-decision-supersession`, `build-domain-registry`.
- The planner brief (`src/session-host/head-start.mjs:106`) and `core/skills/_shared/plan-contract.md` §5
  both tell the planner to run the check before `ready`. In a confined head, that step can never succeed.

## Gap 2: the land gate is off

- `d39e3b6a0` (2026-11-22 08:45) taught `fgos land` the `{plans}` placeholder, and `f7b8c56d8` added the gate
  `node scripts/plan-contract-check.mjs {plans}` for `plans/*/plan.md` and `plans/*/phase-*.md`.
- `14287de27` (2026-11-22 11:17) removed the gate "until the active release substitutes its plans
  placeholder".
- The active release is now `3b595f7c` (activated 2026-11-23 06:48, `bcc2186b6`). Its `bin/fgos` contains the
  `{plans}` handling (`--plan '` rendering is present), so the hold condition is met. The gate is still
  missing from `.fgos/config.yaml` `land.gates`.
- `core/skills/_shared/plan-contract.md` §5 still says "The land door runs the check on every landed plan".
  Today that statement is false.
- Restoring the gate on its own would make things worse. `ShellRunner` runs gates with the caller's
  environment (`packages/supervision/rust/src/land.rs:180-195`). A confined head's land would hit Gap 1 and
  refuse every plan land. Gap 1 has to be fixed first or in the same change.

## Proposed fix (one plan, smallest honest shape)

1. `ensureAddonForScript` reuses this checkout's staged addon when its `source-digest` matches
   `gitAddonSourceDigest()`, setting the env through the existing `devHostEnv`, and runs cargo only when the
   addon is missing or stale. When staging is needed but `target/` is not writable, it fails with a named
   cause instead of a cargo stack trace. This reuses existing helpers and adds no new mechanism.
2. One owning proof in the test file that owns `git-addon-stage.mjs`: with a fresh staged addon and an
   unwritable target directory, the script door loads without invoking cargo.
3. Restore the `{plans}` land gate in `.fgos/config.yaml`, with its `@fgos:why` line.
4. Proof that the whole path works: a confined planner head runs the check and lands a plan through the gate.

The owner decides whether this becomes a plan. A planner head may not change code or config itself.
