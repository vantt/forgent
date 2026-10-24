import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { verifyCensus } from '/home/vantt/projects/forgentX-p9-w1-d4/scripts/git-one-door-scan.mjs';
const scratch = '/tmp/fgos-work/w5-g4-escape';
const read = p => fs.readFileSync(p, 'utf8');
const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const fromHead = p => execFileSync('git', ['show', `HEAD:${p}`], { encoding: 'utf8' });
const censusPath = 'packages/git/contracts/mutation-census.v1.json';
const doc = JSON.parse(read(censusPath));
const previous = JSON.parse(fromHead(censusPath));
const declarationsPath = 'scripts/lib/git-one-door-declarations.v1.json';
assert.equal(read(declarationsPath), fromHead(declarationsPath));
assert.deepEqual(doc.files, previous.files);
assert.equal(doc.payloadDigest, previous.payloadDigest);
assert.deepEqual(doc.classes.map(({ escapes, ...rest }) => rest), previous.classes);
assert.deepEqual(doc.sites, []);
assert.equal(read(`${scratch}/scan-1.json`), read(`${scratch}/scan-2.json`));
assert.equal(read(`${scratch}/census-first.json`), read(censusPath));
const declarations = JSON.parse(read(declarationsPath)).declarations;
const declared = doc.classes.filter(row => declarations.some(d => d.path === row.path && d.siteId === row.siteId));
assert.equal(declared.length, 25);
const nonConfigured = declared.filter(row => row.class !== 'configured-binary');
assert.equal(nonConfigured.length, 20);
assert.ok(nonConfigured.every(row => !(row.escapes?.length)));
const escaped = declared.filter(row => row.escapes?.length);
assert.equal(escaped.length, 1);
assert.equal(escaped[0].class, 'configured-binary');
const verified = verifyCensus(doc, process.cwd());
assert.equal(verified.passed, true);
console.log(JSON.stringify({
  inputHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  sites: doc.sites.length,
  scannedFiles: Object.keys(doc.files).length,
  classCounts: JSON.parse(read(`${scratch}/scan-1.json`)).classCounts,
  declarations: declared.length,
  hookAndToolingDeclarationsWithoutEscapes: nonConfigured.length,
  declarationsUnchanged: true,
  censusFileDigestsAndIdentitiesUnchanged: true,
  configuredEscapes: escaped.map(({ path, line, siteId, escapes }) => ({ path, line, siteId, escapes })),
  scanSha256: [1, 2].map(n => hash(`${scratch}/scan-${n}.json`)),
  censusSha256: hash(censusPath),
  verifyCensus: verified,
}, null, 2));
