# Iron Law evidence — tsk-5m1

`classifyIronLaw` result against the real committed diff (`ec9d937f`):
`{"required":true,"matchedFlags":["authentication","delete","audit"],"matchedModules":[]}`.

Verify command: parse `docs/contracts/fgos-gateway-api-v1.yaml` and assert
`openapi`/`paths`/`info` are present.

This is a docs-only content-presence fix (a false promise in a spec file,
not a code behavior) — the honest failing-before/passing-after proof for
this class of bug is the contract's own content, not a runnable test.

## Failing-before

Before this commit (`HEAD~1`, `0efe1f6e`):

```
$ git show HEAD~1:docs/contracts/fgos-gateway-api-v1.yaml | grep -c "WriterId\|WriterRole"
16
```

16 references (2 parameter component definitions + 14 `$ref`s across 8
write operations) — the contract promised `X-Fgos-Writer-Id`/
`X-Fgos-Writer-Role` headers that, per the audit report's Finding 6, the
gateway never reads and the CLI has no flag to forward.

## Passing-after

```
$ grep -c "WriterId\|WriterRole" docs/contracts/fgos-gateway-api-v1.yaml
0

$ node -e "
const {parse}=require('yaml');
const fs=require('fs');
const doc=parse(fs.readFileSync('docs/contracts/fgos-gateway-api-v1.yaml','utf8'));
if(!doc.openapi||!doc.paths||!doc.info)throw new Error('invalid or incomplete OpenAPI spec');
console.log('ok');
console.log('paths count:', Object.keys(doc.paths).length);
"
ok
paths count: 18
```

Zero references remain, the contract still parses as a structurally valid
OpenAPI document, and all 18 paths are intact (only the 2 dead parameter
components, their 14 `$ref`s, and the 9 `parameters:` keys the deletion
left empty were removed — confirmed via `git diff --stat`: 43 deletions,
0 insertions, one file). `cargo test --manifest-path herdr-plugin/
Cargo.toml` also stays green (162 passed) as a sanity check, since no Rust
file changed.
