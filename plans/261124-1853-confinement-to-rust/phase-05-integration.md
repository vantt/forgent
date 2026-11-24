# Phase 5: Integration, full suite and the after table

Capability: `code:test`.

## Inputs

- Every earlier phase's branch and report (`reports/cage-diagnosis.md`, `node-twins.md`, `cage-loosen.md`,
  `cage-pid-namespace.md`).

## Footprint

`CHANGELOG.md`, `plans/261124-1853-confinement-to-rust/reports/integration.md`.

## Steps

1. On the integrated tree run `npm test` and `cargo test --workspace`; fix regressions through the owning phase's
   files, never by weakening a test.
2. Add under `## [Unreleased]` in `CHANGELOG.md`: confined heads run the project's declared verify commands; a peers
   head keeps its own pid namespace (only if phase 4 took branch 2).
3. After the owner builds and activates the release, run in a confined supervisor and secretary: the live probe as it
   is, the declared verify commands, `friction record`, mail send and `questions answer` from Miu, and Miu reaching a
   peer both ways. Write the after table beside phase 1's before table in `reports/integration.md`.
4. In the report, list the backlog rows this plan closes (`p-fsg6aolefe`, and `p-ndortdckid`, `p-ia2v33b54u`,
   `p-btxvtb34u3` where the after table shows them fixed; `p-oqs75qwyco` only if phase 4 took branch 2) and the window
   jobs handed to plan 0004; the supervisor updates the backlog.

## Verify

```bash
npm test
cargo test --workspace
```

Pass: both green; the after table has no failed row the plan claims to fix.

## Rollback

Revert the CHANGELOG lines; the reports stay as history.
