# Forgent

<!-- FGOS:BACKLOG-BADGES:START -->
![backlog declined](https://img.shields.io/badge/backlog%20declined-4-red) ![backlog done](https://img.shields.io/badge/backlog%20done-86-brightgreen) ![backlog parked](https://img.shields.io/badge/backlog%20parked-0-yellow) ![backlog in-flight](https://img.shields.io/badge/backlog%20in--flight-1-blue) ![backlog proposed](https://img.shields.io/badge/backlog%20proposed-16-lightgrey)
<!-- FGOS:BACKLOG-BADGES:END -->

**The Foundation for Generative Agents.**

Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch.

## Install

Recommended — install a specific tagged release, so a broken commit on
`main` never breaks your install:

```bash
npm install -g github:vantt/forgent#v0.1.0
```

Replace `v0.1.0` with the [latest release tag](https://github.com/vantt/forgent/tags).
See `docs/how-to/cut-a-fgos-release-tag.md` for how tags get cut.

Bleeding-edge (always resolves to whatever commit is currently on `main`,
useful for contributors/early-adopters who want it):

```bash
npm install -g github:vantt/forgent
```

Then initialize your project:

```bash
fgos init
```

### Dev shell helpers

Working from a checkout of this repo (main checkout or a linked git
worktree) without a global install? Source `scripts/fgos-shell-integration.sh`
from your own shell rc file to get `fgos` and `fgos-runner` functions that
resolve the right `bin/*.mjs` automatically from any cwd inside the repo:

```bash
source /path/to/forgent/scripts/fgos-shell-integration.sh
```

### Setup

`fgos setup` wires the shell-integration source line into every shell
profile you actually have (bash and/or zsh) and brings your local
`.fgos/config.json` up to date with the current default keys, without
ever touching a setting you already customized. It does the same for your
global `~/.fgos/config.json` (optional, shared across every project — a
value set there is used wherever a project doesn't set its own). It always
does the work and reports exactly what changed — running it again with
nothing new to do says so plainly instead of repeating itself.

```bash
fgos setup
fgos setup --pretty   # colored plain text instead of JSON
```

### Doctor

`fgos doctor` is a read-only diagnostic: Node/git availability, whether
the shell-integration line is sourced, and whether your config file is
missing any current default key. It never writes anything on its own.

```bash
fgos doctor
fgos doctor --fix     # runs every registered fix, then re-reports checks
```

### Config

Setup and doctor share one local file, `.fgos/config.json`. `fgos setup`
fills in any default key missing from it; `fgos doctor` reports when it's
stale relative to the current defaults but never edits it itself.
Settings you've already customized are never overwritten, at any nesting
depth.

### Uninstall

`fgos uninstall` reverses `fgos setup`'s own wiring — unwiring the git
hooks path and reporting (never deleting) any shell-rc source line it
finds, since removing that line stays a manual, human step. It never
touches `.fgos/` data or config. Requires `--yes`; refuses with no side
effects otherwise.

```bash
fgos uninstall --yes
fgos uninstall --yes --remove-package   # also runs: npm uninstall -g forgent
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