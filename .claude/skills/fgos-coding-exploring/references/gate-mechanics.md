# Gate mechanics — full bash

The full detail behind SKILL.md's Gate section.

Run these as two SEPARATE tool calls, never pasted together as one script
— a worktree-isolated session's own isolation guard refuses a single call
combining a `git`-rooted command with a following `node .../fgos.mjs`
invocation. Resolve `root` first, read its printed value, then substitute
that literal path into the second call.

```bash
fgos gate-check "<item-id>" --gate contextApprove --artifact "docs/history/<feature>/CONTEXT.md"
```

`gate-check` wraps the engine's own auto-approve check behind the CLI's
own static imports — the CLI resolves its own import path against its own
file location, never the caller's cwd or repo root, which is what lets it
resolve correctly from any install shape (dev checkout, global npm
install, npx) with zero special-casing. Read the verb's
`data.canAutoApprove` field (`true`/`false`) from its JSON output.

Treat anything other than exactly `data.canAutoApprove === true` — `false`,
a non-zero exit, a malformed response — as `false`: fail closed, never
skip the question on a check that couldn't run cleanly.

Either branch below also records a structured approve record — separate
from, and in addition to, `fgos decision`'s free-text audit line:

```bash
fgos gate-approve "<item-id>" --gate contextApprove --actor <human|bypass> --verify "<item's current verify field>"
```

Read the verify value fresh right before this call (`fgos list --id
<item-id> --json`'s `data.work[id].verify`) — this skill does not design
a new verify command, per its own "do not research implementation" rule;
it only snapshots whatever verify the item already carries into the
structured record.

Immediately after that gate-approve record, in BOTH branches, this
session fires the `exploring`→`planning` engine transition itself — this
session is already the live soul that just did the real Socratic
reasoning, so it passes that verdict directly instead of leaving the
transition to a later blind `fgos discover` call or a fragile file-read
trust signal:

```bash
node "$root/bin/fgos.mjs" discover "<item-id>" --verdict clear --verify "<the same verify value just recorded via gate-approve>" --dir "$root"
```

## `true` branch

Skip the question. Post the non-question line `auto-approved: CONTEXT.md
(gate-bypass level <level>)`, log it:

```bash
node "$root/bin/fgos.mjs" decision --id "<item-id>" --text "auto-approved CONTEXT.md gate for <item-id> at level <level>" --rationale "gate-bypass level <level> permits auto-approval per the gate-bypass feature's own locked decisions (see docs/history/gate-bypass/CONTEXT.md)" --relation none --dir "$root"
```

record the approve (`fgos gate-approve <item-id> --gate contextApprove
--actor bypass --verify "..."`, per above), fire the `fgos discover
--verdict clear` call above, then continue straight to
`fgos-coding-planning`.

## `false` branch

Surface the locked decisions in plain language — what was decided, why it
can be trusted, what it costs if wrong — with CONTEXT.md linked, then ask
exactly: "Decisions locked. Approve CONTEXT.md before planning?"
CONTEXT.md is the source of truth for every downstream step; its decision
IDs are stable and cited, never silently reinterpreted. Once the person
approves, record it (`fgos gate-approve <item-id> --gate contextApprove
--actor human --verify "..."`, per above), fire the `fgos discover
--verdict clear` call above, then continue to `fgos-coding-planning`.
