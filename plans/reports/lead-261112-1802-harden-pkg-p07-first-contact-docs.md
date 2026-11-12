# HARDEN packaging P07: first-contact docs and the npm channel retired

Branch `harden/pkg-p07-first-contact-docs`, rebased on main `085912c4e` (P11, P12 and the migration fix all landed). Landed hash: see the board line.

## What changed

- **README.** The first screen keeps the tagline, then the promise ("From nothing to your first agent run in about 3 minutes. You need Node >= 18, git, curl and one agent CLI (claude, codex, omp or pi)", the list `agent-cli-missing` prints). Quick start is the release `install.sh`, `fgctl init`, `fgos run "<prompt>"`, each with one sentence; the real closing blocks follow. Removed: the npm and bleeding-edge sections, the `fgos setup` step and section, the pinned alpha tag (a pre-release is installed through `<tag>` once, in its own section). Doctor describes `ok`, `next` and the exit-code rule (exit 0 whatever the checks say, `--strict` exits 1). Uninstall is `fgctl uninstall [--dry-run|--yes|--purge]`. The claude seat login is mentioned where agent setup is described and linked to the how-to.
- **How-to** (`docs/how-to/install-fgos-in-a-project-and-use-doctor.md`): release install URL, the closing block, `fgctl init` has no `--yes`, `fgos setup` is no step of onboarding, `fgctl uninstall` row, doctor exit text, new section 5.3.1 (English) for the dedicated claude seat login, and five doctor rows removed that exist nowhere in code (`git grep` over src, packages, core, apps, test is empty) plus the `setup` fix cells of rows whose message no longer says it.
- **Spec** (sections 2, 3 and 6 only): release URL, 3.2 says the channel is retired, section 6 says `fgctl init` wires hooks and carries the closing block and the doctor `ok`/`next`/exit rule.
- **Messages:** `bin/fgos.mjs` (native-only verb, was Vietnamese), the doctor row that named the npm channel, the `fgos setup` help (`setup still wires the git hooks path and the shell-integration line that doctor --fix does not`), and the doctor messages whose registered fix is `doctor --fix` (Event Store mapping rows, the holder-lock "does not exist yet" warning, the mailbox opt-in note); the workflow-capabilities row lost its "fgos setup adds" aside. `shell-integration-sourced` and `main-checkout-hook-wired` keep "run fgos setup": no registered fix repairs them, setup is the only writer. Trust and seat-binding rows were not touched.
- **Tests:** `test/cli/first-run-guide.test.mjs` pins all three commands in the README and refuses `fgos setup` and the npm install (backlog `p-x2rynzyaft` flipped to done). The doc-health test "the install tag README.md pins exists" is retired: the README pins no tag, the behaviour was removed. Pinned strings updated in `fgos-manifest`, `checks-setup-rc-line`, `holder-lock-checks`.
- **CHANGELOG:** one line for the npm retirement.

Net: 179 added, 192 deleted across 16 files (docs, messages, tests, one regenerated census); README alone -65 lines.

## Real output, from the current main build

Scratch HOME `/dev/shm/pkg-p07-scratch`, release built from this tree and served as a local release (`FGCTL_ASSET_BASE_URL` to loopback, the mirror the README documents). Commands are the README's; the install host is the only difference.

`install.sh` ends:
```
Installed fgctl v0.2.0-p07scratch to <dir>/fgctl
Next, from inside your project (a git repository):
  <dir>/fgctl init
  fgos run "<prompt>"
```
`fgctl init`, no agent CLI on PATH (exit 0), then `fgos run "say hi"` (exit 4):
```
no local release given; downloading latest release
downloaded and verified fgos-<tag>-x86_64-unknown-linux-gnu.tar.gz (<tag>) from <base>
Ready: fgOS <tag> active (411180d8bc31)
Next: fgos run "<prompt>"
---
fgos: agent-cli-missing: no agent CLI is installed on this machine (looked for claude, codex, omp, pi on PATH); install one of claude, codex, omp, pi, then run "fgos doctor" to check it
```
Same project, second `fgctl init`: `nothing to do: fgOS <tag> already active, doctor ok` plus `Next:`. `fgctl upgrade` ends with the same lines. `fgctl repair`: `Ready: fgOS active (411180d8bc31)` plus `Next:`. `fgctl verify`: `verified 411180d8bc31`. `fgos --version`: `fgos 0.2.0`. `fgos doctor` and `--strict` exit 0 on a clean machine.

