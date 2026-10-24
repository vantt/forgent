# Git one-door: declared exemptions

Authority: W1 D3 / W2 D3b / W2 D3c / W3 G4 briefs, G4, L12-137, L13-2, L13-3 and **owner decision L13-6 (1)**. **All 25 sites below are declared** in `scripts/lib/git-one-door-declarations.v1.json`; each exact path + function/call digest carries `reason` and `retireWhen`. The scanner reads that input and regenerates **0 undeclared sites**; `git-mutation-one-door` passes through the unchanged `verifyCensus`/doctor adapter. Git-owner review is requested in [git-owner-review-request.md](git-owner-review-request.md); this is not an independent review verdict or overall G4 closure. Original input: 58 sites; D3: 19; D3b: 26; D3c: 25; declared: 0. No census row was manually moved.

The declaration bytes are included in the census payload digest and verified on disk by doctor. A deleted/edited/renamed call, duplicate declaration or ambiguous match fails the scan. Unrelated line shifts preserve call identity. See [the declaration receipt](declared-exemptions/receipt.md) for proof and execution limits.

## Cold hook: declared S1 under L13-6

Site: `.githooks/pre-commit:507`, `leaseGitRead`. Keep the hook unchanged. Its two callers are `guardCommit` and `guardReferenceTransaction` in `src/runner/documentation-cutover-lease-hook.mjs`. Their Git calls read committed/staged lease authority and changed paths; none is a mutation command. The cold client must not load the checkout's addon to authenticate the commit that is executing it.

Historical undeclared `sites` row (now generated under `classes`):

```json
{"path":".githooks/pre-commit","line":507,"spawn":"execFileSync","binary":"git","family":"spawn"}
```

Declared classification uses the existing `hook-read-context` class and the following read verbs (the generated row additionally retains its exact `siteId`, `reason` and `retireWhen`):

```json
{
  "path": ".githooks/pre-commit",
  "line": 507,
  "spawn": "execFileSync",
  "binary": "git",
  "family": "spawn",
  "class": "hook-read-context",
  "verbs": ["cat-file", "ls-tree", "show-ref", "diff", "show", "symbolic-ref read", "rev-parse", "diff-tree", "rev-list"]
}
```

The scanner cannot resolve this callback's argv, so its exact call is now declared reproducibly. The hook read-verb set adds only `show-ref` and `diff-tree`; the other listed verbs already existed. The hook itself is unchanged. The scanner matches the declaration before generating the classified row; no census row was hand-moved. Retirement condition: the hook no longer needs the lease reader, or the Git owner supplies an approved cold-client door/classification preserving this authentication contract. The declaration must match exactly one still-undeclared call; a vanished call fails closed rather than leaving a stale exemption.

## Byte-pinned reproduction tooling: 10 declared exemptions

Both phase-06 reproduction manifests pin these exact blobs. L13-3 requires byte-identical restoration, not a rebaseline. Every raw Git call in the restored files remains counted under `declared-tooling-exemption`, approved by L13-6. **Reason for all ten sites: byte-pinned reproduction evidence. Retirement condition: when the plan's reproduction manifests retire (retire the readers and their owning proofs/consumers together), or a separate owner ruling supersedes that evidence contract.**

| Pinned file / blob | Call sites and operation | Count |
|---|---|---:|
| `scripts/generate-doc-inventory.mjs` / `a52981ff2862cc2c553dbb3181e4e822a26b146b` | `:56` binary `show`; `:166` scope-binding `diff --quiet`; `:739` sized tree enumeration; `:749` path enumeration; `:1222` sized blob enumeration; `:1241` blob batch; `:1413` sized entry lookup | 7 |
| `scripts/generate-shipped-path-inventory.mjs` / `0f1cd7e1cee308772c0b56c37f3190333039cfb3` | `:63` explicit commit resolution; `:78` path enumeration; `:100` immutable text `show` | 3 |

The two generator-owning test files are also restored to `f59e0b639` bytes. D3's typed-reader proofs move to `test/scripts/doc-git-reads.test.mjs`, owning the extracted non-pinned adapter `scripts/lib/doc-git-reads.mjs`. The migrated gates, proposal writer, relocation tool and verifiers import that adapter; none depends on the helpers D3 added to the pinned scripts. The gates pass the pinned generator's scope data to the typed diff reader and use its bounded typed blob batches. The generators' own historical readers stay frozen.

## Documentation tooling: 9 declared capability exemptions

Line numbers below are display locators, not declaration keys. Every row remains counted under `declared-tooling-exemption`. No existing class describes fixed raw Git evidence readers (they are neither driver, sandbox, configured command nor argv runner), so this single new class covers these nine sites and the ten pinned ones. No Git-component extension, raw fallback added behind a typed port, or weaker check was used.

