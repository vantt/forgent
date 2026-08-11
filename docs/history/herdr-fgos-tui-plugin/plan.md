# herdr fgOS TUI plugin — plan

Item: `tsk-19y`. Decisions this plan builds on: `CONTEXT.md` D1-D5 (locked,
approved).

## Mode gate

Flags counted against the item:

| Flag | Applies? | Why |
|---|---|---|
| auth / authorization | no | no user identity or permission surface touched |
| data model | no | no fgOS schema change — pure consumer of existing `list`/`triage` output |
| audit/security | no | no credentials, no new attack surface beyond spawning a known local binary (already the pattern `herdr pane run` itself uses) |
| external systems | **yes** | integrates with herdr (third-party terminal multiplexer) as a first-class dependency — its plugin manifest schema, CLI, and socket API are a real external contract to honor |
| public contracts | no | D3 — internal-only, not published |
| cross-platform | no | targets this project's own operator machine; no committed Windows/macOS support |
| existing covered behavior | no | touches no existing tested module (`src/state/*`, `src/cli/*` untouched) |
| weak proof around area | no | new area, not an existing weakly-tested one |
| multi-domain | **yes** | a new Rust crate + TUI rendering + herdr manifest authoring + subprocess orchestration (`claude` launch) + fgOS-CLI-as-external-consumer, all at once |

2 flags, no hard-gate flag (no auth/data-loss/audit-security/external-payment-
provider/validation-removal) → **standard** mode. This also matches
"story-sized behavior → standard" independently: dashboard + one
orchestration action is more than a couple of files but has a clear,
boundable shape.

## Approach

**Language/stack:** Rust, using **ratatui** — not the user's own candidate
`frankentui`. Evidence: herdr itself (vendored at `upstreams/herdr/`) is
built on `ratatui = { version = "0.30", features = ["unstable-rendered-
line-info"] }` (`upstreams/herdr/Cargo.toml:33`, `crossterm = "0.29"` at
line 27) — the actual host application's own TUI stack, with a real,
in-repo, working reference to study widget/event-loop patterns from.
`frankentui` has no vendored precedent or in-repo evidence to compare
against. Rejected: `ftui` (used by `upstreams/beads-viewer-rust/Cargo.toml:
49`) — a different tool's choice, not the host application herdr's own.
This is an execution-time detail, not a re-opening of any `CONTEXT.md`
decision — no D-ID covers language/library.

**Rust vs. Node, weighed explicitly (`fgos-coding-validating` flagged this as
missing from the first draft):** a Node-based plugin was a real smaller
alternative — herdr accepts any argv-launchable program as a plugin
(`plugins.mdx`), Node is already this repo's own language, and per decision
`0014` (`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md:57`) a
same-process **"TUI local"** is explicitly allowed to link the fgOS core
lib directly — skipping the subprocess-spawn-plus-JSON-parse a Rust binary
is structurally required to do. Weighed against that: the ratatui-precedent
argument above, plus the user's own original stated preference ("vì herdr
là rust nên nên viết rust"). Presented to the user directly with both sides
named; **decision: keep Rust + ratatui**. The CLI-JSON path Rust is left
with is not a consolation prize — it is the same durable, versioned
contract decision `0014` designed for every non-same-process consumer
(`fgos triage --json`/`fgos list --json`, already relied on by
`herdr-cockpit-notify.mjs`), so the cost of not linking the lib directly is
low in practice.

**Data path:** the plugin binary is a separate OS process (Rust), so per
`CONTEXT.md`'s cited decision 0014, it talks to fgOS only through the CLI —
same external-consumer shape `scripts/herdr-cockpit-notify.mjs` already
uses (`spawnSync(... 'fgos', ['list', '--json'])`), just from Rust instead
of Node: poll `fgos triage --json` for the impact-sorted work list (D5) and
`fgos list --all --json` (filtered to `status: doing`) for the in-process
list (D4). Same 5s poll cadence as the existing cockpit pane — a proven
interval, not something to re-derive.

