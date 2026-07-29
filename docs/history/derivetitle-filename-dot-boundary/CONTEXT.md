# derivetitle-filename-dot-boundary — locked decisions

Item: `tsk-2z3`. Source request (raw, untrusted per RUL45): "Bug:
deriveTitle cắt title sai tại dấu chấm bên trong tên file/từ viết tắt, ví
dụ CONTEXT.md. Vị trí: src/intake/classify.mjs:24 - regex /[.!?\n]/ khớp
dấu . đầu tiên bất kể có phải hết câu hay không; dấu . trong CONTEXT.md
nằm ở index 7 (>0) nên qua được check dòng 25, cắt title còn đúng chữ
CONTEXT. Tái hiện sống: fgos submit với text bắt đầu bằng CONTEXT.md (nơi
DUY NHẤT...) ra title chỉ CONTEXT, hai lần liền lúc submit tsk-47e và
tsk-42i hôm nay 2026-07-29 - phải sửa tay bằng fgos edit --title cả hai."

## Feature boundary

`deriveTitle` (`src/intake/classify.mjs:20-36`) cuts a submitted blob's
title at the first `/[.!?\n]/` match (line 24), with no check for what
follows that character. A dot inside a filename or abbreviation (e.g.
`CONTEXT.md`, `index.js`, `v.v`) matches just like a real sentence-ending
dot, so any submission that opens with such a token gets truncated to a
useless fragment (`CONTEXT` instead of the real leading clause) — already
reproduced twice live (tsk-47e, tsk-42i, both hand-fixed via
`fgos edit --title`).

**Out of scope**: `classify()`'s tier/kind keyword matching and
`generateId()` — neither touches sentence-boundary logic, both confirmed
unaffected by scout (line 24 is the only production dot-boundary check
in this file). `TITLE_MAX_LENGTH` (60) and the truncate-fallback path
(lines 30-35) are unchanged.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | A sentence boundary is redefined as `[.!?]` immediately followed by whitespace or end-of-string, OR a bare `\n` — i.e. `/[.!?](?:\s|$)|\n/` replacing the current `/[.!?\n]/` at `classify.mjs:24`. A `.`/`!`/`?` immediately followed by a non-whitespace character (as in `CONTEXT.md`, `index.js`, `v.v`) is never a boundary; the newline branch is kept standalone since `\s` already matching `\n` covers the "sentence-char followed by newline" case, but a bare newline with no preceding `.!?` (e.g. `'Fix the header\nsecond line of detail'`, existing test) still needs its own boundary rule. |
| D2 | Only line 24's regex changes. `TITLE_MAX_LENGTH`, the word-edge truncate fallback (lines 30-35), `classify()`, and `generateId()` are untouched — this is a boundary-detection fix, not a title-length or classification change. |
| D3 | New tests assert `deriveTitle` does **not** cut early on input opening with a dotted proper noun/filename (`CONTEXT.md`, `index.js`, `v.v`) with more text following; existing tests for a real sentence boundary (`.`/`!`/`?` followed by whitespace) and the bare-newline case stay green unmodified. |

## Pinned terms

- **sentence boundary** (for `deriveTitle`): a `.`, `!`, or `?` character
  immediately followed by whitespace or the end of the string, or a bare
  `\n` — never a `.`/`!`/`?` immediately followed by a non-whitespace
  character (D1).

## Scout evidence cited

- `src/intake/classify.mjs:20-36` (`deriveTitle`) — full function read;
  line 24 is the sole boundary-detection regex, line 25 only guards
  `boundary.index > 0`, lines 30-35 are the separate length-truncate
  fallback untouched by this fix.
- `test/intake/classify.test.mjs:8-32` — 5 existing `deriveTitle` tests:
  real sentence boundary (line 9), line boundary via bare `\n` (line 13),
  no-boundary passthrough (line 17), long-text word-edge truncate (line
  20-24), blank/non-string fallback (line 27-31). None currently cover a
  dotted filename/abbreviation opening the text — confirmed via `rg` (no
  match for `CONTEXT.md` in either `classify.mjs` or its test file before
  this fix).
- `plans/reports/capture-recording-points-audit-260729-1745-report.md`
  (item's own `refs`) — prior audit context for this capture point.
- Item description's own reproduction: `fgos submit` on tsk-47e and
  tsk-42i (2026-07-29), both text opening with `CONTEXT.md (nơi DUY
  NHẤT...)`, both landed with title `CONTEXT`, both hand-corrected via
  `fgos edit --title`.

## Deferred to planning

- Exact new test case wording/count in `test/intake/classify.test.mjs`
  (D3 fixes the acceptance surface; phrasing is planning/execution's
  call).
- Whether to add a short inline comment at the changed regex noting the
  filename/abbreviation false-positive it fixes (implementer's call).

## Outstanding questions

None — the bug report already specifies the exact regex, the single
changed line, and the verify criteria; no product-level ambiguity
remains for a person to resolve. All three decisions (D1-D3) are locked
directly from the request text and confirmed against the current source.
