# plan.md — CLI invocation-fault provenance

Item: `tsk-5z0`. Stage when written: `decompose` (shaping).
Locked decisions: `CONTEXT.md` D1–D5 — cited, never reopened here.

**Revision 4.** Revision 2 answered the first `NOT READY`, revision 3 added
in-process visibility (**D6**), and revision 4 answers the second `NOT READY` by
narrowing the recordable scope to what the failure handler can actually observe
(**D7**). All three are in "Revision history" at the end. Mode unchanged.

## Mode: high-risk

Flags counted — **4 apply**, one of them a hard gate:

| Flag | Applies | Why |
|---|---|---|
| audit/security | **yes (hard gate)** | The deliverable *is* an audit trail, and D3 captures raw argv. Any `--text`/`--rationale` payload of a malformed call lands in a plaintext file. |
| data model | **yes** | D2 introduces a new persisted record schema under `.fgos/` that later readers depend on. |
| public contracts | **yes** | `bin/fgos.mjs` `main()` is the single CLI door for every verb and every skill that shells out. D4 requires exit codes and every verb's validation stay byte-identical; D6 permits exactly one *appended* stderr line and nothing else. Every edit sits on a public surface under a must-not-regress constraint. |
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
against. Both need proving at `fgos-coding-validating`, not asserting here. The
reality check earning a `NOT READY` on exactly (a) is this mode doing its job.

## Approach

Add one classifier + writer, invoked from the single existing failure handler.
Nothing else changes.

1. **Classify the fault by where it was raised (honors D1 as narrowed by D7).**
   `main()`'s catch is the only failure handler, and it sees in-handler business
   refusals and pre-handler input faults through the same
   `StoreError('validation', ...)` shape. The classifier keys off *position*,
   never message text: faults raised in the explicit pre-handler region above
   `runVerb` are recorded; faults raised at or below `runVerb` are business
   refusals and never are.
   - Rejected: string-matching `err.message` to decide the class. It would
     couple the log to 73 hand-written message strings and silently
     misclassify the moment one is reworded.
   - Rejected: consulting the registry's `required` to decide the class.
     That is enforcement, which D4 forbids.
   - **What this actually covers (D7, and no more):** unknown verb (see P5),
     the `requiresExistingStore` refusal, the `init`-inside-worktree refusal,
     `dataDir`/`--dir` faults, and arg-parse faults once P4 below lands.
   - **P5 (found at validating): unknown verb is detected by lookup, not by
     position.** Its error is thrown at `bin/fgos.mjs:2567`, inside `runVerb`
     (which opens at `698`), so position alone would classify it as a business
     refusal. `main()` already performs the lookup that answers it —
     `COMMAND_REGISTRY.find((e) => e.name === verb)` — one line above the
     `requiresExistingStore` guard, so `!entry` is an observable pre-handler
     signal needing no new machinery. The error itself still comes from `2567`
     unchanged, so D4 holds.
   - **What it does not cover:** missing-required-flag and invalid-id faults,
     both named in D1. They are raised below `runVerb` (e.g. the `--domain`
     diagnostic at `bin/fgos.mjs:666`) across 73 sites, indistinguishable by
     position, and both mechanisms that could separate them are closed by the
     two rejections above. Deferred to P38 per D7. The originating incidents
     (p-af05e742, p-4c81ca74) were wrong-cwd/wrong-store faults and **are**
     covered.
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
6. **Keep the observable surface identical apart from D6's one line (honors
   D4, D6).** The existing `fgos: <message>` line and the `process.exitCode`
   assignment stay exactly as they are. The recording call is additive and must
   never throw into the caller's path — a failed record write is swallowed,
   because an observability layer that turns a clean exit-4 into an unexpected
   exit-1 is worse than no layer.
