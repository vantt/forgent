# Review: Git phase 07 unit 2, commit core switch (82ca7102a on 512e8cd2a)

Read-only review. I read the lead report, the adapter sources in full, the Rust ScopedCommit, WAL, hook-provenance and grant changes, and every changed test assertion. I did not run the test suites: the sandbox refuses nested writes, so every finding below comes from reading the code and tests.

## Verdict

The four coordinator decisions are implemented, and the adapters are thin. No git subprocess remains in the touched Node files (`commit-unit-work.mjs`, `unit-sync.mjs`, `partial-writes.mjs`, `legacy-event-git-adapter.mjs`, `run.mjs`). One High finding should be fixed or explicitly accepted before landing; the rest are Medium and Low.

## High

1. **No native refusal of tracked `.fgos` paths under a broad write scope** (`packages/git/rust/src/scoped_commit.rs:1000-1024`, `src/runner/execution/commit-unit-work.mjs:~140`).
   The old JS filtered `.fgos` out of the commit set. The native selection loop now picks every dirty path matching the declared writes, and nothing refuses `.fgos` there. The only `.fgos` refusals are in `checkpoint_tracked_files` and in the hook check for deletions.
   - Failure scenario: a Unit has scope `**` and a producer modifies a tracked `.fgos/config.json`. The native commit includes it, while the adapter's expected set (`partitionPaths`, filtered by `outsideStore`) excludes it. The run then fails with `committed-set-mismatch` after the commit has already landed on the branch.
   - The test that guards this (`commit-unit-work.test.mjs:137`, "h. .fgos is never committed") now passes only because the new `fixtureAuthority` appends `.fgos/` to `.git/info/exclude`, which hides untracked `.fgos/x`. It never exercises a tracked, modified `.fgos` file, so the assertion is weaker in effect even though its text is unchanged.
   - Fix: refuse or skip `.fgos` and `.fgos/**` in the native selection unless declared in `legacyEvents`. Add a test with a tracked, modified `.fgos` file under `**`, and drop the info/exclude line from that test's fixture.

## Medium

2. **Legacy event declaration is a closed set, but breadth and borrower check are looser than decision 2 reads.**
   `LegacyEventLayout::validate` (`scoped_commit.rs:31-46`) accepts only `.fgos/events.jsonl`, `.fgos/porting/events.jsonl`, `.fgos/events/<name>.jsonl` and `.fgos/events/archive/<name>.jsonl`. It also requires the trusted main root, rejects duplicates, and applies `fgos_scope_literal`. A caller cannot add other `.fgos` paths, and the traversal and linked-worktree cases are tested.
   - The "main 50" lock-borrower check exists only in the hook grant branch (`grant.rs:72-79`), and only for deletions. Modifications and additions of the declared paths via `commit` are gated by main-root identity alone.
   - `<name>` is any `.jsonl` file, so any `.jsonl` under `.fgos/events/` can be declared.
   - Confirm that this is the intended gate. If the borrower check is required for all event commits, move it into `validate`.

3. **Persistence of the settled state can be lost to a crash between the native commit and the record write** (`run.mjs`, `commitWork` closure and `commitOperation.state`).
   The record is persisted as `pending` before the commit and flipped to `settled` only afterwards. A crash in between is handled: resume calls `recover`, which replays the receipt through the same operation id. The adapter treats an unexpected recover kind (anything other than `commit`, `abandonedBeforeAttempt`, or a rejected commit with a known cause) as a hard failure `native commit recovery: <kind>`. If native `recover` can return an already-completed kind on a finished operation, that path would wrongly fail the resume. The tests I read cover the commit-only retry; I found none for "committed, record not yet settled". Add a crash-point test for that case.

4. **`known_id` shortcut returns `AbandonedBeforeAttempt` for any unknown id** (`scoped_commit.rs:544`).
   A wrong or mistyped operation id is silently treated as abandoned, and the adapter then starts a fresh commit. In `commitUnitWork` the id comes from the persisted record, so this is low risk today, but it removes a corruption signal. Consider restricting it to ids with a persisted pending record.

5. **Hook replay (decision 3) is implemented for Sync only.** `checkout_commit_failure` is called from `sync.rs:869`. ScopedCommit's own commit failure (`scoped_commit.rs:1249-1253`) always returns the generic `commit-rejected`, so a unit commit refused by fgOS's own owned hook reports `git-error`, not `hook-refused`. The pre-existing test at `commit-unit-work.test.mjs:263` already expected `git-error`, so this is parity with the old Unit commit core, but it is inconsistent with the G-062 text for owned hooks. Decide whether it is intended and note it in the spec.
   Within Sync, the implementation is correct: original stderr is preserved on both the success and error paths, replay is gated on `status == "owned"`, provenance present and enforcement not missing, and foreign hooks are never replayed. A small time-of-check gap remains between `inspect_hooks` and the replay, because the hooks path is re-resolved by `git hook run`. It is acceptable in the current threat model: a worker cannot write the main repository config.

## Low

6. `refusal()` spreads `e.detail` last (`commit-unit-work.mjs`, `...(e.detail ?? {})`), so a native detail key could overwrite `status`, `reason` or `error`. Native detail is trusted, but spreading it first would make the precedence explicit.
7. Test titles all carry an `E6 retargeted:` prefix (about 60 tests). The repository rule says no audit or plan labels in test names. The assertion lines are verbatim, which is good, but rename the titles.
8. `packages/git/rust/tests/scoped_commit_sync.rs` carries unrelated rustfmt reflows (for example the `inspect_sync`, `assert!(wal::Wal::open...)` and signature-check hunks). They add noise to the diff and are not part of the unit.
9. WAL schema change is backward-compatible for reading existing records: the new `minLength` and `pattern` accept every previously valid path, and `legacy_events` is `#[serde(default, skip_serializing_if)]`. Records written with star, tab or newline paths are not readable by an older binary, which is a forward-compatibility note only.
10. Resume scope: `assertSyncResumable` moved after custody admission and now runs only on `options.resumeUnitRunId`. That ordering looks right (the check needs custody) but it was not covered by a test I could run.

## Checked and fine

- **Decision 1:** `literal_repo_path` rejects only empty, absolute, NUL and `.`/`..` segments. WAL validation uses it for ScopedCommit and Sync staged paths, while conflict paths keep the stricter `fgos_scope_literal`. Staging uses literal NUL-separated input, so there is no pathspec injection. The test commits and replays `literal*star`, `control\tname` and `control\nname`.
- **Decision 4:** the baseline and Sync id are persisted. `commitWork` rebases the baseline head onto the sync commit. A pending operation skips the preflight on resume. A rejected clean merge is aborted through the existing Sync abort, only when the operation is `rejected-open` with an empty resolver grant, and a cleanup error is recorded, not thrown.
- **Parity:** all result fields (`status`, `files`, `warnings`, `operationId`, `unexpected`, `missing`, `conflicts`, `mergeStaged`) are translated, and the committed-set-mismatch classification is retained.
- **Gitlink handling:** the new gitlink restore exclusion and the trailing-slash fix in untracked reporting are correct and narrowly scoped.

## Unresolved questions

- Is the `.fgos` exclusion meant to live in native ScopedCommit (my reading of decision 2) or in the Unit adapter, as before?
- Should the main-50 borrower check apply to all legacy-event commits, or only to deletions?

Status: DONE_WITH_CONCERNS
Summary: The four decisions are implemented and the adapters are thin, but native ScopedCommit no longer refuses tracked `.fgos` paths under a broad scope and the guarding test now passes only through a fixture exclude. Medium and Low items are listed above.
Context refs:
- (none)
Expected outputs:
- (none)
