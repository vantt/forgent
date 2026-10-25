Verdicts: 24 APPROVE / 0 REWORK

# W21 review: census join rework and G5 surviving-map check

The JSON has 25 items: 24 APPROVE and 1 NOTE (Low). Nothing blocks.

Scope:
- A: 25aa41510.
- B: b57e79625 plus the Lead correction 83916a31f.

Worktree HEAD at review time was 6bb1c7d61. This was a read-only review: no git write, fgos CLI, product test or native addon. Node ran with `--no-addons`. Scratch was a tempfile `git clone --shared` under `/tmp/fgos-work/`, removed at the end.

## A. Census join rework (25aa41510): APPROVE

### The 7 REWORK rows

I read the pinned tests at 5820ca678. Each re-pointed test reaches the cited line with the cited branch taken:

| Row | Cited site | Owning test and call |
|---|---|---|
| pc-d-0446 | failover-fixture:157, the `llmAccounts &&` branch | T:491. `setup` at :492 with nonempty `llmAccounts` at :494-497 |
| pc-d-0448 | :182, `summaryOf` | T:19 → :51 |
| pc-d-0450 | :188, panel seats | T:179 → `panel(...)` at :189 |
| pc-d-0453 | :202, unconditional | T:331 → `unitRuns` at :341 / :347 |
| pc-d-0454 | :202 | T:360 → `unitRuns` at :363 |
| pc-d-0479, pc-d-0480 | lease:37, `worktree` closure | L:67 → `f.worktree()` / `f.worktree('other')` at :68, including the default `holder` |

### Description fixes

- **pc-d-0447:** now describes `attemptsOf`, called at :501.
- **pc-d-0449:** now describes `selectedAccount` → `runFile`, called at :510. The Doer was right that :510 is correct and the review's :508 was wrong.
- **pc-d-0924:** now binds the :3868 return.
- **pc-d-1101:** now records that the expression survives at :30 as the `fgosDir` for the seat-binding client.

Both REJECT rows hold.

### Audit corrections

- **pc-d-0245:** the narrowed :155 owner is correct: `setupLease` :157 → `cli` :106 → `rawCli` :100 → :96.
- **pc-d-0288 park:** correct. Line :34 is reached only through `hostScan`'s `assert.fail` arm, and every caller returns at :30 or skips at :31-32. In `join.json` the row is `judgment-required`, with `owningProofs: []` and a named owner. It still needs the before-F rejudge it names (Low).

### 20-row audit spot-check

The sample was 16 JS rows and 4 Rust rows, one per file, chosen by seeded random.

- **JS rows:**
  - Every call-chain evidence line matches the pinned bytes and names its callee.
  - Every first call falls inside the named test's range.
  - Test titles equal the `join.json` owning proofs.
  - Helper bodies have no branch that skips the cited line.
- **Rust rows:**
  - `candidate()` is called at :99-100 inside the :59 test.
  - `legacy(&f, true)` takes the porting branch.
  - The `scoped_commit_sync` :488 else arm runs when the :561 loop has `sync = false`.
  - The `WorktreeCreate` arm runs through `KINDS` → interrupt → the ignored child.
- **Population boundary:** module constants and setup hooks are excluded by definition (for example pc-d-0462 `WORKER_BODY`, whose owner :60 does call `setupRepo`). I did not re-enumerate the 129-row population independently.

### Replay

I ran `join.py --pin 5820ca6780ff…` twice at 25aa41510 in the clone.

- Both runs exit 0.
- stdout and stderr are byte-identical across runs, and the clone stays git-clean, so all outputs equal the committed bytes.
- Counts: 779 + 289 + 53 + 4 + 1 = 1,126.

The `join.py` change only admits listed same-file corrections, clears proofs on parks, and keeps `additionalDrift` at 4.

### archive/receipt.json

It gains exactly one `postMeasurementEdits` entry, for 25e8842d3. Its text matches that commit's diff.

## B. G5 retention check (b57e79625 + 83916a31f): APPROVE

### Scoping

The scoping matches G5 row 5, which has two clauses:
- **Clause 1:** each retention span is found at its own file.
- **Clause 2:** the reading-map entry-union keeps the L11-25 banner and both compounding→knowledge lines (legacy 34 and 37).

The holder-lock header belongs to clause 1 only, and it is proved byte-exact at `docs/platform/holder-lock/spec.md:8`, which survives under `docs/platform/`.

### Check run

`check.py --pin b57e79625` exits 0 on two runs, and the output is byte-identical to `check-b57e79625.json`. The four inputs are unchanged through HEAD.

| Part | Result |
|---|---|
| Legacy spans | 10/10 found |
| Verbatim | 1 (37 → 159) |
| Restated | 8 |
| Not applicable | 1 (holder-lock) |
| Built-in controls | 31 OK |
| `gateApproved` | false |

### Exact binding

Restatements are keyed by (recorded line, sha256) and matched as exact LF-split whole lines or blocks. These mutations all turn the affected rows to missing:
- dropping or changing the line-34 suffix;
- a trailing space;
- CRLF;
- one byte in the banner;
- one inserted line in the banner block.

### ownerAcceptance

It holds exactly the 8 restated rows (lines 3-9 and 34). Each `legacyText` equals the pinned legacy line, and each `proposedText` equals the pinned surviving lines 89-108 or 156. Line 34 also changes `skillForStage` to `skillForStep`, which the receipt discloses.

### Negative controls

My own controls also fail the check:
- an in-memory change to the banner, line 159 or holder-lock line 8;
- a missing holder-lock file;
- a real-file unpinned run with a trailing space on `docs/reading-map.md:159` (exit 1, `survivingMissing [37]`).

### NOTE (Low)

`g5/receipt.md` sections 1 and 3 still describe the superseded a8acd5d27 run ("Check exit 1", "1 missing"), and there are two "## 4." headings.

The section 3 reproduction script asserts exit 1 and byte equality with `check-a8acd5d27.json`. It no longer reproduces: the current checker at that pin exits 0 with different bytes. Mark sections 1 and 3 as superseded by the Lead section, and renumber that section.

### G5 met-local

Yes, apart from owner acceptance of the 8 restatements (external, L13-10): both clauses are proved exactly at b57e79625.

- The F rerun stays in `atFinalPinUnderLease`.
- The register still says `partial`, with the old evidence and remaining text. The Lead must update it to cite `check-b57e79625.json` and this review.
