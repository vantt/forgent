# HARDEN T5 — CLI install bind-back inside masked login homes (urgent production fix)

Branch `harden/t5-cli-install-bind` (base origin/main 6881e5494). Not pushed.

## Problem
Since 9c35308d9 every CLI login home is masked (`--tmpfs`) and only the realpath of the program FILE was bound back.
- pi: `~/.local/bin/pi` -> `~/.pi/agent/bin/pi`, a `#!/bin/sh` launcher reading `../install/current-version`
  and exec'ing the release under `install/releases/<v>/` -> "cannot open .../install/current-version".
- codex: `~/.local/bin/codex` -> `~/.codex-<acct>/packages/standalone/current/bin/codex`; `current` is a link inside
  the masked home -> ENOENT.
- omp (`~/.local/bin/omp`, plain binary) and claude (`~/.local/share/claude/versions/<v>`) resolve outside every
  masked home: not affected.

## Fix (`src/runner/dispatch/confinement/resources.mjs`)
`launchProgramBindBacks(program, maskedRoots)`: when the program's realpath lies in a masked root, bind back
read-only, after the mask, the existing install subtrees of that root from `CLI_INSTALL_SUBTREES = ['bin', 'install',
'packages']`; if none of them holds the program, the program file alone (old behaviour, kept for single-file CLIs).
A subtree whose real path is or contains a masked root is never bound back. Same `launch-program` resource and bwrap
ordering (mount after tmpfs, before remount-ro); only comments changed in `drivers/bwrap.mjs`.

Why a named list, not derivation from the link chain: pi's launcher reads its sibling `install` directory, which no
link on the chain names; deriving from hops would bind only `bin` and pi would still fail. None of the three names
holds a login file in pi's or codex's layout (`auth.json`, `config.toml`, `sessions`, sqlite stores stay hidden).

## Proof
- Red (commit f86139f20): new test in `test/runner/dispatch-confinement-machine-private.test.mjs`
  "a CLI installed inside a masked login home starts confined, while the login files in that home stay unreadable"
  (real bwrap, leased launches with `credentialStore`): pi failed exactly as production
  (`cat: .../.pi/agent/bin/../install/current-version: No such file or directory`).
- Green (commit 9575689cf): pi and codex both start; `auth.json` (pi, codex) and codex `config.toml` read HIDDEN.
- Falsifier: dropping `packages` from the list fails the codex half (`.local/bin/codex: No such file or directory`).
- Focused: every test importing resources.mjs / bwrap.mjs + architecture.test.mjs: 260 pass, 0 fail.
- Live (fg-server2, dev host, read-only): `dispatch probe-account --provider openai --account tetcu72` ->
  codex-cli-bwrap ok, codex-herdr ok, pi-herdr ok, pi-cli-bwrap ok (all confined=true), verdict healthy.
- One-door scan: 0 undeclared; census regenerated and committed.
- Full suite: 8651 tests, 8618 pass, 1 fail (only the known pre-existing "frozen V7n addendum" test), no run-tests ERROR lines.

## Size
src +24/-6 (resources.mjs, bwrap.mjs comments only), test +49, CHANGELOG line amended in place. No test retired.

## Deviations / items for others
- No P01 red row existed; red proof written here as the branch's first commit.
- The single-file bind-back had no proof before; the new test now owns the launch-program bind-back behaviour.
- CHANGELOG Unreleased line about hiding login homes amended (it already claimed "a program installed inside a
  masked home stays runnable"); no new line.

Status: DONE
Summary: pi and codex confined seats start again; their install subtrees in the masked login home are bound back read-only while login files stay hidden; red->green proven, live probe 4/4 ok.
Concerns/Blockers: none; not pushed.
