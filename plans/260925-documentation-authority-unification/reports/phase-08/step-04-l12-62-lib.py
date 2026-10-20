"""L12-62 record-only mechanical witnesses; reuse resolver and repository slugs."""
import sys
sys.dont_write_bytecode=True
import re,subprocess,functools,json,pathlib,hashlib,collections
ROOT=pathlib.Path(__file__).resolve().parents[4]
@functools.lru_cache(None)
def tree(pin):return tuple(subprocess.check_output(['git','ls-tree','-r','--name-only',pin],cwd=ROOT).decode().splitlines())
@functools.lru_cache(None)
def existence(pin,path):
 p=path.split('#')[0].rstrip('/');p=re.sub(r':\d+(?:[-–]\d+)?$','',p)
 if not p.startswith('docs/'):return compact_existence({'path':p,'state':'external-or-example','treeMatches':[],'historyCommits':[]})
 if re.search(r'[<>*{}$]|\.\.\.',p):return compact_existence({'path':p,'state':'pattern','treeMatches':[],'historyCommits':[]})
 present=[x for x in tree(pin) if x==p or x.startswith(p+'/')]
 # Check all refs too: "never existed" is stronger than absent in pin ancestry.
 history=subprocess.check_output(['git','log','--all','--format=%H','--',p],cwd=ROOT).decode().splitlines()
 return compact_existence({'path':p,'state':'tree' if present else 'history' if history else 'never-existed','treeMatches':present,'historyCommits':list(dict.fromkeys(history))})

def wrapped_paths(body):
 """Scan complete tokens; a slash is a valid one-character continuation prefix.
 Join up to arbitrary continuation depth, retaining exact physical coordinates.
 Only continue at / or - (or an unterminated inline path) to avoid prose joins.
 """
 ls=body.splitlines();out=[]
 for n,l in enumerate(ls,1):
  for mt in re.finditer(r'(?<![\w/])docs/[^\s`\x22\x27()\[\]{},;]*',l):
   token=mt[0].rstrip('.,:');ss=[{'line':n,'columnStart':mt.start()+1,'columnEndExclusive':mt.start()+len(token)+1,'text':token}]
   i=n;can_continue=not l[mt.end():].strip()
   while i<len(ls) and can_continue and (token.endswith(('/','-')) or (not re.search(r'\.(?:md|json|yaml|yml|txt)(?:#.*)?$',token) and mt.end()==len(l))):
    nxt=re.match(r'^\s*(?://[/!]?|/\*+|\*|#|>)?\s*([A-Za-z0-9_<][A-Za-z0-9_./<>*#-]*)',ls[i])
    if not nxt:break
    if nxt[1].startswith(('docs/','plans/','archive/','src/','apps/','packages/')):break
    t=nxt[1].rstrip('.,:')
    if '/' not in t and '.' not in t and not t.endswith('-'):break
    ss.append({'line':i+1,'columnStart':nxt.start(1)+1,'columnEndExclusive':nxt.start(1)+len(t)+1,'text':t});token+=t;can_continue=not ls[i][nxt.end(1):].strip();i+=1
   if len(ss)>1:out.append({'path':token.split('#')[0],'spans':ss})
 return out

@functools.lru_cache(None)
def content_query(pin,term):
 run=subprocess.run(['git','grep','-n','-I','-F','-e',term,pin,'--','docs/platform','docs/knowledge'],cwd=ROOT,capture_output=True)
 assert run.returncode in (0,1),run.stderr.decode()
 return tuple(tuple(x[len(pin)+1:].split(':',2)) for x in run.stdout.decode().splitlines())

def search(pin,body,ss,terms,resolver):
 passage=resolver.passage(body,ss);queries=[]
 for term in sorted(set(terms)):
  assert term and not term.startswith('docs/'),'content query must not be only a path'
  hits=[]
  for f,n,t in content_query(pin,term):
   n=int(n);tb=resolver.text(pin,f)
   hits.append({'file':f,'line':n,'text':t,'carriage':resolver.carriage(tb,n,f)})
  queries.append(compact_query({'term':term,'hits':hits,'liveHits':sum(not h['carriage'] for h in hits)}))
 assert queries
 return {'pin':pin,'roots':['docs/platform/**','docs/knowledge/**'],'sourcePassage':passage,'terms':sorted(set(terms)),'queries':queries}

def passage_equal(resolver,pin,r,e,source):
 # Thin wrappers carry selected source description paragraphs. Compare the exact
 # bound path-bearing line(s), stripping comment indentation, never only paths.
 a=resolver.passage(resolver.text(pin,e['consumerFile']),e['sourceSpans'])
 b=resolver.passage(resolver.text(pin,r['file']),source['sourceSpans'])
 norm=lambda s:'\n'.join(x.strip() for x in s.splitlines())
 return norm(a)==norm(b)


def digest(value):return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def compact_query(q):
 if 'hits' not in q:return q
 hits=q['hits'];files=collections.defaultdict(lambda:{'live':0,'carriage':0})
 for h in hits:files[h['file']]['carriage' if h['carriage'] else 'live']+=1
 return {'term':q['term'],'hitCount':len(hits),'liveHits':q['liveHits'],'hitsSha256':digest(hits),'files':dict(sorted(files.items())),'sample':sorted(hits,key=lambda h:(h['carriage'],h['file'],h['line']))[:6]}
def compact_existence(w):
 if 'treeMatches' not in w:return w
 return {k:value for k,value in w.items() if k not in ('treeMatches','historyCommits')}|{'treeMatchCount':len(w['treeMatches']),'treeMatchesSha256':digest(w['treeMatches']),'treeSample':w['treeMatches'][:2],'historyCommitCount':len(w['historyCommits']),'historyCommitsSha256':digest(w['historyCommits']),'historySample':w['historyCommits'][:2]}
