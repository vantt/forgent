# Archive design and scratch rehearsal — receipt

**Authored local candidate; G8 remains partial. No cutover, push, main merge or real-repository Git write.**

Read first: [design](design.md), [manifest](manifest.json), [reader specs](reader-patches/README.md), [machine receipt](receipt.json). Pin: `cffe725b948f5a695728c8da08f114e7e97075d6`, not F.

## Delivered

- Exact partition: **573 files / 1,750,567,128 bytes** off tip; **6,090 files / 1,072,131,945 bytes** retained unchanged. Every plan/phase document, owner answer, small record, ledger/pilot shard and retained proof input stays. The removals include **313 standalone migration-only replay entrypoints**, conditional on final pre-flip acceptance, not permission to disable pending gates.
- Fixed local ref: `refs/heads/archive/260925-records`, bound to the complete input tree. Main-side rows map path to blob id, size, SHA-256 and immutable archive commit. The separate 279-file prior-prune recovery table preserves original object custody; every blob is hash-verified and reachable from archive ancestry.
- Every prior `scriptRefs` occurrence joined: **2,918**, including the **47 historical reader files / 135 joins**. New scan: 6,663 plan files, 550,597 code-like bodies, 19,111 conservative joins. Current product/tests retain their exact inputs; historical recipes get an explicit archive execution-context specification. Frozen script text, B pins and baselines are untouched.
- Whole-file retirement specs carry exact preimage hashes, archive pin, expected absence and owning historical replay. No test or product module is retired. **320 historical-record contexts and 13,553 distinct enumeration candidate lines remain explicit review work**, not waived matches or a universal reachability proof.

## Actual local rehearsal

A `git clone --no-hardlinks --no-checkout` was created under `/tmp/fgos-work/archive/repo`, then the exact input pin checked out. Only that disposable clone received an archive ref, index changes and plumbing-created commits. No `git add`/`git commit` command was run anywhere.

Final reduced commit: **`a2206bdff60f020a05184f0b016f130a1304f9c1`**, parent = archive commit. All 6,090 retained files were byte-verified; no `test/`, `scripts/`, `src/` or `packages/` source changed.

| Measure | Result |
|---|---:|
| Reduced tip logical bytes | **1,269,268,322** |
| Plan bytes in that measured commit, including then-present design artifacts | 1,085,588,711 |
| Detached worktree add, run 1 | 8.869 s |
| Run 2 | 8.523 s |
| Run 3 | 8.435 s |
| Median | **8.523 s** |

**Filesystem: tmpfs, warm-cache.** This is valid local timing of the named commit, not SSD/F/cutover acceptance. The conservative tip is still ~1.27 GB, not the ~0.2 GB aspiration. Later receipt/log/verification bytes and the final design wording are not falsely called measured; `rehearsal.json` lists exactly which artifacts its commit included. The final pin/filesystem must be measured again.

## Owning proofs, unchanged

Each file ran individually with:

```sh
env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN='<releasePath>/bin/fgos' node --test <file>
```

The explicitly allowed activation metadata supplied release `sha256:447cb9a40339333a4ef51c33b9bc39c33a7b2dff31618e2f4296ef427c734d06`. Its real addon/helper was staged through the existing `native-addon.json` descriptor only in scratch, with digest checks and isolated HOME/state/tmp directories. No Rust-freshness or newly staged release claim.

| Owning file (`test/scripts/`) | Baseline | Reduced |
|---|---:|---:|
| `doc-rationale-reproduction.test.mjs` | 5/8 | 5/8 |
| `doc-runner-liveness.test.mjs` | 1/1 | 1/1 |
| `generate-doc-inventory.test.mjs` | 97/97 | 97/97 |
| `verify-phase-02.test.mjs` | 6/6 | 6/6 |
| `check-doc-retirement.test.mjs` | 36/36 | 36/36 |
| `check-evidence-relocation.test.mjs` | 41/41 | 41/41 |
| `doc-review-format.test.mjs` | 25/25 | 25/25 |
| `doc-restoration-proofs.test.mjs` | 5/5 | 5/5 |
| `check-doc-constitution.test.mjs` | 65/65 | 65/65 |
| `generate-shipped-path-inventory.test.mjs` | 11/11 | 11/11 |
| **Total per side** | **292/295** | **292/295** |

All 20 commands ran; zero skips/cancellations. **Not a green suite.** The same three failing titles and failure kinds occur on both final sides:

1. The symlink-output guard case reaches `ERR_MODULE_NOT_FOUND` rather than the expected unsafe-output diagnostic when the source checkout itself is under `/tmp/fgos-work`. The unmodified audit uses caller cwd in that guard. This is a location-sensitive baseline observation, not a production fix or a safety guarantee.
2. Both frozen ownership command tests fail `assert(current.noNewDoubleOwnership)` in `audit-ownership.mjs` at this source pin. They do not reach `checks.mjs`; no successful B/accounting replay is claimed.

Final reduced logs contain **no ENOENT**. Matching pass counts alone were not used as proof: the first attempt had the same counts but failed on missing comparison baselines instead. That real archive regression was corrected by retaining both baselines and replaying the complete before/after files. Original failed logs, counts and timings remain under `attempts/initial/`; no assertion, baseline or frozen source was changed. See `test-comparison.json` and complete `test-logs/`.

`python3 -B .../archive/verify-design.py`: exit 0. Exact partition/source hashes, every retirement preimage, all 2,918 prior joins, all 47/135 historical joins, six restored inputs and 279 reachable recovery blobs verified. Wrong digest, wrong object and unsafe path negative probes reject. This is the owning custody proof, not semantic approval of every retirement.

## Constraints, gaps and handoff

- Only `archive/**` is authored in the real workspace. Its HEAD/index/ref checks remain unchanged; no archive ref exists there. No lifecycle verb, real fgOS CLI invocation, `.fgos`/secret mutation, main landing, push, pair accounting or shared Lead-file write.
- `npm test`, `scripts/run-tests.mjs`, Cargo workspace suite, installed docs-lease/G10 rehearsal and F timing were not run: prohibited or outside this assignment. Every requested individual owning file ran.
- Impact analysis: **degraded/unqueried under the explicit no-fgOS-CLI boundary**; no graph impact or detect-changes result is invented. Direct code/history and digest/object evidence are retained. No public configuration, default, environment contract or infrastructure dependency changed.
- No browser/service preview was launched inside this constrained records turn. The Markdown is ordinary repository content; preview remains Lead custody.
- **Lead follow-up:** review historical-context and enumeration queues; confirm the post-freeze retirement schedule, especially Phase 09 gate replayers; resolve the baseline rationale failures with their existing owners; rebuild/re-enumerate/review at F; measure the final tree on the intended landing filesystem; obtain publication/real-merge approval. A smaller ~0.2 GB tip requires deliberate further retirement/repoint of still-live inventory inputs, not deletion here.
- `needsWrites: []` for the scoped design/rehearsal deliverable. The three existing test failures are recorded as separate follow-ups, not an excuse to edit out-of-scope code or waive checks.

**No G8 acceptance, all-green claim or final cutover readiness is asserted.**
