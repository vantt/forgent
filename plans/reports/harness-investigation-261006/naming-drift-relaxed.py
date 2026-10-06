#!/usr/bin/env python3
"""Relaxed conformity: accept BOTH hook variants ({type}-YYMMDD-HHmm-slug.md and ...-report.md). Time series per ISO week + shape table for the last 60 days.
Scope: files ADDED under live plans/ (reports/, <plan>/reports/, journals/ excluded from series: only reports)."""
import re,collections,datetime
from lib_git import *
ANY=re.compile(r'^[a-z0-9][a-z0-9-]*-\d{6}-\d{4}-[a-z0-9.-]+\.md$')
rows=[(d,p) for d,h,s,p in added_md() if p.startswith('plans/') and ('/reports/' in p)]
rows.sort()
wk=collections.defaultdict(lambda:[0,0])
shape=collections.Counter()
for d,p in rows:
    n=p.split('/')[-1]
    w=datetime.date.fromisoformat(d[:10]).strftime('%G-W%V'); wk[w][1]+=1; wk[w][0]+=bool(ANY.match(n))
    if d[:10]>='2026-09-26':
        if ANY.match(n): s='type-YYMMDD-HHmm-slug[.|-report].md (documented)'
        elif re.search(r'-\d{6}\.md$',n): s='slug-YYMMDD.md (date suffix, no time)'
        elif re.search(r'-\d{6}-',n): s='other date-in-middle'
        elif re.match(r'^[a-z0-9-]+\.md$',n): s='no date'
        else: s='non-md or other ('+n.rsplit('.',1)[-1]+')'
        shape[s]+=1
print('relaxed (either hook variant) conformity by ISO week, files under plans/**/reports/')
for k in sorted(wk): print(f'  {k}: {wk[k][0]}/{wk[k][1]} = {100*wk[k][0]/wk[k][1]:.0f}%')
print('shapes since 2026-09-26:'); 
for k,v in shape.most_common(): print(f'  {v:4} {k}')
last=rows[-200:]; ok=sum(bool(ANY.match(p.split('/')[-1])) for d,p in last); print(f'last 200 report adds: relaxed-conforming {ok}/200')
