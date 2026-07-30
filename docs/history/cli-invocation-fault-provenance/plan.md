# plan.md — CLI invocation-fault provenance

Item: `tsk-5z0`. Stage when written: `decompose` (shaping).
Locked decisions: `CONTEXT.md` D1–D5 — cited, never reopened here.

**Revision 2**, after `fgos-validating` returned `NOT READY`. What changed is
recorded in "Revision after the reality check" at the end; the mode, the
approach, and the split are unchanged.

## Mode: high-risk

Flags counted — **4 apply**, one of them a hard gate:

| Flag | Applies | Why |
|---|---|---|
| audit/security | **yes (hard gate)** | The deliverable *is* an audit trail, and D3 captures raw argv. Any `--text`/`--rationale` payload of a malformed call lands in a plaintext file. |
| data model | **yes** | D2 introduces a new persisted record schema under `.fgos/` that later readers depend on. |
| public contracts | **yes** | `bin/fgos.mjs` `main()` is the single CLI door for every verb and every skill that shells out. D4 requires exit codes and stderr text stay byte-identical, so every edit sits on a public surface under a must-not-regress constraint. |
| existing covered behavior | **yes** | `test/cli/fgos.test.mjs` already asserts on this exact code region — see the proof-surface row below for the real assertions. |
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
against. Both need proving at `fgos-validating`, not asserting here. The
reality check earning a `NOT READY` on exactly (a) is this mode doing its job.

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
3. **Keep the log out of git (P1, new in revision 2).** Add
   `.fgos/invocation-faults.jsonl` to `.gitignore` **in the same change that
   creates the writer**, never as a follow-up. `.gitignore` does not ignore
   `.fgos/` wholesale — it lists `.fgos/state.json`, `.fgos/logs/`,
   `.fgos/sessions.json`, `.fgos/*.lock`, and `events.jsonl` is deliberately
   tracked. Without this line the new log is tracked by default and every
   recorded argv is committed and pushed. Precedent for ignoring it:
   `state.json` and `logs/` are already ignored as local-only derived data,
   which is exactly what this log is.
4. **Write the record (honors D3).** Append `{writer, argv, cwd, verb, faultClass,
   message, timestamp}` where `writer` is `resolveWriterIdentity()`'s
   `{id, source}`. Append-only, one JSON object per line, never `events.jsonl`.
5. **Declare the module's layer explicitly (P2, new in revision 2).** The new
   module goes in `src/cli/` and must be declared **`infra`** in
   `docs/architecture-manifest.json`, not `kernel`. Layer is per-file, not
   per-directory: its sibling `src/cli/command-registry.mjs` is `kernel(4)`,
   and `kernel` may import only `kernel` — a kernel-declared module could not
   import `src/runner/session-identity.mjs`, which is `infra(2)`. Declared
   `infra`, the import is same-rank and legal. The manifest row is mandatory
   regardless of layer: `test/architecture.test.mjs`'s `đủ sổ` test asserts a
   one-to-one match between `.mjs` files on disk and manifest rows, so a new
   file with no row turns it red.
6. **Keep the observable surface identical (honors D4).** The stderr line and
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
writer → `.gitignore` + manifest row → wiring in `main()` → tests.

### Risk map

| Component | Risk | What would prove it |
|---|---|---|
| argv capture reaching a plaintext log (D3) | **high** | Confirm `.gitignore` carries the new log's path, so recorded argv never enters git history. Residual after that: a local plaintext file readable by anything with filesystem access — bounded, not eliminated, and accepted (see the residual note below). Proof at validating: read `.gitignore` and confirm `git status` does not offer the log. |
| `main()` catch edits vs. byte-identical exit codes/stderr (D4) | **high** | `test/cli/fgos.test.mjs:459` must pass unedited: it asserts exit 4, `/\.fgos\/ not found/`, and *"the refused verb must not create .fgos/ as a side effect"*. Plus the worktree/`--dir` tests at lines 181, 191, 295, 304, 312, 321 and the `init`-in-worktree refusal at 469. Proof at validating: those are assertions on this path, and none are modified. |
| new module's layer position | **medium** | Resolved to a determinate constraint (P2 above): declare `infra`, add the manifest row. Proof at validating: `node --test test/architecture.test.mjs` green with the row present. |
| destination resolution in a non-git dir (D5) | **medium** | `git rev-parse` fails there; the swallow path must hold. Proof at validating: the fallback is genuinely reachable and silent, and `fgos.test.mjs:459`'s `rawTmpCwd()` case still passes. |
| unbounded log growth | **low** | Append-only with no rotation. Faults are rare by nature; revisit only if volume proves otherwise. |

