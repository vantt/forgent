---
phase: 2
title: "Identities, registry, generations, short names, resolution"
status: done
priority: P2
effort: "4h"
dependencies: [1]
---

# Phase 2: Identities, registry, generations, short names, resolution

## Goal

The core can register a head under the four-row table of spec §5.1, keep a per-process generation, give the head a short name of shape `<project>-<cli>-<2 hex>`, and resolve a typed name to exactly one binding or refuse with candidates.

## Context links

- Spec §5.1 (registration table, lines 180-192), §5.1.1 names, §3 vocabulary; owner decisions in §17 rows "Names", "generation number is kept … keyed on the process", A5 four-row table.
- `fgos_process::Verdict` (`packages/process/rust/src/facts.rs:19-27`) is what the store will map onto the core's own `Liveness`; the core cannot import it (serde only).

## Design (what to build)

New modules, all re-exported from `lib.rs`:

- `src/time.rs`: `Timestamp(u64)` milliseconds since the Unix epoch, supplied by the caller. Helpers `plus_secs(u64)` and `secs_since(Timestamp)` are saturating. `MailboxState` keeps `last_now`, and every operation first sets `now = max(now, last_now)` and stores it, so a wall clock that steps back never shrinks a window, lengthens a deadline or makes a stored time lie in the future.
- `src/ids.rs`: `pub trait IdSource { fn next_u64(&mut self) -> u64; }` (the only port of V1). `MessageId`, `AttemptToken` (opaque strings minted as lowercase hex of one `next_u64`), `WriterKey` (non-empty opaque string, the session-identity writer id), `Cli` (non-empty, `[a-z0-9]`), `ShortName`, `Generation(u32)`. Constructors return `Result<_, InvalidValue>`; errors implement `Display` + `std::error::Error` by hand (secrets-crate style).
- `src/state.rs`: `MailboxState { last_now, bindings: BTreeMap<WriterKey, Binding> }` with `new()` and `binding(&self, &WriterKey) -> Option<&Binding>`, deriving `Serialize`, `Deserialize`, `Clone`, `PartialEq`, `Debug`. **Snapshot rule** (plan "Architecture"): `BTreeMap`/`Vec` only; every map key is a `String` newtype (`WriterKey` serialises as a string; composite keys added later are one canonical string newtype, never a tuple or struct, because `serde_json` writes only string map keys); no borrowed field (`&'static str` cannot be read back from an owned buffer).
- `src/registry.rs`:
  - `Liveness { Alive, Dead, Unknown }`; `StoredHead { same_head: bool, liveness: Liveness }`.
  - `Binding { key, name, cli, generation, head: String, handle: Option<String>, registered_at, last_seen }`. `head` and `handle` are opaque text the store writes (`Record::to_json()` text, the Claude socket or Codex thread id); the core never parses them.
  - `RegisterRequest { key, cli, project: String, own_suffix: Option<String>, head: String, handle: Option<String> }`.
  - `MailboxState::register(&mut self, req, judged: Option<StoredHead>, now, &Limits, &mut dyn IdSource) -> Result<Registered, RegisterRefusal>`, plain inputs as spec §5.1 says. The store reads `binding(&key)` under the mutex, judges it with `fgos_process` (V2), then calls `register`. A judgement that does not match the state (`Some` with no binding, `None` with a binding) is refused `RegisterRefusal::JudgementMismatch` and changes nothing. Rows, evaluated in this order:

    | Stored binding for this key | Result |
    |---|---|
    | none | `Registered::Created { generation: 1 }` |
    | `same_head` | `Registered::Refreshed` (only `last_seen` changes; no bump) |
    | different head, `Alive` | `Err(RegisterRefusal::Conflict)`; binding untouched |
    | different head, `Unknown` | `Err(RegisterRefusal::Deferred)`; binding untouched, retried at the next hook |
    | different head, `Dead` | `Registered::Replaced { generation: old + 1 }`; new `head`, `handle`, `registered_at`; name kept |

  - The generation is part of the binding inside `MailboxState`, so it is bumped in the same state value V2 installs under the mutex: no separate generation store.
