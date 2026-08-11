# Plan: fgOS terminal pane rename + pick show-description (tsk-62x)

Decisions this plan honors: D1-D4, `docs/history/fgos-terminal-pane-rename/CONTEXT.md`.

## Mode

**standard** (2 flags):
- **external systems** — drives the `herdr` binary/socket (pane rename),
  a real external process this repo doesn't control.
- **public contracts** — adds a new `/fgOS:terminal` skill surface and
  changes the existing, dogfooded `/fgOS:pick` flow
  (`plugins/fgOS/skills/pick/SKILL.md`) other sessions already rely on.

Not high-risk: no auth, no data model, no `.fgos/` writes (D2), no
cross-platform claim beyond herdr's own Linux/macOS-first support (already
true of the whole cockpit per STR40), no removed validation.

## Approach

Two pieces, in this order (dependency-forced, not a graph tie to break —
`fgos graph --json` shows tsk-62x isolated with `deps: []`, no sibling
items to sequence against):

1. **`/fgOS:terminal` skill, `rename` verb** — must exist before piece 2
   can call it.
2. **`/fgOS:pick` upgrade** — calls piece 1's rename, then shows the
   claimed item's task description, inserted between pick's existing
   step 2 (claim) and step 3 (`EnterWorktree`), per D3.

This mirrors the split the item's own submitted text already proposed
("Tạo 2 task con") — the two pieces are real, independently verifiable
units, not an arbitrary re-split.

### Files touched

- `plugins/fgOS/skills/terminal/SKILL.md` — new skill definition
  (mirrors the shape of `plugins/fgOS/skills/pick/SKILL.md`: steps,
  literal absolute-path invocation of the helper script, fallback
  behavior).
- `plugins/fgOS/skills/terminal/rename.sh` — new helper script: gates on
  `test "${HERDR_ENV:-}" = 1` (reuses the existing detection pattern from
  `docs/operator-runbook-herdr-cockpit.md`), resolves `fg.ssid`
  (`BEE_SESSION_ID` env, else `resolveWriterIdentity()`'s value via
  `node -e` against `src/runner/session-identity.mjs`) and `a.ssid`
  (`CLAUDE_CODE_SESSION_ID` today; other agents deferred, see
  CONTEXT.md's outstanding questions), builds the `taskid | fg.ssid:<v> |
  a.ssid:<v>` label per D4 (dropping unresolved segments), and calls
  `herdr pane rename "${HERDR_PANE_ID}" "<label>"`. A real script file,
  not inline prose, so it has a syntax-checkable, runnable verify.
- `plugins/fgOS/skills/pick/SKILL.md` — insert one new step (between
  current step 2 "Claim the item" and step 3 "Hand the session to the
  claimed worktree"): call `plugins/fgOS/skills/terminal/rename.sh
  <claimed-id>`, then print the claimed item's title/description.

### Risk map

| Component | How risky | Proof point (for fgos-coding-validating) |
| --- | --- | --- |
| herdr absent/not managing this pane | low — must be a no-op, never block pick | run `rename.sh` with `HERDR_ENV` unset: exits 0, no `herdr` call attempted |
| `fg.ssid`/`a.ssid` resolution, unresolved segments | medium — several source env vars, D4's drop-not-"unknown" rule must hold | run `rename.sh` with only `CLAUDE_CODE_SESSION_ID` set (today's real case, confirmed in this very session's env) and with neither session env var set — confirm label drops the missing segment instead of printing "unknown" |
| pick step insertion order | low — prose-only edit, single file | read-through of updated `pick/SKILL.md`: new step sits strictly between claim and `EnterWorktree`, matching D3 |
| existing pick CLI behavior (claim/worktree) unaffected | low — no CLI code touched, only skill prose | `node --test test/cli/fgos.test.mjs` stays green (str83-fgos-slash-commands-4 block, line ~2816, already covers claim+worktree) |

## Concrete cases to prove (standard-depth)

- Outside herdr (`HERDR_ENV` unset): `rename.sh` is a silent no-op, pick's
  flow continues unchanged.
- Inside herdr, both session ids resolvable: label is
  `<taskid> | fg.ssid:<v> | a.ssid:<v>`.
- Inside herdr, `a.ssid` unresolvable (unknown agent tool): label drops
  that segment, still renames with what's known — never blocks pick.
- `herdr` binary present but the `pane rename` call itself errors (e.g.
  stale pane id): failure is swallowed, pick continues to its existing
  steps — same "don't fail, fall back" discipline `EnterWorktree`'s own
  fallback in pick step 3 already uses.
- Existing pick regression suite (`test/cli/fgos.test.mjs`,
  str83-fgos-slash-commands-4) stays green — no CLI-level behavior
  changed by this feature.

## Split

Two child items, both `parent: tsk-62x`:

1. **"tạo skill /fgOS:terminal với verb rename (herdr pane rename theo
   taskid/fg.ssid/a.ssid)"** — verify:
   `bash -n plugins/fgOS/skills/terminal/rename.sh && HERDR_ENV= plugins/fgOS/skills/terminal/rename.sh tsk-verify-noop; test $? -eq 0`
2. **"nâng cấp /fgOS:pick: gọi /fgOS:terminal rename + show task
   description trước EnterWorktree"** (deps: piece 1) — verify:
   `node --test test/cli/fgos.test.mjs`
   (regression proof for the CLI layer piece 2 must not disturb; the new
   prose-orchestration behavior itself is a skill-instruction change with
   no unit-testable surface in this repo — its real proof is a dogfood
   run of `/fgOS:pick` inside a herdr pane at `fgos-coding-validating`/execution
   time, not a scripted assertion).

## Execution

Both pieces have a working mechanical execute/verify path already (the
engine's own goal-check + `return`'s re-verify) — this plan does not
redesign that, only names the verify command each piece must satisfy.
