#!/usr/bin/env python3
"""Count tracked .md files by top-level / second-level dir, and list .md outside plans/ and docs/."""
import collections,os
from lib_git import *
fs=tracked_md()
print('tracked md:',len(fs))
c=collections.Counter(); c2=collections.Counter()
for p in fs:
    parts=p.split('/'); c[parts[0] if len(parts)>1 else '<root>']+=1
    if parts[0] in('docs','plans','archive') and len(parts)>2: c2['/'.join(parts[:2])]+=1
for k,v in c.most_common(): print(f'{v:6} {k}')
print('--- second level docs/plans/archive')
for k,v in c2.most_common(40): print(f'{v:6} {k}')
# outside plans/docs, excluding skills/plugin render surfaces & vendored
ex=('plans/','docs/','upstreams/','node_modules/','archive/')
out=[p for p in fs if not p.startswith(ex)]
cat=collections.Counter()
for p in out:
    base=os.path.basename(p)
    k='SKILL/skill-refs' if '/skills/' in p else 'agent defs' if '/agents/' in p else 'domains' if p.startswith('domains/') else 'other'
    cat[k]+=1
print('--- md outside plans/docs/upstreams:',len(out),dict(cat))
for p in out:
    if '/skills/' in p or '/agents/' in p: continue
    print(' ',p)
