---
framework: diataxis
mode: how-to
---
# How to get the fgOS Claude Code plugin installed via `fgos doctor`

Use this when `fgos doctor` reports the fgOS Claude Code plugin is not
registered or enabled, or when a freshly `fgos setup`-run project has no
`/fgOS:*` skills available in Claude Code even though `fgos setup`
completed cleanly.

## Before you start

A project set up with `fgos setup` previously did not get the Claude Code
plugin marketplace (`.claude-plugin/marketplace.json`, listing the
`fgOS` and `dogfood-fixture` plugins under `plugins/`) registered at
all — `fgos doctor` never checked for it, so the gap went unflagged. This
only affects the Claude Code plugin surface (the `/fgOS:*` skills you run
inside a Claude Code session) — it is unrelated to the `fgos`/`fgos-runner`
npm binaries, which install through the normal npm distribution path.

**`fgos setup` alone now closes this gap too.** `setup` runs every
registered doctor fix unconditionally as part of the same run — the
identical `runFixes()` call `doctor --fix` makes, with no separate
command and no confirmation prompt (consistent with `setup`'s existing
"acts and then reports" contract: it already never asked before writing
shell-rc lines or config defaults, so gating this one fix behind a prompt
would have been new, inconsistent behavior for this verb). A fresh
project that only ever runs `fgos setup` gets the plugin installed
automatically — the manual steps below are for confirming the state, or
for fixing it later without re-running all of `setup`.

## Steps

1. **Run the check.**

   ```
   fgos doctor
   ```

   A failing result looks like one of:

   ```
   "claude plugin marketplace list --json" failed to run or parse — run fgos doctor --fix
   "claude plugin list --json" failed to run or parse — run fgos doctor --fix
   fgOS Claude Code plugin not installed/enabled — run fgos doctor --fix
   ```

   If the `claude` CLI is not on `PATH` at all, the check reports itself
   not applicable rather than failing — there is nothing to fix in that
   case.

2. **Run the fix.**

   ```
   fgos doctor --fix
   ```

   This runs the same commands you would otherwise type by hand:

   ```
   claude plugin marketplace add vantt/forgent
   claude plugin install fgOS@fgos-plugins
   ```

   The marketplace is added by its GitHub source (`vantt/forgent`), not a
   local filesystem path — this works the same way whether you're running
   from a global npm install, a project-local install, or a dev checkout
   of this repo, since the published npm package does not ship
   `plugins/`/`.claude-plugin/` at all.

3. **Confirm it passed.**

   ```
   fgos doctor
   ```

   A passing result reads:

   ```
   Claude Code marketplace "fgos-plugins" configured, fgOS plugin enabled
   ```

## Why this is a hard failure, not just advisory

Without the plugin actually installed, none of the `/fgOS:*` skills are
available in a Claude Code session at all — there is no degraded mode to
fall back to. `fgos doctor` treats this the same as any other check whose
absence blocks real work, rather than as an optional nice-to-have.
