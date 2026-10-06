#!/usr/bin/env python3
"""(1) topic clusters among plans/reports/*.md (slug tokens after stripping type/date/report). (2) orphan plan dirs. (3) journal locations. (4) docs roots vs governance placement map."""
import re,collections,os
from lib_git import *
R='/home/vantt/projects/forgentX/'
files=[f for f in os.listdir(R+'plans/reports') if f.endswith('.md')]
STOP=set('report review audit research design brainstorm investigation prompt from to the and of for in on vs with after before by a is at as phase p00 p01 round tsk md fix test'.split())
def toks(n):
    n=re.sub(r'\.md$','',n); n=re.sub(r'-?\d{6}(-\d{4})?','',n)
    return {t for t in re.split(r'[^a-z0-9]+',n) if len(t)>3 and t not in STOP and not t.isdigit()}
tc=collections.Counter(); tf=collections.defaultdict(list)
for f in files:
    for t in toks(f): tc[t]+=1; tf[t].append(f)
print('plans/reports/*.md files:',len(files))
print('tokens shared by >=5 reports (topic clusters):')
for t,n in tc.most_common(22): print(f'  {n:3} {t}')
# strongest named clusters
for t in ('observe','runtime','unit','dispatch','merge','distill','recovery','confinement','harness'):
    print(f'  cluster {t}: {len(tf[t])} files, span',min(re.findall(r"\d{6}",' '.join(tf[t])) or ['-']),'..',max(re.findall(r"\d{6}",' '.join(tf[t])) or ['-']))
# orphans
print('\n== plans/ top-level dirs and their contents')
for d in sorted(os.listdir(R+'plans')):
    p=R+'plans/'+d
    if os.path.isdir(p):
        has=os.path.exists(p+'/plan.md'); n=sum(len(fs) for _,_,fs in os.walk(p))
        flag='' if has or d in('reports','journals') else '  <-- NO plan.md'
        if flag or d in('reports','journals'): print(f'  {d:70} files={n}{flag}')
sub=[d for d in os.listdir(R+'plans/reports') if os.path.isdir(R+'plans/reports/'+d)]
print('plans/reports subdirs (a 3rd place for plan-like experiment dirs):',sub)
print('plans/ plan dirs with plan.md:',sum(os.path.exists(R+'plans/'+d+'/plan.md') for d in os.listdir(R+'plans') if os.path.isdir(R+'plans/'+d)))
# journals
print('\n== journals')
print('  plans/journals:',len(os.listdir(R+'plans/journals')),sorted(os.listdir(R+'plans/journals'))[:3],'(YYYY-MM-DD-slug)')
print('  docs/journals :',sorted(os.listdir(R+'docs/journals')))
