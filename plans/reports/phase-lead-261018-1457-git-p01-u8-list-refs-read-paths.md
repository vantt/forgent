# Git phase 01: Event Store read APIs

Status: DONE_WITH_CONCERNS
Summary: Added typed lock-free ref enumeration and batched literal path reads on Inspect and Publication, sharing the existing hardened Git driver. Real repository tests cover both object formats and ref backends, including mirror discovery after Publication fetch.
Concerns/Blockers: Enumeration follows Git for-each-ref visibility: dangling symbolic refs are not returned. Continuation is a live lexicographic scan, not a ref snapshot; callers requiring stable coverage must coordinate mutations. The shared 64 MiB output ceiling refuses an entire call when exceeded, rather than returning a partial page/path result.
Context refs:
- packages/git/rust/src/lib.rs
- packages/git/rust/src/driver.rs
- packages/git/rust/src/publication.rs
- packages/git/rust/tests/publication.rs
- plans/reports/phase-lead-261018-1454-es-p03-u1-walk-order-cursor.md

Both traits expose these exact signatures:

```rust
fn list_refs(
    &self,
    repo: &RepoHandle,
    prefixes: &[RefPrefix],
    cursor: Option<RefCursor>,
    max_entries: usize,
) -> Result<RefPage>;
fn read_paths_at(
    &self,
    repo: &RepoHandle,
    revision: &Oid,
    paths: &[Vec<u8>],
    max_blob_bytes: usize,
) -> Result<Vec<PathRead>>;
```

Construct literal prefixes with `RefPrefix::parse("refs/fgos/events/")` and `RefPrefix::parse("refs/fgos/remotes/")`. RefPage contains `entries`, `complete`, and opaque `next_cursor`; each RefEntry has `name: RefName` and `value: RefValue` (Direct Oid or Symbolic target, never Absent). Pins are excluded unless a prefix explicitly selects refs/fgos/git-operations. Cursor binding rejects use with different prefixes; names are ordered by Git's C-locale refname sort. Non-UTF-8 ref names are refused explicitly, never decoded lossily.

PathRead retains the original byte path and PathValue is Blob(Vec<u8>), Absent, NotABlob(ObjectType), or Error(OperationError). Blob bytes are capped by max_blob_bytes; oversized values produce blob-too-large. One root-type preflight distinguishes missing/wrong roots from absent paths, followed by one NUL-input/output cat-file --batch -Z process for all paths. Newlines and non-UTF-8 path bytes are preserved. Parent/current/absolute/empty/NUL paths are refused. Missing objects in promisor/alternate repositories keep named refusals; root failures in shallow repositories preserve shallow-history-incomplete. Reads of available trees do not traverse history and therefore do not refuse merely because the repository is shallow.

Reused driver preflight, C1 scrubbed environment, LC_ALL=C, GIT_NO_LAZY_FETCH, optional-lock suppression, containment, timeouts and bounded capture. Extended its unborrowed stdin path for Inspect only; mutation stdin still requires holder authority. Publication delegates these reads directly to Inspect without borrowing or validating the holder lock. Git history found no previous typed list_refs/read_paths_at implementation; existing exact ref observations and batch object reads informed the parser. impact-analysis: inactive (zero registered providers).

Validation: cargo test --locked -p fgos-git -p fgos-durable-file -p fgos-holder-lock; cargo clippy --locked -p fgos-git --all-targets -- -D warnings; git diff --check. Private CARGO_TARGET_DIR=.fgos/runtime/phase-target. Added tests cover pagination, explicit pins, symbolic target facts, commit/tree path reads, binary blob bytes, newline paths, absence, directory paths, oversize refusal, invalid root type, own/mirror enumeration after real fetch, files/reftable and SHA-1/SHA-256. The existing crash-child test remains intentionally ignored. No staging or commits. Program-board/spec/changelog updates are outside the authorized write scope and left to the coordinator.
