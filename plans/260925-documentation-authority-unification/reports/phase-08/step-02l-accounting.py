#!/usr/bin/env python3
"""Read-only accounting and historic escaped-literal check; stdout only."""
import sys
sys.dont_write_bytecode=True
import collections,importlib.util,json,re
from pathlib import Path
R=Path(__file__).resolve().parent
def module(name):
    s=importlib.util.spec_from_file_location(name,R/(name+'.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
m=module('step-02l-inventory');p=m.p
def enc(x):return (json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n').encode()
def key(e):return (e['consumerPath'],json.dumps(e['physicalSpans'],sort_keys=True),e['legacyTarget'])
def reconcile(data):
    result={}
    for k,d in data.items():
        old=p.load(f'step-02k-census-class{k}.json');before={key(e):e for e in old['entries']};after={key(e):e for e in d['entries']}
        added=[e for e in d['entries'] if key(e) not in before];removed=[e for e in old['entries'] if key(e) not in after]
        causes=collections.Counter('gitignore-config-consumer' if e['consumerPath']=='.gitignore' else 'escaped-root-literal' for e in added)
        flags=[]
        for e in d['entries']:
            prev=before.get(key(e))
            if prev and prev['carriageHistoryFlags']!=e['carriageHistoryFlags']:
                flags.append({'consumerPath':e['consumerPath'],'physicalSpans':e['physicalSpans'],'before':prev['carriageHistoryFlags'],'after':e['carriageHistoryFlags']})
        oldfiles={x['path'] for x in old['files']};newfiles={x['path'] for x in d['files']}
        result[k]={'before':old['counts'],'after':d['counts'],'addedEdges':len(added),'removedEdges':len(removed),'edgeDelta':len(after)-len(before),'perCause':dict(causes),'reconciled':sum(causes.values())-len(removed)==len(after)-len(before),'addedEdgeIds':[x['edgeId'] for x in added],'addedFiles':sorted(newfiles-oldfiles),'removedFiles':sorted(oldfiles-newfiles),'flagChanges':flags,'historyHeadingBefore':sum(x['carriageHistoryFlags']['historyHeading'] for x in old['entries']),'historyHeadingAfter':sum(x['carriageHistoryFlags']['historyHeading'] for x in d['entries']),'carriageRegionBefore':sum(x['carriageHistoryFlags']['carriageRegion'] for x in old['entries']),'carriageRegionAfter':sum(x['carriageHistoryFlags']['carriageRegion'] for x in d['entries'])}
        assert not removed
        assert result[k]['reconciled']
    return {'inputCommit':p.INPUT_COMMIT,'classes':result,'dynamicRuling':{'consumerPath':'scripts/generate-shipped-path-inventory.mjs','line':41,'constructionKind':'config/default-root','before':0,'after':1,'inventory':'class 4 dynamicConstructions; no static target invented'}}
def exclusions():
    files=[]
    # Review's 13 non-Markdown archived files; prose history remains earlier classes.
    for path,item in sorted(p.TREE.items()):
        if item['kind']!='blob' or not path.startswith('archive/plans/') or path.endswith('.md'):continue
        if re.search(r'(?:^|/)(?:secrets?[^/]*|[^/]*\.env)(?:$|\.)',path,re.I):continue
        raw=p.read(path)
        try:text=raw.decode()
        except UnicodeDecodeError:continue
        if re.search(r'docs\\*/(?:specs|architect|ui-spec|contracts|history|how-to|explanation|decisions|reference|tutorials|distillery)(?=\\*/|[\s`\"\'<>|)\],;.$]|$)',text):
            files.append({'path':path,'sha256':p.sha(raw),'bytes':len(raw),'reason':'archived plan history; excluded from behavioral classes 4–6','surfaceClass':m.surface(path)})
    assert len(files)==13,len(files)
    return {'inputCommit':p.INPUT_COMMIT,'policy':'archive/plans/** is archived plan history, excluded from classes 4–6; explicit non-Markdown root-hit population listed','count':len(files),'files':files}
def class3():
    assert p.INPUT_COMMIT=='1a0f61ac53433292e08fb378ebbb6c1c72fd3b74'
    old=p.load('step-02j-census-maps-portals-prose.json');oldkeys={key({**e,'legacyTarget':e['normalizedReference']}) for e in old['entries']};entries=[];hits=0
    for f in old['files']:
        path=f['path'];raw=p.read(path);assert p.sha(raw)==f['sha256'],path
        text=raw.decode();units=p.escaped_units(path,text);hits+=sum(len(u['references']) for u in units)
        if not units:continue
        rows,_=m.extract(path,text,3,p.sha(raw))
        for e in rows:
            if e['syntax']=='escaped-root-literal' and key(e) not in oldkeys:
                e['edgeId']=f'class3-l-addendum-{len(entries)+1:06}';entries.append(e)
    return {'inputCommit':p.INPUT_COMMIT,'sourceInventory':'step-02j-census-maps-portals-prose.json','sourceInventorySha256':p.sha((R/'step-02j-census-maps-portals-prose.json').read_bytes()),'populationFiles':len(old['files']),'escapedLiteralEdgesFound':hits,'escapedLiteralEdgesAbsent':len(entries),'acceptance':'A51 mechanical addendum only; step-02j unchanged; no semantic patch approval','entries':entries}
if __name__=='__main__':
    value=class3() if '--class3' in sys.argv else exclusions() if '--exclusions' in sys.argv else reconcile(m.build())
    print(enc(value).decode(),end='')
