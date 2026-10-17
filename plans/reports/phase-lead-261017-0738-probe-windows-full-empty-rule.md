# Windows probe: full empty rule + toolhelp variant

## Changes (`tools/platform-probe`)
- `windows.rs`: `Dom` records job accounting and the `JobObjectBasicProcessIdList` seen at open (`domain_open_view`). `domain_active` re-reads the list on every query, also when accounting is 0, and counts any listed member not yet signaled: the full r6 empty rule. Kill-then-wait uses the same condition. `Fallback` now reports which holder-tree members were live at the first snapshot.
- `predecessor.rs`:
  - `Rule.toolhelp_on_empty_list`: job opens with count 0 and an empty list, so the recorded holder's tree is also checked before proceeding.
  - New test `predecessor-all-owners-dead-list-empty-toolhelp`. `predecessor-all-owners-dead` stays as the full-r6-rule test (no extra clause).
  - Per event: `activeProcessesAtOpen`, `memberListSizeAtOpen`, `gitPidInListAtOpen`, `watchedPidsInListAtOpen`, `toolhelpCheckRan`, `toolhelpFoundLiveDescendants`. Aggregates: `openedWithCountZeroAndEmptyList`, `gitPidInListAtOpen`, `toolhelpCheckRuns`, `toolhelpFoundLiveDescendants`; `openedSamples` (first 12 opened jobs) shows the list even when no violation.
- `--repeats N` (default 200) for the repeated predecessor tests; their hard timeout raised to 3600 s.
- `unix.rs`: control path unchanged in behavior (member list = the one holder pid; fallback still none).

## How to read a Windows run
- `predecessor-all-owners-dead` violations > 0 and the variant 0: the list does not include a terminating, not-yet-signaled process; the extra Toolhelp clause is needed.
- Both 0: the full r6 rule is enough.
- Both > 0: the rule needs rework. Check `gitPidInListAtOpen` in the events.

## Evidence
- `cargo clippy --all-targets`: clean, Linux and `--target x86_64-pc-windows-gnu`.
- Linux probe, `--repeats 10`: pass=15 fail=0 skip=0. Linux 200 repeats of both all-owners-dead tests: 0 violations each.
- Windows exe via `cargo zigbuild --release --target x86_64-pc-windows-gnu`, copied to `.fgos/runtime/tmp/platform-probe/fgos-platform-probe.exe`, sha256 `949f8c0ea3349c023f05bb34fafdf6cc26732b07f4df545f1af73c43dc12edb3`. Not run on Windows here.
- GitNexus impact not run: standalone probe package, no callers outside it.
- `cargo fmt --check` reports a pre-existing diff in `git.rs`; untouched.

## Decisions
- Kept the existing `domain_active` shape (accounting max pending members) as the rule; the gap was observability, so the open-time view is recorded separately.
- The toolhelp check uses the existing `fallback_wait` bounded by `kill_wait`.

## Unresolved questions
- Windows result of 200 repeats on the owner's machine (big lead runs it).
