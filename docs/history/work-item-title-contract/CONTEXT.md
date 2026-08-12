# work-item-title-contract — locked decisions

Item: `tsk-52g`. Source request (raw, untrusted per RUL45): "`title` của
work-item có vẻ quá ngắn khiến title của nó gây khó hiểu (quá brief) khi
hiển thị trên danh sách task, cần xem xét lại: 1) tăng độ dài để đủ 2) xem
lại logic của llm lúc đặt tên phải thể hiện được cốt lõi của nó."

## Feature boundary

A work item's `title` reaches the store through exactly three doors. This
feature covers all three, and nothing else:

- **`fgos submit <text>`** — `deriveTitle(text)` (`src/intake/classify.mjs:20`)
  derives the title mechanically from the submitted blob; called at
  `bin/fgos.mjs:609`. No model call anywhere on this path.
- **`fgos add --title "..."`** — the flag value goes into the store raw
  (`bin/fgos.mjs`, `title: flags.title`). It never touches `deriveTitle`,
  so no rule written into `deriveTitle` can reach it.
- **`decompose` children** — the LLM authors each child's `title`
  (`src/intake/plan.mjs:130` prompt; `normalizeChild` at
  `decompose.mjs:146` accepts any non-empty string). This is the "logic
  của llm lúc đặt tên" the request names.

Out of scope: how `fgos list` renders the table; any change to
`description`; asking a submitter for more text at intake time; the
already-settled dot-in-filename boundary bug (its own item `tsk-2z3`,
`docs/history/derivetitle-filename-dot-boundary/`).

## Scout evidence

Measured against the live store (54 items at the time of scouting; a
concurrent session's write moved the count between two reads — 55 then 54.
The distribution below is stable across both reads and nothing here turns
on the exact total).

Title length distribution:

| bucket | items |
|---|---|
| ≤40 chars | 7 |
| 41–60 | 4 |
| 61–100 | 12 |
| **>100** | **32** |

Source of each half of the complaint:

- **"Quá dài" is the live, dominant defect: 32/54 items (58%) exceed 100
  characters.** `TITLE_MAX_LENGTH = 60` (`classify.mjs:13`) only applies in
  `deriveTitle`'s *fallback* branch (`classify.mjs:30-35`), reached when the
  text contains no sentence/line boundary at all. The boundary branch
  (`classify.mjs:24-28`) returns the whole first sentence **uncapped**.
  `tsk-52g`'s own ~230-character title is the live proof: its submitted text
  has no boundary until the final period, so the entire blob became the
  title.
- **"Quá ngắn" is largely NOT a live defect of the mechanical path.** Of the
  7 titles ≤40 chars: 4 (`"task 1"`, `"edge test doc"`, `"item mvp mẫu để
  test goalTier"`, `"viêt một hello world app bằng vanila js"`) have
  `description` byte-identical to `title` — the submitted text itself was
  that terse and `deriveTitle` cut nothing. The other 3
  (`"fgos-coding-exploring/SKILL"`, `"STR66: Rename src/state/domains"`, `"fgos
  approve's root-merge path (bin/fgos"`) were cut at a dot inside a
  filename — a defect already fixed under `tsk-2z3`; the current regex
  `/[.!?](?:\s|$)|\n/` (`classify.mjs:24`) does not match `.md`, and
  `test/intake/classify.test.mjs:27-39` locks that behavior. Those three are
  legacy titles, not evidence of a current bug.
- **The LLM path currently holds zero items.** 0 of 54 items carry a parent
  — no `decompose` child title exists in the store today.
- **`add --title` bypasses every rule placed in `deriveTitle`**, and agents
  submit through both `submit` and `add`. This is why the length rule is
  placed at the store layer (D5) rather than inside `deriveTitle`.
- **A store-layer length bound already has precedent**: `validateWorkShape`
  (`src/state/work.mjs:131`) bounds `work.id` by `MAX_ID_LENGTH`
  (`work.mjs:143`) with exactly the shape D5 needs, right beside the existing
  `requireNonEmptyString(work, 'title')` at `work.mjs:146`. Every write path
  reaches it — `addWork` calls `validateWorkShape` at `work.mjs:402`.

## Locked decisions

