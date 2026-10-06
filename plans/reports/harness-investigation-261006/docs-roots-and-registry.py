#!/usr/bin/env python3
"""docs/ roots: tracked count, in governance placement map?, in docs/README? ; registry coverage (docs/doc-registry.json) vs disk."""
import json,os,collections,re
from lib_git import *
R='/home/vantt/projects/forgentX/'
fs=tracked_md()
gov=open(R+'docs/doc-governance.md').read()
placement=gov.split('## 2. Placement Map')[1].split('## 3.')[0]
readme=open(R+'docs/README.md').read()
rm=open(R+'docs/reading-map.md').read()+open(R+'docs/specs/reading-map.md').read()
roots=collections.Counter(p.split('/')[1] for p in fs if p.startswith('docs/') and p.count('/')>1)
print(f"{'docs root':16}{'md':>6}  in-gov-placement  in-docs/README  in-reading-maps")
for r,n in roots.most_common():
    a=bool(re.search(r'(^|\s)'+r+'/',placement)); b=(('docs/'+r) in readme) or ((r+'/') in readme); c=('docs/'+r+'/') in rm
    print(f"{r:16}{n:6}  {str(a):16}  {str(b):14}  {str(c):5}")
reg=json.load(open(R+'docs/doc-registry.json'))
paths=[d['currentPath'] for d in reg['docs']]
print('\nregistry docs:',len(paths),'| currentPath exists on disk:',sum(os.path.exists(R+p) for p in paths))
cov=collections.Counter(p.split('/')[1] for p in paths); print('registry covers roots:',dict(cov))
ent=[p for p in fs if p.startswith(('docs/how-to/','docs/explanation/','docs/reference/','docs/tutorials/','docs/knowledge/'))]
inreg=set(paths)|{a for d in reg['docs'] for a in d.get('aliases',[])}
print('end-user+knowledge md on disk:',len(ent),'| in registry (path or alias):',sum(p in inreg for p in ent))
print('files under docs/specs, plans/, docs/platform, docs/architect covered by registry: 0 by design (registry = end-user knowledge only)')
