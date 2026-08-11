# fgOS participant contract — what it takes to be a full participant in any language

Hand-authored reference, verified 2026-08-09 by reading the real source
(not generated via `fgos-coding-compounding`/`fgos-indexing` — no captured work
item backs this doc, so it carries no `docType`/`docPath` linkage). Scope:
the complete answer to "what does my process need to do to be a full
fgOS participant, in a language other than Node?" Gathers and points —
it introduces no new contract, no new spec, and no code change. The full
contract is specified, in detail, across four places; this page is the
map between them.

## Why this page exists

[Decision 0014](../decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md)
locked this claim: "the standard contract is the event-log schema plus the
append/read/subscribe protocol, **not a linkable lib** — any process, in
any language, that speaks the log-format correctly is a full participant."
That claim was true the day it was written, but nothing wrote down what
"speaks the log-format correctly" actually requires. The answer was
scattered:

| Piece | Where it actually lives |
|---|---|
| Event shape + schema version | `src/state/work.mjs` |
| CLI door, envelope, identity | `docs/io-contract.md` |
| Event-log lock protocol | `docs/specs/work-state.md` RUL10 |
| Fold rules (state from events) | `src/state/replay.mjs` |

A person writing a non-Node client had to read the ~215KB spec
(`docs/specs/work-state.md`) and infer the contract themselves.
`herdr-plugin` (Rust, ~4900 lines) already did exactly that inference
correctly — see [Worked example](#worked-example-herdr-plugin-rust) below
— but that correct inference lived only in its author's head, not in a
document anyone else could read first. This page is that document.

## What a participant is — and isn't

A **participant** is any process that reads and/or writes fgOS work-item
state correctly, regardless of language. It is not a synonym for "links
the Node client library." Decision 0014's second clause is explicit: the
Node lib (backlog line `p-09351985`) is one *reference client* of the
contract, not the contract itself. Nothing about being a full participant
requires Node, requires linking a library, or requires running in the
same process as `fgos`.

## The read door and the write door are not symmetric

The two directions of the contract have different cost profiles, and
conflating them is the most common way to over-engineer a client:

| | Free in any language? | How | Why |
|---|---|---|---|
| **Read** | Yes, fully | Call a read verb: `fgos list --json`, `ready`, `triage`, `rollup`, etc. | Avoids reimplementing the fold |
| Read the raw log | Allowed, but expensive | Parse `.fgos/events.jsonl` directly | You must reimplement `replay.mjs`'s fold yourself — every guard in it is a bug that was already found and paid for once |
| **Write** | Yes, fully | **Spawn `fgos <verb>`** as a subprocess | Inherits the lock, CAS, validation, and identity gate for free; never opens a second write door |

Read raw log is legal — nothing stops a process from parsing
`events.jsonl` directly — but it is not free. `replay.mjs` folds the
event log into current state, and every conditional in that fold exists
because some real bug was found and fixed there. A client that reimplements
the fold from scratch reimplements those bugs too, one at a time, as it
discovers them the hard way.

## Event shape and version commitment

Every event in `.fgos/events.jsonl` carries a schema version field, `v`.
As of this writing, `SCHEMA_VERSION = 3` (`src/state/work.mjs:199`).

Per [decision 0011](../decisions/0011-version-tuong-minh-cho-moi-contract.md)
("every contract carries an explicit version in its own identifier"), a
participant reading raw events must check `v` and handle version drift
explicitly rather than assuming today's shape is permanent. The same
decision's version-token table (reproduced from `docs/io-contract.md`):

| Surface | Token | Where it appears |
|---|---|---|
| CLI envelope (CTR001) | `fgos.v1` | field `contract`, every envelope, both binaries |
| `fgos-runner` stdout (CTR003) | `fgos.v1` (reused, no separate token) | same mechanism as CTR001 |
| Verb manifest | `2.0` | field `schema_version` in `fgos --help --json`'s `{schema_version, commands[]}` |
| Event log | `3` | field `v` on every event, `SCHEMA_VERSION` in `src/state/work.mjs` |
| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | carried through the `work.move` event's own `SCHEMA_VERSION` — no separate version field, to avoid a second field for the same fact |

A participant that only ever calls verbs (read or write) never has to
track `SCHEMA_VERSION` itself — the CLI already handles it. It only
matters to a participant that reads the raw log directly.

## The write door: spawn `fgos <verb>`

**Never write to `.fgos/events.jsonl` directly, in any language.** The
only legitimate way to mutate fgOS state is to spawn `fgos <verb>` as a
subprocess and let it append the event.

Why this is a hard rule, not a preference: `bin/fgos.mjs`'s single write
door (CTR001/CTR002, per `docs/io-contract.md`) is what a write through the
verb inherits, for free:

- **The event-log lock** (`docs/specs/work-state.md` RUL10) —
  `.fgos/events.lock`, a wx-atomic-create-plus-dead-pid-reap primitive with
  a blocking-with-timeout-and-backoff policy. Without it, two processes
  appending concurrently can both read the same last `seq` and both write
  `seq+1` — a real race, confirmed by spike testing before the lock
  existed. A timed-out lock acquisition surfaces as its own error category,
  `lock-timeout`, distinct from `corrupt-log`/`validation` — it means
  "someone else is writing right now, retry the whole operation," not
  "the data is broken."
- **Read-precheck-write atomicity.** `withEventsLock`
  (`src/state/events.mjs`) lets a caller hold the lock across an entire
  read-check-then-write sequence, not just the append itself.
  `addWork`/`editWork`/`moveWork`/`moveStage` (`src/state/store.mjs`) all
  wrap their id-existence check and CAS (`expectedStatus`/`expectedStage`)
  precondition inside that one locked session — so two verb calls racing
  on the same item never both pass the precheck and then both write
  conflicting events. A second process contending for the same id sees the
  first process's event already landed by the time it re-reads, so its own
  precheck correctly reports the real conflict (`validation` "already
  exists", or a CAS `conflict`) instead of silently overwriting.
- **CAS validation** — every state-changing verb validates its
  precondition (expected current status/stage) before writing, and fails
  loud (a `validation` or `conflict` error) rather than clobbering
  concurrent state.
- **The identity gate** — every write carries a `writer` field (`id` +
  `source`, one of `registry`/`env`/`pid`/`unresolved`, most-trusted
  first) recording which process/session made the change. This is
  attribution, not authentication (`docs/io-contract.md`'s own D1: a local
  CLI cannot authenticate its caller) — but it is free audit trail a
  direct log write would have to reconstruct by hand, correctly, forever.

Spawning the verb also means never opening a second write path into
`.fgos/` (locked law L10, add-through-not-alongside; L3). A client that
writes raw events today has to reproduce the lock, the CAS precheck, and
the identity gate exactly, and keep reproducing them correctly every time
any of the three changes upstream. Spawning `fgos <verb>` means never
having to.

## The read door: call a read verb

Prefer a read verb — `fgos list --json`, `ready`, `triage`, `rollup`, and
so on — over parsing `.fgos/events.jsonl` directly. The read verb already
ran the fold (`src/state/replay.mjs`) and handles every edge case that
fold has ever needed a guard for. A client that parses the raw log instead
is committing to rediscovering — and re-fixing — those edge cases itself.

This is a real option, not a forbidden one (unlike writing raw): reading
the raw log is sometimes the right call for a participant that genuinely
needs to observe events as they land, not just current state. It is a
cost/capability tradeoff, not a rule violation.

## The `fgos.v1` envelope

Every successful verb call, on both binaries (`fgos.mjs`, and from slice 2
onward `fgos-runner.mjs`'s own final result line), prints exactly one
standard envelope to stdout:

```json
{ "contract": "fgos.v1", "generated_at": "...", "data_hash": "...", "data": { ... } }
```

`data`'s shape depends on the verb: a read verb returns the result object
directly; a write verb returns exactly the fields it just changed.

**Recognizing a real envelope:** parse a stdout line as JSON, then check
`contract === 'fgos.v1'`. **Never recognize it by a text heuristic** (e.g.
"the line starts with `{`") — `fgos-runner`'s progress-trace stream (see
below) can itself contain assistant output starting with `{`, which would
false-positive a heuristic check.

**Success and failure are distinguished by exit code, never by envelope
content.** The error path does not wrap an envelope at all: diagnostics go
to stderr, and the caller branches on the exit code's category, never on
message text. The one source of truth for exit codes is
`src/state/store.mjs`'s `EXIT_CODES` (`2` precondition · `3` conflict ·
`4` validation · `5` corrupt-log · `7` lock-timeout · `8` session-fail ·
`9` merge-fail) plus `src/runner/loop.mjs`'s `EXIT_BUSY` (`6`, runner-only).
`0` is success; `1` is "unclassified."

**One envelope per line, one shot per call.** `fgos.mjs` prints exactly
one envelope per invocation. `fgos-runner` prints one envelope per
`--once` run, or per `--watch` cycle — always on a single line, since
`--watch` emits a sequence of envelopes over time and each one has to be
separable from the next.

## Streams without an envelope (four exceptions)

Four output streams intentionally do not wrap the `fgos.v1` envelope, each
for its own reason — quoted from `docs/io-contract.md`'s own "Ngoại lệ có
lý do" ("exceptions with a reason") section:

1. **The machine-readable verb manifest** (`--help`/`--help --json`,
   including `<verb> --help`) — this is metadata *about* the CLI, not a
   verb's own payload.
2. **`setup`/`doctor --pretty`** — an explicit human-display exit, gated
   behind the `--pretty` flag, not the default payload.
3. **Worker logs** (`.fgos/logs/<id>.log`) — deliberately plain text, so
   `tail -f` sees it live; wrapping an envelope would break exactly that.
4. **`fgos-runner`'s progress-trace stream** (reap, claim, discover/decompose
   verdicts, proof tail, retries, stop — plus the "watch mode stopped"
   lifecycle line on shutdown signal) — printed to console as-is, a
   separate, already-locked feature this contract does not touch.

