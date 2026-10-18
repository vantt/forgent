# Review: Event Store phase 01 (steps 1-6), crate, envelope, registry, baseline

- Branch `event-store/p01-crate`, worktree `.claude/worktrees/es-p01`, base `93aad788c`, head `9b1894b00`.
- Contract read: phase-01 plan, `docs/platform/event-store/spec.md` §3-§8, §12, §17, §18, §21-§23, both phase-lead reports, `core/instructions/design-principles.md`.
- Read-only review. The only file written is this report.

## Verdict

No Critical findings. One High: the canonical-JSON "one door" from plan requirement 2 is only partly done, and nothing tracks the rest. Ten Medium findings should be fixed or ticketed before phase 02 builds on this crate. The core identity math checks out: `h` = SHA-256 of the canonical line without `h`, including the newline. Rust and Node agree on every shared vector. The Rust legacy order matches `replay.mjs` on the fixtures. The real tracked corpus parses under the Rust rules.

## What I ran

| Command | Result |
|---|---|
| `cargo test --locked -p fgos-event-store -p fgos-canonical-json` (private `CARGO_TARGET_DIR` in the scratchpad) | 15 passed, 0 failed |
| `cargo clippy --locked -p fgos-event-store -p fgos-canonical-json --all-targets -- -D warnings` | clean |
| `cargo fmt -p fgos-event-store -p fgos-canonical-json -- --check` | clean |
| `cargo fmt --all -- --check` (the plan's exact command) | **fails** on `apps/fgctl/tests/windows_holder_lock_gate.rs`. This branch does not touch that file; the problem predates it (L12) |
| `node --test test/event-store/` | 5 passed. `npm test` picks these files up through `scripts/run-tests.mjs`, which discovers `test/**/*.test.mjs` |
| Ad-hoc Node scan of the real tracked corpus (`.fgos/events.jsonl` + 90 shards, 33,717 lines) | Every line is an object with a string `ts`. `seq` is a number or absent on every line. 9,601 lines have a 16-hex `h`, 24,116 have none |
| Ad-hoc v3 `h` check: strip the trailing `,"h":"<16hex>"}` from the raw line, then SHA-256 and take 16 hex | **9,601 / 9,601 verify** (supports M3) |
| `git diff 93aad788c 0ce27efc3 -- bin src` | empty. The baseline ran on bytes identical to main's `bin/` and `src/` as claimed; `a4b1278ae` is an ancestor |

## Critical

None.

## High

### H1. The canonical one door is half done, and the other half is untracked
- Files: `packages/run-supervisor/rust/src/envelope.rs:19` (still has its own `canonical_json`/`quote`), `packages/distribution/rust/src/verify.rs:46` (`to_canonical_json`), new `packages/canonical-json/rust/src/lib.rs:14`.
- Why it is wrong:
  - Plan requirement 2 says `fgos-run-supervisor` **moves** to the leaf and keeps its integers-only check on top. Phase-01 Files lists the edits to `run-supervisor/rust/src/envelope.rs` and its `Cargo.toml`.
  - Distribution was correctly left alone. The audit (`tests/distribution_compatibility.rs`) proves that `1.0` and non-BMP key order change its digest. But the plan says that "the phase report opens an item", and none was opened: `docs/backlog.md` has no entry for the digest migration or for the run-supervisor move.
  - The repository now has **three** canonical serializers instead of two. Design principle 1 and L10 require moving every consumer in the same change, or opening an item for the rest.
- Fix:
  - Before this merges to `event-store/integration`, either do the run-supervisor move or record why it is blocked (the unit 1 report names a concurrent terminal-mode lane).
  - The move itself: `canonical_json` = leaf call plus a pre-walk that refuses non-integers or values outside the safe range, so the golden digests in `run-supervisor` stay byte-equal.
  - Either way, open two backlog rows, link them from the phase report and the program-board ES row, and name the owner and the trigger:
    1. "run-supervisor adopts fgos-canonical-json".
    2. "distribution digest v2 on fgos-canonical-json; existing digests change for float/non-BMP".

## Medium

### M1. `Envelope::parse` accepts non-canonical bytes
- File: `packages/event-store/rust/src/envelope.rs:95-99`.
- Why it is wrong:
  - `parse` deserializes with serde (any key order, any whitespace, `1.0` vs `1`, duplicate keys inside `payload`, where the last one wins) and then recomputes `h` over the *re-canonicalized* value. Several different byte strings therefore "verify" as the same event `h`.
  - §6 makes the canonical line the event's stored form. The seal `sha256` and the batch-marker `sha256` hash raw bytes. A reader would accept a line that the store never wrote in that form, and doctor `event-store-integrity` could not tell a hand-edited line from a real one.
- Fix:
  - In `parse`, require `raw == self.canonical_line()?`. Decide whether the trailing `\n` belongs to the input and document it.
  - Add negative vectors: reordered keys, an extra space, `"seq":1.0`, a duplicate payload key.

### M2. Identifier formats are only checked for non-emptiness
- Files: `envelope.rs:64` (`origin`), `:171` (marker `origin`), `:241` (seal `machine_id`), `:250-253` (merge `parents`), `:262` (legacy `fromCommit`/`treeOfFgosEvents`), `:104-108` (seen key origin). The same `minLength: 1` appears in `contracts/envelope.v4.schema.json`, `batch-commit.v1.schema.json` and `seal.v1.schema.json`.
- Why it is wrong:
  - `origin` is the store id: 32 lowercase hex (§5, and `identity.rs:82-86` already checks exactly that).
  - An origin containing `:` makes the own-stream exclusion `format!("{origin}:{stream}")` (`:75`) and the `split_once(':')` seen-key parse disagree.
  - D17 (phase 03) compares a seal's `machineId` with the ref's machine-id segment. That needs the §5 grammar `^[a-z0-9][a-z0-9-]{1,62}$` enforced on the record. `valid_machine_id` already exists (`identity.rs:19`).
  - Merge parents and legacy ids are Git object ids.
- Fix:
  - Add one `valid_store_id` in a shared module and reuse it from `identity.rs`. Use `valid_machine_id` for seal and merge headers. Use an object-id check (40 or 64 lowercase hex) for `parents`, `fromCommit` and `treeOfFgosEvents`.
  - Mirror these as `pattern`s in the three schemas, ideally one shared `$defs`.
  - Add negative tests.

### M3. Legacy v3 `h` is used as identity but never verified
- File: `packages/event-store/rust/src/legacy.rs:140-150`.
- Why it is wrong:
  - §6 says v3 lines are "verified and deduplicated by their own rule". §21 `event-store-integrity` fails on "an event `h` that does not verify". The port only uses `h` as a dedupe key.
  - A verification rule that never re-canonicalizes exists and holds on the whole real corpus: strip the trailing `,"h":"<h>"}` from the **raw** line, put back `}`, take the first 16 hex of its SHA-256 (`src/state/event-log.mjs:207-213`). It matched 9,601 / 9,601 tracked lines.
- Fix:
  - Add `LegacyEvent::verify()` (or verify in `parse_file`) using the raw-suffix rule. A mismatch returns `event-store-integrity`.
  - Add a tampered-`h` vector to `legacy-order.v1.json`.
  - If this is deliberately deferred to phase 03/08, write that in the phase report so the gap stays visible.

### M4. The branch-key slug *rule* is missing; only the validator exists
- File: `packages/event-store/rust/src/layout.rs:165-173`.
- Why it is wrong: Plan requirement 8 asks for the "branch key slug rule", and §7 says the key is "a slug of the worktree's branch name at the stream's first append". The crate only validates an already-slugged key. Every future caller (Work, Git land, promote) would invent its own mapping from e.g. `feature/Foo_bar` to a key, which breaks one door.
- Fix:
  - Add `pub fn branch_key(branch: &str) -> Result<String, Error>` with a documented mapping: lowercase ASCII, any other run of characters becomes `-`, trim `-`, truncate to 128 at a boundary, refuse if empty.
  - Add vectors that cover `/`, `_`, uppercase, non-ASCII, a 200-character name, and a name that is all punctuation.

### M5. Registry rule 1 holds only inside one load; owned namespaces are not reserved
- File: `packages/event-store/rust/src/registry.rs:76-95`.
- Why it is wrong:
  - "A type keeps one scope for its life" (§7 rule 1). Here the only enforcement is refusing a duplicate in one in-memory load. A later release whose contract changes `observe.trace` from `local` to `project` loads cleanly, because nothing compares it with the past.
  - The `store` domain is not reserved, so a consumer can register `store.anything` with domain `store`, although the store owns that namespace (§7 promotion).
  - The type `decision` passes the domain check under **any** domain (`:76`), so ownership of the one legacy name is first-come.
  - In the test, the "scope change" case (`registry_identity_layout.rs:70-72`) is refused by the `work.*` project rule, not by the scope rule. No test isolates a scope change.
- Fix:
  - Reserve domain `store` for built-ins.
  - Pin `decision` to one named domain, or a small table of legacy names with their owning domain.
  - Write in the phase report where life-long rule 1 is enforced (for example: at open, compare each registration's scope with the `scope` recorded in existing events or in `sealed.json`, else refuse). Give it a phase and a test.
  - Add a test that re-registers a non-`work` type with a different scope.

### M6. Missing machine id and plain I/O failures surface as `event-store-integrity`
- Files: `identity.rs:29-35`, `:52`, `:79-80`; `registry.rs:51`.
- Why it is wrong:
  - `event-store-integrity` is the corruption bucket in §21 (hash, marker, gap, seq conflict). A missing `<stateRoot>/machine-id` is the expected state before setup runs its fix, and §21 names `event-store-machine-id` as both check and fix.
  - EACCES or ENOENT on `store.json` or a contract file is not corruption either.
  - Callers and doctor will misreport a fresh machine as corrupted.
- Fix: add `event-store-machine-id` to `contracts/result-codes.v1.json` and return it from `machine_id()` when the id is missing or malformed. Either give I/O errors a separate code or carry `io::ErrorKind` so callers can distinguish them.

### M7. The `store.json` "written once" guarantee rests entirely on a lock nobody takes yet
- File: `identity.rs:134-149` (`fs::rename(&tmp, layout.store())`).
- Why it is wrong:
  - `rename` silently replaces an existing target. Two first appends racing without `event-append` (phase 02 has not wired it) would each mint a store id. The last rename wins, while the first process carries on with an id that no longer exists on disk.
  - Two stores then share one sequence space, which §5 forbids.
  - A crash between the tmp write and the rename leaves `store.<id>.tmp` behind forever.
- Fix:
  - Publish with `fs::hard_link(&tmp, store)`, which fails with `EEXIST` atomically, then `remove_file(tmp)` and fsync the directory. On `EEXIST`, fall back to `open()`. The lock stays the primary guard.
  - Sweep stale `store.*.tmp` under the lock.
  - Add a test that pre-creates `store.json` between the tmp write and the publish (or two threads) and asserts that one id wins and both return it.

### M8. The bench fixture was written inside the source tree, and the reproduce command says to do it again
- Files: `plans/reports/phase-lead-261018-1153-es-p01-u2-registry-identity-baseline.md` (reproduce block: `--root scripts/event-store/bench-fixture`), `scripts/event-store/baseline-ext4.json` (`"root": ".../scripts/event-store/bench-fixture"`).
- Why it is wrong:
  - Plan requirement 11 says the harness is "read-only against the real checkout". AGENTS.md "Scratch artifacts" says to use `.fgos/runtime/tmp/`.
  - `scripts/event-store/bench-fixture` is not gitignored (checked with `git check-ignore`). An interrupted run leaves a nested Git repository inside `scripts/`.
  - The plan's own validation command uses `.fgos/runtime/tmp/v-spawn-ext4`, which is ignored and is ext4 on this machine (`findmnt -T .fgos` → `ext4`).
- Fix: change the reproduce command to `--root .fgos/runtime/tmp/v-spawn-ext4/fixture`. In `v-spawn-bench.mjs`, refuse a `--root` inside the checkout unless it is under `.fgos/runtime/`.

### M9. The baseline result was not written through the convention path, and the raw data sits in `scripts/`
- Files: `scripts/event-store/baseline-ext4.json` (1,579 lines, with absolute `/home/vantt/...` paths and the host-bin path); plan requirement 12.
- Why it is wrong:
  - Plan requirement 12: "write the result through `fgos convention path --kind report --type experiment --slug event-store-v-spawn-ext4-baseline`". The table instead lives inside a phase-lead report, and the raw evidence is committed next to code.
  - §17 part (b) calls this "the baseline of record". It should be an experiment report that a stranger can find under `plans/reports/experiment-*`, as V-SPAWN-01 was.
- Fix: generate the experiment report path with the convention command, move the table and the method there, and move the raw JSON next to it under `plans/reports/` (or link it from there). Optionally relativize the home paths. Leave only code in `scripts/event-store/`.

### M10. The bench measures the compatibility entry, not the standard `fgos` door, and does not record which one it used
- File: `scripts/event-store/v-spawn-bench.mjs:37` (`spawn(process.execPath, [checkout/bin/fgos.mjs, ...])`), `:48` (the result has no entry field).
- Why it is wrong:
  - Part (b) of §17 compares end-to-end CLI p95 before and after cutover. The harness runs the working-tree payload through `node bin/fgos.mjs` with `FGOS_HOST_BIN`, which AGENTS.md calls a compatibility channel. It skips the Rust host's exec and activation resolution that a user's `fgos take` pays.
  - That is fine as long as the after-cutover run uses the same entry, but the JSON does not record the entry, so a later comparison could silently mix the two. The report's phrase "real host was activated release …" could be read as "measured through the host".
- Fix:
  - Add `entry: "node-payload"` to the result.
  - Add an `--entry host` mode that spawns the activated `fgos` shim.
  - Say in the experiment report which entry is the baseline of record. Check which entry V-SPAWN-01 used so the two are comparable.

## Low

- **L1** `legacy.rs:196-200`: `order()` `unwrap()`s `event["ts"].as_str()`. `LegacyEvent` has public fields, so a value built without `parse_file` panics. Make the fields private behind a constructor, or keep `ts` as a validated field.
- **L2** `legacy.rs:170-180`: the Rust parser refuses lines Node accepts: a non-object, a missing or non-string `ts`, or a non-numeric `seq` (Node coerces `"5" - 0`). It also refuses lone-surrogate escapes that `JSON.parse` accepts. The real corpus has none of these (33,717 lines scanned), so this is safe today. Record the deliberate divergence in the phase report and pin it with a test.
- **L3** `contracts/vectors/legacy-order.v1.json`: not covered are `h: ""` (should fall back to raw-line identity), `seq: null`, `seq` as a float, a CRLF line, and two files whose names tie on `ts` with differing `seq`. `test/event-store/legacy-order-parity.test.mjs:15` compares only the parsed events. The `raw`/`{file,line}` provenance is pinned only on the Rust side, against hand-written expectations.
- **L4** Negative tests check `.is_err()` without the code: `registry_identity_layout.rs:66-90`, `:100-116`; `vectors.rs:24`, `:28`, `:127`, `:151`. Assert `code.as_str()` so a test cannot pass on the wrong refusal (see M5).
- **L5** `tests/vectors.rs:9-29` never asserts `canonicalWithoutHash`; only Node does. Vector 2's `"negativeZero": 0` is already `0` in the JSON file, so `-0` is never exercised at envelope level. Use `rawInput`, as `canonical.v1.json` does.
- **L6** The batch marker and the three seal kinds have no shared contract vectors with expected bytes and digest. Only Rust round-trip tests exist (`vectors.rs:48-89`). Add `contracts/vectors/records.v1.json`.
- **L7** `packages/canonical-json/contracts/vectors/canonical.v1.json`: add U+2028, U+2029 and U+007F, which neither JS nor serde escape, to pin the no-escape behavior.
- **L8** DRY:
  - The stream-grammar regex is copied into four places across three schemas.
  - The `invalid()` helper is copied in `envelope.rs:15`, `identity.rs:13` and `registry.rs:29`.
  - Lowercase-hex checks appear in both `envelope.rs:109` and `identity.rs:82-86`.
  - The `registry.rs:65-69` domain charset re-implements part of `valid_slug`.
  - Fix: use a shared `$defs` and one helper module.
- **L9** `packages/event-store/rust/Cargo.toml:16-17`: event-store has a dev-dependency on `fgos-distribution` to host the digest audit. The digest belongs to distribution, so the test and example belong in `packages/distribution/rust` with a dev-dependency on the leaf. That keeps event-store's graph free of any consumer, even in tests.
- **L10** `registry_identity_layout.rs:24-29`, `:222-249`: the `git` subprocesses inherit `GIT_*` from the environment. Running inside a hook with `GIT_DIR` set misdirects them. Scrub `GIT_*`, as §8 requires for the production resolver.
- **L11** Bench nits:
  - Claims accumulate across rows, so later rows run with more open claims.
  - `peakDirectChildren` includes settle-preparation calls.
  - `percentile()` has no test.
  - `findmnt` fails with a raw ENOENT off Linux.
  - `HOME`/global config are not isolated.
  - The unit-2 report partly states these; put them in the experiment report.
- **L12** The plan's `cargo fmt --all -- --check` is red on the pre-existing `apps/fgctl/tests/windows_holder_lock_gate.rs`. Either fix it in a separate commit or change the phase validation to package-scoped fmt. The `packages/process/.../windows_job.rs:147` `is_none_or` change is outside the phase file table but is a correct one-line lint fix.
- **L13** `identity.rs:49-76`: `cfg(unix)` admits macOS, while D15 and §22 say Linux only. Phase 06 is meant to refuse at the facade; until then, note it or use `cfg(target_os = "linux")`.
- **L14** `layout.rs:243-246`: stream directories are named with `:` (`branch:x`, `project:porting`). That is valid on Linux, but write it into §8's layout so a future port does not trip on it.

## Checked and found conforming

- Envelope v4:
  - Every §6 field is present, with `deny_unknown_fields`.
  - `h` = full SHA-256 of the canonical line without `h`, plus exactly one `\n`, recomputed independently in Node (`test/event-store/canonical-vectors.test.mjs`).
  - `ts` is fixed width and calendar valid.
  - The own stream is refused in `seen`.
  - Counters are bounded to 2^53-1, so binary64 cannot collapse two identities.
- Canonical leaf:
  - Keys are sorted by UTF-16 code units; the `U+E000` vs `😀` vector proves it is not code-point order.
  - Numbers use ECMAScript formatting through `ryu-js`, with vectors for `-0`, `1e21`, `5e-324` and 2^53+1.
  - No fgOS dependency.
- The batch marker is its own type, has no `h`, and fails `Envelope::parse`.
- `seal.json` kinds match the §10 table and the §18 legacy fields.
- Legacy order:
  - The sort is stable and keyed on `(ts, file, seq ?? 0)` with UTF-16 comparison, plus first-wins dedupe by `h` or else raw line, the same as `replay.mjs:870-891`.
  - The Node parity test calls the real `readAllEventsFromDir` on temporary files, with no mocks.
- Layout:
  - The root is `<canonical common-dir>/fgos/events`, outside the work tree. A real linked worktree resolves the same root.
  - `None` maps to `event-store-no-repository`, and no override exists.
  - The traversal-safe stream grammar is shared by the envelope, seen keys, the marker and seal.
- Store identity:
  - Writes use tmp, file fsync, rename, then directory fsync, and the parent directories are synced too.
  - The store is never re-minted, not even over a malformed file.
  - A mismatch in machine, path or dev:ino refuses with `event-store-store-moved` (D19), tested with a copied clone.
- The result-code registry generates the Rust enum at build time, so there is one authority for codes.
- Bench honesty:
  - It refuses non-ext4 mounts and existing roots before mutating anything (tested, including tmpfs).
  - It seeds through `store.mjs`, runs the real CLI against a fresh Git project, and records raw observations, errors, commit and mount.
  - The `a4b1278ae` ancestry and the "bin/src identical to main" claim hold.

Status: DONE_WITH_CONCERNS
Summary: Phase 01 core math (envelope `h`, canonical JSON, legacy order) conforms and all package tests pass. Before merge: the half-done canonical one door must be finished or ticketed (H1). Ten Medium gaps (non-canonical parse, identifier formats, unverified v3 `h`, missing branch-key rule, registry rule 1, error classification, store.json no-replace, bench placement, entry and report path) should be fixed or ticketed before phase 02.
