# Git one-door: pending exemption packet

Authority: W1 D3 brief, G4, L12-137 and L13-2. **Proposals only; none is approved or suppressed.** The regenerated census retains all **19** sites below. G4 and `git-mutation-one-door` remain red. Input census: 58 sites; final census: 19 (39 removed), 1,097 files.

## Cold hook: owner decision S1

Site: `.githooks/pre-commit:507`, `leaseGitRead`. Keep the hook unchanged. Its two callers are `guardCommit` and `guardReferenceTransaction` in `src/runner/documentation-cutover-lease-hook.mjs`. Their Git calls read committed/staged lease authority and changed paths; none is a mutation command. The cold client must not load the checkout's addon to authenticate the commit that is executing it.

Exact existing `sites` row (still present):

```json
{"path":".githooks/pre-commit","line":507,"spawn":"execFileSync","binary":"git","family":"spawn"}
```

Exact proposed classified census row, **only after owner approval**, using the existing `hook-read-context` class:

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

This is not a declaration already understood by the generator: the scanner cannot resolve this callback's argv, and its current hook read-verb set does not name `show-ref` or `diff-tree`. The owner/Git maintainer must arrange a reproducible declaration/classification before this row can replace the site; manually moving a row into `classes` would be an unrepeatable green and was **not** done. Retirement condition: the hook no longer needs the lease reader, or the Git owner supplies an approved cold-client door/classification preserving this authentication contract. No generic exemption mechanism is introduced here.

## Documentation tooling: L13-2 candidates

Line numbers below are the final census locators, not the older register's line numbers. Every row remains a counted site. No Git-component extension, raw fallback added behind a typed port, or weaker check was used.

| Sites | Count | Reason / missing existing capability | Retirement condition |
|---|---:|---|---|
| `scripts/check-doc-inventory-gates.mjs:396,439`; `scripts/generate-doc-inventory.mjs:739,1218,1435` | 5 | `ls-tree -l` supplies **size-only** blob metadata, mode and OID without reading every body. Inspect `listTree` exposes mode/kind/OID, not size. `readObjects` reads bodies with a 32 MiB bound; substituting it would fail on large archived artifacts or read gigabytes merely to learn sizes. | Retire the migration readers after Phase 10 once their owning proofs/consumers are gone, or Git lane exposes bounded object-size metadata. |
| `scripts/check-evidence-relocation.mjs:34` (only caller now `gitIndex`) | 1 | Live-index mode/blob/stage, including unborn repositories and index-only mode/blob drift. `trackedPaths` exposes only paths; HEAD and filesystem bytes do not preserve the existing integrity checks. Path enumeration and default HEAD resolution inside the same script were migrated independently. | Evidence relocation tool and its owning before/after proofs retire together, or Git lane exposes live-index metadata. |
| `scripts/doc-alias-resolver.mjs:147` | 1 | Historical Markdown read has an existing 64 MiB output allowance. Inspect path/object reads stop at 32 MiB; no ranged/streamed blob port exists. Lowering the limit would silently narrow the resolver contract. | The historical revision reader retires with migration/alias consumers, or Git lane supplies an equivalent bounded read. |
| `scripts/generate-doc-inventory.mjs:1240` | 1 | The existing blob-map helper permits explicitly raising `maxSize` above the native single-object bound. Default production calls (20 MiB per blob) now use typed bounded batches, but the existing `cat-file --batch` capacity path is retained **before** typed reads for entries above 31 MiB. This is not a retry after a port failure. A 33 MiB fixture proves the explicitly raised limit still works and the default still filters it out. | A Git-owned equivalent large-object reader, or explicit retirement of the optional high-limit contract. |
| `scripts/check-doc-inventory-gates.mjs:1383` | 1 | Committed identity-registry JSON read allows 1 GiB; those registries can exceed Inspect's 32 MiB path/object ceiling. The other small committed-document reads now share the existing 20 MiB blob reader. | Retire committed-registry conservation after its lifecycle ends, or Git lane supplies an equivalent large-object reader. |
| `scripts/verify-phase-01.mjs:169`; `scripts/verify-phase-02.mjs:157` | 2 | Receipt needs the exact commit **tree OID** (`rev-parse <commit>^{tree}`). Inspect resolves commit OIDs and lists tree entries but has no typed commit-tree identity fact. Parsing raw commit headers in these consumers would create a second Git parser. | Immutable verifiers retire with their consumers/proofs, or Git lane exposes this fact. |
| `scripts/verify-phase-01.mjs:363`; `scripts/verify-phase-02.mjs:127` → `runOrThrow:88` | 2 | Exact `git diff --check` validation, including repository whitespace policy/conflict-marker diagnostics. Inspect diff/diffText does not perform this validation. A JS whitespace approximation or dropping the check would weaken the verifier. The second row is reported as an unresolved wrapper; its actual call is `run('git', ['diff', '--check', ...])`. | Verifiers retire, or Git lane supplies equivalent validation. |

These are **13** documentation-tooling candidates. Both verifiers are retained: Phase 02 consumes Phase 01's `verifyMarkdownLinks`/historical hashes; `test/scripts/verify-phase-02.test.mjs` still owns argument and scope validation and now proves immutable link reads. No owning proof was removed. Creation uses the existing typed Worktree port; cleanup now reuses guarded `removeWorktree`, warns on retention, and has **no force/rm-rf fallback**. Force deletion is intentionally not requested as a capability/exemption.

## Existing configured-command class: scanner-proof gaps

| Sites | Count | Grounding / missing capability | Retirement condition |
|---|---:|---|---|
| `bin/fgos.mjs:3496,3640`; `src/runner/merge.mjs:960,994` | 4 | Inputs are `readInvariantCheckCommands` → `readCommandList` → `JSON.parse` project configuration, not product-selected Git programs. Git spec §12 already declares invariant commands `configured-binary`. The scanner loses that provenance through the indexed configuration wrapper. No typed Git operation can replace arbitrary consumer verification. `bin/fgos.mjs`, `merge.mjs` and the scanner were left unchanged, rather than restructuring data solely to hide a site. | Git maintainer proves the existing parsed-config data flow in the scanner, or these consumers retire. |
| `src/runner/worktree.mjs:146` | 1 | Same source: project `worktreeSetup.commands`. The spawn now carries the existing consumer-command marker, matching goal-check's runtime classification; the static scanner still cannot prove the indexed configuration provenance. The marker is not a static allowlist and the census still counts this site. | Same provenance proof, or setup-command consumer retirement. |

These **5** rows need a classification disposition, not a new Git port. Together with 13 tooling candidates and S1, they account for all 19 remaining sites. The generated census is the current authority for code/file digests; approval must be bound to those bytes and revisited if they change.
