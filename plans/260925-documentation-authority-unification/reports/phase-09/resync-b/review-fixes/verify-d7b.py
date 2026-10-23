"""Read-only D7b delta proof; reuses the owning binding and current-target checks.
Run from repository root with python3 -B <this-file>. No CLI, staging or writes.
"""
import copy
import json
import subprocess
import sys
from pathlib import Path

P = Path('plans/260925-documentation-authority-unification')
sys.path.insert(0, str(P / 'reports/phase-09/ledgerfix'))
from bindings import *
from verify import check_current

S14 = str(P / 'ledger/decisions/s14-resync-b.json')
S15 = str(P / 'ledger/decisions/s15-navigation-review-fixes.json')
s = load(S15); pin = s['sourcePin']
git = lambda *args: subprocess.check_output(['git', *args]).decode()
old_text = lambda p: git('show', pin + ':' + str(p))
paths = [d['path'] for d in s['changedDocuments']]
assert paths == ['docs/platform/component-boundary.md', 'docs/reading-map.md']

# Exact byte-level edit whitelist, including all eight link destinations.
component = paths[0]; expected = old_text(component)
link_edits = [
    ('../specs/runner.md', 'runner/spec.md', 3),
    ('../specs/herdr-web-dashboard.md', 'herdr-web-dashboard/spec.md', 2),
    ('../specs/confinement-authority.md', 'agent-confinement/spec.md', 1),
    ('../specs/observe.md', 'observe/spec.md', 1),
]
for old, new, count in link_edits:
    token = '[' + old + '](' + old + ')'
    assert expected.count(token) == count
    expected = expected.replace(token, '[' + new + '](' + new + ')')
assert expected.count('[Reading Map setup entries](../specs/reading-map.md)') == 1
expected = expected.replace('[Reading Map setup entries](../specs/reading-map.md)',
                            '[Reading Map setup entries](../reading-map.md#5-detailed-product-and-source-map)')
assert Path(component).read_text() == expected
assert '../specs/' not in expected
map_path = paths[1]
old_intro = ('Merged from `docs/specs/reading-map.md` (current-source delta rechecked at the\n'
             'pin recorded in `plans/260925-documentation-authority-unification/reports/phase-09/resync-b/receipt.json`).')
assert old_text(map_path).count(old_intro) == 1
assert Path(map_path).read_text() == old_text(map_path).replace(old_intro,
    'Merged from the retained legacy product/source map, `docs/specs/reading-map.md`.')
for d in s['changedDocuments']:
    assert sha(old_text(d['path'])) == d['beforeSha256']
    assert sha(Path(d['path']).read_bytes()) == d['afterSha256']

# Only the four review-requested s14 rationale fields change, never source identities/bindings.
before14 = json.loads(old_text(S14)); current14 = load(S14); patched14 = copy.deepcopy(before14)
for i in [125, 132, 247]:
    r = current14['unitCarries'][i]
    assert r['disposition']['kind'] == 'candidate-metadata-adaptation'
    assert '9818f25a8' in r['disposition']['reason'] and 'not carried' in r['disposition']['reason']
    patch = git('show', '9818f25a8', '--', r['sourcePath'])
    assert '+> Migration status:' in patch
    assert int(git('show', '-s', '--format=%ct', '9818f25a8')) < int(git('show', '-s', '--format=%ct', '2180b4e72'))
    patched14['unitCarries'][i]['disposition'] = r['disposition']
reason = current14['bindingRefresh'][475]['reason']
assert reason.startswith('Changed links:') and 'workflow/spec.md' in reason and 'not byte-identical' in reason
patched14['bindingRefresh'][475]['reason'] = reason
assert patched14 == current14

# Reuse the existing independent serializers, dual extractors, effective-overlay join,
# and owning current-target/placement checker for ALL stored bindings, not just the delta.
docs = documents(); links = supersessions(docs)
actual = {(f,p):r for f,d in docs.items() for p,r in rows(d)}
request = {'paths': sorted({r['targetOwner'] for r in actual.values() if 'bindingSha256' in r}),
           'virtual': [{'path':'before-'+str(i)+'.md', 'content':old_text(p)} for i,p in enumerate(paths)],
           'bindingRows': list(actual.values())}
extracted = json.loads(subprocess.check_output(['node', str(P / 'reports/phase-09/g0fix/extract-units.mjs')],
                                               input=json.dumps(request).encode()))
assert extracted['bindingDigests'] == [digest(r) for r in actual.values()]
cat = extracted['catalog']
for entry in cat.values():
    for u in entry['units']:
        if u['unitKind'] == 'heading': u['ancestry'] += [u['title']]
stored = historical = current = 0
for (f,p),r in actual.items():
    if 'bindingSha256' not in r: continue
    assert r['bindingSha256'] == digest(r), (f,p)
    stored += 1
    ef,ep,er = effective(f,p,r,docs,links)
    if (ef,ep) != (f,p): historical += 1; continue
    check_current(r,cat); current += 1
