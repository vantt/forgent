# Lead report: main-checkout delete guard

Status: landed, `a5f829912..4d1cea537` on main. OPC (forgent-5f) gave MERGE on 8e8556eaf. The landed commits are the same changes rebased over a config commit and two board lines.

## Outcome

The guard covers the 13:50 wipe (`...; cd $W && ...; git status --porcelain --ignored | grep '^!!' | xargs rm -rf` in the main checkout). A new PreToolUse hook kind, `fgos hook main-checkout-delete-guard`, judges every shell tool call before it runs. It refuses a command that would mass-delete inside the main checkout of a fgOS project:

- `git clean` with `-x` or `-X`;
- `xargs ... rm`;
- `rm -r` of the checkout root, of an ancestor of it, or of a top-level `.fgos`, `.claude`, `target` or `node_modules` (a glob is judged by its static directory);
- `find ... -delete` or `-exec rm` under it.

The inner command of `xargs` and `find -exec` is unwrapped through `sudo` and similar wrappers. A shell's script is also judged: its `-c` operand, or a heredoc or here-string fed to it. A shell left reading its script from a pipe is refused in a main checkout.

How the directory is resolved:

- It comes from the payload cwd, every `cd`/`pushd`, and `git -C`/`--work-tree`.
- A `cd` joined by `&&` (or followed by `|`) narrows the directory. A `;`, `||`, newline or `&` keeps the old directory in play.
- A subshell or `$(...)` keeps its own `cd`.
- `NAME=literal` and `export NAME=literal` are followed.
- A directory or operand that cannot be resolved (a variable, `$(...)`, `cd -`) is refused wherever the command may run in a main checkout.

Allowed: linked worktrees, outside any checkout, single named files, and deeper named paths such as `.fgos/runtime/tmp/x` or `.fgos/installation`. The guard's scope is mass deletes only.

The refusal names `fgos worktree remove <path> --delivered-to <ref> --discard-ignored`, `git -C <linked-worktree> clean ...` and plain `rm <file>`. For a delete that is really intended, it says to ask the owner to run it in their own terminal. There is no bypass switch.

## Design

