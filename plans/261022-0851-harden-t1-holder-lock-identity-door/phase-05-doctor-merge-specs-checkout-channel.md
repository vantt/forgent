---
phase: 05
title: "Doctor 9 → 5 with no condition lost, the four specs and the boundary rows, AGENTS.md's checkout-channel text, the state-root route and the kill-wait key deleted"
status: pending
depends_on: [03, 04]
parallel: "none (shares registrations.mjs, holder-lock-checks.mjs, the specs and the boundary with its neighbours)"
effort: ~1d
net_size: "Node −132 / Rust −15 (contracts −34) / tests −120 (estimate)"
---

# Phase 05 — Doctor merge, specs, checkout channel

## Context

[plan.md](plan.md) Facts ("Doctor rows", "State root", "`lock.predecessorKillWaitMs`"); arbitration §2.1 item 5 and §2.4, S-G1 with simplicity's doctor table (red-team D-4: 9 → 5, existing ids kept, nothing lost), D-T1-8 (decision 12's doctor half), owner decision 10 (AGENTS.md text; the `state-root` route and Node fallback go), S-F5 (b)–(e) spec corrections, H12 pattern (DOC told before merge). Gate 8: every fail/warn condition keeps a row.

## Requirements

### Doctor merge (`src/setup/registrations.mjs`, `src/setup/holder-lock-checks.mjs`, `src/setup/lock-record-checks.mjs`)

| Today's row | Condition (fail / warn / info) | Kept by |
|---|---|---|
| `lock-kernel-semantics` (`:2141`) | fail: no driver; lock root unresolved; guarantee `unsupported`/`none`; probe red. warn: directory missing | same row (body over the door since phase 2) |
| `lock-borrow-vectors` (`:2146`) | fail: red vector or sibling; unavailable; protocol mismatch; other exit | same row, unchanged |
| `lock-holders` (`:2151`) | warn: foreign holder with pid and cmdline; predecessor domain not dead / unknown version / unreadable / not JSON / Windows job not empty or unknown. info: unlistable; machine locks not scanned | same row; **absorbs `lock-record-unreadable`**: the two `.hot` records (`state`, `porting-events`) are judged beside their reclaim lock files with the same text and the same next step (`fgos lock fence <resource>`), the 5-minute grace for an `unknown` judge kept (`lock-record-checks.mjs:13-44` moves into `holder-lock-checks.mjs` as a function of the row, −58 + 30) |
| `lock-fences` | gone in phase 3; `git-fence-missing` is `git-operation-journal`'s | — |
| `lock-record-unreadable` (`:2161`) | warn: record does not parse; `unknown` judge beyond the grace | `lock-holders` (above) |
| `lock-predecessor-kill-wait` | **already removed in phase 2** with the key (owner decision 12, D-T1-8) | `lock-kernel-semantics` prints `killWaitMs 2000 (fixed)` in its pass line so the bound stays visible |
| `state-root` (`:2171`) | fail: Node and host disagree; cannot resolve. pass: pinned root plus the unpinned answer | `lock-kernel-semantics` prints `stateRoot <root> (<source>)` from `resolveStateRoot` (pin, else the door; D-T1-10) and fails by name when neither answers; the "Node ≠ host" condition is removed with Node's resolver (behaviour gone: the door and the host run one Rust function); the "without the pin the host resolves …" line goes with the route |
| `writer-identity-resolvable` (`:6322`) | fail: no host on either door; the activation's host answers mismatch or error | same row, unchanged here (phase 6 keeps `probeIdentity` for it) |
| `convention-conformance` (`:6199`) | fail: post-cutoff violations; pass-skip otherwise | unchanged |
| config default `lock` (`:2175`); fix `lock-dirs` (`:2176`) | | default **deleted**; fix stays |

