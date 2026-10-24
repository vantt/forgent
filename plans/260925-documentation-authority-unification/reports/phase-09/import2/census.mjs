// Read-only checkout census replay through unchanged production exports (W0 method).
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {scan,census,censusDigestMatches,declaredProduct} from '../../../../../scripts/git-one-door-scan.mjs';
import {ensureScriptAddon} from '../../../../../scripts/lib/git-ports.mjs';
// Same native staging door as the owning CLI; no parser fallback or test workaround.
ensureScriptAddon();
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const root=process.cwd(),P='plans/260925-documentation-authority-unification';
const listed=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8',maxBuffer:64*1024*1024}).split('\0').filter(Boolean);
const product=declaredProduct(root);
const files=[...new Set(listed)].filter(product).sort().map(p=>path.join(root,p));
const result=scan({root,files}),generated=JSON.stringify(census(result),null,2)+'\n';
const committed=fs.readFileSync('packages/git/contracts/mutation-census.v1.json','utf8');
assert.equal(generated,committed);assert(censusDigestMatches(JSON.parse(committed)));
const before=JSON.parse(execFileSync('git',['show','bc5589ed7^1:packages/git/contracts/mutation-census.v1.json'],{encoding:'utf8',maxBuffer:64*1024*1024}));
const identity=s=>JSON.stringify(Object.fromEntries(Object.entries(s).filter(([k])=>k!=='line')));
assert.deepEqual(result.sites.map(identity).sort(),before.sites.map(identity).sort());
console.log(JSON.stringify({method:'unchanged scan/census exports with full cached+untracked inventory filtered by unchanged declaredProduct; no CLI bootstrap or census write',fileCount:Object.keys(result.files).length,siteCount:result.sites.length,classCount:result.classes.length,classCounts:result.classCounts,generatedEqual:true,generatedSha256:sha(generated),committedSha256:sha(committed),committedSelfDigestMatches:true,sameSiteIdentitiesExcludingLine:true,priorSiteCount:before.sites.length},null,2));
