# Phase 12: Head-start use case and Identity registration at SessionStart

The use case behind the head verb. It is the same under any verb name (owner question 1), so it is not blocked.

## Inputs (read first)
- SM-D6, SM-D10, SM-D11 and the shaper note: in a pane the opening prompt is typed visibly into the composer as full
  text, never a pointer; a screenless host may pass it by argument or file.
- bind(): `src/runner/execution/bind.mjs` (how `fgos run` binds a CLI, provider, account, model from a tier and a persona;
  find the entry `fgos run` uses, `rg -n "export function bind" src/runner/execution`).
- Persona door from phase 3 (`renderPersonaSection`, `pinPersona` in `src/runner/agent-definitions.mjs`).
- Session Host client from phase 9 (`src/session-host/client.mjs`), Identity `head:` role from phase 6.
- Hooks: `scripts/fgos-session-start-hook.mjs`, `src/setup/agent-hooks.mjs`, `packages/distribution/contracts/agent-hooks.v1.json`,
  `.claude/settings.json` (hand-maintained here), `test/setup/agent-hooks.test.mjs`.

## Files this phase may write
`src/session-host/head-start.mjs`, `test/session-host/head-start.test.mjs`, `scripts/fgos-session-start-hook.mjs`,
`src/setup/agent-hooks.mjs`, `packages/distribution/contracts/agent-hooks.v1.json`, `test/setup/agent-hooks.test.mjs`,
`.claude/settings.json`.

## Steps
1. `startHeadSession({ persona, name, projectRoot, beside? })`: refuse a bad name; ask Identity whether a live session
   holds `head:<persona>-<name>`; if so, `front` it and return `{already: true}` (one live head per persona-name).
2. Otherwise bind() at the persona's tier (`runner.personas.<p>.tier`, else `defaults.tier`; no model in the persona),
   pin the persona with `pinPersona`, render the opening text (persona section + the skills line + the start ritual:
   read latest handoff if any, read the portfolio, say which pending question was resumed).
3. Place through the host port with host `terminal`, key `head-<persona>-<name>-<gen>`, display `{id: name, title: persona}`,
   env `FGOS_HEAD_ROLE=head:<persona>-<name>`, opening `{text, delivery: typed}`. The CLI command and arguments come from
   the bound executor's invocation, never hand-built; arguments reach the pane only through Terminal Control's quoted launch.
4. SessionStart hook: when `FGOS_HEAD_ROLE` is set, run `fgos identity session --register --role <it>`; silent on failure
   (the hook never blocks a session). Register the hook text through the agent-hooks contract (the install door) and
   mirror it in this repo's `.claude/settings.json`.
5. Owning test `test/session-host/head-start.test.mjs` with a fake host client and fake Identity: binds at `standard`,
   types full persona text (not a pointer), sets the role env, fronts instead of starting a second live head, refuses
   `direct`. Hook registration: extend `test/setup/agent-hooks.test.mjs` by one case.

## Verify
- `node --test test/session-host/head-start.test.mjs test/setup/agent-hooks.test.mjs`.
- Live (record output in the phase report): `node -e "import('./src/session-host/head-start.mjs').then(m=>m.startHeadSession({persona:'planner',name:'probe',projectRoot:process.cwd()}))"`
  opens a herdr tab with the persona typed visibly, and `fgos identity session` lists `head:planner-probe`; then retire it.

## Rollback
`git revert` the phase commit.
