# Permission posture — where it actually comes from, and the rule that follows

Date: 2026-09-06 | herdr 0.8.2 | claude
Scripts: `permission-posture-probe.sh`, `skip-permissions-probe.sh`, `provisioned-worker-probe.sh`
Every run created and destroyed its own herdr session; the operator's `default` session was
never touched.

## The question

An agent started in the operator's session ran as `claude --dangerously-skip-permissions`.
The same start in an isolated session stopped at a permission dialog. Two variables had
changed at once, so the mechanism was unexplained. The coupling rule this phase owes
depends on knowing it.

## What was measured

Three starts in one isolated session, changing only the trailing args:

| Start | argv herdr actually launched | Result |
|---|---|---|
| no trailing args | `claude` | rc=0 |
| `-- --model haiku` | `claude --model haiku` | rc=0 |
| `-- --model haiku --dangerously-skip-permissions` | `claude --model haiku --dangerously-skip-permissions` | **rc=1**, `agent_not_ready` |

So **herdr never adds the flag**. It passes trailing args through and nothing more.

The flag in the operator's session comes from the operator's own shell:

```
~/.zshrc:148   alias claude='command claude --dangerously-skip-permissions'
```

And the third row's failure has its own cause. The flag triggers a one-time acceptance
screen — *"WARNING: Claude Code running in Bypass Permissions mode … Yes, I accept"* —
which herdr correctly classifies as `blocked`. The operator never sees it because a second
invisible piece suppresses it:

```
~/.claude/settings.json:204   "skipDangerousModePermissionPrompt": true
```

## Why this matters more than a missing flag

The permission posture of every agent launched on this machine is decided by **two lines
that fgOS cannot see, in files fgOS does not own**: a shell alias and a settings key. No
executor config mentions either. Three consequences follow:

1. **It is invisible.** The profile says nothing; the real posture is a dotfile.
2. **It is machine-specific.** On a machine without that alias the same dispatch silently
   becomes interactive and stalls at the first write — at runtime, not at config load.
3. **A private HOME removes it by accident.** That is exactly what happened: an empty
   `.zshrc` drops the alias and an absent `settings.json` restores the acceptance dialog.
   Isolation and permission posture are coupled today, and nobody designed that coupling.

The sharp version: the operator's own sessions run permissive by accident, and an isolated
worker runs restricted by accident. Neither is a decision.

## The rule

**Permission posture is declared in the executor profile and never inherited from a shell.**
The adapter passes it explicitly through `agent start -- <args>`; it must never depend on an
alias existing.

**Bypass is only legal with confinement.** In the profile:

```yaml
permissionMode: ask | bypass
confinement:
  privateHome:      true
  isolatedSession:  true
  ownWorktree:      true
```

`permissionMode: bypass` requires all three confinement flags. Config load refuses the
combination otherwise, by name — a checked invariant, not a comment. That is what stops a
future change from enabling bypass on its own.

**Declaring bypass obliges the provisioner** to write `skipDangerousModePermissionPrompt:
true` into the private HOME's `settings.json`. Without it the flag stops the agent at its
acceptance dialog, and the dispatch fails at startup rather than doing anything dangerous —
safe, but useless.

## Proven end to end

`provisioned-worker-probe.sh`: isolated session, private HOME carrying all five provisioning
items, posture declared on the command line rather than inherited.

```
agent start rc=0
argv: claude --model haiku --dangerously-skip-permissions
agent prompt rc=0
PASS -- unattended turn completed with no human input: READY
```

An agent in a session of its own, with a HOME of its own, completed a real turn and left the
artifact behind, with no human keystroke at any point.

## Consequence for the plan

Phase 01's provisioning list grows from four items to five. Phase 02's `agent start` call
must carry the posture explicitly. The capability profile gains `permissionMode` and
`confinement`, and the load-time invariant binding them is itself a testable requirement.
