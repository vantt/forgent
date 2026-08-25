# RESEARCH.md — tsk-7u7: RUL11 doctrine anchor

## 2026-08-18T10:02:07Z — discovery pass

**Asked:** Where does RUL11 go, what decision-ID convention applies, and
does an anchor-phrase-assertion test already exist for any RULn?

### 1. `docs/specs/platform-foundations.md`'s "Business Rules" section

Checked directly (`Read`, lines 62-73). Ten existing rules, one line each,
uniform shape `**RULn.** <one sentence> (L#, per <hash-or-nothing>).`:

```
- **RUL1.** ... (L1, per ca7de3cf).
...
- **RUL9.** Tầng doctrine nạp-mọi-turn tuân ba quy tắc: placement test một
  câu; transport đi kèm mệnh lệnh; mỗi rule có anchor phrase được check tự
  động assert (L8).
- **RUL10.** Trend-history và reconsideration bookkeeping lưu policy-side,
  git-tracked (per ed953e09).
```

RUL9's text confirmed verbatim (case differs only in the item's own
paraphrase, same content) — file:line `docs/specs/platform-foundations.md:72`.
RUL11 is the next free slot in this file's own series, one line, appended
directly after RUL10 (line 73).

### 2. RULn numbering is per-spec-file, not global — checked for collision

`rg "RUL11\b" docs/` shows RUL11 is ALREADY a live rule number in
`docs/specs/work-state.md` (schema-evolution rule, referenced repeatedly:
lines 98/117/146/149/191/214) and in `docs/specs/distribution.md`. This
does NOT collide with a new RUL11 in `docs/specs/platform-foundations.md`:
`docs/specs/runner.md` independently reaches RUL49 (cited at
`work-state.md:191`), confirming each spec file keeps its own RULn
sequence rather than sharing one global namespace. Safe to use RUL11 in
platform-foundations.md.

### 3. Decision-ID convention for the "Lịch sử quyết định" section

`docs/specs/platform-foundations.md`'s own "## Lịch sử quyết định retired
từ docs/decisions/ (tsk-1lv-4)" section (line 96) holds bare
`### <4-digit-number> — <title>` headings: `0001`, `0009`, `0014`, `0035`
(lines 101/140/178/264). `docs/decisions/index.md` (generated,
`fgos decision-index`) confirms `0035` is a **genuinely new** decision
(not a migrated ADR file) that still landed under the same section/heading
convention as the migrated ones — its own rationale field says so
explicitly: "0035 tự thân định vị sống ở docs/decisions/0035 nhưng corpus
đó đã retired trước khi record này thi công thật, áp quy ước tsk-1lv-4 cho
34 record trước" (`docs/decisions/index.md:19`). This is direct precedent:
a fresh decision uses the SAME section and heading shape as a migrated one,
never a separate "new decisions" section.

Highest fgOS-native `D-ADR00xx` number found across `docs/decisions/index.md`
and every `docs/specs/*.md` is **0035** (`D-ADR0035`, `runner`/
`platform-foundations` scopes). One apparent `ADR0042` hit
(`docs/history/task-dispatch-unification/CONTEXT.md:39`,
`DISCUSSION.md:74,99`) is confirmed EXTERNAL — it names marketing-cockpit's
own ADR0042 ("task-first-routing-and-executor-kinds"), a different repo,
not this repo's sequence. Next free fgOS-native number: **0036**.

`fgos decision --help` confirms the write path: `fgos decision write <text>
--rationale <text> --relation <scope-or-relation>` appends a decision event;
`src/report/decision-index.mjs` (`buildDecisionIndexMarkdown`) projects any
`state.decisions` record carrying a `scope` field into
`docs/decisions/index.md` — the number itself (`D-ADR0036`) is not
auto-assigned, it's part of the `text` argument the caller supplies, by the
same convention every existing entry already follows.

### 4. Existing anchor-phrase-assertion test precedent

`rg -l "anchor.phrase|anchor phrase" test/` → no hits. `test/docs/` holds
exactly one file, `decisions-corpus-retired.test.mjs` (read in full) — it
asserts the tsk-1lv-4 migration's structural shape (34 fixed retired ADR
ids have a `### <id> ` heading somewhere; the "Lịch sử quyết định retired…"
heading appears exactly once per target file; no stray `docs/decisions/`
ADR files remain). It does not assert anything about RULn content or
anchor phrases, and its own fixed `RETIRED_ADR_HEADINGS` list stops at
0033 — adding `### 0036` will not perturb it. Confirms the item's own
claim: **no test today asserts an anchor phrase for any RULn** — this
item's own test is the first of its kind, opening the pattern rather than
extending existing coverage (per the item's own boundary #4, this is named
here rather than left as a silent gap against RUL9).

### Verdict

`{clear: true, verify: "npm test -- test/docs/rul11-anchor-phrase.test.mjs"}`
(exact filename decided at Planning). Every ambiguity point the item itself
flagged for discovery is now evidence-backed:

- RUL11 slot, format, and file: confirmed, no collision.
- Decision-ID: 0036 (`D-ADR0036`), same section/heading precedent as 0035.
- Anchor-phrase test: no prior art to match; this item's test is the first.

No open question remains for a person — `exploring` is not needed.