- **Judge.** `src/git/main-checkout-delete-guard.mjs`, a pure leaf (fs and path only, infra row in the architecture manifest). It reads the checkout layout from the filesystem: a `.git` directory plus a `.fgos` directory is a main checkout, and a `.git` file is a linked worktree whose gitdir names its main root. It does not use Git Inspect, for two reasons: the judged directories often do not exist (a worktree create that failed), and the hook is on the hot path of every shell call, so it never starts a git process. OPC accepted this.
- **Door.** `scripts/main-checkout-delete-guard-hook.mjs`, run by `fgos hook` in the same way as the other two kinds (`bin/fgos.mjs` only adds the kind to `ALLOWED_HOOK_KINDS`). It reads the Claude Code and Codex payloads (a Codex argv `[bash, -lc, script]` is unwrapped) and the agy payload (`--format=agy`, JSON decision on stdout). It fails open on an unreadable payload, like the other hooks.
- **Render.** One row per CLI in the `hookRows` table of `src/setup/agent-hooks.mjs`, through the existing `fgos setup` / `fgos doctor --fix` fixes. There is no new doctor check id: the existing `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired` and `pi-hook-wired` rows require the row. `isShimRunnable` also probes the kind with `{}`, so an activated release that does not know the kind fails the row ("main-checkout-delete-guard: exit-1"). Without that probe, the problem would only show up as an error on every shell call.
  - Claude Code: matcher `Bash`. A `/bin/sh` prefilter passes any payload without `rm `, `rm\`, `xargs`, `clean` or `-delete` inside the shell, so most calls never start the shim (measured: the shim through legacy-node costs about 170 ms; the prefilter costs one `cat`). A missing shim lets the call through, and doctor reports it.
  - Codex: matcher `^(Bash|shell|exec_command|local_shell)$`. Plain shim command, because Codex runs it through the user's `$SHELL`, which may not be POSIX. It pays about 170 ms per shell call.
  - agy: group `fgos-delete-guard`, matcher `run_command`, `--format=agy`.
  - OMP and Pi: a `bash` branch in the generated extension. These two also call the shim on every bash call.
- **Prior art.** No earlier guard of this kind exists (`git log -S` on `xargs rm`, `git clean`, `rm -rf` and `wipe` found none in src, scripts or hooks). The hook table, the shim, the `fgos hook` door and the doctor probe were reused.

## Proofs

- `test/git/main-checkout-delete-guard.test.mjs` is the owning proof: 17 tests with real command strings, including the exact 13:50 line, the `;`-chained failing `cd`, heredoc, here-string and `| sh` scripts, the inner commands of `find -exec sudo rm` and `xargs sh -c`, and `export`.
- `test/scripts/main-checkout-delete-guard-hook.test.mjs` is one wiring proof through `node bin/fgos.mjs hook`: standard exit 2 plus stderr naming both safe doors, and the agy JSON.
- `test/setup/agent-hooks.test.mjs` covers the rows of every CLI, the Claude prefilter run through `/bin/sh`, the OMP and Pi extension blocking a `bash` call with the shim's reason, and the probe reporting a release that does not know the kind. Existing row-count assertions were extended, not weakened, and no test was retired.
- Gate:
  - Full `npm test` at da96892da: 8622 pass, 3 fail, no run-tests ERROR lines. The fails are the known V7n addendum, plus `check-decision-citation-drift` (real repo) and the `assembleSkills` drift guard. Both of those fail only on git-ignored `.agents/skills/ak-*` directories that were present in the fresh worktree at creation and also exist in the main checkout, so they are environmental and not caused by this change.
  - After the fixes and each rebase: the focused set (guard, hook door, agent hooks, checks, command registry, manifest, rust-host help and command routes, architecture, doc-health) was green, 173/173 on the final rebase.
  - One-door census regenerated (digests only), 0 undeclared.

## Docs

- CHANGELOG `[Unreleased]` line.
- `docs/platform/packaging-distribution/spec.md`: a §6 paragraph on the agent guard hooks and the delete guard, and the `dispatch-decide-hook-wired` row text.
- `docs/platform/host-invocation-routing/spec.md`: the legacy hook kind list.

## Pickup (owner and other machines)

1. COOK activates a release built from main at or after `4d1cea537` (the usual stage, activate and `fgctl verify`). The kind must be in the activated release **before** the row is rendered, otherwise the guard errors on matching shell calls.
2. In every fgOS project on the machine, run `fgos doctor --fix` (or the deprecated `fgos setup`). It renders the row into `.claude/settings.json`, `.codex/hooks.json`, `.agents/hooks.json` and the OMP and Pi extensions, keeping user hooks and local edits. Then run `fgos doctor` and check that the `*-hook-wired` rows pass.
3. In this repository, `.claude/settings.json` is tracked and has owner-local edits. After step 2, stage and commit only the new `PreToolUse` `Bash` entry (`git add -p .claude/settings.json`). Until it is committed, a fresh worktree's `dispatch-decide-hook-wired` row reports the row as missing. Claude Code sessions pick up the hook when they start.

## Open items and limits

- This is a guard against accidents, not a sandbox: an alias, `${IFS}`, a script file run by path, or `bash file.sh <<X` (which is treated conservatively as the script) are not read exactly.
- Conservative false positives: `rm -rf "$VAR"` and `sh -c "$X"` run from a main checkout are refused. The refusal explains why.
- Codex, agy, OMP and Pi pay about 170 ms per shell call (no POSIX prefilter there). A native Rust kind, like `mailbox`, would remove that cost. That would be a new mechanism, so it is listed here and waits for the owner's choice.
- Environmental: ignored `ak-*` skill directories make two real-repo drift tests red in any checkout that has them. This is unrelated to this change and worth its own item.