The `fgos-discovered` block (a worker signaling newly-found work to the
runner) is also outside this contract — it is CTR003's worker→runner
protocol, not a door facing a person or an external client.

## Raw log writers (rare, not recommended)

If a participant genuinely needs to write to `.fgos/events.jsonl` directly
— bypassing the verb, and therefore the lock, the CAS precheck, and the
identity gate the verb gives for free — the lock protocol it must
reimplement correctly is specified in full at `docs/specs/work-state.md`
RUL10: the `.fgos/events.lock` primitive (wx-atomic-create plus dead-pid
reap), the blocking-with-timeout-and-backoff acquisition policy, the
`lock-timeout` error category, and `withEventsLock`'s read-precheck-write
session discipline. This page does not restate that spec — RUL10 already
covers it in full, and restating it here would create a second copy to
keep in sync. This case should be rare: no consumer in the current
multi-language client direction (launcher, web UI, TUI) needs it, since
read-via-verb and write-via-verb already cover every real need.

## Worked example: herdr-plugin (Rust)

`herdr-plugin` (`herdr-plugin/src/fgos.rs`, ~4900 lines total) is a real,
already-working non-Node participant, and follows every rule on this page:

- `run_fgos()` (`herdr-plugin/src/fgos.rs:297`) spawns
  `node bin/fgos.mjs <verb> --dir <root>` as a subprocess and reads its
  stdout — it never touches `.fgos/events.jsonl`, and never links any
  fgOS library.