With a claude CLI on PATH and no account: `fgctl init` exits 2 and prints
```
1 check needs you:
  1. confined-pane-accounts: executor "claude" invocation "claude-cli-bwrap": no runner.providers.claude.accounts in the global config, so its pane starts in an empty private home, logged out; executor "claude" invocation "claude-herdr-bwrap": ...
Error: not ready: the checks listed above need you
```
After the three commands of how-to 5.3.1 (login directory, `fgos config set runner.providers.claude.accounts.main ...`): the row says `account "main" has its 1 credential file(s)` and `fgctl init` prints `nothing to do: fgOS already active, doctor ok`. (The claude CLI in this scratch is a stub that answers `--version` and the plugin listing; the login file is a placeholder. A real login was not made.)

A legacy `~/.fgos/config.json` and no yaml: `Ready: ...` then `Note: ~/.fgos/config.json moved; projects on an older release refuse until `fgctl upgrade``.

Pin drift (digest edited in `.fgos/distribution.json`): `fgctl status` and `fgctl verify` print `active 411180d8bc31 != pin aaaaaaaaaaaa (override: none)`; doctor row `activation-matches-pin` warns the same. Unreadable pin: `Error: the committed pin is unreadable: .fgos/distribution.json; restore it from version control, or run `fgctl upgrade` to write a new pin`, exit 4.

`fgctl uninstall --dry-run` prints the plan and `Nothing changed. Re-run with --yes to apply this plan.`; `--yes` ends `done: project wiring: reversed; backups: ...` and `done: activation: removed .../.fgos/installation; records copied to .../.fgos/uninstall-backup-<time>`, keeping `config.yaml`, `distribution.json`; `--yes --purge` ends `done: release store: removed 6 store entr(ies) under <state>`.

## Gates

- `test/cli/first-run-guide.test.mjs`, `test/scripts/doc-health.test.mjs`, `test/architecture.test.mjs`, `fgos-manifest`, `checks-setup-rc-line`, `holder-lock-checks`, `git-checks`, `checks`: pass.
- `check-decision-citation-drift`: the known red on main, identical on clean main.
- Census regenerated (`node scripts/git-one-door-scan.mjs --write-census`) at each rebase step; no Rust file touched, so no cargo gate.
- Full `npm test`: see the board line for the fail count and ERROR lines.

## Findings outside this phase

1. `fgctl repair` rewrites the committed pin with `releaseVersion: null` (measured: pin carries the tag after `init` and `upgrade`, null after `repair`). A project then needs `--from` or `FGCTL_VERSION` to come back after a purge. Owner: the pin writer in `init.rs`.
2. `fgctl upgrade` to the release already active prints `fgctl: up to date with the release (sha256:31b2...)`, a digest that is not the active release's digest (`411180d8bc31`); it looks like the archive digest. Cosmetic but confusing next to `fgctl status`.
3. How-to section 4 lists about 15 rows by id that this machine's doctor does not carry, and about 40 live rows (the `config-*` family among them) are undocumented. I removed only rows proven absent from the code; a full regeneration of the table from `fgos doctor --json` belongs to the documentation lane or a follow-up.
4. `fgctl --help` prints `Exit codes: 0 ok, 1 failed, 2 usage error`, while `fgctl init` exits 2 for "not ready" and 4 for an unreadable pin. The help's table does not list them.

## Authority

- The first-run three commands live in three places (`apps/fgos/src/main.rs`, `apps/fgctl/src/help.rs`, README); one test pins them. They should come from one source, but that is a Rust and docs build change, not this phase.
- The check-by-check catalog is held twice: the code (`registrations.mjs`, config contract) and the how-to's tables, with no test linking them. It belongs in the code: generate the how-to table from `fgos doctor --json`.
- The doctor exit-code rule (exit 0, `--strict` exit 1) is stated in the `doctor` help, the spec, the README and the how-to; the help text in the command registry is the authority and the rest repeat it.

## Lessons

- `git stash` is repo-wide across linked worktrees: a parallel lead stashed between my `stash` and `stash pop`, and I popped their entry. Never `stash` in a worktree; commit a WIP commit instead, and address stash entries by hash.
- A scratch HOME with a stub agent CLI found two doctor rows that made "one agent CLI is enough" false before the promise went into the README. Run the user's literal first-contact path on a machine with exactly one CLI before writing the promise.
- Write the docs from captured output: the closing block, `agent-cli-missing` text, the `Note:` line and the pin drift line are quoted as printed; three of them changed while this phase was open, so capture last.
- The Git one-door census check rejects a commit that touches `bin/` or `src/setup` files; plan for a `--write-census` step at each rebase conflict (take either side, regenerate).
