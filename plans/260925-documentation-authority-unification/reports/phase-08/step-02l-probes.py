#!/usr/bin/env python3
"""Retain all 02j/02i regression probes; labelled differential inventory rules."""
import sys
sys.dont_write_bytecode=True
import copy,json
from pathlib import Path
R=Path(__file__).resolve().parent
import importlib.util

def module(name):
    s=importlib.util.spec_from_file_location(name,R/(name+'.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def inventory_probes(m):
    records=[]
    def differential(name,klass,good,bad,check):
        assert check(good),name+' correct construction failed'
        assert not check(bad),name+' deliberately wrong construction accepted'
        records.append({'name':name,'surfaceClass':klass,'correctPassed':True,'wrongConstructionRejected':True})
    for klass,path,bad in [(4,'src/report/example.mjs','src/runtime/example.mjs'),(5,'test/fixtures/example.mjs','src/runtime/example.mjs'),(6,'apps/fgos-gateway/src/gateway.rs','test/fixtures/example.rs')]:
        differential('surface-selection-'+str(klass),klass,path,bad,lambda p:m.surface(p)==klass)
        src="const p = path.join('docs', 'specs', 'runner.md');"
        rows,_=m.extract(path,src,klass,'0'*64)
        wrong=copy.deepcopy(rows);wrong[0]['legacyTarget']='docs/specs/wrong.md'
        differential('committed-source-binding-'+str(klass),klass,rows,wrong,lambda x:x==m.extract(path,src,klass,'0'*64)[0])
    for klass,path,src,ref in [(4,'scripts/generate-example.mjs',"writeFile('docs/architect/map.md', data)",'docs/architect/map.md'),(5,'test/example.test.mjs',"assert.equal(value, 'docs/specs/runner.md')",'docs/specs/runner.md'),(6,'src/setup/example.mjs',"const root = path.join('docs', 'specs');",'docs/specs')]:
        good=m.extract(path,src,klass,'0'*64)[0];bad=m.extract(path,src.replace('docs','other'),klass,'0'*64)[0]
        differential('literal-or-split-rule-'+str(klass),klass,good,bad,lambda rows:any(x['legacyTarget']==ref for x in rows))
    for name,source in [('multiline-path-join',"const p=path.join(\n'docs',\n'specs', name);"),('template-string','const p=`docs/specs/${name}.md`;'),('config-root','const docsRoot=config.documentationRoot;'),('indirect-writer','writeFile(path.join(root, name), bytes);')]:
        differential(name,6,m.dynamic_units('src/a.mjs',source),[],lambda rows:bool(rows))
    differential('explicit-carriage-boundary',4,m.extract('.agents/skills/example.md','# Literal Snapshot\n`docs/specs/runner.md`\n# Live\n`docs/specs/runner.md`',4,'0'*64)[0],[],lambda rows:len(rows)==2 and rows[0]['carriageHistoryFlags']['carriageRegion'] and not rows[1]['carriageHistoryFlags']['carriageRegion'])
    for klass,path,expected in [(4,'docs/doc-registry.json',4),(4,'.claude/skills/ui-spec/tools/config.mjs',4),(6,'docs/contracts/fgos-gateway-api-v1.yaml',6),(5,'docs/platform/a/verification/proof/test.log',None)]:
        differential('projection-runtime-payload-boundary-'+path,klass,path,'src/a.mjs' if expected!=6 else 'test/a.test.mjs',lambda path:m.surface(path)==expected)
    for klass,path,src,target in [(4,'scripts/a.mjs',"const root='docs/how-to';",'docs/how-to'),(6,'src/a.mjs',"const root='docs/doc-registry.json';",'docs/doc-registry.json'),(6,'src/a.mjs',"usage('--root ./docs/ui-spec');",'docs/ui-spec'),(6,'src/a.mjs',"read('/external/project/docs/specs/runner.md');",'docs/specs/runner.md')]:
        good=m.extract(path,src,klass,'0'*64)[0];bad=m.extract(path,src.replace('docs','elsewhere'),klass,'0'*64)[0]
        differential('behavioral-root-literal-'+target,klass,good,bad,lambda rows:any(x['legacyTarget']==target for x in rows))
    for src,target in [("startsWith('docs/doc-registry')",'docs/doc-registry'),('// docs/backlog.md+docs/specs/','docs/specs/')]:
        good=m.extract('scripts/a.mjs',src,4,'0'*64)[0];bad=m.extract('scripts/a.mjs',src.replace('docs','elsewhere'),4,'0'*64)[0]
        differential('prefix-and-compound-'+target,4,good,bad,lambda rows:any(x['legacyTarget']==target for x in rows))
    for src in (r'/docs\/decisions\//',r'/hello\ndocs\/history\/x\.md/',r'"docs\\/architect\\/x.md"',r'/docs\/architecture-manifest\.json/'):
        differential('escaped-delimiter-'+src,6,m.extract('src/a.mjs',src,6,'0'*64)[0],[],lambda rows:bool(rows))
    old=module('step-02k-inventory')
    escaped=r"const re=/^docs\/decisions\//;"
    assert not old.extract('src/a.mjs',escaped,6,'0'*64)[0], '02k unexpectedly passes witness'
    differential('escaped-literal-fails-02k-passes-02l',6,m.extract('src/a.mjs',escaped,6,'0'*64)[0],old.extract('src/a.mjs',escaped,6,'0'*64)[0],lambda rows:any(x['legacyTarget']=='docs/decisions/' for x in rows))
    for ref in ['docs/'+root+'/x.md' for root in m.p.LEGACY_ROOTS]+sorted(m.p.ROOTFILES):
        for depth in (1,2,3):
            raw=ref.replace('/', '\\'*depth+'/')
            got=m.p.escaped_units('src/a.mjs',raw)
            differential('escaped-authority-'+str(depth)+'-'+ref,6,got,[],lambda rows:any(ref in x['references'] for x in rows))
    for path in ('src/a.sh','Cargo.toml'):
        rows=m.extract(path,'# history\n# docs/specs/runner.md',6,'0'*64)[0]
        differential('comment-is-not-markdown-'+path,6,rows,[],lambda rows:bool(rows) and not any(x['carriageHistoryFlags']['historyHeading'] for x in rows))
    differential('bare-docs-default-root',4,m.dynamic_units('scripts/generate-shipped-path-inventory.mjs',"const ALLOWED_ROOTS=[\n'docs',\n];"),[],lambda rows:any(x['matchedExpression']=="'docs'" for x in rows))
    differential('gitignore-config-consumer',6,'.gitignore','README.md',lambda path:m.surface(path)==6)
    differential('archived-plan-history-excluded',6,'archive/plans/a.json','src/a.mjs',lambda path:m.surface(path) is None)
    return records

def run(m):
    # Keep the earlier probes intact at their original frozen checkpoints.
    inherited=module('step-02j-probes').run(json.loads((R/'step-02j-census-maps-portals-prose.json').read_text()))
    for row in inherited.get('regressionProbes',[]):
        row['defectClass']=row['class'];row['surfaceClass']=3
    # The older nested receipt has no reliable surface/defect labels; name the gap.
    return {'status':'PASS','inherited':inherited,'inheritedLabelPolicy':'02j current probes carry original defectClass and surfaceClass 3; 192 older probes retained verbatim at immutable 02i, class label unspecified','inventoryRuleProbes':inventory_probes(m)}
if __name__=='__main__':print(json.dumps(run(module('step-02l-inventory')),ensure_ascii=False,sort_keys=True,separators=(',',':')))
