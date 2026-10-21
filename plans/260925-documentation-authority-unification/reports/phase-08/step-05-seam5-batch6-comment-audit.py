import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,re,collections
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3];counts=collections.Counter();pending=[];cache={};trees={};compound=[]
for fn in sorted((P/'step-05-records').glob('*.jsonl')):
 for l in fn.read_text().splitlines():
  r=json.loads(l);pin=r.get('authorInputCommit');f=r.get('file')
  if not pin or not f:continue
  if '; ' in f:compound.append({'recordFile':fn.name,'file':f});continue
  if (pin,f) not in cache:cache[pin,f]=subprocess.check_output(['git','show',pin+':'+f],cwd=ROOT,text=True).splitlines()
  ls=cache[pin,f]
  if pin not in trees:trees[pin]=subprocess.check_output(['git','ls-tree','-r','--name-only',pin,'--','docs/platform','docs/knowledge','docs/reference','docs/tutorials'],cwd=ROOT,text=True).splitlines()
  for e in r.get('references',[])+r.get('authorAddedReferences',[])+r.get('edges',[]):
   spans=e.get('sourceSpans',[])
   if not spans:continue
   n=spans[0].get('line',0)
   if not n or n>len(ls) or not ls[n-1].lstrip().startswith(('//','/*','*')):continue
   counts['commentsExamined']+=1;x=e.get('matchedExpression','')
   x=re.sub(r'(?:\\n|\n)\s*(?://|\*)?\s*','',x).split('#')[0].split(':')[0].rstrip(').')
   if not x.startswith('docs/') or not x.endswith('.md'):continue
   if subprocess.run(['git','cat-file','-e',pin+':'+x],cwd=ROOT,stderr=subprocess.DEVNULL).returncode==0:continue
   hits=[t for t in trees[pin] if t.endswith('/'+pathlib.PurePosixPath(x).name) and '/proposals/' not in t]
   if len(hits)==1:
    target=subprocess.check_output(['git','show',pin+':'+hits[0]],cwd=ROOT,text=True)
    if 'Canonical: No' in target:continue
    counts['eligibleUniqueDeadPointers']+=1
    if e['disposition']!='patch':pending.append({'file':f,'recordFile':fn.name,'id':e.get('referenceId',e.get('edgeId')),'oldPath':x,'target':hits[0]})
out={'counts':dict(counts),'pending':pending,'compoundRecords':compound,'coverage':'Every physical Step 5 source record with source spans; compound boundary rows have no separate source blob.'};(P/'step-05-seam5-batch6-all-step5-comment-audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False))
