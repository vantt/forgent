#!/usr/bin/env python3
"""Last N commits that ADD a .md file (excluding instruction/skill render targets & upstreams/archive moves): per-file placement + name conformance.
placement ok  = plans/<YYMMDD-HHmm-slug>/..., plans/reports/<file>, plans/journals/<file>, docs/{platform,knowledge,explanation,how-to,reference,tutorials,templates,generated,user,specs} 
name ok       = reports: {type}-YYMMDD-HHmm-slug[-report].md ; plan files: plan.md|phase-NN-*.md|reports/* ; journals: YYYY-MM-DD-slug.md ; docs: kebab-case, no date
"""
import re,collections,sys
from lib_git import *
N=int(sys.argv[1]) if len(sys.argv)>1 else 200
SKIP=('.claude/','.agents/','plugins/','core/','domains/','upstreams/','archive/','apps/','dogfood-fixture/','components/')
commits=collections.OrderedDict()
for d,h,s,p in added_md():
    if p.startswith(SKIP) or '/' not in p: continue
    commits.setdefault(h,[d,s,[]])[2].append(p)
sel=list(commits.items())[:N]
GOVDOCS=('docs/platform/','docs/knowledge/','docs/explanation/','docs/how-to/','docs/reference/','docs/tutorials/','docs/templates/','docs/generated/','docs/user/','docs/specs/')
ANY=re.compile(r'^[a-z0-9][a-z0-9-]*-\d{6}-\d{4}-[a-z0-9.-]+\.md$')
tot=collections.Counter(); bad=[]
files=0
for h,(d,s,ps) in sel:
    for p in ps:
        files+=1; n=p.split('/')[-1]; place=name=None
        if p.startswith('plans/reports/'):
            place=True; name=bool(ANY.match(n)) if p.count('/')==2 else True
        elif p.startswith('plans/journals/'): place=True; name=bool(re.match(r'^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$',n))
        elif p.startswith('plans/'):
            place=bool(re.match(r'^plans/\d{6}-\d{4}-[a-z0-9-]+/',p)); name=bool(re.match(r'^(plan|phase-\d\d-[a-z0-9-]+)\.md$',n) or '/reports/' in p)
        elif p.startswith(GOVDOCS): place=True; name=bool(re.match(r'^[a-z0-9][a-z0-9._-]*\.md$',n)) and not re.search(r'\d{6}',n)
        elif p.startswith('docs/history/'): place=False; name=True   # history = archive root per governance
        else: place=False; name=False
        tot[(place,name)]+=1
        if not (place and name): bad.append(p)
ok=tot[(True,True)]
print(f'last {len(sel)} md-adding commits ({sel[-1][1][0][:10]} .. {sel[0][1][0][:10]}), {files} files')
print(f'  placement+name conforming: {ok}/{files} = {100*ok/files:.0f}%')
print(f'  placement ok, name drift : {tot[(True,False)]}   | placement drift: {tot[(False,True)]+tot[(False,False)]}')
# commit-level
cok=sum(all(((p.startswith('plans/reports/') and (bool(ANY.match(p.split('/')[-1])) or p.count('/')>2)) or (not p.startswith('plans/reports/')))  for p in ps) for h,(d,s,ps) in sel)
print('  commits whose every added plans/reports file is documented-name:',cok,'/',len(sel))
m=collections.defaultdict(lambda:[0,0])
for h,(d,s,ps) in sel:
    for p in ps:
        n=p.split('/')[-1]
        if p.startswith('plans/reports/') and p.count('/')==2: m[d[:7]][1]+=1; m[d[:7]][0]+=bool(ANY.match(n))
print('  plans/reports/<file> in window by month:',{k:f'{a}/{b}' for k,(a,b) in sorted(m.items())})
print('  sample nonconforming:'); [print('    ',x) for x in bad[:12]]