| Sites | Count | Reason / missing existing capability | Retirement condition |
|---|---:|---|---|
| `scripts/check-doc-inventory-gates.mjs:397,440` | 2 | `ls-tree -l` supplies **size-only** blob metadata, mode and OID without reading every body. Inspect `listTree` exposes mode/kind/OID, not size. `readObjects` reads bodies with a 32 MiB bound; substituting it would fail on large archived artifacts or read gigabytes merely to learn sizes. | Retire the migration readers after Phase 10 once their owning proofs/consumers are gone, or Git lane exposes bounded object-size metadata. |
| `scripts/check-evidence-relocation.mjs:34` (only caller now `gitIndex`) | 1 | Live-index mode/blob/stage, including unborn repositories and index-only mode/blob drift. `trackedPaths` exposes only paths; HEAD and filesystem bytes do not preserve the existing integrity checks. Path enumeration and default HEAD resolution inside the same script were migrated independently. | Evidence relocation tool and its owning before/after proofs retire together, or Git lane exposes live-index metadata. |
| `scripts/doc-alias-resolver.mjs:147` | 1 | Historical Markdown read has an existing 64 MiB output allowance. Inspect path/object reads stop at 32 MiB; no ranged/streamed blob port exists. Lowering the limit would silently narrow the resolver contract. | The historical revision reader retires with migration/alias consumers, or Git lane supplies an equivalent bounded read. |
| `scripts/check-doc-inventory-gates.mjs:1384` | 1 | Committed identity-registry JSON read allows 1 GiB; those registries can exceed Inspect's 32 MiB path/object ceiling. The other small committed-document reads now share the existing 20 MiB blob reader. | Retire committed-registry conservation after its lifecycle ends, or Git lane supplies an equivalent large-object reader. |
| `scripts/verify-phase-01.mjs:169`; `scripts/verify-phase-02.mjs:157` | 2 | Receipt needs the exact commit **tree OID** (`rev-parse <commit>^{tree}`). Inspect resolves commit OIDs and lists tree entries but has no typed commit-tree identity fact. Parsing raw commit headers in these consumers would create a second Git parser. | Immutable verifiers retire with their consumers/proofs, or Git lane exposes this fact. |
| `scripts/verify-phase-01.mjs:370`; `scripts/verify-phase-02.mjs:127` → `runOrThrow:88` | 2 | Exact `git diff --check` validation, including repository whitespace policy/conflict-marker diagnostics. Inspect diff/diffText does not perform this validation. A JS whitespace approximation or dropping the check would weaken the verifier. The second row is reported as an unresolved wrapper; its actual call is `run('git', ['diff', '--check', ...])`. | Verifiers retire, or Git lane supplies equivalent validation. |

These are **9** declared capability exemptions, in addition to the **10** declared byte-pinned tooling sites above. Both verifiers are retained: Phase 02 consumes Phase 01's `verifyMarkdownLinks`/historical hashes; `test/scripts/verify-phase-02.test.mjs` owns argument/scope validation, immutable link reads and cleanup through real temporary-repository ports. Creation uses the existing typed Worktree port. Before guarded `removeWorktree`, each verifier reclaims only its own regenerable setup outputs, including partial dependency installs; Phase 01 unlinks its shared-target link without deleting the host cache, and Phase 02 reclaims its local build output. Previously every dependency install blocked cleanup; warnings now indicate genuine remaining dirty/ignored bytes or another native refusal, not ordinary provisioning. `--keep-worktree` keeps setup bytes too. There is **no force/rm-rf fallback for the checkout**. Force deletion is intentionally not requested as a capability/exemption.

The non-pinned reader's raised-capacity raw branch had no production caller and is removed, not exempted. `test/scripts/doc-git-reads.test.mjs` now proves the bounded reader rejects an explicitly over-bound object while the default size filter excludes it; binary preservation and count/byte batch splitting remain covered. Byte-pinned generators and their historical raw readers are unchanged.

## Existing configured-command class: 5 declared provenance gaps

| Sites | Count | Grounding / missing capability | Retirement condition |
|---|---:|---|---|
| `bin/fgos.mjs:3496,3640`; `src/runner/merge.mjs:958,992` | 4 | Inputs are `readInvariantCheckCommands` → `readCommandList` → `JSON.parse` project configuration, not product-selected Git programs. Git spec §12 already declares invariant commands `configured-binary`. The scanner loses that provenance through the indexed configuration wrapper; these exact calls are now declared in that existing class. No typed Git operation can replace arbitrary consumer verification. `bin/fgos.mjs` and `merge.mjs` remain unchanged. | Git maintainer proves the existing parsed-config data flow in the scanner, or these consumers retire. |
| `src/runner/worktree.mjs:146` | 1 | Same source: project `worktreeSetup.commands`. The spawn now carries the existing consumer-command marker, matching goal-check's runtime classification; the static scanner still cannot prove the indexed configuration provenance. The marker is not a static allowlist; this exact call is now declared and counted under `configured-binary`. | Same provenance proof, or setup-command consumer retirement. |

These **5** rows are declared in `configured-binary`, not a new Git port. Together with 9 capability exemptions, 10 byte-pinned tooling exemptions and S1, they account for all **25** declarations. The generated census remains the code/file-digest authority; Git-owner review must bind to those bytes and be revisited when they change.
