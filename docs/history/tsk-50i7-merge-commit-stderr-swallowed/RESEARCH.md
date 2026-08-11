# RESEARCH: approve/merge swallows git commit's stderr, against the file's own convention

## Round 1 (tsk-50i7, stage discovery)

**Checked:** `src/runner/merge.mjs` in full, focused on the item's own
citations (line numbers have drifted since the item was written, but the
code shapes match exactly):

- `git()` helper (now lines 79-87, item cited 72-74): runs every git
  subprocess with `stdio: ['ignore', 'pipe', 'pipe']` — stderr is always
  captured onto the thrown error's `.stderr`, confirmed. Comment at line
  68 (item's own citation) states plainly this is so "every caller here
  already reads [it] instead."
- The already-correct precedent (item cited line 872, now line 917):
  the merge-call failure branch returns
  `error: { message: err.message, stderr: err.stderr ?? null, status: err.status ?? null }`
  — the exact shape the item asks the commit-failure branches to match.
- The two commit-failed branches (item cited lines 910/914, now lines
  955 and 959, inside the `git(repoRoot, ['commit', '--no-edit'])` try/catch
  starting at line 948):
  - line 955 (abort-also-failed branch): `MergeError(... : ${abortErr.message} (commit error: ${err.message}))` — only `err.message`, `err.stderr` dropped.
  - line 959 (clean-abort branch): `MergeError(... "git commit" failed: ${err.message})` — same gap.

Both match the item's description exactly in shape, only the line numbers
shifted (other commits landed between when the item was written and now —
expected drift, not a sign the description is stale in substance).

**Broader precedent checked:** `err.stderr` is read by `loop.mjs:847`,
`github-adapter.mjs:50/59`, `bin/fgos.mjs:3995` — confirms this is an
established repo-wide convention for surfacing subprocess failures, not a
one-off requested style.

No external library or unfamiliar concept involved — `execFileSync`'s
`.stderr`/`.status` properties on a thrown error are standard Node.js
`child_process` behavior, already used elsewhere in this same file.

**Fix shape:** in both catch bodies (lines 954-957 and 959), add
`err.stderr` and `err.status` to the `MergeError`'s `details` object, same
shape as the existing line-917 precedent — `{ branch, stderr: err.stderr ?? null, status: err.status ?? null }`. No behavior change to control flow (rollback/abort stays exactly as-is) — purely additional diagnostic context on the thrown error. A pinning test should simulate a failing `git commit` and assert the caught error's `stderr` carries the injected value.

**Verdict:** `{clear: true, verify: "npm test"}`