Registrations: delete the `lock-record-unreadable` and `state-root` rows (`:2161-2164, :2171-2174` on today's numbering; phase 2 already removed `:2166-2169` and `:2175`); the comment at `:2134-2140` rewritten; the imports at `:150-151`. `holder-lock-checks.mjs`: delete `checkStateRoot` (`:757-790`; the kill-wait section went in phase 2), `runStateRootRoute` from the driver import; `fgosDirOf` (`:57-59`) replaced by `fgosDirFromRoot` (`paths.mjs:87`) here; `src/setup/terminal-control-checks.mjs:22` holds its own copy of the same join (`function fgosDirOf`) and imports the door instead. `src/setup/lock-record-checks.mjs` (the only importer of `holder-lock-checks.mjs`'s `fgosDirOf`, `:8`) deleted.

### The `state-root` route and Node fallback (owner decision 10)

- `src/holder-lock/state-root.mjs:17-39` (D-T1-10): `resolveStateRoot` reads the pin (fresh on every call, as today), else asks the door once per process (`nativeDoor().holderLock.stateRoot(env)`, added in phase 2 over `state_root::state_root_from`, the host's own formula), else throws `HolderLockError('lock-driver-unavailable', …, { reason: 'addon-not-shipped' })` naming the next step ("run through `fgos`, or `npm run fgos:dev -- <verb>` from a checkout"); `runStateRootRoute` and the `driver.mjs` import go (43 → ≈ 33 lines). `src/holder-lock/driver.mjs:246-270` `runStateRootRoute` deleted. `packages/holder-lock/rust/src/route.rs:181, 460-471` and `packages/holder-lock/contracts/internal-route.state-root.v1.json` deleted; `state_root.rs` is untouched (the host still pins through it, `legacy_exec.rs:252-254`). `apps/fgos/src/main.rs`: no edit (recorded).
- Callers of `resolveStateRoot` (17–20 sites in `src` and `scripts`; the lead lists them from `rg -n "resolveStateRoot\(" src bin scripts`) are unchanged: on every supported channel the host's pin answers; in the suite the harness strips any inherited pin on purpose (`scripts/run-tests.mjs:148`) and `node --test` processes are not run by the host, so the in-process callers (`src/git/inspect.mjs:29`, `scripts/lib/full-suite-queue.mjs:63`, `test/setup/git-checks.test.mjs:59`, `test/runner/execution/run-sync.test.mjs:325`, …) take the door path, which the staged addon serves (`FGOS_ACTIVE_MANIFEST_PATH`, `run-tests.mjs:125-127`). The first draft's "throw when unpinned" would have broken every one of them (red-team assume F1, failure F5, scope F3). `scripts/run-tests.mjs` is not edited.
- Tests: `test/holder-lock/state-root.test.mjs:51` keeps every vector, the unpinned ones now through the door in a child with the staged addon (`FGOS_HOST_BIN` as today; the Rust formula is owned by `packages/holder-lock/rust/tests/state_root_vectors.rs`, this is the door's one wiring loop), `:65` stays, `:80` becomes "without a pin and without the addon the root is not guessed and the error names the dev door"; `apps/fgos/tests/internal_lock_routes.rs:372` and `test/rust-host/internal-routes.test.mjs:70` retired (owner: `state_root_vectors.rs`); `test/setup/holder-lock-checks.test.mjs:439` retired (the Node-vs-host comparison is removed behaviour); the `lock-kernel-semantics` case at `:149` asserts the `stateRoot … (pinned)` and `killWaitMs 2000` lines.

### Docs of the removed rows (decision 12's doctor half landed in phase 2)

- `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:281, :283` rows (`lock-fences`, `state-root`; `:282` went in phase 2) removed, the `lock-holders` row text gains the hot-record condition; `docs/specs/distribution.md:74` (row 5g) loses "and the lock config key", `:201` loses the `lock-fences` sentence; `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md:133-135` lists drop the four ids and the fix. CHANGELOG: "Removed the doctor rows `lock-record-unreadable` and `state-root` (their conditions live in `lock-holders` and `lock-kernel-semantics`) and the host route `fgos internal state-root` (the payload reads the host's pin, else the in-process door)".

### AGENTS.md (owner decision 10)

In "Legacy-Node CLI Ownership Boundary" (`AGENTS.md:88-100`), the sentence on compatibility channels becomes: global npm `bin.fgos` and `node bin/fgos.mjs` call the entry directly but are **unsupported for the process, lock and identity verbs**: the in-process door loads only the addon of the activated release whose payload is running, so from a checkout those verbs refuse by name (`process-door-not-shipped`, `lock-driver-unavailable` with reason `addon-not-shipped`, `host-missing`); run working-tree code through `npm run fgos:dev -- <verb>` instead. The git hook is a cold client of the activated host and is unaffected. The one `mdview` mention of `core.hooksPath` stays as is (the arbitration verified the hook is wired only here).

### Specs (DOC told before merge; every line lands with the code it describes in the same track)

- `docs/platform/holder-lock/spec.md`: `:8` implementation status rewritten to "Implemented; the Node facade reaches the crate in process on Linux and macOS (2026-10-22), through `lock-hold` on Windows"; `:45` ("Node cannot call `flock`…") rewritten to the door; §5 `:112, :116, :120, :125` lose the `--drain-child`/`--reach-floor-ticks` sentences and describe the External's marks; §9 (`:212-226`) rewritten: the facade's budget (`src/holder-lock/` ≤ 1 650 lines incl. the Windows transport), the door calls, `release()` settles unless handed over, `probe` through the door, `lockHolders` returns tuples with `origin`; §10 (`:227-242`) route table keeps `lock-fd --borrowed-check`, `lock-hold`, `quiesce-scan`, `lock-borrow-vectors`; §11 (`:243-253`) loses the route sentence (pin only; the checkout channel is unsupported); §12 (`:255-275`) becomes a history paragraph: the fences were placed at the 2026-10-17 cutovers and their Node mechanism was removed on 2026-10-22 under the one-release policy, the WAL fence is Git's; §13 (`:276-294`) doctor table becomes the five-row table above; §15 `:313` unchanged (now true, S-F1); §17 `:327` holder listing through the door; §18 (`:337-349`) folded into §12's paragraph; §20 gains one dated entry naming the decisions (9, 10, 12) and what was reused (the Git loan precedent) and deleted; §21 route rows (`:400-401`) updated. `docs/specs/reading-map.md:57` and `:59` updated (route list, doctor rows, "Node cannot call flock" gone).
- `docs/platform/session-identity/spec.md` and `docs/platform/process/spec.md:112`: phase 6's.
- `docs/platform/component-boundary.md:80` (Holder-lock row): "plus the internal routes `fgos internal lock-fd|state-root|quiesce-scan|lock-borrow-vectors`" → the door and the four surviving routes; "the cutover fences" removed; `:82-83` (durable file, canonical JSON): the mode error and the string-in door, one line each.
- `docs/platform/convention/spec.md`: `:168` done in phase 4 (S-F5a); nothing else. `docs/platform/holder-lock/spec.md` §9 also states the bounded in-process blocking (D-T1-13) and §15 the Windows release limit (D-T1-12, H23).

## Files

**Create**: none. **Modify**: `src/setup/registrations.mjs`, `src/setup/holder-lock-checks.mjs`, `src/setup/terminal-control-checks.mjs`, `src/holder-lock/state-root.mjs`, `src/holder-lock/driver.mjs`, `packages/holder-lock/rust/src/route.rs`, `AGENTS.md`, `docs/platform/holder-lock/spec.md`, `docs/platform/component-boundary.md`, `docs/specs/reading-map.md`, `docs/specs/distribution.md`, `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`, `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`, `CHANGELOG.md`, the tests named, `packages/git/contracts/mutation-census.v1.json`, `test/suite-baseline.json`. **Delete**: `src/setup/lock-record-checks.mjs` (58), `packages/holder-lock/contracts/internal-route.state-root.v1.json` (34), `holder-lock-checks.mjs:757-790`, `driver.mjs:246-270`, `route.rs:460-471`. **Tests to retire**: `holder-lock-checks.test.mjs:439` (behaviour removed); `test/setup/lock-record-checks.test.mjs` (62 lines) → its five cases re-titled under `lock-holders` in `holder-lock-checks.test.mjs` (moved, not dropped); `internal_lock_routes.rs:372`, `internal-routes.test.mjs:70` → `state_root_vectors.rs`.

## Steps

1. The merge (registrations, bodies, the moved hot-record check); the tests re-titled; `npm run fgos:dev -- doctor` shows the five rows.
2. The state-root route; the door fallback in `state-root.mjs`; `state-root.test.mjs` over the door.
3. AGENTS.md; the specs; boundary; reading-map; distribution docs; the how-to table; CHANGELOG; message to DOC listing the files.
4. Report: the doctor table before/after with every condition's new row, Δ table, test-cost line.

## Verification (exact)

- One-file runs: `test/setup/holder-lock-checks.test.mjs test/holder-lock/state-root.test.mjs test/setup/checks.test.mjs test/setup/checks-doctor-config.test.mjs test/setup/registrations.test.mjs test/rust-host/internal-routes.test.mjs test/docs/*.test.mjs`; `cargo test -p fgos --test internal_lock_routes`.
- `npm run fgos:dev -- doctor --json` lists exactly `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders` among `lock-*`; no `state-root`; `fgos setup` adds no `lock` key.
- `rg -n "predecessorKillWaitMs|lock-record-unreadable|lock-predecessor-kill-wait|'state-root'|runStateRootRoute|internal-route.state-root" src bin test docs packages/holder-lock AGENTS.md` → only the holder-lock spec's history entry and the CHANGELOG.
- `rg -n "node bin/fgos.mjs" AGENTS.md` shows the unsupported-verbs sentence.
- The whole suite (big lead) green with no `state-root` or `lock-driver-unavailable` failure in an in-process caller.

## Net size

Node −132 (`holder-lock-checks.mjs` −37 +30, `lock-record-checks.mjs` −58, `registrations.mjs` −14, `state-root.mjs` −10, `driver.mjs` −25, `terminal-control-checks.mjs` −3, `state-root.mjs` door call counted). Rust −15 (`route.rs`); contracts −34. Tests −120 (`holder-lock-checks.test` −12 +40 moved, `lock-record-checks.test` −62, `state-root.test` ±0, `internal_lock_routes.rs` −12, `internal-routes.test` −9, re-titles ±0; the balance against the first draft's −120 is the config tests and `:95-128` that moved to phase 2, offset by keeping the state-root vectors). Docs not counted.

## Test-cost line

Added 0, retired 3 cases + 1 file (5 cases moved). Host spawns removed: `state-root.test` unpinned vectors (3 route spawns become door calls in a child), `holder-lock-checks.test:439` (3 route spawns), `internal_lock_routes.rs:372`, `internal-routes.test:70`. New spawns: none. CLI-call cost pasted.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A doctor condition is dropped silently | L × H | The table above is the checklist; the lead's report re-lists every condition with its new row and the test that reaches it. |
| A `resolveStateRoot` caller runs without the pin and without the addon on a supported channel | L × H | Every supported channel runs under the host (`legacy_exec.rs:252-254`), under dispatch's pin (`direct-launch.mjs:147`), or inside a release payload where the door loads; the error names the dev door; `fgos doctor` fails by name. |
| DOC's branch patches the same spec lines | M × M | Message before merge (H12 pattern); DOC's Phase 9 starts from the bytes on main at that time. |

## Rollback

Revert the phase's commits; the rows, the route and the key return; `fgos setup` of the reverted release re-adds the key.

## Done when

Five rows, every condition mapped and tested; the route and key gone; AGENTS.md and the specs say what the code does; DOC told; the Δ table in the report.