changed = set()
for i,p in enumerate(paths):
    old_units = cat['before-'+str(i)+'.md']['units']
    for u in cat[p]['units']:
        old = next(x for x in old_units if x['anchor'] == u['anchor'])
        if old['textDigest'] != u['textDigest']: changed.add((p,u['anchor'],u['textDigest']))
assert changed == {(r['targetOwner'],r['targetAnchor'],r['targetUnitDigest'])
                   for r in s['unitCarries']+s['bindingRefresh']}
assert len(changed) == 6 and len(s['bindingRefresh']) == 6 and len(s['unitCarries']) == 3
for r in s['unitCarries']+s['bindingRefresh']:
    assert r['reviewStatus'] == 'pending'
    assert not any(k in r for k in ['reviewedBy','reviewedAt','reviewVerdict'])
    check_current(r,cat)
for r in s['unitCarries']:
    old = unit_for({'targetOwner':'before-'+str(paths.index(r['sourcePath']))+'.md',
                    'targetAnchor':r['sourceAnchor'],'targetUnitDigest':r['sourceUnitDigest']},cat)
    assert old['ancestry'] == r['sourceAncestry']
for r in s['bindingRefresh']:
    b = r['supersedesBinding']; old = at(docs[b['shard']],b['pointer'])
    assert all(old[k] == b[k] for k in ['targetOwner','targetAnchor','targetUnitDigest','bindingSha256'])
    u = unit_for({**old,'targetOwner':'before-'+str(paths.index(old['targetOwner']))+'.md'},cat)
    assert u['text'] == r['beforeContent'] and sha(u['text']) == r['preimageContentSha256']

# Literal law projection and retired-engine history are explicitly unchanged.
foundations = 'docs/platform/platform-foundations.md'
assert Path(foundations).read_text() == old_text(foundations)
clause = '| 3 | Mức bền (5 cấp, nhãn chính thức tại `docs/platform-foundations.md` §L7) |'
assert clause in Path(foundations).read_text() and clause in Path('docs/specs/platform-foundations.md').read_text()
assert 'Historical self-paths in the narratives retain their dated spelling.' in Path(foundations).read_text()
assert '## L7' in Path('docs/platform-foundations.md').read_text()
history_paths = git('ls-tree','-r','--name-only',pin,'--','docs/platform/agent-coordination/history/').splitlines()
for p in history_paths: assert Path(p).read_bytes() == subprocess.check_output(['git','show',pin+':'+p])

# Pure owning link/metadata APIs: no runCli / native staging against this checkout.
js = r'''
import fs from 'node:fs'; import path from 'node:path'; import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {anchorExists} from './scripts/list-doc-anchors.mjs';
import {checkCandidateMetadata} from './scripts/check-doc-candidate-status.mjs';
const files=JSON.parse(process.argv[1]),pin=process.argv[2],read=p=>fs.readFileSync(p,'utf8');
let checked=0;
for(const p of [files[0]])for(const [,dest] of read(p).matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)){
 if(/^[a-z]+:|^#|^\//i.test(dest))continue;
 const [file,fragment]=dest.split('#'),resolved=path.normalize(path.join(path.dirname(p),file));
 assert(fs.existsSync(resolved),resolved); if(fragment)assert(anchorExists(read(resolved),fragment),dest); checked++;
}
const base='plans/260925-documentation-authority-unification/';
const args={files,switchboard:JSON.parse(read(base+'transitional-switchboard.json')),constitution:JSON.parse(read(base+'minimum-constitution.json')),repoRoot:process.cwd()};
const current=checkCandidateMetadata({...args,readFile:read});
const old=checkCandidateMetadata({...args,readFile:p=>execFileSync('git',['show',pin+':'+p],{encoding:'utf8'})});
const prior=new Set(old.findings.map(x=>JSON.stringify(x)));
assert.deepEqual(current.findings.filter(x=>!prior.has(JSON.stringify(x))),[]);
console.log(JSON.stringify({relativeComponentLinksChecked:checked,metadataFindings:current.findings,newMetadataFindings:0}));
'''
link_result = json.loads(subprocess.check_output(['node','--input-type=module','-e',js,json.dumps(paths),pin]))
print(json.dumps({'status':'pass','sourcePin':pin,'evaluation':'current working-tree targets, source pin for preimages only',
                  's14RationaleCorrections':4,'linkReplacements':8,'changedUnitsBound':len(changed),
                  'additiveRebindings':6,'candidateUnitsWithoutPredecessorBound':3,
                  'ledgerRowsRecomputed':len(actual),'storedBindingHashesVerified':stored,
                  'effectiveCurrentStoredBindingsVerified':current,'historicalBindingsResolvedByOverlay':historical,
                  'independentNodePythonHashes':True,'dualExtractorAgreement':True,
                  'retiredHistoryFilesUnchanged':len(history_paths),'foundationsStaysVerbatim':True,
                  'foundationsReason':'The operational projection declares verbatim source/provenance carriage and retained historical self-paths. The row matches the legacy spec and the retained original L7 source; this is not a fresh reader route. No law or literal history is rewritten.',
                  **link_result,'independentReview':'pending; no authority flip or gate acceptance'},ensure_ascii=False,indent=2))
