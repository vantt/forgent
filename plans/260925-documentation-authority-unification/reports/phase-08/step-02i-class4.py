#!/usr/bin/env python3
"""Class-4 initial static census; same committed-tree lexer, no consumer writes.
No runtime tracing, adoption proof, complete class-4 coverage or acceptance claim.
Usage: python3 step-02i-class4.py > /tmp/fgos-work/step-02i-class4.json
"""
import sys
sys.dont_write_bytecode=True
import collections,importlib.util,json,re
from pathlib import Path
R=Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('class4_parser',R/'step-02i-parser.py')
p=importlib.util.module_from_spec(s);s.loader.exec_module(p)
def build():
    seed={x['path']:x['category'] for x in p.load('consumer-inventory.json')['consumerFiles']}
    prior=p.load('step-02i-census-maps-portals-prose.json')['entries']
    priorby=collections.defaultdict(list)
    for e in prior:priorby[e['normalizedReference']].append(e)
    selected=sorted(path for path,item in p.TREE.items() if item['kind']=='blob' and (seed.get(path) in ('generators-and-checks','generated-render') or path.startswith('src/report/') or path.startswith('scripts/') and re.search(r'(?:^|/)(?:check-|generate-|doc-link|backfill-|propose-doc|next-doc)',path)))
    files=[];rows=[];excluded=[];dynamic=[]
    for path in selected:
        raw=p.read(path)
        try:text=raw.decode()
        except UnicodeDecodeError:raise AssertionError('Non-text class-4 candidate: '+path)
        us,ex=p.units(path,text)
        for x in ex:excluded.append({'consumerPath':path,**x})
        ids=[]
        for u in us:
            for ref in u['references']:
                ident=f'generator-i-{len(rows)+1:05}';ids.append(ident)
                base=re.sub(r':\d+(?:-\d+)?$','',ref.split('#')[0])
                known=priorby[ref]
                targets=sorted({e['desiredOwner'] for e in known if e['desiredOwner']})
                rows.append({**u,'edgeId':ident,'consumerPath':path,'fileDigest':p.sha(raw),'normalizedReference':ref,'legacyExistsInInputTree':p.exists(base),'sourceVsRender':'projection' if seed.get(path)=='generated-render' else 'generator/checker source','role':'generator/checker','cutoverAction':'preserve-pending-behavioral-proof','cutoverPatch':None,'mappingLookupOnly':targets,'class3MappingRows':[e['edgeId'] for e in known],'rule':'Step 5 must trace actual reader/writer/default/renderer and change source and projection together; class-3 navigation proposals never authorize code-string substitution'})
        captured={span['line'] for u in us+ex for span in u['physicalSpans']}
        for line,source in enumerate(text.splitlines(),1):
            if line not in captured and re.search(r'(?:docs|specs|architect|contracts|reading.map)',source,re.I) and re.search(r'path\.(?:join|resolve)|new URL|\b(?:root|dir|path|glob|default)\b|["\']docs["\']',source,re.I):
                dynamic.append({'consumerPath':path,'line':line,'text':source[:700],'status':'unresolved expression/scan scope; static cue only; Step 5 actual code path and adoption trace required'})
        files.append({'path':path,'sha256':p.sha(raw),'bytes':len(raw),'seedCategory':seed.get(path),'edgeIds':ids})
    return {'inputHEAD':p.INPUT_COMMIT,'status':'STARTED: initial static class-4 census only; class 4 and Step 2 OPEN; stop before class 5','selection':'git ls-tree blobs: seed generators-and-checks/generated-render, src/report/**, scripts check/generate/doc-link/backfill/propose-doc/next-doc; explicit conservative initial boundary, not complete dynamic generator ownership proof','parser':'step-02i-parser.py units/normalization/code exclusion and committed-tree existence; known owner candidates reused lookup-only from class 3','files':files,'entries':rows,'excludedCodeUnits':excluded,'unresolvedExpressionCues':dynamic,'counts':{'files':len(files),'edges':len(rows),'codeExclusions':len(excluded),'unresolvedExpressionCues':len(dynamic)},'limits':'No class-4 A50 packet yet; full generator/input/output ownership, split expressions, native extraction/adoption and installed-coordinate runtime proof remain open. Baselines, checkers, vocabulary, extractor, comparator, tests and consumers unchanged.'}
if __name__=='__main__':print(json.dumps(build(),ensure_ascii=False,sort_keys=True))
