# Forgent

<!-- FGOS:BACKLOG-BADGES:START -->
![backlog declined](https://img.shields.io/badge/backlog%20declined-4-red) ![backlog done](https://img.shields.io/badge/backlog%20done-86-brightgreen) ![backlog parked](https://img.shields.io/badge/backlog%20parked-0-yellow) ![backlog in-flight](https://img.shields.io/badge/backlog%20in--flight-1-blue) ![backlog proposed](https://img.shields.io/badge/backlog%20proposed-16-lightgrey)
<!-- FGOS:BACKLOG-BADGES:END -->

**The Foundation for Generative Agents.**

Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch.

## Install

From nothing to your first agent run in about 3 minutes. You need Node >= 18,
git, curl and one agent CLI (claude, codex, omp or pi).

### Quick start: Linux (x86_64)

```bash
curl -fsSL https://github.com/vantt/forgent/releases/latest/download/install.sh | sh
cd your-project                      # an existing git repository
fgctl init
fgos run "<prompt>"
```

1. `install.sh` puts one small binary, `fgctl`, in `~/.local/bin` (or
   `FGCTL_INSTALL_DIR`); add that directory to `PATH` if the installer says it is
   missing. Nothing needs a clone, npm or a Rust toolchain. The Linux build runs on
   glibc 2.35 and later (Ubuntu 22.04 and newer).
2. `fgctl init` downloads the latest release, checks it against the release's
   `SHA256SUMS`, activates it in the project, wires the agent hooks and runs
   `fgos doctor`. It ends with `Ready` and the next step, or with a numbered list
   of the checks that need you and exit code 2.
3. `fgos run "<prompt>"` runs one task through an agent CLI. With no agent CLI
   installed it stops with `agent-cli-missing` and says which to install.

A claude seat that runs in the sandbox needs a login of its own, not your
`~/.claude`; until it has one, `fgos doctor` fails `confined-pane-accounts`. The
steps are in
[How to install fgOS in a project and use fgos doctor](docs/how-to/install-fgos-in-a-project-and-use-doctor.md#531-a-claude-seat-in-the-sandbox-needs-its-own-login).

Running `fgos` with no arguments prints these three steps again; `fgos --version`
and `fgctl --version` print the version, and `fgos <command> --help` describes one
command.

### Quick start: Windows 10 or later (x86_64)

Open PowerShell (no Git Bash, no WSL, no administrator rights):

```powershell
irm https://github.com/vantt/forgent/releases/latest/download/install.ps1 | iex
$env:Path = "$env:LOCALAPPDATA\fgos\bin;$env:Path"    # this session only
cd your-project                      # an existing git repository
fgctl init
fgos run "<prompt>"
```

`install.ps1` installs `fgctl.exe` into `%LOCALAPPDATA%\fgos\bin` (or
`FGCTL_INSTALL_DIR`), checks the download against the release's `SHA256SUMS` and
changes nothing on your `PATH`: the `$env:Path` line above covers the current
session, and the installer prints the command to make it permanent. `fgctl init`
needs `curl.exe`, which ships with Windows 10 1803 and later, and must run inside a
git repository, as on Linux.

macOS and Windows on ARM are not supported yet.

### Pre-releases and other sources

A pre-release is never "latest", so install it by naming its tag, for the installer
and again for `fgctl init`:

```bash
curl -fsSL https://github.com/vantt/forgent/releases/download/<tag>/install.sh \
  | FGCTL_VERSION=<tag> sh
FGCTL_VERSION=<tag> fgctl init
```

A download writes its tag into the committed `.fgos/distribution.json`, so a
teammate who clones the project and runs a plain `fgctl init` gets the same release
(downloaded and checked) without being told which one. Other sources:

```bash
FGCTL_FROM=./fgos-<tag>-x86_64-unknown-linux-gnu.tar.gz fgctl init   # a local build, build dir, or URL
fgctl init --from <path-or-URL>                                      # same as FGCTL_FROM
```

Precedence: `--from` > `FGCTL_FROM` > `FGCTL_VERSION` > the project's pin > latest.
A downloaded release is refused unless its entry in `SHA256SUMS` matches; a URL
source needs a `SHA256SUMS` file in the same directory. A local path is used as
is. `FGCTL_ASSET_BASE_URL` redirects downloads to a mirror, as for `install.sh`: it
names the directory that holds the assets (so `install.sh` needs `FGCTL_VERSION`
with it), and it must be `https://` or `file:///`; plain `http://` is refused
except to a loopback host. When the active release is not the one the committed pin
names, `fgctl status` and `fgos doctor` say so (`active <d12> != pin <d12>`), and an
unreadable pin makes `fgctl init` refuse; restore it from version control or run
`fgctl upgrade`.

The npm install (`npm install -g github:vantt/forgent`) is retired: it ships no
native host, so `fgos init` there refuses and points to `fgctl init`.

### Dev shell helpers

Working from a checkout of this repo (main checkout or a linked git
worktree) without a global install? Source `scripts/fgos-shell-integration.sh`
from your own shell rc file to get `fgos` and `fgos-runner` functions that
resolve the right `bin/*.mjs` automatically from any cwd inside the repo:

```bash
source /path/to/forgent/scripts/fgos-shell-integration.sh
```

### Doctor

`fgos doctor` answers one question: can fgOS run correctly on this machine and in
this project. It prints a JSON report whose `ok` says yes or no and whose `next`
lists the commands to run when it is no; `--pretty` prints colored text instead.
It writes nothing on its own and exits 0 whatever the checks say, so a tail that
runs it never reads a failed check as a crash; `--strict` exits 1 when a check
fails (for scripts and CI).

```bash
fgos doctor
fgos doctor --fix     # runs every registered readiness fix, then re-reports
fgos doctor --strict  # same report, exit 1 if any check fails
```

For the full onboarding order, what every doctor check means and which ones you
must fix by hand, see
[How to install fgOS in a project and use fgos doctor](docs/how-to/install-fgos-in-a-project-and-use-doctor.md).

### Config

Config lives in `.fgos/config.yaml` (project) and `~/.fgos/config.yaml`
(global); the release's own standard sits under both. Read the effective
values with `fgos config show`, ask what a key means with
`fgos config explain <path>`, and change one with
`fgos config set <path> <value> --reason <text>`. `fgos doctor` reports
config problems and, with `--fix`, repairs the ones it names. Details:
`docs/platform/config/spec.md`.

### Uninstall

`fgctl uninstall` removes what fgOS installed in the project: its hook entries,
generated skill directories, git hooks and the `.fgos/installation/` activation. It
prints the plan first and applies it with `--yes`. Your config and data stay.
`--purge` also removes the machine's release store. The `fgctl` binary and the
`fgos` launcher beside it are named, never removed.

```bash
fgctl uninstall --dry-run   # print the plan, change nothing
fgctl uninstall --yes
fgctl uninstall --yes --purge
```

### Contributing

After cloning, run `npm run setup:hooks` once to wire up the pre-commit
hook (this is not automatic on install — it no-ops for pnpm 10+, which
blocks lifecycle scripts for git-hosted dependencies).

## Documentation

End-user docs for the install → submit → merge flow, indexed in
[`docs/enduser-docs-index.json`](docs/enduser-docs-index.json):

- [`docs/how-to/`](docs/how-to/) — task-oriented guides, e.g. checking a root item's rollup progress
- [`docs/explanation/`](docs/explanation/) — design rationale: event log evolution, ID generation, layered architecture, runner execution safety, session isolation and concurrency, work-item lifecycle

Contributor and maintainer docs (architecture, decisions, specs) live in the
repo's `docs/` tree but aren't part of the published package — clone the
repo to read them.
