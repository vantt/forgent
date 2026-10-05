# agy herdr foreground-argv mismatch, 2026-10-05

## Cause

Not an argv problem and not an exec chain. The check `verifyForegroundProcessArgv` was never given a worker to look at: for the whole 5 s verify window the pane's foreground process was its own `zsh`.

Evidence (4 live runs of one read-only unit through `gemini` / `agy-herdr-mucdong`):

- `herdr pane process-info` and a debug dump of the round's `pInfo` at the failure: one foreground process, `/usr/bin/zsh`, pgid = shell pid, for all 16 samples in the window.
- A debug read of the pane screen at the failure showed zsh's first-use wizard (`zsh-newuser-install ... --- Type one of the keys`), followed by `ash /home/.../launchers/cmd_....sh` / `zsh: command not found: ash`: the first character of the typed `bash <launcher>` was consumed by the wizard.
- The wizard appears because the pane was split with `--env HOME=/tmp/fgos-confinement/<dispatch>/home`, the worker's private home (only `.gemini/...`, no `.zshrc`). The agy invocation declares `env.HOME`, so its resolved env carries the private home into `paneEnv`; the other families' invocations do not, which is why they passed the canary.
- Control experiment: the same launcher script run by hand in a normal pane (bwrap, then `bash -c`, then agy) shows foreground `bwrap` (argv0 `agy`, argv = the prepared bwrap args) plus `agy`; the existing matcher accepts the `bwrap` entry. So the documented exec chain is already matched; (a), (b) and (c) from the brief are all ruled out for (a) and (b); (c) is the home, but through the pane shell, not agy's wrapper.

## Fix

`src/runner/dispatch/herdr-round.mjs`: for a confined round (`isConfined`) the pane is split without `HOME`; the launcher script already exports the worker HOME right before `exec`, so the worker is unchanged and the pane shell starts in the real home. Other pane variables still pass. The argv/exe/env/cwd checks are untouched, so an unrelated foreground process is still refused.

## Tests

`test/runner/herdr-reconciliation.test.mjs`, new `19b`: a confined round whose prepared env has a private `HOME` splits its pane with `KEEP_ME=yes` and without `HOME=`. It failed before the fix (assertion on the split env) and passes after. `herdr-reconciliation` and `herdr-spawn-adapter` suites: 74 pass, 0 fail, 1 skipped.

Also: one bullet in `docs/specs/runner.md`, one line in `CHANGELOG.md` `[Unreleased] > Fixed`.

## Live result

4 live runs used. Runs 1 to 3 reproduced the failure (and gave the evidence above, with a temporary debug dump that is not committed). Run 4, after the fix: the pane started cleanly, agy launched under bwrap, passed the foreground check, took the brief, and then answered `Individual quota reached ... Resets in 18m` (the mucdong account quota, already seen in the earlier canary). So the transport defect is fixed; a full settled agy-herdr unit could not be shown because of the quota. I closed the pane and left no processes. Re-run the canary after the quota resets.

## Notes

- agy-herdr under bwrap shows `bwrap` with argv0 `agy` as the foreground entry, which the matcher already handles; no exec-chain data was needed.
- Debug code and `/tmp/agyfix` scratch files are not part of the commit.
