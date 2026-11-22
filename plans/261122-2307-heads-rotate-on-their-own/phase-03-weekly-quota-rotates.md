# Phase 3: A near weekly quota rotates the head

Capability: `code:implement`. Closes cause 2 of `p-fwdxupc6fx`. Depends on phase 1 (the successor's bind must see
the quarantine this phase writes) and phase 2 (same files).

## Inputs

- `plans/261122-2307-heads-rotate-on-their-own/plan.md`: Outcome item 2, Risks.
- `packages/session-host/rust/src/rotation/measure.rs` (sidecar first, transcript as fallback, freshness rule).
- `packages/session-host/rust/src/rotation/decide.rs` after phase 2.
- `apps/fgos/src/wiring/session_rotation_hook.rs` (`SIDECAR_FILE`, the `stop` and `session-start` events).
- `packages/observe/rust/src/sources/transcript_records.rs:24,96`: the second reader of the sidecar.
- `packages/session-host/contracts/rotation-files.v1.json` `files."context-sidecar.jsonl"`.
- `src/session-rotation/rotate.mjs` (`requestRotation`) and `src/runner/dispatch/provider-capacity.mjs:634`
  (`quarantineProviderAccount`), plus the lease record of a head (`state.assignments`).
- `src/session-host/head-start.mjs`: the head launch and its session envelope.
- `src/runner/dispatch/confinement/authority.mjs`: what a confined head may write.
- `core/config-standard/sessionRotation.yaml`, `core/config-schema/sessionRotation.schema.yaml`.

## Footprint

`packages/session-host/rust/src/rotation/decide.rs`, `packages/session-host/rust/src/rotation/measure.rs`,
`apps/fgos/src/wiring/session_rotation_hook.rs`, `src/session-rotation/rotate.mjs`,
`test/session-rotation/rotate.test.mjs`, `packages/session-host/contracts/rotation-files.v1.json`,
`packages/observe/rust/src/sources/transcript_records.rs`, `packages/observe/rust/tests/transcript_records_test.rs`,
`src/runner/dispatch/confinement/authority.mjs`, `src/session-host/head-start.mjs`,
`test/session-host/head-start.test.mjs`, `core/config-standard/sessionRotation.yaml`,
`core/config-schema/sessionRotation.schema.yaml`.

## Steps

1. **Proof point: the quota field.** Record one real status-line stdin payload from a head on the installed Claude
   Code, and write it, redacted, to `plans/261122-2307-heads-rotate-on-their-own/reports/status-line-payload.md`.
   Name the weekly used-fraction field and its reset-time field. If neither exists, do steps 2, 3 and 4 for the
   context measure only, skip steps 5 and 6, and park the quota part with `fgos questions ask` in the five-part form.
2. **Proof point: the sidecar path.** Find a folder that the confined head may write and that the host (the Stop
   hook's request path and the observe source) can read. Prefer one the confinement already grants. Otherwise
   grant only `<lineage>/sidecar/` in `confinement/authority.mjs`. Record the choice in the same report.
3. **Writer.** Add the event `status-line` to `fgos hook session-rotation`. It is the same native door, not a new
   binary. It reads the status-line JSON from stdin, appends one sidecar record (`ts`, `session_id`,
   `context_window`, and from step 1 a `quota` object `{ weeklyUsed, resetsAt }`), keeps the file bounded the way
   `stop-trace.jsonl` is kept, prints one short status line, and always exits 0. It does nothing outside a head
   (no `FGOS_HEAD_ROLE`). Hook test: one record is written for a head payload, and nothing is written outside a head.
4. **Register it for heads only.** The head launch sets the head's `statusLine` to that command through its
   per-process `--settings`. If the launch already passes a `--settings` object, merge the key into it, because
   Claude Code takes one object. Never write the project's `.claude/settings.json`: the owner's own status line
   stays. Extend `test/session-host/head-start.test.mjs` with one wiring assertion that the launch carries the
   setting.
5. **Measure and decide.** `measure` returns the fresh record's `quota` with the context fraction. `RotationConfig`
   reads `quota` (a fraction, 0 to 1). `decide` gains the quota input: weekly use at or above it is `Level::Hard`
   with reason `weekly-quota-near-limit`, even below soft, and neither a pending question nor a background task
   holds it. Tests in `decide.rs` and `measure.rs` own these cases. Add `quota: 0.9` to the standard with an
   `@fgos:doc` line, and add it to the schema (a number from 0 to 1).
6. **Quarantine the old account.** The hook puts `stopFacts.quota = { weeklyUsed, resetsAt }` on a quota rotation.
   `requestRotation` reads the predecessor's leased account from its head lease record and calls
   `quarantineProviderAccount({ reasonCode: 'quota-limit', until: resetsAt, resetKnown: true })` before it places
   the successor. A missing lease record or reset time is logged to `rotation.log` and the rotation goes on. Owning
   test in `test/session-rotation/rotate.test.mjs`: "a quota rotation quarantines the old account before the
   successor binds".
7. **Contract and second reader.** Update `rotation-files.v1.json`: the sidecar path from step 2, its writer, the
   `quota` field, the stop facts `quota`, and the decision reason. Point `transcript_records.rs` at the same path,
   and adjust its test fixture path.

## Verify

```bash
cargo test -p fgos-session-host rotation
cargo test -p fgos session_rotation_hook
cargo test -p fgos-observe transcript_records
node --test test/session-rotation/rotate.test.mjs test/session-host/head-start.test.mjs
npm run fgos:dev -- config standard | grep -A1 'quota'
```

The pass condition is that all of them are green and the standard shows `quota: 0.9`. Confirm the package names with
`cargo metadata` if they differ.

## Rollback

Revert the phase's commits. The status-line setting disappears from new head launches, the sidecar stops being
written, and rotation ignores quota. An existing sidecar file is ignored.
