#!/usr/bin/env python3
"""Differential record mutations against accepted positive pilot records; no live edits."""
import sys
sys.dont_write_bytecode=True
import argparse, copy, importlib.util, json, pathlib
from unittest.mock import patch as mock_patch
P=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('pilot_check',P/'step-03-check.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--author-commit',required=True);a=ap.parse_args();c=m.Checker(a.author_commit);rs=m.records()
    baseline=c.all(rs);assert not baseline['failures'],baseline
    patch=next(r for r in rs if r['file']=='docs/routing-handoff-contract.md')
    plain=next(r for r in rs if r['file']=='README.md')
    parked=next(r for r in rs if any(e['disposition']=='parked' for e in r['edges']))
    row=next(r for r in rs if any(e['disposition']=='phase9-row-flip' for e in r['edges']))
    checks=[]
    def probe(name,source,mutate,expected):
        r=copy.deepcopy(source);mutate(r);fail=c.check_record(r);names={x['check'] for x in fail}
        assert expected in names,(name,expected,names)
        checks.append({'surfaceClass':3,'probe':name,'expectedCheck':expected,'rejected':True,'observedChecks':sorted(names)})
    def pe(r):return next(e for e in r['edges'] if e['disposition']=='patch')
    def parked_e(r):return next(e for e in r['edges'] if e['disposition']=='parked')
    def row_e(r):return next(e for e in r['edges'] if e['disposition']=='phase9-row-flip')
    probe('unknown record field',plain,lambda r:r.update(extra=True),'schema')
    probe('wrong author digest',plain,lambda r:r.update(digest='0'*64),'digest')
    probe('wrong declared commit',plain,lambda r:r.update(authorInputCommit='0'*40),'digest')
    probe('wrong inventory digest',plain,lambda r:r.update(inventoryFileDigest='0'*64),'digest')
    probe('missing inventory edge',plain,lambda r:r['edges'].pop(),'edge-coverage')
    probe('duplicate inventory edge',plain,lambda r:r['edges'].append(copy.deepcopy(r['edges'][0])),'edge-coverage')
    probe('invented inventory edge',plain,lambda r:r['inventoryEdgeIds'].append('maps-j-invented'),'edge-coverage')
    probe('wrong source column',plain,lambda r:r['edges'][0]['sourceSpans'][0].update(columnStart=2),'source-span')
    probe('old ordinal rebound to different unit',plain,lambda r:r['edges'][0].update(matchedExpression='other source'),'passage-correspondence')
    probe('unknown disposition',plain,lambda r:r['edges'][0].update(disposition='rewrite'),'disposition')
    probe('park without blocked reason',parked,lambda r:parked_e(r).update(blockedReason=None),'parked-state')
    probe('park without dependency',parked,lambda r:parked_e(r).update(dependency=None),'parked-state')
    probe('row flip scheduled now',row,lambda r:row_e(r).update(timing='now'),'row-semantics')
    probe('preserved citation with executable hunk',plain,lambda r:r['edges'][0].update(diffHunk='@@ fake @@'),'preserve-state')
    probe('missing committed target',patch,lambda r:pe(r).update(target='docs/nonexistent-pilot-target.md'),'target-tree')
    probe('alias key used as destination',patch,lambda r:pe(r).update(target='alias:root-authorities-draft-0060'),'alias-destination')
    probe('retired lookup spelling as destination',patch,lambda r:pe(r).update(target='docs/specs/reading-map.md'),'alias-destination')
    probe('orphan edge hunk',patch,lambda r:pe(r).update(diffHunk='@@ -9999 +9999 @@'),'hunk-binding')
    probe('hunk without disposition',patch,lambda r:r.update(diff=r['diff']+'@@ -9999 +9999 @@\n-x\n+y\n'),'orphan-hunk')
    probe('candidate labelled current',patch,lambda r:r['checks']['relativeResolution'][pe(r)['edgeId']].update(authorityStatus='current-authority'),'authority-timing')
    def early(r):
        pe(r)['timing']='now';r['checks']['relativeResolution'][pe(r)['edgeId']]['authorityStatus']='cutover-patch-only'
    probe('early cutover',patch,early,'authority-timing')
    probe('untraced writer',patch,lambda r:r['checks']['coverage']['writerTrace'].update({pe(r)['edgeId']:'untraced dynamic writer'}),'writer-boundary')
    probe('missing anchor',patch,lambda r:pe(r).update(anchor='nonexistent-pilot-anchor'),'anchor-carriage-locator')
    def wrong_locator(r):
        e=next(e for e in r['edges'] if e['anchor']);r['checks']['anchors'][e['edgeId']]['passage']='not the cited section'
    probe('locator dropped or bound to wrong passage',patch,wrong_locator,'anchor-carriage-locator')
    def carriage(r):
        pe(r)['target']='docs/platform/packaging-distribution/spec.md';pe(r)['anchor']='retained-distribution-source-detail'
    probe('destination in retained carriage',patch,carriage,'anchor-carriage-locator')
    probe('self destination',patch,lambda r:pe(r).update(target=r['file']),'anchor-carriage-locator')
    probe('bad target digest',patch,lambda r:r['checks']['anchors'][pe(r)['edgeId']].update(targetDigest='0'*64),'anchor-carriage-locator')
    def broken_resolution(r):r['checks']['relativeResolution'][pe(r)['edgeId']]['resolvedTarget']='docs/wrong-consumer-dir.md'
    probe('resolve relative link from wrong directory',patch,broken_resolution,'relative-resolution')
    def wrong_form(r):
        e=pe(r);r['checks']['relativeResolution'][e['edgeId']]['replacement']='../'+r['checks']['relativeResolution'][e['edgeId']]['replacement']
    probe('drop repo-root coordinate form',patch,wrong_form,'label-form')
    probe('diff differs from declared unit edits',patch,lambda r:r.update(diff=''),'diff-correspondence')
    def invalid_apply(r):r['diff']=r['diff'].replace('schema work','nonexistent original source text')
    probe('diff cannot apply to pinned author blob',patch,invalid_apply,'git-apply')
    probe('protected root projection hand patch',plain,lambda r:r.update(diff='--- a/README.md\n+++ b/README.md\n@@ -1 +1 @@\n-x\n+y\n'),'projection-source')
    def split_unit(r):
        e=pe(r);e['sourceSpans'].append(copy.deepcopy(e['sourceSpans'][0]))
    probe('partial or duplicated physical link spans',patch,split_unit,'complete-unit')
    def overlap(r):
        es=[e for e in r['edges'] if e['disposition']=='patch'];es[1]['sourceSpans']=copy.deepcopy(es[0]['sourceSpans']);es[1]['sourceSpans'][0]['columnStart']+=1
    probe('overlapping distinct replacements',patch,overlap,'overlap')
    manifest=m.manifest_view(rs,a.author_commit)
    bad=copy.deepcopy(manifest);bad['files'][0]['diffSha256']='0'*64;assert 'files' in m.verify_manifest(rs,a.author_commit,bad)
    checks.append({'surfaceClass':3,'probe':'frozen record manifest diff hash mutation','expectedCheck':'manifest-freeze','rejected':True})
    bad=copy.deepcopy(manifest);bad['sets'][1]['selected']=[];assert 'sets' in m.verify_manifest(rs,a.author_commit,bad)
    checks.append({'surfaceClass':3,'probe':'seeded selected membership mutation','expectedCheck':'manifest-freeze','rejected':True})
    missing=rs[:-1];assert any(f['check']=='file-coverage' for f in c.all(missing)['failures']);checks.append({'probe':'missing complete file record','expectedCheck':'file-coverage','rejected':True,'surfaceClass':3})
    wrong=copy.deepcopy(rs);wrong[0]['reviewSet']='batch-999';assert any(f['check']=='set-membership' for f in c.all(wrong)['failures']);checks.append({'probe':'cross-owner batch membership','expectedCheck':'set-membership','rejected':True,'surfaceClass':3})
    # Complete synthetic records bound to in-memory source blobs. No fixture is written to the repo.
    def fixture(old,target='docs/platform/work-state/spec.md',prefix='# Probe\n\n',suffix='\n'):
        f='docs/pilot-probe-consumer.md';before=prefix+old+suffix;line=len(prefix.splitlines())+1
        inv={'edgeId':'maps-j-probe','consumerPath':f,'matchedExpression':old,'physicalSpans':[{'line':line,'columnStart':1,'columnEndExclusive':len(old)+1,'text':old}],'locatorTokens':[]}
        replacement=m.form(old,f,target,None);after=prefix+replacement+suffix;diff=m.make_diff(f,before,after)
        e={'edgeId':inv['edgeId'],'sourceSpans':inv['physicalSpans'],'matchedExpression':old,'disposition':'patch','diffHunk':m.hunks(diff)[0].splitlines()[0],'reason':'L12-26(7) complete fixture citation','target':target,'anchor':None,'timing':'Phase 9','blockedReason':None,'dependency':None}
        r={'file':f,'inventoryInputCommit':m.INVENTORY,'authorInputCommit':a.author_commit,'inventoryFileDigest':m.sha(before),'digest':m.sha(before),'inventoryEdgeIds':[e['edgeId']],'diff':diff,'edges':[e],'reviewSet':'batch-probe','authoringRules':['L12-26'],
        'checks':{'coverage':{'writerTrace':{e['edgeId']:'read-only citation; no writer/default-root/schema/identity change'}},'anchors':{e['edgeId']:{'targetCommit':a.author_commit,'targetDigest':m.sha(m.blob(a.author_commit,target))}},'relativeResolution':{e['edgeId']:{'replacement':replacement,'resolvedTarget':target,'targetCommit':a.author_commit,'authorityStatus':'cutover-patch-only'}},'labelForm':{}}}
        if target in c.dirs:r['checks']['anchors'][e['edgeId']]={'targetCommit':a.author_commit,'targetTreeOid':m.git('rev-parse',a.author_commit+':'+target).decode().strip()}
        original_blob=m.blob
        def fake_blob(commit,path):return before.encode() if path==f else original_blob(commit,path)
        return r,inv,fake_blob
    for name,old,target,wrong in [
        ('image marker','![old.md](./old.md)','docs/platform/work-state/spec.md','[spec.md](./platform/work-state/spec.md)'),
        ('backticks','[`old.md`](./old.md)','docs/platform/work-state/spec.md','[spec.md](./platform/work-state/spec.md)'),
        ('basename label','[old.md](./old.md)','docs/platform/work-state/spec.md','[old.md](./platform/work-state/spec.md)'),
        ('directory slash','repo/docs/architect/','docs/platform/host-invocation-routing','repo/docs/platform/host-invocation-routing'),
        ('repo prefix','repo/docs/specs/work-state.md','docs/platform/work-state/spec.md','docs/platform/work-state/spec.md')]:

        r,inv,fake_blob=fixture(old,target);c.entries[inv['edgeId']]=inv;c.files[r['file']]={'sha256':r['digest'],'edgeIds':[inv['edgeId']]}
        with mock_patch.object(m,'blob',side_effect=fake_blob):
            assert c.check_record(r)==[],name
            probe('record form '+name,r,lambda rr:rr['checks']['relativeResolution'][inv['edgeId']].update(replacement=wrong),'label-form')
    # Source carriage and duplicate Related list are deliberately wrong complete records.
    for title in ['Literal Snapshot','Retained Distribution Source Detail','Added in candidate: X source carriage','Historical source section abc']:
        r,inv,fake_blob=fixture('docs/specs/work-state.md',prefix='# Probe\n## '+title+'\n');c.entries[inv['edgeId']]=inv;c.files[r['file']]={'sha256':r['digest'],'edgeIds':[inv['edgeId']]}
        with mock_patch.object(m,'blob',side_effect=fake_blob):
            fail=c.check_record(r);assert any(x['check']=='source-region' for x in fail)
        checks.append({'surfaceClass':3,'probe':'wrong record in source carriage '+title,'expectedCheck':'source-region','rejected':True})
    r,inv,fake_blob=fixture('docs/specs/work-state.md',prefix='# Probe\nRelated:\n- docs/platform/work-state/spec.md\n');c.entries[inv['edgeId']]=inv;c.files[r['file']]={'sha256':r['digest'],'edgeIds':[inv['edgeId']]}
    with mock_patch.object(m,'blob',side_effect=fake_blob):
        assert any(x['check']=='related-duplicate' for x in c.check_record(r))
    checks.append({'surfaceClass':3,'probe':'wrong record duplicates a Related sibling','expectedCheck':'related-duplicate','rejected':True})
    assert m.form('repo/docs/architect/','docs/consumer.md','docs/platform/host-invocation-routing',None)=='repo/docs/platform/host-invocation-routing/'
    assert not m.history_at('# Added in candidate: Runner Business Rules\n## Business Rules\nRUL65b\n',3)
    assert not m.history_at('# Live\nImplementation: Carriage only\nCanonical: No\n## Current\nbody\n',5)
    return {'authorCommit':a.author_commit,'positiveRecords':len(rs),'positiveEdges':baseline['edges'],'negativeProbes':len(checks),'allRejected':True,'probes':checks,'limits':'Semantic content/authority decisions require the independent full-file reviewer. Form/region synthetic witnesses use the same helper functions; record-level mutations use the complete real pilot records.'}
if __name__=='__main__':print(json.dumps(main(),ensure_ascii=False,indent=2))
