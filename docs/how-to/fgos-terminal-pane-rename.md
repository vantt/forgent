# How to: label a herdr pane with the claimed task from a chrome-only fgOS skill

Goal: give a `/fgOS:<verb>` skill a best-effort side effect against herdr
(labelling the current pane) without adding a new `fgos` CLI verb, when
the side effect never reads or writes `.fgos/` state.

Source item: `tsk-62x-1`, `docs/history/fgos-terminal-pane-rename/CONTEXT.md`
(D1-D4), implemented at `plugins/fgOS/skills/terminal/`.

## Recipe

1. **Skip the CLI verb entirely if the effect never touches `.fgos/`.**
   Every existing `/fgOS:<verb>` skill (`pick`, `ask`, `answer`, ...)
   wraps exactly one `fgos <verb>` CLI call because each one writes item
   state through CTR001's one-door-write. A herdr pane rename writes no
   fgOS state at all (STR40, `docs/operator-runbook-herdr-cockpit.md`:
   "herdr chỉ làm chrome") — so it gets its own skill directory
   (`plugins/fgOS/skills/terminal/`) with a plain bash helper script
   (`rename.sh`), never a command-registry entry.

2. **Gate on `HERDR_ENV`, never assume herdr is present.** Reuse the
   existing detection pattern from the operator cockpit:
   ```bash
   [ "${HERDR_ENV:-}" = "1" ] || exit 0
   command -v herdr >/dev/null 2>&1 || exit 0
   [ -n "${HERDR_PANE_ID:-}" ] || exit 0
   ```
   Every precondition failure is a silent no-op, `exit 0` — the whole
   point is that the calling skill (`/fgOS:pick`) never blocks on this.

3. **Watch out: two "session id" sources can silently collide.** This
   feature's label has two supposedly distinct segments — `fg.ssid`
   (fgOS/bee's own session identity, from `resolveWriterIdentity()` in
   `src/runner/session-identity.mjs`) and `a.ssid` (the coding agent
   tool's own native session id, e.g. `CLAUDE_CODE_SESSION_ID`). They
   look independent, but `resolveWriterIdentity()`'s own env-var fallback
   chain reads `CLAUDE_CODE_SESSION_ID` too when `BEE_SESSION_ID` is
   unset — so without a guard, `fg_ssid` silently comes back **equal to**
   `a_ssid`. Confirmed by direct test (mock `herdr`, `BEE_SESSION_ID`
   unset, `CLAUDE_CODE_SESSION_ID=649e49f0-...`):
   ```text
   MOCK herdr called with: pane rename w1:p1 tsk-62x-1 | fg.ssid:649e49f0-1ea5-412e-afe8-67ee40986a14 | a.ssid:649e49f0-1ea5-412e-afe8-67ee40986a14
   ```
   Fix: after resolving both values, drop the one that duplicates the
   other rather than showing the same id twice:
   ```bash
   if [ -n "$fg_ssid" ] && [ "$fg_ssid" = "$a_ssid" ]; then
     fg_ssid=""
   fi
   ```
   Re-run of the same scenario after the fix:
   ```text
   MOCK herdr called with: pane rename w1:p1 tsk-62x-1 | a.ssid:649e49f0-1ea5-412e-afe8-67ee40986a14
   ```
   And with a genuinely distinct `BEE_SESSION_ID=bee-abc123` set
   alongside `CLAUDE_CODE_SESSION_ID`, both segments show correctly:
   ```text
   MOCK herdr called with: pane rename w1:p1 tsk-62x-1 | fg.ssid:bee-abc123 | a.ssid:649e49f0-1ea5-412e-afe8-67ee40986a14
   ```
   The lesson generalizes beyond this feature: any time two "identity"
   fields are meant to read as independent evidence, check whether their
   *resolvers* share a fallback source before trusting that they'll
   actually differ in practice — a passing happy-path test with only one
   env var set will not catch this; it takes deliberately testing both
   env vars set at once.

4. **Cross the plugin-cache/repo-checkout path split explicitly.** An
   installed plugin's skill files run from a copied cache location, not
   this repo checkout — so a helper script that needs to `import()` a
   real repo module (here, `session-identity.mjs`, for the `fg.ssid`
   fallback) can't rely on a path relative to its own location. Pass the
   real project root in explicitly from the SKILL.md invocation line,
   which Claude Code substitutes with the real path regardless of where
   the skill markdown itself loaded from:
   ```bash
   bash ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/plugins/fgOS/skills/terminal/rename.sh "<task-id>" "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

## Real captured outcome (tsk-62x-1)

Predicted tier `light`, 0 deps, role `session`. Actual: `proposed`,
`passed: true`, `attempts: 1`, `aheadCount: 1` — matched the prediction;
the only real friction was the session-id collision above, caught by
testing rather than by review.