7. **Surface the record in-process (P3, honors D6).** After a successful
   record, append one stderr line naming where it went. It is emitted **only**
   when a record was actually written — never when the write was skipped
   (business refusal, per D1) or swallowed (unwritable destination, or no git
   repo to resolve per D5), because a line claiming a record that does not
   exist is worse than silence. Audit the **12** `assert.equal`-on-stderr
   assertions under `test/` (`assert.match` accounts for the other 85 and is
   unaffected); each either passes untouched or its exact-match reason settles
   the wording, per D6's own cost column. `scripts/herdr-cockpit-notify.mjs`
   and the `terminal` skill are the only non-test stderr consumers and need
   the same check. That audit is **already done** — see the revision-4 note.
8. **Move `parseArgs` inside `main()`'s `try` (P4, honors D7).** Today
   `parseArgs(rest)` runs at `bin/fgos.mjs:2717` while the `try` opens at
   `2724`, so an arg-parse fault never reaches the catch and cannot be recorded
   by anything placed there. Move the call inside the `try`. The two `--help`
   blocks between them must keep behaving identically, including their
   `process.exitCode = 0` early returns.

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
| D6's added stderr line vs. existing stderr assertions | **closed** | Enumerated at validating, all 12 safe: `fgos-help.test.mjs:43,54` (help, exit 0); `fgos.test.mjs:318,326` (`list` exit 0, a legitimately empty view, not a fault); `dispatch.test.mjs:488,561,768,785,805,824,854` (stderr of a worker subprocess the runner spawns, not the CLI's fault path); `fgos.test.mjs:2602` "exactly one stderr line" (`submit --domain bogus`, exit 4 — validated below `runVerb` at `bin/fgos.mjs:666`, so D7 does not record it and no line is added). |
| P4 moving `parseArgs` inside the `try` | **medium** | It sits above two `--help` early-return blocks that must keep their exact behavior. Proof at validating: `test/cli/fgos-help.test.mjs` green, including its two empty-stderr assertions. |
| Line emitted when no record was written | **medium** | A line claiming a record that does not exist. Proof at validating: the emit is genuinely downstream of a successful write, and the swallow path (unwritable dir, no git repo) stays silent. |
| `main()` catch edits vs. byte-identical exit codes (D4) | **high** | `test/cli/fgos.test.mjs:459` must pass unedited: it asserts exit 4, `/\.fgos\/ not found/`, and *"the refused verb must not create .fgos/ as a side effect"*. Plus the worktree/`--dir` tests at lines 181, 191, 295, 304, 312, 321 and the `init`-in-worktree refusal at 469. Proof at validating: those are assertions on this path, and none are modified. |
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
- `bin/fgos.mjs` — `main()`: one call in the catch, plus P4 moving `parseArgs` inside the `try`; no change to the existing stderr write or `exitCode` assignment.
- `test/cli/` — new assertions: fault recorded, business refusal *not* recorded, no write to `events.jsonl`, exit codes unchanged, worktree cwd never gains `.fgos/`, log path is git-ignored.
- `docs/specs/` — one note on the new log, only if the spec already documents `.fgos/` contents.

## Cases worth proving against

- **Empty/boundary**: `fgos` with no verb at all; a verb with no flags; `--dir ""`.
- **Must not regress**: `.fgos/ not found` refusal still exits 4 with identical text; the `STORE_MISSING_WARNING_VERBS` stderr warning still fires unchanged; `fgos init` inside a worktree still refuses.
- **Correct non-recording**: `fgos pick <nonexistent-id>` (the exact business refusal hit while claiming this item) records nothing.
- **Not tracked**: after a fault is recorded, `git status --porcelain` shows nothing for the log path.
- **D6 line**: present on a recorded fault; **absent** on a business refusal, on an unwritable destination, and outside a git repo.
- **Concurrent access**: two sessions faulting at once append without interleaving a partial line.
- **Partial failure**: destination unwritable (read-only dir) — stderr and exit code stay identical, nothing thrown.
- **Worktree**: faulting from inside a linked worktree writes to the main checkout's store and leaves no `.fgos/` in the worktree.

## Split: none for this item; one follow-on item created

