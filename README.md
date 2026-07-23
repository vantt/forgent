# Forgent

<!-- BEE:BACKLOG-BADGES:START -->
![backlog done](https://img.shields.io/badge/backlog%20done-62-brightgreen) ![backlog in-flight](https://img.shields.io/badge/backlog%20in--flight-0-blue) ![backlog proposed](https://img.shields.io/badge/backlog%20proposed-26-lightgrey)
<!-- BEE:BACKLOG-BADGES:END -->

**The Foundation for Generative Agents.**

Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch.

## Install

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