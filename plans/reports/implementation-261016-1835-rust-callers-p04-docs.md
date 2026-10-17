# Rust callers phase 04: docs and changelog

Scope: docs and CHANGELOG only (steps 3 and 4). No code, no test file.

## Files changed

- `docs/specs/observe.md`
- `docs/specs/distribution.md`
- `docs/platform/holder-lock/spec.md`
- `docs/platform/packaging-distribution/contracts/repository-runtime-layout.md`
- `docs/architect/packaging-distribution/runtime-identity-and-activation.md`
- `CHANGELOG.md` (one line under `## [Unreleased]` / `### Changed`)

## Claims replaced (old -> new)

| File | Old | New |
|---|---|---|
| observe.md §1 Owns | store lock `.fgos/observe/.lock` | `<fgosDir>/locks/observe.lock`, kernel lock |
| observe.md §3 Store Lock | `O_CREAT \| O_EXCL`, record `{pid,startTime,ts}`, reclaim on dead holder or TTL 30 s | kernel lock, wait 5 s, no TTL, no record, no stale reclaim, shard snapshot under lock, killed holder frees at once; old path is a tombstone |
| observe.md §6 | none | new decision entry |
| distribution.md row 5g | repo/machine lock lists without the three locks | `activation`, `observe` added to repo scope; `install` to machine scope |
| distribution.md RUL18 | none for fgctl's own locks | three sub-bullets: kernel activation/install locks, tombstones, main-checkout probe + v1 read + tombstone as "moved", Windows `lock-driver-unavailable` |
| distribution.md history | none | new entry |
| repository-runtime-layout.md §2 | `install.lock` at store root | `locks/install.lock` kernel lock, plus activation lock note and tombstone note |
| runtime-identity-and-activation.md (layout tree) | `install.lock` | `locks/install.lock` + activation lock note |
| runtime-identity-and-activation.md §6 | "hold `install.lock` ... workspace activation lock" | kernel locks at stated paths, no TTL/stale, Windows refusal |
| runtime-identity-and-activation.md §14 | "acquires install.lock" | install lock path |
| holder-lock/spec.md §7 | no row for the three locks (ranks table already listed the names) | table of the three rows (scope, new path, legacy path, caller) + 5 s / probe notes |
| holder-lock/spec.md §12 | fence table without them | tombstone row for the three |
| holder-lock/spec.md §15 | none | decision entry for this track |

Line numbers shift per edit and the diff shows them; none of the old TTL/stale/`create_new` claims for these three locks remain in the owned docs (checked by reading each file in full).

## Not settled

- Could not read `plans/261016-1306-fgctl-rust-callers-on-holder-lock/plan.md` or the phase file: neither is in this worktree, and Bash and reads outside the worktree were refused. D1-D6 are therefore not copied by number; the §15 entry is written from the facts in the assignment. It says so in its last sentence. Lead should replace that sentence with the real D1-D6 list.
- `fgos convention check </dev/null` not run (Bash refused). Docs keep one H1 and H2+ sections; the new observe.md decision entry uses an H3 under the existing H2.
- `git diff` scope not verified by command; only the six owned files plus this report were written.
- The holder-lock spec header "Implementation status" line still says only the 4.2 pieces; left as is (not 4.2 content to rewrite).

Status: DONE_WITH_CONCERNS
Summary: Docs and CHANGELOG updated for the activation, install and observe kernel locks. D1-D6 numbering, convention check and diff scope could not be verified because plan.md was unreadable and Bash was refused.
Context refs:
- (none)
Expected outputs:
- (none)