**Residual exposure, stated plainly.** With P1, argv never enters git history.
What remains is a local file under `.fgos/` holding whatever flags a malformed
call carried. Redacting argv values is *not* planned: D3 locks provenance to
free signals captured as-is, and a redactor would need a secret-shaped-value
heuristic — new machinery, new failure mode, on a path that must never throw.
If a caller is ever found to pass a credential through `fgos`, that is its own
item, not a redactor bolted onto this one.

### Files likely touched

- `src/cli/invocation-fault-log.mjs` — new: classifier + destination resolver + writer.
- `docs/architecture-manifest.json` — new row for the above, layer `infra` (P2, mandatory).
- `.gitignore` — one line for the new log (P1, mandatory, same change).
- `bin/fgos.mjs` — `main()`: one call in the catch; no change to the two existing statements.
- `test/cli/` — new assertions: fault recorded, business refusal *not* recorded, no write to `events.jsonl`, exit codes unchanged, worktree cwd never gains `.fgos/`, log path is git-ignored.
- `docs/specs/` — one note on the new log, only if the spec already documents `.fgos/` contents.

## Cases worth proving against

- **Empty/boundary**: `fgos` with no verb at all; a verb with no flags; `--dir ""`.
- **Must not regress**: `.fgos/ not found` refusal still exits 4 with identical text; the `STORE_MISSING_WARNING_VERBS` stderr warning still fires unchanged; `fgos init` inside a worktree still refuses.
- **Correct non-recording**: `fgos pick <nonexistent-id>` (the exact business refusal hit while claiming this item) records nothing.
- **Not tracked**: after a fault is recorded, `git status --porcelain` shows nothing for the log path.
- **Concurrent access**: two sessions faulting at once append without interleaving a partial line.
- **Partial failure**: destination unwritable (read-only dir) — stderr and exit code stay identical, nothing thrown.
- **Worktree**: faulting from inside a linked worktree writes to the main checkout's store and leaves no `.fgos/` in the worktree.

## Split: none

One honest piece of work: one new module, one wiring site, one test group, plus
the two mandatory one-line declarations (P1, P2). No candidate sub-piece is
independently shippable — a classifier with no writer records nothing, a writer
with no classifier violates D1, and a writer without P1 leaks argv into git.
`fgos graph --what-if` per candidate is moot here: the item has no deps and no
children, so every candidate yields the same unchanged
`topUnblock`/`criticalPath` shown above.

## Verify

```
node --test test/cli/fgos.test.mjs && node --test test/architecture.test.mjs && npm test
```

Narrowest-first, then the full suite because `bin/fgos.mjs`'s failure handler is
shared by every verb the suite exercises. `test/architecture.test.mjs` is in the
command specifically because of P2.

## Revision after the reality check

`fgos-validating` returned `NOT READY - RETURN TO PLANNING` on the Assumptions
dimension. Three things changed here; no locked decision was reopened.

1. **Disproven assumption, now a mandatory step.** Revision 1's risk map claimed
   "`.fgos/` is gitignored and local, which bounds exposure". False: `.gitignore`
   ignores only `state.json`, `logs/`, `sessions.json`, `*.lock`, and
   `events.jsonl` is tracked on purpose. The mitigation is now P1, an explicit
   step in the approach and a mandatory file in the touch list — not an
   assumption. This is the substantive change and the reason a second gate
   approval is being asked for.
2. **Layering downgraded from open risk to determinate constraint.** P2 records
   the resolution: per-file layer declaration, `infra` not `kernel`, plus the
   mandatory manifest row.
3. **Proof surface corrected.** Revision 1 said "5 assertions"; that counted
   grep hits, four of which were comments. The real coverage is stronger and is
   now cited by line number, including the one assertion that already enforces
   D5's "never create `.fgos/` as a side effect".