- `src/names.rs`:
  - Short name = `<project part>-<cli>-<suffix>`. Project part: the folder name with every character outside `[A-Za-z0-9._-]` replaced by `-` (plan decision 7). The project part is cut so the whole name is at most `frame.maxHeaderChars` characters. Suffix: `own_suffix` (the Claude head's own two characters) only when it matches `[0-9a-z]{2}` and is free within project and CLI; otherwise lowercase hex drawn from `IdSource`, 2 characters, and on a collision 3, then 4 … (terminates because the set of bindings is finite).
  - `MailboxState::resolve(&self, query: &str) -> Result<&Binding, ResolveRefusal>`: a query containing `,`, whitespace or `*` is `Group`; then exact short name; then unique prefix of a short name; then unique prefix of a key; else `Ambiguous { candidates }` (all matches at the first step that had more than one) or `Unknown { candidates }` (all current short names, sorted).

## Start

Run the branch sync (plan.md § "Branch sync rule") and confirm the previous phases' tests are green on top of it before writing a new test.

## Tests before (red), owning files

`tests/registry.rs` (owns: the four-row table, generation rules, name allocation):

1. *no binding creates generation 1 with a project-cli-2hex name*.
2. *registering the same head again refreshes last seen and does not bump*.
3. *a different head while the stored head is alive is a conflict and leaves the binding untouched* (compare the whole binding before and after).
4. *a different head while the stored head is unknown is deferred and leaves the binding untouched*.
5. *a different head after the stored head is dead replaces it with exactly one bump and keeps the name* (covers "changed pid or start time bumps" and "a resumed conversation in a new process bumps": both reach the store as a different head with the old one `Dead`).
6. *a judgement that does not match the stored state is refused and changes nothing* (`Some` with no binding; `None` with a binding).
7. *a Claude head keeps its own two characters; a second head that would collide gets three hex characters; an own suffix outside `[0-9a-z]{2}` is replaced by drawn hex*.
8. *a folder name with spaces or non-ASCII is reduced to the name alphabet and a long one is cut so the name fits the header bound*.

`tests/snapshot.rs` (owns the snapshot rule; every later phase that adds a `MailboxState` field extends this one test instead of adding another):

9. *a state with every field populated survives a JSON round trip from an owned String unchanged*.

`tests/registry.rs` also owns the clock rule:

10. *a clock that steps back is treated as the last time seen*: register at t=1000 s, register again at t=10 s; `binding.last_seen` stays 1000 s and the state's `last_now` is 1000 s.

`tests/names.rs` (owns: resolution):

1. *exact short name wins over a longer name it prefixes* (`forgent-codex-9c` vs `forgent-codex-9c1`).
2. *a unique prefix resolves* (`forgent-codex` with one Codex head).
3. *an ambiguous prefix is refused and lists both candidates*.
4. *a unique key prefix resolves when no short name matches*.
5. *an unknown name is refused and lists the current names*.
6. *a comma, space or star in the query is refused as a group*.

`tests/common/mod.rs` gains `SeqIds` (an `IdSource` returning 1, 2, 3 …) and `t(secs) -> Timestamp`.

## Refactor

None expected; keep `register` under ~60 lines by putting name allocation in `names.rs`.

## Not in this phase (and where it lives)

- "Two heads registering at once get distinct generations" needs two processes and the mutex: V2 (spec §11 marks it concurrent).
- "Mail for generation 1 never reaches generation 2" and "a finish from generation 1 after a takeover is ignored": phase 3 (needs send and claim).
- Refusing an `att-` head: never reaches the core (the wiring does not register it; spec §1, §14 V3/V5).

## Tests after / regression gate

```bash
git fetch origin && git merge --no-edit origin/main   # branch sync rule (plan.md); proof counts only on a fresh main
cargo test -p fgos-mailbox-core --locked
cargo clippy -p fgos-mailbox-core --all-targets --locked -- -D warnings
cargo fmt -p fgos-mailbox-core -- --check
node scripts/git-one-door-scan.mjs --write-census
```

## Acceptance criteria

- All 16 tests above pass; each title names its behaviour in plain words.
- No `fgos_process` (or any crate other than serde) is imported; the core holds the head identity only as opaque text.
- One commit on `mailbox/v1-v3`: `feat(mailbox): register heads with per-process generations and resolve short names`, census regenerated in it.

## Risks

- A caller that judges the wrong binding: the mismatch refusal catches `Some`/`None` errors; judging a different binding of the same key is impossible because there is one binding per key.
- Name collisions across CLIs are impossible by shape (the CLI is in the name).

## Implementation notes (2026-10-21)

- Deviations (smallest correct fix, no behaviour beyond the plan):
  - `RegisterRefusal::NameDoesNotFit` added: an empty project folder name, or a header bound too small for `-<cli>-<suffix>`, leaves no short name to allocate; refusing is the only answer that keeps the bound.
  - `Registered` variants carry the allocated `name` as well as the generation, so the caller (hook, V3) need not read the binding again.
  - `Timestamp::is_past(since, secs)` replaces the planned `secs_since`: comparisons are made in milliseconds so a sub-second remainder never rounds a deadline down.
  - The judgement check runs before the clock and (from phase 4) the sweep, so a mismatch leaves the whole state equal.
  - On `Replaced` the name and the CLI are kept from the stored binding; the head, handle and times come from the request.