**Manifest:** `herdr-plugin.toml` with one `[[panes]]` entry (the
dashboard, `placement = "overlay"`, per `upstreams/herdr/website/src/
content/docs/plugins.mdx`'s example) and one `[[actions]]` entry (`pick`,
`contexts = ["workspace"]` or whatever context the selected-row action
needs — confirmed at execution time against herdr's own context enum).
Registered locally per D3 via `herdr plugin link <path>` (a real herdr CLI
subcommand — confirmed at `upstreams/herdr/src/cli/plugin.rs:28`), not
`install` (that path is for remote/marketplace sources, out of scope per D3).

**Pick action:** the manifest's `pick` action shells out to herdr's own
pane-creation surface (`HERDR_BIN_PATH ... pane ...`, the same "herdr is
chrome" boundary STR40 already established) to open a new pane, then
launches `claude` in it with the claimed id piped in as the initial prompt
(`/fgOS:pick <id>`) — mirroring exactly the flow this planning session's
own `/fgOS:pick` skill just ran by hand (claim → `EnterWorktree` →
`fgos-routing`). The action never calls `fgos pick` itself directly; it
only opens the door a person would open by typing the slash command,
consistent with D4/STR40's "never make herdr (or a plugin) act as a second
decision-maker" spirit.

**Rejected alternative:** extending `scripts/herdr-cockpit-notify.mjs`'s
existing status-line output instead of building an installable plugin —
rejected per D2 (this item ships an independent, actually-installable
`herdr-plugin.toml` package; the existing script stays untouched).

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| fgOS-CLI polling + parse (triage/list JSON → sorted rows) | Low | Unit test against a fixture JSON response asserting the parsed row order matches D5's `rankImpact` order byte-for-byte, and that `status: doing` rows populate the in-process list |
| Herdr manifest authoring + local link | Medium — first plugin manifest ever written in this repo, no local precedent to copy | `herdr plugin link <path>` (`upstreams/herdr/src/cli/plugin.rs:28`) exits 0 and `herdr plugin list --json` shows the plugin registered and enabled |
| TUI rendering (ratatui) of the two lists | Low | Reference implementation exists in-repo (`upstreams/herdr` itself); a smoke test rendering against a fixture terminal backend (ratatui's own `TestBackend`) without panicking |
| `pick` action subprocess orchestration (pane open → `claude` launch → slash-command injection) | Medium-High — spawns an interactive external program from inside a plugin action; wrong argv or pane targeting could open a broken/empty pane instead of a working session | A stubbed/mocked invocation test asserting the exact pane-creation + `claude` + `/fgOS:pick <id>` argv shape, without requiring a live herdr session in CI; a manual one-time smoke run in a real herdr session before calling the child item done |

## Shape / split

Reshaped per D6 (user steer: first slice is mock-UI-only, no real data)
into **three** child items, each carrying `parent: tsk-19y` — piece 1 is
now smaller/isolated than the original two-piece split had it:

1. **"Herdr plugin scaffold + mock/static dashboard TUI (no real data)"**
   Proves only the plumbing: `herdr-plugin.toml` manifest, `herdr plugin
   link`, a `[[panes]]` entry that launches the ratatui binary, and the
   binary rendering a dashboard with fake/hardcoded rows (no `fgos`
   subprocess call at all yet). This is the whole first deliverable per
   D6 — deliberately smaller than a full dashboard.
   Mode for this piece alone: only 1 flag applies (external systems) —
   **tiny/small**, not standard; no fgOS-CLI consumption or ranking logic
   exists yet to make it multi-domain.
   Verify: `cargo build --release --manifest-path herdr-plugin/
   Cargo.toml` succeeds, a rendering smoke test against ratatui's own
   `TestBackend` doesn't panic, and `herdr plugin link <path> && herdr
   plugin list --json` shows it registered and enabled. No dependency on
   pieces 2 or 3.

2. **"Wire real fgOS data into the dashboard (impact sort + in-process
   list)"**
   Replaces piece 1's mock rows with real polling: `fgos triage --json`
   for the impact-sorted list (D5) and `fgos list --all --json` filtered
   to `status: doing` for the in-process list (D4). Depends on piece 1
   (the rendering/manifest/link plumbing must already work before wiring
   real data into it).
   Verify: `cargo test` in the crate — the fixture-based ordering/parse
   tests from the risk map (byte-for-byte match against D5's `rankImpact`
   order, correct `doing`-only filtering for the in-process list).

3. **"Pick orchestration action (dashboard row → new pane → claude →
   `/fgOS:pick <id>`)"**
   Depends on piece 2 (needs a working dashboard with real, selectable
   item ids to trigger the action from — there is nothing meaningful to
   "pick" against mock rows).
   Verify: the stubbed argv-shape test from the risk map passing, plus one
   manual smoke run in a real herdr session confirmed by whoever executes
   this child.

Not split out as a fourth item, per D1: merge/dispatch orchestration —
explicitly deferred to a future item, not sketched here at all.

`fgos discover tsk-19y` (the engine's own decompose judgment, not this
plan) is what actually creates these as real items with real ids and wires
the `parent`/dependency between them — this plan only sketches the shape
it should find when it reads this file.
