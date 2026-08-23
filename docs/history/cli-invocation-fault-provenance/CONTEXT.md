# CONTEXT — CLI invocation-fault provenance

Item: `tsk-5z0` (kind `bug`, tier `standard`, risk `standard`, mode `sync`).
Stage when this doc was written: `clarify`.

## Feature boundary

`bin/fgos.mjs` is the single CLI door for every verb. When an invocation is
*malformed* — a missing required flag, an invalid id, or a cwd that makes the
verb resolve the wrong `.fgos/` — the fault surfaces only as a stderr line and
an exit code at the point of call, and **nothing is recorded**. There is no
later-readable trace of *where the bad call came from*: which session, which
argv, which cwd.

In scope: a record of malformed invocations, carrying enough provenance to
answer "who called this wrong, with what, from where" after the fact.

Out of scope (deliberately, per the decisions below): changing any verb's
validation behavior or exit codes; a caller-side declaration contract; any
change to `events.jsonl` or to state derivation.

## Scout evidence

| Path | What it establishes |
|---|---|
| `bin/fgos.mjs:2708` (`main()`) and its final `catch` | The only failure handler: `process.stderr.write("fgos: " + err.message)` then `process.exitCode = EXIT_CODES[categoryOf(err)] ?? 1`. Appends nothing, anywhere. This is the gap the item names. |
| `src/cli/command-registry.mjs` header + entries | Every verb entry already carries JSON-Schema `parameters` with `required`. The header states P37 deliberately did **not** wire these into dispatch ("that is P38's job"). A machine-readable required-flag contract therefore already exists, unused at dispatch. |
| `bin/fgos.mjs`, 73 `StoreError('validation', ...)` sites | Each verb hand-rolls its own input validation today. There is no shared syntax/input layer — matching the item's description. |
| `src/runner/session-identity.mjs` (`resolveWriterIdentity`) | Already yields `{id, source}` where source is `registry` \| `env` \| pid-derived. Best-effort by design, documented never to block a caller. This is the provenance handle that already exists. |
| `src/state/store.mjs:738` (`addFriction`) | Requires a non-empty work `id` (`friction requires a non-empty "id"`). A malformed invocation that never resolved an item therefore has **no home** in today's friction log. |
| `bin/fgos.mjs` `requiresExistingStore` guard (tsk-4fu-2) | Writers refuse with exit 4 when `.fgos/` is absent at the resolved dir, precisely so `appendEventCore`'s `mkdirSync` cannot silently create a phantom store in a worktree. |
| `bin/fgos.mjs` `STORE_MISSING_WARNING_VERBS` (tsk-56t D2) | 8 read verbs emit a stderr warning when the store is missing and cwd is not the main worktree. The wrong-cwd class is thus already half-covered — warn-only, never recorded. |
| `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` (ADR0020) | Linked worktrees never carry their own `.fgos/`. Constrains where a record may be written (D5). |

Originating incidents cited by the item: `p-af05e742`, `p-4c81ca74`
(2026-07-28, dogfood `tsk-1wd`).

## Locked decisions

