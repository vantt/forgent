# Confinement policy vectors

Recorded from the Node originals in `src/runner/dispatch/confinement/` (`policies.mjs`, `resources.mjs`,
`workspace-paths.mjs`, `bypass-pairing.mjs`) by `test/golden-recorders/confinement-policy.recorder.mjs`.
Regenerate only when those originals change on purpose: `node test/golden-recorders/confinement-policy.recorder.mjs`.

- `policy.v1.json`: vocabulary constants (built-in policies, control axes, grant access levels, every
  `MACHINE_PRIVATE_ROOTS` and `BLIND_HIDDEN_ROOTS` template) and the cases of each pure rule: network filter, policy
  shape, workspace paths, capability shape, invocation override, legacy normalisation, policy lookup, posture,
  bypass pairing (all 16 flag combinations) and `controlDelivery` (every launch kind, requirement and backend
  combination). Whether a posture can apply on this machine (`resolvePostureInvocation`) is the executor model's
  fact `posture` in `packages/execution/contracts/executor-model.v1.json`, not recorded again here.
- `resources.v1.json`: file-system cases. A `fixture` lists `dirs`, `files`, `symlinks` and `modes` under `$ROOT`
  (a reader's own temp directory); `$UID` stands for the reader's uid. Covers each machine-private root (home
  private store, runtime directory, session socket directory, both herdr config directories, the herdr socket
  directory and its refusals, login stores and their refusals, confinement roots, nesting), the blind roots, and
  every grant of the resolver including the head's `mailbox-record` and `peer-sessions`.
- `gitMetadata` in `resources.v1.json` is git's own answer (`rev-parse --absolute-git-dir`) for a plain checkout, a
  linked worktree and a directory with no `.git`: the git addon the Node call asks is not shipped on a checkout run.
- A case with `error` and a `code` is a refusal; a message that holds operating-system text
  (`mailbox-record-unavailable`) is compared by code only.
