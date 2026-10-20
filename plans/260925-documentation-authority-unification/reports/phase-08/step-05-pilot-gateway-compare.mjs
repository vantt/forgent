// Plan-local file-only parity proof. Does not import or launch the gateway.
import fs from 'node:fs';
import crypto from 'node:crypto';
import YAML from 'yaml';
import assert from 'node:assert/strict';
const paths = ['docs/contracts/fgos-gateway-api-v1.yaml', 'docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml'];
const bytes = paths.map(p => fs.readFileSync(p));
assert.deepEqual(bytes[0], bytes[1]);
const documents = bytes.map(b => YAML.parse(b.toString('utf8')));
assert.deepEqual(documents[0], documents[1]);
console.log(JSON.stringify({ paths, bytes: bytes.map(b => b.length), sha256: bytes.map(b => crypto.createHash('sha256').update(b).digest('hex')), rawBytesEqual: true, completeParsedEqual: true, operations: Object.values(documents[0].paths).reduce((n, x) => n + Object.keys(x).filter(k => ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'].includes(k)).length, 0), schemas: Object.keys(documents[0].components.schemas).length, httpExecution: false }));
