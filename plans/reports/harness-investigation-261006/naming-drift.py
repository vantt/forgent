#!/usr/bin/env python3
"""Classify every .md file ever ADDED under plans/ (and archive/plans) against the hook-documented convention:
   plan dir : plans/YYMMDD-HHmm-slug/
   report   : plans/reports/{type}-YYMMDD-HHmm-{slug}-report.md   (hook 'Naming' block, ~/.claude/hooks/lib/context-builder.cjs:buildNamingSection)
Reports a histogram of name shapes, and conformity per month / per last-N window."""
import re,collections,sys
from lib_git import *
rows=added_md()
RPT_OK=re.compile(r'^[a-z0-9][a-z0-9-]*-\d{6}-\d{4}-[a-z0-9.-]+-report\.md$')
RPT_DATE_NOTIME=re.compile(r'-\d{6}-')
RPT_TRAIL=re.compile(r'-\d{6}\.md$')
PLAN_OK=re.compile(r'^\d{6}-\d{4}-[a-z0-9-]+$')
PLAN_DATE_ONLY=re.compile(r'^\d{6}-[a-z0-9-]+$')
def rshape(n):
    if RPT_OK.match(n): return 'A conforming {type}-YYMMDD-HHmm-slug-report'
    if re.match(r'^[a-z0-9-]+-\d{6}-\d{4}-.*\.md$',n): return 'B has type+date+time but no -report suffix'
    if RPT_TRAIL.search(n): return 'C trailing -YYMMDD.md (no time)'
    if RPT_DATE_NOTIME.search(n): return 'D date w/o time embedded'
    if re.match(r'^prompt-',n): return 'E prompt-no-date'
    return 'F no date at all'
res=collections.defaultdict(list)
LIVE_ONLY=('--live' in sys.argv)
for d,h,s,p in rows:
    if not p.startswith(('plans/','archive/plans/')): continue
    if LIVE_ONLY and p.startswith('archive/'): continue
    q=p[len('archive/'):] if p.startswith('archive/') else p
    parts=q.split('/')
    top=parts[1] if len(parts)>2 else '<file>'
    if parts[1]=='reports' and len(parts)==3: kind='report'; name=parts[2]
    elif parts[1]=='journals': kind='journal'; name=parts[2]
    elif len(parts)>=3 and parts[2]=='reports': kind='plan-report'; name=parts[-1]
    elif len(parts)>=3: kind='plan-file'; name=parts[-1]
    else: kind='root-file'; name=parts[-1]
    res[kind].append((d,p,name,parts))
for k,v in res.items(): print(k,len(v))
print()
# live (non-archive) vs archive
for kind in('report','plan-report'):
    c=collections.Counter(rshape(n) for _,_,n,_ in res[kind]); print('==',kind,sum(c.values()))
    for k,v in sorted(c.items()): print(f'  {v:4} {k}')
# plan dir names
dirs=collections.OrderedDict()
for kind in('plan-file','plan-report'):
    for d,p,n,parts in res[kind]:
        dirs.setdefault(parts[1],d)
c=collections.Counter()
bad=[]
for dn in dirs:
    if PLAN_OK.match(dn): c['conforming YYMMDD-HHmm-slug']+=1
    elif PLAN_DATE_ONLY.match(dn): c['date-only YYMMDD-slug']+=1; bad.append(dn)
    else: c['other']+=1; bad.append(dn)
print('== plan dirs',len(dirs),dict(c)); print('  nonconforming:',bad[:20])
# per month conformity for reports (live+archive)
print('== reports conformity by add-month (A / total)')
m=collections.defaultdict(lambda:[0,0])
for kind in('report','plan-report'):
    for d,p,n,_ in res[kind]:
        mm=d[:7]; m[mm][1]+=1; m[mm][0]+= bool(RPT_OK.match(n))
for k in sorted(m): print(f'  {k}: {m[k][0]}/{m[k][1]} = {100*m[k][0]/m[k][1]:.0f}%')
# last 200 added report-ish md files under plans (not archive moves)
live=[(d,p,n) for kind in('report','plan-report') for d,p,n,_ in res[kind] if p.startswith('plans/')]
live.sort(reverse=True)
for N in(50,100,200):
    w=live[:N]; ok=sum(bool(RPT_OK.match(n)) for _,_,n in w); print(f'last {N} live reports: conforming {ok}/{len(w)} = {100*ok/len(w):.0f}%  (oldest in window {w[-1][0][:10]})')
# by week last 60 days
import datetime
wk=collections.defaultdict(lambda:[0,0])
for d,p,n in live:
    w=datetime.date.fromisoformat(d[:10]).strftime('%G-W%V'); wk[w][1]+=1; wk[w][0]+=bool(RPT_OK.match(n))
print('== live plans/reports by ISO week')
for k in sorted(wk): print(f'  {k}: {wk[k][0]}/{wk[k][1]} = {100*wk[k][0]/wk[k][1]:.0f}%')
