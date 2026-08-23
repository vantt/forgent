# fgos-participant-contract — clarify decisions (tsk-64e)

## Feature boundary

Write one page, `docs/reference/fgos-participant-contract.md`, that answers
"what does it take to be a full fgOS participant in a language other than
Node?" — today that answer is scattered across four places (`docs/io-
contract.md`, `docs/specs/work-state.md` RUL10, `SCHEMA_VERSION` in
`src/state/work.mjs`, and `src/state/replay.mjs`'s fold rules), so a
non-Node client author has to read the ~215KB spec and infer the contract
themselves. This item does not write a new spec — it gathers and points,
turning decision [0014](../../decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md)'s
clause 1 ("any process, any language, that speaks the log-format correctly
is a full participant") from a stated claim into something actually usable.

Out of scope (already ruled at item creation, reconfirmed here): no new
spec for the lock protocol (RUL10 already covers it), no contract changes,
no refactor of `bin/fgos.mjs`.

## Locked decisions

| ID | Decision |
|---|---|
| D1 | `docs/reference/fgos-participant-contract.md` is written in **English**. |

### D1 — doc language: English

**Question asked:** what language should the new page be written in?

**Scout evidence:**
- Every source this page compiles from is Vietnamese: `docs/io-contract.md`,
  `docs/specs/work-state.md` (RUL10), decision
  [0014](../../decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md), and the
  `docs/history/gate-question-quality-and-routing/DISCUSSION.md` thread
  that spawned this item.
- But `docs/reference/` — where this page will live, per the item's own
  `verify` field — is 15/17 files English; only
  `capacity-cross-provider-governance.md` and
  `priority-formula-and-intent-retirement.md` contain Vietnamese text.
  `docs/reference/work-item-pipeline-stages-verbs-and-handoffs.md` is a
  directly comparable precedent: hand-authored (not generated via
  `fgos-coding-compounding`/`fgos-indexing`, `sourceCaptureId: null` in
  `docs/enduser-docs-index.json`), English, same `docs/reference/` folder.
- The page's real audience is "someone writing an fgOS client in a
  language other than Node" — not necessarily a Vietnamese speaker.

**Answer:** English, matching the `docs/reference/` folder convention and
the doc's actual audience over the language of its source material.

## Pinned terms

- **Participant** — any process, any language, that speaks the fgOS
  contract correctly (decision 0014 clause 1). Not a synonym for "links
  the Node client lib" — the lib (`p-09351985`) is one reference client of
  the contract, not the contract itself (0014 clause 2).
- **Write door** — spawning `fgos <verb>` (a subprocess call). The only
  legitimate way to mutate `.fgos/` state; never a direct write to
  `.fgos/events.jsonl`.
- **Read door** — calling a read verb (`list --json`/`ready`/`triage`/
  `rollup`/etc.) instead of parsing `.fgos/events.jsonl` directly.

## Scout paths and evidence cited

- `docs/io-contract.md` — the CLI door + envelope contract (CTR001):
  single write door via verb + `writer` identity field (§"Chiều vào"),
  unified `fgos.v1` envelope + exit-code-only success/failure (§"Chiều
  ra"), the four envelope-less exception streams (§"Ngoại lệ có lý do"),
  and the version-token table (§"Version token").
- `docs/specs/work-state.md` RUL10 (line 1045) — the `.fgos/events.lock`
  protocol: wx-atomic-create + dead-pid reap, blocking-with-timeout +
  backoff, `lock-timeout` error category, `withEventsLock` wrapping the
  whole read-precheck-write chain in `addWork`/`editWork`/`moveWork`/
  `moveStage`.
- `src/state/work.mjs:199` — `SCHEMA_VERSION = 3`, the event shape's
  version token (also table-summarized in `docs/io-contract.md`'s "Version
  token" section, row "Sự kiện (event log)").
- `src/state/replay.mjs` — the fold rules a raw-log reader would have to
  reimplement themselves (cited via `docs/io-contract.md`'s framing: doing
  this is legal but expensive, "each guard in replay.mjs is a bug already
  paid for").
- `herdr-plugin/src/fgos.rs` — the real, already-working precedent: a
  ~4900-line Rust crate that never touches `.fgos/` directly. `run_fgos()`
  (line 297) spawns `node bin/fgos.mjs <verb> --dir <root>` and reads
  stdout; `FgosCliSource` (line 347) implements the `WorkItemSource` trait
  (`crate::ports::WorkItemSource`) purely through that subprocess call;
  every response is checked for `"contract": "fgos.v1"` (lines 378, 438,
  468, 587, 659, 710, 757) before being trusted. This is the pattern the
  new doc should hold up as a worked example — today that pattern only
  exists in this crate author's head, not written down anywhere.
- `docs/history/gate-question-quality-and-routing/DISCUSSION.md` lines
  356-403 ("Làm rõ ở vòng 9") and 1453-1463 (`#task-participant-contract`)
  — the design discussion that produced this item. Already locks the
  read/write table this doc's content item (2)/(3) restates:

  | | Language-free? | How | Why |
  |---|---|---|---|
  | Read | yes, fully | call a read verb (`list --json`/`ready`/`triage`) | avoids reimplementing `replay.mjs` |
  | Read raw log | allowed but **expensive** | parse `events.jsonl` directly | must reimplement the fold — every guard in `replay.mjs` is a bug already paid for |
  | **Write** | yes, fully | **spawn `fgos <verb>`** | inherits lock + CAS + validation + identity gate; never opens a second write door |

- `docs/enduser-docs-index.json` — confirms the pattern for a hand-authored
  reference doc with no captured-work-item source: `quadrant: "reference"`,
  `sourceCaptureId: null` (see `work-item-pipeline-stages-verbs-and-
  handoffs.md`'s entry). This item's own footprint already names
  `docs/enduser-docs-index.json` as a file to touch — adding an entry in
  this same shape is an implementation detail for `fgos-coding-planning`, not a
  clarify-stage question.

Impact-analysis capability gate (per `CLAUDE.md`): `fgos tool query
--capability impact-analysis --status present` returned GitNexus
`present` → **full**. Not load-bearing here — this item edits no code, so
no blast-radius evidence applies to the writing itself, but the posture is
recorded per the gate's own instruction.

## Canonical references

- [Decision 0014](../../decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md) —
  the locked architecture this doc makes usable.
- [Decision 0011](../../decisions/0011-version-tuong-minh-cho-moi-contract.md) —
  version-token convention, cited by content item (1).
- `docs/io-contract.md`, `docs/specs/work-state.md` RUL10,
  `src/state/work.mjs`, `src/state/replay.mjs`, `herdr-plugin/src/fgos.rs`
  — the primary sources this page compiles.
- `docs/history/gate-question-quality-and-routing/DISCUSSION.md` —
  originating discussion (§"Làm rõ ở vòng 9", `#task-participant-contract`).

## Outstanding questions

None
