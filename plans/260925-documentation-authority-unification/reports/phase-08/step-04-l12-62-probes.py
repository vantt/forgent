#!/usr/bin/env python3
"""Required rejection probes on copies of current real records; no source writes."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('q',P/'step-04-check.py');q=importlib.util.module_from_spec(sp);sp.loader.exec_module(q)
rs=q.load();positive=q.read('step-04-l12-62-check-result.json');assert positive['failureCount']==0 and not positive['openLeadRulingEdges']
assert positive['checkerSha256']==q.m.sha((P/'step-04-check.py').read_bytes())
assert positive['recordFileHashes']=={f.name:q.m.sha(f.read_bytes()) for f in (P/'step-04-records').glob('*.jsonl')}
receipts=[]
def probe(title,r,fn,expected):
 r=copy.deepcopy(r);fn(r);c=q.Checker();c.record(r);checks=sorted({x['check'] for x in c.failures});receipts.append({'probe':title,'expected':expected,'observed':checks,'pass':expected in checks})
render=next(r for r in rs if r['file']=='core/instructions/platform-laws.md')
park=next(r for r in rs if r['file']=='core/skills/_shared/ak-cook-worker-contract.md')
manifest=next(r for r in rs if r['file']=='packages/distribution/rust/src/manifest.rs')
merge=next(r for r in rs if r['file']=='src/runner/merge.mjs')
def dangling(r):next(e for e in r['edges'] if e['renderOnly']).update(sourceSlotKey='absent-source-slot')
probe('render join must reference an existing source slot',render,dangling,'render-equal-source-passage')
def wrong_passage(r):
 e=next(e for e in r['edges'] if e['edgeId']=='instructions-025');e['sourceSlotKey']=next(x['slotKey'] for x in r['edges'] if x['edgeId']=='instructions-050')
probe('same target and same path cannot waive unequal render/source passages',render,wrong_passage,'render-equal-source-passage')
probe('parked source must have a passage-content search witness',park,lambda r:next(e for e in r['edges'] if e['disposition']=='parked').pop('passageSearchWitness'),'park-passage-content-search')
def path_only(r):
 e=next(e for e in r['edges'] if e['disposition']=='parked');e['passageSearchWitness']['terms']=[e['legacyPath']]
probe('old-path-only search is insufficient',park,path_only,'park-passage-content-search')
pres=next(r for r in rs if r['file']=='src/runner/paths.mjs')
def fake_tree(r):r['edges'][0]['preservedPathWitness']['treeMatchCount']+=1
probe('preserved-path tree/history witness must replay',pres,fake_tree,'preserved-tree-history')
def dead_see(r):
 e=next(e for e in r['edges'] if e['edgeId']=='class6-l-000293');e.update(disposition='preserve',blockedCategory=None,dependencyCategory=None,blockedReason=None,dependency=None,preservedPathWitness={**q.v.existence(q.PIN,e['legacyPath']),'exception':'claimed provenance'})
probe('never-existing see-pointer cannot be relabelled preserve',merge,dead_see,'preserved-tree-history')
def remove_wrap(r):
 r['edges']=[e for e in r['edges'] if not any(s['line'] in [215,216] for s in e['sourceSpans'])]
 r['stepFiveExcluded']=[e for e in r['stepFiveExcluded'] if not any(s['line'] in [215,216] for s in e['sourceSpans'])]
probe('docs slash followed by comment-continuation architect path must be covered',merge,remove_wrap,'wrapped-path-coverage')
probe('context rewrite cannot alter arbitrary comment words',manifest,lambda r:r['contextEdits'][0].update(replacement='//! unrelated contract'),'comment-context-edits')
def bad_secondary(r):r['edges'][0]['additionalTargets'][0]['path']='docs/platform/git/spec.md'
authority=next(r for r in rs if r['file']=='src/runner/dispatch/confinement/authority.mjs')
probe('both confinement holders must be bound to real evidence',authority,bad_secondary,'comment-context-edits')
probe('anchor follows schema passage rather than identical section number',manifest,lambda r:r['edges'][0].update(anchor='5-digest-rule'),'anchor-from-evidence')
def missing_successor(r):
 e=next(e for e in r['edges'] if e['legacyPath']=='docs/decisions/0032');e['reason']=e['reason'].split(' Non-executable successor note:')[0]
approve=next(r for r in rs if r['file']=='src/verbs/merge/approve.mjs')
probe('removed decision 0032 needs its title-matched successor note',approve,missing_successor,'removed-decision-successor')
probe('render join has no independent patch hunk',render,lambda r:next(e for e in r['edges'] if e['renderOnly']).update(diffHunk='@@ -1 +1 @@'),'render-path-diff-rejected')
probe('Phase 9 patch cannot become apply-now',manifest,lambda r:r['edges'][0].update(timing='now'),'zero-apply-now')
for title,r in [('positive split-holder comment patch',authority),('positive schema de-duplication',manifest),('positive exact source and managed-render joins',render)]:
 c=q.Checker();c.record(r);receipts.append({'probe':title,'pass':not c.failures,'failures':c.failures})
# Scanner's positive and negative boundary controls do not mirror the implementation.
controls=[('slash alone at EOL joins a block-comment continuation',' * (docs/\n * architect/example.md)',1),('multiple wrapped hyphen segments join through EOF','// docs/history/long-\n// split-\n// name/CONTEXT.md',1),('closed directory citation does not consume next source line','`docs/history/`\nnext.md',0),('a new repository-root path starts a separate citation','docs/example/\nplans/another/plan.md',0)]
for title,body,count in controls:receipts.append({'probe':title,'pass':len(q.v.wrapped_paths(body))==count})
out={'positiveSlots':positive['edges'],'positiveFailureCount':positive['failureCount'],'checkerSha256':positive['checkerSha256'],'recordFileHashes':positive['recordFileHashes'],'probes':receipts,'passed':sum(x['pass'] for x in receipts),'total':len(receipts),'allPassed':all(x['pass'] for x in receipts)}
q.save('step-04-l12-62-probes-result.json',out);print(json.dumps({'passed':out['passed'],'total':out['total'],'failed':[x for x in receipts if not x['pass']]}));raise SystemExit(not out['allPassed'])
