# Phase 12: Head-start use case and Identity registration at SessionStart

<!-- Updated: Validation Session 1 - registration through the installed session-register hook row; role handover; placement lookup -->
The use case behind the head verb. It is the same under any verb name (owner question 1). Status `draft`: the hook
table `packages/distribution/rust/src/agent_hooks.rs` is also in the footprint of the ready plan `261117-1524`.

## Inputs (read first)
- SM-D6, SM-D10, SM-D11 and the shaper note: in a pane the opening prompt is typed visibly into the composer as full
  text, never a pointer; a screenless host may pass it by argument or file.
- bind(): `src/runner/execution/bind.mjs` (how `fgos run` binds a CLI, provider, account, model from a tier and a persona;
  find the entry `fgos run` uses, `rg -n "export function bind" src/runner/execution`).
- Persona door from phase 3 (`renderPersonaSection`, `pinPersona` in `src/runner/agent-definitions.mjs`).
- Session Host client from phase 9 (`src/session-host/client.mjs`), Identity `head:` role from phase 6.
- Hooks (validation): the install door is the Rust hook table `packages/distribution/rust/src/agent_hooks.rs`
  (`SESSION_REGISTER_ARGS` l.53, rows l.604-662), proved with `packages/distribution/rust/tests/goldens/agent-hooks-vectors.json`,
  which `test/setup/agent-hooks.test.mjs:1042` also replays against the Node mirror `src/setup/agent-hooks.mjs:200-224`.
  A `session-register` SessionStart row already exists for claude, codex and agy (`fgos identity session --register`;
  this repo's copy at `.claude/settings.json:181`). `scripts/fgos-session-start-hook.mjs` is this repository's own
  path-injection script, never installed in another project, so it is not the door (mission #1: head sessions run in
  every project fgOS is installed in).
- Identity role rules: a role held by a live session is refused unless `--take`, which moves it to the calling session
  only (`packages/identity/rust/src/directory.rs:384-420`).

## Files this phase may write
`src/session-host/head-start.mjs`, `test/session-host/head-start.test.mjs`, `packages/distribution/rust/src/agent_hooks.rs`,
`packages/distribution/rust/tests/goldens/agent-hooks-vectors.json`, `src/setup/agent-hooks.mjs`,
`packages/distribution/contracts/agent-hooks.v1.json`, `test/setup/agent-hooks.test.mjs`, `.claude/settings.json`.

## Steps
1. `startHeadSession({ persona, name, projectRoot, beside? })`: refuse a bad name; ask Identity whether a live session
   holds `head:<persona>-<name>`; if so, `front` it and return `{already: true}` (one live head per persona-name). To front
   it, the use case needs that session's placement: look the key up in Terminal Control's store first; only if no lookup by
   key prefix exists, keep the live key in the lineage folder (`.fgos/runtime/session-rotation/<persona>-<name>/placement.json`,
   atomic) and say why in the commit. Also refuse to start while a rotation of the same lineage holds its lock (phase 14).
2. Otherwise bind() at the persona's tier and turn the binding into `{command, args, env, trust}` through the seat
   preparation door phase 11 exports from `herdr-round.mjs` (account home, folder trust: without them the pane shows a
   trust or login screen), never a copy. bind() at the persona's tier (`runner.personas.<p>.tier`, else `defaults.tier`; no model in the persona),
   pin the persona with `pinPersona`, render the opening text (persona section + the skills line + the start ritual:
   read latest handoff if any, read the portfolio, say which pending question was resumed).
3. Place through the host port with host `terminal`, key `head-<persona>-<name>-<gen>`, display `{id: name, title: persona}`,
   env `FGOS_HEAD_ROLE=head:<persona>-<name>`, opening `{text, delivery: typed}`. The CLI command and arguments come from
   the bound executor's invocation, never hand-built; arguments reach the pane only through Terminal Control's quoted launch.
4. Registration extends the existing `session-register` row, it adds no second SessionStart hook: when `FGOS_HEAD_ROLE`
   is set the row passes `--role "$FGOS_HEAD_ROLE"`, and when that is refused because a live session holds the role (a
   rotation successor), it registers without the role; the role moves later (phase 14). Silent on failure as today.
   Change the Rust table, the Node mirror and the golden vectors in one commit, and this repo's `.claude/settings.json`
   by running the setup door, never by hand.
5. Owning test `test/session-host/head-start.test.mjs` with a fake host client and fake Identity: binds at `standard`,
   types full persona text (not a pointer), sets the role env, fronts instead of starting a second live head, refuses
   `direct`. Hook row: extend the golden vectors by one case (the Rust table test and `test/setup/agent-hooks.test.mjs`
   replay them); no second copy of the case.

## Verify
- `node --test test/session-host/head-start.test.mjs test/setup/agent-hooks.test.mjs`; `cargo test -p fgos-distribution`
  (crate name per `packages/distribution/rust/Cargo.toml`), clippy and the aarch64-apple-darwin check.
- Live precondition: plain `fgos` runs the activated release, which knows neither `fgos internal session-host` nor the
  `head:` role; run through `npm run fgos:dev` with `FGOS_HOST_BIN` set to the freshly built host, or stage and activate
  this tree on a scratch project first. Read registration back with `fgos identity session --json`, never assume it.
- Live (record output in the phase report): `node -e "import('./src/session-host/head-start.mjs').then(m=>m.startHeadSession({persona:'planner',name:'probe',projectRoot:process.cwd()}))"`
  opens a herdr tab with the persona typed visibly, and `fgos identity session` lists `head:planner-probe`; then retire it.

## Rollback
`git revert` the phase commit.