| ID | Decision |
|---|---|
| **D1** | A title must convey **đối tượng + hành động + phạm vi** — what is being touched, what is being done to it, and the boundary of the change. |
| **D2** | Length rule is a **ceiling of ~100 characters, applied to both branches** of `deriveTitle` (boundary branch and fallback branch alike). **No minimum-length floor is introduced.** |
| **D3** | `submit` stays **fully mechanical** — no LLM call and no `--title` override flag is added to it. `deriveTitle` remains its only title source. |
| **D4** | Existing items are **re-derived automatically from `description`** — all items, not only the ones violating the ceiling. |
| **D5** | The length ceiling lives at the **store layer** (`validateWorkShape`/`addWork` in `src/state/work.mjs`), not inside `deriveTitle`, so `submit`, `add --title`, and `decompose` children all obey one rule. Over-long titles are **truncated, not rejected** — an over-length `add --title` must not break a running agent or script. |
| **D6** | The **semantic** contract (D1) is written into the **skills agents use to submit** — `.claude/skills/fgos-submit-assist/SKILL.md`, `plugins/fgOS/skills/submit/SKILL.md` — **and** into the `decompose` LLM prompt (`src/intake/plan.mjs`). It is guidance for authors, never a mechanical assertion. |

### Why D1 cannot be enforced where D3 puts the work

D1 is a semantic requirement; `deriveTitle` is a pure string cut. A cut
cannot guarantee that its output names an object, an action, and a scope —
it can only guarantee where it stops. This is why D5 splits the contract:
**length is machine-enforced everywhere; semantics is author-guided
(D6)**. Nothing in this feature claims to mechanically verify D1.

### Why the semantic rule goes to the submitting skills, not only the LLM prompt

The `decompose` LLM path holds 0 of 54 items today, so binding D1 there
alone would have near-zero present effect. Every title in the store came
through `submit` or `add`, both of which agents drive by reading a skill
first. Placing D1 in those skills puts it on the path actually producing
54/54 items, at zero added latency.

## Pinned terms

- **"quá ngắn" / too brief** — a title that omits object, action, or scope
  (D1), regardless of character count. Distinct from a title that is short
  *because the submitted text was short*, which no title logic can repair.
- **"logic của llm lúc đặt tên"** — the `decompose` prompt at
  `src/intake/plan.mjs:130` plus `normalizeChild`'s acceptance check at
  `decompose.mjs:146`. `submit` has no LLM naming logic to review.
- **Title ceiling** — a truncation bound, not a rejection bound (D5).
- **Re-derive** — recomputing a title from the item's existing
  `description`. It can only ever shorten a title; it never lengthens one.

## Known limits of what was decided

Recorded so planning does not rediscover them:

1. No mechanical check can assert D1's semantics on any path.
2. Prompt compliance is not enforceable. The `decompose` LLM may ignore the
   title guidance; only a length check in `normalizeChild` could push back,
   and that check would still say nothing about meaning.
3. **D4's re-derive can only shorten titles.** Re-deriving `"task 1"`
   returns `"task 1"`. It repairs the 32 over-long items and rescues none of
   the short ones.
4. A terse submission yields a terse title. The only place that is fixable
   is at intake, by asking the submitter for more text — excluded by D3.
5. D4 overwrites titles a person or agent set deliberately via `fgos edit
   --title` or `fgos add --title`. This cost was raised at decision time and
   accepted in favor of one uniform rule across all items.

## References

- `src/intake/classify.mjs:13,20-36` — `TITLE_MAX_LENGTH`, `deriveTitle`.
- `bin/fgos.mjs:609` — `submit`'s `deriveTitle` call; `add`'s raw
  `title: flags.title` passthrough.
- `src/intake/plan.mjs:130,146` — LLM child-title prompt and
  `normalizeChild` acceptance.
- `src/state/work.mjs:131,143,146,402` — `validateWorkShape`, the
  `MAX_ID_LENGTH` precedent, the existing title check, `addWork`'s call.
- `test/intake/classify.test.mjs:9,27-39` — tests locking the current cut
  behavior; D2/D3 were chosen so these stay green.
- `docs/history/derivetitle-filename-dot-boundary/CONTEXT.md` — the
  already-settled dot-boundary defect (`tsk-2z3`).

## Deferred to planning

- Exact ceiling constant and where it is named (a new constant in
  `work.mjs` versus reusing/moving `TITLE_MAX_LENGTH`).
- Whether truncation happens at a word edge or a hard character index.
- Whether D4's re-derive ships as a one-shot script or a CLI verb, and how
  its effect is proven.
- Whether `normalizeChild` gains a length check for child titles.
- Whether this item needs splitting into children at all.

## Deferred scope (raised, not absorbed)

- Truncating or wrapping titles in the `list` table renderer — display-side,
  not a title-content concern.
- Prompting a submitter for more detail when the submitted text is too
  terse — excluded by D3.
