#!/usr/bin/env python3
"""Rebuild every inventory byte from --input-commit; read-only, any cwd.
Usage: env -u CLAUDE_CODE_SESSION_ID python3 /absolute/.../step-02l-replay.py --input-commit SHA
--review-view streams a <=400KB review payload. No generated artifacts are written.
"""
import sys
sys.dont_write_bytecode=True
import collections,copy,hashlib,importlib.util,json,math,re,subprocess
from pathlib import Path
R=Path(__file__).resolve().parent

def module(name):
    s=importlib.util.spec_from_file_location(name,R/(name+'.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
m=module('step-02l-inventory');p=m.p
SEED='A51-step02l-recheck-20261019-escaped-73c8'
def enc(x):return (json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n').encode()
def sha(b):return hashlib.sha256(b).hexdigest()
def load(n):return json.loads((R/n).read_bytes())
def samples(d):return sorted(d['entries'],key=lambda e:(sha((SEED+'\0'+e['edgeId']).encode()),e['edgeId']))[:10]

def grep_audit(data):
    # Independent grep grammar, not TOKEN/units or dynamic detection patterns.
    # Scan every selected committed blob, including files with no emitted edges.
    pattern=re.compile(r"docs\\*/(?:specs|architect|ui-spec|contracts|history|how-to|explanation|decisions|reference|tutorials|distillery)(?=\\*/|[\s`\"'<>|)\],;.$]|$)|docs\\*/\(\?:architect\|platform\)|docs\\*/(?:README|architecture-map|architecture-manifest|backlog|coexistence|distribution-vision|doc-governance|doc-registry|id-systems-audit|io-contract|operator-runbook-herdr-cockpit|platform-foundations|reading-map|routing-handoff-contract|work-item-lifecycle-vision)|path\.join\(\s*['\"]docs['\"]")
    report={};all_missing=[]
    for k,d in data.items():
        covered=collections.defaultdict(set)
        for e in d['entries']:
            covered[e['consumerPath']].update(s['line'] for s in e['physicalSpans'])
        for e in d['dynamicConstructions']:
            for site in e['callSites']:covered[e['consumerPath']].update(range(site[0],site[2]+1))
        count=0;missing=[]
        for path,item in sorted(p.TREE.items()):
            if item['kind']!='blob' or m.surface(path)!=k:continue
            try:text=p.read(path).decode()
            except UnicodeDecodeError:continue
            if '\0' in text:continue
            for n,line in enumerate(text.splitlines(),1):
                if pattern.search(line):
                    count+=1
                    if n not in covered[path]:missing.append({'consumerPath':path,'line':n,'text':line[:300]})
        report[k]={'matchingLines':count,'uncoveredLines':missing};all_missing.extend(missing)
    return report

def delta(d):
    old=load('step-02i-class4-initial-census.json')
    oldby=collections.Counter(e['consumerPath'] for e in old['entries']);newby=collections.Counter(e['consumerPath'] for e in d['entries'])
    paths=sorted(set(oldby)|set(newby));changes=[]
    for path in paths:
        if oldby[path]!=newby[path]:changes.append({'path':path,'before':oldby[path],'after':newby[path],'delta':newby[path]-oldby[path],'reason':'expanded class-4 population' if path not in oldby else 'new 02j lexer/root coverage and current committed source; no semantic patch filtering'})
    old_files={x['path']:x for x in old['files']};new_files={x['path']:x for x in d['files']}
    return {'initialCounts':old['counts'],'currentCounts':d['counts'],'edgeDelta':d['counts']['edges']-old['counts']['edges'],'edgeDeltaReconciled':sum(x['delta'] for x in changes),'addedFiles':sorted(set(new_files)-set(old_files)),'removedFiles':sorted(set(old_files)-set(new_files)),'changedInitialFileDigests':[path for path in sorted(set(new_files)&set(old_files)) if new_files[path]['sha256']!=old_files[path]['sha256']],'perFileEdgeDeltas':changes,'explanation':'Initial class4 was a conservative 53-file seed, not complete. Keep those files, expand all generated skill projections/scripts/report generators and known generated indexes/UI-spec tools; use the copied 02j lexer (additional retired roots, wrapped comments) and explicit split-path constructions. File totals include zero-edge dynamic-only files. Source bytes are pinned to current commit; no consumer edits.'}

def main():
    data=m.build();errors=[];hashes={}
    account=module('step-02l-accounting')
    supplemental={'step-02l-reconciliation.json':account.reconcile(data),'step-02l-exclusions.json':account.exclusions()}
    historical=json.loads(subprocess.check_output([sys.executable,str(R/'step-02l-accounting.py'),'--input-commit','1a0f61ac5','--class3']))
    if historical['escapedLiteralEdgesAbsent']:supplemental['step-02l-class3-addendum.json']=historical
    for name,value in supplemental.items():
        raw=(R/name).read_bytes();hashes[name]=sha(raw)
        if enc(value)!=raw:errors.append(name+': byte replay mismatch')
    for k,d in data.items():
        name=f'step-02l-census-class{k}.json';raw=(R/name).read_bytes();hashes[name]=sha(raw)
        if enc(d)!=raw:errors.append(name+': complete byte replay mismatch')
        for f in d['files']:
            if sha(p.read(f['path']))!=f['sha256']:errors.append(f['path']+': file digest')
        for e in d['entries']:
            ls=p.read(e['consumerPath']).decode().splitlines()
            if sha(p.read(e['consumerPath']))!=e['fileDigest']:errors.append(e['edgeId']+': digest')
            for s in e['physicalSpans']:
                if ls[s['line']-1][s['columnStart']-1:s['columnEndExclusive']-1]!=s['text']:errors.append(e['edgeId']+': span')
            x=e['existenceAtInputCommit']
            if x['checkedPathExists']!=p.exists(x['checkedPath']):errors.append(e['edgeId']+': existence')
    probes=None if '--review-view' in sys.argv else module('step-02l-probes').run(m)
    required={4:{'scripts/doc-link-pass.mjs':[10],'scripts/propose-doc-decisions.mjs':[172],'scripts/check-doc-inventory-gates.mjs':[1010]},5:{'test/docs/decisions-corpus-retired.test.mjs':[87,94],'test/runner/assignment.test.mjs':[150],'test/runner/dispatch.test.mjs':[230,280],'test/runner/worktree.test.mjs':[768],'test/scripts/check-doc-constitution.test.mjs':[660],'test/scripts/knowledge-migration.test.mjs':[155],'test/state/knowledge-bootstrap.test.mjs':[115,296]},6:{'src/runner/merge.mjs':[409]}}
    for k,paths in required.items():
        for path,lines in paths.items():
            for n in lines:
                if not any(e['consumerPath']==path and e['syntax']=='escaped-root-literal' and any(s['line']==n for s in e['physicalSpans']) for e in data[k]['entries']):errors.append(f'{path}:{n}: required escaped edge missing')
    audit=grep_audit(data)
    for k,v in audit.items():
        if v['uncoveredLines']:errors.append(f'class{k}: independent grep has uncovered lines')
    review={'inputCommit':p.INPUT_COMMIT,'seed':SEED,'sampleRule':'10 edges per class, hash(seed NUL edgeId), ascending; tie edgeId','counts':{k:d['counts'] for k,d in data.items()},'samples':{k:samples(d) for k,d in data.items()},'independentGrep':audit,'class4Delta':delta(data[4]),'reconciliation':supplemental['step-02l-reconciliation.json'],'exclusions':supplemental['step-02l-exclusions.json'],'class3EscapedCheck':{k:v for k,v in historical.items() if k!='entries'},'limits':'Classes/roles advisory; all dynamic constructions untraced. Inventory only. Generic indirect path sites retained conservatively, including no-docs-cue records. No external/ignored/state coverage or runtime proof.'}
    if '--review-view' in sys.argv:
        raw=enc(review);assert len(raw)<=400000,len(raw);print(raw.decode(),end='');return bool(errors)
    negative=[]
    for k,d in data.items():
        for field,value in [('fileDigest','0'*64),('legacyTarget','docs/specs/DELIBERATELY-WRONG.md'),('coarseClass',99)]:
            changed=copy.deepcopy(d['entries'][0]);changed[field]=value
            rejected=enc(changed)!=enc(d['entries'][0])
            assert rejected;negative.append({'surfaceClass':k,'field':field,'wrongRecordRejectedByFullReplay':rejected})
    receipt={'status':'FAIL' if errors else 'PASS','inputCommit':p.INPUT_COMMIT,'outputSha256':hashes,'counts':review['counts'],'independentGrep':audit,'class4Delta':review['class4Delta'],'probes':probes,'class3EscapedCheck':review['class3EscapedCheck'],'reconciliationSha256':hashes['step-02l-reconciliation.json'],'exclusionsSha256':hashes['step-02l-exclusions.json'],'negativeRecordProbes':negative,'reviewViewSha256':sha(enc(review)),'reviewViewBytes':len(enc(review)),'failures':errors,'limits':review['limits']}
    print(enc(receipt).decode(),end='');return bool(errors)
if __name__=='__main__':sys.exit(main())
