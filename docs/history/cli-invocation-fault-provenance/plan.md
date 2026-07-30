# plan.md — CLI invocation-fault provenance

Item: `tsk-5z0`. Stage when written: `decompose` (shaping).
Locked decisions: `CONTEXT.md` D1–D5 — cited, never reopened here.

## Mode: high-risk

Flags counted — **4 apply**, one of them a hard gate:

| Flag | Applies | Why |
|---|---|---|
| audit/security | **yes (hard gate)** | The deliverable *is* an audit trail, and D3 captures raw argv. Any `--text`/`--rationale` payload of a malformed call lands in a plaintext file. |
| data model | **yes** | D2 introduces a new persisted record schema under `.fgos/` that later readers depend on. |
| public contracts | **yes** | `bin/fgos.mjs` `main()` is the single CLI door for every verb and every skill that shells out. D4 requires exit codes and stderr text stay byte-identical, so every edit sits on a public surface under a must-not-regress constraint. |
| existing covered behavior | **yes** | `test/cli/fgos.test.mjs` already asserts on this exact code region (5 assertions matching the store-guard / `.fgos/ not found` / warning paths). |
| auth | no | — |
| authorization | no | — |
| external systems | no | Nothing outside the local filesystem. |
| cross-platform | no | `node:fs` + one `git rev-parse`, both already used on this path. |
| weak proof around the area | no | The area has real coverage (tsk-4fu-2, tsk-56t both landed with tests). |
| multi-domain | no | `coding` only. |

4 flags + a hard gate → **high-risk**, per the mechanical rule.

Why a smaller mode would not honestly cover this: `small`/`standard` would not
carry a required proof point for either of the two things that actually cost
something if wrong — (a) argv content reaching a plaintext log, and (b) a
regression in exit codes or stderr text that every fgOS skill shells out
against. Both need proving at `fgos-validating`, not asserting here.

## Approach

Add one classifier + writer, invoked from the single existing failure handler.
Nothing else changes.

1. **Classify the fault before recording it (honors D1).** `main()`'s catch is
   the only failure handler, but it sees in-handler business refusals and
   pre-handler input faults through the same `StoreError('validation', ...)`
   shape — D1 records only the latter. The classifier therefore keys off
   *where* the fault was raised, not off the message text: the pre-handler
   region in `main()` is already explicit and small (unknown verb, the
   `requiresExistingStore` refusal, the `init`-inside-worktree refusal, arg
   parsing) and sits above `runVerb`. Faults raised at or below `runVerb` are
   business refusals and are never recorded.
   - Rejected: string-matching `err.message` to decide the class. It would
     couple the log to 73 hand-written message strings and silently
     misclassify the moment one is reworded.
   - Rejected: consulting the registry's `required` to decide the class.
     That is enforcement, which D4 forbids.
2. **Resolve the destination (honors D2, D5).** Prefer the resolved `dir`'s
   `.fgos/` when it exists and cwd is the main checkout. Otherwise resolve the
   main checkout via `git rev-parse --path-format=absolute --git-common-dir`
   and write there. Never create `.fgos/` in a worktree — the exact hazard
   `tsk-4fu-2`'s guard and ADR0020 exist to close. No git repo at all → no
   destination, stderr-only.
3. **Write the record (honors D3).** Append `{writer, argv, cwd, verb, faultClass,
   message, timestamp}` where `writer` is `resolveWriterIdentity()`'s
   `{id, source}`. Append-only, one JSON object per line, never `events.jsonl`.
4. **Keep the observable surface identical (honors D4).** The stderr line and
   `process.exitCode` assignment stay exactly as they are; the recording call
   is additive and must never throw into the caller's path — a failed record
   write is swallowed, because an observability layer that turns a clean
   exit-4 into an unexpected exit-1 is worse than no layer.

### Ordering input from the graph

`fgos graph --json`: `tsk-5z0` is its own **size-1 component**, absent from
`criticalPath` (`depth 10`, rooted at `tsk-4vo`) and absent from `topUnblock`
(led by `tsk-3p1`, unblocks 3). No follow-on work depends on it, so ordering
here is internal only and no piece of it buys cross-item leverage. Internal
order is forced by dependency anyway: classifier → destination resolver →
writer → wiring in `main()` → tests.

### Risk map

| Component | Risk | What would prove it |
|---|---|---|
| argv capture reaching a plaintext log (D3) | **high** | Enumerate what real callers actually pass. `.fgos/` is gitignored and local, which bounds exposure but does not eliminate it. Proof at validating: confirm whether any current caller passes a credential-shaped value, and whether a malformed call can carry one. |
| `main()` catch edits vs. byte-identical exit codes/stderr (D4) | **high** | The 5 existing assertions in `test/cli/fgos.test.mjs` must pass unchanged, with no edits to them. Proof at validating: they are genuinely assertions on this path, not adjacent. |
| new module's layer position | **medium** | A module under `src/cli/` importing `src/runner/session-identity.mjs` may violate `docs/architecture-manifest.json`'s layering, which `test/architecture.test.mjs` enforces. Proof at validating: run that test against a stub import before building. |
| destination resolution in a non-git dir (D5) | **medium** | `git rev-parse` fails there; the swallow path must hold. Proof at validating: the fallback is genuinely reachable and silent. |
| unbounded log growth | **low** | Append-only with no rotation. Faults are rare by nature; revisit only if volume proves otherwise. |

### Files likely touched

- `src/cli/invocation-fault-log.mjs` — new: classifier + destination resolver + writer.
- `bin/fgos.mjs` — `main()`: one call in the catch; no change to the two existing statements.
- `test/cli/` — new assertions: fault recorded, business refusal *not* recorded, no write to `events.jsonl`, exit codes unchanged, worktree cwd never gains `.fgos/`.
- `docs/specs/` — one note on the new log, only if the spec already documents `.fgos/` contents.

## Cases worth proving against

- **Empty/boundary**: `fgos` with no verb at all; a verb with no flags; `--dir ""`.
- **Must not regress**: `.fgos/ not found` refusal still exits 4 with identical text; the `STORE_MISSING_WARNING_VERBS` stderr warning still fires unchanged; `fgos init` inside a worktree still refuses.
- **Correct non-recording**: `fgos pick <nonexistent-id>` (the exact business refusal hit while claiming this item) records nothing.
- **Concurrent access**: two sessions faulting at once append without interleaving a partial line.
- **Partial failure**: destination unwritable (read-only dir) — stderr and exit code stay identical, nothing thrown.
- **Worktree**: faulting from inside a linked worktree writes to the main checkout's store and leaves no `.fgos/` in the worktree.

## Split: none

One honest piece of work: one new module, one wiring site, one test group. No
candidate sub-piece is independently shippable — a classifier with no writer
records nothing, a writer with no classifier violates D1. `fgos graph
--what-if` per candidate is moot here: the item has no deps and no children, so
every candidate yields the same unchanged `topUnblock`/`criticalPath` shown
above.

## Verify

```
node --test test/cli/fgos.test.mjs && node --test test/architecture.test.mjs && npm test
```

Narrowest-first, then the full suite because `bin/fgos.mjs`'s failure handler is
shared by every verb the suite exercises.

The item's `verify` field currently holds the discovery judge's auto-generated
string, which references a nonexistent `.fgos/run.cjs` and would never pass.
This plan replaces it with the command above.
