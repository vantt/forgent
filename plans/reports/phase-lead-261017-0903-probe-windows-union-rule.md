# Probe v3: union rule for `predecessor-all-owners-dead`

Branch `probe/union-rule`, tool `tools/platform-probe`. Not run on Windows here; the owner-machine run is the gate for 4.4b.

## What changed
- **Union rule is the main test.** When the job opens, the contender waits until `ActiveProcesses == 0` and every process named by the union is signaled: (a) `JobObjectBasicProcessIdList`, (b) every snapshot process with `IsProcessInJob(proc, job)` true, (c) the recorded holder's Toolhelp chain. The union is re-read on every poll (also at open and when the count is already 0), up to `kill_wait`. A live job is terminated first, as before. A job that does not open keeps the Toolhelp fallback. Implementation: `Dom::refresh` in `windows.rs`; each process seen gets a SYNCHRONIZE handle and stays tracked until signaled.
- **Diagnostics per event** (`watched[]`): `aliveAtOpen`, `sourcesAtOpen` (list / inJobScan / holderTree), `sourcesBeforeDecision`, and `isProcessInJobWhenNotListed` whenever the pid is missing from the list. `aliveAtOpen` is sampled a few hundred microseconds after the open, so it can lag the union read slightly.
- **New `predecessor-dying-job-open`.** A third helper role (`jobhold`) opens the job and waits for holder and keeper to die, keeps the handle a random 0–50 ms (`holdMs` per event), then exits. The contender thus opens the job in almost every repeat. Report fields: `openedSamples` (count), `violationsProceededWithLiveProcesses`, `caughtBySource`, `caughtOnlyBySource`, `liveAtOpenNamedByNoSource`, `notListedThenIsProcessInJob`, `firstOpenedSamples` (first 12 opened). The test fails on Windows if the job never opened.
- **Dropped `predecessor-all-owners-dead-list-empty-toolhelp`.** The union already contains the holder tree, so that variant is a strict subset; its 0-in-200 pass was uninformative (job opened once). Its `toolhelp_on_empty_list` rule flag and result fields are removed.
- **Default repeats 500** for every repeated predecessor test (`--repeats` overrides).

## Verification
- `cargo clippy --all-targets`: clean on Linux and `--target x86_64-pc-windows-gnu`.
- Linux probe, `--repeats 20`: 15 pass, 0 fail, 0 skip (union and dying tests are the strict unix control there).
- Exe: `cargo zigbuild --release --target x86_64-pc-windows-gnu`, copied to `.fgos/runtime/tmp/platform-probe/fgos-platform-probe.exe`, sha256 `09f7248c160b05e1ec6add8997ef9579662c51f7508d61670a4d9225a6e1a3f4`.
- Impact: probe-only tool, no other crate imports it. `domain_open` signature (now takes the holder) has callers only in `predecessor.rs`; checked by grep, GitNexus not consulted. No HIGH/CRITICAL risk.

## Decisions
- Single `DEFAULT_REPEATS = 500` for all repeated checks (about 3.5 min each at the measured ~0.4 s per repeat; whole run ≈ 15 min).
- Source flags are OR-accumulated per process; "caught" counts only watched pids alive at open, "only" means exactly one source named it.
- Holder tree is rebuilt from a fresh snapshot each poll with the existing pid-reuse guard (`chain_from`).

## Owner run
`fgos-platform-probe.exe --only predecessor-all-owners-dead,predecessor-dying-job-open` (500 repeats each). Gate: 0 violations in both. Read `caughtOnlyBySource` and `notListedThenIsProcessInJob` to see which source closes the list gap.

## Unresolved questions
- Whether the Windows run shows the job opening often enough in the plain test (expect ~1/200) — the dying variant covers that.