This item stays one honest piece of work: one new module, one wiring site, one
test group, plus the mandatory declarations (P1, P2) and D6's one line (P3). No
candidate sub-piece is independently shippable — a classifier with no writer
records nothing, a writer with no classifier violates D1, a writer without P1
leaks argv into git, and P3 without a writer has nothing to announce.
`fgos graph --what-if` per candidate is moot here: the item has no deps and no
children, so every candidate yields the same unchanged
`topUnblock`/`criticalPath` shown above.

**Follow-on item: `tsk-1wdf`** — "fgos faults: read surface for the
invocation-fault log", the machine-readable surface D6 explicitly split out.
Its verify: `node --test test/cli/fgos.test.mjs && node --test
test/cli/fgos-manifest.test.mjs && npm test` (the manifest test is in there
because a new verb needs a registry row).

Lineage is recorded as `discoveredFrom: tsk-5z0`, **not** `parent`, for two
reasons: no CLI flag sets `parent` at all — `src/intake/plan.mjs:392` is
its only writer, the engine's own split path — and `parent` would be wrong here
anyway, because `src/state/frontier.mjs` blocks a parent until every descendant
is `done`, which would hold `tsk-5z0` open waiting on a read surface it does
not depend on.

## Verify

```
node --test test/cli/fgos.test.mjs && node --test test/architecture.test.mjs && npm test
```

Narrowest-first, then the full suite because `bin/fgos.mjs`'s failure handler is
shared by every verb the suite exercises. `test/architecture.test.mjs` is in the
command specifically because of P2.

## Revision history

### Revision 4 — scope narrowed to what the handler can see (D7)

`fgos-coding-validating` returned `NOT READY` a second time, on Assumptions again.
Two things were proven false by reading, not argued:

1. **`parseArgs` runs outside the `try`** — `bin/fgos.mjs:2717` vs the `try` at
   `2724`. Revision 3's step 1 listed "arg parsing" as recordable; it was not,
   because the fault never reaches the catch. Now **P4**: move the call inside.
2. **D1 promised more than position-based classification can deliver.**
   Missing-required-flag and invalid-id faults are raised below `runVerb` across
   73 sites (e.g. `bin/fgos.mjs:666`), indistinguishable from business refusals
   by position — and both separating mechanisms were already closed
   (message-matching rejected here, registry enforcement forbidden by D4). D7
   narrows the scope and states the gap plainly instead of implying coverage.

The 12 exact-match stderr assertions were enumerated in the same pass and are
all safe; the risk-map row is closed with the list rather than carried forward.

### Revision 3 — in-process visibility (D6)

Asked directly: does this slow anything down, and should it be visible across
the process? Both answered with measurements, then D6 was recorded.

**Cost, measured on this machine.** A failing `fgos` invocation costs **60 ms**
today, almost all of it node startup. On top of that: `resolveWriterIdentity`
**0.018 ms** with an agent session env present, **28.4 ms** on the pid-walk
fallback (bare human terminal, no session env); `git rev-parse
--git-common-dir` **2.2 ms**, only on D5's fallback branch; one record append
**0.018 ms**. So a successful invocation pays **nothing** — none of this runs
outside the catch — and an agent-session fault pays **+0.04 ms**. Worst case, a
bare human terminal with a wrong cwd, is **+30.6 ms on a run that already
failed**. The pid-walk cost is also not a new class of cost: `store.mjs`
already calls `resolveWriterIdentity` on every event append
(lines 250, 362, 626), so the repo already pays it on every successful write.

**Visibility.** `doctor` was considered and rejected as the home: its real
output is environment health (node/git present, shell-integration rc line,
`.fgos-runner.json` keys, `core.hooksPath`) and it shares the `--pretty`
renderer with `setup` — its audience is "did I install fgOS correctly", not
"who called wrong". Chosen instead: D6's one stderr line here (P3), plus
`tsk-1wdf` for the read surface.

### Revision 2 — after the reality check

`fgos-coding-validating` returned `NOT READY - RETURN TO PLANNING` on the Assumptions
dimension. Three things changed; no locked decision was reopened.

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