| ID | Decision | Why it can be trusted | Cost if wrong |
|---|---|---|---|
| **D1** | Record **pre-handler input faults only**: unknown verb, missing flag per the registry's own `required`, malformed id, store-missing/wrong-cwd. In-handler business refusals (`work "<id>" not found`, Iron Law trip, lock-held) stay stderr-only and unrecorded. | Matches the item's own enumeration ("thiếu flag bắt buộc, id không hợp lệ, cwd sai"). Business refusals are correct behavior, not misuse — recording them dilutes the signal with expected events. | A misuse pattern that only manifests as an in-handler refusal stays invisible; recoverable by widening the classifier later, since the record's shape does not change. |
| **D2** | Write to a **separate side log under `.fgos/`** — never `events.jsonl`. | `events.jsonl` is the rebuild source; `rebuildView` derives all state from it. A new event type there would put every replay/rebuild path in scope for a pure-observability change. A side log has independent lifecycle and read path. | Two logs to read instead of one when investigating. No correctness risk to state derivation. |
| **D3** | Provenance is **free signals only**: `resolveWriterIdentity()`'s `{id, source}`, the argv, and the cwd. No new env var, no new flag, no caller-side change. | All three already exist at the point of failure and cost nothing to capture. `resolveWriterIdentity` is documented as best-effort and never blocks a caller — safe on an error path. | "Which skill called this" is not answerable from the record alone; only "which session, what command, from where". A self-declared caller label is a separate follow-up, not folded in here. |
| **D4** | **Observe only.** Every verb's existing validation and exit codes stay byte-identical. The registry's `required` stays advisory, as P37 left it. | Keeps a public CLI contract change out of an observability fix. Any exit-code change would be visible to every skill, slash-command, and test that shells out to `fgos`. | The 73 hand-rolled validation sites stay un-unified. That consolidation is P38's stated scope, not this item's. |
| **D5** | When the resolved `.fgos/` is **missing or is a linked worktree**, resolve the main checkout via `git rev-parse --path-format=absolute --git-common-dir` and record **there**. Never create `.fgos/` inside a worktree. | Same resolution the fgOS skills' own gate checks already use (`root=$(git rev-parse --path-format=absolute --git-common-dir \| xargs dirname)`). Honors ADR0020 and does not defeat `tsk-4fu-2`'s phantom-store guard. Puts the record in the one real store — where an investigator would actually look. | Outside any git repo there is no main checkout to resolve; that case has no destination and falls back to stderr-only. Accepted: every originating incident was inside this repo. |
| **D7** (added 2026-07-30, after `fgos-coding-validating` — **narrows D1's scope; D1 otherwise stands**) | Recordable is exactly what the single failure handler can observe: **unknown verb, the `requiresExistingStore` refusal, the `init`-inside-worktree refusal, `dataDir`/`--dir` faults, and arg-parse faults** (the last only after `parseArgs` moves inside `main()`'s `try`). **Missing-required-flag and invalid-id faults are explicitly NOT covered**, despite D1 naming them — deferred to P38's validation consolidation. | Proven by reading, not argued: `parseArgs(rest)` runs at `bin/fgos.mjs:2717` while the `try` opens at `2724`, so arg-parse faults never reach the `catch` today. And D1's named cases are validated *inside* handlers below `runVerb` (e.g. the `--domain` fold diagnostic at `bin/fgos.mjs:666`), positionally indistinguishable from business refusals across 73 hand-rolled sites. The two mechanisms that could separate them are both closed: message-string matching (rejected in `plan.md` — it would couple the log to 73 wordings) and registry `required` enforcement (forbidden by D4). | The log will not answer "who forgot a required flag" — the very first class the item's own description names. Accepted as the honest scope rather than pretending coverage: the originating incidents (p-af05e742, p-4c81ca74) were wrong-cwd/wrong-store faults, which **are** covered. Widening later needs no change to the record's shape. |
| **D6** (added 2026-07-30, after `fgos-coding-planning`) | The fault record is **visible in-process**: one *added* stderr line naming where it was recorded. Exit codes, existing stderr text, and every verb's validation stay unchanged — this only appends. A machine-readable read surface (`fgos faults`) is separate follow-on work, not this item. | D4 as locked above covers validation and exit codes only; the stricter "stderr byte-identical" phrasing appeared in `plan.md`, never here, so appending a line does not contradict D4. Measured: 85 of the 97 stderr assertions under `test/` use `assert.match` (substring/regex) and are unaffected; only 12 use `assert.equal`. Without in-process visibility, the log's known failure mode is that nobody reads it and the item's own purpose ("để soi lại sau") never materializes. | A person who does not want the extra line cannot turn it off, and the 12 equality assertions must each be inspected. If one demands exact-match for a real reason, that assertion — not this decision — settles the wording. |

## Pinned terms

- **Invocation fault** — a malformed *call* to the CLI, detected before the
  verb's handler runs. Distinct from a **business refusal**, which is a
  correct answer from a handler that ran (item not found, Iron Law trip,
  lock held). Only the former is recorded (D1).
- **Provenance** — here strictly: writer identity, argv, cwd (D3). Not
  "which skill" and not "which original slash-command"; those require a
  caller-side declaration that D3 excludes.
- **Side log** — a `.fgos/`-resident append-only file that is *not*
  `events.jsonl` and is never read by `rebuildView` (D2).
- **Resolved store dir** — what `dataDir(flags.dir)` returns in
  `bin/fgos.mjs`; may be wrong or absent, which is itself a recordable fault
  (D1, D5).

## Canonical references

- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` — worktrees carry no `.fgos/`.
- `src/cli/command-registry.mjs` — the `required` contract D4 leaves advisory.
- `src/runner/session-identity.mjs` — `resolveWriterIdentity`, D3's whole provenance source.
- `docs/specs/runner.md` — friction/capture model; explains why `addFriction` is not the vehicle here.

## Deferred to planning

- The side log's concrete filename, record schema, and rotation/growth
  behavior — implementation shape, not a product decision.
- Where in `main()` the classifier sits, and how it distinguishes a
  pre-handler fault from an in-handler refusal without re-deriving each
  verb's validation.
- Whether the record is readable through a verb (a `fgos` read verb) or only
  as a file. Not decided here; the item's ask is that the record exist.
- The item's `verify` field is still `chưa xác định — P15 bổ sung`; planning
  sets it.

## Deferred as scope creep (not this item)

- A **self-declared caller label** (e.g. an env var every skill sets) so a
  record can name the calling skill/slash-command. Explicitly excluded by D3;
  worth its own item once the log proves useful.
- Consolidating the 73 hand-rolled `StoreError('validation', ...)` sites onto
  the registry's `required` — P38's stated scope, excluded by D4.
