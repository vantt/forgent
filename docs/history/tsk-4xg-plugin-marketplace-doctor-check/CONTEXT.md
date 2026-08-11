# tsk-4xg — Claude Code plugin marketplace never wired into setup/doctor

## Feature boundary

`fgos setup`/`fgos doctor` never checks or fixes whether this repo's
Claude Code plugin marketplace (`.claude-plugin/marketplace.json`,
`fgOS` + `dogfood-fixture` plugins under `plugins/`) is registered and
installed. A project set up with `fgos setup` today ends up with no
`/fgOS:*` skills available in Claude Code, and `doctor` never flags the
gap. This item adds one new doctor check (+ fix) that closes that gap,
using the already-built extensible check/fix registry
(`registerCheck`/`registerFix`, `src/setup/registrations.mjs`, proven by
tsk-2cs/tsk-2qz per `tsk-3uj`'s 2026-08-03 audit) — it is a new consumer
of that registry, not new plumbing.

Out of scope: fixing the stray version mismatch observed on this dev
machine (`fgOS@fgos-plugins` installed at both `project` scope 1.0.0 and
`local` scope 1.1.0) — pre-existing state on one machine, not something
this check's contract needs to reconcile.

## Locked decisions

| ID | Decision |
|---|---|
| D1 | The new doctor check fails hard (red `fgos doctor`) when the fgOS Claude Code plugin marketplace/plugin is not installed — not advisory-only. |
| D2 | `fgos doctor --fix` auto-runs the `claude plugin marketplace add` / `claude plugin install` commands when the `claude` binary is present, rather than only printing them for the person to run by hand — this is the first doctor fix that mutates Claude Code's own config outside `.fgos/`/the repo, and the person accepted that trade-off explicitly. |
| D3 | The check/fix targets the marketplace by its GitHub source (`vantt/forgent`), not an absolute local path. Grounded in `package.json`'s `"files"` field: it ships `bin`, `src`, `README.md`, `LICENSE`, and a few `docs/` subpaths only — `plugins/` and `.claude-plugin/` are NOT in the npm package. A local-path marketplace add would only ever work from a dev-checkout of this repo (context 3 per `docs/distribution-vision.md` §2 trụ cột 6); it would silently fail for the actual npm-global-install target audience (`npm install -g github:vantt/forgent`, trụ cột 1). A GitHub source works uniformly regardless of which of the three install contexts (global/project/dev-checkout) invoked `doctor`. |

## Scout evidence

- `src/setup/registrations.mjs` — zero mention of "plugin" today; owns
  `DOCTOR_CHECKS`, `registerCheck`, `registerFix`, `CONFIG_DEFAULT_REGISTRATIONS`.
- `src/setup/checks.mjs` — thin re-export shim over `registrations.mjs`
  (a new check/fix never needs to touch this file, per its own header
  comment).
- `.claude-plugin/marketplace.json` — repo-root marketplace manifest,
  lists `fgOS` (`./plugins/fgOS`) and `dogfood-fixture`
  (`./plugins/dogfood-fixture`).
- `package.json` `"files"` — `["bin", "src", "README.md", "LICENSE",
  "docs/how-to", "docs/explanation", "docs/enduser-docs-index.json"]` —
  confirms `plugins/`/`.claude-plugin/` do not ship in the published
  npm package (grounds D3).
- `claude plugin marketplace --help` / `claude plugin --help` — confirms
  `claude plugin marketplace add <source>`, `claude plugin install
  <plugin>`, `claude plugin marketplace list`, `claude plugin list` are
  all scriptable, non-interactive CLI commands (no manual `/plugin`
  slash-command step required).
- `claude plugin marketplace list` / `claude plugin list` on this
  machine — `fgos-plugins` marketplace already added (Directory source,
  this repo), `fgOS@fgos-plugins` already installed at `project` scope
  (1.0.0) and `local` scope (1.1.0). Confirms the manual state this repo
  is already in, and that the same commands this check/fix would run are
  the real ones already used here.
- `docs/distribution-vision.md` §2 (7 trụ cột) + §6 (milestone roadmap,
  `tsk-4bc`/`tsk-3nx`/`tsk-4c05`/`tsk-3uj`/`tsk-2jc`) — the sibling vision
  for fgOS's OWN install/setup/doctor (npm distribution of the `fgos`
  binary itself). This item is a distinct, narrower gap (Claude Code
  plugin registration), not a duplicate of that vision or its milestones
  — none of `tsk-4bc`'s four targets name plugin/marketplace installation
  as their own subject (confirmed by reading `tsk-3uj`'s and `tsk-4bc`'s
  full descriptions during dependency-candidate scan at submit time).
- `docs/backlog.md` STR88/STR90 — existing known gaps about the
  `/fgOS:*` plugin's own verb coverage and `pick`'s shell-out shape;
  neither mentions marketplace/install wiring.
- `fgos tool query --capability impact-analysis --status present` →
  GitNexus registered, `status: "present"` — impact-analysis: full.

## Pinned terms

- "the plugin" in this item's title/description means the Claude Code
  plugin surface at `plugins/fgOS` (and `plugins/dogfood-fixture`),
  registered via `.claude-plugin/marketplace.json` — never the npm
  package (`fgos`/`fgos-runner` binaries), which is a separate
  distribution vehicle covered by `docs/distribution-vision.md`.

## Outstanding questions (deferred to planning)

- Exact check/fix implementation shape (what `claude` subcommand output
  the check parses to decide pass/fail, how the fix handles `claude`
  binary absent, whether it targets `project` scope, `local` scope, or
  both) is an implementation choice for `fgos-coding-planning`, not locked here.
- Whether `.fgos`/setup config needs a new config-default entry (vs. the
  check/fix being self-contained with no persisted config) is also left
  to planning — trụ cột 4's registry supports either shape.
