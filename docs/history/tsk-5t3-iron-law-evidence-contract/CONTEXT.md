---
item: tsk-5t3
timestamp: 2026-07-30T09:58:53.000Z
---

# CONTEXT: Iron Law evidence contract

## Feature boundary

When `approve` refuses a `runner`-sourced item because it trips the Iron
Law (`bin/fgos.mjs:1927-1938`, `classifyIronLaw` matches a self-modifying
module or a heavy-risk keyword), the refusal message today names the
matched flags/modules but carries no evidence — the human operator has to
go find or reconstruct the failing-test-first proof themselves before
deciding whether to re-run `approve --acknowledge-iron-law`.

This item builds the contract that lets an item collect that proof while
the work happens (`fgos-coding-implement`) and lets `/fgOS:merge-loop` find and
present it when the gate trips — cutting the time a human spends
reconstructing evidence, without ever loosening who is allowed to press
acknowledge. It does not touch `approve`'s own refusal behavior, and it
does not decide whether Iron Law can ever be auto-acknowledged — that
question is explicitly out of scope, reserved for `tsk-44f` (per
`tsk-3mv` D2, see References).

`tsk-2qx` ("upgrade merge-loop to auto-merge past Iron Law, agent
searches for evidence for merge") was closed `wontfix` as a duplicate ask
and folded into this item's scope — its bypass-flavored framing is
explicitly rejected by D1 below; only its evidence-gathering half
survives here.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope is evidence-only. `/fgOS:merge-loop` gathers and presents failing-test-first proof (before/after) when it hits an Iron Law block, but never self-acknowledges. RUL34/RUL37 (`docs/specs/runner.md` lines 530-531, 598-603) stay exactly as locked — a real human operator must still type `--acknowledge-iron-law` themselves, no exception. The separate question of whether that requirement can ever be loosened belongs to `tsk-44f` (not yet filed, depends on `tsk-5t3` per `tsk-3mv` D2), never silently folded in here. |
| D2 | Trigger: `fgos-coding-implement` runs its normal before/after test cycle for a real fix as a matter of course; it only *persists* the contract file when the item's final diff, evaluated the same way `approve` itself would (`classifyIronLaw({filesChanged: finalDiff, description})` at `fgos return` time), comes back `required: true`. This reuses the exact same function and module list the real gate uses (`src/evolve/iron-law.mjs`) rather than a separate early-prediction heuristic, and avoids writing/storing evidence for the ~99% of items that never touch a self-modifying module. |
| D3 | Storage: the contract is a file at `docs/history/<id>/iron-law-evidence.md`, committed on the item's own `fgw/<id>` branch (not `.fgos/`, which worktrees never carry per ADR0020; not the `docType`/`docPath` outcome fields, which are only populated at `compound-learn`, after `approve` already ran). `approve`/`merge-loop` read it via `git show fgw/<id>:docs/history/<id>/iron-law-evidence.md` from the main checkout — the same branch-ref read pattern already established for reading branch-local state before a merge (`tsk-56t` D1). |
| D4 | Surface point: `approve`'s own thrown refusal message (`bin/fgos.mjs:1931-1938`) stays byte-for-byte unchanged — this item never edits that locked gate's code. `/fgOS:merge-loop` (the chat/skill layer) is what reads the evidence file, if present, and prints it for the human before asking them to decide on `--acknowledge-iron-law`. |

## Pinned terms

- **Iron Law evidence contract** (this item's own name): the
  `docs/history/<id>/iron-law-evidence.md` file (D3) a `runner`-sourced
  item's own branch carries when its final diff trips `classifyIronLaw`
  (D2), containing the failing-test-first proof `merge-loop` presents at
  an Iron Law block (D4).
- **Failing-test-first proof**: the test command run, its output/exit
  code failing (red) before the fix, and the same command passing
  (green) after — the exact discipline the Iron Law refusal message
  already names ("a failing test must precede this self-modifying
  diff").

## Scout evidence

- `bin/fgos.mjs:1907-1939` — the Iron Law gate's real trip point inside
  `approve`, `classifySource(repoRoot, item) === 'runner'` (a branch
  `fgw/<id>` exists) gating whether `classifyIronLaw` runs at all;
  the exact refusal message text this item's evidence supplements,
  never replaces.
- `src/evolve/iron-law.mjs` — `classifyIronLaw`'s pure function shape
  (`filesChanged`, optional `description` → `{required, matchedFlags,
  matchedModules}`), the exact classifier D2 reuses at return-time
  instead of a new heuristic.
- `src/runner/merge.mjs:237-245` (`classifySource`) — `'runner'` is
  decided by branch existence alone, so any item worked through
  `/fgOS:pick` (a `fgw/<id>` branch) is Iron-Law-eligible at approve,
  not just autonomous self-improve-loop candidates.
- `docs/specs/runner.md` lines 522-604 (Vietnamese) — RUL34/RUL37's full
  locked spec text: Iron Law only runs for `runner`-sourced proposals,
  is a pure function with no side effects, and `approve` refuses in the
  same call with no git mutation until `--acknowledge-iron-law` is
  supplied.
- `docs/history/tsk-3mv-merge-loop-self-resolve/CONTEXT.md` D2 — "Iron
  Law blocks... are out of scope for this item and stay exactly as they
  are... Whether/how to loosen this is split out to its own item,
  `tsk-44f` (depends on `tsk-5t3`)" — the locked boundary this item's D1
  stays inside; `tsk-44f` does not exist as a filed item yet.
- `tsk-56t` decision log — "giải pháp nên là (a) approve/return đọc
  state từ branch ref (git show fgw/<id>:.fgos/events.jsonl)" — the
  precedent D3's branch-ref read reuses.
- `tsk-2qx` (closed `wontfix`, absorbed here) — original ask: "Nâng cấp
  skill `/fgOS:merge-loop` để cải thiện khả năng tự merge khi gặp Iron
  Law... agent có thể thông minh tìm bằng chứng cung cấp cho merge
  (failing-test-first proof, trước/sau)" — its auto-merge framing is
  rejected by D1; its evidence-search framing is D2-D4's whole content.

## Outstanding questions deferred to planning

- Exact `fgos-coding-implement` implementation shape for capturing before/after
  test output during work (which command output gets saved, how the
  session knows "this is the fix's own test" vs incidental test runs) is
  an implementation choice, not a product decision — left to
  `fgos-coding-planning`.
- Exact `merge-loop` skill wording/format for presenting the evidence
  file's content in chat is an implementation choice — left to
  `fgos-coding-planning`.

## References

- `bin/fgos.mjs` (Iron Law gate inside `approve`)
- `src/evolve/iron-law.mjs` (`classifyIronLaw`)
- `src/runner/merge.mjs` (`classifySource`)
- `docs/specs/runner.md` (RUL34, RUL37 — Iron Law, lines 522-604)
- `docs/history/tsk-3mv-merge-loop-self-resolve/CONTEXT.md` (D2 — the
  scope boundary this item stays inside)
- `plugins/fgOS/skills/merge-loop/SKILL.md`
- `tsk-2qx` (closed, absorbed), `tsk-44f` (not filed, depends on
  `tsk-5t3`) — related but separate items
