---
authoritative_for: agy --dangerously-skip-permissions replacement, agy permission denylist vs allowlist, toolPermission always-proceed
---

# Why `agy` dispatch ended up with a denylist, not the allowlist it set out to build

`tsk-1xm` set out to replace `agy`'s (Antigravity CLI) unconditional
`--dangerously-skip-permissions` flag with a real capability **allowlist**
— the same "boundary enforced by capability, not by prose" principle
`tsk-2uf-2`'s worker contract already leaned on. Four rounds of live
research found the opposite mechanism was the one that actually works.

## What was assumed going in

`agy`'s own changelog documents a `permission.allow` schema in
`settings.json`, described as gating tool calls by pattern. The plan
(`docs/history/agy-permission-capability-allowlist/plan.md`) was built
around that: drop `--dangerously-skip-permissions`, add `--mode
accept-edits`, write a minimal `permission.allow` ruleset covering exactly
what a worker's contract needs (file read/write in its footprint, shell
verify, `git add`/`git commit`), scoped `global` (not `project`, since
`--new-project` makes project-scoped rules non-persistent across
dispatches).

## What four rounds of live proof actually found

- **Round 1** confirmed the schema is real and queryable
  (`agy -p "/permissions"`), and that dropping the skip-flag doesn't hang
  headless mode — it soft-denies with a named stderr reason.
- **Round 2** found `--mode accept-edits` alone doesn't cover
  `command`-type tool calls (shell commands) at all — every fgOS `agy`
  dispatch runs `git add`/`git commit`/verify, so a bare flag swap with no
  `permission.allow` entry would make every dispatch fail outright.
- **Round 3** tried the documented `permission.allow` schema against six
  rule-shape variants (colon-wildcard, `regex:` prefix, bare executable
  name, exact literal string) — **zero succeeded**. Every attempt still
  soft-denied identically.
- **Round 4** found the actual working key was a different, **plural**
  field (`permissions`, not `permission`) — confirmed real once `agy -p
  "/config"` echoed it back correctly. But acting on it revealed the real
  shape: a `toolPermission` mode field controls whether commands are
  gated at all. `"strict"` and the default `"request-review"` blanket-deny
  every command regardless of `permissions.allow` content — 0 successes
  across all 6 shapes tried under either mode. The only mode that lets
  commands run, `"always-proceed"`, runs **every** command by default
  (confirmed: an unlisted `whoami` probe succeeded unrestricted) — meaning
  `permissions.allow` is inert under it. What actually gates something is
  `permissions.deny`: a listed pattern is refused with a named reason,
  everything else proceeds.

**The mechanism is default-allow/explicit-deny, not default-deny/
explicit-allow.** This is a materially weaker security shape than the
original plan assumed — but still strictly better than the starting
point, which had zero boundary of any kind.

## What shipped

`.fgos/config.json`'s `agy-cli` executor no longer carries
`--dangerously-skip-permissions` — its live args are `-p {prompt} --mode
accept-edits --new-project --print-timeout 30m --model {model}`.
Separately, `src/setup/agy-permissions.mjs` provisions (via `fgos setup`/
`fgos doctor --fix`, fill-only — never touches an already-present key)
`~/.gemini/antigravity-cli/settings.json` with:

```json
{
  "toolPermission": "always-proceed",
  "permissions": {
    "deny": [
      "command(regex:^rm .*-rf)",
      "command(regex:^sudo )",
      "command(regex:^git push .*(--force|-f\\b))",
      "command(regex:^git reset .*--hard)",
      "command(regex:^git stash)",
      "command(regex:^curl )",
      "command(regex:^wget )"
    ]
  }
}
```

The deny patterns mirror this repo's own already-documented incident
history (`AGENTS.md`'s "never run a raw `git reset --hard`/`git stash`"
guidance) plus the other classes of irreversible or exfiltration-prone
commands a headless worker should never run unattended. A doctor check,
`agy-permissions-configured`, verifies this denylist is actually present.

## Why this doesn't need to be narrower

The per-item file-boundary question this item might otherwise have tried
to also solve is already owned by a separate, independent mechanism:
`footprintDiffHits` (`src/runner/frozen-judge.mjs`, D5 of `tsk-2uf`'s own
CONTEXT.md) flags any file touched outside an item's declared `footprint`
after the fact, at verify time, regardless of what the permission layer
did or didn't allow. `agy`'s denylist and fgOS's footprint check are
complementary, stacked layers — the denylist's job is only to replace
*unconditional* bypass with *some* real, machine-enforced gate against
genuinely dangerous operations, not to re-implement per-item scoping a
different mechanism already owns.

## Takeaway for the next provider-permission investigation

A vendor's changelog describing an "allowlist" is a claim about naming,
not about the actual default-allow/default-deny direction of the gate.
Confirming which direction a permission surface actually defaults to
requires a live negative-control probe — dispatch something *not* on the
list and check whether it's blocked or not (this is exactly what surfaced
`always-proceed`'s real behavior, via the `whoami` probe in Round 4). Take
the schema key names from changelog prose as a starting hypothesis only;
confirm the live `/config` echo before trusting a written rule is even
being read into the field you think it is.
