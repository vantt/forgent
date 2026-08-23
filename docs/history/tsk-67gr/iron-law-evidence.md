# Iron Law evidence — tsk-67gr

`classifyIronLaw` result against the real committed diff (`48f76c9e`):
`{"required":true,"matchedFlags":["audit"],"matchedModules":[]}`.

Verify command: parse `docs/contracts/fgos-gateway-api-v1.yaml` and assert
`openapi`/`paths`/`info` are present.

Docs-only content fix (a spec value not matching real CLI behavior) — the
honest proof for this class of bug is the contract's own content.

## Failing-before

```
$ git show HEAD~1:docs/contracts/fgos-gateway-api-v1.yaml | node -e "
const {parse}=require('yaml');
let input='';process.stdin.on('data',d=>input+=d).on('end',()=>{
  const doc=parse(input);
  console.log(JSON.stringify(doc.paths['/work/{id}/take'].post.requestBody.content['application/json'].schema.properties.role.enum));
});
"
["human","runner","session"]
```

The contract promised `runner` as a valid `take --role` value; `bin/
fgos.mjs:2707-2710` (unchanged by this item) refuses anything but
`human`/`session` — a contract-compliant client sending `role: "runner"`
always got a validation error the spec gave it no reason to expect.

## Passing-after

```
$ node -e "
const {parse}=require('yaml');
const fs=require('fs');
const doc=parse(fs.readFileSync('docs/contracts/fgos-gateway-api-v1.yaml','utf8'));
if(!doc.openapi||!doc.paths||!doc.info)throw new Error('invalid or incomplete OpenAPI spec');
console.log('ok');
console.log(JSON.stringify(doc.paths['/work/{id}/take'].post.requestBody.content['application/json'].schema.properties.role.enum));
"
ok
["human","session"]
```

The enum now matches `take`'s own real, documented vocabulary exactly.
