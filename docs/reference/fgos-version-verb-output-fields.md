---
type: reference
title: fgos version verb output fields
tags: [cli, version, doctor, install]
source_capture_ids: [tsk-2ej]
authoritative_for: fgos version CLI verb output shape and the cli-version-visible doctor check
---
# `fgos version` verb output fields

`fgos version` answers "which build is this?" without requiring any
`.fgos/` store to already exist — the question to ask *before* trusting
anything else about an install. It closes a real friction: telling a
stale globally-installed `fgos` binary apart from the current one used
to mean diffing an unknown-verb error message's usage line by hand,
because reading `node_modules` directly to check the installed version
is blocked by this repo's own scout-block hook.

## Invocation

```bash
fgos version --dir <root>
```

`touchesState: false`, `requiresExistingStore: false`,
`externalEffect: false`, `paginated: false` — safe to run against any
directory, with or without an initialized `.fgos/` store.

## Output shape

```json
{
  "packageVersion": "0.1.0",
  "gitCommit": "067d1f63",
  "verbs": ["add", "answer", "approve", "...", "version"]
}
```

| Field | Type | Meaning |
|---|---|---|
| `packageVersion` | string | `package.json`'s own `version` field for this install. |
| `gitCommit` | string \| `null` | The running build's git short SHA (`git rev-parse --short HEAD` from the CLI's own install directory), best-effort. `null` when not resolvable — e.g. a real npm tarball install with no `.git` — never thrown as an error. |
| `verbs` | string[] | The full verb list, read straight from `COMMAND_REGISTRY.map(e => e.name)` — the same single source of truth `fgos --help --json` already uses. |

## Why `verbs` matters more than it looks

Rather than parsing an unknown-verb error message to guess whether a
given install supports a verb, check membership directly:

```js
data.verbs.includes('plan')   // does this install know the current verb name?
data.verbs.includes('decompose') // does it still carry the legacy alias?
```

This is exactly the check that surfaced the bug this verb exists to
diagnose: a globally-installed build predating the `decompose` → `plan`
verb rename (`tsk-403`) listed `discover|decompose` in its unknown-verb
usage line with no `plan` verb at all, while the current checkout
carries both (`plan` current, `decompose` kept as a drain-only compat
alias).

## The paired doctor check: `cli-version-visible`

`fgos doctor` includes a `cli-version-visible` check
(`src/setup/registrations.mjs`) that calls the same version-resolving
logic `version`'s own handler uses — one shared function, so the verb and
the check can never drift from each other. It always passes on a working
install (the same "always green on a healthy build" shape
`node-version-and-git` already has); its value isn't the pass/fail, it's
that `fgos doctor`'s report now always prints the running build's
version/commit — the first thing to compare when a verb comes back
"unknown" on some other machine.

## What this deliberately doesn't solve

`fgos version`/`cli-version-visible` can only ever report on *themselves*
— the build actually running them. They cannot detect their own
staleness relative to a newer release, the same way no program can. A
full cross-package version-negotiation protocol (skills declaring a
required verb set, `doctor` cross-checking a *target* install against a
manifest) was named as a real, larger follow-on and explicitly left out
of scope — a bigger, separate product decision with its own open
questions (how would a skill declare its required verb set? where would
that manifest live relative to the npm package vs. the independently-
updatable Claude Code plugin?).

## Related

- `docs/history/fgos-global-install-stage-verb-skew/plan.md` — the full
  discovery and decision record this verb was built from
