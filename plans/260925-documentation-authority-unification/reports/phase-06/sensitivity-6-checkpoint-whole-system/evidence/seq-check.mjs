import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const root=process.cwd();const g=await import(path.join(root,'scripts/check-doc-inventory-gates.mjs'));
const pin=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();const u=g.buildConservationUnitLookup(root,pin);
const pop=JSON.parse(fs.readFileSync('plans/260925-documentation-authority-unification/reports/phase-06/checkpoint-6-reviewed-source-population.json','utf8'));
const norm=t=>t.split('\n').map(l=>l.replace(/\]\([^)]*\)/g,']()').replace(/^#{1,6}\s+/,'# ').replace(/\s+$/,'')).filter(l=>l.trim()!=='');
let bad=[];for(const b of pop.reviewedBindings){const s=u(b.sourcePath).find(x=>x.anchor===b.sourceAnchor),t=u(b.targetOwner).find(x=>x.anchor===b.targetAnchor);
const a=norm(s.text),c=norm(t.text);let i=0;for(const l of c){if(l===a[i])i++}if(i!==a.length)bad.push(b.claimId)}
console.log('source lines not an in-order subsequence of target:',bad.length,bad);
