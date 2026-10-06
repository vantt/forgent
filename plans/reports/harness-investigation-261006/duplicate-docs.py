#!/usr/bin/env python3
"""Duplicate content (sha1) and same-basename clusters among tracked .md (+ any tracked file for the docs/ verification proofs)."""
import hashlib,collections,os
from lib_git import *
ROOT='/home/vantt/projects/forgentX/'
fs=[p for p in tracked_md()]
h=collections.defaultdict(list)
for p in fs:
    try: h[hashlib.sha1(open(ROOT+p,'rb').read()).hexdigest()].append(p)
    except Exception: pass
dups={k:v for k,v in h.items() if len(v)>1}
print('tracked md',len(fs),'| identical-content groups',len(dups),'| redundant files',sum(len(v)-1 for v in dups.values()))
# classify by dir pair
pairs=collections.Counter()
for v in dups.values():
    pairs[' <-> '.join(sorted({'/'.join(x.split('/')[:2]) if x.startswith(('docs/','archive/','plans/')) else x.split('/')[0]+'/…' for x in v}))]+=len(v)-1
for k,n in pairs.most_common(15): print(f'  {n:4} {k}')
# render targets (skills) are expected duplicates; show non-skill ones
nonskill=[v for v in dups.values() if not any('/skills/' in x for x in v[:1])]
print('non-skill dup groups',len(nonskill))
for v in nonskill[:12]: print('  ',v[:3])
# same basename in >=2 different docs/ roots (non-README/index)
bn=collections.defaultdict(list)
for p in fs:
    if p.startswith('docs/') and os.path.basename(p) not in('README.md','index.md','SKILL.md'):
        bn[os.path.basename(p)].append(p)
multi={k:v for k,v in bn.items() if len({x.split('/')[1] for x in v})>1}
print('basenames appearing under >=2 docs/ top roots:',len(multi))
for k,v in list(multi.items())[:10]: print('  ',k,[x for x in v][:3])
