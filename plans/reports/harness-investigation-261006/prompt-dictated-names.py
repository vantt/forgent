#!/usr/bin/env python3
"""For nonconforming report names added since 2026-09-26: is the exact basename already written in a prompt-*.md / plan.md / phase-*.md (i.e. the name was dictated by a human/lead prompt, not invented by the agent)?"""
import re,os,glob,subprocess
from lib_git import *
R='/home/vantt/projects/forgentX/'
ANY=re.compile(r'^[a-z0-9][a-z0-9-]*-\d{6}-\d{4}-[a-z0-9.-]+\.md$')
srcs=glob.glob(R+'plans/reports/prompt-*.md')+glob.glob(R+'plans/*/plan.md')+glob.glob(R+'plans/*/phase-*.md')+glob.glob(R+'plans/reports/*handoff*.md')
text={s:open(s,errors='ignore').read() for s in srcs}
bad=[p for d,h,s,p in added_md() if p.startswith('plans/reports/') and p.count('/')==2 and d[:10]>='2026-09-26' and not ANY.match(p.split('/')[-1])]
hit=0; miss=[]
for p in bad:
    n=os.path.basename(p)
    if any(n in t and not s.endswith('/'+n) for s,t in text.items()): hit+=1
    else: miss.append(n)
print(f'nonconforming plans/reports files since 09-26: {len(bad)}; basename pre-written in a prompt/plan/phase/handoff file: {hit} ({100*hit/len(bad):.0f}%)')
print('not pre-written (agent chose name):',len(miss)); print('\n'.join(miss[:12]))
