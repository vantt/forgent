#!/usr/bin/env python3
"""Where do NEW .md files go? Added-md histogram by (month, root) and (week, root), plus where plan.md files get created (3 competing locations)."""
import collections,datetime,re
from lib_git import *
rows=added_md()
def root(p):
    s=p.split('/')
    if p.startswith(('docs/history/',)): return 'docs/history'
    if p.startswith('docs/'): return '/'.join(s[:2]) if len(s)>2 else 'docs/<loose>'
    if p.startswith('plans/reports/'): return 'plans/reports'
    if p.startswith('plans/journals/'): return 'plans/journals'
    if p.startswith('plans/'): return 'plans/<plan>'
    if p.startswith('archive/'): return 'archive'
    if '/skills/' in p or p.startswith(('.claude/','.agents/','plugins/','core/','domains/')): return 'skills/instructions(render+src)'
    if p.startswith('upstreams/'): return 'upstreams'
    return 'other:'+(s[0] if len(s)>1 else '<repo-root>')
m=collections.defaultdict(collections.Counter)
for d,h,s,p in rows: m[d[:7]][root(p)]+=1
roots=sorted({r for c in m.values() for r in c})
print('month '+' '.join(f'{r[:22]:>22}' for r in roots))
for k in sorted(m): print(k,' '.join(f'{m[k][r]:>22}' for r in roots))
print()
print('plan.md creation locations by month (any dir named plan.md, live paths):')
pm=collections.defaultdict(collections.Counter)
for d,h,s,p in rows:
    if p.endswith('/plan.md') and not p.startswith('archive/'):
        loc='plans/<dir>/plan.md' if p.startswith('plans/') else 'docs/history/<f>/plan.md' if p.startswith('docs/history/') else 'other:'+p
        pm[d[:7]][loc]+=1
for k in sorted(pm): print(' ',k,dict(pm[k]))
print()
print('CONTEXT.md / DISCUSSION.md by month under docs/history:')
for nm in ('CONTEXT.md','DISCUSSION.md'):
    c=collections.Counter(d[:7] for d,h,s,p in rows if p.startswith('docs/history/') and p.endswith('/'+nm)); print(' ',nm,dict(sorted(c.items())))