- `FgosCliSource` (`herdr-plugin/src/fgos.rs:347-371`) implements the
  crate's own `WorkItemSource` trait (`crate::ports::WorkItemSource`)
  purely by calling `run_fgos()` with different verbs (`triage --json`,
  `list --all --json`, `merge list --json`) — the read door, exclusively.
- Every parsed response is checked for `"contract": "fgos.v1"` before
  being trusted (`herdr-plugin/src/fgos.rs:378,438,468,587,659,710,757`)
  — exactly the envelope-recognition rule above, independently arrived at.

This is the pattern to copy: a subprocess call out to `fgos <verb>`, an
envelope check on the way back in, nothing else touching fgOS state
directly.

## Sources (file:line, read directly 2026-08-09)

- `docs/io-contract.md` — CLI door, envelope, identity, exit codes, the
  four envelope-less exceptions, the version-token table.
- `docs/specs/work-state.md:1045` — RUL10, the `.fgos/events.lock`
  protocol in full.
- `src/state/work.mjs:199` — `SCHEMA_VERSION = 3`.
- `src/state/replay.mjs` — the fold rules a raw-log reader must
  reimplement.
- `herdr-plugin/src/fgos.rs:297,344-371,378,438,468,587,659,710,757` —
  the worked-example participant.
- [Decision 0014](../decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md) —
  the locked architecture this page makes usable.
- [Decision 0011](../decisions/0011-version-tuong-minh-cho-moi-contract.md) —
  the version-token convention.
- `docs/history/gate-question-quality-and-routing/DISCUSSION.md`,
  "Làm rõ ở vòng 9" — the design discussion that produced this page, and
  first wrote down the read/write table reproduced above.
