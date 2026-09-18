# Agent in an isolated session with a private HOME — measured

Date: 2026-09-06 | herdr 0.8.2 | claude, model haiku
Script: `agent-in-session-probe.sh`. Session `fgos-agentprobe` created and destroyed each
run; operator's `default` session untouched throughout.

Closes the two questions [session-findings.md](session-findings.md) left open.

## Q1 — do `agent start` and `agent prompt` work in a NON-default session? YES

Both returned rc=0 against the isolated session's own socket. `agent start` reported
`agent_status: idle`, `interactive_ready: true`. `agent prompt --wait` delivered a real
instruction, and the agent acted on it: the pane shows it composing `turn-proof.txt` with
the requested content and asking for permission to create it.

Session isolation therefore does **not** cost the agent control surface. Everything the
V0 design needs from herdr works the same inside a session of its own.

## Q2 — does an agent CLI work with a private HOME? YES, if the HOME is PROVISIONED

An empty HOME is not a private HOME, it is a broken one. Four things had to be present,
each found by hitting its failure:

| Item | Failure when absent |
|---|---|
| `.zshrc` (an empty file suffices) | zsh runs its first-run wizard. herdr types the launch command into it, the wizard consumes the first keystroke as a menu choice, and `claude --model haiku` arrives at the shell as `laude --model haiku` → `command not found`. |
| `.claude/.credentials.json` | no provider auth |
| `.claude.json` with `hasCompletedOnboarding: true` and a theme | claude starts but sits in its own onboarding wizard; a prompt sent then is swallowed |
| `.claude.json` `projects[<cwd>].hasTrustDialogAccepted: true` | the folder-trust dialog, already measured in the P6 run |

A fifth remains for unattended work: **permission posture**. In the operator's session
herdr's claude integration launches with `--dangerously-skip-permissions`; in this
isolated launch it did not, so the agent stopped at "Do you want to create
turn-proof.txt?". For a worker that must run unattended this has to be settled
deliberately — by the flag, or by a settings file in the private HOME — and it should be
a declared part of the executor profile rather than an accident of which session it
happens to start in.

Copying the credential into the private HOME means the worker holds the operator's
provider credential. That is the same exposure `coordination-worker-provider-boundary.md`
already names, and it is not solved by HOME isolation. It stays open for a relay.

## The finding that matters most

**Two more independent proofs today that herdr's own status is not proof of work.**

1. `agent start` returned `idle` and `interactive_ready: true` while the agent was sitting
   in its onboarding wizard, unable to accept any instruction.
2. `agent prompt --wait` returned rc=0 at 22:17:47 while the agent then sat at a
   permission dialog for the next eighty seconds and never wrote the file.

Neither is a herdr defect — herdr reports what it can see. They are two fresh instances of
the class this project has already been burned by (`agy-herdr-false-idle-polling-race`),
and they are direct evidence for the V0 rule that completion is concluded from a
receiver-written artifact and never from a transport status.

Had the adapter trusted either signal, it would have reported a successful dispatch for a
Run in which nothing was written.

## Probe defects found and fixed along the way

Recorded because each would silently corrupt a later measurement:

- Waiting for zero foreground processes never succeeds — an idle pane always lists its own
  shell. Every earlier "shell ready after ~Ns" line in this proof directory was a timeout
  being misread as a success. Correct predicate: exactly one foreground process whose pid
  equals `shell_pid`.
- `herdr pane read` prints plain text, not JSON. Parsing it as JSON returns empty, which
  looks like "the pane rendered nothing" and sent this investigation briefly down a wrong
  path about headless sessions not rendering. They do render.
- `herdr agent start` rejects an agent name containing uppercase letters.

## Still open

- Whether `allow_nested = true` renders usably in a pane, so worker panes can be watched
  from inside the operator's cockpit rather than a second window.
- The provider-credential exposure, which no option here addresses.
