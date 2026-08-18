# Add a stateful fgOS verb-group with a local status overlay

A recipe for porting a mutating, multi-verb capability into fgOS — grounded
in `tsk-1dj`'s `fgos tool register/check/query/remove` port of
repository-harness's tool-registry-capability
(`docs/distillery/sources/repository-harness.md#tool-registry-capability`).

> **Superseded (tsk-in1-1 D1):** the worked example's own `register`/
> `remove` verbs (event-log-backed, sections 2/5/6 below) were retired — a
> tool provider is now declared directly in `runner.executors.<id>`
> (`.fgos/config.json`), config-edited, never through the event log. The
> general lessons in sections 1 (team-decision vs per-machine-fact), 3
> (scan-not-shell presence), 4 (doctor posture check), and 7 (test layers)
> still hold; only the CONCRETE code in sections 2/5/6 is now historical,
> not something a new port should copy verbatim. Current shape: `docs/
> reference/forgentx-tool-registry-configuration.md`.

## 1. Split "team decision" from "fact about this machine" before writing any code

The registry's own header comment states the split this whole recipe hinges
on:

> "The local status overlay (`readLocalStatus`/`writeLocalStatus`/
> `probeTool`) is a SEPARATE, deliberately non-event-sourced concern (per
> docs/history/tool-registry-capability-port/CONTEXT.md's pinned
> "registered vs present" term): `tool check`'s result is a fact about
> *this machine*, not a team decision, so it never goes through
> `.fgos/events.jsonl` — it lives in one local, gitignored file beside it"
> (`src/state/tool-registry.mjs`)

Locked in `docs/history/tool-registry-capability-port/CONTEXT.md`:

> "**Registered vs present**: `register`/`remove` are team decisions
> (event-log, `view.tools`); `check`'s resulting `status` (`present` /
> `missing` / `unknown`) is a fact about *this machine*, stored locally
> and gitignored, never folded into the shared event-log."

Concretely: `register`/`remove` go through the event log (`tool.register`/
`tool.remove` events, folded into `view.tools`); `check` writes only to
`.fgos/tool-status.local.json`, added to `.gitignore` in the same change.

## 2. Keep validation pure and separate from the write door

`validateToolRegistration`/`normalizeCapability` in `src/state/tool-
registry.mjs` never touch `fs` — they decide, never write, mirroring how
`work.mjs`'s `validateWork` stays pure next to `store.mjs`'s write door.
The actual event-log write lives in `store.mjs`:

```js
export function registerTool(dir, fields) {
  const { logPath } = paths(dir);
  const event = withEventsLock(logPath, () => {
    const before = rebuildView(logPath);
    const existingNames = Object.keys(before.tools ?? {});
    const record = validateToolRegistration(fields, existingNames); // ToolRegistryError: validation
    return appendEventLocked(logPath, { type: 'tool.register', payload: record });
  });
  const view = refreshView(dir);
  return { event, view };
}
```

Both `registerTool` and `removeTool` read the current view fresh from the
log *inside the held lock* before deciding — the same existence-check-
before-append discipline `addWork` already uses, so two processes racing a
`--name` never both succeed.

## 3. Resolve presence by scanning disk, never by shelling out

For `mcp`/`skill` kinds, presence can't be checked via PATH lookup (they're
never on PATH per the deep-dive's own "Cơ chế" section), so those two kinds
require a `--scan` target and get checked by scanning a path on disk
instead. For PATH-checkable kinds, resolution is done by hand rather than
shelling out:

> "PATH resolution done by hand (fs.accessSync per PATH entry) rather than
> shelling out to `command -v`/`where` — avoids building a shell string out
> of a registered tool's own `command` field entirely, never a shell
> injection surface." (`src/state/tool-registry.mjs`)

This matters because a registered tool's `command` field is user-supplied
data — never safe to splice into a shell invocation.

## 4. Add a doctor check that reports posture, never fails on an empty registry

`src/setup/checks.mjs` adds one `DOCTOR_CHECKS` entry
(`tool-registry-configured`) that always returns `passed: true`; only the
message carries posture (`inactive` / `degraded` / `full`):

```js
// tsk-1dj (tool-registry-capability port), CONTEXT.md D1: reports the tool
// registry's posture (inactive/degraded/full), never a hard failure — an
// empty or partially-present registry is never itself a problem (the core
// "absent capability = clean skip" contract this whole item ports), so
// `passed` is always `true` here; only the message carries the posture.
```

This follows the "add-through-not-alongside" doctrine already settled at
`docs/distillery/porting-log.md:86` — a new capability gets folded into the
existing `DOCTOR_CHECKS` array rather than a parallel check mechanism.

## 5. Port the full enum, don't trim it to today's known users

`docs/history/tool-registry-capability-port/CONTEXT.md` D2 locked porting
repository-harness's full 5-value `kind` set (`cli`/`binary`/`mcp`/`skill`/
`http`) unchanged, reasoning: "Future providers (a `skill`-kind or
`http`-kind capability provider) register without a schema change later;
validation cost is the same either way."

## 6. Pre-seed real data instead of shipping an empty registry, if a concrete consumer already exists

D3 in the same CONTEXT.md: the item pre-seeds the `impact-analysis`
capability and registers `gitnexus` (kind `mcp`, scan target `.gitnexus`,
per `AGENTS.md`'s own reference to `.gitnexus/run.cjs`) as part of the
port's own deliverable, absorbing a job a sibling item had previously
scoped elsewhere. Locked consequence, not itself decided in that item: once
the port lands, the sibling item's stated job is already done, and its own
disposition is left for whoever reads it next — not silently resolved.

## 7. Test at both layers, plus the fold path

- Pure logic: `test/state/tool-registry.test.mjs` (validation,
  normalization, kind/scan-required rules).
- Event-log fold: `test/state/replay.test.mjs` gets cases for
  `foldEvents` folding `tool.register` into `view.tools` keyed by name, and
  `tool.remove` deleting the keyed entry — a full-record overwrite on
  re-register under the same name, never a merge with the prior
  registration.
- CLI surface: `test/cli/fgos-tool.test.mjs` covers register/check/query/
  remove including the "absent capability is a clean skip, never a
  failure" contract (a missing `check` target still exits `0`).
- Doctor check: `test/setup/checks.test.mjs` extended for the new
  `DOCTOR_CHECKS` entry.

## Iron Law note

This kind of change touches `bin/fgos.mjs` to add the new verb's dispatch
case, which trips the Iron Law's self-modifying-module gate
(`src/evolve/iron-law.mjs`'s `MODULE_RULES`). Capture the failing-test-first
proof (tests red before the implementation, green after) in
`docs/history/<id>/iron-law-evidence.md` before returning the item — see
`docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` for the
contract shape.
